// Clean wallet management module - API-first approach
import { CONFIG, ERRORS, MESSAGES } from "../config/constants.js";
import { EventEmitter } from "./eventEmitter.js";
import { SimpleNearWallet } from "./simpleNearWallet.js";
import { MultiWalletManager } from "./multiWalletManager.js";
import { WalletSelector } from "./walletSelector.js";

export class WalletManager extends EventEmitter {
  constructor(logger) {
    super();
    this.logger = logger;
    this.simpleNearWallet = new SimpleNearWallet(logger);
    this.nearWallet = null;
    this.baseWallet = null;
    this.nearAccount = null;
    this.baseAccount = null;

    // Multi-wallet support for EVM
    this.multiWalletManager = new MultiWalletManager(logger);
    this.walletSelector = new WalletSelector(this.multiWalletManager, logger);

    // Make wallet selector globally accessible for modal
    window.walletSelector = this.walletSelector;
  }

  async init() {
    // Initialize simple NEAR wallet
    await this.simpleNearWallet.init();
    this.nearWallet = this.simpleNearWallet;

    // Setup NEAR wallet event listeners
    this.setupNearWalletEvents();

    // Setup multi-wallet event listeners
    this.setupMultiWalletEvents();

    // Check for existing connections
    await this.checkExistingConnections();
  }

  setupNearWalletEvents() {
    this.simpleNearWallet.on("connected", (accountId) => {
      this.nearAccount = accountId;
      this.logger.success(`🔵 NEAR wallet connected via event: ${accountId}`);
      this.emit("nearConnected", accountId);
    });

    this.simpleNearWallet.on("disconnected", () => {
      this.nearAccount = null;
      this.logger.info("🔵 NEAR wallet disconnected via event");
      this.emit("nearDisconnected");
    });
  }

  setupMultiWalletEvents() {
    this.multiWalletManager.on("baseConnected", (account) => {
      this.baseAccount = account;
      this.baseWallet = this.multiWalletManager.getProvider();
      this.emit("baseConnected", account);
    });

    this.multiWalletManager.on("baseDisconnected", () => {
      this.baseAccount = null;
      this.baseWallet = null;
      this.emit("baseDisconnected");
    });
  }

  async checkExistingConnections() {
    this.logger.info("🔍 Checking existing wallet connections...");

    // NEAR wallet connections are now handled automatically via events
    // during the init() process, so we don't need to manually check here

    // Check EVM wallet connections using multi-wallet manager
    await this.multiWalletManager.checkExistingConnections();
  }

  async connectNear() {
    try {
      this.logger.info("Connecting to NEAR wallet...");

      if (!this.nearWallet) {
        throw new Error("NEAR wallet adapter not initialized");
      }

      // The connect() method will redirect to NEAR wallet
      // Events will be emitted automatically when the user returns
      await this.nearWallet.connect();

      // This return may not be reached due to redirect
      return this.nearAccount;
    } catch (error) {
      this.logger.error(`NEAR connection failed: ${error.message}`);
      throw error;
    }
  }

  async connectBase() {
    try {
      this.logger.info("Connecting to EVM wallet...");

      // Check if any wallets are detected
      const detectedWallets = this.multiWalletManager.getDetectedWallets();

      if (detectedWallets.length === 0) {
        // No wallets detected, show wallet selector with installation options
        this.walletSelector.show();
        return;
      } else if (detectedWallets.length === 1) {
        // Only one wallet detected, connect directly
        await this.multiWalletManager.connectWallet(detectedWallets[0].id);
      } else {
        // Multiple wallets detected, show selection modal
        this.walletSelector.show();
        return;
      }
    } catch (error) {
      if (error.code === 4001) {
        this.logger.error(ERRORS.USER_REJECTED);
      } else {
        this.logger.error(`EVM wallet connection failed: ${error.message}`);
      }
      throw error;
    }
  }

  async switchToBaseNetwork() {
    try {
      // Try to switch to Base network
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${CONFIG.NETWORKS.BASE.chainId.toString(16)}` }],
      });
    } catch (switchError) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${CONFIG.NETWORKS.BASE.chainId.toString(16)}`,
              chainName: CONFIG.NETWORKS.BASE.name,
              rpcUrls: [CONFIG.NETWORKS.BASE.rpcUrl],
              nativeCurrency: CONFIG.NETWORKS.BASE.nativeCurrency,
              blockExplorerUrls: [CONFIG.NETWORKS.BASE.explorerUrl],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }

  async disconnectNear() {
    if (this.nearWallet) {
      // The disconnect() method will emit the "disconnected" event automatically
      await this.nearWallet.disconnect();
    }
  }

  async disconnectBase() {
    await this.multiWalletManager.disconnect();
  }

  isNearConnected() {
    return this.nearWallet !== null && this.nearWallet.isWalletConnected();
  }

  isBaseConnected() {
    return this.multiWalletManager.isConnected();
  }

  getNearAccount() {
    return this.nearWallet ? this.nearWallet.getAccountId() : null;
  }

  getBaseAccount() {
    return this.baseAccount;
  }

  async signNearTransaction(transaction) {
    if (!this.nearWallet) {
      throw new Error(ERRORS.WALLET_NOT_CONNECTED);
    }

    try {
      this.logger.info("Signing NEAR transaction...");

      // Use the wallet adapter to sign the transaction
      return await this.nearWallet.signTransaction(transaction);
    } catch (error) {
      this.logger.error(`NEAR signing failed: ${error.message}`);
      throw error;
    }
  }

  async signBaseTransaction(transaction) {
    if (!this.multiWalletManager.isConnected()) {
      throw new Error(ERRORS.WALLET_NOT_CONNECTED);
    }

    return await this.multiWalletManager.signTransaction(transaction);
  }
}
