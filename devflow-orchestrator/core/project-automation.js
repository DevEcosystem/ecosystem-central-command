/**
 * @fileoverview Project Automation Service - Automatic GitHub Projects V2 Creation
 * @version 1.0.0
 * @author DevEcosystem
 * 
 * This service automatically creates GitHub Projects V2 with organization-specific
 * templates, fields, and views based on the DevFlow configuration system.
 */

import { EventEmitter } from 'events';
import { GitHubProjectsAPI } from '../api/github-projects.js';
import { ProjectTemplateManager } from '../config/project-templates.js';
import { Logger } from '../utils/logger.js';

/**
 * Project Automation Service
 * Handles automatic creation and configuration of GitHub Projects V2
 */
export class ProjectAutomationService extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.logger = new Logger('ProjectAutomation');
    
    // Initialize GitHub Projects API
    this.githubAPI = new GitHubProjectsAPI({
      token: config.get('env.GITHUB_TOKEN'),
      rateLimiter: config.get('defaults.rateLimiting')
    });
    
    // Initialize template manager
    this.templateManager = new ProjectTemplateManager();
    
    this.logger.info('Project Automation Service initialized');
  }

  /**
   * Automatically create a project for a repository
   * @param {Object} repository - Repository information
   * @param {Object} options - Creation options
   * @returns {Promise<Object>} - Created project details
   */
  async createProjectForRepository(repository, options = {}) {
    try {
      this.logger.info('Starting automatic project creation', {
        repository: repository.name,
        owner: repository.owner,
        organizationType: repository.organizationType
      });

      // Step 1: Detect organization and get configuration
      const orgConfig = await this._detectOrganizationConfig(repository);
      
      // Step 2: Select and prepare template
      const template = await this._prepareProjectTemplate(orgConfig, repository);
      
      // Step 3: Create the GitHub Project V2
      const project = await this._createGitHubProject(repository, template, orgConfig);
      
      // Step 4: Configure project fields
      await this._configureProjectFields(project, template);
      
      // Step 5: Create project views
      await this._createProjectViews(project, template);
      
      // Step 6: Link repository to project (if applicable)
      if (options.linkRepository) {
        await this._linkRepositoryToProject(project, repository);
      }
      
      const result = {
        project,
        template: template.id,
        organization: orgConfig.id,
        fieldsCreated: template.fields.length,
        viewsCreated: template.views.length,
        createdAt: new Date().toISOString()
      };
      
      this.logger.info('Project created successfully', {
        projectId: project.id,
        projectTitle: project.title,
        template: template.id,
        organization: orgConfig.id
      });
      
      this.emit('projectCreated', result);
      return result;
      
    } catch (error) {
      this.logger.error('Failed to create project automatically', {
        repository: repository.name,
        error: error.message,
        stack: error.stack
      });
      
      this.emit('projectCreationFailed', {
        repository,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Create multiple projects for multiple repositories
   * @param {Array} repositories - Array of repository objects
   * @param {Object} options - Creation options
   * @returns {Promise<Array>} - Array of creation results
   */
  async createProjectsForRepositories(repositories, options = {}) {
    const results = [];
    const errors = [];
    
    this.logger.info('Creating projects for multiple repositories', {
      repositoryCount: repositories.length
    });
    
    for (const repository of repositories) {
      try {
        const result = await this.createProjectForRepository(repository, options);
        results.push(result);
        
        // Add delay between creations to respect rate limits
        if (options.delayBetweenCreations) {
          await this._delay(options.delayBetweenCreations);
        }
        
      } catch (error) {
        errors.push({
          repository: repository.name,
          error: error.message
        });
      }
    }
    
    this.logger.info('Bulk project creation completed', {
      successful: results.length,
      failed: errors.length,
      total: repositories.length
    });
    
    this.emit('bulkProjectCreationCompleted', {
      results,
      errors,
      total: repositories.length
    });
    
    return {
      results,
      errors,
      summary: {
        successful: results.length,
        failed: errors.length,
        total: repositories.length,
        successRate: (results.length / repositories.length) * 100
      }
    };
  }

  /**
   * Create a demo project for testing purposes
   * @param {string} organizationId - Target organization ID
   * @param {Object} options - Demo options
   * @returns {Promise<Object>} - Created demo project
   */
  async createDemoProject(organizationId, options = {}) {
    const demoRepository = {
      name: options.projectName || `demo-project-${Date.now()}`,
      owner: organizationId,
      organizationType: this._getOrganizationType(organizationId),
      description: options.description || 'Demo project created by DevFlow Orchestrator',
      isDemo: true
    };
    
    this.logger.info('Creating demo project', {
      organizationId,
      projectName: demoRepository.name
    });
    
    return await this.createProjectForRepository(demoRepository, {
      linkRepository: false,
      ...options
    });
  }

  /**
   * Detect organization configuration based on repository
   * @param {Object} repository - Repository information
   * @returns {Object} - Organization configuration
   * @private
   */
  async _detectOrganizationConfig(repository) {
    let organizationId = repository.owner;
    
    // Map common organization patterns
    const orgMappings = {
      'DevBusinessHub': 'DevBusinessHub',
      'DevPersonalHub': 'DevPersonalHub', 
      'DevAcademicHub': 'DevAcademicHub',
      'DevEcosystem': 'DevEcosystem'
    };
    
    // Try exact match first
    if (orgMappings[organizationId]) {
      organizationId = orgMappings[organizationId];
    }
    
    // Get organization configuration
    const orgConfig = this.config.getOrganizationConfig(organizationId);
    
    this.logger.debug('Organization detected', {
      detected: organizationId,
      type: orgConfig.type,
      template: orgConfig.settings.projectTemplate
    });
    
    return orgConfig;
  }

  /**
   * Prepare project template based on organization configuration
   * @param {Object} orgConfig - Organization configuration
   * @param {Object} repository - Repository information
   * @returns {Object} - Prepared template
   * @private
   */
  async _prepareProjectTemplate(orgConfig, repository) {
    const templateId = orgConfig.settings.projectTemplate;
    const template = this.templateManager.getTemplate(templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    // Apply template with repository context
    const appliedTemplate = this.templateManager.applyTemplate(templateId, {
      repository: repository.name,
      organization: orgConfig.id,
      organizationType: orgConfig.type,
      description: repository.description
    });
    
    this.logger.debug('Template prepared', {
      templateId,
      fieldsCount: appliedTemplate.fields.length,
      viewsCount: appliedTemplate.views.length
    });
    
    return appliedTemplate;
  }

  /**
   * Create GitHub Project V2
   * @param {Object} repository - Repository information
   * @param {Object} template - Applied template
   * @param {Object} orgConfig - Organization configuration
   * @returns {Promise<Object>} - Created project
   * @private
   */
  async _createGitHubProject(repository, template, orgConfig) {
    // Get owner ID (organization or user)
    const ownerId = await this._getOwnerNodeId(repository.owner);
    
    const projectData = {
      ownerId,
      title: template.title,
      shortDescription: template.description,
      readme: template.readme,
      public: template.settings.public
    };
    
    this.logger.info('Creating GitHub Project V2', {
      title: projectData.title,
      owner: repository.owner,
      public: projectData.public
    });
    
    const project = await this.githubAPI.createProject(projectData);
    
    this.logger.info('GitHub Project V2 created', {
      projectId: project.id,
      projectNumber: project.number,
      url: project.url
    });
    
    return project;
  }

  /**
   * Configure project fields based on template
   * @param {Object} project - Created project
   * @param {Object} template - Applied template
   * @private
   */
  async _configureProjectFields(project, template) {
    this.logger.info('Configuring project fields', {
      projectId: project.id,
      fieldsCount: template.fields.length
    });
    
    for (const field of template.fields) {
      try {
        await this.githubAPI.createProjectField(project.id, {
          name: field.name,
          dataType: field.type,
          options: field.options
        });
        
        this.logger.debug('Field created', {
          fieldName: field.name,
          fieldType: field.type
        });
        
      } catch (error) {
        this.logger.warn('Failed to create field', {
          fieldName: field.name,
          error: error.message
        });
      }
    }
    
    this.logger.info('Project fields configuration completed');
  }

  /**
   * Create project views based on template
   * @param {Object} project - Created project
   * @param {Object} template - Applied template
   * @private
   */
  async _createProjectViews(project, template) {
    this.logger.info('Creating project views', {
      projectId: project.id,
      viewsCount: template.views.length
    });
    
    for (const view of template.views) {
      try {
        await this.githubAPI.createProjectView(project.id, {
          name: view.name,
          layout: view.layout,
          groupBy: view.groupBy,
          sortBy: view.sortBy,
          filterBy: view.filterBy
        });
        
        this.logger.debug('View created', {
          viewName: view.name,
          layout: view.layout
        });
        
      } catch (error) {
        this.logger.warn('Failed to create view', {
          viewName: view.name,
          error: error.message
        });
      }
    }
    
    this.logger.info('Project views creation completed');
  }

  /**
   * Link repository to project
   * @param {Object} project - Created project
   * @param {Object} repository - Repository information
   * @private
   */
  async _linkRepositoryToProject(project, repository) {
    try {
      const repositoryId = await this._getRepositoryNodeId(repository.owner, repository.name);
      
      await this.githubAPI.addRepositoryToProject(project.id, repositoryId);
      
      this.logger.info('Repository linked to project', {
        projectId: project.id,
        repository: `${repository.owner}/${repository.name}`
      });
      
    } catch (error) {
      this.logger.warn('Failed to link repository to project', {
        repository: `${repository.owner}/${repository.name}`,
        error: error.message
      });
    }
  }

  /**
   * Get owner node ID (organization or user)
   * @param {string} owner - Owner login
   * @returns {Promise<string>} - Node ID
   * @private
   */
  async _getOwnerNodeId(owner) {
    try {
      const ownerData = await this.githubAPI.getOwnerNodeId(owner);
      return ownerData.nodeId;
    } catch (error) {
      this.logger.error('Failed to get owner node ID', {
        owner,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get repository node ID
   * @param {string} owner - Repository owner
   * @param {string} name - Repository name
   * @returns {Promise<string>} - Repository node ID
   * @private
   */
  async _getRepositoryNodeId(owner, name) {
    try {
      const repoData = await this.githubAPI.getRepositoryNodeId(owner, name);
      return repoData.nodeId;
    } catch (error) {
      this.logger.error('Failed to get repository node ID', {
        repository: `${owner}/${name}`,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get organization type based on organization ID
   * @param {string} organizationId - Organization ID
   * @returns {string} - Organization type
   * @private
   */
  _getOrganizationType(organizationId) {
    const orgConfig = this.config.getOrganizationConfig(organizationId);
    return orgConfig.type;
  }

  /**
   * Add delay between operations
   * @param {number} ms - Delay in milliseconds
   * @private
   */
  async _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service health status
   * @returns {Object} - Health status
   */
  getHealth() {
    return {
      service: 'ProjectAutomationService',
      status: 'healthy',
      githubAPI: {
        initialized: !!this.githubAPI,
        hasToken: !!this.config.get('env.GITHUB_TOKEN')
      },
      templateManager: {
        initialized: !!this.templateManager,
        templatesAvailable: this.templateManager.getAvailableTemplates().length
      },
      organizations: Object.keys(this.config.get('organizations')).length
    };
  }
}

export default ProjectAutomationService;