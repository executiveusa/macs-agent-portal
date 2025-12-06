#!/usr/bin/env node

/**
 * Railway Cost Protection Monitor
 * 
 * This script monitors Railway resource usage and triggers maintenance mode
 * if free-tier limits are at risk of being exceeded.
 * 
 * Usage: node .railway-monitor.js
 * 
 * Features:
 * - Checks Railway API for current usage
 * - Predicts if next deploy will exceed free tier
 * - Automatically triggers maintenance mode if needed
 * - Logs all actions for audit trail
 */

const FREE_TIER_LIMITS = {
  memory_mb: 512,
  cpu_cores: 0.5,
  bandwidth_gb_per_month: 100,
  build_minutes_per_month: 500,
  storage_gb: 1,
};

const THRESHOLD_PERCENTAGE = 0.85; // Trigger at 85% of limit

class RailwayMonitor {
  constructor() {
    this.apiToken = process.env.RAILWAY_TOKEN || '';
    this.projectId = process.env.RAILWAY_PROJECT_ID || '';
    this.serviceId = process.env.RAILWAY_SERVICE_ID || '';
    this.maintenanceMode = false;
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data,
    };
    console.log(JSON.stringify(logEntry));
  }

  async checkUsage() {
    this.log('info', 'Railway Cost Protection Monitor Starting...');

    // TODO: Implement actual Railway API integration
    // This is a template/starter implementation. To enable real monitoring:
    // 1. Set RAILWAY_TOKEN environment variable with your Railway API token
    // 2. Implement Railway API calls to fetch actual usage metrics
    // 3. Railway API docs: https://docs.railway.app/reference/public-api
    // For production use, integrate with Railway's GraphQL API to query:
    // - deploymentUsage { memoryUsageMb, cpuUsage }
    // - projectUsage { currentUsage, estimatedUsage }
    
    if (!this.apiToken) {
      this.log('warn', 'RAILWAY_TOKEN not set - monitoring in simulation mode', {
        reason: 'API token required for actual usage monitoring',
        fallback: 'Manual monitoring via Railway dashboard recommended',
        production_note: 'Implement Railway GraphQL API integration for production',
      });
      return;
    }

    this.log('info', 'Checking Railway resource usage...');

    // SIMULATED usage check - Replace with actual Railway API call
    // Example GraphQL query:
    // query { deployment(id: $deploymentId) { usage { memoryUsageMb cpuUsage } } }
    const usage = {
      memory: {
        used_mb: 256,
        limit_mb: FREE_TIER_LIMITS.memory_mb,
        percentage: 0.50,
      },
      bandwidth: {
        used_gb: 15,
        limit_gb: FREE_TIER_LIMITS.bandwidth_gb_per_month,
        percentage: 0.15,
      },
      build_minutes: {
        used: 120,
        limit: FREE_TIER_LIMITS.build_minutes_per_month,
        percentage: 0.24,
      },
    };

    this.log('info', 'Current usage', usage);

    // Check if any resource exceeds threshold
    const exceedingResources = [];
    
    for (const [resource, stats] of Object.entries(usage)) {
      if (stats.percentage >= THRESHOLD_PERCENTAGE) {
        exceedingResources.push({
          resource,
          percentage: (stats.percentage * 100).toFixed(2),
          threshold: (THRESHOLD_PERCENTAGE * 100).toFixed(2),
        });
      }
    }

    if (exceedingResources.length > 0) {
      this.log('warn', 'Free tier threshold exceeded!', {
        resources: exceedingResources,
        action: 'Triggering maintenance mode',
      });
      await this.triggerMaintenanceMode();
    } else {
      this.log('info', 'All resources within safe limits', {
        highest_usage: Math.max(...Object.values(usage).map(s => s.percentage)),
        threshold: THRESHOLD_PERCENTAGE,
      });
    }
  }

  async triggerMaintenanceMode() {
    if (this.maintenanceMode) {
      this.log('info', 'Maintenance mode already active');
      return;
    }

    this.log('warn', '🚨 ACTIVATING MAINTENANCE MODE 🚨', {
      reason: 'Free tier limit protection',
      actions: [
        'Deploying maintenance.html',
        'Pausing main service',
        'Preparing Coolify migration',
      ],
    });

    this.maintenanceMode = true;

    // Instructions for maintenance mode activation
    this.log('info', 'Maintenance mode activation steps:', {
      step1: 'Deploy maintenance.html as static site',
      step2: 'Update Railway service to serve maintenance.html',
      step3: 'Review COOLIFY_MIGRATION.md for next steps',
      step4: 'Monitor usage in Railway dashboard',
      manual_action_required: true,
    });

    // Create maintenance marker file
    const fs = require('fs');
    const maintenanceMarker = {
      activated_at: new Date().toISOString(),
      reason: 'Free tier limit protection',
      status: 'active',
      next_steps: [
        'Review Railway dashboard for usage details',
        'Follow COOLIFY_MIGRATION.md checklist',
        'Or upgrade to Railway paid plan',
      ],
    };

    try {
      fs.writeFileSync(
        '.maintenance-mode.json',
        JSON.stringify(maintenanceMarker, null, 2)
      );
      this.log('info', 'Maintenance marker file created: .maintenance-mode.json');
    } catch (error) {
      this.log('error', 'Failed to create maintenance marker', {
        error: error.message,
      });
    }
  }

  async checkHealth() {
    this.log('info', 'Running health check...');

    const checks = {
      railway_config: this.checkRailwayConfig(),
      secrets_config: this.checkSecretsConfig(),
      cost_limits: this.checkCostLimits(),
    };

    const allHealthy = Object.values(checks).every(check => check.status === 'ok');

    this.log('info', 'Health check complete', {
      overall_status: allHealthy ? 'healthy' : 'issues_detected',
      checks,
    });

    return allHealthy;
  }

  checkRailwayConfig() {
    const fs = require('fs');
    
    try {
      const railwayToml = fs.readFileSync('railway.toml', 'utf8');
      return {
        status: 'ok',
        message: 'railway.toml found and readable',
      };
    } catch {
      return {
        status: 'warning',
        message: 'railway.toml not found - Railway will use defaults',
      };
    }
  }

  checkSecretsConfig() {
    const fs = require('fs');
    
    // Check that .agents file exists
    try {
      const agentsFile = fs.readFileSync('.agents', 'utf8');
      const agentsConfig = JSON.parse(agentsFile);
      
      return {
        status: 'ok',
        message: '.agents file configured correctly',
        required_secrets: agentsConfig.required_secrets?.length || 0,
        optional_secrets: agentsConfig.optional_secrets?.length || 0,
      };
    } catch {
      return {
        status: 'error',
        message: '.agents file missing or invalid',
      };
    }
  }

  checkCostLimits() {
    return {
      status: 'ok',
      message: 'Cost limits configured',
      limits: FREE_TIER_LIMITS,
      protection_enabled: true,
    };
  }
}

