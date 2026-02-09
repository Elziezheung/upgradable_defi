import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
function LendingApp() {
    const [activeTab, setActiveTab] = useState('markets');
    const [modalOpen, setModalOpen] = useState(false);
    const [currentAction, setCurrentAction] = useState('supply');
    const [selectedMarket, setSelectedMarket] = useState(null);
    const [maxAmount, setMaxAmount] = useState('0');
    const { markets, loading: marketsLoading, refetch: refetchMarkets } = useMarkets();
    const { account, isConnected, connect, disconnect } = useWallet();
    const { account: accountData, loading: accountLoading, refetch: refetchAccount } = useAccount(account);
    const handleSupply = (market) => {
        setSelectedMarket(market);
        setCurrentAction('supply');
        setMaxAmount('1000000'); // This should be fetched from wallet balance
        setModalOpen(true);
    };
    const handleBorrow = (market) => {
        setSelectedMarket(market);
        setCurrentAction('borrow');
        const available = accountData?.availableToBorrow || 0;
        setMaxAmount(available.toString());
        setModalOpen(true);
    };
    const handleWithdraw = (position) => {
        const market = markets.find(m => m.market === position.market);
        if (market) {
            setSelectedMarket(market);
            setCurrentAction('withdraw');
            setMaxAmount((position.supplyUnderlying / (10 ** position.decimals)).toString());
            setModalOpen(true);
        }
    };
    const handleRepay = (position) => {
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
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white", children: [_jsx(Header, { account: account, isConnected: isConnected, onConnect: connect, onDisconnect: disconnect, activeTab: activeTab, setActiveTab: setActiveTab }), _jsxs("main", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-8", children: [_jsxs("div", { className: "bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6", children: [_jsx("div", { className: "text-blue-200 text-sm mb-1", children: "Total Value Locked (TVL)" }), _jsxs("div", { className: "text-3xl font-bold text-white", children: ["$", (totalTVL / 1e6).toFixed(2), "M"] }), _jsxs("div", { className: "text-blue-200 text-xs mt-2", children: ["Across ", markets.length, " markets"] })] }), _jsxs("div", { className: "bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-6", children: [_jsx("div", { className: "text-green-200 text-sm mb-1", children: "Avg Supply APY" }), _jsxs("div", { className: "text-3xl font-bold text-white", children: [(avgSupplyAPY * 100).toFixed(2), "%"] }), _jsx("div", { className: "text-green-200 text-xs mt-2", children: "Annual yield" })] }), _jsxs("div", { className: "bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-6", children: [_jsx("div", { className: "text-purple-200 text-sm mb-1", children: "Avg Borrow APY" }), _jsxs("div", { className: "text-3xl font-bold text-white", children: [(avgBorrowAPY * 100).toFixed(2), "%"] }), _jsx("div", { className: "text-purple-200 text-xs mt-2", children: "Annual borrowing cost" })] })] }), _jsxs("div", { className: "space-y-8", children: [activeTab === 'markets' && (_jsxs("div", { children: [_jsxs("div", { className: "mb-6 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold mb-2", children: "Lending Markets" }), _jsx("p", { className: "text-gray-400", children: "Select assets to supply or borrow" })] }), _jsxs("div", { className: "text-sm text-gray-400", children: [markets.length, " markets available"] })] }), _jsx(MarketsTable, { markets: markets, loading: marketsLoading, onSupply: handleSupply, onBorrow: handleBorrow })] })), activeTab === 'positions' && (_jsxs("div", { children: [_jsxs("div", { className: "mb-6", children: [_jsx("h2", { className: "text-3xl font-bold mb-2", children: "My Positions" }), _jsx("p", { className: "text-gray-400", children: "Manage your deposits and borrowings" })] }), _jsx(UserPositions, { account: accountData, loading: accountLoading, connected: isConnected, onWithdraw: handleWithdraw, onRepay: handleRepay })] }))] }), _jsxs("div", { className: "mt-12 grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { className: "bg-slate-800 rounded-lg p-6 border border-slate-700", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx("div", { className: "h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center", children: _jsx("svg", { className: "w-6 h-6 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }) }), _jsx("h3", { className: "text-lg font-bold text-white", children: "Earn Interest" })] }), _jsx("p", { className: "text-gray-400 text-sm", children: "Supply assets and earn interest. Your assets will be used for lending, with interest accumulated in real-time." })] }), _jsxs("div", { className: "bg-slate-800 rounded-lg p-6 border border-slate-700", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx("div", { className: "h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center", children: _jsx("svg", { className: "w-6 h-6 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }) }) }), _jsx("h3", { className: "text-lg font-bold text-white", children: "Over-collateralized Borrowing" })] }), _jsx("p", { className: "text-gray-400 text-sm", children: "Use your deposits as collateral to borrow other assets. Maintain a healthy collateral ratio to avoid liquidation." })] }), _jsxs("div", { className: "bg-slate-800 rounded-lg p-6 border border-slate-700", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx("div", { className: "h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center", children: _jsx("svg", { className: "w-6 h-6 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 10V3L4 14h7v7l9-11h-7z" }) }) }), _jsx("h3", { className: "text-lg font-bold text-white", children: "Instant Liquidity" })] }), _jsx("p", { className: "text-gray-400 text-sm", children: "Deposit and withdraw assets anytime. No waiting required, transactions complete instantly with ample liquidity." })] })] })] }), _jsx(ActionModal, { isOpen: modalOpen, onClose: () => setModalOpen(false), action: currentAction, market: selectedMarket, onSuccess: handleModalSuccess, maxAmount: maxAmount })] }));
}
export default LendingApp;
