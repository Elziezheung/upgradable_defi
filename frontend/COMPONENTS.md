# 前端组件文档

## 组件概览

### 核心组件

#### Header
负责导航和钱包连接。

**属性:**
- `activeTab`: 当前活动标签 ('pools' | 'portfolio' | 'transactions' | 'analytics')
- `setActiveTab`: 标签切换回调

**功能:**
- 标签导航
- 钱包连接/断开
- 显示连接的地址

```tsx
import { Header } from '@/components/Header';

<Header activeTab="pools" setActiveTab={setActiveTab} />
```

#### PoolsTable
显示流动性池的表格。

**属性:**
- `markets`: Market[] - 池数据数组
- `loading`: boolean - 加载状态

**功能:**
- 可排序的列表
- 实时数据显示
- 响应式表格

```tsx
import { PoolsTable } from '@/components/PoolsTable';

<PoolsTable markets={markets} loading={loading} />
```

#### UserPortfolio
显示用户的投资组合。

**属性:**
- `account`: Account | null - 账户数据
- `loading`: boolean - 加载状态
- `connected`: boolean - 钱包连接状态

**功能:**
- 显示账户流动性
- 列出用户头寸
- 风险指标

```tsx
import { UserPortfolio } from '@/components/UserPortfolio';

<UserPortfolio account={account} loading={loading} connected={walletConnected} />
```

#### Transactions
交易历史组件。

**属性:**
- `selectedMarket?`: string - 筛选特定池

**功能:**
- 事件查询
- 事件过滤
- 详细信息展示

```tsx
import { Transactions } from '@/components/Transactions';

<Transactions selectedMarket="0x..." />
```

#### StatCard
统计信息卡片。

**属性:**
- `label`: string - 标签
- `value`: string | number - 值
- `unit?`: string - 单位
- `change?`: { value: number; isPositive: boolean }

**功能:**
- 显示关键指标
- 显示变化趋势

```tsx
import { StatCard } from '@/components/StatCard';

<StatCard
  label="Total TVL"
  value={5.04}
  unit="B"
  change={{ value: 23.8, isPositive: true }}
/>
```

#### AnalyticsDashboard
市场分析仪表盘。

**属性:**
- `markets`: Market[] - 池数据

**功能:**
- 关键指标总结
- 最高收益池排行
- 高利用率警告
- 供应分布图表

```tsx
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';

<AnalyticsDashboard markets={markets} />
```

### UI组件

#### LoadingSpinner
加载指示器。

```tsx
import { LoadingSpinner } from '@/components/UI';

<LoadingSpinner />
```

#### EmptyState
空状态显示。

```tsx
import { EmptyState } from '@/components/UI';

<EmptyState message="No data available" icon="📭" />
```

#### Notification
通知组件。

```tsx
import { Notification } from '@/components/Notification';

<Notification
  message="Transaction successful"
  type="success"
  duration={5000}
  onClose={() => {}}
/>
```

## 自定义Hooks

### useMarkets
获取流动性池数据。

```tsx
const { markets, loading, error, refetch } = useMarkets();
```

### useAccount
获取用户账户信息。

```tsx
const { account, loading, error, refetch } = useAccount(address);
```

### useHealth
获取链和索引器状态。

```tsx
const { health, loading, error, refetch } = useHealth();
```

### useWallet
管理钱包连接。

```tsx
const { wallet, connect, disconnect, loading, error } = useWallet();
```

## 工具函数

### 格式化工具 (utils/format.ts)

```tsx
import {
  formatAddress,      // 格式化地址
  formatNumber,       // 格式化数字
  formatCurrency,     // 格式化货币
  formatPercent,      // 格式化百分比
} from '@/utils/format';

formatAddress('0x123...', 4)  // "0x123...xxxx"
formatNumber(1234567, 2)      // "1.23M"
formatCurrency(5000000)       // "$5.00M"
formatPercent(0.15)           // "15.00%"
```

## 类型定义

所有TypeScript类型都在 `src/services/api.ts` 中定义：

```ts
interface Market {
  market: string;
  underlying: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  totalBorrows: number;
  totalReserves: number;
  cash: number;
  exchangeRate: number;
  utilization: number;
  borrowRatePerYear: number;
  supplyRatePerYear: number;
  price: number;
  collateralFactor: number;
  isListed: boolean;
}

interface Account {
  account: string;
  liquidity: number;
  shortfall: number;
  isHealthy: boolean;
  positions: Position[];
}
```

## 样式指南

**颜色:**
- 主色: `#FF007A` (粉红)
- 次色: `#1B1F38` (深蓝)
- 背景: `slate-900` / `slate-950`
- 边框: `slate-700`

**字体:**
- 标题: Bold (font-bold)
- 正文: Regular
- 辅文: 14px (text-sm)

**间距:**
- 容器内边距: 6px (p-6)
- 元素间距: 4px gap
- 部分间距: 8px (mb-8)

## 响应式设计

所有组件使用Tailwind CSS的响应式前缀：
- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* 响应式网格 */}
</div>
```

## 最佳实践

1. **数据获取**: 在组件挂载时使用useEffect获取数据
2. **错误处理**: 所有hook都返回error状态
3. **加载状态**: 显示Loading Spinner在数据加载时
4. **类型安全**: 总是为props定义TypeScript接口
5. **性能**: 使用useMemo和useCallback优化性能

## 示例用法

完整的应用示例见 `src/App.tsx`