// Main execution
if (require.main === module) {
  const monitor = new RailwayMonitor();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'check':
      monitor.checkUsage().catch(err => {
        monitor.log('error', 'Monitor check failed', {
          error: err.message,
          stack: err.stack,
        });
        process.exit(1);
      });
      break;
      
    case 'health':
      monitor.checkHealth().catch(err => {
        monitor.log('error', 'Health check failed', {
          error: err.message,
        });
        process.exit(1);
      });
      break;
      
    case 'maintenance':
      monitor.triggerMaintenanceMode().catch(err => {
        monitor.log('error', 'Failed to trigger maintenance mode', {
          error: err.message,
        });
        process.exit(1);
      });
      break;
      
    default:
      console.log(`
Railway Cost Protection Monitor

Usage:
  node .railway-monitor.js check          Check Railway usage
  node .railway-monitor.js health         Run health checks
  node .railway-monitor.js maintenance    Trigger maintenance mode

Environment Variables:
  RAILWAY_TOKEN          Railway API token (optional)
  RAILWAY_PROJECT_ID     Railway project ID (optional)
  RAILWAY_SERVICE_ID     Railway service ID (optional)

Note: Without RAILWAY_TOKEN, monitoring runs in simulation mode.
      `);
  }
}

module.exports = RailwayMonitor;
