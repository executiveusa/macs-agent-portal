# Railway Zero-Secrets Deployment Guide

This guide provides complete instructions for deploying the MACS Agent Portal to Railway with zero-secrets architecture, cost protection, and automatic maintenance mode.

## Overview

The Railway Zero-Secrets Bootstrapper system ensures:
- ✅ **First deploy succeeds** with working public URL
- ✅ **Zero secrets committed** to repository
- ✅ **Automatic cost protection** prevents runaway spending
- ✅ **Graceful degradation** with fallback data when APIs unavailable
- ✅ **Maintenance mode** activates automatically on free-tier breach
- ✅ **Multi-host fallback** ready (Coolify via Hostinger VPN)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Railway Zero-Secrets                     │
│                    Deployment Architecture                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   .agents    │───▶│ Railway CLI  │───▶│   Railway    │  │
│  │   Spec File  │    │   Secrets    │    │   Platform   │  │
│  └──────────────┘    │  Injection   │    └──────────────┘  │
│                      └──────────────┘                        │
│                             │                                │
│                             ▼                                │
│                   ┌─────────────────┐                        │
│                   │ master.secrets  │                        │
│                   │     .json       │                        │
│                   │  (Local Only)   │                        │
│                   └─────────────────┘                        │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Cost Protection Layer                       │  │
│  │  • Resource limits (512MB RAM, 0.5 CPU)              │  │
│  │  • Usage monitoring                                   │  │
│  │  • Auto-shutdown on limit                            │  │
│  │  • Maintenance mode activation                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Fallback Architecture                       │  │
│  │  • Coolify (via Hostinger VPN)                       │  │
│  │  • Maintenance HTML page                             │  │
│  │  • Migration checklist ready                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

1. **Railway Account** (free tier): https://railway.app
2. **Railway CLI** installed:
   ```bash
   npm install -g @railway/cli
   ```
3. **Git** repository access
4. **Secrets** for Supabase (required) and Firecrawl (optional)

### Step 1: Clone Repository

```bash
git clone https://github.com/executiveusa/macs-agent-portal.git
cd macs-agent-portal
```

### Step 2: Review Secret Requirements

Check the `.agents` file to see all required secrets:

```bash
cat .agents
```

**Required secrets:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

**Optional secrets:**
- `VITE_FIRECRAWL_API_KEY` (app works without this using fallback data)

### Step 3: Create Local Secrets File

Copy the template and fill in your secrets:

```bash
cp master.secrets.json.template master.secrets.json
chmod 600 master.secrets.json
```

Edit `master.secrets.json` with your actual secret values.

**⚠️ IMPORTANT**: Never commit `master.secrets.json` to Git! It's already in `.gitignore`.

### Step 4: Railway Project Setup

Login to Railway:

```bash
railway login
```

Create and link new project:

```bash
railway init
# Follow prompts to create new project
```

Or link to existing project:

```bash
railway link
```

### Step 5: Deploy with Secrets

Set environment variables from your local secrets file:

```bash
# Required secrets
railway variables set VITE_SUPABASE_URL="your-supabase-url"
railway variables set VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-key"
railway variables set VITE_SUPABASE_PROJECT_ID="your-project-id"

# Optional secrets
railway variables set VITE_FIRECRAWL_API_KEY="your-firecrawl-key"

# System variables (automatically set)
railway variables set NODE_ENV="production"
```

### Step 6: Deploy Application

```bash
railway up
```

Watch the deployment:

```bash
railway logs
```

### Step 7: Get Public URL

```bash
railway domain
```

The output will show your public Railway URL. Visit it to verify deployment.

## Configuration Files

### railway.toml

The `railway.toml` file configures:
- Build command: `npm install && npm run build`
- Start command: `npx serve -s dist -l $PORT`
- Resource limits: 512MB RAM, 0.5 CPU cores
- Cost protection metadata
- Watch patterns for rebuilds

### .agents

The `.agents` file is a machine-readable specification of all secrets:
- **Purpose**: Consumed by secrets-provisioning agents
- **Format**: JSON with validation rules
- **Sections**: core, optional, required_secrets, modules, schema
- **Usage**: Read by automation tools to inject secrets

### master.secrets.json (Local Only)

This file stores all secrets locally:
- **Location**: Your machine only (NOT in Git)
- **Format**: JSON with nested project structure
- **Purpose**: Single source of truth for all project secrets
- **Security**: chmod 600, encrypted storage recommended

