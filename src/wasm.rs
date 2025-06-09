//! WASM bindings for omni-transaction library
//! This module provides JavaScript-compatible functions for building and signing transactions

use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use crate::near::{NearTransaction, NearTransactionBuilder};
use crate::near::types::{Action, FunctionCallAction, U64, U128};
use crate::near::utils::{PublicKeyStrExt, BlockHashStrExt};
use crate::{TransactionBuilder, TxBuilder, NEAR};

// Enable console.log! macro for debugging
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

/// JavaScript-compatible transaction data structure
#[derive(Serialize, Deserialize)]
#[wasm_bindgen(getter_with_clone)]
pub struct JsTransactionData {
    pub signer_id: String,
    pub signer_public_key: String,
    pub nonce: u64,
    pub receiver_id: String,
    pub block_hash: String,
    pub method_name: String,
    pub args: String,
    pub gas: String,
    pub deposit: String,
}

/// JavaScript-compatible transaction result
#[derive(Serialize, Deserialize)]
#[wasm_bindgen(getter_with_clone)]
pub struct JsTransactionResult {
    pub transaction_bytes: Vec<u8>,
    pub transaction_hash: String,
    pub success: bool,
    pub error: Option<String>,
}

/// Initialize the WASM module
#[wasm_bindgen(start)]
pub fn init() {
    console_log!("Omni Transaction WASM module initialized");
}

/// Build a NEAR transaction for cross-chain authorization
#[wasm_bindgen]
pub fn build_near_transaction(data: &JsValue) -> Result<JsValue, JsValue> {
    console_log!("Building NEAR transaction from JS data");
    
    let tx_data: JsTransactionData = serde_wasm_bindgen::from_value(data.clone())
        .map_err(|e| JsValue::from_str(&format!("Failed to parse transaction data: {}", e)))?;

    // Parse the function call arguments
    let args_bytes = tx_data.args.as_bytes().to_vec();
    
    // Create function call action
    let function_call_action = Action::FunctionCall(Box::new(FunctionCallAction {
        method_name: tx_data.method_name,
        args: args_bytes,
        gas: U64(tx_data.gas.parse().map_err(|e| JsValue::from_str(&format!("Invalid gas: {}", e)))?),
        deposit: U128(tx_data.deposit.parse().map_err(|e| JsValue::from_str(&format!("Invalid deposit: {}", e)))?),
    }));

    // Build the NEAR transaction
    let near_tx = TransactionBuilder::new::<NEAR>()
        .signer_id(tx_data.signer_id)
        .signer_public_key(
            tx_data.signer_public_key.to_public_key()
                .map_err(|e| JsValue::from_str(&format!("Invalid public key: {}", e)))?
        )
        .nonce(tx_data.nonce)
        .receiver_id(tx_data.receiver_id)
        .block_hash(
            tx_data.block_hash.to_block_hash()
                .map_err(|e| JsValue::from_str(&format!("Invalid block hash: {}", e)))?
        )
        .actions(vec![function_call_action])
        .build();

    // Serialize the transaction for signing
    let transaction_bytes = near_tx.build_for_signing();
    
    // Create a simple hash for the transaction (in real implementation, use proper hashing)
    let transaction_hash = format!("{:x}", md5::compute(&transaction_bytes));

    let result = JsTransactionResult {
        transaction_bytes,
        transaction_hash,
        success: true,
        error: None,
    };

    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&format!("Failed to serialize result: {}", e)))
}

/// Build a NEAR transaction with signature
#[wasm_bindgen]
pub fn build_signed_near_transaction(data: &JsValue, signature: &str) -> Result<JsValue, JsValue> {
    console_log!("Building signed NEAR transaction");
    
    let tx_data: JsTransactionData = serde_wasm_bindgen::from_value(data.clone())
        .map_err(|e| JsValue::from_str(&format!("Failed to parse transaction data: {}", e)))?;

    // Parse the function call arguments
    let args_bytes = tx_data.args.as_bytes().to_vec();
    
    // Create function call action
    let function_call_action = Action::FunctionCall(Box::new(FunctionCallAction {
        method_name: tx_data.method_name,
        args: args_bytes,
        gas: U64(tx_data.gas.parse().map_err(|e| JsValue::from_str(&format!("Invalid gas: {}", e)))?),
        deposit: U128(tx_data.deposit.parse().map_err(|e| JsValue::from_str(&format!("Invalid deposit: {}", e)))?),
    }));

    // Build the NEAR transaction
    let near_tx = TransactionBuilder::new::<NEAR>()
        .signer_id(tx_data.signer_id)
        .signer_public_key(
            tx_data.signer_public_key.to_public_key()
                .map_err(|e| JsValue::from_str(&format!("Invalid public key: {}", e)))?
        )
        .nonce(tx_data.nonce)
        .receiver_id(tx_data.receiver_id)
        .block_hash(
            tx_data.block_hash.to_block_hash()
                .map_err(|e| JsValue::from_str(&format!("Invalid block hash: {}", e)))?
        )
        .actions(vec![function_call_action])
        .build();

    // Parse the signature
    use crate::near::utils::SignatureStrExt;
    let sig = signature.to_signature()
        .map_err(|e| JsValue::from_str(&format!("Invalid signature: {}", e)))?;

    // Build the signed transaction
    let signed_tx_bytes = near_tx.build_with_signature(sig);
    
    let transaction_hash = format!("{:x}", md5::compute(&signed_tx_bytes));

    let result = JsTransactionResult {
        transaction_bytes: signed_tx_bytes,
        transaction_hash,
        success: true,
        error: None,
    };

    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&format!("Failed to serialize result: {}", e)))
}

/// Validate a NEAR transaction format
#[wasm_bindgen]
pub fn validate_near_transaction(data: &JsValue) -> Result<bool, JsValue> {
    let tx_data: JsTransactionData = serde_wasm_bindgen::from_value(data.clone())
        .map_err(|_| JsValue::from_str("Invalid transaction data format"))?;

    // Basic validation
    if tx_data.signer_id.is_empty() || tx_data.receiver_id.is_empty() {
        return Ok(false);
    }

    // Validate public key format
    if tx_data.signer_public_key.to_public_key().is_err() {
        return Ok(false);
    }

    // Validate block hash format
    if tx_data.block_hash.to_block_hash().is_err() {
        return Ok(false);
    }

    // Validate gas and deposit are valid numbers
    if tx_data.gas.parse::<u64>().is_err() || tx_data.deposit.parse::<u128>().is_err() {
        return Ok(false);
    }

    Ok(true)
}

/// Get the current version of the library
#[wasm_bindgen]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
