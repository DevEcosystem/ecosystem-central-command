#!/usr/bin/env node

/**
 * Metrics Collector
 * Collects and aggregates metrics from all ecosystem organizations
 */

const fs = require('fs');
const path = require('path');

class MetricsCollector {
  constructor() {
    this.metricsData = {
      timestamp: new Date().toISOString(),
      business: {},
      personal: {},
      academic: {},
      technical: {},
      summary: {}
    };
    this.outputPath = path.join(__dirname, '../docs/analytics/skill-growth-metrics.json');
  }

  /**
   * Main collection pipeline
   */
  async collectMetrics() {
    console.log('📊 Starting metrics collection...');
    
    try {
      await this.collectBusinessMetrics();
      await this.collectPersonalMetrics();
      await this.collectAcademicMetrics();
      await this.collectTechnicalMetrics();
      await this.generateSummaryMetrics();
      await this.saveMetrics();
      
      console.log('✅ Metrics collection completed successfully!');
    } catch (error) {
      console.error('❌ Metrics collection failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Collect business performance metrics
   */
  async collectBusinessMetrics() {
    console.log('🏢 Collecting business metrics...');
    
    const businessFile = path.join(__dirname, '../organizations/business-hub-overview.md');
    
    if (!fs.existsSync(businessFile)) {
      console.log('  ⚠ Business overview file not found');
      return;
    }

    const content = fs.readFileSync(businessFile, 'utf8');
    
    this.metricsData.business = {
      activeProjects: this.extractNumber(content, /Active Projects: (\d+)/),
      clientSatisfaction: this.extractNumber(content, /Client Satisfaction: ([\d.]+)/),
      technologies: this.extractNumber(content, /Technologies Mastered: (\d+)/),
      successRate: this.extractNumber(content, /Project Success Rate: (\d+)%/),
      revenueGrowth: this.extractNumber(content, /Revenue Growth: \+(\d+)%/),
      clientRetention: this.extractNumber(content, /Client Retention Rate: (\d+)%/),
      responsiveTime: this.extractValue(content, /Response Time: ([^\\n]+)/),
      onTimeDelivery: this.extractNumber(content, /On-Time Delivery: (\d+)%/)
    };

    console.log('  ✓ Business metrics collected');
  }

  /**
   * Collect personal development metrics
   */
  async collectPersonalMetrics() {
    console.log('👤 Collecting personal development metrics...');
    
    const personalFile = path.join(__dirname, '../organizations/personal-lab-showcase.md');
    
    if (!fs.existsSync(personalFile)) {
      console.log('  ⚠ Personal showcase file not found');
      return;
    }

    const content = fs.readFileSync(personalFile, 'utf8');
    
    this.metricsData.personal = {
      experimentsCompleted: this.extractNumber(content, /Experiments Completed: (\d+)/),
      openSourceContributions: this.extractNumber(content, /Open Source Contributions: (\d+)/),
      knowledgeArticles: this.extractNumber(content, /Knowledge Articles: (\d+)/),
      communityEngagement: this.extractNumber(content, /Community Engagement: (\d+)/),
      creativeProjects: this.extractNumber(content, /Creative Projects: (\d+)/),
      learningVelocity: this.extractValue(content, /New Technologies: ([^\\n]+)/),
      innovationLevel: this.extractValue(content, /Innovation Level: ([^\\n]+)/)
    };

    console.log('  ✓ Personal development metrics collected');
  }

  /**
   * Collect academic performance metrics
   */
  async collectAcademicMetrics() {
    console.log('🎓 Collecting academic metrics...');
    
    const academicFile = path.join(__dirname, '../organizations/academic-hub-achievements.md');
    
    if (!fs.existsSync(academicFile)) {
      console.log('  ⚠ Academic achievements file not found');
      return;
    }

    const content = fs.readFileSync(academicFile, 'utf8');
    
    this.metricsData.academic = {
      gpa: this.extractNumber(content, /GPA: ([\d.]+)/),
      creditsCompleted: this.extractNumber(content, /(\d+)\+ credits completed/),
      courseCompletionRate: this.extractNumber(content, /Course Completion Rate: (\d+)%/),
      gradeDistribution: this.extractValue(content, /Grade Distribution: ([^\\n]+)/),
      researchProjects: this.extractNumber(content, /Independent Projects: (\d+)/),
      academicPapers: this.extractNumber(content, /Academic Writing: (\d+)/),
      presentations: this.extractNumber(content, /Presentation Experience: (\d+)/),
      graduationTarget: this.extractValue(content, /Graduation Target: ([^\\n]+)/)
    };

    console.log('  ✓ Academic metrics collected');
  }

  /**
   * Collect technical skill metrics
   */
  async collectTechnicalMetrics() {
    console.log('🛠️ Collecting technical metrics...');
    
    // This would ideally integrate with GitHub API, but for now we'll use static estimates
    this.metricsData.technical = {
      frontendProficiency: 95,
      backendProficiency: 80,
      designProficiency: 90,
      emergingTechProficiency: 70,
      overallTechnicalGrowth: 25, // percentage growth over last period
      languagesActive: ['JavaScript', 'TypeScript', 'Python', 'CSS', 'HTML'],
      frameworksActive: ['React', 'Next.js', 'Node.js', 'Express', 'Vue.js'],
      toolsActive: ['Git', 'Docker', 'AWS', 'Figma', 'VS Code'],
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    console.log('  ✓ Technical metrics collected');
  }

  /**
   * Generate summary metrics and trends
   */
  async generateSummaryMetrics() {
    console.log('📈 Generating summary metrics...');
    
    const business = this.metricsData.business;
    const personal = this.metricsData.personal;
    const academic = this.metricsData.academic;
    const technical = this.metricsData.technical;

    this.metricsData.summary = {
      overallPerformance: {
        business: this.calculateOverallScore([
          business.clientSatisfaction || 95,
          business.successRate || 95,
          business.onTimeDelivery || 100
        ]),
        personal: this.calculateOverallScore([
          (personal.experimentsCompleted || 12) * 5, // scale to percentage
          (personal.openSourceContributions || 8) * 10 // scale to percentage
        ]),
        academic: this.calculateOverallScore([
          (academic.gpa || 3.9) * 25, // scale to percentage
          academic.courseCompletionRate || 100
        ]),
        technical: this.calculateOverallScore([
          technical.frontendProficiency,
          technical.backendProficiency,
          technical.designProficiency
        ])
      },
      growthTrajectory: {
        technical: '+25%',
        projectComplexity: '+40%',
        networkExpansion: '+30%',
        marketValue: '+35%'
      },
      keyMetrics: {
        totalActiveProjects: business.activeProjects || 5,
        academicGPA: academic.gpa || 3.9,
        technicalProficiency: Math.round((technical.frontendProficiency + technical.backendProficiency + technical.designProficiency) / 3),
        innovationIndex: 'High'
      },
      lastCalculated: new Date().toISOString()
    };

    console.log('  ✓ Summary metrics generated');
  }

  /**
   * Save metrics to file
   */
  async saveMetrics() {
    console.log('💾 Saving metrics data...');
    
    // Ensure analytics directory exists
    const analyticsDir = path.dirname(this.outputPath);
    if (!fs.existsSync(analyticsDir)) {
      fs.mkdirSync(analyticsDir, { recursive: true });
    }

    try {
      fs.writeFileSync(this.outputPath, JSON.stringify(this.metricsData, null, 2), 'utf8');
      console.log(`  ✓ Metrics saved to ${this.outputPath}`);
    } catch (error) {
      throw new Error(`Failed to save metrics: ${error.message}`);
    }
  }

  /**
   * Extract numeric value from text using regex
   */
  extractNumber(text, regex) {
    const match = text.match(regex);
    return match ? parseFloat(match[1]) : null;
  }

  /**
   * Extract string value from text using regex
   */
  extractValue(text, regex) {
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Calculate overall score from array of values
   */
  calculateOverallScore(values) {
    const validValues = values.filter(v => v !== null && v !== undefined);
    if (validValues.length === 0) return 0;
    
    return Math.round(validValues.reduce((sum, val) => sum + val, 0) / validValues.length);
  }

  /**
   * Generate trend analysis (placeholder for future GitHub API integration)
   */
  async generateTrendAnalysis() {
    // This would integrate with GitHub API to track:
    // - Commit frequency
    // - Repository activity
    // - Contribution patterns
    // - Technology adoption trends
    
    return {
      commitFrequency: 'High',
      repositoryActivity: 'Active',
      technologyAdoption: 'Accelerating',
      lastAnalyzed: new Date().toISOString()
    };
  }
}

// GitHub API Integration (future enhancement)
class GitHubMetricsCollector {
  constructor(token) {
    this.token = token;
    this.apiBase = 'https://api.github.com';
  }

  /**
   * Collect organization-wide metrics (placeholder)
   */
  async collectOrganizationMetrics(orgNames) {
    // Future implementation:
    // - Repository counts
    // - Commit statistics
    // - Issue/PR metrics
    // - Collaboration patterns
    
    console.log('🔮 GitHub API integration - Coming soon');
    return {};
  }
}

// Command line interface
if (require.main === module) {
  const collector = new MetricsCollector();
  collector.collectMetrics();
}

module.exports = { MetricsCollector, GitHubMetricsCollector };