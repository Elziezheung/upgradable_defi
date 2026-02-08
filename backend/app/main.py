import asyncio
import json
import logging
from decimal import Decimal
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException, Query
from web3 import Web3

logger = logging.getLogger("uvicorn.error")

from .chain import ChainReader
from .config import DB_PATH, RPC_URL
from .db import Database
from .indexer import Indexer

tags_metadata = [
    {"name": "Health", "description": "Service health and chain status"},
    {"name": "Markets", "description": "Lending market data, summaries, and time series"},
    {"name": "Accounts", "description": "User account positions, overviews, and wallet balances"},
    {"name": "Events", "description": "Indexed blockchain events and aggregations"},
    {"name": "Liquidity Mining", "description": "Liquidity mining pools and user positions"},
]

app = FastAPI(
    title="Upgradable DeFi API",
    description="Backend API for the Upgradable DeFi lending protocol. "
    "Provides real-time market data, account positions, indexed blockchain events, "
    "and liquidity mining information.",
    version="1.0.0",
    openapi_tags=tags_metadata,
)
db = Database(DB_PATH)

UNDERLYING_AMOUNT_KEYS = {
    "mintAmount",
    "redeemAmount",
    "borrowAmount",
    "repayAmount",
    "actualRepayAmount",
    "accountBorrows",
    "totalBorrows",
}
DTOKEN_AMOUNT_KEYS = {"mintTokens", "redeemTokens", "seizeTokens", "amount", "value"}


def _to_int(value: Any) -> Optional[int]:
    if value is None:
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        if value.startswith("0x"):
            try:
                return int(value, 16)
            except ValueError:
                return None
        try:
            return int(value)
        except ValueError:
            return None
    return None


def _scale_token_amount(raw_amount: Optional[int], decimals: Optional[int]) -> Optional[float]:
    if raw_amount is None or decimals is None:
        return None
    return float(Decimal(raw_amount) / (Decimal(10) ** decimals))


def _normalize_event_args(
    args: Dict[str, Any], underlying_decimals: Optional[int], dtoken_decimals: Optional[int]
) -> Dict[str, Any]:
    normalized = dict(args)
    for key, value in args.items():
        raw_amount = _to_int(value)
        if raw_amount is None:
            continue
        if key in UNDERLYING_AMOUNT_KEYS:
            scaled = _scale_token_amount(raw_amount, underlying_decimals)
            if scaled is not None:
                normalized[key] = scaled
        elif key in DTOKEN_AMOUNT_KEYS:
            scaled = _scale_token_amount(raw_amount, dtoken_decimals)
            if scaled is not None:
                normalized[key] = scaled
    return normalized


@app.on_event("startup")
async def startup() -> None:
    db.init_schema()
    app.state.indexer = Indexer(db)
    app.state.indexer_task = asyncio.create_task(app.state.indexer.run())
    app.state.chain = ChainReader()
    logger.info("Swagger UI available at http://127.0.0.1:8000/docs")
    logger.info("ReDoc available at http://127.0.0.1:8000/redoc")


@app.on_event("shutdown")
async def shutdown() -> None:
    indexer = getattr(app.state, "indexer", None)
    if indexer:
        await indexer.stop()
    task = getattr(app.state, "indexer_task", None)
    if task:
        task.cancel()


@app.get("/health", tags=["Health"], summary="Check service health")
def health():
    """Return chain ID, latest block number, and the last block processed by the indexer."""
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    latest_block = w3.eth.block_number
    chain_id = w3.eth.chain_id
    indexed_to = db.get_state("lastProcessedBlock")
    return {
        "chainId": chain_id,
        "latestBlock": latest_block,
        "indexedToBlock": int(indexed_to) if indexed_to is not None else None,
    }


