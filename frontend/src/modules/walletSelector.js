// Wallet selection UI component
export class WalletSelector {
  constructor(multiWalletManager, logger) {
    this.multiWalletManager = multiWalletManager;
    this.logger = logger;
    this.isOpen = false;
  }

  /**
   * Show wallet selection modal
   */
  show() {
    if (this.isOpen) return;

    this.isOpen = true;
    const modal = this.createModal();
    document.body.appendChild(modal);

    // Add event listeners
    this.setupEventListeners(modal);

    // Show modal with animation
    setTimeout(() => {
      modal.classList.add("show");
    }, 10);
  }

  /**
   * Hide wallet selection modal
   */
  hide() {
    if (!this.isOpen) return;

    const modal = document.getElementById("wallet-selector-modal");
    if (modal) {
      modal.classList.remove("show");
      setTimeout(() => {
        modal.remove();
        this.isOpen = false;
      }, 300);
    } else {
      // Force cleanup if modal element is missing but state says it's open
      this.isOpen = false;
    }
  }

  /**
   * Force cleanup of any leftover modals (Safari fix)
   */
  forceCleanup() {
    // Remove any leftover modal elements
    const existingModals = document.querySelectorAll(
      "#wallet-selector-modal, .wallet-selector-modal"
    );
    existingModals.forEach((modal) => modal.remove());

    // Remove any leftover WalletConnect modals
    const wcModals = document.querySelectorAll(".walletconnect-setup-modal");
    wcModals.forEach((modal) => modal.remove());

    // Reset state
    this.isOpen = false;

    console.log("🧹 Forced cleanup of modal elements");
  }

  /**
   * Create modal HTML
   */
  createModal() {
    const modal = document.createElement("div");
    modal.id = "wallet-selector-modal";
    modal.className = "wallet-selector-modal";

    const detectedWallets = this.multiWalletManager.getDetectedWallets();
    const hasWallets = detectedWallets.length > 0;

    modal.innerHTML = `
      <div class="wallet-selector-overlay" onclick="window.walletSelector?.hide()"></div>
      <div class="wallet-selector-content">
        <div class="wallet-selector-header">
          <h3>Connect Wallet</h3>
          <button class="wallet-selector-close" onclick="window.walletSelector?.hide()">×</button>
        </div>
        
        <div class="wallet-selector-body">
          ${
            hasWallets
              ? this.renderWalletList(detectedWallets)
              : this.renderNoWallets()
          }
        </div>
        
        <div class="wallet-selector-footer">
          <p class="wallet-selector-note">
            ${
              hasWallets
                ? "Choose your preferred wallet to connect to Base network"
                : "Install a wallet to continue"
            }
          </p>
        </div>
      </div>
    `;

    // Add styles
    this.addStyles();

    return modal;
  }

  /**
   * Render list of available wallets
   */
  renderWalletList(wallets) {
    return `
      <div class="wallet-list">
        ${wallets
          .map((wallet) => {
            const isInjected = wallet.type === "injected";
            const isMobile = wallet.type === "mobile";
            const statusText = isInjected
              ? "Available"
              : isMobile
              ? "Mobile/QR"
              : "Available";
            const description = wallet.description
              ? `<div class="wallet-description">${wallet.description}</div>`
              : "";

            return `
            <button class="wallet-item ${wallet.type}" data-wallet-id="${wallet.id}">
              <span class="wallet-icon">${wallet.icon}</span>
              <div class="wallet-info">
                <span class="wallet-name">${wallet.name}</span>
                ${description}
              </div>
              <span class="wallet-status">${statusText}</span>
            </button>
          `;
          })
          .join("")}
      </div>
    `;
  }

