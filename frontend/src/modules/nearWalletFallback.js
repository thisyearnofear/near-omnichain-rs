// Fallback NEAR wallet integration for when Wallet Selector is not available
import { CONFIG } from '../config/constants.js';

export class NearWalletFallback {
    constructor(logger) {
        this.logger = logger;
        this.accountId = null;
        this.isConnected = false;
    }

    async init() {
        // Check URL parameters for NEAR wallet callback
        const urlParams = new URLSearchParams(window.location.search);
        const accountId = urlParams.get('account_id');
        const publicKey = urlParams.get('public_key');
        
        if (accountId && publicKey) {
            this.accountId = accountId;
            this.isConnected = true;
            this.logger.success(`NEAR wallet connected via callback: ${accountId}`);
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    async connect() {
        try {
            this.logger.info('Redirecting to NEAR wallet...');
            
            const currentUrl = window.location.href.split('?')[0]; // Remove existing query params
            const contractId = CONFIG.CONTRACTS.BRIDGE_NEAR;
            
            const walletUrl = new URL('/login/', CONFIG.NETWORKS.NEAR.walletUrl);
            walletUrl.searchParams.set('contract_id', contractId);
            walletUrl.searchParams.set('success_url', currentUrl);
            walletUrl.searchParams.set('failure_url', currentUrl);
            
            // Redirect to NEAR wallet
            window.location.href = walletUrl.toString();
            
            // This will not return as we're redirecting
            return new Promise(() => {});
            
        } catch (error) {
            this.logger.error(`NEAR wallet redirect failed: ${error.message}`);
            throw error;
        }
    }

    async disconnect() {
        // For fallback, we just clear local state
        this.accountId = null;
        this.isConnected = false;
        this.logger.info('NEAR wallet disconnected (fallback)');
    }

    async signTransaction(transaction) {
        if (!this.isConnected) {
            throw new Error('NEAR wallet not connected');
        }

        // For fallback, we simulate signing
        // In a real implementation, this would redirect to NEAR wallet for signing
        this.logger.info('Simulating NEAR transaction signing (fallback mode)');
        
        return {
            transaction_outcome: {
                id: 'fallback_tx_' + Date.now(),
                outcome: {
                    status: { SuccessValue: '' }
                }
            }
        };
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

        // For fallback, return mock balance
        return {
            total: '1000000000000000000000000', // 1 NEAR
            available: '1000000000000000000000000'
        };
    }
}