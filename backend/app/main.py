import asyncio
import json
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from web3 import Web3

from .chain import ChainReader
from .config import DB_PATH, RPC_URL
from .db import Database
from .indexer import Indexer

app = FastAPI()
db = Database(DB_PATH)


@app.on_event("startup")
async def startup() -> None:
    db.init_schema()
    app.state.indexer = Indexer(db)
    app.state.indexer_task = asyncio.create_task(app.state.indexer.run())
    app.state.chain = ChainReader()


@app.on_event("shutdown")
async def shutdown() -> None:
    indexer = getattr(app.state, "indexer", None)
    if indexer:
        await indexer.stop()
    task = getattr(app.state, "indexer_task", None)
    if task:
        task.cancel()


@app.get("/health")
def health():
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    latest_block = w3.eth.block_number
    chain_id = w3.eth.chain_id
    indexed_to = db.get_state("lastProcessedBlock")
    return {
        "chainId": chain_id,
        "latestBlock": latest_block,
        "indexedToBlock": int(indexed_to) if indexed_to is not None else None,
    }


@app.get("/events")
def get_events(
    contract: Optional[str] = Query(None),
    event: Optional[str] = Query(None),
    fromBlock: Optional[int] = Query(None),
    toBlock: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
):
    results = db.query_events(
        contract=contract,
        event=event,
        from_block=fromBlock,
        to_block=toBlock,
        limit=limit,
    )
    return {"items": results}


@app.get("/markets")
def get_markets():
    chain = getattr(app.state, "chain", None)
    if not chain:
        raise HTTPException(status_code=500, detail="Chain reader not initialized")
    return {"items": chain.get_markets()}


@app.get("/accounts/{address}")
def get_account(address: str, market: Optional[str] = Query(None)):
    chain = getattr(app.state, "chain", None)
    if not chain:
        raise HTTPException(status_code=500, detail="Chain reader not initialized")
    try:
        result = chain.get_account_market(address, market) if market else chain.get_account(address)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid address")
    return result


@app.get("/account/overview")
def get_account_overview(account: str = Query(...)):
    chain = getattr(app.state, "chain", None)
    if not chain:
        raise HTTPException(status_code=500, detail="Chain reader not initialized")
    try:
        result = chain.get_account_overview(account)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid address")
    return result


@app.get("/account/wallet")
def get_account_wallet(account: str = Query(...), assets: Optional[str] = Query(None)):
    chain = getattr(app.state, "chain", None)
    if not chain:
        raise HTTPException(status_code=500, detail="Chain reader not initialized")
    asset_list = [a.strip() for a in assets.split(",")] if assets else None
    try:
        result = chain.get_wallet_balances(account, asset_list)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid address")
    return result


@app.get("/markets/summary")
def get_markets_summary():
    chain = getattr(app.state, "chain", None)
    if not chain:
        raise HTTPException(status_code=500, detail="Chain reader not initialized")
    summary = chain.get_markets_summary()
    summary["asOf"] = int(datetime.now(tz=timezone.utc).timestamp())
    return summary


@app.get("/markets/timeseries")
def get_markets_timeseries(
    from_ts: Optional[int] = Query(None, alias="from"),
    to_ts: Optional[int] = Query(None, alias="to"),
    interval: str = Query("1d"),
):
    chain = getattr(app.state, "chain", None)
    if not chain:
        raise HTTPException(status_code=500, detail="Chain reader not initialized")
    summary = chain.get_markets_summary()

    if to_ts is None:
        to_ts = int(datetime.now(tz=timezone.utc).timestamp())
    if from_ts is None:
        from_ts = int((datetime.now(tz=timezone.utc) - timedelta(days=30)).timestamp())

    step = 86_400 if interval == "1d" else 3_600
    points = []
    for ts in range(from_ts, to_ts + 1, step):
        points.append(
            {
                "ts": ts,
                "totalSupplyUsd": summary["totalSupplyUsd"],
                "totalEarningUsd": summary["totalEarningUsd"],
                "totalBorrowUsd": summary["totalBorrowUsd"],
                "totalCollateralUsd": summary["totalCollateralUsd"],
            }
        )

    return {"interval": interval, "points": points}


@app.get("/stats")
def get_stats(
    contract: Optional[str] = Query(None),
    event: Optional[str] = Query(None),
    fromBlock: Optional[int] = Query(None),
    toBlock: Optional[int] = Query(None),
):
    results = db.event_stats(
        contract=contract,
        event=event,
        from_block=fromBlock,
        to_block=toBlock,
    )
    return {"items": results}


@app.get("/liquidity-mining")
def get_liquidity_mining():
    chain = getattr(app.state, "chain", None)
    if not chain:
        raise HTTPException(status_code=500, detail="Chain reader not initialized")
    return {"items": chain.get_liquidity_mining()}


@app.get("/liquidity-mining/{address}")
def get_liquidity_mining_account(address: str):
    chain = getattr(app.state, "chain", None)
    if not chain:
        raise HTTPException(status_code=500, detail="Chain reader not initialized")
    try:
        result = chain.get_liquidity_mining_account(address)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid address")
    return result


@app.get("/events/amounts")
def get_event_amounts(
    contract: Optional[str] = Query(None),
    event: Optional[str] = Query(None),
    account: Optional[str] = Query(None),
    fromBlock: Optional[int] = Query(None),
    toBlock: Optional[int] = Query(None),
    limit: int = Query(5000, ge=1, le=50000),
):
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

    def _to_int(value):
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

        keys = amount_keys.get(evt, [])
        amount = None
        for key in keys:
            if key in args:
                amount = _to_int(args.get(key))
                if amount is not None:
                    break

        if evt not in summary:
            summary[evt] = {"count": 0, "amountSum": 0}
        summary[evt]["count"] += 1
        if amount is not None:
            summary[evt]["amountSum"] += amount

    return {"items": summary, "limit": limit}
