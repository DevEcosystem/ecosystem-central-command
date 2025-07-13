# 🔄 Configuration System Migration Guide

## Overview

This guide provides step-by-step instructions for migrating the DevFlow Orchestrator core components to use the new unified configuration system.

## 🎯 Migration Goals

1. Replace scattered configuration with centralized management
2. Add environment-aware configuration loading
3. Implement configuration validation
4. Enable hot-reloading for development
5. Unify organization and template management

## 📋 Pre-Migration Checklist

- [ ] Backup existing configuration files
- [ ] Document current configuration usage
- [ ] Test new configuration system in isolation
- [ ] Prepare migration scripts
- [ ] Set up monitoring for configuration changes

## 🚀 Step-by-Step Migration

### Step 1: Update Core Orchestrator

#### Before (core/orchestrator.js)

```javascript
import { Logger } from '../utils/logger.js';
import { ConfigManager } from '../config/organizations.js';

// Scattered configuration loading
const logger = new Logger('Orchestrator');
const configManager = new ConfigManager();
await configManager.initialize();
```

#### After (core/orchestrator.js)

```javascript
import { Logger } from '../utils/logger.js';
import { ConfigManager } from '../config/config-manager.js';

class DevFlowOrchestrator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Initialize unified configuration manager
    this.config = new ConfigManager({
      environment: options.environment || process.env.NODE_ENV || 'development',
      enableHotReload: options.enableHotReload !== false,
      validateOnLoad: true
    });
    
    this.logger = null; // Will be initialized after config loads
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Initialize configuration first
      await this.config.initialize();
      
      // Set up logger with configuration
      this.logger = new Logger('Orchestrator', {
        level: this.config.get('logging.level', 'info'),
        format: this.config.get('logging.format', 'json')
      });
      
      this.logger.info('DevFlow Orchestrator initializing...');
      
      // Initialize other components with configuration
      await this._initializeComponents();
      
      // Set up configuration change handlers
      this._setupConfigurationHandlers();
      
      this.isInitialized = true;
      this.logger.info('DevFlow Orchestrator initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize DevFlow Orchestrator:', error);
      throw error;
    }
  }

  async _initializeComponents() {
    // Initialize components with unified configuration
    await this._initializeGitHubAPI();
    await this._initializeCache();
    await this._initializeWorkflowEngine();
    await this._initializeProjectManager();
  }

  _setupConfigurationHandlers() {
    // Handle configuration reloads
    this.config.on('reloaded', this._handleConfigurationReload.bind(this));
    this.config.on('error', this._handleConfigurationError.bind(this));
  }

  _handleConfigurationReload({ oldConfig, newConfig }) {
    this.logger.info('Configuration reloaded, updating components...');
    // Update components with new configuration
    // This could include updating log levels, cache settings, etc.
  }

  _handleConfigurationError(error) {
    this.logger.error('Configuration error detected', { error: error.message });
    this.emit('configurationError', error);
  }
}
```

### Step 2: Update GitHub API Integration

#### Before (api/github-projects.js)

```javascript
export class GitHubProjectsAPI {
  constructor(token, options = {}) {
    this.token = token;
    this.options = options;
    // Hardcoded configuration
  }
}
```

#### After (api/github-projects.js)

```javascript
export class GitHubProjectsAPI {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Get GitHub configuration from unified config
    this.githubConfig = config.get('github');
    this.token = config.get('env.GITHUB_TOKEN');
    
    if (!this.token) {
      throw new Error('GitHub token not configured');
    }
    
    this.setupClient();
  }

  setupClient() {
    // Use configuration for client setup
    const clientConfig = {
      auth: this.token,
      userAgent: this.githubConfig.userAgent,
      timeout: this.githubConfig.timeout,
      retry: this.githubConfig.retryConfig
    };
    
    this.octokit = new Octokit(clientConfig);
    this.logger.info('GitHub API client configured', {
      userAgent: clientConfig.userAgent,
      timeout: clientConfig.timeout
    });
  }
}
```

### Step 3: Update Project Manager

#### Before (core/project-manager.js)

