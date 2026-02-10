import React from 'react';
import type { Account } from '@/mining/services/api';

interface UserPortfolioProps {
  account: Account | null;
  loading: boolean;
  connected: boolean;
}

export const UserPortfolio: React.FC<UserPortfolioProps> = ({ account, loading, connected }) => {
  const formatValue = (value: number | null, decimals: number = 2): string => {
    if (value === null || value === undefined) return '-';
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(decimals)}`;
  };

  if (!connected) {
    return (
      <div className="text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
        <p className="text-gray-400 text-lg">Please connect your wallet to view your portfolio</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-gray-400">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
        <p className="text-gray-400 text-lg">Failed to load portfolio</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg p-6 border border-slate-600">
          <p className="text-sm text-gray-400 mb-2">Account Liquidity</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-white">
              {formatValue(account.liquidity, 2)}
            </h3>
            <span className={`text-sm font-medium ${account.isHealthy ? 'text-green-400' : 'text-red-400'}`}>
              {account.isHealthy ? '✓ Healthy' : '⚠ At Risk'}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg p-6 border border-slate-600">
          <p className="text-sm text-gray-400 mb-2">Shortfall</p>
          <h3 className="text-3xl font-bold text-white">
            {formatValue(account.shortfall, 2)}
          </h3>
        </div>

        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg p-6 border border-slate-600">
          <p className="text-sm text-gray-400 mb-2">Total Supplied Assets</p>
          <h3 className="text-3xl font-bold text-white">
            {account.positions.length > 0 ? account.positions.length : '0'}
          </h3>
          <p className="text-xs text-gray-400 mt-1">positions</p>
        </div>
      </div>

      {/* Positions Table */}
      {account.positions && account.positions.length > 0 ? (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 border-b border-slate-700">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-gray-300">Asset</th>
                  <th className="text-right px-6 py-4 font-semibold text-gray-300">Supply Balance</th>
                  <th className="text-right px-6 py-4 font-semibold text-gray-300">Borrow Balance</th>
                  <th className="text-right px-6 py-4 font-semibold text-gray-300">Price</th>
                  <th className="text-right px-6 py-4 font-semibold text-gray-300">Collateral Factor</th>
                </tr>
              </thead>
              <tbody>
                {account.positions.map((position) => (
                  <tr
                    key={position.market}
                    className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold">
                          {position.symbol?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{position.symbol || 'Unknown'}</p>
                          <p className="text-xs text-gray-400">{position.market.slice(0, 10)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right px-6 py-4">
                      <div className="text-white font-medium">
                        {position.supplyUnderlying !== null && position.supplyUnderlying !== undefined
                          ? `${(position.supplyUnderlying / 10 ** (position.decimals || 18)).toFixed(4)}`
                          : '0'}{' '}
                        {position.symbol}
                      </div>
                      <p className="text-xs text-gray-400">
                        {formatValue(
                          (position.supplyUnderlying || 0) * (position.price || 0) / 10 ** (position.decimals || 18),
                          2
                        )}
                      </p>
                    </td>
                    <td className="text-right px-6 py-4">
                      <div className="text-white font-medium">
                        {position.borrowBalance !== null && position.borrowBalance !== undefined
                          ? `${(position.borrowBalance / 10 ** (position.decimals || 18)).toFixed(4)}`
                          : '0'}{' '}
                        {position.symbol}
                      </div>
                      <p className="text-xs text-gray-400">
                        {formatValue(
                          (position.borrowBalance || 0) * (position.price || 0) / 10 ** (position.decimals || 18),
                          2
                        )}
                      </p>
                    </td>
                    <td className="text-right px-6 py-4 text-white font-medium">
                      ${(position.price || 0).toFixed(4)}
                    </td>
                    <td className="text-right px-6 py-4">
                      <span className="text-white font-medium">
                        {position.collateralFactor !== null && position.collateralFactor !== undefined
                          ? `${(position.collateralFactor / 1e16).toFixed(0)}%`
                          : '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
          <p className="text-gray-400 text-lg">No positions yet</p>
        </div>
      )}
    </div>
  );
};