@app.get("/events", tags=["Events"], summary="Query indexed events")
def get_events(
    contract: Optional[str] = Query(None, description="Filter by contract address"),
    event: Optional[str] = Query(None, description="Filter by event name (e.g. Mint, Borrow)"),
    fromBlock: Optional[int] = Query(None, description="Start block number"),
    toBlock: Optional[int] = Query(None, description="End block number"),
    limit: int = Query(100, ge=1, le=1000, description="Max results to return"),
):
    """Query indexed blockchain events with optional filters for contract, event type, and block range."""
    chain = getattr(app.state, "chain", None)
    results = db.query_events(
        contract=contract,
        event=event,
        from_block=fromBlock,
        to_block=toBlock,
        limit=limit,
    )
    if chain:
        for item in results:
            units = chain.get_market_units(item.get("contract"))
            args_raw = item.get("args") or {}
            item["argsRaw"] = args_raw
            item["args"] = _normalize_event_args(
                args_raw,
                units.get("underlyingDecimals"),
                units.get("dTokenDecimals"),
            )
    return {"items": results}


@app.get("/markets", tags=["Markets"], summary="List all markets")
def get_markets():
    """Return detailed information for every lending market including supply/borrow rates, prices, and collateral factors."""
    chain = getattr(app.state, "chain", None)
    if not chain:
        raise HTTPException(status_code=500, detail="Chain reader not initialized")
    return {"items": chain.get_markets()}


@app.get("/accounts/{address}", tags=["Accounts"], summary="Get account positions")
def get_account(address: str, market: Optional[str] = Query(None, description="Filter by market contract address")):
    """Return a user's positions across all markets, or a single market if specified."""
    chain = getattr(app.state, "chain", None)
    if not chain:
        raise HTTPException(status_code=500, detail="Chain reader not initialized")
    try:
        result = chain.get_account_market(address, market) if market else chain.get_account(address)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid address")
    return result


@app.get("/account/overview", tags=["Accounts"], summary="Get account overview")
def get_account_overview(account: str = Query(..., description="Account address")):
    """Return aggregated metrics for an account: net APR, borrow capacity, collateral value, and health factor."""
    chain = getattr(app.state, "chain", None)
    if not chain:
        raise HTTPException(status_code=500, detail="Chain reader not initialized")
    try:
        result = chain.get_account_overview(account)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid address")
    return result


@app.get("/account/wallet", tags=["Accounts"], summary="Get wallet balances")
def get_account_wallet(
    account: str = Query(..., description="Account address"),
    assets: Optional[str] = Query(None, description="Comma-separated list of token symbols to filter"),
):
    """Return token balances for a wallet. Optionally filter by a comma-separated list of asset symbols."""
    chain = getattr(app.state, "chain", None)
    if not chain:
        raise HTTPException(status_code=500, detail="Chain reader not initialized")
    asset_list = [a.strip() for a in assets.split(",")] if assets else None
    try:
        result = chain.get_wallet_balances(account, asset_list)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid address")
    return result


@app.get("/markets/summary", tags=["Markets"], summary="Get market summary")
def get_markets_summary():
    """Return aggregate protocol metrics: total supply, total borrow, total earning, and total collateral in USD."""
    chain = getattr(app.state, "chain", None)
    if not chain:
        raise HTTPException(status_code=500, detail="Chain reader not initialized")
    summary = chain.get_markets_summary()
    summary["asOf"] = int(datetime.now(tz=timezone.utc).timestamp())
    return summary



@app.get("/stats", tags=["Events"], summary="Get event statistics")
def get_stats(
    contract: Optional[str] = Query(None, description="Filter by contract address"),
    event: Optional[str] = Query(None, description="Filter by event name"),
    fromBlock: Optional[int] = Query(None, description="Start block number"),
    toBlock: Optional[int] = Query(None, description="End block number"),
):
    """Return event counts grouped by contract and event type."""
    results = db.event_stats(
        contract=contract,
        event=event,
        from_block=fromBlock,
        to_block=toBlock,
    )
    return {"items": results}


