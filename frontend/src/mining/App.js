import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Header } from './components/Header';
import { PoolsTable } from './components/PoolsTable';
import { UserPortfolio } from './components/UserPortfolio';
import { Transactions } from './components/Transactions';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { StatCard } from './components/StatCard';
import { useMarkets, useAccount, useHealth } from '../mining/hooks/useAPI';
import { useWallet } from '../mining/hooks/useWallet';
/**
 * Mining App Component
 * Liquidity mining interface for DeFi protocol
 */
function MiningApp() {
    const [activeTab, setActiveTab] = useState('pools');
    const { markets, loading: marketsLoading } = useMarkets();
    const { wallet } = useWallet();
    const { account, loading: accountLoading } = useAccount(wallet.account || null);
    const { health } = useHealth();
    // 计算总TVL
    const totalTVL = markets.reduce((sum, market) => {
        const supply = market.totalSupply || 0;
        const price = market.price || 0;
        const decimals = market.decimals || 18;
        // price is in 8 decimals, supply is in token decimals
        const tvl = (supply * price) / (10 ** (decimals + 8));
        return sum + tvl;
    }, 0);
    // 计算平均收益率
    const avgSupplyAPR = markets.length > 0
        ? markets.reduce((sum, m) => sum + (m.supplyRatePerYear || 0), 0) / markets.length
        : 0;
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white", children: [_jsx(Header, { activeTab: activeTab, setActiveTab: setActiveTab }), _jsxs("main", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:seo-8 py-8", children: [activeTab !== 'analytics' && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8", children: [_jsx(StatCard, { label: "Total TVL", value: `$${(totalTVL / 1e6).toFixed(2)}`, unit: "M", change: { value: 4.07, isPositive: true } }), _jsx(StatCard, { label: "Available Pools", value: markets.length, change: { value: 0, isPositive: true } }), _jsx(StatCard, { label: "Average Supply APR", value: `${(avgSupplyAPR * 100).toFixed(2)}`, unit: "%" }), health && (_jsx(StatCard, { label: "Indexed to Block", value: health.indexedToBlock, change: {
                                    value: health.latestBlock - health.indexedToBlock,
                                    isPositive: true,
                                } }))] })), _jsxs("div", { className: "space-y-8", children: [activeTab === 'pools' && (_jsxs("div", { children: [_jsxs("div", { className: "mb-6 flex items-center justify-between", children: [_jsx("h2", { className: "text-3xl font-bold", children: "Liquidity Pools" }), _jsxs("div", { className: "text-sm text-gray-400", children: [markets.length, " pools available"] })] }), _jsx(PoolsTable, { markets: markets, loading: marketsLoading })] })), activeTab === 'portfolio' && (_jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold mb-6", children: "Your Portfolio" }), _jsx(UserPortfolio, { account: account, loading: accountLoading, connected: wallet.isConnected })] })), activeTab === 'transactions' && (_jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold mb-6", children: "Recent Transactions" }), _jsx(Transactions, {})] })), activeTab === 'analytics' && (_jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold mb-6", children: "Market Analytics" }), _jsx(AnalyticsDashboard, { markets: markets })] }))] }), _jsx("div", { className: "mt-16 pt-8 border-t border-slate-700 text-center text-gray-400 text-sm", children: health && (_jsxs("p", { children: ["Chain ID: ", health.chainId, " \u2022 Latest Block: ", health.latestBlock, " \u2022 Synced to Block:", ' ', health.indexedToBlock] })) })] })] }));
}
export default MiningApp;
