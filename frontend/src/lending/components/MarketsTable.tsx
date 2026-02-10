import { useState, useMemo } from 'react';
import type { LendingMarket } from '../types';
import { formatPct, getPrice } from '../utils';

type Props = {
  markets: LendingMarket[];
  loading: boolean;
  onSupply: (m: LendingMarket) => void;
  onBorrow: (m: LendingMarket) => void;
};

type SortKey = 'symbol' | 'totalSupplyUsd' | 'supplyAPY' | 'borrowAPY';

export function MarketsTable({ markets, loading, onSupply, onBorrow }: Props) {
  const [sortBy, setSortBy] = useState<SortKey>('symbol');
  const [desc, setDesc] = useState(true);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setDesc((d) => !d);
    else {
      setSortBy(key);
      setDesc(true);
    }
  };

  const sorted = useMemo(() => {
    return [...markets].sort((a, b) => {
      const priceA = getPrice(a);
      const priceB = getPrice(b);
      const supplyA = (a as { totalSupplyUsd?: number }).totalSupplyUsd ?? (a.totalSupply ?? 0) * priceA;
      const supplyB = (b as { totalSupplyUsd?: number }).totalSupplyUsd ?? (b.totalSupply ?? 0) * priceB;
      const supplyAprA = (a as { supplyAprPct?: number }).supplyAprPct ?? a.supplyRatePerYear ?? 0;
      const supplyAprB = (b as { supplyAprPct?: number }).supplyAprPct ?? b.supplyRatePerYear ?? 0;
      const borrowAprA = (a as { borrowAprPct?: number }).borrowAprPct ?? a.borrowRatePerYear ?? 0;
      const borrowAprB = (b as { borrowAprPct?: number }).borrowAprPct ?? b.borrowRatePerYear ?? 0;

      let cmp = 0;
      switch (sortBy) {
        case 'symbol':
          cmp = (a.symbol ?? '').localeCompare(b.symbol ?? '');
          break;
        case 'totalSupplyUsd':
          cmp = supplyA - supplyB;
          break;
        case 'supplyAPY':
          cmp = supplyAprA - supplyAprB;
          break;
        case 'borrowAPY':
          cmp = borrowAprA - borrowAprB;
          break;
      }
      return desc ? -cmp : cmp;
    });
  }, [markets, sortBy, desc]);

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/60 flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
        <span className="ml-3 text-zinc-400">Loading markets...</span>
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/60 p-12 text-center text-zinc-400">
        No markets available
      </div>
    );
  }

  const hasData = markets.some((m) => m.symbol != null || m.totalSupply != null || getPrice(m) > 0);

  const Th = ({
    label,
    keyName,
    align = 'left',
  }: {
    label: string;
    keyName: SortKey;
    align?: 'left' | 'right';
  }) => (
    <th
      className={`px-4 py-3 font-medium text-zinc-400 cursor-pointer hover:text-zinc-200 ${align === 'right' ? 'text-right' : 'text-left'}`}
      onClick={() => toggleSort(keyName)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortBy === keyName && <span className="text-teal-400">{desc ? '↓' : '↑'}</span>}
      </span>
    </th>
  );

  return (
    <div className="space-y-3">
      {!hasData && (
        <div className="rounded-xl border border-amber-700/50 bg-amber-950/30 px-4 py-3 text-amber-200 text-sm">
          Chain data missing. Please ensure Anvil is running and contracts are deployed, then restart the backend.
        </div>
      )}
      <div className="rounded-xl border border-zinc-700/80 overflow-hidden bg-zinc-900/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-700/80 bg-zinc-800/80">
              <Th label="Asset" keyName="symbol" />
              <Th label="Total Supply (USD)" keyName="totalSupplyUsd" align="right" />
              <th className="px-4 py-3 text-right font-medium text-zinc-400">Total Borrows</th>
              <Th label="Supply APY" keyName="supplyAPY" align="right" />
              <Th label="Borrow APY" keyName="borrowAPY" align="right" />
              <th className="px-4 py-3 text-right font-medium text-zinc-400">Utilization</th>
              <th className="px-4 py-3 text-center font-medium text-zinc-400 w-40">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700/60">
            {sorted.map((m) => {
              const price = getPrice(m);
              const totalSupply = m.totalSupply ?? (m as { totalSupplyUnderlying?: number }).totalSupplyUnderlying ?? 0;
              const totalBorrows = m.totalBorrows ?? (m as { totalBorrowsUnderlying?: number }).totalBorrowsUnderlying ?? 0;
              const supplyUsd = (m as { totalSupplyUsd?: number }).totalSupplyUsd ?? totalSupply * price;
              const borrowsUsd = (m as { totalBorrowsUsd?: number }).totalBorrowsUsd ?? totalBorrows * price;
              const supplyApr = (m as { supplyAprPct?: number }).supplyAprPct ?? m.supplyRatePerYear;
              const borrowApr = (m as { borrowAprPct?: number }).borrowAprPct ?? m.borrowRatePerYear;
              const util = (m.utilization ?? 0) * 100;
              const symbol = m.symbol ?? '—';
              const abbr = symbol.length >= 2 ? symbol.slice(0, 2) : (m.market?.slice(2, 4) ?? '—');

              return (
                <tr key={m.market ?? symbol} className="hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-semibold text-sm">
                        {abbr}
                      </div>
                      <div>
                        <div className="font-medium text-white">{symbol}</div>
                        <div className="text-xs text-zinc-500">{m.market?.slice(0, 10)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-200">
                    ${supplyUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-200">
                    ${borrowsUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-400">{formatPct(supplyApr)}%</td>
                  <td className="px-4 py-3 text-right text-amber-400">{formatPct(borrowApr)}%</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-14 h-1.5 rounded-full bg-zinc-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-teal-500/80"
                          style={{ width: `${Math.min(100, util)}%` }}
                        />
                      </div>
                      <span className="text-zinc-400 w-10">{util.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-center">
                      <button
                        type="button"
                        onClick={() => onSupply(m)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-600/90 hover:bg-teal-500 text-white transition-colors"
                      >
                        Supply
                      </button>
                      <button
                        type="button"
                        onClick={() => onBorrow(m)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-600 hover:bg-zinc-500 text-white transition-colors"
                      >
                        Borrow
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
