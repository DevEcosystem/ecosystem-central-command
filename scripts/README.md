# 🔧 Scripts Directory

This directory contains deployment and utility scripts for the Universal README Management System.

## 📋 Scripts Index

### 🚀 Deployment Scripts
- **[deploy-curl.sh](./deploy-curl.sh)** - Single repository deployment using curl
- **[deploy-phase-2a.sh](./deploy-phase-2a.sh)** - Personal Hub repositories deployment
- **[deploy-phase-2b.sh](./deploy-phase-2b.sh)** - Cross-organizational deployment
- **[deploy-simple.sh](./deploy-simple.sh)** - Simplified deployment script
- **[deploy-live.sh](./deploy-live.sh)** - Live deployment with error handling

### 🔍 Testing and Verification
- **[test-github-token.sh](./test-github-token.sh)** - GitHub token permissions testing

## 🎯 Usage Examples

### Single Repository Deployment
```bash
# Set your GitHub token
export GITHUB_TOKEN="your_token_here"

# Deploy to pilot repository
cd /path/to/ecosystem-central-command
bash scripts/deploy-curl.sh
```

### Phase Deployments
```bash
# Phase 2A: Personal Hub repositories
bash scripts/deploy-phase-2a.sh

# Phase 2B: Cross-organizational repositories  
bash scripts/deploy-phase-2b.sh
```

### Token Testing
```bash
# Test GitHub token permissions
bash scripts/test-github-token.sh
```

## ⚠️ Prerequisites

### Required Environment
- **GitHub Token**: Set `GITHUB_TOKEN` environment variable
- **Node.js**: For universal-readme-manager.js execution
- **curl**: For GitHub API communication
- **base64**: For content encoding

### Token Requirements
- **Scopes**: `repo` + `workflow`
- **Access**: All target repositories (8 repositories across 4 organizations)
- **Permissions**: Read and write access to README.md files

## 📊 Script Descriptions

### deploy-curl.sh
**Purpose**: Deploy enhanced README to DevPersonalHub/external-learning-platforms  
**Features**: 
- GitHub API integration
- Base64 content encoding
- SHA-based updates
- Error handling and reporting

### deploy-phase-2a.sh
**Purpose**: Deploy to all Personal Hub repositories  
**Target Repositories**:
- DevPersonalHub/portfolio-website
- DevPersonalHub/technical-showcase  
- DevPersonalHub/learning-projects

### deploy-phase-2b.sh
**Purpose**: Cross-organizational deployment  
**Target Repositories**:
- DevAcademicHub/academic-portfolio
- DevBusinessHub/business-management
- DevBusinessHub/automation-tools
- DevEcosystem/ecosystem-automation-tools

### test-github-token.sh
**Purpose**: Comprehensive token testing  
**Tests**:
- Token scope verification
- Repository access validation
- README read/write permissions
- API rate limit status

## 🛡️ Security Notes

### Token Management
- Never commit tokens to version control
- Use environment variables for token storage
- Rotate tokens every 90 days
- Monitor token usage regularly

### Script Execution
- Always test with non-production repositories first
- Verify token permissions before bulk operations
- Monitor API rate limits during execution
- Keep backup of original README files

## 🔄 Integration with Main System

### NPM Scripts Integration
```json
{
  "scripts": {
    "deploy-pilot": "bash scripts/deploy-curl.sh",
    "deploy-personal": "bash scripts/deploy-phase-2a.sh", 
    "deploy-cross-org": "bash scripts/deploy-phase-2b.sh",
    "test-token": "bash scripts/test-github-token.sh"
  }
}
```

### Automation Pipeline
```bash
# Complete system update
npm run update-readmes          # Generate new READMEs
npm run deploy-personal         # Deploy to Personal Hub
npm run deploy-cross-org        # Deploy to other organizations
```

---

*Scripts maintained by Universal README Management System*  
*Last Updated: 2025-07-12*