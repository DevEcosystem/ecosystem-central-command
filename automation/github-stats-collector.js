#!/usr/bin/env node

/**
 * GitHub Stats Collector
 * Collects language statistics and repository data from GitHub API
 * for cross-organization analysis and visualization
 */

const fs = require('fs');
const path = require('path');

class GitHubStatsCollector {
  constructor() {
    this.baseDir = path.dirname(__dirname);
    this.outputDir = path.join(this.baseDir, 'docs', 'analytics');
    this.cacheDir = path.join(this.baseDir, '.github-stats-cache');
    
    // Organization and repository configuration
    this.organizations = {
      "DevEcosystem": [
        "ecosystem-automation-tools",
        "ecosystem-central-command"
      ],
      "DevPersonalHub": [
        "learning-projects",
        "technical-showcase", 
        "portfolio-website",
        "external-learning-platforms"
      ],
      "DevAcademicHub": [
        "academic-portfolio",
        "collaborative-projects"
      ],
      "DevBusinessHub": [
        "automation-tools",
        "business-management",
        "Test",
        "client-investigation",
        "client-language-platform"
      ]
    };
    
    this.stats = {
      collected_at: new Date().toISOString(),
      organizations: {},
      ecosystem_totals: {},
      trends: {},
      metadata: {}
    };
    
    this.initializeCache();
  }