## Cost Protection Features

### Automatic Resource Limits

Railway deployment is configured with minimal resources:
- **Memory**: 512MB (sufficient for static site)
- **CPU**: 0.5 cores (shared)
- **Concurrency**: 100 max concurrent requests

### Free Tier Monitoring

The system monitors Railway usage automatically:
1. Checks resource consumption
2. Predicts if next deploy exceeds free tier
3. Auto-triggers maintenance mode if limit reached

### Maintenance Mode

When free-tier limit is reached:
1. **Main service pauses** automatically
2. **Maintenance page deploys** (`maintenance.html`)
3. **Migration prep begins** (Coolify configuration)
4. **Logs indicate status** for manual review

### Triggering Maintenance Manually

To manually activate maintenance mode:

```bash
# Deploy maintenance page only
railway up --detach
# Then deploy maintenance.html as static site
```

## Integration Management

### Supabase (Required)

The application requires Supabase for core functionality:

1. **Get credentials** from Supabase dashboard:
   - Project Settings → API
   - Copy URL and anon/public key
   
2. **Set in Railway**:
   ```bash
   railway variables set VITE_SUPABASE_URL="your-url"
   railway variables set VITE_SUPABASE_PUBLISHABLE_KEY="your-key"
   ```

### Firecrawl (Optional)

Firecrawl enables live Mustang listing scraping:

**With Firecrawl API key**:
- Live web scraping from AutoTrader, Cars.com, etc.
- Real-time listing updates

**Without Firecrawl API key**:
- Falls back to hardcoded `FALLBACK_LISTINGS` array
- Displays 3 sample Mustang listings
- **Application still works!** ✅

To enable Firecrawl:

```bash
railway variables set VITE_FIRECRAWL_API_KEY="fc-your-key"
```

## Stubbed Integrations

All third-party integrations are designed to fail gracefully:

### Supabase Stub (if credentials invalid)
- App continues loading
- Shows mock data or empty states
- No crashes

### Firecrawl Stub (already implemented)
- Returns `FALLBACK_LISTINGS` array
- No API calls made
- Zero external dependencies

## Troubleshooting

### Build Failures

**Symptom**: Build fails during `npm install`

**Solutions**:
```bash
# Clear Railway build cache
railway run npm cache clean --force

# Verify package.json integrity
npm install --dry-run

# Check Node.js version
railway run node --version  # Should be 18+
```

### Deployment Fails to Start

**Symptom**: Build succeeds but app won't start

**Solutions**:
```bash
# Check logs
railway logs --tail 100

# Verify PORT is set
railway variables

# Test start command locally
npm run build
npx serve -s dist -l 8080
```

### Environment Variables Not Working

**Symptom**: Supabase connection fails

**Solutions**:
```bash
# List all variables
railway variables

# Verify variable names (case-sensitive)
# Must be: VITE_SUPABASE_URL not SUPABASE_URL

# Check for typos
railway variables set VITE_SUPABASE_URL="correct-url"
```

### Free Tier Exceeded

**Symptom**: Service shuts down automatically

**Solutions**:
1. Check Railway dashboard for usage
2. Review `maintenance.html` deployment status
3. Follow `COOLIFY_MIGRATION.md` for alternative hosting
4. Or upgrade to Railway paid tier

### Application Shows Fallback Data

**Symptom**: Only seeing 3 sample Mustang listings

**Cause**: Firecrawl API key not set (this is expected!)

**Solution** (optional):
```bash
# Add Firecrawl key for live data
railway variables set VITE_FIRECRAWL_API_KEY="fc-your-key"
railway up
```

## Security Best Practices

### Secrets Management

1. ✅ **Never commit** secrets to Git
2. ✅ **Use master.secrets.json** locally only
3. ✅ **Set permissions**: `chmod 600 master.secrets.json`
4. ✅ **Rotate secrets** regularly
5. ✅ **Use different secrets** for dev/staging/prod

### Railway Security

1. ✅ **Enable 2FA** on Railway account
2. ✅ **Use team features** for collaboration
3. ✅ **Review access logs** regularly
4. ✅ **Set up alerts** for unusual activity
5. ✅ **Keep dependencies updated**: `npm audit fix`

### Supabase Security

1. ✅ **Use Row Level Security** (RLS) policies
2. ✅ **Rotate API keys** after exposure
3. ✅ **Monitor usage** in Supabase dashboard
4. ✅ **Enable email verification**
5. ✅ **Use service_role key** only server-side

