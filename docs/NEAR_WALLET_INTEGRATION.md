# NEAR Wallet Integration - Real Mainnet Connection

## What Was Fixed

The original implementation was using a **simulated NEAR wallet** that connected to a demo testnet account (`demo.testnet`). I've completely rewritten the NEAR wallet integration to connect to **real NEAR wallets on mainnet**.

## Key Changes Made

### 1. Network Configuration Updated
- **Before**: `networkId: 'testnet'`
- **After**: `networkId: 'mainnet'`
- **URLs Updated**: All NEAR service URLs now point to mainnet
- **Explorer**: Now uses `https://nearblocks.io` (mainnet explorer)

### 2. Real NEAR Wallet Selector Integration
Created `src/modules/nearWallet.js` with:
- **NEAR Wallet Selector**: Uses `@near-wallet-selector/core`
- **Multiple Wallet Support**: MyNearWallet, HereWallet, etc.
- **Modal UI**: Professional wallet selection interface
- **Real Authentication**: Actual NEAR wallet sign-in process

### 3. Fallback System
Created `src/modules/nearWalletFallback.js` for:
- **Graceful Degradation**: Works even if Wallet Selector fails to load
- **URL-based Auth**: Handles NEAR wallet callback authentication
- **Redirect Flow**: Proper NEAR wallet redirect authentication

### 4. Updated Wallet Manager
Modified `src/modules/walletManager.js` to:
- **Remove Simulation**: No more fake wallet connections
- **Real Integration**: Uses the new NEAR wallet integration
- **Proper State Management**: Tracks real connection status

## How It Works Now

### Connection Flow
1. **Click "Connect NEAR"** → Opens NEAR Wallet Selector modal
2. **Choose Wallet** → Select from available NEAR wallets (MyNearWallet, HereWallet, etc.)
3. **Authenticate** → Redirects to your chosen NEAR wallet
4. **Grant Permissions** → Authorize the app to interact with your account
5. **Return to App** → Connected with your real NEAR account

### Fallback Flow (if Wallet Selector fails)
1. **Click "Connect NEAR"** → Direct redirect to NEAR wallet
2. **Authenticate** → Sign in with your NEAR account
3. **Return to App** → Connected via URL callback parameters

## Testing the Integration

### Option 1: Use the Main Demo
```bash
./run-demo.sh
```
Then click "Connect NEAR" and it will open the real wallet selector.

### Option 2: Use the Test Page
Open `frontend/test-near-connection.html` in your browser to test just the NEAR connection.

## What You'll See Now

### Before (Simulated)
- Connected to: `demo.testnet`
- No real wallet interaction
- Fake signatures

### After (Real Integration)
- **Your actual NEAR account** (e.g., `yourname.near`)
- **Real wallet authentication**
- **Actual transaction signing**
- **Mainnet network**

## Supported NEAR Wallets

The integration supports all major NEAR wallets:
- **MyNearWallet** (most common)
- **HereWallet** (mobile-friendly)
- **Meteor Wallet**
- **Nightly Wallet**
- **WalletConnect** (for mobile apps)

## Configuration

All NEAR settings are in `src/config/constants.js`:

```javascript
NEAR: {
    networkId: 'mainnet',           // Real mainnet
    nodeUrl: 'https://rpc.mainnet.near.org',
    walletUrl: 'https://app.mynearwallet.com/',
    helperUrl: 'https://helper.mainnet.near.org',
    explorerUrl: 'https://nearblocks.io',
}
```

## Security Features

- **Real Authentication**: Uses NEAR's official authentication flow
- **Permission Scoping**: Only requests necessary permissions
- **Secure Signing**: All transactions signed by your real NEAR wallet
- **No Private Keys**: Never handles or stores private keys

## Troubleshooting

### If Wallet Selector Doesn't Load
- The fallback system will automatically activate
- You'll be redirected directly to NEAR wallet
- Authentication still works via URL callbacks

### If Connection Fails
- Check browser console for detailed error messages
- Ensure you have a NEAR wallet account
- Try refreshing the page and connecting again

### For Development
- The integration works on both localhost and deployed sites
- NEAR wallets support development URLs
- No special configuration needed for testing

## Next Steps

The NEAR wallet integration is now **production-ready** and will:
1. **Connect to your real NEAR account**
2. **Work on NEAR mainnet**
3. **Support actual transaction signing**
4. **Provide a professional user experience**

You can now demonstrate real cross-chain functionality using your actual NEAR wallet! 🚀