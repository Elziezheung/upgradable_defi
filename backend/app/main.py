import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

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
    {"name": "Liquidity Mining", "description": "Liquidity mining pools and user positions"},
]

app = FastAPI(
    title="Upgradable DeFi API",
    description="Backend API for the Upgradable DeFi lending protocol. "
    "Provides real-time market data, account positions, "
    "and liquidity mining information.",
    version="1.0.0",
    openapi_tags=tags_metadata,
)
db = Database(DB_PATH)


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
