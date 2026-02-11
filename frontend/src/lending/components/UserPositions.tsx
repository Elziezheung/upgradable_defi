import { useState, useEffect, useRef } from 'react';
import type { AccountData, UserPosition, LendingMarket } from '../types';
import { formatPct, getPrice, formatUsd, shortAddress, getPositionBalance } from '../utils';
import Web3Service from '../services/web3';

type Props = {
  account: AccountData | null;
  loading: boolean;
  connected: boolean;
  markets?: LendingMarket[];
  onWithdraw: (p: UserPosition) => void;
  onRepay: (p: UserPosition) => void;
  comptrollerAddress?: string | null;
  onRefetch?: () => void | Promise<void>;
};

function useSummary(positions: UserPosition[], liquidityUsd: number | undefined) {
  const totalSupplied = positions.reduce((s, p) => s + getPositionBalance(p, 'supplyUnderlying') * getPrice(p), 0);
  const totalBorrowed = positions.reduce((s, p) => s + getPositionBalance(p, 'borrowBalance') * getPrice(p), 0);
  const borrowLimitFromCf = positions.reduce(
    (s, p) => s + getPositionBalance(p, 'supplyUnderlying') * getPrice(p) * (p.collateralFactor ?? 0),
    0
  );
  // When liquidity is 0 (not entered markets), show theoretical limit from collateral so user sees e.g. $500
  const borrowLimit =
    typeof liquidityUsd === 'number' && liquidityUsd > 0
      ? totalBorrowed + liquidityUsd
      : borrowLimitFromCf;
  return { totalSupplied, totalBorrowed, borrowLimit };
}

