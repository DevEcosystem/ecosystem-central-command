# 🔧 DevFlow Orchestrator Configuration System

## Overview

The DevFlow Orchestrator Configuration System provides centralized, environment-aware configuration management with validation, hot-reloading, and organization-specific settings. This system unifies all configuration aspects of the DevFlow Orchestrator into a cohesive, maintainable framework.

## 🏗️ Architecture

### Core Components

```
config/
├── config-manager.js          # Main configuration manager
├── defaults.js               # Default configuration values
├── validation.js             # Joi validation schemas
├── environments/             # Environment-specific overrides
│   ├── development.js
│   ├── staging.js
│   └── production.js
├── organizations.js          # Organization-specific configs
└── project-templates.js     # Project template definitions
```

### Key Features

- **Environment Awareness** - Automatic environment detection and configuration loading
- **Schema Validation** - Joi-based validation with detailed error messages
- **Hot Reloading** - Runtime configuration updates without restart
- **Organization Profiles** - Organization-specific configuration management
- **Security** - Secure environment variable handling and validation
- **Event System** - Configuration change notifications via EventEmitter

## 🚀 Quick Start

### Basic Usage

```javascript
import { ConfigManager } from './config/config-manager.js';

// Create and initialize configuration manager
const config = new ConfigManager({
  environment: 'development',
  enableHotReload: true,
  validateOnLoad: true
});

await config.initialize();

// Get configuration values
const githubToken = config.get('env.GITHUB_TOKEN');
const serverPort = config.get('server.port', 3000);
const orgConfig = config.getOrganizationConfig('DevBusinessHub');
```

### Environment Setup

Create a `.env` file in your project root:

```env
# Environment
NODE_ENV=development
LOG_LEVEL=debug
PORT=3000

# GitHub Configuration
GITHUB_TOKEN=ghp_your_token_here
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# Cache Configuration
CACHE_TTL=300
CACHE_CHECK_PERIOD=60

# Feature Flags
ENABLE_HOT_RELOAD=true
ENABLE_METRICS=true
```

## 📊 Configuration Sections

### Environment Variables (`.env`)

```javascript
// Validation schema ensures proper format
GITHUB_TOKEN=ghp_[36-40 alphanumeric characters]
NODE_ENV=development|staging|production
LOG_LEVEL=error|warn|info|debug
PORT=1-65535
```

### Application Settings

```javascript
app: {
  name: 'DevFlow Orchestrator',
  version: '1.0.0',
  description: 'Intelligent project and workflow management',
  homepage: 'https://github.com/DevEcosystem/...'
}
```

### Server Configuration

```javascript
server: {
  port: 3000,
  host: '0.0.0.0',
  timeout: 30000,
  cors: {
    enabled: true,
    origins: ['http://localhost:3000'],
    credentials: true
  }
}
```

### GitHub API Settings

```javascript
github: {
  apiVersion: '2022-11-28',
  userAgent: 'DevFlow-Orchestrator/1.0.0',
  timeout: 15000,
  retryConfig: {
    retries: 3,
    retryDelay: 1000,
    retryDelayMultiplier: 2
  }
}
```

### Organization Profiles

```javascript
organizations: {
  DevBusinessHub: {
    id: 'DevBusinessHub',
    type: 'production',
    settings: {
      projectTemplate: 'production-ready',
      approvalRequired: true,
      securityLevel: 'high'
    },
    projectFields: [...],
    workflows: [...],
    automation: {...}
  }
}
```

## 🔒 Security Features

### Environment Variable Validation

```javascript
// Automatic validation on load
GITHUB_TOKEN: Joi.string()
  .pattern(/^ghp_[a-zA-Z0-9]{36,40}$/)
  .required()

SESSION_SECRET: Joi.string()
  .min(16)
  .required()
```

### Secure Configuration Loading

- Environment variables loaded from `.env` files
- Sensitive data never logged or exposed
- Production-specific security hardening
- CORS and security headers configuration

## 🌍 Environment-Specific Configuration

### Development Environment

```javascript
// config/environments/development.js
export default {
  logging: { level: 'debug', colorize: true },
  security: { helmet: { enabled: false } },
  features: { enableDebugMode: true },
  cache: { ttl: 60 }, // Shorter TTL for development
  rateLimiting: { enabled: false }
};
```

