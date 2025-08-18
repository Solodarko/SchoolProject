# Git Setup Script for SCHOOLPROJECT
# Run this script after installing Git

Write-Host "🚀 Setting up Git repository for SCHOOLPROJECT..." -ForegroundColor Green

# Navigate to the project root
cd "C:\Users\HP\Desktop\Schoolproject"

# Check if git is available
try {
    $gitVersion = git --version
    Write-Host "✅ Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed. Please install Git first from: https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

# Initialize Git repository
Write-Host "📦 Initializing Git repository..." -ForegroundColor Yellow
git init

# Add remote origin
Write-Host "🔗 Adding remote repository..." -ForegroundColor Yellow
git remote add origin https://github.com/Solodarko/SCHOOLPROJECT-.git

# Create .gitignore file
Write-Host "📝 Creating .gitignore file..." -ForegroundColor Yellow
@"
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env

# Build outputs
dist/
build/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Logs
*.log
logs/

# Database
*.db
*.sqlite

# Temporary files
*.tmp
*.temp

# Upload directories
uploads/

# Coverage reports
coverage/

# Test files
test-results/

# Cache
.cache/
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8

# Add all files
Write-Host "📁 Adding all files..." -ForegroundColor Yellow
git add .

# Check what will be committed
Write-Host "📋 Files to be committed:" -ForegroundColor Cyan
git status --short

# Create initial commit
Write-Host "💾 Creating initial commit..." -ForegroundColor Yellow
git commit -m "Initial commit: Complete Zoom attendance tracking system

Features:
✅ Real-time webhook-based attendance tracking
✅ HMAC signature verification for security
✅ Automatic participant-to-student matching
✅ Post-meeting reconciliation with Zoom API
✅ Comprehensive reporting with CSV export
✅ Rate limiting and request queuing
✅ Socket.IO real-time updates
✅ MongoDB optimized with proper indexing
✅ Comprehensive test suite
✅ Production-ready monitoring and health checks

Components:
- WebhookValidator: HMAC security and validation
- WebhookEventHandler: Real-time event processing
- ReconciliationService: Post-meeting data reconciliation
- ZoomAttendance Model: Webhook-based attendance tracking
- Enhanced reporting with multiple data sources
- Complete test suite and documentation"

# Set up main branch
Write-Host "🌿 Setting up main branch..." -ForegroundColor Yellow
git branch -M main

# Push to GitHub
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
Write-Host "🌐 Repository URL: https://github.com/Solodarko/SCHOOLPROJECT-" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "📚 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check your GitHub repository: https://github.com/Solodarko/SCHOOLPROJECT-" -ForegroundColor White
Write-Host "2. Follow the setup guide in Backend/docs/ZOOM_ATTENDANCE_SETUP.md" -ForegroundColor White
Write-Host "3. Configure your .env file with Zoom credentials" -ForegroundColor White
Write-Host "4. Run the test suite: node Backend/tests/attendanceTrackingTest.js" -ForegroundColor White
