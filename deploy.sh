#!/bin/bash

# PneuAI Deployment Script for Vercel
echo "🏥 PneuAI - Pneumonia Detection System Deployment"
echo "=================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build the project
echo "🔨 Building project for production..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "🚀 Deploying to Vercel..."
    
    # Deploy to Vercel
    vercel --prod
    
    echo "🎉 Deployment complete!"
    echo "📊 Your PneuAI system is now live on Vercel!"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