### Production Environment

```javascript
// config/environments/production.js
export default {
  logging: { level: 'info', format: 'json' },
  security: { 
    helmet: { enabled: true },
    session: { cookie: { secure: true } }
  },
  features: { enableDebugMode: false },
  cache: { ttl: 900 }, // Longer TTL for production
  rateLimiting: { enabled: true, maxRequests: 100 }
};
```

## 🔄 Hot Reloading

The configuration system supports hot reloading for development environments:

```javascript
// Enable hot reloading
const config = new ConfigManager({ enableHotReload: true });

// Listen for configuration changes
config.on('reloaded', ({ oldConfig, newConfig }) => {
  console.log('Configuration reloaded');
  // Update dependent systems
});

// Manual reload
await config.reload();
```

## 📋 Organization Management

### Organization Types

1. **Production** (`DevBusinessHub`)
   - Enterprise-grade security and approval workflows
   - Customer impact tracking
   - Production deployment controls

2. **Experimental** (`DevPersonalHub`)
   - Lightweight, rapid experimentation workflows
   - Technology-based categorization
   - Effort estimation

3. **Research** (`DevAcademicHub`)
   - Academic coursework and research management
   - Due date tracking and grade impact assessment
   - Peer review workflows

4. **Infrastructure** (`DevEcosystem`)
   - Cross-organization impact analysis
   - Risk level assessment and rollback planning
   - System component tracking

### Organization Configuration

```javascript
// Get organization-specific configuration
const orgConfig = config.getOrganizationConfig('DevBusinessHub');

// Access organization settings
const { projectTemplate, approvalRequired, securityLevel } = orgConfig.settings;

// Get project fields for organization
const projectFields = orgConfig.projectFields;

// Get automation rules
const automation = orgConfig.automation;
```

## 🎯 Project Templates

### Available Templates

1. **production-ready** - Enterprise-grade project template
2. **lightweight** - Minimal template for experimentation
3. **research-focused** - Academic research template
4. **infrastructure** - Infrastructure and DevOps template

### Template Configuration

```javascript
// Get all available templates
const templates = config.get('projectTemplates');

// Get specific template
const template = templates['production-ready'];

// Template structure
{
  id: 'production-ready',
  name: 'Production Ready Project',
  organizationType: 'production',
  fields: [
    { name: 'Status', type: 'SINGLE_SELECT', options: [...] },
    { name: 'Priority', type: 'SINGLE_SELECT', options: [...] }
  ],
  views: [
    { name: 'Kanban Board', layout: 'BOARD_LAYOUT' }
  ]
}
```

## ✅ Validation

### Schema Validation

All configuration is validated using Joi schemas:

```javascript
import { validateConfig, validateEnv } from './config/validation.js';

// Validate environment variables
const { error, value } = validateEnv(process.env);

// Validate specific configuration section
const validation = validateConfig(config.cache, 'cache');

// Validate complete configuration
const fullValidation = validateConfig(config.getAll());
```

### Error Handling

```javascript
// Validation errors provide detailed information
{
  error: {
    details: [
      {
        message: '"GITHUB_TOKEN" with value "invalid" fails to match required pattern',
        path: ['GITHUB_TOKEN'],
        type: 'string.pattern.base'
      }
    ]
  }
}
```

## 🔍 Health Monitoring

### Health Check

```javascript
// Get configuration system health
const health = config.getHealth();

{
  isInitialized: true,
  environment: 'development',
  lastLoadTime: '2025-07-13T10:39:36.364Z',
  watchedFiles: ['/path/to/config/file.js'],
  configSections: ['env', 'defaults', 'organizations'],
  uptime: 300000
}
```

### Event Monitoring

```javascript
// Monitor configuration events
config.on('initialized', (config) => {
  console.log('Configuration system initialized');
});

config.on('reloaded', ({ oldConfig, newConfig }) => {
  console.log('Configuration reloaded');
});

config.on('error', (error) => {
  console.error('Configuration error:', error);
});
```

## 🛠️ API Reference

### ConfigManager Class

#### Constructor

```javascript
new ConfigManager(options = {})
```

**Options:**
- `environment` - Environment name (default: process.env.NODE_ENV)
- `enableHotReload` - Enable hot reloading (default: true)
- `validateOnLoad` - Validate configuration on load (default: true)
- `configPath` - Configuration files path (default: ./config)

