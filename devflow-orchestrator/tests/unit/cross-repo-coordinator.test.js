import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { CrossRepoCoordinator } from '../../core/cross-repo-coordinator.js';

describe('CrossRepoCoordinator', () => {
  let coordinator;
  let mockGitHub;

  beforeEach(() => {
    // Mock GitHub API
    mockGitHub = {
      rest: {
        repos: {
          get: ({ owner, repo }) => Promise.resolve({
            data: {
              id: 123456,
              name: repo,
              owner: { login: owner },
              default_branch: 'main'
            }
          }),
          compareCommits: () => Promise.resolve({
            data: {
              files: [],
              ahead_by: 0,
              behind_by: 0
            }
          }),
          getContent: ({ path }) => {
            if (path === 'package.json') {
              return Promise.resolve({
                data: {
                  content: Buffer.from(JSON.stringify({
                    name: 'test-package',
                    version: '1.0.0'
                  })).toString('base64'),
                  sha: 'abc123'
                }
              });
            }
            throw new Error('File not found');
          },
          createOrUpdateFileContents: () => Promise.resolve({
            data: {
              commit: { sha: 'def456' }
            }
          }),
          listTags: () => Promise.resolve({
            data: [
              { name: 'v1.0.0', commit: { sha: 'tag123' } },
              { name: 'v0.9.0', commit: { sha: 'tag456' } }
            ]
          }),
          createRelease: () => Promise.resolve({
            data: {
              id: 789,
              html_url: 'https://github.com/test/repo/releases/tag/v1.0.0',
              tag_name: 'v1.0.0'
            }
          })
        },
        git: {
          getRef: ({ ref }) => {
            if (ref.includes('exists')) {
              return Promise.resolve({
                data: { object: { sha: 'exists123' } }
              });
            }
            throw new Error('Reference not found');
          },
          createRef: () => Promise.resolve({
            data: {
              object: { sha: 'new123' },
              ref: 'refs/heads/test-branch'
            }
          }),
          updateRef: () => Promise.resolve({
            data: {
              object: { sha: 'updated123' }
            }
          }),
          deleteRef: () => Promise.resolve({})
        },
        pulls: {
          create: () => Promise.resolve({
            data: {
              number: 456,
              html_url: 'https://github.com/test/repo/pull/456'
            }
          })
        },
        issues: {
          addLabels: () => Promise.resolve({}),
          createComment: () => Promise.resolve({})
        },
        actions: {
          createWorkflowDispatch: () => Promise.resolve({})
        }
      }
    };

    coordinator = new CrossRepoCoordinator({
      github: mockGitHub,
      enableDependencyTracking: true,
      enableAutoSync: false,
      enableConflictPrevention: true
    });
  });

  test('should initialize with default options', () => {
    const defaultCoordinator = new CrossRepoCoordinator({
      github: mockGitHub
    });

    assert.strictEqual(defaultCoordinator.options.enableDependencyTracking, true);
    assert.strictEqual(defaultCoordinator.options.enableAutoSync, true);
    assert.strictEqual(defaultCoordinator.options.enableConflictPrevention, true);
    assert.strictEqual(defaultCoordinator.options.syncInterval, 300000);
  });

  describe('Repository Registration', () => {
    test('should register repository successfully', async () => {
      const repo = {
        owner: 'test',
        name: 'repo1',
        role: 'critical',
        dependencies: ['test/repo2']
      };

      const result = await coordinator.registerRepository(repo);

      assert.strictEqual(result.id, 'test/repo1');
      assert.strictEqual(result.role, 'critical');
      assert.deepStrictEqual(result.dependencies, ['test/repo2']);
      assert.strictEqual(coordinator.repositories.has('test/repo1'), true);
    });

    test('should track dependencies when enabled', async () => {
      const repo1 = {
        owner: 'test',
        name: 'repo1',
        dependencies: ['test/base']
      };

      await coordinator.registerRepository(repo1);

      assert.strictEqual(coordinator.dependencies.has('test/base'), true);
      assert.strictEqual(coordinator.dependencies.get('test/base').has('test/repo1'), true);
    });
  });

  describe('Coordinated Branch Creation', () => {
    beforeEach(async () => {
      // Register test repositories
      await coordinator.registerRepository({
        owner: 'test',
        name: 'repo1',
        role: 'standard'
      });
      await coordinator.registerRepository({
        owner: 'test',
        name: 'repo2',
        role: 'critical'
      });
    });

    test('should create branches across repositories', async () => {
      const branchConfig = {
        name: 'feature/test-branch',
        baseBranch: 'main'
      };

      const result = await coordinator.createCoordinatedBranch(branchConfig);

      assert.strictEqual(result.branchName, 'feature/test-branch');
      assert.strictEqual(result.created.length, 2);
      assert.strictEqual(result.failed.length, 0);
      assert.strictEqual(result.skipped.length, 0);
    });

    test('should skip existing branches', async () => {
      const branchConfig = {
        name: 'feature/exists-branch',
        baseBranch: 'main'
      };

      // Mock branch already exists
      mockGitHub.rest.git.createRef = () => Promise.reject({
        message: 'Reference already exists'
      });

      const result = await coordinator.createCoordinatedBranch(branchConfig);

      assert.strictEqual(result.skipped.length, 2);
      assert.strictEqual(result.skipped[0].reason, 'Branch already exists');
    });

    test('should rollback on critical repository failure', async () => {
      const branchConfig = {
        name: 'feature/fail-branch',
        baseBranch: 'main',
        continueOnError: false
      };

      // Mock failure on second repo
      let callCount = 0;
      mockGitHub.rest.git.createRef = () => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error('API error'));
        }
        return Promise.resolve({
          data: { object: { sha: 'created123' } }
        });
      };

      await assert.rejects(
        coordinator.createCoordinatedBranch(branchConfig),
        { message: 'API error' }
      );
    });
  });

  describe('Coordinated PR Creation', () => {
    test('should create PRs across repositories', async () => {
      const prConfig = {
        title: 'Test PR',
        description: 'Test description',
        labels: ['enhancement'],
        crossLink: true
      };

      const branches = [
        { repository: 'test/repo1', branch: 'feature/test' },
        { repository: 'test/repo2', branch: 'feature/test' }
      ];

      // Register repos
      await coordinator.registerRepository({ owner: 'test', name: 'repo1' });
      await coordinator.registerRepository({ owner: 'test', name: 'repo2' });

      const result = await coordinator.createCoordinatedPRs(prConfig, branches);

      assert.strictEqual(result.title, 'Test PR');
      assert.strictEqual(result.created.length, 2);
      assert.strictEqual(result.created[0].number, 456);
      assert.strictEqual(Object.keys(result.linkedPRs).length, 2);
    });
  });

  describe('Repository Synchronization', () => {
    beforeEach(async () => {
      await coordinator.registerRepository({
        owner: 'test',
        name: 'source-repo',
        role: 'primary'
      });
      await coordinator.registerRepository({
        owner: 'test',
        name: 'target-repo',
        role: 'secondary'
      });
    });

    test('should synchronize files between repositories', async () => {
      const syncConfig = {
        type: 'files',
        source: 'test/source-repo',
        files: ['README.md', 'LICENSE']
      };

      const result = await coordinator.synchronizeRepositories(syncConfig);

      assert.strictEqual(result.type, 'files');
      assert.strictEqual(result.synchronized.length, 1);
      assert.strictEqual(result.failed.length, 0);
    });

    test('should handle synchronization failures', async () => {
      const syncConfig = {
        type: 'unknown',
        source: 'test/source-repo'
      };

      const result = await coordinator.synchronizeRepositories(syncConfig);

      assert.strictEqual(result.failed.length, 1);
      assert.strictEqual(result.failed[0].error, 'Unknown sync type: unknown');
    });
  });

  describe('Cross-Repository Release', () => {
    beforeEach(async () => {
      await coordinator.registerRepository({
        owner: 'test',
        name: 'app1',
        role: 'application'
      });
      await coordinator.registerRepository({
        owner: 'test',
        name: 'app2',
        role: 'application'
      });
    });

    test('should orchestrate release across repositories', async () => {
      const releaseConfig = {
        version: '2.0.0',
        baseBranch: 'develop',
        releaseNotes: 'Major release',
        draft: false
      };

      const result = await coordinator.orchestrateRelease(releaseConfig);

      assert.strictEqual(result.version, '2.0.0');
      assert.strictEqual(result.releases.length, 2);
      assert.strictEqual(result.releases[0].tagName, 'v2.0.0');
    });

    test('should rollback on release failure', async () => {
      const releaseConfig = {
        version: '2.0.1',
        baseBranch: 'develop'
      };

      // Mock release creation failure
      mockGitHub.rest.repos.createRelease = () => 
        Promise.reject(new Error('Release failed'));

      await assert.rejects(
        coordinator.orchestrateRelease(releaseConfig),
        { message: 'Release failed' }
      );
    });
  });

  describe('Status and Management', () => {
    test('should return coordinator status', async () => {
      await coordinator.registerRepository({
        owner: 'test',
        name: 'repo1',
        dependencies: ['test/base']
      });

      const status = coordinator.getStatus();

      assert.strictEqual(status.repositories.length, 1);
      assert.strictEqual(status.repositories[0].id, 'test/repo1');
      assert.strictEqual(status.dependencies.length, 1);
      assert.strictEqual(status.dependencies[0].dependency, 'test/base');
      assert.strictEqual(status.activeTasks.length, 0);
    });

    test('should cleanup resources', () => {
      coordinator.repositories.set('test/repo1', { id: 'test/repo1' });
      coordinator.dependencies.set('test/base', new Set(['test/repo1']));
      
      coordinator.cleanup();

      assert.strictEqual(coordinator.repositories.size, 0);
      assert.strictEqual(coordinator.dependencies.size, 0);
      assert.strictEqual(coordinator.activeTasks.size, 0);
    });
  });
});