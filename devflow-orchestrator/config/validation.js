/**
 * @fileoverview Configuration Validation Schemas
 * @version 1.0.0
 * @author DevEcosystem
 * 
 * Joi validation schemas for all configuration sections
 * Ensures configuration integrity and provides clear error messages
 */

import Joi from 'joi';

/**
 * Environment variables validation schema
 */
export const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production')
    .default('development')
    .description('Application environment'),
    
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info')
    .description('Logging level'),
    
  PORT: Joi.number()
    .port()
    .default(3000)
    .description('Server port'),
    
  // GitHub Configuration
  GITHUB_TOKEN: Joi.string()
    .pattern(/^ghp_[a-zA-Z0-9]{36,40}$/)
    .required()
    .description('GitHub Personal Access Token'),
    
  GITHUB_WEBHOOK_SECRET: Joi.string()
    .min(8)
    .optional()
    .description('GitHub webhook secret'),
    
  GITHUB_APP_ID: Joi.number()
    .optional()
    .description('GitHub App ID'),
    
  GITHUB_PRIVATE_KEY: Joi.string()
    .optional()
    .description('GitHub App private key'),
    
  // Cache Configuration
  CACHE_TTL: Joi.number()
    .positive()
    .default(300)
    .description('Cache TTL in seconds'),
    
  CACHE_CHECK_PERIOD: Joi.number()
    .positive()
    .default(60)
    .description('Cache check period in seconds'),
    
  // Rate Limiting
  RATE_LIMIT_WINDOW: Joi.number()
    .positive()
    .default(3600000)
    .description('Rate limit window in milliseconds'),
    
  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .positive()
    .default(5000)
    .description('Maximum requests per window'),
    
  // Security
  WEBHOOK_SECRET: Joi.string()
    .min(8)
    .optional()
    .description('General webhook secret'),
    
  JWT_SECRET: Joi.string()
    .min(32)
    .optional()
    .description('JWT signing secret'),
    
  SESSION_SECRET: Joi.string()
    .min(16)
    .optional()
    .description('Session signing secret'),
    
  // Feature Flags
  ENABLE_HOT_RELOAD: Joi.boolean()
    .default(true)
    .description('Enable configuration hot reloading'),
    
  ENABLE_METRICS: Joi.boolean()
    .default(true)
    .description('Enable metrics collection'),
    
  ENABLE_WEBHOOKS: Joi.boolean()
    .default(true)
    .description('Enable webhook processing'),
    
  // Email Configuration (Optional)
  SMTP_HOST: Joi.string()
    .hostname()
    .optional()
    .description('SMTP server hostname'),
    
  SMTP_PORT: Joi.number()
    .port()
    .default(587)
    .when('SMTP_HOST', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .description('SMTP server port'),
    
  SMTP_USER: Joi.string()
    .email()
    .optional()
    .description('SMTP username'),
    
  SMTP_PASS: Joi.string()
    .optional()
    .description('SMTP password'),
    
  SMTP_SECURE: Joi.boolean()
    .default(false)
    .description('Use TLS for SMTP'),
    
  EMAIL_FROM: Joi.string()
    .email()
    .default('noreply@devflow.com')
    .description('Default from email address'),
    
  // External URLs
  ALLOWED_ORIGINS: Joi.string()
    .optional()
    .description('Comma-separated list of allowed CORS origins')
});

/**
 * Server configuration validation schema
 */
export const serverSchema = Joi.object({
  port: Joi.number().port().required(),
  host: Joi.string().required(),
  timeout: Joi.number().positive().required(),
  maxRequestSize: Joi.string().optional(),
  cors: Joi.object({
    enabled: Joi.boolean().required(),
    origins: Joi.array().items(Joi.string().uri()).required(),
    credentials: Joi.boolean().required()
  }).required()
});

/**
 * GitHub API configuration validation schema
 */
