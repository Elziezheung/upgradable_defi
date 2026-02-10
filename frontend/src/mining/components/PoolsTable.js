import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState, useEffect } from 'react';
import Web3Service from '@/mining/services/web3';
export const PoolsTable = ({ markets, loading }) => {
    const [sortKey, setSortKey] = useState('totalSupply');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedMarket, setSelectedMarket] = useState(null);
    const [supplyAmount, setSupplyAmount] = useState('');
    const [userBalance, setUserBalance] = useState('0');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSupplying, setIsSupplying] = useState(false);
    const sortedMarkets = useMemo(() => {
        const sorted = [...markets].sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];
            if (aVal === null || aVal === undefined)
                return 1;
            if (bVal === null || bVal === undefined)
                return -1;
            const comparison = aVal > bVal ? 1 : -1;
            return sortOrder === 'asc' ? comparison : -comparison;
        });
        return sorted;
    }, [markets, sortKey, sortOrder]);
    const handleSort = (key) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        }
        else {
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
    const formatValue = (value, decimals = 2) => {
        if (value === null || value === undefined)
            return '-';
        if (value >= 1e9)
            return `$${(value / 1e9).toFixed(2)}B`;
        if (value >= 1e6)
            return `$${(value / 1e6).toFixed(2)}M`;
        if (value >= 1e3)
            return `$${(value / 1e3).toFixed(2)}K`;
        return `$${value.toFixed(decimals)}`;
    };
    const formatSupplyValue = (supply, price, decimals) => {
        if (supply === null || price === null || decimals === null)
            return '-';
        const supplyValue = (supply * price) / Math.pow(10, decimals + 8); // price is in 8 decimals
        return formatValue(supplyValue, decimals);
    };
    const formatRate = (value) => {
        if (value === null || value === undefined)
            return '-';
        // Convert from ray (1e18) to percentage
        const rateInPercent = (value / 1e18) * 100;
        return `${rateInPercent.toFixed(2)}%`;
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-96", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4" }), _jsx("p", { className: "text-gray-400", children: "Loading pools..." })] }) }));
    }
    if (markets.length === 0) {
        return (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-gray-400 text-lg", children: "No pools available" }) }));
    }
    return (_jsxs("div", { className: "bg-slate-800 rounded-lg border border-slate-700 overflow-hidden", children: [_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-slate-900 border-b border-slate-700", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left px-6 py-4 font-semibold text-gray-300", children: "Pool" }), _jsx("th", { className: "text-right px-6 py-4 font-semibold text-gray-300 cursor-pointer hover:text-white", onClick: () => handleSort('totalSupply'), children: _jsxs("div", { className: "flex items-center justify-end gap-2", children: ["TVL", sortKey === 'totalSupply' && (_jsx("span", { className: "text-pink-500", children: sortOrder === 'asc' ? '↑' : '↓' }))] }) }), _jsx("th", { className: "text-right px-6 py-4 font-semibold text-gray-300 cursor-pointer hover:text-white", onClick: () => handleSort('supplyRatePerYear'), children: _jsxs("div", { className: "flex items-center justify-end gap-2", children: ["Supply APR", sortKey === 'supplyRatePerYear' && (_jsx("span", { className: "text-pink-500", children: sortOrder === 'asc' ? '↑' : '↓' }))] }) }), _jsx("th", { className: "text-right px-6 py-4 font-semibold text-gray-300 cursor-pointer hover:text-white", onClick: () => handleSort('borrowRatePerYear'), children: _jsxs("div", { className: "flex items-center justify-end gap-2", children: ["Borrow APR", sortKey === 'borrowRatePerYear' && (_jsx("span", { className: "text-pink-500", children: sortOrder === 'asc' ? '↑' : '↓' }))] }) }), _jsx("th", { className: "text-right px-6 py-4 font-semibold text-gray-300 cursor-pointer hover:text-white", onClick: () => handleSort('utilization'), children: _jsxs("div", { className: "flex items-center justify-end gap-2", children: ["Utilization", sortKey === 'utilization' && (_jsx("span", { className: "text-pink-500", children: sortOrder === 'asc' ? '↑' : '↓' }))] }) }), _jsx("th", { className: "text-right px-6 py-4 font-semibold text-gray-300", children: "Price" }), _jsx("th", { className: "text-center px-6 py-4 font-semibold text-gray-300", children: "Action" })] }) }), _jsx("tbody", { children: sortedMarkets.map((market, index) => (_jsxs("tr", { className: `border-b border-slate-700 hover:bg-slate-700/50 transition-colors ${index !== sortedMarkets.length - 1 ? '' : ''}`, children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold", children: market.symbol?.charAt(0) || '?' }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-white", children: market.symbol || 'Unknown' }), _jsxs("p", { className: "text-xs text-gray-400", children: [market.market.slice(0, 10), "..."] })] })] }) }), _jsx("td", { className: "text-right px-6 py-4", children: _jsx("span", { className: "text-white font-medium", children: formatSupplyValue(market.totalSupply, market.price, market.decimals) }) }), _jsx("td", { className: "text-right px-6 py-4", children: _jsx("span", { className: "text-green-400 font-medium", children: formatRate(market.supplyRatePerYear) }) }), _jsx("td", { className: "text-right px-6 py-4", children: _jsx("span", { className: "text-orange-400 font-medium", children: formatRate(market.borrowRatePerYear) }) }), _jsx("td", { className: "text-right px-6 py-4", children: _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx("span", { className: "text-white font-medium", children: market.utilization !== undefined && market.utilization !== null
                                                        ? `${(market.utilization * 100).toFixed(1)}%`
                                                        : '-' }), _jsx("div", { className: "w-16 h-2 bg-slate-700 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-green-500 to-red-500", style: {
                                                            width: `${(market.utilization || 0) * 100}%`,
                                                        } }) })] }) }), _jsx("td", { className: "text-right px-6 py-4", children: _jsx("span", { className: "text-white font-medium", children: market.price !== null && market.price !== undefined
                                                ? `$${(market.price / 1e8).toFixed(2)}`
                                                : '-' }) }), _jsx("td", { className: "text-center px-6 py-4", children: _jsx("button", { onClick: () => {
                                                setSelectedMarket(market);
                                                setIsModalOpen(true);
                                            }, className: "px-3 py-1 bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium rounded transition-colors", children: "Supply" }) })] }, market.market))) })] }) }), isModalOpen && selectedMarket && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700", children: [_jsxs("h3", { className: "text-xl font-bold mb-4", children: ["Supply ", selectedMarket.symbol] }), _jsx("div", { className: "mb-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700", children: _jsxs("div", { className: "flex justify-between text-sm mb-2", children: [_jsx("span", { className: "text-gray-400", children: "Your Balance" }), _jsxs("span", { className: "text-white font-medium", children: [userBalance, " ", selectedMarket.symbol] })] }) }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm text-gray-400 mb-2", children: "Amount" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "number", value: supplyAmount, onChange: (e) => setSupplyAmount(e.target.value), placeholder: "0.0", className: "flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500" }), _jsx("button", { onClick: () => setSupplyAmount(userBalance), className: "px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors border border-slate-600", title: "Set to maximum", children: "MAX" })] })] }), _jsxs("div", { className: "mb-4 text-xs text-gray-400", children: [_jsxs("p", { children: ["\u2022 Supplying will mint ", selectedMarket.symbol, " and transfer to this pool"] }), _jsxs("p", { children: ["\u2022 You will earn ", selectedMarket.supplyRatePerYear ? ((selectedMarket.supplyRatePerYear / 1e18) * 100).toFixed(2) : '0.00', "% APY on your supply"] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: () => {
                                        setIsModalOpen(false);
                                        setSelectedMarket(null);
                                        setSupplyAmount('');
                                    }, disabled: isSupplying, className: "flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: "Cancel" }), _jsx("button", { onClick: async () => {
                                        try {
                                            setIsSupplying(true);
                                            if (!selectedMarket.underlying) {
                                                alert('Underlying address not found');
                                                return;
                                            }
                                            const txHash = await Web3Service.supply(selectedMarket.market, supplyAmount, selectedMarket.underlying);
                                            alert(`Supply successful!\nTransaction: ${txHash}`);
                                            setIsModalOpen(false);
                                            setSelectedMarket(null);
                                            setSupplyAmount('');
                                        }
                                        catch (error) {
                                            alert(`Supply failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                        }
                                        finally {
                                            setIsSupplying(false);
                                        }
                                    }, disabled: isSupplying || !supplyAmount || parseFloat(supplyAmount) <= 0, className: "flex-1 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: isSupplying ? 'Supplying...' : 'Supply' })] })] }) }))] }));
};
