#!/bin/bash

# IKEA Ingestion - Git Push Script
# Run this to push the IKEA ingestion code to GitHub

echo "🚀 Starting Git workflow for IKEA ingestion..."
echo ""

# Check if we're in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Create and checkout feature branch
echo "📝 Creating feature branch..."
git checkout -b feature/ikea-ingestion

# Stage files
echo "📦 Staging files..."
git add scripts/ingest-ikea-ca.ts
git add scripts/verify-furniture-data.ts
git add docs/ikea-ingestion.md
git add IKEA_INGESTION_SUMMARY.md
git add GIT_PUSH_CHECKLIST.md
git add PR_DESCRIPTION.md
git add push-to-github.sh
git add package.json
git add package-lock.json

# Show status
echo ""
echo "📋 Files to be committed:"
git status --short

# Confirm
echo ""
read -p "Continue with commit? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted"
    exit 1
fi

# Commit
echo "💾 Committing changes..."
git commit -m "feat: Add IKEA Canada product ingestion system

- Add IKEA ingestion script with API integration
- Add data verification script  
- Add comprehensive documentation
- Update package.json with new scripts
- Support for 25 sample IKEA products
- Ready for extension to full catalog

Features:
- Product details from IKEA unofficial API
- Availability checking across stores
- Dimension parsing and normalization
- Image gallery support
- Dry run mode for testing
- Rate limiting and retry logic
- Data quality verification
- Extensible architecture for other stores

Testing:
npm run ingest:ikea-ca:dry
npm run verify:furniture"

# Push
echo "⬆️  Pushing to GitHub..."
git push -u origin feature/ikea-ingestion

echo ""
echo "✅ Successfully pushed to GitHub!"
echo ""
echo "🔗 Next steps:"
echo "1. Visit: https://github.com/Haaziq-code/Trender/compare/feature/ikea-ingestion"
echo "2. Click 'Create Pull Request'"
echo "3. Use PR_DESCRIPTION.md for the PR body"
echo ""
echo "Or use GitHub CLI:"
echo "gh pr create --title \"feat: IKEA Canada Product Ingestion System\" --body-file PR_DESCRIPTION.md"