export const githubSchema = Joi.object({
  apiVersion: Joi.string().required(),
  userAgent: Joi.string().required(),
  timeout: Joi.number().positive().required(),
  retryConfig: Joi.object({
    retries: Joi.number().min(0).max(10).required(),
    retryDelay: Joi.number().positive().required(),
    retryDelayMultiplier: Joi.number().min(1).max(5).required()
  }).required(),
  rateLimit: Joi.object({
    core: Joi.object({
      limit: Joi.number().positive().required(),
      remaining: Joi.number().min(0).required(),
      reset: Joi.date().allow(null).required(),
      windowMs: Joi.number().positive().required()
    }).required(),
    graphql: Joi.object({
      limit: Joi.number().positive().required(),
      remaining: Joi.number().min(0).required(),
      reset: Joi.date().allow(null).required(),
      windowMs: Joi.number().positive().required()
    }).required()
  }).required()
});

/**
 * Cache configuration validation schema
 */
export const cacheSchema = Joi.object({
  enabled: Joi.boolean().required(),
  ttl: Joi.number().positive().required(),
  checkPeriod: Joi.number().positive().required(),
  maxKeys: Joi.number().positive().required(),
  useClones: Joi.boolean().required(),
  deleteOnExpire: Joi.boolean().required(),
  enableLegacyCallbacks: Joi.boolean().required(),
  errorOnMissing: Joi.boolean().required()
});

/**
 * Logging configuration validation schema
 */
export const loggingSchema = Joi.object({
  level: Joi.string().valid('error', 'warn', 'info', 'debug').required(),
  format: Joi.string().valid('json', 'simple', 'combined').required(),
  colorize: Joi.boolean().required(),
  timestamp: Joi.boolean().required(),
  handleExceptions: Joi.boolean().required(),
  handleRejections: Joi.boolean().required(),
  exitOnError: Joi.boolean().required(),
  maxsize: Joi.string().optional(),
  maxFiles: Joi.number().positive().optional(),
  transports: Joi.array().items(
    Joi.object({
      type: Joi.string().valid('console', 'file').required(),
      enabled: Joi.boolean().required(),
      level: Joi.string().valid('error', 'warn', 'info', 'debug').optional(),
      filename: Joi.string().when('type', {
        is: 'file',
        then: Joi.required(),
        otherwise: Joi.forbidden()
      }),
      colorize: Joi.boolean().when('type', {
        is: 'console',
        then: Joi.optional(),
        otherwise: Joi.forbidden()
      })
    })
  ).min(1).required()
});

/**
 * Organization configuration validation schema
 */
export const organizationSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  type: Joi.string()
    .valid('production', 'experimental', 'research', 'infrastructure')
    .required(),
  description: Joi.string().required(),
  settings: Joi.object({
    projectTemplate: Joi.string().required(),
    approvalRequired: Joi.boolean().required(),
    autoDeployment: Joi.boolean().required(),
    securityLevel: Joi.string().valid('low', 'medium', 'high').required(),
    qualityGates: Joi.array().items(Joi.string()).required()
  }).required(),
  projectFields: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      type: Joi.string().valid(
        'single_select', 'assignees', 'iteration', 'number', 'date', 'text'
      ).required(),
      options: Joi.array().items(Joi.string()).when('type', {
        is: 'single_select',
        then: Joi.required(),
        otherwise: Joi.optional()
      })
    })
  ).required(),
  projectViews: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      type: Joi.string().valid('board', 'table').required(),
      groupBy: Joi.string().optional(),
      sortBy: Joi.string().optional(),
      filterBy: Joi.string().optional()
    })
  ).required(),
  workflows: Joi.array().items(Joi.string()).required(),
  automation: Joi.object({
    issueLabeling: Joi.boolean().required(),
    projectRouting: Joi.boolean().required(),
    deploymentTriggers: Joi.boolean().required(),
    notificationRules: Joi.array().items(Joi.string()).required()
  }).required()
});

/**
 * Project template field validation schema
 */
