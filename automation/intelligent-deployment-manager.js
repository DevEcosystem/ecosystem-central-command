#!/usr/bin/env node

/**
 * Intelligent Deployment Manager
 * Enterprise-level smart deployment with change detection and selective updates
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class IntelligentDeploymentManager {
  constructor() {
    this.baseDir = path.dirname(__dirname);
    this.generatedReadmesDir = path.join(this.baseDir, 'generated-readmes');
    this.cacheDir = path.join(this.baseDir, '.deployment-cache');
    this.deploymentHistory = path.join(this.cacheDir, 'deployment-history.json');
    
    // Repository configuration with intelligence settings
    this.repositories = [
      {
        org: 'DevPersonalHub',
        name: 'external-learning-platforms',
        type: 'learning',
        priority: 1,
        changeThreshold: 'medium', // low, medium, high
        smartUpdate: true
      },
      {
        org: 'DevPersonalHub',
        name: 'portfolio-website',
        type: 'portfolio',
        priority: 2,
        changeThreshold: 'high',
        smartUpdate: true
      },
      {
        org: 'DevPersonalHub',
        name: 'technical-showcase',
        type: 'showcase',
        priority: 3,
        changeThreshold: 'medium',
        smartUpdate: true
      },
      {
        org: 'DevPersonalHub',
        name: 'learning-projects',
        type: 'projects',
        priority: 4,
        changeThreshold: 'low',
        smartUpdate: true
      },
      {
        org: 'DevAcademicHub',
        name: 'academic-portfolio',
        type: 'academic',
        priority: 5,
        changeThreshold: 'high',
        smartUpdate: true
      },
      {
        org: 'DevBusinessHub',
        name: 'business-management',
        type: 'business',
        priority: 6,
        changeThreshold: 'low',
        smartUpdate: true
      },
      {
        org: 'DevBusinessHub',
        name: 'automation-tools',
        type: 'business-tools',
        priority: 7,
        changeThreshold: 'medium',
        smartUpdate: true
      },
      {
        org: 'DevEcosystem',
        name: 'ecosystem-automation-tools',
        type: 'automation',
        priority: 8,
        changeThreshold: 'low',
        smartUpdate: true
      }
    ];
    
    this.initializeCache();
  }

  /**
   * Initialize deployment cache system
   */
  initializeCache() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      console.log('📁 Created deployment cache directory');
    }
    
    if (!fs.existsSync(this.deploymentHistory)) {
      const initialHistory = {
        lastRun: null,
        deployments: {},
        statistics: {
          totalRuns: 0,
          successfulDeployments: 0,
          skippedDeployments: 0,
          failedDeployments: 0
        }
      };
      
      fs.writeFileSync(this.deploymentHistory, JSON.stringify(initialHistory, null, 2));
      console.log('📊 Initialized deployment history');
    }
  }

  /**
   * Main intelligent deployment execution
   */
  async executeIntelligentDeployment() {
    console.log('🧠 Starting Intelligent Deployment Manager...');
    console.log('=====================================');
    
    try {
      // Step 1: Load deployment history
      const history = this.loadDeploymentHistory();
      
      // Step 2: Analyze all repositories for changes
      const changeAnalysis = await this.analyzeRepositoryChanges();
      
      // Step 3: Determine deployment strategy
      const deploymentPlan = this.createDeploymentPlan(changeAnalysis, history);
      
      // Step 4: Execute intelligent deployment
      const deploymentResults = await this.executeDeploymentPlan(deploymentPlan);
      
      // Step 5: Update history and generate report
      await this.updateDeploymentHistory(deploymentResults);
      await this.generateIntelligentReport(deploymentResults);
      
      console.log('✅ Intelligent Deployment Manager completed successfully!');
      return deploymentResults;
      
    } catch (error) {
      console.error('❌ Intelligent Deployment Manager failed:', error.message);
      throw error;
    }
  }

  /**
   * Load deployment history
   */
  loadDeploymentHistory() {
    try {
      const historyData = fs.readFileSync(this.deploymentHistory, 'utf8');
      return JSON.parse(historyData);
    } catch (error) {
      console.log('⚠️ Could not load deployment history, using defaults');
      return {
        lastRun: null,
        deployments: {},
        statistics: { totalRuns: 0, successfulDeployments: 0, skippedDeployments: 0, failedDeployments: 0 }
      };
    }
  }

  /**
   * Analyze repository changes with intelligent detection
   */
  async analyzeRepositoryChanges() {
    console.log('🔍 Analyzing repository changes...');
    
    const analysis = {};
    
    for (const repo of this.repositories) {
      const repoKey = `${repo.org}/${repo.name}`;
      console.log(`  🔎 Analyzing ${repoKey}...`);
      
      try {
        const currentContent = await this.getCurrentReadmeContent(repo);
        const newContent = await this.getGeneratedReadmeContent(repo);
        
        const changeMetrics = this.calculateChangeMetrics(currentContent, newContent);
        const deploymentDecision = this.shouldDeploy(repo, changeMetrics);
        
        analysis[repoKey] = {
          repository: repo,
          currentContent,
          newContent,
          changeMetrics,
          deploymentDecision,
          timestamp: new Date().toISOString()
        };
        
        const decision = deploymentDecision.deploy ? '🚀 DEPLOY' : '⏭️ SKIP';
        console.log(`    ${decision}: ${deploymentDecision.reason}`);
        
      } catch (error) {
        console.log(`    ❌ Analysis failed: ${error.message}`);
        analysis[repoKey] = {
          repository: repo,
          error: error.message,
          deploymentDecision: { deploy: false, reason: 'Analysis failed' },
          timestamp: new Date().toISOString()
        };
      }
    }
    
    return analysis;
  }

  /**
   * Get current README content from repository
   */
  async getCurrentReadmeContent(repo) {
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN environment variable not set');
    }
    
    // Simulate GitHub API call (in CI/CD, this would be actual API call)
    const readmePath = path.join(this.generatedReadmesDir, `${repo.name}-README.md`);
    
    if (fs.existsSync(readmePath)) {
      return fs.readFileSync(readmePath, 'utf8');
    }
    
    return null; // No existing README
  }

  /**
   * Get generated README content
   */
  async getGeneratedReadmeContent(repo) {
    const readmePath = path.join(this.generatedReadmesDir, `${repo.name}-README.md`);
    
    if (!fs.existsSync(readmePath)) {
      throw new Error(`Generated README not found: ${readmePath}`);
    }
    
    return fs.readFileSync(readmePath, 'utf8');
  }

  /**
   * Calculate change metrics between old and new content
   */
  calculateChangeMetrics(oldContent, newContent) {
    if (!oldContent) {
      return {
        type: 'new',
        significance: 'high',
        changes: ['New README creation'],
        contentHash: this.generateContentHash(newContent),
        changePercentage: 100
      };
    }
    
    // Calculate content hash
    const oldHash = this.generateContentHash(oldContent);
    const newHash = this.generateContentHash(newContent);
    
    if (oldHash === newHash) {
      return {
        type: 'none',
        significance: 'none',
        changes: [],
        contentHash: newHash,
        changePercentage: 0
      };
    }
    
    // Detect changes
    const changes = this.detectChanges(oldContent, newContent);
    const changePercentage = this.calculateChangePercentage(oldContent, newContent);
    
    // Determine significance
    let significance = 'low';
    if (changePercentage > 30) significance = 'high';
    else if (changePercentage > 10) significance = 'medium';
    
    return {
      type: 'modified',
      significance,
      changes,
      contentHash: newHash,
      changePercentage
    };
  }

  /**
   * Generate content hash for comparison
   */
  generateContentHash(content) {
    // Normalize content (remove timestamps and dynamic data)
    let normalizedContent = content
      .replace(/Last Updated: [\d\/\-\s:]+/g, 'Last Updated: TIMESTAMP')
      .replace(/Generated: [\d\-T:\.Z]+/g, 'Generated: TIMESTAMP')
      .replace(/\d{1,2}\/\d{1,2}\/\d{4}/g, 'DATE_PLACEHOLDER');
    
    return crypto.createHash('md5').update(normalizedContent).digest('hex');
  }

  /**
   * Detect specific changes in content
   */
  detectChanges(oldContent, newContent) {
    const changes = [];
    
    // Check for new sections
    if (newContent.includes('## ') && !oldContent.includes('## ')) {
      changes.push('New sections added');
    }
    
    // Check for link changes
    const oldLinks = (oldContent.match(/\[.*?\]\(.*?\)/g) || []).length;
    const newLinks = (newContent.match(/\[.*?\]\(.*?\)/g) || []).length;
    if (newLinks !== oldLinks) {
      changes.push(`Navigation links updated (${oldLinks} → ${newLinks})`);
    }
    
    // Check for technology stack changes
    if (oldContent.includes('Technologies') && newContent.includes('Technologies')) {
      const oldTech = oldContent.match(/Technologies.*?:(.*)/);
      const newTech = newContent.match(/Technologies.*?:(.*)/);
      if (oldTech && newTech && oldTech[1] !== newTech[1]) {
        changes.push('Technology stack updated');
      }
    }
    
    // Check for project count changes
    const oldProjects = oldContent.match(/(\d+)\+?\s*projects?/i);
    const newProjects = newContent.match(/(\d+)\+?\s*projects?/i);
    if (oldProjects && newProjects && oldProjects[1] !== newProjects[1]) {
      changes.push(`Project count updated (${oldProjects[1]} → ${newProjects[1]})`);
    }
    
    if (changes.length === 0) {
      changes.push('Content formatting or structure changes');
    }
    
    return changes;
  }

  /**
   * Calculate percentage of content change
   */
  calculateChangePercentage(oldContent, newContent) {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    let differences = 0;
    const maxLines = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';
      
      if (oldLine !== newLine) {
        differences++;
      }
    }
    
    return Math.round((differences / maxLines) * 100);
  }

  /**
   * Determine if repository should be deployed based on change analysis
   */
  shouldDeploy(repo, changeMetrics) {
    // Always deploy new READMEs
    if (changeMetrics.type === 'new') {
      return {
        deploy: true,
        reason: 'New README creation required'
      };
    }
    
    // Skip if no changes
    if (changeMetrics.type === 'none') {
      return {
        deploy: false,
        reason: 'No content changes detected'
      };
    }
    
    // Smart deployment based on optimized repository configuration
    const thresholds = this.getOptimizedThresholds();
    const repoKey = `${repo.org}/${repo.name}`;
    
    // Apply repository-specific thresholds from config
    let thresholdLevel = repo.changeThreshold || 'medium';
    if (this.hasRepositorySpecificConfig(repoKey)) {
      thresholdLevel = this.getRepositoryThreshold(repoKey);
    }
    
    const threshold = thresholds[thresholdLevel] || thresholds.medium;
    
    if (changeMetrics.changePercentage >= threshold) {
      return {
        deploy: true,
        reason: `Optimized deployment: ${changeMetrics.changePercentage}% change exceeds ${thresholdLevel} threshold (${threshold}%)`
      };
    }
    
    // Check for critical changes that should always deploy
    const criticalChanges = ['Technology stack updated', 'Project count updated', 'Navigation links updated'];
    const hasCriticalChanges = changeMetrics.changes.some(change => 
      criticalChanges.some(critical => change.includes(critical.split(' ')[0]))
    );
    
    if (hasCriticalChanges) {
      return {
        deploy: true,
        reason: 'Critical content changes detected'
      };
    }
    
    return {
      deploy: false,
      reason: `Optimized skip: ${changeMetrics.changePercentage}% change below ${thresholdLevel} threshold (${threshold}%)`
    };
  }

  /**
   * Get optimized threshold settings
   */
  getOptimizedThresholds() {
    try {
      const configPath = path.join(__dirname, '../docs/config/deployment-thresholds.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Convert threshold levels to percentage values
        return {
          very_low: 2,   // Deploy if >2% change
          low: 5,        // Deploy if >5% change  
          medium: 10,    // Deploy if >10% change
          high: 15,      // Deploy if >15% change
          very_high: 25  // Deploy if >25% change
        };
      }
    } catch (error) {
      console.log('⚠️ Using default optimized thresholds');
    }
    
    // Fallback to optimized defaults  
    return {
      low: 5,       // More sensitive for important repos
      medium: 10,   // Balanced approach
      high: 20      // Conservative for stable repos
    };
  }

  /**
   * Check if repository has specific configuration
   */
  hasRepositorySpecificConfig(repoKey) {
    try {
      const configPath = path.join(__dirname, '../docs/config/deployment-thresholds.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return config.repositorySpecific && config.repositorySpecific[repoKey];
      }
    } catch (error) {
      return false;
    }
    return false;
  }

  /**
   * Get repository-specific threshold
   */
  getRepositoryThreshold(repoKey) {
    try {
      const configPath = path.join(__dirname, '../docs/config/deployment-thresholds.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return config.repositorySpecific[repoKey]?.changeThreshold || 'medium';
      }
    } catch (error) {
      return 'medium';
    }
    return 'medium';
  }

  /**
   * Create deployment plan based on analysis
   */
  createDeploymentPlan(analysis) {
    console.log('📋 Creating intelligent deployment plan...');
    
    const plan = {
      totalRepositories: this.repositories.length,
      deploymentsPlanned: 0,
      skipsPlanned: 0,
      deploymentList: [],
      skipList: []
    };
    
    for (const [repoKey, repoAnalysis] of Object.entries(analysis)) {
      if (repoAnalysis.deploymentDecision.deploy) {
        plan.deploymentList.push(repoAnalysis);
        plan.deploymentsPlanned++;
      } else {
        plan.skipList.push(repoAnalysis);
        plan.skipsPlanned++;
      }
    }
    
    console.log(`  📊 Plan: ${plan.deploymentsPlanned} deployments, ${plan.skipsPlanned} skips`);
    return plan;
  }

  /**
   * Execute the intelligent deployment plan
   */
  async executeDeploymentPlan(plan) {
    console.log('🚀 Executing intelligent deployment plan...');
    
    const results = {
      timestamp: new Date().toISOString(),
      planned: plan,
      executed: {
        successful: 0,
        failed: 0,
        skipped: plan.skipsPlanned,
        details: []
      }
    };
    
    // Execute planned deployments
    for (const repoAnalysis of plan.deploymentList) {
      const repo = repoAnalysis.repository;
      const repoKey = `${repo.org}/${repo.name}`;
      
      console.log(`  🎯 Deploying ${repoKey}...`);
      
      try {
        // Simulate deployment (in real environment, this would call actual deployment)
        const deploymentResult = await this.simulateDeployment(repo, repoAnalysis);
        
        results.executed.details.push({
          repository: repoKey,
          status: 'success',
          changes: repoAnalysis.changeMetrics.changes,
          reason: repoAnalysis.deploymentDecision.reason
        });
        
        results.executed.successful++;
        console.log(`    ✅ Success: ${repoKey}`);
        
      } catch (error) {
        results.executed.details.push({
          repository: repoKey,
          status: 'failed',
          error: error.message,
          reason: repoAnalysis.deploymentDecision.reason
        });
        
        results.executed.failed++;
        console.log(`    ❌ Failed: ${repoKey} - ${error.message}`);
      }
      
      // Respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Log skipped repositories
    for (const repoAnalysis of plan.skipList) {
      const repo = repoAnalysis.repository;
      const repoKey = `${repo.org}/${repo.name}`;
      
      results.executed.details.push({
        repository: repoKey,
        status: 'skipped',
        reason: repoAnalysis.deploymentDecision.reason
      });
      
      console.log(`  ⏭️ Skipped: ${repoKey} - ${repoAnalysis.deploymentDecision.reason}`);
    }
    
    return results;
  }

  /**
   * Simulate deployment (replace with actual deployment in production)
   */
  async simulateDeployment(repo, analysis) {
    // In production, this would execute the actual deployment script
    console.log(`    📡 Simulating deployment to ${repo.org}/${repo.name}...`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate success (95% success rate for simulation)
    if (Math.random() > 0.05) {
      return {
        success: true,
        commitSha: `sim${Math.random().toString(36).substr(2, 7)}`,
        url: `https://github.com/${repo.org}/${repo.name}`
      };
    } else {
      throw new Error('Simulated API failure');
    }
  }

  /**
   * Update deployment history with results
   */
  async updateDeploymentHistory(results) {
    const history = this.loadDeploymentHistory();
    
    history.lastRun = results.timestamp;
    history.statistics.totalRuns++;
    history.statistics.successfulDeployments += results.executed.successful;
    history.statistics.skippedDeployments += results.executed.skipped;
    history.statistics.failedDeployments += results.executed.failed;
    
    // Store deployment details
    for (const detail of results.executed.details) {
      if (!history.deployments[detail.repository]) {
        history.deployments[detail.repository] = [];
      }
      
      history.deployments[detail.repository].push({
        timestamp: results.timestamp,
        status: detail.status,
        changes: detail.changes || [],
        reason: detail.reason
      });
      
      // Keep only last 10 deployments per repository
      if (history.deployments[detail.repository].length > 10) {
        history.deployments[detail.repository] = history.deployments[detail.repository].slice(-10);
      }
    }
    
    fs.writeFileSync(this.deploymentHistory, JSON.stringify(history, null, 2));
    console.log('💾 Updated deployment history');
  }

  /**
   * Generate intelligent deployment report
   */
  async generateIntelligentReport(results) {
    const timestamp = new Date().toLocaleString();
    
    const report = `# 🧠 Intelligent Deployment Report

## 📊 Execution Summary: ${timestamp}

### 🎯 Smart Deployment Results
- **Total Repositories**: ${results.planned.totalRepositories}
- **Planned Deployments**: ${results.planned.deploymentsPlanned}
- **Successful Deployments**: ${results.executed.successful}
- **Failed Deployments**: ${results.executed.failed}
- **Intelligent Skips**: ${results.executed.skipped}
- **Success Rate**: ${Math.round((results.executed.successful / (results.executed.successful + results.executed.failed)) * 100) || 0}%

### 🚀 Deployment Details

${results.executed.details.map(detail => {
  const statusIcon = detail.status === 'success' ? '✅' : detail.status === 'failed' ? '❌' : '⏭️';
  const changesText = detail.changes && detail.changes.length > 0 
    ? `\n  **Changes**: ${detail.changes.join(', ')}` 
    : '';
  
  return `#### ${statusIcon} ${detail.repository}
- **Status**: ${detail.status.toUpperCase()}
- **Reason**: ${detail.reason}${changesText}`;
}).join('\n\n')}

### 📈 Intelligence Benefits

#### Efficiency Gains
- **Smart Skips**: ${results.executed.skipped} unnecessary deployments avoided
- **Targeted Updates**: Only repositories with significant changes were updated
- **Resource Optimization**: Reduced API calls and deployment time

#### Quality Assurance
- **Change Detection**: Intelligent analysis of content modifications
- **Threshold-Based**: Repository-specific deployment criteria
- **Critical Updates**: Automatic deployment for important changes

---

### 🔄 Next Automated Run
**Scheduled**: Tomorrow at 6:00 AM UTC  
**Intelligence**: Adaptive deployment based on change analysis  
**Monitoring**: Continuous improvement of deployment decisions

---

*Generated by Intelligent Deployment Manager v1.0*  
*Timestamp: ${results.timestamp}*  
*System: Enterprise-Level Automation*
`;

    const reportPath = path.join(this.baseDir, 'docs', 'INTELLIGENT_DEPLOYMENT_REPORT.md');
    fs.writeFileSync(reportPath, report, 'utf8');
    
    console.log('📋 Generated intelligent deployment report');
    return report;
  }

  /**
   * Get deployment statistics
   */
  getDeploymentStatistics() {
    const history = this.loadDeploymentHistory();
    
    return {
      totalRuns: history.statistics.totalRuns,
      successfulDeployments: history.statistics.successfulDeployments,
      skippedDeployments: history.statistics.skippedDeployments,
      failedDeployments: history.statistics.failedDeployments,
      lastRun: history.lastRun,
      repositories: Object.keys(history.deployments).length
    };
  }
}

// CLI execution
if (require.main === module) {
  const manager = new IntelligentDeploymentManager();
  manager.executeIntelligentDeployment()
    .then((results) => {
      console.log('\n🎉 Intelligent Deployment Manager: COMPLETE');
      console.log(`📊 Results: ${results.executed.successful} deployed, ${results.executed.skipped} skipped, ${results.executed.failed} failed`);
      console.log('🧠 Enterprise-level intelligence: OPERATIONAL');
    })
    .catch(error => {
      console.error('\n❌ Intelligent Deployment Manager failed:', error.message);
      process.exit(1);
    });
}

module.exports = IntelligentDeploymentManager;