#!/usr/bin/env node

/**
 * Repository README Deployer
 * Deploys generated README files to actual repositories using GitHub API
 */

const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

class RepositoryReadmeDeployer {
  constructor() {
    this.baseDir = path.dirname(__dirname);
    this.generatedDir = path.join(this.baseDir, 'generated-readmes');
    this.ecosystemConfigPath = path.join(this.baseDir, 'docs', 'ecosystem-config.json');
    
    // Initialize GitHub API
    this.github = new Octokit({
      auth: process.env.GITHUB_TOKEN || process.env.PERSONAL_GITHUB_TOKEN
    });
    
    this.isRealMode = !!(process.env.GITHUB_TOKEN || process.env.PERSONAL_GITHUB_TOKEN);
    
    if (!this.isRealMode) {
      console.log('⚠️ No GitHub token found. Running in preview mode.');
      console.log('Set GITHUB_TOKEN or PERSONAL_GITHUB_TOKEN to enable actual repository updates.');
    } else {
      console.log('🔗 GitHub API Mode: Real repository updates enabled');
    }
  }

  /**
   * Deploy all generated README files to their respective repositories
   */
  async deployAllReadmes() {
    try {
      console.log('🚀 Starting README Deployment Process...');
      
      // Load ecosystem configuration
      const ecosystemConfig = await this.loadEcosystemConfig();
      
      // Get all generated README files
      const generatedReadmes = await this.scanGeneratedReadmes();
      
      if (generatedReadmes.length === 0) {
        console.log('📄 No generated README files found. Run ecosystem:readme first.');
        return { deployed: 0, skipped: 0, errors: 0 };
      }

      const results = {
        deployed: 0,
        skipped: 0,
        errors: 0,
        details: []
      };

      // Deploy each README file
      for (const readmeFile of generatedReadmes) {
        try {
          const result = await this.deployReadmeFile(readmeFile, ecosystemConfig);
          
          if (result.success) {
            results.deployed++;
            console.log(`  ✅ Deployed ${result.repository}`);
          } else {
            results.skipped++;
            console.log(`  ⏭️ Skipped ${result.repository}: ${result.reason}`);
          }
          
          results.details.push(result);
          
        } catch (error) {
          results.errors++;
          console.log(`  ❌ Error deploying ${readmeFile}: ${error.message}`);
          results.details.push({
            repository: readmeFile,
            success: false,
            error: error.message
          });
        }
      }

      // Generate deployment report
      await this.generateDeploymentReport(results);

      console.log(`\n📊 Deployment Summary:`);
      console.log(`  ✅ Deployed: ${results.deployed}`);
      console.log(`  ⏭️ Skipped: ${results.skipped}`);
      console.log(`  ❌ Errors: ${results.errors}`);

      return results;
      
    } catch (error) {
      console.error('❌ README Deployment failed:', error.message);
      throw error;
    }
  }

  /**
   * Load ecosystem configuration
   */
  async loadEcosystemConfig() {
    if (!fs.existsSync(this.ecosystemConfigPath)) {
      throw new Error('Ecosystem configuration not found. Run ecosystem:discover first.');
    }

    const configData = fs.readFileSync(this.ecosystemConfigPath, 'utf8');
    return JSON.parse(configData);
  }

  /**
   * Scan for generated README files
   */
  async scanGeneratedReadmes() {
    if (!fs.existsSync(this.generatedDir)) {
      return [];
    }

    const files = fs.readdirSync(this.generatedDir);
    return files
      .filter(file => file.endsWith('-README.md'))
      .map(file => file.replace('-README.md', ''));
  }

  /**
   * Deploy individual README file to its repository
   */
  async deployReadmeFile(repoName, ecosystemConfig) {
    const readmeFilePath = path.join(this.generatedDir, `${repoName}-README.md`);
    
    if (!fs.existsSync(readmeFilePath)) {
      return {
        repository: repoName,
        success: false,
        reason: 'Generated README file not found'
      };
    }

    // Find repository organization
    const orgName = this.findRepositoryOrganization(repoName, ecosystemConfig);
    
    if (!orgName) {
      return {
        repository: repoName,
        success: false,
        reason: 'Repository organization not found'
      };
    }

    const readmeContent = fs.readFileSync(readmeFilePath, 'utf8');

    if (!this.isRealMode) {
      return {
        repository: `${orgName}/${repoName}`,
        success: false,
        reason: 'Preview mode - no GitHub token available',
        content_length: readmeContent.length
      };
    }

    try {
      // Get current README.md file (if exists)
      let existingFile = null;
      try {
        const { data } = await this.github.rest.repos.getContent({
          owner: orgName,
          repo: repoName,
          path: 'README.md'
        });
        existingFile = data;
      } catch (error) {
        // README.md doesn't exist yet
        console.log(`    📝 Creating new README.md for ${orgName}/${repoName}`);
      }

      // Update or create README.md
      const commitMessage = existingFile 
        ? 'Auto-update README with ecosystem statistics\n\n🤖 Generated with Claude Code'
        : 'Initialize README with ecosystem integration\n\n🤖 Generated with Claude Code';

      const updateParams = {
        owner: orgName,
        repo: repoName,
        path: 'README.md',
        message: commitMessage,
        content: Buffer.from(readmeContent).toString('base64')
      };

      if (existingFile) {
        updateParams.sha = existingFile.sha;
      }

      await this.github.rest.repos.createOrUpdateFileContents(updateParams);

      return {
        repository: `${orgName}/${repoName}`,
        success: true,
        operation: existingFile ? 'updated' : 'created',
        commit_message: commitMessage
      };

    } catch (error) {
      if (error.status === 404) {
        return {
          repository: `${orgName}/${repoName}`,
          success: false,
          reason: 'Repository not found or no access'
        };
      }
      
      throw error;
    }
  }

