# Liquidity Mining Frontend

A modern, responsive frontend for interacting with the liquidity mining DeFi protocol.

## Features

- **Pool Management**: View and analyze liquidity mining pools with real-time metrics
- **Portfolio Tracking**: Monitor your supplied assets, borrowing positions, and account health
- **Transaction History**: Track all protocol interactions and events
- **Wallet Integration**: Connect MetaMask or other Web3 wallets
- **Real-time Data**: Live updates of TVL, APR, and utilization rates

## Tech Stack

- **Frontend Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Web3**: ethers.js / web3.js
- **API Client**: axios

## Project Structure

```
src/
├── components/          # Reusable React components
│   ├── Header.tsx      # Navigation header with wallet connection
│   ├── PoolsTable.tsx  # Main pools list and metrics
│   ├── UserPortfolio.tsx # User's positions and account info
│   ├── Transactions.tsx # Transaction history
│   └── StatCard.tsx    # Data display cards
├── hooks/              # React custom hooks
│   ├── useAPI.ts       # API calls hooks (useMarkets, useAccount, useHealth)
│   └── useWallet.ts    # Wallet connection hook
├── services/           # Business logic
│   └── api.ts          # API client and interface definitions
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

## Getting Started

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=/api
```

For local development, `VITE_API_URL=/api` is recommended so Vite proxy forwards requests to the backend without CORS issues.

### Development

```bash
npm run dev
```

The application will start at `http://localhost:5173`

### Build

```bash
npm run build
```

## API Integration

The frontend connects to the backend API with the following endpoints:

- `GET /health` - Chain and indexer status
- `GET /markets` - Available liquidity pools
- `GET /accounts/{address}` - User account data and positions
- `GET /events` - Protocol events and transactions
- `GET /stats` - Event statistics

## Key Components

### Header
Navigation and wallet connection management. Shows connected wallet address and provides disconnect option.

### PoolsTable
Displays all available liquidity pools with sortable columns:
- Pool name/symbol
- Total Value Locked (TVL)
- Supply APR (Annual Percentage Rate)
- Borrow APR
- Utilization rate (visual progress bar)
- Current asset price
- Action buttons

### UserPortfolio
Shows user's account information when connected:
- Account liquidity and health status
- List of supplied and borrowed assets
- Position values in USD
- Collateral factors

### Transactions
Historical view of all user interactions:
- Event type (Deposit, Withdraw, Borrow, Repay)
- Block and transaction details
- Detailed event arguments

## Styling

The UI uses a modern dark theme with:
- Gradient backgrounds (#FF007A to purple)
- Slate and gray color scheme
- Responsive grid layouts
- Smooth transitions and hover states

## Browser Support

- Chrome/Chromium latest
- Firefox latest
- Safari latest
- Edge latest

Requires MetaMask or compatible Web3 wallet for full functionality.

## Future Enhancements

- [ ] Deposit/Withdrawal functionality
- [ ] Approve token spending flow
- [ ] Historical performance charts
- [ ] Advanced trading pairs
- [ ] Portfolio performance analytics
- [ ] Mobile app optimization
- [ ] Dark/Light theme toggle
- [ ] Multiple wallet support (Ledger, Trezor, etc.)
