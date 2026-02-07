# 快速参考指南

## 🚀 快速启动 (5分钟)

### Terminal 1 - 启动后端
```bash
cd backend
pip install -r requirements.txt
export RPC_URL=http://localhost:8545
python -m uvicorn app.main:app --reload
```
✅ Backend: http://localhost:8000
📚 Docs: http://localhost:8000/docs

### Terminal 2 - 启动前端
```bash
cd frontend
npm install
echo 'VITE_API_URL=http://localhost:8000' > .env
npm run dev
```
✅ Frontend: http://localhost:3000

---

## 📂 项目文件树 (简化版)

```
upgradable_defi/
├── 📚 文档
│   ├── README.md                  # 项目简介
│   ├── GETTING_STARTED.md         # ⭐ 快速开始
│   ├── ARCHITECTURE.md            # 系统架构
│   ├── DEPLOYMENT.md              # 部署指南
│   ├── DELIVERY_CHECKLIST.md      # 交付清单
│   └── UI_PREVIEW.md              # UI 预览
│
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI 入口
│   │   ├── chain.py              # 区块链接口
│   │   ├── db.py                 # 数据库
│   │   ├── indexer.py            # 事件索引
│   │   └── abi.py                # ABI 工具
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/           # React 组件
│   │   ├── hooks/                # 自定义 Hooks
│   │   ├── services/             # API 服务
│   │   ├── utils/                # 工具函数
│   │   ├── App.tsx               # 主应用
│   │   └── main.tsx              # 入口
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── Dockerfile
│   ├── COMPONENTS.md             # 组件文档
│   └── README.md
│
└── docker-compose.yml
```

---

## 🎯 核心功能速查

### 页面 (4个)
1. **Pools** - 查看所有流动性池
2. **Portfolio** - 管理您的头寸
3. **Transactions** - 交易历史
4. **Analytics** - 市场分析

### API 端点 (5个)
| 端点 | 说明 |
|-----|------|
| GET `/health` | 链状态 |
| GET `/markets` | 所有池 |
| GET `/accounts/{addr}` | 账户信息 |
| GET `/events` | 链上事件 |
| GET `/stats` | 统计数据 |

### React 组件 (8个)
- `Header` - 导航栏 & 钱包连接
- `PoolsTable` - 池表格
- `UserPortfolio` - 用户头寸
- `Transactions` - 交易历史
- `AnalyticsDashboard` - 分析仪表盘
- `StatCard` - 统计卡片
- `UI` - LoadingSpinner & EmptyState
- `Notification` - 通知组件

### Custom Hooks (2个)
- `useAPI` - API 调用 (markets, account, health)
- `useWallet` - MetaMask 连接

---

## 🔧 常用命令

### 前端开发
```bash
cd frontend

npm run dev      # 开发服务器
npm run build    # 生产构建
npm run lint     # ESLint 检查
npm run type-check  # TypeScript 检查
```

### 后端开发
```bash
cd backend

pip install -r requirements.txt  # 安装依赖
python -m uvicorn app.main:app --reload  # 开发服务器
```

### Docker
```bash
docker-compose up --build     # 构建并启动
docker-compose down           # 停止所有服务
docker-compose logs -f        # 查看日志
```

---

## 🌐 URL 查速表

| URL | 说明 |
|-----|------|
| http://localhost:3000 | 前端应用 |
| http://localhost:8000 | 后端 API |
| http://localhost:8000/docs | Swagger API 文档 |
| http://localhost:8000/redoc | ReDoc API 文档 |

---

## 🔗 API 使用示例

### 获取所有池
```javascript
const response = await fetch('http://localhost:8000/markets');
const markets = await response.json();
```

