import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Markets Table Component
 * Displays all available lending markets with supply/borrow actions
 */
import { useState } from 'react';
export const MarketsTable = ({ markets, loading, onSupply, onBorrow, }) => {
    const [sortBy, setSortBy] = useState('symbol');
    const [sortDesc, setSortDesc] = useState(false);
    const handleSort = (key) => {
        if (sortBy === key) {
            setSortDesc(!sortDesc);
        }
        else {
            setSortBy(key);
            setSortDesc(true);
        }
    };
    const sortedMarkets = [...markets].sort((a, b) => {
        let aVal;
        let bVal;
        switch (sortBy) {
            case 'symbol':
                aVal = a.symbol;
                bVal = b.symbol;
                break;
            case 'totalSupply':
                aVal = (a.totalSupply * a.price) / (10 ** (a.decimals + 8));
                bVal = (b.totalSupply * b.price) / (10 ** (b.decimals + 8));
                break;
            case 'supplyAPY':
                aVal = a.supplyRatePerYear;
                bVal = b.supplyRatePerYear;
                break;
            case 'borrowAPY':
                aVal = a.borrowRatePerYear;
                bVal = b.borrowRatePerYear;
                break;
            default:
                return 0;
        }
        if (typeof aVal === 'string' && typeof bVal === 'string') {
            return sortDesc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
        }
        return sortDesc ? bVal - aVal : aVal - bVal;
    });
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-96", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4" }), _jsx("p", { className: "text-gray-400", children: "Loading markets..." })] }) }));
    }
    if (markets.length === 0) {
        return (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-gray-400 text-lg", children: "No markets available" }) }));
    }
    return (_jsx("div", { className: "bg-slate-800 rounded-lg border border-slate-700 overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-slate-900 border-b border-slate-700", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left px-6 py-4 font-semibold text-gray-300 cursor-pointer hover:text-white", onClick: () => handleSort('symbol'), children: _jsxs("div", { className: "flex items-center gap-2", children: ["\u8D44\u4EA7", sortBy === 'symbol' && (_jsx("span", { className: "text-pink-500", children: sortDesc ? '↓' : '↑' }))] }) }), _jsx("th", { className: "text-right px-6 py-4 font-semibold text-gray-300 cursor-pointer hover:text-white", onClick: () => handleSort('totalSupply'), children: _jsxs("div", { className: "flex items-center justify-end gap-2", children: ["\u603B\u5B58\u6B3E", sortBy === 'totalSupply' && (_jsx("span", { className: "text-pink-500", children: sortDesc ? '↓' : '↑' }))] }) }), _jsx("th", { className: "text-right px-6 py-4 font-semibold text-gray-300", children: "\u603B\u501F\u6B3E" }), _jsx("th", { className: "text-right px-6 py-4 font-semibold text-gray-300 cursor-pointer hover:text-white", onClick: () => handleSort('supplyAPY'), children: _jsxs("div", { className: "flex items-center justify-end gap-2", children: ["\u5B58\u6B3EAPY", sortBy === 'supplyAPY' && (_jsx("span", { className: "text-pink-500", children: sortDesc ? '↓' : '↑' }))] }) }), _jsx("th", { className: "text-right px-6 py-4 font-semibold text-gray-300 cursor-pointer hover:text-white", onClick: () => handleSort('borrowAPY'), children: _jsxs("div", { className: "flex items-center justify-end gap-2", children: ["\u501F\u6B3EAPY", sortBy === 'borrowAPY' && (_jsx("span", { className: "text-pink-500", children: sortDesc ? '↓' : '↑' }))] }) }), _jsx("th", { className: "text-right px-6 py-4 font-semibold text-gray-300", children: "\u5229\u7528\u7387" }), _jsx("th", { className: "text-center px-6 py-4 font-semibold text-gray-300", children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-700", children: sortedMarkets.map((market) => {
                            const totalSupplyUSD = (market.totalSupply * market.price) / (10 ** (market.decimals + 8));
                            const totalBorrowsUSD = (market.totalBorrows * market.price) / (10 ** (market.decimals + 8));
                            const supplyAPY = (market.supplyRatePerYear * 100).toFixed(2);
                            const borrowAPY = (market.borrowRatePerYear * 100).toFixed(2);
                            const utilization = (market.utilization * 100).toFixed(2);
                            return (_jsxs("tr", { className: "hover:bg-slate-750", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "h-10 w-10 flex-shrink-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold", children: market.symbol.substring(0, 2) }), _jsxs("div", { className: "ml-4", children: [_jsx("div", { className: "text-sm font-medium text-white", children: market.symbol }), _jsxs("div", { className: "text-xs text-gray-400", children: [market.market.substring(0, 8), "..."] })] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right", children: _jsxs("div", { className: "text-sm text-white", children: ["$", totalSupplyUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right", children: _jsxs("div", { className: "text-sm text-white", children: ["$", totalBorrowsUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right", children: _jsxs("span", { className: "text-sm font-medium text-green-400", children: [supplyAPY, "%"] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right", children: _jsxs("span", { className: "text-sm font-medium text-yellow-400", children: [borrowAPY, "%"] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right", children: _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx("div", { className: "w-16 bg-slate-700 rounded-full h-2", children: _jsx("div", { className: "bg-blue-500 h-2 rounded-full", style: { width: `${Math.min(100, parseFloat(utilization))}%` } }) }), _jsxs("span", { className: "text-sm text-gray-300 w-12", children: [utilization, "%"] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-center", children: _jsxs("div", { className: "flex gap-2 justify-center", children: [_jsx("button", { onClick: () => onSupply(market), className: "px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-sm rounded-lg transition-colors font-medium", children: "\u5B58\u6B3E" }), _jsx("button", { onClick: () => onBorrow(market), className: "px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors font-medium", children: "\u501F\u6B3E" })] }) })] }, market.market));
                        }) })] }) }) }));
};
