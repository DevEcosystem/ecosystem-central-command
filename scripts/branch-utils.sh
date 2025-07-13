#!/bin/bash

# DevFlow Branch Management Utilities
# Provides automated branch creation and synchronization functions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
info() {
    echo -e "${BLUE}ℹ️ INFO:${NC} $1"
}

success() {
    echo -e "${GREEN}✅ SUCCESS:${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠️ WARNING:${NC} $1"
}

error() {
    echo -e "${RED}❌ ERROR:${NC} $1"
}

# Check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Not in a git repository"
        exit 1
    fi
}

# Check if main branch exists
check_main_branch() {
    if ! git show-ref --verify --quiet refs/heads/main; then
        error "Main branch does not exist"
        exit 1
    fi
}

# Sync main branch with remote
sync_main() {
    info "Syncing main branch with remote..."
    
    # Stash any uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        warning "Uncommitted changes detected. Stashing..."
        git stash push -m "Auto-stash before main sync - $(date)"
    fi
    
    # Switch to main and update
    git checkout main
    git fetch origin
    git pull origin main
    
    success "Main branch updated successfully"
}

# Create new feature branch with proper setup
create_feature_branch() {
    local branch_name="$1"
    
    if [ -z "$branch_name" ]; then
        error "Branch name is required"
        echo "Usage: create_feature_branch <branch-name>"
        echo "Example: create_feature_branch feature/DEVFLOW-13-new-feature"
        exit 1
    fi
    
    # Validate branch name format
    if [[ ! "$branch_name" =~ ^feature/DEVFLOW-[0-9]+-[a-z0-9-]+$ ]]; then
        warning "Branch name doesn't follow DevFlow convention"
        echo "Expected format: feature/DEVFLOW-<issue-number>-<description>"
        echo "Example: feature/DEVFLOW-13-api-integration"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    check_git_repo
    check_main_branch
    
    # Sync main first
    sync_main
    
    # Check if branch already exists
    if git show-ref --verify --quiet refs/heads/"$branch_name"; then
        error "Branch '$branch_name' already exists locally"
        exit 1
    fi
    
    if git show-ref --verify --quiet refs/remotes/origin/"$branch_name"; then
        error "Branch '$branch_name' already exists on remote"
        exit 1
    fi
    
    # Create and switch to new branch
    info "Creating feature branch: $branch_name"
    git checkout -b "$branch_name"
    
    success "Feature branch '$branch_name' created and checked out"
    info "Branch is based on latest main branch"
}

# Sync current feature branch with main
sync_feature_branch() {
    check_git_repo
    
    local current_branch=$(git branch --show-current)
    
    if [ "$current_branch" = "main" ]; then
        error "Already on main branch. Use sync_main instead."
        exit 1
    fi
    
    if [[ ! "$current_branch" =~ ^feature/ ]]; then
        warning "Current branch '$current_branch' is not a feature branch"
        read -p "Continue with sync? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    info "Syncing feature branch '$current_branch' with main..."
    
    # Stash any uncommitted changes
    local stash_created=false
    if ! git diff-index --quiet HEAD --; then
        warning "Uncommitted changes detected. Stashing..."
        git stash push -m "Auto-stash before branch sync - $(date)"
        stash_created=true
    fi
    
    # Fetch latest changes
    git fetch origin
    
    # Update main branch
    git checkout main
    git pull origin main
    
    # Return to feature branch and merge
    git checkout "$current_branch"
    
    info "Merging main into $current_branch..."
    if git merge main --no-edit; then
        success "Successfully merged main into $current_branch"
        
        # Restore stashed changes if any
        if [ "$stash_created" = true ]; then
            info "Restoring stashed changes..."
            if git stash pop; then
                success "Stashed changes restored"
            else
                warning "Failed to restore stashed changes. Check 'git stash list'"
            fi
        fi
    else
        error "Merge conflicts detected. Please resolve manually:"
        echo "1. Resolve conflicts in the affected files"
        echo "2. git add <resolved-files>"
        echo "3. git commit"
        echo "4. Run this script again or manually restore stash if needed"
        exit 1
    fi
}

# Push feature branch to remote with tracking
push_feature_branch() {
    check_git_repo
    
    local current_branch=$(git branch --show-current)
    
    if [ "$current_branch" = "main" ]; then
        error "Cannot push main branch using this function"
        exit 1
    fi
    
    info "Pushing feature branch '$current_branch' to remote..."
    
    # Check if branch exists on remote
    if git show-ref --verify --quiet refs/remotes/origin/"$current_branch"; then
        git push origin "$current_branch"
    else
        git push -u origin "$current_branch"
        success "Branch '$current_branch' pushed and tracking set up"
    fi
}

