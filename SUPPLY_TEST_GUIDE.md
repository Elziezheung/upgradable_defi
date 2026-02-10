# Supply 功能测试指南

## 前提条件

1. **Anvil 节点运行中**
   ```bash
   anvil
   ```

2. **后端服务运行中**
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload
   ```

3. **前端服务运行中**
   ```bash
   cd frontend
   npm run dev
   ```

4. **合约已部署**
   ```bash
   export PATH="$PATH:$HOME/.foundry/bin"
   bash script/deploy_local.sh
   ```

## 测试账户信息

在 Anvil 本地环境中，测试账户（Mnemonic: test test test test test test test test test test test junk）：

| Account | Address | Private Key | Balance |
|----------|----------|-------------|---------|
| Account 0 | 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 | 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 | 10,000 ETH |
| Account 1 | 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 | 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d | 10,000 ETH |

## 测试步骤

### 1. 给测试账户铸造 USDC

如果测试账户没有 USDC，运行以下脚本：

```bash
export PATH="$PATH:$HOME/.foundry/bin"

# Deployer private key (account 0)
DEPLOYER_PK=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# USDC contract address
USDC=0x4826533B4897376654Bb4d4AD88B7faFD0C98528

# User address (account 0)
USER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# Mint 100,000 USDC to user
cast send ${USDC} "mint(address,uint256)" ${USER} 100000000000000000000000 \
  --private-key ${DEPLOYER_PK} \
  --rpc-url http://127.0.0.1:8545

# Check balance
cast call ${USDC} "balanceOf(address)" ${USER} --rpc-url http://127.0.0.1:8545
```

### 2. 配置 MetaMask

1. 打开 MetaMask
2. 添加本地网络：
   - Network Name: Localhost 8545
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH
3. 导入测试账户：
   - 账户 0 私钥: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

### 3. 连接钱包到前端

1. 访问 http://localhost:5173
2. 点击右上角 "Connect Wallet"
3. 选择 MetaMask 并授权

### 4. 测试 Supply 功能

1. 在 Pools 表格中找到 USDC 池
2. 点击 "Supply" 按钮
3. 输入供应金额（例如：100）
4. 点击 "Supply" 确认
5. 在 MetaMask 中确认交易
6. 等待交易确认
7. 查看成功的提示信息

## 预期结果

### 成功流程
- ✅ 显示 "Supply successful!" 提示
- ✅ 显示交易哈希
- ✅ USDC 余额减少
- ✅ dUSDC 余额增加
- ✅ Pool 的 Total Supply 增加
- ✅ Total TVL 更新

### 可能的错误

#### 1. "Wallet not connected"
- **原因**: 钱包未连接
- **解决**: 点击 "Connect Wallet" 按钮

#### 2. "Insufficient balance"
- **原因**: USDC 余额不足
- **解决**: 运行铸造脚本获取更多 USDC

#### 3. "MetaMask or compatible wallet not found"
- **原因**: 未安装 MetaMask
- **解决**: 安装 MetaMask 浏览器扩展

#### 4. 交易失败（Gas 不足）
- **原因**: 账户 ETH 余额不足支付 gas
- **解决**: 使用 Anvil 测试账户（有 10,000 ETH）

## 验证交易

### 使用 Cast 验证

```bash
export PATH="$PATH:$HOME/.foundry/bin"

# dUSDC address
DUSDC=0xCD8a1C3ba11CF5ECfa6267617243239504a98d90

# User address
USER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# Check user's dUSDC balance
cast call ${DUSDC} "balanceOf(address)" ${USER} --rpc-url http://127.0.0.1:8545

# Check market's total supply
cast call ${DUSDC} "totalSupply()" --rpc-url http://127.0.0.1:8545
```

### 使用后端 API 验证

```bash
# 获取所有市场数据
curl http://localhost:8000/markets

# 获取用户账户信息
curl http://localhost:8000/accounts/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

## 当前测试数据

- **USDC 地址**: 0x4826533B4897376654Bb4d4AD88B7faFD0C98528
- **dUSDC 地址**: 0xCD8a1C3ba11CF5ECfa6267617243239504a98d90
- **USDC Mining 地址**: 0xdbc43ba45381e02825b14322cddd15ec4b3164e6
- **测试账户余额**: 300,000 USDC
- **当前 TVL**: $20,000

## 故障排除

### 1. 前端显示错误

检查浏览器控制台是否有错误信息：
- 打开浏览器开发者工具（F12）
- 查看 Console 标签页
- 查找红色错误信息

### 2. 后端返回错误

检查后端日志：
```bash
tail -f /tmp/backend.log
```

### 3. 合约调用失败

使用 cast 直接测试合约调用：
```bash
export PATH="$PATH:$HOME/.foundry/bin"

# Test approve
cast send 0x4826533B4897376654Bb4d4AD88B7faFD0C98528 \
  "approve(address,uint256)" \
  0xCD8a1C3ba11CF5ECfa6267617243239504a98d90 \
  1000000000000000000 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --rpc-url http://127.0.0.1:8545

# Test mint
cast send 0xCD8a1C3ba11CF5ECfa6267617243239504a98d90 \
  "mint(uint256)" \
  1000000000000000000 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --rpc-url http://127.0.0.1:8545
```
