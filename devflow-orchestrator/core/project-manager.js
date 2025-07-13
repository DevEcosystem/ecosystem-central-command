/**
 * @fileoverview Project Manager - GitHub Projects V2 management
 * @version 1.0.0
 * @author DevEcosystem
 */

import { EventEmitter } from 'events';
import { Logger } from '../utils/logger.js';
import { GitHubProjectsAPI } from '../api/github-projects.js';
import { ProjectTemplateManager } from '../config/project-templates.js';

/**
 * GitHub Projects V2 management system
 * Handles project creation, configuration, and maintenance
 */
export class ProjectManager extends EventEmitter {
  constructor(githubConfig = {}) {
    super();
    
    this.config = githubConfig;
    this.logger = new Logger('ProjectManager');
    this.githubApi = null;
    this.templateManager = new ProjectTemplateManager();
    this.isInitialized = false;
    
    this.logger.info('Project Manager created');
  }

  /**
   * Initialize GitHub API connections
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      this.logger.info('Initializing Project Manager...');
      
      // Initialize GitHub Projects V2 API client
      this.githubApi = new GitHubProjectsAPI(this.config);
      
      // Test API connectivity
      const healthCheck = await this.githubApi.healthCheck();
      if (healthCheck.status !== 'healthy') {
        throw new Error(`GitHub API health check failed: ${healthCheck.error}`);
      }
      
      this.isInitialized = true;
      this.logger.info('Project Manager initialized', { 
        apiUser: healthCheck.user 
      });
    } catch (error) {
      this.logger.error('Failed to initialize Project Manager', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a new GitHub Project V2 for a repository
   * @param {Object} repository - Repository information
   * @param {Object} orgConfig - Organization configuration
   * @returns {Promise<Object>} - Created project details
   */
  async createProject(repository, orgConfig) {
    this._ensureInitialized();
    
    try {
      this.logger.info('Creating GitHub Project V2', { 
        repository: repository.name,
        organization: orgConfig.id 
      });

      // Get organization ID for project creation
      const ownerId = await this.githubApi.getOrganizationId(orgConfig.id);
      
      // Apply project template
      const templateConfig = this.templateManager.applyTemplate(
        orgConfig.settings.projectTemplate,
        { repository: repository.name, organization: orgConfig.id }
      );
      
      // Create the project with template configuration
      const project = await this.githubApi.createProject({
        ownerId,
        title: templateConfig.title,
        shortDescription: templateConfig.description,
        readme: templateConfig.readme,
        public: templateConfig.settings.public
      });

      // Configure project fields from template
      await this._configureProjectFields(project.id, templateConfig.fields);
      
      // Link repository to project if provided
      if (repository.id) {
        await this.githubApi.linkRepositoryToProject(project.id, repository.id);
      }

      // Enhanced project object with DevFlow metadata
      const devFlowProject = {
        ...project,
        repository: repository.name,
        organization: orgConfig.id,
        template: orgConfig.settings.projectTemplate,
        templateConfig,
        devFlowManaged: true,
        automationLevel: templateConfig.automationRules || {},
        configuredAt: new Date().toISOString()
      };

      this.emit('projectCreated', { project: devFlowProject, repository, orgConfig });
      
      this.logger.info('Project created and configured successfully', { 
        projectId: project.id,
        repository: repository.name,
        template: orgConfig.settings.projectTemplate
      });

      return devFlowProject;
    } catch (error) {
      this.logger.error('Failed to create project', { 
        repository: repository.name,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Route an issue to appropriate project and column
   * @param {Object} issue - GitHub issue object
   * @param {Object} classification - Issue classification result
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} - Routing result
   */
  async routeIssue(issue, classification, context) {
    this._ensureInitialized();
    
    try {
      this.logger.info('Routing issue to project', { 
        issueId: issue.id,
        type: classification.type,
        priority: classification.priority 
      });

      // Find or create appropriate project for the repository
      const projectId = await this._findProjectForRepository(context.repository, context.organization);
      
      if (projectId) {
        // Add issue to project
        const projectItem = await this.githubApi.addIssueToProject(projectId, issue.id);
        
        // Update project item fields based on classification
        await this._updateProjectItemFields(projectId, projectItem.id, classification);
        
        const routing = {
          projectId,
          itemId: projectItem.id,
          classification: classification.type,
          priority: classification.priority,
          labels: classification.labels || [],
          routedAt: new Date().toISOString()
        };

        this.logger.info('Issue routed successfully', { 
          issueId: issue.id,
          projectId,
          itemId: projectItem.id
        });

        return routing;
      } else {
        this.logger.warn('No project found for repository', { 
          repository: context.repository,
          organization: context.organization 
        });
        
        return {
          projectId: null,
          itemId: null,
          error: 'No project found for repository',
          routedAt: new Date().toISOString()
        };
      }
    } catch (error) {
      this.logger.error('Failed to route issue', { 
        issueId: issue.id,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Perform health check on Project Manager
   * @returns {Promise<Object>} - Health status
   */
  async healthCheck() {
    try {
      if (!this.isInitialized) {
        return { status: 'not_initialized' };
      }

      // TODO: Implement actual GitHub API health check in issue #12
      return {
        status: 'healthy',
        apiConnection: 'connected',
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Shutdown Project Manager
   * @returns {Promise<void>}
   */
  async shutdown() {
    this.logger.info('Shutting down Project Manager...');
    
    try {
      // TODO: Close GitHub API connections
      this.isInitialized = false;
      this.logger.info('Project Manager shutdown complete');
    } catch (error) {
      this.logger.error('Error during Project Manager shutdown', { error: error.message });
      throw error;
    }
  }

  /**
   * Configure project fields based on template configuration
   * @param {string} projectId - Project ID
   * @param {Array} fieldConfigs - Field configurations from template
   * @returns {Promise<void>}
   * @private
   */
  async _configureProjectFields(projectId, fieldConfigs) {
    try {
      this.logger.info('Configuring project fields', { projectId, fieldCount: fieldConfigs.length });
      
      const fields = fieldConfigs || [];
      const createdFields = [];
      
      for (const fieldConfig of fields) {
        try {
          const field = await this.githubApi.createProjectField(projectId, {
            name: fieldConfig.name,
            dataType: fieldConfig.type,
            options: fieldConfig.options
          });
          createdFields.push(field);
          this.logger.debug('Project field created', { 
            fieldId: field.id, 
            name: field.name,
            type: fieldConfig.type
          });
        } catch (error) {
          this.logger.warn('Failed to create project field', { 
            fieldName: fieldConfig.name,
            type: fieldConfig.type,
            error: error.message 
          });
        }
      }
      
      this.logger.info('Project fields configured', { 
        projectId,
        fieldsCreated: createdFields.length,
        totalFields: fields.length
      });
      
      return createdFields;
    } catch (error) {
      this.logger.error('Failed to configure project fields', { 
        projectId,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Generate project README content
   * @param {Object} repository - Repository information
   * @param {Object} orgConfig - Organization configuration
   * @returns {string} - README content
   * @private
   */
  _generateProjectReadme(repository, orgConfig) {
    return `# ${repository.name} - DevFlow Project

**Organization**: ${orgConfig.name}  
**Template**: ${orgConfig.settings.projectTemplate}  
**Managed by**: DevFlow Orchestrator  

## 🎯 Project Overview

This project is automatically managed by DevFlow Orchestrator with organization-specific workflows and automation.

### 🏢 Organization Settings
- **Type**: ${orgConfig.type}
- **Quality Level**: ${orgConfig.settings.securityLevel}
- **Automation**: ${orgConfig.automation?.issueLabeling ? 'Enabled' : 'Disabled'}

### 📋 Workflow Features
${orgConfig.workflows?.map(workflow => `- ${workflow}`).join('\n') || '- Basic workflow management'}

### 🔧 Project Fields
${orgConfig.projectFields?.map(field => `- **${field.name}**: ${field.type}`).join('\n') || '- Standard project fields'}

---
*This project was automatically generated by DevFlow Orchestrator*  
*Last updated: ${new Date().toISOString()}*
`;
  }

  /**
   * Find project for repository
   * @param {string} repository - Repository name
   * @param {string} organization - Organization name
   * @returns {Promise<string|null>} - Project ID or null
   * @private
   */
  async _findProjectForRepository(repository, organization) {
    try {
      // For now, return null to indicate no existing project
      // TODO: Implement project discovery logic
      this.logger.debug('Project discovery not implemented yet', { repository, organization });
      return null;
    } catch (error) {
      this.logger.error('Failed to find project for repository', { 
        repository,
        organization,
        error: error.message 
      });
      return null;
    }
  }

  /**
   * Update project item fields based on classification
   * @param {string} projectId - Project ID
   * @param {string} itemId - Project item ID
   * @param {Object} classification - Issue classification
   * @returns {Promise<void>}
   * @private
   */
  async _updateProjectItemFields(projectId, itemId, classification) {
    try {
      this.logger.info('Updating project item fields', { 
        projectId, 
        itemId, 
        classification: classification.type 
      });
      
      // Get project data to find field IDs
      const project = await this.githubApi.getProject(projectId);
      const fields = project.fields?.nodes || [];
      
      // Map classification to field updates
      const updates = [];
      
      // Update Status field
      const statusField = fields.find(f => f.name.toLowerCase() === 'status');
      if (statusField) {
        const statusValue = this._getStatusForClassification(classification);
        updates.push({
          fieldId: statusField.id,
          value: statusValue
        });
      }
      
      // Update Priority field
      const priorityField = fields.find(f => f.name.toLowerCase() === 'priority');
      if (priorityField && classification.priority) {
        updates.push({
          fieldId: priorityField.id,
          value: classification.priority
        });
      }
      
      // Execute updates
      for (const update of updates) {
        try {
          await this.githubApi.updateProjectItemField(
            projectId, 
            itemId, 
            update.fieldId, 
            update.value
          );
        } catch (error) {
          this.logger.warn('Failed to update project item field', { 
            fieldId: update.fieldId,
            error: error.message 
          });
        }
      }
      
      this.logger.info('Project item fields updated', { 
        projectId,
        itemId,
        updatesApplied: updates.length
      });
    } catch (error) {
      this.logger.error('Failed to update project item fields', { 
        projectId,
        itemId,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get status value for issue classification
   * @param {Object} classification - Issue classification
   * @returns {string} - Status value
   * @private
   */
  _getStatusForClassification(classification) {
    const { type, priority } = classification;
    
    // Map classification to status
    if (priority === 'critical') return 'In Progress';
    if (type === 'bug') return 'In Progress';
    if (type === 'feature') return 'Backlog';
    if (type === 'documentation') return 'Backlog';
    
    return 'Backlog';
  }

  /**
   * Ensure Project Manager is initialized
   * @private
   */
  _ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('Project Manager not initialized. Call initialize() first.');
    }
  }
}

export default ProjectManager;