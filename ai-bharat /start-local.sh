#!/bin/bash

echo "🚜 AI Krishi Mechanic - Local Development Startup"
echo "=================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if AWS CLI is configured
if ! command -v aws &> /dev/null; then
    echo "⚠️  AWS CLI not found. Make sure AWS credentials are configured."
else
    echo "✅ AWS CLI found"
    if aws sts get-caller-identity &> /dev/null; then
        echo "✅ AWS credentials configured"
    else
        echo "❌ AWS credentials not configured. Run 'aws configure' first."
        exit 1
    fi
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Install backend dependencies
if [ ! -d "local-server/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd local-server
    npm install
    cd ..
fi

# Install frontend dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo ""
echo "✅ Dependencies installed"
echo ""
echo "🚀 Starting servers..."
echo ""
echo "Backend will run on: http://localhost:3001"
echo "Frontend will run on: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start backend in background
cd local-server
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
