#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const EcosystemAutoDiscovery = require('./ecosystem-auto-discovery');
const GitHubStatsCollector = require('./github-stats-collector');
const UniversalReadmeManager = require('./universal-readme-manager');

/**
 * Ecosystem Auto-Sync System
 * Complete automation pipeline: Discovery → Stats → README → Commit → Push
 */
class EcosystemAutoSync {
  constructor() {
    this.baseDir = path.dirname(__dirname);
    this.logFile = path.join(this.baseDir, 'docs', 'logs', 'auto-sync.log');
    this.isRealMode = !!process.env.GITHUB_TOKEN;
    
    // Initialize components
    this.discovery = new EcosystemAutoDiscovery();
    this.statsCollector = new GitHubStatsCollector();
    this.readmeManager = new UniversalReadmeManager();
    
    // Sync configuration
    this.config = {
      auto_commit: process.env.AUTO_COMMIT !== 'false',
      auto_push: process.env.AUTO_PUSH !== 'false',
      branch: process.env.SYNC_BRANCH || 'main',
      commit_message_prefix: 'Auto-sync:',
      max_retries: 3
    };

    this.results = {
      started_at: new Date().toISOString(),
      completed_at: null,
      success: false,
      steps: {},
      errors: [],
      stats: {}
    };

    console.log('🔄 Ecosystem Auto-Sync System initialized');
    console.log(`📊 Mode: ${this.isRealMode ? 'Real GitHub API' : 'Mock Development'}`);
  }

  /**
   * Run complete auto-sync pipeline
   */
  async runCompleteSync() {
    try {
      this.log('🚀 Starting Complete Ecosystem Auto-Sync');
      this.log('==========================================');
      
      // Step 1: Auto-Discovery
      await this.runStep('discovery', 'Repository Discovery', () => 
        this.discovery.runAutoDiscovery()
      );

      // Step 2: Stats Collection
      await this.runStep('stats', 'GitHub Stats Collection', () => 
        this.statsCollector.collectAllStats()
      );

      // Step 3: README Generation
      await this.runStep('readme', 'README Generation', () => 
        this.readmeManager.runUniversalUpdate()
      );

      // Step 4: Ecosystem README Update
      await this.runStep('ecosystem-readme', 'Ecosystem README Update', () => 
        this.updateEcosystemReadme()
      );

      // Step 5: Git Operations
      if (this.config.auto_commit) {
        await this.runStep('git-commit', 'Git Commit', () => 
          this.commitChanges()
        );
      }

      if (this.config.auto_push) {
        await this.runStep('git-push', 'Git Push', () => 
          this.pushChanges()
        );
      }

      // Step 6: Generate Report
      await this.runStep('report', 'Sync Report Generation', () => 
        this.generateSyncReport()
      );

      this.results.success = true;
      this.results.completed_at = new Date().toISOString();
      
      console.log('\n🎉 Complete Ecosystem Auto-Sync: SUCCESS');
      this.logResults();
      
      return this.results;
      
    } catch (error) {
      this.results.success = false;
      this.results.completed_at = new Date().toISOString();
      this.results.errors.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      console.error('\n❌ Complete Ecosystem Auto-Sync: FAILED');
      console.error('Error:', error.message);
      this.logResults();
      
      throw error;
    }
  }

  /**
   * Run individual step with error handling and timing
   */
  async runStep(stepId, stepName, stepFunction) {
    const startTime = Date.now();
    
    try {
      this.log(`🔄 Starting: ${stepName}`);
      
      const result = await stepFunction();
      
      const duration = Date.now() - startTime;
      this.results.steps[stepId] = {
        name: stepName,
        success: true,
        duration_ms: duration,
        completed_at: new Date().toISOString(),
        result: result
      };
      
      this.log(`✅ Completed: ${stepName} (${duration}ms)`);
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.steps[stepId] = {
        name: stepName,
        success: false,
        duration_ms: duration,
        completed_at: new Date().toISOString(),
        error: error.message
      };
      
      this.log(`❌ Failed: ${stepName} - ${error.message}`);
      throw error;
    }
  }