# Complete workflow: sync main, create branch, and set up tracking
quick_branch() {
    local branch_name="$1"
    
    if [ -z "$branch_name" ]; then
        error "Branch name is required"
        echo "Usage: quick_branch <branch-name>"
        exit 1
    fi
    
    # Check for existing feature branches and analyze conflicts
    local existing_features=$(git branch -r | grep -E 'origin/feature/' | grep -v 'origin/HEAD')
    if [ -n "$existing_features" ]; then
        info "Found existing feature branch(es):"
        echo "$existing_features" | sed 's/origin\//  - /'
        echo ""
        
        # Extract issue numbers from existing branches
        local existing_issues=$(echo "$existing_features" | sed 's/.*DEVFLOW-\([0-9]*\).*/\1/' | sort -n | tr '\n' ' ')
        local new_issue=$(echo "$branch_name" | sed 's/.*DEVFLOW-\([0-9]*\).*/\1/')
        
        if [ -n "$new_issue" ] && [ -n "$existing_issues" ]; then
            info "Conflict analysis:"
            echo "  - New issue: #$new_issue"
            echo "  - Existing issues: #$existing_issues"
            echo ""
            
            # Check for potential conflicts based on issue sequence
            local max_existing=$(echo "$existing_issues" | tr ' ' '\n' | sort -n | tail -1)
            if [ "$new_issue" -le "$max_existing" ]; then
                warning "Potential dependency conflict detected!"
                echo "  Issue #$new_issue 可能会依赖 Issue #$max_existing 的結果"
                echo "  建议确认是否存在代码依赖关系"
                echo ""
            fi
        fi
        
        warning "Multiple parallel branches detected. DevFlow recommendations:"
        echo "  ✅ Safe: Independent features (different files/modules)"
        echo "  ⚠️  Caution: Related features (same components)"
        echo "  ❌ Risk: Dependent features (sequential dependencies)"
        echo ""
        read -p "Continue with parallel development? (Y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            info "Consider coordination strategies:"
            echo "1. Assign different modules to different developers"
            echo "2. Complete dependent issues sequentially"
            echo "3. Use frequent sync: ./scripts/branch-utils.sh sync_feature_branch"
            exit 0
        fi
    fi
    
    info "Starting quick branch setup for: $branch_name"
    
    create_feature_branch "$branch_name"
    
    info "Quick branch setup completed!"
    echo "Next steps:"
    echo "1. Make your changes"
    echo "2. git add <files>"
    echo "3. git commit -m 'your message'"
    echo "4. Run 'push_feature_branch' to push to remote"
    echo ""
    success "Tip: Complete this branch before starting the next issue for best results!"
}