#### Methods

```javascript
// Initialize configuration manager
await config.initialize()

// Get configuration value by path
config.get(path, defaultValue)

// Get organization-specific configuration
config.getOrganizationConfig(organizationId)

// Get environment-specific configuration
config.getEnvironmentConfig(section)

// Get all configuration (read-only)
config.getAll()

// Get health status
config.getHealth()

// Reload configuration
await config.reload()
```

### Validation Functions

```javascript
// Validate environment variables
validateEnv(env = process.env)

// Validate configuration section
validateConfig(config, section = null)
```

## 🚀 Migration Guide

### From Existing Configuration

1. **Backup existing configuration files**

2. **Create new ConfigManager instance**:
   ```javascript
   import { ConfigManager } from './config/config-manager.js';
   
   const config = new ConfigManager();
   await config.initialize();
   ```

3. **Update configuration access**:
   ```javascript
   // Old way
   const githubToken = process.env.GITHUB_TOKEN;
   
   // New way
   const githubToken = config.get('env.GITHUB_TOKEN');
   ```

4. **Migrate organization settings**:
   ```javascript
   // Old way
   const orgSettings = hardcodedOrgSettings[orgId];
   
   // New way
   const orgConfig = config.getOrganizationConfig(orgId);
   ```

5. **Add validation**:
   ```javascript
   import { validateEnv } from './config/validation.js';
   
   const { error, value } = validateEnv();
   if (error) {
     console.error('Configuration validation failed:', error.details);
     process.exit(1);
   }
   ```

## 📊 Best Practices

### 1. Environment Variables

- Use descriptive names with consistent prefixes
- Validate all environment variables on startup
- Provide sensible defaults for optional values
- Never commit sensitive values to version control

### 2. Configuration Structure

- Group related configuration together
- Use consistent naming conventions
- Document all configuration options
- Provide examples for complex configurations

### 3. Validation

- Validate all user-provided configuration
- Use appropriate Joi validators for data types
- Provide clear error messages for validation failures
- Fail fast on invalid configuration

### 4. Hot Reloading

- Only enable hot reloading in development
- Test configuration changes thoroughly
- Monitor for configuration reload events
- Handle reload failures gracefully

### 5. Security

- Never log sensitive configuration values
- Use environment variables for secrets
- Validate all configuration against schemas
- Use secure defaults for all environments

## 🐛 Troubleshooting

### Common Issues

#### Configuration Not Loading

```javascript
// Check if configuration manager is initialized
if (!config.isInitialized) {
  await config.initialize();
}

// Check health status
const health = config.getHealth();
console.log(health);
```

#### Validation Errors

```javascript
// Get detailed validation information
const { error, value } = validateEnv();
if (error) {
  error.details.forEach(detail => {
    console.error(`${detail.path.join('.')}: ${detail.message}`);
  });
}
```

#### Missing Environment Variables

```javascript
// Required environment variables
const requiredVars = ['GITHUB_TOKEN', 'NODE_ENV'];
const missing = requiredVars.filter(var => !process.env[var]);

if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
  process.exit(1);
}
```

#### Hot Reload Not Working

```javascript
// Check if hot reload is enabled
const isHotReloadEnabled = config.options.enableHotReload;

// Check watched files
const watchedFiles = config.watchedFiles;
console.log('Watched files:', Array.from(watchedFiles));

// Listen for reload events
config.on('reloaded', () => console.log('Configuration reloaded'));
config.on('error', (error) => console.error('Reload error:', error));
```

## 📚 Examples

### Complete Configuration Setup

```javascript
import { ConfigManager } from './config/config-manager.js';
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

// Create and initialize configuration manager
const config = new ConfigManager({
  environment: process.env.NODE_ENV || 'development',
  enableHotReload: process.env.NODE_ENV === 'development',
  validateOnLoad: true
});

// Initialize configuration
await config.initialize();

// Set up event listeners
config.on('reloaded', ({ oldConfig, newConfig }) => {
  console.log('Configuration reloaded successfully');
});

config.on('error', (error) => {
  console.error('Configuration error:', error.message);
});

// Export for use throughout application
export default config;
```

---

*This documentation provides comprehensive guidance for using the DevFlow Orchestrator Configuration System. For additional support, refer to the source code comments and test files.*