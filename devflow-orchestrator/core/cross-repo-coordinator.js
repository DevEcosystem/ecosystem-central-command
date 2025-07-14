import { EventEmitter } from 'events';
import { Logger } from '../utils/logger.js';

/**
 * CrossRepoCoordinator - Cross-repository coordination engine
 * 
 * Manages complex workflows that span multiple repositories, handling
 * dependencies, synchronization, and coordinated releases.
 * 
 * Features:
 * - Multi-repository task synchronization
 * - Dependency tracking and resolution
 * - Coordinated branch and PR management
 * - Unified release orchestration
 * - Conflict prevention across repositories
 */
export class CrossRepoCoordinator extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.github = options.github;
        this.config = options.config;
        this.logger = new Logger('CrossRepoCoordinator');
        
        this.options = {
            enableDependencyTracking: options.enableDependencyTracking !== false,
            enableAutoSync: options.enableAutoSync !== false,
            enableConflictPrevention: options.enableConflictPrevention !== false,
            syncInterval: options.syncInterval || 300000, // 5 minutes
            maxRetries: options.maxRetries || 3,
            ...options
        };
        
        this.repositories = new Map();
        this.dependencies = new Map();
        this.activeTasks = new Map();
        this.syncTimers = new Map();
        
        this.logger.info('CrossRepoCoordinator initialized', {
            enableDependencyTracking: this.options.enableDependencyTracking,
            enableAutoSync: this.options.enableAutoSync
        });
    }
    
    /**
     * Register repository for coordination
     * @param {Object} repo - Repository configuration
     */
    async registerRepository(repo) {
        try {
            this.logger.info('Registering repository', {
                owner: repo.owner,
                name: repo.name,
                role: repo.role
            });
            
            // Validate repository access
            const repoData = await this.github.rest.repos.get({
                owner: repo.owner,
                repo: repo.name
            });
            
            const repoConfig = {
                id: `${repo.owner}/${repo.name}`,
                owner: repo.owner,
                name: repo.name,
                role: repo.role || 'standard',
                dependencies: repo.dependencies || [],
                data: repoData.data,
                registeredAt: new Date().toISOString()
            };
            
            this.repositories.set(repoConfig.id, repoConfig);
            
            // Setup auto-sync if enabled
            if (this.options.enableAutoSync) {
                this._setupAutoSync(repoConfig);
            }
            
            // Track dependencies
            if (repo.dependencies && this.options.enableDependencyTracking) {
                this._trackDependencies(repoConfig);
            }
            
            this.emit('repositoryRegistered', repoConfig);
            
            return repoConfig;
            
        } catch (error) {
            this.logger.error('Failed to register repository', {
                repo: `${repo.owner}/${repo.name}`,
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Track repository dependencies
     * @private
     */
    _trackDependencies(repo) {
        repo.dependencies.forEach(dep => {
            if (!this.dependencies.has(dep)) {
                this.dependencies.set(dep, new Set());
            }
            this.dependencies.get(dep).add(repo.id);
        });
    }
    
    /**
     * Setup automatic synchronization
     * @private
     */
    _setupAutoSync(repo) {
        const timer = setInterval(() => {
            this._syncRepository(repo);
        }, this.options.syncInterval);
        
        this.syncTimers.set(repo.id, timer);
    }
    
    /**
     * Create coordinated branch across repositories
     * @param {Object} branchConfig - Branch configuration
     * @param {Array} repositories - Target repositories
     */
    async createCoordinatedBranch(branchConfig, repositories = []) {
        try {
            this.logger.info('Creating coordinated branch', {
                branchName: branchConfig.name,
                repositories: repositories.length || 'all'
            });
            
            const targetRepos = repositories.length > 0 
                ? repositories 
                : Array.from(this.repositories.values());
            
            const results = {
                branchName: branchConfig.name,
                baseBranch: branchConfig.baseBranch || 'main',
                created: [],
                failed: [],
                skipped: []
            };
            
            // Check for conflicts before creating branches
            if (this.options.enableConflictPrevention) {
                await this._checkPotentialConflicts(branchConfig, targetRepos);
            }
            
            // Create branches in dependency order
            const orderedRepos = this._orderByDependencies(targetRepos);
            
            for (const repo of orderedRepos) {
                try {
                    const result = await this._createRepoBranch(repo, branchConfig);
                    results.created.push({
                        repository: repo.id,
                        branch: result.branch,
                        sha: result.sha
                    });
                    
                } catch (error) {
                    if (error.message.includes('already exists')) {
                        results.skipped.push({
                            repository: repo.id,
                            reason: 'Branch already exists'
                        });
                    } else {
                        results.failed.push({
                            repository: repo.id,
                            error: error.message
                        });
                        
                        // Rollback on critical repos
                        if (repo.role === 'critical' && !branchConfig.continueOnError) {
                            await this._rollbackBranches(results.created);
                            throw error;
                        }
                    }
                }
            }
            
            this.emit('coordinatedBranchCreated', results);
            
            return results;
            
        } catch (error) {
            this.logger.error('Failed to create coordinated branch', {
                branch: branchConfig.name,
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Create branch in single repository
     * @private
     */
    async _createRepoBranch(repo, branchConfig) {
        const baseRef = await this.github.rest.git.getRef({
            owner: repo.owner,
            repo: repo.name,
            ref: `heads/${branchConfig.baseBranch || 'main'}`
        });
        
        const newBranch = await this.github.rest.git.createRef({
            owner: repo.owner,
            repo: repo.name,
            ref: `refs/heads/${branchConfig.name}`,
            sha: baseRef.data.object.sha
        });
        
        return {
            branch: branchConfig.name,
            sha: newBranch.data.object.sha,
            repository: repo.id
        };
    }
    
    /**
     * Create coordinated pull requests
     * @param {Object} prConfig - PR configuration
     * @param {Array} branches - Branch information
     */
    async createCoordinatedPRs(prConfig, branches) {
        try {
            this.logger.info('Creating coordinated PRs', {
                title: prConfig.title,
                branches: branches.length
            });
            
            const results = {
                title: prConfig.title,
                created: [],
                failed: [],
                linkedPRs: {}
            };
            
            // Create PRs
            for (const branch of branches) {
                try {
                    const repo = this.repositories.get(branch.repository);
                    const pr = await this._createRepoPR(repo, branch, prConfig);
                    
                    results.created.push({
                        repository: repo.id,
                        number: pr.number,
                        url: pr.html_url
                    });
                    
                    results.linkedPRs[repo.id] = pr.number;
                    
                } catch (error) {
                    results.failed.push({
                        repository: branch.repository,
                        error: error.message
                    });
                }
            }
            
            // Cross-link PRs if requested
            if (prConfig.crossLink && results.created.length > 1) {
                await this._crossLinkPRs(results.created);
            }
            
            this.emit('coordinatedPRsCreated', results);
            
            return results;
            
        } catch (error) {
            this.logger.error('Failed to create coordinated PRs', {
                title: prConfig.title,
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Create PR in single repository
     * @private
     */
    async _createRepoPR(repo, branch, prConfig) {
        const body = this._generateCoordinatedPRBody(prConfig, repo);
        
        const pr = await this.github.rest.pulls.create({
            owner: repo.owner,
            repo: repo.name,
            title: prConfig.title,
            head: branch.branch,
            base: prConfig.baseBranch || 'main',
            body,
            draft: prConfig.draft || false
        });
        
        // Add labels if specified
        if (prConfig.labels) {
            await this.github.rest.issues.addLabels({
                owner: repo.owner,
                repo: repo.name,
                issue_number: pr.data.number,
                labels: prConfig.labels
            });
        }
        
        return pr.data;
    }
    
    /**
     * Generate PR body for coordinated PRs
     * @private
     */
    _generateCoordinatedPRBody(prConfig, repo) {
        return `## Summary

${prConfig.description || 'Part of coordinated changes across multiple repositories.'}

## Repository Role

**${repo.id}**: ${repo.role}

## Related Changes

This PR is part of a coordinated change set. Related PRs will be linked below.

${prConfig.body || ''}

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Cross-repository tests pass

---

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;
    }
    
    /**
     * Cross-link pull requests
     * @private
     */
    async _crossLinkPRs(prs) {
        const linkText = '## Related Pull Requests\n\n' + 
            prs.map(pr => `- ${pr.repository}: #${pr.number}`).join('\n');
        
        for (const pr of prs) {
            const [owner, repoName] = pr.repository.split('/');
            
            await this.github.rest.issues.createComment({
                owner,
                repo: repoName,
                issue_number: pr.number,
                body: linkText
            });
        }
    }
    
    /**
     * Synchronize changes across repositories
     * @param {Object} syncConfig - Synchronization configuration
     */
    async synchronizeRepositories(syncConfig) {
        try {
            this.logger.info('Synchronizing repositories', {
                type: syncConfig.type,
                source: syncConfig.source
            });
            
            const results = {
                type: syncConfig.type,
                synchronized: [],
                failed: [],
                conflicts: []
            };
            
            const sourceRepo = this.repositories.get(syncConfig.source);
            if (!sourceRepo) {
                throw new Error(`Source repository '${syncConfig.source}' not found`);
            }
            
            // Determine target repositories
            const targets = syncConfig.targets || 
                Array.from(this.repositories.values())
                    .filter(r => r.id !== syncConfig.source);
            
            for (const target of targets) {
                try {
                    const syncResult = await this._syncRepository(target, sourceRepo, syncConfig);
                    results.synchronized.push({
                        repository: target.id,
                        changes: syncResult.changes
                    });
                    
                } catch (error) {
                    if (error.message.includes('conflict')) {
                        results.conflicts.push({
                            repository: target.id,
                            conflicts: error.conflicts
                        });
                    } else {
                        results.failed.push({
                            repository: target.id,
                            error: error.message
                        });
                    }
                }
            }
            
            this.emit('repositoriesSynchronized', results);
            
            return results;
            
        } catch (error) {
            this.logger.error('Failed to synchronize repositories', {
                type: syncConfig.type,
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Sync single repository
     * @private
     */
    async _syncRepository(target, source, config) {
        const changes = [];
        
        switch (config.type) {
            case 'files':
                // Sync specific files
                for (const file of config.files) {
                    const change = await this._syncFile(source, target, file);
                    if (change) changes.push(change);
                }
                break;
                
            case 'branch':
                // Sync entire branch
                await this._syncBranch(source, target, config.branch);
                changes.push({ type: 'branch', branch: config.branch });
                break;
                
            case 'tags':
                // Sync tags
                const tags = await this._syncTags(source, target);
                changes.push({ type: 'tags', count: tags.length });
                break;
                
            default:
                throw new Error(`Unknown sync type: ${config.type}`);
        }
        
        return { changes };
    }
    
    /**
     * Order repositories by dependencies
     * @private
     */
    _orderByDependencies(repositories) {
        const ordered = [];
        const visited = new Set();
        
        const visit = (repo) => {
            if (visited.has(repo.id)) return;
            visited.add(repo.id);
            
            // Visit dependencies first
            if (repo.dependencies) {
                repo.dependencies.forEach(dep => {
                    const depRepo = repositories.find(r => r.id === dep);
                    if (depRepo) visit(depRepo);
                });
            }
            
            ordered.push(repo);
        };
        
        repositories.forEach(repo => visit(repo));
        
        return ordered;
    }
    
    /**
     * Check for potential conflicts
     * @private
     */
    async _checkPotentialConflicts(branchConfig, repositories) {
        const conflicts = [];
        
        for (const repo of repositories) {
            try {
                // Check if branch already exists
                await this.github.rest.git.getRef({
                    owner: repo.owner,
                    repo: repo.name,
                    ref: `heads/${branchConfig.name}`
                });
                
                conflicts.push({
                    repository: repo.id,
                    type: 'branch_exists',
                    message: `Branch '${branchConfig.name}' already exists`
                });
                
            } catch (error) {
                // Branch doesn't exist, which is what we want
            }
        }
        
        if (conflicts.length > 0) {
            const error = new Error('Potential conflicts detected');
            error.conflicts = conflicts;
            throw error;
        }
    }
    
    /**
     * Rollback created branches
     * @private
     */
    async _rollbackBranches(createdBranches) {
        this.logger.warn('Rolling back created branches', {
            count: createdBranches.length
        });
        
        const rollbackResults = [];
        
        for (const branch of createdBranches) {
            try {
                const [owner, name] = branch.repository.split('/');
                await this.github.rest.git.deleteRef({
                    owner,
                    repo: name,
                    ref: `heads/${branch.branch}`
                });
                
                rollbackResults.push({
                    repository: branch.repository,
                    branch: branch.branch,
                    status: 'deleted'
                });
            } catch (error) {
                rollbackResults.push({
                    repository: branch.repository,
                    branch: branch.branch,
                    status: 'failed',
                    error: error.message
                });
            }
        }
        
        return rollbackResults;
    }
    
    /**
     * Sync files between repositories
     * @private
     */
    async _syncFile(source, target, filePath) {
        try {
            // Get file content from source
            const sourceFile = await this.github.rest.repos.getContent({
                owner: source.owner,
                repo: source.name,
                path: filePath
            });
            
            // Check if file exists in target
            let targetFile;
            try {
                targetFile = await this.github.rest.repos.getContent({
                    owner: target.owner,
                    repo: target.name,
                    path: filePath
                });
            } catch (error) {
                // File doesn't exist in target
            }
            
            // Create or update file in target
            const result = await this.github.rest.repos.createOrUpdateFileContents({
                owner: target.owner,
                repo: target.name,
                path: filePath,
                message: `Sync ${filePath} from ${source.id}`,
                content: sourceFile.data.content,
                sha: targetFile?.data?.sha
            });
            
            return {
                file: filePath,
                action: targetFile ? 'updated' : 'created',
                commit: result.data.commit.sha
            };
            
        } catch (error) {
            this.logger.error('Failed to sync file', {
                source: source.id,
                target: target.id,
                file: filePath,
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Sync branch between repositories
     * @private
     */
    async _syncBranch(source, target, branchName) {
        try {
            // Get source branch
            const sourceBranch = await this.github.rest.git.getRef({
                owner: source.owner,
                repo: source.name,
                ref: `heads/${branchName}`
            });
            
            // Create or update branch in target
            try {
                await this.github.rest.git.updateRef({
                    owner: target.owner,
                    repo: target.name,
                    ref: `heads/${branchName}`,
                    sha: sourceBranch.data.object.sha,
                    force: true
                });
            } catch (error) {
                // Branch doesn't exist, create it
                await this.github.rest.git.createRef({
                    owner: target.owner,
                    repo: target.name,
                    ref: `refs/heads/${branchName}`,
                    sha: sourceBranch.data.object.sha
                });
            }
            
            return {
                branch: branchName,
                sha: sourceBranch.data.object.sha
            };
            
        } catch (error) {
            this.logger.error('Failed to sync branch', {
                source: source.id,
                target: target.id,
                branch: branchName,
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Sync tags between repositories
     * @private
     */
    async _syncTags(source, target) {
        try {
            // Get all tags from source
            const sourceTags = await this.github.rest.repos.listTags({
                owner: source.owner,
                repo: source.name,
                per_page: 100
            });
            
            const syncedTags = [];
            
            for (const tag of sourceTags.data) {
                try {
                    // Create tag in target
                    await this.github.rest.git.createRef({
                        owner: target.owner,
                        repo: target.name,
                        ref: `refs/tags/${tag.name}`,
                        sha: tag.commit.sha
                    });
                    
                    syncedTags.push(tag.name);
                } catch (error) {
                    if (!error.message.includes('already exists')) {
                        throw error;
                    }
                }
            }
            
            return syncedTags;
            
        } catch (error) {
            this.logger.error('Failed to sync tags', {
                source: source.id,
                target: target.id,
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Perform pre-release checks
     * @private
     */
    async _performPreReleaseChecks(releaseConfig) {
        this.logger.info('Performing pre-release checks', {
            version: releaseConfig.version
        });
        
        const checks = [];
        
        // Check for uncommitted changes
        // Check for failing CI
        // Check dependencies
        // etc.
        
        return checks;
    }
    
    /**
     * Create release branches
     * @private
     */
    async _createReleaseBranches(releaseConfig) {
        const branchName = `release/${releaseConfig.version}`;
        const branches = [];
        
        const repos = releaseConfig.repositories || Array.from(this.repositories.values());
        
        for (const repo of repos) {
            try {
                const branch = await this._createRepoBranch(repo, {
                    name: branchName,
                    baseBranch: releaseConfig.baseBranch || 'develop'
                });
                
                branches.push({
                    repository: repo.id,
                    branch: branch.branch,
                    sha: branch.sha
                });
            } catch (error) {
                this.logger.error('Failed to create release branch', {
                    repo: repo.id,
                    version: releaseConfig.version,
                    error: error.message
                });
                throw error;
            }
        }
        
        return branches;
    }
    
    /**
     * Update version files
     * @private
     */
    async _updateVersions(releaseConfig, branches) {
        for (const branch of branches) {
            const [owner, name] = branch.repository.split('/');
            
            // Update package.json or other version files
            // This is a simplified implementation
            try {
                const packageJson = await this.github.rest.repos.getContent({
                    owner,
                    repo: name,
                    path: 'package.json',
                    ref: branch.branch
                });
                
                const content = JSON.parse(Buffer.from(packageJson.data.content, 'base64').toString());
                content.version = releaseConfig.version;
                
                await this.github.rest.repos.createOrUpdateFileContents({
                    owner,
                    repo: name,
                    path: 'package.json',
                    message: `chore: bump version to ${releaseConfig.version}`,
                    content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
                    sha: packageJson.data.sha,
                    branch: branch.branch
                });
            } catch (error) {
                this.logger.warn('Failed to update version', {
                    repo: branch.repository,
                    error: error.message
                });
            }
        }
    }
    
    /**
     * Create releases
     * @private
     */
    async _createReleases(releaseConfig, branches) {
        const releases = [];
        
        for (const branch of branches) {
            const [owner, name] = branch.repository.split('/');
            
            try {
                const release = await this.github.rest.repos.createRelease({
                    owner,
                    repo: name,
                    tag_name: `v${releaseConfig.version}`,
                    target_commitish: branch.branch,
                    name: `Release ${releaseConfig.version}`,
                    body: releaseConfig.releaseNotes || `Release version ${releaseConfig.version}`,
                    draft: releaseConfig.draft || false,
                    prerelease: releaseConfig.prerelease || false
                });
                
                releases.push({
                    repository: branch.repository,
                    id: release.data.id,
                    url: release.data.html_url,
                    tagName: release.data.tag_name
                });
            } catch (error) {
                this.logger.error('Failed to create release', {
                    repo: branch.repository,
                    version: releaseConfig.version,
                    error: error.message
                });
                throw error;
            }
        }
        
        return releases;
    }
    
    /**
     * Perform post-release tasks
     * @private
     */
    async _performPostReleaseTasks(releaseConfig, releases) {
        // Create PR to merge release back to develop
        // Update documentation
        // Notify teams
        // etc.
        
        this.logger.info('Post-release tasks completed', {
            version: releaseConfig.version,
            releaseCount: releases.length
        });
    }
    
    /**
     * Rollback release
     * @private
     */
    async _rollbackRelease(releaseConfig, results) {
        const rollbacks = [];
        
        // Delete created releases
        for (const release of results.releases) {
            const [owner, name] = release.repository.split('/');
            
            try {
                await this.github.rest.repos.deleteRelease({
                    owner,
                    repo: name,
                    release_id: release.id
                });
                
                rollbacks.push({
                    repository: release.repository,
                    type: 'release',
                    status: 'deleted'
                });
            } catch (error) {
                rollbacks.push({
                    repository: release.repository,
                    type: 'release',
                    status: 'failed',
                    error: error.message
                });
            }
        }
        
        return rollbacks;
    }
    
    /**
     * Orchestrate cross-repository release
     * @param {Object} releaseConfig - Release configuration
     */
    async orchestrateRelease(releaseConfig) {
        try {
            this.logger.info('Orchestrating cross-repository release', {
                version: releaseConfig.version,
                repositories: releaseConfig.repositories?.length || 'all'
            });
            
            const taskId = `release-${releaseConfig.version}-${Date.now()}`;
            this.activeTasks.set(taskId, {
                type: 'release',
                config: releaseConfig,
                status: 'in-progress',
                startTime: new Date().toISOString()
            });
            
            const results = {
                version: releaseConfig.version,
                releases: [],
                failed: [],
                rollbacks: []
            };
            
            try {
                // Phase 1: Pre-release checks
                await this._performPreReleaseChecks(releaseConfig);
                
                // Phase 2: Create release branches
                const branches = await this._createReleaseBranches(releaseConfig);
                
                // Phase 3: Update versions
                await this._updateVersions(releaseConfig, branches);
                
                // Phase 4: Create releases
                const releases = await this._createReleases(releaseConfig, branches);
                results.releases = releases;
                
                // Phase 5: Post-release tasks
                await this._performPostReleaseTasks(releaseConfig, releases);
                
                this.activeTasks.get(taskId).status = 'completed';
                this.emit('releaseCompleted', results);
                
            } catch (error) {
                // Rollback on failure
                this.logger.error('Release failed, initiating rollback', {
                    version: releaseConfig.version,
                    error: error.message
                });
                
                results.rollbacks = await this._rollbackRelease(releaseConfig, results);
                this.activeTasks.get(taskId).status = 'failed';
                
                throw error;
            }
            
            return results;
            
        } catch (error) {
            this.logger.error('Failed to orchestrate release', {
                version: releaseConfig.version,
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Get coordination status
     */
    getStatus() {
        return {
            repositories: Array.from(this.repositories.values()).map(r => ({
                id: r.id,
                role: r.role,
                registeredAt: r.registeredAt
            })),
            dependencies: Array.from(this.dependencies.entries()).map(([dep, repos]) => ({
                dependency: dep,
                dependents: Array.from(repos)
            })),
            activeTasks: Array.from(this.activeTasks.entries()).map(([id, task]) => ({
                id,
                type: task.type,
                status: task.status,
                startTime: task.startTime
            }))
        };
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        // Clear sync timers
        this.syncTimers.forEach(timer => clearInterval(timer));
        this.syncTimers.clear();
        
        // Clear data
        this.repositories.clear();
        this.dependencies.clear();
        this.activeTasks.clear();
        
        this.logger.info('CrossRepoCoordinator cleaned up');
    }
}

// Export for use in other modules
export default CrossRepoCoordinator;