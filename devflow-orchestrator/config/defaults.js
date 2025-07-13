/**
 * @fileoverview Default Configuration for DevFlow Orchestrator
 * @version 1.0.0
 * @author DevEcosystem
 * 
 * Contains default configuration values that apply across all environments
 * These can be overridden by environment-specific configurations
 */

export default {
  // Application Configuration
  app: {
    name: 'DevFlow Orchestrator',
    version: '1.0.0',
    description: 'Intelligent project and workflow management system for GitHub ecosystem',
    homepage: 'https://github.com/DevEcosystem/ecosystem-central-command/tree/main/devflow-orchestrator'
  },

  // Server Configuration
  server: {
    port: 3000,
    host: 'localhost',
    timeout: 30000,
    maxRequestSize: '10mb',
    cors: {
      enabled: true,
      origins: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true
    }
  },

  // GitHub API Configuration
  github: {
    apiVersion: '2022-11-28',
    userAgent: 'DevFlow-Orchestrator/1.0.0',
    timeout: 15000,
    retryConfig: {
      retries: 3,
      retryDelay: 1000,
      retryDelayMultiplier: 2
    },
    rateLimit: {
      core: {
        limit: 5000,
        remaining: 5000,
        reset: null,
        windowMs: 3600000
      },
      graphql: {
        limit: 5000,
        remaining: 5000,
        reset: null,
        windowMs: 3600000
      }
    }
  },

  // Cache Configuration
  cache: {
    enabled: true,
    ttl: 300, // 5 minutes
    checkPeriod: 60, // 1 minute
    maxKeys: 1000,
    useClones: true,
    deleteOnExpire: true,
    enableLegacyCallbacks: false,
    errorOnMissing: false
  },

  // Logging Configuration
  logging: {
    level: 'info',
    format: 'json',
    colorize: false,
    timestamp: true,
    handleExceptions: true,
    handleRejections: true,
    exitOnError: false,
    maxsize: '10MB',
    maxFiles: 5,
    rotationFormat: false,
    datePattern: 'YYYY-MM-DD',
    auditFile: 'logs/audit.json',
    transports: [
      {
        type: 'console',
        enabled: true,
        level: 'info'
      },
      {
        type: 'file',
        enabled: true,
        filename: 'logs/application.log',
        level: 'info'
      },
      {
        type: 'file',
        enabled: true,
        filename: 'logs/error.log',
        level: 'error'
      }
    ]
  },

  // Rate Limiting Configuration
  rateLimiting: {
    enabled: true,
    windowMs: 900000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Security Configuration
  security: {
    cors: {
      enabled: true,
      origin: true,
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
          imgSrc: ["'self'", "data:", "https:"]
        }
      }
    },
    session: {
      secret: 'default-secret-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }
  },

  // Feature Flags
  features: {
    enableMetrics: true,
    enableWebhooks: true,
    enableHotReload: true,
    enableDebugMode: false,
    enableAnalytics: true,
    enableNotifications: true,
    enableProjectTemplates: true,
    enableOrganizationProfiles: true,
    enableWorkflowAutomation: true,
    enableIssueClassification: true
  },

  // Workflow Configuration
  workflows: {
    enabled: true,
    maxConcurrentJobs: 5,
    jobTimeout: 300000, // 5 minutes
    retryAttempts: 3,
    retryDelay: 5000,
    enableLogging: true,
    enableMetrics: true
  },

  // Project Templates Default Settings
  projectTemplates: {
    enabled: true,
    defaultTemplate: 'basic',
    autoApplyTemplates: true,
    validateFields: true,
    allowCustomFields: true,
    maxCustomFields: 10,
    enableTemplateInheritance: true
  },

  // Organization Profiles Default Settings
  organizationProfiles: {
    enabled: true,
    autoDetectOrganizationType: true,
    enableCustomProfiles: true,
    validateProfiles: true,
    enableProfileInheritance: false,
    defaultProfile: 'basic'
  },

  // Issue Classification Configuration
  issueClassification: {
    enabled: true,
    autoClassify: true,
    confidence: {
      threshold: 0.8,
      minThreshold: 0.6,
      maxThreshold: 0.95
    },
    categories: [
      'bug',
      'feature',
      'enhancement',
      'documentation',
      'question',
      'maintenance',
      'security',
      'performance'
    ],
    priorities: [
      'critical',
      'high',
      'medium',
      'low'
    ]
  },

  // Notification Configuration
  notifications: {
    enabled: true,
    channels: {
      email: {
        enabled: false,
        from: 'noreply@devflow.local',
        transport: 'smtp'
      },
      webhook: {
        enabled: true,
        timeout: 5000,
        retries: 3
      },
      console: {
        enabled: true,
        level: 'info'
      }
    },
    events: [
      'project.created',
      'project.updated',
      'issue.classified',
      'workflow.completed',
      'workflow.failed',
      'organization.updated'
    ]
  },

  // Analytics Configuration
  analytics: {
    enabled: true,
    collectMetrics: true,
    trackPerformance: true,
    trackUsage: true,
    trackErrors: true,
    retentionDays: 30,
    anonymizeData: true,
    enableReporting: true,
    reportingInterval: 86400000, // 24 hours
    batchSize: 100
  },

  // Health Check Configuration
  healthCheck: {
    enabled: true,
    interval: 30000, // 30 seconds
    timeout: 5000,
    endpoints: [
      'github-api',
      'cache',
      'database',
      'external-services'
    ],
    thresholds: {
      response_time: 5000,
      error_rate: 0.05,
      availability: 0.99
    }
  },

  // Development Configuration
  development: {
    enableDebugMode: true,
    enableHotReload: true,
    enableDetailedErrors: true,
    enablePerformanceProfiling: true,
    mockExternalServices: false,
    seedData: {
      enabled: true,
      loadDemoProjects: true,
      loadDemoOrganizations: true
    }
  }
};