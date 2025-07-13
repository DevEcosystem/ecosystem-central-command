/**
 * @fileoverview Project Automation Service Unit Tests
 * @version 1.0.0
 * @author DevEcosystem
 */

import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { EventEmitter } from 'events';
import { ProjectAutomationService } from '../../core/project-automation.js';
import { ConfigManager } from '../../config/config-manager.js';

// Mock GitHub API responses
const mockGitHubResponses = {
  createProject: {
    id: 'PVT_kwDOBrZnOM4ABeGz',
    number: 1,
    title: 'Test Project',
    url: 'https://github.com/orgs/DevBusinessHub/projects/1',
    shortDescription: 'Test project description',
    public: false,
    createdAt: '2025-07-13T00:00:00Z'
  },
  getOwnerNodeId: {
    nodeId: 'MDEyOk9yZ2FuaXphdGlvbjc5NDI1NzY1',
    login: 'DevBusinessHub',
    name: 'Development Business Hub'
  },
  getRepositoryNodeId: {
    nodeId: 'MDEwOlJlcG9zaXRvcnkyOTM1MzYyOTE=',
    name: 'test-repo',
    nameWithOwner: 'DevBusinessHub/test-repo',
    description: 'Test repository',
    url: 'https://github.com/DevBusinessHub/test-repo',
    isPrivate: false
  },
  createProjectField: {
    id: 'PVTF_lADOBrZnOM4ABeGzzgEP8Q4',
    name: 'Status',
    dataType: 'SINGLE_SELECT',
    createdAt: '2025-07-13T00:00:00Z'
  },
  createProjectView: {
    id: 'PVTV_lADOBrZnOM4ABeGzzgNP8Q4',
    name: 'Kanban Board',
    layout: 'BOARD_LAYOUT',
    number: 1,
    createdAt: '2025-07-13T00:00:00Z'
  }
};

// Mock GitHub Projects API
class MockGitHubProjectsAPI extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.callHistory = [];
  }

  async createProject(projectData) {
    this.callHistory.push({ method: 'createProject', args: projectData });
    return { ...mockGitHubResponses.createProject, ...projectData };
  }

  async getOwnerNodeId(login) {
    this.callHistory.push({ method: 'getOwnerNodeId', args: { login } });
    return { ...mockGitHubResponses.getOwnerNodeId, login };
  }

  async getRepositoryNodeId(owner, name) {
    this.callHistory.push({ method: 'getRepositoryNodeId', args: { owner, name } });
    return { ...mockGitHubResponses.getRepositoryNodeId, name, nameWithOwner: `${owner}/${name}` };
  }

  async createProjectField(projectId, fieldData) {
    this.callHistory.push({ method: 'createProjectField', args: { projectId, fieldData } });
    return { ...mockGitHubResponses.createProjectField, ...fieldData };
  }

  async createProjectView(projectId, viewData) {
    this.callHistory.push({ method: 'createProjectView', args: { projectId, viewData } });
    return { ...mockGitHubResponses.createProjectView, ...viewData };
  }

  async addRepositoryToProject(projectId, repositoryId) {
    this.callHistory.push({ method: 'addRepositoryToProject', args: { projectId, repositoryId } });
    return {
      repository: mockGitHubResponses.getRepositoryNodeId,
      project: mockGitHubResponses.createProject
    };
  }

  getCallHistory() {
    return this.callHistory;
  }

  clearCallHistory() {
    this.callHistory = [];
  }
}

