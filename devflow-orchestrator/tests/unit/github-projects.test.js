/**
 * @fileoverview Unit tests for GitHub Projects V2 API client
 * @version 1.0.0
 * @author DevEcosystem
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { GitHubProjectsAPI } from '../../api/github-projects.js';

describe('GitHubProjectsAPI', () => {
  let api;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      token: 'mock-token-for-testing',
      rateLimiter: {
        maxRetries: 1,
        baseDelay: 100
      }
    };
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe('constructor', () => {
    it('should initialize with valid config', () => {
      api = new GitHubProjectsAPI(mockConfig);
      assert.ok(api.graphql);
      assert.ok(api.logger);
      assert.ok(api.cache);
      assert.ok(api.rateLimiter);
    });

    it('should throw error without token', () => {
      assert.throws(() => {
        new GitHubProjectsAPI({});
      }, /GitHub token is required/);
    });
  });

  describe('health check', () => {
    it('should return health status structure', async () => {
      api = new GitHubProjectsAPI(mockConfig);
      
      // Mock the GraphQL call to avoid actual API call
      api.graphql = async () => ({
        viewer: {
          login: 'test-user',
          id: 'test-id'
        }
      });

      const health = await api.healthCheck();
      
      assert.equal(health.status, 'healthy');
      assert.equal(health.user, 'test-user');
      assert.equal(health.userId, 'test-id');
      assert.ok(health.timestamp);
    });

    it('should handle health check failure', async () => {
      api = new GitHubProjectsAPI(mockConfig);
      
      // Mock the GraphQL call to simulate failure
      api.graphql = async () => {
        throw new Error('API Error');
      };

      const health = await api.healthCheck();
      
      assert.equal(health.status, 'unhealthy');
      assert.equal(health.error, 'API Error');
      assert.ok(health.timestamp);
    });
  });

  describe('project operations', () => {
    beforeEach(() => {
      api = new GitHubProjectsAPI(mockConfig);
    });

    it('should create project with valid input', async () => {
      const mockProject = {
        id: 'PJ_test123',
        number: 1,
        title: 'Test Project',
        url: 'https://github.com/test/project/1'
      };

      // Mock successful GraphQL response
      api.graphql = async () => ({
        createProjectV2: {
          projectV2: mockProject
        }
      });

      const result = await api.createProject({
        ownerId: 'ORG_test123',
        title: 'Test Project',
        shortDescription: 'Test description'
      });

      assert.equal(result.id, mockProject.id);
      assert.equal(result.title, mockProject.title);
    });

    it('should get project by ID', async () => {
      const mockProject = {
        id: 'PJ_test123',
        title: 'Test Project',
        fields: { nodes: [] },
        views: { nodes: [] }
      };

      // Mock successful GraphQL response
      api.graphql = async () => ({
        node: mockProject
      });

      const result = await api.getProject('PJ_test123');
      
      assert.equal(result.id, mockProject.id);
      assert.equal(result.title, mockProject.title);
    });

    it('should handle project not found', async () => {
      // Mock GraphQL response with null node
      api.graphql = async () => ({
        node: null
      });

      try {
        await api.getProject('PJ_nonexistent');
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('Project not found'));
      }
    });
  });

  describe('field operations', () => {
    beforeEach(() => {
      api = new GitHubProjectsAPI(mockConfig);
    });

    it('should create single select field', async () => {
      const mockField = {
        id: 'FIELD_test123',
        name: 'Status',
        dataType: 'SINGLE_SELECT',
        options: [
          { id: 'OPT_1', name: 'Todo', color: 'GRAY' },
          { id: 'OPT_2', name: 'Done', color: 'GREEN' }
        ]
      };

      // Mock successful GraphQL response
      api.graphql = async () => ({
        createProjectV2Field: {
          projectV2Field: mockField
        }
      });

      const result = await api.createProjectField('PJ_test123', {
        name: 'Status',
        dataType: 'SINGLE_SELECT',
        options: [
          { name: 'Todo', color: 'GRAY' },
          { name: 'Done', color: 'GREEN' }
        ]
      });

      assert.equal(result.id, mockField.id);
      assert.equal(result.name, mockField.name);
      assert.equal(result.dataType, mockField.dataType);
    });

    it('should create text field', async () => {
      const mockField = {
        id: 'FIELD_text123',
        name: 'Description',
        dataType: 'TEXT'
      };

      // Mock successful GraphQL response
      api.graphql = async () => ({
        createProjectV2Field: {
          projectV2Field: mockField
        }
      });

      const result = await api.createProjectField('PJ_test123', {
        name: 'Description',
        dataType: 'TEXT'
      });

      assert.equal(result.id, mockField.id);
      assert.equal(result.name, mockField.name);
      assert.equal(result.dataType, mockField.dataType);
    });
  });

  describe('organization operations', () => {
    beforeEach(() => {
      api = new GitHubProjectsAPI(mockConfig);
    });

    it('should get organization ID by login', async () => {
      const mockOrg = {
        id: 'ORG_test123',
        login: 'test-org',
        name: 'Test Organization'
      };

      // Mock successful GraphQL response
      api.graphql = async () => ({
        organization: mockOrg
      });

      const result = await api.getOrganizationId('test-org');
      
      assert.equal(result, mockOrg.id);
    });

    it('should handle organization not found', async () => {
      // Mock GraphQL response with null organization
      api.graphql = async () => ({
        organization: null
      });

      try {
        await api.getOrganizationId('nonexistent-org');
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('Organization not found'));
      }
    });
  });

  describe('repository operations', () => {
    beforeEach(() => {
      api = new GitHubProjectsAPI(mockConfig);
    });

    it('should get repository ID by owner and name', async () => {
      const mockRepo = {
        id: 'REPO_test123',
        name: 'test-repo',
        owner: { login: 'test-owner' }
      };

      // Mock successful GraphQL response
      api.graphql = async () => ({
        repository: mockRepo
      });

      const result = await api.getRepositoryId('test-owner', 'test-repo');
      
      assert.equal(result, mockRepo.id);
    });

    it('should handle repository not found', async () => {
      // Mock GraphQL response with null repository
      api.graphql = async () => ({
        repository: null
      });

      try {
        await api.getRepositoryId('test-owner', 'nonexistent-repo');
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('Repository not found'));
      }
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      api = new GitHubProjectsAPI(mockConfig);
    });

    it('should handle GraphQL errors', async () => {
      // Mock GraphQL error
      api.graphql = async () => {
        throw new Error('GraphQL Error: Bad request');
      };

      try {
        await api.createProject({
          ownerId: 'invalid',
          title: 'Test'
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('Project creation failed'));
      }
    });

    it('should handle rate limit errors', async () => {
      // Mock rate limit error
      api.graphql = async () => {
        const error = new Error('Rate limited');
        error.errors = [{ type: 'RATE_LIMITED' }];
        throw error;
      };

      try {
        await api.createProject({
          ownerId: 'test',
          title: 'Test'
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('Project creation failed'));
      }
    });
  });
});

export default describe;