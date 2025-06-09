// Wallet management module
import { CONFIG, ERRORS, MESSAGES } from '../config/constants.js';
import { EventEmitter } from './eventEmitter.js';

export class WalletManager extends EventEmitter {
    constructor(logger) {
        super();
        this.logger = logger;
        this.nearWallet = null;
        this.baseWallet = null;
        this.nearAccount = null;
        this.baseAccount = null;
    }

    async init() {
        // Check for existing connections
        await this.checkExistingConnections();
    }

    async checkExistingConnections() {
        // Check NEAR connection from URL params or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const accountId = urlParams.get('account_id');
        const publicKey = urlParams.get('public_key');
        
        if (accountId && publicKey) {
            this.nearAccount = accountId;
            this.nearWallet = { accountId, publicKey };
            localStorage.setItem('near_wallet_account_id', accountId);
            this.emit('nearConnected', this.nearAccount);
            this.logger.success(`NEAR wallet connected: ${this.nearAccount}`);
            
            // Clean URL
            const url = new URL(window.location);
            url.searchParams.delete('account_id');
            url.searchParams.delete('public_key');
            url.searchParams.delete('all_keys');
            window.history.replaceState({}, document.title, url.toString());
        } else {
            // Check localStorage
            const savedAccount = localStorage.getItem('near_wallet_account_id');
            if (savedAccount) {
                this.nearAccount = savedAccount;
                this.nearWallet = { accountId: savedAccount };
                this.emit('nearConnected', this.nearAccount);
                this.logger.success(`NEAR wallet restored: ${this.nearAccount}`);
            }
        }

        // Check MetaMask/Base connection
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    this.baseAccount = accounts[0];
                    this.baseWallet = window.ethereum;
                    
                    // Check if we're on the correct network
                    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                    if (parseInt(chainId, 16) === CONFIG.NETWORKS.BASE.chainId) {
                        this.emit('baseConnected', this.baseAccount);
                        this.logger.success(`Base wallet already connected: ${this.baseAccount}`);
                    }
                }
            } catch (error) {
                // Not connected
            }
        }
    }

    async connectNear() {
        try {
            this.logger.info('Connecting to NEAR wallet...');
            
            // Build NEAR wallet URL
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.delete('account_id');
            currentUrl.searchParams.delete('public_key');
            currentUrl.searchParams.delete('all_keys');
            
            const walletUrl = new URL('/login/', CONFIG.NETWORKS.NEAR.walletUrl);
            walletUrl.searchParams.set('contract_id', CONFIG.CONTRACTS.BRIDGE_NEAR);
            walletUrl.searchParams.set('success_url', currentUrl.toString());
            walletUrl.searchParams.set('failure_url', currentUrl.toString());
            
            this.logger.info('Redirecting to NEAR wallet...');
            window.location.href = walletUrl.toString();
            
        } catch (error) {
            this.logger.error(`NEAR connection failed: ${error.message}`);
            throw error;
        }
    }

    async connectBase() {
        try {
            this.logger.info('Connecting to Base network...');

            if (!window.ethereum) {
                throw new Error('MetaMask not installed');
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }

            this.baseAccount = accounts[0];
            this.baseWallet = window.ethereum;

            // Switch to Base network if needed
            await this.switchToBaseNetwork();

            this.emit('baseConnected', this.baseAccount);
            this.logger.success(`${MESSAGES.WALLET_CONNECTED}: ${this.baseAccount}`);

        } catch (error) {
            if (error.code === 4001) {
                this.logger.error(ERRORS.USER_REJECTED);
            } else {
                this.logger.error(`Base connection failed: ${error.message}`);
            }
            throw error;
        }
    }

    async switchToBaseNetwork() {
        try {
            // Try to switch to Base network
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${CONFIG.NETWORKS.BASE.chainId.toString(16)}` }],
            });
        } catch (switchError) {
            // If the network doesn't exist, add it
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: `0x${CONFIG.NETWORKS.BASE.chainId.toString(16)}`,
                        chainName: CONFIG.NETWORKS.BASE.name,
                        rpcUrls: [CONFIG.NETWORKS.BASE.rpcUrl],
                        nativeCurrency: CONFIG.NETWORKS.BASE.nativeCurrency,
                        blockExplorerUrls: [CONFIG.NETWORKS.BASE.explorerUrl]
                    }],
                });
            } else {
                throw switchError;
            }
        }
    }

    async disconnectNear() {
        localStorage.removeItem('near_wallet_account_id');
        this.nearWallet = null;
        this.nearAccount = null;
        this.emit('nearDisconnected');
        this.logger.info('NEAR wallet disconnected');
    }

    async disconnectBase() {
        this.baseWallet = null;
        this.baseAccount = null;
        this.emit('baseDisconnected');
        this.logger.info('Base wallet disconnected');
    }

    isNearConnected() {
        return this.nearWallet !== null && this.nearAccount !== null;
    }

    isBaseConnected() {
        return this.baseWallet !== null && this.baseAccount !== null;
    }

    getNearAccount() {
        return this.nearAccount;
    }

    getBaseAccount() {
        return this.baseAccount;
    }

    async signNearTransaction(transaction) {
        if (!this.nearWallet) {
            throw new Error(ERRORS.WALLET_NOT_CONNECTED);
        }

        try {
            this.logger.info('Signing NEAR transaction...');
            
            // Use the Rust library to build and sign the transaction
            const serializedTx = this.serializeNearTransaction(transaction);
            
            // For now, redirect to NEAR wallet for signing
            const currentUrl = new URL(window.location.href);
            const walletUrl = new URL('/sign', CONFIG.NETWORKS.NEAR.walletUrl);
            
            walletUrl.searchParams.set('transactions', btoa(JSON.stringify([transaction])));
            walletUrl.searchParams.set('callbackUrl', currentUrl.toString());
            
            this.logger.info('Redirecting to NEAR wallet for signing...');
            window.location.href = walletUrl.toString();
            
            return new Promise(() => {});
        } catch (error) {
            this.logger.error(`NEAR signing failed: ${error.message}`);
            throw error;
        }
    }

    serializeNearTransaction(transaction) {
        // This would use the Rust library to properly serialize the transaction
        // For now, return the transaction as-is
        return transaction;
    }

    async signBaseTransaction(transaction) {
        if (!this.baseWallet) {
            throw new Error(ERRORS.WALLET_NOT_CONNECTED);
        }

        try {
            this.logger.info('Signing Base transaction...');
            const txHash = await this.baseWallet.request({
                method: 'eth_sendTransaction',
                params: [transaction],
            });
            this.logger.success('Base transaction signed');
            return txHash;
        } catch (error) {
            this.logger.error(`Base signing failed: ${error.message}`);
            throw error;
        }
    }
}