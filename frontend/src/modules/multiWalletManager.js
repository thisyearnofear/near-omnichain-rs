// Multi-wallet EVM manager supporting various wallet providers
import { CONFIG } from "../config/constants.js";
import { EventEmitter } from "./eventEmitter.js";
import {
  WalletConnectProvider,
  WalletConnectFallback,
} from "./walletConnectProvider.js";

export class MultiWalletManager extends EventEmitter {
  constructor(logger) {
    super();
    this.logger = logger;
    this.connectedWallet = null;
    this.connectedAccount = null;
    this.provider = null;
    this.chainId = null;

    // Initialize WalletConnect provider
    this.walletConnectProvider = new WalletConnectProvider(logger);

    // Supported wallet providers
    this.supportedWallets = [
      {
        id: "metamask",
        name: "MetaMask",
        icon: "🦊",
        type: "injected",
        check: () => window.ethereum?.isMetaMask,
        provider: () => window.ethereum,
      },
      {
        id: "coinbase",
        name: "Coinbase Wallet",
        icon: "🔵",
        type: "injected",
        check: () =>
          window.ethereum?.isCoinbaseWallet || window.coinbaseWalletExtension,
        provider: () =>
          window.ethereum?.isCoinbaseWallet
            ? window.ethereum
            : window.coinbaseWalletExtension,
      },
      {
        id: "walletconnect",
        name: "WalletConnect",
        icon: "🔗",
        type: "mobile",
        description: "Connect with mobile wallet",
        alwaysShow: true, // Always show for mobile connections
        check: () => true, // Always available
        provider: () => this.createWalletConnectProvider(),
      },
      {
        id: "brave",
        name: "Brave Wallet",
        icon: "🦁",
        type: "injected",
        check: () => window.ethereum?.isBraveWallet,
        provider: () => window.ethereum,
      },
      {
        id: "trust",
        name: "Trust Wallet",
        icon: "🛡️",
        type: "mobile",
        description: "Connect via WalletConnect",
        alwaysShow: true, // Always show for mobile connections
        check: () => true, // Always available via WalletConnect
        provider: () => this.createWalletConnectProvider(),
      },
      {
        id: "rainbow",
        name: "Rainbow",
        icon: "🌈",
        type: "mobile",
        description: "Connect via WalletConnect",
        alwaysShow: true, // Always show for mobile connections
        check: () => window.ethereum?.isRainbow || true, // Show even if not injected
        provider: () =>
          window.ethereum?.isRainbow
            ? window.ethereum
            : this.createWalletConnectProvider(),
      },
      {
        id: "generic",
        name: "Other Wallet",
        icon: "💼",
        type: "injected",
        check: () => window.ethereum && !this.getInjectedWallets().length,
        provider: () => window.ethereum,
      },
    ];
  }

  /**
   * Get list of injected (browser extension) wallets
   */
  getInjectedWallets() {
    return this.supportedWallets.filter((wallet) => {
      try {
        return wallet.type === "injected" && wallet.check();
      } catch (error) {
        return false;
      }
    });
  }

  /**
   * Get list of available wallet providers (injected + always available)
   */
  getAvailableWallets() {
    return this.supportedWallets.filter((wallet) => {
      try {
        // Always show mobile wallets and wallets marked as alwaysShow
        if (wallet.alwaysShow || wallet.type === "mobile") {
          return true;
        }
        // For injected wallets, check if they're actually detected
        return wallet.check();
      } catch (error) {
        return false;
      }
    });
  }

  /**
   * Get list of detected wallet providers (backward compatibility)
   */
  getDetectedWallets() {
    return this.getAvailableWallets();
  }

  /**
   * Get the preferred wallet (first injected or MetaMask)
   */
  getPreferredWallet() {
    const injected = this.getInjectedWallets();
    if (injected.length > 0) {
      return injected[0];
    }
    return this.supportedWallets.find((w) => w.id === "metamask");
  }

  /**
   * Create WalletConnect provider
   */
  createWalletConnectProvider() {
    return this.walletConnectProvider.getProvider();
  }

