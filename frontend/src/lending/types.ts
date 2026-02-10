/**
 * Lending Types
 * Type definitions for lending markets and user positions
 */

export interface LendingMarket {
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

export interface UserPosition {
  market: string;
  underlying: string;
  symbol: string;
  decimals: number;
  supplyDToken: number;
  supplyUnderlying: number;
  borrowBalance: number;
  exchangeRate: number;
  price: number;
  collateralFactor: number;
  isListed: boolean;
  supplyAPY: number;
  borrowAPY: number;
}

export interface AccountData {
  account: string;
  liquidity: number;
  shortfall: number;
  isHealthy: boolean;
  positions: UserPosition[];
  totalSupplied: number;
  totalBorrowed: number;
  borrowLimit: number;
  availableToBorrow: number;
}

export interface TransactionEvent {
  id: string;
  contract: string;
  event: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  timestamp?: number;
  args: Record<string, unknown>;
}

export type LendingAction = 'supply' | 'withdraw' | 'borrow' | 'repay';
