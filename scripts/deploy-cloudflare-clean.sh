#!/bin/bash

# Cloudflare Pages Deployment Script with Cache Cleanup
# This script builds the project and cleans up large cache files before deployment

set -e

echo "🚀 Starting Cloudflare Pages deployment..."

# Set environment variable for Cloudflare build
export CF_PAGES=1

# Clean any existing build artifacts
echo "🧹 Cleaning existing build artifacts..."
rm -rf .next
rm -rf out
rm -rf dist

# Build the project
echo "🔨 Building project for Cloudflare Pages..."
npm run build

# Clean up cache files that exceed Cloudflare's size limits
echo "🗑️  Cleaning up cache files..."
rm -rf .next/cache
find .next -name "*.pack" -size +20M -delete 2>/dev/null || true
find .next -name "cache" -type d -exec rm -rf {} + 2>/dev/null || true

# Show build size information
echo "📊 Build size information:"
du -sh .next 2>/dev/null || echo "Build directory size calculation failed"

# List large files that might cause issues
echo "🔍 Checking for large files (>20MB)..."
find .next -size +20M -type f 2>/dev/null || echo "No large files found"

echo "✅ Build completed and optimized for Cloudflare Pages!"
echo "📁 Build output directory: .next"
echo ""
echo "Next steps:"
echo "1. Commit and push changes to trigger automatic deployment"
echo "2. Or use: wrangler pages deploy .next"
echo "3. Set environment variables in Cloudflare Pages dashboard"