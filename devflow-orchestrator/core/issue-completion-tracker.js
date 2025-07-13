/**
 * @fileoverview DevFlow Issue Completion Tracker
 * @version 1.0.0
 * @author DevEcosystem
 * 
 * Tracks and analyzes automatic issue completion workflows
 */

import { Logger } from '../utils/logger.js';
import { Cache } from '../utils/cache.js';

/**
 * Issue Completion Tracker
 * Manages analytics and monitoring for automatic issue completion workflows
 */
export class IssueCompletionTracker {
  constructor(options = {}) {
    this.options = {
      enableAnalytics: options.enableAnalytics !== false,
      retentionDays: options.retentionDays || 90,
      ...options
    };
    
    this.logger = new Logger('IssueCompletionTracker');
    this.cache = new Cache({ stdTTL: 3600 }); // 1 hour cache
    this.completions = new Map();
    this.metrics = {
      totalCompletions: 0,
      averageCompletionTime: 0,
      successRate: 0,
      lastUpdated: null
    };
  }

  /**
   * Record issue completion
   * @param {Object} completion - Completion data
   */
  async recordCompletion(completion) {
    try {
      const completionRecord = {
        id: `${completion.repository}-${completion.issueNumber}`,
        timestamp: new Date().toISOString(),
        issueNumber: completion.issueNumber,
        prNumber: completion.prNumber,
        repository: completion.repository,
        branchName: completion.branchName,
        metrics: {
          commits: completion.metrics?.commits || 0,
          filesChanged: completion.metrics?.filesChanged || 0,
          additions: completion.metrics?.additions || 0,
          deletions: completion.metrics?.deletions || 0
        },
        completionMethod: completion.completionMethod || 'automatic',
        workflow: completion.workflow || 'auto-issue-completion'
      };

      // Store completion record
      this.completions.set(completionRecord.id, completionRecord);
      
      // Update metrics
      await this._updateMetrics();
      
      // Cache recent completions
      this._cacheRecentCompletions();
      
      this.logger.info('Issue completion recorded', {
        issueNumber: completion.issueNumber,
        repository: completion.repository,
        completionId: completionRecord.id
      });

      return completionRecord;

    } catch (error) {
      this.logger.error('Failed to record completion', { 
        error: error.message,
        completion 
      });
      throw error;
    }
  }

  /**
   * Get completion statistics
   * @param {Object} options - Query options
   */
  getCompletionStats(options = {}) {
    const {
      repository,
      timeRange = 30, // days
      includeMetrics = true
    } = options;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeRange);

      let completions = Array.from(this.completions.values());

      // Filter by repository if specified
      if (repository) {
        completions = completions.filter(c => c.repository === repository);
      }

      // Filter by time range
      completions = completions.filter(c => 
        new Date(c.timestamp) >= cutoffDate
      );

      const stats = {
        totalCompletions: completions.length,
        timeRange: timeRange,
        repository: repository || 'all',
        period: {
          start: cutoffDate.toISOString(),
          end: new Date().toISOString()
        }
      };

      if (includeMetrics) {
        stats.metrics = this._calculateDetailedMetrics(completions);
      }

