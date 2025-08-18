# PowerShell script for managing the Schoolproject deployment

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('start','stop','restart','build','logs','run','status','health')]
    [string]$Action,
    
    [Parameter(Mandatory=$false)]
    [string]$Service,
    
    [Parameter(Mandatory=$false)]
    [string]$Command
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Define variables
$ComposeFile = "docker-compose.yml"
$EnvFile = ".env.production"

# Function to check if Docker is running
function Test-Docker {
    try {
        docker info *> $null
        Write-Host "✓ Docker is running" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "✗ Docker is not running. Please start Docker and try again." -ForegroundColor Red
        exit 1
    }
}

# Function to build images
function Build-Images {
    Write-Host "🔧 Building Docker images..." -ForegroundColor Yellow
    docker-compose -f $ComposeFile --env-file $EnvFile build --parallel --force-rm
    Write-Host "✓ Images built successfully" -ForegroundColor Green
}

# Function to start services
function Start-Services {
    Write-Host "🚀 Starting services..." -ForegroundColor Yellow
    docker-compose -f $ComposeFile --env-file $EnvFile up -d --remove-orphans
    Write-Host "✓ Services started successfully" -ForegroundColor Green
    Get-ServiceStatus
}

# Function to stop services
function Stop-Services {
    Write-Host "🛑 Stopping services..." -ForegroundColor Yellow
    docker-compose -f $ComposeFile --env-file $EnvFile down
    Write-Host "✓ Services stopped successfully" -ForegroundColor Green
}

# Function to view logs
function Get-Logs {
    Write-Host "📋 Showing logs (press Ctrl+C to exit)..." -ForegroundColor Yellow
    docker-compose -f $ComposeFile logs -f --tail=100
}

# Function to get service status
function Get-ServiceStatus {
    Write-Host "📊 Service Status:" -ForegroundColor Cyan
    docker-compose -f $ComposeFile ps
}

# Function to check health
function Get-Health {
    Write-Host "🏥 Health Check:" -ForegroundColor Cyan
    
    # Check MongoDB
    Write-Host "Checking MongoDB..." -ForegroundColor Yellow
    try {
        $mongoHealth = docker exec schoolproject-mongodb mongosh --eval "db.adminCommand('ping')" --quiet 2>$null
        if ($mongoHealth -like "*ok*") {
            Write-Host "✓ MongoDB is healthy" -ForegroundColor Green
        } else {
            Write-Host "✗ MongoDB is unhealthy" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ MongoDB is not responding" -ForegroundColor Red
    }
    
    # Check Backend
    Write-Host "Checking Backend..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 5 2>$null
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Backend is healthy" -ForegroundColor Green
        } else {
            Write-Host "✗ Backend returned status code: $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ Backend is not responding" -ForegroundColor Red
    }
    
    # Check Nginx
    Write-Host "Checking Nginx..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://localhost" -TimeoutSec 5 2>$null
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Nginx is healthy" -ForegroundColor Green
        } else {
            Write-Host "✗ Nginx returned status code: $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ Nginx is not responding" -ForegroundColor Red
    }
}

# Function to restart services
function Restart-Services {
    Stop-Services
    Build-Images
    Start-Services
}

# Function to run command in service
function Invoke-ServiceCommand {
    if (-not $Service -or -not $Command) {
        Write-Host "✗ Usage: .\manage.ps1 run -Service <service_name> -Command <command>" -ForegroundColor Red
        exit 1
    }
    Write-Host "🔧 Running command '$Command' in service '$Service'..." -ForegroundColor Yellow
    docker-compose -f $ComposeFile exec $Service $Command
}

# Main script logic
Write-Host "Schoolproject Management Script" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Magenta

Test-Docker

switch ($Action) {
    'start' {
        Start-Services
    }
    'stop' {
        Stop-Services
    }
    'restart' {
        Restart-Services
    }
    'build' {
        Build-Images
    }
    'logs' {
        Get-Logs
    }
    'status' {
        Get-ServiceStatus
    }
    'health' {
        Get-Health
    }
    'run' {
        Invoke-ServiceCommand
    }
    default {
        Write-Host "✗ Unknown action: $Action" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Operation completed successfully!" -ForegroundColor Green
