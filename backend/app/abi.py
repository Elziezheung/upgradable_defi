import json
from pathlib import Path

from .config import ABI_ROOT


def find_abi_file(contract_name: str) -> Path:
    pattern = f"{contract_name}.json"
    for path in ABI_ROOT.rglob(pattern):
        if path.is_file():
            return path
    raise FileNotFoundError(f"ABI json not found for contract: {contract_name}")


def load_abi(contract_name: str):
    abi_path = find_abi_file(contract_name)
    with open(abi_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if "abi" not in data:
        raise ValueError(f"ABI field not found in: {abi_path}")
    return data["abi"]