```javascript
export class ProjectManager extends EventEmitter {
  constructor() {
    super();
    this.logger = new Logger('ProjectManager');
    this.templateManager = new ProjectTemplateManager();
  }
}
```

#### After (core/project-manager.js)

```javascript
export class ProjectManager extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.logger = new Logger('ProjectManager', {
      level: config.get('logging.level')
    });
    
    // Templates are now managed by unified config
    this.templates = config.get('projectTemplates');
    this.organizations = config.get('organizations');
  }

  async createProject(organizationId, projectData) {
    // Get organization-specific configuration
    const orgConfig = this.config.getOrganizationConfig(organizationId);
    
    // Use organization's default template
    const templateId = orgConfig.settings.projectTemplate;
    const template = this.templates[templateId];
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    this.logger.info('Creating project with organization template', {
      organizationId,
      templateId,
      projectTitle: projectData.title
    });
    
    // Apply template and create project
    return await this._createProjectWithTemplate(template, projectData, orgConfig);
  }
}
```

### Step 4: Update Cache Management

#### Before (utils/cache.js)

```javascript
export class Cache {
  constructor(options = {}) {
    this.options = {
      ttl: options.ttl || 300,
      checkPeriod: options.checkPeriod || 60,
      ...options
    };
  }
}
```

#### After (utils/cache.js)

```javascript
export class Cache {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Get cache configuration from unified config
    this.cacheConfig = config.get('cache');
    
    this.setupCache();
    
    // Listen for configuration changes
    config.on('reloaded', this._handleConfigReload.bind(this));
  }

  setupCache() {
    const options = {
      ttl: this.cacheConfig.ttl,
      checkPeriod: this.cacheConfig.checkPeriod,
      maxKeys: this.cacheConfig.maxKeys,
      useClones: this.cacheConfig.useClones,
      deleteOnExpire: this.cacheConfig.deleteOnExpire
    };
    
    this.cache = new NodeCache(options);
    
    this.logger.info('Cache configured', {
      ttl: options.ttl,
      maxKeys: options.maxKeys
    });
  }

  _handleConfigReload({ newConfig }) {
    const newCacheConfig = newConfig.cache;
    
    // Check if cache configuration changed
    if (JSON.stringify(newCacheConfig) !== JSON.stringify(this.cacheConfig)) {
      this.logger.info('Cache configuration changed, reinitializing...');
      this.cacheConfig = newCacheConfig;
      this.setupCache();
    }
  }
}
```

### Step 5: Update Workflow Engine

#### Before (core/workflow-engine.js)

```javascript
export class WorkflowEngine extends EventEmitter {
  constructor() {
    super();
    this.logger = new Logger('WorkflowEngine');
    this.maxConcurrentJobs = 5;
    this.jobTimeout = 300000;
  }
}
```

#### After (core/workflow-engine.js)

```javascript
export class WorkflowEngine extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.logger = new Logger('WorkflowEngine', {
      level: config.get('logging.level')
    });
    
    // Get workflow configuration
    this.workflowConfig = config.get('workflows');
    this.maxConcurrentJobs = this.workflowConfig.maxConcurrentJobs;
    this.jobTimeout = this.workflowConfig.jobTimeout;
    this.retryAttempts = this.workflowConfig.retryAttempts;
    
    this.setupWorkflowEngine();
  }

  setupWorkflowEngine() {
    this.logger.info('Workflow engine configured', {
      maxConcurrentJobs: this.maxConcurrentJobs,
      jobTimeout: this.jobTimeout,
      retryAttempts: this.retryAttempts
    });
  }

  async executeWorkflow(organizationId, workflowName, context) {
    // Get organization-specific workflow configuration
    const orgConfig = this.config.getOrganizationConfig(organizationId);
    const workflows = orgConfig.workflows;
    
    if (!workflows.includes(workflowName)) {
      throw new Error(`Workflow '${workflowName}' not enabled for organization '${organizationId}'`);
    }
    
    this.logger.info('Executing workflow', {
      organizationId,
      workflowName,
      organizationType: orgConfig.type
    });
    
    // Execute workflow with organization context
    return await this._executeWorkflowWithConfig(workflowName, context, orgConfig);
  }
}
```

