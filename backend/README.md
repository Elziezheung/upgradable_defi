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
export ABI_ROOT=/Users/liuruyan/Desktop/course/6107/upgradable_defi/contracts/out
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

## 测试与验证
运行 API 测试脚本（默认使用 anvil 账号 0 地址）：
```bash
python test_api.py
```

看到如下结果说明合约数据已读到：
- `/markets` 中包含 `symbol`、`price` 等字段且非空
- `/markets/summary` 返回 4 个 USD 聚合字段
- `/liquidity-mining` 返回两条挖矿池记录

运行链上动作测试（会执行 supply/borrow/stake）：
```bash
# 需要提前设置治理代币地址
export GOV_TOKEN=0x...
python test_actions.py
```

预期输出：
```
On-chain actions completed.
```

再运行 `python test_api.py`，你会看到类似格式的数据：

**/markets**
```json
{
  "items": [
    {
      "market": "0x...",
      "underlying": "0x...",
      "symbol": "USDC",
      "decimals": 18,
      "totalSupply": 2000000000000000000000,
      "totalBorrows": 100000000000000000000,
      "totalReserves": 0,
      "cash": 1900000000000000000000,
      "exchangeRate": 1000000000000000000,
      "utilization": 0.05,
      "borrowRatePerYear": 24999999981264000,
      "supplyRatePerYear": 1125000000576000,
      "price": 100000000,
      "collateralFactor": 750000000000000000,
      "isListed": true
    }
  ]
}
```

**/markets/summary**
```json
{
  "totalSupplyUsd": "5000.000000",
  "totalEarningUsd": "2.250000",
  "totalBorrowUsd": "100.000000",
  "totalCollateralUsd": "3900.000000",
  "asOf": 1770464426
}
```

**/liquidity-mining**
```json
{
  "items": [
    {
      "mining": "0x...",
      "stakingToken": "0x...",
      "stakingSymbol": "dUSDC",
      "stakingDecimals": 18,
      "rewardsToken": "0x...",
      "rewardsSymbol": "GOV",
      "rewardsDecimals": 18,
      "rewardRate": 11574074074074074,
      "totalStaked": 500000000000000000000,
      "rewardPerToken": 2824074074074074,
      "rewardsDuration": 2592000,
      "periodFinish": 1773056299,
      "lastTimeRewardApplicable": 1770464421
    }
  ]
}
```

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
- 代币数量字段（如 `balance`、`supplyUnderlying`、`borrowBalance`、`totalStaked`、`stakedBalance`、`earned`、`govBalance`）均已按 `decimals` 转成可读数量（非原始链上整数）。
- 比例/系数字段（如 `exchangeRate`、`collateralFactor`、`rewardPerToken`）已按 `1e18`（WAD）转成可读小数。
- `GET /events` 中 `args` 的金额字段已按对应市场 `decimals` 转换；原始值保留在 `argsRaw`。
- `GET /events/amounts` 中 `amountSum` 为可读数量；`amountSumRaw` 保留原始链上整数求和。

## 备注
- 运行流程（联调时链要保持开启）：
  1. 启动本地链：`anvil`
  2. 部署合约：`upgradable_defi/contracts/script/deploy_local.sh`
  3. 写入地址配置：运行 `quick_extract_local.sh` 并写入 `backend/config/addresses.local.json`
  4. 启动后端：`uvicorn app.main:app --reload`
- 如果关闭 anvil，链上读数会失败或变为 `null/0`。
- 默认从 `latest-2000` 开始索引（如无 `state.lastProcessedBlock`）。
- 可通过环境变量修改：
  - `RPC_URL`（默认 `http://127.0.0.1:8545`）
  - `DB_PATH`（默认 `backend/indexer.db`）
  - `POLL_INTERVAL`（默认 `5` 秒）
  - `BATCH_SIZE`（默认 `1000`）
  - `MARKET_ABI_NAME`（默认 `LendingToken`）
  - `COMPTROLLER_ABI_NAME`（默认 `Comptroller`）
  - `LIQUIDITY_MINING_ABI_NAME`（默认 `LiquidityMining`）
