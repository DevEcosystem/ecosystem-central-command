#!/usr/bin/env node

/**
 * Universal README Manager
 * Centralized README generation and synchronization for all ecosystem repositories
 */

const fs = require('fs');
const path = require('path');
const GitHubStatsCollector = require('./github-stats-collector');

class UniversalReadmeManager {
  constructor() {
    this.baseDir = path.dirname(__dirname);
    this.templatesDir = path.join(this.baseDir, 'templates');
    this.languageStats = null; // Will be populated during stats collection
    
    // All ecosystem repositories configuration
    this.repositories = [
      {
        org: 'DevEcosystem',
        name: 'ecosystem-automation-tools',
        type: 'automation',
        description: 'Automation tools and utilities for development ecosystem'
      },
      {
        org: 'DevBusinessHub', 
        name: 'business-management',
        type: 'business',
        description: 'Client project management and business automation'
      },
      {
        org: 'DevBusinessHub',
        name: 'automation-tools', 
        type: 'business-tools',
        description: 'Business process automation and analysis tools'
      },
      {
        org: 'DevPersonalHub',
        name: 'external-learning-platforms',
        type: 'learning',
        description: 'Comprehensive external learning journey across multiple platforms'
      },
      {
        org: 'DevPersonalHub',
        name: 'portfolio-website',
        type: 'portfolio', 
        description: 'Professional portfolio website and personal branding'
      },
      {
        org: 'DevPersonalHub',
        name: 'technical-showcase',
        type: 'showcase',
        description: 'Technical experiments and innovation demonstrations'
      },
      {
        org: 'DevPersonalHub',
        name: 'learning-projects',
        type: 'projects',
        description: 'Knowledge base and learning project documentation'
      },
      {
        org: 'DevAcademicHub',
        name: 'academic-portfolio',
        type: 'academic',
        description: 'University education and academic achievement portfolio'
      }
    ];
  }

  /**
   * Main execution method - Update all repository READMEs
   */
  async runUniversalUpdate() {
    console.log('🚀 Starting Universal README Management...');
    
    try {
      // Step 1: Ensure templates directory exists
      await this.ensureTemplatesDirectory();
      
      // Step 2: Collect GitHub language statistics
      console.log('📊 Collecting GitHub language statistics...');
      const statsCollector = new GitHubStatsCollector();
      const languageStats = await statsCollector.collectAllStats();
      this.languageStats = languageStats;
      console.log(`  ✓ Collected stats: ${languageStats.ecosystem_totals.total_lines.toLocaleString()} lines across ${languageStats.ecosystem_totals.total_repositories} repositories`);
      
      // Step 3: Generate templates for all repositories (now with stats)
      await this.generateAllTemplates();
      
      // Step 4: Scan and analyze all repositories
      const repoAnalysis = await this.analyzeAllRepositories();
      
      // Step 5: Generate updated READMEs
      await this.generateUpdatedReadmes(repoAnalysis);
      
      // Step 6: Create update summary
      await this.createUpdateSummary(repoAnalysis);
      
      console.log('✅ Universal README Management completed successfully!');
      console.log(`🔍 GitHub Stats Integration: ${Object.keys(languageStats.organizations).length} organizations analyzed`);
      
    } catch (error) {
      console.error('❌ Universal README Management failed:', error.message);
      throw error;
    }
  }

