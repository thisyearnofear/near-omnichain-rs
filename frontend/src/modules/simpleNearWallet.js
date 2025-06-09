// Simplified NEAR wallet integration without heavy dependencies
import { CONFIG } from '../config/constants.js';

export class SimpleNearWallet {
    constructor(logger) {
        this.logger = logger;
        this.accountId = null;
        this.isConnected = false;
        this.accessKey = null;
    }

    async init() {
        try {
            // Check URL parameters for NEAR wallet callback
            const urlParams = new URLSearchParams(window.location.search);
            const accountId = urlParams.get('account_id');
            const publicKey = urlParams.get('public_key');
            const allKeys = urlParams.get('all_keys');
            
            if (accountId && publicKey) {
                this.accountId = accountId;
                this.accessKey = publicKey;
                this.isConnected = true;
                this.logger.success(`NEAR wallet connected: ${accountId}`);
                
                // Clean up URL parameters
                const url = new URL(window.location);
                url.searchParams.delete('account_id');
                url.searchParams.delete('public_key');
                url.searchParams.delete('all_keys');
                window.history.replaceState({}, document.title, url.toString());
                
                return true;
            }

            // Check localStorage for existing connection
            const savedAccount = localStorage.getItem('near_app_wallet_auth_key');
            const savedAccountId = localStorage.getItem('near_wallet_account_id');
            
            if (savedAccount && savedAccountId) {
                this.accountId = savedAccountId;
                this.accessKey = savedAccount;
                this.isConnected = true;
                this.logger.success(`NEAR wallet restored from storage: ${savedAccountId}`);
                return true;
            }

            this.logger.info('No existing NEAR wallet connection found');
            return false;
            
        } catch (error) {
            this.logger.error(`NEAR wallet initialization failed: ${error.message}`);
            return false;
        }
    }

    async connect() {
        try {
            this.logger.info('Connecting to NEAR wallet...');
            
            // Generate a unique request ID
            const requestId = Date.now().toString();
            
            // Store the request for verification
            localStorage.setItem('near_wallet_request_id', requestId);
            
            // Build the wallet URL
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.delete('account_id');
            currentUrl.searchParams.delete('public_key');
            currentUrl.searchParams.delete('all_keys');
            
            const walletUrl = new URL('/login/', CONFIG.NETWORKS.NEAR.walletUrl);
            walletUrl.searchParams.set('contract_id', CONFIG.CONTRACTS.BRIDGE_NEAR);
            walletUrl.searchParams.set('success_url', currentUrl.toString());
            walletUrl.searchParams.set('failure_url', currentUrl.toString());
            walletUrl.searchParams.set('public_key_ed25519', ''); // Let wallet choose
            
            this.logger.info('Redirecting to NEAR wallet for authentication...');
            
            // Redirect to NEAR wallet
            window.location.href = walletUrl.toString();
            
            // This promise will never resolve as we're redirecting
            return new Promise(() => {});
            
        } catch (error) {
            this.logger.error(`NEAR wallet connection failed: ${error.message}`);
            throw error;
        }
    }

    async disconnect() {
        try {
            // Clear local storage
            localStorage.removeItem('near_app_wallet_auth_key');
            localStorage.removeItem('near_wallet_account_id');
            localStorage.removeItem('near_wallet_request_id');
            
            // Reset state
            this.accountId = null;
            this.accessKey = null;
            this.isConnected = false;
            
            this.logger.info('NEAR wallet disconnected');
            
            // Optionally redirect to wallet logout
            if (this.accountId) {
                const logoutUrl = new URL('/logout', CONFIG.NETWORKS.NEAR.walletUrl);
                logoutUrl.searchParams.set('success_url', window.location.href);
                window.location.href = logoutUrl.toString();
            }
            
        } catch (error) {
            this.logger.error(`NEAR wallet disconnect failed: ${error.message}`);
        }
    }

    async signTransaction(transaction) {
        if (!this.isConnected) {
            throw new Error('NEAR wallet not connected');
        }

        try {
            this.logger.info('Preparing NEAR transaction for signing...');
            
            // For demo purposes, we'll simulate the signing process
            // In a real implementation, this would redirect to NEAR wallet for signing
            
            const txData = {
                receiverId: transaction.receiver_id,
                actions: transaction.actions,
                signerId: this.accountId
            };
            
            // Store transaction data for when we return from wallet
            const txId = Date.now().toString();
            localStorage.setItem(`near_pending_tx_${txId}`, JSON.stringify(txData));
            
            // Build transaction URL for NEAR wallet
            const currentUrl = new URL(window.location.href);
            const walletUrl = new URL('/sign', CONFIG.NETWORKS.NEAR.walletUrl);
            
            // Encode transaction data
            const encodedTx = btoa(JSON.stringify(txData));
            walletUrl.searchParams.set('transactions', encodedTx);
            walletUrl.searchParams.set('callbackUrl', currentUrl.toString());
            
            this.logger.info('Redirecting to NEAR wallet for transaction signing...');
            
            // For demo purposes, return a mock result instead of redirecting
            const mockResult = {
                transaction: {
                    hash: 'demo_tx_' + Date.now(),
                    signer_id: this.accountId,
                    receiver_id: transaction.receiver_id,
                    actions: transaction.actions
                },
                transaction_outcome: {
                    id: 'demo_outcome_' + Date.now(),
                    outcome: {
                        status: { SuccessValue: '' },
                        gas_burnt: 2428000000000,
                        tokens_burnt: '242800000000000000000'
                    }
                }
            };
            
            this.logger.success('NEAR transaction signed (demo mode)');
            return mockResult;
            
        } catch (error) {
            this.logger.error(`NEAR transaction signing failed: ${error.message}`);
            throw error;
        }
    }

    getAccountId() {
        return this.accountId;
    }

    isWalletConnected() {
        return this.isConnected && this.accountId !== null;
    }

    async getBalance() {
        if (!this.isConnected) {
            return null;
        }

        try {
            // In a real implementation, this would query the NEAR RPC
            // For demo purposes, return a mock balance
            return {
                total: '1000000000000000000000000', // 1 NEAR
                available: '999000000000000000000000' // 0.999 NEAR (minus storage)
            };
        } catch (error) {
            this.logger.error(`Failed to get NEAR balance: ${error.message}`);
            return null;
        }
    }

    // Helper method to check if we're in a wallet callback
    isWalletCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.has('account_id') && urlParams.has('public_key');
    }

    // Helper method to get wallet URL for manual connection
    getWalletUrl() {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete('account_id');
        currentUrl.searchParams.delete('public_key');
        currentUrl.searchParams.delete('all_keys');
        
        const walletUrl = new URL('/login/', CONFIG.NETWORKS.NEAR.walletUrl);
        walletUrl.searchParams.set('contract_id', CONFIG.CONTRACTS.BRIDGE_NEAR);
        walletUrl.searchParams.set('success_url', currentUrl.toString());
        walletUrl.searchParams.set('failure_url', currentUrl.toString());
        
        return walletUrl.toString();
    }
}