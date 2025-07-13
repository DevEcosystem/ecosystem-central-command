/**
 * @fileoverview GitHub Projects V2 API Client
 * @version 1.0.0
 * @author DevEcosystem
 */

import { graphql } from '@octokit/graphql';
import { Logger } from '../utils/logger.js';
import { Cache } from '../utils/cache.js';
import { RateLimiter } from '../utils/rate-limiter.js';

/**
 * GitHub Projects V2 API client
 * Handles all GitHub Projects V2 GraphQL operations
 */
export class GitHubProjectsAPI {
  constructor(config = {}) {
    this.config = config;
    this.logger = new Logger('GitHubProjectsAPI');
    this.cache = new Cache();
    this.rateLimiter = new RateLimiter(config.rateLimiter);
    
    if (!config.token) {
      throw new Error('GitHub token is required for Projects V2 API');
    }
    
    this.graphql = graphql.defaults({
      headers: {
        authorization: `token ${config.token}`,
      },
    });
    
    this.logger.info('GitHub Projects V2 API client initialized');
  }

  /**
   * Create a new GitHub Project V2
   * @param {Object} options - Project creation options
   * @param {string} options.ownerId - Organization or user ID
   * @param {string} options.title - Project title
   * @param {string} [options.shortDescription] - Project description
   * @param {string} [options.readme] - Project README
   * @param {boolean} [options.public] - Whether project is public
   * @returns {Promise<Object>} - Created project data
   */
  async createProject(options) {
    const { ownerId, title, shortDescription, readme, public: isPublic = false } = options;
    
    try {
      this.logger.info('Creating GitHub Project V2', { title, ownerId });
      
      const mutation = `
        mutation CreateProjectV2($input: CreateProjectV2Input!) {
          createProjectV2(input: $input) {
            projectV2 {
              id
              number
              title
              shortDescription
              readme
              public
              closed
              url
              createdAt
              updatedAt
              owner {
                id
                login
              }
            }
          }
        }
      `;

      const variables = {
        input: {
          ownerId,
          title,
          shortDescription,
          readme,
          public: isPublic
        }
      };

      const response = await this.rateLimiter.execute(
        () => this.graphql(mutation, variables),
        { operation: 'createProject', title }
      );
      const project = response.createProjectV2.projectV2;
      
      // Cache the project data
      this.cache.set(
        Cache.createProjectKey(project.id), 
        project, 
        300 // 5 minutes
      );
      
      this.logger.info('Project V2 created successfully', { 
        projectId: project.id,
        number: project.number,
        title: project.title 
      });
      
      return project;
    } catch (error) {
      this.logger.error('Failed to create Project V2', { 
        title,
        ownerId,
        error: error.message 
      });
      throw new Error(`Project creation failed: ${error.message}`);
    }
  }

