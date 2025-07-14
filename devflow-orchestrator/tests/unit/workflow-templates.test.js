import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { WorkflowTemplates } from '../../core/workflow-templates.js';

describe('WorkflowTemplates', () => {
  let templates;

  beforeEach(() => {
    templates = new WorkflowTemplates();
  });

  test('should initialize with default templates', () => {
    const templateList = templates.listTemplates();
    
    assert.strictEqual(templateList.length > 0, true);
    assert.strictEqual(templateList.some(t => t.id === 'node-application'), true);
    assert.strictEqual(templateList.some(t => t.id === 'python-application'), true);
    assert.strictEqual(templateList.some(t => t.id === 'docker-application'), true);
  });

  describe('Template Retrieval', () => {
    test('should get template by name', () => {
      const nodeTemplate = templates.getTemplate('node-application');
      
      assert.strictEqual(nodeTemplate.name, 'Node.js Application');
      assert.strictEqual(nodeTemplate.jobs.hasOwnProperty('test'), true);
      assert.strictEqual(Array.isArray(nodeTemplate.triggers), true);
    });

    test('should return undefined for non-existent template', () => {
      const template = templates.getTemplate('non-existent');
      assert.strictEqual(template, undefined);
    });
  });

  describe('Template Listing', () => {
    test('should list all templates with metadata', () => {
      const list = templates.listTemplates();
      
      assert.strictEqual(Array.isArray(list), true);
      assert.strictEqual(list.length >= 6, true);
      
      const nodeTemplate = list.find(t => t.id === 'node-application');
      assert.strictEqual(nodeTemplate.name, 'Node.js Application');
      assert.strictEqual(typeof nodeTemplate.description, 'string');
    });
  });

  describe('Workflow Generation', () => {
    test('should generate YAML from template', () => {
      const yaml = templates.generateWorkflow('node-application');
      
      assert.strictEqual(yaml.includes('name: Node.js Application'), true);
      assert.strictEqual(yaml.includes('on:'), true);
      assert.strictEqual(yaml.includes('jobs:'), true);
      assert.strictEqual(yaml.includes('test:'), true);
      assert.strictEqual(yaml.includes('steps:'), true);
    });

    test('should apply customizations to generated workflow', () => {
      const customization = {
        name: 'Custom Node App CI',
        triggers: ['workflow_dispatch']
      };
      
      const yaml = templates.generateWorkflow('node-application', customization);
      
      assert.strictEqual(yaml.includes('name: Custom Node App CI'), true);
      assert.strictEqual(yaml.includes('workflow_dispatch:'), true);
    });

    test('should merge custom jobs', () => {
      const customization = {
        jobs: {
          'custom-job': {
            name: 'Custom Job',
            'runs-on': 'ubuntu-latest',
            steps: [
              { name: 'Custom step', run: 'echo "Custom"' }
            ]
          }
        }
      };
      
      const yaml = templates.generateWorkflow('node-application', customization);
      
      assert.strictEqual(yaml.includes('custom-job:'), true);
      assert.strictEqual(yaml.includes('Custom Job'), true);
    });

    test('should throw error for non-existent template', () => {
      assert.throws(
        () => templates.generateWorkflow('non-existent'),
        { message: "Template 'non-existent' not found" }
      );
    });
  });

  describe('Custom Template Creation', () => {
    test('should create custom template', () => {
      const customTemplate = {
        name: 'Custom Template',
        description: 'A custom workflow template',
        triggers: ['push'],
        jobs: {
          build: {
            name: 'Build',
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout@v4' }
            ]
          }
        }
      };
      
      const result = templates.createCustomTemplate('custom-workflow', customTemplate);
      
      assert.deepStrictEqual(result, customTemplate);
      assert.strictEqual(templates.getTemplate('custom-workflow').name, 'Custom Template');
    });

    test('should throw error if template already exists', () => {
      const template = {
        name: 'Duplicate',
        jobs: { test: {} }
      };
      
      templates.createCustomTemplate('duplicate', template);
      
      assert.throws(
        () => templates.createCustomTemplate('duplicate', template),
        { message: "Template 'duplicate' already exists" }
      );
    });

    test('should validate template structure', () => {
      assert.throws(
        () => templates.createCustomTemplate('invalid', { description: 'No name or jobs' }),
        { message: 'Template must have name and jobs' }
      );
    });
  });

  describe('Template Combination', () => {
    test('should combine multiple templates', () => {
      const combined = templates.combineTemplates(
        ['node-application', 'security-scanning'],
        { name: 'Full CI/CD Pipeline' }
      );
      
      assert.strictEqual(combined.name, 'Full CI/CD Pipeline');
      assert.strictEqual(Object.keys(combined.jobs).includes('test'), true);
      assert.strictEqual(Object.keys(combined.jobs).includes('dependency-scan'), true);
    });

    test('should prefix job names to avoid conflicts', () => {
      const combined = templates.combineTemplates(
        ['node-application', 'python-application'],
        { prefixJobs: true }
      );
      
      assert.strictEqual(Object.keys(combined.jobs).includes('node-application_test'), true);
      assert.strictEqual(Object.keys(combined.jobs).includes('python-application_test'), true);
    });

    test('should merge triggers from all templates', () => {
      const combined = templates.combineTemplates(
        ['release-automation', 'security-scanning']
      );
      
      assert.strictEqual(combined.triggers.hasOwnProperty('workflow_dispatch'), true);
      assert.strictEqual(combined.triggers.hasOwnProperty('schedule'), true);
    });

    test('should throw error for non-existent template in combination', () => {
      assert.throws(
        () => templates.combineTemplates(['node-application', 'non-existent']),
        { message: "Template 'non-existent' not found" }
      );
    });
  });

  describe('YAML Generation', () => {
    test('should generate valid YAML for complex workflows', () => {
      const yaml = templates.generateWorkflow('docker-application');
      
      // Check for Docker-specific content
      assert.strictEqual(yaml.includes('docker/setup-qemu-action'), true);
      assert.strictEqual(yaml.includes('docker/build-push-action'), true);
      assert.strictEqual(yaml.includes('platforms: linux/amd64,linux/arm64'), true);
    });

    test('should handle multi-line strings in YAML', () => {
      const yaml = templates.generateWorkflow('python-application');
      
      // Check for multi-line run commands
      assert.strictEqual(yaml.includes('run: |'), true);
      assert.strictEqual(yaml.includes('pip install --upgrade pip'), true);
    });

    test('should format workflow dispatch inputs correctly', () => {
      const yaml = templates.generateWorkflow('release-automation');
      
      assert.strictEqual(yaml.includes('workflow_dispatch:'), true);
      assert.strictEqual(yaml.includes('inputs:'), true);
      assert.strictEqual(yaml.includes('version:'), true);
      assert.strictEqual(yaml.includes('description: Release version'), true);
    });
  });

  describe('Template Types', () => {
    test('should have node application template with correct structure', () => {
      const template = templates.getTemplate('node-application');
      
      assert.strictEqual(template.jobs.test.strategy.matrix['node-version'].length >= 3, true);
      assert.strictEqual(template.jobs['security-scan'] !== undefined, true);
    });

    test('should have python application template with correct structure', () => {
      const template = templates.getTemplate('python-application');
      
      assert.strictEqual(template.jobs.test.strategy.matrix['python-version'].length >= 4, true);
      assert.strictEqual(
        template.jobs.test.steps.some(s => s.name === 'Lint with flake8'),
        true
      );
    });

    test('should have cross-repo sync template', () => {
      const template = templates.getTemplate('cross-repo-sync');
      
      assert.strictEqual(template.triggers.workflow_dispatch.inputs.hasOwnProperty('source_repo'), true);
      assert.strictEqual(template.triggers.workflow_dispatch.inputs.hasOwnProperty('target_repos'), true);
      assert.strictEqual(template.triggers.workflow_dispatch.inputs.hasOwnProperty('sync_type'), true);
    });
  });
});