import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const StatCard = ({ label, value, unit, change }) => {
    return (_jsxs("div", { className: "bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg p-6 border border-slate-600", children: [_jsx("p", { className: "text-sm text-gray-400 mb-2", children: label }), _jsxs("div", { className: "flex items-baseline gap-2", children: [_jsxs("h3", { className: "text-2xl md:text-3xl font-bold text-white", children: [value, unit && _jsx("span", { className: "text-lg ml-1", children: unit })] }), change && (_jsxs("span", { className: `text-sm font-medium ${change.isPositive ? 'text-green-400' : 'text-red-400'}`, children: [change.isPositive ? '▲' : '▼', " ", Math.abs(change.value).toFixed(2), "%"] }))] })] }));
};
