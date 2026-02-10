/**
 * Lending Web3 Service
 * Handles all blockchain interactions for lending operations
 */
import { ethers } from 'ethers';
// Contract ABIs
const LENDING_TOKEN_ABI = [
    'function mint(uint256 mintAmount) external returns (uint256)',
    'function redeem(uint256 redeemTokens) external returns (uint256)',
    'function redeemUnderlying(uint256 redeemAmount) external returns (uint256)',
    'function borrow(uint256 borrowAmount) external returns (uint256)',
    'function repayBorrow(uint256 repayAmount) external returns (uint256)',
    'function balanceOf(address owner) view returns (uint256)',
    'function borrowBalanceCurrent(address account) view returns (uint256)',
    'function exchangeRateCurrent() view returns (uint256)',
    'function underlying() view returns (address)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function supplyRatePerBlock() view returns (uint256)',
    'function borrowRatePerBlock() view returns (uint256)',
    'function totalSupply() view returns (uint256)',
    'function totalBorrows() view returns (uint256)',
    'function getCash() view returns (uint256)',
];
const ERC20_ABI = [
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function transfer(address to, uint256 amount) external returns (bool)',
];
const COMPTROLLER_ABI = [
    'function enterMarkets(address[] calldata cTokens) external returns (uint256[])',
    'function exitMarket(address cTokenAddress) external returns (uint256)',
    'function getAccountLiquidity(address account) view returns (uint256, uint256)',
    'function getAllMarkets() view returns (address[])',
    'function markets(address) view returns (bool, uint256)',
];
class LendingWeb3Service {
    constructor() {
        Object.defineProperty(this, "provider", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "signer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "account", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
    }
    /**
     * Connect to wallet
     */
    async connect() {
        if (!window.ethereum) {
            throw new Error('Please install MetaMask or a compatible wallet');
        }
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        this.account = await this.signer.getAddress();
        return this.account;
    }
    /**
     * Disconnect wallet
     */
    async disconnect() {
        this.provider = null;
        this.signer = null;
        this.account = null;
    }
    getAccount() {
        return this.account;
    }
    getProvider() {
        return this.provider;
    }
    getSigner() {
        return this.signer;
    }
    /**
     * Supply tokens to lending market
     */
    async supply(marketAddress, amount, underlyingAddress) {
        if (!this.signer) {
            throw new Error('Wallet not connected');
        }
        // Approve underlying token
        const underlyingContract = new ethers.Contract(underlyingAddress, ERC20_ABI, this.signer);
        const decimals = await underlyingContract.decimals();
        const amountWei = ethers.parseUnits(amount, decimals);
        // Check allowance
        const allowance = await underlyingContract.allowance(this.account, marketAddress);
        if (allowance < amountWei) {
            const approveTx = await underlyingContract.approve(marketAddress, ethers.MaxUint256);
            await approveTx.wait();
        }
        // Mint lending tokens
        const lendingContract = new ethers.Contract(marketAddress, LENDING_TOKEN_ABI, this.signer);
        const mintTx = await lendingContract.mint(amountWei);
        const receipt = await mintTx.wait();
        return receipt.hash;
    }
    /**
     * Withdraw tokens from lending market
     */
    async withdraw(marketAddress, amount, isUnderlying = true) {
        if (!this.signer) {
            throw new Error('Wallet not connected');
        }
        const lendingContract = new ethers.Contract(marketAddress, LENDING_TOKEN_ABI, this.signer);
        let tx;
        if (isUnderlying) {
            const underlyingAddress = await lendingContract.underlying();
            const underlyingContract = new ethers.Contract(underlyingAddress, ERC20_ABI, this.signer);
            const decimals = await underlyingContract.decimals();
            const amountWei = ethers.parseUnits(amount, decimals);
            tx = await lendingContract.redeemUnderlying(amountWei);
        }
        else {
            const decimals = await lendingContract.decimals();
            const amountWei = ethers.parseUnits(amount, decimals);
            tx = await lendingContract.redeem(amountWei);
        }
        const receipt = await tx.wait();
        return receipt.hash;
    }
    /**
     * Borrow tokens from lending market
     */
    async borrow(marketAddress, amount) {
        if (!this.signer) {
            throw new Error('Wallet not connected');
        }
        const lendingContract = new ethers.Contract(marketAddress, LENDING_TOKEN_ABI, this.signer);
        const underlyingAddress = await lendingContract.underlying();
        const underlyingContract = new ethers.Contract(underlyingAddress, ERC20_ABI, this.signer);
        const decimals = await underlyingContract.decimals();
        const amountWei = ethers.parseUnits(amount, decimals);
        const borrowTx = await lendingContract.borrow(amountWei);
        const receipt = await borrowTx.wait();
        return receipt.hash;
    }
    /**
     * Repay borrowed tokens
     */
    async repay(marketAddress, amount, underlyingAddress) {
        if (!this.signer) {
            throw new Error('Wallet not connected');
        }
        const underlyingContract = new ethers.Contract(underlyingAddress, ERC20_ABI, this.signer);
        const decimals = await underlyingContract.decimals();
        const amountWei = ethers.parseUnits(amount, decimals);
        // Check allowance
        const allowance = await underlyingContract.allowance(this.account, marketAddress);
        if (allowance < amountWei) {
            const approveTx = await underlyingContract.approve(marketAddress, ethers.MaxUint256);
            await approveTx.wait();
        }
        // Repay borrow
        const lendingContract = new ethers.Contract(marketAddress, LENDING_TOKEN_ABI, this.signer);
        const repayTx = await lendingContract.repayBorrow(amountWei);
        const receipt = await repayTx.wait();
        return receipt.hash;
    }
    /**
     * Enter markets (enable as collateral)
     */
    async enterMarkets(comptrollerAddress, marketAddresses) {
        if (!this.signer) {
            throw new Error('Wallet not connected');
        }
        const comptroller = new ethers.Contract(comptrollerAddress, COMPTROLLER_ABI, this.signer);
        const tx = await comptroller.enterMarkets(marketAddresses);
        const receipt = await tx.wait();
        return receipt.hash;
    }
    /**
     * Exit market (disable as collateral)
     */
    async exitMarket(comptrollerAddress, marketAddress) {
        if (!this.signer) {
            throw new Error('Wallet not connected');
        }
        const comptroller = new ethers.Contract(comptrollerAddress, COMPTROLLER_ABI, this.signer);
        const tx = await comptroller.exitMarket(marketAddress);
        const receipt = await tx.wait();
        return receipt.hash;
    }
    /**
     * Get user's underlying balance
     */
    async getUnderlyingBalance(underlyingAddress) {
        if (!this.signer || !this.account) {
            throw new Error('Wallet not connected');
        }
        const contract = new ethers.Contract(underlyingAddress, ERC20_ABI, this.signer);
        const balance = await contract.balanceOf(this.account);
        const decimals = await contract.decimals();
        return ethers.formatUnits(balance, decimals);
    }
    /**
     * Get user's lending token balance
     */
    async getLendingTokenBalance(marketAddress) {
        if (!this.signer || !this.account) {
            throw new Error('Wallet not connected');
        }
        const contract = new ethers.Contract(marketAddress, LENDING_TOKEN_ABI, this.signer);
        const balance = await contract.balanceOf(this.account);
        const decimals = await contract.decimals();
        return ethers.formatUnits(balance, decimals);
    }
}
export default new LendingWeb3Service();
