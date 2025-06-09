// Enhanced transaction manager using WASM for real NEAR transactions
import { CONFIG, USDC_ABI, ERRORS, MESSAGES } from '../config/constants.js';
import { EventEmitter } from './eventEmitter.js';

export class WasmTransactionManager extends EventEmitter {
    constructor(logger) {
        super();
        this.logger = logger;
        this.currentTransaction = null;
        this.wasmModule = null;
        this.isWasmLoaded = false;
    }

    async initWasm() {
        if (this.isWasmLoaded) return;

        try {
            this.logger.info('Loading WASM module...');
            
            // Dynamic import of WASM module
            const wasmModule = await import('../wasm/index.js');
            this.wasmModule = wasmModule;
            this.isWasmLoaded = true;
            
            this.logger.success('WASM module loaded successfully');
            this.logger.info(`WASM version: ${wasmModule.get_version()}`);
        } catch (error) {
            this.logger.error(`Failed to load WASM module: ${error.message}`);
            throw new Error('WASM module initialization failed');
        }
    }

    async executeCrossChainTransfer(formData, nearWallet, baseWallet) {
        try {
            // Ensure WASM is loaded
            await this.initWasm();
            
            this.emit('statusUpdate', 'Preparing cross-chain transfer...');
            
            // Step 1: Get NEAR network info
            this.logger.info('Step 1: Getting NEAR network information');
            const nearNetworkInfo = await this.getNearNetworkInfo(nearWallet);
            
            // Step 2: Create NEAR authorization transaction using WASM
            this.logger.info('Step 2: Creating NEAR authorization transaction with WASM');
            const nearTxData = await this.createNearAuthTransactionWasm(formData, nearNetworkInfo);
            
            // Step 3: Sign and submit NEAR transaction
            this.logger.info('Step 3: Signing and submitting NEAR transaction');
            this.emit('statusUpdate', 'Signing NEAR authorization...');
            const nearResult = await this.signNearTransactionWasm(nearTxData, nearWallet);
            
            const nearTxHash = nearResult.transaction?.hash || nearResult.hash;
            this.emit('nearTxHash', nearTxHash);
            
            // Step 4: Wait for NEAR confirmation
            this.logger.info('Step 4: Waiting for NEAR confirmation');
            this.emit('statusUpdate', 'Waiting for NEAR confirmation...');
            await this.waitForNearConfirmation(nearTxHash);
            
            // Step 5: Check USDC balance and allowance
            this.logger.info('Step 5: Checking USDC balance and allowance');
            this.emit('statusUpdate', 'Checking USDC balance...');
            await this.checkUSDCBalance(formData, baseWallet);
            
            // Step 6: Create Base transaction using NEAR signature
            this.logger.info('Step 6: Creating Base transaction');
            this.emit('statusUpdate', 'Creating Base transaction...');
            const baseTx = await this.createBaseTransaction(formData, nearResult);
            
            // Step 7: Submit Base transaction
            this.logger.info('Step 7: Submitting Base transaction');
            this.emit('statusUpdate', 'Submitting Base transaction...');
            const baseTxHash = await this.submitBaseTransaction(baseTx, baseWallet);
            this.emit('baseTxHash', baseTxHash);
            
            // Step 8: Wait for Base confirmation
            this.logger.info('Step 8: Waiting for Base confirmation');
            this.emit('statusUpdate', 'Waiting for Base confirmation...');
            await this.waitForBaseConfirmation(baseTxHash);
            
            this.emit('statusUpdate', 'Cross-chain transfer completed successfully!');
            this.logger.success('Cross-chain transfer completed');
            
        } catch (error) {
            this.logger.error(`Cross-chain transfer failed: ${error.message}`);
            this.emit('statusUpdate', `Transfer failed: ${error.message}`);
            throw error;
        }
    }

