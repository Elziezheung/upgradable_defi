/**
 * Stake & Rewards
 * Stake dTokens in LiquidityMining to earn GOV; withdraw and claim rewards.
 */
import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Web3Service from '../services/web3';
import type { LiquidityMiningPool, LiquidityMiningAccountPosition } from '../services/api';

interface StakeRewardsProps {
  account: string | null;
  isConnected: boolean;
  onSuccess?: () => void;
}

export const StakeRewards: React.FC<StakeRewardsProps> = ({
  account,
  isConnected,
  onSuccess,
}) => {
  const [pools, setPools] = useState<LiquidityMiningPool[]>([]);
  const [positions, setPositions] = useState<LiquidityMiningAccountPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stakeAmounts, setStakeAmounts] = useState<Record<string, string>>({});
  const [withdrawAmounts, setWithdrawAmounts] = useState<Record<string, string>>({});
  const [loadingTx, setLoadingTx] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [poolsRes, positionsRes] = await Promise.all([
        API.getLiquidityMining(),
        account ? API.getLiquidityMiningAccount(account) : Promise.resolve([]),
      ]);
      setPools(poolsRes);
      setPositions(positionsRes);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [account]);

  const getPosition = (miningAddress: string) =>
    positions.find((p) => p.mining?.toLowerCase() === miningAddress?.toLowerCase());

  const handleStake = async (miningAddress: string) => {
    const amount = stakeAmounts[miningAddress];
    if (!amount || parseFloat(amount) <= 0) return;
    setLoadingTx(miningAddress);
    setTxHash(null);
    try {
      const hash = await Web3Service.stake(miningAddress, amount);
      setTxHash(hash);
      setStakeAmounts((s) => ({ ...s, [miningAddress]: '' }));
      await fetchData();
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Stake failed');
    } finally {
      setLoadingTx(null);
    }
  };

  const handleWithdraw = async (miningAddress: string) => {
    const amount = withdrawAmounts[miningAddress];
    if (!amount || parseFloat(amount) <= 0) return;
    setLoadingTx(miningAddress);
    setTxHash(null);
    try {
      const hash = await Web3Service.withdraw(miningAddress, amount);
      setTxHash(hash);
      setWithdrawAmounts((w) => ({ ...w, [miningAddress]: '' }));
      await fetchData();
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Withdraw failed');
    } finally {
      setLoadingTx(null);
    }
  };

  const handleClaim = async (miningAddress: string) => {
    setLoadingTx(miningAddress);
    setTxHash(null);
    try {
      const hash = await Web3Service.getReward(miningAddress);
      setTxHash(hash);
      await fetchData();
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Claim failed');
    } finally {
      setLoadingTx(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
        <p className="text-gray-400">Please connect your wallet first to stake dToken or claim GOV.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchData}
          className="mt-2 px-4 py-2 rounded-lg bg-slate-600 text-white text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (pools.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
        <p className="text-gray-400">No liquidity mining pools available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Stake dToken to Earn GOV</h2>
        <p className="text-gray-400 text-sm">
          Stake dTokens from lending markets (e.g. dUSDC, dWETH) in the mining contract to earn governance tokens (GOV) on a time-weighted basis.
        </p>
      </div>

      {txHash && (
        <p className="text-green-400 text-sm">Recent tx: {txHash.slice(0, 16)}...</p>
      )}

      <div className="space-y-4">
        {pools.map((pool) => {
          const pos = getPosition(pool.mining);
          const staked = pos?.stakedBalance ?? 0;
          const earned = pos?.earned ?? 0;
          const stakeAmt = stakeAmounts[pool.mining] ?? '';
          const withdrawAmt = withdrawAmounts[pool.mining] ?? '';
          const busy = loadingTx === pool.mining;

          return (
            <div
              key={pool.mining}
              className="bg-slate-800 rounded-lg border border-slate-700 p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {pool.stakingSymbol ?? 'dToken'} → {pool.rewardsSymbol ?? 'GOV'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{pool.mining?.slice(0, 10)}...</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Staked: </span>
                    <span className="text-white font-medium">{staked.toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Earned: </span>
                    <span className="text-green-400 font-medium">{earned.toFixed(4)} GOV</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs text-gray-400 mb-1">Stake Amount</label>
                  <input
                    type="text"
                    value={stakeAmt}
                    onChange={(e) =>
                      setStakeAmounts((s) => ({ ...s, [pool.mining]: e.target.value }))
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm"
                  />
                </div>
                <button
                  type="button"
                  disabled={busy || !stakeAmt || parseFloat(stakeAmt) <= 0}
                  onClick={() => handleStake(pool.mining)}
                  className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-sm font-medium"
                >
                  {busy ? '...' : 'Stake'}
                </button>

                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs text-gray-400 mb-1">Withdraw Amount</label>
                  <input
                    type="text"
                    value={withdrawAmt}
                    onChange={(e) =>
                      setWithdrawAmounts((w) => ({ ...w, [pool.mining]: e.target.value }))
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm"
                  />
                </div>
                <button
                  type="button"
                  disabled={busy || !withdrawAmt || parseFloat(withdrawAmt) <= 0}
                  onClick={() => handleWithdraw(pool.mining)}
                  className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white text-sm font-medium"
                >
                  {busy ? '...' : 'Withdraw'}
                </button>

                <button
                  type="button"
                  disabled={busy || earned <= 0}
                  onClick={() => handleClaim(pool.mining)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium"
                >
                  {busy ? '...' : 'Claim GOV'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
