/**
 * @fileoverview Development Environment Configuration
 * @version 1.0.0
 * @author DevEcosystem
 * 
 * Development-specific configuration overrides
 * Optimized for local development and debugging
 */

export default {
  // Server Configuration
  server: {
    port: 3000,
    host: '0.0.0.0',
    timeout: 60000, // Longer timeout for debugging
    cors: {
      origins: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080'],
      credentials: true
    }
  },

  // Logging Configuration - More verbose for development
  logging: {
    level: 'debug',
    colorize: true,
    format: 'simple',
    transports: [
      {
        type: 'console',
        enabled: true,
        level: 'debug',
        colorize: true
      },
      {
        type: 'file',
        enabled: true,
        filename: 'logs/development.log',
        level: 'debug'
      }
    ]
  },

  // Cache Configuration - Shorter TTL for development
  cache: {
    ttl: 60, // 1 minute for faster development iteration
    checkPeriod: 10, // Check every 10 seconds
    maxKeys: 100 // Smaller cache for development
  },

  // GitHub API Configuration - More relaxed for development
  github: {
    timeout: 30000, // Longer timeout for debugging
    retryConfig: {
      retries: 1, // Fewer retries for faster feedback
      retryDelay: 500,
      retryDelayMultiplier: 1.5
    }
  },

  // Rate Limiting - Relaxed for development
  rateLimiting: {
    enabled: false, // Disable rate limiting in development
    windowMs: 60000, // 1 minute
    maxRequests: 1000 // Higher limit
  },

  // Security - Relaxed for development
  security: {
    cors: {
      origin: true, // Allow all origins in development
      credentials: true
    },
    helmet: {
      enabled: false // Disable helmet in development for easier debugging
    },
    session: {
      secret: 'development-secret-not-for-production',
      cookie: {
        secure: false, // HTTP is fine in development
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
      }
    }
  },

  // Feature Flags - Enable all features for development
  features: {
    enableMetrics: true,
    enableWebhooks: true,
    enableHotReload: true,
    enableDebugMode: true,
    enableAnalytics: true,
    enableNotifications: true,
    enableProjectTemplates: true,
    enableOrganizationProfiles: true,
    enableWorkflowAutomation: true,
    enableIssueClassification: true
  },

  // Development Specific Features
  development: {
    enableDebugMode: true,
    enableHotReload: true,
    enableDetailedErrors: true,
    enablePerformanceProfiling: true,
    mockExternalServices: false,
    enableRequestLogging: true,
    enableSqlLogging: true,
    seedData: {
      enabled: true,
      loadDemoProjects: true,
      loadDemoOrganizations: true,
      loadDemoIssues: true,
      loadDemoUsers: true
    }
  },

  // Notification Configuration - Console only for development
  notifications: {
    enabled: true,
    channels: {
      email: {
        enabled: false // Disable email in development
      },
      webhook: {
        enabled: true,
        timeout: 10000 // Longer timeout for debugging
      },
      console: {
        enabled: true,
        level: 'debug'
      }
    }
  },

  // Analytics - Reduced collection for development
  analytics: {
    enabled: true,
    collectMetrics: true,
    trackPerformance: true,
    trackUsage: false, // Don't track usage in development
    trackErrors: true,
    retentionDays: 7, // Shorter retention
    batchSize: 10 // Smaller batches
  },

  // Health Check - More frequent for development
  healthCheck: {
    enabled: true,
    interval: 10000, // 10 seconds
    timeout: 2000,
    thresholds: {
      response_time: 10000, // More relaxed
      error_rate: 0.1, // Allow more errors
      availability: 0.95
    }
  },

  // Workflow Configuration - Faster execution for development
  workflows: {
    maxConcurrentJobs: 3, // Lower concurrency for development
    jobTimeout: 120000, // 2 minutes
    retryAttempts: 1, // Fewer retries
    retryDelay: 1000,
    enableLogging: true,
    enableMetrics: true
  },

  // Project Templates - More permissive for development
  projectTemplates: {
    enabled: true,
    defaultTemplate: 'lightweight',
    autoApplyTemplates: true,
    validateFields: false, // Skip validation for faster development
    allowCustomFields: true,
    maxCustomFields: 20, // More custom fields allowed
    enableTemplateInheritance: true
  },

  // Organization Profiles - Auto-detect for development
  organizationProfiles: {
    enabled: true,
    autoDetectOrganizationType: true,
    enableCustomProfiles: true,
    validateProfiles: false, // Skip validation for faster development
    enableProfileInheritance: true,
    defaultProfile: 'experimental'
  },

  // Issue Classification - Lower confidence for development
  issueClassification: {
    enabled: true,
    autoClassify: true,
    confidence: {
      threshold: 0.6, // Lower threshold for more classifications
      minThreshold: 0.4,
      maxThreshold: 0.9
    }
  }
};