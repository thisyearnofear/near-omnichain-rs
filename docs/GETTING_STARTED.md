# Getting Started with NEAR Omnichain Bridge

This guide will help you set up and start using the NEAR Omnichain Bridge application for transferring USDC from NEAR to Base via Ethereum.

## Prerequisites

- Node.js 18+
- A NEAR wallet (MyNearWallet recommended)
- An EVM wallet (MetaMask, Coinbase, etc.)
- Basic understanding of cross-chain bridges

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/thisyearnofear/near-omnichain-rs
   cd near-omnichain-rs
   ```

2. Install dependencies:

   ```bash
   # Frontend dependencies
   cd frontend
   npm install

   # Backend dependencies
   cd ../backend
   npm install
   ```

3. Start the application:

   ```bash
   # Start backend (in one terminal)
   cd backend
   npm start

   # Start frontend (in another terminal)
   cd frontend
   npm run dev
   ```

## Project Structure

- `frontend/` - Modern JavaScript frontend application
  - `src/modules/` - Core application modules (wallet management, UI, etc.)
  - `src/config/` - Configuration and network constants
  - `src/styles/` - CSS styling
- `backend/` - Node.js API server
  - `services/` - Bridge logic and API services
- `docs/` - Documentation

## Using the Application

### 1. Access the Bridge

Open http://localhost:3000 in your browser after starting the development servers.

### 2. Connect Wallets

**NEAR Wallet:**

- Click "Connect" under NEAR Protocol
- Choose MyNearWallet (recommended)
- Approve the connection in your wallet

**EVM Wallet:**

- Click "Connect Wallet" under Base Network
- Choose from detected wallets:
  - 🦊 MetaMask (Browser extension)
  - 🔵 Coinbase Wallet (Browser extension)
  - 🦁 Brave Wallet (Built-in browser)
  - 🔗 WalletConnect (Mobile wallets via QR)
  - 🌈 Rainbow (Mobile via WalletConnect)
  - 🛡️ Trust Wallet (Mobile via WalletConnect)

### 3. Bridge USDC

1. **Enter Amount**: Specify USDC amount to bridge from NEAR to Base
2. **Review Details**: Check transaction details, fees, and estimated time
3. **Stage 1**: NEAR → Ethereum (via Rainbow Bridge)
   - Sign transaction in NEAR wallet
   - Wait for confirmation on Ethereum
4. **Stage 2**: Ethereum → Base (via Chainlink CCIP)
   - Automatic or manual trigger
   - Wait for final confirmation
5. **Complete**: Receive USDC on Base network

## Supported Networks

- **NEAR Protocol**: Mainnet
- **Ethereum**: Mainnet (bridging layer)
- **Base**: Mainnet (destination)

## Bridge Infrastructure

- **Rainbow Bridge**: Official NEAR ↔ Ethereum bridge
- **Chainlink CCIP**: Ethereum ↔ Base cross-chain protocol
- **USDC Contracts**: Native USDC on all supported networks

## Testing

### Test Pages

- `near-connection-test.html` - Test NEAR wallet connections
- `multi-wallet-test.html` - Test EVM wallet connections

### Running Tests

```bash
# Start development server
cd frontend && npm run dev

# Open test pages
open http://localhost:3000/near-connection-test.html
open http://localhost:3000/multi-wallet-test.html
```

## Troubleshooting

### Common Issues

**NEAR Wallet Not Connecting:**

- Clear browser cache and localStorage
- Try a different NEAR wallet (MyNearWallet, NEAR Wallet)
- Check browser console for errors

**EVM Wallet Not Detected:**

- Install a supported wallet extension
- Refresh the page after installation
- Try WalletConnect for mobile wallets

**Transaction Failures:**

- Ensure sufficient balance for gas fees
- Check network connectivity
- Verify wallet is on correct network