### 获取账户信息
```javascript
const addr = '0x123...';
const response = await fetch(`http://localhost:8000/accounts/${addr}`);
const account = await response.json();
```

### 查询事件
```javascript
const params = new URLSearchParams({
  limit: '100',
  event: 'Deposit'
});
const response = await fetch(`http://localhost:8000/events?${params}`);
const events = await response.json();
```

---

## 🛠️ 环境变量

### 后端 (.env)
```env
RPC_URL=http://localhost:8545
DB_PATH=./indexer.db
POLL_INTERVAL=5
BATCH_SIZE=1000
```

### 前端 (.env)
```env
VITE_API_URL=http://localhost:8000
```

---

## 📦 主要依赖

### 后端
- fastapi - Web 框架
- web3 - Ethereum 集成
- sqlalchemy - ORM
- asyncio - 异步

### 前端
- react@18 - UI 框架
- typescript - 类型系统
- vite - 构建工具
- tailwindcss - 样式
- axios - HTTP 客户端
- ethers.js - Web3 库

---

## 🎨 设计系统

### 颜色
- **主色**: #FF007A (粉红)
- **次色**: #1B1F38 (深蓝)
- **背景**: #0f172a (深灰)
- **边框**: #334155 (中灰)

### 字体
- **标题**: bold, 24-32px
- **正文**: regular, 14-16px
- **辅文**: 12-14px, gray-400

### 间距
- **容器**: 24px (1.5rem)
- **元素**: 16px (1rem)
- **微间距**: 8px (0.5rem)

---

## 🚀 部署清单

### 前端部署
- [ ] `npm run build` 生成文件
- [ ] 配置 `VITE_API_URL`
- [ ] 上传到 Vercel/Netlify/AWS
- [ ] 配置 CDN

### 后端部署
- [ ] 准备 Python 环境
- [ ] 配置 RPC URL
- [ ] 设置数据库
- [ ] 使用 Gunicorn + Nginx
- [ ] 配置 SSL/HTTPS

### Docker 部署
```bash
docker-compose -f docker-compose.yml up -d
```

---

## 🆘 故障排除

### 前端连接不到后端
```
❌ CORS 错误
✅ 检查: backend/app/main.py 中的 CORSMiddleware

❌ 连接被拒绝
✅ 检查: 后端是否运行在 :8000
✅ 检查: VITE_API_URL 配置
```

### MetaMask 连接失败
```
❌ "MetaMask not found"
✅ 检查: 浏览器是否安装 MetaMask

❌ "Failed to connect"
✅ 检查: MetaMask 是否解锁
✅ 检查: 网络配置是否正确
```

### 数据无法加载
```
❌ "Failed to fetch markets"
✅ 检查: RPC_URL 是否正确
✅ 检查: 后端是否运行
✅ 检查: 数据库中是否有数据
```

---

## 📊 项目统计

| 指标 | 数值 |
|-----|------|
| React 组件 | 8 |
| Custom Hooks | 2 |
| API 端点 | 5 |
| TypeScript 文件 | 13 |
| 文档文件 | 7 |
| 总代码行数 | ~2000 |
| 依赖包数 | 15+ |

---

## 📚 更多资源

- 🚀 [完整快速开始](GETTING_STARTED.md)
- 🏗️ [系统架构详解](ARCHITECTURE.md)
- 📖 [组件库完整文档](frontend/COMPONENTS.md)
- 🚢 [部署指南](DEPLOYMENT.md)
- 🎨 [UI 设计预览](UI_PREVIEW.md)

---

## ✅ 完成度检查

```
✅ 后端 API         100%
✅ 前端界面         95%（缺少交易执行）
✅ 工具和文档       100%
✅ Docker 配置      100%
✅ CORS 配置        100%
✅ TypeScript 类型  100%

Overall: 95% 完成
```

---

## 🎯 后续步骤

1. **立即开始**: 运行快速启动命令
2. **本地测试**: 连接 MetaMask 测试
3. **部署测试网**: Sepolia/Goerli
4. **添加功能**: Supply/Borrow 操作
5. **生产部署**: Docker 或云服务

---

## 💬 常见问题

**Q: 如何修改主题色?**  
A: 编辑 `frontend/tailwind.config.js` 中的 `colors` 配置

**Q: 如何添加新页面?**  
A: 在 `src/components/` 创建新组件，在 `Header.tsx` 添加导航

**Q: 如何发起交易?**  
A: 实现 `Supply`, `Borrow`, `Approve` 等功能（待开发）

**Q: 支持哪些钱包?**  
A: 目前只支持 MetaMask，可扩展到 WalletConnect

---

**🎉 项目已完全准备就绪，立即开始吧！**

有任何问题，参考 [GETTING_STARTED.md](GETTING_STARTED.md) 或查看详细文档。
