# PowerShell script to upload project files to DigitalOcean droplet
# Run this from your local Windows machine

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP,
    
    [Parameter(Mandatory=$true)]
    [string]$Username,
    
    [string]$KeyPath,
    
    [switch]$UsePassword
)

# Configuration
$ProjectPath = "C:\Users\HP\Desktop\Schoolproject"
$RemotePath = "/home/$Username/schoolproject"

Write-Host "🚀 Starting file upload to DigitalOcean droplet..." -ForegroundColor Blue
Write-Host "Server: $ServerIP" -ForegroundColor Green
Write-Host "Username: $Username" -ForegroundColor Green

# Check if SCP is available (requires OpenSSH or use WinSCP)
try {
    $scpVersion = scp
    Write-Host "✅ SCP is available" -ForegroundColor Green
} catch {
    Write-Host "❌ SCP not found. Please install OpenSSH or use WinSCP manually." -ForegroundColor Red
    Write-Host "Alternative: Use WinSCP GUI tool to upload files" -ForegroundColor Yellow
    exit 1
}

# Build SCP command based on authentication method
if ($KeyPath) {
    $scpCommand = "scp -i `"$KeyPath`" -r `"$ProjectPath`" $Username@${ServerIP}:$RemotePath"
    Write-Host "Using SSH key: $KeyPath" -ForegroundColor Yellow
} else {
    $scpCommand = "scp -r `"$ProjectPath`" $Username@${ServerIP}:$RemotePath"
    Write-Host "Using password authentication" -ForegroundColor Yellow
}

Write-Host "Uploading files..." -ForegroundColor Blue
Write-Host "Command: $scpCommand" -ForegroundColor Gray

try {
    # Execute the SCP command
    Invoke-Expression $scpCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Files uploaded successfully!" -ForegroundColor Green
        
        Write-Host "`n📋 Next steps:" -ForegroundColor Blue
        Write-Host "1. SSH into your server: ssh $Username@$ServerIP" -ForegroundColor White
        Write-Host "2. Navigate to project: cd ~/schoolproject" -ForegroundColor White
        Write-Host "3. Run deployment script: ./deployment/deploy.sh" -ForegroundColor White
        
    } else {
        Write-Host "❌ Upload failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error during upload: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n💡 Alternative methods:" -ForegroundColor Yellow
    Write-Host "1. Use WinSCP (GUI): https://winscp.net/" -ForegroundColor White
    Write-Host "2. Use FileZilla with SFTP" -ForegroundColor White
    Write-Host "3. Use Git: Push to GitHub and clone on server" -ForegroundColor White
}

Write-Host "`n📁 Files to be uploaded:" -ForegroundColor Blue
Write-Host "- Backend code and dependencies" -ForegroundColor White
Write-Host "- Frontend code and build files" -ForegroundColor White
Write-Host "- Deployment configuration files" -ForegroundColor White
Write-Host "- Environment templates" -ForegroundColor White

# Example usage instructions
Write-Host "`n📝 Usage examples:" -ForegroundColor Blue
Write-Host "With SSH key:" -ForegroundColor Yellow
Write-Host ".\upload.ps1 -ServerIP '123.45.67.89' -Username 'myuser' -KeyPath 'C:\path\to\key.pem'" -ForegroundColor Gray
Write-Host "`nWith password:" -ForegroundColor Yellow
Write-Host ".\upload.ps1 -ServerIP '123.45.67.89' -Username 'myuser' -UsePassword" -ForegroundColor Gray
