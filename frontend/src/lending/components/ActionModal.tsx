import { useState, useEffect } from 'react';
import type { LendingMarket, LendingAction } from '../types';
import Web3Service from '../services/web3';
import API from '../services/api';
import { formatPct } from '../utils';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  action: LendingAction;
  market: LendingMarket | null;
  onSuccess: () => void | Promise<void>;
  maxAmount?: string;
  comptrollerAddress?: string | null;
};

const LABELS: Record<LendingAction, string> = {
  supply: 'Supply',
  withdraw: 'Withdraw',
  borrow: 'Borrow',
  repay: 'Repay',
};

export function ActionModal({
  isOpen,
  onClose,
  action,
  market,
  onSuccess,
  maxAmount = '0',
  comptrollerAddress,
}: Props) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setError(null);
      setTxHash(null);
    }
  }, [isOpen]);

  if (!isOpen || !market) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTxHash(null);
    const num = parseFloat(amount);
    if (!amount || num <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    setLoading(true);
    try {
      // Ensure we have comptroller for supply so enterMarkets runs (supply then counts as collateral for borrow)
      let compAddress = comptrollerAddress;
      if (action === 'supply' && !compAddress) {
        const addrs = await API.getContractAddresses().catch(() => ({}));
        compAddress = addrs.comptroller ?? null;
      }
      let hash: string;
      switch (action) {
        case 'supply':
          hash = await Web3Service.supply(market.market, amount, market.underlying ?? '', compAddress);
          break;
        case 'withdraw':
          hash = await Web3Service.withdraw(market.market, amount, true);
          break;
        case 'borrow':
          hash = await Web3Service.borrow(market.market, amount);
          break;
        case 'repay':
          hash = await Web3Service.repay(market.market, amount, market.underlying);
          break;
        default:
          throw new Error('Unknown action');
      }
      setTxHash(hash);
      await Promise.resolve(onSuccess());
      await new Promise((r) => setTimeout(r, 500));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const isSupplyOrWithdraw = action === 'supply' || action === 'withdraw';
  const rate = isSupplyOrWithdraw ? market.supplyRatePerYear : market.borrowRatePerYear;
  const ratePct = rate != null ? formatPct(rate) : '0.00';
  const cfPct = (market.collateralFactor ?? 0) * 100;
  const utilPct = ((market.utilization ?? 0) * 100).toFixed(2);

  const canBorrow = action !== 'borrow' || parseFloat(maxAmount) > 0;

  const submitBtnClass = {
    supply: 'bg-teal-600 hover:bg-teal-500',
    withdraw: 'bg-red-600 hover:bg-red-500',
    borrow: 'bg-amber-600 hover:bg-amber-500',
    repay: 'bg-teal-600 hover:bg-teal-500',
  }[action];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-700/80 bg-zinc-900 p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {LABELS[action]} {market.symbol}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {txHash ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium text-white">Transaction successful</p>
            <p className="mt-1 text-xs text-zinc-500 font-mono">{txHash.slice(0, 10)}...{txHash.slice(-8)}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-800 py-3 pl-4 pr-24 text-white placeholder-zinc-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="0"
                  disabled={loading}
                />
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAmount(maxAmount)}
                    className="rounded bg-zinc-600 px-2 py-1 text-xs text-white hover:bg-zinc-500 disabled:opacity-50"
                    disabled={loading}
                  >
                    MAX
                  </button>
                  <span className="text-sm text-zinc-500">{market.symbol}</span>
                </div>
              </div>
              {maxAmount && parseFloat(maxAmount) > 0 && (
                <p className="mt-1 text-xs text-zinc-500">
                  Available: {parseFloat(maxAmount).toFixed(4)} {market.symbol}
                </p>
              )}
              {action === 'borrow' && parseFloat(maxAmount) <= 0 && (
                <p className="mt-1 text-xs text-amber-400">
                  No borrow limit. Supply assets first, then enable them as collateral on the Positions page.
                </p>
              )}
            </div>

            <div className="mb-4 rounded-lg border border-zinc-700/80 bg-zinc-800/60 p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">{isSupplyOrWithdraw ? 'Supply APY' : 'Borrow APY'}</span>
                <span className={isSupplyOrWithdraw ? 'text-emerald-400' : 'text-amber-400'}>{ratePct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Collateral Factor</span>
                <span className="text-zinc-300">{cfPct.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Utilization</span>
                <span className="text-zinc-300">{utilPct}%</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 max-w-full overflow-hidden rounded-lg border border-red-500/50 bg-red-950/30 px-3 py-2 text-sm text-red-300 break-words break-all whitespace-pre-wrap">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-zinc-600 bg-zinc-800 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex-1 rounded-lg py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 ${submitBtnClass}`}
                disabled={loading || !canBorrow}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing
                  </span>
                ) : (
                  LABELS[action]
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
