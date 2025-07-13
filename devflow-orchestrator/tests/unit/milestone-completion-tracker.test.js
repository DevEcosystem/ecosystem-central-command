import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { MilestoneCompletionTracker } from '../../core/milestone-completion-tracker.js';

describe('MilestoneCompletionTracker', () => {
  let tracker;
  let mockGitHub;
  let mockContext;

  beforeEach(() => {
    // Mock GitHub API
    mockGitHub = {
      rest: {
        issues: {
          listMilestones: () => Promise.resolve({ data: [] }),
          getMilestone: () => Promise.resolve({ 
            data: {
              number: 1,
              title: 'Test Milestone',
              state: 'open',
              open_issues: 0,
              closed_issues: 5,
              html_url: 'https://github.com/test/repo/milestone/1',
              created_at: '2025-01-01T00:00:00Z',
              updated_at: '2025-01-10T00:00:00Z',
              due_on: null
            }
          }),
          updateMilestone: () => Promise.resolve({}),
          create: () => Promise.resolve({
            data: { html_url: 'https://github.com/test/repo/issues/100' }
          }),
          listForRepo: () => Promise.resolve({ data: [] })
        }
      }
    };

    // Mock context
    mockContext = {
      repo: {
        owner: 'test-org',
        repo: 'test-repo'
      }
    };

    tracker = new MilestoneCompletionTracker({
      github: mockGitHub,
      context: mockContext,
      enableAnalytics: false, // Disable for testing
      enableAutoClose: true
    });
  });

  test('should initialize with default options', () => {
    const defaultTracker = new MilestoneCompletionTracker({
      github: mockGitHub,
      context: mockContext
    });

    assert.strictEqual(defaultTracker.options.enableAnalytics, true);
    assert.strictEqual(defaultTracker.options.enableAutoClose, true);
    assert.strictEqual(defaultTracker.options.retentionDays, 90);
  });

  test('should detect completed milestone', async () => {
    const result = await tracker.checkMilestoneCompletion(1);

    assert.strictEqual(result.metrics.isCompleted, true);
    assert.strictEqual(result.metrics.completionPercentage, 100);
    assert.strictEqual(result.metrics.openIssues, 0);
    assert.strictEqual(result.metrics.closedIssues, 5);
    assert.strictEqual(result.actions.autoCloseEligible, true);
  });

  test('should handle incomplete milestone', async () => {
    // Override mock for incomplete milestone
    mockGitHub.rest.issues.getMilestone = () => Promise.resolve({ 
      data: {
        number: 2,
        title: 'Incomplete Milestone',
        state: 'open',
        open_issues: 3,
        closed_issues: 2,
        html_url: 'https://github.com/test/repo/milestone/2',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z',
        due_on: null
      }
    });

    const result = await tracker.checkMilestoneCompletion(2);

    assert.strictEqual(result.metrics.isCompleted, false);
    assert.strictEqual(result.metrics.completionPercentage, 40);
    assert.strictEqual(result.metrics.openIssues, 3);
    assert.strictEqual(result.metrics.closedIssues, 2);
    assert.strictEqual(result.actions.autoCloseEligible, false);
  });

  test('should generate proper completion comment', () => {
    const completionData = {
      milestone: {
        title: 'Test Milestone',
        url: 'https://github.com/test/repo/milestone/1'
      },
      metrics: {
        totalIssues: 5,
        closedIssues: 5,
        completionPercentage: 100
      }
    };

    const comment = tracker.generateCompletionComment(completionData, 10);

    assert(comment.includes('🎉 Milestone Completion Report'));
    assert(comment.includes('Test Milestone'));
    assert(comment.includes('Total Issues**: 5'));
    assert(comment.includes('Completed Issues**: 5'));
    assert(comment.includes('Completion Rate**: 100%'));
    assert(comment.includes('Duration**: 10 days'));
  });

  test('should handle empty milestone', async () => {
    // Override mock for empty milestone
    mockGitHub.rest.issues.getMilestone = () => Promise.resolve({ 
      data: {
        number: 3,
        title: 'Empty Milestone',
        state: 'open',
        open_issues: 0,
        closed_issues: 0,
        html_url: 'https://github.com/test/repo/milestone/3',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z',
        due_on: null
      }
    });

    const result = await tracker.checkMilestoneCompletion(3);

    assert.strictEqual(result.metrics.isCompleted, false);
    assert.strictEqual(result.metrics.completionPercentage, 0);
    assert.strictEqual(result.metrics.totalIssues, 0);
    assert.strictEqual(result.actions.autoCloseEligible, false);
  });

  test('should handle API errors gracefully', async () => {
    // Override mock to throw error
    mockGitHub.rest.issues.getMilestone = () => Promise.reject(
      new Error('API Rate Limit Exceeded')
    );

    await assert.rejects(
      tracker.checkMilestoneCompletion(1),
      /API Rate Limit Exceeded/
    );
  });
});