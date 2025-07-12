#!/usr/bin/env node

const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

/**
 * Ecosystem Auto-Discovery System
 * Automatically discovers and integrates new repositories across all organizations
 */
class EcosystemAutoDiscovery {
  constructor() {
    this.baseDir = path.dirname(__dirname);
    this.configPath = path.join(this.baseDir, 'docs', 'ecosystem-config.json');
    
    // Initialize GitHub API
    this.github = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
    
    // Organization configuration
    this.organizations = [
      'DevEcosystem',
      'DevPersonalHub', 
      'DevAcademicHub',
      'DevBusinessHub'
    ];
    
    this.discoveredRepos = {};
    this.isRealMode = !!process.env.GITHUB_TOKEN;
    
    console.log(this.isRealMode ? 
      '🔗 GitHub API Mode: Real-time discovery enabled' : 
      '🧪 Mock Mode: Using development data');
  }

  /**
   * Run complete auto-discovery process
   */
  async runAutoDiscovery() {
    try {
      console.log('🚀 Starting Ecosystem Auto-Discovery...');
      console.log('=====================================');
      
      if (this.isRealMode) {
        await this.discoverAllRepositories();
      } else {
        await this.generateMockDiscovery();
      }
      
      await this.updateSystemConfiguration();
      await this.integrateDiscoveredRepositories();
      
      console.log('✅ Ecosystem Auto-Discovery completed successfully!');
      return this.discoveredRepos;
      
    } catch (error) {
      console.error('❌ Auto-Discovery failed:', error.message);
      throw error;
    }
  }

  /**
   * Discover repositories across all organizations using GitHub API
   */
  async discoverAllRepositories() {
    console.log('🔍 Discovering repositories across organizations...');
    
    for (const orgName of this.organizations) {
      console.log(`🏢 Scanning ${orgName}...`);
      
      try {
        const { data: repos } = await this.github.repos.listForOrg({
          org: orgName,
          type: 'all',
          sort: 'updated',
          per_page: 100
        });
        
        this.discoveredRepos[orgName] = repos.map(repo => ({
          name: repo.name,
          full_name: repo.full_name,
          private: repo.private,
          language: repo.language,
          description: repo.description,
          updated_at: repo.updated_at,
          size: repo.size,
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          topics: repo.topics || [],
          archived: repo.archived,
          disabled: repo.disabled
        }));
        
        console.log(`  ✓ Found ${repos.length} repositories in ${orgName}`);
        
      } catch (error) {
        console.warn(`  ⚠️ Failed to access ${orgName}: ${error.message}`);
        this.discoveredRepos[orgName] = [];
      }
    }
  }

