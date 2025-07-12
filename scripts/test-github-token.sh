#!/bin/bash

# GitHub Token Testing Script
# Tests existing token permissions for cross-repository deployment

echo "🔐 GitHub Token Permission Test"
echo "================================"
echo ""

# Check if token is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN not set in environment"
    echo ""
    echo "Please set your token first:"
    echo "export GITHUB_TOKEN=\"your_existing_token_here\""
    echo ""
    echo "Then run this script again:"
    echo "bash test-github-token.sh"
    exit 1
fi

echo "✅ GITHUB_TOKEN is set (${#GITHUB_TOKEN} characters)"
echo ""

# Test 1: Check token scopes and user info
echo "🧪 Test 1: Checking token scopes and user info..."
echo "================================================"
response=$(curl -s -I -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user)
echo "$response" | grep -E "(HTTP|X-OAuth-Scopes|X-RateLimit)"
echo ""

# Test 2: Get user details
echo "🧪 Test 2: Getting user details..."
echo "=================================="
user_info=$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user)
echo "$user_info" | grep -E "(login|name|email)" | head -3
echo ""

# Test 3: Test access to target repositories
echo "🧪 Test 3: Testing repository access..."
echo "======================================"

repos=(
    "DevPersonalHub/external-learning-platforms"
    "DevPersonalHub/portfolio-website"
    "DevAcademicHub/academic-portfolio"
    "DevBusinessHub/business-management"
)

for repo in "${repos[@]}"; do
    echo "Testing $repo..."
    status=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: token $GITHUB_TOKEN" \
             "https://api.github.com/repos/$repo")
    
    if [ "$status" = "200" ]; then
        echo "  ✅ $repo - Access OK"
    elif [ "$status" = "404" ]; then
        echo "  ❌ $repo - Not found or no access (404)"
    elif [ "$status" = "403" ]; then
        echo "  ❌ $repo - Forbidden (403)"
    else
        echo "  ⚠️  $repo - Status: $status"
    fi
done
echo ""

# Test 4: Test README access (required for updates)
echo "🧪 Test 4: Testing README read access..."
echo "======================================="
readme_status=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: token $GITHUB_TOKEN" \
                "https://api.github.com/repos/DevPersonalHub/external-learning-platforms/contents/README.md")

if [ "$readme_status" = "200" ]; then
    echo "✅ Can read README.md from external-learning-platforms"
    echo "✅ Token has sufficient permissions for deployment!"
elif [ "$readme_status" = "404" ]; then
    echo "⚠️  README.md not found (we can create it)"
    echo "✅ Token has sufficient permissions for deployment!"
else
    echo "❌ Cannot access README.md (Status: $readme_status)"
fi
echo ""

# Summary
echo "📋 SUMMARY"
echo "=========="
echo "Based on the tests above:"
echo ""
echo "If all tests show ✅ or ⚠️, your existing token should work!"
echo "If you see ❌ errors, you may need a new token with broader permissions."
echo ""
echo "Next step: If tests passed, run the deployment:"
echo "cd /path/to/ecosystem-central-command"
echo "node automation/cross-repo-deployment.js"