/**
 * @fileoverview Dashboard Server Unit Tests
 * @version 1.0.0
 * @author DevEcosystem
 */

import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { DashboardServer } from '../../dashboard/server.js';
import { ConfigManager } from '../../config/config-manager.js';

describe('DashboardServer', () => {
  let dashboard;
  let server;
  let app;

  before(async () => {
    // Set up test environment
    process.env.NODE_ENV = 'development';
    process.env.GITHUB_TOKEN = 'ghp_1234567890123456789012345678901234567';
    process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests
  });

  beforeEach(async () => {
    // Create fresh dashboard instance for each test
    dashboard = new DashboardServer({
      port: 0, // Use random port for testing
      host: 'localhost',
      environment: 'development'
    });
  });

  afterEach(async () => {
    // Clean up server if running
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
      server = null;
    }
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await dashboard.initialize();
      
      assert.strictEqual(dashboard.isInitialized, true);
      assert.ok(dashboard.config);
      assert.ok(dashboard.projectAutomation);
      assert.ok(dashboard.githubAPI);
    });

    it('should have correct default options', () => {
      assert.strictEqual(dashboard.options.host, 'localhost');
      assert.strictEqual(dashboard.options.environment, 'development');
      assert.strictEqual(typeof dashboard.options.port, 'number');
    });
  });

  describe('Health Check', () => {
    it('should respond to health check', async () => {
      await dashboard.initialize();
      app = dashboard.app;

      const response = await request(app)
        .get('/health')
        .expect(200);

      assert.strictEqual(response.body.status, 'healthy');
      assert.ok(response.body.timestamp);
      assert.strictEqual(response.body.version, '1.0.0');
      assert.strictEqual(response.body.environment, 'development');
    });
  });

  describe('API Routes', () => {
    beforeEach(async () => {
      await dashboard.initialize();
      app = dashboard.app;
    });

    it('should get organizations', async () => {
      const response = await request(app)
        .get('/api/organizations')
        .expect(200);

      assert.ok(response.body.organizations);
      assert.ok(Array.isArray(response.body.organizations));
      assert.ok(response.body.total >= 0);
      assert.ok(response.body.timestamp);
    });

    it('should get projects overview', async () => {
      const response = await request(app)
        .get('/api/projects/overview')
        .expect(200);

      assert.ok(response.body.overview);
      assert.ok(Array.isArray(response.body.overview));
      assert.ok(response.body.summary);
      assert.ok(response.body.summary.timestamp);
    });

    it('should get analytics summary', async () => {
      const response = await request(app)
        .get('/api/analytics/summary')
        .expect(200);

      assert.ok(typeof response.body.organizations === 'number');
      assert.ok(typeof response.body.totalProjects === 'number');
      assert.ok(response.body.projectsByOrg);
      assert.ok(response.body.templates);
      assert.ok(response.body.timestamp);
    });

    it('should handle organization projects request', async () => {
      const response = await request(app)
        .get('/api/organizations/DevBusinessHub/projects')
        .expect(200);

      assert.strictEqual(response.body.organization, 'DevBusinessHub');
      assert.ok(Array.isArray(response.body.projects));
      assert.ok(typeof response.body.total === 'number');
      assert.ok(response.body.timestamp);
    });

    it('should validate project creation request', async () => {
      // Missing required fields
      const response = await request(app)
        .post('/api/projects/create')
        .send({})
        .expect(400);

      assert.strictEqual(response.body.error, 'Invalid request');
      assert.ok(response.body.message.includes('required'));
    });

    it('should handle invalid organization projects request', async () => {
      const response = await request(app)
        .get('/api/organizations/NonExistentOrg/projects')
        .expect(200); // Should return empty array, not error

      assert.strictEqual(response.body.organization, 'NonExistentOrg');
      assert.ok(Array.isArray(response.body.projects));
      assert.strictEqual(response.body.total, 0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await dashboard.initialize();
      app = dashboard.app;
    });

    it('should handle 404 for unknown API routes', async () => {
      const response = await request(app)
        .post('/api/unknown-endpoint')
        .expect(404);

      assert.strictEqual(response.body.error, 'Not Found');
      assert.ok(response.body.message.includes('not found'));
      assert.ok(response.body.timestamp);
    });

    it('should serve dashboard for root path', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      // Should serve HTML content
      assert.ok(response.text.includes('DevFlow Orchestrator Dashboard'));
    });
  });

  describe('Configuration Integration', () => {
    it('should load organization configurations', async () => {
      await dashboard.initialize();
      
      const organizations = dashboard.config.get('organizations');
      assert.ok(organizations);
      
      // Should have our test organizations
      const orgIds = Object.keys(organizations);
      assert.ok(orgIds.includes('DevBusinessHub'));
      assert.ok(orgIds.includes('DevPersonalHub'));
      assert.ok(orgIds.includes('DevAcademicHub'));
      assert.ok(orgIds.includes('DevEcosystem'));
    });

    it('should have project automation service configured', async () => {
      await dashboard.initialize();
      
      assert.ok(dashboard.projectAutomation);
      assert.strictEqual(typeof dashboard.projectAutomation.createProjectForRepository, 'function');
      assert.strictEqual(typeof dashboard.projectAutomation.createDemoProject, 'function');
    });
  });

  describe('Real Server Integration', () => {
    it('should start and stop server', async () => {
      server = await dashboard.start();
      
      assert.ok(server);
      assert.ok(server.listening);
      
      // Test that server is accessible
      const response = await request(dashboard.app)
        .get('/health')
        .expect(200);
        
      assert.strictEqual(response.body.status, 'healthy');
    });
  });
});