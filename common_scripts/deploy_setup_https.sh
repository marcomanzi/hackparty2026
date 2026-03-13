#!/bin/bash

# Setup HTTPS configuration helper script

echo "================================================"
echo "HTTPS Configuration Setup"
echo "================================================"
echo ""

# Find the server directory
pattern="_server"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

for _dir in "${PROJECT_ROOT}"/*"${pattern}"; do
    [ -d "${_dir}" ] && SERVER_DIR="${_dir}" && break
done

if [ -z "$SERVER_DIR" ]; then
    echo "Error: Could not find server directory"
    exit 1
fi

cd "${SERVER_DIR}"

echo "What would you like to do?"
echo ""
echo "1) Configure domains for HTTPS"
echo "2) Test locally (HTTP only)"
echo "3) View current Caddyfile"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "Enter your domain names:"
        read -p "API domain (e.g., api.example.com): " api_domain
        read -p "Insights domain (e.g., insights.example.com): " insights_domain
        read -p "App domain (e.g., app.example.com): " app_domain
        
        cat > Caddyfile << EOF
# API Server
${api_domain} {
    reverse_proxy server:8080
}

# Insights Server
${insights_domain} {
    reverse_proxy server:8081
}

# Web/App Server
${app_domain} {
    reverse_proxy server:8082
}
EOF
        
        echo ""
        echo "✓ Caddyfile created with your domains!"
        echo ""
        echo "Next steps:"
        echo "1. Ensure DNS records point to your server:"
        echo "   ${api_domain} → Your server IP"
        echo "   ${insights_domain} → Your server IP"
        echo "   ${app_domain} → Your server IP"
        echo ""
        echo "2. Update config/production.yaml with your domains"
        echo ""
        echo "3. Deploy: docker compose -f docker-compose-production-https.yaml up -d --build"
        ;;
        
    2)
        cp Caddyfile Caddyfile.backup 2>/dev/null
        cat > Caddyfile << 'EOF'
# Local testing configuration (HTTP only)
:80 {
    # API endpoint
    handle /api/* {
        reverse_proxy server:8080
    }
    
    # Insights endpoint
    handle /insights/* {
        reverse_proxy server:8081
    }
    
    # Web/App (default)
    handle {
        reverse_proxy server:8082
    }
}
EOF
        
        echo ""
        echo "✓ Caddyfile configured for local HTTP testing"
        echo ""
        echo "Start with: docker compose -f docker-compose-production-https.yaml up -d"
        echo "Access at: http://localhost"
        ;;
        
    3)
        echo ""
        echo "Current Caddyfile:"
        echo "================================================"
        if [ -f "Caddyfile" ]; then
            cat Caddyfile
        else
            echo "No Caddyfile found"
        fi
        echo "================================================"
        ;;
        
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""

