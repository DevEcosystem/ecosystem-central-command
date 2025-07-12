#\!/bin/bash

# Manual Test Deploy Script for GitHub Stats Integration
echo "🧪 GitHub Stats Integration Manual Test"
echo "======================================"

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN not set. Please run:"
    echo "export GITHUB_TOKEN=\"your_token_here\""
    exit 1
fi

echo "✅ GitHub token is set"

# Test with one repository: external-learning-platforms
REPO_NAME="external-learning-platforms"
ORG_NAME="DevPersonalHub"
README_FILE="generated-readmes/${REPO_NAME}-README.md"

echo "🎯 Testing deployment to $ORG_NAME/$REPO_NAME"
echo "================================================"

# Check if generated README exists
if [ \! -f "$README_FILE" ]; then
    echo "❌ Generated README not found: $README_FILE"
    exit 1
fi

echo "✅ README file found ($(wc -c < "$README_FILE") characters)"

# Preview README content to verify language stats
echo "📊 README preview (language stats section):"
echo "--------------------------------------------"
grep -A 10 "Technology Stack" "$README_FILE" || echo "No Technology Stack section found"
echo "--------------------------------------------"

# Get current README SHA
echo "🔍 Getting current README information..."
RESPONSE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    "https://api.github.com/repos/$ORG_NAME/$REPO_NAME/contents/README.md")

if echo "$RESPONSE" | grep -q '"message.*Not Found"'; then
    echo "❌ Repository not found or not accessible: $ORG_NAME/$REPO_NAME"
    echo "Response: $RESPONSE"
    exit 1
fi

SHA=$(echo "$RESPONSE" | grep '"sha"' | head -1 | sed 's/.*"sha": *"\([^"]*\)".*/\1/')

if [ -z "$SHA" ]; then
    echo "📝 No existing README found - will create new one"
    SHA_PARAM=""
else
    echo "✅ Found existing README (SHA: ${SHA:0:7}...)"
    SHA_PARAM=", \"sha\": \"$SHA\""
fi

# Encode content to base64
echo "🔄 Encoding content for GitHub API..."
ENCODED_CONTENT=$(base64 -i "$README_FILE" | tr -d '\n')

# Create JSON payload
echo "📝 Creating API payload..."
cat > /tmp/manual_test_payload.json << PAYLOAD_EOF
{
  "message": "🧪 Manual test: Deploy GitHub Stats integrated README\n\n✨ Features:\n- Language statistics with progress bars\n- Organization-specific analytics\n- Professional styling (reduced emojis)\n\n🤖 Manual test deployment\n\nCo-Authored-By: Claude <noreply@anthropic.com>",
  "content": "$ENCODED_CONTENT"$SHA_PARAM
}
PAYLOAD_EOF

echo "🚀 Deploying to GitHub..."

# Deploy using curl
DEPLOY_RESPONSE=$(curl -s -X PUT \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    -H "Content-Type: application/json" \
    -d @/tmp/manual_test_payload.json \
    "https://api.github.com/repos/$ORG_NAME/$REPO_NAME/contents/README.md")

# Check if deployment was successful
if echo "$DEPLOY_RESPONSE" | grep -q '"commit"'; then
    echo "✅ SUCCESS\! README deployed to $ORG_NAME/$REPO_NAME"
    echo "🌐 View at: https://github.com/$ORG_NAME/$REPO_NAME"
    COMMIT_SHA=$(echo "$DEPLOY_RESPONSE" | grep '"sha"' | head -1 | sed 's/.*"sha": *"\([^"]*\)".*/\1/')
    echo "📊 Commit SHA: ${COMMIT_SHA:0:7}..."
    echo ""
    echo "🎉 GitHub Stats Integration: DEPLOYMENT SUCCESSFUL\!"
    echo "📊 Language statistics should now be visible on GitHub"
else
    echo "❌ Deployment failed for $ORG_NAME/$REPO_NAME"
    echo "Response: $DEPLOY_RESPONSE"
    exit 1
fi

# Clean up
rm -f /tmp/manual_test_payload.json

echo ""
echo "✅ Manual test completed successfully\!"
echo "🔗 Check the results at: https://github.com/$ORG_NAME/$REPO_NAME"
