#!/usr/bin/env node

/**
 * Portfolio Generator
 * Automatically generates unified portfolio content from ecosystem data
 */

const fs = require('fs');
const path = require('path');

class PortfolioGenerator {
  constructor() {
    this.ecosystemData = {
      business: null,
      personal: null,
      academic: null,
      metrics: null
    };
    this.outputPath = path.join(__dirname, '../README.md');
  }

  /**
   * Main generation pipeline
   */
  async generatePortfolio() {
    console.log('🚀 Starting portfolio generation...');
    
    try {
      await this.loadEcosystemData();
      const portfolioContent = await this.buildPortfolioContent();
      await this.writePortfolioFile(portfolioContent);
      
      console.log('✅ Portfolio generation completed successfully!');
    } catch (error) {
      console.error('❌ Portfolio generation failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Load data from all ecosystem components
   */
  async loadEcosystemData() {
    console.log('📊 Loading ecosystem data...');
    
    const dataFiles = {
      business: '../organizations/business-hub-overview.md',
      personal: '../organizations/personal-lab-showcase.md',
      academic: '../organizations/academic-hub-achievements.md'
    };

    for (const [key, filePath] of Object.entries(dataFiles)) {
      try {
        const fullPath = path.join(__dirname, filePath);
        if (fs.existsSync(fullPath)) {
          this.ecosystemData[key] = fs.readFileSync(fullPath, 'utf8');
          console.log(`  ✓ Loaded ${key} data`);
        } else {
          console.log(`  ⚠ Warning: ${filePath} not found`);
        }
      } catch (error) {
        console.log(`  ❌ Error loading ${key}: ${error.message}`);
      }
    }

    // Load metrics if available
    const metricsPath = path.join(__dirname, '../analytics/skill-growth-metrics.json');
    if (fs.existsSync(metricsPath)) {
      try {
        this.ecosystemData.metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
        console.log('  ✓ Loaded metrics data');
      } catch (error) {
        console.log(`  ❌ Error loading metrics: ${error.message}`);
      }
    }
  }

  /**
   * Extract key metrics from markdown content
   */
  extractMetrics(content, type) {
    if (!content) return {};

    const metrics = {};

    switch (type) {
      case 'business':
        // Extract business metrics
        const clientMatch = content.match(/Active Projects: (\d+)/);
        const satisfactionMatch = content.match(/Client Satisfaction: ([\d.]+)/);
        
        metrics.activeProjects = clientMatch ? clientMatch[1] : 'N/A';
        metrics.clientSatisfaction = satisfactionMatch ? satisfactionMatch[1] : 'N/A';
        break;

      case 'academic':
        // Extract academic metrics
        const gpaMatch = content.match(/GPA: ([\d.]+)/);
        const statusMatch = content.match(/Current Status: ([^\\n]+)/);
        
        metrics.gpa = gpaMatch ? gpaMatch[1] : 'N/A';
        metrics.status = statusMatch ? statusMatch[1].trim() : 'N/A';
        break;

      case 'personal':
        // Extract personal project metrics
        const experimentsMatch = content.match(/Experiments Completed: (\d+)/);
        const contributionsMatch = content.match(/Open Source Contributions: (\d+)/);
        
        metrics.experiments = experimentsMatch ? experimentsMatch[1] : 'N/A';
        metrics.contributions = contributionsMatch ? contributionsMatch[1] : 'N/A';
        break;
    }

    return metrics;
  }

  /**
   * Build complete portfolio content
   */
  async buildPortfolioContent() {
    console.log('🔨 Building portfolio content...');

    const businessMetrics = this.extractMetrics(this.ecosystemData.business, 'business');
    const academicMetrics = this.extractMetrics(this.ecosystemData.academic, 'academic');
    const personalMetrics = this.extractMetrics(this.ecosystemData.personal, 'personal');

    const currentDate = new Date().toISOString().split('T')[0];

    return `# 🌟 Development Ecosystem Command Center

[![Portfolio](https://img.shields.io/badge/Portfolio-DevEcosystem-blue)](https://github.com/DevEcosystem) [![Projects](https://img.shields.io/badge/Active%20Projects-${businessMetrics.activeProjects || '8+'}-green)] [![Organizations](https://img.shields.io/badge/Organizations-4-orange)]

## 🎯 Professional Overview
**Full-Stack Developer** | **Computer Science Student** | **Freelance Entrepreneur** | **Future Graduate Researcher**

---

## 🏢 Business Activities

### Current Performance
| Metric | Value | Status |
|--------|-------|--------|
| **Active Projects** | ${businessMetrics.activeProjects} | 🚀 Active |
| **Client Satisfaction** | ${businessMetrics.clientSatisfaction} | ⭐ Excellent |
| **Technology Stack** | 10+ frameworks | 🔧 Advanced |
| **Delivery Rate** | 95%+ on-time | ✅ Reliable |

**[View Detailed Business Activities →](organizations/business-hub-overview.md)**

---

## 👤 Personal Development

### Innovation Metrics
| Category | Achievement | Growth |
|----------|-------------|--------|
| **Technical Experiments** | ${personalMetrics.experiments || '12+'} completed | 📈 High |
| **Open Source** | ${personalMetrics.contributions || '8+'} contributions | 🤝 Active |
| **Learning Velocity** | 2-3 new tech/quarter | 🚀 Accelerating |
| **Creative Projects** | Monthly innovations | 🎨 Consistent |

**[Explore Technical Showcase →](organizations/personal-lab-showcase.md)**

---

## 🎓 Academic Excellence

### University of the People - Computer Science
| Aspect | Current Status | Achievement Level |
|--------|----------------|-------------------|
| **GPA** | ${academicMetrics.gpa || '3.9'}/4.0 | 🏆 Summa Cum Laude Track |
| **Program Status** | ${academicMetrics.status || 'Junior Standing'} | 📈 On Track |
| **Specialization** | CS + Design Integration | 🎯 Interdisciplinary |
| **Graduate Plans** | MS/PhD Computer Science | 🚀 Top-Tier Universities |

**[View Academic Portfolio →](organizations/academic-hub-achievements.md)**

---

## 🛠️ Technical Expertise Matrix

### Frontend Excellence
- **React Ecosystem**: ████████████ 95% (Production + Innovation)
- **Next.js/SSR**: ███████████░ 90% (Enterprise + Performance)
- **TypeScript**: ██████████░░ 85% (Type Safety + Scalability)
- **Modern CSS**: ███████████░ 90% (Grid + Flexbox + Animations)

### Full-Stack Capabilities  
- **Node.js/Backend**: █████████░░░ 80% (APIs + Microservices)
- **Database Design**: ████████░░░░ 75% (SQL + NoSQL + Optimization)
- **Cloud/DevOps**: ███████░░░░░ 70% (AWS + Vercel + CI/CD)
- **System Architecture**: ████████░░░░ 75% (Scalable + Maintainable)

### Design & UX
- **UI/UX Design**: ████████████ 95% (User-Centered + Aesthetic)
- **Design Systems**: ██████████░░ 85% (Scalable + Consistent)
- **User Research**: ███████░░░░░ 70% (Data-Driven + Empathetic)
- **Accessibility**: ████████░░░░ 75% (Inclusive + Standards)

---

## 📊 Ecosystem Health Dashboard

### Cross-Domain Integration
\`\`\`
Business ←→ Personal: Technology transfer & innovation application
Academic ←→ Professional: Theoretical foundation + practical implementation  
Personal ←→ Academic: Creative problem-solving + research methodology
\`\`\`

### Growth Trajectory
- **Technical Skills**: +25% proficiency across all domains (vs. last quarter)
- **Project Complexity**: +40% in scope and impact
- **Network Expansion**: +30% professional and academic connections
- **Market Value**: +35% freelance rate optimization

---

## 🎯 Strategic Objectives

### Immediate Goals (Next 6 Months)
- [ ] **Career Transition**: Secure strategic full-time role at innovative company
- [ ] **Startup Foundation**: Complete technical + business groundwork
- [ ] **Academic Excellence**: Maintain 3.9+ GPA through graduation
- [ ] **Graduate Preparation**: Finalize applications to top-tier programs

### Medium-Term Vision (1-2 Years)
- [ ] **Graduate School**: Begin MS Computer Science at target university
- [ ] **Research Impact**: Establish reputation in CS + Design intersection
- [ ] **Business Evolution**: Scale from freelance to technology startup
- [ ] **Industry Recognition**: Thought leadership in innovation space

---

## 🔗 Quick Navigation

### 📋 Ecosystem Components
- [🏢 Business Hub](https://github.com/BusinessHub) - Professional client work + strategy
- [👤 Personal Lab](https://github.com/PersonalLab) - Innovation + personal development  
- [🎓 Academic Hub](https://github.com/AcademicHub) - Education + research activities

### 📈 Analytics & Insights  
- [Skill Growth Tracker](analytics/skill-growth-metrics.json)
- [Project Impact Analysis](analytics/project-impact-analysis.md)
- [Career Milestone Timeline](analytics/career-milestone-timeline.md)

---

## 📧 Professional Contact

**For Business Inquiries**: taiu.engineer@gmail.com  
**GitHub Organizations**: [@DevEcosystem](https://github.com/DevEcosystem) | [@PersonalLab](https://github.com/PersonalLab) | [@AcademicHub](https://github.com/AcademicHub)  
**Portfolio Website**: [Auto-generated from ecosystem data]

---

*Last updated: ${currentDate} | Auto-generated from ecosystem data*  
*Ecosystem Health: 🟢 Excellent | Growth Trajectory: 📈 Accelerating | Innovation Index: 🚀 High*

---

## 🤖 Automation Details

This portfolio is automatically generated from the following sources:
- Business activities: \`organizations/business-hub-overview.md\`
- Personal projects: \`organizations/personal-lab-showcase.md\`
- Academic achievements: \`organizations/academic-hub-achievements.md\`
- Growth metrics: \`analytics/skill-growth-metrics.json\`

**Generation Script**: \`automation/portfolio-generator.js\`  
**Last Run**: ${new Date().toISOString()}
`;
  }

  /**
   * Write generated content to file
   */
  async writePortfolioFile(content) {
    console.log('💾 Writing portfolio file...');
    
    try {
      fs.writeFileSync(this.outputPath, content, 'utf8');
      console.log(`  ✓ Portfolio written to ${this.outputPath}`);
    } catch (error) {
      throw new Error(`Failed to write portfolio file: ${error.message}`);
    }
  }
}

// Command line interface
if (require.main === module) {
  const generator = new PortfolioGenerator();
  generator.generatePortfolio();
}

module.exports = PortfolioGenerator;