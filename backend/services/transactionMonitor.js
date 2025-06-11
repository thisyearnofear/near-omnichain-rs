import { ethers } from 'ethers';

export class TransactionMonitor {
  constructor() {
    this.providers = {
      ethereum: null,
      base: null,
      near: null
    };
    this.initialized = false;
  }

  async initialize() {
    try {
      this.providers.ethereum = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
      this.providers.base = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
      
      this.initialized = true;
      console.log('✅ Transaction Monitor initialized');
    } catch (error) {
      console.error('❌ Transaction Monitor initialization failed:', error);
      throw error;
    }
  }

  async getTransactionStatus(txHash) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Try to find the transaction on different networks
      const results = await Promise.allSettled([
        this.getEthereumTxStatus(txHash),
        this.getBaseTxStatus(txHash),
        this.getNearTxStatus(txHash)
      ]);

      // Find the successful result
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.found) {
          return result.value;
        }
      }

      return {
        found: false,
        status: 'not_found',
        message: 'Transaction not found on any monitored network'
      };
    } catch (error) {
      return {
        found: false,
        status: 'error',
        error: error.message
      };
    }
  }

  async getEthereumTxStatus(txHash) {
    try {
      const receipt = await this.providers.ethereum.getTransactionReceipt(txHash);
      
      if (!receipt) {
        const tx = await this.providers.ethereum.getTransaction(txHash);
        if (tx) {
          return {
            found: true,
            network: 'ethereum',
            status: 'pending',
            txHash: txHash,
            blockNumber: null,
            confirmations: 0
          };
        }
        return { found: false };
      }

      const currentBlock = await this.providers.ethereum.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber;

      return {
        found: true,
        network: 'ethereum',
        status: receipt.status === 1 ? 'success' : 'failed',
        txHash: txHash,
        blockNumber: receipt.blockNumber,
        confirmations: confirmations,
        gasUsed: receipt.gasUsed.toString(),
        timestamp: await this.getBlockTimestamp('ethereum', receipt.blockNumber)
      };
    } catch (error) {
      return { found: false, error: error.message };
    }
  }

  async getBaseTxStatus(txHash) {
    try {
      const receipt = await this.providers.base.getTransactionReceipt(txHash);
      
      if (!receipt) {
        const tx = await this.providers.base.getTransaction(txHash);
        if (tx) {
          return {
            found: true,
            network: 'base',
            status: 'pending',
            txHash: txHash,
            blockNumber: null,
            confirmations: 0
          };
        }
        return { found: false };
      }

      const currentBlock = await this.providers.base.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber;

      return {
        found: true,
        network: 'base',
        status: receipt.status === 1 ? 'success' : 'failed',
        txHash: txHash,
        blockNumber: receipt.blockNumber,
        confirmations: confirmations,
        gasUsed: receipt.gasUsed.toString(),
        timestamp: await this.getBlockTimestamp('base', receipt.blockNumber)
      };
    } catch (error) {
      return { found: false, error: error.message };
    }
  }

  async getNearTxStatus(txHash) {
    try {
      // NEAR transaction monitoring would require near-api-js
      // For now, return not found
      return { found: false };
    } catch (error) {
      return { found: false, error: error.message };
    }
  }

  async getBlockTimestamp(network, blockNumber) {
    try {
      const block = await this.providers[network].getBlock(blockNumber);
      return new Date(block.timestamp * 1000).toISOString();
    } catch (error) {
      return null;
    }
  }

  async waitForConfirmation(txHash, network, requiredConfirmations = 3, timeoutMs = 300000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const status = await this.getTransactionStatus(txHash);
        
        if (status.found && status.network === network) {
          if (status.status === 'failed') {
            throw new Error(`Transaction failed: ${txHash}`);
          }
          
          if (status.status === 'success' && status.confirmations >= requiredConfirmations) {
            return status;
          }
        }
        
        // Wait 10 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 10000));
      } catch (error) {
        console.error(`Error checking transaction ${txHash}:`, error);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    throw new Error(`Transaction confirmation timeout: ${txHash}`);
  }

  async estimateConfirmationTime(network) {
    const blockTimes = {
      ethereum: 12, // ~12 seconds per block
      base: 2,      // ~2 seconds per block
      near: 1       // ~1 second per block
    };

    return {
      network,
      averageBlockTime: blockTimes[network] || 15,
      estimatedConfirmationTime: (blockTimes[network] || 15) * 3 // 3 confirmations
    };
  }
}
