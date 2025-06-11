import { ethers } from 'ethers';

// Chainlink CCIP Router ABI (simplified)
const CCIP_ROUTER_ABI = [
  "function ccipSend(uint64 destinationChainSelector, tuple(bytes receiver, bytes data, tuple(address token, uint256 amount)[] tokenAmounts, address feeToken, bytes extraArgs) message) external payable returns (bytes32)",
  "function getFee(uint64 destinationChainSelector, tuple(bytes receiver, bytes data, tuple(address token, uint256 amount)[] tokenAmounts, address feeToken, bytes extraArgs) message) external view returns (uint256 fee)"
];

// USDC Token ABI (simplified)
const USDC_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)"
];

export class ChainlinkCCIPService {
  constructor() {
    this.ethereumProvider = null;
    this.baseProvider = null;
    this.ethereumSigner = null;
    this.baseSigner = null;
    this.initialized = false;
    
    // Mainnet addresses
    this.addresses = {
      ethereum: {
        ccipRouter: '0x80226fc0Ee2b096224EeAc085Bb9a8cba1146f7D', // Ethereum CCIP Router
        usdc: '0xA0b86a33E6441b8C0b8C8C0b8C8C0b8C8C0b8C8C', // USDC on Ethereum
        chainSelector: '5009297550715157269' // Ethereum chain selector
      },
      base: {
        ccipRouter: '0x881e3A65B4d4a04dD529061dd0071cf975F58bCD', // Base CCIP Router  
        usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
        chainSelector: '15971525489660198786' // Base chain selector
      }
    };
  }

  async initialize() {
    try {
      // Initialize Ethereum provider and signer
      this.ethereumProvider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
      this.ethereumSigner = new ethers.Wallet(process.env.ETHEREUM_PRIVATE_KEY, this.ethereumProvider);

      // Initialize Base provider and signer
      this.baseProvider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
      this.baseSigner = new ethers.Wallet(process.env.BASE_PRIVATE_KEY, this.baseProvider);

      this.initialized = true;
      console.log('✅ Chainlink CCIP Service initialized');
    } catch (error) {
      console.error('❌ Chainlink CCIP initialization failed:', error);
      throw error;
    }
  }

  async getStatus() {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Check both networks
      const ethBlock = await this.ethereumProvider.getBlockNumber();
      const baseBlock = await this.baseProvider.getBlockNumber();

      return {
        ready: true,
        ethereum: {
          latestBlock: ethBlock,
          ccipRouter: this.addresses.ethereum.ccipRouter,
          usdc: this.addresses.ethereum.usdc
        },
        base: {
          latestBlock: baseBlock,
          ccipRouter: this.addresses.base.ccipRouter,
          usdc: this.addresses.base.usdc
        }
      };
    } catch (error) {
      return {
        ready: false,
        error: error.message
      };
    }
  }

  async transferToBase({ amount, recipient, ethereumTxHash }) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Validate inputs
      if (!ethers.isAddress(recipient)) {
        throw new Error('Invalid Base recipient address');
      }

      const amountWei = ethers.parseUnits(amount.toString(), 6); // USDC has 6 decimals

      // Get contracts
      const ccipRouter = new ethers.Contract(
        this.addresses.ethereum.ccipRouter,
        CCIP_ROUTER_ABI,
        this.ethereumSigner
      );

      const usdcContract = new ethers.Contract(
        this.addresses.ethereum.usdc,
        USDC_ABI,
        this.ethereumSigner
      );

      // Approve CCIP router to spend USDC
      const approveTx = await usdcContract.approve(
        this.addresses.ethereum.ccipRouter,
        amountWei
      );
      await approveTx.wait();

      // Prepare CCIP message
      const message = {
        receiver: ethers.AbiCoder.defaultAbiCoder().encode(['address'], [recipient]),
        data: '0x', // No additional data
        tokenAmounts: [{
          token: this.addresses.ethereum.usdc,
          amount: amountWei
        }],
        feeToken: ethers.ZeroAddress, // Pay fees in native ETH
        extraArgs: '0x' // No extra args
      };

      // Get fee estimate
      const fee = await ccipRouter.getFee(
        this.addresses.base.chainSelector,
        message
      );

      // Send CCIP message
      const ccipTx = await ccipRouter.ccipSend(
        this.addresses.base.chainSelector,
        message,
        { value: fee }
      );

      const receipt = await ccipTx.wait();

      return {
        success: true,
        txHash: receipt.hash,
        ethereumTxHash: receipt.hash,
        baseTxHash: null, // Will be available after CCIP processing
        amount: amount,
        recipient: recipient,
        fee: ethers.formatEther(fee),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Chainlink CCIP transfer failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getAddress() {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.ethereumSigner.address;
  }

  async estimateFee(amount, recipient) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const amountWei = ethers.parseUnits(amount.toString(), 6);
      
      const ccipRouter = new ethers.Contract(
        this.addresses.ethereum.ccipRouter,
        CCIP_ROUTER_ABI,
        this.ethereumProvider
      );

      const message = {
        receiver: ethers.AbiCoder.defaultAbiCoder().encode(['address'], [recipient]),
        data: '0x',
        tokenAmounts: [{
          token: this.addresses.ethereum.usdc,
          amount: amountWei
        }],
        feeToken: ethers.ZeroAddress,
        extraArgs: '0x'
      };

      const fee = await ccipRouter.getFee(
        this.addresses.base.chainSelector,
        message
      );

      return {
        fee: ethers.formatEther(fee),
        feeWei: fee.toString()
      };
    } catch (error) {
      throw new Error(`Fee estimation failed: ${error.message}`);
    }
  }

  async getTransactionStatus(txHash) {
    try {
      const receipt = await this.ethereumProvider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return { status: 'pending' };
      }

      return {
        status: receipt.status === 1 ? 'success' : 'failed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        confirmed: true
      };
    } catch (error) {
      return {
        status: 'unknown',
        error: error.message
      };
    }
  }
}
