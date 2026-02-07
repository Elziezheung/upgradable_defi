import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export interface Market {
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

export interface Position {
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
}

export interface Account {
  account: string;
  liquidity: number;
  shortfall: number;
  isHealthy: boolean;
  positions: Position[];
}

export interface HealthStatus {
  chainId: number;
  latestBlock: number;
  indexedToBlock: number;
}

export interface Event {
  id: string;
  contract: string;
  event: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  args: Record<string, any>;
}

class APIService {
  async getHealth(): Promise<HealthStatus> {
    const response = await apiClient.get('/health');
    return response.data;
  }

  async getMarkets(): Promise<Market[]> {
    const response = await apiClient.get('/markets');
    return response.data.items;
  }

  async getAccount(address: string): Promise<Account> {
    const response = await apiClient.get(`/accounts/${address}`);
    return response.data;
  }

  async getEvents(
    contract?: string,
    event?: string,
    fromBlock?: number,
    toBlock?: number,
    limit: number = 100
  ): Promise<Event[]> {
    const params = new URLSearchParams();
    if (contract) params.append('contract', contract);
    if (event) params.append('event', event);
    if (fromBlock) params.append('fromBlock', fromBlock.toString());
    if (toBlock) params.append('toBlock', toBlock.toString());
    params.append('limit', limit.toString());

    const response = await apiClient.get('/events', { params });
    return response.data.items;
  }

  async getStats(
    contract?: string,
    event?: string,
    fromBlock?: number,
    toBlock?: number
  ): Promise<Record<string, any>> {
    const params = new URLSearchParams();
    if (contract) params.append('contract', contract);
    if (event) params.append('event', event);
    if (fromBlock) params.append('fromBlock', fromBlock.toString());
    if (toBlock) params.append('toBlock', toBlock.toString());

    const response = await apiClient.get('/stats', { params });
    return response.data.items;
  }
}

export default new APIService();
