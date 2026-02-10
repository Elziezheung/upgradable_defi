/**
 * Action Modal Component
 * Generic modal for lending actions (supply, withdraw, borrow, repay)
 */
import React, { useState, useEffect } from 'react';
import type { LendingMarket, LendingAction } from '../types';
import Web3Service from '../services/web3';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: LendingAction;
  market: LendingMarket | null;
  onSuccess: () => void;
  maxAmount?: string;
}

export const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  onClose,
  action,
  market,
  onSuccess,
  maxAmount = '0',
}) => {
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

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      let hash: string;
      
      switch (action) {
        case 'supply':
          hash = await Web3Service.supply(market.market, amount, market.underlying);
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
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMaxClick = () => {
    setAmount(maxAmount);
  };

  const actionText = {
    supply: 'Supply',
    withdraw: 'Withdraw',
    borrow: 'Borrow',
    repay: 'Repay',
  };

  const actionColor = {
    supply: 'green',
    withdraw: 'red',
    borrow: 'blue',
    repay: 'yellow',
  };

  const color = actionColor[action];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {actionText[action]} {market.symbol}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {txHash ? (
          <div className="text-center py-8">
            <div className="mb-4 text-green-400">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Transaction Successful!</h3>
            <p className="text-gray-400 text-sm mb-4">
              Tx Hash: {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 pr-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0"
                  disabled={loading}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleMaxClick}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                    disabled={loading}
                  >
                    MAX
                  </button>
                  <span className="text-gray-400 text-sm">{market.symbol}</span>
                </div>
              </div>
              {maxAmount && parseFloat(maxAmount) > 0 && (
                <p className="mt-1 text-xs text-gray-400">
                  Available: {parseFloat(maxAmount).toFixed(4)} {market.symbol}
                </p>
              )}
            </div>

            {/* Market Info */}
            <div className="mb-6 bg-slate-700 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  {action === 'supply' || action === 'withdraw' ? 'Supply APY' : 'Borrow APY'}
                </span>
                <span className={`font-medium ${action === 'supply' || action === 'withdraw' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {action === 'supply' || action === 'withdraw'
                    ? (market.supplyRatePerYear * 100).toFixed(2)
                    : (market.borrowRatePerYear * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Collateral Factor</span>
                <span className="text-white">{(market.collateralFactor * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Utilization</span>
                <span className="text-white">{(market.utilization * 100).toFixed(2)}%</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-red-500 bg-opacity-10 border border-red-500 text-red-500 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex-1 px-4 py-3 bg-${color}-600 hover:bg-${color}-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Processing...
                  </span>
                ) : (
                  actionText[action]
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
