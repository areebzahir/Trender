@echo off
REM IKEA Ingestion - Git Push Script for Windows
REM Run this to push the IKEA ingestion code to GitHub

echo.
echo 🚀 Starting Git workflow for IKEA ingestion...
echo.

REM Create and checkout feature branch
echo 📝 Creating feature branch...
git checkout -b feature/ikea-ingestion

REM Stage files
echo 📦 Staging files...
git add scripts/ingest-ikea-ca.ts
git add scripts/verify-furniture-data.ts
git add docs/ikea-ingestion.md
git add IKEA_INGESTION_SUMMARY.md
git add GIT_PUSH_CHECKLIST.md
git add PR_DESCRIPTION.md
git add push-to-github.sh
git add push-to-github.bat
git add package.json
git add package-lock.json

REM Show status
echo.
echo 📋 Files to be committed:
git status --short

REM Confirm
echo.
set /p CONFIRM="Continue with commit? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo ❌ Aborted
    exit /b 1
)

REM Commit
echo 💾 Committing changes...
git commit -m "feat: Add IKEA Canada product ingestion system" -m "- Add IKEA ingestion script with API integration" -m "- Add data verification script" -m "- Add comprehensive documentation" -m "- Update package.json with new scripts" -m "- Support for 25 sample IKEA products" -m "- Ready for extension to full catalog" -m "" -m "Features:" -m "- Product details from IKEA unofficial API" -m "- Availability checking across stores" -m "- Dimension parsing and normalization" -m "- Image gallery support" -m "- Dry run mode for testing" -m "- Rate limiting and retry logic" -m "- Data quality verification" -m "- Extensible architecture for other stores" -m "" -m "Testing:" -m "npm run ingest:ikea-ca:dry" -m "npm run verify:furniture"

REM Push
echo ⬆️  Pushing to GitHub...
git push -u origin feature/ikea-ingestion

echo.
echo ✅ Successfully pushed to GitHub!
echo.
echo 🔗 Next steps:
echo 1. Visit: https://github.com/Haaziq-code/Trender/compare/feature/ikea-ingestion
echo 2. Click 'Create Pull Request'
echo 3. Use PR_DESCRIPTION.md for the PR body
echo.
echo Or use GitHub CLI:
echo gh pr create --title "feat: IKEA Canada Product Ingestion System" --body-file PR_DESCRIPTION.md
echo.
pause
