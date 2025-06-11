// Clean API client for backend communication
export class ApiClient {
  constructor(baseUrl = "http://localhost:8080") {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === "object") {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Health check
  async getHealth() {
    return this.request("/health");
  }

  // Bridge status
  async getBridgeStatus() {
    return this.request("/api/bridge/status");
  }

  // Modern Omnibridge: Direct NEAR → Base (recommended)
  async transferNearToBase(params) {
    return this.request("/api/bridge/near-to-base", {
      method: "POST",
      body: params,
    });
  }

  // Modern Omnibridge: Any supported chain
  async transferViaOmnibridge(params) {
    return this.request("/api/bridge/omnibridge", {
      method: "POST",
      body: params,
    });
  }

  // Legacy: NEAR → Ethereum (for compatibility)
  async transferNearToEthereum(params) {
    return this.request("/api/bridge/near-to-ethereum", {
      method: "POST",
      body: params,
    });
  }

  // Legacy: Ethereum → Base via CCIP
  async transferEthereumToBase(params) {
    return this.request("/api/bridge/ethereum-to-base", {
      method: "POST",
      body: params,
    });
  }

  // Legacy: Two-stage bridge (now deprecated)
  async executeTwoStageBridge(params) {
    return this.request("/api/bridge/two-stage-legacy", {
      method: "POST",
      body: params,
    });
  }

  // Transaction status
  async getTransactionStatus(txHash) {
    return this.request(`/api/transaction/${txHash}`);
  }

  // Utility method for polling transaction status
  async pollTransactionStatus(txHash, maxAttempts = 30, intervalMs = 10000) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const status = await this.getTransactionStatus(txHash);

        if (status.found && status.status !== "pending") {
          return status;
        }

        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }
      } catch (error) {
        console.warn(`Attempt ${attempt + 1} failed:`, error.message);
        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }
      }
    }

    throw new Error("Transaction status polling timeout");
  }
}