### Step 6: Update Issue Classifier

#### Before (core/issue-classifier.js)

```javascript
export class IssueClassifier {
  constructor() {
    this.logger = new Logger('IssueClassifier');
    this.confidenceThreshold = 0.8;
  }
}
```

#### After (core/issue-classifier.js)

```javascript
export class IssueClassifier {
  constructor(config) {
    this.config = config;
    this.logger = new Logger('IssueClassifier', {
      level: config.get('logging.level')
    });
    
    // Get issue classification configuration
    this.classificationConfig = config.get('issueClassification');
    this.confidenceThreshold = this.classificationConfig.confidence.threshold;
    this.categories = this.classificationConfig.categories;
    this.priorities = this.classificationConfig.priorities;
    
    this.logger.info('Issue classifier configured', {
      confidenceThreshold: this.confidenceThreshold,
      categories: this.categories.length,
      priorities: this.priorities.length
    });
  }

  async classifyIssue(organizationId, issue) {
    // Get organization-specific classification rules
    const orgConfig = this.config.getOrganizationConfig(organizationId);
    
    // Check if auto-classification is enabled for this organization
    if (!orgConfig.automation.issueLabeling) {
      this.logger.debug('Auto-labeling disabled for organization', { organizationId });
      return null;
    }
    
    // Classify with organization context
    const classification = await this._performClassification(issue, orgConfig);
    
    this.logger.info('Issue classified', {
      organizationId,
      issueNumber: issue.number,
      classification: classification.category,
      confidence: classification.confidence
    });
    
    return classification;
  }
}
```

### Step 7: Update Main Application Entry Point

#### Before (main application file)

```javascript
import { DevFlowOrchestrator } from './core/orchestrator.js';

const orchestrator = new DevFlowOrchestrator();
await orchestrator.initialize();
```

#### After (main application file)

```javascript
import { DevFlowOrchestrator } from './core/orchestrator.js';
import { validateEnv } from './config/validation.js';

// Validate environment variables first
const { error } = validateEnv();
if (error) {
  console.error('Environment validation failed:');
  error.details.forEach(detail => {
    console.error(`  ${detail.path.join('.')}: ${detail.message}`);
  });
  process.exit(1);
}

// Create orchestrator with environment-specific configuration
const orchestrator = new DevFlowOrchestrator({
  environment: process.env.NODE_ENV || 'development',
  enableHotReload: process.env.NODE_ENV === 'development'
});

// Handle configuration errors
orchestrator.on('configurationError', (error) => {
  console.error('Configuration error:', error.message);
});

// Initialize orchestrator
try {
  await orchestrator.initialize();
  console.log('DevFlow Orchestrator started successfully');
} catch (error) {
  console.error('Failed to start DevFlow Orchestrator:', error);
  process.exit(1);
}
```

## 🔧 Configuration Updates

### Environment Variables

Update your `.env` files to match the new validation schema:

```env
# Required variables
NODE_ENV=development
GITHUB_TOKEN=ghp_your_token_here

# Optional variables with defaults
LOG_LEVEL=debug
PORT=3000
CACHE_TTL=300
CACHE_CHECK_PERIOD=60

# Feature flags
ENABLE_HOT_RELOAD=true
ENABLE_METRICS=true
ENABLE_WEBHOOKS=true
```

### Package.json Scripts

Update your npm scripts to use the new configuration system:

```json
{
  "scripts": {
    "start": "NODE_ENV=production node core/orchestrator.js",
    "dev": "NODE_ENV=development node --watch core/orchestrator.js",
    "test": "NODE_ENV=test node --test tests/**/*.test.js",
    "validate-config": "node -e \"import('./config/validation.js').then(v => v.validateEnv())\"",
    "health-check": "node -e \"import('./config/config-manager.js').then(async c => { const config = new c.ConfigManager(); await config.initialize(); console.log(config.getHealth()); })\""
  }
}
```

## 🧪 Testing Migration

### Test Configuration Loading

