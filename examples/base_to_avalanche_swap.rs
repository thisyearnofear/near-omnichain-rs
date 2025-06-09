// This example demonstrates a cross-chain swap from Base to Avalanche
// using the omni-transaction library

use omni_transaction::{
    evm::{types::Signature, utils::parse_eth_address},
    TransactionBuilder, TxBuilder,
    EVM,
};
use hex;

fn main() {
    println!("Base to Avalanche Cross-Chain Swap Example");
    println!("==========================================\n");

    // Step 1: Create a transaction on Base (Ethereum L2)
    println!("Step 1: Creating a transaction on Base (Ethereum L2)");
    
    // Base chain ID is 8453
    let base_chain_id: u64 = 8453;
    
    // Example contract address on Base for a swap
    let base_swap_contract = "4200000000000000000000000000000000000006"; // Example address
    let base_address = parse_eth_address(base_swap_contract);
    
    // Example function call data for a swap (this would be the encoded function call)
    // In a real scenario, this would be the encoded function call to the swap contract
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
    
    // Step 2: Create a transaction on Avalanche
    println!("\nStep 2: Creating a transaction on Avalanche");
    
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
    
    // Step 3: In a real scenario, you would sign these payloads with your private key
    println!("\nStep 3: Signing the transactions (using dummy signatures for this example)");
    
    // Dummy signatures for demonstration purposes
    let dummy_signature_base = Signature {
        r: [1u8; 32].to_vec(),
        s: [2u8; 32].to_vec(),
        v: 0,
    };
    
    let dummy_signature_avax = Signature {
        r: [3u8; 32].to_vec(),
        s: [4u8; 32].to_vec(),
        v: 0,
    };
    
    // Build the transactions with signatures
    let signed_base_tx = base_tx.build_with_signature(&dummy_signature_base);
    let signed_avax_tx = avax_tx.build_with_signature(&dummy_signature_avax);
    
    println!("  Signed Base transaction: {:?}", signed_base_tx);
    println!("  Signed Avalanche transaction: {:?}", signed_avax_tx);
    
    // Step 4: Cross-Chain Swap Process
    println!("\nStep 4: Cross-Chain Swap Process");
    println!("  In a real cross-chain swap scenario:");
    println!("  1. The Base transaction would be submitted to the Base network");
    println!("  2. A bridge or relayer would monitor for the transaction confirmation");
    println!("  3. Once confirmed, the Avalanche transaction would be submitted to complete the swap");
    println!("  4. This enables assets to move from Base to Avalanche (or vice versa)");
    
    println!("\nCross-Chain Swap Flow Complete!");
}
