// This example demonstrates how to use NEAR signatures for cross-chain transactions
// Note: This is a simplified example and doesn't include actual signature verification

// Import the public API
use omni_transaction::{
    near::{
        types::{Action, TransferAction, U128, U64},
        utils::{PublicKeyStrExt, SignatureStrExt},
    },
    evm::utils::parse_eth_address,
    TransactionBuilder, TxBuilder,
    NEAR, EVM,
};

fn main() {
    println!("Cross-Chain Transaction Example using NEAR Signatures");
    println!("====================================================\n");

    // Step 1: Create a NEAR transaction
    println!("Step 1: Creating a NEAR transaction");
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
        .nonce(nonce.0)
        .receiver_id(receiver_id.to_string())
        .block_hash(block_hash_str.to_block_hash().unwrap())
        .actions(actions)
        .build();

    // Step 2: Get the transaction payload for signing
    println!("Step 2: Getting the transaction payload for signing");
    let near_tx_encoded = near_tx.build_for_signing();
    println!("  NEAR transaction payload: {:?}", near_tx_encoded);

    // Step 3: In a real scenario, you would sign this payload with a NEAR private key
    println!("Step 3: Signing the transaction (using a dummy signature for this example)");
    let dummy_signature = "ed25519:3s1dvZdQtcAjBksMHFrysqvF63wnyMHPA4owNQmCJZ2EBakZEKdtMsLqrHdKWQjJbSRN5jz8HzPxuST5mNTGj6Y3";
    println!("  Signature: {}", dummy_signature);

    // Step 4: Build the transaction with the signature
    println!("Step 4: Building the transaction with the signature");
    let signed_tx = near_tx.build_with_signature(dummy_signature.to_signature().unwrap());
    println!("  Signed NEAR transaction: {:?}", signed_tx);

    // Step 5: Create an Ethereum transaction
    println!("\nStep 5: Creating an Ethereum transaction");
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

    // Step 6: Get the Ethereum transaction payload for signing
    println!("Step 6: Getting the Ethereum transaction payload for signing");
    let evm_tx_encoded = evm_tx.build_for_signing();
    println!("  Ethereum transaction payload: {:?}", evm_tx_encoded);

    // Step 7: In a cross-chain scenario, you would use the NEAR signature to authorize this transaction
    println!("\nStep 7: Cross-Chain Authorization");
    println!("  In a real cross-chain scenario:");
    println!("  1. The NEAR signature would be verified by a bridge contract or relayer");
    println!("  2. If valid, the Ethereum transaction would be executed on the Ethereum chain");
    println!("  3. This allows using NEAR keys to authorize transactions on other chains");

    println!("\nCross-Chain Transaction Flow Complete!");
}
