/**
 * Utility functions for formatting and number operations
 */
export const formatAddress = (address, chars = 4) => {
    if (!address)
        return '';
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};
export const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined)
        return '-';
    if (Math.abs(value) >= 1e9) {
        return `${(value / 1e9).toFixed(decimals)}B`;
    }
    if (Math.abs(value) >= 1e6) {
        return `${(value / 1e6).toFixed(decimals)}M`;
    }
    if (Math.abs(value) >= 1e3) {
        return `${(value / 1e3).toFixed(decimals)}K`;
    }
    return value.toFixed(decimals);
};
export const formatCurrency = (value, decimals = 2) => {
    if (value === null || value === undefined)
        return '$0.00';
    return `$${formatNumber(value, decimals)}`;
};
export const formatPercent = (value, decimals = 2) => {
    if (value === null || value === undefined)
        return '-';
    return `${(value * 100).toFixed(decimals)}%`;
};
export const formatLargeNumber = (value) => {
    if (value === null || value === undefined)
        return '-';
    if (value >= 1e9)
        return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6)
        return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3)
        return `${(value / 1e3).toFixed(2)}K`;
    return value.toFixed(0);
};
export const parseNumber = (value) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
};
