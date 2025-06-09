# Using NEAR Chain Signatures for Cross-Chain Transactions

This guide explains how to use the `omni-transaction-rs` library to create and sign transactions across different blockchains using NEAR signatures.

## Overview

The `omni-transaction-rs` library allows you to:
1. Build transactions for different blockchains (NEAR, Ethereum, Bitcoin)
2. Sign these transactions using NEAR keys
3. Use these signatures to authorize cross-chain transactions

## Prerequisites

- Rust and Cargo installed
- Basic understanding of blockchain transactions
- A NEAR account with keys

## Step 1: Building a NEAR Transaction

First, you need to create a NEAR transaction:

```rust
use omni_transaction::{
    near::{
        near_transaction_builder::NearTransactionBuilder,
        types::{
            actions::{Action, TransferAction},
            public_key::PublicKey,
        },
        utils::{public_key_utils::PublicKeyStrExt, signature_utils::SignatureStrExt},
    },
    transaction_builder::TransactionBuilder,
    transaction_builders::NEAR,
};
use near_sdk::json_types::{U128, U64};

// Create a NEAR transaction
let signer_id = "alice.near";
let signer_public_key = "ed25519:6E8sCci9badyRkXb3JoRpBj5p8C6Tw41ELDZoiihKEtp";
let nonce = U64(0);
let receiver_id = "bob.near";
let block_hash_str = "4reLvkAWfqk5fsqio1KLudk46cqRz9erQdaHkWZKMJDZ";
let transfer_action = Action::Transfer(TransferAction { deposit: U128(1) });
let actions = vec![transfer_action];

let near_tx = TransactionBuilder::new::<NEAR>()
    .signer_id(signer_id.to_string())
    .signer_public_key(signer_public_key.to_public_key().unwrap())
    .nonce(nonce)
    .receiver_id(receiver_id.to_string())
    .block_hash(block_hash_str.to_block_hash().unwrap())
    .actions(actions)
    .build();

// Get the transaction payload for signing
let near_tx_encoded = near_tx.build_for_signing();
```

## Step 2: Signing the Transaction

In a real-world scenario, you would sign this transaction using a NEAR private key:

```rust
// This would be done with a real NEAR private key
let signature = sign_with_near_private_key(near_tx_encoded);

// Build the transaction with the signature
let signed_tx = near_tx.build_with_signature(signature);
```

## Step 3: Using NEAR Signatures for Cross-Chain Transactions

### Ethereum Example

```rust
use omni_transaction::{
    evm::{
        evm_transaction_builder::EVMTransactionBuilder,
        types::Address,
    },
    transaction_builder::TransactionBuilder,
    transaction_builders::EVM,
};

// Create an Ethereum transaction
let to_address_str = "d8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
let to_address = parse_eth_address(to_address_str);
let max_gas_fee: u128 = 20_000_000_000;
let max_priority_fee_per_gas: u128 = 1_000_000_000;
let gas_limit: u128 = 21_000;
let chain_id: u64 = 1;
let nonce: u64 = 0;
let data: Vec<u8> = vec![];
let value: u128 = 10000000000000000; // 0.01 ETH

let evm_tx = TransactionBuilder::new::<EVM>()
    .nonce(nonce)
    .to(to_address)
    .value(value)
    .input(data.clone())
    .max_priority_fee_per_gas(max_priority_fee_per_gas)
    .max_fee_per_gas(max_gas_fee)
    .gas_limit(gas_limit)
    .chain_id(chain_id)
    .build();

// Get the transaction payload for signing
let evm_tx_encoded = evm_tx.build_for_signing();

// In a cross-chain scenario, you would use a NEAR signature to authorize this transaction
// This could be done through a bridge contract or a relayer
```

### Bitcoin Example

```rust
use omni_transaction::{
    bitcoin::{
        bitcoin_transaction_builder::BitcoinTransactionBuilder,
        types::{
            tx_in::{OutPoint, TxIn},
            tx_out::{Amount, TxOut},
            lock_time::LockTime,
            script_buf::ScriptBuf,
            version::Version,
        },
    },
    transaction_builder::TransactionBuilder,
    transaction_builders::BITCOIN,
};

// Create a Bitcoin transaction
let txid_str = "2ece6cd71fee90ff613cee8f30a52c3ecc58685acf9b817b9c467b7ff199871c";
let hash = Hash::from_hex(txid_str).unwrap();
let txid = Txid(hash);
let vout = 0;

let txin: TxIn = TxIn {
    previous_output: OutPoint::new(txid, vout as u32),
    script_sig: ScriptBuf::default(),
    sequence: Sequence::MAX,
    witness: Witness::default(),
};

let sender_script_pubkey_hex = "76a914cb8a3018cf279311b148cb8d13728bd8cbe95bda88ac";
let sender_script_pubkey = ScriptBuf::from_hex(sender_script_pubkey_hex).unwrap();

let receiver_script_pubkey_hex = "76a914406cf8a18b97a230d15ed82f0d251560a05bda0688ac";
let receiver_script_pubkey = ScriptBuf::from_hex(receiver_script_pubkey_hex).unwrap();

let spend_txout: TxOut = TxOut {
    value: Amount::from_sat(500_000_000),
    script_pubkey: receiver_script_pubkey,
};

let change_txout = TxOut {
    value: Amount::from_sat(100_000_000),
    script_pubkey: sender_script_pubkey,
};

let bitcoin_tx = TransactionBuilder::new::<BITCOIN>()
    .version(Version::One)
    .inputs(vec![txin])
    .outputs(vec![spend_txout, change_txout])
    .lock_time(LockTime::from_height(0).unwrap())
    .build();

// Get the transaction payload for signing
let bitcoin_tx_encoded = bitcoin_tx.build_for_signing_legacy(EcdsaSighashType::All);

// In a cross-chain scenario, you would use a NEAR signature to authorize this transaction
// This could be done through a bridge contract or a relayer
```

## How Cross-Chain Signatures Work

1. **Transaction Creation**: Create a transaction for the target chain (Ethereum, Bitcoin, etc.)
2. **Payload Generation**: Generate the transaction payload that needs to be signed
3. **NEAR Signature**: Sign this payload using a NEAR private key
4. **Verification**: The signature is verified on the target chain through a bridge contract or relayer
5. **Execution**: If the signature is valid, the transaction is executed on the target chain

## Advanced Usage: MPC Contracts

The library also supports Multi-Party Computation (MPC) contracts for more secure cross-chain transactions:

```rust
use omni_transaction::signer::types::{SignRequest, MPCContract};

// Create a sign request
let sign_request = SignRequest {
    // Transaction details
};

// Send the sign request to an MPC contract
let signature_response = mpc_contract.sign(sign_request);

// Use the signature to build and submit the transaction
```

## Conclusion

The `omni-transaction-rs` library provides a powerful way to create and sign transactions across different blockchains using NEAR signatures. This enables secure cross-chain operations without requiring users to manage multiple private keys for different chains.

For more detailed examples, refer to the integration tests in the repository.
