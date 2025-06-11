/**
 * NUCLEAR CLEAN MAIN.JS - ZERO POLYFILLS, ZERO WASM, ZERO CONFLICTS
 * API-FIRST ARCHITECTURE - BACKEND HANDLES ALL BRIDGE LOGIC
 */

import { ModernUIManager } from "./modules/modernUIManager.js";
import { WalletManager } from "./modules/walletManager.js";
import { ApiClient } from "./services/apiClient.js";
import { Logger } from "./modules/logger.js";

class CleanBridgeApp {
  constructor() {
    this.logger = new Logger();
    this.uiManager = new ModernUIManager(this.logger);
    this.walletManager = new WalletManager(this.logger);
    this.apiClient = new ApiClient("http://localhost:8080");

    // State tracking
    this.nearConnected = false;
    this.baseConnected = false;
    this.bridgeReady = false;

    this.init();
  }

  cleanupLeftoverModals() {
    // Remove any leftover modal elements that might be blocking clicks
    const modalSelectors = [
      "#wallet-selector-modal",
      ".wallet-selector-modal",
      ".walletconnect-setup-modal",
      "#page-loader",
    ];

    modalSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        console.log(`🧹 Removing leftover modal: ${selector}`);
        element.remove();
      });
    });

    // Remove any high z-index fixed position elements that might be blocking
    const allElements = document.querySelectorAll("*");
    allElements.forEach((element) => {
      const style = window.getComputedStyle(element);
      if (style.position === "fixed" && parseInt(style.zIndex) > 5000) {
        // Check if it's not a legitimate element (nav, toast container, etc.)
        if (
          !element.classList.contains("nav") &&
          !element.classList.contains("toast-container") &&
          !element.id.includes("toast")
        ) {
          console.log("🧹 Removing high z-index blocking element:", element);
          element.remove();
        }
      }
    });
  }

  async init() {
    try {
      this.logger.log("🚀 Initializing Clean Bridge App...");

      // Clean up any leftover modals from previous sessions (Safari fix)
      this.cleanupLeftoverModals();

      // Initialize UI
      this.uiManager.init();

      // Set up event listeners
      this.setupEventListeners();

      // Initialize wallet manager
      await this.walletManager.init();

      // Force multiple connection checks to ensure UI updates
      setTimeout(() => {
        this.forceConnectionCheck();
      }, 500);

      setTimeout(() => {
        this.forceConnectionCheck();
      }, 1500);

      setTimeout(() => {
        this.forceConnectionCheck();
      }, 3000);

      // Add manual trigger for testing
      window.debugApp = this;
      window.manualNearConnect = () => {
        if (
          this.walletManager.nearWallet &&
          this.walletManager.nearWallet.isWalletConnected()
        ) {
          const accountId = this.walletManager.nearWallet.getAccountId();
          this.logger.info(
            `🔧 Manual trigger: NEAR connected with ${accountId}`
          );
          this.walletManager.emit("nearConnected", accountId);
        }
      };

      // Add localStorage debug function
      window.checkNearStorage = () => {
        const authKey = localStorage.getItem("near_app_wallet_auth_key");
        const accountId = localStorage.getItem("near_wallet_account_id");
        const requestId = localStorage.getItem("near_wallet_request_id");
        this.logger.info(
          `📦 LocalStorage check: authKey=${!!authKey}, accountId=${accountId}, requestId=${requestId}`
        );
        console.log("📦 Full localStorage:", { authKey, accountId, requestId });
        return { authKey, accountId, requestId };
      };

      // Add URL debug function
      window.checkUrlParams = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const accountId = urlParams.get("account_id");
        const publicKey = urlParams.get("public_key");
        const allKeys = urlParams.get("all_keys");
        this.logger.info(
          `🔗 URL params: accountId=${accountId}, publicKey=${!!publicKey}, allKeys=${allKeys}`
        );
        console.log("🔗 Full URL params:", { accountId, publicKey, allKeys });
        return { accountId, publicKey, allKeys };
      };

      // Add manual button test functions
      window.testNearButton = () => {
        console.log("🧪 Testing NEAR button manually...");
        this.handleNearConnection();
      };

      window.testBaseButton = () => {
        console.log("🧪 Testing Base button manually...");
        this.handleBaseConnection();
      };

      // Add manual localStorage setter for testing
      window.setTestNearConnection = (accountId = "papajams.near") => {
        localStorage.setItem(
          "near_app_wallet_auth_key",
          "ed25519:test_key_12345"
        );
        localStorage.setItem("near_wallet_account_id", accountId);
        this.logger.info(`🧪 Test connection set for: ${accountId}`);

        // Force re-initialization
        setTimeout(() => {
          this.walletManager.init();
        }, 100);
      };

      // Add modal cleanup function for Safari issues
      window.cleanupModals = () => {
        if (this.walletManager?.walletSelector) {
          this.walletManager.walletSelector.forceCleanup();
        }

        // Also remove any other potential blocking elements
        const overlays = document.querySelectorAll(
          '[style*="position: fixed"], [style*="z-index"]'
        );
        overlays.forEach((overlay) => {
          const style = window.getComputedStyle(overlay);
          if (style.position === "fixed" && parseInt(style.zIndex) > 1000) {
            console.log("🧹 Removing potential blocking overlay:", overlay);
            overlay.remove();
          }
        });

        this.logger.info("🧹 Modal cleanup completed");
      };

      // Add debug function to check for blocking elements
      window.checkBlockingElements = () => {
        const fixedElements = [];
        const allElements = document.querySelectorAll("*");

        allElements.forEach((element) => {
          const style = window.getComputedStyle(element);
          if (style.position === "fixed" || style.position === "absolute") {
            const rect = element.getBoundingClientRect();
            if (rect.width > 100 && rect.height > 100) {
              // Large enough to potentially block
              fixedElements.push({
                element: element,
                tagName: element.tagName,
                className: element.className,
                id: element.id,
                zIndex: style.zIndex,
                position: style.position,
                pointerEvents: style.pointerEvents,
                visibility: style.visibility,
                opacity: style.opacity,
                rect: rect,
              });
            }
          }
        });

        console.log("🔍 Potentially blocking elements:", fixedElements);
        return fixedElements;
      };

      // Add manual button test function
      window.testButtons = () => {
        const connectNearBtn = document.getElementById("connect-near");
        const connectBaseBtn = document.getElementById("connect-base");

        console.log("🧪 Testing buttons...");
        console.log("🧪 NEAR button:", connectNearBtn);
        console.log("🧪 Base button:", connectBaseBtn);

        if (connectNearBtn) {
          console.log(
            "🧪 NEAR button styles:",
            window.getComputedStyle(connectNearBtn)
          );
          console.log("🧪 NEAR button disabled:", connectNearBtn.disabled);
          console.log(
            "🧪 NEAR button pointer-events:",
            window.getComputedStyle(connectNearBtn).pointerEvents
          );
        }

        if (connectBaseBtn) {
          console.log(
            "🧪 Base button styles:",
            window.getComputedStyle(connectBaseBtn)
          );
          console.log("🧪 Base button disabled:", connectBaseBtn.disabled);
          console.log(
            "🧪 Base button pointer-events:",
            window.getComputedStyle(connectBaseBtn).pointerEvents
          );
        }
      };

      // Add manual click trigger
      window.triggerNearConnect = () => {
        console.log("🧪 Manually triggering NEAR connect...");
        this.handleNearConnection();
      };

      window.triggerBaseConnect = () => {
        console.log("🧪 Manually triggering Base connect...");
        this.handleBaseConnection();
      };

      // Check backend status
      await this.checkBackendStatus();

      this.logger.success("✅ Application initialized successfully");
    } catch (error) {
      this.logger.error(`❌ Initialization failed: ${error.message}`);
      this.showError("Failed to initialize. Please refresh and try again.");
    }
  }

  async checkBackendStatus() {
    try {
      const health = await this.apiClient.getHealth();
      const bridgeStatus = await this.apiClient.getBridgeStatus();

      this.bridgeReady = bridgeStatus.ready;

      if (this.bridgeReady) {
        this.logger.success(
          "🌉 NEAR Omnibridge ready - Modern Chain Abstraction"
        );
      } else {
        this.logger.warn("⚠️ Omnibridge infrastructure not ready");
      }
    } catch (error) {
      this.logger.warn(`⚠️ Backend not available: ${error.message}`);
      this.bridgeReady = false;
    }
  }

  setupEventListeners() {
    // Wallet connection buttons
    const connectNearBtn = document.getElementById("connect-near");
    const connectBaseBtn = document.getElementById("connect-base");

    console.log("🔗 Setting up event listeners...");
    console.log("🔗 Connect NEAR button:", connectNearBtn);
    console.log("🔗 Connect Base button:", connectBaseBtn);

    if (connectNearBtn) {
      // Try multiple event binding approaches for compatibility
      connectNearBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("🔗 NEAR connect button clicked!");
        this.handleNearConnection();
      });

      // Also add onclick as fallback
      connectNearBtn.onclick = (e) => {
        e.preventDefault();
        console.log("🔗 NEAR connect button onclick!");
        this.handleNearConnection();
      };
    } else {
      console.error("❌ Connect NEAR button not found!");
    }

    if (connectBaseBtn) {
      // Try multiple event binding approaches for compatibility
      connectBaseBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("🔗 Base connect button clicked!");
        this.handleBaseConnection();
      });

      // Also add onclick as fallback
      connectBaseBtn.onclick = (e) => {
        e.preventDefault();
        console.log("🔗 Base connect button onclick!");
        this.handleBaseConnection();
      };
    } else {
      console.error("❌ Connect Base button not found!");
    }

    // Transaction form
    document
      .getElementById("transaction-form")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleBridgeTransfer();
      });

    // Form validation
    const amountInput = document.getElementById("amount");
    const recipientInput = document.getElementById("recipient");

    [amountInput, recipientInput].forEach((input) => {
      input.addEventListener("input", () => {
        this.validateForm();
      });
    });

    // Wallet state changes
    this.walletManager.on("nearConnected", (account) => {
      this.logger.info(`📡 Received nearConnected event for: ${account}`);
      this.nearConnected = true;
      this.uiManager.updateNearStatus(true, account);
      this.validateForm();
      this.logger.success(`🔵 NEAR connected: ${account}`);
    });

    this.walletManager.on("nearDisconnected", () => {
      this.logger.info(`📡 Received nearDisconnected event`);
      this.nearConnected = false;
      this.uiManager.updateNearStatus(false);
      this.validateForm();
    });

    this.walletManager.on("baseConnected", (account) => {
      this.baseConnected = true;
      const walletInfo = this.walletManager.multiWalletManager.getWalletInfo();
      this.uiManager.updateBaseStatus(true, account, walletInfo);
      this.validateForm();
      this.logger.success(
        `🔷 ${walletInfo?.name || "EVM wallet"} connected: ${account}`
      );
    });

    this.walletManager.on("baseDisconnected", () => {
      this.baseConnected = false;
      this.uiManager.updateBaseStatus(false);
      this.validateForm();
    });
  }

  async handleNearConnection() {
    try {
      console.log("🚀 handleNearConnection called");
      this.logger.info("🚀 Starting NEAR wallet connection...");
      this.uiManager.setButtonLoading("connect-near", true);
      await this.walletManager.connectNear();
    } catch (error) {
      console.error("❌ NEAR connection error:", error);
      this.logger.error(`NEAR connection failed: ${error.message}`);
      this.showError("Failed to connect NEAR wallet. Please try again.");
    } finally {
      this.uiManager.setButtonLoading("connect-near", false);
    }
  }

  async handleBaseConnection() {
    try {
      console.log("🚀 handleBaseConnection called");
      this.logger.info("🚀 Starting Base wallet connection...");
      this.uiManager.setButtonLoading("connect-base", true);
      await this.walletManager.connectBase();
    } catch (error) {
      console.error("❌ Base connection error:", error);
      this.logger.error(`EVM wallet connection failed: ${error.message}`);
      this.showError(
        "Failed to connect wallet. Please make sure you have a compatible wallet installed and try again."
      );
    } finally {
      this.uiManager.setButtonLoading("connect-base", false);
    }
  }

  async handleBridgeTransfer() {
    try {
      const formData = this.getFormData();

      if (!this.validateFormData(formData)) {
        return;
      }

      if (!this.bridgeReady) {
        this.showError(
          "Bridge infrastructure not ready. Please try again later."
        );
        return;
      }

      this.uiManager.setButtonLoading("submit-transaction", true);
      this.uiManager.updateTransactionStatus(
        "🚀 Starting NEAR → Base transfer via Omnibridge..."
      );

      // Get NEAR signature for the transaction
      const nearSignature = await this.getNearSignature(formData);

      // Execute direct NEAR → Base transfer via modern Omnibridge
      const result = await this.apiClient.transferNearToBase({
        amount: formData.amount,
        recipient: formData.recipient,
        nearAccountId: this.walletManager.getNearAccount(),
        nearSignature: nearSignature,
      });

      if (result.success) {
        this.uiManager.updateNearTxHash(result.txHash);
        this.uiManager.updateBaseTxHash(result.txHash); // Same tx for direct transfer
        this.uiManager.updateTransactionStatus(
          "✅ Transfer completed successfully!"
        );
        this.logger.success("🎉 Direct Omnibridge transfer completed");
      } else {
        throw new Error("Omnibridge transfer failed");
      }
    } catch (error) {
      this.logger.error(`Bridge transfer failed: ${error.message}`);
      this.showError(`Transfer failed: ${error.message}`);
      this.uiManager.updateTransactionStatus("❌ Transfer failed");
    } finally {
      this.uiManager.setButtonLoading("submit-transaction", false);
    }
  }

  async getNearSignature(formData) {
    // In a real implementation, this would create a proper NEAR transaction
    // and get the user to sign it. For now, return a placeholder.
    return "placeholder_signature";
  }

  getFormData() {
    return {
      amount: document.getElementById("amount").value,
      recipient: document.getElementById("recipient").value,
    };
  }

  validateFormData(data) {
    if (!data.amount || parseFloat(data.amount) <= 0) {
      this.showError("Please enter a valid amount");
      return false;
    }

    if (
      !data.recipient ||
      !data.recipient.startsWith("0x") ||
      data.recipient.length !== 42
    ) {
      this.showError("Please enter a valid Base address (0x...)");
      return false;
    }

    if (!this.nearConnected) {
      this.showError("Please connect your NEAR wallet first");
      return false;
    }

    if (!this.baseConnected) {
      this.showError("Please connect MetaMask first");
      return false;
    }

    return true;
  }

  validateForm() {
    const amount = document.getElementById("amount").value;
    const recipient = document.getElementById("recipient").value;
    const submitButton = document.getElementById("submit-transaction");

    const isValid =
      this.nearConnected &&
      this.baseConnected &&
      amount &&
      parseFloat(amount) > 0 &&
      recipient &&
      recipient.startsWith("0x") &&
      recipient.length === 42 &&
      this.bridgeReady;

    submitButton.disabled = !isValid;
  }

  forceConnectionCheck() {
    this.logger.info("🔍 Force checking wallet connections...");

    // Manually check if NEAR wallet is connected
    if (this.walletManager.nearWallet) {
      const isConnected = this.walletManager.nearWallet.isWalletConnected();
      const accountId = this.walletManager.nearWallet.getAccountId();

      this.logger.info(
        `Force check - NEAR: connected=${isConnected}, account=${accountId}, appConnected=${this.nearConnected}`
      );

      if (isConnected && accountId && !this.nearConnected) {
        this.nearConnected = true;
        this.uiManager.updateNearStatus(true, accountId);
        this.validateForm();
        this.logger.success(`🔵 NEAR wallet force-detected: ${accountId}`);
      }
    } else {
      this.logger.warn("⚠️ NEAR wallet not available for force check");
    }

    // Also check Base wallet
    if (window.ethereum && !this.baseConnected) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts) => {
          if (accounts.length > 0) {
            this.logger.info(`🔷 Base wallet force-detected: ${accounts[0]}`);
          }
        })
        .catch(() => {
          // Ignore errors
        });
    }
  }

  showError(message) {
    // Create a toast notification for errors
    const toast = document.createElement("div");
    toast.className = "toast toast-error";
    toast.innerHTML = `
      <span class="toast-icon">❌</span>
      <span class="toast-message">${message}</span>
    `;

    const container = document.getElementById("toast-container");
    container.appendChild(toast);

    // Remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new CleanBridgeApp();
});
