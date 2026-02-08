import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
CONFIG_PATH = PROJECT_ROOT / "config" / "addresses.local.json"
ABI_ROOT = PROJECT_ROOT.parent / "contracts" / "out"
BROADCAST_ROOT = PROJECT_ROOT.parent / "contracts" / "broadcast"

RPC_URL = os.getenv("RPC_URL", "http://127.0.0.1:8545")
DB_PATH = os.getenv("DB_PATH", str(PROJECT_ROOT / "indexer.db"))
POLL_INTERVAL = float(os.getenv("POLL_INTERVAL", "5"))
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "1000"))

MARKET_ABI_NAME = os.getenv("MARKET_ABI_NAME", "LendingToken")
COMPTROLLER_ABI_NAME = os.getenv("COMPTROLLER_ABI_NAME", "Comptroller")
LIQUIDITY_MINING_ABI_NAME = os.getenv("LIQUIDITY_MINING_ABI_NAME", "LiquidityMining")


def _find_run_json_candidates() -> List[Path]:
    explicit = os.getenv("RUN_JSON")
    if explicit:
        path = Path(explicit).expanduser()
        return [path] if path.exists() else []

    candidates: List[Path] = []
    patterns = [
        "FullSetupLocal.s.sol/*/run-latest.json",
        "DeployProtocol.s.sol/*/run-latest.json",
    ]
    for pattern in patterns:
        candidates.extend(BROADCAST_ROOT.glob(pattern))

    return sorted(candidates, key=lambda p: p.stat().st_mtime, reverse=True)


def _extract_addresses_from_run_json(path: Path) -> Optional[Dict[str, object]]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        return None

    txs = data.get("transactions")
    if not isinstance(txs, list):
        return None

    creates = [t for t in txs if isinstance(t, dict) and t.get("transactionType") == "CREATE"]
    if not creates:
        return None

    impls_by_name: Dict[str, List[str]] = {}
    impl_name_by_addr: Dict[str, Optional[str]] = {}
    for tx in creates:
        name = tx.get("contractName")
        addr = tx.get("contractAddress")
        if isinstance(addr, str):
            normalized_name = name if isinstance(name, str) and name else None
            impl_name_by_addr[addr.lower()] = normalized_name
            if normalized_name:
                impls_by_name.setdefault(normalized_name, []).append(addr)

    proxies_by_impl: Dict[str, List[str]] = {}
    for tx in creates:
        if tx.get("contractName") != "ERC1967Proxy":
            continue
        proxy = tx.get("contractAddress")
        args = tx.get("arguments") or []
        if not isinstance(proxy, str) or not isinstance(args, list) or not args:
            continue
        impl_addr = args[0]
        if not isinstance(impl_addr, str):
            continue
        proxies_by_impl.setdefault(impl_addr.lower(), []).append(proxy)

    def addresses_for(contract_name: str) -> List[str]:
        result: List[str] = []
        for impl_addr in impls_by_name.get(contract_name, []):
            result.extend(proxies_by_impl.get(impl_addr.lower(), []))
        if not result:
            result = list(impls_by_name.get(contract_name, []))
        return result

    comptrollers = addresses_for(COMPTROLLER_ABI_NAME)
    if not comptrollers:
        unnamed_impls = [impl for impl, name in impl_name_by_addr.items() if name is None]
        comptroller_candidates: List[str] = []
        for impl_addr in unnamed_impls:
            comptroller_candidates.extend(proxies_by_impl.get(impl_addr, []))
        if len(comptroller_candidates) == 1:
            comptrollers = comptroller_candidates

    price_oracles = addresses_for("PriceOracle")
    markets = addresses_for(MARKET_ABI_NAME)
    mining = addresses_for(LIQUIDITY_MINING_ABI_NAME)

    return {
        "comptroller": comptrollers[0] if comptrollers else None,
        "markets": markets,
        "liquidityMining": mining,
        "priceOracle": price_oracles[0] if price_oracles else None,
    }


def _load_addresses_file(path: Path) -> Optional[Dict[str, object]]:
    if not path.exists():
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        return None

    if not isinstance(data, dict):
        return None

    return {
        "comptroller": data.get("comptroller"),
        "markets": data.get("markets", []),
        "liquidityMining": data.get("liquidityMining", []),
        "priceOracle": data.get("priceOracle"),
    }


@lru_cache(maxsize=1)
def load_addresses() -> dict:
    if os.getenv("AUTO_DISCOVER_ADDRESSES", "1") != "0":
        best: Optional[Dict[str, object]] = None
        best_score = -1
        for run_json in _find_run_json_candidates():
            discovered = _extract_addresses_from_run_json(run_json)
            if not discovered:
                continue
            score = (
                (100 if discovered.get("comptroller") else 0)
                + (100 if discovered.get("priceOracle") else 0)
                + len(discovered.get("markets", []))
                + len(discovered.get("liquidityMining", []))
            )
            if score > best_score:
                best = discovered
                best_score = score
        if best and best.get("comptroller") and best.get("priceOracle"):
            return best

    configured = _load_addresses_file(CONFIG_PATH)
    if configured:
        return configured

    raise FileNotFoundError(
        f"Unable to load addresses. No valid broadcast run json found under {BROADCAST_ROOT} "
        f"and no readable config at {CONFIG_PATH}."
    )
