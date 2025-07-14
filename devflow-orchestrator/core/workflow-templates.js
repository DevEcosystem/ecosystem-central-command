/**
 * WorkflowTemplates - Predefined workflow templates for different project types
 * 
 * Provides intelligent workflow templates that can be customized based on
 * project type, technology stack, and organizational requirements.
 */
export class WorkflowTemplates {
    constructor() {
        this.templates = this._initializeTemplates();
    }
    
    /**
     * Initialize workflow templates
     * @private
     */
    _initializeTemplates() {
        return {
            'node-application': {
                name: 'Node.js Application',
                description: 'Complete CI/CD workflow for Node.js applications',
                triggers: ['push', 'pull_request'],
                jobs: {
                    test: {
                        name: 'Test',
                        'runs-on': 'ubuntu-latest',
                        strategy: {
                            matrix: {
                                'node-version': ['18.x', '20.x', '21.x']
                            }
                        },
                        steps: [
                            { uses: 'actions/checkout@v4' },
                            {
                                name: 'Use Node.js ${{ matrix.node-version }}',
                                uses: 'actions/setup-node@v4',
                                with: { 'node-version': '${{ matrix.node-version }}' }
                            },
                            { name: 'Install dependencies', run: 'npm ci' },
                            { name: 'Run linting', run: 'npm run lint' },
                            { name: 'Run tests', run: 'npm test' },
                            { name: 'Build', run: 'npm run build --if-present' }
                        ]
                    },
                    'security-scan': {
                        name: 'Security Scan',
                        'runs-on': 'ubuntu-latest',
                        steps: [
                            { uses: 'actions/checkout@v4' },
                            { name: 'Run npm audit', run: 'npm audit --audit-level=moderate' }
                        ]
                    }
                }
            },
            
            'python-application': {
                name: 'Python Application',
                description: 'CI/CD workflow for Python applications',
                triggers: ['push', 'pull_request'],
                jobs: {
                    test: {
                        name: 'Test',
                        'runs-on': 'ubuntu-latest',
                        strategy: {
                            matrix: {
                                'python-version': ['3.9', '3.10', '3.11', '3.12']
                            }
                        },
                        steps: [
                            { uses: 'actions/checkout@v4' },
                            {
                                name: 'Set up Python ${{ matrix.python-version }}',
                                uses: 'actions/setup-python@v4',
                                with: { 'python-version': '${{ matrix.python-version }}' }
                            },
                            {
                                name: 'Install dependencies',
                                run: `python -m pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-dev.txt`
                            },
                            { name: 'Lint with flake8', run: 'flake8 .' },
                            { name: 'Test with pytest', run: 'pytest --cov=./' }
                        ]
                    }
                }
            },
            
            'docker-application': {
                name: 'Docker Application',
                description: 'Build and publish Docker images',
                triggers: {
                    push: { branches: ['main'] },
                    release: { types: ['published'] }
                },
                jobs: {
                    build: {
                        name: 'Build and Push',
                        'runs-on': 'ubuntu-latest',
                        steps: [
                            { uses: 'actions/checkout@v4' },
                            {
                                name: 'Set up QEMU',
                                uses: 'docker/setup-qemu-action@v3'
                            },
                            {
                                name: 'Set up Docker Buildx',
                                uses: 'docker/setup-buildx-action@v3'
                            },
                            {
                                name: 'Login to DockerHub',
                                uses: 'docker/login-action@v3',
                                with: {
                                    username: '${{ secrets.DOCKERHUB_USERNAME }}',
                                    password: '${{ secrets.DOCKERHUB_TOKEN }}'
                                }
                            },
                            {
                                name: 'Build and push',
                                uses: 'docker/build-push-action@v5',
                                with: {
                                    push: true,
                                    tags: 'user/app:latest',
                                    platforms: 'linux/amd64,linux/arm64'
                                }
                            }
                        ]
                    }
                }
            },
            
            'release-automation': {
                name: 'Release Automation',
                description: 'Automated release workflow with changelog generation',
                triggers: {
                    workflow_dispatch: {
                        inputs: {
                            version: {
                                description: 'Release version',
                                required: true
                            }
                        }
                    }
                },
                jobs: {
                    release: {
                        name: 'Create Release',
                        'runs-on': 'ubuntu-latest',
                        steps: [
                            { uses: 'actions/checkout@v4', with: { 'fetch-depth': 0 } },
                            {
                                name: 'Generate changelog',
                                id: 'changelog',
                                uses: 'TriPSs/conventional-changelog-action@v5',
                                with: {
                                    'github-token': '${{ secrets.GITHUB_TOKEN }}',
                                    'version-file': './package.json'
                                }
                            },
                            {
                                name: 'Create Release',
                                uses: 'actions/create-release@v1',
                                if: '${{ steps.changelog.outputs.skipped == \'false\' }}',
                                env: { GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}' },
                                with: {
                                    tag_name: '${{ steps.changelog.outputs.tag }}',
                                    release_name: 'Release ${{ steps.changelog.outputs.tag }}',
                                    body: '${{ steps.changelog.outputs.clean_changelog }}'
                                }
                            }
                        ]
                    }
                }
            },
            
            'security-scanning': {
                name: 'Security Scanning',
                description: 'Comprehensive security scanning workflow',
                triggers: {
                    schedule: [{ cron: '0 0 * * 1' }],
                    workflow_dispatch: {}
                },
                jobs: {
                    'dependency-scan': {
                        name: 'Dependency Scanning',
                        'runs-on': 'ubuntu-latest',
                        steps: [
                            { uses: 'actions/checkout@v4' },
                            {
                                name: 'Run Snyk to check for vulnerabilities',
                                uses: 'snyk/actions/node@master',
                                env: { SNYK_TOKEN: '${{ secrets.SNYK_TOKEN }}' }
                            }
                        ]
                    },
                    'code-scan': {
                        name: 'Code Scanning',
                        'runs-on': 'ubuntu-latest',
                        steps: [
                            { uses: 'actions/checkout@v4' },
                            {
                                name: 'Initialize CodeQL',
                                uses: 'github/codeql-action/init@v3',
                                with: { languages: 'javascript' }
                            },
                            {
                                name: 'Perform CodeQL Analysis',
                                uses: 'github/codeql-action/analyze@v3'
                            }
                        ]
                    }
                }
            },
            
            'cross-repo-sync': {
                name: 'Cross-Repository Synchronization',
                description: 'Sync changes across multiple repositories',
                triggers: {
                    workflow_dispatch: {
                        inputs: {
                            source_repo: {
                                description: 'Source repository',
                                required: true
                            },
                            target_repos: {
                                description: 'Target repositories (comma-separated)',
                                required: true
                            },
                            sync_type: {
                                description: 'Sync type (files/branch/tag)',
                                required: true,
                                default: 'files'
                            }
                        }
                    }
                },
                jobs: {
                    sync: {
                        name: 'Synchronize Repositories',
                        'runs-on': 'ubuntu-latest',
                        steps: [
                            { uses: 'actions/checkout@v4' },
                            {
                                name: 'Setup GitHub CLI',
                                run: 'gh auth login --with-token <<< "${{ secrets.GITHUB_TOKEN }}"'
                            },
                            {
                                name: 'Sync to target repositories',
                                run: 'IFS="," read -ra REPOS <<< "${{ github.event.inputs.target_repos }}"; for repo in "${REPOS[@]}"; do echo "Syncing to $repo"; done'
                            }
                        ]
                    }
                }
            }
        };
    }
    
