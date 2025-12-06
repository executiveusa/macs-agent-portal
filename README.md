# MACS Agent Portal

**Mustang Auto Collection System Agent Portal** - A modern web application for discovering and managing Ford Mustang listings with Railway Zero-Secrets deployment architecture.

## 🚀 Railway Zero-Secrets Deployment

This project implements a **Railway Zero-Secrets Bootstrapper** architecture with:

✅ **Zero secrets committed** to Git  
✅ **First deploy always succeeds** with working public URL  
✅ **Automatic cost protection** prevents runaway spending  
✅ **Graceful degradation** with fallback data when APIs unavailable  
✅ **Maintenance mode** activates automatically on free-tier breach  
✅ **Multi-host fallback** ready (Coolify via Hostinger VPN)  

### Quick Deploy to Railway

```bash
# 1. Clone repository
git clone https://github.com/executiveusa/macs-agent-portal.git
cd macs-agent-portal

# 2. Install Railway CLI
npm install -g @railway/cli

# 3. Login and create project
railway login
railway init

# 4. Set required secrets
railway variables set VITE_SUPABASE_URL="your-url"
railway variables set VITE_SUPABASE_PUBLISHABLE_KEY="your-key"

# 5. Deploy!
railway up
```

📖 **Full deployment guide**: See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)

## 📁 Project Structure

```
.
├── .agents                      # Machine-readable secrets specification
├── master.secrets.json.template # Local secrets template (DO NOT commit filled version)
├── railway.toml                 # Railway deployment configuration with cost protection
├── nixpacks.toml               # Nixpacks build configuration
├── maintenance.html             # Auto-deployed maintenance mode page
├── RAILWAY_DEPLOYMENT.md        # Complete Railway deployment guide
├── COOLIFY_SUPPORT.md          # Coolify fallback configuration
├── COOLIFY_MIGRATION.md        # Migration checklist from Railway to Coolify
├── HOSTINGER_VPN.md            # VPN tunnel setup for Coolify access
└── src/                        # Application source code
```

## 🛠️ Technology Stack

- **Frontend**: Vite + React + TypeScript
- **UI Components**: shadcn-ui + Tailwind CSS
- **Backend**: Supabase (authentication & database)
- **Web Scraping**: Firecrawl API (optional, has fallback)
- **Deployment**: Railway (primary) / Coolify (fallback)
- **VPN**: Hostinger VPN tunnel (for Coolify access)

## 🔐 Secrets Management

### Required Secrets (Core Functionality)

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key

### Optional Secrets (Enhanced Features)

- `VITE_FIRECRAWL_API_KEY` - Live Mustang listing scraping (falls back to static data)

### Local Secrets Setup

```bash
# Copy template and fill in your secrets
cp master.secrets.json.template master.secrets.json
chmod 600 master.secrets.json

# Edit with your actual secrets (NEVER commit this file!)
nano master.secrets.json
```

**⚠️ SECURITY**: `master.secrets.json` is automatically ignored by Git. Never commit secrets!

## 🏗️ Local Development

### Prerequisites

- Node.js 18+ ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm or bun
- Supabase account (free tier works)

### Setup

