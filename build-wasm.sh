#!/bin/bash

# Build script for compiling Rust library to WebAssembly

set -e

echo "🔧 Building omni-transaction library for WebAssembly..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack is not installed. Installing..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf pkg/
rm -rf frontend/src/wasm/

# Build the WASM package
echo "🏗️  Building WASM package..."
wasm-pack build --target web --features wasm --out-dir pkg

# Create the wasm directory in frontend
echo "📁 Creating frontend WASM directory..."
mkdir -p frontend/src/wasm

# Copy the generated files to frontend
echo "📋 Copying WASM files to frontend..."
cp pkg/omni_transaction.js frontend/src/wasm/
cp pkg/omni_transaction_bg.wasm frontend/src/wasm/
cp pkg/omni_transaction.d.ts frontend/src/wasm/

# Create a simple wrapper for easier imports
echo "📝 Creating WASM wrapper..."
cat > frontend/src/wasm/index.js << 'EOF'
// WASM wrapper for omni-transaction library
import init, { 
    build_near_transaction, 
    build_signed_near_transaction, 
    validate_near_transaction,
    get_version 
} from './omni_transaction.js';

let wasmInitialized = false;

export async function initWasm() {
    if (!wasmInitialized) {
        await init();
        wasmInitialized = true;
        console.log('🚀 Omni Transaction WASM module loaded successfully');
    }
}

export {
    build_near_transaction,
    build_signed_near_transaction,
    validate_near_transaction,
    get_version
};

// Auto-initialize when imported
initWasm().catch(console.error);
EOF

echo "✅ WASM build complete!"
echo "📦 Files generated:"
echo "   - frontend/src/wasm/omni_transaction.js"
echo "   - frontend/src/wasm/omni_transaction_bg.wasm"
echo "   - frontend/src/wasm/omni_transaction.d.ts"
echo "   - frontend/src/wasm/index.js"
echo ""
echo "🎯 Next steps:"
echo "   1. Import the WASM module in your frontend code"
echo "   2. Use build_near_transaction() to create transactions"
echo "   3. Test with real NEAR wallet integration"