## Monitoring and Maintenance

### Health Checks

Railway automatically performs health checks:
- **Path**: `/`
- **Interval**: 30 seconds
- **Timeout**: 100 seconds
- **Action**: Restart on failure

### Logs

View application logs:

```bash
# Tail logs
railway logs --tail 50

# Follow logs
railway logs --follow

# Filter logs
railway logs | grep ERROR
```

### Usage Monitoring

Check Railway dashboard for:
- Memory usage
- CPU usage
- Network traffic
- Build minutes
- Request count

### Alerts

Set up Railway webhooks for:
- Deployment failures
- Service restarts
- Resource limit warnings
- Domain SSL issues

## Advanced Configuration

### Custom Domain

Add custom domain in Railway dashboard:

1. Go to project settings
2. Add custom domain
3. Configure DNS records as shown
4. SSL auto-generated by Railway

### Scaling (Paid Plans Only)

On paid Railway plans:

```toml
# In railway.toml
[resource]
memory = 1024  # 1GB
cpu = 1.0      # 1 full core

[scaling]
minInstances = 1
maxInstances = 3
```

### Automated Secrets Injection

For CI/CD pipelines:

```bash
# Using Railway API token
export RAILWAY_TOKEN="your-api-token"

# Inject secrets programmatically
railway variables set KEY="value" --token $RAILWAY_TOKEN
```

## Multi-Host Fallback Strategy

### Architecture Overview

```
Primary:    Railway (Free Tier)
            ↓ (if limit reached)
Fallback:   Coolify (Self-hosted via Hostinger VPN)
            ↓ (if Coolify down)
Emergency:  Static maintenance.html page
```

### Activation Conditions

Coolify fallback activates when:
- Railway free-tier monthly limit exceeded
- Railway service disruption
- Manual migration decision
- Cost optimization required

### Migration Process

See `COOLIFY_MIGRATION.md` for complete checklist.

Quick migration:

```bash
# 1. Deploy to Coolify (via VPN)
# 2. Update DNS to Coolify server
# 3. Keep Railway as backup for 30 days
```

## Cost Analysis

### Railway Free Tier Limits

- **Memory**: 512MB shared
- **CPU**: Shared cores
- **Bandwidth**: 100GB/month
- **Build minutes**: 500/month
- **Storage**: 1GB
- **Cost**: $0/month

### Monthly Burn Rate Estimate

For MACS Agent Portal:
- **Builds**: ~50 builds/month = 100 minutes
- **Bandwidth**: ~20GB/month (low traffic)
- **Runtime**: 24/7 within limits
- **Projected cost**: $0/month on free tier

### Cost Ceiling Protection

System prevents exceeding free tier:
- ✅ Resource limits enforced
- ✅ Monitoring active
- ✅ Auto-shutdown configured
- ✅ Maintenance mode ready

## Coolify Fallback (Future)

When Railway limits exceeded:

1. **Automatic preparation** begins
2. **COOLIFY_MIGRATION.md** checklist activated
3. **Hostinger VPN** tunnel required
4. **Migration takes** ~4-6 hours
5. **No data loss** (Supabase unchanged)

See `COOLIFY_SUPPORT.md` for configuration details.

## Success Metrics

Deployment is successful when:

✅ Build completes without errors  
✅ Application starts successfully  
✅ Public URL is accessible  
✅ Home page loads with content  
✅ Supabase connection works (if configured)  
✅ Fallback listings display (if Firecrawl not configured)  
✅ No console errors in browser  
✅ Health checks pass  
✅ Logs show no errors  
✅ Resource usage within limits  

## Support Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Supabase Support**: https://supabase.com/support
- **Project Issues**: https://github.com/executiveusa/macs-agent-portal/issues

## Next Steps

After successful deployment:

1. ✅ Monitor application for 24 hours
2. ✅ Set up custom domain (optional)
3. ✅ Configure monitoring alerts
4. ✅ Review cost protection logs
5. ✅ Plan Coolify fallback (if needed)
6. ✅ Document any customizations
7. ✅ Share deployment URL with team

---

**Deployment Status**: Ready for Railway  
**Cost Protection**: Active  
**Fallback Strategy**: Configured  
**Last Updated**: 2025-12-06  

**Zero secrets in Git ✅ | First deploy succeeds ✅ | Cost protected ✅**
