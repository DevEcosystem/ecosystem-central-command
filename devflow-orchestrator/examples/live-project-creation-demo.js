/**
 * @fileoverview Live Project Creation Demo - Creates actual GitHub Projects V2
 * @version 1.0.0
 * @author DevEcosystem
 * 
 * This demo creates real GitHub Projects V2 using the DevFlow Orchestrator automation system.
 * After running this demo, you will see actual projects in your GitHub Projects dashboard.
 * 
 * WARNING: This creates real projects in your GitHub account/organizations.
 * Make sure you have the necessary permissions and want to create these projects.
 */

import { EventEmitter } from 'events';
import { ConfigManager } from '../config/config-manager.js';
import { ProjectAutomationService } from '../core/project-automation.js';
import { validateEnv } from '../config/validation.js';
import { Logger } from '../utils/logger.js';

/**
 * Live Project Creation Demo
 * Creates actual GitHub Projects V2 for demonstration and testing
 */
class LiveProjectCreationDemo extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      dryRun: options.dryRun || false,
      createRealProjects: options.createRealProjects || false,
      organizationsToDemo: options.organizationsToDemo || ['DevBusinessHub', 'DevPersonalHub'],
      delayBetweenCreations: options.delayBetweenCreations || 2000,
      ...options
    };
    
    this.logger = null;
    this.config = null;
    this.projectAutomation = null;
    this.results = [];
  }

  /**
   * Initialize the demo
   */
  async initialize() {
    try {
      console.log('🚀 DevFlow Orchestrator - Live Project Creation Demo\n');
      
      if (this.options.dryRun) {
        console.log('⚠️  DRY RUN MODE - No actual projects will be created\n');
      } else {
        console.log('🔴 LIVE MODE - Real GitHub Projects V2 will be created\n');
        
        if (!this.options.createRealProjects) {
          console.log('❌ Live mode requires explicit confirmation.');
          console.log('   Set createRealProjects: true to proceed with actual project creation.\n');
          process.exit(1);
        }
      }
      
      // Step 1: Validate environment
      await this._validateEnvironment();
      
      // Step 2: Initialize configuration
      await this._initializeConfiguration();
      
      // Step 3: Initialize project automation
      await this._initializeProjectAutomation();
      
      console.log('✅ Demo initialization completed successfully\n');
      
    } catch (error) {
      console.error('❌ Demo initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Run the project creation demo
   */
  async runDemo() {
    try {
      console.log('📋 Starting project creation demonstration...\n');
      
      // Demo 1: Create individual projects for each organization
      await this._demonstrateIndividualProjectCreation();
      
      // Demo 2: Create multiple projects in bulk
      await this._demonstrateBulkProjectCreation();
      
      // Demo 3: Show created projects summary
      await this._showCreatedProjectsSummary();
      
      console.log('🎉 Demo completed successfully!\n');
      
      if (!this.options.dryRun) {
        console.log('🔗 Check your GitHub Projects dashboard to see the created projects:');
        for (const orgId of this.options.organizationsToDemo) {
          console.log(`   https://github.com/orgs/${orgId}/projects`);
        }
        console.log();
      }
      
    } catch (error) {
      console.error('❌ Demo execution failed:', error.message);
      throw error;
    }
  }

  /**
   * Demonstrate individual project creation for each organization
   * @private
   */
  async _demonstrateIndividualProjectCreation() {
    console.log('📊 Demonstration 1: Individual Project Creation\n');
    
    for (const organizationId of this.options.organizationsToDemo) {
      try {
        console.log(`🏢 Creating project for ${organizationId}...`);
        
        if (this.options.dryRun) {
          console.log(`   📋 DRY RUN: Would create project for ${organizationId}`);
          this._simulateProjectCreation(organizationId);
        } else {
          const result = await this.projectAutomation.createDemoProject(organizationId, {
            projectName: `DevFlow Demo - ${organizationId}`,
            description: `Demo project showcasing ${organizationId} organization template and automation capabilities`
          });
          
          this.results.push(result);
          
          console.log(`   ✅ Project created: ${result.project.title}`);
          console.log(`   📋 Template: ${result.template}`);
          console.log(`   📊 Fields: ${result.fieldsCreated}, Views: ${result.viewsCreated}`);
          console.log(`   🔗 URL: ${result.project.url}`);
        }
        
        console.log();
        
        // Add delay between creations
        if (this.options.delayBetweenCreations > 0) {
          await this._delay(this.options.delayBetweenCreations);
        }
        
      } catch (error) {
        console.error(`   ❌ Failed to create project for ${organizationId}: ${error.message}`);
      }
    }
  }

  /**
   * Demonstrate bulk project creation
   * @private
   */
  async _demonstrateBulkProjectCreation() {
    console.log('📊 Demonstration 2: Bulk Project Creation\n');
    
    const repositories = [
      {
        name: 'devflow-demo-business-app',
        owner: 'DevBusinessHub',
        description: 'Demo business application with production workflows'
      },
      {
        name: 'devflow-demo-personal-experiment',
        owner: 'DevPersonalHub',
        description: 'Demo personal project for experimentation'
      },
      {
        name: 'devflow-demo-academic-research',
        owner: 'DevAcademicHub',
        description: 'Demo academic research project'
      }
    ];
    
    if (this.options.dryRun) {
      console.log('📋 DRY RUN: Would create projects for multiple repositories:');
      repositories.forEach(repo => {
        console.log(`   - ${repo.owner}/${repo.name}`);
      });
      console.log();
      return;
    }
    
    try {
      console.log('🚀 Creating projects for multiple repositories...');
      
      const bulkResult = await this.projectAutomation.createProjectsForRepositories(repositories, {
        delayBetweenCreations: this.options.delayBetweenCreations,
        linkRepository: false // Demo repositories don't exist
      });
      
      console.log(`✅ Bulk creation completed:`);
      console.log(`   📊 Total: ${bulkResult.summary.total}`);
      console.log(`   ✅ Successful: ${bulkResult.summary.successful}`);
      console.log(`   ❌ Failed: ${bulkResult.summary.failed}`);
      console.log(`   📈 Success Rate: ${bulkResult.summary.successRate.toFixed(1)}%`);
      console.log();
      
      // Add successful results to our collection
      this.results.push(...bulkResult.results);
      
      // Show any errors
      if (bulkResult.errors.length > 0) {
        console.log('❌ Bulk creation errors:');
        bulkResult.errors.forEach(error => {
          console.log(`   - ${error.repository}: ${error.error}`);
        });
        console.log();
      }
      
    } catch (error) {
      console.error(`❌ Bulk project creation failed: ${error.message}`);
    }
  }

  /**
   * Show summary of all created projects
   * @private
   */
  async _showCreatedProjectsSummary() {
    console.log('📊 Demo Results Summary\n');
    
    if (this.options.dryRun) {
      console.log('📋 DRY RUN: No actual projects were created');
      console.log('   To create real projects, run with createRealProjects: true\n');
      return;
    }
    
    if (this.results.length === 0) {
      console.log('ℹ️  No projects were created during this demo\n');
      return;
    }
    
    console.log(`📊 Successfully created ${this.results.length} projects:\n`);
    
    // Group by organization
    const projectsByOrg = {};
    this.results.forEach(result => {
      if (!projectsByOrg[result.organization]) {
        projectsByOrg[result.organization] = [];
      }
      projectsByOrg[result.organization].push(result);
    });
    
    // Display organized results
    for (const [orgId, projects] of Object.entries(projectsByOrg)) {
      console.log(`🏢 ${orgId} (${projects.length} projects):`);
      
      projects.forEach(project => {
        console.log(`   📋 ${project.project.title}`);
        console.log(`      Template: ${project.template}`);
        console.log(`      Fields: ${project.fieldsCreated}, Views: ${project.viewsCreated}`);
        console.log(`      URL: ${project.project.url}`);
        console.log();
      });
    }
    
    // Overall statistics
    const totalFields = this.results.reduce((sum, r) => sum + r.fieldsCreated, 0);
    const totalViews = this.results.reduce((sum, r) => sum + r.viewsCreated, 0);
    const organizations = [...new Set(this.results.map(r => r.organization))];
    
    console.log('📈 Overall Statistics:');
    console.log(`   Projects Created: ${this.results.length}`);
    console.log(`   Organizations: ${organizations.length} (${organizations.join(', ')})`);
    console.log(`   Total Fields: ${totalFields}`);
    console.log(`   Total Views: ${totalViews}`);
    console.log();
  }

  /**
   * Validate environment before starting
   * @private
   */
  async _validateEnvironment() {
    console.log('🔍 Validating environment...');
    
    const { error } = validateEnv();
    if (error) {
      console.error('❌ Environment validation failed:');
      error.details.forEach(detail => {
        console.error(`   ${detail.path.join('.')}: ${detail.message}`);
      });
      throw new Error('Environment validation failed');
    }
    
    console.log('✅ Environment validation passed');
  }

  /**
   * Initialize configuration system
   * @private
   */
  async _initializeConfiguration() {
    console.log('⚙️  Initializing configuration...');
    
    this.config = new ConfigManager({
      environment: process.env.NODE_ENV || 'development',
      enableHotReload: false,
      validateOnLoad: true
    });
    
    await this.config.initialize();
    
    this.logger = new Logger('LiveDemo', {
      level: 'info'
    });
    
    console.log('✅ Configuration initialized');
  }

  /**
   * Initialize project automation service
   * @private
   */
  async _initializeProjectAutomation() {
    console.log('🤖 Initializing project automation...');
    
    this.projectAutomation = new ProjectAutomationService(this.config);
    
    // Set up event listeners
    this.projectAutomation.on('projectCreated', (result) => {
      this.logger.info('Project created successfully', {
        project: result.project.title,
        organization: result.organization,
        template: result.template
      });
    });
    
    this.projectAutomation.on('projectCreationFailed', (error) => {
      this.logger.error('Project creation failed', {
        repository: error.repository.name,
        error: error.error
      });
    });
    
    console.log('✅ Project automation initialized');
  }

  /**
   * Simulate project creation for dry run
   * @param {string} organizationId - Organization ID
   * @private
   */
  _simulateProjectCreation(organizationId) {
    const orgConfig = this.config.getOrganizationConfig(organizationId);
    const templates = this.config.get('projectTemplates');
    const template = templates[orgConfig.settings.projectTemplate];
    
    console.log(`   📋 Template: ${template.name}`);
    console.log(`   📊 Fields: ${template.fields.length}, Views: ${template.views.length}`);
    console.log(`   🔧 Organization Type: ${orgConfig.type}`);
  }

  /**
   * Add delay
   * @param {number} ms - Milliseconds to delay
   * @private
   */
  async _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Run the live project creation demo
 */
async function runLiveProjectCreationDemo(options = {}) {
  const demo = new LiveProjectCreationDemo({
    dryRun: options.dryRun || false,
    createRealProjects: options.createRealProjects || false,
    organizationsToDemo: options.organizationsToDemo || ['DevBusinessHub', 'DevPersonalHub'],
    delayBetweenCreations: options.delayBetweenCreations || 2000,
    ...options
  });
  
  try {
    await demo.initialize();
    await demo.runDemo();
    
  } catch (error) {
    console.error('Demo failed:', error.message);
    process.exit(1);
  }
}

// Export for programmatic use
export { LiveProjectCreationDemo, runLiveProjectCreationDemo };

// Run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    createRealProjects: args.includes('--create-real-projects'),
    organizationsToDemo: ['DevBusinessHub', 'DevPersonalHub', 'DevAcademicHub', 'DevEcosystem']
  };
  
  // Safety check
  if (!options.dryRun && !options.createRealProjects) {
    console.log('🚀 DevFlow Orchestrator - Live Project Creation Demo\n');
    console.log('Usage:');
    console.log('  npm run demo:projects -- --dry-run              # Simulate project creation');
    console.log('  npm run demo:projects -- --create-real-projects # Create actual projects');
    console.log();
    console.log('⚠️  WARNING: --create-real-projects will create real GitHub Projects V2');
    console.log('   Make sure you have the necessary permissions and want to create these projects.');
    console.log();
    process.exit(0);
  }
  
  await runLiveProjectCreationDemo(options);
}