export const templateFieldSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string()
    .valid('SINGLE_SELECT', 'ASSIGNEES', 'ITERATION', 'NUMBER', 'DATE', 'TEXT')
    .required(),
  options: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      color: Joi.string()
        .valid('RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE', 'PURPLE', 'PINK', 'GRAY')
        .required()
    })
  ).when('type', {
    is: 'SINGLE_SELECT',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

/**
 * Project template view validation schema
 */
export const templateViewSchema = Joi.object({
  name: Joi.string().required(),
  layout: Joi.string().valid('BOARD_LAYOUT', 'TABLE_LAYOUT').required(),
  groupBy: Joi.string().optional(),
  sortBy: Joi.string().optional(),
  filterBy: Joi.string().optional()
});

/**
 * Project template validation schema
 */
export const projectTemplateSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().required(),
  organizationType: Joi.string()
    .valid('production', 'experimental', 'research', 'infrastructure')
    .required(),
  settings: Joi.object({
    public: Joi.boolean().required(),
    securityLevel: Joi.string().valid('low', 'medium', 'high').required(),
    approvalRequired: Joi.boolean().required(),
    autoDeployment: Joi.boolean().required()
  }).required(),
  fields: Joi.array().items(templateFieldSchema).min(1).required(),
  views: Joi.array().items(templateViewSchema).min(1).required(),
  workflows: Joi.array().items(Joi.string()).required(),
  automationRules: Joi.object({
    issueLabeling: Joi.boolean().required(),
    projectRouting: Joi.boolean().required(),
    deploymentTriggers: Joi.boolean().required(),
    notificationRules: Joi.array().items(Joi.string()).required()
  }).required()
});

/**
 * Complete configuration validation schema
 */
export const configSchema = Joi.object({
  env: envSchema.required(),
  app: Joi.object({
    name: Joi.string().required(),
    version: Joi.string().pattern(/^\d+\.\d+\.\d+$/).required(),
    description: Joi.string().required(),
    homepage: Joi.string().uri().optional()
  }).optional(),
  server: serverSchema.optional(),
  github: githubSchema.optional(),
  cache: cacheSchema.optional(),
  logging: loggingSchema.optional(),
  organizations: Joi.object().pattern(
    Joi.string(),
    organizationSchema
  ).optional(),
  projectTemplates: Joi.object().pattern(
    Joi.string(),
    projectTemplateSchema
  ).optional(),
  features: Joi.object().pattern(
    Joi.string(),
    Joi.boolean()
  ).optional(),
  security: Joi.object().optional(),
  analytics: Joi.object().optional(),
  workflows: Joi.object().optional(),
  notifications: Joi.object().optional(),
  healthCheck: Joi.object().optional(),
  development: Joi.object().optional()
});

/**
 * Validate configuration section
 * @param {Object} config - Configuration to validate
 * @param {string} section - Section name for specific validation
 * @returns {Object} Validation result
 */
export function validateConfig(config, section = null) {
  let schema;
  
  if (section) {
    switch (section) {
      case 'env':
        schema = envSchema;
        break;
      case 'server':
        schema = serverSchema;
        break;
      case 'github':
        schema = githubSchema;
        break;
      case 'cache':
        schema = cacheSchema;
        break;
      case 'logging':
        schema = loggingSchema;
        break;
      case 'organization':
        schema = organizationSchema;
        break;
      case 'projectTemplate':
        schema = projectTemplateSchema;
        break;
      default:
        throw new Error(`Unknown configuration section: ${section}`);
    }
  } else {
    schema = configSchema;
  }
  
  return schema.validate(config, {
    allowUnknown: true,
    abortEarly: false,
    stripUnknown: false
  });
}

/**
 * Validate environment variables
 * @param {Object} env - Environment variables object
 * @returns {Object} Validation result
 */
export function validateEnv(env = process.env) {
  return envSchema.validate(env, {
    allowUnknown: true,
    abortEarly: false,
    stripUnknown: false
  });
}

export default {
  envSchema,
  serverSchema,
  githubSchema,
  cacheSchema,
  loggingSchema,
  organizationSchema,
  projectTemplateSchema,
  configSchema,
  validateConfig,
  validateEnv
};