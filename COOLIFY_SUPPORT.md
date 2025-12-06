# Coolify Deployment Support

This document provides configuration details and instructions for deploying the MACS Agent Portal to Coolify as a fallback hosting platform.

## Overview

Coolify is configured as a secondary deployment target when Railway free-tier limits are reached or for cost optimization purposes. This deployment can be accessed via Hostinger VPN tunnel.

## Prerequisites

- **Coolify Server**: Self-hosted or managed Coolify instance
- **Hostinger VPN**: Configured VPN tunnel for secure access
- **Git Repository**: This repository accessible by Coolify
- **Environment Variables**: All secrets from `.agents` file

## Deployment Configuration

### 1. Coolify Project Setup

Create a new application in Coolify with the following settings:

```yaml
Name: macs-agent-portal
Type: Static Site (via buildpack)
Source: Git Repository
Repository: executiveusa/macs-agent-portal
Branch: main
```

### 2. Build Configuration

```bash
# Build Command
npm install && npm run build

# Start Command (if using Node server)
npx serve -s dist -l $PORT

# Output Directory
dist

# Install Command
npm install --prefer-offline
```

### 3. Environment Variables

Set the following environment variables in Coolify dashboard:

#### Required (Core)
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=your-project-id
```

#### Optional (Integrations)
```bash
VITE_FIRECRAWL_API_KEY=fc-your-api-key
VITE_FIRECRAWL_BASE_URL=https://api.firecrawl.dev/v2
```

#### System
```bash
NODE_ENV=production
PORT=8080
```

### 4. Hostinger VPN Configuration

#### VPN Tunnel Setup

1. **Install WireGuard** on your local machine or server
2. **Configure VPN Connection** to Hostinger server
3. **Setup Port Forwarding** to Coolify instance

```bash
# Example WireGuard config
[Interface]
PrivateKey = YOUR_PRIVATE_KEY
Address = 10.0.0.2/24

[Peer]
PublicKey = HOSTINGER_PUBLIC_KEY
Endpoint = your-hostinger-server.com:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
```

4. **Access Coolify** through VPN tunnel:
   ```
   http://10.0.0.1:8000  # Example internal Coolify address
   ```

### 5. Docker Configuration (Optional)

If using Docker deployment on Coolify:

```dockerfile
# Dockerfile (create if needed)
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6. Resource Limits

Configure resource limits in Coolify to match Railway free-tier equivalents:

```yaml
Resources:
  Memory: 512MB
  CPU: 0.5 cores
  Disk: 1GB
```

## Network Configuration

### Domain Setup

1. **Subdomain**: Create subdomain pointing to Coolify server
   - Example: `macs.yourdomain.com`
   
2. **DNS Records**:
   ```
   Type: A
   Name: macs
   Value: [Coolify Server IP via VPN]
   TTL: 300
   ```

3. **SSL Certificate**: Coolify auto-generates Let's Encrypt certificates

### Firewall Rules

Ensure the following ports are accessible through VPN:

- Port 80 (HTTP)
- Port 443 (HTTPS)
- Port 8080 (Application)

## Deployment Process

### Initial Deployment

1. **Connect Repository** to Coolify
2. **Set Environment Variables** from `master.secrets.json`
3. **Configure Build Settings**
4. **Deploy Application**

```bash
# Using Coolify CLI (if available)
coolify deploy \
  --app macs-agent-portal \
  --env-file ./master.secrets.json \
  --branch main
```

### Automated Deployment

Configure webhook for automatic deployments:

```bash
# GitHub Webhook URL (provided by Coolify)
https://coolify.yourdomain.com/api/webhooks/[webhook-id]

# Trigger on:
- Push to main branch
- Pull request merge
```

## Health Checks

Configure health checks in Coolify:

```yaml
Health Check:
  Path: /
  Interval: 30s
  Timeout: 10s
  Retries: 3
```

## Monitoring

### Resource Usage

Monitor through Coolify dashboard:
- CPU usage
- Memory consumption
- Disk space
- Network traffic

### Logs

Access application logs:

```bash
# Via Coolify dashboard
# Or via CLI
coolify logs --app macs-agent-portal --tail 100
```

## Migration from Railway

When migrating from Railway to Coolify:

1. **Export Environment Variables** from Railway
2. **Import to Coolify** via dashboard or CLI
3. **Update DNS** to point to Coolify instance
4. **Test Deployment** before switching traffic
5. **Monitor** for 24-48 hours after migration

See `COOLIFY_MIGRATION.md` for detailed migration checklist.

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (requires 18+)
   - Verify environment variables are set
   - Check build logs in Coolify dashboard

2. **VPN Connection Issues**
   - Verify WireGuard configuration
   - Check Hostinger server status
   - Test connectivity: `ping 10.0.0.1`

3. **Application Not Loading**
   - Check health check status
   - Verify correct start command
   - Review application logs

### Support Resources

- Coolify Documentation: https://coolify.io/docs
- Hostinger VPN Support: https://www.hostinger.com/tutorials/vpn
- Community: https://github.com/coollabsio/coolify/discussions

## Cost Comparison

| Resource | Railway Free | Coolify Self-Hosted |
|----------|--------------|---------------------|
| Memory | 512MB | Configurable |
| CPU | Shared | Dedicated |
| Bandwidth | 100GB/month | Unlimited |
| Build Minutes | 500/month | Unlimited |
| Monthly Cost | $0 | Server Cost (~$5-10) |

## Security Considerations

1. **VPN Only Access**: Ensure Coolify is only accessible via VPN
2. **SSL Certificates**: Use Let's Encrypt for HTTPS
3. **Secrets Management**: Never commit secrets to repository
4. **Firewall**: Restrict access to necessary ports only
5. **Updates**: Keep Coolify and dependencies updated

## Backup Strategy

Configure automatic backups:

1. **Database Backups**: Daily Supabase backups (handled by Supabase)
2. **Configuration Backups**: Export Coolify settings weekly
3. **Code Backups**: Git repository is source of truth

## Next Steps

- [ ] Set up Hostinger VPN tunnel
- [ ] Create Coolify application
- [ ] Configure environment variables
- [ ] Test deployment
- [ ] Set up monitoring and alerts
- [ ] Configure automatic backups
- [ ] Document any customizations

---

**Note**: This configuration is ready to use but not activated by default. Coolify deployment will be triggered automatically if Railway free-tier limits are reached or can be manually activated.

**Last Updated**: 2025-12-06  
**Status**: Ready for deployment (not active)
