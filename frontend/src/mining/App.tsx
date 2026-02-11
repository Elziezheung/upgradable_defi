import { useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { PoolsTable } from './components/PoolsTable';
import { StakeRewards } from './components/StakeRewards';
import { ProtocolUpgradeInfo } from '../ProtocolUpgradeInfo';
import { UserPortfolio } from './components/UserPortfolio';
import { Transactions } from './components/Transactions';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { StatCard } from './components/StatCard';
import { useMarkets, useAccount, useHealth } from '../mining/hooks/useAPI';
import { useWallet } from '../mining/hooks/useWallet';

const MINING_TABS = ['pools', 'portfolio', 'stake', 'transactions', 'analytics'] as const;
type MiningTab = (typeof MINING_TABS)[number];

function useMiningTab(): MiningTab {
  const { pathname } = useLocation();
  const segment = pathname.replace(/^\/mining\/?/, '').split('/')[0] || 'pools';
  return MINING_TABS.includes(segment as MiningTab) ? (segment as MiningTab) : 'pools';
}

/**
 * Mining App Component
 * Liquidity mining interface for DeFi protocol
 */
function MiningApp() {
  const activeTab = useMiningTab();
  const { markets, loading: marketsLoading } = useMarkets();
  const { wallet } = useWallet();
  const { account, loading: accountLoading } = useAccount(wallet.account || null);
  const { health } = useHealth();

  // Calculate total TVL
  const totalTVL = markets.reduce((sum, market) => {
    const supply = market.totalSupply || 0;
    const price = market.price || 0;
    const decimals = market.decimals || 18;
    // price is in 8 decimals, supply is in token decimals
    const tvl = (supply * price) / (10 ** (decimals + 8));
    return sum + tvl;
  }, 0);

  // Calculate average yield
  const avgSupplyAPR =
    markets.length > 0
      ? markets.reduce((sum, m) => sum + (m.supplyRatePerYear || 0), 0) / markets.length
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:seo-8 py-8">
        {/* Overview Stats - Hidden on Analytics tab */}
        {activeTab !== 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total TVL"
              value={`$${(totalTVL / 1e6).toFixed(2)}`}
              unit="M"
              change={{ value: 4.07, isPositive: true }}
            />
            <StatCard
              label="Available Pools"
              value={markets.length}
              change={{ value: 0, isPositive: true }}
            />
            <StatCard
              label="Average Supply APR"
              value={`${(avgSupplyAPR * 100).toFixed(2)}`}
              unit="%"
            />
            {health && (
              <StatCard
                label="Indexed to Block"
                value={health.indexedToBlock}
                change={{
                  value: health.latestBlock - health.indexedToBlock,
                  isPositive: true,
                }}
              />
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-8">
          {activeTab === 'pools' && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-3xl font-bold">Liquidity Pools</h2>
                <div className="text-sm text-gray-400">
                  {markets.length} pools available
                </div>
              </div>
              <PoolsTable markets={markets} loading={marketsLoading} />
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div>
              <h2 className="text-3xl font-bold mb-6">Your Portfolio</h2>
              <UserPortfolio
                account={account}
                loading={accountLoading}
                connected={wallet.isConnected}
              />
            </div>
          )}

          {activeTab === 'stake' && (
            <div>
              <StakeRewards
                account={wallet.account}
                isConnected={wallet.isConnected}
              />
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h2 className="text-3xl font-bold mb-6">Recent Transactions</h2>
              <Transactions />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-3xl font-bold mb-6">Market Analytics</h2>
              <AnalyticsDashboard markets={markets} />
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-16 pt-8 border-t border-slate-700 text-center text-gray-400 text-sm">
          {health && (
            <p>
              Chain ID: {health.chainId} • Latest Block: {health.latestBlock} • Synced to Block:{' '}
              {health.indexedToBlock}
            </p>
          )}
        </div>
        <ProtocolUpgradeInfo />
      </main>
    </div>
  );
}

export default MiningApp;