  /**
   * Get project by ID
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} - Project data
   */
  async getProject(projectId) {
    try {
      // Check cache first
      const cached = this.cache.get(Cache.createProjectKey(projectId));
      if (cached) {
        this.logger.debug('Project data retrieved from cache', { projectId });
        return cached;
      }

      this.logger.info('Fetching Project V2 data', { projectId });
      
      const query = `
        query GetProjectV2($id: ID!) {
          node(id: $id) {
            ... on ProjectV2 {
              id
              number
              title
              shortDescription
              readme
              public
              closed
              url
              createdAt
              updatedAt
              owner {
                id
                login
              }
              fields(first: 20) {
                nodes {
                  id
                  name
                  dataType
                  ... on ProjectV2SingleSelectField {
                    options {
                      id
                      name
                      color
                    }
                  }
                }
              }
              views(first: 10) {
                nodes {
                  id
                  name
                  layout
                  createdAt
                }
              }
            }
          }
        }
      `;

      const variables = { id: projectId };
      const response = await this.rateLimiter.execute(
        () => this.graphql(query, variables),
        { operation: 'getProject', projectId }
      );
      const project = response.node;
      
      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }
      
      // Cache the project data
      this.cache.set(Cache.createProjectKey(projectId), project, 300);
      
      this.logger.info('Project V2 data retrieved', { 
        projectId,
        title: project.title 
      });
      
      return project;
    } catch (error) {
      this.logger.error('Failed to get Project V2', { 
        projectId,
        error: error.message 
      });
      throw new Error(`Failed to retrieve project: ${error.message}`);
    }
  }

  /**
   * Create a custom field in the project
   * @param {string} projectId - Project ID
   * @param {Object} fieldConfig - Field configuration
   * @param {string} fieldConfig.name - Field name
   * @param {'TEXT'|'NUMBER'|'DATE'|'SINGLE_SELECT'|'ITERATION'} fieldConfig.dataType - Field type
   * @param {Array} [fieldConfig.options] - Options for single select fields
   * @returns {Promise<Object>} - Created field data
   */
  async createProjectField(projectId, fieldConfig) {
    const { name, dataType, options = [] } = fieldConfig;
    
    try {
      this.logger.info('Creating project field', { projectId, name, dataType });
      
      let mutation;
      let variables;

      if (dataType === 'SINGLE_SELECT') {
        mutation = `
          mutation CreateProjectV2Field($input: CreateProjectV2FieldInput!) {
            createProjectV2Field(input: $input) {
              projectV2Field {
                id
                name
                dataType
                ... on ProjectV2SingleSelectField {
                  options {
                    id
                    name
                    color
                  }
                }
              }
            }
          }
        `;

        variables = {
          input: {
            projectId,
            name,
            dataType,
            singleSelectOptions: options.map(option => ({
              name: option.name,
              color: option.color || 'GRAY'
            }))
          }
        };
      } else {
        mutation = `
          mutation CreateProjectV2Field($input: CreateProjectV2FieldInput!) {
            createProjectV2Field(input: $input) {
              projectV2Field {
                id
                name
                dataType
              }
            }
          }
        `;

        variables = {
          input: {
            projectId,
            name,
            dataType
          }
        };
      }

      const response = await this.rateLimiter.execute(
        () => this.graphql(mutation, variables),
        { operation: 'createProjectField', projectId, fieldName: name }
      );
      const field = response.createProjectV2Field.projectV2Field;
      
      this.logger.info('Project field created successfully', { 
        fieldId: field.id,
        name: field.name 
      });
      
      return field;
    } catch (error) {
      this.logger.error('Failed to create project field', { 
        projectId,
        name,
        error: error.message 
      });
      throw new Error(`Field creation failed: ${error.message}`);
    }
  }

  /**
   * Add repository to project
   * @param {string} projectId - Project ID
   * @param {string} repositoryId - Repository ID
   * @returns {Promise<Object>} - Link result
   */
  async linkRepositoryToProject(projectId, repositoryId) {
    try {
      this.logger.info('Linking repository to project', { projectId, repositoryId });
      
      const mutation = `
        mutation LinkRepositoryToProject($projectId: ID!, $repositoryId: ID!) {
          linkRepositoryToProject(input: {projectId: $projectId, repositoryId: $repositoryId}) {
            repository {
              id
              name
            }
          }
        }
      `;

      const variables = { projectId, repositoryId };
      const response = await this.graphql(mutation, variables);
      
      this.logger.info('Repository linked to project successfully', { 
        projectId,
        repositoryId 
      });
      
      return response.linkRepositoryToProject;
    } catch (error) {
      this.logger.error('Failed to link repository to project', { 
        projectId,
        repositoryId,
        error: error.message 
      });
      throw new Error(`Repository linking failed: ${error.message}`);
    }
  }

  /**
   * Add issue to project
   * @param {string} projectId - Project ID
   * @param {string} issueId - Issue ID
   * @returns {Promise<Object>} - Created project item
   */
  async addIssueToProject(projectId, issueId) {
    try {
      this.logger.info('Adding issue to project', { projectId, issueId });
      
      const mutation = `
        mutation AddProjectV2ItemById($input: AddProjectV2ItemByIdInput!) {
          addProjectV2ItemById(input: $input) {
            item {
              id
              content {
                ... on Issue {
                  id
                  number
                  title
                }
              }
            }
          }
        }
      `;

      const variables = {
        input: {
          projectId,
          contentId: issueId
        }
      };

      const response = await this.graphql(mutation, variables);
      const item = response.addProjectV2ItemById.item;
      
      this.logger.info('Issue added to project successfully', { 
        projectId,
        issueId,
        itemId: item.id 
      });
      
      return item;
    } catch (error) {
      this.logger.error('Failed to add issue to project', { 
        projectId,
        issueId,
        error: error.message 
      });
      throw new Error(`Adding issue to project failed: ${error.message}`);
    }
  }

  /**
   * Update project item field value
   * @param {string} projectId - Project ID
   * @param {string} itemId - Project item ID
   * @param {string} fieldId - Field ID
   * @param {any} value - Field value
   * @returns {Promise<Object>} - Update result
   */
  async updateProjectItemField(projectId, itemId, fieldId, value) {
    try {
      this.logger.info('Updating project item field', { 
        projectId, 
        itemId, 
        fieldId, 
        value 
      });
      
      const mutation = `
        mutation UpdateProjectV2ItemFieldValue($input: UpdateProjectV2ItemFieldValueInput!) {
          updateProjectV2ItemFieldValue(input: $input) {
            projectV2Item {
              id
            }
          }
        }
      `;

      const variables = {
        input: {
          projectId,
          itemId,
          fieldId,
          value: {
            text: typeof value === 'string' ? value : JSON.stringify(value)
          }
        }
      };

      const response = await this.graphql(mutation, variables);
      
      this.logger.info('Project item field updated successfully', { 
        projectId,
        itemId,
        fieldId 
      });
      
      return response.updateProjectV2ItemFieldValue;
    } catch (error) {
      this.logger.error('Failed to update project item field', { 
        projectId,
        itemId,
        fieldId,
        error: error.message 
      });
      throw new Error(`Field update failed: ${error.message}`);
    }
  }

  /**
   * Get organization ID by login
   * @param {string} orgLogin - Organization login name
   * @returns {Promise<string>} - Organization ID
   */
  async getOrganizationId(orgLogin) {
    try {
      // Check cache first
      const cacheKey = `org:${orgLogin}:id`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      this.logger.info('Fetching organization ID', { orgLogin });
      
      const query = `
        query GetOrganization($login: String!) {
          organization(login: $login) {
            id
            login
            name
          }
        }
      `;

      const variables = { login: orgLogin };
      const response = await this.graphql(query, variables);
      
      if (!response.organization) {
        throw new Error(`Organization not found: ${orgLogin}`);
      }
      
      const orgId = response.organization.id;
      
      // Cache for 1 hour
      this.cache.set(cacheKey, orgId, 3600);
      
      this.logger.info('Organization ID retrieved', { orgLogin, orgId });
      
      return orgId;
    } catch (error) {
      this.logger.error('Failed to get organization ID', { 
        orgLogin,
        error: error.message 
      });
      throw new Error(`Failed to get organization ID: ${error.message}`);
    }
  }

  /**
   * Get repository ID by owner and name
   * @param {string} owner - Repository owner
   * @param {string} name - Repository name
   * @returns {Promise<string>} - Repository ID
   */
  async getRepositoryId(owner, name) {
    try {
      const cacheKey = `repo:${owner}/${name}:id`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      this.logger.info('Fetching repository ID', { owner, name });
      
      const query = `
        query GetRepository($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            id
            name
            owner {
              login
            }
          }
        }
      `;

      const variables = { owner, name };
      const response = await this.graphql(query, variables);
      
      if (!response.repository) {
        throw new Error(`Repository not found: ${owner}/${name}`);
      }
      
      const repoId = response.repository.id;
      
      // Cache for 1 hour
      this.cache.set(cacheKey, repoId, 3600);
      
      this.logger.info('Repository ID retrieved', { owner, name, repoId });
      
      return repoId;
    } catch (error) {
      this.logger.error('Failed to get repository ID', { 
        owner,
        name,
        error: error.message 
      });
      throw new Error(`Failed to get repository ID: ${error.message}`);
    }
  }

  /**
   * Test API connectivity and permissions
   * @returns {Promise<Object>} - Health check result
   */
  async healthCheck() {
    try {
      this.logger.info('Performing GitHub Projects V2 API health check');
      
      const query = `
        query HealthCheck {
          viewer {
            login
            id
          }
        }
      `;

      const response = await this.graphql(query);
      const viewer = response.viewer;
      
      this.logger.info('GitHub Projects V2 API health check passed', { 
        user: viewer.login,
        userId: viewer.id 
      });
      
      return {
        status: 'healthy',
        user: viewer.login,
        userId: viewer.id,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('GitHub Projects V2 API health check failed', { 
        error: error.message 
      });
      
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get owner (organization or user) node ID
   * @param {string} login - Owner login name
   * @returns {Promise<Object>} - Owner data with node ID
   */
  async getOwnerNodeId(login) {
    try {
      this.logger.info('Getting owner node ID', { login });
      
      const query = `
        query($login: String!) {
          repositoryOwner(login: $login) {
            id
            login
            ... on Organization {
              name
              description
            }
            ... on User {
              name
              email
            }
          }
        }
      `;
      
      const result = await this.graphql(query, { login });
      
      if (!result.repositoryOwner) {
        throw new Error(`Owner not found: ${login}`);
      }
      
      this.logger.info('Owner node ID retrieved', { 
        login, 
        nodeId: result.repositoryOwner.id 
      });
      
      return {
        nodeId: result.repositoryOwner.id,
        login: result.repositoryOwner.login,
        name: result.repositoryOwner.name
      };
      
    } catch (error) {
      this.logger.error('Failed to get owner node ID', { 
        login, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get repository node ID
   * @param {string} owner - Repository owner
   * @param {string} name - Repository name
   * @returns {Promise<Object>} - Repository data with node ID
   */
  async getRepositoryNodeId(owner, name) {
    try {
      this.logger.info('Getting repository node ID', { owner, name });
      
      const query = `
        query($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            id
            name
            nameWithOwner
            description
            url
            isPrivate
          }
        }
      `;
      
      const result = await this.graphql(query, { owner, name });
      
      if (!result.repository) {
        throw new Error(`Repository not found: ${owner}/${name}`);
      }
      
      this.logger.info('Repository node ID retrieved', { 
        repository: result.repository.nameWithOwner,
        nodeId: result.repository.id 
      });
      
      return {
        nodeId: result.repository.id,
        name: result.repository.name,
        nameWithOwner: result.repository.nameWithOwner,
        description: result.repository.description,
        url: result.repository.url,
        isPrivate: result.repository.isPrivate
      };
      
    } catch (error) {
      this.logger.error('Failed to get repository node ID', { 
        owner, 
        name, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Add repository to project
   * @param {string} projectId - Project node ID
   * @param {string} repositoryId - Repository node ID
   * @returns {Promise<Object>} - Link result
   */
  async addRepositoryToProject(projectId, repositoryId) {
    try {
      this.logger.info('Linking repository to project', { projectId, repositoryId });
      
      const mutation = `
        mutation($projectId: ID!, $repositoryId: ID!) {
          linkRepositoryToProject(input: {
            projectId: $projectId
            repositoryId: $repositoryId
          }) {
            repository {
              id
              nameWithOwner
            }
            project {
              id
              title
            }
          }
        }
      `;
      
      const result = await this.graphql(mutation, { projectId, repositoryId });
      
      this.logger.info('Repository linked to project successfully', {
        repository: result.linkRepositoryToProject.repository.nameWithOwner,
        project: result.linkRepositoryToProject.project.title
      });
      
      return result.linkRepositoryToProject;
      
    } catch (error) {
      this.logger.error('Failed to link repository to project', { 
        projectId, 
        repositoryId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Create project view
   * @param {string} projectId - Project node ID
   * @param {Object} viewData - View configuration
   * @returns {Promise<Object>} - Created view
   */
  async createProjectView(projectId, viewData) {
    try {
      this.logger.info('Creating project view', { 
        projectId, 
        viewName: viewData.name,
        layout: viewData.layout 
      });
      
      const mutation = `
        mutation($projectId: ID!, $name: String!, $layout: ProjectV2ViewLayout!) {
          createProjectV2View(input: {
            projectId: $projectId
            name: $name
            layout: $layout
          }) {
            projectV2View {
              id
              name
              layout
              number
              createdAt
            }
          }
        }
      `;
      
      const result = await this.graphql(mutation, { 
        projectId, 
        name: viewData.name,
        layout: viewData.layout
      });
      
      this.logger.info('Project view created successfully', {
        viewId: result.createProjectV2View.projectV2View.id,
        viewName: result.createProjectV2View.projectV2View.name,
        layout: result.createProjectV2View.projectV2View.layout
      });
      
      return result.createProjectV2View.projectV2View;
      
    } catch (error) {
      this.logger.error('Failed to create project view', { 
        projectId, 
        viewData, 
        error: error.message 
      });
      throw error;
    }
  }
}

export default GitHubProjectsAPI;