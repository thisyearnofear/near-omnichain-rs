// Centralized logging module
export class Logger {
    constructor() {
        this.logContainer = null;
        this.maxLogs = 50;
    }

    init() {
        this.logContainer = document.getElementById('log-content');
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        
        // Console logging
        switch (type) {
            case 'error':
                console.error(logMessage);
                break;
            case 'warning':
                console.warn(logMessage);
                break;
            case 'success':
                console.log(`✅ ${logMessage}`);
                break;
            default:
                console.log(logMessage);
        }

        // UI logging
        this.addToUI(logMessage, type);
    }

    addToUI(message, type) {
        if (!this.logContainer) {
            this.logContainer = document.getElementById('log-content');
        }

        if (!this.logContainer) return;

        const logEntry = document.createElement('p');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = message;

        // Add to the beginning of the log
        this.logContainer.insertBefore(logEntry, this.logContainer.firstChild);

        // Limit the number of log entries
        const entries = this.logContainer.querySelectorAll('.log-entry');
        if (entries.length > this.maxLogs) {
            entries[entries.length - 1].remove();
        }

        // Auto-scroll to top
        this.logContainer.scrollTop = 0;
    }

    clear() {
        if (this.logContainer) {
            this.logContainer.innerHTML = '<p class="log-entry">Log cleared...</p>';
        }
    }

    // Specific logging methods
    error(message) {
        this.log(message, 'error');
    }

    success(message) {
        this.log(message, 'success');
    }

    warning(message) {
        this.log(message, 'warning');
    }

    warn(message) {
        this.log(message, 'warning');
    }

    info(message) {
        this.log(message, 'info');
    }
}