function PositionTable({
  title,
  positions,
  markets,
  type,
  onAction,
  actionLabel,
  actionClass,
  valueKey,
  apyKey,
}: {
  title: string;
  positions: UserPosition[];
  markets?: LendingMarket[] | null;
  type: 'supply' | 'borrow';
  onAction: (p: UserPosition) => void;
  actionLabel: string;
  actionClass: string;
  valueKey: 'supplyUnderlying' | 'borrowBalance';
  apyKey: 'supplyRatePerYear' | 'borrowRatePerYear';
}) {
  const getApy = (p: UserPosition) => {
    const onPos = (p as Record<string, number>)[apyKey] ?? (p as Record<string, number>).supplyRatePerYear ?? (p as Record<string, number>).borrowRatePerYear ?? (p as Record<string, number>).supplyAPY ?? (p as Record<string, number>).borrowAPY;
    if (onPos != null && Number.isFinite(onPos)) return onPos;
    const m = markets?.find((x) => x.market?.toLowerCase() === p.market?.toLowerCase());
    return m ? (m as Record<string, number>)[apyKey] : undefined;
  };

  return (
    <section>
      <h3 className="text-lg font-semibold text-zinc-200 mb-3">{title}</h3>
      <div className="rounded-xl border border-zinc-700/80 overflow-hidden bg-zinc-900/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-700/80 bg-zinc-800/80 text-zinc-400 text-left">
              <th className="px-4 py-3 font-medium">Asset</th>
              <th className="px-4 py-3 text-right font-medium">Balance</th>
              <th className="px-4 py-3 text-right font-medium">Value</th>
              <th className="px-4 py-3 text-right font-medium">APY</th>
              {type === 'supply' && (
                <th className="px-4 py-3 text-right font-medium">Collateral</th>
              )}
              <th className="px-4 py-3 text-right font-medium w-24">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700/60">
            {positions.map((p) => {
              const balance = valueKey === 'supplyUnderlying' ? (p.supplyUnderlying ?? 0) : (p.borrowBalance ?? 0);
              const price = getPrice(p);
              const value = balance * price;
              const apy = getApy(p);
              return (
                <tr key={p.market} className="hover:bg-zinc-800/50">
                  <td className="px-4 py-3 font-medium text-white">{p.symbol}</td>
                  <td className="px-4 py-3 text-right text-zinc-200">
                    {balance.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-200">{formatUsd(value)}</td>
                  <td className={`px-4 py-3 text-right ${type === 'supply' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {formatPct(apy)}%
                  </td>
                  {type === 'supply' && (
                    <td className="px-4 py-3 text-right text-zinc-400">
                      {((p.collateralFactor ?? 0) * 100).toFixed(0)}%
                    </td>
                  )}
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onAction(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${actionClass}`}
                    >
                      {actionLabel}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function UserPositions({
  account,
  loading,
  connected,
  markets = [],
  onWithdraw,
  onRepay,
  comptrollerAddress,
  onRefetch,
}: Props) {
  const [entering, setEntering] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refetch when user lands on positions tab, and poll once more after delay so balance/value/APY are fresh
  useEffect(() => {
    if (!connected || !onRefetch) return;
    onRefetch();
    pollRef.current = setTimeout(() => {
      onRefetch();
      pollRef.current = null;
    }, 2500);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [connected, onRefetch]);

  const handleEnterMarkets = async () => {
    if (!comptrollerAddress || !account || !onRefetch) return;
    const markets = account.positions.filter((p) => getPositionBalance(p, 'supplyUnderlying') > 0).map((p) => p.market);
    if (markets.length === 0) return;
    setEntering(true);
    try {
      await Web3Service.enterMarkets(comptrollerAddress, markets);
      await onRefetch();
    } finally {
      setEntering(false);
    }
  };

  if (!connected) {
    return (
      <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/60 p-12 text-center">
        <p className="text-zinc-400">Please connect your wallet first</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/60 p-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
        <p className="mt-3 text-zinc-400">Loading positions...</p>
      </div>
    );
  }

  if (!account || !account.positions?.length) {
    return (
      <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/60 p-12 text-center">
        <p className="text-zinc-400">No positions yet</p>
      </div>
    );
  }

  const supplyPositions = account.positions.filter((p) => getPositionBalance(p, 'supplyUnderlying') > 0);
  const borrowPositions = account.positions.filter((p) => getPositionBalance(p, 'borrowBalance') > 0);
  const liquidityUsd = (account as { liquidityUsd?: number }).liquidityUsd ?? account.liquidity;
  const summary = useSummary(account.positions, liquidityUsd);
  // Always show when user has supply; enterMarkets is idempotent (no-op if already entered)
  const showEnterMarkets = supplyPositions.length > 0 && comptrollerAddress && onRefetch;

  return (
    <div className="space-y-6">
      <p className="text-zinc-500 text-sm">
        Address: <span className="font-mono text-zinc-300">{shortAddress(account.account)}</span>
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/60 p-4">
          <div className="text-zinc-500 text-xs mb-0.5">Total Supplied (USD)</div>
          <div className="text-xl font-semibold text-white">{formatUsd(summary.totalSupplied)}</div>
        </div>
        <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/60 p-4">
          <div className="text-zinc-500 text-xs mb-0.5">Total Borrowed (USD)</div>
          <div className="text-xl font-semibold text-white">{formatUsd(summary.totalBorrowed)}</div>
        </div>
        <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/60 p-4">
          <div className="text-zinc-500 text-xs mb-0.5">Borrow Limit</div>
          <div className="text-xl font-semibold text-white">{formatUsd(summary.borrowLimit)}</div>
        </div>
        <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/60 p-4">
          <div className="text-zinc-500 text-xs mb-0.5">Health</div>
          <div
            className={`text-xl font-semibold ${account.isHealthy ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {account.isHealthy ? 'Healthy' : 'At Risk'}
          </div>
        </div>
      </div>

      {showEnterMarkets && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-700/50 bg-amber-950/30 px-4 py-3 text-amber-200 text-sm">
          <span>Supply is not used as collateral yet. Enable it to borrow and show your limit.</span>
          <button
            type="button"
            onClick={handleEnterMarkets}
            disabled={entering}
            className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            {entering ? 'Processing...' : 'Enable as Collateral'}
          </button>
        </div>
      )}

      {supplyPositions.length > 0 && (
        <PositionTable
          title="Supply Positions"
          positions={supplyPositions}
          markets={markets}
          type="supply"
          valueKey="supplyUnderlying"
          apyKey="supplyRatePerYear"
          onAction={onWithdraw}
          actionLabel="Withdraw"
          actionClass="bg-red-600/90 hover:bg-red-500 text-white"
        />
      )}

      {borrowPositions.length > 0 && (
        <PositionTable
          title="Borrow Positions"
          positions={borrowPositions}
          markets={markets}
          type="borrow"
          valueKey="borrowBalance"
          apyKey="borrowRatePerYear"
          onAction={onRepay}
          actionLabel="Repay"
          actionClass="bg-teal-600/90 hover:bg-teal-500 text-white"
        />
      )}

      {supplyPositions.length === 0 && borrowPositions.length === 0 && (
        <p className="text-zinc-500 text-sm text-center py-6">No supply or borrow positions yet</p>
      )}
    </div>
  );
}
