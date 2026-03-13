#!/bin/bash

# Complete HTTPS deployment to remote server
# Usage: ./deploy_https_to_remote.sh <remote-server>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if remote server parameter is provided
if [ -z "$1" ]; then
    echo -e "${RED}Usage: ./deploy_https_to_remote.sh <remote-server>${NC}"
    echo "Example: ./deploy_https_to_remote.sh serverpod-projects"
    exit 1
fi

REMOTE_SERVER=$1
PROJECT_NAME="hack_party_2026"

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}HTTPS Deployment to Remote Server${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Find the server directory
pattern="_server"
for _dir in "${PROJECT_ROOT}"/*"${pattern}"; do
    [ -d "${_dir}" ] && SERVER_DIR="${_dir}" && break
done

if [ -z "$SERVER_DIR" ]; then
    echo -e "${RED}Error: Could not find server directory${NC}"
    exit 1
fi

cd "${SERVER_DIR}"
SERVER_DIR_NAME=$(basename "$SERVER_DIR")

# Step 1: Check if Caddyfile exists
echo -e "${YELLOW}Step 1: Checking Caddyfile configuration...${NC}"
if [ ! -f "Caddyfile" ]; then
    echo -e "${RED}Error: Caddyfile not found!${NC}"
    echo ""
    echo "Please run the HTTPS setup first:"
    echo "  ${SCRIPT_DIR}/deploy_setup_https.sh"
    echo ""
    echo "Or manually create a Caddyfile with your domain configuration."
    exit 1
fi

echo -e "${GREEN}✓ Caddyfile found${NC}"
echo ""
echo "Current Caddyfile configuration:"
echo "---"
cat Caddyfile
echo "---"
echo ""

read -p "$(echo -e ${YELLOW}Continue with this configuration? [y/N]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    echo "Run './deploy_setup_https.sh' to reconfigure."
    exit 1
fi

# Step 2: Deploy files
echo ""
echo -e "${YELLOW}Step 2: Deploying files to ${REMOTE_SERVER}...${NC}"

# Create remote directory
ssh "${REMOTE_SERVER}" "mkdir -p ~/${PROJECT_NAME}/${SERVER_DIR_NAME}"

# Deploy using rsync
rsync -avz --progress \
  --exclude '.git' \
  --exclude '.dart_tool' \
  --exclude 'build' \
  --exclude '.DS_Store' \
  --exclude '*.iml' \
  --exclude '.idea' \
  --exclude '*.log' \
  --exclude 'pubspec.lock' \
  "${SERVER_DIR}/" \
  "${REMOTE_SERVER}:~/${PROJECT_NAME}/${SERVER_DIR_NAME}/"

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Deployment failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Files deployed successfully${NC}"

# Step 3: Setup and start on remote server
echo ""
echo -e "${YELLOW}Step 3: Setting up HTTPS on remote server...${NC}"

ssh "${REMOTE_SERVER}" bash << 'ENDSSH'
set -e

PROJECT_NAME="hack_party_2026"
SERVER_DIR_NAME="hack_party_2026_server"
cd ~/${PROJECT_NAME}/${SERVER_DIR_NAME}

echo "Checking current setup..."
# Check if Caddy is running (indicates HTTPS setup is active)
if docker ps --format '{{.Names}}' | grep -q "caddy"; then
    echo "HTTPS setup already running - zero-downtime update..."
    echo "Ensuring PostgreSQL and Redis are running..."
    docker compose -f docker-compose-production-https.yaml up -d postgres redis
    
    echo "Building and deploying server + caddy (keeping DB and cache)..."
    docker compose -f docker-compose-production-https.yaml up -d --build --no-deps server caddy
else
    # Check if HTTP setup is running
    if docker compose -f docker-compose-production.yaml ps --services --filter "status=running" | grep -q "server"; then
        echo "Found HTTP setup running, switching to HTTPS..."
        echo "Starting PostgreSQL and Redis with HTTPS config..."
        docker compose -f docker-compose-production-https.yaml up -d postgres redis
        
        echo "Stopping old HTTP server..."
        docker compose -f docker-compose-production.yaml stop server
        
        echo "Starting HTTPS setup (server + caddy)..."
        docker compose -f docker-compose-production-https.yaml up -d --build --no-deps server caddy
        
        echo "Cleaning up old HTTP server..."
        docker compose -f docker-compose-production.yaml rm -f server
    else
        echo "First deployment - starting everything..."
        echo "Ensuring PostgreSQL and Redis are running..."
        docker compose -f docker-compose-production-https.yaml up -d postgres redis
        
        echo "Building and deploying server + caddy..."
        docker compose -f docker-compose-production-https.yaml up -d --build --no-deps server caddy
    fi
fi

echo ""
echo "Waiting for services to stabilize..."
sleep 5

echo "Checking service status..."
docker compose -f docker-compose-production-https.yaml ps

echo ""
echo "Server health check..."
docker compose -f docker-compose-production-https.yaml logs --tail=10 server

echo ""
echo "Caddy logs (last 10 lines):"
docker compose -f docker-compose-production-https.yaml logs --tail=10 caddy
ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}✓ HTTPS Deployment Successful!${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo -e "${BLUE}Your server is now running with HTTPS!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Wait 1-2 minutes for SSL certificate generation"
    echo "  2. Test your endpoints:"
    
    # Extract domains from Caddyfile
    while IFS= read -r line; do
        if [[ $line =~ ^([a-zA-Z0-9.-]+\.[a-zA-Z]+)[[:space:]]*\{ ]]; then
            domain="${BASH_REMATCH[1]}"
            echo "     https://${domain}"
        fi
    done < "${SERVER_DIR}/Caddyfile"
    
    echo ""
    echo "  3. Monitor logs:"
    echo "     ssh ${REMOTE_SERVER}"
    echo "     cd ~/${PROJECT_NAME}/${SERVER_DIR_NAME}"
    echo "     docker compose -f docker-compose-production-https.yaml logs -f"
    echo ""
else
    echo ""
    echo -e "${RED}================================================${NC}"
    echo -e "${RED}✗ Deployment had issues!${NC}"
    echo -e "${RED}================================================${NC}"
    echo ""
    echo "SSH into the server to check logs:"
    echo "  ssh ${REMOTE_SERVER}"
    echo "  cd ~/${PROJECT_NAME}/${SERVER_DIR_NAME}"
    echo "  docker compose -f docker-compose-production-https.yaml logs"
    exit 1
fi

