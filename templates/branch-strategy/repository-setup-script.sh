#!/bin/bash

# ===========================================
# 🚀 Repository Setup Script for Solo Entrepreneur
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ===========================================
# Configuration
# ===========================================

REPO_TYPE="$1"
REPO_NAME="$2"
ORG_NAME="$3"

if [ -z "$REPO_TYPE" ] || [ -z "$REPO_NAME" ] || [ -z "$ORG_NAME" ]; then
    print_error "Usage: $0 <repo_type> <repo_name> <org_name>"
    print_status "Repo types: production, rapid, documentation, infrastructure"
    print_status "Example: $0 production my-saas-app DevBusinessHub"
    exit 1
fi

print_status "Setting up $REPO_TYPE repository: $ORG_NAME/$REPO_NAME"

# ===========================================
# Repository Initialization
# ===========================================

setup_git_config() {
    print_status "Configuring Git settings..."
    
    git config user.name "Solo Entrepreneur"
    git config user.email "entrepreneur@$(echo ${ORG_NAME} | tr '[:upper:]' '[:lower:]').com"
    git config init.defaultBranch main
    git config core.autocrlf input
    git config pull.rebase false
    
    print_success "Git configuration completed"
}

# ===========================================
# Branch Strategy Setup
# ===========================================

setup_production_branches() {
    print_status "Setting up production-grade branch structure..."
    
    # Create branches
    git checkout -b develop
    git checkout -b staging
    git checkout main
    
    # Push all branches
    git push -u origin main
    git push -u origin develop  
    git push -u origin staging
    
    print_success "Production branches created: main, staging, develop"
}

setup_rapid_branches() {
    print_status "Setting up safe experimentation structure..."
    
    # Only main branch initially - develop/* branches created as needed
    git checkout main
    git push -u origin main
    
    print_success "Safe experimentation setup: main (develop/* branches created on-demand)"
}

setup_documentation_branches() {
    print_status "Setting up academic research structure..."
    
    git checkout -b draft
    git checkout main
    
    git push -u origin main
    git push -u origin draft
    
    print_success "Academic research setup: main, draft (develop/* branches created per topic)"
}

# ===========================================
# Workflow Templates
# ===========================================

copy_workflow_template() {
    local workflow_type="$1"
    
    print_status "Copying $workflow_type workflow template..."
    
    mkdir -p .github/workflows
    
    case $workflow_type in
        "production")
            cp "templates/branch-strategy/production-workflow.yml" ".github/workflows/ci-cd.yml"
            ;;
        "rapid")
            cp "templates/branch-strategy/rapid-development-workflow.yml" ".github/workflows/rapid-dev.yml"
            ;;
        "documentation")
            # Create a simple documentation workflow
            cat > .github/workflows/docs.yml << 'EOF'
name: 📚 Documentation Workflow

on:
  push:
    branches: [main, draft]
  pull_request:
    branches: [main]

jobs:
  build-docs:
    name: 📖 Build Documentation
    runs-on: ubuntu-latest
    
    steps:
      - name: 📥 Checkout
        uses: actions/checkout@v4
        
      - name: 📚 Build & Deploy Docs
        run: |
          echo "Building documentation..."
          # Add your documentation build commands
EOF
            ;;
    esac
    
    print_success "Workflow template copied"
}

# ===========================================
# Branch Protection Setup
# ===========================================

setup_branch_protection() {
    local repo_type="$1"
    
    print_status "Setting up branch protection rules..."
    
    case $repo_type in
        "production")
            print_status "Configuring production-grade protection..."
            # These would typically be set via GitHub API or manually
            cat > .github/branch-protection-config.json << 'EOF'
{
  "main": {
    "protection": {
      "required_status_checks": {
        "strict": true,
        "contexts": ["quality-check"]
      },
      "enforce_admins": false,
      "required_pull_request_reviews": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews": true
      },
      "restrictions": null
    }
  },
  "staging": {
    "protection": {
      "required_status_checks": {
        "strict": true,
        "contexts": ["quality-check"]
      }
    }
  }
}
EOF
            ;;
        "rapid")
            print_status "Configuring lightweight protection..."
            cat > .github/branch-protection-config.json << 'EOF'
{
  "main": {
    "protection": {
      "required_status_checks": {
        "strict": false,
        "contexts": ["quick-check"]
      },
      "enforce_admins": false
    }
  }
}
EOF
            ;;
    esac
    
    print_success "Branch protection configuration created"
}

