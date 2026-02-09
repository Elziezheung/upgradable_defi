import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/**
 * Action Modal Component
 * Generic modal for lending actions (supply, withdraw, borrow, repay)
 */
import { useState, useEffect } from 'react';
import Web3Service from '../services/web3';
export const ActionModal = ({ isOpen, onClose, action, market, onSuccess, maxAmount = '0', }) => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [txHash, setTxHash] = useState(null);
    useEffect(() => {
        if (!isOpen) {
            setAmount('');
            setError(null);
            setTxHash(null);
        }
    }, [isOpen]);
    if (!isOpen || !market)
        return null;
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setTxHash(null);
        if (!amount || parseFloat(amount) <= 0) {
            setError('请输入有效金额');
            return;
        }
        setLoading(true);
        try {
            let hash;
            switch (action) {
                case 'supply':
                    hash = await Web3Service.supply(market.market, amount, market.underlying);
                    break;
                case 'withdraw':
                    hash = await Web3Service.withdraw(market.market, amount, true);
                    break;
                case 'borrow':
                    hash = await Web3Service.borrow(market.market, amount);
                    break;
                case 'repay':
                    hash = await Web3Service.repay(market.market, amount, market.underlying);
                    break;
                default:
                    throw new Error('未知操作');
            }
            setTxHash(hash);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : '交易失败');
        }
        finally {
            setLoading(false);
        }
    };
    const handleMaxClick = () => {
        setAmount(maxAmount);
    };
    const actionText = {
        supply: '存款',
        withdraw: '取款',
        borrow: '借款',
        repay: '还款',
    };
    const actionColor = {
        supply: 'green',
        withdraw: 'red',
        borrow: 'blue',
        repay: 'yellow',
    };
    const color = actionColor[action];
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-slate-800 rounded-lg max-w-md w-full p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsxs("h2", { className: "text-2xl font-bold text-white", children: [actionText[action], " ", market.symbol] }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-white transition-colors", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), txHash ? (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "mb-4 text-green-400", children: _jsx("svg", { className: "w-16 h-16 mx-auto", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }), _jsx("h3", { className: "text-xl font-bold text-white mb-2", children: "\u4EA4\u6613\u6210\u529F!" }), _jsxs("p", { className: "text-gray-400 text-sm mb-4", children: ["\u4EA4\u6613\u54C8\u5E0C: ", txHash.substring(0, 10), "...", txHash.substring(txHash.length - 8)] })] })) : (_jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block text-gray-300 text-sm font-medium mb-2", children: "\u91D1\u989D" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: "number", step: "any", min: "0", value: amount, onChange: (e) => setAmount(e.target.value), className: "w-full bg-slate-700 text-white rounded-lg px-4 py-3 pr-24 focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "0.0", disabled: loading }), _jsxs("div", { className: "absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2", children: [_jsx("button", { type: "button", onClick: handleMaxClick, className: "px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors", disabled: loading, children: "\u6700\u5927" }), _jsx("span", { className: "text-gray-400 text-sm", children: market.symbol })] })] }), maxAmount && parseFloat(maxAmount) > 0 && (_jsxs("p", { className: "mt-1 text-xs text-gray-400", children: ["\u53EF\u7528: ", parseFloat(maxAmount).toFixed(4), " ", market.symbol] }))] }), _jsxs("div", { className: "mb-6 bg-slate-700 rounded-lg p-4 space-y-2", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-400", children: action === 'supply' || action === 'withdraw' ? '存款APY' : '借款APY' }), _jsxs("span", { className: `font-medium ${action === 'supply' || action === 'withdraw' ? 'text-green-400' : 'text-yellow-400'}`, children: [action === 'supply' || action === 'withdraw'
                                                    ? (market.supplyRatePerYear * 100).toFixed(2)
                                                    : (market.borrowRatePerYear * 100).toFixed(2), "%"] })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-400", children: "\u62B5\u62BC\u7CFB\u6570" }), _jsxs("span", { className: "text-white", children: [(market.collateralFactor * 100).toFixed(0), "%"] })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-400", children: "\u5229\u7528\u7387" }), _jsxs("span", { className: "text-white", children: [(market.utilization * 100).toFixed(2), "%"] })] })] }), error && (_jsx("div", { className: "mb-4 bg-red-500 bg-opacity-10 border border-red-500 text-red-500 rounded-lg p-3 text-sm", children: error })), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors", disabled: loading, children: "\u53D6\u6D88" }), _jsx("button", { type: "submit", className: `flex-1 px-4 py-3 bg-${color}-600 hover:bg-${color}-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`, disabled: loading, children: loading ? (_jsxs("span", { className: "flex items-center justify-center gap-2", children: [_jsx("div", { className: "animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" }), "\u5904\u7406\u4E2D..."] })) : (actionText[action]) })] })] }))] }) }));
};