describe('ProjectAutomationService', () => {
  let config;
  let projectAutomation;
  let mockGitHubAPI;

  before(async () => {
    // Set up test environment
    process.env.NODE_ENV = 'development';
    process.env.GITHUB_TOKEN = 'ghp_1234567890123456789012345678901234567';
    process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests
    
    // Initialize configuration
    config = new ConfigManager({
      environment: 'development',
      validateOnLoad: false, // Skip validation for tests
      enableHotReload: false
    });
    
    await config.initialize();
  });

  beforeEach(() => {
    // Create fresh instances for each test
    projectAutomation = new ProjectAutomationService(config);
    
    // Replace GitHub API with mock
    mockGitHubAPI = new MockGitHubProjectsAPI({ token: 'test-token' });
    projectAutomation.githubAPI = mockGitHubAPI;
  });

  afterEach(() => {
    // Clean up event listeners
    if (projectAutomation) {
      projectAutomation.removeAllListeners();
    }
  });

  after(() => {
    // Clean up
    if (config) {
      config.removeAllListeners();
    }
  });

  describe('Initialization', () => {
    it('should initialize successfully with configuration', () => {
      assert.strictEqual(typeof projectAutomation, 'object');
      assert.ok(projectAutomation.config);
      assert.ok(projectAutomation.githubAPI);
      assert.ok(projectAutomation.templateManager);
    });

    it('should have healthy status', () => {
      const health = projectAutomation.getHealth();
      assert.strictEqual(health.service, 'ProjectAutomationService');
      assert.strictEqual(health.status, 'healthy');
      assert.strictEqual(health.githubAPI.initialized, true);
      assert.strictEqual(health.templateManager.initialized, true);
      assert.ok(health.organizations > 0);
    });
  });

  describe('Organization Detection', () => {
    it('should detect DevBusinessHub organization correctly', async () => {
      const repository = {
        name: 'test-business-repo',
        owner: 'DevBusinessHub',
        description: 'Test business repository'
      };

      const orgConfig = await projectAutomation._detectOrganizationConfig(repository);
      
      assert.strictEqual(orgConfig.id, 'DevBusinessHub');
      assert.strictEqual(orgConfig.type, 'production');
      assert.strictEqual(orgConfig.settings.projectTemplate, 'production-ready');
    });

    it('should detect DevPersonalHub organization correctly', async () => {
      const repository = {
        name: 'test-personal-repo',
        owner: 'DevPersonalHub',
        description: 'Test personal repository'
      };

      const orgConfig = await projectAutomation._detectOrganizationConfig(repository);
      
      assert.strictEqual(orgConfig.id, 'DevPersonalHub');
      assert.strictEqual(orgConfig.type, 'experimental');
      assert.strictEqual(orgConfig.settings.projectTemplate, 'lightweight');
    });

    it('should handle unknown organizations with default config', async () => {
      const repository = {
        name: 'test-unknown-repo',
        owner: 'UnknownOrg',
        description: 'Test unknown repository'
      };

      const orgConfig = await projectAutomation._detectOrganizationConfig(repository);
      
      assert.strictEqual(orgConfig.id, 'UnknownOrg');
      assert.strictEqual(orgConfig.type, 'unknown');
    });
  });

  describe('Template Preparation', () => {
    it('should prepare production template for DevBusinessHub', async () => {
      const orgConfig = config.getOrganizationConfig('DevBusinessHub');
      const repository = {
        name: 'test-business-repo',
        owner: 'DevBusinessHub',
        description: 'Test business repository'
      };

      const template = await projectAutomation._prepareProjectTemplate(orgConfig, repository);
      
      assert.strictEqual(template.id, 'production-ready');
      assert.strictEqual(template.organizationType, 'production');
      assert.ok(template.fields.length > 0);
      assert.ok(template.views.length > 0);
    });

    it('should prepare lightweight template for DevPersonalHub', async () => {
      const orgConfig = config.getOrganizationConfig('DevPersonalHub');
      const repository = {
        name: 'test-personal-repo',
        owner: 'DevPersonalHub',
        description: 'Test personal repository'
      };

      const template = await projectAutomation._prepareProjectTemplate(orgConfig, repository);
      
      assert.strictEqual(template.id, 'lightweight');
      assert.strictEqual(template.organizationType, 'experimental');
      assert.ok(template.fields.length > 0);
      assert.ok(template.views.length > 0);
    });

    it('should throw error for invalid template', async () => {
      const invalidOrgConfig = {
        settings: { projectTemplate: 'non-existent-template' }
      };
      const repository = { name: 'test', owner: 'test' };

      await assert.rejects(
        async () => {
          await projectAutomation._prepareProjectTemplate(invalidOrgConfig, repository);
        },
        /Template not found: non-existent-template/
      );
    });
  });

  describe('Project Creation', () => {
    it('should create project for DevBusinessHub repository successfully', async () => {
      const repository = {
        name: 'test-business-repo',
        owner: 'DevBusinessHub',
        description: 'Test business repository'
      };

      let projectCreatedEvent = null;
      projectAutomation.on('projectCreated', (data) => {
        projectCreatedEvent = data;
      });

      const result = await projectAutomation.createProjectForRepository(repository);
      
      // Verify result structure
      assert.ok(result.project);
      assert.strictEqual(result.template, 'production-ready');
      assert.strictEqual(result.organization, 'DevBusinessHub');
      assert.ok(result.fieldsCreated > 0);
      assert.ok(result.viewsCreated > 0);
      assert.ok(result.createdAt);
      
      // Verify project created event was emitted
      assert.ok(projectCreatedEvent);
      assert.strictEqual(projectCreatedEvent.organization, 'DevBusinessHub');
      
      // Verify GitHub API calls were made
      const callHistory = mockGitHubAPI.getCallHistory();
      const methodCalls = callHistory.map(call => call.method);
      
      assert.ok(methodCalls.includes('getOwnerNodeId'));
      assert.ok(methodCalls.includes('createProject'));
      assert.ok(methodCalls.includes('createProjectField'));
      assert.ok(methodCalls.includes('createProjectView'));
    });

    it('should create project for DevPersonalHub repository successfully', async () => {
      const repository = {
        name: 'test-personal-repo',
        owner: 'DevPersonalHub',
        description: 'Test personal repository'
      };

      const result = await projectAutomation.createProjectForRepository(repository);
      
      assert.strictEqual(result.template, 'lightweight');
      assert.strictEqual(result.organization, 'DevPersonalHub');
      
      // DevPersonalHub should have fewer fields than DevBusinessHub
      const businessTemplate = projectAutomation.templateManager.getTemplate('production-ready');
      const personalTemplate = projectAutomation.templateManager.getTemplate('lightweight');
      
      assert.ok(personalTemplate.fields.length < businessTemplate.fields.length);
    });

    it('should link repository to project when requested', async () => {
      const repository = {
        name: 'test-repo-linking',
        owner: 'DevBusinessHub',
        description: 'Test repository linking'
      };

      await projectAutomation.createProjectForRepository(repository, {
        linkRepository: true
      });
      
      const callHistory = mockGitHubAPI.getCallHistory();
      const methodCalls = callHistory.map(call => call.method);
      
      assert.ok(methodCalls.includes('getRepositoryNodeId'));
      assert.ok(methodCalls.includes('addRepositoryToProject'));
    });

    it('should handle project creation failure gracefully', async () => {
      // Mock API to throw error
      mockGitHubAPI.createProject = async () => {
        throw new Error('GitHub API Error');
      };

      const repository = {
        name: 'failing-repo',
        owner: 'DevBusinessHub',
        description: 'Repository that will fail to create project'
      };

      let errorEvent = null;
      projectAutomation.on('projectCreationFailed', (data) => {
        errorEvent = data;
      });

      await assert.rejects(
        async () => {
          await projectAutomation.createProjectForRepository(repository);
        },
        /GitHub API Error/
      );

      // Verify error event was emitted
      assert.ok(errorEvent);
      assert.strictEqual(errorEvent.repository.name, 'failing-repo');
      assert.strictEqual(errorEvent.error, 'GitHub API Error');
    });
  });

  describe('Demo Project Creation', () => {
    it('should create demo project for DevBusinessHub', async () => {
      const result = await projectAutomation.createDemoProject('DevBusinessHub', {
        projectName: 'demo-business-project',
        description: 'Demo project for testing'
      });

      assert.strictEqual(result.organization, 'DevBusinessHub');
      assert.strictEqual(result.template, 'production-ready');
      assert.ok(result.project.title.includes('demo-business-project'));
    });

    it('should create demo project with auto-generated name', async () => {
      const result = await projectAutomation.createDemoProject('DevPersonalHub');

      assert.strictEqual(result.organization, 'DevPersonalHub');
      assert.strictEqual(result.template, 'lightweight');
      assert.ok(result.project.title.includes('demo-project-'));
    });
  });

  describe('Bulk Project Creation', () => {
    it('should create projects for multiple repositories', async () => {
      const repositories = [
        {
          name: 'repo1',
          owner: 'DevBusinessHub',
          description: 'First repository'
        },
        {
          name: 'repo2',
          owner: 'DevPersonalHub',
          description: 'Second repository'
        },
        {
          name: 'repo3',
          owner: 'DevAcademicHub',
          description: 'Third repository'
        }
      ];

      const result = await projectAutomation.createProjectsForRepositories(repositories, {
        delayBetweenCreations: 10 // Small delay for testing
      });

      assert.strictEqual(result.summary.total, 3);
      assert.strictEqual(result.summary.successful, 3);
      assert.strictEqual(result.summary.failed, 0);
      assert.strictEqual(result.summary.successRate, 100);
      
      assert.strictEqual(result.results.length, 3);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should handle partial failures in bulk creation', async () => {
      // Mock API to fail on second call
      let callCount = 0;
      const originalCreateProject = mockGitHubAPI.createProject;
      mockGitHubAPI.createProject = async (projectData) => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Simulated failure');
        }
        return originalCreateProject.call(mockGitHubAPI, projectData);
      };

      const repositories = [
        { name: 'repo1', owner: 'DevBusinessHub', description: 'First repository' },
        { name: 'repo2', owner: 'DevPersonalHub', description: 'Second repository' },
        { name: 'repo3', owner: 'DevAcademicHub', description: 'Third repository' }
      ];

      const result = await projectAutomation.createProjectsForRepositories(repositories);

      assert.strictEqual(result.summary.total, 3);
      assert.strictEqual(result.summary.successful, 2);
      assert.strictEqual(result.summary.failed, 1);
      assert.strictEqual(Math.round(result.summary.successRate), 67);
      
      assert.strictEqual(result.results.length, 2);
      assert.strictEqual(result.errors.length, 1);
      assert.strictEqual(result.errors[0].repository, 'repo2');
    });
  });

  describe('Service Health', () => {
    it('should return comprehensive health status', () => {
      const health = projectAutomation.getHealth();
      
      assert.strictEqual(health.service, 'ProjectAutomationService');
      assert.strictEqual(health.status, 'healthy');
      
      assert.ok(health.githubAPI);
      assert.strictEqual(health.githubAPI.initialized, true);
      assert.strictEqual(health.githubAPI.hasToken, true);
      
      assert.ok(health.templateManager);
      assert.strictEqual(health.templateManager.initialized, true);
      assert.ok(health.templateManager.templatesAvailable > 0);
      
      assert.ok(health.organizations > 0);
    });
  });

  describe('Event System', () => {
    it('should emit events during project creation lifecycle', async () => {
      const events = [];
      
      projectAutomation.on('projectCreated', (data) => {
        events.push({ type: 'projectCreated', data });
      });
      
      const repository = {
        name: 'event-test-repo',
        owner: 'DevBusinessHub',
        description: 'Repository for testing events'
      };

      await projectAutomation.createProjectForRepository(repository);
      
      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].type, 'projectCreated');
      assert.strictEqual(events[0].data.organization, 'DevBusinessHub');
    });

    it('should emit bulk creation completion event', async () => {
      const events = [];
      
      projectAutomation.on('bulkProjectCreationCompleted', (data) => {
        events.push({ type: 'bulkProjectCreationCompleted', data });
      });
      
      const repositories = [
        { name: 'bulk1', owner: 'DevBusinessHub', description: 'Bulk test 1' },
        { name: 'bulk2', owner: 'DevPersonalHub', description: 'Bulk test 2' }
      ];

      await projectAutomation.createProjectsForRepositories(repositories);
      
      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].type, 'bulkProjectCreationCompleted');
      assert.strictEqual(events[0].data.total, 2);
    });
  });
});