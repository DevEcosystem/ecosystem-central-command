/**
 * @fileoverview Staging Environment Configuration
 * @version 1.0.0
 * @author DevEcosystem
 * 
 * Staging-specific configuration overrides
 * Balanced between development flexibility and production security
 */

export default {
  // Server Configuration - Staging environment
  server: {
    port: parseInt(process.env.PORT) || 3000,
    host: '0.0.0.0',
    timeout: 45000, // Longer timeout than production for testing
    cors: {
      origins: process.env.ALLOWED_ORIGINS?.split(',') || [
        'https://staging.devflow.com',
        'http://localhost:3000'
      ],
      credentials: true
    }
  },

  // Logging Configuration - Detailed for staging
  logging: {
    level: 'debug',
    format: 'json',
    colorize: false,
    transports: [
      {
        type: 'console',
        enabled: true,
        level: 'info'
      },
      {
        type: 'file',
        enabled: true,
        filename: 'logs/staging.log',
        level: 'debug',
        maxsize: '20MB',
        maxFiles: 5
      },
      {
        type: 'file',
        enabled: true,
        filename: 'logs/staging-error.log',
        level: 'error',
        maxsize: '20MB',
        maxFiles: 3
      }
    ]
  },

  // Cache Configuration - Moderate for staging
  cache: {
    ttl: 300, // 5 minutes
    checkPeriod: 60, // 1 minute
    maxKeys: 5000 // Medium cache size
  },

  // GitHub API Configuration - Standard settings
  github: {
    timeout: 20000, // Slightly longer for staging
    retryConfig: {
      retries: 2,
      retryDelay: 1500,
      retryDelayMultiplier: 2
    }
  },

  // Rate Limiting - Moderate for staging
  rateLimiting: {
    enabled: true,
    windowMs: 600000, // 10 minutes
    maxRequests: 200, // Higher than production for testing
    message: 'Rate limit exceeded in staging environment.',
    standardHeaders: true
  },

  // Security - Production-like but with some flexibility
  security: {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || true,
      credentials: true
    },
    helmet: {
      enabled: true,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-eval'"], // Allow eval for debugging
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://api.github.com", "ws:"],
          fontSrc: ["'self'", "https:", "data:"]
        }
      }
    },
    session: {
      secret: process.env.SESSION_SECRET || 'staging-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS if available
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
      }
    }
  },

  // Feature Flags - Most features enabled for testing
  features: {
    enableMetrics: true,
    enableWebhooks: true,
    enableHotReload: false, // Disabled in staging
    enableDebugMode: true, // Enabled for troubleshooting
    enableAnalytics: true,
    enableNotifications: true,
    enableProjectTemplates: true,
    enableOrganizationProfiles: true,
    enableWorkflowAutomation: true,
    enableIssueClassification: true
  },

  // Development Specific Features - Limited for staging
  development: {
    enableDebugMode: true,
    enableHotReload: false,
    enableDetailedErrors: true, // Helpful for staging debugging
    enablePerformanceProfiling: true,
    mockExternalServices: false,
    enableRequestLogging: true,
    enableSqlLogging: false,
    seedData: {
      enabled: true,
      loadDemoProjects: true,
      loadDemoOrganizations: true,
      loadDemoIssues: false,
      loadDemoUsers: false
    }
  },

  // Notification Configuration - Testing setup
  notifications: {
    enabled: true,
    channels: {
      email: {
        enabled: false, // Usually disabled in staging
        from: 'staging@devflow.com'
      },
      webhook: {
        enabled: true,
        timeout: 8000, // Longer timeout for debugging
        retries: 2
      },
      console: {
        enabled: true,
        level: 'info'
      }
    }
  },

  // Analytics - Reduced collection for staging
  analytics: {
    enabled: true,
    collectMetrics: true,
    trackPerformance: true,
    trackUsage: false, // Don't track staging usage
    trackErrors: true,
    retentionDays: 14, // Shorter retention
    anonymizeData: true,
    enableReporting: true,
    reportingInterval: 43200000, // 12 hours
    batchSize: 100
  },

  // Health Check - Frequent for staging
  healthCheck: {
    enabled: true,
    interval: 30000, // 30 seconds
    timeout: 8000,
    endpoints: [
      'github-api',
      'cache',
      'database',
      'external-services'
    ],
    thresholds: {
      response_time: 8000, // More relaxed than production
      error_rate: 0.05,
      availability: 0.98
    }
  },

  // Workflow Configuration - Testing optimized
  workflows: {
    enabled: true,
    maxConcurrentJobs: 5, // Moderate concurrency
    jobTimeout: 600000, // 10 minutes for longer testing
    retryAttempts: 2,
    retryDelay: 5000,
    enableLogging: true,
    enableMetrics: true
  },

  // Project Templates - Validation enabled
  projectTemplates: {
    enabled: true,
    defaultTemplate: 'production-ready',
    autoApplyTemplates: true,
    validateFields: true,
    allowCustomFields: true,
    maxCustomFields: 15, // More than production for testing
    enableTemplateInheritance: true
  },

  // Organization Profiles - Testing configuration
  organizationProfiles: {
    enabled: true,
    autoDetectOrganizationType: true,
    enableCustomProfiles: true,
    validateProfiles: true,
    enableProfileInheritance: true,
    defaultProfile: 'infrastructure'
  },

  // Issue Classification - Moderate confidence
  issueClassification: {
    enabled: true,
    autoClassify: true,
    confidence: {
      threshold: 0.75, // Between dev and production
      minThreshold: 0.6,
      maxThreshold: 0.9
    }
  }
};