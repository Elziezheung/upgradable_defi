# backend

FastAPI + web3.py + SQLite 后端，用于本地 anvil(31337) 合约事件索引与查询。

## 环境要求
- Python 3.9
- 本地 anvil 节点：`http://127.0.0.1:8545`

## 快速开始
```bash
cd /Users/liuruyan/Desktop/course/6107/upgradable_defi/backend
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
  "liquidityMining": [],
  "priceOracle": "0x0000000000000000000000000000000000000000"
}
```

ABI 自动从 `../contracts/out/` 查找并读取（`abi` 字段）。

## API
- `GET /health`
- `GET /events?contract=&event=&fromBlock=&toBlock=&limit=`
- `GET /events/amounts?contract=&event=&account=&fromBlock=&toBlock=&limit=`
- `GET /markets`
- `GET /markets/summary`
- `GET /markets/timeseries?from=&to=&interval=`
- `GET /accounts/{address}?market=`
- `GET /account/overview?account=`
- `GET /account/wallet?account=&assets=`
- `GET /stats?contract=&event=&fromBlock=&toBlock=`
- `GET /liquidity-mining`
- `GET /liquidity-mining/{address}`

### API 说明
- `GET /health`：链与索引状态（chainId、latestBlock、indexedToBlock）。
- `GET /events`：事件查询（按合约/事件名/区块范围过滤）。
- `GET /events/amounts`：事件金额统计（按事件聚合金额与次数，可过滤账户）。
- `GET /markets`：市场汇总（供给/借款/利率/利用率/价格/抵押系数）。
- `GET /markets/summary`：市场顶部聚合指标（总供给/赚取/借款/抵押，USD）。
- `GET /markets/timeseries`：按天/小时聚合（默认最近 30 天，当前为静态快照）。
- `GET /accounts/{address}`：用户头寸（供给/借款/健康度），支持 `market` 仅返回指定市场。
- `GET /account/overview`：用户概览（净 APR、借款能力、可借额度）。
- `GET /account/wallet`：钱包余额（按资产过滤，返回余额与价格）。
- `GET /stats`：事件统计（按合约+事件分组计数）。
- `GET /liquidity-mining`：挖矿池汇总（质押/奖励 token、总质押、奖励速率）。
- `GET /liquidity-mining/{address}`：用户在各挖矿池的质押与收益。

## 备注
- 默认从 `latest-2000` 开始索引（如无 `state.lastProcessedBlock`）。
- 可通过环境变量修改：
  - `RPC_URL`（默认 `http://127.0.0.1:8545`）
  - `DB_PATH`（默认 `backend/indexer.db`）
  - `POLL_INTERVAL`（默认 `5` 秒）
  - `BATCH_SIZE`（默认 `1000`）
  - `MARKET_ABI_NAME`（默认 `LendingToken`）
  - `COMPTROLLER_ABI_NAME`（默认 `Comptroller`）
  - `LIQUIDITY_MINING_ABI_NAME`（默认 `LiquidityMining`）
