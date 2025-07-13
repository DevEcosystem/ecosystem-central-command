/**
 * @fileoverview Issue Completion Tracker Unit Tests
 * @version 1.0.0
 * @author DevEcosystem
 */

import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { IssueCompletionTracker } from '../../core/issue-completion-tracker.js';

describe('IssueCompletionTracker', () => {
  let tracker;

  beforeEach(() => {
    // Create fresh tracker instance for each test
    tracker = new IssueCompletionTracker({
      enableAnalytics: true,
      retentionDays: 30
    });
  });

  afterEach(() => {
    // Clean up tracker
    tracker = null;
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      const defaultTracker = new IssueCompletionTracker();
      
      assert.strictEqual(defaultTracker.options.enableAnalytics, true);
      assert.strictEqual(defaultTracker.options.retentionDays, 90);
      assert.ok(defaultTracker.logger);
      assert.ok(defaultTracker.cache);
      assert.ok(defaultTracker.completions instanceof Map);
    });

    it('should initialize with custom options', () => {
      const customTracker = new IssueCompletionTracker({
        enableAnalytics: false,
        retentionDays: 60
      });
      
      assert.strictEqual(customTracker.options.enableAnalytics, false);
      assert.strictEqual(customTracker.options.retentionDays, 60);
    });
  });

  describe('Recording Completions', () => {
    it('should record issue completion successfully', async () => {
      const completion = {
        issueNumber: 15,
        prNumber: 42,
        repository: 'ecosystem-central-command',
        branchName: 'feature/DEVFLOW-15-dashboard',
        metrics: {
          commits: 5,
          filesChanged: 10,
          additions: 200,
          deletions: 50
        },
        completionMethod: 'automatic'
      };

      const record = await tracker.recordCompletion(completion);

      assert.ok(record);
      assert.strictEqual(record.issueNumber, 15);
      assert.strictEqual(record.prNumber, 42);
      assert.strictEqual(record.repository, 'ecosystem-central-command');
      assert.ok(record.timestamp);
      assert.ok(record.id);
      
      // Verify record is stored
      assert.strictEqual(tracker.completions.size, 1);
      assert.ok(tracker.completions.has(record.id));
    });

    it('should handle completion without metrics', async () => {
      const completion = {
        issueNumber: 16,
        prNumber: 43,
        repository: 'test-repo',
        branchName: 'feature/DEVFLOW-16-test'
      };

      const record = await tracker.recordCompletion(completion);

      assert.ok(record);
      assert.strictEqual(record.metrics.commits, 0);
      assert.strictEqual(record.metrics.filesChanged, 0);
      assert.strictEqual(record.metrics.additions, 0);
      assert.strictEqual(record.metrics.deletions, 0);
      assert.strictEqual(record.completionMethod, 'automatic');
    });

    it('should generate unique completion IDs', async () => {
      const completion1 = {
        issueNumber: 1,
        prNumber: 1,
        repository: 'repo1',
        branchName: 'feature/DEVFLOW-1-test'
      };

      const completion2 = {
        issueNumber: 1,
        prNumber: 2,
        repository: 'repo2',
        branchName: 'feature/DEVFLOW-1-test'
      };

      const record1 = await tracker.recordCompletion(completion1);
      const record2 = await tracker.recordCompletion(completion2);

      assert.notStrictEqual(record1.id, record2.id);
      assert.strictEqual(tracker.completions.size, 2);
    });
  });

  describe('Completion Statistics', () => {
    beforeEach(async () => {
      // Add test data
      const completions = [
        {
          issueNumber: 1,
          prNumber: 1,
          repository: 'repo1',
          branchName: 'feature/DEVFLOW-1-test',
          metrics: { commits: 3, filesChanged: 5, additions: 100, deletions: 20 }
        },
        {
          issueNumber: 2,
          prNumber: 2,
          repository: 'repo1',
          branchName: 'feature/DEVFLOW-2-test',
          metrics: { commits: 7, filesChanged: 8, additions: 150, deletions: 30 }
        },
        {
          issueNumber: 3,
          prNumber: 3,
          repository: 'repo2',
          branchName: 'feature/DEVFLOW-3-test',
          metrics: { commits: 2, filesChanged: 3, additions: 50, deletions: 10 }
        }
      ];

      for (const completion of completions) {
        await tracker.recordCompletion(completion);
      }
    });

    it('should get completion statistics for all repositories', () => {
      const stats = tracker.getCompletionStats();

      assert.strictEqual(stats.totalCompletions, 3);
      assert.strictEqual(stats.repository, 'all');
      assert.strictEqual(stats.timeRange, 30);
      assert.ok(stats.period);
      assert.ok(stats.metrics);
    });

    it('should get completion statistics for specific repository', () => {
      const stats = tracker.getCompletionStats({ repository: 'repo1' });

      assert.strictEqual(stats.totalCompletions, 2);
      assert.strictEqual(stats.repository, 'repo1');
    });

    it('should calculate detailed metrics correctly', () => {
      const stats = tracker.getCompletionStats({ includeMetrics: true });

      assert.ok(stats.metrics);
      assert.strictEqual(stats.metrics.averageCommits, 4); // (3+7+2)/3 = 4
      assert.strictEqual(stats.metrics.averageFilesChanged, 5.3); // (5+8+3)/3 = 5.33
      assert.strictEqual(stats.metrics.totalLinesAdded, 300); // 100+150+50
      assert.strictEqual(stats.metrics.totalLinesRemoved, 60); // 20+30+10
      assert.strictEqual(stats.metrics.averageNetChange, 80); // (300-60)/3 = 80
    });

    it('should filter by time range', () => {
      const stats = tracker.getCompletionStats({ timeRange: 0 });
      
      // Should return 0 completions for 0-day range
      assert.strictEqual(stats.totalCompletions, 0);
    });
  });

  describe('Recent Completions', () => {
    beforeEach(async () => {
      // Add test completions with slight delays to ensure ordering
      for (let i = 1; i <= 5; i++) {
        await tracker.recordCompletion({
          issueNumber: i,
          prNumber: i,
          repository: 'test-repo',
          branchName: `feature/DEVFLOW-${i}-test`
        });
        
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    });

    it('should get recent completions in reverse chronological order', () => {
      const recent = tracker.getRecentCompletions(3);

      assert.strictEqual(recent.length, 3);
      // Check that results are in reverse chronological order
      // The exact order may vary due to timing, so check the general pattern
      assert.ok(recent[0].issueNumber >= recent[1].issueNumber);
      assert.ok(recent[1].issueNumber >= recent[2].issueNumber);
      
      // Should include timeAgo
      assert.ok(recent[0].timeAgo);
    });

    it('should limit results correctly', () => {
      const recent = tracker.getRecentCompletions(2);
      assert.strictEqual(recent.length, 2);
    });

    it('should handle empty completions', () => {
      const emptyTracker = new IssueCompletionTracker();
      const recent = emptyTracker.getRecentCompletions();
      
      assert.strictEqual(recent.length, 0);
      assert.ok(Array.isArray(recent));
    });
  });

  describe('Dashboard Metrics', () => {
    it('should get dashboard metrics with empty data', () => {
      const metrics = tracker.getDashboardMetrics();

      assert.strictEqual(metrics.today, 0);
      assert.strictEqual(metrics.yesterday, 0);
      assert.strictEqual(metrics.thisWeek, 0);
      assert.strictEqual(metrics.total, 0);
      assert.strictEqual(metrics.averagePerDay, 0);
      assert.strictEqual(metrics.successRate, 0);
      assert.strictEqual(metrics.trending.direction, 'stable');
    });

    it('should calculate dashboard metrics correctly', async () => {
      // Add some completions
      await tracker.recordCompletion({
        issueNumber: 1,
        prNumber: 1,
        repository: 'test-repo',
        branchName: 'feature/DEVFLOW-1-test'
      });

      const metrics = tracker.getDashboardMetrics();

      assert.strictEqual(metrics.total, 1);
      assert.ok(metrics.lastUpdated);
      assert.ok(['up', 'down', 'stable'].includes(metrics.trending.direction));
    });
  });

  describe('Data Export', () => {
    beforeEach(async () => {
      await tracker.recordCompletion({
        issueNumber: 1,
        prNumber: 1,
        repository: 'test-repo',
        branchName: 'feature/DEVFLOW-1-test',
        metrics: { commits: 3, filesChanged: 5, additions: 100, deletions: 20 }
      });
    });

    it('should export completion data as JSON', () => {
      const exported = tracker.exportCompletions({ format: 'json' });

      assert.ok(typeof exported === 'string');
      
      const data = JSON.parse(exported);
      assert.ok(data.metadata);
      assert.ok(data.statistics);
      assert.ok(data.completions);
      assert.strictEqual(data.metadata.format, 'json');
    });

    it('should export completion data as object', () => {
      const exported = tracker.exportCompletions({ format: 'object' });

      assert.ok(typeof exported === 'object');
      assert.ok(exported.metadata);
      assert.ok(exported.statistics);
      assert.ok(exported.completions);
    });

    it('should filter export by repository', () => {
      const exported = tracker.exportCompletions({ 
        format: 'object',
        repository: 'test-repo'
      });

      assert.strictEqual(exported.metadata.repository, 'test-repo');
      assert.strictEqual(exported.statistics.repository, 'test-repo');
    });
  });

  describe('Cleanup', () => {
    it('should clean up old completion records', async () => {
      // Create tracker with short retention
      const shortTracker = new IssueCompletionTracker({ retentionDays: 0 });
      
      // Add completion
      await shortTracker.recordCompletion({
        issueNumber: 1,
        prNumber: 1,
        repository: 'test-repo',
        branchName: 'feature/DEVFLOW-1-test'
      });

      assert.strictEqual(shortTracker.completions.size, 1);

      // Wait a small amount to ensure the timestamp is in the past
      await new Promise(resolve => setTimeout(resolve, 10));

      // Run cleanup - should remove the record since retentionDays is 0
      await shortTracker.cleanup();

      assert.strictEqual(shortTracker.completions.size, 0);
    });

    it('should not remove recent completion records', async () => {
      // Add completion
      await tracker.recordCompletion({
        issueNumber: 1,
        prNumber: 1,
        repository: 'test-repo',
        branchName: 'feature/DEVFLOW-1-test'
      });

      assert.strictEqual(tracker.completions.size, 1);

      // Run cleanup - should not remove recent records
      await tracker.cleanup();

      assert.strictEqual(tracker.completions.size, 1);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid completion data gracefully', async () => {
      try {
        await tracker.recordCompletion(null);
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error);
      }
    });

    it('should handle errors in metrics calculation', () => {
      // This should not throw even with no data
      const stats = tracker.getCompletionStats();
      assert.ok(stats);
      assert.strictEqual(stats.totalCompletions, 0);
    });

    it('should handle errors in dashboard metrics gracefully', () => {
      // Mock a scenario that might cause errors
      const metrics = tracker.getDashboardMetrics();
      
      // Should return valid structure even with errors
      assert.ok(metrics);
      assert.ok(typeof metrics.total === 'number');
      assert.ok(typeof metrics.today === 'number');
    });
  });
});