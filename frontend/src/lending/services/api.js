/**
 * Lending API Service
 * Handles all API calls for lending markets and user data
 */
import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});
class LendingAPIService {
    /**
     * Get system health status
     */
    async getHealth() {
        const response = await apiClient.get('/health');
        return response.data;
    }
    /**
     * Get all lending markets
     */
    async getMarkets() {
        const response = await apiClient.get('/markets');
        return response.data.items || [];
    }
    /**
     * Get account data including positions and health
     */
    async getAccount(address) {
        const response = await apiClient.get(`/accounts/${address}`);
        const data = response.data;
        // Calculate additional metrics
        const positions = data.positions || [];
        const totalSupplied = positions.reduce((sum, pos) => {
            return sum + (pos.supplyUnderlying * pos.price) / 1e8;
        }, 0);
        const totalBorrowed = positions.reduce((sum, pos) => {
            return sum + (pos.borrowBalance * pos.price) / 1e8;
        }, 0);
        const borrowLimit = positions.reduce((sum, pos) => {
            const supplyValue = (pos.supplyUnderlying * pos.price) / 1e8;
            return sum + supplyValue * pos.collateralFactor;
        }, 0);
        const availableToBorrow = Math.max(0, borrowLimit - totalBorrowed);
        return {
            ...data,
            totalSupplied,
            totalBorrowed,
            borrowLimit,
            availableToBorrow,
        };
    }
    /**
     * Get transaction events
     */
    async getEvents(contract, event, account, fromBlock, toBlock, limit = 100) {
        const params = new URLSearchParams();
        if (contract)
            params.append('contract', contract);
        if (event)
            params.append('event', event);
        if (account)
            params.append('account', account);
        if (fromBlock)
            params.append('fromBlock', fromBlock.toString());
        if (toBlock)
            params.append('toBlock', toBlock.toString());
        params.append('limit', limit.toString());
        const response = await apiClient.get('/events', { params });
        return response.data.items || [];
    }
    /**
     * Get market statistics
     */
    async getMarketStats(marketAddress) {
        const response = await apiClient.get(`/markets/${marketAddress}/stats`);
        return response.data;
    }
}
export default new LendingAPIService();
