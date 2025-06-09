// Main application entry point
import { WalletManager } from './modules/walletManager.js';
import { TransactionManager } from './modules/transactionManager.js';
import { UIManager } from './modules/uiManager.js';
import { Logger } from './modules/logger.js';
import { CONFIG } from './config/constants.js';

class OmniTransactionApp {
    constructor() {
        this.logger = new Logger();
        this.walletManager = new WalletManager(this.logger);
        this.transactionManager = new TransactionManager(this.logger);
        this.uiManager = new UIManager(this.logger);
        
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

        // Transaction events
        this.transactionManager.on('statusUpdate', (status) => {
            this.uiManager.updateTransactionStatus(status);
        });

        this.transactionManager.on('nearTxHash', (hash) => {
            this.uiManager.updateNearTxHash(hash);
        });

        this.transactionManager.on('baseTxHash', (hash) => {
            this.uiManager.updateBaseTxHash(hash);
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

            // Execute the cross-chain transaction
            await this.transactionManager.executeCrossChainTransfer(
                formData,
                this.walletManager.nearWallet,
                this.walletManager.baseWallet
            );

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