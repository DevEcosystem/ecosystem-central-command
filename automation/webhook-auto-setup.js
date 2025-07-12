#!/usr/bin/env node

const { Octokit } = require('@octokit/rest');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

/**
 * Webhook Auto-Setup for Complete Automation
 * Automatically configures organization webhooks for repository events
 */
class WebhookAutoSetup {
  constructor() {
    this.github = new Octokit({
      auth: process.env.GITHUB_TOKEN || process.env.PERSONAL_GITHUB_TOKEN
    });
    
    this.organizations = ['DevBusinessHub', 'DevPersonalHub', 'DevAcademicHub', 'DevEcosystem'];
    this.webhookEndpoint = 'https://api.github.com/repos/DevEcosystem/ecosystem-central-command/dispatches';
    this.webhookSecret = process.env.WEBHOOK_SECRET || this.generateSecret();
    
    console.log('🔗 Webhook Auto-Setup System');
    console.log('============================');
  }

  /**
   * Generate a secure webhook secret
   */
  generateSecret() {
    return require('crypto').randomBytes(32).toString('hex');
  }

  /**
   * Setup webhooks for all organizations
   */
  async setupAllWebhooks() {
    console.log('\n🚀 Setting up webhooks for complete automation...\n');
    
    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    for (const org of this.organizations) {
      console.log(`\n📌 Processing ${org}...`);
      
      try {
        // Check if user has admin access to the organization
        const { data: membership } = await this.github.orgs.getMembershipForAuthenticatedUser({
          org: org
        }).catch(err => ({ data: null }));

        if (!membership || membership.role !== 'admin') {
          console.log(`  ⚠️ Skipped: No admin access to ${org}`);
          results.skipped.push({
            org: org,
            reason: 'No admin access'
          });
          continue;
        }

        // Check existing webhooks
        const { data: existingWebhooks } = await this.github.orgs.listWebhooks({
          org: org
        });

        // Check if our webhook already exists
        const existingWebhook = existingWebhooks.find(hook => 
          hook.config.url && hook.config.url.includes('ecosystem-central-command')
        );

        if (existingWebhook) {
          console.log(`  ✓ Webhook already exists (ID: ${existingWebhook.id})`);
          
          // Update webhook configuration to ensure it's correct
          await this.updateWebhook(org, existingWebhook.id);
          results.success.push({
            org: org,
            action: 'updated',
            webhookId: existingWebhook.id
          });
        } else {
          // Create new webhook
          const webhookId = await this.createWebhook(org);
          if (webhookId) {
            results.success.push({
              org: org,
              action: 'created',
              webhookId: webhookId
            });
          } else {
            results.failed.push({
              org: org,
              reason: 'Failed to create webhook'
            });
          }
        }

      } catch (error) {
        console.error(`  ❌ Error processing ${org}: ${error.message}`);
        results.failed.push({
          org: org,
          reason: error.message
        });
      }
    }

    // Generate report
    this.generateSetupReport(results);
    
    // Save webhook configuration
    await this.saveWebhookConfig(results);

    return results;
  }

  /**
   * Create organization webhook
   */
  async createWebhook(org) {
    try {
      console.log(`  🔄 Creating webhook for ${org}...`);
      
      const { data: webhook } = await this.github.orgs.createWebhook({
        org: org,
        name: 'web',
        active: true,
        events: [
          'repository',      // Repository created, deleted, archived, etc.
          'push',           // Code pushes
          'create',         // Branch/tag creation
          'delete'          // Branch/tag deletion
        ],
        config: {
          url: this.webhookEndpoint,
          content_type: 'json',
          secret: this.webhookSecret,
          insecure_ssl: '0'
        }
      });

      console.log(`  ✅ Webhook created successfully (ID: ${webhook.id})`);
      return webhook.id;

    } catch (error) {
      // If webhook endpoint doesn't work, try alternative approach
      if (error.status === 422) {
        console.log(`  🔄 Trying alternative webhook configuration...`);
        return await this.createAlternativeWebhook(org);
      }
      
      console.error(`  ❌ Failed to create webhook: ${error.message}`);
      return null;
    }
  }

