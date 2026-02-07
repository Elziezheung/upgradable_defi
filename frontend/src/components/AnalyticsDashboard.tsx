import React from 'react';
import type { Market } from '@/services/api';

interface AnalyticsDashboardProps {
  markets: Market[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ markets }) => {
  // Calculate analytics
  const topYieldPools = [...markets]
    .sort((a, b) => (b.supplyRatePerYear || 0) - (a.supplyRatePerYear || 0))
    .slice(0, 5);

  const highUtilizationPools = [...markets]
    .filter((m) => (m.utilization || 0) > 0.8)
    .sort((a, b) => (b.utilization || 0) - (a.utilization || 0));

  const totalBorrows = markets.reduce((sum, m) => sum + (m.totalBorrows || 0), 0);
  const totalSupply = markets.reduce((sum, m) => sum + (m.totalSupply || 0), 0);
  const avgUtilization = markets.length > 0
    ? markets.reduce((sum, m) => sum + (m.utilization || 0), 0) / markets.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg p-6 border border-slate-600">
          <p className="text-sm text-gray-400 mb-2">Total Supplied</p>
          <h3 className="text-2xl font-bold text-white">
            ${(totalSupply / 1e6).toFixed(2)}M
          </h3>
        </div>

        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg p-6 border border-slate-600">
          <p className="text-sm text-gray-400 mb-2">Total Borrowed</p>
          <h3 className="text-2xl font-bold text-white">
            ${(totalBorrows / 1e6).toFixed(2)}M
          </h3>
        </div>

        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg p-6 border border-slate-600">
          <p className="text-sm text-gray-400 mb-2">Avg Utilization</p>
          <h3 className="text-2xl font-bold text-white">
            {(avgUtilization * 100).toFixed(1)}%
          </h3>
        </div>

        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg p-6 border border-slate-600">
          <p className="text-sm text-gray-400 mb-2">Active Pools</p>
          <h3 className="text-2xl font-bold text-white">{markets.length}</h3>
        </div>
      </div>

      {/* Top Yield Pools */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">🔥 Highest Yield Pools</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {topYieldPools.map((pool) => (
            <div
              key={pool.market}
              className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg p-4 border border-slate-600"
            >
              <p className="text-sm text-gray-400 mb-2">{pool.symbol}</p>
              <p className="text-2xl font-bold text-green-400 mb-3">
                {((pool.supplyRatePerYear || 0) * 100).toFixed(2)}%
              </p>
              <p className="text-xs text-gray-400">APR</p>
            </div>
          ))}
        </div>
      </div>

      {/* High Utilization Warning */}
      {highUtilizationPools.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">⚠️ High Utilization Pools</h3>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="space-y-2">
              {highUtilizationPools.map((pool) => (
                <div key={pool.market} className="flex items-center justify-between">
                  <span className="text-yellow-400 font-medium">{pool.symbol}</span>
                  <span className="text-yellow-400 font-bold">
                    {((pool.utilization || 0) * 100).toFixed(1)}% utilized
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Market Distribution */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">📊 Supply Distribution</h3>
        <div className="space-y-3">
          {markets.slice(0, 8).map((pool) => {
            const percentage = totalSupply > 0
              ? ((pool.totalSupply || 0) / totalSupply) * 100
              : 0;
            return (
              <div key={pool.market} className="flex items-center gap-4">
                <span className="text-white w-20 flex-shrink-0">{pool.symbol}</span>
                <div className="flex-grow bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="text-gray-400 text-sm w-16 text-right">{percentage.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
