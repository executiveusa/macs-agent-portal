# Coolify Migration Checklist

This document provides a step-by-step migration guide for moving MACS Agent Portal from Railway to Coolify.

## Migration Trigger Conditions

This migration should be initiated when:

- [ ] Railway free-tier resource limits are exceeded
- [ ] Predicted usage will exceed free-tier in next billing cycle
- [ ] Cost optimization is required
- [ ] Manual migration decision is made
- [ ] Maintenance mode is automatically triggered

## Pre-Migration Phase

### 1. Environment Assessment

- [ ] Review current Railway deployment status
- [ ] Check resource usage patterns (CPU, memory, bandwidth)
- [ ] Identify peak traffic times
- [ ] Document current performance metrics
- [ ] Review error logs from past 30 days

### 2. Coolify Infrastructure Preparation

- [ ] Confirm Coolify server is accessible
- [ ] Verify Coolify version is up to date
- [ ] Check available server resources (disk, RAM, CPU)
- [ ] Ensure Hostinger VPN tunnel is operational
- [ ] Test VPN connectivity from deployment machine
- [ ] Confirm Docker is installed and running on Coolify server

### 3. DNS and Domain Setup

- [ ] Identify current production domain
- [ ] Prepare new subdomain or domain for Coolify
- [ ] Create DNS records (A record pointing to Coolify server)
- [ ] Set initial TTL to low value (300s) for quick updates
- [ ] Verify DNS propagation

### 4. Secrets and Configuration

- [ ] Locate `master.secrets.json` file locally
- [ ] Verify all secrets are current and valid
- [ ] Test Supabase connection with existing credentials
- [ ] Test Firecrawl API (if configured)
- [ ] Document any additional environment-specific variables
- [ ] Prepare secrets for Coolify import

## Migration Execution Phase

### 5. Coolify Application Setup

- [ ] Log in to Coolify dashboard via VPN
- [ ] Create new project: "macs-agent-portal"
- [ ] Connect Git repository
  - Repository: `https://github.com/executiveusa/macs-agent-portal`
  - Branch: `main`
  - Type: Static Site with Node.js buildpack
- [ ] Configure build settings:
  - Build Command: `npm install && npm run build`
  - Start Command: `npx serve -s dist -l $PORT`
  - Output Directory: `dist`
  - Install Command: `npm install`

### 6. Environment Variables Configuration

- [ ] Import core Supabase variables:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_PUBLISHABLE_KEY`
  - [ ] `VITE_SUPABASE_PROJECT_ID`
- [ ] Import optional Firecrawl variables (if used):
  - [ ] `VITE_FIRECRAWL_API_KEY`
  - [ ] `VITE_FIRECRAWL_BASE_URL`
- [ ] Set system variables:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=8080`
- [ ] Verify all variables are correctly entered (no typos)
- [ ] Save configuration

### 7. Initial Deployment Test

- [ ] Trigger first deployment in Coolify
- [ ] Monitor build logs for errors
- [ ] Check for successful build completion
- [ ] Verify deployment starts successfully
- [ ] Access application via Coolify-provided URL (through VPN)
- [ ] Test core functionality:
  - [ ] Home page loads
  - [ ] Supabase connection works
  - [ ] Authentication (if applicable)
  - [ ] Mustang listings load (with or without Firecrawl)
- [ ] Check browser console for errors
- [ ] Review application logs in Coolify

### 8. Resource Configuration

- [ ] Set resource limits:
  - [ ] Memory: 512MB minimum
  - [ ] CPU: 0.5 cores minimum
  - [ ] Disk: 1GB minimum
- [ ] Configure scaling rules (if supported)
- [ ] Set restart policy: "On Failure"
- [ ] Configure health check:
  - [ ] Path: `/`
  - [ ] Interval: 30s
  - [ ] Timeout: 10s
  - [ ] Retries: 3

### 9. SSL and Domain Configuration

- [ ] Configure custom domain in Coolify
- [ ] Enable SSL certificate auto-generation
- [ ] Verify HTTPS is working
- [ ] Test domain accessibility via VPN
- [ ] Force HTTPS redirect if needed

## Traffic Cutover Phase

### 10. Parallel Running Period

- [ ] Keep Railway deployment active (maintenance mode)
- [ ] Run Coolify deployment for 24-48 hours
- [ ] Monitor Coolify performance metrics
- [ ] Compare performance with Railway
- [ ] Check for any edge case issues
- [ ] Verify all features work identically

### 11. DNS Cutover

- [ ] Update production DNS to point to Coolify server
- [ ] Wait for DNS propagation (check with `nslookup`)
- [ ] Monitor traffic shifting to Coolify
- [ ] Keep Railway instance running for 24 hours as backup
- [ ] Monitor error rates during cutover

### 12. Railway Cleanup

