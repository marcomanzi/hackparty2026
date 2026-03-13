# Remote Server HTTPS Deployment Guide

Complete step-by-step guide to enable HTTPS on your remote Serverpod server.

## Prerequisites

Before you begin, ensure you have:

1. ✅ A domain name (e.g., `example.com`)
2. ✅ Access to your domain's DNS settings
3. ✅ SSH access to your remote server
4. ✅ Your server's public IP address

## Step-by-Step Deployment

### Step 1: Configure DNS Records

Point your domain to your server's IP address. Add these DNS records:

```
Type    Name        Value                TTL
A       api         YOUR_SERVER_IP       3600
A       insights    YOUR_SERVER_IP       3600
A       app         YOUR_SERVER_IP       3600
```

**Wait 5-10 minutes** for DNS propagation. Verify with:
```bash
dig api.yourdomain.com
dig insights.yourdomain.com
dig app.yourdomain.com
```

### Step 2: Configure Caddyfile Locally

On your **local machine**, run the setup script:

```bash
cd /Users/mmanzi/workspace/serverpod2025/hack_party_2026
./common_scripts/deploy_setup_https.sh
```

Choose option **1** and enter your domains:
- API domain: `api.yourdomain.com`
- Insights domain: `insights.yourdomain.com`
- App domain: `app.yourdomain.com`

This creates a `Caddyfile` in your server directory.

### Step 3: Update Production Config

Edit `hack_party_2026_server/config/production.yaml`:

```yaml
apiServer:
  port: 8080
  publicHost: api.yourdomain.com
  publicPort: 443
  publicScheme: https

insightsServer:
  port: 8081
  publicHost: insights.yourdomain.com
  publicPort: 443
  publicScheme: https

webServer:
  port: 8082
  publicHost: app.yourdomain.com
  publicPort: 443
  publicScheme: https
```

### Step 4: Deploy to Remote Server

Run the deployment script:

```bash
cd /Users/mmanzi/workspace/serverpod2025/hack_party_2026
./common_scripts/deploy_to_remote.sh serverpod-projects
```

This will sync all files including:
- `Caddyfile` (with your domains)
- `docker-compose-production-https.yaml`
- Updated `config/production.yaml`

### Step 5: Setup Firewall on Remote Server

SSH into your remote server and configure the firewall:

```bash
ssh serverpod-projects
```

**For UFW (Ubuntu/Debian):**
```bash
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 22/tcp    # SSH (if not already allowed)
sudo ufw enable
sudo ufw status
```

**For firewalld (CentOS/RHEL):**
```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
sudo firewall-cmd --list-all
```

### Step 6: Stop Current HTTP Setup

On the remote server:

```bash
cd ~/hack_party_2026/hack_party_2026_server

# Stop the current HTTP-only setup
docker compose -f docker-compose-production.yaml down
```

### Step 7: Start HTTPS Setup

Still on the remote server:

```bash
# Start with HTTPS support
docker compose -f docker-compose-production-https.yaml up -d --build
```

### Step 8: Monitor Certificate Generation

Watch Caddy obtain SSL certificates:

```bash
docker compose -f docker-compose-production-https.yaml logs -f caddy
```

You should see:
```
successfully downloaded available certificate chains
certificate obtained successfully
```

Press `Ctrl+C` to exit logs when you see the certificates are obtained.

### Step 9: Verify HTTPS is Working

Test your endpoints:

```bash
# From your local machine or the remote server:
curl -I https://api.yourdomain.com
curl -I https://insights.yourdomain.com
curl -I https://app.yourdomain.com
```

Or open in your browser:
- https://api.yourdomain.com
- https://insights.yourdomain.com
- https://app.yourdomain.com

### Step 10: Check All Services

On the remote server, verify all containers are running:

```bash
docker compose -f docker-compose-production-https.yaml ps
```

You should see:
```
NAME                                    STATUS
hack_party_2026_server-caddy-1        Up
hack_party_2026_server-server-1       Up
hack_party_2026_server-postgres-1     Up
hack_party_2026_server-redis-1        Up
```

## Complete Command Reference

### On Your Local Machine:

```bash
# 1. Configure HTTPS
cd /Users/mmanzi/workspace/serverpod2025/hack_party_2026
./common_scripts/deploy_setup_https.sh

# 2. Deploy to remote
./common_scripts/deploy_to_remote.sh serverpod-projects
```

### On Remote Server:

```bash
# 1. SSH into server
ssh serverpod-projects

# 2. Navigate to project
cd ~/hack_party_2026/hack_party_2026_server

# 3. Stop HTTP setup
docker compose -f docker-compose-production.yaml down

# 4. Start HTTPS setup
docker compose -f docker-compose-production-https.yaml up -d --build

# 5. Monitor logs
docker compose -f docker-compose-production-https.yaml logs -f

# 6. Check status
docker compose -f docker-compose-production-https.yaml ps
```

## Troubleshooting

### Issue: Caddy can't obtain certificates

**Error:** `challenge failed`

**Solution:**
1. Verify DNS is correctly configured: `dig api.yourdomain.com`
2. Ensure ports 80 and 443 are open on firewall
3. Wait a few more minutes for DNS propagation
4. Check Caddy logs: `docker compose -f docker-compose-production-https.yaml logs caddy`

### Issue: Connection refused

**Solution:**
```bash
# Check if server is running
docker compose -f docker-compose-production-https.yaml ps

# Check server logs
docker compose -f docker-compose-production-https.yaml logs server

# Restart if needed
docker compose -f docker-compose-production-https.yaml restart server
```

### Issue: Wrong domain in Caddyfile

**Solution:**
```bash
# On local machine: reconfigure
./common_scripts/deploy_setup_https.sh

# Redeploy
./common_scripts/deploy_to_remote.sh serverpod-projects

# On remote server: restart
docker compose -f docker-compose-production-https.yaml restart caddy
```

## Security Checklist

- ✅ Firewall configured (ports 80, 443 open)
- ✅ HTTPS certificates obtained
- ✅ HTTP redirects to HTTPS automatically
- ✅ Server ports (8080-8082) not exposed externally
- ✅ Strong passwords in `config/passwords.yaml`
- ✅ Database not exposed externally

## Maintenance

### Update Server Code

```bash
# On local machine
./common_scripts/deploy_to_remote.sh serverpod-projects

# On remote server
cd ~/hack_party_2026/hack_party_2026_server
docker compose -f docker-compose-production-https.yaml up -d --build
```

### View Logs

```bash
# All services
docker compose -f docker-compose-production-https.yaml logs -f

# Specific service
docker compose -f docker-compose-production-https.yaml logs -f server
docker compose -f docker-compose-production-https.yaml logs -f caddy
```

### Restart Services

```bash
# All services
docker compose -f docker-compose-production-https.yaml restart

# Specific service
docker compose -f docker-compose-production-https.yaml restart server
```

## Notes

- Caddy automatically renews SSL certificates before they expire
- Certificates are stored in Docker volume `caddy_data`
- HTTP (port 80) automatically redirects to HTTPS (port 443)
- The setup is production-ready and secure

