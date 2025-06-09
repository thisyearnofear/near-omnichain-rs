// This example demonstrates how to use NEAR signatures to facilitate
// a cross-chain swap from Base to Avalanche

use omni_transaction::{
    evm::{types::Signature as EVMSignature, utils::parse_eth_address},
    near::{
        types::{Action, FunctionCallAction, U64, U128},
        utils::{PublicKeyStrExt, SignatureStrExt},
        NearTransactionBuilder,
    },
    TransactionBuilder, TxBuilder,
    EVM,
};
use hex;

fn main() {
    println!("NEAR-Signed Base to Avalanche Cross-Chain Swap Example");
    println!("=====================================================\n");

    // Step 1: Create a NEAR transaction to authorize the cross-chain swap
    println!("Step 1: Creating a NEAR transaction to authorize the cross-chain swap");
    
    // NEAR account details
    let signer_id = "alice.near";
    let signer_public_key = "ed25519:6E8sCci9badyRkXb3JoRpBj5p8C6Tw41ELDZoiihKEtp";
    let nonce = 0; // u64 nonce
    
    // The receiver would be a bridge contract on NEAR
    let bridge_contract_id = "bridge.near";
    
    // Block hash for the NEAR transaction
    let block_hash_str = "4reLvkAWfqk5fsqio1KLudk46cqRz9erQdaHkWZKMJDZ";
    
    // Create a function call action to the bridge contract
    // This would include the details of the cross-chain swap
    let function_call_action = Action::FunctionCall(Box::new(FunctionCallAction {
        method_name: "initiate_cross_chain_swap".to_string(),
        args: serde_json::to_vec(&serde_json::json!({
            "source_chain": "base",
            "target_chain": "avalanche",
            "token_address": "0x4200000000000000000000000000000000000006",
            "amount": "1000000000000000000", // 1 token with 18 decimals
            "recipient": "0x60aE616a2155Ee3d9A68541Ba4544862310933d4"
        })).unwrap(),
        gas: U64(30000000000000), // 30 TGas
        deposit: U128(0), // No deposit needed
    }));
    
    // Create the NEAR transaction
    let near_tx = NearTransactionBuilder::new()
        .signer_id(signer_id.to_string())
        .signer_public_key(signer_public_key.to_public_key().unwrap())
        .nonce(nonce)
        .receiver_id(bridge_contract_id.to_string())
        .block_hash(block_hash_str.to_block_hash().unwrap())
        .actions(vec![function_call_action])
        .build();
    
    // Get the transaction payload for signing
    let near_tx_encoded = near_tx.build_for_signing();
    println!("  NEAR transaction payload for signing: {:?}", near_tx_encoded);
    
    // Step 2: Sign the NEAR transaction
    println!("\nStep 2: Signing the NEAR transaction (using a dummy signature for this example)");
    
    // In a real scenario, you would sign this with a NEAR private key
    let dummy_near_signature = "ed25519:3s1dvZdQtcAjBksMHFrysqvF63wnyMHPA4owNQmCJZ2EBakZEKdtMsLqrHdKWQjJbSRN5jz8HzPxuST5mNTGj6Y3";
    
    // Build the NEAR transaction with the signature
    let signed_near_tx = near_tx.build_with_signature(dummy_near_signature.to_signature().unwrap());
    println!("  Signed NEAR transaction: {:?}", signed_near_tx);
    
    // Step 3: Create the Base transaction
    println!("\nStep 3: Creating the Base transaction");
    
    // Base chain ID is 8453
    let base_chain_id: u64 = 8453;
    
    // Example contract address on Base for a swap
    let base_swap_contract = "4200000000000000000000000000000000000006"; // Example address
    let base_address = parse_eth_address(base_swap_contract);
    
    // Example function call data for a swap
    let swap_function_data = hex::decode("0x38ed1739000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2").unwrap_or_default();
    
    // Create the Base transaction
    let base_tx = TransactionBuilder::new::<EVM>()
        .chain_id(base_chain_id)
        .nonce(0) // Replace with actual nonce
        .to(base_address)
        .value(0) // No ETH being sent, just a contract call
        .gas_limit(300000) // Adjust gas limit as needed
        .max_fee_per_gas(2000000000) // 2 Gwei
        .max_priority_fee_per_gas(1000000000) // 1 Gwei
        .input(swap_function_data)
        .build();
    
    // Get the transaction payload for signing
    let base_tx_encoded = base_tx.build_for_signing();
    println!("  Base transaction payload for signing: {:?}", base_tx_encoded);
    
    // Step 4: Create the Avalanche transaction
    println!("\nStep 4: Creating the Avalanche transaction");
    
    // Avalanche C-Chain ID is 43114
    let avalanche_chain_id: u64 = 43114;
    
    // Example contract address on Avalanche for receiving the swap
    let avax_swap_contract = "60aE616a2155Ee3d9A68541Ba4544862310933d4"; // Example address
    let avax_address = parse_eth_address(avax_swap_contract);
    
    // Example function call data for completing the swap on Avalanche
    let avax_function_data = hex::decode("0x38ed1739000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2").unwrap_or_default();
    
    // Create the Avalanche transaction
    let avax_tx = TransactionBuilder::new::<EVM>()
        .chain_id(avalanche_chain_id)
        .nonce(0) // Replace with actual nonce
        .to(avax_address)
        .value(0) // No AVAX being sent, just a contract call
        .gas_limit(300000) // Adjust gas limit as needed
        .max_fee_per_gas(30000000000) // 30 Gwei (Avalanche typically has higher gas prices)
        .max_priority_fee_per_gas(2000000000) // 2 Gwei
        .input(avax_function_data)
        .build();
    
    // Get the transaction payload for signing
    let avax_tx_encoded = avax_tx.build_for_signing();
    println!("  Avalanche transaction payload for signing: {:?}", avax_tx_encoded);
    
    // Step 5: Using the NEAR signature to authorize the cross-chain transactions
    println!("\nStep 5: Using the NEAR signature to authorize cross-chain transactions");
    println!("  In a real cross-chain scenario with NEAR signatures:");
    println!("  1. The NEAR transaction would be submitted to the NEAR network");
    println!("  2. The bridge contract on NEAR would verify the transaction and extract the signature");
    println!("  3. This signature would be used to derive signatures for the Base and Avalanche transactions");
    println!("  4. The derived signatures would be used to execute the transactions on Base and Avalanche");
    
    // For demonstration purposes, we'll create dummy signatures for the EVM chains
    let dummy_base_signature = EVMSignature {
        r: [1u8; 32].to_vec(),
        s: [2u8; 32].to_vec(),
        v: 0,
    };
    
    let dummy_avax_signature = EVMSignature {
        r: [3u8; 32].to_vec(),
        s: [4u8; 32].to_vec(),
        v: 0,
    };
    
    // Build the transactions with signatures
    let signed_base_tx = base_tx.build_with_signature(&dummy_base_signature);
    let signed_avax_tx = avax_tx.build_with_signature(&dummy_avax_signature);
    
    println!("  Signed Base transaction: {:?}", signed_base_tx);
    println!("  Signed Avalanche transaction: {:?}", signed_avax_tx);
    
    // Step 6: Cross-Chain Swap Process
    println!("\nStep 6: Cross-Chain Swap Process");
    println!("  Complete cross-chain swap flow:");
    println!("  1. User initiates the swap by signing a NEAR transaction");
    println!("  2. The NEAR transaction is submitted to the NEAR network");
    println!("  3. The bridge contract on NEAR verifies the transaction");
    println!("  4. The bridge contract derives signatures for Base and Avalanche");
    println!("  5. The Base transaction is submitted to the Base network");
    println!("  6. Once confirmed, the Avalanche transaction is submitted to complete the swap");
    println!("  7. Assets are successfully moved from Base to Avalanche");
    
    println!("\nNEAR-Signed Cross-Chain Swap Flow Complete!");
}