  /**
   * Create alternative webhook using GitHub Actions workflow dispatch
   */
  async createAlternativeWebhook(org) {
    try {
      // Use a proxy webhook service or custom endpoint
      const alternativeUrl = process.env.WEBHOOK_PROXY_URL || 
        `https://ecosystem-webhook-proxy.vercel.app/webhook/${org}`;
      
      const { data: webhook } = await this.github.orgs.createWebhook({
        org: org,
        name: 'web',
        active: true,
        events: ['repository', 'push'],
        config: {
          url: alternativeUrl,
          content_type: 'json',
          secret: this.webhookSecret
        }
      });

      console.log(`  ✅ Alternative webhook created (ID: ${webhook.id})`);
      console.log(`  📝 Note: Configure proxy to forward to GitHub Actions`);
      
      return webhook.id;

    } catch (error) {
      console.error(`  ❌ Alternative webhook also failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Update existing webhook
   */
  async updateWebhook(org, webhookId) {
    try {
      await this.github.orgs.updateWebhook({
        org: org,
        hook_id: webhookId,
        active: true,
        events: ['repository', 'push', 'create', 'delete'],
        config: {
          url: this.webhookEndpoint,
          content_type: 'json',
          secret: this.webhookSecret
        }
      });

      console.log(`  ✅ Webhook updated successfully`);
      
    } catch (error) {
      console.log(`  ⚠️ Could not update webhook: ${error.message}`);
    }
  }

  /**
   * Generate setup report
   */
  generateSetupReport(results) {
    console.log('\n📊 Webhook Setup Report');
    console.log('======================\n');
    
    console.log(`✅ Success: ${results.success.length} organizations`);
    results.success.forEach(item => {
      console.log(`   - ${item.org}: ${item.action} (ID: ${item.webhookId})`);
    });
    
    if (results.failed.length > 0) {
      console.log(`\n❌ Failed: ${results.failed.length} organizations`);
      results.failed.forEach(item => {
        console.log(`   - ${item.org}: ${item.reason}`);
      });
    }
    
    if (results.skipped.length > 0) {
      console.log(`\n⚠️ Skipped: ${results.skipped.length} organizations`);
      results.skipped.forEach(item => {
        console.log(`   - ${item.org}: ${item.reason}`);
      });
    }

    console.log('\n📝 Next Steps:');
    console.log('1. Webhooks are now configured for automatic updates');
    console.log('2. New repositories will trigger ecosystem sync automatically');
    console.log('3. No manual intervention required!');
    
    if (results.failed.length > 0 || results.skipped.length > 0) {
      console.log('\n⚠️ Manual Setup Required:');
      console.log('For organizations without webhooks, you need admin access.');
      console.log('Visit: Organization Settings → Webhooks → Add webhook');
    }
  }

  /**
   * Save webhook configuration
   */
  async saveWebhookConfig(results) {
    const configPath = path.join(__dirname, '..', 'docs', 'webhook-config.json');
    
    const config = {
      generated_at: new Date().toISOString(),
      webhook_secret: this.webhookSecret,
      organizations: {},
      setup_results: results
    };

    results.success.forEach(item => {
      config.organizations[item.org] = {
        webhook_id: item.webhookId,
        status: 'active',
        action: item.action,
        last_updated: new Date().toISOString()
      };
    });

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`\n💾 Configuration saved to: ${configPath}`);
    
    // Update environment file if needed
    await this.updateEnvFile();
  }

  /**
   * Update .env file with webhook secret
   */
  async updateEnvFile() {
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = `# Ecosystem Automation Configuration
WEBHOOK_SECRET=${this.webhookSecret}
# Add your GitHub Personal Access Token here:
# GITHUB_TOKEN=ghp_your_token_here
`;

    if (!fs.existsSync(envPath)) {
      fs.writeFileSync(envPath, envContent);
      console.log('📝 Created .env file with webhook secret');
    }
  }

  /**
   * Interactive setup wizard
   */
  async interactiveSetup() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\n🔧 Webhook Setup Wizard');
    console.log('=======================\n');
    
    return new Promise((resolve) => {
      rl.question('Do you want to set up webhooks for all organizations? (y/n): ', async (answer) => {
        rl.close();
        
        if (answer.toLowerCase() === 'y') {
          await this.setupAllWebhooks();
        } else {
          console.log('Setup cancelled.');
        }
        
        resolve();
      });
    });
  }
}

/**
 * GitHub Actions Workflow Dispatcher
 * Triggers ecosystem sync from webhook events
 */
class WorkflowDispatcher {
  constructor() {
    this.github = new Octokit({
      auth: process.env.GITHUB_TOKEN || process.env.PERSONAL_GITHUB_TOKEN
    });
  }

  /**
   * Trigger workflow via API
   */
  async triggerWorkflow(eventType, payload) {
    try {
      await this.github.repos.createDispatchEvent({
        owner: 'DevEcosystem',
        repo: 'ecosystem-central-command',
        event_type: eventType,
        client_payload: payload
      });
      
      console.log(`✅ Workflow triggered: ${eventType}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to trigger workflow: ${error.message}`);
      return false;
    }
  }
}

// CLI execution
if (require.main === module) {
  const setup = new WebhookAutoSetup();
  
  // Check for command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--auto') || args.includes('-a')) {
    // Automatic setup without prompts
    setup.setupAllWebhooks().then(() => {
      console.log('\n✅ Webhook auto-setup completed!');
      process.exit(0);
    }).catch(error => {
      console.error('\n❌ Setup failed:', error.message);
      process.exit(1);
    });
  } else if (args.includes('--trigger-test')) {
    // Test workflow trigger
    const dispatcher = new WorkflowDispatcher();
    dispatcher.triggerWorkflow('repository-created', {
      repository: 'test-repo',
      organization: 'DevBusinessHub'
    });
  } else {
    // Interactive setup
    setup.interactiveSetup().then(() => {
      process.exit(0);
    });
  }
}

module.exports = { WebhookAutoSetup, WorkflowDispatcher };