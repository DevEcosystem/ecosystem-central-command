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
```

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
- [ ] **GitHub Projects V2 API Integration** (Issue #12)
- [ ] **DevFlow Configuration System** (Issue #13)  
- [ ] **Automatic Project Creation** (Issue #14)
- [ ] **Basic Dashboard Integration** (Issue #15)

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