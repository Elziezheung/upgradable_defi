/**
 * Lending Hooks
 * React hooks for lending data fetching and wallet connection
 */
import { useState, useCallback, useEffect } from 'react';
import API from '../services/api';
import Web3Service from '../services/web3';
import type { LendingMarket, AccountData, TransactionEvent } from '../types';

/**
 * Hook for fetching lending markets
 */
export const useMarkets = () => {
  const [markets, setMarkets] = useState<LendingMarket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await API.getMarkets();
      setMarkets(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch markets';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkets();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMarkets, 30000);
    return () => clearInterval(interval);
  }, [fetchMarkets]);

  return { markets, loading, error, refetch: fetchMarkets };
};

/**
 * Hook for fetching account data
 */
export const useAccount = (address: string | null) => {
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccount = useCallback(async () => {
    if (!address) {
      setAccount(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const data = await API.getAccount(address);
      setAccount(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch account';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      fetchAccount();
      // Refresh every 15 seconds when connected
      const interval = setInterval(fetchAccount, 15000);
      return () => clearInterval(interval);
    }
    setAccount(null);
    setLoading(false);
    setError(null);
    return undefined;
  }, [address, fetchAccount]);

  return { account, loading, error, refetch: fetchAccount };
};

/**
 * Hook for wallet connection
 */
export const useWallet = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const address = await Web3Service.connect();
      setAccount(address);
      setIsConnected(true);

      // Get chain ID
      if (window.ethereum) {
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        setChainId(parseInt(chainIdHex as string, 16));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await Web3Service.disconnect();
    setAccount(null);
    setIsConnected(false);
    setChainId(null);
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return undefined;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      setChainId(parseInt(chainIdHex, 16));
      window.location.reload();
    };

    window.ethereum?.on?.('accountsChanged', handleAccountsChanged);
    window.ethereum?.on?.('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [account, disconnect]);

  return {
    account,
    isConnected,
    chainId,
    loading,
    error,
    connect,
    disconnect,
  };
};

/**
 * Hook for transaction events
 */
export const useTransactions = (account: string | null, limit: number = 50) => {
  const [transactions, setTransactions] = useState<TransactionEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!account) {
      setTransactions([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const events = await API.getEvents(undefined, undefined, account, undefined, undefined, limit);
      setTransactions(events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [account, limit]);

  useEffect(() => {
    if (account) {
      fetchTransactions();
      // Refresh every 30 seconds
      const interval = setInterval(fetchTransactions, 30000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [account, fetchTransactions]);

  return { transactions, loading, error, refetch: fetchTransactions };
};

/**
 * Hook for health status
 */
interface HealthStatus {
  chainId: number;
  latestBlock: number;
  indexedToBlock: number;
}

export const useHealth = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await API.getHealth();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    // Refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  return { health, loading, error, refetch: fetchHealth };
};
