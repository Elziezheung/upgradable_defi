import { useState, useCallback, useEffect } from 'react';
import API from '@/mining/services/api';
export const useMarkets = () => {
    const [markets, setMarkets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetchMarkets = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await API.getMarkets();
            setMarkets(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch markets');
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchMarkets();
    }, [fetchMarkets]);
    return { markets, loading, error, refetch: fetchMarkets };
};
export const useAccount = (address) => {
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetchAccount = useCallback(async () => {
        if (!address)
            return;
        setLoading(true);
        setError(null);
        try {
            const data = await API.getAccount(address);
            setAccount(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch account');
        }
        finally {
            setLoading(false);
        }
    }, [address]);
    useEffect(() => {
        if (address) {
            fetchAccount();
        }
    }, [address, fetchAccount]);
    return { account, loading, error, refetch: fetchAccount };
};
export const useHealth = () => {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetchHealth = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await API.getHealth();
            setHealth(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch health');
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [fetchHealth]);
    return { health, loading, error, refetch: fetchHealth };
};
