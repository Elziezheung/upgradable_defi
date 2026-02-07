# Liquidity Mining DeFi Protocol

一个完整的DeFi流动性挖矿协议，包含智能合约、后端API和现代化前端界面。

## 项目结构

```
├── contracts/          # 智能合约代码
├── backend/           # Python FastAPI 后端
│   ├── app/
│   │   ├── main.py   # FastAPI应用入口
│   │   ├── chain.py  # 区块链读取器
│   │   ├── db.py     # 数据库操作
│   │   ├── indexer.py # 事件索引器
│   │   └── abi.py    # ABI加载工具
│   └── config/
├── frontend/          # React + TypeScript 前端
│   ├── src/
│   │   ├── components/  # React组件
│   │   ├── hooks/       # 自定义React Hooks
│   │   ├── services/    # API服务
│   │   └── utils/       # 工具函数
└── docs/              # 文档
```

## 快速开始

### 前置要求

- Node.js 18+
- Python 3.11+
- MetaMask 或其他Web3钱包
- 本地Ethereum节点（Ganache、Hardhat等）

### 后端部署

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
export RPC_URL=http://localhost:8545

# 运行服务
python -m uvicorn app.main:app --reload
```

后端将在 `http://localhost:8000` 运行

API 文档：`http://localhost:8000/docs`

### 前端部署

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
echo 'VITE_API_URL=http://localhost:8000' > .env

# 开发模式
npm run dev

# 生产构建
npm run build
```

前端将在 `http://localhost:3000` 运行

## Docker 部署

### 使用 Docker Compose（推荐）

```bash
# 构建并启动所有服务
docker-compose up --build

# 后台运行
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 环境变量配置

创建 `.env` 文件：

```env
# Ethereum RPC地址
RPC_URL=http://127.0.0.1:8545

# 数据库路径
DB_PATH=./data/indexer.db

# 轮询间隔（秒）
POLL_INTERVAL=5

# 批处理大小
BATCH_SIZE=1000

# 前端API地址
VITE_API_URL=http://localhost:8000
```

## API 端点

### 健康检查
```
GET /health
```
返回链ID、最新区块和索引进度

### 获取市场列表
```
GET /markets
```
获取所有可用的流动性挖矿池

### 获取账户信息
```
GET /accounts/{address}
```
获取特定账户的头寸、流动性和借贷信息

### 获取事件
```
GET /events?contract=...&event=...&fromBlock=...&toBlock=...&limit=100
```
查询链上事件

### 获取统计数据
```
GET /stats?contract=...&event=...&fromBlock=...&toBlock=...
```
获取事件统计信息

## 前端特性

### 流动性池管理
- 查看所有可用的挖矿池
- 实时TVL和APR数据
- 可排序的池表
- 池利用率可视化

### 用户投资组合
- 连接MetaMask钱包
- 查看供应和借贷头寸
- 账户健康状态监控
- 流动性和风险指标

### 交易历史
- 链上事件查询
- 交易详情查看
- Etherscan链接集成
- 事件过滤

### 实时数据
- 自动刷新市场数据
- WebSocket支持（可选）
- 区块浏览器同步

## 开发指南

### 添加新API端点

1. 在 `backend/app/main.py` 中添加路由：

```python
@app.get("/custom-endpoint")
def custom_endpoint():
    return {"data": "value"}
```

2. 在 `frontend/src/services/api.ts` 中更新客户端：

```typescript
async getCustomData(): Promise<any> {
  const response = await apiClient.get('/custom-endpoint');
  return response.data;
}
```

### 添加新组件

1. 在 `frontend/src/components/` 中创建新组件
2. 在 `App.tsx` 中导入使用
3. 添加样式（使用 Tailwind CSS）

### 修改样式主题

编辑 `frontend/tailwind.config.js`：

```javascript
extend: {
  colors: {
    primary: '#FF007A',      // 主色
    secondary: '#1B1F38',    // 次色
  }
}
```

## 部署指南

### 生产部署

#### 后端（使用 Gunicorn）

```bash
pip install gunicorn
gunicorn app.main:app -w 4 -b 0.0.0.0:8000
```

#### 前端（使用 Nginx）

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    root /app/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Vercel 部署（前端）

```bash
npm install vercel -g
vercel
```

### AWS/GCP 部署

参见 [deployments.md]

## 安全考虑

- ✅ 启用 CORS 仅针对受信域名
- ✅ 使用环境变量存储敏感信息
- ✅ 定期更新依赖
- ✅ 验证用户输入
- ✅ 使用 HTTPS
- ⚠️ 审计智能合约

## 性能优化

- 启用缓存层（Redis）
- 数据库索引优化
- 前端代码分割和懒加载
- CDN 分发静态资源

## 故障排除

### 后端无法连接区块链
```bash
# 检查RPC_URL
export RPC_URL=http://localhost:8545
# 验证节点是否运行
curl http://localhost:8545 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### 前端无法连接后端
```bash
# 检查CORS设置
# 检查VITE_API_URL
echo $VITE_API_URL
```

### 编译错误
```bash
# 清除缓存
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 贡献指南

欢迎提交 Pull Request！请确保：

1. 通过所有测试
2. 代码遵循项目风格
3. 添加合适的注释
4. 提交说明清晰

## License

MIT

## 联系方式

- 问题：提交 GitHub Issue
- 安全问题：contact@example.com