  /**
   * Update ecosystem main README with latest statistics
   */
  async updateEcosystemReadme() {
    const readmePath = path.join(this.baseDir, 'README.md');
    const statsPath = path.join(this.baseDir, 'docs', 'analytics', 'github-language-stats.json');
    
    if (!fs.existsSync(statsPath)) {
      throw new Error('GitHub language stats not found');
    }

    const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    const readme = fs.readFileSync(readmePath, 'utf8');

    // Update total statistics
    let updatedReadme = readme.replace(
      /\*\*Total Code\*\*: [\d,]+ lines across \d+ repositories in \d+ organizations/,
      `**Total Code**: ${stats.ecosystem_totals.total_lines.toLocaleString()} lines across ${stats.ecosystem_totals.total_repositories} repositories in ${stats.ecosystem_totals.total_organizations} organizations`
    );

    // Update Business Hub statistics if changed
    const businessHub = stats.organizations.DevBusinessHub;
    if (businessHub) {
      updatedReadme = updatedReadme.replace(
        /#### Business Hub\n\*\*[\d,]+ lines\*\* • \*\*\d+ repositories\*\*/,
        `#### Business Hub\n**${businessHub.totals.total_lines.toLocaleString()} lines** • **${businessHub.totals.total_repositories} repositories**`
      );
    }

    // Update cross-organization language distribution
    const topLanguages = stats.ecosystem_totals.languages.slice(0, 10);
    let languageSection = '';
    
    topLanguages.forEach(lang => {
      const icon = this.getLanguageIcon(lang.language);
      const orgList = lang.organizations ? 
        lang.organizations.slice(0, 3).map(org => org.name.replace('Dev', '')).join(', ') : 
        'Multiple';
      
      languageSection += `${icon} **${lang.language}** ${lang.percentage}% (${lang.lines.toLocaleString()} lines) • *${orgList}*  \n`;
    });

    // Update language distribution section
    updatedReadme = updatedReadme.replace(
      /🟨 \*\*JavaScript\*\*.*?\n(?=\n### 🏢 Organization Breakdown)/s,
      languageSection
    );

    fs.writeFileSync(readmePath, updatedReadme);
    
    return {
      updated_sections: ['total_code', 'business_hub', 'language_distribution'],
      total_lines: stats.ecosystem_totals.total_lines,
      total_repositories: stats.ecosystem_totals.total_repositories
    };
  }

  /**
   * Get language icon
   */
  getLanguageIcon(language) {
    const icons = {
      'JavaScript': '🟨',
      'TypeScript': '🔵', 
      'Python': '🐍',
      'Java': '🟠',
      'CSS': '🟣',
      'HTML': '🟤',
      'C++': '🔴',
      'C': '⚫',
      'JSON': '⚪',
      'Shell': '🟩',
      'Markdown': '⚫',
      'SCSS': '🟣'
    };
    
    return icons[language] || '▪';
  }

  /**
   * Commit changes with auto-generated message
   */
  async commitChanges() {
    try {
      // Check for changes
      const status = execSync('git status --porcelain', { 
        cwd: this.baseDir, 
        encoding: 'utf8' 
      });
      
      if (!status.trim()) {
        return { changes: false, message: 'No changes to commit' };
      }

      // Add all changes
      execSync('git add .', { cwd: this.baseDir });

      // Generate commit message
      const timestamp = new Date().toISOString().split('T')[0];
      const repoCount = this.results.steps.discovery?.result ? 
        Object.values(this.results.steps.discovery.result).reduce((acc, repos) => acc + repos.length, 0) : 
        'Unknown';

      const commitMessage = `${this.config.commit_message_prefix} ${timestamp} - Ecosystem sync (${repoCount} repositories)

- Repository auto-discovery completed
- GitHub language statistics updated  
- All README files regenerated
- Cross-organization metrics synchronized

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

      // Commit changes
      execSync(`git commit -m "${commitMessage}"`, { 
        cwd: this.baseDir 
      });

      return { 
        changes: true, 
        message: 'Changes committed successfully',
        commit_message: commitMessage
      };
      
    } catch (error) {
      if (error.message.includes('nothing to commit')) {
        return { changes: false, message: 'No changes to commit' };
      }
      throw error;
    }
  }

  /**
   * Push changes to remote repository
   */
  async pushChanges() {
    try {
      const output = execSync(`git push origin ${this.config.branch}`, { 
        cwd: this.baseDir,
        encoding: 'utf8'
      });

      return { 
        success: true, 
        message: 'Changes pushed successfully',
        output: output
      };
      
    } catch (error) {
      throw new Error(`Git push failed: ${error.message}`);
    }
  }

  /**
   * Generate comprehensive sync report
   */
  async generateSyncReport() {
    const reportPath = path.join(this.baseDir, 'docs', 'logs', 'ecosystem-sync-report.md');
    
    // Ensure logs directory exists
    const logsDir = path.dirname(reportPath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const report = this.generateMarkdownReport();
    fs.writeFileSync(reportPath, report);

    // Also save JSON report
    const jsonReportPath = path.join(this.baseDir, 'docs', 'logs', 'ecosystem-sync-results.json');
    fs.writeFileSync(jsonReportPath, JSON.stringify(this.results, null, 2));

    return {
      markdown_report: reportPath,
      json_report: jsonReportPath,
      success: this.results.success
    };
  }

  /**
   * Generate Markdown report
   */
  generateMarkdownReport() {
    const duration = this.results.completed_at ? 
      new Date(this.results.completed_at) - new Date(this.results.started_at) : 
      Date.now() - new Date(this.results.started_at);

    let report = `# 🔄 Ecosystem Auto-Sync Report

**Generated**: ${new Date().toLocaleString()}  
**Status**: ${this.results.success ? '✅ Success' : '❌ Failed'}  
**Duration**: ${Math.round(duration / 1000)}s  
**Mode**: ${this.isRealMode ? 'Real GitHub API' : 'Mock Development'}

## 📊 Execution Summary

`;

    // Steps summary
    const stepCount = Object.keys(this.results.steps).length;
    const successCount = Object.values(this.results.steps).filter(step => step.success).length;
    
    report += `- **Total Steps**: ${stepCount}\n`;
    report += `- **Successful**: ${successCount}\n`;
    report += `- **Failed**: ${stepCount - successCount}\n\n`;

    // Individual steps
    report += `## 🚀 Step Details\n\n`;
    
    Object.entries(this.results.steps).forEach(([stepId, step]) => {
      const icon = step.success ? '✅' : '❌';
      const duration = Math.round(step.duration_ms / 1000 * 100) / 100;
      
      report += `### ${icon} ${step.name}\n`;
      report += `- **Duration**: ${duration}s\n`;
      report += `- **Completed**: ${new Date(step.completed_at).toLocaleString()}\n`;
      
      if (step.success && step.result) {
        if (typeof step.result === 'object') {
          if (step.result.total_repositories) {
            report += `- **Repositories**: ${step.result.total_repositories}\n`;
          }
          if (step.result.total_lines) {
            report += `- **Total Lines**: ${step.result.total_lines.toLocaleString()}\n`;
          }
        }
      } else if (!step.success) {
        report += `- **Error**: ${step.error}\n`;
      }
      
      report += '\n';
    });

    // Errors section
    if (this.results.errors.length > 0) {
      report += `## ❌ Errors\n\n`;
      this.results.errors.forEach((error, index) => {
        report += `### Error ${index + 1}\n`;
        report += `**Time**: ${new Date(error.timestamp).toLocaleString()}\n`;
        report += `**Message**: ${error.message}\n\n`;
      });
    }

    // Next steps
    report += `## 🔄 Next Sync\n\n`;
    report += `- **Scheduled**: Next automated run via GitHub Actions\n`;
    report += `- **Manual Trigger**: \`npm run ecosystem:sync\`\n`;
    report += `- **Webhook**: Automatic on repository changes\n\n`;

    report += `---\n\n`;
    report += `*Generated by Ecosystem Auto-Sync System*  \n`;
    report += `*${new Date().toISOString()}*\n`;

    return report;
  }

  /**
   * Log message to console and file
   */
  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    console.log(message);
    
    // Ensure logs directory exists
    const logsDir = path.dirname(this.logFile);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  /**
   * Log final results
   */
  logResults() {
    const duration = this.results.completed_at ? 
      new Date(this.results.completed_at) - new Date(this.results.started_at) : 
      Date.now() - new Date(this.results.started_at);

    console.log('\n📊 Sync Results:');
    console.log(`   Status: ${this.results.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Duration: ${Math.round(duration / 1000)}s`);
    console.log(`   Steps completed: ${Object.values(this.results.steps).filter(s => s.success).length}/${Object.keys(this.results.steps).length}`);
    
    if (this.results.errors.length > 0) {
      console.log(`   Errors: ${this.results.errors.length}`);
    }
  }
}

// CLI execution
if (require.main === module) {
  const autoSync = new EcosystemAutoSync();
  autoSync.runCompleteSync()
    .then((results) => {
      console.log('\n🎉 Ecosystem Auto-Sync completed successfully!');
      console.log('📋 Full report available in docs/logs/');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Ecosystem Auto-Sync failed:', error.message);
      process.exit(1);
    });
}

module.exports = EcosystemAutoSync;