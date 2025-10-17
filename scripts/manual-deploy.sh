#!/bin/bash
# Manual deployment script for SIRK (use if GitHub Actions fails)
# Usage: ./scripts/manual-deploy.sh <VPS_HOST> <VPS_USER>
# Example: ./scripts/manual-deploy.sh 165.227.123.45 sirk

set -e  # Exit on error

VPS_HOST=${1:-}
VPS_USER=${2:-sirk}

if [ -z "$VPS_HOST" ]; then
  echo "Error: VPS host required"
  echo "Usage: ./scripts/manual-deploy.sh <VPS_HOST> [VPS_USER]"
  echo "Example: ./scripts/manual-deploy.sh 165.227.123.45 sirk"
  exit 1
fi

echo "🚀 Deploying SIRK to ${VPS_USER}@${VPS_HOST}..."
echo ""

# Deploy via SSH
ssh "${VPS_USER}@${VPS_HOST}" << 'ENDSSH'
  set -e
  cd ~/sirk

  echo "📥 Pulling latest code..."
  git pull origin Main

  echo "📦 Installing dependencies..."
  npm install --production=false

  echo "🔨 Building production bundle..."
  npm run build

  echo "✅ Verifying build..."
  if [ ! -f "dist/index.html" ]; then
    echo "❌ ERROR: Build failed - dist/index.html not found"
    exit 1
  fi

  echo ""
  echo "✅ Deployment successful!"
  echo "Latest commit deployed:"
  git log -1 --oneline
ENDSSH

echo ""
echo "🎉 SIRK deployed successfully!"
echo "🌐 Visit: http://${VPS_HOST}"
