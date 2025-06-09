# Getting Started with omni-transaction-rs

This guide will help you set up and start using the `omni-transaction-rs` library to work with NEAR chain signatures for cross-chain transactions.

## Prerequisites

- Rust and Cargo installed (stable channel)
- `wasm32-unknown-unknown` target added to your Rust toolchain
- Basic understanding of blockchain transactions

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/near/omni-transaction-rs.git
   cd omni-transaction-rs
   ```

2. Build the project:
   ```bash
   cargo build
   ```

3. (Optional) Run the tests:
   ```bash
   cargo test
   ```

## Project Structure

- `src/near/` - NEAR blockchain transaction building and signing
- `src/evm/` - Ethereum Virtual Machine transaction building
- `src/bitcoin/` - Bitcoin transaction building
- `src/signer/` - Signature utilities and MPC contract integration
- `examples/` - Example code for using the library

## Using the Library

### 1. Add as a Dependency

Add the library to your project's `Cargo.toml`:

```toml
[dependencies]
omni-transaction = "0.2.1"
```

### 2. Building Transactions

The library provides a unified interface for building transactions across different chains:

```rust
use omni_transaction::{
    transaction_builder::TransactionBuilder,
    transaction_builders::NEAR, // or EVM, BITCOIN
};

// Create a transaction builder for the desired chain
let tx_builder = TransactionBuilder::new::<NEAR>();

// Configure the transaction with chain-specific parameters
// ...

// Build the transaction
let transaction = tx_builder.build();
```

### 3. Signing Transactions

Once you have built a transaction, you can get the payload for signing:

```rust
// Get the transaction payload for signing
let payload = transaction.build_for_signing();

// Sign the payload with a NEAR private key (not included in this library)
let signature = sign_with_near_private_key(payload);

// Build the transaction with the signature
let signed_tx = transaction.build_with_signature(signature);
```

### 4. Cross-Chain Transactions

For cross-chain transactions, you typically:

1. Build a transaction for the target chain
2. Sign it with a NEAR key
3. Submit the transaction and signature to a bridge contract or relayer
4. The bridge/relayer verifies the signature and executes the transaction on the target chain

## Examples

Check out the examples directory for complete examples:

- `examples/near_signature_example.rs` - Basic NEAR transaction signing
- `examples/cross_chain_example.rs` - Cross-chain transaction example

Run an example with:

```bash
cargo run --example cross_chain_example
```

## Learning Resources

- Read the `NEAR_SIGNATURES_GUIDE.md` file for a detailed explanation of using NEAR signatures for cross-chain transactions
- Check the integration tests in the `tests/` directory for real-world usage examples
- Join the [Chain Abstraction Telegram group](https://t.me/chain_abstraction) for community support

## Next Steps

- Explore the [examples repository](https://github.com/Omni-rs/examples.git) for more advanced examples
- Learn about NEAR's [cross-chain bridge infrastructure](https://near.org/bridge)
- Experiment with building your own cross-chain applications using this library