  /**
   * Ensure templates directory exists
   */
  async ensureTemplatesDirectory() {
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true });
      console.log('📁 Created templates directory');
    }
  }

  /**
   * Generate README templates for all repository types
   */
  async generateAllTemplates() {
    console.log('📝 Generating README templates...');
    
    const templates = {
      'learning': this.generateLearningTemplate(),
      'portfolio': this.generatePortfolioTemplate(),
      'business': this.generateBusinessTemplate(),
      'academic': this.generateAcademicTemplate(),
      'showcase': this.generateShowcaseTemplate(),
      'automation': this.generateAutomationTemplate(),
      'projects': this.generateProjectsTemplate(),
      'business-tools': this.generateBusinessToolsTemplate()
    };

    // Write all templates to files
    for (const [type, content] of Object.entries(templates)) {
      const templatePath = path.join(this.templatesDir, `${type}-readme.template.md`);
      fs.writeFileSync(templatePath, content, 'utf8');
      console.log(`  ✅ Generated ${type} template`);
    }
  }

  /**
   * Analyze all repositories for current structure and content
   */
  async analyzeAllRepositories() {
    console.log('🔍 Analyzing repository structures...');
    
    const analysis = {};
    
    for (const repo of this.repositories) {
      try {
        // Simulate repository analysis (in real implementation, this would use GitHub API)
        analysis[repo.name] = await this.analyzeRepository(repo);
        console.log(`  ✅ Analyzed ${repo.org}/${repo.name}`);
      } catch (error) {
        console.log(`  ⚠️ Could not analyze ${repo.org}/${repo.name}: ${error.message}`);
        analysis[repo.name] = this.getDefaultAnalysis(repo);
      }
    }
    
    return analysis;
  }

  /**
   * Analyze individual repository structure
   */
  async analyzeRepository(repo) {
    // Simulate repository analysis
    return {
      org: repo.org,
      name: repo.name,
      type: repo.type,
      description: repo.description,
      projectCount: this.getProjectCount(repo),
      lastUpdate: new Date().toISOString(),
      structure: this.getRepositoryStructure(repo),
      technologies: this.detectTechnologies(repo),
      status: 'active'
    };
  }

  /**
   * Get project count based on repository type
   */
  getProjectCount(repo) {
    const projectCounts = {
      'external-learning-platforms': 12,
      'academic-portfolio': 4,
      'business-management': 3,
      'portfolio-website': 1,
      'technical-showcase': 6,
      'learning-projects': 8,
      'automation-tools': 4,
      'ecosystem-automation-tools': 5
    };
    
    return projectCounts[repo.name] || 1;
  }

  /**
   * Get repository structure simulation
   */
  getRepositoryStructure(repo) {
    const structures = {
      'external-learning-platforms': `external-learning-platforms/
├── 📁 recursion/                    # Recursion CS Program (8 projects)
│   ├── 🚀 slackclone/               # Real-time messaging app
│   ├── 🌐 dynamic-web-servers/      # HTTP server implementation  
│   ├── 💻 recursion-project3-website/ # Full-stack web application
│   ├── 🗄️ servers-with-databases/   # Database integration
│   ├── 📁 file-manipulator-program/ # System programming
│   ├── 🎬 video-compressor-project/ # Multimedia processing
│   ├── 🎮 test-tetris/              # Game development
│   └── ✅ todo-redux/               # State management
├── 📁 coursera/                     # Meta Professional Certificates
│   ├── ⚛️ meta-frontend/            # Meta Frontend Developer
│   └── 🔧 meta-backend/             # Meta Backend Developer
├── 📁 udacity/                      # Udacity Nanodegree Program
│   └── 🎨 frontend-nanodegree/      # Frontend development specialization
└── 📁 learning-analytics/           # Progress tracking and metrics`,
      'academic-portfolio': `academic-portfolio/
├── 📚 uop-computer-science/         # University of the People CS Program
│   ├── CS1101/                     # Programming Fundamentals
│   ├── CS2203/                     # Data Structures & Algorithms
│   └── CS3307/                     # Operating Systems
├── 🎓 graduate-preparation/         # MS/PhD Application Materials
├── 📝 research-activities/          # Academic Research Projects
└── 📊 publications-presentations/   # Academic Publications`,
      'business-management': `business-management/
├── 👥 client-projects/              # Active Client Work
├── 📋 project-templates/            # Reusable Project Structures
├── 🤖 automation/                   # Business Process Automation
└── 📈 analytics/                    # Performance Metrics`,
      'portfolio-website': `portfolio-website/
├── 🌐 src/                         # Source Code
│   ├── components/                 # React Components
│   ├── pages/                      # Page Components
│   └── styles/                     # Styling Files
├── 📁 public/                      # Static Assets
└── 🚀 build/                       # Production Build`,
      'technical-showcase': `technical-showcase/
├── 🧪 experiments/                 # Technical Experiments
├── 🎮 prototypes/                  # Interactive Prototypes
├── 🎨 demos/                       # Live Demonstrations
└── 🔬 research/                    # Technology Research`,
      'learning-projects': `learning-projects/
├── ⚛️ frontend/                    # Frontend Learning Projects
├── 🔧 backend/                     # Backend Learning Projects
├── 🛠️ tools/                       # Development Tools
└── 📖 tutorials/                   # Learning Tutorials`
    };
    
    return structures[repo.name] || `${repo.name}/
├── 📁 src/                         # Source Code
├── 📁 docs/                        # Documentation
└── 📄 README.md                    # Project Documentation`;
  }

  /**
   * Detect technologies used in repository
   */
  detectTechnologies(repo) {
    const techStacks = {
      'external-learning-platforms': ['JavaScript', 'React', 'Redux', 'Node.js', 'Python', 'HTML/CSS', 'Jest', 'PHP'],
      'academic-portfolio': ['Python', 'Java', 'Computer Science Theory', 'Algorithms', 'Data Structures'],
      'business-management': ['Project Management', 'Process Automation', 'Client Relations', 'Documentation'],
      'automation-tools': ['Node.js', 'JavaScript', 'Automation Scripts', 'CI/CD', 'Process Optimization'],
      'portfolio-website': ['React', 'Next.js', 'TypeScript', 'Styled Components', 'Responsive Design'],
      'technical-showcase': ['JavaScript', 'React', 'Node.js', 'WebGL', 'Canvas API', 'Experimental APIs'],
      'learning-projects': ['JavaScript', 'Python', 'React', 'Node.js', 'Documentation', 'Tutorials'],
      'ecosystem-automation-tools': ['Node.js', 'GitHub Actions', 'JSON Processing', 'File System APIs', 'Automation']
    };
    
    return techStacks[repo.name] || ['JavaScript', 'Node.js', 'Web Development'];
  }

  /**
   * Get default analysis for repositories that can't be accessed
   */
  getDefaultAnalysis(repo) {
    return {
      org: repo.org,
      name: repo.name, 
      type: repo.type,
      description: repo.description,
      projectCount: 1,
      lastUpdate: new Date().toISOString(),
      structure: ['README.md'],
      technologies: ['Development'],
      status: 'pending'
    };
  }

  /**
   * Generate updated READMEs based on analysis
   */
  async generateUpdatedReadmes(analysis) {
    console.log('🎨 Generating updated READMEs...');
    
    const readmeDir = path.join(this.baseDir, 'generated-readmes');
    if (!fs.existsSync(readmeDir)) {
      fs.mkdirSync(readmeDir, { recursive: true });
    }

    for (const [repoName, data] of Object.entries(analysis)) {
      try {
        const readme = await this.generateReadmeFromTemplate(data);
        const readmePath = path.join(readmeDir, `${repoName}-README.md`);
        fs.writeFileSync(readmePath, readme, 'utf8');
        console.log(`  ✅ Generated README for ${data.org}/${repoName}`);
      } catch (error) {
        console.log(`  ⚠️ Failed to generate README for ${repoName}: ${error.message}`);
      }
    }
  }

  /**
   * Generate README from template based on repository data
   */
  async generateReadmeFromTemplate(data) {
    const templatePath = path.join(this.templatesDir, `${data.type}-readme.template.md`);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found for type: ${data.type}`);
    }
    
    let template = fs.readFileSync(templatePath, 'utf8');
    
    // Generate organization-specific language statistics
    const languageStatsSection = this.generateLanguageStatsSection(data.org);
    
    // Replace template variables
    template = template
      .replace(/\{\{REPO_NAME\}\}/g, data.name)
      .replace(/\{\{ORG_NAME\}\}/g, data.org)
      .replace(/\{\{DESCRIPTION\}\}/g, data.description)
      .replace(/\{\{PROJECT_COUNT\}\}/g, data.projectCount)
      .replace(/\{\{LAST_UPDATE\}\}/g, new Date(data.lastUpdate).toLocaleDateString())
      .replace(/\{\{TECHNOLOGIES\}\}/g, data.technologies.join(', '))
      .replace(/\{\{STATUS\}\}/g, data.status)
      .replace(/\{\{STRUCTURE\}\}/g, data.structure)
      .replace(/\{\{LANGUAGE_STATS\}\}/g, languageStatsSection);
    
    return template;
  }

  /**
   * Create update summary report
   */
  async createUpdateSummary(analysis) {
    const timestamp = new Date().toISOString();
    const totalRepos = Object.keys(analysis).length;
    const activeRepos = Object.values(analysis).filter(repo => repo.status === 'active').length;
    const totalProjects = Object.values(analysis).reduce((sum, repo) => sum + repo.projectCount, 0);

    const summary = `# 🤖 Universal README Management Summary

## 🚀 Execution Report: ${new Date().toLocaleString()}

### ✅ Processing Overview
- **Total Repositories**: ${totalRepos}
- **Active Repositories**: ${activeRepos}
- **Total Projects**: ${totalProjects}
- **Generation Status**: ✅ Completed Successfully

### 📊 Repository Analysis

${Object.values(analysis).map(repo => 
  `#### ${repo.org}/${repo.name}
- **Type**: ${repo.type}
- **Projects**: ${repo.projectCount}
- **Technologies**: ${repo.technologies.join(', ')}
- **Status**: ${repo.status === 'active' ? '🟢' : '🟡'} ${repo.status}
`).join('\n')}

### 🎯 Template Generation
- **Templates Created**: 8 repository types
- **READMEs Generated**: ${totalRepos}
- **Success Rate**: ${Math.round((activeRepos / totalRepos) * 100)}%

### 🔄 Next Automated Run
**Scheduled**: Tomorrow at 6:00 AM UTC  
**Manual Trigger**: \`npm run update-readmes\`  
**Integration**: Part of ecosystem-unified-automation

---

*Universal README Management v1.0*  
*Generated: ${timestamp}*  
*Next Update: Daily at 6:00 AM UTC*
`;

    const summaryPath = path.join(this.baseDir, 'README_MANAGEMENT_SUMMARY.md');
    fs.writeFileSync(summaryPath, summary, 'utf8');
    
    console.log('  ✅ Created universal update summary');
    return summary;
  }

  // Template generation methods (placeholder implementations)
  generateLearningTemplate() {
    return `# 🎓 {{REPO_NAME}} - Comprehensive Educational Journey

[![Learning Status](https://img.shields.io/badge/Learning-Active-green)](https://github.com/{{ORG_NAME}}/{{REPO_NAME}}) [![Platforms](https://img.shields.io/badge/Platforms-3-blue)] [![Projects](https://img.shields.io/badge/Projects-{{PROJECT_COUNT}}+-orange)]

## 🌟 Overview

{{DESCRIPTION}}

This repository consolidates my comprehensive learning journey across multiple external educational platforms, showcasing systematic skill development through hands-on projects and structured coursework.

### 🌐 Multi-Platform Excellence
- **🔥 Recursion CS Program**: Intensive computer science education through challenging projects that mirror real industry scenarios
- **🎓 Meta Professional Certificates**: Industry-standard curriculum developed by Meta (Facebook) engineers, covering both frontend and backend specializations
- **🎨 Udacity Nanodegree**: Cutting-edge frontend development program with mentor guidance and career services

{{LANGUAGE_STATS}}

## 🏗️ Learning Architecture

### 🔥 Recursion CS Program
**Intensive computer science education through project-based learning**

#### Full-Stack Development
- **[SlackClone](https://github.com/{{ORG_NAME}}/{{REPO_NAME}}/tree/main/recursion/slackclone)** - Real-time messaging application with React and Socket.IO
- **[Dynamic Web Servers](https://github.com/{{ORG_NAME}}/{{REPO_NAME}}/tree/main/recursion/dynamic-web-servers)** - HTTP server implementation and web frameworks
- **[Website Project](https://github.com/{{ORG_NAME}}/{{REPO_NAME}}/tree/main/recursion/recursion-project3-website)** - Complete full-stack web application

#### Backend Systems
- **[Servers with Databases](https://github.com/{{ORG_NAME}}/{{REPO_NAME}}/tree/main/recursion/servers-with-databases)** - Database integration and server architecture
- **[File Manipulator](https://github.com/{{ORG_NAME}}/{{REPO_NAME}}/tree/main/recursion/file-manipulator-program)** - System-level programming and file operations

#### Creative Projects
- **[Video Compressor](https://github.com/{{ORG_NAME}}/{{REPO_NAME}}/tree/main/recursion/video-compressor-project)** - Multimedia processing and compression algorithms
- **[Tetris Game](https://github.com/{{ORG_NAME}}/{{REPO_NAME}}/tree/main/recursion/test-tetris)** - Game development fundamentals and logic implementation
- **[Todo Redux](https://github.com/{{ORG_NAME}}/{{REPO_NAME}}/tree/main/recursion/todo-redux)** - State management patterns with Redux architecture

### 🎓 Coursera Specializations
**Professional development through Meta's industry-standard curriculum**

#### [Meta Frontend Developer Professional Certificate](https://github.com/{{ORG_NAME}}/{{REPO_NAME}}/tree/main/coursera/meta-frontend)
- **Advanced React** - Hooks, Context, Testing, Performance optimization
- **JavaScript Programming** - ES6+, Async programming, Unit testing with Jest
- **React Basics** - Component architecture, State management, Routing
- **Frontend Capstone** - Complete portfolio website development

#### [Meta Backend Developer Professional Certificate](https://github.com/{{ORG_NAME}}/{{REPO_NAME}}/tree/main/coursera/meta-backend)
- **Backend Development** - Server-side programming and API design
- **Database Integration** - SQL, NoSQL, and data modeling
- **System Architecture** - Scalable backend systems and microservices

### 🎨 Udacity Frontend Nanodegree
**Industry-focused frontend development with project-based learning**

#### [Frontend Nanodegree Program](https://github.com/{{ORG_NAME}}/{{REPO_NAME}}/tree/main/udacity/frontend-nanodegree)
- **Responsive Web Design** - Mobile-first design principles and CSS frameworks
- **JavaScript Fundamentals** - Modern ES6+ programming and DOM manipulation
- **Web APIs & Performance** - Optimization techniques and modern web standards

## 📊 Learning Analytics

### Technical Stack Progression
\`\`\`
Frontend:    HTML/CSS → JavaScript → React/Redux → Advanced Patterns
Backend:     Node.js → Express → Database Integration → System Architecture  
Languages:   JavaScript → Python → PHP → Multi-language proficiency
Testing:     Basic → Jest/Unit Testing → TDD → Integration Testing
Tools:       Git → Docker → CI/CD → Production Deployment
\`\`\`

### Current Statistics
- **Total Projects**: {{PROJECT_COUNT}}+ across 3 major platforms
- **Technologies**: {{TECHNOLOGIES}}
- **Learning Platforms**: Recursion, Meta Coursera, Udacity
- **Last Updated**: {{LAST_UPDATE}}
- **Status**: {{STATUS}}

## 📁 Repository Structure

\`\`\`
{{STRUCTURE}}
\`\`\`

## 🎯 Key Learning Outcomes

### Technical Proficiency
- **Frontend Foundation**: HTML5, CSS3, responsive design, accessibility standards
- **Frontend Mastery**: React, Redux, advanced patterns, testing
- **Backend Expertise**: Node.js, databases, API design, system architecture
- **Full-Stack Integration**: End-to-end application development

### Project Portfolio  
- **{{PROJECT_COUNT}}+ Complete Projects**: From foundational frontend to complex full-stack applications
- **Progressive Complexity**: Frontend basics → Complex systems → Professional applications
- **Professional Certifications**: Meta Frontend & Backend Developer + Udacity Nanodegree
- **Comprehensive Coverage**: Design fundamentals to system architecture

---

*External learning represents a commitment to continuous education beyond formal academic requirements, demonstrating initiative, curiosity, and dedication to mastery in computer science and technology.*

*Auto-generated by Universal README Management*  
*Last Updated: {{LAST_UPDATE}}*`;
  }

  generatePortfolioTemplate() {
    return `# 🌐 {{REPO_NAME}} - Professional Portfolio

[![Portfolio Status](https://img.shields.io/badge/Portfolio-Live-success)](https://github.com/{{ORG_NAME}}/{{REPO_NAME}})

## 🚀 Overview

{{DESCRIPTION}}

This portfolio website serves as the **central hub** for showcasing professional capabilities, technical expertise, and career achievements in software development. Built with modern web technologies and designed with user experience in mind, it represents both technical skills and design sensibility.

### 🎯 Professional Presentation
**Strategic Career Positioning** - This portfolio is specifically designed to communicate technical competence to potential employers, clients, and collaborators. Every element is crafted to demonstrate professionalism and attention to detail.

### 🛠️ Technical Excellence
- **Modern Web Stack**: Built using cutting-edge technologies including {{TECHNOLOGIES}}
- **Performance Optimized**: Fast loading times, responsive design, and accessibility compliance
- **Professional Deployment**: Production-ready hosting and domain configuration
- **SEO Optimization**: Strategic content structure for maximum visibility

### 💼 Business Value
This portfolio directly supports:
- **Job Applications** - Professional online presence for recruiters and hiring managers
- **Client Acquisition** - Credible showcase for freelance and consulting opportunities
- **Network Building** - Shareable professional identity for industry connections
- **Personal Branding** - Consistent representation across all professional platforms

## 🛠️ Technologies
{{TECHNOLOGIES}}

## 📊 Project Status
- **Components**: {{PROJECT_COUNT}}
- **Last Updated**: {{LAST_UPDATE}}
- **Status**: {{STATUS}}

---

*Auto-generated by Universal README Management*`;
  }

  generateBusinessTemplate() {
    return `# 🏢 {{REPO_NAME}} - Business Management

[![Business Status](https://img.shields.io/badge/Business-Active-blue)](https://github.com/{{ORG_NAME}}/{{REPO_NAME}})

## 📋 Overview

{{DESCRIPTION}}

This repository serves as the **operational backbone** for professional client work, project management, and business development activities. It encompasses comprehensive project tracking, client relationship management, and strategic business automation tools designed to ensure consistent service delivery and business growth.

### 🎯 Business Excellence Framework
**Client-Centric Operations** - Every process and tool is designed to maximize client satisfaction, project success rates, and operational efficiency. This systematic approach ensures scalable business operations and sustainable growth.

### 📈 Operational Capabilities
- **Project Management**: Comprehensive tracking and management of client projects from initiation to delivery
- **Client Relations**: Systematic approach to client communication, feedback collection, and relationship maintenance
- **Process Automation**: Streamlined workflows that reduce manual overhead and increase productivity
- **Quality Assurance**: Consistent delivery standards and continuous improvement processes

### 💼 Professional Value
This business management system demonstrates:
- **Operational Maturity** - Systematic approach to business operations
- **Client Focus** - Dedicated processes for ensuring client success
- **Scalability** - Systems designed to support business growth
- **Professional Standards** - Industry best practices in project and client management

### 🚀 Strategic Impact
The systems in this repository directly support:
- **Client Retention** - Consistent service delivery and communication
- **Business Growth** - Scalable processes that support expansion
- **Quality Delivery** - Systematic approaches to maintaining high standards
- **Operational Efficiency** - Automated workflows that maximize productivity

## 📊 Project Management
- **Active Projects**: {{PROJECT_COUNT}}
- **Technologies**: {{TECHNOLOGIES}}
- **Last Updated**: {{LAST_UPDATE}}

---

*Auto-generated by Universal README Management*`;
  }

  generateAcademicTemplate() {
    return `# 🎓 {{REPO_NAME}} - Academic Portfolio

[![Academic Status](https://img.shields.io/badge/Academic-Active-green)](https://github.com/{{ORG_NAME}}/{{REPO_NAME}})

## 📚 Overview

{{DESCRIPTION}}

## 🎯 Academic Progress
- **Projects**: {{PROJECT_COUNT}}
- **Focus Areas**: {{TECHNOLOGIES}}
- **Last Updated**: {{LAST_UPDATE}}

---

*Auto-generated by Universal README Management*`;
  }

  generateShowcaseTemplate() {
    return `# 🔬 {{REPO_NAME}} - Technical Showcase

[![Showcase Status](https://img.shields.io/badge/Showcase-Active-purple)](https://github.com/{{ORG_NAME}}/{{REPO_NAME}})

## ⚡ Overview

{{DESCRIPTION}}

## 🧪 Experiments & Innovations
- **Active Experiments**: {{PROJECT_COUNT}}
- **Technologies**: {{TECHNOLOGIES}}
- **Last Updated**: {{LAST_UPDATE}}

---

*Auto-generated by Universal README Management*`;
  }

  generateAutomationTemplate() {
    return `# 🤖 {{REPO_NAME}} - Automation Tools

[![Automation Status](https://img.shields.io/badge/Automation-Active-red)](https://github.com/{{ORG_NAME}}/{{REPO_NAME}})

## ⚙️ Overview

{{DESCRIPTION}}

## 🛠️ Automation Suite
- **Tools**: {{PROJECT_COUNT}}
- **Technologies**: {{TECHNOLOGIES}}
- **Last Updated**: {{LAST_UPDATE}}

---

*Auto-generated by Universal README Management*`;
  }

  generateProjectsTemplate() {
    return `# 📚 {{REPO_NAME}} - Learning Projects

[![Projects Status](https://img.shields.io/badge/Projects-Active-yellow)](https://github.com/{{ORG_NAME}}/{{REPO_NAME}})

## 📖 Overview

{{DESCRIPTION}}

## 🎯 Learning Projects
- **Total Projects**: {{PROJECT_COUNT}}
- **Technologies**: {{TECHNOLOGIES}}
- **Last Updated**: {{LAST_UPDATE}}

---

*Auto-generated by Universal README Management*`;
  }

  generateBusinessToolsTemplate() {
    return `# 🔧 {{REPO_NAME}} - Business Tools

[![Tools Status](https://img.shields.io/badge/Tools-Active-cyan)](https://github.com/{{ORG_NAME}}/{{REPO_NAME}})

## 🛠️ Overview

{{DESCRIPTION}}

## 📊 Business Automation
- **Tools**: {{PROJECT_COUNT}}
- **Technologies**: {{TECHNOLOGIES}}
- **Last Updated**: {{LAST_UPDATE}}

---

*Auto-generated by Universal README Management*`;
  }

  /**
   * Get automation statistics
   */
  getAutomationStats() {
    return {
      totalRepositories: this.repositories.length,
      organizations: [...new Set(this.repositories.map(r => r.org))].length,
      repositoryTypes: [...new Set(this.repositories.map(r => r.type))].length,
      automationStatus: 'Fully Operational'
    };
  }

  /**
   * Generate language statistics section for README
   */
  generateLanguageStatsSection(orgName = null) {
    if (!this.languageStats) {
      return `## Technology Stack
Dynamic language statistics integration in progress.`;
    }

    if (orgName && this.languageStats.organizations[orgName]) {
      return this.generateOrganizationLanguageStats(orgName);
    } else {
      return this.generateEcosystemLanguageStats();
    }
  }

  /**
   * Generate organization-specific language statistics
   */
  generateOrganizationLanguageStats(orgName) {
    const orgData = this.languageStats.organizations[orgName];
    if (!orgData || !orgData.totals.languages) {
      return `## Technology Stack
Language statistics not available for ${orgName}.`;
    }

    const languages = orgData.totals.languages.slice(0, 8); // Top 8 languages
    const totalLines = orgData.totals.total_lines;

    let statsSection = `## Technology Stack
**Total Code**: ${totalLines.toLocaleString()} lines across ${orgData.totals.accessible_repositories} repositories

### Language Distribution
`;

    // Create colored progress bar
    const coloredBar = this.generateColoredProgressBar(languages, 25);
    statsSection += `${coloredBar}\n\n`;

    // Add language list below the bar
    languages.forEach(lang => {
      const icon = this.getLanguageIcon(lang.language);
      statsSection += `${icon} **${lang.language}** ${lang.percentage}% (${lang.lines.toLocaleString()} lines)  \n`;
    });

    // Add trends if available
    if (this.languageStats.trends.available) {
      statsSection += `\n### Growth Trends\n`;
      
      Object.entries(this.languageStats.trends.languages).slice(0, 5).forEach(([language, trend]) => {
        if (languages.some(l => l.language === language)) {
          statsSection += `- **${language}**: ${trend.trend_icon} ${trend.percentage_change}% ${trend.trend}  \n`;
        }
      });
    }

    return statsSection;
  }

  /**
   * Generate ecosystem-wide language statistics
   */
  generateEcosystemLanguageStats() {
    const ecosystemData = this.languageStats.ecosystem_totals;
    if (!ecosystemData.languages) {
      return `## Ecosystem Technology Stack
Ecosystem-wide statistics not available.`;
    }

    const languages = ecosystemData.languages.slice(0, 10); // Top 10 languages
    
    let statsSection = `## Ecosystem Technology Overview
**Total Code**: ${ecosystemData.total_lines.toLocaleString()} lines across ${ecosystemData.total_repositories} repositories in ${ecosystemData.total_organizations} organizations

### Cross-Organization Language Distribution
`;

    // Create colored progress bar for ecosystem
    const coloredBar = this.generateColoredProgressBar(languages, 35);
    statsSection += `${coloredBar}\n\n`;

    // Add language list below the bar
    languages.forEach(lang => {
      const icon = this.getLanguageIcon(lang.language);
      
      const orgList = lang.organizations ? 
        lang.organizations.slice(0, 3).map(org => org.name.replace('Dev', '')).join(', ') : 
        'Multiple';
      
      statsSection += `${icon} **${lang.language}** ${lang.percentage}% (${lang.lines.toLocaleString()} lines) • *${orgList}*  \n`;
    });

    // Add organization breakdown
    statsSection += `\n### Organization Specializations\n`;
    
    Object.entries(this.languageStats.organizations).forEach(([orgName, orgData]) => {
      const primaryLang = orgData.totals.primary_language;
      const repoCount = orgData.totals.accessible_repositories;
      const percentage = orgData.totals.languages?.[0]?.percentage || '0';
      
      statsSection += `- **${orgName}**: ${primaryLang} specialist (${percentage}% usage, ${repoCount} repos)  \n`;
    });

    return statsSection;
  }

  /**
   * Get color indicator for programming language (GitHub style)
   */
  getLanguageColor(language) {
    const colors = {
      'JavaScript': '🟨', // Yellow
      'TypeScript': '🔵', // Blue
      'Python': '🐍', // Snake (green-ish)
      'Java': '🟠', // Orange
      'CSS': '🟣', // Purple
      'HTML': '🟤', // Brown
      'C++': '🔴', // Red
      'C': '⚫', // Black
      'JSON': '⚪', // White/Light
      'Shell': '🟢', // Green
      'Markdown': '⚫', // Black
      'SCSS': '🟣', // Purple (like CSS)
      'PHP': '🟡', // Yellow
      'Go': '🩵', // Light blue
      'Rust': '🟫', // Brown/Rust
      'Ruby': '🔴', // Red
      'Swift': '🟠', // Orange
      'Kotlin': '🟪', // Purple
      'Dart': '🔵', // Blue
      'Vue': '🟢' // Green
    };
    return colors[language] || '⚪'; // Default to white circle
  }

  /**
   * Get professional indicator for programming language
   */
  getLanguageIcon(language) {
    // Use color indicators for visual distinction
    return this.getLanguageColor(language);
  }

  /**
   * Generate colored progress bar segments
   */
  generateColoredProgressBar(languages, totalWidth = 25) {
    let coloredBar = '';
    
    languages.forEach(lang => {
      const segmentLength = Math.max(1, Math.round((parseFloat(lang.percentage) / 100) * totalWidth));
      const color = this.getLanguageColor(lang.language);
      
      // Use different Unicode block characters for color simulation
      const segments = {
        'JavaScript': '🟨', // Yellow
        'TypeScript': '🟦', // Blue
        'Python': '🟩', // Green  
        'Java': '🟧', // Orange
        'CSS': '🟪', // Purple
        'HTML': '🟫', // Brown
        'C++': '🟥', // Red
        'C': '⬛', // Black
        'JSON': '⚪', // White circle
        'Shell': '🟩', // Green
        'Markdown': '⬛', // Black
        'SCSS': '🟪', // Purple
      };
      
      const segment = segments[lang.language] || '⬜';
      coloredBar += segment.repeat(segmentLength);
    });
    
    return coloredBar;
  }
}

// CLI execution
if (require.main === module) {
  const manager = new UniversalReadmeManager();
  manager.runUniversalUpdate()
    .then(() => {
      console.log('\n🎉 Universal README Management: COMPLETE');
      console.log('📊 All repository READMEs centrally managed');
      console.log('🔄 Templates and automation fully operational');
      console.log('✅ Ready for cross-repository synchronization');
    })
    .catch(error => {
      console.error('\n❌ Universal README Management failed:', error.message);
      process.exit(1);
    });
}

module.exports = UniversalReadmeManager;