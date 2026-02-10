import React, { useState } from 'react';
import API from '@/mining/services/api';

interface TransactionsProps {
  selectedMarket?: string;
}

export const Transactions: React.FC<TransactionsProps> = ({ selectedMarket }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await API.getEvents(
        selectedMarket,
        filter !== 'all' ? filter : undefined,
        undefined,
        undefined,
        50
      );
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTransactions();
  }, [selectedMarket, filter]);

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-gray-400">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
        <p className="text-gray-400 text-lg">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'Deposit', 'Withdraw', 'Borrow', 'Repay'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === f
                ? 'text-white bg-slate-700'
                : 'text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-gray-300">Event</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-300">Contract</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-300">Block</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-300">Transaction</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-300">Details</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => (
                <tr
                  key={`${event.transactionHash}-${index}`}
                  className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-pink-500/20 text-pink-400">
                      {event.event}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {event.contract.slice(0, 10)}...
                  </td>
                  <td className="px-6 py-4 text-gray-400">{event.blockNumber}</td>
                  <td className="px-6 py-4">
                    <a
                      href={`https://etherscan.io/tx/${event.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-500 hover:text-pink-400 transition-colors"
                    >
                      {event.transactionHash.slice(0, 10)}...
                    </a>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    <details>
                      <summary className="cursor-pointer text-pink-500 hover:text-pink-400">
                        View
                      </summary>
                      <pre className="mt-2 text-xs bg-slate-900 p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(event.args, null, 2)}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