# ===========================================
# Additional Files
# ===========================================

create_additional_files() {
    print_status "Creating additional configuration files..."
    
    # .gitignore
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
.next/
out/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Cache
.cache/
.npm/
.yarn/

# Coverage
coverage/
.nyc_output/
EOF

    # Basic package.json structure
    cat > package.json << EOF
{
  "name": "$REPO_NAME",
  "version": "1.0.0",
  "description": "$REPO_TYPE repository for $ORG_NAME",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "lint": "echo \"Add your linting command here\"",
    "format": "echo \"Add your formatting command here\"",
    "dev": "echo \"Add your development server command here\"",
    "build": "echo \"Add your build command here\"",
    "start": "echo \"Add your start command here\""
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/$ORG_NAME/$REPO_NAME.git"
  },
  "author": "Solo Entrepreneur",
  "license": "MIT"
}
EOF

    # README template
    cat > README.md << EOF
# $REPO_NAME

**Repository Type**: $REPO_TYPE  
**Organization**: $ORG_NAME  
**Created**: $(date +"%Y-%m-%d")

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build
\`\`\`

## 🏗️ Branch Strategy

EOF

    case $REPO_TYPE in
        "production")
            cat >> README.md << 'EOF'
- **main**: Production-ready code
- **staging**: Pre-production testing
- **develop**: Development integration
- **feature/***: Feature development

## 🔄 Workflow

1. Create feature branch from `develop`
2. Develop and test locally
3. Create PR to `develop`
4. After approval, merge to `develop`
5. Deploy `develop` → `staging` for testing
6. Deploy `staging` → `main` for production
EOF
            ;;
        "rapid")
            cat >> README.md << 'EOF'
- **main**: Stable code with auto-deployment
- **experiment/***: Experimental features

## 🔄 Workflow

1. Develop directly on feature branches
2. Quick testing and iteration
3. Merge to `main` for immediate deployment
EOF
            ;;
    esac

    print_success "Additional files created"
}

# ===========================================
# Main Execution
# ===========================================

main() {
    print_status "🚀 Starting repository setup for $REPO_TYPE type"
    
    # Setup Git configuration
    setup_git_config
    
    # Setup branches based on repository type
    case $REPO_TYPE in
        "production")
            setup_production_branches
            copy_workflow_template "production"
            setup_branch_protection "production"
            ;;
        "rapid")
            setup_rapid_branches
            copy_workflow_template "rapid"  
            setup_branch_protection "rapid"
            ;;
        "documentation")
            setup_documentation_branches
            copy_workflow_template "documentation"
            ;;
        "infrastructure")
            setup_production_branches
            copy_workflow_template "production"
            setup_branch_protection "production"
            ;;
        *)
            print_error "Unknown repository type: $REPO_TYPE"
            exit 1
            ;;
    esac
    
    # Create additional files
    create_additional_files
    
    # Final commit
    git add .
    git commit -m "🎉 Initial repository setup with $REPO_TYPE workflow

- Branch strategy configured
- GitHub Actions workflows added
- Basic project structure created
- Branch protection rules defined

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    
    git push origin main
    
    print_success "🎉 Repository setup completed!"
    print_status "Next steps:"
    print_status "1. Configure branch protection rules in GitHub UI"
    print_status "2. Set up deployment environments"
    print_status "3. Configure any additional integrations"
    print_status "4. Start developing!"
}

# Run main function
main