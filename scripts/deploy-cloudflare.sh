#!/bin/bash

# SolarCRM Pro - Cloudflare Pages Deployment Script
# This script automates the deployment process to Cloudflare Pages

set -e

echo "🚀 SolarCRM Pro - Cloudflare Pages Deployment"
echo "=============================================="

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "📦 Installing Wrangler CLI..."
    npm install -g wrangler
fi

# Login to Cloudflare (if not already logged in)
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "Please login to Cloudflare:"
    wrangler login
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Deploy to Cloudflare Pages
echo "🚀 Deploying to Cloudflare Pages..."
wrangler pages deploy .next --project-name=solarcrm-pro

echo "✅ Deployment completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure environment variables in Cloudflare dashboard"
echo "2. Set up custom domain (optional)"
echo "3. Test the deployed application"
echo ""
echo "🔗 Cloudflare Dashboard: https://dash.cloudflare.com/pages"