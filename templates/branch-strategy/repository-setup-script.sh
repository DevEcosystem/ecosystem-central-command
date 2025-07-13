#!/bin/bash

# 🚀 Solo Entrepreneur Repository Setup Script
# Usage: ./repository-setup-script.sh <type> <repo-name> <organization>
# Example: ./repository-setup-script.sh production my-saas-app DevBusinessHub

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check arguments
if [ $# -ne 3 ]; then
    print_error "Usage: $0 <type> <repo-name> <organization>"
    echo "Types: production, rapid, documentation"
    echo "Organizations: DevBusinessHub, DevPersonalHub, DevAcademicHub, DevEcosystem"
    exit 1
fi

REPO_TYPE=$1
REPO_NAME=$2
ORGANIZATION=$3
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Validate repository type
case $REPO_TYPE in
    production|rapid|documentation)
        ;;
    *)
        print_error "Invalid type: $REPO_TYPE"
        echo "Valid types: production, rapid, documentation"
        exit 1
        ;;
esac

# Validate organization
case $ORGANIZATION in
    DevBusinessHub|DevPersonalHub|DevAcademicHub|DevEcosystem)
        ;;
    *)
        print_error "Invalid organization: $ORGANIZATION"
        echo "Valid organizations: DevBusinessHub, DevPersonalHub, DevAcademicHub, DevEcosystem"
        exit 1
        ;;
esac

print_info "Setting up $REPO_TYPE repository: $REPO_NAME for $ORGANIZATION"

# Check if we're in a git repository
if [ ! -d .git ]; then
    print_error "Not in a git repository. Please run this script from your repository root."
    exit 1
fi

# Create necessary directories
print_info "Creating directory structure..."
mkdir -p .github/workflows
mkdir -p docs
mkdir -p tests

# Function to create branches based on repository type
create_branches() {
    local current_branch=$(git branch --show-current)
    
    case $ORGANIZATION in
        DevBusinessHub|DevEcosystem)
            print_info "Creating production-grade branches..."
            
            # Create develop branch
            if ! git show-ref --verify --quiet refs/heads/develop; then
                git checkout -b develop
                git push -u origin develop
                print_success "Created 'develop' branch"
            else
                print_warning "'develop' branch already exists"
            fi
            
            # Create staging branch
            if ! git show-ref --verify --quiet refs/heads/staging; then
                git checkout -b staging
                git push -u origin staging
                print_success "Created 'staging' branch"
            else
                print_warning "'staging' branch already exists"
            fi
            
            # For DevBusinessHub, create production branch
            if [ "$ORGANIZATION" = "DevBusinessHub" ]; then
                if ! git show-ref --verify --quiet refs/heads/production; then
                    git checkout -b production
                    git push -u origin production
                    print_success "Created 'production' branch"
                else
                    print_warning "'production' branch already exists"
                fi
            fi
            ;;
            
        DevAcademicHub)
            print_info "Creating academic branches..."
            
            # Create draft branch
            if ! git show-ref --verify --quiet refs/heads/draft; then
                git checkout -b draft
                git push -u origin draft
                print_success "Created 'draft' branch"
            else
                print_warning "'draft' branch already exists"
            fi
            ;;
    esac
    
    # Return to original branch
    git checkout $current_branch
}

# Copy appropriate workflow files
copy_workflows() {
    print_info "Setting up GitHub Actions workflows..."
    
    # Always copy the cleanup workflow
    cp "$SCRIPT_DIR/cleanup-merged-branches.yml" .github/workflows/
    print_success "Added branch cleanup workflow"
    
    # Copy type-specific workflow
    case $REPO_TYPE in
        production)
            cp "$SCRIPT_DIR/production-workflow.yml" .github/workflows/quality-check.yml
            print_success "Added production-grade quality check workflow"
            ;;
        rapid)
            cp "$SCRIPT_DIR/rapid-development-workflow.yml" .github/workflows/quick-check.yml
            print_success "Added rapid development workflow"
            ;;
        documentation)
            # For documentation repos, use rapid workflow as base
            cp "$SCRIPT_DIR/rapid-development-workflow.yml" .github/workflows/docs-check.yml
            print_success "Added documentation check workflow"
            ;;
    esac
}

