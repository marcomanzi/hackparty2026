# HTTPS Setup Guide

This guide explains how to expose your Serverpod server over HTTPS using Caddy as a reverse proxy.

## Prerequisites

1. A domain name (e.g., `yourdomain.com`)
2. DNS records pointing to your server's IP address:
   - `api.yourdomain.com` → Your server IP
   - `insights.yourdomain.com` → Your server IP
   - `app.yourdomain.com` → Your server IP
3. Ports 80 and 443 open on your server's firewall

## Setup Instructions

### Step 1: Configure Your Domain

Edit the `Caddyfile.production` file and replace `yourdomain.com` with your actual domain:

```bash
# Copy the production Caddyfile
cp Caddyfile.production Caddyfile

# Edit with your domain names
nano Caddyfile
```

Example configuration:
```
# API Server
api.example.com {
    reverse_proxy server:8080
}

# Insights Server
insights.example.com {
    reverse_proxy server:8081
}

# Web/App Server
app.example.com {
    reverse_proxy server:8082
}
```

### Step 2: Update Serverpod Configuration

Edit `config/production.yaml` to reflect your HTTPS domains:

```yaml
apiServer:
  port: 8080
  publicHost: api.example.com
  publicPort: 443
  publicScheme: https

insightsServer:
  port: 8081
  publicHost: insights.example.com
  publicPort: 443
  publicScheme: https

webServer:
  port: 8082
  publicHost: app.example.com
  publicPort: 443
  publicScheme: https
```

### Step 3: Deploy with HTTPS

Use the HTTPS-enabled docker-compose file:

```bash
# Stop the current setup
docker compose -f docker-compose-production.yaml down

# Start with HTTPS support
docker compose -f docker-compose-production-https.yaml up -d --build
```

### Step 4: Verify HTTPS

1. Check Caddy logs:
   ```bash
   docker compose -f docker-compose-production-https.yaml logs -f caddy
   ```

2. Test your endpoints:
   - API: `https://api.example.com`
   - Insights: `https://insights.example.com`
   - Web: `https://app.example.com`

## How It Works

1. **Caddy** listens on ports 80 (HTTP) and 443 (HTTPS)
2. **Automatic SSL**: Caddy automatically obtains and renews SSL certificates from Let's Encrypt
3. **Reverse Proxy**: Caddy forwards requests to the internal Serverpod server
4. **Security**: Server ports (8080, 8081, 8082) are only exposed internally to Caddy

## Troubleshooting

### Certificate Issues

If Caddy can't obtain certificates:
- Ensure DNS records are properly configured
- Verify ports 80 and 443 are accessible from the internet
- Check Caddy logs: `docker compose -f docker-compose-production-https.yaml logs caddy`

### Connection Refused

If you get connection errors:
- Verify the server container is running: `docker compose -f docker-compose-production-https.yaml ps`
- Check server logs: `docker compose -f docker-compose-production-https.yaml logs server`

### Testing Locally Without a Domain

For local testing, use the default `Caddyfile` which uses HTTP on port 80:

```bash
docker compose -f docker-compose-production-https.yaml up -d
# Access via: http://localhost
```

## Deployment Script Update

To deploy with HTTPS support, update your deployment to use the HTTPS compose file:

```bash
ssh your-server
cd ~/hack_party_2026/hack_party_2026_server
docker compose -f docker-compose-production-https.yaml up -d --build
```

## Security Notes

1. **Never commit** sensitive files like `config/passwords.yaml`
2. **Use strong passwords** for database and Redis
3. **Keep Caddy updated** for security patches
4. **Enable firewall** rules to only allow necessary ports
5. **Backup** Caddy's data volume containing SSL certificates

## Alternative: Single Domain Setup

If you prefer using a single domain with paths:

```
yourdomain.com/api → server:8080
yourdomain.com/insights → server:8081
yourdomain.com/ → server:8082
```

Update your `Caddyfile` accordingly (see commented section in `Caddyfile.production`).

