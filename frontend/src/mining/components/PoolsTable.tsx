import React, { useMemo, useState, useEffect } from 'react';
import type { Market } from '@/mining/services/api';
import Web3Service from '@/mining/services/web3';

interface PoolsTableProps {
  markets: Market[];
  loading: boolean;
}

export const PoolsTable: React.FC<PoolsTableProps> = ({ markets, loading }) => {
  const [sortKey, setSortKey] = useState<keyof Market>('totalSupply');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [supplyAmount, setSupplyAmount] = useState('');
  const [userBalance, setUserBalance] = useState<string>('0');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSupplying, setIsSupplying] = useState(false);

  const sortedMarkets = useMemo(() => {
    const sorted = [...markets].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      const comparison = aVal > bVal ? 1 : -1;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [markets, sortKey, sortOrder]);

  const handleSort = (key: keyof Market) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  // Fetch user's balance when modal opens
  useEffect(() => {
    if (isModalOpen && selectedMarket?.underlying && Web3Service.getAccount()) {
      Web3Service.getTokenBalance(selectedMarket.underlying).then(balance => {
        if (selectedMarket.decimals) {
          const formatted = Number(balance) / (10 ** selectedMarket.decimals);
          setUserBalance(formatted.toFixed(2));
        }
      });
    }
  }, [isModalOpen, selectedMarket]);

  const formatValue = (value: number | null, decimals: number = 2): string => {
    if (value === null || value === undefined) return '-';
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(decimals)}`;
  };

  const formatSupplyValue = (supply: number | null, price: number | null, decimals: number | null): string => {
    if (supply === null || price === null || decimals === null) return '-';
    const supplyValue = (supply * price) / Math.pow(10, decimals + 8); // price is in 8 decimals
    return formatValue(supplyValue, decimals);
  };

  const formatRate = (value: number | null): string => {
    if (value === null || value === undefined) return '-';
    // Convert from ray (1e18) to percentage
    const rateInPercent = (value / 1e18) * 100;
    return `${rateInPercent.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-gray-400">Loading pools...</p>
        </div>
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No pools available</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 border-b border-slate-700">
            <tr>
              <th className="text-left px-6 py-4 font-semibold text-gray-300">Pool</th>
              <th
                className="text-right px-6 py-4 font-semibold text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('totalSupply')}
              >
                <div className="flex items-center justify-end gap-2">
                  TVL
                  {sortKey === 'totalSupply' && (
                    <span className="text-pink-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                className="text-right px-6 py-4 font-semibold text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('supplyRatePerYear')}
              >
                <div className="flex items-center justify-end gap-2">
                  Supply APR
                  {sortKey === 'supplyRatePerYear' && (
                    <span className="text-pink-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                className="text-right px-6 py-4 font-semibold text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('borrowRatePerYear')}
              >
                <div className="flex items-center justify-end gap-2">
                  Borrow APR
                  {sortKey === 'borrowRatePerYear' && (
                    <span className="text-pink-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                className="text-right px-6 py-4 font-semibold text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('utilization')}
              >
                <div className="flex items-center justify-end gap-2">
                  Utilization
                  {sortKey === 'utilization' && (
                    <span className="text-pink-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="text-right px-6 py-4 font-semibold text-gray-300">Price</th>
              <th className="text-center px-6 py-4 font-semibold text-gray-300">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedMarkets.map((market, index) => (
              <tr
                key={market.market}
                className={`border-b border-slate-700 hover:bg-slate-700/50 transition-colors ${
                  index !== sortedMarkets.length - 1 ? '' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                      {market.symbol?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{market.symbol || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{market.market.slice(0, 10)}...</p>
                    </div>
                  </div>
                </td>
                <td className="text-right px-6 py-4">
                  <span className="text-white font-medium">
                    {formatSupplyValue(market.totalSupply, market.price, market.decimals)}
                  </span>
                </td>
                <td className="text-right px-6 py-4">
                  <span className="text-green-400 font-medium">
                    {formatRate(market.supplyRatePerYear)}
                  </span>
                </td>
                <td className="text-right px-6 py-4">
                  <span className="text-orange-400 font-medium">
                    {formatRate(market.borrowRatePerYear)}
                  </span>
                </td>
                <td className="text-right px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-white font-medium">
                      {market.utilization !== undefined && market.utilization !== null
                        ? `${(market.utilization * 100).toFixed(1)}%`
                        : '-'}
                    </span>
                    <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-red-500"
                        style={{
                          width: `${(market.utilization || 0) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="text-right px-6 py-4">
                  <span className="text-white font-medium">
                    {market.price !== null && market.price !== undefined
                      ? `$${(market.price / 1e8).toFixed(2)}`
                      : '-'}
                  </span>
                </td>
                <td className="text-center px-6 py-4">
                  <button 
                    onClick={() => {
                      setSelectedMarket(market);
                      setIsModalOpen(true);
                    }}
                    className="px-3 py-1 bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium rounded transition-colors"
                  >
                    Supply
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Supply Modal */}
      {isModalOpen && selectedMarket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700">
            <h3 className="text-xl font-bold mb-4">Supply {selectedMarket.symbol}</h3>

            <div className="mb-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Your Balance</span>
                <span className="text-white font-medium">{userBalance} {selectedMarket.symbol}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Amount</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={supplyAmount}
                  onChange={(e) => setSupplyAmount(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                />
                <button
                  onClick={() => setSupplyAmount(userBalance)}
                  className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors border border-slate-600"
                  title="Set to maximum"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="mb-4 text-xs text-gray-400">
              <p>• Supplying will mint {selectedMarket.symbol} and transfer to this pool</p>
              <p>• You will earn {selectedMarket.supplyRatePerYear ? ((selectedMarket.supplyRatePerYear / 1e18) * 100).toFixed(2) : '0.00'}% APY on your supply</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedMarket(null);
                  setSupplyAmount('');
                }}
                disabled={isSupplying}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    setIsSupplying(true);
                    if (!selectedMarket.underlying) {
                      alert('Underlying address not found');
                      return;
                    }

                    const txHash = await Web3Service.supply(
                      selectedMarket.market,
                      supplyAmount,
                      selectedMarket.underlying
                    );

                    alert(`Supply successful!\nTransaction: ${txHash}`);
                    setIsModalOpen(false);
                    setSelectedMarket(null);
                    setSupplyAmount('');
                  } catch (error) {
                    alert(`Supply failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  } finally {
                    setIsSupplying(false);
                  }
                }}
                disabled={isSupplying || !supplyAmount || parseFloat(supplyAmount) <= 0}
                className="flex-1 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSupplying ? 'Supplying...' : 'Supply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