```javascript
import { ConfigManager } from './config/config-manager.js';

// Test configuration manager initialization
const config = new ConfigManager({ environment: 'test' });
await config.initialize();

// Verify all expected configuration sections are loaded
const health = config.getHealth();
console.log('Configuration sections:', health.configSections);

// Test organization configuration
const orgConfig = config.getOrganizationConfig('DevBusinessHub');
console.log('Organization config loaded:', orgConfig.id);

// Test environment-specific configuration
const envConfig = config.getEnvironmentConfig('logging');
console.log('Environment logging config:', envConfig);
```

### Test Component Integration

```javascript
import { DevFlowOrchestrator } from './core/orchestrator.js';

// Test orchestrator initialization with new config
const orchestrator = new DevFlowOrchestrator({
  environment: 'test',
  enableHotReload: false
});

await orchestrator.initialize();

// Verify components are using configuration
console.log('Orchestrator initialized:', orchestrator.isInitialized);
console.log('Configuration health:', orchestrator.config.getHealth());
```

## 🚨 Rollback Plan

If migration issues occur, you can rollback using this process:

1. **Immediate Rollback**:
   ```bash
   git checkout HEAD~1  # Rollback to previous commit
   npm start           # Start with old configuration
   ```

2. **Partial Rollback**:
   ```javascript
   // Temporarily disable new config system
   const USE_NEW_CONFIG = false;
   
   if (USE_NEW_CONFIG) {
     // New configuration system
   } else {
     // Fall back to old system
   }
   ```

3. **Configuration Validation Bypass**:
   ```javascript
   const config = new ConfigManager({
     validateOnLoad: false  // Bypass validation temporarily
   });
   ```

## 📊 Migration Verification

### Post-Migration Checklist

- [ ] All components initialize successfully
- [ ] Environment variables are properly loaded
- [ ] Organization configurations are accessible
- [ ] Project templates are working
- [ ] Hot reloading works in development
- [ ] Production configuration is secure
- [ ] Logging configuration is applied
- [ ] Cache configuration is working
- [ ] GitHub API configuration is valid
- [ ] All tests pass with new configuration

### Performance Verification

```javascript
// Measure configuration loading performance
const startTime = Date.now();
const config = new ConfigManager();
await config.initialize();
const loadTime = Date.now() - startTime;

console.log(`Configuration loaded in ${loadTime}ms`);

// Verify configuration access performance
const accessStart = Date.now();
for (let i = 0; i < 1000; i++) {
  config.get('env.GITHUB_TOKEN');
}
const accessTime = Date.now() - accessStart;

console.log(`1000 config accesses in ${accessTime}ms`);
```

## 🔍 Troubleshooting

### Common Migration Issues

#### Configuration Not Loading

```javascript
// Debug configuration loading
const config = new ConfigManager({ environment: 'development' });

try {
  await config.initialize();
} catch (error) {
  console.error('Configuration initialization failed:', error.message);
  console.error('Stack trace:', error.stack);
}

// Check health status
const health = config.getHealth();
console.log('Configuration health:', health);
```

#### Environment Variable Issues

```javascript
// Validate environment variables
import { validateEnv } from './config/validation.js';

const { error, value } = validateEnv();
if (error) {
  console.error('Environment validation errors:');
  error.details.forEach(detail => {
    console.error(`  ${detail.path.join('.')}: ${detail.message}`);
  });
}
```

#### Organization Configuration Missing

```javascript
// Debug organization configuration
const orgConfig = config.getOrganizationConfig('DevBusinessHub');
if (!orgConfig || orgConfig.type === 'unknown') {
  console.error('Organization configuration not found or invalid');
  console.log('Available organizations:', Object.keys(config.get('organizations')));
}
```

## 📚 Additional Resources

- [Configuration System Documentation](./CONFIGURATION_SYSTEM.md)
- [API Reference](./API_REFERENCE.md)
- [Environment Setup Guide](./ENVIRONMENT_SETUP.md)
- [Security Best Practices](./SECURITY.md)

---

*This migration guide provides comprehensive instructions for integrating the new configuration system. Follow the steps carefully and test thoroughly in a development environment before deploying to production.*