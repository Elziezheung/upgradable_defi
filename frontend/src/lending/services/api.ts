/**
 * Lending API Service
 * Handles all API calls for lending markets and user data
 */
import axios from 'axios';
import { getAddress } from 'ethers';
import type { LendingMarket, AccountData, TransactionEvent, UserPosition } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

interface HealthStatus {
  chainId: number;
  latestBlock: number;
  indexedToBlock: number;
}

class LendingAPIService {
  /**
   * Get system health status
   */
  async getHealth(): Promise<HealthStatus> {
    const response = await apiClient.get('/health');
    return response.data;
  }

  /**
   * Get all lending markets
   */
  async getMarkets(): Promise<LendingMarket[]> {
    const response = await apiClient.get('/markets');
    return response.data?.items ?? [];
  }

  /**
   * Get account data including positions and health.
   * Normalizes address to checksum so backend/contract see the same format as the wallet.
   */
  async getAccount(address: string): Promise<AccountData> {
    const checksummed = getAddress(address);
    const response = await apiClient.get(`/accounts/${checksummed}`);
    const data = response.data;
    let positions = data.positions || [];
    // Normalize: ensure camelCase (backend may send snake_case)
    positions = positions.map((pos: Record<string, unknown>) => ({
      ...pos,
      supplyUnderlying: pos.supplyUnderlying ?? pos.supply_underlying ?? 0,
      borrowBalance: pos.borrowBalance ?? pos.borrow_balance ?? 0,
    })) as UserPosition[];
    // Backend sends price as USD float (e.g. 1.0) and supplyUnderlying/borrowBalance as token amounts (e.g. 300)
    const totalSupplied = positions.reduce((sum: number, pos: UserPosition) => {
      const price = pos.price ?? (pos as { priceUsd?: number }).priceUsd ?? 0;
      return sum + (pos.supplyUnderlying ?? 0) * price;
    }, 0);
    const totalBorrowed = positions.reduce((sum: number, pos: UserPosition) => {
      const price = pos.price ?? (pos as { priceUsd?: number }).priceUsd ?? 0;
      return sum + (pos.borrowBalance ?? 0) * price;
    }, 0);
    const borrowLimitFromPositions = positions.reduce((sum: number, pos: UserPosition) => {
      const price = pos.price ?? (pos as { priceUsd?: number }).priceUsd ?? 0;
      const supplyValue = (pos.supplyUnderlying ?? 0) * price;
      return sum + supplyValue * (pos.collateralFactor ?? 0);
    }, 0);
    const liquidityUsd = data.liquidityUsd ?? data.liquidity;
    // When user hasn't entered markets or chain returns 0, liquidity is 0 but we still use theoretical limit from collateral
    const borrowLimit =
      typeof liquidityUsd === 'number' && liquidityUsd > 0
        ? totalBorrowed + liquidityUsd
        : borrowLimitFromPositions;
    // Use chain liquidity when > 0; otherwise fall back to theoretical (borrowLimit - totalBorrowed) so borrow works after supply
    const availableToBorrow =
      typeof liquidityUsd === 'number' && liquidityUsd > 0
        ? liquidityUsd
        : Math.max(0, borrowLimit - totalBorrowed);

    return {
      ...data,
      positions,
      totalSupplied,
      totalBorrowed,
      borrowLimit,
      availableToBorrow,
    };
  }

  /**
   * Get transaction events
   */
  async getEvents(
    contract?: string,
    event?: string,
    account?: string,
    fromBlock?: number,
    toBlock?: number,
    limit: number = 100
  ): Promise<TransactionEvent[]> {
    const params = new URLSearchParams();
    if (contract) params.append('contract', contract);
    if (event) params.append('event', event);
    if (account) params.append('account', account);
    if (fromBlock) params.append('fromBlock', fromBlock.toString());
    if (toBlock) params.append('toBlock', toBlock.toString());
    params.append('limit', limit.toString());

    const response = await apiClient.get('/events', { params });
    return response.data.items || [];
  }

  /**
   * Get market statistics
   */
  async getMarketStats(marketAddress: string): Promise<Record<string, unknown>> {
    const response = await apiClient.get(`/markets/${marketAddress}/stats`);
    return response.data;
  }

  /**
   * Get protocol contract addresses (comptroller for enterMarkets)
   */
  async getContractAddresses(): Promise<{ comptroller?: string | null }> {
    const response = await apiClient.get('/contracts/addresses');
    return response.data ?? {};
  }
}

export default new LendingAPIService();
