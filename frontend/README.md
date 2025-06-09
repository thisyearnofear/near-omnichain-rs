# Omni Transaction Frontend Demo

A modern web interface demonstrating cross-chain USDC settlement using NEAR signatures on Base network.

## Features

- 🔗 **Cross-Chain Transactions**: Transfer USDC from NEAR to Base using NEAR signatures
- 🎨 **Modern UI**: Clean, responsive interface with real-time transaction tracking
- 🔐 **Wallet Integration**: Connect NEAR and MetaMask wallets
- 📊 **Transaction Monitoring**: Real-time status updates and transaction logs
- 🌉 **Bridge Simulation**: Demonstrates the cross-chain bridge protocol

## Architecture

The frontend follows a modular, DRY approach with clear separation of concerns:

```
src/
├── config/
│   └── constants.js      # Configuration and constants
├── modules/
│   ├── eventEmitter.js   # Event system for inter-module communication
│   ├── logger.js         # Centralized logging system
│   ├── uiManager.js      # UI state management
│   ├── walletManager.js  # Wallet connection and management
│   └── transactionManager.js # Cross-chain transaction logic
├── styles/
│   └── main.css          # Responsive CSS styles
└── main.js               # Application entry point
```

## Quick Start

### Option 1: Using Vite (Recommended)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Option 2: Simple HTTP Server

```bash
# Serve static files
npm run serve
```

The application will be available at:
- Vite dev server: http://localhost:3000
- HTTP server: http://localhost:8080

## How It Works

### 1. Wallet Connection
- Connect your NEAR wallet (testnet)
- Connect MetaMask and switch to Base Sepolia network

### 2. Cross-Chain Transfer
1. **NEAR Authorization**: Sign a transaction on NEAR to authorize the transfer
2. **Bridge Processing**: The signature is verified and processed by the bridge
3. **Base Settlement**: USDC is transferred on Base network using the derived signature

### 3. Transaction Flow
```
NEAR Wallet → Sign Auth Tx → Bridge Contract → Base Network → USDC Transfer
```

## Demo Features

- **Simulated Transactions**: For demo purposes, transactions are simulated
- **Real-time Logging**: Watch the cross-chain process in real-time
- **Gas Estimation**: See estimated transaction costs
- **Transaction Tracking**: Monitor both NEAR and Base transactions

## Network Configuration

### NEAR Testnet
- Network: `testnet`
- RPC: `https://rpc.testnet.near.org`
- Explorer: `https://testnet.nearblocks.io`

### Base Sepolia
- Chain ID: `84532`
- RPC: `https://sepolia.base.org`
- Explorer: `https://sepolia-explorer.base.org`

## Integration with Rust Library

The frontend is designed to integrate with the `omni-transaction` Rust library:

1. **WASM Compilation**: The Rust library can be compiled to WebAssembly
2. **Transaction Building**: Use Rust functions to build transactions
3. **Signature Handling**: Process NEAR signatures for cross-chain authorization

## Development

### Adding New Chains

1. Update `CONFIG.NETWORKS` in `constants.js`
2. Add wallet connection logic in `walletManager.js`
3. Implement transaction building in `transactionManager.js`
4. Update UI components in `uiManager.js`

### Customizing UI

- Modify `main.css` for styling changes
- Update `index.html` for layout changes
- Extend `uiManager.js` for new UI components

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the `dist/` folder to your web server

3. Configure environment variables for production networks

## Security Considerations

- Always validate user inputs
- Use secure RPC endpoints
- Implement proper error handling
- Never expose private keys in frontend code
- Use HTTPS in production

## Contributing

1. Follow the modular architecture
2. Add proper error handling
3. Include logging for debugging
4. Write clear, documented code
5. Test across different browsers and devices