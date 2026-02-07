import json
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
CONFIG_PATH = PROJECT_ROOT / "config" / "addresses.local.json"
ABI_ROOT = PROJECT_ROOT.parent / "contracts" / "out"

RPC_URL = os.getenv("RPC_URL", "http://127.0.0.1:8545")
DB_PATH = os.getenv("DB_PATH", str(PROJECT_ROOT / "indexer.db"))
POLL_INTERVAL = float(os.getenv("POLL_INTERVAL", "5"))
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "1000"))

MARKET_ABI_NAME = os.getenv("MARKET_ABI_NAME", "LendingToken")
COMPTROLLER_ABI_NAME = os.getenv("COMPTROLLER_ABI_NAME", "Comptroller")
LIQUIDITY_MINING_ABI_NAME = os.getenv("LIQUIDITY_MINING_ABI_NAME", "LiquidityMining")


def load_addresses() -> dict:
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)
