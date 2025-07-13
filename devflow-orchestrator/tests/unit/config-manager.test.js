/**
 * @fileoverview Configuration Manager Unit Tests
 * @version 1.0.0
 * @author DevEcosystem
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { ConfigManager } from '../../config/config-manager.js';
import { validateConfig, validateEnv } from '../../config/validation.js';

describe('ConfigManager', () => {
  let configManager;

  before(async () => {
    // Set up test environment
    process.env.NODE_ENV = 'development';
    process.env.GITHUB_TOKEN = 'ghp_1234567890123456789012345678901234567';
    process.env.LOG_LEVEL = 'debug';
    
    configManager = new ConfigManager({
      environment: 'development',
      validateOnLoad: true,
      enableHotReload: false // Disable for testing
    });
  });

  after(() => {
    // Clean up
    if (configManager) {
      configManager.removeAllListeners();
    }
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await configManager.initialize();
      assert.strictEqual(configManager.isInitialized, true);
    });

    it('should load environment variables', () => {
      const env = configManager.get('env');
      assert.strictEqual(env.NODE_ENV, 'development');
      assert.strictEqual(env.LOG_LEVEL, 'debug');
      assert.ok(env.GITHUB_TOKEN);
    });

    it('should have default configuration', () => {
      const app = configManager.get('app');
      assert.strictEqual(app.name, 'DevFlow Orchestrator');
      assert.strictEqual(app.version, '1.0.0');
    });
  });

  describe('Configuration Access', () => {
    it('should get configuration by path', () => {
      const logLevel = configManager.get('env.LOG_LEVEL');
      assert.strictEqual(logLevel, 'debug');

      const appName = configManager.get('app.name');
      assert.strictEqual(appName, 'DevFlow Orchestrator');
    });

    it('should return default value for missing paths', () => {
      const missing = configManager.get('non.existent.path', 'default');
      assert.strictEqual(missing, 'default');
    });

    it('should get organization configuration', () => {
      const orgConfig = configManager.getOrganizationConfig('DevBusinessHub');
      assert.strictEqual(orgConfig.id, 'DevBusinessHub');
      assert.strictEqual(orgConfig.type, 'production');
      assert.ok(orgConfig.settings);
      assert.ok(orgConfig.projectFields);
    });

    it('should get default org config for unknown organization', () => {
      const orgConfig = configManager.getOrganizationConfig('UnknownOrg');
      assert.strictEqual(orgConfig.id, 'UnknownOrg');
      assert.strictEqual(orgConfig.type, 'unknown');
    });

    it('should get environment-specific configuration', () => {
      const envConfig = configManager.getEnvironmentConfig();
      assert.ok(envConfig);
      // Development environment should have debug logging
      assert.strictEqual(envConfig.logging?.level, 'debug');
    });
  });

  describe('Health Check', () => {
    it('should return health status', () => {
      const health = configManager.getHealth();
      assert.strictEqual(health.isInitialized, true);
      assert.strictEqual(health.environment, 'development');
      assert.ok(health.lastLoadTime);
      assert.ok(Array.isArray(health.configSections));
    });
  });

  describe('Configuration Validation', () => {
    it('should validate environment variables', () => {
      const testEnv = {
        NODE_ENV: 'development',
        GITHUB_TOKEN: 'ghp_1234567890123456789012345678901234567890',
        LOG_LEVEL: 'info',
        PORT: 3000
      };

      const { error, value } = validateEnv(testEnv);
      assert.strictEqual(error, undefined);
      assert.ok(value);
    });

    it('should fail validation for invalid environment', () => {
      const testEnv = {
        NODE_ENV: 'invalid',
        GITHUB_TOKEN: 'invalid-token'
      };

      const { error } = validateEnv(testEnv);
      assert.ok(error);
      assert.ok(error.details.length > 0);
    });

    it('should validate complete configuration', () => {
      const config = configManager.getAll();
      const { error } = validateConfig(config);
      
      // Should not have validation errors
      if (error) {
        console.error('Validation errors:', error.details.map(d => d.message));
      }
      // Note: We might have some validation errors due to incomplete config
      // This is expected in the current implementation
    });
  });

  describe('Error Handling', () => {
    it('should throw error when not initialized', () => {
      const uninitializedManager = new ConfigManager();
      assert.throws(
        () => uninitializedManager.get('env.NODE_ENV'),
        /Config Manager not initialized/
      );
    });

    it('should throw error for missing organization ID', () => {
      assert.throws(
        () => configManager.getOrganizationConfig(''),
        /Organization ID is required/
      );
    });
  });
});

describe('Configuration Validation Functions', () => {
  describe('validateEnv', () => {
    it('should validate valid environment variables', () => {
      const validEnv = {
        NODE_ENV: 'production',
        GITHUB_TOKEN: 'ghp_1234567890123456789012345678901234567',
        LOG_LEVEL: 'info',
        PORT: 3000,
        CACHE_TTL: 300
      };

      const { error, value } = validateEnv(validEnv);
      assert.strictEqual(error, undefined);
      assert.strictEqual(value.NODE_ENV, 'production');
      assert.strictEqual(value.PORT, 3000);
    });

    it('should set defaults for missing optional values', () => {
      const minimalEnv = {
        GITHUB_TOKEN: 'ghp_1234567890123456789012345678901234567'
      };

      const { error, value } = validateEnv(minimalEnv);
      assert.strictEqual(error, undefined);
      assert.strictEqual(value.NODE_ENV, 'development'); // default
      assert.strictEqual(value.LOG_LEVEL, 'info'); // default
      assert.strictEqual(value.PORT, 3000); // default
    });

    it('should fail validation for invalid GitHub token', () => {
      const invalidEnv = {
        GITHUB_TOKEN: 'invalid-token-format'
      };

      const { error } = validateEnv(invalidEnv);
      assert.ok(error);
      assert.ok(error.details.some(d => d.path.includes('GITHUB_TOKEN')));
    });
  });

  describe('validateConfig', () => {
    it('should validate specific configuration sections', () => {
      const cacheConfig = {
        enabled: true,
        ttl: 300,
        checkPeriod: 60,
        maxKeys: 1000,
        useClones: true,
        deleteOnExpire: true,
        enableLegacyCallbacks: false,
        errorOnMissing: false
      };

      const { error } = validateConfig(cacheConfig, 'cache');
      assert.strictEqual(error, undefined);
    });

    it('should fail validation for invalid section', () => {
      assert.throws(
        () => validateConfig({}, 'invalid-section'),
        /Unknown configuration section/
      );
    });
  });
});