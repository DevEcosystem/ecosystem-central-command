# 🚀 DevFlow Orchestrator

**Intelligent project and workflow management system for GitHub ecosystem**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](./package.json)
[![Status](https://img.shields.io/badge/status-MVP%20Development-orange.svg)](./ARCHITECTURE.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

---

## 🎯 Overview

DevFlow Orchestrator automates project management and workflow coordination across GitHub repositories, with intelligent organization-aware behavior and seamless GitHub Projects V2 integration.

### Key Features

- 🤖 **Automated Project Creation**: Auto-generate GitHub Projects V2 for new repositories
- 🏢 **Organization-Aware**: Adapt behavior based on organization context (DevBusinessHub, DevPersonalHub, etc.)
- 🧠 **Intelligent Issue Classification**: Smart categorization and routing
- 🔄 **Workflow Automation**: Event-driven process automation
- 📊 **Cross-Repository Coordination**: Unified ecosystem management

---

## 🏗️ Architecture

```
DevFlow Orchestrator
├── 🎛️ Configuration Layer    # Organization profiles & templates
├── 🔌 Integration Layer       # GitHub Projects V2 & REST API
├── 🧠 Core Engine            # Orchestrator, Classifier, Workflows
├── 📊 Analytics & Monitoring # Performance & health metrics
└── 🎨 Dashboard Interface    # Web-based management (Phase 2)
```

**[📖 Detailed Architecture Documentation →](./ARCHITECTURE.md)**

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- GitHub Personal Access Token with Projects V2 permissions
- Repository access to target organizations

### Installation

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your GitHub token and configuration

# Initialize DevFlow Orchestrator
npm run start
```

### Basic Usage

```javascript
import { DevFlowOrchestrator } from './core/orchestrator.js';

// Initialize orchestrator
const orchestrator = new DevFlowOrchestrator({
  github: {
    token: process.env.GITHUB_TOKEN
  }
});

await orchestrator.initialize();

// Create project for new repository
const project = await orchestrator.createProject(
  { name: 'my-new-repo', owner: 'DevBusinessHub' },
  'DevBusinessHub'
);

// Process issue classification
const result = await orchestrator.processIssue(
  { id: 123, title: '🚀 feat: Add user authentication' },
  { repository: 'my-app', organization: 'DevBusinessHub' }
);

// Automatically create GitHub Projects V2
const projectResult = await orchestrator.createProjectForRepository({
  name: 'my-new-app',
  owner: 'DevBusinessHub',
  description: 'Production-ready application'
});

console.log(`Project created: ${projectResult.project.url}`);
```

---

## 🤖 Automatic Project Creation

DevFlow Orchestrator can automatically create GitHub Projects V2 with organization-specific templates:

```javascript
import { ProjectAutomationService } from './core/project-automation.js';

// Create project automation service
const projectAutomation = new ProjectAutomationService(config);

// Create a single project
const result = await projectAutomation.createProjectForRepository({
  name: 'awesome-app',
  owner: 'DevBusinessHub',
  description: 'Customer-facing web application'
});

// Create multiple projects
const repositories = [
  { name: 'web-app', owner: 'DevBusinessHub', description: 'Web application' },
  { name: 'mobile-app', owner: 'DevBusinessHub', description: 'Mobile app' }
];

const bulkResult = await projectAutomation.createProjectsForRepositories(repositories);

// Create demo projects for testing
const demoResult = await projectAutomation.createDemoProject('DevBusinessHub', {
  projectName: 'Demo Business Project',
  description: 'Showcase of automation capabilities'
});
```

### Live Demo

```bash
# Simulate project creation (safe)
npm run demo:projects -- --dry-run

# Create actual GitHub Projects V2
npm run demo:projects -- --create-real-projects
```

---

## 🤖 Automatic Issue Completion

DevFlow Orchestrator includes intelligent automated issue management that reduces manual overhead by 80%:

### **🔄 How It Works**

```bash
# 1. Create feature branch following convention
git checkout -b feature/DEVFLOW-17-automatic-issue-completion

# 2. Implement your changes and create PR
# ... development work ...

# 3. Merge PR to main
# ✨ Issue #17 automatically closed with detailed completion comment!
```

### **📊 Completion Features**

- **🎯 Branch Name Parsing** - Extracts issue numbers from `feature/DEVFLOW-XX-description`
- **📈 Development Metrics** - Tracks commits, files changed, lines added/removed
- **💬 Standardized Comments** - Generates comprehensive completion summaries
- **📊 Analytics Dashboard** - Real-time completion tracking and trends
- **🔗 Cross-Reference Linking** - Automatic PR and branch linking

### **🎪 Completion Analytics**

```bash
# View completion analytics
curl http://localhost:3000/api/analytics/issue-completions

# Dashboard metrics include:
# - Completions today/week/total
# - Average completion time
# - Development velocity metrics
# - Success rate tracking
```

**[📖 Detailed Completion Documentation →](./docs/AUTOMATIC_ISSUE_COMPLETION.md)**

---

## 📊 Dashboard Interface

DevFlow Orchestrator includes a comprehensive web-based dashboard for managing projects across all organizations:

### **Starting the Dashboard**

```bash
# Start the dashboard server
npm run dashboard

# Access at: http://localhost:3000
```

### **Dashboard Features**

- **🏢 Organization Overview** - All 4 organizations at a glance
- **📊 Real-time Analytics** - Live project counts and metrics
- **🚀 Project Creation** - Create projects through web interface
- **📈 Cross-Org Insights** - Unified analytics across ecosystem
- **⚡ Auto-refresh** - Live updates every 30 seconds

### **Organization Management**

The dashboard provides intelligent management for:

- **DevBusinessHub**: Production projects with security gates
- **DevPersonalHub**: Experimental projects with lightweight templates  
- **DevAcademicHub**: Research projects with academic workflows
- **DevEcosystem**: Infrastructure projects with impact analysis

**[📖 Detailed Dashboard Documentation →](./docs/DASHBOARD_INTEGRATION.md)**

---

## 🏢 Organization Profiles

DevFlow Orchestrator adapts to your organization's workflow:

### 🏪 DevBusinessHub (Production)
- **Focus**: Customer-facing products
- **Project Template**: Production-ready with security gates
- **Automation**: Full CI/CD, security scans, customer notifications
- **Fields**: Customer Impact, Story Points, Sprint Planning

### 🔬 DevPersonalHub (Experimentation)
- **Focus**: Personal projects and learning
- **Project Template**: Lightweight experimentation
- **Automation**: Quick deployment, experiment archiving
- **Fields**: Technology, Effort Estimation, Learning Goals

### 🎓 DevAcademicHub (Research)
- **Focus**: Academic coursework and research
- **Project Template**: Research-focused with peer review
- **Automation**: Citation validation, deadline alerts
- **Fields**: Course, Research Area, Due Dates, Grade Impact

### 🛠️ DevEcosystem (Infrastructure)
- **Focus**: Cross-organization tooling
- **Project Template**: Infrastructure with impact analysis
- **Automation**: Staged deployment, rollback preparation
- **Fields**: Impact Scope, Risk Level, System Component

---

## 📋 Development Status

### ✅ Phase 1: MVP Foundation
- [x] **Architecture Design & Foundation** (Issue #11)
- [x] **GitHub Projects V2 API Integration** (Issue #12)
- [x] **DevFlow Configuration System** (Issue #13)  
- [x] **Automatic Project Creation** (Issue #14)
- [x] **Basic Dashboard Integration** (Issue #15)
- [x] **Automatic Issue Completion Workflows** (Issue #17)

### 🔄 Phase 2: Core Features (Planned)
- [ ] Advanced Workflow Automation
- [ ] Cross-Repository Task Management
- [ ] Analytics and Reporting Engine
- [ ] Smart Notification System

### 🌟 Phase 3: Advanced Features (Future)
- [ ] AI-Powered Issue Classification
- [ ] Machine Learning Priority Prediction
- [ ] Predictive Analytics Engine
- [ ] Advanced Integration Marketplace

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run with watch mode
npm run test:watch

# Run specific test suite
npm test -- --grep "Orchestrator"
```

---

## 📊 Monitoring & Health

```bash
# Check system health
npm run health-check

# View logs
tail -f logs/combined.log

# Monitor performance
curl http://localhost:3000/health
```

---

## 🤝 Contributing

DevFlow Orchestrator follows the ecosystem's unified development workflow:

1. **Issues**: Use standardized emoji naming (`🚀 feat:`, `🐛 fix:`, etc.)
2. **Branches**: Follow `feature/DEVFLOW-{issue}-{description}` pattern
3. **Pull Requests**: Link to issues and include test coverage
4. **Reviews**: Required for all changes to core functionality

**[📖 Full Contributing Guide →](../docs/SOLO_ENTREPRENEUR_BRANCH_STRATEGY.md)**

---

## 📚 Documentation

- **[Architecture Overview](./ARCHITECTURE.md)** - System design and components
- **[API Documentation](./docs/api/)** - Integration guides and references
- **[User Guides](./docs/guides/)** - Step-by-step usage instructions
- **[Issue Naming Convention](../docs/ISSUE_NAMING_CONVENTION.md)** - Standardized issue management

---

## 🔧 Configuration

### Environment Variables

```bash
# GitHub Integration
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
GITHUB_WEBHOOK_SECRET=your-webhook-secret

# Logging
LOG_LEVEL=info
NODE_ENV=development

# Cache Settings
CACHE_TTL=300
CACHE_CHECK_PERIOD=60

# Database (Phase 2)
DATABASE_URL=postgresql://user:pass@localhost/devflow
```

### Organization Configuration

Customize behavior for your organizations in `config/organizations.js`:

```javascript
{
  id: 'YourOrg',
  settings: {
    projectTemplate: 'custom-template',
    approvalRequired: true,
    qualityGates: ['custom-gate']
  },
  projectFields: [
    { name: 'Custom Field', type: 'single_select', options: ['A', 'B'] }
  ]
}
```

---

## 🚨 Troubleshooting

### Common Issues

**GitHub API Rate Limiting**
```bash
# Check rate limit status
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/rate_limit
```

**Project Creation Failed**
```bash
# Verify token permissions
gh auth status
gh api user/repos --paginate
```

**Workflow Engine Not Starting**
```bash
# Check logs for initialization errors
tail -f logs/error.log | grep WorkflowEngine
```

---

## 📈 Performance

Current performance benchmarks (MVP baseline):

- **Project Creation**: <2s average
- **Issue Classification**: <500ms average
- **Workflow Execution**: <1s average
- **Memory Usage**: ~50MB baseline
- **API Rate Efficiency**: 95% within limits

---

## 🔮 Roadmap

**Short Term (Q1 2025)**
- Complete MVP Phase 1
- GitHub Projects V2 full integration
- Basic dashboard interface

**Medium Term (Q2 2025)**  
- Advanced workflow automation
- Cross-repository coordination
- Analytics and reporting

**Long Term (Q3+ 2025)**
- AI/ML integration
- Predictive analytics
- Enterprise features

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 🙋‍♂️ Support

- **Issues**: [GitHub Issues](https://github.com/DevEcosystem/ecosystem-central-command/issues)
- **Discussions**: [GitHub Discussions](https://github.com/DevEcosystem/ecosystem-central-command/discussions)
- **Email**: devflow-support@ecosystem.dev

---

*DevFlow Orchestrator - Orchestrating the future of intelligent development workflows* 🎼✨