  /**
   * Generate mock discovery data for development
   */
  async generateMockDiscovery() {
    console.log('🧪 Generating mock discovery data...');
    
    const mockData = {
      'DevBusinessHub': [
        {
          name: 'business-portfolio',
          full_name: 'DevBusinessHub/business-portfolio',
          private: true,
          language: 'JavaScript',
          description: 'Professional business portfolio and showcase',
          updated_at: new Date().toISOString(),
          size: 4470,
          stargazers_count: 15,
          forks_count: 11,
          topics: ['portfolio', 'business'],
          archived: false,
          disabled: false
        },
        {
          name: 'business-management',
          full_name: 'DevBusinessHub/business-management',
          private: true,
          language: 'TypeScript',
          description: 'Business operations and client management system',
          updated_at: new Date().toISOString(),
          size: 3161,
          stargazers_count: 82,
          forks_count: 2,
          topics: ['management', 'automation'],
          archived: false,
          disabled: false
        },
        {
          name: 'client-language-platform',
          full_name: 'DevBusinessHub/client-language-platform',
          private: true,
          language: 'JavaScript',
          description: 'Language learning platform - Client project',
          updated_at: new Date().toISOString(),
          size: 6015,
          stargazers_count: 62,
          forks_count: 3,
          topics: ['education', 'language-learning'],
          archived: false,
          disabled: false
        },
        {
          name: 'client-investigation',
          full_name: 'DevBusinessHub/client-investigation',
          private: true,
          language: 'TypeScript',
          description: 'Investigation and research project',
          updated_at: new Date().toISOString(),
          size: 3500,
          stargazers_count: 0,
          forks_count: 0,
          topics: ['research', 'investigation'],
          archived: false,
          disabled: false
        }
      ],
      'DevPersonalHub': [
        {
          name: 'external-learning-platforms',
          full_name: 'DevPersonalHub/external-learning-platforms',
          private: false,
          language: 'JavaScript',
          description: 'Comprehensive external learning journey',
          updated_at: new Date().toISOString(),
          size: 4231,
          stargazers_count: 61,
          forks_count: 10,
          topics: ['learning', 'education'],
          archived: false,
          disabled: false
        },
        {
          name: 'personal-innovation-lab',
          full_name: 'DevPersonalHub/personal-innovation-lab',
          private: false,
          language: 'TypeScript',
          description: 'Personal innovation and experimentation space',
          updated_at: new Date().toISOString(),
          size: 4839,
          stargazers_count: 45,
          forks_count: 3,
          topics: ['innovation', 'experiments'],
          archived: false,
          disabled: false
        },
        {
          name: 'portfolio-website',
          full_name: 'DevPersonalHub/portfolio-website',
          private: false,
          language: 'TypeScript',
          description: 'Personal portfolio and professional website',
          updated_at: new Date().toISOString(),
          size: 2814,
          stargazers_count: 52,
          forks_count: 5,
          topics: ['portfolio', 'website'],
          archived: false,
          disabled: false
        },
        {
          name: 'technical-showcase',
          full_name: 'DevPersonalHub/technical-showcase',
          private: false,
          language: 'JavaScript',
          description: 'Technical experiments and showcase projects',
          updated_at: new Date().toISOString(),
          size: 2380,
          stargazers_count: 85,
          forks_count: 5,
          topics: ['showcase', 'experiments'],
          archived: false,
          disabled: false
        }
      ],
      'DevAcademicHub': [
        {
          name: 'computer-science-degree',
          full_name: 'DevAcademicHub/computer-science-degree',
          private: false,
          language: 'Python',
          description: 'University of the People Computer Science coursework',
          updated_at: new Date().toISOString(),
          size: 6572,
          stargazers_count: 102,
          forks_count: 17,
          topics: ['education', 'computer-science'],
          archived: false,
          disabled: false
        },
        {
          name: 'university-coursework',
          full_name: 'DevAcademicHub/university-coursework',
          private: false,
          language: 'Python',
          description: 'Academic coursework and assignments',
          updated_at: new Date().toISOString(),
          size: 4597,
          stargazers_count: 21,
          forks_count: 12,
          topics: ['academic', 'coursework'],
          archived: false,
          disabled: false
        },
        {
          name: 'academic-portfolio',
          full_name: 'DevAcademicHub/academic-portfolio',
          private: false,
          language: 'Python',
          description: 'Academic achievements and research portfolio',
          updated_at: new Date().toISOString(),
          size: 2814,
          stargazers_count: 76,
          forks_count: 13,
          topics: ['academic', 'portfolio'],
          archived: false,
          disabled: false
        }
      ],
      'DevEcosystem': [
        {
          name: 'ecosystem-central-command',
          full_name: 'DevEcosystem/ecosystem-central-command',
          private: false,
          language: 'JavaScript',
          description: 'Central command center for development ecosystem',
          updated_at: new Date().toISOString(),
          size: 5925,
          stargazers_count: 86,
          forks_count: 6,
          topics: ['automation', 'ecosystem'],
          archived: false,
          disabled: false
        },
        {
          name: 'development-portfolio',
          full_name: 'DevEcosystem/development-portfolio',
          private: false,
          language: 'TypeScript',
          description: 'Comprehensive development portfolio showcase',
          updated_at: new Date().toISOString(),
          size: 3597,
          stargazers_count: 79,
          forks_count: 18,
          topics: ['portfolio', 'development'],
          archived: false,
          disabled: false
        },
        {
          name: 'unified-development-hub',
          full_name: 'DevEcosystem/unified-development-hub',
          private: false,
          language: 'JavaScript',
          description: 'Unified hub for development resources and tools',
          updated_at: new Date().toISOString(),
          size: 2814,
          stargazers_count: 101,
          forks_count: 11,
          topics: ['hub', 'development'],
          archived: false,
          disabled: false
        }
      ]
    };

    this.discoveredRepos = mockData;
    
    Object.entries(mockData).forEach(([orgName, repos]) => {
      console.log(`  ✓ Mock generated: ${repos.length} repositories in ${orgName}`);
    });
  }

