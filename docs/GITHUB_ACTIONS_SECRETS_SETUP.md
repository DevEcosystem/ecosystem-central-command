# 🔐 GitHub Actions Secrets Setup Guide

## 📋 Required Setup

To enable enterprise-level automation, you need to configure GitHub repository secrets.

### 🎯 Secret Configuration

#### 1. Navigate to Repository Settings
```
GitHub Repository → Settings → Secrets and variables → Actions
```

#### 2. Add Required Secret

**Secret Name**: `ECOSYSTEM_GITHUB_TOKEN`  
**Secret Value**: Your Personal Access Token  

**Token Requirements**:
- ✅ **Scopes**: `repo` + `workflow`
- ✅ **Access**: All 8 target repositories
- ✅ **Permissions**: Read/Write for README.md files
- ✅ **Organizations**: DevPersonalHub, DevAcademicHub, DevBusinessHub, DevEcosystem

### 🚀 Setup Steps

#### Step 1: Create/Verify Personal Access Token
```bash
# Test your existing token
export GITHUB_TOKEN="your_existing_token"
bash scripts/test-github-token.sh
```

If the test passes, use the same token. If not, create a new one:

1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select scopes: `repo`, `workflow`
4. Set expiration: 90 days (renewable)

#### Step 2: Add Secret to Repository
1. Go to: `https://github.com/DevEcosystem/ecosystem-central-command/settings/secrets/actions`
2. Click "New repository secret"
3. Name: `ECOSYSTEM_GITHUB_TOKEN`
4. Value: `your_personal_access_token`
5. Click "Add secret"

#### Step 3: Verify Setup
After adding the secret, the GitHub Actions workflow will have access to:
- All 8 target repositories
- README.md read/write permissions
- Cross-organizational deployment capabilities

### 🔒 Security Best Practices

#### Token Management
- **Rotation**: Update token every 90 days
- **Monitoring**: Review token usage in GitHub settings
- **Scope Limitation**: Only grant necessary permissions
- **Access Review**: Regularly audit repository access

#### Secret Security
- **Never log secrets**: Secrets are automatically masked in logs
- **Environment isolation**: Secrets only available in workflow context
- **Access control**: Only repository administrators can manage secrets
- **Audit trail**: All secret access is logged

### ✅ Verification Checklist

After setup, verify:
- [ ] Secret `ECOSYSTEM_GITHUB_TOKEN` is added to repository
- [ ] Token has `repo` and `workflow` scopes
- [ ] Token can access all 8 target repositories
- [ ] Workflow can run manually via "Actions" tab
- [ ] Test deployment completes successfully

### 🚨 Troubleshooting

#### Common Issues

**Issue**: "Secret not found"
- **Solution**: Verify secret name is exactly `ECOSYSTEM_GITHUB_TOKEN`

**Issue**: "Repository access denied"  
- **Solution**: Check token scopes and organization membership

**Issue**: "API rate limiting"
- **Solution**: Add delays between requests (already implemented)

**Issue**: "Workflow permission denied"
- **Solution**: Ensure `workflow` scope is included in token

### 🎯 Next Steps

Once secrets are configured:
1. ✅ Manual workflow trigger test
2. ✅ Verify all deployments work
3. ✅ Enable daily automation schedule
4. ✅ Monitor first automated run

---

*Setup guide for Enterprise-Level GitHub Actions Automation*  
*Security Level: Enterprise*  
*Last Updated: 2025-07-12*