- [ ] Confirm 100% of traffic is on Coolify
- [ ] Take final backup of Railway configuration
- [ ] Export all Railway environment variables
- [ ] Save Railway deployment logs
- [ ] Put Railway service in maintenance mode (keep deployed)
- [ ] Document Railway project ID for future reference
- [ ] Consider keeping Railway project as emergency fallback

## Post-Migration Phase

### 13. Monitoring and Validation

- [ ] Monitor application for 7 days post-migration
- [ ] Track error rates and compare to pre-migration
- [ ] Verify resource usage is within expected limits
- [ ] Check application performance (page load times)
- [ ] Review user feedback (if applicable)
- [ ] Monitor costs on Coolify server

### 14. Documentation Updates

- [ ] Update README.md with new deployment information
- [ ] Update internal documentation
- [ ] Document any issues encountered during migration
- [ ] Update `master.secrets.json` with Coolify deployment info
- [ ] Create runbook for Coolify operations
- [ ] Share migration results with team

### 15. Optimization

- [ ] Review and optimize Docker configuration (if used)
- [ ] Set up log rotation
- [ ] Configure automatic backups
- [ ] Optimize resource usage based on actual metrics
- [ ] Set up uptime monitoring (e.g., UptimeRobot, Pingdom)
- [ ] Configure alerts for downtime or errors

### 16. Rollback Plan (If Needed)

- [ ] Keep Railway deployment available for 30 days
- [ ] Document rollback procedure:
  1. [ ] Update DNS back to Railway
  2. [ ] Restart Railway service
  3. [ ] Verify Railway is operational
  4. [ ] Monitor for 24 hours
  5. [ ] Debug Coolify issues
- [ ] Test rollback procedure (optional but recommended)

## Success Criteria

The migration is considered successful when:

- ✅ Application is accessible via production domain through VPN
- ✅ All core features work identically to Railway deployment
- ✅ No increase in error rates compared to Railway
- ✅ Performance is equal to or better than Railway
- ✅ Resource usage is within server limits
- ✅ SSL certificate is valid and auto-renewing
- ✅ Health checks are passing consistently
- ✅ Logs are accessible and readable
- ✅ Team has access to Coolify dashboard
- ✅ Documentation is updated and accurate

## Common Issues and Solutions

### Issue: Build Fails

**Symptoms**: Deployment fails during npm install or build
**Solutions**:
- Check Node.js version compatibility
- Verify package.json integrity
- Clear build cache in Coolify
- Check available disk space on server
- Review build logs for specific errors

### Issue: Application Won't Start

**Symptoms**: Build succeeds but application doesn't start
**Solutions**:
- Verify start command is correct
- Check PORT environment variable
- Review application logs
- Ensure all required environment variables are set
- Test start command locally

### Issue: VPN Connectivity Problems

**Symptoms**: Cannot access Coolify dashboard
**Solutions**:
- Restart VPN connection
- Verify VPN credentials
- Check Hostinger server status
- Test with different VPN client
- Contact Hostinger support

### Issue: SSL Certificate Not Working

**Symptoms**: HTTPS shows certificate error
**Solutions**:
- Verify domain DNS is correct
- Check domain ownership verification
- Wait for Let's Encrypt rate limit reset
- Manually trigger certificate generation in Coolify
- Check firewall allows ports 80 and 443

### Issue: Performance Degradation

**Symptoms**: Application slower than on Railway
**Solutions**:
- Increase memory allocation
- Optimize build output
- Enable caching in Nginx
- Check server resource usage
- Consider upgrading Coolify server

## Emergency Contacts

- **Coolify Support**: https://github.com/coollabsio/coolify/discussions
- **Hostinger Support**: https://www.hostinger.com/contact
- **Supabase Support**: https://supabase.com/support
- **Team Lead**: [Add contact information]

## Migration Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Pre-Migration | 2-4 hours | ⏳ Not Started |
| Setup & Configuration | 2-3 hours | ⏳ Not Started |
| Testing | 1-2 days | ⏳ Not Started |
| Traffic Cutover | 2-4 hours | ⏳ Not Started |
| Monitoring | 7 days | ⏳ Not Started |

**Total Estimated Time**: 10-14 days (including monitoring)

## Notes

- Keep Railway deployment as fallback for at least 30 days
- Take screenshots of Railway configuration before migration
- Test thoroughly before DNS cutover
- Have team member on standby during cutover
- Schedule migration during low-traffic period
- Communicate migration to users if applicable

## Approval

- [ ] Migration plan reviewed by: _______________
- [ ] Approval date: _______________
- [ ] Rollback plan approved by: _______________
- [ ] Team notified of migration window: _______________

---

**Status**: Ready for execution when triggered  
**Last Updated**: 2025-12-06  
**Next Review**: Before migration execution

## Post-Migration Checklist

After successful migration:

- [ ] Archive this document with completion notes
- [ ] Update deployment procedures
- [ ] Train team on Coolify operations
- [ ] Schedule 30-day review meeting
- [ ] Consider decommissioning Railway project (after 30 days)
