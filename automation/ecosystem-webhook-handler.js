#!/usr/bin/env node

const express = require('express');
const crypto = require('crypto');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Ecosystem Webhook Handler
 * Real-time integration of new repositories via GitHub webhooks
 */
class EcosystemWebhookHandler {
  constructor() {
    this.app = express();
    this.port = process.env.WEBHOOK_PORT || 3000;
    this.secret = process.env.WEBHOOK_SECRET || 'ecosystem-webhook-secret';
    this.baseDir = path.dirname(__dirname);
    
    // Configure middleware
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Setup routes
    this.setupRoutes();
    
    console.log('🔗 Ecosystem Webhook Handler initialized');
    console.log(`📡 Listening on port ${this.port}`);
  }

  /**
   * Setup webhook routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        service: 'ecosystem-webhook-handler',
        timestamp: new Date().toISOString()
      });
    });

    // Main webhook endpoint
    this.app.post('/webhook', (req, res) => {
      this.handleWebhook(req, res);
    });

    // Manual trigger endpoint
    this.app.post('/trigger-sync', (req, res) => {
      this.triggerManualSync(req, res);
    });

    // Status endpoint
    this.app.get('/status', (req, res) => {
      this.getSystemStatus(req, res);
    });
  }

  /**
   * Handle incoming webhook
   */
  async handleWebhook(req, res) {
    try {
      // Verify webhook signature
      if (!this.verifySignature(req)) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const payload = req.body;
      const event = req.headers['x-github-event'];
      
      console.log(`🔔 Webhook received: ${event}`);
      
      // Process different event types
      let shouldSync = false;
      let triggerReason = '';

      switch (event) {
        case 'repository':
          shouldSync = await this.handleRepositoryEvent(payload);
          triggerReason = `Repository ${payload.action}: ${payload.repository.full_name}`;
          break;
          
        case 'push':
          shouldSync = await this.handlePushEvent(payload);
          triggerReason = `Push to ${payload.repository.full_name}`;
          break;
          
        case 'create':
          shouldSync = await this.handleCreateEvent(payload);
          triggerReason = `Created ${payload.ref_type}: ${payload.ref}`;
          break;
          
        case 'delete':
          shouldSync = await this.handleDeleteEvent(payload);
          triggerReason = `Deleted ${payload.ref_type}: ${payload.ref}`;
          break;
          
        default:
          console.log(`  ℹ️ Event ${event} not handled`);
      }

      if (shouldSync) {
        console.log(`🚀 Triggering ecosystem sync: ${triggerReason}`);
        
        // Trigger async sync (don't wait for completion)
        this.triggerEcosystemSync(triggerReason)
          .catch(error => {
            console.error('❌ Sync trigger failed:', error.message);
          });
        
        res.json({ 
          status: 'accepted', 
          message: 'Ecosystem sync triggered',
          reason: triggerReason
        });
      } else {
        res.json({ 
          status: 'ignored', 
          message: 'Event does not require ecosystem sync' 
        });
      }

    } catch (error) {
      console.error('❌ Webhook processing failed:', error.message);
      res.status(500).json({ 
        error: 'Webhook processing failed',
        message: error.message 
      });
    }
  }