  /**
   * Render no wallets message
   */
  renderNoWallets() {
    return `
      <div class="no-wallets">
        <div class="no-wallets-icon">💼</div>
        <h4>No Wallets Detected</h4>
        <p>To connect to Base network, you need to install a compatible wallet:</p>
        
        <div class="wallet-recommendations">
          <a href="https://metamask.io/download/" target="_blank" class="wallet-download">
            <span class="wallet-icon">🦊</span>
            <span class="wallet-name">MetaMask</span>
            <span class="wallet-desc">Most popular</span>
          </a>
          
          <a href="https://www.coinbase.com/wallet" target="_blank" class="wallet-download">
            <span class="wallet-icon">🔵</span>
            <span class="wallet-name">Coinbase Wallet</span>
            <span class="wallet-desc">Easy to use</span>
          </a>
          
          <a href="https://brave.com/wallet/" target="_blank" class="wallet-download">
            <span class="wallet-icon">🦁</span>
            <span class="wallet-name">Brave Wallet</span>
            <span class="wallet-desc">Built-in browser</span>
          </a>
        </div>
        
        <button class="refresh-wallets" onclick="window.walletSelector?.refresh()">
          🔄 Refresh
        </button>
      </div>
    `;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners(modal) {
    // Wallet selection
    const walletItems = modal.querySelectorAll(".wallet-item");
    walletItems.forEach((item) => {
      item.addEventListener("click", async (e) => {
        const walletId = e.currentTarget.dataset.walletId;
        await this.connectWallet(walletId);
      });
    });

    // Close on escape key
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  /**
   * Handle keyboard events
   */
  handleKeyDown(e) {
    if (e.key === "Escape" && this.isOpen) {
      this.hide();
    }
  }

  /**
   * Connect to selected wallet
   */
  async connectWallet(walletId) {
    try {
      const walletItem = document.querySelector(
        `[data-wallet-id="${walletId}"]`
      );
      if (walletItem) {
        walletItem.classList.add("connecting");
        walletItem.innerHTML = `
          <span class="wallet-icon">⏳</span>
          <span class="wallet-name">Connecting...</span>
          <span class="wallet-status">Please approve</span>
        `;
      }

      await this.multiWalletManager.connectWallet(walletId);
      this.hide();
    } catch (error) {
      this.logger.error(`Failed to connect wallet: ${error.message}`);

      // Reset wallet item
      const walletItem = document.querySelector(
        `[data-wallet-id="${walletId}"]`
      );
      if (walletItem) {
        const wallet = this.multiWalletManager.supportedWallets.find(
          (w) => w.id === walletId
        );
        walletItem.classList.remove("connecting");
        walletItem.innerHTML = `
          <span class="wallet-icon">${wallet.icon}</span>
          <span class="wallet-name">${wallet.name}</span>
          <span class="wallet-status error">Failed to connect</span>
        `;

        setTimeout(() => {
          walletItem.innerHTML = `
            <span class="wallet-icon">${wallet.icon}</span>
            <span class="wallet-name">${wallet.name}</span>
            <span class="wallet-status">Available</span>
          `;
        }, 2000);
      }
    }
  }

  /**
   * Refresh wallet detection
   */
  refresh() {
    this.hide();
    setTimeout(() => {
      this.show();
    }, 100);
  }

  /**
   * Add CSS styles
   */
  addStyles() {
    if (document.getElementById("wallet-selector-styles")) return;

    const styles = document.createElement("style");
    styles.id = "wallet-selector-styles";
    styles.textContent = `
      .wallet-selector-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }
      
      .wallet-selector-modal.show {
        opacity: 1;
        visibility: visible;
      }
      
      .wallet-selector-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
      }
      
      .wallet-selector-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        max-width: 400px;
        width: 90%;
        max-height: 80vh;
        overflow: hidden;
      }
      
      .wallet-selector-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .wallet-selector-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #111827;
      }
      
      .wallet-selector-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #6b7280;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
      }
      
      .wallet-selector-close:hover {
        background: #f3f4f6;
      }
      
      .wallet-selector-body {
        padding: 24px;
      }
      
      .wallet-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .wallet-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        background: white;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: left;
        width: 100%;
      }

      .wallet-item:hover {
        border-color: #3b82f6;
        background: #f8fafc;
      }

      .wallet-item.connecting {
        border-color: #f59e0b;
        background: #fffbeb;
      }

      .wallet-item.mobile {
        border-color: #8b5cf6;
        background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
      }

      .wallet-item.mobile:hover {
        border-color: #7c3aed;
        background: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%);
      }
      
      .wallet-icon {
        font-size: 24px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .wallet-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .wallet-name {
        font-weight: 500;
        color: #111827;
      }

      .wallet-description {
        font-size: 12px;
        color: #6b7280;
        font-style: italic;
      }
      
      .wallet-status {
        font-size: 12px;
        color: #6b7280;
        background: #f3f4f6;
        padding: 4px 8px;
        border-radius: 6px;
      }
      
      .wallet-status.error {
        color: #dc2626;
        background: #fef2f2;
      }
      
      .no-wallets {
        text-align: center;
        padding: 20px 0;
      }
      
      .no-wallets-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      .no-wallets h4 {
        margin: 0 0 8px 0;
        color: #111827;
      }
      
      .no-wallets p {
        color: #6b7280;
        margin: 0 0 24px 0;
      }
      
      .wallet-recommendations {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 24px;
      }
      
      .wallet-download {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        text-decoration: none;
        color: inherit;
        transition: all 0.2s ease;
      }
      
      .wallet-download:hover {
        border-color: #3b82f6;
        background: #f8fafc;
      }
      
      .wallet-desc {
        font-size: 12px;
        color: #6b7280;
        margin-left: auto;
      }
      
      .refresh-wallets {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
      }
      
      .refresh-wallets:hover {
        background: #2563eb;
      }
      
      .wallet-selector-footer {
        padding: 16px 24px;
        border-top: 1px solid #e5e7eb;
        background: #f9fafb;
      }
      
      .wallet-selector-note {
        margin: 0;
        font-size: 12px;
        color: #6b7280;
        text-align: center;
      }
    `;

    document.head.appendChild(styles);
  }
}