    /**
     * Get workflow template by name
     * @param {string} templateName - Template name
     * @returns {Object} - Workflow template
     */
    getTemplate(templateName) {
        return this.templates[templateName];
    }
    
    /**
     * List all available templates
     * @returns {Array} - List of template info
     */
    listTemplates() {
        return Object.entries(this.templates).map(([key, template]) => ({
            id: key,
            name: template.name,
            description: template.description
        }));
    }
    
    /**
     * Generate workflow YAML from template
     * @param {string} templateName - Template name
     * @param {Object} customization - Custom values
     * @returns {string} - Generated YAML content
     */
    generateWorkflow(templateName, customization = {}) {
        const template = this.getTemplate(templateName);
        if (!template) {
            throw new Error(`Template '${templateName}' not found`);
        }
        
        // Deep clone template
        const workflow = JSON.parse(JSON.stringify(template));
        
        // Apply customizations
        if (customization.name) workflow.name = customization.name;
        if (customization.triggers) workflow.triggers = customization.triggers;
        
        // Merge custom jobs
        if (customization.jobs) {
            Object.assign(workflow.jobs, customization.jobs);
        }
        
        // Convert to YAML
        return this._convertToYAML(workflow);
    }
    
    /**
     * Convert workflow object to YAML
     * @private
     */
    _convertToYAML(workflow) {
        const lines = [];
        
        // Header
        lines.push(`name: ${workflow.name}`);
        lines.push('');
        
        // Triggers
        lines.push('on:');
        if (Array.isArray(workflow.triggers)) {
            workflow.triggers.forEach(trigger => {
                lines.push(`  ${trigger}:`);
            });
        } else {
            Object.entries(workflow.triggers).forEach(([trigger, config]) => {
                lines.push(`  ${trigger}:`);
                this._yamlifyObject(config, lines, '    ');
            });
        }
        lines.push('');
        
        // Jobs
        lines.push('jobs:');
        Object.entries(workflow.jobs).forEach(([jobId, job]) => {
            lines.push(`  ${jobId}:`);
            Object.entries(job).forEach(([key, value]) => {
                if (key === 'steps') {
                    lines.push('    steps:');
                    value.forEach(step => {
                        lines.push('      - ' + this._yamlifyStep(step));
                    });
                } else {
                    this._yamlifyProperty(key, value, lines, '    ');
                }
            });
            lines.push('');
        });
        
        return lines.join('\n');
    }
    
