#!/bin/bash

# Safe Branch Cleanup Script
# Identifies and optionally removes local branches that were deleted on remote

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check for deleted remote branches
check_deleted_branches() {
    info "Checking for branches deleted on remote..."
    
    # Fetch latest remote info
    git fetch --prune --dry-run 2>&1 | grep -E '^\s*\[deleted\]' | sed 's/.*origin\///' || true
    
    # Get all local branches
    local local_branches=$(git branch --format='%(refname:short)')
    
    # Get all remote branches
    local remote_branches=$(git branch -r --format='%(refname:short)' | sed 's/origin\///')
    
    # Find local branches without remote counterpart
    local orphaned_branches=()
    while IFS= read -r branch; do
        if [[ "$branch" != "main" && "$branch" != "develop" && "$branch" != "staging" ]]; then
            if ! echo "$remote_branches" | grep -q "^$branch$"; then
                orphaned_branches+=("$branch")
            fi
        fi
    done <<< "$local_branches"
    
    if [ ${#orphaned_branches[@]} -eq 0 ]; then
        success "All local branches have remote counterparts"
        return 0
    fi
    
    warning "Found ${#orphaned_branches[@]} local branches without remote counterparts:"
    echo ""
    
    # Analyze each orphaned branch
    for branch in "${orphaned_branches[@]}"; do
        echo "Branch: $branch"
        
        # Check for unpushed commits
        local unpushed=$(git log origin/main..$branch --oneline 2>/dev/null | wc -l | tr -d ' ')
        if [ "$unpushed" -gt 0 ]; then
            echo "  ⚠️  Has $unpushed unpushed commits"
        fi
        
        # Check for uncommitted changes
        local prev_branch=$(git branch --show-current)
        git checkout -q "$branch" 2>/dev/null || true
        if ! git diff-index --quiet HEAD -- 2>/dev/null; then
            echo "  ⚠️  Has uncommitted changes"
        fi
        git checkout -q "$prev_branch"
        
        # Last commit info
        local last_commit=$(git log -1 --format='%cr' "$branch" 2>/dev/null || echo "unknown")
        echo "  📅 Last commit: $last_commit"
        
        # Merge status
        if git branch --merged main | grep -q "^  $branch$"; then
            echo "  ✅ Fully merged into main"
        else
            echo "  ❌ Not merged into main"
        fi
        echo ""
    done
    
    return ${#orphaned_branches[@]}
}

# Interactive cleanup
interactive_cleanup() {
    local orphaned_branches=()
    local local_branches=$(git branch --format='%(refname:short)')
    local remote_branches=$(git branch -r --format='%(refname:short)' | sed 's/origin\///')
    
    while IFS= read -r branch; do
        if [[ "$branch" != "main" && "$branch" != "develop" && "$branch" != "staging" ]]; then
            if ! echo "$remote_branches" | grep -q "^$branch$"; then
                orphaned_branches+=("$branch")
            fi
        fi
    done <<< "$local_branches"
    
    if [ ${#orphaned_branches[@]} -eq 0 ]; then
        return 0
    fi
    
    info "Starting interactive cleanup..."
    echo ""
    
    local deleted=0
    local kept=0
    
    for branch in "${orphaned_branches[@]}"; do
        echo "----------------------------------------"
        echo "Branch: $branch"
        
        # Show branch details
        local unpushed=$(git log origin/main..$branch --oneline 2>/dev/null | wc -l | tr -d ' ')
        local last_commit=$(git log -1 --format='%cr' "$branch" 2>/dev/null || echo "unknown")
        local is_merged=$(git branch --merged main | grep -q "^  $branch$" && echo "Yes" || echo "No")
        
        echo "  Unpushed commits: $unpushed"
        echo "  Last commit: $last_commit"
        echo "  Merged to main: $is_merged"
        echo ""
        
        read -p "Delete this branch? (y/N/q to quit): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Qq]$ ]]; then
            break
        elif [[ $REPLY =~ ^[Yy]$ ]]; then
            if git branch -d "$branch" 2>/dev/null; then
                success "Deleted: $branch"
                ((deleted++))
            else
                # Force delete if normal delete fails
                read -p "Branch has unmerged changes. Force delete? (y/N): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    git branch -D "$branch"
                    warning "Force deleted: $branch"
                    ((deleted++))
                else
                    info "Kept: $branch"
                    ((kept++))
                fi
            fi
        else
            info "Kept: $branch"
            ((kept++))
        fi
    done
    
    echo ""
    echo "----------------------------------------"
    success "Cleanup completed!"
    echo "  Deleted: $deleted branches"
    echo "  Kept: $kept branches"
}

# Automatic safe cleanup (only merged branches)
auto_cleanup_safe() {
    info "Auto-cleaning only fully merged branches..."
    
    local deleted=0
    local local_branches=$(git branch --format='%(refname:short)')
    local remote_branches=$(git branch -r --format='%(refname:short)' | sed 's/origin\///')
    
    while IFS= read -r branch; do
        if [[ "$branch" != "main" && "$branch" != "develop" && "$branch" != "staging" ]]; then
            if ! echo "$remote_branches" | grep -q "^$branch$"; then
                # Only delete if fully merged
                if git branch --merged main | grep -q "^  $branch$"; then
                    git branch -d "$branch"
                    success "Deleted merged branch: $branch"
                    ((deleted++))
                fi
            fi
        fi
    done <<< "$local_branches"
    
    success "Auto-cleaned $deleted merged branches"
}

# Show help
show_help() {
    echo "Branch Cleanup Utility"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  check       - Check for orphaned local branches (default)"
    echo "  interactive - Interactive cleanup with confirmation"
    echo "  auto-safe   - Automatically delete only merged branches"
    echo "  help        - Show this help"
    echo ""
    echo "Examples:"
    echo "  $0              # Check status"
    echo "  $0 check        # Same as above"
    echo "  $0 interactive  # Interactive cleanup"
    echo "  $0 auto-safe    # Auto-delete merged branches only"
}

# Main
case "${1:-check}" in
    "check")
        check_deleted_branches
        ;;
    "interactive")
        interactive_cleanup
        ;;
    "auto-safe")
        auto_cleanup_safe
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac