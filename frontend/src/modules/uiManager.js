// UI management module
export class UIManager {
    constructor(logger) {
        this.logger = logger;
        this.elements = {};
    }

    init() {
        // Cache DOM elements
        this.elements = {
            nearStatus: document.getElementById('near-status'),
            baseStatus: document.getElementById('base-status'),
            connectNear: document.getElementById('connect-near'),
            connectBase: document.getElementById('connect-base'),
            txStatus: document.getElementById('tx-status'),
            nearTxHash: document.getElementById('near-tx-hash'),
            baseTxHash: document.getElementById('base-tx-hash'),
            gasAmount: document.getElementById('gas-amount'),
            submitButton: document.getElementById('submit-transaction')
        };

        this.logger.init();
        this.logger.info('UI Manager initialized');
    }

    updateNearStatus(connected, account = null) {
        const status = this.elements.nearStatus;
        const button = this.elements.connectNear;

        if (connected && account) {
            status.textContent = `Connected: ${this.truncateAddress(account)}`;
            status.className = 'status connected';
            button.textContent = 'Disconnect';
            button.className = 'btn btn-secondary';
        } else {
            status.textContent = 'Disconnected';
            status.className = 'status disconnected';
            button.textContent = 'Connect NEAR';
            button.className = 'btn btn-primary';
        }
    }

    updateBaseStatus(connected, account = null) {
        const status = this.elements.baseStatus;
        const button = this.elements.connectBase;

        if (connected && account) {
            status.textContent = `Connected: ${this.truncateAddress(account)}`;
            status.className = 'status connected';
            button.textContent = 'Disconnect';
            button.className = 'btn btn-secondary';
        } else {
            status.textContent = 'Disconnected';
            status.className = 'status disconnected';
            button.textContent = 'Connect Base';
            button.className = 'btn btn-secondary';
        }
    }

    updateTransactionStatus(status) {
        this.elements.txStatus.textContent = status;
        
        // Add visual feedback based on status
        const statusElement = this.elements.txStatus;
        statusElement.className = 'status-value';
        
        if (status.includes('completed') || status.includes('confirmed')) {
            statusElement.classList.add('success');
        } else if (status.includes('failed') || status.includes('error')) {
            statusElement.classList.add('error');
        } else if (status.includes('waiting') || status.includes('pending')) {
            statusElement.classList.add('warning');
        }
    }

    updateNearTxHash(hash) {
        const element = this.elements.nearTxHash;
        if (hash) {
            element.textContent = this.truncateHash(hash);
            element.title = hash;
            element.style.cursor = 'pointer';
            element.onclick = () => this.openNearExplorer(hash);
        } else {
            element.textContent = '-';
            element.title = '';
            element.style.cursor = 'default';
            element.onclick = null;
        }
    }

    updateBaseTxHash(hash) {
        const element = this.elements.baseTxHash;
        if (hash) {
            element.textContent = this.truncateHash(hash);
            element.title = hash;
            element.style.cursor = 'pointer';
            element.onclick = () => this.openBaseExplorer(hash);
        } else {
            element.textContent = '-';
            element.title = '';
            element.style.cursor = 'default';
            element.onclick = null;
        }
    }

    updateGasEstimate(gasData) {
        if (gasData) {
            this.elements.gasAmount.textContent = `~${gasData.estimatedCostEth} ETH ($${gasData.estimatedCostUsd})`;
        }
    }

    setButtonLoading(buttonId, loading) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        if (loading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.innerHTML = '<span class="loading"></span> Loading...';
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || button.textContent;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '1000',
            maxWidth: '400px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });

        // Set background color based on type
        const colors = {
            success: '#48bb78',
            error: '#f56565',
            warning: '#ed8936',
            info: '#4299e1'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Add to DOM
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    truncateAddress(address) {
        if (!address) return '';
        if (address.length <= 10) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    truncateHash(hash) {
        if (!hash) return '';
        if (hash.length <= 16) return hash;
        return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
    }

    openNearExplorer(hash) {
        const url = `https://testnet.nearblocks.io/txns/${hash}`;
        window.open(url, '_blank');
    }

    openBaseExplorer(hash) {
        const url = `https://sepolia-explorer.base.org/tx/${hash}`;
        window.open(url, '_blank');
    }

    // Form validation helpers
    validateForm() {
        const amount = document.getElementById('amount').value;
        const recipient = document.getElementById('recipient').value;
        
        let isValid = true;
        let errors = [];

        // Validate amount
        if (!amount || parseFloat(amount) <= 0) {
            errors.push('Please enter a valid amount');
            isValid = false;
        }

        // Validate recipient address
        if (!recipient || !recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
            errors.push('Please enter a valid Ethereum address');
            isValid = false;
        }

        // Show validation errors
        this.clearValidationErrors();
        if (!isValid) {
            this.showValidationErrors(errors);
        }

        return isValid;
    }

    showValidationErrors(errors) {
        errors.forEach(error => {
            this.showNotification(error, 'error');
        });
    }

    clearValidationErrors() {
        // Remove existing error notifications
        const existingErrors = document.querySelectorAll('.notification.error');
        existingErrors.forEach(error => error.remove());
    }

    // Loading states
    showPageLoading() {
        const loader = document.createElement('div');
        loader.id = 'page-loader';
        loader.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            ">
                <div class="loading" style="width: 40px; height: 40px;"></div>
            </div>
        `;
        document.body.appendChild(loader);
    }

    hidePageLoading() {
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.remove();
        }
    }
}