  /**
   * Check for existing connections
   */
  async checkExistingConnections() {
    this.logger.info("🔍 Checking existing EVM wallet connections...");

    const detectedWallets = this.getDetectedWallets();
    this.logger.info(
      `Detected wallets: ${detectedWallets.map((w) => w.name).join(", ")}`
    );

    if (detectedWallets.length === 0) {
      this.logger.info("❌ No EVM wallets detected");
      return false;
    }

    // Try to connect to the first available wallet
    for (const wallet of detectedWallets) {
      try {
        const provider = wallet.provider();
        if (!provider) continue;

        const accounts = await provider.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          this.connectedWallet = wallet;
          this.connectedAccount = accounts[0];
          this.provider = provider;

          // Get current chain ID
          this.chainId = await provider.request({ method: "eth_chainId" });

          this.logger.success(
            `✅ ${wallet.name} already connected: ${this.connectedAccount}`
          );

          // Check if we're on the correct network
          if (parseInt(this.chainId, 16) === CONFIG.NETWORKS.BASE.chainId) {
            this.emit("baseConnected", this.connectedAccount);
            return true;
          } else {
            this.logger.warn(
              `⚠️ Connected to wrong network. Expected Base (${
                CONFIG.NETWORKS.BASE.chainId
              }), got ${parseInt(this.chainId, 16)}`
            );
          }
        }
      } catch (error) {
        this.logger.info(`❌ ${wallet.name} not connected: ${error.message}`);
      }
    }

    return false;
  }

  /**
   * Connect to a specific wallet
   */
  async connectWallet(walletId = null) {
    try {
      let targetWallet;

      if (walletId) {
        targetWallet = this.supportedWallets.find((w) => w.id === walletId);
        if (!targetWallet) {
          throw new Error(`Wallet ${walletId} not supported`);
        }
        if (!targetWallet.check()) {
          throw new Error(`${targetWallet.name} not detected`);
        }
      } else {
        targetWallet = this.getPreferredWallet();
        if (!targetWallet || !targetWallet.check()) {
          throw new Error("No compatible wallet detected");
        }
      }

      this.logger.info(`Connecting to ${targetWallet.name}...`);

      // Handle WalletConnect differently
      if (
        targetWallet.type === "mobile" &&
        (targetWallet.id === "walletconnect" ||
          targetWallet.id === "rainbow" ||
          targetWallet.id === "trust")
      ) {
        const result = await this.walletConnectProvider.connect();

        this.connectedWallet = targetWallet;
        this.connectedAccount = result.account;
        this.provider = this.walletConnectProvider.getProvider();
        this.chainId = result.chainId;
      } else {
        // Handle injected wallets
        const provider = targetWallet.provider();
        if (!provider) {
          throw new Error(`${targetWallet.name} provider not available`);
        }

        // Request account access
        const accounts = await provider.request({
          method: "eth_requestAccounts",
        });

        if (accounts.length === 0) {
          throw new Error("No accounts found");
        }

        this.connectedWallet = targetWallet;
        this.connectedAccount = accounts[0];
        this.provider = provider;

        // Get current chain ID
        this.chainId = await provider.request({ method: "eth_chainId" });
      }

      // Switch to Base network if needed (only for injected wallets)
      if (targetWallet.type === "injected") {
        await this.switchToBaseNetwork();
      }

      this.emit("baseConnected", this.connectedAccount);
      this.logger.success(
        `✅ ${targetWallet.name} connected: ${this.connectedAccount}`
      );

      return {
        wallet: targetWallet,
        account: this.connectedAccount,
        chainId: this.chainId,
      };
    } catch (error) {
      this.logger.error(`EVM wallet connection failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Switch to Base network
   */
  async switchToBaseNetwork() {
    if (!this.provider) {
      throw new Error("No wallet connected");
    }

    try {
      // Try to switch to Base network
      await this.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${CONFIG.NETWORKS.BASE.chainId.toString(16)}` }],
      });

      this.chainId = `0x${CONFIG.NETWORKS.BASE.chainId.toString(16)}`;
      this.logger.success("✅ Switched to Base network");
    } catch (switchError) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        await this.provider.request({
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

        this.chainId = `0x${CONFIG.NETWORKS.BASE.chainId.toString(16)}`;
        this.logger.success("✅ Added and switched to Base network");
      } else {
        throw switchError;
      }
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect() {
    this.connectedWallet = null;
    this.connectedAccount = null;
    this.provider = null;
    this.chainId = null;

    this.emit("baseDisconnected");
    this.logger.info("EVM wallet disconnected");
  }

  /**
   * Sign transaction
   */
  async signTransaction(transaction) {
    if (!this.provider) {
      throw new Error("No wallet connected");
    }

    try {
      this.logger.info(
        `Signing transaction with ${this.connectedWallet.name}...`
      );
      const txHash = await this.provider.request({
        method: "eth_sendTransaction",
        params: [transaction],
      });
      this.logger.success("✅ Transaction signed");
      return txHash;
    } catch (error) {
      this.logger.error(`Transaction signing failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  isConnected() {
    return this.connectedWallet !== null && this.connectedAccount !== null;
  }

  /**
   * Get connected account
   */
  getAccount() {
    return this.connectedAccount;
  }

  /**
   * Get connected wallet info
   */
  getWalletInfo() {
    return this.connectedWallet;
  }

  /**
   * Get provider
   */
  getProvider() {
    return this.provider;
  }
}
