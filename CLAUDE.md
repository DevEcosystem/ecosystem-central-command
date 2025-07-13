# DevFlow Orchestrator - Claude Code Instructions

## Branch Management Automation

### Enterprise-Grade Branch Management
DevFlow recognizes that **parallel development and conflicts are normal in team environments**:

- **Team Branch Creation**: `create_team_branches` for sprint planning
- **Conflict Detection**: Early warning systems for potential conflicts  
- **Resolution Workflows**: Structured conflict resolution protocols
- **Team Monitoring**: `team_status` for ongoing coordination

### Branch Creation Protocol
Always use these commands to ensure proper synchronization:

```bash
# Quick setup (recommended)
./scripts/branch-utils.sh quick_branch feature/DEVFLOW-XX-description

# Manual steps
./scripts/branch-utils.sh sync_main
./scripts/branch-utils.sh create_feature_branch feature/DEVFLOW-XX-description
```

### VS Code Tasks (Ctrl+Shift+P → "Tasks: Run Task")
- **DevFlow: Quick Branch Setup** - Complete branch creation workflow
- **DevFlow: Sync Main Branch** - Update main from remote
- **DevFlow: Create Feature Branch** - Create new feature branch
- **DevFlow: Sync Feature Branch** - Merge main into current branch
- **DevFlow: Push Feature Branch** - Push with tracking setup

### Pre-Implementation Checklist
Before starting any issue implementation:

1. ✅ **Complete previous issues first** - Check for existing feature branches
2. ✅ Sync main branch: `./scripts/branch-utils.sh sync_main`
3. ✅ Create feature branch: `./scripts/branch-utils.sh create_feature_branch feature/DEVFLOW-XX-description`
4. ✅ Verify branch is based on latest main
5. ✅ Begin implementation

### Development Strategy: Enterprise Reality

#### **Enterprise Team Development** (Normal Pattern)
```bash
# ✅ Standard Practice: Sprint-based parallel development
Sprint Planning → Create all branches simultaneously:

Developer A: feature/DEVFLOW-13-auth-backend
Developer B: feature/DEVFLOW-14-auth-frontend  
Developer C: feature/DEVFLOW-15-user-profile
Developer D: feature/DEVFLOW-16-session-mgmt

# Result: 60-80% of PRs will have conflicts (NORMAL)
```

#### **Conflict Management** (Daily Reality)
```bash
# ✅ Expected: Regular conflict resolution
Week 1: 
- Merge auth-backend → No conflicts
- Merge auth-frontend → Conflicts in auth.js (30min to resolve)
- Merge user-profile → Conflicts in types.ts, auth.js (1hr to resolve)
- Merge session-mgmt → Conflicts in auth.js, user.tsx (45min to resolve)

# Total conflict resolution time: ~2.5 hours/week (ACCEPTABLE)
```

#### **Solo Development**: Conflict-Free Sequential
```bash
# ✅ Alternative for solo developers (reduced conflicts)
./scripts/branch-utils.sh quick_branch feature/DEVFLOW-13-api
# Complete → Merge → Start next
./scripts/branch-utils.sh quick_branch feature/DEVFLOW-14-ui
```

**Key Insight**: DevFlow supports both patterns. **Conflicts are not failures - they're inevitable in team development.**

### During Development
- Run `./scripts/branch-utils.sh sync_feature_branch` daily
- Auto-sync runs every 4 hours via GitHub Actions
- Conflicts create automatic issues for manual resolution

### Branch Naming Convention
```
feature/DEVFLOW-<issue-number>-<short-description>
```

Examples:
- `feature/DEVFLOW-13-github-api-integration`
- `feature/DEVFLOW-14-issue-classification`
- `feature/DEVFLOW-15-workflow-automation`

### Conflict Resolution
When merge conflicts occur:
1. Automatic issue is created with resolution steps
2. Manual resolution required:
   ```bash
   git checkout feature/DEVFLOW-XX-description
   git merge main
   # Resolve conflicts manually
   git add .
   git commit
   git push origin feature/DEVFLOW-XX-description
   ```

## Development Workflow

### Issue Implementation Sequence
1. Use `quick_branch` command for branch creation
2. Implement changes following architecture patterns
3. Create comprehensive tests
4. Update documentation
5. Run linting/type checking
6. Commit with conventional format
7. Push using `push_feature_branch`
8. Create PR for review

### Testing Commands
```bash
# Run tests (if available)
npm test

# Lint and type check
npm run lint
npm run typecheck
```

### Commit Message Format
```
feat: implement GitHub Projects V2 API integration (#XX)

- Add GitHubProjectsAPI with full GraphQL operations
- Implement organization-specific project templates
- Add intelligent rate limiting with exponential backoff

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Architecture Guidelines

### File Organization
```
devflow-orchestrator/
├── api/           # External API clients
├── config/        # Configuration and templates
├── core/          # Core business logic
├── tests/         # Unit and integration tests
└── utils/         # Shared utilities
```

### Code Patterns
- Use EventEmitter for core components
- Implement comprehensive error handling
- Add detailed logging with context
- Cache expensive operations
- Include rate limiting for API calls

### Documentation Requirements
- JSDoc comments for all public methods
- README updates for new features
- Architecture documentation updates
- Issue naming convention compliance

## Branch Cleanup & Maintenance

### Weekly Branch Cleanup
- **Automated monitoring**: GitHub Actions checks daily for orphaned branches
- **Issue notifications**: Auto-created weekly cleanup reminders
- **Manual cleanup**: Use `./scripts/branch-cleanup.sh interactive` 
- **Safety first**: Never auto-delete local branches (manual confirmation required)

### Cleanup Commands
```bash
# Check orphaned branches
./scripts/branch-cleanup.sh check

# Interactive cleanup (recommended)
./scripts/branch-cleanup.sh interactive

# Auto-delete merged branches only
./scripts/branch-cleanup.sh auto-safe
```

### VS Code Integration
- **Cmd+Shift+P** → "Tasks: Run Task" → "DevFlow: Branch Cleanup Check"
- **Cmd+Shift+P** → "Tasks: Run Task" → "DevFlow: Interactive Branch Cleanup"

For detailed guidance, see: `docs/BRANCH_CLEANUP_GUIDE.md`

## GitHub Integration

### Issues
- Use provided issue templates
- Follow emoji-based classification system
- Include comprehensive test plans
- Link to relevant PRs and branches

### Pull Requests
- Title format: `feat: description (#issue-number)`
- Include test coverage information
- Reference related issues
- Follow merge conflict resolution protocol

This file helps Claude Code understand the proper development workflow and ensures consistent branch management across all implementations.