/**
 * Header Component
 * Navigation and wallet connection for lending app
 */
import React from 'react';

interface HeaderProps {
  account: string | null;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  activeTab: 'markets' | 'positions';
  setActiveTab: (tab: 'markets' | 'positions') => void;
}

export const Header: React.FC<HeaderProps> = ({
  account,
  isConnected,
  onConnect,
  onDisconnect,
  activeTab,
  setActiveTab,
}) => {
  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header className="bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">💰</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              DeFi Lending
            </h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex gap-1">
            <button
              onClick={() => setActiveTab('markets')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'markets'
                  ? 'text-white bg-slate-700'
                  : 'text-gray-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Markets
            </button>
            <button
              onClick={() => setActiveTab('positions')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'positions'
                  ? 'text-white bg-slate-700'
                  : 'text-gray-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Positions
            </button>
          </nav>

          {/* Wallet Connection */}
          <div>
            {isConnected && account ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm text-gray-400">Connected</p>
                  <p className="text-sm font-semibold text-white">{formatAddress(account)}</p>
                </div>
                <button
                  onClick={onDisconnect}
                  className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={onConnect}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium transition-colors"
              >
                Connect
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex gap-1 pb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('markets')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'markets'
                ? 'text-white bg-slate-700'
                : 'text-gray-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Markets
          </button>
          <button
            onClick={() => setActiveTab('positions')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'positions'
                ? 'text-white bg-slate-700'
                : 'text-gray-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Positions
          </button>
        </div>
      </div>
    </header>
  );
};
