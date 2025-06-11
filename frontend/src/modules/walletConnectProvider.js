// WalletConnect provider using Reown AppKit
import { createAppKit } from "@reown/appkit";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { CONFIG } from "../config/constants.js";

export class WalletConnectProvider {
  constructor(logger) {
    this.logger = logger;
    this.appKit = null;
    this.provider = null;
    this.account = null;
    this.isConnected = false;

    // Project ID - Get this from https://cloud.reown.com
    // Using a demo project ID for testing - you should replace this with your own
    this.projectId = "3fbb6bba6f1de962d911bb5b5c9ddd26"; // Demo project ID

    // Use fallback if no project ID is configured
    this.useFallback = false; // Now we have a demo project ID
  }

  /**
   * Initialize WalletConnect AppKit
   */
  async init() {
    try {
      if (this.useFallback) {
        this.logger.info(
          "WalletConnect using fallback implementation - configure project ID for full functionality"
        );
        return true;
      }

      // Create the AppKit instance
      this.appKit = createAppKit({
        adapters: [new EthersAdapter()],
        projectId: this.projectId,
        networks: [
          {
            id: CONFIG.NETWORKS.BASE.chainId,
            name: CONFIG.NETWORKS.BASE.name,
            nativeCurrency: CONFIG.NETWORKS.BASE.nativeCurrency,
            rpcUrls: {
              default: {
                http: [CONFIG.NETWORKS.BASE.rpcUrl],
              },
            },
            blockExplorers: {
              default: {
                name: "BaseScan",
                url: CONFIG.NETWORKS.BASE.explorerUrl,
              },
            },
          },
        ],
        metadata: {
          name: "NEAR Omnichain Bridge",
          description: "Bridge USDC from NEAR to Base via Ethereum",
          url: window.location.origin,
          icons: ["https://avatars.githubusercontent.com/u/37784886"],
        },
        features: {
          analytics: true,
          email: false,
          socials: false,
        },
      });

      // Set up event listeners
      this.setupEventListeners();

      this.logger.success("WalletConnect AppKit initialized");
      return true;
    } catch (error) {
      this.logger.error(
        `WalletConnect initialization failed: ${error.message}`
      );
      this.useFallback = true; // Fall back on error
      return false;
    }
  }

  /**
   * Setup event listeners for AppKit
   */
  setupEventListeners() {
    if (!this.appKit) return;

    // Listen for account changes
    this.appKit.subscribeAccount((account) => {
      if (account.isConnected && account.address) {
        this.account = account.address;
        this.isConnected = true;
        this.logger.success(`WalletConnect connected: ${this.account}`);
      } else {
        this.account = null;
        this.isConnected = false;
        this.logger.info("WalletConnect disconnected");
      }
    });

    // Listen for network changes
    this.appKit.subscribeNetwork((network) => {
      if (network.chainId !== CONFIG.NETWORKS.BASE.chainId) {
        this.logger.warn(
          `Connected to wrong network: ${network.chainId}. Expected Base (${CONFIG.NETWORKS.BASE.chainId})`
        );
      }
    });
  }

