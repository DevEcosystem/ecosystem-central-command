/**
 * @fileoverview Organization Configuration Manager
 * @version 1.0.0
 * @author DevEcosystem
 */

import { Logger } from '../utils/logger.js';

/**
 * Organization-specific configuration management
 * Manages settings and templates for different GitHub organizations
 */
export class ConfigManager {
  constructor(config = {}) {
    this.config = config;
    this.logger = new Logger('ConfigManager');
    this.organizations = new Map();
    this.isInitialized = false;
    
    this.logger.info('Config Manager created');
  }

  /**
   * Initialize configuration manager
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      this.logger.info('Initializing Config Manager...');
      
      // Load organization configurations
      this._loadOrganizationConfigs();
      
      this.isInitialized = true;
      this.logger.info('Config Manager initialized', { 
        organizationCount: this.organizations.size 
      });
    } catch (error) {
      this.logger.error('Failed to initialize Config Manager', { error: error.message });
      throw error;
    }
  }

  /**
   * Get configuration for a specific organization
   * @param {string} organizationId - Organization identifier
   * @returns {Promise<Object>} - Organization configuration
   */
  async getOrganizationConfig(organizationId) {
    if (!this.isInitialized) {
      throw new Error('Config Manager not initialized');
    }

    const config = this.organizations.get(organizationId);
    if (!config) {
      this.logger.warn('Organization config not found, using default', { organizationId });
      return this._getDefaultConfig(organizationId);
    }

    this.logger.debug('Retrieved organization config', { organizationId });
    return { ...config }; // Return copy to prevent mutations
  }

  /**
   * Check if configuration manager is healthy
   * @returns {boolean} - Health status
   */
  isHealthy() {
    return this.isInitialized && this.organizations.size > 0;
  }

