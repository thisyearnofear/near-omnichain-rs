# NEAR Omnichain Bridge

A modern, clean bridge application for transferring USDC from NEAR to Base via Ethereum using audited infrastructure.

## 🌉 Overview

This application provides a **two-stage bridging approach** for moving USDC from NEAR Protocol to Base network:

1. **Stage 1**: NEAR → Ethereum (via Rainbow Bridge)
2. **Stage 2**: Ethereum → Base (via Chainlink CCIP)

### ✨ Key Features

- 🔗 **Multi-Wallet Support** - MetaMask, Coinbase, Brave, WalletConnect, Rainbow, Trust Wallet
- 📱 **Mobile-First** - WalletConnect integration for mobile wallet connections
- 🛡️ **Audited Infrastructure** - Uses only battle-tested bridge contracts
- 🎨 **Clean UI** - Modern, responsive design with real-time status updates
- ⚡ **API-First** - Pure JavaScript architecture, no dependencies on WASM
- 🔐 **Secure** - Non-custodial, user maintains control throughout

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- A NEAR wallet (MyNearWallet recommended)
- An EVM wallet (MetaMask, Coinbase, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/thisyearnofear/near-omnichain-rs
cd near-omnichain-rs

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies  
cd ../backend
npm install
```

### Running the Application

```bash
# Start the backend API server
cd backend
npm start

# In another terminal, start the frontend
cd frontend  
npm run dev
```

Open http://localhost:3000 to use the bridge.

## 🏗️ Architecture

### Frontend (Pure JavaScript)
- **Modern ES6 Modules** - Clean, modular architecture
- **Multi-Wallet Manager** - Supports all major EVM wallets
- **NEAR Wallet Integration** - Direct integration with MyNearWallet
- **Responsive UI** - Works on desktop and mobile

### Backend (Node.js API)
- **Bridge Logic** - Handles cross-chain transaction coordination
- **Status Tracking** - Real-time transaction monitoring
- **Error Handling** - Comprehensive error management

### Supported Wallets

**EVM Wallets:**
- 🦊 MetaMask (Browser extension)
- 🔵 Coinbase Wallet (Browser extension)
- 🦁 Brave Wallet (Built-in browser)
- 🔗 WalletConnect (Mobile wallets via QR)
- 🌈 Rainbow (Mobile via WalletConnect)
- 🛡️ Trust Wallet (Mobile via WalletConnect)

**NEAR Wallets:**
- MyNearWallet (Recommended)
- NEAR Wallet
- Meteor Wallet

## 🔧 Development

### Project Structure

```
├── frontend/           # React-free frontend application
│   ├── src/
│   │   ├── modules/    # Core application modules
│   │   ├── config/     # Configuration and constants
│   │   └── styles/     # CSS styling
│   └── index.html      # Main application entry
├── backend/            # Node.js API server
│   ├── services/       # Bridge and API services
│   └── server.js       # Express server
└── docs/              # Documentation
```

### Key Modules

- **WalletManager** - Handles all wallet connections
- **MultiWalletManager** - EVM wallet detection and connection
- **SimpleNearWallet** - NEAR wallet integration
- **ModernUIManager** - UI state management
- **Logger** - Centralized logging system

## 🌐 Networks

### Mainnet Configuration
- **NEAR**: Mainnet (`mainnet`)
- **Base**: Mainnet (Chain ID: 8453)
- **Ethereum**: Mainnet (for bridging)

### Bridge Infrastructure
- **Rainbow Bridge**: NEAR ↔ Ethereum
- **Chainlink CCIP**: Ethereum ↔ Base
- **USDC Contracts**: Native USDC on all networks

## 🔐 Security

- **Non-custodial**: Users maintain control of their funds
- **Audited contracts**: Only uses battle-tested bridge infrastructure
- **No private keys**: Application never handles private keys
- **Client-side signing**: All transactions signed in user's wallet

## 📱 Mobile Support

The application fully supports mobile wallets through WalletConnect:

1. **Desktop**: Click WalletConnect option
2. **Mobile**: Scan QR code with mobile wallet
3. **Connection**: Approve connection in mobile wallet
4. **Transactions**: Sign transactions on mobile device

## 🧪 Testing

### Test Pages
- `near-connection-test.html` - NEAR wallet connection testing
- `multi-wallet-test.html` - EVM wallet testing

### Running Tests
```bash
# Start development server
cd frontend && npm run dev

# Open test pages
open http://localhost:3000/near-connection-test.html
open http://localhost:3000/multi-wallet-test.html
```

## 🚀 Deployment

### Frontend
```bash
cd frontend
npm run build
# Deploy dist/ folder to your hosting provider
```

### Backend
```bash
cd backend
npm start
# Deploy to your Node.js hosting provider
```

## 📚 Documentation

- [Getting Started](docs/GETTING_STARTED.md)
- [Implementation Guide](docs/IMPLEMENTATION_GUIDE.md)
- [Project Overview](docs/PROJECT_OVERVIEW.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

Apache-2.0 License - see [LICENSE](LICENSE-APACHE) for details.

## 🔗 Links

- [NEAR Protocol](https://near.org)
- [Base Network](https://base.org)
- [Rainbow Bridge](https://rainbowbridge.app)
- [Chainlink CCIP](https://chain.link/cross-chain)
