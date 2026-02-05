#!/bin/bash

# Deployment Script for ISOTEC Photovoltaic Contract System
# February 4, 2026

echo "🚀 Starting deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Build the project to check for errors
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

# Commit and push changes
echo "📝 Committing changes..."
git add -A
git commit -m "Fix admin contracts page and prepare for deployment - $(date '+%Y-%m-%d %H:%M:%S')"

echo "📤 Pushing to GitHub..."
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ Git push failed. Please check your git configuration."
    exit 1
fi

echo "✅ Code pushed to GitHub successfully!"

echo ""
echo "🎯 Next Steps:"
echo "1. Go to Vercel Dashboard: https://vercel.com/dashboard"
echo "2. Navigate to your project settings"
echo "3. Go to Environment Variables"
echo "4. Ensure these variables are set:"
echo ""
echo "   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCYQ1hJeHKqWUosvULfsWx6E3xzPfVBFQw"
echo "   NEXT_PUBLIC_SUPABASE_URL=https://kjgonoakapxleryjdhxb.supabase.co"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqZ29ub2FrYXB4bGVyeWpkaHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjYyNzEsImV4cCI6MjA4NTgwMjI3MX0.21Ya1JlkVi_v1mQ4puMdukauqc4QcX59VqtnqWfELp8"
echo "   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqZ29ub2FrYXB4bGVyeWpkaHhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIyNjI3MSwiZXhwIjoyMDg1ODAyMjcxfQ.Om0iqnkY-bdoPXV5__AgqhJWqASmnUCeGJhAVXmDvXk"
echo "   SMTP_HOST=mail.clubemkt.digital"
echo "   SMTP_PORT=587"
echo "   SMTP_SECURE=false"
echo "   SMTP_USER=nao-responda@clubemkt.digital"
echo "   SMTP_PASS=Advance1773"
echo "   SMTP_FROM=nao-responda@clubemkt.digital"
echo "   SMTP_FROM_NAME=ISOTEC"
echo "   NEXT_PUBLIC_APP_URL=https://contratofacil.clubemkt.digital"
echo ""
echo "5. Redeploy the application"
echo "6. Test the following:"
echo "   - Visit /test-maps to verify Google Maps API key"
echo "   - Test wizard flow end-to-end"
echo "   - Test admin panel at /admin"
echo "   - Test contract signature process"
echo ""
echo "🎉 Deployment preparation complete!"