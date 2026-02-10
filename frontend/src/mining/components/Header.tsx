import React from 'react';
import { useWallet } from '@/mining/hooks/useWallet';

interface HeaderProps {
  activeTab: 'pools' | 'portfolio' | 'transactions' | 'analytics';
  setActiveTab: (tab: 'pools' | 'portfolio' | 'transactions' | 'analytics') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { wallet, connect, disconnect, loading } = useWallet();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold">L</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              LiquidityMining
            </h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex gap-1">
            {(['pools', 'portfolio', 'transactions', 'analytics'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-white bg-slate-700'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab === 'analytics' ? '📊 Analytics' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>

          {/* Wallet Connection */}
          <div>
            {wallet.isConnected ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm text-gray-400">Connected</p>
                  <p className="text-sm font-semibold text-white">{formatAddress(wallet.account!)}</p>
                </div>
                <button
                  onClick={disconnect}
                  className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={loading}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Connecting...' : 'Connect'}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex gap-1 pb-4 overflow-x-auto">
          {(['pools', 'portfolio', 'transactions', 'analytics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'text-white bg-slate-700'
                  : 'text-gray-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab === 'analytics' ? '📊' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
