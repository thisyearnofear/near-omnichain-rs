// Main application entry point
import { WalletManager } from './modules/walletManager.js';
import { TransactionManager } from './modules/transactionManager.js';
import { WasmTransactionManager } from './modules/wasmTransactionManager.js';
import { ModernUIManager } from './modules/modernUIManager.js';
import { Logger } from './modules/logger.js';
import { CONFIG } from './config/constants.js';

class OmniTransactionApp {
    constructor() {
        this.logger = new Logger();
        this.walletManager = new WalletManager(this.logger);
        this.transactionManager = new TransactionManager(this.logger);
        this.wasmTransactionManager = new WasmTransactionManager(this.logger);
        this.uiManager = new ModernUIManager(this.logger);

        // Use WASM transaction manager by default, fallback to regular if WASM fails
        this.useWasm = true;

        this.init();
    }

    async init() {
        try {
            this.logger.log('Initializing Omni Transaction Demo...');
            
            // Initialize UI
            this.uiManager.init();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize wallet connections
            await this.walletManager.init();
            
            this.logger.log('Application initialized successfully', 'success');
        } catch (error) {
            this.logger.log(`Initialization failed: ${error.message}`, 'error');
        }
    }

    setupEventListeners() {
        // Wallet connection buttons
        document.getElementById('connect-near').addEventListener('click', () => {
            this.handleNearConnection();
        });

        document.getElementById('connect-base').addEventListener('click', () => {
            this.handleBaseConnection();
        });

        // Transaction form
        document.getElementById('transaction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTransactionSubmit();
        });

        // Gas refresh button
        document.getElementById('refresh-gas').addEventListener('click', () => {
            this.refreshGasEstimate();
        });

        // Form validation
        const amountInput = document.getElementById('amount');
        const recipientInput = document.getElementById('recipient');
        
        [amountInput, recipientInput].forEach(input => {
            input.addEventListener('input', () => {
                this.validateForm();
            });
        });

        // Wallet state changes
        this.walletManager.on('nearConnected', (account) => {
            this.uiManager.updateNearStatus(true, account);
            this.validateForm();
        });

        this.walletManager.on('nearDisconnected', () => {
            this.uiManager.updateNearStatus(false);
            this.validateForm();
        });

        this.walletManager.on('baseConnected', (account) => {
            this.uiManager.updateBaseStatus(true, account);
            this.validateForm();
        });

        this.walletManager.on('baseDisconnected', () => {
            this.uiManager.updateBaseStatus(false);
            this.validateForm();
        });

        // Transaction events (for both regular and WASM transaction managers)
        [this.transactionManager, this.wasmTransactionManager].forEach(manager => {
            manager.on('statusUpdate', (status) => {
                this.uiManager.updateTransactionStatus(status);
            });

            manager.on('nearTxHash', (hash) => {
                this.uiManager.updateNearTxHash(hash);
            });

            manager.on('baseTxHash', (hash) => {
                this.uiManager.updateBaseTxHash(hash);
            });
        });
    }

    async handleNearConnection() {
        try {
            this.uiManager.setButtonLoading('connect-near', true);
            await this.walletManager.connectNear();
        } catch (error) {
            this.logger.log(`NEAR connection failed: ${error.message}`, 'error');
        } finally {
            this.uiManager.setButtonLoading('connect-near', false);
        }
    }

    async handleBaseConnection() {
        try {
            this.uiManager.setButtonLoading('connect-base', true);
            await this.walletManager.connectBase();
        } catch (error) {
            this.logger.log(`Base connection failed: ${error.message}`, 'error');
        } finally {
            this.uiManager.setButtonLoading('connect-base', false);
        }
    }

    async handleTransactionSubmit() {
        try {
            const formData = this.getFormData();

            if (!this.validateFormData(formData)) {
                return;
            }

            this.uiManager.setButtonLoading('submit-transaction', true);
            this.uiManager.updateTransactionStatus('Initiating cross-chain transfer...');

            // Try WASM transaction manager first, fallback to regular if it fails
            let transactionManager = this.useWasm ? this.wasmTransactionManager : this.transactionManager;

            try {
                if (this.useWasm) {
                    this.logger.info('Using WASM transaction manager for enhanced functionality');
                }

                await transactionManager.executeCrossChainTransfer(
                    formData,
                    this.walletManager.nearWallet,
                    this.walletManager.baseWallet
                );
            } catch (wasmError) {
                if (this.useWasm) {
                    this.logger.warn(`WASM transaction failed, falling back to regular manager: ${wasmError.message}`);
                    this.useWasm = false;

                    // Retry with regular transaction manager
                    await this.transactionManager.executeCrossChainTransfer(
                        formData,
                        this.walletManager.nearWallet,
                        this.walletManager.baseWallet
                    );
                } else {
                    throw wasmError;
                }
            }

        } catch (error) {
            this.logger.log(`Transaction failed: ${error.message}`, 'error');
            this.uiManager.updateTransactionStatus('Transaction failed');
        } finally {
            this.uiManager.setButtonLoading('submit-transaction', false);
        }
    }

    getFormData() {
        return {
            amount: document.getElementById('amount').value,
            recipient: document.getElementById('recipient').value,
            nearAccount: this.walletManager.getNearAccount()
        };
    }

    validateFormData(data) {
        if (!data.amount || parseFloat(data.amount) <= 0) {
            this.logger.log('Invalid amount', 'error');
            return false;
        }

        if (!data.recipient || !data.recipient.startsWith('0x') || data.recipient.length !== 42) {
            this.logger.log('Invalid recipient address', 'error');
            return false;
        }

        return true;
    }

    validateForm() {
        const amount = document.getElementById('amount').value;
        const recipient = document.getElementById('recipient').value;
        const submitButton = document.getElementById('submit-transaction');

        const isValid = 
            this.walletManager.isNearConnected() &&
            this.walletManager.isBaseConnected() &&
            amount && parseFloat(amount) > 0 &&
            recipient && recipient.startsWith('0x') && recipient.length === 42;

        submitButton.disabled = !isValid;
    }

    async refreshGasEstimate() {
        try {
            this.uiManager.setButtonLoading('refresh-gas', true);
            const gasEstimate = await this.transactionManager.estimateGas();
            this.uiManager.updateGasEstimate(gasEstimate);
        } catch (error) {
            this.logger.log(`Gas estimation failed: ${error.message}`, 'error');
        } finally {
            this.uiManager.setButtonLoading('refresh-gas', false);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new OmniTransactionApp();
});