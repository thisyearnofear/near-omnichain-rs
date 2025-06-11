// Simplified NEAR wallet integration without heavy dependencies
import { CONFIG } from "../config/constants.js";

export class SimpleNearWallet {
  constructor(logger) {
    this.logger = logger;
    this.accountId = null;
    this.isConnected = false;
    this.accessKey = null;
    this.eventListeners = new Map();
  }

  // Simple event emitter functionality
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach((callback) => callback(data));
    }
  }

  async init() {
    try {
      // Check URL parameters for NEAR wallet callback
      const urlParams = new URLSearchParams(window.location.search);
      const accountId = urlParams.get("account_id");
      const publicKey = urlParams.get("public_key");
      const allKeys = urlParams.get("all_keys");

      console.log("🔍 NEAR Wallet Init Debug:", {
        currentUrl: window.location.href,
        searchParams: window.location.search,
        accountId,
        publicKey,
        allKeys,
      });

      // Accept either public_key or all_keys parameter
      const keyToUse = publicKey || allKeys;

      if (accountId && keyToUse) {
        this.accountId = accountId;
        this.accessKey = keyToUse;
        this.isConnected = true;

        // Save to localStorage for persistence
        localStorage.setItem("near_app_wallet_auth_key", keyToUse);
        localStorage.setItem("near_wallet_account_id", accountId);

        console.log("💾 Saved to localStorage:", { accountId, keyToUse });
        this.logger.success(`NEAR wallet connected: ${accountId}`);

        // Emit connection event
        this.emit("connected", accountId);

        // Clean up URL parameters
        const url = new URL(window.location);
        url.searchParams.delete("account_id");
        url.searchParams.delete("public_key");
        url.searchParams.delete("all_keys");
        window.history.replaceState({}, document.title, url.toString());

        return true;
      }

      // Check localStorage for existing connection
      const savedAccount = localStorage.getItem("near_app_wallet_auth_key");
      const savedAccountId = localStorage.getItem("near_wallet_account_id");

      console.log("💾 LocalStorage check:", { savedAccount, savedAccountId });

      if (savedAccount && savedAccountId) {
        this.accountId = savedAccountId;
        this.accessKey = savedAccount;
        this.isConnected = true;
        console.log("✅ NEAR wallet state set:", {
          accountId: this.accountId,
          isConnected: this.isConnected,
        });
        this.logger.success(
          `NEAR wallet restored from storage: ${savedAccountId}`
        );

        // Emit connection event for restored connection
        this.emit("connected", savedAccountId);

        return true;
      }

      this.logger.info("No existing NEAR wallet connection found");
      return false;
    } catch (error) {
      this.logger.error(`NEAR wallet initialization failed: ${error.message}`);
      return false;
    }
  }

  async connect() {
    try {
      this.logger.info("Connecting to NEAR wallet...");

      // Generate a unique request ID
      const requestId = Date.now().toString();

      // Store the request for verification
      localStorage.setItem("near_wallet_request_id", requestId);

      // Build the wallet URL
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete("account_id");
      currentUrl.searchParams.delete("public_key");
      currentUrl.searchParams.delete("all_keys");

      const walletUrl = new URL("/login/", CONFIG.NETWORKS.NEAR.walletUrl);
      walletUrl.searchParams.set("contract_id", CONFIG.CONTRACTS.BRIDGE_NEAR);
      walletUrl.searchParams.set("success_url", currentUrl.toString());
      walletUrl.searchParams.set("failure_url", currentUrl.toString());
      walletUrl.searchParams.set("public_key_ed25519", ""); // Let wallet choose

      console.log("🔗 Generated wallet URL:", walletUrl.toString());
      console.log("🔗 Success URL:", currentUrl.toString());
      this.logger.info("Redirecting to NEAR wallet for authentication...");

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
      localStorage.removeItem("near_app_wallet_auth_key");
      localStorage.removeItem("near_wallet_account_id");
      localStorage.removeItem("near_wallet_request_id");

      // Reset state
      this.accountId = null;
      this.accessKey = null;
      this.isConnected = false;

      this.logger.info("NEAR wallet disconnected");

      // Emit disconnection event
      this.emit("disconnected");

      // Optionally redirect to wallet logout
      if (this.accountId) {
        const logoutUrl = new URL("/logout", CONFIG.NETWORKS.NEAR.walletUrl);
        logoutUrl.searchParams.set("success_url", window.location.href);
        window.location.href = logoutUrl.toString();
      }
    } catch (error) {
      this.logger.error(`NEAR wallet disconnect failed: ${error.message}`);
    }
  }

  async signTransaction(transaction) {
    if (!this.isConnected) {
      throw new Error("NEAR wallet not connected");
    }

    try {
      this.logger.info("Preparing NEAR transaction for signing...");

      const txData = {
        receiverId: transaction.receiver_id || transaction.receiverId,
        actions: transaction.actions,
        signerId: this.accountId,
      };

      // Validate transaction data
      if (
        !txData.receiverId ||
        !txData.actions ||
        !Array.isArray(txData.actions)
      ) {
        throw new Error("Invalid transaction data");
      }

      // Store transaction data for when we return from wallet
      const txId = Date.now().toString();
      localStorage.setItem(`near_pending_tx_${txId}`, JSON.stringify(txData));

      // Build transaction URL for NEAR wallet
      const currentUrl = new URL(window.location.href);
      const walletUrl = new URL("/sign", CONFIG.NETWORKS.NEAR.walletUrl);

      // Encode transaction data
      const encodedTx = btoa(JSON.stringify(txData));
      walletUrl.searchParams.set("transactions", encodedTx);
      walletUrl.searchParams.set("callbackUrl", currentUrl.toString());

      this.logger.info("Redirecting to NEAR wallet for transaction signing...");

      // Redirect to NEAR wallet for real signing
      window.location.href = walletUrl.toString();

      // This promise will never resolve as we're redirecting
      return new Promise(() => {});
    } catch (error) {
      this.logger.error(`NEAR transaction signing failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sign a NEAR transaction (alternative method name for compatibility)
   * @param {Object} transaction - The transaction to sign
   */
  async signNearTransaction(transaction) {
    return this.signTransaction(transaction);
  }

  getAccountId() {
    return this.accountId;
  }

  isWalletConnected() {
    const result = this.isConnected && this.accountId !== null;
    console.log("🔍 isWalletConnected check:", {
      isConnected: this.isConnected,
      accountId: this.accountId,
      result: result,
    });
    return result;
  }

  async getBalance() {
    if (!this.isConnected) {
      return null;
    }

    try {
      // Query the NEAR RPC for real balance
      const response = await fetch(CONFIG.NETWORKS.NEAR.nodeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "dontcare",
          method: "query",
          params: {
            request_type: "view_account",
            finality: "final",
            account_id: this.accountId,
          },
        }),
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(`NEAR RPC error: ${result.error.message}`);
      }

      if (result.result) {
        return {
          total: result.result.amount,
          available: result.result.amount, // Simplified - in reality would subtract storage costs
          storage_usage: result.result.storage_usage,
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to get NEAR balance: ${error.message}`);
      return null;
    }
  }

  // Helper method to check if we're in a wallet callback
  isWalletCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has("account_id") && urlParams.has("public_key");
  }

  // Helper method to get wallet URL for manual connection
  getWalletUrl() {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete("account_id");
    currentUrl.searchParams.delete("public_key");
    currentUrl.searchParams.delete("all_keys");

    const walletUrl = new URL("/login/", CONFIG.NETWORKS.NEAR.walletUrl);
    walletUrl.searchParams.set("contract_id", CONFIG.CONTRACTS.BRIDGE_NEAR);
    walletUrl.searchParams.set("success_url", currentUrl.toString());
    walletUrl.searchParams.set("failure_url", currentUrl.toString());

    return walletUrl.toString();
  }
}
