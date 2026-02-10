# Frontend Quick Reference

## Current Structure

```
src/
├── App.tsx                  # Main entry - renders MiningApp
├── mining/                  # Liquidity Mining Module
│   ├── App.tsx              # Mining page component
│   ├── components/           # UI components (8 files)
│   ├── hooks/               # React hooks (2 files)
│   └── services/            # API & Web3 services (2 files)
└── utils/                  # Shared utilities
```

## Files Moved to `mining/`

### Components (8 files)
- Header.tsx
- PoolsTable.tsx
- UserPortfolio.tsx
- Transactions.tsx
- AnalyticsDashboard.tsx
- StatCard.tsx
- Notification.tsx
- UI.tsx

### Hooks (2 files)
- useAPI.ts
- useWallet.ts

### Services (2 files)
- api.ts
- web3.ts

## How to Add a New Page

### 1. Create directory structure
```bash
mkdir -p src/[page-name]/components
mkdir -p src/[page-name]/hooks
mkdir -p src/[page-name]/services
```

### 2. Create page app
```tsx
// src/[page-name]/App.tsx
import React from 'react';

function [PageName]App() {
  return <div>Your page content</div>;
}

export default [PageName]App;
```

### 3. Update main App.tsx
```tsx
// src/App.tsx
import React from 'react';
import MiningApp from './mining/App';
import [PageName]App from './[page-name]/App';

function App() {
  return <MiningApp />; // Add routing logic for multiple pages
}

export default App;
```

## Import Paths

```typescript
// From mining components
import { ComponentName } from '@/mining/components/ComponentName';

// From mining hooks
import { useHook } from '@/mining/hooks/useHook';

// From mining services
import { Service } from '@/mining/services/service';

// From utils
import { util } from '@/utils/util';
```

## Current Page: Mining

**Features:**
- Liquidity pools with supply/borrow
- User portfolio tracking
- Transaction history
- Market analytics
- Wallet integration (MetaMask)

**Tabs:**
- Pools: View and manage liquidity pools
- Portfolio: View your positions
- Transactions: Transaction history
- Analytics: Market statistics

## Testing

```bash
# Start backend
cd backend && python -m uvicorn app.main:app --reload

# Start frontend
cd frontend && npm run dev

# Visit
http://localhost:5173
```

## Environment Variables

```env
VITE_API_URL=http://localhost:8000
```

## Build Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview build
```
