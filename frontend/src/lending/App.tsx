import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { MarketsTable } from './components/MarketsTable';
import { UserPositions } from './components/UserPositions';
import { ActionModal } from './components/ActionModal';
import { LiquidateSection } from './components/LiquidateSection';
import { ProtocolUpgradeInfo } from '../ProtocolUpgradeInfo';
import { useMarkets, useAccount, useWallet } from './hooks/useLending';
import API from './services/api';
import type { LendingMarket, LendingAction, UserPosition } from './types';
import { getPrice } from './utils';

const LENDING_TABS = ['markets', 'positions', 'liquidate'] as const;
type LendingTab = (typeof LENDING_TABS)[number];

function useLendingTab(): LendingTab {
  const { pathname } = useLocation();
  const segment = pathname.replace(/^\/lending\/?/, '').split('/')[0] || 'markets';
  return LENDING_TABS.includes(segment as LendingTab) ? (segment as LendingTab) : 'markets';
}

function LendingApp() {
  const activeTab = useLendingTab();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [action, setAction] = useState<LendingAction>('supply');
  const [selectedMarket, setSelectedMarket] = useState<LendingMarket | null>(null);
  const [maxAmount, setMaxAmount] = useState('0');
  const [comptroller, setComptroller] = useState<string | null>(null);
  const [refetchError, setRefetchError] = useState<string | null>(null);

  const { markets, loading: marketsLoading, refetch: refetchMarkets } = useMarkets();
  const { account, isConnected, connect, disconnect } = useWallet();
  const { account: accountData, loading: accountLoading, refetch: refetchAccount } = useAccount(account);

  useEffect(() => {
    API.getContractAddresses().then((r) => setComptroller(r.comptroller ?? null)).catch(() => {});
  }, []);

  const openModal = (market: LendingMarket, a: LendingAction, max: string) => {
    setSelectedMarket(market);
    setAction(a);
    setMaxAmount(max);
    setModalOpen(true);
  };

  const handleSupply = (market: LendingMarket) => openModal(market, 'supply', '1000000');
  const handleBorrow = (market: LendingMarket) =>
    openModal(market, 'borrow', String(accountData?.availableToBorrow ?? 0));
  const handleWithdraw = (position: UserPosition) => {
    const market = markets.find((m) => m.market === position.market);
    if (market) openModal(market, 'withdraw', String(position.supplyUnderlying ?? 0));
  };
  const handleRepay = (position: UserPosition) => {
    const market = markets.find((m) => m.market === position.market);
    if (market) openModal(market, 'repay', String(position.borrowBalance ?? 0));
  };

  const refetch = async () => {
    setRefetchError(null);
    try {
      await refetchMarkets();
      if (account) await refetchAccount();
    } catch (e) {
      setRefetchError(e instanceof Error ? e.message : 'Failed to refresh data');
    }
  };

  const handleModalSuccess = async () => {
    setRefetchError(null);
    try {
      // Wait for RPC/backend to see the new block so position balance is available
      await new Promise((r) => setTimeout(r, 1200));
      await refetchMarkets();
      if (account) await refetchAccount();
      if (action === 'supply' || action === 'borrow') navigate('/lending/positions');
    } catch (e) {
      setRefetchError(e instanceof Error ? e.message : 'Failed to refresh data');
    }
  };

  const totalTVL = markets.reduce(
    (sum, m) => sum + ((m as { totalSupplyUsd?: number }).totalSupplyUsd ?? (m.totalSupply ?? 0) * getPrice(m)),
    0
  );
  const avgSupply = markets.length ? markets.reduce((s, m) => s + (m.supplyRatePerYear ?? 0), 0) / markets.length : 0;
  const avgBorrow = markets.length ? markets.reduce((s, m) => s + (m.borrowRatePerYear ?? 0), 0) / markets.length : 0;
  const pct = (n: number) => (n < 1 ? n * 100 : n).toFixed(2);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header
        account={account}
        isConnected={isConnected}
        onConnect={connect}
        onDisconnect={disconnect}
      />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {refetchError && (
          <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-amber-700/50 bg-amber-950/30 px-4 py-3 text-amber-200 text-sm">
            <span>{refetchError}. Please click Refresh to retry.</span>
            <button
              type="button"
              onClick={refetch}
              className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 font-medium text-white hover:bg-amber-500"
            >
              Refresh
            </button>
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/60 p-4">
            <div className="text-xs text-zinc-500">TVL</div>
            <div className="mt-0.5 text-2xl font-semibold text-white">
              ${(totalTVL / 1e6).toFixed(2)}M
            </div>
            <button
              type="button"
              onClick={refetch}
              className="mt-2 text-xs text-zinc-500 underline hover:text-zinc-300"
            >
              Refresh
            </button>
          </div>
          <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/60 p-4">
            <div className="text-xs text-zinc-500">Avg Supply APY</div>
            <div className="mt-0.5 text-2xl font-semibold text-emerald-400">{pct(avgSupply)}%</div>
          </div>
          <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/60 p-4">
            <div className="text-xs text-zinc-500">Avg Borrow APY</div>
            <div className="mt-0.5 text-2xl font-semibold text-amber-400">{pct(avgBorrow)}%</div>
          </div>
        </div>

        <div className="space-y-6">
          {activeTab === 'markets' && (
            <section>
              <h2 className="mb-4 text-xl font-semibold text-white">Lending Markets</h2>
              <MarketsTable
                markets={markets}
                loading={marketsLoading}
                onSupply={handleSupply}
                onBorrow={handleBorrow}
              />
            </section>
          )}

          {activeTab === 'positions' && (
            <section>
              <h2 className="mb-4 text-xl font-semibold text-white">My Positions</h2>
              <UserPositions
                account={accountData}
                loading={accountLoading}
                connected={isConnected}
                onWithdraw={handleWithdraw}
                onRepay={handleRepay}
                comptrollerAddress={comptroller}
                onRefetch={refetchAccount}
              />
            </section>
          )}

          {activeTab === 'liquidate' && (
            <section>
              <LiquidateSection
                markets={markets}
                isConnected={isConnected}
                onSuccess={() => {
                  refetchMarkets();
                  refetchAccount();
                }}
              />
            </section>
          )}
        </div>

        <div className="mt-10">
          <ProtocolUpgradeInfo />
        </div>
      </main>

      <ActionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        action={action}
        market={selectedMarket}
        onSuccess={handleModalSuccess}
        maxAmount={maxAmount}
        comptrollerAddress={comptroller}
      />
    </div>
  );
}

export default LendingApp;
