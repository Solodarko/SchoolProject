#!/bin/bash

# School Project Deployment Script for DigitalOcean
# Make sure to run this script with sudo privileges

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="schoolproject"
PROJECT_DIR="/var/www/$PROJECT_NAME"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
NGINX_CONF="/etc/nginx/sites-available/$PROJECT_NAME"
PM2_ECOSYSTEM="$PROJECT_DIR/deployment/ecosystem.config.js"

echo -e "${BLUE}🚀 Starting deployment of $PROJECT_NAME...${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    print_error "Please don't run this script as root. Use sudo when needed."
    exit 1
fi

# Update system packages
echo -e "${BLUE}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y
print_status "System packages updated"

# Install Node.js 20.x
echo -e "${BLUE}📦 Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
print_status "Node.js installed: $(node -v)"

# Install global packages
echo -e "${BLUE}📦 Installing global npm packages...${NC}"
sudo npm install -g pm2 yarn
print_status "Global packages installed"

# Install system dependencies for canvas and face recognition
echo -e "${BLUE}📦 Installing system dependencies...${NC}"
sudo apt install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev python3 python3-pip
print_status "System dependencies installed"

# Install MongoDB
echo -e "${BLUE}🗄️ Installing MongoDB...${NC}"
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
print_status "MongoDB installed and started"

# Install Nginx
echo -e "${BLUE}🌐 Installing Nginx...${NC}"
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
print_status "Nginx installed and started"

# Create project directory
echo -e "${BLUE}📁 Setting up project directory...${NC}"
sudo mkdir -p $PROJECT_DIR
sudo chown -R $USER:$USER $PROJECT_DIR
print_status "Project directory created"

# Clone or copy project files (assuming you'll upload them)
echo -e "${BLUE}📂 Setting up project structure...${NC}"
mkdir -p $BACKEND_DIR
mkdir -p $FRONTEND_DIR
mkdir -p $PROJECT_DIR/logs
mkdir -p $PROJECT_DIR/uploads
print_status "Project structure created"

# Install backend dependencies
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
if [ -f "$BACKEND_DIR/package.json" ]; then
    cd $BACKEND_DIR
    npm install --production
    print_status "Backend dependencies installed"
else
    print_warning "Backend package.json not found. Please upload your project files first."
fi

# Build frontend
echo -e "${BLUE}🏗️ Building frontend...${NC}"
if [ -f "$FRONTEND_DIR/package.json" ]; then
    cd $FRONTEND_DIR
    npm install
    npm run build
    print_status "Frontend built successfully"
else
    print_warning "Frontend package.json not found. Please upload your project files first."
fi

# Setup environment file
echo -e "${BLUE}⚙️ Setting up environment configuration...${NC}"
if [ -f "$PROJECT_DIR/deployment/.env.production" ]; then
    cp $PROJECT_DIR/deployment/.env.production $BACKEND_DIR/.env
    print_status "Environment file copied"
else
    print_warning "Production environment file not found. Please configure manually."
fi

# Setup Nginx configuration
echo -e "${BLUE}🌐 Configuring Nginx...${NC}"
if [ -f "$PROJECT_DIR/deployment/nginx.conf" ]; then
    sudo cp $PROJECT_DIR/deployment/nginx.conf $NGINX_CONF
    sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/$PROJECT_NAME
    # Remove default site
    sudo rm -f /etc/nginx/sites-enabled/default
    # Test Nginx configuration
    sudo nginx -t
    sudo systemctl reload nginx
    print_status "Nginx configured and reloaded"
else
    print_warning "Nginx configuration file not found"
fi

# Setup PM2
echo -e "${BLUE}⚙️ Configuring PM2...${NC}"
if [ -f "$PM2_ECOSYSTEM" ]; then
    # Create PM2 log directory
    sudo mkdir -p /var/log/pm2
    sudo chown -R $USER:$USER /var/log/pm2
    
    # Start the application with PM2
    cd $PROJECT_DIR
    pm2 start deployment/ecosystem.config.js --env production
    pm2 save
    pm2 startup
    print_status "PM2 configured and application started"
else
    print_warning "PM2 ecosystem file not found"
fi

# Setup firewall
echo -e "${BLUE}🔥 Configuring firewall...${NC}"
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
print_status "Firewall configured"

# Setup SSL (Let's Encrypt) - Optional
read -p "Do you want to setup SSL with Let's Encrypt? (y/n): " setup_ssl
if [[ $setup_ssl == "y" || $setup_ssl == "Y" ]]; then
    read -p "Enter your domain name: " domain_name
    sudo apt install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d $domain_name
    print_status "SSL certificate installed"
fi

# Final status check
echo -e "${BLUE}🔍 Checking services status...${NC}"
echo "MongoDB: $(sudo systemctl is-active mongod)"
echo "Nginx: $(sudo systemctl is-active nginx)"
echo "PM2: $(pm2 list)"

print_status "Deployment completed successfully!"
echo -e "${GREEN}🎉 Your application should now be running at:${NC}"
echo -e "${BLUE}HTTP: http://your-server-ip${NC}"
if [[ $setup_ssl == "y" || $setup_ssl == "Y" ]]; then
    echo -e "${BLUE}HTTPS: https://$domain_name${NC}"
fi

echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Update your DNS records to point to this server"
echo "2. Configure your Zoom API credentials in the .env file"
echo "3. Test your application thoroughly"
echo "4. Setup monitoring and backup strategies"

echo -e "${BLUE}📊 Useful commands:${NC}"
echo "- Check PM2 status: pm2 status"
echo "- View PM2 logs: pm2 logs"
echo "- Restart app: pm2 restart schoolproject-backend"
echo "- Check Nginx status: sudo systemctl status nginx"
echo "- View Nginx logs: sudo tail -f /var/log/nginx/error.log"
