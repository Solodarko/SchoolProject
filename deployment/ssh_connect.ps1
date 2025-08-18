# SSH Connection Helper Script for DigitalOcean
param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP,
    
    [string]$Username = "root",
    
    [switch]$Debug
)

$SSHKey = "$env:USERPROFILE\.ssh\id_rsa_digitalocean"

Write-Host "🔧 SSH Connection Helper" -ForegroundColor Blue
Write-Host "Server: $ServerIP" -ForegroundColor Green
Write-Host "Username: $Username" -ForegroundColor Green
Write-Host "SSH Key: $SSHKey" -ForegroundColor Green

# Check if SSH key exists
if (!(Test-Path $SSHKey)) {
    Write-Host "❌ SSH key not found at: $SSHKey" -ForegroundColor Red
    Write-Host "Please run the SSH key generation first." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ SSH key found" -ForegroundColor Green

# Fix permissions
Write-Host "🔧 Setting correct permissions..." -ForegroundColor Blue
icacls $SSHKey /inheritance:r /grant:r "${env:USERNAME}:R" /grant:r "SYSTEM:R" | Out-Null

# Test connection with detailed output
Write-Host "🌐 Testing SSH connection..." -ForegroundColor Blue

$sshArgs = @(
    "-i", $SSHKey
    "-o", "StrictHostKeyChecking=no"
    "-o", "UserKnownHostsFile=NUL"
    "-o", "ConnectTimeout=10"
)

if ($Debug) {
    $sshArgs += "-v"
}

$sshArgs += "${Username}@${ServerIP}"

Write-Host "Command: ssh $($sshArgs -join ' ')" -ForegroundColor Gray

# Try to connect
try {
    & ssh @sshArgs
} catch {
    Write-Host "❌ SSH connection failed: $($_.Exception.Message)" -ForegroundColor Red
    
    Write-Host "`n🔍 Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Check if your DigitalOcean droplet is running" -ForegroundColor White
    Write-Host "2. Verify the IP address: $ServerIP" -ForegroundColor White
    Write-Host "3. Ensure SSH key was added to DigitalOcean during droplet creation" -ForegroundColor White
    Write-Host "4. Try connecting with password: ssh ${Username}@${ServerIP}" -ForegroundColor White
    Write-Host "5. Check DigitalOcean console for droplet status" -ForegroundColor White
    
    Write-Host "`n💡 Alternative solutions:" -ForegroundColor Blue
    Write-Host "1. Use PuTTY: Download from https://www.putty.org/" -ForegroundColor White
    Write-Host "2. Use DigitalOcean web console (Access → Console)" -ForegroundColor White
    Write-Host "3. Try password authentication first: ssh ${Username}@${ServerIP}" -ForegroundColor White
}

Write-Host "`n📋 Quick commands once connected:" -ForegroundColor Blue
Write-Host "- Create user: adduser schoolproject" -ForegroundColor White
Write-Host "- Add to sudo: usermod -aG sudo schoolproject" -ForegroundColor White
Write-Host "- Switch user: su - schoolproject" -ForegroundColor White
