import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { WorkflowOrchestrator } from '../../core/workflow-orchestrator.js';

describe('WorkflowOrchestrator', () => {
  let orchestrator;
  let mockGitHub;

  beforeEach(() => {
    // Mock GitHub API
    mockGitHub = {
      rest: {
        git: {
          getRef: () => Promise.resolve({
            data: {
              object: { sha: 'abc123' }
            }
          }),
          createRef: () => Promise.resolve({
            data: {
              object: { sha: 'def456' },
              ref: 'refs/heads/test-branch'
            }
          })
        },
        pulls: {
          create: () => Promise.resolve({
            data: {
              number: 123,
              html_url: 'https://github.com/test/repo/pull/123'
            }
          })
        },
        issues: {
          createComment: () => Promise.resolve({}),
          addLabels: () => Promise.resolve({})
        },
        repos: {
          compareCommits: () => Promise.resolve({
            data: {
              files: [
                { filename: 'test.js', status: 'modified', changes: 10 }
              ],
              ahead_by: 5,
              behind_by: 0,
              total_commits: 5
            }
          })
        }
      }
    };

    orchestrator = new WorkflowOrchestrator({
      github: mockGitHub,
      enableSmartBranching: true,
      enableAutoPR: true,
      enableConflictDetection: true
    });
  });

  test('should initialize with default options', () => {
    const defaultOrchestrator = new WorkflowOrchestrator({
      github: mockGitHub
    });

    assert.strictEqual(defaultOrchestrator.options.enableSmartBranching, true);
    assert.strictEqual(defaultOrchestrator.options.enableAutoPR, true);
    assert.strictEqual(defaultOrchestrator.options.enableCrossRepoSync, true);
    assert.strictEqual(defaultOrchestrator.options.enableConflictDetection, true);
  });

  describe('Smart Branch Creation', () => {
    test('should create feature branch for feature issue', async () => {
      const issue = {
        number: 42,
        title: 'Add new feature',
        labels: [{ name: 'enhancement' }],
        html_url: 'https://github.com/test/repo/issues/42'
      };

      const result = await orchestrator.createSmartBranch(issue, {
        owner: 'test',
        repo: 'repo',
        applyProtection: false,
        createPR: false
      });

      assert.strictEqual(result.type, 'feature');
      assert.strictEqual(result.name, 'feature/DEVFLOW-42-add-new-feature');
      assert.strictEqual(result.issue.number, 42);
      assert.strictEqual(orchestrator.metrics.branchesCreated, 1);
    });

    test('should create bugfix branch for bug issue', async () => {
      const issue = {
        number: 43,
        title: 'Fix critical bug',
        labels: [{ name: 'bug' }],
        html_url: 'https://github.com/test/repo/issues/43'
      };

      const result = await orchestrator.createSmartBranch(issue, {
        owner: 'test',
        repo: 'repo',
        applyProtection: false,
        createPR: false
      });

      assert.strictEqual(result.type, 'bugfix');
      assert.strictEqual(result.name, 'bugfix/DEVFLOW-43-fix-critical-bug');
    });

    test('should create hotfix branch for critical issue', async () => {
      const issue = {
        number: 44,
        title: 'Emergency fix',
        labels: [{ name: 'critical' }],
        html_url: 'https://github.com/test/repo/issues/44'
      };

      const result = await orchestrator.createSmartBranch(issue, {
        owner: 'test',
        repo: 'repo',
        applyProtection: false,
        createPR: false
      });

      assert.strictEqual(result.type, 'hotfix');
      assert.strictEqual(result.name, 'hotfix/DEVFLOW-44-emergency-fix');
    });

    test('should handle branch already exists error', async () => {
      // Mock branch already exists
      mockGitHub.rest.git.createRef = () => Promise.reject({
        status: 422,
        message: 'Reference already exists'
      });

      const issue = {
        number: 45,
        title: 'Existing branch',
        labels: [],
        html_url: 'https://github.com/test/repo/issues/45'
      };

      const result = await orchestrator.createSmartBranch(issue, {
        owner: 'test',
        repo: 'repo',
        applyProtection: false,
        createPR: false
      });

      assert.strictEqual(result.result.exists, true);
    });
  });

  describe('Automated PR Creation', () => {
    test('should create PR with proper linking', async () => {
      const branchData = {
        name: 'feature/DEVFLOW-46-test',
        type: 'feature',
        issue: {
          number: 46,
          title: 'Test feature',
          url: 'https://github.com/test/repo/issues/46',
          labels: [{ name: 'enhancement' }]
        },
        strategy: {
          baseRef: 'main',
          autoMerge: false
        }
      };

      const result = await orchestrator.createAutomatedPR(branchData, {
        owner: 'test',
        repo: 'repo'
      });

      assert.strictEqual(result.number, 123);
      assert.strictEqual(result.branch, 'feature/DEVFLOW-46-test');
      assert.strictEqual(result.autoMerge, false);
      assert.strictEqual(orchestrator.metrics.prsCreated, 1);
    });
  });

  describe('Conflict Detection', () => {
    test('should detect potential conflicts', async () => {
      const branch = { name: 'feature/test' };
      const targetBranch = 'main';

      const result = await orchestrator.detectConflicts(branch, targetBranch, {
        owner: 'test',
        repo: 'repo'
      });

      assert.strictEqual(result.hasConflicts, false);
      assert.strictEqual(result.comparison.ahead, 5);
      assert.strictEqual(result.comparison.behind, 0);
    });

    test('should identify critical files', async () => {
      // Mock critical file changes
      mockGitHub.rest.repos.compareCommits = () => Promise.resolve({
        data: {
          files: [
            { filename: 'package.json', status: 'modified', changes: 100 },
            { filename: '.github/workflows/ci.yml', status: 'modified', changes: 50 }
          ],
          ahead_by: 3,
          behind_by: 0,
          total_commits: 3
        }
      });

      const branch = { name: 'feature/critical-changes' };
      const targetBranch = 'main';

      const result = await orchestrator.detectConflicts(branch, targetBranch, {
        owner: 'test',
        repo: 'repo'
      });

      assert.strictEqual(result.conflicts.length, 2);
      assert.strictEqual(result.hasConflicts, true);
      assert.strictEqual(orchestrator.metrics.conflictsDetected, 1);
    });
  });

  describe('Cross-Repository Workflow', () => {
    test('should orchestrate workflow across repos', async () => {
      const workflow = {
        id: 'test-workflow',
        repositories: [
          { name: 'repo1', owner: 'test' },
          { name: 'repo2', owner: 'test' }
        ],
        steps: [
          {
            name: 'Create branch',
            type: 'create-branch',
            required: true,
            config: {
              branchName: 'workflow-test',
              baseBranch: 'main'
            }
          }
        ]
      };

      const result = await orchestrator.orchestrateCrossRepoWorkflow(workflow);

      assert.strictEqual(result.workflowId, 'test-workflow');
      assert.strictEqual(result.success, true);
      assert.strictEqual(Object.keys(result.repositories).length, 2);
      assert.strictEqual(orchestrator.metrics.crossRepoOperations, 1);
      assert.strictEqual(orchestrator.metrics.workflowsExecuted, 1);
    });
  });

  describe('Metrics', () => {
    test('should track metrics correctly', async () => {
      const issue = {
        number: 47,
        title: 'Metrics test',
        labels: [],
        html_url: 'https://github.com/test/repo/issues/47'
      };

      // Create branch
      await orchestrator.createSmartBranch(issue, {
        owner: 'test',
        repo: 'repo',
        createPR: false
      });

      // Create PR
      const branchData = {
        name: 'feature/DEVFLOW-47-metrics-test',
        type: 'feature',
        issue: issue,
        strategy: { baseRef: 'main', autoMerge: false }
      };
      
      await orchestrator.createAutomatedPR(branchData, {
        owner: 'test',
        repo: 'repo'
      });

      const metrics = orchestrator.getMetrics();
      assert.strictEqual(metrics.branchesCreated, 1);
      assert.strictEqual(metrics.prsCreated, 1);
      assert.strictEqual(metrics.workflowsExecuted, 0);
    });

    test('should reset metrics', () => {
      orchestrator.metrics.branchesCreated = 5;
      orchestrator.metrics.prsCreated = 3;
      
      orchestrator.resetMetrics();
      
      const metrics = orchestrator.getMetrics();
      assert.strictEqual(metrics.branchesCreated, 0);
      assert.strictEqual(metrics.prsCreated, 0);
      assert.strictEqual(metrics.conflictsDetected, 0);
    });
  });
});