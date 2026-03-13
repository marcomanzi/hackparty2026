#!/bin/bash

# Firewall setup script for Hetzner server
# This script configures UFW to only allow necessary ports

set -e

echo "================================================"
echo "Hetzner Server Firewall Setup"
echo "================================================"
echo ""
echo "This will configure UFW firewall to:"
echo "  ✓ Allow SSH (port 22)"
echo "  ✓ Allow HTTP (port 80) - for API"
echo "  ✓ Allow HTTPS (port 443) - for HTTPS setup"
echo "  ✓ Allow Insights (port 8081)"
echo "  ✓ Allow Web/App (port 8082)"
echo ""
echo "  ✗ Block PostgreSQL (5432)"
echo "  ✗ Block Redis (6379)"
echo "  ✗ Block all other ports"
echo ""

read -p "Continue with firewall setup? [y/N]: " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Firewall setup cancelled."
    exit 1
fi

echo ""
echo "Installing UFW (if not installed)..."
sudo apt update
sudo apt install -y ufw

echo ""
echo "Configuring UFW rules..."

# Reset UFW to default
sudo ufw --force reset

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (IMPORTANT: do this first!)
echo "Allowing SSH (port 22)..."
sudo ufw allow 22/tcp comment 'SSH'

# Allow HTTP and HTTPS
echo "Allowing HTTP (port 80)..."
sudo ufw allow 80/tcp comment 'HTTP - API'

echo "Allowing HTTPS (port 443)..."
sudo ufw allow 443/tcp comment 'HTTPS - API'

# Allow Serverpod Insights
echo "Allowing Insights (port 8081)..."
sudo ufw allow 8081/tcp comment 'Serverpod Insights'

# Allow Serverpod Web/App
echo "Allowing Web/App (port 8082)..."
sudo ufw allow 8082/tcp comment 'Serverpod Web'

# Explicitly deny PostgreSQL and Redis (optional but clear)
echo "Explicitly denying PostgreSQL (port 5432)..."
sudo ufw deny 5432/tcp comment 'PostgreSQL - blocked'

echo "Explicitly denying Redis (port 6379)..."
sudo ufw deny 6379/tcp comment 'Redis - blocked'

# Enable UFW
echo ""
echo "Enabling UFW firewall..."
sudo ufw --force enable

# Show status
echo ""
echo "================================================"
echo "✓ Firewall configuration complete!"
echo "================================================"
echo ""
echo "Current firewall status:"
sudo ufw status verbose

echo ""
echo "================================================"
echo "Security Notes:"
echo "================================================"
echo ""
echo "✓ PostgreSQL and Redis are only accessible within Docker network"
echo "✓ Only your application services are accessible from outside"
echo "✓ SSH access is preserved for server management"
echo ""
echo "Accessible from internet:"
echo "  - Port 22:   SSH"
echo "  - Port 80:   HTTP (API)"
echo "  - Port 443:  HTTPS (API when using Caddy)"
echo "  - Port 8081: Insights"
echo "  - Port 8082: Web/App"
echo ""
echo "NOT accessible from internet:"
echo "  - Port 5432: PostgreSQL (Docker internal only)"
echo "  - Port 6379: Redis (Docker internal only)"
echo ""

