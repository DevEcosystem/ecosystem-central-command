/**
 * @fileoverview Example: Integrating Configuration System with DevFlow Orchestrator
 * @version 1.0.0
 * @author DevEcosystem
 * 
 * This example demonstrates how to integrate the new unified configuration system
 * with the existing DevFlow Orchestrator components.
 */

import { EventEmitter } from 'events';
import { ConfigManager } from '../config/config-manager.js';
import { validateEnv } from '../config/validation.js';
import { Logger } from '../utils/logger.js';

/**
 * Enhanced DevFlow Orchestrator with Unified Configuration
 */
class EnhancedDevFlowOrchestrator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Initialize configuration manager
    this.config = new ConfigManager({
      environment: options.environment || process.env.NODE_ENV || 'development',
      enableHotReload: options.enableHotReload !== false,
      validateOnLoad: true
    });
    
    this.logger = null; // Will be initialized after config loads
    this.components = {};
    this.isInitialized = false;
    this.startTime = null;
  }

  /**
   * Initialize the orchestrator with unified configuration
   */
  async initialize() {
    try {
      this.startTime = Date.now();
      
      // Step 1: Validate environment variables
      await this._validateEnvironment();
      
      // Step 2: Initialize configuration
      await this.config.initialize();
      
      // Step 3: Set up logger with configuration
      await this._initializeLogger();
      
      this.logger.info('DevFlow Orchestrator starting with unified configuration...', {
        environment: this.config.get('env.NODE_ENV'),
        configSections: this.config.getHealth().configSections.length
      });
      
      // Step 4: Initialize components with configuration
      await this._initializeComponents();
      
      // Step 5: Set up configuration change handlers
      this._setupConfigurationHandlers();
      
      this.isInitialized = true;
      const initTime = Date.now() - this.startTime;
      
      this.logger.info('DevFlow Orchestrator initialized successfully', {
        initializationTime: `${initTime}ms`,
        components: Object.keys(this.components)
      });
      
      this.emit('initialized', {
        config: this.config.getHealth(),
        components: Object.keys(this.components),
        initTime
      });
      
    } catch (error) {
      this.logger?.error('Failed to initialize DevFlow Orchestrator', { 
        error: error.message,
        stack: error.stack 
      });
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Validate environment variables before initialization
   * @private
   */
  async _validateEnvironment() {
    const { error, value } = validateEnv();
    
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
   * Initialize logger with configuration
   * @private
   */
  async _initializeLogger() {
    const loggingConfig = this.config.get('defaults.logging', {});
    const envLoggingConfig = this.config.get('environments.development.logging', {});
    
    // Merge logging configurations (environment overrides defaults)
    const finalLoggingConfig = {
      level: envLoggingConfig.level || loggingConfig.level || 'info',
      format: envLoggingConfig.format || loggingConfig.format || 'simple',
      colorize: envLoggingConfig.colorize || loggingConfig.colorize || true
    };
    
    this.logger = new Logger('Orchestrator', {
      level: finalLoggingConfig.level,
      format: finalLoggingConfig.format,
      colorize: finalLoggingConfig.colorize
    });
    
    this.logger.info('Logger initialized with configuration', {
      level: finalLoggingConfig.level,
      format: finalLoggingConfig.format
    });
  }

  /**
   * Initialize all components with unified configuration
   * @private
   */
  async _initializeComponents() {
    this.logger.info('Initializing components with unified configuration...');
    
    // Initialize GitHub API with configuration
    await this._initializeGitHubAPI();
    
    // Initialize cache with configuration
    await this._initializeCache();
    
    // Initialize project manager with configuration
    await this._initializeProjectManager();
    
    // Initialize workflow engine with configuration
    await this._initializeWorkflowEngine();
    
    // Initialize issue classifier with configuration
    await this._initializeIssueClassifier();
    
    this.logger.info('All components initialized successfully');
  }

  /**
   * Initialize GitHub API component
   * @private
   */
  async _initializeGitHubAPI() {
    const githubConfig = this.config.get('defaults.github', {});
    const token = this.config.get('env.GITHUB_TOKEN');
    
    // Simulate GitHub API initialization with configuration
    this.components.githubAPI = {
      token: token ? '***' : 'NOT_SET', // Don't log actual token
      config: {
        timeout: githubConfig.timeout,
        retries: githubConfig.retryConfig.retries,
        userAgent: githubConfig.userAgent
      },
      initialized: true
    };
    
    this.logger.info('GitHub API initialized', {
      hasToken: !!token,
      timeout: githubConfig.timeout,
      userAgent: githubConfig.userAgent
    });
  }

  /**
   * Initialize cache component
   * @private
   */
  async _initializeCache() {
    const cacheConfig = this.config.get('defaults.cache', {});
    
    // Simulate cache initialization with configuration
    this.components.cache = {
      ttl: cacheConfig.ttl,
      maxKeys: cacheConfig.maxKeys,
      enabled: cacheConfig.enabled,
      initialized: true
    };
    
    this.logger.info('Cache initialized', {
      enabled: cacheConfig.enabled,
      ttl: cacheConfig.ttl,
      maxKeys: cacheConfig.maxKeys
    });
  }

  /**
   * Initialize project manager component
   * @private
   */
  async _initializeProjectManager() {
    const templates = this.config.get('projectTemplates');
    const organizations = this.config.get('organizations');
    
    // Simulate project manager initialization
    this.components.projectManager = {
      templatesCount: Object.keys(templates).length,
      organizationsCount: Object.keys(organizations).length,
      availableTemplates: Object.keys(templates),
      supportedOrganizations: Object.keys(organizations),
      initialized: true
    };
    
    this.logger.info('Project Manager initialized', {
      templates: Object.keys(templates),
      organizations: Object.keys(organizations)
    });
  }

  /**
   * Initialize workflow engine component
   * @private
   */
  async _initializeWorkflowEngine() {
    const workflowConfig = this.config.get('defaults.workflows', {});
    
    // Simulate workflow engine initialization
    this.components.workflowEngine = {
      maxConcurrentJobs: workflowConfig.maxConcurrentJobs,
      jobTimeout: workflowConfig.jobTimeout,
      enabled: workflowConfig.enabled,
      initialized: true
    };
    
    this.logger.info('Workflow Engine initialized', {
      maxConcurrentJobs: workflowConfig.maxConcurrentJobs,
      jobTimeout: workflowConfig.jobTimeout
    });
  }

  /**
   * Initialize issue classifier component
   * @private
   */
  async _initializeIssueClassifier() {
    const classificationConfig = this.config.get('defaults.issueClassification', {});
    
    // Simulate issue classifier initialization
    this.components.issueClassifier = {
      enabled: classificationConfig.enabled,
      confidenceThreshold: classificationConfig.confidence.threshold,
      categories: classificationConfig.categories,
      initialized: true
    };
    
    this.logger.info('Issue Classifier initialized', {
      enabled: classificationConfig.enabled,
      threshold: classificationConfig.confidence.threshold,
      categories: classificationConfig.categories.length
    });
  }

  /**
   * Set up configuration change handlers
   * @private
   */
  _setupConfigurationHandlers() {
    // Handle configuration reloads (hot reloading)
    this.config.on('reloaded', this._handleConfigurationReload.bind(this));
    
    // Handle configuration errors
    this.config.on('error', this._handleConfigurationError.bind(this));
    
    this.logger.info('Configuration change handlers set up');
  }

  /**
   * Handle configuration reload events
   * @private
   */
  _handleConfigurationReload({ oldConfig, newConfig }) {
    this.logger.info('Configuration reloaded, updating components...');
    
    // Update logger level if it changed
    const newLogLevel = newConfig.logging?.level;
    const oldLogLevel = oldConfig.logging?.level;
    
    if (newLogLevel && newLogLevel !== oldLogLevel) {
      this.logger.info(`Log level changed from ${oldLogLevel} to ${newLogLevel}`);
      // In a real implementation, you would update the logger level here
    }
    
    // Update cache settings if they changed
    const newCacheConfig = newConfig.cache;
    const oldCacheConfig = oldConfig.cache;
    
    if (JSON.stringify(newCacheConfig) !== JSON.stringify(oldCacheConfig)) {
      this.logger.info('Cache configuration changed, would reinitialize cache');
      // In a real implementation, you would reinitialize the cache here
    }
    
    this.emit('configurationReloaded', { oldConfig, newConfig });
  }

  /**
   * Handle configuration error events
   * @private
   */
  _handleConfigurationError(error) {
    this.logger.error('Configuration error detected', { error: error.message });
    this.emit('configurationError', error);
  }

  /**
   * Get system health status
   */
  getHealth() {
    return {
      orchestrator: {
        isInitialized: this.isInitialized,
        uptime: this.startTime ? Date.now() - this.startTime : 0,
        components: Object.keys(this.components)
      },
      configuration: this.config.getHealth(),
      components: this.components
    };
  }

  /**
   * Demonstrate organization-specific operations
   */
  async demonstrateOrganizationOperations() {
    if (!this.isInitialized) {
      throw new Error('Orchestrator not initialized');
    }
    
    const organizations = ['DevBusinessHub', 'DevPersonalHub', 'DevAcademicHub', 'DevEcosystem'];
    
    for (const orgId of organizations) {
      const orgConfig = this.config.getOrganizationConfig(orgId);
      
      this.logger.info(`Organization: ${orgId}`, {
        type: orgConfig.type,
        template: orgConfig.settings.projectTemplate,
        securityLevel: orgConfig.settings.securityLevel,
        fieldsCount: orgConfig.projectFields.length,
        workflowsCount: orgConfig.workflows.length
      });
    }
  }

  /**
   * Demonstrate template operations
   */
  async demonstrateTemplateOperations() {
    if (!this.isInitialized) {
      throw new Error('Orchestrator not initialized');
    }
    
    const templates = this.config.get('projectTemplates');
    
    for (const [templateId, template] of Object.entries(templates)) {
      this.logger.info(`Template: ${templateId}`, {
        name: template.name,
        organizationType: template.organizationType,
        fieldsCount: template.fields.length,
        viewsCount: template.views.length
      });
    }
  }

  /**
   * Reload configuration manually
   */
  async reloadConfiguration() {
    this.logger.info('Manually reloading configuration...');
    await this.config.reload();
  }

  /**
   * Shutdown orchestrator gracefully
   */
  async shutdown() {
    this.logger.info('Shutting down DevFlow Orchestrator...');
    
    // Remove all configuration listeners
    this.config.removeAllListeners();
    
    // Clean up components (in a real implementation)
    this.components = {};
    this.isInitialized = false;
    
    this.logger.info('DevFlow Orchestrator shut down successfully');
    this.emit('shutdown');
  }
}

/**
 * Demonstration function
 */
async function demonstrateConfigurationIntegration() {
  console.log('🚀 DevFlow Orchestrator Configuration Integration Demo\n');
  
  try {
    // Create orchestrator with configuration
    const orchestrator = new EnhancedDevFlowOrchestrator({
      environment: 'development',
      enableHotReload: true
    });
    
    // Set up event listeners
    orchestrator.on('initialized', (data) => {
      console.log('✅ Orchestrator initialized successfully');
      console.log(`   Initialization time: ${data.initTime}ms`);
      console.log(`   Components: ${data.components.join(', ')}`);
    });
    
    orchestrator.on('configurationReloaded', () => {
      console.log('🔄 Configuration reloaded successfully');
    });
    
    orchestrator.on('configurationError', (error) => {
      console.error('❌ Configuration error:', error.message);
    });
    
    // Initialize orchestrator
    await orchestrator.initialize();
    
    // Get health status
    const health = orchestrator.getHealth();
    console.log('\n📊 System Health:');
    console.log(`   Uptime: ${health.orchestrator.uptime}ms`);
    console.log(`   Components: ${health.orchestrator.components.length}`);
    console.log(`   Config sections: ${health.configuration.configSections.length}`);
    
    // Demonstrate organization operations
    console.log('\n🏢 Organization Configurations:');
    await orchestrator.demonstrateOrganizationOperations();
    
    // Demonstrate template operations
    console.log('\n📋 Project Templates:');
    await orchestrator.demonstrateTemplateOperations();
    
    // Test hot reloading (if enabled)
    if (health.configuration.watchedFiles.length > 0) {
      console.log('\n🔄 Testing configuration reload...');
      await orchestrator.reloadConfiguration();
    }
    
    // Shutdown gracefully
    console.log('\n⏹️  Shutting down...');
    await orchestrator.shutdown();
    
    console.log('\n✅ Demo completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run demonstration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateConfigurationIntegration();
}

export { EnhancedDevFlowOrchestrator, demonstrateConfigurationIntegration };