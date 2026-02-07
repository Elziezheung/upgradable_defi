import { ethers } from 'ethers';

// Contract ABIs
const LENDING_TOKEN_ABI = [
  'function mint(uint256 mintAmount) external',
  'function redeem(uint256 redeemTokens) external',
  'function borrow(uint256 borrowAmount) external',
  'function repayBorrow(uint256 repayAmount) external',
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function underlying() view returns (address)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function exchangeRateCurrent() view returns (uint256)',
  'function supplyRatePerBlock() view returns (uint256)',
  'function borrowRatePerBlock() view returns (uint256)',
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
  'function getAccountLiquidity(address account) view returns (uint256, uint256, uint256)',
  'function getAllMarkets() view returns (address[])',
];

const LIQUIDITY_MINING_ABI = [
  'function stake(uint256 amount) external',
  'function withdraw(uint256 amount) external',
  'function claim() external',
  'function stakingToken() view returns (address)',
  'function rewardsToken() view returns (address)',
  'function balanceOf(address account) view returns (uint256)',
  'function earned(address account) view returns (uint256)',
];

// Contract addresses (should match backend config)
const CONTRACTS = {
  comptroller: '0x5f3f1dbd7b74c6b46e8c44f98792a1daf8d69154',
  markets: [
    '0xCD8a1C3ba11CF5ECfa6267617243239504a98d90', // dUSDC
    '0x2bdCC0de6bE1f7D2ee689a0342D76F52E8EFABa3', // dWETH
  ],
  liquidityMining: [
    '0xdbc43ba45381e02825b14322cddd15ec4b3164e6', // USDC Mining
    '0x4c4a2f8c81640e47606d3fd77b353e87ba015584', // WETH Mining
  ],
};

class Web3Service {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private account: string | null = null;

  async connect(): Promise<string> {
    if (!window.ethereum) {
      throw new Error('MetaMask or compatible wallet not found');
    }

    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
    this.account = await this.signer.getAddress();

    return this.account;
  }

  async disconnect(): Promise<void> {
    this.provider = null;
    this.signer = null;
    this.account = null;
  }

  getAccount(): string | null {
    return this.account;
  }

  getProvider(): ethers.BrowserProvider | null {
    return this.provider;
  }

  getSigner(): ethers.JsonRpcSigner | null {
    return this.signer;
  }

  // Supply tokens to a lending market
  async supply(marketAddress: string, amount: string, underlyingAddress: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    const amountBN = ethers.parseUnits(amount, 18); // Assuming 18 decimals
    const underlyingContract = new ethers.Contract(underlyingAddress, ERC20_ABI, this.signer);
    const marketContract = new ethers.Contract(marketAddress, LENDING_TOKEN_ABI, this.signer);

    // Approve the market to spend tokens
    const allowance = await underlyingContract.allowance(this.account, marketAddress);
    if (allowance < amountBN) {
      const approveTx = await underlyingContract.approve(marketAddress, ethers.MaxUint256);
      await approveTx.wait();
    }

    // Supply tokens
    const tx = await marketContract.mint(amountBN);
    await tx.wait();

    return tx.hash;
  }

  // Redeem tokens from a lending market
  async redeem(marketAddress: string, amount: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    const amountBN = ethers.parseUnits(amount, 18);
    const marketContract = new ethers.Contract(marketAddress, LENDING_TOKEN_ABI, this.signer);

    const tx = await marketContract.redeem(amountBN);
    await tx.wait();

    return tx.hash;
  }

  // Borrow tokens from a lending market
  async borrow(marketAddress: string, amount: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    const amountBN = ethers.parseUnits(amount, 18);
    const marketContract = new ethers.Contract(marketAddress, LENDING_TOKEN_ABI, this.signer);

    const tx = await marketContract.borrow(amountBN);
    await tx.wait();

    return tx.hash;
  }

  // Repay borrowed tokens
  async repay(marketAddress: string, amount: string, underlyingAddress: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    const amountBN = ethers.parseUnits(amount, 18);
    const underlyingContract = new ethers.Contract(underlyingAddress, ERC20_ABI, this.signer);
    const marketContract = new ethers.Contract(marketAddress, LENDING_TOKEN_ABI, this.signer);

    // Approve if needed
    const allowance = await underlyingContract.allowance(this.account, marketAddress);
    if (allowance < amountBN) {
      const approveTx = await underlyingContract.approve(marketAddress, ethers.MaxUint256);
      await approveTx.wait();
    }

    const tx = await marketContract.repayBorrow(amountBN);
    await tx.wait();

    return tx.hash;
  }

  // Enter market (enable as collateral)
  async enterMarkets(markets: string[]): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    const comptrollerContract = new ethers.Contract(CONTRACTS.comptroller, COMPTROLLER_ABI, this.signer);

    const tx = await comptrollerContract.enterMarkets(markets);
    await tx.wait();

    return tx.hash;
  }

  // Stake in liquidity mining
  async stake(miningAddress: string, amount: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    const amountBN = ethers.parseUnits(amount, 18);
    const miningContract = new ethers.Contract(miningAddress, LIQUIDITY_MINING_ABI, this.signer);

    // Get staking token (usually the dToken)
    const stakingToken = await miningContract.stakingToken();
    const stakingContract = new ethers.Contract(stakingToken, ERC20_ABI, this.signer);

    // Approve
    const allowance = await stakingContract.allowance(this.account, miningAddress);
    if (allowance < amountBN) {
      const approveTx = await stakingContract.approve(miningAddress, ethers.MaxUint256);
      await approveTx.wait();
    }

    // Stake
    const tx = await miningContract.stake(amountBN);
    await tx.wait();

    return tx.hash;
  }

  // Withdraw from liquidity mining
  async withdraw(miningAddress: string, amount: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    const amountBN = ethers.parseUnits(amount, 18);
    const miningContract = new ethers.Contract(miningAddress, LIQUIDITY_MINING_ABI, this.signer);

    const tx = await miningContract.withdraw(amountBN);
    await tx.wait();

    return tx.hash;
  }

  // Claim rewards
  async claim(miningAddress: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    const miningContract = new ethers.Contract(miningAddress, LIQUIDITY_MINING_ABI, this.signer);

    const tx = await miningContract.claim();
    await tx.wait();

    return tx.hash;
  }

  // Get user's balance of a token
  async getTokenBalance(tokenAddress: string): Promise<bigint> {
    if (!this.account) return 0n;

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    return await tokenContract.balanceOf(this.account);
  }

  // Get user's dToken balance (supplied amount)
  async getSuppliedBalance(marketAddress: string): Promise<bigint> {
    if (!this.account) return 0n;

    const marketContract = new ethers.Contract(marketAddress, LENDING_TOKEN_ABI, this.provider);
    return await marketContract.balanceOf(this.account);
  }
}

export default new Web3Service();
