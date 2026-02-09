import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});
class APIService {
    async getHealth() {
        const response = await apiClient.get('/health');
        return response.data;
    }
    async getMarkets() {
        const response = await apiClient.get('/markets');
        return response.data.items;
    }
    async getAccount(address) {
        const response = await apiClient.get(`/accounts/${address}`);
        return response.data;
    }
    async getEvents(contract, event, fromBlock, toBlock, limit = 100) {
        const params = new URLSearchParams();
        if (contract)
            params.append('contract', contract);
        if (event)
            params.append('event', event);
        if (fromBlock)
            params.append('fromBlock', fromBlock.toString());
        if (toBlock)
            params.append('toBlock', toBlock.toString());
        params.append('limit', limit.toString());
        const response = await apiClient.get('/events', { params });
        return response.data.items;
    }
    async getStats(contract, event, fromBlock, toBlock) {
        const params = new URLSearchParams();
        if (contract)
            params.append('contract', contract);
        if (event)
            params.append('event', event);
        if (fromBlock)
            params.append('fromBlock', fromBlock.toString());
        if (toBlock)
            params.append('toBlock', toBlock.toString());
        const response = await apiClient.get('/stats', { params });
        return response.data.items;
    }
}
export default new APIService();
