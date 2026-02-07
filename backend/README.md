# sc-backend

FastAPI + web3.py + SQLite 后端，用于本地 anvil(31337) 合约事件索引与查询。

## 环境要求
- Python 3.9
- 本地 anvil 节点：`http://127.0.0.1:8545`

## 快速开始
```bash
cd /Users/liuruyan/Desktop/course/6107/sc-backend
python3.9 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## 配置
地址文件：`config/addresses.local.json`
```json
{
  "comptroller": "0x0000000000000000000000000000000000000000",
  "markets": [],
  "liquidityMining": []
}
```

ABI 自动从 `../contracts/out/` 查找并读取（`abi` 字段）。

## API
- `GET /health`
- `GET /events?contract=&event=&fromBlock=&toBlock=&limit=`
- `GET /markets`
- `GET /accounts/{address}`
- `GET /stats?contract=&event=&fromBlock=&toBlock=`

## 备注
- 默认从 `latest-2000` 开始索引（如无 `state.lastProcessedBlock`）。
- 可通过环境变量修改：
  - `RPC_URL`（默认 `http://127.0.0.1:8545`）
  - `DB_PATH`（默认 `sc-backend/indexer.db`）
  - `POLL_INTERVAL`（默认 `5` 秒）
  - `BATCH_SIZE`（默认 `1000`）
  - `MARKET_ABI_NAME`（默认 `LendingToken`）
  - `COMPTROLLER_ABI_NAME`（默认 `Comptroller`）
  - `LIQUIDITY_MINING_ABI_NAME`（默认 `LiquidityMining`）