  /**
   * Verify GitHub webhook signature
   */
  verifySignature(req) {
    const signature = req.headers['x-hub-signature-256'];
    
    if (!signature) {
      console.warn('⚠️ No signature provided');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    const expectedHeader = `sha256=${expectedSignature}`;
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedHeader)
    );
  }

  /**
   * Handle repository events (created, deleted, etc.)
   */
  async handleRepositoryEvent(payload) {
    const { action, repository } = payload;
    
    console.log(`  📁 Repository ${action}: ${repository.full_name}`);
    
    // Check if repository is in our organizations
    const targetOrgs = ['DevEcosystem', 'DevPersonalHub', 'DevAcademicHub', 'DevBusinessHub'];
    const isTargetOrg = targetOrgs.includes(repository.owner.login);
    
    if (!isTargetOrg) {
      console.log(`  ℹ️ Repository not in target organizations`);
      return false;
    }

    // Actions that require sync
    const syncActions = ['created', 'deleted', 'transferred', 'renamed'];
    
    if (syncActions.includes(action)) {
      return true;
    }

    return false;
  }

  /**
   * Handle push events
   */
  async handlePushEvent(payload) {
    const { repository, ref } = payload;
    
    // Only sync for main/master branch pushes in target organizations
    const targetOrgs = ['DevEcosystem', 'DevPersonalHub', 'DevAcademicHub', 'DevBusinessHub'];
    const isTargetOrg = targetOrgs.includes(repository.owner.login);
    const isMainBranch = ref === 'refs/heads/main' || ref === 'refs/heads/master';
    
    if (isTargetOrg && isMainBranch) {
      console.log(`  📝 Main branch updated: ${repository.full_name}`);
      return true;
    }

    return false;
  }

  /**
   * Handle create events (branches, tags)
   */
  async handleCreateEvent(payload) {
    const { ref_type, repository } = payload;
    
    // Sync when new repositories are created
    if (ref_type === 'repository') {
      const targetOrgs = ['DevEcosystem', 'DevPersonalHub', 'DevAcademicHub', 'DevBusinessHub'];
      return targetOrgs.includes(repository.owner.login);
    }

    return false;
  }

  /**
   * Handle delete events
   */
  async handleDeleteEvent(payload) {
    const { ref_type, repository } = payload;
    
    // Sync when repositories are deleted
    if (ref_type === 'repository') {
      const targetOrgs = ['DevEcosystem', 'DevPersonalHub', 'DevAcademicHub', 'DevBusinessHub'];
      return targetOrgs.includes(repository.owner.login);
    }

    return false;
  }

  /**
   * Trigger ecosystem sync
   */
  async triggerEcosystemSync(reason) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      trigger: 'webhook',
      reason: reason,
      status: 'started'
    };

    console.log('🔄 Starting ecosystem sync...');

    try {
      // Run ecosystem auto-sync
      const result = execSync('node automation/ecosystem-auto-sync.js', {
        cwd: this.baseDir,
        encoding: 'utf8',
        timeout: 300000, // 5 minute timeout
        env: {
          ...process.env,
          WEBHOOK_TRIGGER: 'true',
          TRIGGER_REASON: reason
        }
      });

      logEntry.status = 'completed';
      logEntry.output = result;
      
      console.log('✅ Ecosystem sync completed successfully');
      
    } catch (error) {
      logEntry.status = 'failed';
      logEntry.error = error.message;
      
      console.error('❌ Ecosystem sync failed:', error.message);
      throw error;
      
    } finally {
      // Log the sync attempt
      this.logSyncAttempt(logEntry);
    }
  }

  /**
   * Handle manual sync trigger
   */
  async triggerManualSync(req, res) {
    try {
      const { reason = 'Manual trigger via API' } = req.body;
      
      console.log(`🚀 Manual sync triggered: ${reason}`);
      
      // Start sync asynchronously
      this.triggerEcosystemSync(reason)
        .then(() => {
          console.log('✅ Manual sync completed');
        })
        .catch(error => {
          console.error('❌ Manual sync failed:', error.message);
        });

      res.json({
        status: 'accepted',
        message: 'Manual ecosystem sync triggered',
        reason: reason
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to trigger manual sync',
        message: error.message
      });
    }
  }

  /**
   * Get system status
   */
  async getSystemStatus(req, res) {
    try {
      const statusPath = path.join(this.baseDir, 'docs', 'logs', 'ecosystem-sync-results.json');
      
      let lastSync = null;
      if (fs.existsSync(statusPath)) {
        const syncResults = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
        lastSync = {
          timestamp: syncResults.completed_at || syncResults.started_at,
          success: syncResults.success,
          duration: syncResults.completed_at && syncResults.started_at ? 
            new Date(syncResults.completed_at) - new Date(syncResults.started_at) : null
        };
      }

      const status = {
        service: 'ecosystem-webhook-handler',
        status: 'running',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        last_sync: lastSync,
        timestamp: new Date().toISOString()
      };

      res.json(status);

    } catch (error) {
      res.status(500).json({
        error: 'Failed to get system status',
        message: error.message
      });
    }
  }

  /**
   * Log sync attempts
   */
  logSyncAttempt(logEntry) {
    const logPath = path.join(this.baseDir, 'docs', 'logs', 'webhook-sync.log');
    
    // Ensure logs directory exists
    const logsDir = path.dirname(logPath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(logPath, logLine);
  }

  /**
   * Start the webhook server
   */
  start() {
    this.app.listen(this.port, () => {
      console.log(`🚀 Ecosystem Webhook Handler running on port ${this.port}`);
      console.log(`📡 Webhook endpoint: http://localhost:${this.port}/webhook`);
      console.log(`🏥 Health check: http://localhost:${this.port}/health`);
    });
  }

  /**
   * Graceful shutdown
   */
  setupGracefulShutdown() {
    process.on('SIGTERM', () => {
      console.log('🛑 Received SIGTERM, shutting down gracefully');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('🛑 Received SIGINT, shutting down gracefully');
      process.exit(0);
    });
  }
}

// CLI execution
if (require.main === module) {
  const handler = new EcosystemWebhookHandler();
  handler.setupGracefulShutdown();
  handler.start();
}

module.exports = EcosystemWebhookHandler;