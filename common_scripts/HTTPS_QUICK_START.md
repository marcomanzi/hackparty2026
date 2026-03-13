# HTTPS Quick Start Guide

The **fastest way** to deploy your Serverpod server with HTTPS to a remote server.

## Prerequisites

- ✅ A domain name (e.g., `example.com`)
- ✅ DNS access to add A records
- ✅ Remote server with SSH access
- ✅ Server's public IP address

## 3-Step Deployment

### Step 1: Configure DNS

Add these DNS A records pointing to your server's IP:

```
api.yourdomain.com      → YOUR_SERVER_IP
insights.yourdomain.com → YOUR_SERVER_IP
app.yourdomain.com      → YOUR_SERVER_IP
```

**Wait 5-10 minutes** for DNS propagation.

### Step 2: Configure HTTPS Locally

Run the setup script and enter your domains:

```bash
cd /Users/mmanzi/workspace/serverpod2025/hack_party_2026
./common_scripts/deploy_setup_https.sh
```

Choose **option 1** and enter your three domains.

### Step 3: Deploy to Remote Server

Run the deployment script:

```bash
./common_scripts/deploy_https_to_remote.sh serverpod-projects
```

**That's it!** 🎉

The script will:
1. ✅ Sync all files to remote server
2. ✅ Stop the old HTTP setup
3. ✅ Start the new HTTPS setup
4. ✅ Caddy will automatically obtain SSL certificates

## Verify It's Working

Wait 1-2 minutes, then test:

```bash
curl -I https://api.yourdomain.com
curl -I https://insights.yourdomain.com
curl -I https://app.yourdomain.com
```

Or open in your browser!

## If Something Goes Wrong

SSH into your server and check logs:

```bash
ssh serverpod-projects
cd ~/hack_party_2026/hack_party_2026_server
docker compose -f docker-compose-production-https.yaml logs -f caddy
```

Common issues:
- **DNS not propagated yet** → Wait longer, verify with `dig yourdomain.com`
- **Firewall blocking ports** → Open ports 80 and 443
- **Wrong domain in config** → Run `deploy_setup_https.sh` again

## Full Documentation

For detailed troubleshooting and manual steps, see:
- `REMOTE_HTTPS_DEPLOYMENT.md` - Complete step-by-step guide

## Scripts Reference

```bash
# Configure HTTPS domains
./common_scripts/deploy_setup_https.sh

# Deploy with HTTPS
./common_scripts/deploy_https_to_remote.sh serverpod-projects

# Deploy without HTTPS (HTTP only)
./common_scripts/deploy_to_remote.sh serverpod-projects
```

## Architecture

```
                    Internet
                       ↓
              [Ports 80/443 HTTPS]
                       ↓
                    Caddy
            (Automatic SSL Certs)
                       ↓
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
    API:8080    Insights:8081   Web:8082
                       ↓
        ┌──────────────┼──────────────┐
        ↓                             ↓
   PostgreSQL:5432              Redis:6379
```

**Security:**
- 🔒 All traffic encrypted with HTTPS
- 🔒 Server ports not exposed to internet
- 🔒 Automatic certificate renewal
- 🔒 Database and Redis internal only

## Updating Your Deployed Server

After making code changes:

```bash
# On local machine
./common_scripts/deploy_https_to_remote.sh serverpod-projects
```

That's all you need! The script handles everything.

