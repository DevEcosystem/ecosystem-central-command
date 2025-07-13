/**
 * @fileoverview Unified Configuration Manager for DevFlow Orchestrator
 * @version 1.0.0
 * @author DevEcosystem
 * 
 * Provides centralized configuration management with:
 * - Environment-aware configuration loading
 * - Schema validation with Joi
 * - Hot-reloading capability
 * - Secure environment variable handling
 * - Organization-specific configuration support
 */

import { EventEmitter } from 'events';
import { readFileSync, existsSync, watchFile } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import Joi from 'joi';
import dotenv from 'dotenv';
import { Logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Unified Configuration Manager for DevFlow Orchestrator
 * Manages all configuration aspects with environment awareness and validation
 */
export class ConfigManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.logger = new Logger('ConfigManager');
    this.options = {
      enableHotReload: options.enableHotReload ?? true,
      validateOnLoad: options.validateOnLoad ?? true,
      environment: options.environment || process.env.NODE_ENV || 'development',
      configPath: options.configPath || __dirname,
      ...options
    };
    
    this.config = {};
    this.watchedFiles = new Set();
    this.isInitialized = false;
    this.lastLoadTime = null;
    
    this.logger.info('Config Manager created', { 
      environment: this.options.environment,
      hotReload: this.options.enableHotReload 
    });
  }

  /**
   * Initialize configuration manager
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      this.logger.info('Initializing Config Manager...', { 
        environment: this.options.environment 
      });
      
      // Load environment variables
      await this._loadEnvironmentVariables();
      
      // Load configuration files
      await this._loadConfigurationFiles();
      
      // Validate configuration
      if (this.options.validateOnLoad) {
        await this._validateConfiguration();
      }
      
      // Setup hot reloading
      if (this.options.enableHotReload) {
        this._setupHotReload();
      }
      
      this.isInitialized = true;
      this.lastLoadTime = new Date();
      
      this.logger.info('Config Manager initialized successfully', {
        environment: this.options.environment,
        configSections: Object.keys(this.config).length,
        lastLoadTime: this.lastLoadTime.toISOString()
      });
      
      this.emit('initialized', this.config);
    } catch (error) {
      this.logger.error('Failed to initialize Config Manager', { 
        error: error.message,
        stack: error.stack 
      });
      throw error;
    }
  }

  /**
   * Get configuration value by path
   * @param {string} path - Configuration path (e.g., 'database.host' or 'github.token')
   * @param {*} defaultValue - Default value if path not found
   * @returns {*} Configuration value
   */
  get(path, defaultValue = undefined) {
    if (!this.isInitialized) {
      throw new Error('Config Manager not initialized. Call initialize() first.');
    }

    const keys = path.split('.');
    let value = this.config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        this.logger.debug('Configuration path not found', { path, defaultValue });
        return defaultValue;
      }
    }
    
    return value;
  }

  /**
   * Get organization-specific configuration
   * @param {string} organizationId - Organization identifier
   * @returns {Object} Organization configuration
   */
  getOrganizationConfig(organizationId) {
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    const orgConfig = this.get(`organizations.${organizationId}`);
    if (!orgConfig) {
      this.logger.warn('Organization config not found, using default', { organizationId });
      return this.get('organizations.default', this._getDefaultOrganizationConfig(organizationId));
    }

    this.logger.debug('Retrieved organization config', { organizationId });
    return { ...orgConfig }; // Return copy to prevent mutations
  }

  /**
   * Get environment-specific configuration
   * @param {string} section - Configuration section
   * @returns {Object} Environment configuration
   */
  getEnvironmentConfig(section = null) {
    const envConfig = this.get(`environments.${this.options.environment}`, {});
    
    if (section) {
      return envConfig[section] || {};
    }
    
    return envConfig;
  }

  /**
   * Get all configuration (read-only copy)
   * @returns {Object} Complete configuration
   */
  getAll() {
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Check if configuration manager is healthy
   * @returns {Object} Health status
   */
  getHealth() {
    return {
      isInitialized: this.isInitialized,
      environment: this.options.environment,
      lastLoadTime: this.lastLoadTime?.toISOString(),
      watchedFiles: Array.from(this.watchedFiles),
      configSections: Object.keys(this.config),
      uptime: this.lastLoadTime ? Date.now() - this.lastLoadTime.getTime() : 0
    };
  }

  /**
   * Reload configuration from files
   * @returns {Promise<void>}
   */
  async reload() {
    this.logger.info('Reloading configuration...');
    
    try {
      const oldConfig = { ...this.config };
      
      await this._loadEnvironmentVariables();
      await this._loadConfigurationFiles();
      
      if (this.options.validateOnLoad) {
        await this._validateConfiguration();
      }
      
      this.lastLoadTime = new Date();
      
      this.logger.info('Configuration reloaded successfully', {
        lastLoadTime: this.lastLoadTime.toISOString()
      });
      
      this.emit('reloaded', { oldConfig, newConfig: this.config });
    } catch (error) {
      this.logger.error('Failed to reload configuration', { 
        error: error.message 
      });
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Load environment variables
   * @private
   */
  async _loadEnvironmentVariables() {
    // Load .env files based on environment
    const envFiles = [
      '.env',
      `.env.${this.options.environment}`,
      '.env.local'
    ];

    for (const envFile of envFiles) {
      const envPath = resolve(process.cwd(), envFile);
      if (existsSync(envPath)) {
        dotenv.config({ path: envPath });
        this.logger.debug('Loaded environment file', { envFile });
      }
    }

    // Map environment variables to configuration
    this.config.env = {
      NODE_ENV: process.env.NODE_ENV || 'development',
      LOG_LEVEL: process.env.LOG_LEVEL || 'info',
      PORT: parseInt(process.env.PORT) || 3000,
      
      // GitHub Configuration
      GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET,
      GITHUB_APP_ID: process.env.GITHUB_APP_ID,
      GITHUB_PRIVATE_KEY: process.env.GITHUB_PRIVATE_KEY,
      
      // Cache Configuration
      CACHE_TTL: parseInt(process.env.CACHE_TTL) || 300,
      CACHE_CHECK_PERIOD: parseInt(process.env.CACHE_CHECK_PERIOD) || 60,
      
      // Rate Limiting
      RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 3600000,
      RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5000,
      
      // Security
      WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
      JWT_SECRET: process.env.JWT_SECRET,
      
      // Feature Flags
      ENABLE_HOT_RELOAD: process.env.ENABLE_HOT_RELOAD === 'true',
      ENABLE_METRICS: process.env.ENABLE_METRICS !== 'false',
      ENABLE_WEBHOOKS: process.env.ENABLE_WEBHOOKS !== 'false'
    };

    this.logger.debug('Environment variables loaded', {
      environment: this.config.env.NODE_ENV,
      hasGitHubToken: !!this.config.env.GITHUB_TOKEN,
      cacheConfig: {
        ttl: this.config.env.CACHE_TTL,
        checkPeriod: this.config.env.CACHE_CHECK_PERIOD
      }
    });
  }

  /**
   * Load configuration files
   * @private
   */
  async _loadConfigurationFiles() {
    try {
      // Load defaults
      await this._loadConfigFile('defaults.js', 'defaults');
      
      // Load environment-specific config
      await this._loadConfigFile(`environments/${this.options.environment}.js`, `environments.${this.options.environment}`);
      
      // Load organizations config (enhanced existing one)
      await this._loadOrganizationsConfig();
      
      // Load project templates config (enhanced existing one)
      await this._loadProjectTemplatesConfig();
      
      // Load additional configuration files
      await this._loadConfigFile('validation.js', 'validation', false); // Optional
      
      this.logger.info('Configuration files loaded', {
        sections: Object.keys(this.config)
      });
    } catch (error) {
      this.logger.error('Failed to load configuration files', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Load a specific configuration file
   * @param {string} filename - Configuration file name
   * @param {string} section - Configuration section to store in
   * @param {boolean} required - Whether file is required
   * @private
   */
  async _loadConfigFile(filename, section, required = true) {
    const filePath = resolve(this.options.configPath, filename);
    
    if (!existsSync(filePath)) {
      if (required) {
        throw new Error(`Required configuration file not found: ${filename}`);
      }
      this.logger.debug('Optional configuration file not found', { filename });
      return;
    }

    try {
      // Dynamic import for ES modules
      const module = await import(`file://${filePath}?t=${Date.now()}`);
      const config = module.default || module;
      
      // Set configuration using dot notation
      this._setConfigByPath(section, config);
      
      if (this.options.enableHotReload) {
        this.watchedFiles.add(filePath);
      }
      
      this.logger.debug('Configuration file loaded', { filename, section });
    } catch (error) {
      this.logger.error('Failed to load configuration file', { 
        filename, 
        error: error.message 
      });
      
      if (required) {
        throw error;
      }
    }
  }

  /**
   * Load and enhance organizations configuration
   * @private
   */
  async _loadOrganizationsConfig() {
    try {
      const { ConfigManager: OrgConfigManager } = await import('./organizations.js');
      const orgManager = new OrgConfigManager();
      await orgManager.initialize();
      
      // Extract organization configurations
      const organizations = {};
      const orgIds = ['DevBusinessHub', 'DevPersonalHub', 'DevAcademicHub', 'DevEcosystem'];
      
      for (const orgId of orgIds) {
        organizations[orgId] = await orgManager.getOrganizationConfig(orgId);
      }
      
      this.config.organizations = organizations;
      
      this.logger.debug('Organizations configuration loaded', {
        organizationCount: Object.keys(organizations).length
      });
    } catch (error) {
      this.logger.error('Failed to load organizations config', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Load and enhance project templates configuration
   * @private
   */
  async _loadProjectTemplatesConfig() {
    try {
      const { ProjectTemplateManager } = await import('./project-templates.js');
      const templateManager = new ProjectTemplateManager();
      
      const templates = {};
      const availableTemplates = templateManager.getAvailableTemplates();
      
      for (const template of availableTemplates) {
        templates[template.id] = templateManager.getTemplate(template.id);
      }
      
      this.config.projectTemplates = templates;
      
      this.logger.debug('Project templates configuration loaded', {
        templateCount: Object.keys(templates).length
      });
    } catch (error) {
      this.logger.error('Failed to load project templates config', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Set configuration value by path
   * @param {string} path - Configuration path
   * @param {*} value - Configuration value
   * @private
   */
  _setConfigByPath(path, value) {
    const keys = path.split('.');
    let target = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in target) || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }
    
    target[keys[keys.length - 1]] = value;
  }

  /**
   * Validate configuration using Joi schema
   * @private
   */
  async _validateConfiguration() {
    const schema = this._getValidationSchema();
    
    try {
      const { error, value } = schema.validate(this.config, {
        allowUnknown: true,
        abortEarly: false
      });
      
      if (error) {
        const details = error.details.map(detail => detail.message).join(', ');
        throw new Error(`Configuration validation failed: ${details}`);
      }
      
      this.logger.debug('Configuration validation passed');
    } catch (error) {
      this.logger.error('Configuration validation failed', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get Joi validation schema
   * @returns {Joi.Schema} Validation schema
   * @private
   */
  _getValidationSchema() {
    return Joi.object({
      env: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'staging', 'production').required(),
        LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
        PORT: Joi.number().port().default(3000),
        GITHUB_TOKEN: Joi.string().required(),
        CACHE_TTL: Joi.number().positive().default(300),
        CACHE_CHECK_PERIOD: Joi.number().positive().default(60)
      }).required(),
      
      organizations: Joi.object().pattern(
        Joi.string(),
        Joi.object({
          id: Joi.string().required(),
          name: Joi.string().required(),
          type: Joi.string().valid('production', 'experimental', 'research', 'infrastructure').required(),
          settings: Joi.object().required(),
          projectFields: Joi.array().required(),
          projectViews: Joi.array().required(),
          workflows: Joi.array().required(),
          automation: Joi.object().required()
        })
      ),
      
      projectTemplates: Joi.object().pattern(
        Joi.string(),
        Joi.object({
          id: Joi.string().required(),
          name: Joi.string().required(),
          description: Joi.string().required(),
          organizationType: Joi.string().required(),
          fields: Joi.array().required(),
          views: Joi.array().required()
        })
      )
    });
  }

  /**
   * Setup hot reloading for configuration files
   * @private
   */
  _setupHotReload() {
    if (!this.options.enableHotReload) return;
    
    for (const filePath of this.watchedFiles) {
      watchFile(filePath, { interval: 1000 }, () => {
        this.logger.info('Configuration file changed, reloading...', { filePath });
        this.reload().catch(error => {
          this.logger.error('Hot reload failed', { error: error.message });
        });
      });
    }
    
    this.logger.debug('Hot reload setup complete', {
      watchedFiles: Array.from(this.watchedFiles)
    });
  }

  /**
   * Get default organization configuration
   * @param {string} organizationId - Organization identifier
   * @returns {Object} Default configuration
   * @private
   */
  _getDefaultOrganizationConfig(organizationId) {
    return {
      id: organizationId,
      name: organizationId,
      type: 'unknown',
      description: 'Default configuration for unknown organization',
      settings: {
        projectTemplate: 'basic',
        approvalRequired: false,
        autoDeployment: false,
        securityLevel: 'medium',
        qualityGates: ['basic-test']
      },
      projectFields: [
        { name: 'Status', type: 'single_select', options: ['To Do', 'In Progress', 'Done'] },
        { name: 'Priority', type: 'single_select', options: ['High', 'Medium', 'Low'] }
      ],
      projectViews: [
        { name: 'Basic Board', type: 'board', groupBy: 'Status' }
      ],
      workflows: ['basic-workflow'],
      automation: {
        issueLabeling: true,
        projectRouting: false,
        deploymentTriggers: false,
        notificationRules: []
      }
    };
  }
}

export default ConfigManager;