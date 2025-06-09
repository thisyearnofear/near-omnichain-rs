// Transaction management module
import { CONFIG, USDC_ABI, ERRORS, MESSAGES } from '../config/constants.js';
import { EventEmitter } from './eventEmitter.js';

export class TransactionManager extends EventEmitter {
    constructor(logger) {
        super();
        this.logger = logger;
        this.currentTransaction = null;
    }

    async executeCrossChainTransfer(formData, nearWallet, baseWallet) {
        try {
            this.emit('statusUpdate', 'Preparing cross-chain transfer...');
            
            // Step 1: Create NEAR authorization transaction
            this.logger.info('Step 1: Creating NEAR authorization transaction');
            const nearTx = await this.createNearAuthTransaction(formData);
            
            // Step 2: Sign and submit NEAR transaction
            this.logger.info('Step 2: Signing and submitting NEAR transaction');
            this.emit('statusUpdate', 'Signing NEAR authorization...');
            const nearResult = await this.signNearTransaction(nearTx, nearWallet);
            
            const nearTxHash = nearResult.transaction?.hash || nearResult.hash;
            this.emit('nearTxHash', nearTxHash);
            
            // Step 3: Wait for NEAR confirmation
            this.logger.info('Step 3: Waiting for NEAR confirmation');
            this.emit('statusUpdate', 'Waiting for NEAR confirmation...');
            await this.waitForNearConfirmation(nearTxHash);
            
            // Step 4: Create Base transaction using NEAR signature
            this.logger.info('Step 4: Creating Base transaction');
            this.emit('statusUpdate', 'Creating Base transaction...');
            const baseTx = await this.createBaseTransaction(formData, nearResult);
            
            // Step 5: Submit Base transaction
            this.logger.info('Step 5: Submitting Base transaction');
            this.emit('statusUpdate', 'Submitting Base transaction...');
            const baseTxHash = await this.submitBaseTransaction(baseTx, baseWallet);
            this.emit('baseTxHash', baseTxHash);
            
            // Step 6: Wait for Base confirmation
            this.logger.info('Step 6: Waiting for Base confirmation');
            this.emit('statusUpdate', 'Waiting for Base confirmation...');
            await this.waitForBaseConfirmation(baseTxHash);
            
            this.emit('statusUpdate', 'Cross-chain transfer completed!');
            this.logger.success(MESSAGES.CROSS_CHAIN_COMPLETE);
            
        } catch (error) {
            this.emit('statusUpdate', 'Transfer failed');
            this.logger.error(`Cross-chain transfer failed: ${error.message}`);
            throw error;
        }
    }

    async createNearAuthTransaction(formData) {
        const transaction = {
            receiverId: CONFIG.CONTRACTS.BRIDGE_NEAR,
            actions: [{
                type: 'FunctionCall',
                params: {
                    methodName: 'authorize_cross_chain_transfer',
                    args: {
                        target_chain: 'base',
                        token: 'USDC',
                        amount: formData.amount,
                        recipient: formData.recipient,
                        nonce: Date.now()
                    },
                    gas: '30000000000000',
                    deposit: '0'
                }
            }]
        };

        this.logger.info(`Created NEAR auth transaction for ${formData.amount} USDC`);
        return transaction;
    }

    async signNearTransaction(transaction, nearWallet) {
        return await nearWallet.signNearTransaction(transaction);
    }

    async waitForNearConfirmation(txHash) {
        this.logger.info(`Waiting for NEAR confirmation: ${txHash}`);
        
        for (let i = 0; i < 10; i++) {
            try {
                const response = await fetch(CONFIG.NETWORKS.NEAR.nodeUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: 'dontcare',
                        method: 'tx',
                        params: [txHash, 'unused']
                    })
                });
                
                const result = await response.json();
                if (result.result) {
                    this.logger.success('NEAR transaction confirmed');
                    return;
                }
            } catch (error) {
                // Continue polling
            }
            
            await this.delay(2000);
            this.logger.info(`NEAR confirmation check ${i + 1}/10`);
        }
        
        throw new Error('NEAR transaction confirmation timeout');
    }

    async createBaseTransaction(formData, nearResult) {
        const amountWei = this.parseUSDCAmount(formData.amount);
        
        const transaction = {
            to: CONFIG.CONTRACTS.USDC_BASE,
            data: this.encodeUSDCTransfer(formData.recipient, amountWei),
            gas: '0x15F90', // 90000 for ERC20 transfer
            gasPrice: '0x4A817C800', // 20 Gwei
            value: '0x0'
        };

        this.logger.info(`Created Base transaction for ${formData.amount} USDC to ${formData.recipient}`);
        return transaction;
    }

    async submitBaseTransaction(transaction, baseWallet) {
        try {
            this.logger.info('Submitting Base transaction...');
            
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [transaction],
            });
            
            this.logger.success(`Base transaction submitted: ${txHash}`);
            return txHash;
        } catch (error) {
            this.logger.error(`Base submission failed: ${error.message}`);
            throw error;
        }
    }

    async waitForBaseConfirmation(txHash) {
        this.logger.info(`Waiting for Base confirmation: ${txHash}`);
        
        for (let i = 0; i < 20; i++) {
            try {
                const receipt = await window.ethereum.request({
                    method: 'eth_getTransactionReceipt',
                    params: [txHash],
                });
                
                if (receipt && receipt.status === '0x1') {
                    this.logger.success('Base transaction confirmed');
                    return;
                }
            } catch (error) {
                // Continue polling
            }
            
            await this.delay(3000);
            this.logger.info(`Base confirmation check ${i + 1}/20`);
        }
        
        throw new Error('Base transaction confirmation timeout');
    }

    parseUSDCAmount(amount) {
        // Convert amount to USDC units (6 decimals)
        const decimals = CONFIG.TRANSACTION.USDC_DECIMALS;
        return (parseFloat(amount) * Math.pow(10, decimals)).toString();
    }

    encodeUSDCTransfer(recipient, amount) {
        // Encode USDC transfer function call
        const methodId = '0xa9059cbb'; // transfer(address,uint256)
        const paddedRecipient = recipient.slice(2).padStart(64, '0');
        const paddedAmount = parseInt(amount).toString(16).padStart(64, '0');
        
        return methodId + paddedRecipient + paddedAmount;
    }

    async estimateGas() {
        try {
            const gasPrice = await window.ethereum.request({
                method: 'eth_gasPrice',
            });
            
            const gasPriceGwei = parseInt(gasPrice, 16) / 1e9;
            const gasLimit = 90000; // ERC20 transfer
            const ethPrice = 2000; // USD
            
            const gasCostEth = (gasPriceGwei * gasLimit) / 1e9;
            const gasCostUsd = gasCostEth * ethPrice;
            
            return {
                gasPrice: gasPriceGwei.toFixed(2),
                gasLimit: gasLimit,
                estimatedCostEth: gasCostEth.toFixed(6),
                estimatedCostUsd: gasCostUsd.toFixed(2)
            };
        } catch (error) {
            // Fallback to default values
            return {
                gasPrice: 20,
                gasLimit: 90000,
                estimatedCostEth: '0.0018',
                estimatedCostUsd: '3.60'
            };
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}