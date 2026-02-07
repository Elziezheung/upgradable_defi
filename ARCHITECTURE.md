# 架构和API设计文档

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    用户浏览器                                  │
│  (React SPA + MetaMask 钱包)                                 │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         │ JSON
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   前端服务器 (Nginx/Express)                   │
│  ├─ 静态HTML/CSS/JS                                           │
│  └─ 代理 → 后端API                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         后端API服务器 (FastAPI - Python)                      │
│  ├─ /health          - 链状态                                │
│  ├─ /markets         - 获取池信息                             │
│  ├─ /accounts/{addr} - 账户数据                              │
│  ├─ /events          - 事件查询                              │
│  └─ /stats           - 统计数据                              │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌─────────┐     ┌──────────┐     ┌──────────┐
   │Indexer  │     │Database  │     │Chain     │
   │(异步)   │────→│(SQLite)  │     │Reader    │
   └─────────┘     └──────────┘     │(Web3.py) │
        │                            └────┬─────┘
        │                                 │
        └─────────────┬───────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │  Ethereum RPC 节点      │
         │  (Mainnet/Testnet)     │
         └────────────────────────┘
```

## 数据流

### 1. 应用启动

```
用户打开应用
    ↓
前端加载 (index.html)
    ↓
React App初始化
    ↓
自动调用 :
  - useMarkets() → GET /markets
  - useHealth() → GET /health
  ↓
显示可用的池和统计数据
```

### 2. 钱包连接

```
用户点击 "Connect"
    ↓
调用 window.ethereum.request()
    ↓
MetaMask显示连接弹窗
    ↓
用户批准
    ↓
获取账户地址和链ID
    ↓
调用 useAccount(address) → GET /accounts/{address}
    ↓
显示用户投资组合
```

### 3. 事件监听（后端）

```
后端启动
    ↓
初始化 Indexer 和 ChainReader
    ↓
轮询区块链获取新事件
    ↓
保存到SQLite数据库
    ↓
当前端请求时返回数据
```

## API 设计

### REST API 端点

#### GET /health
获取健康状态。

**响应:**
```json
{
  "chainId": 1,
  "latestBlock": 19500000,
  "indexedToBlock": 19499950
}
```

#### GET /markets
获取所有流动性池。

**响应:**
```json
{
  "items": [
    {
      "market": "0x...",
      "underlying": "0x...",
      "symbol": "USDC",
      "decimals": 6,
      "totalSupply": 1000000000000,
      "totalBorrows": 500000000000,
      "totalReserves": 50000000000,
      "cash": 450000000000,
      "exchangeRate": 1050000000000000000,
      "utilization": 0.45,
      "borrowRatePerYear": 50000000000000000,
      "supplyRatePerYear": 22500000000000000,
      "price": 1.0,
      "collateralFactor": 800000000000000000,
      "isListed": true
    }
  ]
}
```

#### GET /accounts/{address}
获取指定账户信息。

**参数:**
- `address`: 用户Ethereum地址

**响应:**
```json
{
  "account": "0x...",
  "liquidity": 5000000000000000000,
  "shortfall": 0,
  "isHealthy": true,
  "positions": [
    {
      "market": "0x...",
      "underlying": "0x...",
      "symbol": "USDC",
      "decimals": 6,
      "supplyDToken": 100000000000,
      "supplyUnderlying": 105000000000,
      "borrowBalance": 0,
      "exchangeRate": 1050000000000000000,
      "price": 1.0,
      "collateralFactor": 800000000000000000,
      "isListed": true
    }
  ]
}
```

#### GET /events
查询链上事件。

**查询参数:**
- `contract` (可选): 合约地址
- `event` (可选): 事件名称
- `fromBlock` (可选): 起始块号
- `toBlock` (可选): 结束块号
- `limit` (可选): 返回数量，默认100，最多1000

**响应:**
```json
{
  "items": [
    {
      "id": "abc123",
      "contract": "0x...",
      "event": "Deposit",
      "blockNumber": 19500000,
      "transactionHash": "0x...",
      "logIndex": 0,
      "args": {
        "user": "0x...",
        "amount": "1000000000000000000"
      }
    }
  ]
}
```

#### GET /stats
获取事件统计。

**查询参数:**
同 `/events`

**响应:**
```json
{
  "items": [
    {
      "event": "Deposit",
      "count": 150,
      "totalAmount": "150000000000000000000"
    }
  ]
}
```

## 数据库架构

### SQLite 表结构

#### events 表
```sql
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  contract TEXT NOT NULL,
  event TEXT NOT NULL,
  block_number INTEGER NOT NULL,
  transaction_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  args JSON NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(transaction_hash, log_index)
);