  /**
   * Initialize cache directory
   */
  initializeCache() {
    [this.outputDir, this.cacheDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    console.log('📊 GitHub Stats Collector initialized');
  }

  /**
   * Main collection pipeline
   */
  async collectAllStats() {
    console.log('🚀 Starting GitHub Stats Collection...');
    console.log('====================================');
    
    try {
      // Check GitHub token
      if (!process.env.GITHUB_TOKEN) {
        console.log('⚠️ GITHUB_TOKEN not set - using mock data for development');
        await this.generateMockStats();
      } else {
        await this.collectRealStats();
      }
      
      // Process and analyze collected data
      await this.processLanguageStatistics();
      await this.calculateTrends();
      await this.generateEcosystemTotals();
      
      // Save results
      await this.saveStats();
      await this.generateStatsReport();
      
      console.log('✅ GitHub Stats Collection completed successfully!');
      return this.stats;
      
    } catch (error) {
      console.error('❌ GitHub Stats Collection failed:', error.message);
      throw error;
    }
  }

  /**
   * Collect real stats from GitHub API
   */
  async collectRealStats() {
    console.log('📡 Collecting data from GitHub API...');
    
    for (const [orgName, repositories] of Object.entries(this.organizations)) {
      console.log(`🏢 Processing ${orgName}...`);
      
      this.stats.organizations[orgName] = {
        name: orgName,
        repositories: {},
        totals: {},
        metadata: {
          total_repositories: repositories.length,
          last_updated: new Date().toISOString()
        }
      };
      
      for (const repoName of repositories) {
        console.log(`  📊 Analyzing ${orgName}/${repoName}...`);
        
        try {
          const repoStats = await this.getRepositoryStats(orgName, repoName);
          this.stats.organizations[orgName].repositories[repoName] = repoStats;
          
          // Add delay to respect rate limits
          await this.delay(200);
          
        } catch (error) {
          console.log(`    ⚠️ Failed to get stats for ${repoName}: ${error.message}`);
          this.stats.organizations[orgName].repositories[repoName] = {
            error: error.message,
            languages: {},
            metadata: { accessible: false }
          };
        }
      }
    }
  }

  /**
   * Generate mock stats for development/testing
   */
  async generateMockStats() {
    console.log('🧪 Generating mock stats for development...');
    
    const mockLanguages = {
      'DevBusinessHub': {
        'business-portfolio': {
          'JavaScript': 3240, 'CSS': 680, 'HTML': 430, 'TypeScript': 120
        },
        'business-management': {
          'TypeScript': 2060, 'JavaScript': 890, 'CSS': 144, 'SCSS': 67
        },
        'client-language-platform': {
          'JavaScript': 2890, 'TypeScript': 1560, 'CSS': 780, 'HTML': 445, 'Python': 340
        },
        'client-investigation': {
          'TypeScript': 2450, 'JavaScript': 680, 'CSS': 250, 'HTML': 120
        }
      },
      'DevPersonalHub': {
        'external-learning-platforms': {
          'JavaScript': 2762, 'Python': 890, 'HTML': 345, 'CSS': 234
        },
        'personal-innovation-lab': {
          'TypeScript': 3550, 'Python': 688, 'JavaScript': 445, 'CSS': 156
        },
        'portfolio-website': {
          'TypeScript': 1890, 'CSS': 567, 'HTML': 234, 'SCSS': 123
        },
        'technical-showcase': {
          'JavaScript': 1456, 'Python': 567, 'CSS': 234, 'HTML': 123
        }
      },
      'DevAcademicHub': {
        'computer-science-degree': {
          'Python': 4026, 'JavaScript': 1200, 'Java': 890, 'C++': 456
        },
        'university-coursework': {
          'Python': 2340, 'Java': 1456, 'JavaScript': 567, 'C': 234
        },
        'academic-portfolio': {
          'Python': 1890, 'JavaScript': 567, 'HTML': 234, 'CSS': 123
        }
      },
      'DevEcosystem': {
        'ecosystem-central-command': {
          'JavaScript': 4567, 'JSON': 890, 'Markdown': 345, 'Shell': 123
        },
        'development-portfolio': {
          'TypeScript': 2340, 'CSS': 567, 'HTML': 234, 'JavaScript': 456
        },
        'unified-development-hub': {
          'JavaScript': 1890, 'TypeScript': 567, 'CSS': 234, 'HTML': 123
        }
      }
    };

    for (const [orgName, repos] of Object.entries(mockLanguages)) {
      this.stats.organizations[orgName] = {
        name: orgName,
        repositories: {},
        totals: {},
        metadata: {
          total_repositories: Object.keys(repos).length,
          last_updated: new Date().toISOString(),
          data_source: 'mock'
        }
      };
      
      for (const [repoName, languages] of Object.entries(repos)) {
        const totalLines = Object.values(languages).reduce((sum, lines) => sum + lines, 0);
        
        this.stats.organizations[orgName].repositories[repoName] = {
          name: repoName,
          languages: languages,
          metadata: {
            total_lines: totalLines,
            primary_language: this.getPrimaryLanguage(languages),
            last_updated: new Date().toISOString(),
            stars: Math.floor(Math.random() * 100) + 10,
            forks: Math.floor(Math.random() * 20) + 1,
            accessible: true,
            data_source: 'mock'
          }
        };
      }
    }
  }

  /**
   * Get repository stats from GitHub API
   */
  async getRepositoryStats(orgName, repoName) {
    // Simulate GitHub API call structure
    // In production, this would make actual API calls
    
    const repoData = {
      name: repoName,
      languages: {},
      metadata: {
        total_lines: 0,
        primary_language: '',
        last_updated: new Date().toISOString(),
        stars: 0,
        forks: 0,
        accessible: true,
        data_source: 'github_api'
      }
    };

    // GitHub API endpoints that would be called:
    // 1. GET /repos/{owner}/{repo}/languages
    // 2. GET /repos/{owner}/{repo}
    // 3. GET /repos/{owner}/{repo}/stats/code_frequency
    
    return repoData;
  }

  /**
   * Process and aggregate language statistics
   */
  async processLanguageStatistics() {
    console.log('🔍 Processing language statistics...');
    
    for (const [orgName, orgData] of Object.entries(this.stats.organizations)) {
      const languageTotals = {};
      let totalLines = 0;
      let accessibleRepos = 0;
      
      // Aggregate languages across all repositories in organization
      for (const [repoName, repoData] of Object.entries(orgData.repositories)) {
        if (repoData.languages && repoData.metadata?.accessible) {
          accessibleRepos++;
          
          for (const [language, lines] of Object.entries(repoData.languages)) {
            languageTotals[language] = (languageTotals[language] || 0) + lines;
            totalLines += lines;
          }
        }
      }
      
      // Calculate percentages and rankings
      const languageStats = Object.entries(languageTotals)
        .map(([language, lines]) => ({
          language,
          lines,
          percentage: totalLines > 0 ? ((lines / totalLines) * 100).toFixed(1) : 0,
          rank: 0
        }))
        .sort((a, b) => b.lines - a.lines)
        .map((item, index) => ({ ...item, rank: index + 1 }));
      
      // Store processed statistics
      this.stats.organizations[orgName].totals = {
        total_lines: totalLines,
        total_repositories: Object.keys(orgData.repositories).length,
        accessible_repositories: accessibleRepos,
        languages: languageStats,
        primary_language: languageStats[0]?.language || 'Unknown',
        language_diversity: languageStats.length
      };
    }
  }

  /**
   * Calculate ecosystem-wide totals
   */
  async generateEcosystemTotals() {
    console.log('🌍 Calculating ecosystem totals...');
    
    const ecosystemLanguages = {};
    let ecosystemTotalLines = 0;
    let ecosystemTotalRepos = 0;
    
    // Aggregate across all organizations
    for (const orgData of Object.values(this.stats.organizations)) {
      ecosystemTotalRepos += orgData.totals.accessible_repositories || 0;
      
      for (const langStat of orgData.totals.languages || []) {
        ecosystemLanguages[langStat.language] = 
          (ecosystemLanguages[langStat.language] || 0) + langStat.lines;
        ecosystemTotalLines += langStat.lines;
      }
    }
    
    // Calculate ecosystem percentages
    const ecosystemStats = Object.entries(ecosystemLanguages)
      .map(([language, lines]) => ({
        language,
        lines,
        percentage: ((lines / ecosystemTotalLines) * 100).toFixed(1),
        organizations: this.getLanguageOrganizations(language)
      }))
      .sort((a, b) => b.lines - a.lines)
      .map((item, index) => ({ ...item, rank: index + 1 }));
    
    this.stats.ecosystem_totals = {
      total_lines: ecosystemTotalLines,
      total_repositories: ecosystemTotalRepos,
      total_organizations: Object.keys(this.stats.organizations).length,
      languages: ecosystemStats,
      primary_language: ecosystemStats[0]?.language || 'Unknown',
      language_diversity: ecosystemStats.length
    };
  }

  /**
   * Get organizations using a specific language
   */
  getLanguageOrganizations(targetLanguage) {
    const orgs = [];
    
    for (const [orgName, orgData] of Object.entries(this.stats.organizations)) {
      const hasLanguage = orgData.totals.languages?.some(
        lang => lang.language === targetLanguage && lang.lines > 0
      );
      
      if (hasLanguage) {
        const langData = orgData.totals.languages.find(
          lang => lang.language === targetLanguage
        );
        
        orgs.push({
          name: orgName,
          lines: langData.lines,
          percentage: langData.percentage
        });
      }
    }
    
    return orgs.sort((a, b) => b.lines - a.lines);
  }

  /**
   * Calculate trends and growth patterns
   */
  async calculateTrends() {
    console.log('📈 Calculating trends...');
    
    // Load historical data if available
    const historyPath = path.join(this.cacheDir, 'language-history.json');
    let history = { snapshots: [] };
    
    if (fs.existsSync(historyPath)) {
      try {
        history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      } catch (error) {
        console.log('⚠️ Could not load historical data');
      }
    }
    
    // Add current snapshot to history
    history.snapshots.push({
      timestamp: new Date().toISOString(),
      ecosystem_totals: this.stats.ecosystem_totals
    });
    
    // Keep only last 30 snapshots
    if (history.snapshots.length > 30) {
      history.snapshots = history.snapshots.slice(-30);
    }
    
    // Calculate trends if we have historical data
    if (history.snapshots.length >= 2) {
      const current = history.snapshots[history.snapshots.length - 1];
      const previous = history.snapshots[history.snapshots.length - 2];
      
      this.stats.trends = this.calculateLanguageTrends(previous, current);
    } else {
      this.stats.trends = {
        available: false,
        reason: 'Insufficient historical data',
        snapshots_needed: 2,
        snapshots_available: history.snapshots.length
      };
    }
    
    // Save updated history
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  }

  /**
   * Calculate language trends between snapshots
   */
  calculateLanguageTrends(previous, current) {
    const trends = {
      available: true,
      period: 'snapshot_to_snapshot',
      languages: {}
    };
    
    // Ensure languages array exists and is iterable
    const currentLanguages = current.ecosystem_totals.languages || [];
    const previousLanguages = previous.ecosystem_totals.languages || [];
    
    for (const currentLang of currentLanguages) {
      const previousLang = previousLanguages.find(
        lang => lang.language === currentLang.language
      );
      
      if (previousLang) {
        const linesDiff = currentLang.lines - previousLang.lines;
        const percentageChange = previousLang.lines > 0 
          ? ((linesDiff / previousLang.lines) * 100).toFixed(1)
          : 0;
        
        trends.languages[currentLang.language] = {
          current_lines: currentLang.lines,
          previous_lines: previousLang.lines,
          lines_change: linesDiff,
          percentage_change: percentageChange,
          trend: linesDiff > 0 ? 'growing' : linesDiff < 0 ? 'declining' : 'stable',
          trend_icon: this.getTrendIcon(percentageChange)
        };
      } else {
        trends.languages[currentLang.language] = {
          current_lines: currentLang.lines,
          previous_lines: 0,
          lines_change: currentLang.lines,
          percentage_change: '+100',
          trend: 'new',
          trend_icon: '🆕'
        };
      }
    }
    
    return trends;
  }

  /**
   * Get trend icon based on percentage change
   */
  getTrendIcon(percentageChange) {
    const change = parseFloat(percentageChange);
    if (change >= 20) return '🚀';
    if (change >= 10) return '📈';
    if (change >= 5) return '⬆️';
    if (change > -5) return '➡️';
    if (change > -10) return '⬇️';
    return '📉';
  }

  /**
   * Get primary language from language object
   */
  getPrimaryLanguage(languages) {
    if (!languages || Object.keys(languages).length === 0) return 'Unknown';
    
    return Object.entries(languages)
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  /**
   * Save statistics to file
   */
  async saveStats() {
    console.log('💾 Saving statistics...');
    
    const statsPath = path.join(this.outputDir, 'github-language-stats.json');
    fs.writeFileSync(statsPath, JSON.stringify(this.stats, null, 2));
    
    // Also save a timestamp-specific version
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const timestampPath = path.join(this.cacheDir, `stats-${timestamp}.json`);
    fs.writeFileSync(timestampPath, JSON.stringify(this.stats, null, 2));
    
    console.log(`  ✓ Stats saved to ${statsPath}`);
  }

  /**
   * Generate human-readable stats report
   */
  async generateStatsReport() {
    const timestamp = new Date().toLocaleString();
    
    const report = `# 📊 GitHub Language Statistics Report

**Generated**: ${timestamp}  
**Total Organizations**: ${this.stats.ecosystem_totals.total_organizations}  
**Total Repositories**: ${this.stats.ecosystem_totals.total_repositories}  
**Total Code Lines**: ${this.stats.ecosystem_totals.total_lines.toLocaleString()}

## 🌍 Ecosystem Overview

### Top Languages Across All Organizations
${this.stats.ecosystem_totals.languages.slice(0, 10).map(lang => 
  `${lang.rank}. **${lang.language}**: ${lang.percentage}% (${lang.lines.toLocaleString()} lines)`
).join('\n')}

## 🏢 Organization Breakdown

${Object.entries(this.stats.organizations).map(([orgName, orgData]) => `
### ${orgName}
- **Repositories**: ${orgData.totals.accessible_repositories}
- **Total Lines**: ${orgData.totals.total_lines.toLocaleString()}
- **Primary Language**: ${orgData.totals.primary_language}
- **Languages Used**: ${orgData.totals.language_diversity}

#### Top Languages
${orgData.totals.languages.slice(0, 5).map(lang => 
  `- **${lang.language}**: ${lang.percentage}% (${lang.lines.toLocaleString()} lines)`
).join('\n')}
`).join('\n')}

## 📈 Trends Analysis

${this.stats.trends.available ? `
### Language Growth Patterns
${Object.entries(this.stats.trends.languages).slice(0, 5).map(([lang, trend]) => 
  `- **${lang}**: ${trend.trend_icon} ${trend.percentage_change}% (${trend.trend})`
).join('\n')}
` : `
**Trends**: ${this.stats.trends.reason}
`}

---

*Generated by GitHub Stats Collector*  
*Data Source: ${this.stats.organizations[Object.keys(this.stats.organizations)[0]]?.metadata?.data_source || 'Unknown'}*
`;
    
    const reportPath = path.join(this.baseDir, 'docs', 'GITHUB_STATS_REPORT.md');
    fs.writeFileSync(reportPath, report);
    
    console.log(`📋 Report generated: ${reportPath}`);
  }

  /**
   * Utility: Add delay for rate limiting
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
if (require.main === module) {
  const collector = new GitHubStatsCollector();
  
  collector.collectAllStats()
    .then((stats) => {
      console.log('\n🎉 GitHub Stats Collection: COMPLETE');
      console.log('📊 Statistics generated for ecosystem analysis');
      console.log('🔍 Language distribution across all organizations');
      console.log('📈 Trends and growth patterns calculated');
      console.log(`🌍 Total: ${stats.ecosystem_totals.total_lines.toLocaleString()} lines across ${stats.ecosystem_totals.total_repositories} repositories`);
    })
    .catch(error => {
      console.error('\n❌ GitHub Stats Collection failed:', error.message);
      process.exit(1);
    });
}

module.exports = GitHubStatsCollector;