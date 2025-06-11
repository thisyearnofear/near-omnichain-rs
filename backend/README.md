# NEAR Omnibridge Backend

Modern Chain Abstraction backend using NEAR's Omnibridge for secure, fast cross-chain transfers.

## 🌉 Architecture

This backend implements the **NEAR Omnibridge** - the modern, recommended approach for cross-chain transfers as endorsed by the NEAR team.

### Why Omnibridge over Rainbow Bridge?

- ⚡ **Faster**: Minutes instead of hours (no 4-hour challenge period)
- 💰 **Cheaper**: Lower gas costs using Chain Signatures vs light clients
- 🔒 **Secure**: MPC-based signatures with threshold cryptography
- 🌐 **Multi-chain**: Supports Bitcoin, Ethereum, Base, Arbitrum, Solana
- 🚀 **Modern**: Uses Chain Signatures instead of complex light client verification

## 🛠 Supported Chains

- **Ethereum** - Chain Signatures verification
- **Base** - Chain Signatures verification  
- **Bitcoin** - Chain Signatures verification
- **Arbitrum** - Transitioning to Chain Signatures
- **Solana** - Transitioning to Chain Signatures

## 📡 API Endpoints

### Modern Omnibridge (Recommended)

```bash
# Direct NEAR → Base transfer (fastest)
POST /api/bridge/near-to-base
{
  "amount": "10",
  "recipient": "0x...",
  "nearAccountId": "user.near",
  "nearSignature": "..."
}

# Any supported chain
POST /api/bridge/omnibridge
{
  "amount": "10",
  "destinationChain": "base", // ethereum, bitcoin, base, arbitrum, solana
  "recipient": "0x...",
  "nearAccountId": "user.near", 
  "nearSignature": "..."
}
```

### Legacy Endpoints (Compatibility)

```bash
# Legacy two-stage (NEAR → Ethereum → Base)
POST /api/bridge/two-stage-legacy

# Individual stages
POST /api/bridge/near-to-ethereum
POST /api/bridge/ethereum-to-base
```

### Status & Monitoring

```bash
# Bridge status
GET /api/bridge/status

# Transaction status
GET /api/transaction/:txHash
```

## 🔧 Environment Variables

```bash
# NEAR Configuration
NEAR_NETWORK=mainnet
NEAR_ACCOUNT_ID=your-account.near
NEAR_PRIVATE_KEY=your-private-key

# NEAR Omnibridge Configuration
OMNIBRIDGE_CONTRACT=omnibridge.near
OMNIBRIDGE_LOCKER=locker.omnibridge.near
OMNIBRIDGE_MPC=mpc.omnibridge.near

# Ethereum & Base Configuration
ETHEREUM_RPC_URL=https://eth.llamarpc.com
BASE_RPC_URL=https://mainnet.base.org
ETHEREUM_PRIVATE_KEY=0x...
BASE_PRIVATE_KEY=0x...

# Chainlink CCIP (for legacy two-stage)
CCIP_ROUTER_ADDRESS=0x80226fc0Ee2b096224EeAc085Bb9a8cba1146f7D
CCIP_LINK_TOKEN=0x514910771AF9Ca656af840dff83E8264EcF986CA
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start server
npm start
```

## 🔗 Resources

- [NEAR Omnibridge Documentation](https://docs.near.org/chain-abstraction/omnibridge/overview)
- [NEAR Intents Documentation](https://docs.near.org/tutorials/intents/introduction)
- [Bridge SDK JavaScript](https://github.com/Near-One/bridge-sdk-js)
- [Bridge SDK Rust](https://github.com/Near-One/bridge-sdk-rs)

## 🏗 Architecture Details

### Chain Signatures vs Light Clients

**Old Rainbow Bridge:**
- Required light client on each destination chain
- 4-8 hour confirmation times
- High gas costs for ED25519 verification
- Complex validator tracking

**New Omnibridge:**
- Uses MPC signatures (threshold cryptography)
- Minutes confirmation time
- Native signature verification (ECDSA)
- No validator tracking needed

### Security Model

- **MPC Network**: Decentralized signing without single points of failure
- **Threshold Signatures**: No single node can create valid signatures
- **Deterministic Addresses**: Cryptographic derivation ensures consistency
- **Audited Contracts**: Uses only audited NEAR infrastructure

## 📈 Performance Comparison

| Feature | Rainbow Bridge | Omnibridge |
|---------|---------------|------------|
| Transfer Time | 4-8 hours | 2-5 minutes |
| Gas Costs | High | Low |
| Supported Chains | Limited | Bitcoin, Ethereum, Base, Arbitrum, Solana |
| Verification | Light Client | Chain Signatures |
| Complexity | High | Low |

---

**Built with NEAR's Modern Chain Abstraction** 🌉