      return stats;

    } catch (error) {
      this.logger.error('Failed to get completion stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Get recent completions
   * @param {number} limit - Maximum number of completions to return
   */
  getRecentCompletions(limit = 10) {
    try {
      const completions = Array.from(this.completions.values())
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);

      return completions.map(completion => ({
        ...completion,
        timeAgo: this._getTimeAgo(completion.timestamp)
      }));

    } catch (error) {
      this.logger.error('Failed to get recent completions', { error: error.message });
      throw error;
    }
  }

  /**
   * Get completion metrics for dashboard
   */
  getDashboardMetrics() {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const thisWeek = new Date(today);
      thisWeek.setDate(thisWeek.getDate() - 7);

      const todayCompletions = this._getCompletionsInPeriod(today, today);
      const yesterdayCompletions = this._getCompletionsInPeriod(yesterday, yesterday);
      const weekCompletions = this._getCompletionsInPeriod(thisWeek, today);

      return {
        today: todayCompletions.length,
        yesterday: yesterdayCompletions.length,
        thisWeek: weekCompletions.length,
        total: this.completions.size,
        averagePerDay: this._calculateAveragePerDay(),
        successRate: this.metrics.successRate,
        lastUpdated: this.metrics.lastUpdated,
        trending: {
          direction: todayCompletions.length > yesterdayCompletions.length ? 'up' : 
                    todayCompletions.length < yesterdayCompletions.length ? 'down' : 'stable',
          change: Math.abs(todayCompletions.length - yesterdayCompletions.length)
        }
      };

    } catch (error) {
      this.logger.error('Failed to get dashboard metrics', { error: error.message });
      return {
        today: 0,
        yesterday: 0,
        thisWeek: 0,
        total: 0,
        averagePerDay: 0,
        successRate: 0,
        lastUpdated: null,
        trending: { direction: 'stable', change: 0 }
      };
    }
  }

  /**
   * Export completion data
   * @param {Object} options - Export options
   */
  exportCompletions(options = {}) {
    try {
      const {
        format = 'json',
        timeRange = 30,
        repository
      } = options;

      const stats = this.getCompletionStats({ repository, timeRange, includeMetrics: true });
      const completions = this.getRecentCompletions(1000);

      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          format: format,
          repository: repository || 'all',
          timeRange: timeRange
        },
        statistics: stats,
        completions: completions
      };

      return format === 'json' ? 
        JSON.stringify(exportData, null, 2) : 
        exportData;

    } catch (error) {
      this.logger.error('Failed to export completions', { error: error.message });
      throw error;
    }
  }

  /**
   * Clean up old completion records
   */
  async cleanup() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.options.retentionDays);

      let removedCount = 0;
      for (const [id, completion] of this.completions.entries()) {
        if (new Date(completion.timestamp) < cutoffDate) {
          this.completions.delete(id);
          removedCount++;
        }
      }

      if (removedCount > 0) {
        this.logger.info('Cleaned up old completion records', { 
          removedCount,
          retentionDays: this.options.retentionDays 
        });
        
        await this._updateMetrics();
      }

    } catch (error) {
      this.logger.error('Failed to cleanup completions', { error: error.message });
      throw error;
    }
  }

  /**
   * Update internal metrics
   * @private
   */
  async _updateMetrics() {
    try {
      const completions = Array.from(this.completions.values());
      
      this.metrics = {
        totalCompletions: completions.length,
        averageCompletionTime: this._calculateAverageCompletionTime(completions),
        successRate: this._calculateSuccessRate(completions),
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Failed to update metrics', { error: error.message });
    }
  }

  /**
   * Calculate detailed metrics
   * @private
   */
  _calculateDetailedMetrics(completions) {
    if (completions.length === 0) {
      return {
        averageCommits: 0,
        averageFilesChanged: 0,
        totalLinesAdded: 0,
        totalLinesRemoved: 0,
        averageNetChange: 0
      };
    }

    const totals = completions.reduce((acc, completion) => {
      acc.commits += completion.metrics.commits || 0;
      acc.filesChanged += completion.metrics.filesChanged || 0;
      acc.additions += completion.metrics.additions || 0;
      acc.deletions += completion.metrics.deletions || 0;
      return acc;
    }, { commits: 0, filesChanged: 0, additions: 0, deletions: 0 });

    return {
      averageCommits: Math.round(totals.commits / completions.length * 10) / 10,
      averageFilesChanged: Math.round(totals.filesChanged / completions.length * 10) / 10,
      totalLinesAdded: totals.additions,
      totalLinesRemoved: totals.deletions,
      averageNetChange: Math.round((totals.additions - totals.deletions) / completions.length)
    };
  }

  /**
   * Get completions in a specific period
   * @private
   */
  _getCompletionsInPeriod(startDate, endDate) {
    return Array.from(this.completions.values()).filter(completion => {
      const completionDate = new Date(completion.timestamp);
      return completionDate >= startDate && completionDate <= endDate;
    });
  }

  /**
   * Calculate average completions per day
   * @private
   */
  _calculateAveragePerDay() {
    if (this.completions.size === 0) return 0;

    const completions = Array.from(this.completions.values());
    const firstCompletion = completions.reduce((earliest, completion) => 
      new Date(completion.timestamp) < new Date(earliest.timestamp) ? completion : earliest
    );

    const daysSinceFirst = Math.max(1, 
      Math.ceil((new Date() - new Date(firstCompletion.timestamp)) / (1000 * 60 * 60 * 24))
    );

    return Math.round(this.completions.size / daysSinceFirst * 10) / 10;
  }

  /**
   * Calculate success rate
   * @private
   */
  _calculateSuccessRate(completions) {
    // For now, assume all recorded completions are successful
    // In Phase 2, we'll track failed completion attempts
    return completions.length > 0 ? 100 : 0;
  }

  /**
   * Calculate average completion time
   * @private
   */
  _calculateAverageCompletionTime(completions) {
    // This would require tracking issue creation time vs completion time
    // For Phase 1, we'll implement this as a placeholder
    return 0;
  }

  /**
   * Get human-readable time ago
   * @private
   */
  _getTimeAgo(timestamp) {
    const now = new Date();
    const completionTime = new Date(timestamp);
    const diffMs = now - completionTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  }

  /**
   * Cache recent completions for quick access
   * @private
   */
  _cacheRecentCompletions() {
    const recent = this.getRecentCompletions(50);
    this.cache.set('recent_completions', recent);
  }
}