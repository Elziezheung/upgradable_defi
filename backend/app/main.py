import asyncio
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
def get_account(address: str):
    chain = getattr(app.state, "chain", None)
    if not chain:
        raise HTTPException(status_code=500, detail="Chain reader not initialized")
    try:
        result = chain.get_account(address)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid address")
    return result


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
