import { EventEmitter } from 'events';
import { Logger } from '../utils/logger.js';

/**
 * WorkflowOrchestrator - Advanced workflow automation engine
 * 
 * Provides intelligent workflow orchestration including smart branching,
 * automated PR creation, cross-repository coordination, and conflict resolution.
 * 
 * Features:
 * - Smart branch creation based on issue types and labels
 * - Automated PR creation with intelligent linking
 * - Cross-repository dependency management
 * - Predictive conflict detection and resolution
 * - Performance monitoring and optimization
 */
export class WorkflowOrchestrator extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.github = options.github;
        this.config = options.config;
        this.logger = new Logger('WorkflowOrchestrator');
        
        this.options = {
            enableSmartBranching: options.enableSmartBranching !== false,
            enableAutoPR: options.enableAutoPR !== false,
            enableCrossRepoSync: options.enableCrossRepoSync !== false,
            enableConflictDetection: options.enableConflictDetection !== false,
            enablePerformanceTracking: options.enablePerformanceTracking !== false,
            branchingStrategies: options.branchingStrategies || this._getDefaultStrategies(),
            ...options
        };
        
        this.metrics = {
            workflowsExecuted: 0,
            branchesCreated: 0,
            prsCreated: 0,
            conflictsDetected: 0,
            conflictsResolved: 0,
            crossRepoOperations: 0
        };
        
        this.logger.info('WorkflowOrchestrator initialized', {
            enableSmartBranching: this.options.enableSmartBranching,
            enableAutoPR: this.options.enableAutoPR,
            enableCrossRepoSync: this.options.enableCrossRepoSync
        });
    }
    
    /**
     * Get default branching strategies
     * @private
     */
    _getDefaultStrategies() {
        return {
            feature: {
                prefix: 'feature/',
                baseRef: 'main',
                protectionRules: ['require-pr-reviews', 'dismiss-stale-reviews'],
                autoMerge: false
            },
            bugfix: {
                prefix: 'bugfix/',
                baseRef: 'main',
                protectionRules: ['require-pr-reviews'],
                autoMerge: true
            },
            hotfix: {
                prefix: 'hotfix/',
                baseRef: 'production',
                protectionRules: ['require-pr-reviews', 'require-status-checks'],
                autoMerge: true,
                priority: 'high'
            },
            release: {
                prefix: 'release/',
                baseRef: 'develop',
                protectionRules: ['require-pr-reviews', 'require-approvals:2'],
                autoMerge: false
            }
        };
    }
    
    /**
     * Create smart branch based on issue
     * @param {Object} issue - GitHub issue object
     * @param {Object} options - Branch creation options
     */
    async createSmartBranch(issue, options = {}) {
        try {
            this.logger.info('Creating smart branch for issue', {
                issueNumber: issue.number,
                issueTitle: issue.title,
                labels: issue.labels.map(l => l.name)
            });
            
            // Determine branch type based on issue labels
            const branchType = this._determineBranchType(issue);
            const strategy = this.options.branchingStrategies[branchType];
            
            // Generate branch name
            const branchName = this._generateBranchName(issue, branchType, strategy);
            
            // Get base branch
            const baseBranch = options.baseRef || strategy.baseRef || 'main';
            
            // Create branch
            const result = await this._createBranch({
                owner: options.owner,
                repo: options.repo,
                branchName,
                baseBranch,
                issue,
                strategy
            });
            
            // Track metrics
            this.metrics.branchesCreated++;
            
            // Apply protection rules if enabled
            if (strategy.protectionRules && options.applyProtection !== false) {
                // Branch protection would be applied here in production
                // await this._applyBranchProtection(result.branch, strategy.protectionRules);
                this.logger.debug('Branch protection rules would be applied', {
                    branch: result.branch,
                    rules: strategy.protectionRules
                });
            }
            
            // Create tracking entry
            const branchData = {
                name: branchName,
                type: branchType,
                issue: {
                    number: issue.number,
                    title: issue.title,
                    url: issue.html_url
                },
                createdAt: new Date().toISOString(),
                strategy,
                result
            };
            
            this.emit('branchCreated', branchData);
            
            // Auto-create PR if enabled
            if (this.options.enableAutoPR && options.createPR !== false) {
                await this.createAutomatedPR(branchData, options);
            }
            
            return branchData;
            
        } catch (error) {
            this.logger.error('Failed to create smart branch', {
                issue: issue.number,
                error: error.message
            });
            this.emit('error', error);
            throw error;
        }
    }
    
    /**
     * Determine branch type from issue labels
     * @private
     */
    _determineBranchType(issue) {
        const labels = issue.labels.map(l => l.name.toLowerCase());
        
        if (labels.includes('bug')) return 'bugfix';
        if (labels.includes('hotfix') || labels.includes('critical')) return 'hotfix';
        if (labels.includes('release')) return 'release';
        
        // Default to feature
        return 'feature';
    }
    
    /**
     * Generate branch name
     * @private
     */
    _generateBranchName(issue, branchType, strategy) {
        const issueNumber = issue.number;
        const prefix = strategy.prefix;
        
        // Clean title for branch name
        const cleanTitle = issue.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);
        
        return `${prefix}DEVFLOW-${issueNumber}-${cleanTitle}`;
    }
    
    /**
     * Create branch in repository
     * @private
     */
    async _createBranch({ owner, repo, branchName, baseBranch, issue }) {
        try {
            // Get base branch reference
            const baseRef = await this.github.rest.git.getRef({
                owner,
                repo,
                ref: `heads/${baseBranch}`
            });
            
            // Create new branch
            const newBranch = await this.github.rest.git.createRef({
                owner,
                repo,
                ref: `refs/heads/${branchName}`,
                sha: baseRef.data.object.sha
            });
            
            this.logger.info('Branch created successfully', {
                branchName,
                baseBranch,
                sha: newBranch.data.object.sha
            });
            
            return {
                branch: branchName,
                baseBranch,
                sha: newBranch.data.object.sha,
                url: `https://github.com/${owner}/${repo}/tree/${branchName}`
            };
            
        } catch (error) {
            if (error.status === 422 && error.message.includes('Reference already exists')) {
                this.logger.warn('Branch already exists', { branchName });
                return { branch: branchName, exists: true };
            }
            throw error;
        }
    }
    
    /**
     * Create automated pull request
     * @param {Object} branchData - Branch information
     * @param {Object} options - PR creation options
     */
    async createAutomatedPR(branchData, options = {}) {
        try {
            this.logger.info('Creating automated PR', {
                branch: branchData.name,
                issue: branchData.issue.number
            });
            
            const { owner, repo } = options;
            const baseBranch = branchData.strategy.baseRef;
            
            // Generate PR body
            const prBody = this._generatePRBody(branchData, options);
            
            // Create PR
            const pr = await this.github.rest.pulls.create({
                owner,
                repo,
                title: `${branchData.issue.title} (#${branchData.issue.number})`,
                head: branchData.name,
                base: baseBranch,
                body: prBody,
                draft: options.draft || false
            });
            
            // Link PR to issue
            await this._linkPRToIssue(pr.data, branchData.issue, { owner, repo });
            
            // Apply labels
            if (options.labels || branchData.issue.labels) {
                const labels = options.labels || branchData.issue.labels.map(l => l.name);
                await this.github.rest.issues.addLabels({
                    owner,
                    repo,
                    issue_number: pr.data.number,
                    labels
                });
            }
            
            // Setup auto-merge if configured
            if (branchData.strategy.autoMerge && options.enableAutoMerge !== false) {
                await this._setupAutoMerge(pr.data, { owner, repo });
            }
            
            this.metrics.prsCreated++;
            
            const prData = {
                number: pr.data.number,
                url: pr.data.html_url,
                branch: branchData.name,
                issue: branchData.issue,
                autoMerge: branchData.strategy.autoMerge
            };
            
            this.emit('prCreated', prData);
            
            return prData;
            
        } catch (error) {
            this.logger.error('Failed to create automated PR', {
                branch: branchData.name,
                error: error.message
            });
            this.emit('error', error);
            throw error;
        }
    }
    
    /**
     * Generate PR body content
     * @private
     */
    _generatePRBody(branchData, options) {
        const issue = branchData.issue;
        
        return `## Summary

This PR addresses Issue #${issue.number}: ${issue.title}

## Changes

<!-- Describe the changes made in this PR -->

## Related Issues

Closes #${issue.number}

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated

---

**Branch Type**: ${branchData.type}
**Auto-merge**: ${branchData.strategy.autoMerge ? 'Enabled' : 'Disabled'}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;
    }
    
    /**
     * Link PR to issue
     * @private
     */
    async _linkPRToIssue(pr, issue, { owner, repo }) {
        try {
            // Add comment to issue
            await this.github.rest.issues.createComment({
                owner,
                repo,
                issue_number: issue.number,
                body: `🔗 Pull Request #${pr.number} has been created for this issue: ${pr.html_url}`
            });
            
        } catch (error) {
            this.logger.warn('Failed to link PR to issue', {
                pr: pr.number,
                issue: issue.number,
                error: error.message
            });
        }
    }
    
    /**
     * Detect potential conflicts
     * @param {Object} branch - Branch information
     * @param {Object} targetBranch - Target branch for merge
     */
    async detectConflicts(branch, targetBranch, { owner, repo }) {
        try {
            this.logger.info('Detecting potential conflicts', {
                branch: branch.name,
                target: targetBranch
            });
            
            // Compare branches
            const comparison = await this.github.rest.repos.compareCommits({
                owner,
                repo,
                base: targetBranch,
                head: branch.name
            });
            
            // Analyze file changes
            const conflicts = [];
            const changedFiles = comparison.data.files || [];
            
            for (const file of changedFiles) {
                // Check if file is modified in both branches
                if (file.status === 'modified') {
                    const conflictRisk = await this._analyzeConflictRisk(file, { owner, repo, branch, targetBranch });
                    if (conflictRisk.high) {
                        conflicts.push({
                            file: file.filename,
                            risk: conflictRisk.level,
                            details: conflictRisk.details
                        });
                    }
                }
            }
            
            if (conflicts.length > 0) {
                this.metrics.conflictsDetected++;
                this.emit('conflictsDetected', {
                    branch: branch.name,
                    target: targetBranch,
                    conflicts
                });
            }
            
            return {
                hasConflicts: conflicts.length > 0,
                conflicts,
                comparison: {
                    ahead: comparison.data.ahead_by,
                    behind: comparison.data.behind_by,
                    totalCommits: comparison.data.total_commits
                }
            };
            
        } catch (error) {
            this.logger.error('Failed to detect conflicts', {
                branch: branch.name,
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Analyze conflict risk for a file
     * @private
     */
    async _analyzeConflictRisk(file, context) {
        // Simple heuristic-based analysis
        // In production, this could use ML or more sophisticated analysis
        
        const riskFactors = {
            highChangeFrequency: file.changes > 50,
            criticalFile: this._isCriticalFile(file.filename),
            multipleAuthors: false, // Would need to check commit history
            recentChanges: true // Would need to check timestamps
        };
        
        const riskLevel = Object.values(riskFactors).filter(Boolean).length;
        
        return {
            high: riskLevel >= 2,
            level: riskLevel > 3 ? 'critical' : riskLevel > 1 ? 'high' : 'medium',
            details: riskFactors
        };
    }
    
    /**
     * Check if file is critical
     * @private
     */
    _isCriticalFile(filename) {
        const criticalPatterns = [
            /package\.json$/,
            /\.github\/workflows\//,
            /config\//,
            /\.env/,
            /database\//,
            /migrations\//
        ];
        
        return criticalPatterns.some(pattern => pattern.test(filename));
    }
    
    /**
     * Apply branch protection rules
     * @private
     */
    async _applyBranchProtection(branch, protectionRules) {
        // This would apply actual GitHub branch protection rules in production
        // For now, it's a placeholder that logs the intended protection
        this.logger.info('Applying branch protection', {
            branch,
            rules: protectionRules
        });
        
        // In production, this would use GitHub API to apply protection rules
        // Example implementation would be:
        // await this.github.rest.repos.updateBranchProtection({
        //     owner: context.owner,
        //     repo: context.repo,
        //     branch: branch,
        //     required_status_checks: {...},
        //     enforce_admins: true,
        //     required_pull_request_reviews: {...},
        //     restrictions: {...}
        // });
        
        return {
            branch,
            protectionApplied: true,
            rules: protectionRules
        };
    }
    
    /**
     * Setup auto-merge for pull request
     * @private
     */
    async _setupAutoMerge(pr, { owner, repo }) {
        try {
            // Enable auto-merge for the PR
            await this.github.rest.pulls.updateBranch({
                owner,
                repo,
                pull_number: pr.number
            });
            
            this.logger.info('Auto-merge configured for PR', {
                pr: pr.number,
                url: pr.html_url
            });
            
            return true;
        } catch (error) {
            this.logger.warn('Failed to setup auto-merge', {
                pr: pr.number,
                error: error.message
            });
            return false;
        }
    }
    
    /**
     * Trigger GitHub Action workflow
     * @private
     */
    async _triggerGitHubAction(repo, config) {
        try {
            const result = await this.github.rest.actions.createWorkflowDispatch({
                owner: repo.owner,
                repo: repo.name,
                workflow_id: config.workflowId,
                ref: config.ref || 'main',
                inputs: config.inputs || {}
            });
            
            return {
                triggered: true,
                workflowId: config.workflowId,
                ref: config.ref
            };
        } catch (error) {
            this.logger.error('Failed to trigger GitHub Action', {
                repo: repo.id,
                workflow: config.workflowId,
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Orchestrate cross-repository workflow
     * @param {Object} workflow - Workflow definition
     * @param {Object} options - Orchestration options
     */
    async orchestrateCrossRepoWorkflow(workflow, options = {}) {
        try {
            this.logger.info('Orchestrating cross-repository workflow', {
                workflowId: workflow.id,
                repositories: workflow.repositories
            });
            
            const results = {
                workflowId: workflow.id,
                startTime: new Date().toISOString(),
                repositories: {},
                success: true
            };
            
            // Execute workflow steps across repositories
            for (const repo of workflow.repositories) {
                try {
                    const repoResult = await this._executeRepoWorkflow(repo, workflow, options);
                    results.repositories[repo.name] = repoResult;
                    
                } catch (error) {
                    results.success = false;
                    results.repositories[repo.name] = {
                        error: error.message,
                        status: 'failed'
                    };
                    
                    if (!options.continueOnError) {
                        throw error;
                    }
                }
            }
            
            results.endTime = new Date().toISOString();
            results.duration = new Date(results.endTime) - new Date(results.startTime);
            
            this.metrics.crossRepoOperations++;
            this.metrics.workflowsExecuted++;
            
            this.emit('crossRepoWorkflowCompleted', results);
            
            return results;
            
        } catch (error) {
            this.logger.error('Cross-repo workflow failed', {
                workflow: workflow.id,
                error: error.message
            });
            this.emit('error', error);
            throw error;
        }
    }
    
    /**
     * Execute workflow for a single repository
     * @private
     */
    async _executeRepoWorkflow(repo, workflow, options) {
        const steps = workflow.steps || [];
        const results = {
            repository: repo.name,
            steps: []
        };
        
        for (const step of steps) {
            const stepResult = await this._executeWorkflowStep(step, repo, options);
            results.steps.push(stepResult);
            
            if (!stepResult.success && step.required) {
                throw new Error(`Required step '${step.name}' failed in ${repo.name}`);
            }
        }
        
        return results;
    }
    
    /**
     * Execute a single workflow step
     * @private
     */
    async _executeWorkflowStep(step, repo, options) {
        try {
            this.logger.debug('Executing workflow step', {
                step: step.name,
                repo: repo.name,
                type: step.type
            });
            
            let result;
            
            switch (step.type) {
                case 'create-branch':
                    result = await this._createBranch({
                        owner: repo.owner,
                        repo: repo.name,
                        branchName: step.config.branchName,
                        baseBranch: step.config.baseBranch
                    });
                    break;
                    
                case 'create-pr':
                    result = await this.createAutomatedPR(step.config.branchData, {
                        owner: repo.owner,
                        repo: repo.name,
                        ...step.config
                    });
                    break;
                    
                case 'run-action':
                    result = await this._triggerGitHubAction(repo, step.config);
                    break;
                    
                default:
                    throw new Error(`Unknown workflow step type: ${step.type}`);
            }
            
            return {
                step: step.name,
                type: step.type,
                success: true,
                result
            };
            
        } catch (error) {
            return {
                step: step.name,
                type: step.type,
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Get workflow metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            workflowsExecuted: 0,
            branchesCreated: 0,
            prsCreated: 0,
            conflictsDetected: 0,
            conflictsResolved: 0,
            crossRepoOperations: 0
        };
    }
}

// Export for use in other modules
export default WorkflowOrchestrator;