@app.get("/liquidity-mining", tags=["Liquidity Mining"], summary="List liquidity mining pools")
def get_liquidity_mining():
    """Return information for all liquidity mining pools including reward rates and staked totals."""
    chain = getattr(app.state, "chain", None)
    if not chain:
        raise HTTPException(status_code=500, detail="Chain reader not initialized")
    return {"items": chain.get_liquidity_mining()}


@app.get("/liquidity-mining/{address}", tags=["Liquidity Mining"], summary="Get user liquidity mining positions")
def get_liquidity_mining_account(address: str):
    """Return a user's staked positions and pending rewards across all liquidity mining pools."""
    chain = getattr(app.state, "chain", None)
    if not chain:
        raise HTTPException(status_code=500, detail="Chain reader not initialized")
    try:
        result = chain.get_liquidity_mining_account(address)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid address")
    return result


@app.get("/events/amounts", tags=["Events"], summary="Get event amount aggregations")
def get_event_amounts(
    contract: Optional[str] = Query(None, description="Filter by contract address"),
    event: Optional[str] = Query(None, description="Filter by event name"),
    account: Optional[str] = Query(None, description="Filter by account address involved in the event"),
    fromBlock: Optional[int] = Query(None, description="Start block number"),
    toBlock: Optional[int] = Query(None, description="End block number"),
    limit: int = Query(5000, ge=1, le=50000, description="Max events to scan"),
):
    """Aggregate event amounts (sum and count) grouped by event type, optionally filtered by account."""
    chain = getattr(app.state, "chain", None)
    rows = db.query_event_rows(
        contract=contract,
        event=event,
        from_block=fromBlock,
        to_block=toBlock,
        limit=limit,
    )

    account_lower = account.lower() if account else None
    summary = {}

    amount_keys = {
        "Mint": ["mintAmount", "mintTokens"],
        "Redeem": ["redeemAmount", "redeemTokens"],
        "Borrow": ["borrowAmount"],
        "RepayBorrow": ["repayAmount", "actualRepayAmount"],
        "LiquidateBorrow": ["repayAmount", "seizeTokens"],
        "Transfer": ["amount", "value"],
    }
    account_keys = {
        "Mint": ["minter"],
        "Redeem": ["redeemer"],
        "Borrow": ["borrower"],
        "RepayBorrow": ["payer", "borrower"],
        "LiquidateBorrow": ["liquidator", "borrower"],
        "Transfer": ["from", "to"],
    }

    def _match_account(args_dict, evt: str):
        if not account_lower:
            return True
        keys = account_keys.get(evt, [])
        for key in keys:
            if key in args_dict:
                val = args_dict[key]
                if isinstance(val, str) and val.lower() == account_lower:
                    return True
        return False

    for row in rows:
        evt = row["event_name"]
        args = json.loads(row["args_json"]) if row["args_json"] else {}
        if account_lower and not _match_account(args, evt):
            continue

        units = chain.get_market_units(row["contract"]) if chain else {}
        underlying_decimals = units.get("underlyingDecimals")
        dtoken_decimals = units.get("dTokenDecimals")

        keys = amount_keys.get(evt, [])
        amount_raw = None
        amount_decimals = None
        for key in keys:
            if key in args:
                amount_raw = _to_int(args.get(key))
                if amount_raw is not None:
                    amount_decimals = (
                        underlying_decimals if key in UNDERLYING_AMOUNT_KEYS else dtoken_decimals
                    )
                    break

        if evt not in summary:
            summary[evt] = {"count": 0, "amountSum": 0.0, "amountSumRaw": 0}
        summary[evt]["count"] += 1
        if amount_raw is not None:
            summary[evt]["amountSumRaw"] += amount_raw
            amount_scaled = _scale_token_amount(amount_raw, amount_decimals)
            if amount_scaled is not None:
                summary[evt]["amountSum"] += amount_scaled
            else:
                summary[evt]["amountSum"] += float(amount_raw)

    return {"items": summary, "limit": limit}
