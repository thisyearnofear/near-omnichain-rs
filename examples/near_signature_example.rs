use omni_transaction::{
    near::{
        types::{Action, TransferAction, U128, U64},
        utils::{PublicKeyStrExt, SignatureStrExt},
    },
    TransactionBuilder, TxBuilder,
    NEAR,
};

fn main() {
    // Step 1: Create a NEAR transaction
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
    let near_tx_encoded = near_tx.build_for_signing();
    println!("Transaction payload for signing: {:?}", near_tx_encoded);

    // Step 3: In a real scenario, you would sign this payload with a NEAR private key
    // For this example, we'll use a dummy signature
    let dummy_signature = "ed25519:3s1dvZdQtcAjBksMHFrysqvF63wnyMHPA4owNQmCJZ2EBakZEKdtMsLqrHdKWQjJbSRN5jz8HzPxuST5mNTGj6Y3";

    // Step 4: Build the transaction with the signature
    let signed_tx = near_tx.build_with_signature(dummy_signature.to_signature().unwrap());
    println!("Signed transaction: {:?}", signed_tx);

    // Step 5: In a real scenario, you would broadcast this transaction to the NEAR network
    println!("\nIn a real scenario, you would:");
    println!("1. Generate a proper signature using a NEAR private key");
    println!("2. Broadcast the signed transaction to the NEAR network");
    println!("3. Use this signature to authorize cross-chain transactions");
}
