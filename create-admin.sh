#!/bin/bash

# SolarCRM Pro - Admin User Creation Script
# Creates a super admin user via CLI

echo "🔧 SolarCRM Pro - Admin User Creation"
echo "═══════════════════════════════════════════════════"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo "Please create .env.local with your Supabase credentials:"
    echo ""
    echo "NEXT_PUBLIC_SUPABASE_URL=your-supabase-url"
    echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    echo ""
    exit 1
fi

# Default values
DEFAULT_EMAIL="admin@solarcrm.pro"
DEFAULT_PASSWORD="SolarCRM2024!"
DEFAULT_NAME="SolarCRM Pro Admin"

# Get user input or use defaults
echo "Enter admin details (press Enter for defaults):"
echo ""

read -p "📧 Email [$DEFAULT_EMAIL]: " EMAIL
EMAIL=${EMAIL:-$DEFAULT_EMAIL}

read -s -p "🔑 Password [$DEFAULT_PASSWORD]: " PASSWORD
echo ""
PASSWORD=${PASSWORD:-$DEFAULT_PASSWORD}

read -p "👤 Full Name [$DEFAULT_NAME]: " FULLNAME
FULLNAME=${FULLNAME:-$DEFAULT_NAME}

echo ""
echo "Creating admin user with:"
echo "📧 Email: $EMAIL"
echo "👤 Name: $FULLNAME"
echo "🔑 Password: $(echo $PASSWORD | sed 's/./*/g')"
echo ""

# Run the TypeScript script
npm run create-admin "$EMAIL" "$PASSWORD" "$FULLNAME"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Admin user created successfully!"
    echo "🌐 Login at: https://contratofacil.clubemkt.digital/login"
else
    echo ""
    echo "❌ Failed to create admin user!"
    echo "Check the error messages above for details."
fi