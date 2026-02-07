# Liquidity Mining DeFi 快速开始指南

## 概述

这个项目包含一个完整的DeFi流动性挖矿协议，包括：
- **后端**: FastAPI REST API（Python）
- **前端**: React + TypeScript 现代化UI
- **智能合约**: Solidity合约（位于contracts目录）

## 项目特性

✅ 实时流动性池数据  
✅ 用户投资组合管理  
✅ MetaMask钱包集成  
✅ 交易历史跟踪  
✅ 市场分析仪表盘  
✅ 响应式设计  
✅ 黑暗主题 UI  

## 前置条件

> Python 3.11+  
> Node.js 18+  
> MetaMask浏览器扩展  
> 本地Ethereum节点（如Ganache, Hardhat等）

## 项目结构

```
upgradable_defi/
├── backend/           # Python FastAPI后端
├── frontend/          # React TypeScript前端
├── contracts/         # Solidity智能合约
├── docs/              # 文档
└── scripts/           # 辅助脚本
```

## 快速启动

### 1. 克隆项目（如果尚未克隆）

```bash
cd /workspaces/upgradable_defi
```

### 2. 启动后端

```bash
cd backend

# 安装Python依赖
pip install -r requirements.txt

# 配置环境
export RPC_URL=http://localhost:8545  # 你的Ethereum RPC节点

# 运行服务（开发模式）
python -m uvicorn app.main:app --reload

# API会在 http://localhost:8000 启动
# Swagger文档: http://localhost:8000/docs
```

### 3. 启动前端

在新的终端窗口：

```bash
cd frontend

# 安装Node依赖
npm install

# 配置环境变量
echo 'VITE_API_URL=http://localhost:8000' > .env

# 启动dev server
npm run dev

# 应用会在 http://localhost:3000 启动
```

### 4. 访问应用

打开浏览器访问 `http://localhost:3000`

## 主要功能说明

### 📊 Pools（流动性池）

- 查看所有可用的流动性挖矿池
- 实时显示 TVL、APR、利用率
- 可排序的数据表格
- 一键Supply功能（待实现）

### 👤 Portfolio（投资组合）

- 连接MetaMask钱包查看个人资产
- 显示已供应和已借入的资产
- 账户流动性和风险指标
- 头寸管理

### 📜 Transactions（交易历史）

- 查看所有链上交易事件
- 事件类型过滤
- Etherscan链接查看详情
- 原始事件数据展示

### 📈 Analytics（分析）

- 市场关键指标汇总
- 最高收益池排行
- 高利用率池警告
- 供应分布图表

## API 端点

### 后端API地址
```
http://localhost:8000
```

### 可用端点：

| 方法 | 端点 | 描述 |
|-----|------|------|
| GET | `/health` | 检查链和索引器状态 |
| GET | `/markets` | 获取所有池 |
| GET | `/accounts/{address}` | 获取账户信息 |
| GET | `/events` | 查询链上事件 |
| GET | `/stats` | 获取事件统计 |

更多信息见 `http://localhost:8000/docs`

## 环境变量配置

### 后端 (backend/.env)
```env
RPC_URL=http://localhost:8545
DB_PATH=./indexer.db
POLL_INTERVAL=5
BATCH_SIZE=1000
```

### 前端 (frontend/.env)
```env
VITE_API_URL=http://localhost:8000
```

## 常见问题

### Q: 连接不到后端？
A: 确保：
- 后端运行在 http://localhost:8000
- 前端的 `.env` 文件中 `VITE_API_URL` 设置正确
- 后端已启用CORS（已包含在main.py中）

### Q: 没有测试数据？
A: 需要：
- 部署智能合约到本地或测试网络
- 配置 `config/addresses.local.json` 中的合约地址
- 索引器会自动开始监听和记录事件

### Q: MetaMask连接失败？
A: 确保：
- MetaMask已安装并解锁
- 连接的网络是你的Ethereum RPC节点所在的网络
- 浏览器允许MetaMask访问此网站

## 开发指南

### 添加新的API端点

1. 在 `backend/app/main.py` 添加路由：

```python
@app.get("/new-endpoint")
def new_endpoint():
    return {"data": "value"}
```

2. 在 `frontend/src/services/api.ts` 添加客户端方法

3. 在组件中使用

### 修改样式

编辑 `frontend/tailwind.config.js` 自定义主题色：

```javascript
colors: {
  primary: '#FF007A',    // 主色 (粉红色)
  secondary: '#1B1F38',  // 次色 (深蓝)
}
```

## 部署

### Docker部署（推荐）

```bash
# 在项目根目录
docker-compose up --build
```

### Vercel部署（前端）

```bash
cd frontend
vercel
```

### AWS/GCP部署

见项目中的 `DEPLOYMENT.md` 文件

## 技术栈

**后端:**
- FastAPI
- Web3.py
- SQLite

**前端:**
- React 18
- TypeScript
- Tailwind CSS
- Vite
- Axios

**区块链:**
- ethers.js / web3.js
- MetaMask

## 贡献

欢迎提交PR和Issue！

## 许可证

MIT License

## 获取帮助

- 📖 查看详细文档: `DEPLOYMENT.md`
- 🔗 API文档: `http://localhost:8000/docs`
- 📧 提交Issue或PR

---

**现在你可以开始使用这个DeFi流动性挖矿应用了！** 🚀
