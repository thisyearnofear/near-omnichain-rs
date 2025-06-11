// Configuration constants for the application
export const CONFIG = {
  // Network configurations
  NETWORKS: {
    NEAR: {
      networkId: "mainnet",
      nodeUrl: "https://rpc.mainnet.near.org",
      walletUrl: "https://app.mynearwallet.com/",
      helperUrl: "https://helper.mainnet.near.org",
      explorerUrl: "https://nearblocks.io",
    },
    BASE: {
      chainId: 8453, // Base mainnet
      name: "Base",
      rpcUrl:
        "https://base-mainnet.g.alchemy.com/v2/SC6VQICVO3sAPFrVga_NHjUdq1XP8BDG",
      explorerUrl: "https://basescan.org",
      nativeCurrency: {
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
      },
    },
    ETHEREUM: {
      chainId: 1, // Ethereum mainnet
      name: "Ethereum",
      rpcUrl:
        "https://eth-mainnet.g.alchemy.com/v2/SC6VQICVO3sAPFrVga_NHjUdq1XP8BDG",
      explorerUrl: "https://etherscan.io",
      nativeCurrency: {
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
      },
    },
  },

  // Contract addresses - Using audited infrastructure only
  CONTRACTS: {
    // Direct contract references for transaction managers
    BRIDGE_NEAR: "wrap.near", // Use existing NEAR contract for wallet connection
    USDC_BASE: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base

    // Stage 1: NEAR → Ethereum (Rainbow Bridge)
    RAINBOW_BRIDGE: {
      NEAR_CONNECTOR: "rainbow-bridge.near", // Official Rainbow Bridge on NEAR
      ETH_CONNECTOR: "0x23Ddd3e3692d1861Ed57EDE224608875809e127f", // Rainbow Bridge on Ethereum
      USDC_NEAR: "usdc.near", // USDC token on NEAR
    },

    // Stage 2: Ethereum → Base (Chainlink CCIP)
    CCIP: {
      ETH_ROUTER: "0x80226fc0Ee2b096224EeAc085Bb9a8cba1146f7D", // Chainlink CCIP Router on Ethereum
      BASE_ROUTER: "0x881e3A65B4d4a04dD529061dd0071cf975F58bCD", // Chainlink CCIP Router on Base
      BASE_CHAIN_SELECTOR: "15971525489660198786", // Base chain selector for CCIP
      USDC_ETH: "0xA0b86a33E6441b8435b662f0E2d0c2837b0b3c0", // USDC on Ethereum
      USDC_BASE: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
    },
  },

  // Transaction settings
  TRANSACTION: {
    DEFAULT_GAS_LIMIT: 21000,
    DEFAULT_GAS_PRICE: "20000000000", // 20 Gwei
    USDC_DECIMALS: 6,
    SLIPPAGE_TOLERANCE: 0.5, // 0.5%

    // Bridge-specific settings
    RAINBOW_BRIDGE: {
      MIN_AMOUNT: "1000000", // 1 USDC minimum
      MAX_AMOUNT: "1000000000000", // 1M USDC maximum
      ESTIMATED_TIME: "10-30 minutes", // NEAR → Ethereum
    },

    CCIP: {
      MIN_AMOUNT: "1000000", // 1 USDC minimum
      ESTIMATED_TIME: "10-20 minutes", // Ethereum → Base via Chainlink CCIP
      MAX_AMOUNT: "100000000000", // 100k USDC maximum
    },
  },

  // UI settings
  UI: {
    TRANSACTION_TIMEOUT: 300000, // 5 minutes
    POLLING_INTERVAL: 2000, // 2 seconds
    MAX_RETRIES: 3,
  },

  // API endpoints (for demo purposes)
  API: {
    GAS_ORACLE:
      "https://api.etherscan.io/api?module=gastracker&action=gasoracle",
    PRICE_FEED:
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,near&vs_currencies=usd",
  },
};

// ABI for USDC contract (simplified)
export const USDC_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
];

// Error messages
export const ERRORS = {
  WALLET_NOT_CONNECTED: "Wallet not connected",
  INSUFFICIENT_BALANCE: "Insufficient balance",
  INVALID_ADDRESS: "Invalid address format",
  TRANSACTION_FAILED: "Transaction failed",
  NETWORK_ERROR: "Network error occurred",
  USER_REJECTED: "User rejected the transaction",
};

// Success messages
export const MESSAGES = {
  WALLET_CONNECTED: "Wallet connected successfully",
  TRANSACTION_SUBMITTED: "Transaction submitted successfully",
  TRANSACTION_CONFIRMED: "Transaction confirmed",
  CROSS_CHAIN_COMPLETE: "Cross-chain transfer completed",
};
