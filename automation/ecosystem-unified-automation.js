#!/usr/bin/env node

/**
 * Ecosystem Unified Automation
 * Orchestrates all automation tasks across the ecosystem
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class EcosystemUnifiedAutomation {
  constructor() {
    this.baseDir = path.dirname(__dirname);
    this.automationDir = path.join(this.baseDir, 'automation');
    
    // Define automation tasks in order of execution
    this.tasks = [
      {
        name: 'GitHub Stats Collection',
        script: 'github-stats-collector.js',
        description: 'Collect repository statistics from GitHub API'
      },
      {
        name: 'Metrics Collection',
        script: 'metrics-collector.js',
        description: 'Aggregate metrics across the ecosystem'
      },
      {
        name: 'GitHub API Integration',
        script: 'github-api-integration.js',
        description: 'Update external repository integrations'
      },
      {
        name: 'Portfolio Generation',
        script: 'portfolio-generator.js',
        description: 'Generate unified portfolio documentation'
      }
    ];
    
    this.results = {
      timestamp: new Date().toISOString(),
      tasks: [],
      summary: {
        total: 0,
        successful: 0,
        failed: 0,
        skipped: 0
      }
    };
  }

  async run() {
    console.log('🤖 Starting Ecosystem Unified Automation');
    console.log('=' .repeat(50));
    console.log(`Timestamp: ${this.results.timestamp}`);
    console.log('=' .repeat(50));
    
    for (const task of this.tasks) {
      await this.runTask(task);
    }
    
    this.printSummary();
    this.saveResults();
  }

  async runTask(task) {
    const taskResult = {
      name: task.name,
      script: task.script,
      status: 'pending',
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0,
      output: '',
      error: null
    };
    
    console.log(`\n📋 Task: ${task.name}`);
    console.log(`   Script: ${task.script}`);
    console.log(`   ${task.description}`);
    
    const scriptPath = path.join(this.automationDir, task.script);
    
    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      console.log(`   ⚠️ Script not found, skipping...`);
      taskResult.status = 'skipped';
      taskResult.error = 'Script file not found';
      this.results.tasks.push(taskResult);
      this.results.summary.skipped++;
      return;
    }
    
    try {
      const startTime = Date.now();
      console.log(`   ⏳ Running...`);
      
      // Execute the script
      const output = execSync(`node "${scriptPath}"`, {
        cwd: this.baseDir,
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env }
      });
      
      const endTime = Date.now();
      taskResult.endTime = new Date().toISOString();
      taskResult.duration = endTime - startTime;
      taskResult.status = 'success';
      taskResult.output = output.trim();
      
      console.log(`   ✅ Completed in ${taskResult.duration}ms`);
      this.results.summary.successful++;
      
    } catch (error) {
      taskResult.status = 'failed';
      taskResult.error = error.message;
      taskResult.endTime = new Date().toISOString();
      
      console.log(`   ❌ Failed: ${error.message}`);
      this.results.summary.failed++;
    }
    
    this.results.tasks.push(taskResult);
    this.results.summary.total++;
  }

  printSummary() {
    console.log('\n' + '=' .repeat(50));
    console.log('📊 Automation Summary');
    console.log('=' .repeat(50));
    console.log(`Total Tasks: ${this.results.summary.total}`);
    console.log(`✅ Successful: ${this.results.summary.successful}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    console.log(`⚠️  Skipped: ${this.results.summary.skipped}`);
    
    if (this.results.summary.failed > 0) {
      console.log('\n❌ Failed Tasks:');
      this.results.tasks
        .filter(t => t.status === 'failed')
        .forEach(t => {
          console.log(`   - ${t.name}: ${t.error}`);
        });
    }
    
    if (this.results.summary.skipped > 0) {
      console.log('\n⚠️ Skipped Tasks:');
      this.results.tasks
        .filter(t => t.status === 'skipped')
        .forEach(t => {
          console.log(`   - ${t.name}: ${t.error}`);
        });
    }
  }

  saveResults() {
    // Save detailed results
    const resultsFile = path.join(this.baseDir, 'docs', 'analytics', 'automation-results.json');
    const resultsDir = path.dirname(resultsFile);
    
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    fs.writeFileSync(
      resultsFile,
      JSON.stringify(this.results, null, 2),
      'utf8'
    );
    
    console.log(`\n💾 Results saved to: ${resultsFile}`);
    
    // Update automation summary
    this.updateAutomationSummary();
  }

  updateAutomationSummary() {
    const summaryFile = path.join(this.baseDir, 'AUTOMATION_SUMMARY.md');
    
    if (fs.existsSync(summaryFile)) {
      try {
        let content = fs.readFileSync(summaryFile, 'utf8');
        
        // Update last updated timestamp
        content = content.replace(
          /Last Updated: .*/,
          `Last Updated: ${this.results.timestamp}`
        );
        
        // Add automation run status if not present
        if (!content.includes('## Last Automation Run')) {
          const statusSection = `
## Last Automation Run

- **Status**: ${this.results.summary.failed === 0 ? '✅ Success' : '⚠️ Completed with errors'}
- **Tasks Run**: ${this.results.summary.total}
- **Successful**: ${this.results.summary.successful}
- **Failed**: ${this.results.summary.failed}
- **Duration**: ${this.calculateTotalDuration()}ms
`;
          
          // Insert after the title
          const lines = content.split('\n');
          lines.splice(3, 0, statusSection);
          content = lines.join('\n');
        }
        
        fs.writeFileSync(summaryFile, content, 'utf8');
        console.log('✅ Updated AUTOMATION_SUMMARY.md');
        
      } catch (error) {
        console.warn('⚠️ Could not update AUTOMATION_SUMMARY.md:', error.message);
      }
    }
  }

  calculateTotalDuration() {
    return this.results.tasks.reduce((total, task) => total + (task.duration || 0), 0);
  }
}

// Run if called directly
if (require.main === module) {
  const automation = new EcosystemUnifiedAutomation();
  automation.run().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = EcosystemUnifiedAutomation;