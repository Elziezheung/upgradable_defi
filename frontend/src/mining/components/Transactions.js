import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import API from '@/mining/services/api';
export const Transactions = ({ selectedMarket }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all');
    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const data = await API.getEvents(selectedMarket, filter !== 'all' ? filter : undefined, undefined, undefined, 50);
            setEvents(data);
        }
        catch (err) {
            console.error('Failed to fetch transactions:', err);
        }
        finally {
            setLoading(false);
        }
    };
    React.useEffect(() => {
        fetchTransactions();
    }, [selectedMarket, filter]);
    if (loading && events.length === 0) {
        return (_jsx("div", { className: "flex items-center justify-center h-96", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4" }), _jsx("p", { className: "text-gray-400", children: "Loading transactions..." })] }) }));
    }
    if (events.length === 0) {
        return (_jsx("div", { className: "text-center py-12 bg-slate-800 rounded-lg border border-slate-700", children: _jsx("p", { className: "text-gray-400 text-lg", children: "No transactions found" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex gap-2", children: ['all', 'Deposit', 'Withdraw', 'Borrow', 'Repay'].map((f) => (_jsx("button", { onClick: () => setFilter(f), className: `px-4 py-2 rounded-lg font-medium transition-colors ${filter === f
                        ? 'text-white bg-slate-700'
                        : 'text-gray-400 hover:text-white hover:bg-slate-700'}`, children: f }, f))) }), _jsx("div", { className: "bg-slate-800 rounded-lg border border-slate-700 overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-slate-900 border-b border-slate-700", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left px-6 py-4 font-semibold text-gray-300", children: "Event" }), _jsx("th", { className: "text-left px-6 py-4 font-semibold text-gray-300", children: "Contract" }), _jsx("th", { className: "text-left px-6 py-4 font-semibold text-gray-300", children: "Block" }), _jsx("th", { className: "text-left px-6 py-4 font-semibold text-gray-300", children: "Transaction" }), _jsx("th", { className: "text-left px-6 py-4 font-semibold text-gray-300", children: "Details" })] }) }), _jsx("tbody", { children: events.map((event, index) => (_jsxs("tr", { className: "border-b border-slate-700 hover:bg-slate-700/50 transition-colors", children: [_jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: "inline-block px-3 py-1 rounded-full text-xs font-semibold bg-pink-500/20 text-pink-400", children: event.event }) }), _jsxs("td", { className: "px-6 py-4 text-gray-400", children: [event.contract.slice(0, 10), "..."] }), _jsx("td", { className: "px-6 py-4 text-gray-400", children: event.blockNumber }), _jsx("td", { className: "px-6 py-4", children: _jsxs("a", { href: `https://etherscan.io/tx/${event.transactionHash}`, target: "_blank", rel: "noopener noreferrer", className: "text-pink-500 hover:text-pink-400 transition-colors", children: [event.transactionHash.slice(0, 10), "..."] }) }), _jsx("td", { className: "px-6 py-4 text-gray-400 text-xs", children: _jsxs("details", { children: [_jsx("summary", { className: "cursor-pointer text-pink-500 hover:text-pink-400", children: "View" }), _jsx("pre", { className: "mt-2 text-xs bg-slate-900 p-2 rounded overflow-auto max-h-32", children: JSON.stringify(event.args, null, 2) })] }) })] }, `${event.transactionHash}-${index}`))) })] }) }) })] }));
};
