/**
 * @fileoverview DevFlow Orchestrator - Main coordination engine
 * @version 1.0.0
 * @author DevEcosystem
 */

import { EventEmitter } from 'events';
import winston from 'winston';
import { ProjectManager } from './project-manager.js';
import { IssueClassifier } from './issue-classifier.js';
import { WorkflowEngine } from './workflow-engine.js';
import { ConfigManager } from '../config/organizations.js';
import { Logger } from '../utils/logger.js';
import { Cache } from '../utils/cache.js';

/**
 * Main DevFlow Orchestrator class
 * Coordinates all DevFlow operations and subsystems
 */
export class DevFlowOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = config;
    this.logger = new Logger('DevFlowOrchestrator');
    this.cache = new Cache();
    this.isInitialized = false;
    this.health = {
      status: 'starting',
      components: {},
      lastCheck: null
    };

    // Initialize subsystems
    this.configManager = new ConfigManager(config.organizations);
    this.projectManager = new ProjectManager(config.github);
    this.issueClassifier = new IssueClassifier(config.classification);
    this.workflowEngine = new WorkflowEngine(config.workflows);

    this.logger.info('DevFlow Orchestrator created', { version: '1.0.0' });
  }

  /**
   * Initialize the orchestrator and all subsystems
   * @param {Object} options - Initialization options
   * @returns {Promise<boolean>} - Success status
   */
  async initialize(options = {}) {
    try {
      this.logger.info('Initializing DevFlow Orchestrator...');
      
      // Initialize configuration
      await this.configManager.initialize();
      this.logger.info('Configuration manager initialized');

      // Initialize GitHub API connections
      await this.projectManager.initialize();
      this.logger.info('Project manager initialized');

      // Initialize classification engine
      await this.issueClassifier.initialize();
      this.logger.info('Issue classifier initialized');

      // Initialize workflow engine
      await this.workflowEngine.initialize();
      this.logger.info('Workflow engine initialized');

      // Set up event listeners
      this._setupEventListeners();

      // Perform health check
      await this._performHealthCheck();

      this.isInitialized = true;
      this.emit('initialized');
      this.logger.info('DevFlow Orchestrator fully initialized');

      return true;
    } catch (error) {
      this.logger.error('Failed to initialize DevFlow Orchestrator', { error: error.message });
      this.health.status = 'failed';
      throw error;
    }
  }

  /**
   * Create a new GitHub Project V2 for a repository
   * @param {Object} repository - Repository information
   * @param {string} organization - Organization identifier
   * @returns {Promise<Object>} - Created project details
   */
  async createProject(repository, organization) {
    this._ensureInitialized();
    
    try {
      this.logger.info('Creating project for repository', { 
        repository: repository.name, 
        organization 
      });

      // Get organization configuration
      const orgConfig = await this.configManager.getOrganizationConfig(organization);
      
      // Create project using project manager
      const project = await this.projectManager.createProject(repository, orgConfig);
      
      // Emit event for workflow processing
      this.emit('projectCreated', { project, repository, organization });
      
      this.logger.info('Project created successfully', { 
        projectId: project.id,
        repository: repository.name 
      });

      return project;
    } catch (error) {
      this.logger.error('Failed to create project', { 
        repository: repository.name,
        organization,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Process an issue through classification and routing
   * @param {Object} issue - GitHub issue object
   * @param {Object} context - Additional context information
   * @returns {Promise<Object>} - Processing results
   */
  async processIssue(issue, context = {}) {
    this._ensureInitialized();
    
    try {
      this.logger.info('Processing issue', { 
        issueId: issue.id,
        repository: context.repository 
      });

      // Classify the issue
      const classification = await this.issueClassifier.classifyIssue(issue, context);
      
      // Route to appropriate project
      const routing = await this.projectManager.routeIssue(issue, classification, context);
      
      // Execute any triggered workflows
      await this.workflowEngine.processIssueEvent('issue.classified', {
        issue,
        classification,
        routing,
        context
      });

      const result = {
        issue: issue.id,
        classification,
        routing,
        processedAt: new Date().toISOString()
      };

      this.emit('issueProcessed', result);
      this.logger.info('Issue processed successfully', { issueId: issue.id });

      return result;
    } catch (error) {
      this.logger.error('Failed to process issue', { 
        issueId: issue.id,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Execute a workflow with given parameters
   * @param {string} workflowId - Workflow identifier
   * @param {Object} parameters - Workflow parameters
   * @returns {Promise<Object>} - Workflow execution result
   */
  async executeWorkflow(workflowId, parameters = {}) {
    this._ensureInitialized();
    
    try {
      this.logger.info('Executing workflow', { workflowId, parameters });
      
      const result = await this.workflowEngine.executeWorkflow(workflowId, parameters);
      
      this.emit('workflowExecuted', { workflowId, parameters, result });
      this.logger.info('Workflow executed successfully', { workflowId });
      
      return result;
    } catch (error) {
      this.logger.error('Failed to execute workflow', { 
        workflowId,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get system health status
   * @returns {Promise<Object>} - Health status information
   */
  async getSystemHealth() {
    try {
      await this._performHealthCheck();
      return { ...this.health };
    } catch (error) {
      this.logger.error('Health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }

  /**
   * Gracefully shutdown the orchestrator
   * @returns {Promise<void>}
   */
  async shutdown() {
    this.logger.info('Shutting down DevFlow Orchestrator...');
    
    try {
      // Stop workflow engine
      await this.workflowEngine.shutdown();
      
      // Clear cache
      this.cache.flushAll();
      
      // Close connections
      await this.projectManager.shutdown();
      
      this.isInitialized = false;
      this.health.status = 'stopped';
      
      this.emit('shutdown');
      this.logger.info('DevFlow Orchestrator shutdown complete');
    } catch (error) {
      this.logger.error('Error during shutdown', { error: error.message });
      throw error;
    }
  }

  /**
   * Set up internal event listeners
   * @private
   */
  _setupEventListeners() {
    // Project events
    this.projectManager.on('projectCreated', (data) => {
      this.emit('projectCreated', data);
    });

    // Issue events
    this.issueClassifier.on('issueClassified', (data) => {
      this.emit('issueClassified', data);
    });

    // Workflow events
    this.workflowEngine.on('workflowExecuted', (data) => {
      this.emit('workflowExecuted', data);
    });

    // Error handling
    this.on('error', (error) => {
      this.logger.error('Orchestrator error', { error: error.message });
    });
  }

  /**
   * Perform comprehensive health check
   * @private
   */
  async _performHealthCheck() {
    const checks = {
      configManager: this.configManager.isHealthy(),
      projectManager: await this.projectManager.healthCheck(),
      issueClassifier: this.issueClassifier.isHealthy(),
      workflowEngine: await this.workflowEngine.healthCheck(),
      cache: this.cache.getStats()
    };

    const allHealthy = Object.values(checks).every(check => 
      typeof check === 'boolean' ? check : check.status === 'healthy'
    );

    this.health = {
      status: allHealthy ? 'healthy' : 'degraded',
      components: checks,
      lastCheck: new Date().toISOString(),
      uptime: process.uptime()
    };

    if (!allHealthy) {
      this.logger.warn('System health check shows degraded status', { health: this.health });
    }
  }

  /**
   * Ensure orchestrator is initialized
   * @private
   */
  _ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('DevFlow Orchestrator not initialized. Call initialize() first.');
    }
  }
}

// Export for CLI usage
export default DevFlowOrchestrator;