    /**
     * Convert step to YAML
     * @private
     */
    _yamlifyStep(step) {
        const parts = [];
        Object.entries(step).forEach(([key, value]) => {
            if (typeof value === 'string' && !value.includes('\n')) {
                parts.push(`${key}: ${value}`);
            } else if (typeof value === 'object') {
                parts.push(`${key}:`);
                Object.entries(value).forEach(([k, v]) => {
                    parts.push(`        ${k}: ${v}`);
                });
            } else {
                parts.push(`${key}: |`);
                value.split('\n').forEach(line => {
                    parts.push(`        ${line}`);
                });
            }
        });
        return parts.join('\n        ');
    }
    
    /**
     * Convert property to YAML
     * @private
     */
    _yamlifyProperty(key, value, lines, indent) {
        if (typeof value === 'string') {
            lines.push(`${indent}${key}: ${value}`);
        } else if (typeof value === 'object') {
            lines.push(`${indent}${key}:`);
            this._yamlifyObject(value, lines, indent + '  ');
        }
    }
    
    /**
     * Convert object to YAML
     * @private
     */
    _yamlifyObject(obj, lines, indent) {
        Object.entries(obj).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                lines.push(`${indent}${key}:`);
                value.forEach(item => {
                    if (typeof item === 'object') {
                        lines.push(`${indent}  -`);
                        Object.entries(item).forEach(([k, v]) => {
                            lines.push(`${indent}    ${k}: ${JSON.stringify(v)}`);
                        });
                    } else {
                        lines.push(`${indent}  - ${item}`);
                    }
                });
            } else {
                this._yamlifyProperty(key, value, lines, indent);
            }
        });
    }
    
    /**
     * Create custom template
     * @param {string} name - Template name
     * @param {Object} template - Template definition
     */
    createCustomTemplate(name, template) {
        if (this.templates[name]) {
            throw new Error(`Template '${name}' already exists`);
        }
        
        // Validate template structure
        if (!template.name || !template.jobs) {
            throw new Error('Template must have name and jobs');
        }
        
        this.templates[name] = template;
        return template;
    }
    
    /**
     * Combine multiple templates
     * @param {Array} templateNames - Templates to combine
     * @param {Object} options - Combination options
     * @returns {Object} - Combined template
     */
    combineTemplates(templateNames, options = {}) {
        const combined = {
            name: options.name || 'Combined Workflow',
            description: options.description || 'Combined workflow from multiple templates',
            triggers: {},
            jobs: {}
        };
        
        // Merge templates
        templateNames.forEach(templateName => {
            const template = this.getTemplate(templateName);
            if (!template) {
                throw new Error(`Template '${templateName}' not found`);
            }
            
            // Merge triggers
            if (template.triggers) {
                if (Array.isArray(template.triggers)) {
                    template.triggers.forEach(trigger => {
                        combined.triggers[trigger] = {};
                    });
                } else {
                    Object.assign(combined.triggers, template.triggers);
                }
            }
            
            // Merge jobs with prefix to avoid conflicts
            const prefix = options.prefixJobs ? `${templateName}_` : '';
            Object.entries(template.jobs).forEach(([jobId, job]) => {
                combined.jobs[`${prefix}${jobId}`] = job;
            });
        });
        
        return combined;
    }
}

// Export singleton instance
export default new WorkflowTemplates();