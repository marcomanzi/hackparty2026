#!/bin/bash

# Check if remote server parameter is provided
if [ -z "$1" ]; then
    echo "Usage: ./deploy_to_remote.sh <remote-server>"
    echo "Example: ./deploy_to_remote.sh serverpod-projects"
    exit 1
fi

REMOTE_SERVER=$1
PROJECT_NAME="hack_party_2026"

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "================================================"
echo "Deploying ${PROJECT_NAME} to ${REMOTE_SERVER}"
echo "================================================"

# Find the server directory
pattern="_server"
for _dir in "${PROJECT_ROOT}"/*"${pattern}"; do
    [ -d "${_dir}" ] && SERVER_DIR="${_dir}" && break
done

if [ -z "$SERVER_DIR" ]; then
    echo "Error: Could not find server directory"
    exit 1
fi

SERVER_DIR_NAME=$(basename "$SERVER_DIR")
echo "Found server directory: ${SERVER_DIR_NAME}"

# Create parent directory on remote server
echo "Creating directory structure on remote server..."
ssh "${REMOTE_SERVER}" "mkdir -p ~/${PROJECT_NAME}/${SERVER_DIR_NAME}"

if [ $? -ne 0 ]; then
    echo "Error: Failed to create directory on remote server"
    exit 1
fi

# Deploy using rsync
echo "Syncing files to ${REMOTE_SERVER}:~/${PROJECT_NAME}/${SERVER_DIR_NAME}/"

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

if [ $? -eq 0 ]; then
    echo ""
    echo "================================================"
    echo "✓ Deployment successful!"
    echo "================================================"
    echo ""
    echo "Deploying with zero-downtime strategy..."
    echo ""
    
    ssh "${REMOTE_SERVER}" bash << 'ENDSSH'
PROJECT_NAME="hack_party_2026"
SERVER_DIR_NAME="hack_party_2026_server"
cd ~/${PROJECT_NAME}/${SERVER_DIR_NAME}

echo "Ensuring PostgreSQL and Redis are running..."
docker compose -f docker-compose-production.yaml up -d postgres redis

echo "Building and deploying server (keeping DB and cache running)..."
docker compose -f docker-compose-production.yaml up -d --build --no-deps server

echo ""
echo "Waiting for server to stabilize..."
sleep 5

echo "Service status:"
docker compose -f docker-compose-production.yaml ps

echo ""
echo "Recent server logs:"
docker compose -f docker-compose-production.yaml logs --tail=20 server
ENDSSH
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "================================================"
        echo "✓ Zero-downtime deployment complete!"
        echo "================================================"
        echo ""
        echo "Next steps:"
        echo "  1. Test your endpoints:"
        echo "     http://YOUR_SERVER_IP"
        echo "  2. Monitor logs:"
        echo "     ssh ${REMOTE_SERVER}"
        echo "     cd ~/${PROJECT_NAME}/${SERVER_DIR_NAME}"
        echo "     docker compose -f docker-compose-production.yaml logs -f"
        echo ""
    else
        echo ""
        echo "================================================"
        echo "✗ Failed to start Docker services!"
        echo "================================================"
        exit 1
    fi
else
    echo ""
    echo "================================================"
    echo "✗ Deployment failed!"
    echo "================================================"
    exit 1
fi

