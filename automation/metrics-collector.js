#!/usr/bin/env node

/**
 * Metrics Collector
 * Collects and aggregates metrics from various sources across the ecosystem
 */

const fs = require('fs');
const path = require('path');

class MetricsCollector {
  constructor() {
    this.baseDir = path.dirname(__dirname);
    this.outputDir = path.join(this.baseDir, 'docs', 'analytics');
    this.cacheDir = path.join(this.baseDir, '.github-stats-cache');
    
    // Ensure output directories exist
    this.ensureDirectories();
    
    this.metrics = {
      timestamp: new Date().toISOString(),
      repositories: {},
      organizations: {},
      ecosystem: {
        total_repositories: 0,
        total_commits: 0,
        total_contributors: 0,
        total_issues: 0,
        total_prs: 0,
        languages: {},
        activity_score: 0
      },
      health: {
        automation_status: 'active',
        last_sync: null,
        errors: [],
        warnings: []
      }
    };
  }

  ensureDirectories() {
    [this.outputDir, this.cacheDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async collectMetrics() {
    console.log('📊 Starting metrics collection...');
    
    try {
      // Collect repository metrics
      await this.collectRepositoryMetrics();
      
      // Collect organization metrics
      await this.collectOrganizationMetrics();
      
      // Aggregate ecosystem metrics
      await this.aggregateEcosystemMetrics();
      
      // Calculate health scores
      await this.calculateHealthScores();
      
      // Save metrics
      await this.saveMetrics();
      
      console.log('✅ Metrics collection completed successfully');
    } catch (error) {
      console.error('❌ Error collecting metrics:', error);
      this.metrics.health.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  async collectRepositoryMetrics() {
    console.log('📈 Collecting repository metrics...');
    
    // Read from cached stats if available
    const statsFile = path.join(this.cacheDir, 'github-stats.json');
    if (fs.existsSync(statsFile)) {
      try {
        const stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
        this.processRepositoryStats(stats);
      } catch (error) {
        console.warn('⚠️ Could not read cached stats:', error.message);
      }
    }
  }

  processRepositoryStats(stats) {
    if (!stats || !stats.organizations) return;
    
    Object.entries(stats.organizations).forEach(([org, data]) => {
      this.metrics.organizations[org] = {
        repository_count: data.repositories?.length || 0,
        total_stars: data.total_stars || 0,
        total_forks: data.total_forks || 0,
        languages: data.languages || {},
        last_updated: data.last_updated || null
      };
      
      // Update ecosystem totals
      this.metrics.ecosystem.total_repositories += data.repositories?.length || 0;
    });
  }

  async collectOrganizationMetrics() {
    console.log('🏢 Collecting organization metrics...');
    
    const orgsDir = path.join(this.baseDir, 'organizations');
    if (fs.existsSync(orgsDir)) {
      const files = fs.readdirSync(orgsDir).filter(f => f.endsWith('.md'));
      
      files.forEach(file => {
        const content = fs.readFileSync(path.join(orgsDir, file), 'utf8');
        const lines = content.split('\n').length;
        const lastModified = fs.statSync(path.join(orgsDir, file)).mtime;
        
        const orgName = file.replace('.md', '').replace(/-/g, ' ');
        if (!this.metrics.organizations[orgName]) {
          this.metrics.organizations[orgName] = {};
        }
        
        this.metrics.organizations[orgName].documentation = {
          file: file,
          lines: lines,
          last_modified: lastModified.toISOString()
        };
      });
    }
  }

  async aggregateEcosystemMetrics() {
    console.log('🌐 Aggregating ecosystem metrics...');
    
    // Calculate total languages
    const allLanguages = {};
    Object.values(this.metrics.organizations).forEach(org => {
      if (org.languages) {
        Object.entries(org.languages).forEach(([lang, count]) => {
          allLanguages[lang] = (allLanguages[lang] || 0) + count;
        });
      }
    });
    
    this.metrics.ecosystem.languages = allLanguages;
    
    // Calculate activity score (simple formula based on recent updates)
    const now = new Date();
    let recentUpdates = 0;
    
    Object.values(this.metrics.organizations).forEach(org => {
      if (org.documentation?.last_modified) {
        const lastMod = new Date(org.documentation.last_modified);
        const daysSince = (now - lastMod) / (1000 * 60 * 60 * 24);
        if (daysSince < 30) recentUpdates++;
      }
    });
    
    this.metrics.ecosystem.activity_score = Math.min(100, recentUpdates * 10);
  }

  async calculateHealthScores() {
    console.log('🏥 Calculating health scores...');
    
    // Check for required files
    const requiredFiles = [
      'README.md',
      'package.json',
      '.github/workflows/portfolio-update.yml'
    ];
    
    requiredFiles.forEach(file => {
      const filePath = path.join(this.baseDir, file);
      if (!fs.existsSync(filePath)) {
        this.metrics.health.warnings.push(`Missing required file: ${file}`);
      }
    });
    
    // Update last sync time
    this.metrics.health.last_sync = new Date().toISOString();
  }

  async saveMetrics() {
    console.log('💾 Saving metrics...');
    
    // Save to analytics directory
    const metricsFile = path.join(this.outputDir, 'ecosystem-metrics.json');
    fs.writeFileSync(
      metricsFile,
      JSON.stringify(this.metrics, null, 2),
      'utf8'
    );
    
    // Create summary for AUTOMATION_SUMMARY.md
    const summary = this.generateSummary();
    const summaryFile = path.join(this.baseDir, 'AUTOMATION_SUMMARY.md');
    fs.writeFileSync(summaryFile, summary, 'utf8');
    
    console.log(`✅ Metrics saved to ${metricsFile}`);
    console.log(`✅ Summary saved to ${summaryFile}`);
  }

  generateSummary() {
    const { ecosystem, organizations, health } = this.metrics;
    
    return `# Automation Summary

Last Updated: ${this.metrics.timestamp}

## Ecosystem Overview

- **Total Repositories**: ${ecosystem.total_repositories}
- **Total Organizations**: ${Object.keys(organizations).length}
- **Activity Score**: ${ecosystem.activity_score}/100
- **Automation Status**: ${health.automation_status}

## Language Distribution

${Object.entries(ecosystem.languages)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10)
  .map(([lang, count]) => `- ${lang}: ${count} files`)
  .join('\n')}

## Organization Metrics

${Object.entries(organizations)
  .map(([org, data]) => `### ${org}
- Repositories: ${data.repository_count || 'N/A'}
- Total Stars: ${data.total_stars || 'N/A'}
- Total Forks: ${data.total_forks || 'N/A'}`)
  .join('\n\n')}

## Health Status

- **Last Sync**: ${health.last_sync}
- **Errors**: ${health.errors.length}
- **Warnings**: ${health.warnings.length}

${health.warnings.length > 0 ? `### Warnings\n${health.warnings.map(w => `- ${w}`).join('\n')}` : ''}

${health.errors.length > 0 ? `### Errors\n${health.errors.map(e => `- ${e.error} (${e.timestamp})`).join('\n')}` : ''}

---
*Generated by Ecosystem Metrics Collector*
`;
  }
}

// Run if called directly
if (require.main === module) {
  const collector = new MetricsCollector();
  collector.collectMetrics().catch(console.error);
}

module.exports = MetricsCollector;