    async getNearNetworkInfo(nearWallet) {
        try {
            // Get account info to get nonce
            const accountId = nearWallet.getAccountId();
            
            // Get latest block hash
            const response = await fetch(CONFIG.NETWORKS.NEAR.nodeUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 'dontcare',
                    method: 'block',
                    params: { finality: 'final' }
                })
            });
            
            const blockResult = await response.json();
            const blockHash = blockResult.result.header.hash;
            
            // Get account access key info for nonce
            const accessKeyResponse = await fetch(CONFIG.NETWORKS.NEAR.nodeUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 'dontcare',
                    method: 'query',
                    params: {
                        request_type: 'view_access_key_list',
                        finality: 'final',
                        account_id: accountId
                    }
                })
            });
            
            const accessKeyResult = await accessKeyResponse.json();
            const nonce = accessKeyResult.result.keys[0]?.nonce || 0;
            
            return {
                accountId,
                blockHash,
                nonce: nonce + 1, // Increment nonce for next transaction
                publicKey: accessKeyResult.result.keys[0]?.public_key || 'ed25519:11111111111111111111111111111111'
            };
        } catch (error) {
            this.logger.error(`Failed to get NEAR network info: ${error.message}`);
            // Fallback to dummy values for demo
            return {
                accountId: nearWallet.getAccountId(),
                blockHash: '11111111111111111111111111111111',
                nonce: Date.now(),
                publicKey: 'ed25519:11111111111111111111111111111111'
            };
        }
    }

    async createNearAuthTransactionWasm(formData, networkInfo) {
        if (!this.wasmModule) {
            throw new Error('WASM module not loaded');
        }

        const transactionData = {
            signer_id: networkInfo.accountId,
            signer_public_key: networkInfo.publicKey,
            nonce: networkInfo.nonce,
            receiver_id: CONFIG.CONTRACTS.BRIDGE_NEAR,
            block_hash: networkInfo.blockHash,
            method_name: 'authorize_cross_chain_transfer',
            args: JSON.stringify({
                target_chain: 'base',
                token: 'USDC',
                amount: formData.amount,
                recipient: formData.recipient,
                nonce: Date.now()
            }),
            gas: '30000000000000',
            deposit: '0'
        };

        try {
            // Validate transaction data
            const isValid = this.wasmModule.validate_near_transaction(transactionData);
            if (!isValid) {
                throw new Error('Invalid transaction data');
            }

            // Build transaction using WASM
            const result = this.wasmModule.build_near_transaction(transactionData);
            
            this.logger.info(`Created NEAR auth transaction using WASM for ${formData.amount} USDC`);
            this.logger.info(`Transaction hash: ${result.transaction_hash}`);
            
            return {
                ...transactionData,
                wasmResult: result
            };
        } catch (error) {
            this.logger.error(`WASM transaction creation failed: ${error.message}`);
            throw error;
        }
    }

    async signNearTransactionWasm(nearTxData, nearWallet) {
        try {
            // Convert WASM transaction data to wallet-compatible format
            const walletTransaction = {
                receiverId: nearTxData.receiver_id,
                actions: [{
                    type: 'FunctionCall',
                    params: {
                        methodName: nearTxData.method_name,
                        args: JSON.parse(nearTxData.args),
                        gas: nearTxData.gas,
                        deposit: nearTxData.deposit
                    }
                }]
            };

            // Sign with wallet
            const result = await nearWallet.signTransaction(walletTransaction);
            
            this.logger.success('NEAR transaction signed successfully');
            return result;
        } catch (error) {
            this.logger.error(`NEAR transaction signing failed: ${error.message}`);
            throw error;
        }
    }

    async checkUSDCBalance(formData, baseWallet) {
        try {
            const userAddress = await this.getCurrentAddress(baseWallet);
            const amountWei = this.parseUSDCAmount(formData.amount);
            
            // Check USDC balance
            const balanceData = await window.ethereum.request({
                method: 'eth_call',
                params: [{
                    to: CONFIG.CONTRACTS.USDC_BASE,
                    data: '0x70a08231' + userAddress.slice(2).padStart(64, '0') // balanceOf(address)
                }, 'latest']
            });
            
            const balance = parseInt(balanceData, 16);
            this.logger.info(`USDC balance: ${balance / Math.pow(10, 6)} USDC`);
            
            if (balance < parseInt(amountWei)) {
                throw new Error(`Insufficient USDC balance. Required: ${formData.amount}, Available: ${balance / Math.pow(10, 6)}`);
            }
            
            return true;
        } catch (error) {
            this.logger.error(`Balance check failed: ${error.message}`);
            throw error;
        }
    }

    async getCurrentAddress(baseWallet) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (!accounts || accounts.length === 0) {
            throw new Error('No Ethereum accounts connected');
        }
        return accounts[0];
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

    async waitForNearConfirmation(txHash) {
        this.logger.info(`Waiting for NEAR confirmation: ${txHash}`);

        for (let i = 0; i < 10; i++) {
            try {
                const response = await fetch(CONFIG.NETWORKS.NEAR.nodeUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
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
