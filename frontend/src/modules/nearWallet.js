// Real NEAR wallet integration using Wallet Selector
import { CONFIG } from '../config/constants.js';
import { NearWalletFallback } from './nearWalletFallback.js';

export class NearWalletIntegration {
    constructor(logger) {
        this.logger = logger;
        this.selector = null;
        this.wallet = null;
        this.accountId = null;
        this.isConnected = false;
        this.fallback = new NearWalletFallback(logger);
        this.useFallback = false;
    }

    async init() {
        try {
            // Import NEAR Wallet Selector dynamically
            const { setupWalletSelector } = await import('@near-wallet-selector/core');
            const { setupMyNearWallet } = await import('@near-wallet-selector/my-near-wallet');
            const { setupHereWallet } = await import('@near-wallet-selector/here-wallet');
            const { setupModal } = await import('@near-wallet-selector/modal-ui');

            // Initialize wallet selector
            this.selector = await setupWalletSelector({
                network: CONFIG.NETWORKS.NEAR.networkId,
                modules: [
                    setupMyNearWallet(),
                    setupHereWallet(),
                ],
            });

            // Setup modal for wallet selection
            this.modal = setupModal(this.selector, {
                contractId: CONFIG.CONTRACTS.BRIDGE_NEAR,
            });

            // Check if already connected
            await this.checkConnection();

            this.logger.success('NEAR Wallet Selector initialized');
        } catch (error) {
            this.logger.error(`Failed to initialize NEAR wallet: ${error.message}`);
            // Use fallback implementation
            this.useFallback = true;
            await this.fallback.init();
            
            if (this.fallback.isWalletConnected()) {
                this.accountId = this.fallback.getAccountId();
                this.isConnected = true;
            }
        }
    }

    async initFallback() {
        // Fallback implementation for when wallet selector fails
        this.logger.info('Using fallback NEAR wallet connection');
        
        // Check if NEAR wallet is available in window
        if (window.near) {
            try {
                const isSignedIn = await window.near.isSignedIn();
                if (isSignedIn) {
                    const account = window.near.account();
                    this.accountId = account.accountId;
                    this.wallet = window.near;
                    this.isConnected = true;
                    this.logger.success(`NEAR wallet connected: ${this.accountId}`);
                }
            } catch (error) {
                this.logger.info('No existing NEAR wallet connection found');
            }
        }
    }

    async checkConnection() {
        if (!this.selector) return;

        try {
            const wallet = await this.selector.wallet();
            if (wallet) {
                const accounts = await wallet.getAccounts();
                if (accounts.length > 0) {
                    this.wallet = wallet;
                    this.accountId = accounts[0].accountId;
                    this.isConnected = true;
                    this.logger.success(`NEAR wallet already connected: ${this.accountId}`);
                }
            }
        } catch (error) {
            this.logger.info('No existing NEAR wallet connection');
        }
    }

    async connect() {
        try {
            if (this.useFallback) {
                const accountId = await this.fallback.connect();
                this.accountId = accountId;
                this.isConnected = true;
                return accountId;
            }
            
            if (this.selector && this.modal) {
                // Use wallet selector modal
                this.modal.show();
                
                // Wait for wallet selection
                return new Promise((resolve, reject) => {
                    const subscription = this.selector.store.observable.subscribe(async (state) => {
                        if (state.selectedWalletId) {
                            try {
                                const wallet = await this.selector.wallet();
                                await wallet.signIn({
                                    contractId: CONFIG.CONTRACTS.BRIDGE_NEAR,
                                    methodNames: ['authorize_cross_chain_transfer'],
                                });
                                
                                const accounts = await wallet.getAccounts();
                                if (accounts.length > 0) {
                                    this.wallet = wallet;
                                    this.accountId = accounts[0].accountId;
                                    this.isConnected = true;
                                    this.modal.hide();
                                    subscription.unsubscribe();
                                    resolve(this.accountId);
                                }
                            } catch (error) {
                                subscription.unsubscribe();
                                reject(error);
                            }
                        }
                    });
                });
            } else {
                // Fallback connection
                return await this.connectFallback();
            }
        } catch (error) {
            this.logger.error(`NEAR connection failed: ${error.message}`);
            throw error;
        }
    }

    async connectFallback() {
        // Fallback connection method
        if (window.near) {
            try {
                await window.near.requestSignIn({
                    contractId: CONFIG.CONTRACTS.BRIDGE_NEAR,
                    methodNames: ['authorize_cross_chain_transfer'],
                });
                
                const account = window.near.account();
                this.accountId = account.accountId;
                this.wallet = window.near;
                this.isConnected = true;
                return this.accountId;
            } catch (error) {
                throw new Error('NEAR wallet connection failed');
            }
        } else {
            // Redirect to NEAR wallet
            const walletUrl = `${CONFIG.NETWORKS.NEAR.walletUrl}/login/?contract_id=${CONFIG.CONTRACTS.BRIDGE_NEAR}&success_url=${encodeURIComponent(window.location.href)}&failure_url=${encodeURIComponent(window.location.href)}`;
            window.location.href = walletUrl;
        }
    }

    async disconnect() {
        try {
            if (this.useFallback) {
                await this.fallback.disconnect();
            } else if (this.wallet && this.wallet.signOut) {
                await this.wallet.signOut();
            }
            
            this.wallet = null;
            this.accountId = null;
            this.isConnected = false;
            
            this.logger.info('NEAR wallet disconnected');
        } catch (error) {
            this.logger.error(`NEAR disconnect failed: ${error.message}`);
        }
    }

    async signTransaction(transaction) {
        if (!this.isConnected) {
            throw new Error('NEAR wallet not connected');
        }

        try {
            this.logger.info('Signing NEAR transaction...');
            
            if (this.useFallback) {
                return await this.fallback.signTransaction(transaction);
            }
            
            if (this.wallet.signAndSendTransaction) {
                // Using wallet selector
                const result = await this.wallet.signAndSendTransaction({
                    signerId: this.accountId,
                    receiverId: transaction.receiver_id,
                    actions: transaction.actions,
                });
                return result;
            } else if (this.wallet.account) {
                // Using legacy wallet
                const account = this.wallet.account();
                const result = await account.signAndSendTransaction({
                    receiverId: transaction.receiver_id,
                    actions: transaction.actions,
                });
                return result;
            } else {
                throw new Error('Wallet does not support transaction signing');
            }
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
        if (!this.wallet || !this.isConnected) {
            return null;
        }

        try {
            if (this.wallet.account) {
                const account = this.wallet.account();
                const balance = await account.getAccountBalance();
                return balance;
            }
        } catch (error) {
            this.logger.error(`Failed to get NEAR balance: ${error.message}`);
        }
        return null;
    }
}