# Create basic configuration files if they don't exist
create_basic_files() {
    print_info "Creating basic configuration files..."
    
    # Create .gitignore if it doesn't exist
    if [ ! -f .gitignore ]; then
        cat > .gitignore << 'EOF'
# Dependencies
node_modules/
venv/
env/
.env
.env.local

# Build outputs
dist/
build/
out/
*.pyc
__pycache__/

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.coverage
.pytest_cache/
EOF
        print_success "Created .gitignore"
    fi
    
    # Create README.md if it doesn't exist
    if [ ! -f README.md ]; then
        cat > README.md << EOF
# $REPO_NAME

A $REPO_TYPE repository for $ORGANIZATION.

## 🚀 Branch Strategy

This repository follows the Solo Entrepreneur Branch Strategy.

### Protected Branches
EOF
        
        case $ORGANIZATION in
            DevBusinessHub)
                cat >> README.md << 'EOF'
- `main` - Production deployment
- `staging` - Staging environment
- `develop` - Development integration
- `production` - Production release

### Workflow
1. Create feature branches from `develop`
2. PR to `develop` for integration
3. `develop` → `staging` for testing
4. `staging` → `main` for production
EOF
                ;;
            DevPersonalHub)
                cat >> README.md << 'EOF'
- `main` - Stable version
- `develop/*` - Development branches

### Workflow
1. Create `develop/feature-name` branches
2. Experiment and iterate
3. PR to `main` when ready
EOF
                ;;
            DevAcademicHub)
                cat >> README.md << 'EOF'
- `main` - Published version
- `draft` - Pre-review draft
- `develop/*` - Development branches

### Workflow
1. Create `develop/topic` branches
2. PR to `draft` for review
3. `draft` → `main` for publication
EOF
                ;;
            DevEcosystem)
                cat >> README.md << 'EOF'
- `main` - Stable version
- `staging` - Testing environment
- `develop` - Development integration

### Workflow
1. Create feature branches from `develop`
2. PR to `develop` for integration
3. `develop` → `staging` for testing
4. `staging` → `main` for stable release
EOF
                ;;
        esac
        
        print_success "Created README.md"
    fi
}

# Setup branch protection rules reminder
setup_protection_reminder() {
    print_info "Branch protection setup reminder..."
    
    cat > docs/BRANCH_PROTECTION_SETUP.md << 'EOF'
# Branch Protection Setup Guide

## ⚠️ Important: Manual Setup Required

GitHub branch protection rules need to be configured manually through the GitHub UI.

### Steps:

1. Go to Settings → Branches → Add rule
2. Set up protection for the following branches:
EOF
    
    case $ORGANIZATION in
        DevBusinessHub|DevEcosystem)
            cat >> docs/BRANCH_PROTECTION_SETUP.md << 'EOF'
   - `main`
   - `staging`
   - `develop`
   - `production` (DevBusinessHub only)
EOF
            ;;
        DevPersonalHub)
            cat >> docs/BRANCH_PROTECTION_SETUP.md << 'EOF'
   - `main`
   - `develop/*` (use pattern)
EOF
            ;;
        DevAcademicHub)
            cat >> docs/BRANCH_PROTECTION_SETUP.md << 'EOF'
   - `main`
   - `draft`
   - `develop/*` (use pattern)
EOF
            ;;
    esac
    
    cat >> docs/BRANCH_PROTECTION_SETUP.md << 'EOF'

### Recommended Settings:

1. ✅ Require a pull request before merging
2. ✅ Dismiss stale pull request approvals when new commits are pushed
3. ✅ Require status checks to pass before merging
   - Add `quality-check` for production repos
   - Add `quick-check` for rapid development repos
4. ✅ Require branches to be up to date before merging
5. ✅ Include administrators
6. ✅ Restrict who can push to matching branches

### ⚠️ Disable Auto-delete

**IMPORTANT**: In Settings → General → Pull Requests:
- [ ] Automatically delete head branches (MUST BE UNCHECKED)

The cleanup-merged-branches.yml workflow handles safe branch deletion.
EOF
    
    print_success "Created branch protection setup guide"
}

# Main execution
main() {
    print_info "Starting repository setup..."
    
    # Create branches
    create_branches
    
    # Copy workflows
    copy_workflows
    
    # Create basic files
    create_basic_files
    
    # Create protection reminder
    setup_protection_reminder
    
    # Git add and commit
    print_info "Committing changes..."
    git add .
    git commit -m "🚀 Initialize $REPO_TYPE repository with Solo Entrepreneur Branch Strategy

- Add GitHub Actions workflows
- Set up branch structure for $ORGANIZATION
- Add basic configuration files
- Add branch protection setup guide" || print_warning "Nothing to commit"
    
    print_success "Repository setup complete! 🎉"
    
    echo ""
    print_warning "Next steps:"
    echo "1. Review and push changes: git push"
    echo "2. Set up branch protection rules (see docs/BRANCH_PROTECTION_SETUP.md)"
    echo "3. Disable 'Automatically delete head branches' in repository settings"
    echo "4. Configure any repository-specific settings"
}

# Run main function
main