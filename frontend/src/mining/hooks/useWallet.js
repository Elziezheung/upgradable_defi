import { useState, useCallback } from 'react';
export const useWallet = () => {
    const [wallet, setWallet] = useState({
        account: null,
        isConnected: false,
        chainId: null,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const connect = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask is not installed');
            }
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });
            const chainId = await window.ethereum.request({
                method: 'eth_chainId',
            });
            setWallet({
                account: accounts[0],
                isConnected: true,
                chainId: parseInt(chainId, 16),
            });
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to connect wallet');
        }
        finally {
            setLoading(false);
        }
    }, []);
    const disconnect = useCallback(() => {
        setWallet({
            account: null,
            isConnected: false,
            chainId: null,
        });
    }, []);
    return { wallet, connect, disconnect, loading, error };
};
