# Frontend Directory Structure

## Overview

The frontend is organized into modular components to support multiple application pages. Currently, the `mining` page contains all the liquidity mining and lending functionality.

## Directory Structure

```
frontend/src/
├── App.tsx                    # Main app container (routes to different pages)
├── main.tsx                   # Application entry point
├── index.css                  # Global styles
├── vite-env.d.ts              # Vite type definitions
├── mining/                    # Liquidity Mining Page
│   ├── App.tsx                # Mining app component
│   ├── components/            # Mining-specific components
│   │   ├── Header.tsx        # Navigation header
│   │   ├── PoolsTable.tsx    # Liquidity pools table
│   │   ├── UserPortfolio.tsx  # User portfolio view
│   │   ├── Transactions.tsx   # Transaction history
│   │   ├── AnalyticsDashboard.tsx  # Market analytics
│   │   ├── StatCard.tsx      # Statistics card component
│   │   ├── Notification.tsx   # Notification component
│   │   └── UI.tsx           # Reusable UI components
│   ├── hooks/                # Mining-specific React hooks
│   │   ├── useAPI.ts        # API interaction hooks
│   │   └── useWallet.ts     # Wallet connection hook
│   └── services/             # Mining-specific services
│       ├── api.ts            # Backend API client
│       └── web3.ts          # Web3 interaction service
└── utils/                   # Shared utility functions
    └── format.ts            # Formatting utilities

## How to Add a New Page

### 1. Create Page Directory

```bash
mkdir -p src/[page-name]/components
mkdir -p src/[page-name]/hooks
mkdir -p src/[page-name]/services
```

### 2. Create Page App Component

Create `src/[page-name]/App.tsx`:

```tsx
import React from 'react';

function [PageName]App() {
  return (
    <div>
      <h1>[Page Name]</h1>
      {/* Your page content */}
    </div>
  );
}

export default [PageName]App;
```

### 3. Update Main App

Edit `src/App.tsx` to include your new page:

```tsx
import React from 'react';
import MiningApp from './mining/App';
import [PageName]App from './[page-name]/App';

function App() {
  // Add routing logic here
  // For now, render a single page
  return <MiningApp />;
  // Or implement routing for multiple pages
}

export default App;
```

### 4. Add Page-Specific Components

Add components to `src/[page-name]/components/`

### 5. Add Page-Specific Hooks

Add custom hooks to `src/[page-name]/hooks/`

### 6. Add Page-Specific Services

Add API/Web3 services to `src/[page-name]/services/`

## Adding Routing

To support multiple pages, you can install and configure a router:

### Option 1: React Router

```bash
npm install react-router-dom
```

Then update `src/App.tsx`:

```tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MiningApp from './mining/App';
import [PageName]App from './[page-name]/App';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/mining" element={<MiningApp />} />
        <Route path="/[page-name]" element={<[PageName]App />} />
        <Route path="/" element={<MiningApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### Option 2: Custom Tab Navigation

Keep the current tab-based approach and extend it:

```tsx
import React, { useState } from 'react';
import MiningApp from './mining/App';
import [PageName]App from './[page-name]/App';

type PageType = 'mining' | '[page-name]';

function App() {
  const [activePage, setActivePage] = useState<PageType>('mining');

  return (
    <div>
      {/* Add navigation */}
      <nav>
        <button onClick={() => setActivePage('mining')}>Mining</button>
        <button onClick={() => setActivePage('[page-name]')}>[Page Name]</button>
      </nav>

      {/* Render active page */}
      {activePage === 'mining' && <MiningApp />}
      {activePage === '[page-name]' && <[PageName]App />}
    </div>
  );
}

export default App;
```

## Shared Resources

### Utils Directory

Place shared utility functions in `src/utils/`:

```typescript
// src/utils/format.ts
export function formatNumber(value: number): string {
  return value.toLocaleString();
}
```

Import from any page:

```typescript
import { formatNumber } from '@/utils/format';
```

## Import Path Aliases

Use the `@/` prefix for imports from the `src` directory:

```typescript
// Import from mining components
import { Header } from '@/mining/components/Header';

// Import from mining hooks
import { useAPI } from '@/mining/hooks/useAPI';

// Import from utils
import { formatNumber } from '@/utils/format';
```

## Current Pages

### Mining Page (`src/mining/`)

**Features:**
- Liquidity pools display
- User portfolio management
- Transaction history
- Market analytics
- Wallet integration
- Supply/Borrow functionality

**Components:**
- Header: Navigation with tabs
- PoolsTable: Interactive pools table
- UserPortfolio: User's positions
- Transactions: Transaction history list
- AnalyticsDashboard: Market statistics and charts
- StatCard: Statistic display card
- Notification: Toast notifications
- UI: Reusable UI components

**Hooks:**
- useAPI: Backend API interactions
- useWallet: Wallet connection and management

**Services:**
- api.ts: REST API client
- web3.ts: Blockchain interaction

## Development Notes

### Adding New Components

1. Create the component file in the appropriate `components/` directory
2. Follow TypeScript best practices with proper typing
3. Use Tailwind CSS for styling (configured in `tailwind.config.js`)
4. Export the component as default

### State Management

- Use React hooks (useState, useEffect, useContext) for local state
- For global state, consider Context API or state management libraries like Redux/Zustand

### API Integration

- Use the `useAPI` hook from each page's hooks directory
- API base URL is configured via `VITE_API_URL` environment variable
- All API calls are defined in the `services/api.ts` file

### Web3 Integration

- Use the Web3Service from `services/web3.ts`
- All blockchain interactions go through this service
- Ensure wallet is connected before performing transactions

## Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:8000
```

## Build and Deploy

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```
