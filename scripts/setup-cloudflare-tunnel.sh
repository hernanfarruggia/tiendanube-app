#!/bin/bash

# Cloudflare Tunnel Setup Script
# This script helps you set up Cloudflare Tunnel for the Tiendanube app

set -e

TUNNEL_NAME="tiendanube-app"
CONFIG_DIR="$HOME/.cloudflared"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "🚀 Cloudflare Tunnel Setup for Tiendanube App"
echo "=============================================="
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared is not installed"
    echo "Install it with: brew install cloudflare/cloudflare/cloudflared"
    exit 1
fi

echo "✅ cloudflared installed: $(cloudflared --version)"
echo ""

# Step 1: Login
echo "Step 1: Login to Cloudflare"
echo "----------------------------"
if [ ! -f "$CONFIG_DIR/cert.pem" ]; then
    echo "You need to login to Cloudflare first."
    echo "This will open your browser. Please authorize cloudflared."
    read -p "Press Enter to continue..."
    cloudflared tunnel login
    echo ""
else
    echo "✅ Already logged in (cert.pem exists)"
    echo ""
fi

# Step 2: Create tunnel
echo "Step 2: Create Tunnel"
echo "---------------------"
EXISTING_TUNNEL=$(cloudflared tunnel list | grep "$TUNNEL_NAME" || true)

if [ -n "$EXISTING_TUNNEL" ]; then
    echo "✅ Tunnel '$TUNNEL_NAME' already exists"
    TUNNEL_ID=$(echo "$EXISTING_TUNNEL" | awk '{print $1}')
else
    echo "Creating tunnel: $TUNNEL_NAME"
    cloudflared tunnel create "$TUNNEL_NAME"
    TUNNEL_ID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')
    echo "✅ Tunnel created with ID: $TUNNEL_ID"
fi
echo ""

# Step 3: Create config file
echo "Step 3: Create Configuration File"
echo "----------------------------------"

if [ ! -f "$CONFIG_DIR/config.yml" ]; then
    cat > "$CONFIG_DIR/config.yml" << EOF
tunnel: $TUNNEL_NAME
credentials-file: $CONFIG_DIR/$TUNNEL_ID.json

ingress:
  # Backend API (puerto 8000)
  - hostname: api-$TUNNEL_ID.cfargotunnel.com
    service: http://localhost:8000

  # Frontend App (puerto 5173)
  - hostname: app-$TUNNEL_ID.cfargotunnel.com
    service: http://localhost:5173

  # Catch-all (required)
  - service: http_status:404
EOF
    echo "✅ Configuration file created: $CONFIG_DIR/config.yml"
else
    echo "⚠️  Configuration file already exists: $CONFIG_DIR/config.yml"
    echo "If you want to recreate it, delete it first and run this script again."
fi
echo ""

# Step 4: Show URLs and next steps
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Your Tunnel URLs:"
echo "  Backend:  https://api-$TUNNEL_ID.cfargotunnel.com"
echo "  Frontend: https://app-$TUNNEL_ID.cfargotunnel.com"
echo ""
echo "Next Steps:"
echo "1. Update frontend/.env with:"
echo "   VITE_API_URL=https://api-$TUNNEL_ID.cfargotunnel.com"
echo ""
echo "2. Update Tiendanube Partners Portal (https://partners.tiendanube.com/applications/25366/edit):"
echo "   URL de Inicio: https://app-$TUNNEL_ID.cfargotunnel.com"
echo "   URL de Redirección: https://api-$TUNNEL_ID.cfargotunnel.com/auth/callback"
echo "   URL de Instalación: https://api-$TUNNEL_ID.cfargotunnel.com/install"
echo ""
echo "3. Start the tunnel:"
echo "   cloudflared tunnel run $TUNNEL_NAME"
echo ""
echo "4. Start your servers:"
echo "   Terminal 2: cd api && yarn start"
echo "   Terminal 3: cd frontend && yarn start:dev"
echo ""
echo "📚 Full documentation: docs/CLOUDFLARE_TUNNEL_SETUP.md"