  /**
   * Update system configuration with discovered repositories
   */
  async updateSystemConfiguration() {
    console.log('🔧 Updating system configuration...');
    
    const config = {
      last_discovery: new Date().toISOString(),
      discovery_mode: this.isRealMode ? 'real' : 'mock',
      organizations: {},
      totals: {
        total_organizations: 0,
        total_repositories: 0,
        total_active_repositories: 0
      }
    };

    let totalRepos = 0;
    let totalActiveRepos = 0;

    Object.entries(this.discoveredRepos).forEach(([orgName, repos]) => {
      const activeRepos = repos.filter(repo => !repo.archived && !repo.disabled);
      
      config.organizations[orgName] = {
        name: orgName,
        total_repositories: repos.length,
        active_repositories: activeRepos.length,
        repositories: repos.map(repo => repo.name),
        active_repository_names: activeRepos.map(repo => repo.name),
        primary_languages: this.extractPrimaryLanguages(repos),
        last_updated: new Date().toISOString()
      };

      totalRepos += repos.length;
      totalActiveRepos += activeRepos.length;
    });

    config.totals.total_organizations = Object.keys(this.discoveredRepos).length;
    config.totals.total_repositories = totalRepos;
    config.totals.total_active_repositories = totalActiveRepos;

    // Ensure docs directory exists
    const docsDir = path.dirname(this.configPath);
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // Save configuration
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    console.log(`  ✓ Configuration saved to ${this.configPath}`);
    
    return config;
  }

  /**
   * Extract primary languages from repositories
   */
  extractPrimaryLanguages(repos) {
    const languageCounts = {};
    
    repos.forEach(repo => {
      if (repo.language) {
        languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      }
    });

    return Object.entries(languageCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([language, count]) => ({ language, count }));
  }

  /**
   * Integrate discovered repositories into existing systems
   */
  async integrateDiscoveredRepositories() {
    console.log('🔗 Integrating discovered repositories...');
    
    // Update GitHub Stats Collector
    await this.updateGitHubStatsCollector();
    
    // Update Universal README Manager  
    await this.updateUniversalReadmeManager();
    
    console.log('  ✓ Integration completed successfully');
  }

  /**
   * Update GitHub Stats Collector with discovered repositories
   */
  async updateGitHubStatsCollector() {
    const statsCollectorPath = path.join(this.baseDir, 'automation', 'github-stats-collector.js');
    
    if (!fs.existsSync(statsCollectorPath)) {
      console.warn('  ⚠️ GitHub Stats Collector not found, skipping update');
      return;
    }

    const statsContent = fs.readFileSync(statsCollectorPath, 'utf8');
    
    // Extract organization configuration
    const orgConfig = {};
    Object.entries(this.discoveredRepos).forEach(([orgName, repos]) => {
      orgConfig[orgName] = repos
        .filter(repo => !repo.archived && !repo.disabled)
        .map(repo => repo.name);
    });

    // Generate new configuration string
    const newConfig = `    this.organizations = ${JSON.stringify(orgConfig, null, 6).replace(/^/gm, '    ')};`;
    
    // Replace existing configuration
    const updatedContent = statsContent.replace(
      /this\.organizations\s*=\s*{[\s\S]*?};/,
      newConfig
    );

    fs.writeFileSync(statsCollectorPath, updatedContent);
    console.log('  ✓ GitHub Stats Collector updated');
  }

  /**
   * Update Universal README Manager with discovered repositories
   */
  async updateUniversalReadmeManager() {
    console.log('  ✓ Universal README Manager integration ready');
    // README Manager will automatically use the updated stats collector
  }

  /**
   * Get repository summary
   */
  getRepositorySummary() {
    let totalRepos = 0;
    let totalActiveRepos = 0;
    
    Object.values(this.discoveredRepos).forEach(repos => {
      totalRepos += repos.length;
      totalActiveRepos += repos.filter(repo => !repo.archived && !repo.disabled).length;
    });

    return {
      total_organizations: Object.keys(this.discoveredRepos).length,
      total_repositories: totalRepos,
      total_active_repositories: totalActiveRepos,
      organizations: this.discoveredRepos
    };
  }
}

// CLI execution
if (require.main === module) {
  const discovery = new EcosystemAutoDiscovery();
  discovery.runAutoDiscovery()
    .then((repos) => {
      const summary = discovery.getRepositorySummary();
      console.log('\n🎉 Auto-Discovery Complete!');
      console.log(`📊 Discovered: ${summary.total_active_repositories} active repositories across ${summary.total_organizations} organizations`);
      console.log('🔄 System configuration updated');
      console.log('✅ Ready for complete automation');
    })
    .catch(error => {
      console.error('\n❌ Auto-Discovery failed:', error.message);
      process.exit(1);
    });
}

module.exports = EcosystemAutoDiscovery;