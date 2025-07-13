/**
 * @fileoverview Production Environment Configuration
 * @version 1.0.0
 * @author DevEcosystem
 * 
 * Production-specific configuration overrides
 * Optimized for security, performance, and reliability
 */

export default {
  // Server Configuration - Production hardened
  server: {
    port: parseInt(process.env.PORT) || 3000,
    host: '0.0.0.0',
    timeout: 30000,
    cors: {
      origins: process.env.ALLOWED_ORIGINS?.split(',') || ['https://devflow.production.com'],
      credentials: true
    }
  },

  // Logging Configuration - Structured logging for production
  logging: {
    level: 'info',
    format: 'json',
    colorize: false,
    transports: [
      {
        type: 'console',
        enabled: true,
        level: 'warn' // Only warnings and errors to console
      },
      {
        type: 'file',
        enabled: true,
        filename: 'logs/production.log',
        level: 'info',
        maxsize: '50MB',
        maxFiles: 10
      },
      {
        type: 'file',
        enabled: true,
        filename: 'logs/error.log',
        level: 'error',
        maxsize: '50MB',
        maxFiles: 5
      }
    ]
  },

  // Cache Configuration - Optimized for production
  cache: {
    ttl: 900, // 15 minutes
    checkPeriod: 120, // 2 minutes
    maxKeys: 10000 // Larger cache for production
  },

  // GitHub API Configuration - Production settings
  github: {
    timeout: 15000,
    retryConfig: {
      retries: 3,
      retryDelay: 2000,
      retryDelayMultiplier: 2
    }
  },

  // Rate Limiting - Strict for production
  rateLimiting: {
    enabled: true,
    windowMs: 900000, // 15 minutes
    maxRequests: 100,
    message: 'Rate limit exceeded. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  },

  // Security - Maximum security for production
  security: {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || false,
      credentials: true,
      optionsSuccessStatus: 200
    },
    helmet: {
      enabled: true,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://api.github.com"],
          fontSrc: ["'self'", "https:", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    },
    session: {
      secret: process.env.SESSION_SECRET || 'change-this-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: true, // HTTPS only
        httpOnly: true,
        maxAge: 12 * 60 * 60 * 1000, // 12 hours
        sameSite: 'strict'
      }
    }
  },

  // Feature Flags - Conservative for production
  features: {
    enableMetrics: true,
    enableWebhooks: true,
    enableHotReload: false, // Disabled in production
    enableDebugMode: false, // Disabled in production
    enableAnalytics: true,
    enableNotifications: true,
    enableProjectTemplates: true,
    enableOrganizationProfiles: true,
    enableWorkflowAutomation: true,
    enableIssueClassification: true
  },

  // Development Specific Features - All disabled for production
  development: {
    enableDebugMode: false,
    enableHotReload: false,
    enableDetailedErrors: false,
    enablePerformanceProfiling: false,
    mockExternalServices: false,
    enableRequestLogging: false,
    enableSqlLogging: false,
    seedData: {
      enabled: false,
      loadDemoProjects: false,
      loadDemoOrganizations: false,
      loadDemoIssues: false,
      loadDemoUsers: false
    }
  },

  // Notification Configuration - Full production setup
  notifications: {
    enabled: true,
    channels: {
      email: {
        enabled: process.env.SMTP_HOST ? true : false,
        from: process.env.EMAIL_FROM || 'noreply@devflow.com',
        transport: 'smtp',
        smtp: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        }
      },
      webhook: {
        enabled: true,
        timeout: 5000,
        retries: 3
      },
      console: {
        enabled: false // Disable console notifications in production
      }
    }
  },

  // Analytics - Full collection for production
  analytics: {
    enabled: true,
    collectMetrics: true,
    trackPerformance: true,
    trackUsage: true,
    trackErrors: true,
    retentionDays: 90, // Longer retention
    anonymizeData: true,
    enableReporting: true,
    reportingInterval: 86400000, // 24 hours
    batchSize: 1000 // Larger batches for efficiency
  },

  // Health Check - Standard intervals for production
  healthCheck: {
    enabled: true,
    interval: 60000, // 1 minute
    timeout: 5000,
    endpoints: [
      'github-api',
      'cache',
      'database',
      'external-services'
    ],
    thresholds: {
      response_time: 3000, // Strict response time
      error_rate: 0.01, // Very low error rate
      availability: 0.999 // High availability requirement
    }
  },

  // Workflow Configuration - Production optimized
  workflows: {
    enabled: true,
    maxConcurrentJobs: 10, // Higher concurrency for production
    jobTimeout: 300000, // 5 minutes
    retryAttempts: 3,
    retryDelay: 10000, // 10 seconds
    enableLogging: true,
    enableMetrics: true
  },

  // Project Templates - Production validated
  projectTemplates: {
    enabled: true,
    defaultTemplate: 'production-ready',
    autoApplyTemplates: true,
    validateFields: true, // Always validate in production
    allowCustomFields: true,
    maxCustomFields: 10,
    enableTemplateInheritance: true
  },

  // Organization Profiles - Production validated
  organizationProfiles: {
    enabled: true,
    autoDetectOrganizationType: true,
    enableCustomProfiles: true,
    validateProfiles: true, // Always validate in production
    enableProfileInheritance: false,
    defaultProfile: 'production'
  },

  // Issue Classification - High confidence for production
  issueClassification: {
    enabled: true,
    autoClassify: true,
    confidence: {
      threshold: 0.85, // Higher threshold for production
      minThreshold: 0.7,
      maxThreshold: 0.95
    }
  }
};