#!/bin/bash

# Setup cron job for branch cleanup notifications

echo "Setting up branch cleanup reminder..."

# Create the cron command
CRON_CMD="0 9 * * 1 cd /Users/Mea/code/github-ecosystem/ecosystem-central-command && ./scripts/branch-cleanup.sh check > /tmp/branch-cleanup-report.txt && [ -s /tmp/branch-cleanup-report.txt ] && osascript -e 'display notification \"Orphaned branches detected. Run branch cleanup.\" with title \"DevFlow Branch Cleanup\"'"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "branch-cleanup.sh"; then
    echo "⚠️  Cron job already exists. Remove it first with: crontab -e"
    exit 1
fi

# Add to crontab
(crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -

echo "✅ Branch cleanup reminder set for Mondays at 9 AM"
echo ""
echo "To view: crontab -l"
echo "To edit: crontab -e"
echo "To remove: crontab -r"