  /**
   * Find which organization a repository belongs to
   */
  findRepositoryOrganization(repoName, ecosystemConfig) {
    for (const [orgName, orgData] of Object.entries(ecosystemConfig.organizations)) {
      if (orgData.repositories && orgData.repositories.includes(repoName)) {
        return orgName;
      }
    }
    return null;
  }

  /**
   * Generate deployment report
   */
  async generateDeploymentReport(results) {
    const timestamp = new Date().toISOString();
    
    const report = `# 🚀 README Deployment Report

## 📅 Deployment Summary
**Date**: ${new Date().toLocaleString()}  
**Mode**: ${this.isRealMode ? '🔗 Real Deployment' : '🧪 Preview Mode'}  
**Total Operations**: ${results.deployed + results.skipped + results.errors}

### 📊 Results
- ✅ **Deployed**: ${results.deployed}
- ⏭️ **Skipped**: ${results.skipped}
- ❌ **Errors**: ${results.errors}

## 📋 Detailed Results

${results.details.map(detail => {
  const status = detail.success ? '✅' : (detail.error ? '❌' : '⏭️');
  const reason = detail.error || detail.reason || detail.operation || 'Success';
  return `### ${status} ${detail.repository}
**Status**: ${reason}  
${detail.commit_message ? `**Commit**: ${detail.commit_message}` : ''}  
${detail.content_length ? `**Content**: ${detail.content_length} characters` : ''}
`;
}).join('\n')}

---

*Deployment Report Generated: ${timestamp}*  
*Mode: ${this.isRealMode ? 'Real GitHub API Deployment' : 'Preview Mode (No Token)'}*
`;

    const reportPath = path.join(this.baseDir, 'README_DEPLOYMENT_REPORT.md');
    fs.writeFileSync(reportPath, report, 'utf8');
    
    console.log(`  📄 Deployment report saved: ${reportPath}`);
  }

  /**
   * Preview mode - show what would be deployed
   */
  async previewDeployment() {
    console.log('🔍 README Deployment Preview...');
    
    const generatedReadmes = await this.scanGeneratedReadmes();
    const ecosystemConfig = await this.loadEcosystemConfig();

    if (generatedReadmes.length === 0) {
      console.log('📄 No generated README files found.');
      return;
    }

    console.log(`\n📋 Found ${generatedReadmes.length} generated README files:`);
    
    for (const repoName of generatedReadmes) {
      const orgName = this.findRepositoryOrganization(repoName, ecosystemConfig);
      const readmeFilePath = path.join(this.generatedDir, `${repoName}-README.md`);
      
      if (fs.existsSync(readmeFilePath)) {
        const content = fs.readFileSync(readmeFilePath, 'utf8');
        const lines = content.split('\n').length;
        
        console.log(`  📄 ${orgName}/${repoName} (${lines} lines, ${content.length} chars)`);
      }
    }

    console.log(`\n💡 To deploy these README files to actual repositories:`);
    console.log(`   1. Set GITHUB_TOKEN or PERSONAL_GITHUB_TOKEN environment variable`);
    console.log(`   2. Run: npm run ecosystem:deploy-readmes`);
  }
}

// CLI execution
if (require.main === module) {
  const deployer = new RepositoryReadmeDeployer();
  
  const command = process.argv[2];
  
  if (command === 'preview') {
    deployer.previewDeployment()
      .then(() => console.log('\n🔍 Preview completed'))
      .catch(error => {
        console.error('❌ Preview failed:', error.message);
        process.exit(1);
      });
  } else {
    deployer.deployAllReadmes()
      .then(results => {
        if (results.deployed > 0) {
          console.log('\n🎉 README Deployment: COMPLETE');
          console.log('📊 Repository README files successfully updated');
        } else if (!deployer.isRealMode) {
          console.log('\n🔍 Preview Mode: Set GitHub token to enable real deployment');
        } else {
          console.log('\n⚠️ No README files were deployed');
        }
      })
      .catch(error => {
        console.error('\n❌ README Deployment failed:', error.message);
        process.exit(1);
      });
  }
}

module.exports = RepositoryReadmeDeployer;