CREATE INDEX idx_contract ON events(contract);
CREATE INDEX idx_event ON events(event);
CREATE INDEX idx_block ON events(block_number);
```

#### state 表
```sql
CREATE TABLE state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

## 前端架构

### 目录结构

```
src/
├── components/          # React组件
│   ├── Header.tsx      # 导航栏
│   ├── PoolsTable.tsx  # 池表格
│   ├── UserPortfolio.tsx
│   ├── Transactions.tsx
│   ├── StatCard.tsx
│   ├── AnalyticsDashboard.tsx
│   ├── UI.tsx          # 通用UI组件
│   └── Notification.tsx
├── hooks/              # 自定义Hooks
│   ├── useAPI.ts       # API调用hooks
│   └── useWallet.ts    # 钱包集成
├── services/           # 服务层
│   └── api.ts          # API客户端
├── utils/              # 工具函数
│   └── format.ts       # 格式化函数
├── App.tsx             # 主应用
└── main.tsx            # 入口点
```

### 数据流（单向）

```
用户交互
    ↓
事件处理器
    ↓
Hook (useAPI / useWallet)
    ↓
API 服务 (api.ts)
    ↓
后端 API
    ↓
状态更新
    ↓
组件重新渲染
    ↓
显示新数据
```

### 状态管理

使用React内置的hooks进行状态管理（足够简单的应用）：

- `useState` - 组件本地状态
- `useEffect` - 副作用和数据获取
- `useMemo` - 计算缓存
- `useCallback` - 回调缓存

## 后端架构

### 主要模块

#### main.py
- FastAPI应用设置
- 路由定义
- 中间件配置（CORS）
- 事件处理器（startup/shutdown）

#### chain.py (ChainReader)
- Web3.py集成
- 智能合约交互
- 市场数据检索
- 账户信息获取
- 价格预言机集成

#### db.py (Database)
- SQLite操作
- 事件存储
- 查询接口

#### indexer.py (Indexer)
- 异步事件监听
- 区块轮询
- 事件解析
- 数据库保存

#### abi.py
- ABI文件加载
- 合约简介处理

#### config.py
- 环境变量
- 配置常量
- 地址加载

## 性能优化策略

### 后端
- ✅ 数据库索引
- ✅ 事件批量处理
- ✅ 异步索引器
- ⏳ Redis缓存层（待实现）
- ⏳ GraphQL API（可选）

### 前端
- ✅ 代码分割
- ✅ 组件memoization
- ✅ 图片优化
- ✅ CSS构建优化
- ⏳ Service Worker（离线缓存）

## 安全考虑

1. **CORS**: 配置为仅允许特定域名（生产环境）
2. **输入验证**: 所有用户输入都要验证
3. **智能合约**: 需要安全审计
4. **钱包交互**: 使用MetaMask，不存储私钥
5. **API限频**: 生产环境需要实现速率限制

## 扩展建议

### 短期
- [ ] 实现交易执行功能
- [ ] 添加价格图表
- [ ] 完善错误处理

### 中期
- [ ] 移动应用 (React Native)
- [ ] WebSocket实时更新
- [ ] 高级分析功能
- [ ] 多链支持

### 长期
- [ ] GraphQL API
- [ ] The Graph集成
- [ ] DAO治理
- [ ] 跨链桥接