  /**
   * Load organization-specific configurations
   * @private
   */
  _loadOrganizationConfigs() {
    // DevBusinessHub - Production-focused organization
    this.organizations.set('DevBusinessHub', {
      id: 'DevBusinessHub',
      name: 'Development Business Hub',
      type: 'production',
      description: 'Customer-facing products and services',
      settings: {
        projectTemplate: 'production-ready',
        approvalRequired: true,
        autoDeployment: true,
        securityLevel: 'high',
        qualityGates: ['security-scan', 'performance-test', 'code-review']
      },
      projectFields: [
        { name: 'Status', type: 'single_select', options: ['Backlog', 'In Progress', 'Review', 'Testing', 'Done'] },
        { name: 'Priority', type: 'single_select', options: ['Critical', 'High', 'Medium', 'Low'] },
        { name: 'Customer Impact', type: 'single_select', options: ['High', 'Medium', 'Low', 'None'] },
        { name: 'Assignee', type: 'assignees' },
        { name: 'Sprint', type: 'iteration' },
        { name: 'Story Points', type: 'number' }
      ],
      projectViews: [
        { name: 'Kanban Board', type: 'board', groupBy: 'Status' },
        { name: 'Priority Matrix', type: 'table', sortBy: 'Priority' },
        { name: 'Sprint Planning', type: 'table', groupBy: 'Sprint' }
      ],
      workflows: ['security-scan', 'performance-test', 'deploy-staging', 'customer-notification'],
      automation: {
        issueLabeling: true,
        projectRouting: true,
        deploymentTriggers: true,
        notificationRules: ['customer-impact', 'security-alerts']
      }
    });

    // DevPersonalHub - Experimentation and learning
    this.organizations.set('DevPersonalHub', {
      id: 'DevPersonalHub',
      name: 'Development Personal Hub',
      type: 'experimental',
      description: 'Personal projects and experimentation',
      settings: {
        projectTemplate: 'lightweight',
        approvalRequired: false,
        autoDeployment: true,
        securityLevel: 'medium',
        qualityGates: ['basic-test', 'lint-check']
      },
      projectFields: [
        { name: 'Status', type: 'single_select', options: ['Idea', 'In Progress', 'Testing', 'Done', 'Archived'] },
        { name: 'Type', type: 'single_select', options: ['Experiment', 'Learning', 'Side Project', 'Tool'] },
        { name: 'Technology', type: 'single_select', options: ['React', 'Node.js', 'Python', 'AI/ML', 'Other'] },
        { name: 'Effort', type: 'single_select', options: ['Quick', 'Weekend', 'Week', 'Month+'] }
      ],
      projectViews: [
        { name: 'Experiment Board', type: 'board', groupBy: 'Status' },
        { name: 'By Technology', type: 'table', groupBy: 'Technology' },
        { name: 'Learning Goals', type: 'table', filterBy: 'Type:Learning' }
      ],
      workflows: ['quick-deploy', 'experiment-archive'],
      automation: {
        issueLabeling: true,
        projectRouting: true,
        deploymentTriggers: true,
        notificationRules: ['experiment-results']
      }
    });

    // DevAcademicHub - Research and academic work
    this.organizations.set('DevAcademicHub', {
      id: 'DevAcademicHub',
      name: 'Development Academic Hub',
      type: 'research',
      description: 'Academic research and coursework',
      settings: {
        projectTemplate: 'research-focused',
        approvalRequired: true,
        autoDeployment: false,
        securityLevel: 'medium',
        qualityGates: ['peer-review', 'citation-check', 'reproducibility']
      },
      projectFields: [
        { name: 'Status', type: 'single_select', options: ['Planning', 'Research', 'Development', 'Analysis', 'Writing', 'Review', 'Complete'] },
        { name: 'Course', type: 'single_select', options: ['CS101', 'Data Science', 'Machine Learning', 'Thesis', 'Independent'] },
        { name: 'Research Area', type: 'single_select', options: ['Algorithms', 'AI/ML', 'Web Development', 'Data Analysis', 'Systems'] },
        { name: 'Due Date', type: 'date' },
        { name: 'Grade Impact', type: 'single_select', options: ['Major', 'Minor', 'Extra Credit'] }
      ],
      projectViews: [
        { name: 'Research Pipeline', type: 'board', groupBy: 'Status' },
        { name: 'By Course', type: 'table', groupBy: 'Course' },
        { name: 'Deadlines', type: 'table', sortBy: 'Due Date' }
      ],
      workflows: ['peer-review', 'citation-validation', 'backup-research'],
      automation: {
        issueLabeling: true,
        projectRouting: true,
        deploymentTriggers: false,
        notificationRules: ['deadline-alerts', 'research-milestones']
      }
    });

    // DevEcosystem - Infrastructure and tooling
    this.organizations.set('DevEcosystem', {
      id: 'DevEcosystem',
      name: 'Development Ecosystem',
      type: 'infrastructure',
      description: 'Infrastructure, automation, and cross-organization tools',
      settings: {
        projectTemplate: 'infrastructure',
        approvalRequired: true,
        autoDeployment: false,
        securityLevel: 'high',
        qualityGates: ['security-scan', 'integration-test', 'impact-analysis']
      },
      projectFields: [
        { name: 'Status', type: 'single_select', options: ['Planning', 'Development', 'Testing', 'Staging', 'Production', 'Monitoring'] },
        { name: 'Impact Scope', type: 'single_select', options: ['Single Repo', 'Organization', 'Cross-Org', 'Global'] },
        { name: 'System Component', type: 'single_select', options: ['Automation', 'Monitoring', 'CI/CD', 'Security', 'Analytics'] },
        { name: 'Risk Level', type: 'single_select', options: ['High', 'Medium', 'Low'] },
        { name: 'Rollback Plan', type: 'single_select', options: ['Ready', 'In Progress', 'Not Required'] }
      ],
      projectViews: [
        { name: 'Infrastructure Board', type: 'board', groupBy: 'Status' },
        { name: 'Impact Assessment', type: 'table', groupBy: 'Impact Scope' },
        { name: 'Risk Management', type: 'table', groupBy: 'Risk Level' }
      ],
      workflows: ['impact-analysis', 'staged-deployment', 'rollback-preparation'],
      automation: {
        issueLabeling: true,
        projectRouting: true,
        deploymentTriggers: false,
        notificationRules: ['infrastructure-alerts', 'cross-org-impacts']
      }
    });

    this.logger.info('Organization configurations loaded', { 
      organizations: Array.from(this.organizations.keys()) 
    });
  }

  /**
   * Get default configuration for unknown organizations
   * @param {string} organizationId - Organization identifier
   * @returns {Object} - Default configuration
   * @private
   */
  _getDefaultConfig(organizationId) {
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
        { name: 'Priority', type: 'single_select', options: ['High', 'Medium', 'Low'] },
        { name: 'Assignee', type: 'assignees' }
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