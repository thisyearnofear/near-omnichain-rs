// Configuration constants for the application
export const CONFIG = {
    // Network configurations
    NETWORKS: {
        NEAR: {
            networkId: 'mainnet',
            nodeUrl: 'https://rpc.mainnet.near.org',
            walletUrl: 'https://app.mynearwallet.com/',
            helperUrl: 'https://helper.mainnet.near.org',
            explorerUrl: 'https://nearblocks.io',
        },
        BASE: {
            chainId: 84532, // Base Sepolia testnet
            name: 'Base Sepolia',
            rpcUrl: 'https://sepolia.base.org',
            explorerUrl: 'https://sepolia-explorer.base.org',
            nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18
            }
        }
    },

    // Contract addresses
    CONTRACTS: {
        USDC_BASE: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
        BRIDGE_NEAR: 'bridge.near', // Example bridge contract on NEAR
    },

    // Transaction settings
    TRANSACTION: {
        DEFAULT_GAS_LIMIT: 21000,
        DEFAULT_GAS_PRICE: '20000000000', // 20 Gwei
        USDC_DECIMALS: 6,
        SLIPPAGE_TOLERANCE: 0.5, // 0.5%
    },

    // UI settings
    UI: {
        TRANSACTION_TIMEOUT: 300000, // 5 minutes
        POLLING_INTERVAL: 2000, // 2 seconds
        MAX_RETRIES: 3,
    },

    // API endpoints (for demo purposes)
    API: {
        GAS_ORACLE: 'https://api.etherscan.io/api?module=gastracker&action=gasoracle',
        PRICE_FEED: 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,near&vs_currencies=usd',
    }
};

// ABI for USDC contract (simplified)
export const USDC_ABI = [
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {"name": "_to", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
    }
];

// Error messages
export const ERRORS = {
    WALLET_NOT_CONNECTED: 'Wallet not connected',
    INSUFFICIENT_BALANCE: 'Insufficient balance',
    INVALID_ADDRESS: 'Invalid address format',
    TRANSACTION_FAILED: 'Transaction failed',
    NETWORK_ERROR: 'Network error occurred',
    USER_REJECTED: 'User rejected the transaction',
};

// Success messages
export const MESSAGES = {
    WALLET_CONNECTED: 'Wallet connected successfully',
    TRANSACTION_SUBMITTED: 'Transaction submitted successfully',
    TRANSACTION_CONFIRMED: 'Transaction confirmed',
    CROSS_CHAIN_COMPLETE: 'Cross-chain transfer completed',
};