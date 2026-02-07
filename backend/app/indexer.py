import asyncio
import json
from typing import Any, Dict, List, Optional

from hexbytes import HexBytes
from web3 import Web3

from .abi import load_abi
from .config import (
    BATCH_SIZE,
    COMPTROLLER_ABI_NAME,
    LIQUIDITY_MINING_ABI_NAME,
    MARKET_ABI_NAME,
    POLL_INTERVAL,
    RPC_URL,
    load_addresses,
)
from .db import Database

EVENT_NAMES = [
    "Mint",
    "Redeem",
    "Borrow",
    "RepayBorrow",
    "LiquidateBorrow",
    "Transfer",
]


def _to_serializable(value: Any):
    if isinstance(value, HexBytes):
        return value.hex()
    if isinstance(value, (bytes, bytearray)):
        return value.hex()
    if hasattr(value, "to_dict"):
        return value.to_dict()
    return value


class Indexer:
    def __init__(self, db: Database):
        self.db = db
        self.w3 = Web3(Web3.HTTPProvider(RPC_URL))
        self._stop_event = asyncio.Event()
        self._block_timestamps: Dict[int, int] = {}

        addresses = load_addresses()
        self.comptroller_address = addresses.get("comptroller")
        self.market_addresses = addresses.get("markets", [])
        self.liquidity_mining_addresses = addresses.get("liquidityMining", [])

        self.market_abi = load_abi(MARKET_ABI_NAME)
        self.comptroller_abi = load_abi(COMPTROLLER_ABI_NAME)
        self.liquidity_mining_abi = load_abi(LIQUIDITY_MINING_ABI_NAME)

        self.market_contracts = self._build_contracts(self.market_addresses, self.market_abi)

    def _build_contracts(self, addresses: List[str], abi) -> List[Any]:
        contracts = []
        for addr in addresses:
            if not addr:
                continue
            checksum = self.w3.to_checksum_address(addr)
            contracts.append(self.w3.eth.contract(address=checksum, abi=abi))
        return contracts

    def _get_event(self, contract, event_name: str):
        if hasattr(contract.events, event_name):
            return getattr(contract.events, event_name)
        return None

    def _get_block_timestamp(self, block_number: int) -> int:
        if block_number not in self._block_timestamps:
            block = self.w3.eth.get_block(block_number)
            self._block_timestamps[block_number] = int(block["timestamp"])
        return self._block_timestamps[block_number]

    def _fetch_logs_for_contract(
        self, contract, event_name: str, from_block: int, to_block: int
    ) -> List[Any]:
        event = self._get_event(contract, event_name)
        if not event:
            return []
        try:
            return event.get_logs(fromBlock=from_block, toBlock=to_block)
        except Exception:
            return []

    def _poll_once(self) -> None:
        latest_block = self.w3.eth.block_number
        last_processed_str = self.db.get_state("lastProcessedBlock")
        if last_processed_str is None:
            start_block = max(latest_block - 2000, 0)
            last_processed = start_block - 1
        else:
            last_processed = int(last_processed_str)

        if last_processed >= latest_block:
            return

        from_block = last_processed + 1
        while from_block <= latest_block:
            to_block = min(from_block + BATCH_SIZE - 1, latest_block)
            for contract in self.market_contracts:
                for event_name in EVENT_NAMES:
                    logs = self._fetch_logs_for_contract(contract, event_name, from_block, to_block)
                    for log in logs:
                        args_json = json.dumps(dict(log["args"]), default=_to_serializable)
                        timestamp = self._get_block_timestamp(log["blockNumber"])
                        self.db.insert_event(
                            block_number=log["blockNumber"],
                            tx_hash=log["transactionHash"].hex(),
                            log_index=log["logIndex"],
                            contract=contract.address,
                            event_name=event_name,
                            args_json=args_json,
                            timestamp=timestamp,
                        )

            self.db.set_state("lastProcessedBlock", str(to_block))
            from_block = to_block + 1

    async def run(self) -> None:
        while not self._stop_event.is_set():
            await asyncio.to_thread(self._poll_once)
            await asyncio.sleep(POLL_INTERVAL)

    async def stop(self) -> None:
        self._stop_event.set()
