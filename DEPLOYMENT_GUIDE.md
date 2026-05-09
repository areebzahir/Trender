# 🚀 IKEA Ingestion Deployment Guide

## Quick Start (Windows)

### Option 1: Automated Script (Easiest)
```cmd
push-to-github.bat
```

### Option 2: Manual Commands
Follow the steps below.

---

## 📋 Step-by-Step Manual Process

### 1. Check Current Status
```bash
git status
```

### 2. Create Feature Branch
```bash
git checkout -b feature/ikea-ingestion
```

### 3. Stage All New Files
```bash
git add scripts/ingest-ikea-ca.ts scripts/verify-furniture-data.ts
git add docs/ikea-ingestion.md IKEA_INGESTION_SUMMARY.md
git add GIT_PUSH_CHECKLIST.md PR_DESCRIPTION.md DEPLOYMENT_GUIDE.md
git add push-to-github.sh push-to-github.bat
git add package.json package-lock.json
```

### 4. Verify Staged Files
```bash
git status
```

You should see:
- ✅ `scripts/ingest-ikea-ca.ts`
- ✅ `scripts/verify-furniture-data.ts`
- ✅ `docs/ikea-ingestion.md`
- ✅ `IKEA_INGESTION_SUMMARY.md`
- ✅ `package.json`
- ✅ `package-lock.json`
- ✅ Helper files (checklists, scripts)

### 5. Commit Changes
```bash
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
```

### 6. Push to GitHub
```bash
git push -u origin feature/ikea-ingestion
```

### 7. Create Pull Request

#### Option A: GitHub Web Interface
1. Visit: https://github.com/Haaziq-code/Trender/compare/feature/ikea-ingestion
2. Click "Create Pull Request"
3. Copy content from `PR_DESCRIPTION.md` into the PR body
4. Click "Create Pull Request"

#### Option B: GitHub CLI
```bash
gh pr create --title "feat: IKEA Canada Product Ingestion System" --body-file PR_DESCRIPTION.md
```

---

## 🔍 PR Review Checklist

### Before Merging
- [ ] All files committed correctly
- [ ] No sensitive data in commits
- [ ] `.env` file not committed (should be in `.gitignore`)
- [ ] Documentation is complete
- [ ] Package.json scripts work
- [ ] TypeScript compiles without errors

### Test Commands (Run These After Merge)
```bash
# Install new dependencies
npm install

# Test dry run
npm run ingest:ikea-ca:dry

# Test with limit
npm run ingest:ikea-ca -- --dry-run --limit=3

# Verify data (after running live)
npm run verify:furniture
```

---

## 🔄 Merge Process

### 1. Review the PR
- Check all files are included
- Review code changes
- Ensure documentation is clear

### 2. Run Tests (Optional)
```bash
# Switch to feature branch
git checkout feature/ikea-ingestion

# Install dependencies
npm install

# Test TypeScript compilation
npx tsc --noEmit

# Test dry run
npm run ingest:ikea-ca:dry
```

### 3. Merge PR
On GitHub:
1. Click "Merge Pull Request"
2. Choose "Squash and Merge" (recommended)
3. Confirm merge

### 4. Pull Latest Changes
```bash
# Switch back to main
git checkout main

# Pull merged changes
git pull origin main

# Install any new dependencies
npm install
```

### 5. Verify Everything Works
```bash
# Test the app still builds
npm run build

# Test IKEA ingestion
npm run ingest:ikea-ca:dry

# Start dev server
npm run dev
```

---

## 🐛 Troubleshooting

### "Branch already exists"
```bash
# Delete local branch
git branch -D feature/ikea-ingestion

# Start over
git checkout -b feature/ikea-ingestion
```

### "Nothing to commit"
```bash
# Check if files are staged
git status

# Stage files manually
git add scripts/ingest-ikea-ca.ts
# ... etc
```

### "Push rejected"
```bash
# Pull latest changes first
git pull origin main

# Resolve any conflicts
# Then push again
git push -u origin feature/ikea-ingestion
```

### "Module not found" after merge
```bash
# Reinstall dependencies
npm install

# Clear cache if needed
npm cache clean --force
npm install
```

---

## 📊 Post-Merge Verification

### 1. Check App Builds
```bash
npm run build
```

### 2. Check TypeScript
```bash
npx tsc --noEmit
```

### 3. Test IKEA Ingestion
```bash
# Dry run
npm run ingest:ikea-ca:dry

# With limit
npm run ingest:ikea-ca -- --dry-run --limit=2
```

### 4. Test Verification Script
```bash
npm run verify:furniture
```

### 5. Start Dev Server
```bash
npm run dev
```

Visit http://localhost:5173 and ensure app loads correctly.

---

## 🎯 Success Criteria

After merge, you should have:
- ✅ All files in main branch
- ✅ `npm install` works
- ✅ `npm run build` succeeds
- ✅ `npm run dev` starts app
- ✅ `npm run ingest:ikea-ca:dry` works
- ✅ `npm run verify:furniture` works
- ✅ No TypeScript errors
- ✅ App loads in browser

---

## 🚀 Next Steps After Merge

### 1. Test with Live Data
```bash
# Run actual ingestion (25 sample products)
npm run ingest:ikea-ca

# Verify data was inserted
npm run verify:furniture
```

### 2. Choose Full Catalog Approach
- **Option A:** Apify scraper (paid, ~$50-100)
- **Option B:** Puppeteer scraping (free, 4-8 hours work)

### 3. Extend to Other Stores
- Structube
- Wayfair Canada
- Article
- EQ3
- The Brick
- Leon's

---

## 📞 Need Help?

### Documentation
- `docs/ikea-ingestion.md` - Complete guide
- `IKEA_INGESTION_SUMMARY.md` - Summary
- `GIT_PUSH_CHECKLIST.md` - Checklist

### Common Issues
- Check `.env` file has Supabase credentials
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
- Run `npm install` after pulling changes
- Clear `node_modules` and reinstall if issues persist

---

## ✅ Deployment Complete!

Once merged and verified, your IKEA ingestion system is ready to use! 🎉
