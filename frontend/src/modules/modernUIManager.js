// Modern UI management module for enhanced user experience
import { EventEmitter } from "./eventEmitter.js";

export class ModernUIManager extends EventEmitter {
  constructor(logger) {
    super();
    this.logger = logger;
    this.theme = localStorage.getItem("theme") || "light";
    this.toasts = [];
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.applyTheme();
    this.setupSmoothScrolling();
    this.updateGasEstimate();
  }

  setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => this.toggleTheme());
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute("href"));
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      });
    });

    // Max amount button
    const maxBtn = document.getElementById("max-amount");
    if (maxBtn) {
      maxBtn.addEventListener("click", () => this.setMaxAmount());
    }

    // Status card close button
    const closeStatus = document.getElementById("close-status");
    if (closeStatus) {
      closeStatus.addEventListener("click", () => this.hideStatusCard());
    }

    // Form validation
    const amountInput = document.getElementById("amount");
    const recipientInput = document.getElementById("recipient");

    [amountInput, recipientInput].forEach((input) => {
      if (input) {
        input.addEventListener("input", () => this.validateForm());
        input.addEventListener("blur", () => this.validateForm());
      }
    });
  }

  toggleTheme() {
    this.theme = this.theme === "light" ? "dark" : "light";
    localStorage.setItem("theme", this.theme);
    this.applyTheme();

    this.showToast(`Switched to ${this.theme} mode`, "success");
  }

  applyTheme() {
    document.documentElement.setAttribute("data-theme", this.theme);
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.textContent = this.theme === "light" ? "🌙" : "☀️";
      themeToggle.title = `Switch to ${
        this.theme === "light" ? "dark" : "light"
      } mode`;
    }
  }

  setupSmoothScrolling() {
    document.documentElement.style.scrollBehavior = "smooth";
  }

  // Wallet status updates
  updateNearStatus(connected, account = null) {
    const walletItem = document.getElementById("near-wallet");
    const accountElement = document.getElementById("near-account");
    const connectButton = document.getElementById("connect-near");

    if (connected && account) {
      walletItem?.classList.add("connected");
      accountElement.textContent = this.formatAccount(account);
      connectButton.textContent = "✓ Connected";
      connectButton.disabled = true;
      connectButton.classList.add("connected");
    } else {
      walletItem?.classList.remove("connected");
      accountElement.textContent = "Not connected";
      connectButton.textContent = "Connect";
      connectButton.disabled = false;
      connectButton.classList.remove("connected");
    }

    this.validateForm();
  }

  updateBaseStatus(connected, account = null, walletInfo = null) {
    const walletItem = document.getElementById("base-wallet");
    const accountElement = document.getElementById("base-account");
    const connectButton = document.getElementById("connect-base");

    if (connected && account) {
      walletItem?.classList.add("connected");

      // Show wallet name and account
      if (walletInfo) {
        accountElement.innerHTML = `
                    <div class="wallet-info">
                        <span class="wallet-name">${walletInfo.icon} ${
          walletInfo.name
        }</span>
                        <span class="wallet-address">${this.formatAddress(
                          account
                        )}</span>
                    </div>
                `;
      } else {
        accountElement.textContent = this.formatAddress(account);
      }

      connectButton.textContent = "✓ Connected";
      connectButton.disabled = true;
      connectButton.classList.add("connected");
      this.updateUSDCBalance(account);
    } else {
      walletItem?.classList.remove("connected");
      accountElement.textContent = "Not connected";
      connectButton.textContent = "Connect Wallet";
      connectButton.disabled = false;
      connectButton.classList.remove("connected");
      this.updateUSDCBalance(null);
    }

    this.validateForm();
  }

  // Transaction status updates
  updateTransactionStatus(status) {
    this.showStatusCard();

    // Update step progress based on status
    if (status.includes("NEAR") || status.includes("authorization")) {
      this.updateStep(1, "active", status);
    } else if (status.includes("bridge") || status.includes("processing")) {
      this.updateStep(1, "completed", "Authorized");
      this.updateStep(2, "active", status);
    } else if (status.includes("Base") || status.includes("settlement")) {
      this.updateStep(1, "completed", "Authorized");
      this.updateStep(2, "completed", "Processed");
      this.updateStep(3, "active", status);
    } else if (status.includes("completed") || status.includes("success")) {
      this.updateStep(1, "completed", "Authorized");
      this.updateStep(2, "completed", "Processed");
      this.updateStep(3, "completed", "Completed");
      this.showToast("Transfer completed successfully!", "success");
    }
  }

  updateStep(stepNumber, state, statusText) {
    const step = document.getElementById(`step-${stepNumber}`);
    if (!step) return;

    // Remove all state classes
    step.classList.remove("active", "completed");

    // Add new state
    if (state !== "pending") {
      step.classList.add(state);
    }

    // Update status text
    const statusElement = step.querySelector(".step-status");
    if (statusElement) {
      statusElement.textContent = statusText || "Waiting";
    }
  }

  updateNearTxHash(hash) {
    const link = document.getElementById("near-tx-link");
    if (link && hash) {
      link.href = `https://testnet.nearblocks.io/txns/${hash}`;
      link.style.display = "flex";
    }
  }

  updateBaseTxHash(hash) {
    const link = document.getElementById("base-tx-link");
    if (link && hash) {
      link.href = `https://sepolia-explorer.base.org/tx/${hash}`;
      link.style.display = "flex";
    }
  }

  // Form management
  validateForm() {
    const amount = document.getElementById("amount")?.value;
    const recipient = document.getElementById("recipient")?.value;
    const submitButton = document.getElementById("submit-transaction");
    const nearConnected = document
      .getElementById("near-wallet")
      ?.classList.contains("connected");
    const baseConnected = document
      .getElementById("base-wallet")
      ?.classList.contains("connected");

    const isValid =
      nearConnected &&
      baseConnected &&
      amount &&
      parseFloat(amount) > 0 &&
      recipient &&
      this.isValidAddress(recipient);

    if (submitButton) {
      submitButton.disabled = !isValid;
    }

    return isValid;
  }

  setMaxAmount() {
    const balanceElement = document.getElementById("usdc-balance");
    const amountInput = document.getElementById("amount");

    if (balanceElement && amountInput) {
      const balanceText = balanceElement.textContent;
      const match = balanceText.match(/(\d+\.?\d*)/);
      if (match) {
        amountInput.value = match[1];
        this.validateForm();
      }
    }
  }

  updateUSDCBalance(account) {
    const balanceElement = document.getElementById("usdc-balance");
    if (!balanceElement) return;

    if (account) {
      balanceElement.textContent = "Balance: Loading...";
      // In a real implementation, fetch actual balance
      setTimeout(() => {
        balanceElement.textContent = "Balance: 1,000.00 USDC";
      }, 1000);
    } else {
      balanceElement.textContent = "Balance: --";
    }
  }

  updateGasEstimate(gasData) {
    const gasElement = document.getElementById("gas-amount");
    const totalElement = document.getElementById("total-cost");

    if (gasData) {
      gasElement.textContent = `~$${gasData.estimatedCostUsd}`;
      totalElement.textContent = `~$${gasData.estimatedCostUsd}`;
    } else {
      gasElement.textContent = "~$0.02";
      totalElement.textContent = "~$0.02";
    }
  }

  // Status card management
  showStatusCard() {
    const statusCard = document.getElementById("status-card");
    if (statusCard) {
      statusCard.style.display = "block";
      statusCard.classList.add("fade-in");
    }
  }

  hideStatusCard() {
    const statusCard = document.getElementById("status-card");
    if (statusCard) {
      statusCard.style.display = "none";
    }
  }

  // Loading states
  setButtonLoading(buttonId, loading) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    if (loading) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.innerHTML = '<span class="loading"></span> Processing...';
    } else {
      button.disabled = false;
      button.innerHTML = button.dataset.originalText || "Transfer USDC";
    }
  }

  // Toast notifications
  showToast(message, type = "info", duration = 5000) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };

    toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close">×</button>
        `;

    // Add close functionality
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => this.removeToast(toast));

    container.appendChild(toast);
    this.toasts.push(toast);

    // Auto remove after duration
    setTimeout(() => this.removeToast(toast), duration);
  }

  removeToast(toast) {
    if (toast.parentNode) {
      toast.style.animation = "slideOut 0.3s ease forwards";
      setTimeout(() => {
        toast.parentNode.removeChild(toast);
        this.toasts = this.toasts.filter((t) => t !== toast);
      }, 300);
    }
  }

  // Utility functions
  formatAccount(account) {
    if (!account) return "";
    return account.length > 20
      ? `${account.slice(0, 8)}...${account.slice(-8)}`
      : account;
  }

  formatAddress(address) {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  isValidAddress(address) {
    return address && /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}
