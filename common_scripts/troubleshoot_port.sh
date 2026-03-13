#!/bin/bash

# Troubleshoot port conflicts
# Usage: Run this on the remote server

echo "Checking what's using port 80..."
echo ""

# Check with netstat/ss
if command -v ss &> /dev/null; then
    echo "Processes listening on port 80:"
    sudo ss -tlnp | grep ':80 '
elif command -v netstat &> /dev/null; then
    echo "Processes listening on port 80:"
    sudo netstat -tlnp | grep ':80 '
else
    echo "Neither ss nor netstat found"
fi

echo ""
echo "Checking for common web servers:"
echo ""

# Check Apache
if systemctl is-active --quiet apache2 2>/dev/null; then
    echo "✗ Apache2 is running"
    echo "  To stop: sudo systemctl stop apache2"
    echo "  To disable: sudo systemctl disable apache2"
elif systemctl is-active --quiet httpd 2>/dev/null; then
    echo "✗ Apache (httpd) is running"
    echo "  To stop: sudo systemctl stop httpd"
    echo "  To disable: sudo systemctl disable httpd"
else
    echo "✓ Apache not running"
fi

# Check Nginx
if systemctl is-active --quiet nginx 2>/dev/null; then
    echo "✗ Nginx is running"
    echo "  To stop: sudo systemctl stop nginx"
    echo "  To disable: sudo systemctl disable nginx"
else
    echo "✓ Nginx not running"
fi

# Check Docker containers
echo ""
echo "Docker containers using port 80:"
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep ':80->'

echo ""
echo "Done!"

