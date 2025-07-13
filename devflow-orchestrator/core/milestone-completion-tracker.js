import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

/**
 * MilestoneCompletionTracker - Intelligent automated milestone management
 * 
 * Detects when all issues in a milestone are completed and automatically closes
 * the milestone with comprehensive completion analytics.
 * 
 * Features:
 * - Smart milestone completion detection
 * - Automated milestone closure with completion reports
 * - Comprehensive analytics and metrics tracking
 * - Cross-organization milestone management
 * - Dashboard integration for real-time tracking
 */
export class MilestoneCompletionTracker extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.github = options.github;
        this.context = options.context;
        
        this.options = {
            enableAnalytics: options.enableAnalytics !== false,
            enableAutoClose: options.enableAutoClose !== false,
            retentionDays: options.retentionDays || 90,
            analyticsPath: options.analyticsPath || 'devflow-orchestrator/analytics',
            ...options
        };
        
        this.analytics = {
            completions: [],
            metrics: {},
            startTime: new Date()
        };
        
        console.log('🎯 MilestoneCompletionTracker initialized', {
            enableAnalytics: this.options.enableAnalytics,
            enableAutoClose: this.options.enableAutoClose,
            repository: this.context?.repo
        });
    }
    
    /**
     * Check completion status of all open milestones
     */
    async checkAllMilestones() {
        try {
            console.log('🔍 Checking all open milestones for completion...');
            
            const milestones = await this.github.rest.issues.listMilestones({
                owner: this.context.repo.owner,
                repo: this.context.repo.repo,
                state: 'open',
                per_page: 100
            });
            
            console.log(`Found ${milestones.data.length} open milestones`);
            
            const results = [];
            for (const milestone of milestones.data) {
                const result = await this.checkMilestoneCompletion(milestone.number);
                results.push(result);
            }
            
            await this.generateCompletionReport(results);
            
            return results;
            
        } catch (error) {
            console.error('❌ Error checking all milestones:', error);
            this.emit('error', error);
            throw error;
        }
    }
    
    /**
     * Check completion status of a specific milestone
     */
    async checkMilestoneCompletion(milestoneNumber) {
        try {
            console.log(`🎯 Checking milestone #${milestoneNumber} for completion`);
            
            // Get milestone details
            const milestone = await this.github.rest.issues.getMilestone({
                owner: this.context.repo.owner,
                repo: this.context.repo.repo,
                milestone_number: milestoneNumber
            });
            
            const milestoneData = milestone.data;
            console.log(`📊 Milestone: "${milestoneData.title}"`, {
                state: milestoneData.state,
                openIssues: milestoneData.open_issues,
                closedIssues: milestoneData.closed_issues
            });
            
            // Calculate completion metrics
            const totalIssues = milestoneData.open_issues + milestoneData.closed_issues;
            const completionPercentage = totalIssues > 0 ? (milestoneData.closed_issues / totalIssues) * 100 : 0;
            const isCompleted = milestoneData.open_issues === 0 && totalIssues > 0;
            
            const result = {
                milestone: {
                    number: milestoneData.number,
                    title: milestoneData.title,
                    state: milestoneData.state,
                    url: milestoneData.html_url
                },
                metrics: {
                    totalIssues,
                    openIssues: milestoneData.open_issues,
                    closedIssues: milestoneData.closed_issues,
                    completionPercentage: Math.round(completionPercentage * 100) / 100,
                    isCompleted,
                    createdAt: milestoneData.created_at,
                    updatedAt: milestoneData.updated_at,
                    dueOn: milestoneData.due_on
                },
                actions: {
                    autoCloseEligible: isCompleted && milestoneData.state === 'open',
                    autoClosed: false
                },
                timestamp: new Date().toISOString()
            };
            
            // Auto-close if eligible
            if (result.actions.autoCloseEligible && this.options.enableAutoClose) {
                console.log(`🎉 Milestone #${milestoneNumber} is 100% complete - auto-closing!`);
                await this.closeMilestone(milestoneNumber, result);
                result.actions.autoClosed = true;
            } else if (isCompleted) {
                console.log(`✅ Milestone #${milestoneNumber} is complete but already closed`);
            } else {
                console.log(`⏳ Milestone #${milestoneNumber} is ${completionPercentage}% complete (${milestoneData.open_issues} issues remaining)`);
            }
            
            // Track analytics
            if (this.options.enableAnalytics) {
                this.analytics.completions.push(result);
                await this.trackMilestoneMetrics(result);
            }
            
            this.emit('milestoneChecked', result);
            return result;
            
        } catch (error) {
            console.error(`❌ Error checking milestone #${milestoneNumber}:`, error);
            this.emit('error', error);
            throw error;
        }
    }
    
    /**
     * Close a completed milestone with completion analytics
     */
    async closeMilestone(milestoneNumber, completionData) {
        try {
            console.log(`🔒 Closing milestone #${milestoneNumber}...`);
            
            // Calculate milestone duration
            const createdAt = new Date(completionData.milestone.createdAt);
            const completedAt = new Date();
            const durationDays = Math.round((completedAt - createdAt) / (1000 * 60 * 60 * 24));
            
            // Generate completion comment
            const completionComment = this.generateCompletionComment(completionData, durationDays);
            
            // Close the milestone
            await this.github.rest.issues.updateMilestone({
                owner: this.context.repo.owner,
                repo: this.context.repo.repo,
                milestone_number: milestoneNumber,
                state: 'closed'
            });
            
            // Get milestone issues for final report
            const issues = await this.github.rest.issues.listForRepo({
                owner: this.context.repo.owner,
                repo: this.context.repo.repo,
                milestone: milestoneNumber,
                state: 'all',
                per_page: 100
            });
            
            // Create completion issue for documentation
            const completionIssue = await this.github.rest.issues.create({
                owner: this.context.repo.owner,
                repo: this.context.repo.repo,
                title: `🎉 Milestone Completed: ${completionData.milestone.title}`,
                body: completionComment,
                labels: ['automation', 'analytics']
            });
            
            console.log(`✅ Milestone #${milestoneNumber} closed successfully`);
            console.log(`📝 Completion report created: ${completionIssue.data.html_url}`);
            
            const closureData = {
                ...completionData,
                closure: {
                    completedAt: completedAt.toISOString(),
                    durationDays,
                    completionIssueUrl: completionIssue.data.html_url,
                    totalIssuesCompleted: issues.data.length
                }
            };
            
            this.emit('milestoneClosed', closureData);
            return closureData;
            
        } catch (error) {
            console.error(`❌ Error closing milestone #${milestoneNumber}:`, error);
            this.emit('error', error);
            throw error;
        }
    }
    
    /**
     * Generate milestone completion comment with analytics
     */
    generateCompletionComment(completionData, durationDays) {
        const milestone = completionData.milestone;
        const metrics = completionData.metrics;
        
        return `## 🎉 Milestone Completion Report

**Milestone**: [${milestone.title}](${milestone.url})  
**Completion Date**: ${new Date().toISOString().split('T')[0]}  
**Duration**: ${durationDays} days

### 📊 Completion Metrics

- **Total Issues**: ${metrics.totalIssues}
- **Completed Issues**: ${metrics.closedIssues}
- **Completion Rate**: ${metrics.completionPercentage}%
- **Average Velocity**: ${(metrics.closedIssues / durationDays).toFixed(2)} issues/day

### 🤖 Automation Details

This milestone was automatically closed by DevFlow Orchestrator when all associated issues reached completion.

**Automation Workflow**: Milestone Completion Tracker  
**Trigger**: Issue closure detection  
**Action**: Automatic milestone closure with analytics  

### 🔗 Related Links

- [Milestone](${milestone.url})
- [DevFlow Analytics Dashboard](../devflow-orchestrator/dashboard)

---

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;
    }
    
    /**
     * Track milestone metrics for analytics
     */
    async trackMilestoneMetrics(milestoneData) {
        try {
            const analyticsDir = this.options.analyticsPath;
            await fs.mkdir(analyticsDir, { recursive: true });
            
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `milestone-completion-${timestamp}.json`;
            const filepath = path.join(analyticsDir, filename);
            
            // Load existing data or create new
            let analyticsData = [];
            try {
                const existingData = await fs.readFile(filepath, 'utf8');
                analyticsData = JSON.parse(existingData);
            } catch (error) {
                // File doesn't exist, start fresh
            }
            
            analyticsData.push(milestoneData);
            
            await fs.writeFile(filepath, JSON.stringify(analyticsData, null, 2));
            console.log(`📊 Analytics saved to ${filename}`);
            
        } catch (error) {
            console.error('❌ Error saving milestone analytics:', error);
        }
    }
    
    /**
     * Generate comprehensive completion report
     */
    async generateCompletionReport(results) {
        try {
            const completedMilestones = results.filter(r => r.actions.autoClosed);
            const eligibleMilestones = results.filter(r => r.actions.autoCloseEligible);
            
            console.log(`\n🎯 Milestone Completion Summary:`);
            console.log(`- Total milestones checked: ${results.length}`);
            console.log(`- Milestones auto-closed: ${completedMilestones.length}`);
            console.log(`- Milestones eligible for closure: ${eligibleMilestones.length}`);
            
            if (completedMilestones.length > 0) {
                console.log(`\n🎉 Completed milestones:`);
                completedMilestones.forEach(milestone => {
                    console.log(`  - #${milestone.milestone.number}: ${milestone.milestone.title}`);
                });
            }
            
            const summary = {
                timestamp: new Date().toISOString(),
                summary: {
                    totalChecked: results.length,
                    autoClosed: completedMilestones.length,
                    eligible: eligibleMilestones.length
                },
                milestones: results
            };
            
            this.emit('reportGenerated', summary);
            return summary;
            
        } catch (error) {
            console.error('❌ Error generating completion report:', error);
            this.emit('error', error);
            throw error;
        }
    }
}

// Export for GitHub Actions usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MilestoneCompletionTracker };
}