# Create multiple branches for team development
create_team_branches() {
    local branches_file="$1"
    
    if [ -z "$branches_file" ]; then
        error "Branches file is required"
        echo "Usage: create_team_branches <branches-file>"
        echo ""
        echo "Create a file with branch names (one per line):"
        echo "  feature/DEVFLOW-13-api-client"
        echo "  feature/DEVFLOW-14-ui-components"
        echo "  feature/DEVFLOW-15-database-layer"
        echo ""
        echo "Then run: ./scripts/branch-utils.sh create_team_branches branches.txt"
        exit 1
    fi
    
    if [ ! -f "$branches_file" ]; then
        error "File not found: $branches_file"
        exit 1
    fi
    
    check_git_repo
    check_main_branch
    
    # Read and validate all branch names first
    info "Validating branch names from $branches_file..."
    local branches=()
    while IFS= read -r line; do
        # Skip empty lines and comments
        if [[ -n "$line" && ! "$line" =~ ^[[:space:]]*# ]]; then
            branches+=("$line")
        fi
    done < "$branches_file"
    
    if [ ${#branches[@]} -eq 0 ]; then
        error "No valid branch names found in $branches_file"
        exit 1
    fi
    
    echo "Branches to create:"
    for branch in "${branches[@]}"; do
        echo "  - $branch"
    done
    echo ""
    
    # Check for existing branches
    local conflicts=()
    for branch in "${branches[@]}"; do
        if git show-ref --verify --quiet refs/heads/"$branch" || git show-ref --verify --quiet refs/remotes/origin/"$branch"; then
            conflicts+=("$branch")
        fi
    done
    
    if [ ${#conflicts[@]} -gt 0 ]; then
        error "Some branches already exist:"
        for conflict in "${conflicts[@]}"; do
            echo "  - $conflict"
        done
        exit 1
    fi
    
    # Sync main once for all branches
    sync_main
    
    # Create all branches
    success "Creating ${#branches[@]} feature branches..."
    local created=0
    local failed=0
    
    for branch in "${branches[@]}"; do
        info "Creating: $branch"
        if git checkout -b "$branch" main; then
            success "✓ Created: $branch"
            ((created++))
        else
            error "✗ Failed: $branch"
            ((failed++))
        fi
    done
    
    # Return to main
    git checkout main
    
    # Summary
    echo ""
    success "Team branch creation completed!"
    echo "  Created: $created branches"
    if [ $failed -gt 0 ]; then
        echo "  Failed: $failed branches"
    fi
    echo ""
    echo "Next steps for team members:"
    echo "1. Each developer: git fetch origin"
    echo "2. Check out assigned branch: git checkout feature/DEVFLOW-XX-description"
    echo "3. Start development"
    echo "4. Use './scripts/branch-utils.sh sync_feature_branch' daily"
}

# Push multiple branches (for team coordination)
push_team_branches() {
    check_git_repo
    
    info "Finding local feature branches to push..."
    local local_branches=$(git branch | grep -E '^\s*feature/' | sed 's/^\s*//')
    
    if [ -z "$local_branches" ]; then
        warning "No local feature branches found"
        exit 0
    fi
    
    echo "Local feature branches:"
    echo "$local_branches" | sed 's/^/  - /'
    echo ""
    
    read -p "Push all local feature branches to remote? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
    
    local pushed=0
    local failed=0
    
    while IFS= read -r branch; do
        info "Pushing: $branch"
        if git push -u origin "$branch"; then
            success "✓ Pushed: $branch"
            ((pushed++))
        else
            error "✗ Failed: $branch"
            ((failed++))
        fi
    done <<< "$local_branches"
    
    echo ""
    success "Team branch push completed!"
    echo "  Pushed: $pushed branches"
    if [ $failed -gt 0 ]; then
        echo "  Failed: $failed branches"
    fi
}

# Show team branch status
team_status() {
    check_git_repo
    
    info "DevFlow Team Branch Status"
    echo "Generated: $(date)"
    echo ""
    
    # Fetch latest info
    git fetch origin --quiet
    
    # Show active feature branches
    local feature_branches=$(git branch -r | grep -E 'origin/feature/' | grep -v 'origin/HEAD' | sed 's/origin\///')
    
    if [ -z "$feature_branches" ]; then
        success "No active feature branches"
        return
    fi
    
    echo "Active Feature Branches:"
    echo "========================"
    
    while IFS= read -r branch; do
        if [ -n "$branch" ]; then
            local author=$(git log -1 --format='%an' "origin/$branch" 2>/dev/null || echo "Unknown")
            local last_commit=$(git log -1 --format='%cr' "origin/$branch" 2>/dev/null || echo "Unknown")
            local behind=$(git rev-list --count "origin/$branch"..main 2>/dev/null || echo "?")
            local ahead=$(git rev-list --count main.."origin/$branch" 2>/dev/null || echo "?")
            
            echo "Branch: $branch"
            echo "  Author: $author"
            echo "  Last commit: $last_commit"
            echo "  Status: $ahead ahead, $behind behind main"
            
            if [ "$behind" != "?" ] && [ "$behind" -gt 5 ]; then
                echo "  ⚠️  Needs sync (>5 commits behind)"
            elif [ "$behind" != "?" ] && [ "$behind" -gt 0 ]; then
                echo "  📝 Could sync ($behind commits behind)"
            else
                echo "  ✅ Up to date"
            fi
            echo ""
        fi
    done <<< "$feature_branches"
}

# Show help
show_help() {
    echo "DevFlow Branch Management Utilities"
    echo ""
    echo "Individual Commands:"
    echo "  sync_main                    - Update main branch from remote"
    echo "  create_feature_branch <name> - Create new feature branch from latest main"
    echo "  sync_feature_branch          - Merge latest main into current feature branch"
    echo "  push_feature_branch          - Push current feature branch to remote"
    echo "  quick_branch <name>          - Complete setup: sync main + create branch"
    echo ""
    echo "Team Commands:"
    echo "  create_team_branches <file>  - Create multiple branches from file"
    echo "  push_team_branches           - Push all local feature branches"
    echo "  team_status                  - Show status of all team branches"
    echo ""
    echo "Utility:"
    echo "  show_help                    - Show this help message"
    echo ""
    echo "Branch naming convention:"
    echo "  feature/DEVFLOW-<issue-number>-<description>"
    echo "  Example: feature/DEVFLOW-13-github-api-integration"
    echo ""
    echo "Team workflow examples:"
    echo "  # Create multiple branches"
    echo "  echo 'feature/DEVFLOW-13-api' > branches.txt"
    echo "  echo 'feature/DEVFLOW-14-ui' >> branches.txt"
    echo "  ./scripts/branch-utils.sh create_team_branches branches.txt"
    echo ""
    echo "  # Check team status"
    echo "  ./scripts/branch-utils.sh team_status"
    echo ""
    echo "  # Push all team branches"
    echo "  ./scripts/branch-utils.sh push_team_branches"
}

# Main execution
main() {
    case "${1:-}" in
        "sync_main")
            sync_main
            ;;
        "create_feature_branch")
            create_feature_branch "$2"
            ;;
        "sync_feature_branch")
            sync_feature_branch
            ;;
        "push_feature_branch")
            push_feature_branch
            ;;
        "quick_branch")
            quick_branch "$2"
            ;;
        "create_team_branches")
            create_team_branches "$2"
            ;;
        "push_team_branches")
            push_team_branches
            ;;
        "team_status")
            team_status
            ;;
        "help"|"--help"|"-h"|"")
            show_help
            ;;
        *)
            error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"