```bash
# Clone repository
git clone https://github.com/executiveusa/macs-agent-portal.git
cd macs-agent-portal

# Install dependencies
npm install

# Copy environment template
cp .env .env.local

# Edit .env.local with your Supabase credentials
nano .env.local

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Development Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🎨 Lovable Integration

This project was initially created with [Lovable](https://lovable.dev) and can be edited through:

**Lovable Web IDE**  
Visit [Lovable Project](https://lovable.dev/projects/94b124a5-475a-42fc-9cbb-b959e4258a80) and start prompting. Changes are automatically committed.

**Local IDE**  
Clone, edit locally, and push. Changes sync with Lovable.

**GitHub Web Editor**  
Edit files directly on GitHub and commit.

**GitHub Codespaces**  
Launch a Codespace for a full cloud development environment.

## 🚀 Deployment Options

### 1. Railway (Recommended for Free Tier)

Best for: Small projects, zero-config deployment, free tier optimization

```bash
railway up
```

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for complete guide.

### 2. Coolify (Cost-Optimized Self-Hosting)

Best for: Cost optimization, full control, avoiding vendor lock-in

Requires: Hostinger VPN tunnel setup

See [COOLIFY_SUPPORT.md](./COOLIFY_SUPPORT.md) and [HOSTINGER_VPN.md](./HOSTINGER_VPN.md)

### 3. Lovable Native Deployment

Best for: Quick sharing, no configuration needed

Simply open Lovable and click Share → Publish.

## 💰 Cost Protection Features

### Automatic Resource Limits

- **Memory**: 512MB (sufficient for static site)
- **CPU**: 0.5 cores (shared)
- **Bandwidth**: Monitored automatically

### Free Tier Monitoring

```bash
# Check usage and health
node .railway-monitor.js check
node .railway-monitor.js health
```

### Maintenance Mode

When free-tier limits are reached:
1. Main service auto-pauses
2. `maintenance.html` deploys automatically
3. Coolify migration prep begins
4. Status logged for review

## 🔄 Fallback Architecture

```
Railway (Free) → Coolify (Self-hosted) → Maintenance Page
```

**Automatic triggers**:
- Railway free-tier exceeded
- Predicted usage above limit
- Manual migration decision

**Migration time**: ~4-6 hours (see [COOLIFY_MIGRATION.md](./COOLIFY_MIGRATION.md))

## 🧪 Testing

```bash
# Install dependencies
npm install

# Run linter
npm run lint

# Build project (validates TypeScript)
npm run build

# Test built application
npm run preview
```

## 📊 Monitoring

### Railway Dashboard
- Memory usage
- CPU usage
- Build minutes
- Network traffic

### Cost Monitor Script
```bash
node .railway-monitor.js check
```

### Health Checks
```bash
node .railway-monitor.js health
```

## 🔧 Troubleshooting

### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Environment Variables Not Working
```bash
# Check Railway variables
railway variables

# Verify variable names (must start with VITE_)
railway variables set VITE_SUPABASE_URL="your-url"
```

### App Shows Fallback Data
This is expected! The app gracefully falls back to static Mustang listings when Firecrawl API key is not configured.

To enable live scraping:
```bash
railway variables set VITE_FIRECRAWL_API_KEY="fc-your-key"
```

## 📖 Documentation

- [Railway Deployment Guide](./RAILWAY_DEPLOYMENT.md) - Complete Railway setup
- [Coolify Support](./COOLIFY_SUPPORT.md) - Self-hosted fallback configuration
- [Coolify Migration](./COOLIFY_MIGRATION.md) - Step-by-step migration checklist
- [Hostinger VPN Setup](./HOSTINGER_VPN.md) - VPN tunnel for Coolify access
- [Secrets Specification](./.agents) - Machine-readable secrets schema

## 🔐 Security Best Practices

✅ Never commit secrets to Git (enforced by `.gitignore`)  
✅ Use `master.secrets.json` locally only (`chmod 600`)  
✅ Rotate secrets regularly  
✅ Use different secrets for dev/staging/prod  
✅ Enable 2FA on all service accounts  
✅ Review Railway access logs regularly  

## 🤝 Contributing

This project uses Railway Zero-Secrets architecture. When contributing:

1. **Never commit secrets** - Use `.env.local` for development
2. **Test with fallback data** - App should work without Firecrawl API
3. **Maintain cost protection** - Don't increase resource requirements
4. **Document changes** - Update relevant documentation files

## 📄 License

See repository for license information.

## 🆘 Support

- **Railway Issues**: https://railway.app/help
- **Supabase Support**: https://supabase.com/support
- **Project Issues**: https://github.com/executiveusa/macs-agent-portal/issues
- **Lovable Support**: https://docs.lovable.dev

## 🎯 Success Criteria

Deployment is successful when:

✅ Build completes without errors  
✅ Application starts successfully  
✅ Public URL is accessible  
✅ Home page loads with content  
✅ Supabase connection works  
✅ Fallback listings display (if Firecrawl not configured)  
✅ No console errors  
✅ Health checks pass  
✅ Resource usage within free-tier limits  

---

**Project**: MACS Agent Portal  
**Status**: Production Ready  
**Deployment**: Railway Zero-Secrets Architecture  
**Cost Protection**: Active  
**Fallback Strategy**: Configured  

**Zero secrets in Git ✅ | First deploy succeeds ✅ | Cost protected ✅**
