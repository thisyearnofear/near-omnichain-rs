#!/bin/bash

# Omni Transaction Demo Runner
echo "🚀 Starting Omni Transaction Demo..."
echo "=================================="

# Check if we're in the right directory
if [ ! -f "Cargo.toml" ]; then
    echo "❌ Error: Please run this script from the omni-transaction-rs root directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Navigate to frontend directory
cd frontend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: Frontend not found. Please ensure the frontend directory exists."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error: Failed to install dependencies"
        exit 1
    fi
fi

# Check if vite is available
if command -v npx &> /dev/null && npm list vite &> /dev/null; then
    echo "🔥 Starting Vite development server..."
    echo "   Frontend will be available at: http://localhost:3000"
    echo "   Press Ctrl+C to stop the server"
    echo ""
    npm run dev
else
    echo "🌐 Starting simple HTTP server..."
    echo "   Frontend will be available at: http://localhost:8080"
    echo "   Press Ctrl+C to stop the server"
    echo ""
    npm run serve
fi