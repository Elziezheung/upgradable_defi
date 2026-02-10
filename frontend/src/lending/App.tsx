/**
 * Lending App Component
 * Main application component for DeFi lending platform
 */
import { useState } from 'react';
import { Header } from './components/Header';
import { MarketsTable } from './components/MarketsTable';
import { UserPositions } from './components/UserPositions';
import { ActionModal } from './components/ActionModal';
import { useMarkets, useAccount, useWallet } from './hooks/useLending';
import type { LendingMarket, LendingAction, UserPosition } from './types';

function LendingApp() {
  const [activeTab, setActiveTab] = useState<'markets' | 'positions'>('markets');
  const [modalOpen, setModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<LendingAction>('supply');
  const [selectedMarket, setSelectedMarket] = useState<LendingMarket | null>(null);
  const [maxAmount, setMaxAmount] = useState('0');

  const { markets, loading: marketsLoading, refetch: refetchMarkets } = useMarkets();
  const { account, isConnected, connect, disconnect } = useWallet();
  const { account: accountData, loading: accountLoading, refetch: refetchAccount } = useAccount(account);

  const handleSupply = (market: LendingMarket) => {
    setSelectedMarket(market);
    setCurrentAction('supply');
    setMaxAmount('1000000'); // This should be fetched from wallet balance
    setModalOpen(true);
  };

  const handleBorrow = (market: LendingMarket) => {
    setSelectedMarket(market);
    setCurrentAction('borrow');
    const available = accountData?.availableToBorrow || 0;
    setMaxAmount(available.toString());
    setModalOpen(true);
  };

  const handleWithdraw = (position: UserPosition) => {
    const market = markets.find(m => m.market === position.market);
    if (market) {
      setSelectedMarket(market);
      setCurrentAction('withdraw');
      setMaxAmount((position.supplyUnderlying / (10 ** position.decimals)).toString());
      setModalOpen(true);
    }
  };

  const handleRepay = (position: UserPosition) => {
    const market = markets.find(m => m.market === position.market);
    if (market) {
      setSelectedMarket(market);
      setCurrentAction('repay');
      setMaxAmount((position.borrowBalance / (10 ** position.decimals)).toString());
      setModalOpen(true);
    }
  };

  const handleModalSuccess = () => {
    refetchMarkets();
    refetchAccount();
  };

  // Calculate stats
  const totalTVL = markets.reduce((sum, market) => {
    const supply = market.totalSupply || 0;
    const price = market.price || 0;
    const decimals = market.decimals || 18;
    return sum + (supply * price) / (10 ** (decimals + 8));
  }, 0);

  const avgSupplyAPY = markets.length > 0
    ? markets.reduce((sum, m) => sum + (m.supplyRatePerYear || 0), 0) / markets.length
    : 0;

  const avgBorrowAPY = markets.length > 0
    ? markets.reduce((sum, m) => sum + (m.borrowRatePerYear || 0), 0) / markets.length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
      <Header
        account={account}
        isConnected={isConnected}
        onConnect={connect}
        onDisconnect={disconnect}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6">
            <div className="text-blue-200 text-sm mb-1">Total Value Locked (TVL)</div>
            <div className="text-3xl font-bold text-white">
              ${(totalTVL / 1e6).toFixed(2)}M
            </div>
            <div className="text-blue-200 text-xs mt-2">
              Across {markets.length} markets
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-6">
            <div className="text-green-200 text-sm mb-1">Avg Supply APY</div>
            <div className="text-3xl font-bold text-white">
              {(avgSupplyAPY * 100).toFixed(2)}%
            </div>
            <div className="text-green-200 text-xs mt-2">
              Annual yield
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-6">
            <div className="text-purple-200 text-sm mb-1">Avg Borrow APY</div>
            <div className="text-3xl font-bold text-white">
              {(avgBorrowAPY * 100).toFixed(2)}%
            </div>
            <div className="text-purple-200 text-xs mt-2">
              Annual borrowing cost
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {activeTab === 'markets' && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Lending Markets</h2>
                  <p className="text-gray-400">
                    Select assets to supply or borrow
                  </p>
                </div>
                <div className="text-sm text-gray-400">
                  {markets.length} markets available
                </div>
              </div>
              <MarketsTable
                markets={markets}
                loading={marketsLoading}
                onSupply={handleSupply}
                onBorrow={handleBorrow}
              />
            </div>
          )}

          {activeTab === 'positions' && (
            <div>
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">My Positions</h2>
                <p className="text-gray-400">
                  Manage your deposits and borrowings
                </p>
              </div>
              <UserPositions
                account={accountData}
                loading={accountLoading}
                connected={isConnected}
                onWithdraw={handleWithdraw}
                onRepay={handleRepay}
              />
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Earn Interest</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Supply assets and earn interest. Your assets will be used for lending, with interest accumulated in real-time.
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Over-collateralized Borrowing</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Use your deposits as collateral to borrow other assets. Maintain a healthy collateral ratio to avoid liquidation.
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Instant Liquidity</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Deposit and withdraw assets anytime. No waiting required, transactions complete instantly with ample liquidity.
            </p>
          </div>
        </div>
      </main>

      {/* Action Modal */}
      <ActionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        action={currentAction}
        market={selectedMarket}
        onSuccess={handleModalSuccess}
        maxAmount={maxAmount}
      />
    </div>
  );
}

export default LendingApp;