  /**
   * Open WalletConnect modal
   */
  async connect() {
    try {
      // Use fallback implementation if no project ID configured
      if (this.useFallback) {
        const fallback = new WalletConnectFallback(this.logger);
        return await fallback.connect();
      }

      if (!this.appKit) {
        await this.init();
      }

      this.logger.info("Opening WalletConnect modal...");

      // Open the modal
      this.appKit.open();

      return new Promise((resolve, reject) => {
        // Set up a timeout
        const timeout = setTimeout(() => {
          reject(new Error("Connection timeout"));
        }, 60000); // 60 second timeout

        // Listen for connection
        const unsubscribe = this.appKit.subscribeAccount((account) => {
          if (account.isConnected && account.address) {
            clearTimeout(timeout);
            unsubscribe();
            resolve({
              account: account.address,
              chainId: account.chainId,
            });
          }
        });
      });
    } catch (error) {
      this.logger.error(`WalletConnect connection failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Disconnect WalletConnect
   */
  async disconnect() {
    try {
      if (this.appKit && !this.useFallback) {
        await this.appKit.disconnect();
      }
      this.account = null;
      this.isConnected = false;
      this.logger.info("WalletConnect disconnected");
    } catch (error) {
      this.logger.error(`WalletConnect disconnect failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get the provider for transactions
   */
  getProvider() {
    if (this.useFallback) {
      const fallback = new WalletConnectFallback(this.logger);
      return fallback.getProvider();
    }

    if (!this.appKit) {
      throw new Error("WalletConnect not initialized");
    }

    // Return a provider-like object that can handle eth_sendTransaction
    return {
      request: async (params) => {
        if (!this.isConnected) {
          throw new Error("WalletConnect not connected");
        }

        try {
          // Use AppKit's provider to send transactions
          const provider = this.appKit.getWalletProvider();
          return await provider.request(params);
        } catch (error) {
          this.logger.error(`WalletConnect request failed: ${error.message}`);
          throw error;
        }
      },
    };
  }

  /**
   * Check if connected
   */
  getIsConnected() {
    return this.isConnected;
  }

  /**
   * Get connected account
   */
  getAccount() {
    return this.account;
  }

  /**
   * Switch to Base network
   */
  async switchToBaseNetwork() {
    try {
      if (this.useFallback) {
        throw new Error(
          "WalletConnect not configured - configure project ID for full functionality"
        );
      }

      if (!this.appKit) {
        throw new Error("WalletConnect not initialized");
      }

      await this.appKit.switchNetwork(CONFIG.NETWORKS.BASE.chainId);
      this.logger.success("Switched to Base network via WalletConnect");
    } catch (error) {
      this.logger.error(`Network switch failed: ${error.message}`);
      throw error;
    }
  }
}

// Fallback implementation for when project ID is not configured
export class WalletConnectFallback {
  constructor(logger) {
    this.logger = logger;
  }

  async connect() {
    // Show a helpful message about setting up WalletConnect
    const modal = this.createSetupModal();
    document.body.appendChild(modal);

    throw new Error(
      "WalletConnect setup required. Please see the setup instructions."
    );
  }

  createSetupModal() {
    const modal = document.createElement("div");
    modal.className = "walletconnect-setup-modal";
    modal.innerHTML = `
      <div class="walletconnect-setup-overlay" onclick="this.parentElement.remove()"></div>
      <div class="walletconnect-setup-content">
        <h3>🔗 WalletConnect Setup Required</h3>
        <p>To enable mobile wallet connections, you need to:</p>
        <ol>
          <li>Visit <a href="https://cloud.reown.com" target="_blank">cloud.reown.com</a></li>
          <li>Create a free account and project</li>
          <li>Copy your Project ID</li>
          <li>Update the <code>projectId</code> in <code>walletConnectProvider.js</code></li>
        </ol>
        <p><strong>For now, you can:</strong></p>
        <ul>
          <li>Use a browser extension wallet (MetaMask, Coinbase, etc.)</li>
          <li>Open your mobile wallet and scan QR codes manually</li>
        </ul>
        <button onclick="this.parentElement.parentElement.remove()">Close</button>
      </div>
    `;

    // Add styles
    const styles = document.createElement("style");
    styles.textContent = `
      .walletconnect-setup-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .walletconnect-setup-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
      }
      .walletconnect-setup-content {
        position: relative;
        background: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 500px;
        margin: 20px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      }
      .walletconnect-setup-content h3 {
        margin: 0 0 20px 0;
        color: #111827;
      }
      .walletconnect-setup-content ol, .walletconnect-setup-content ul {
        margin: 15px 0;
        padding-left: 20px;
      }
      .walletconnect-setup-content li {
        margin: 8px 0;
      }
      .walletconnect-setup-content code {
        background: #f3f4f6;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: monospace;
      }
      .walletconnect-setup-content button {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        margin-top: 20px;
      }
      .walletconnect-setup-content a {
        color: #3b82f6;
        text-decoration: none;
      }
      .walletconnect-setup-content a:hover {
        text-decoration: underline;
      }
    `;
    document.head.appendChild(styles);

    return modal;
  }

  getProvider() {
    throw new Error("WalletConnect not configured");
  }

  getIsConnected() {
    return false;
  }

  getAccount() {
    return null;
  }
}
