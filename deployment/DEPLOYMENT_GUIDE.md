# DigitalOcean Deployment Guide

This guide will help you deploy your School Project (Node.js + React + MongoDB) to a DigitalOcean Droplet.

## Prerequisites

1. DigitalOcean account
2. Domain name (optional but recommended)
3. Zoom API credentials (if using Zoom features)
4. Your project files

## Step 1: Create DigitalOcean Droplet

1. **Login to DigitalOcean** and create a new Droplet
2. **Choose an image**: Ubuntu 22.04 LTS
3. **Choose plan**: 
   - Basic: $6/month (1GB RAM, 1 vCPU, 25GB SSD) for development
   - Basic: $12/month (2GB RAM, 1 vCPU, 50GB SSD) for production
4. **Choose datacenter region**: Closest to your users
5. **Authentication**: Add SSH keys (recommended) or use password
6. **Create Droplet**

## Step 2: Connect to Your Droplet

```bash
# Using SSH (replace YOUR_DROPLET_IP with actual IP)
ssh root@YOUR_DROPLET_IP

# Or if you created a non-root user
ssh username@YOUR_DROPLET_IP
```

## Step 3: Initial Server Setup

Create a non-root user with sudo privileges:

```bash
# Create new user
adduser your_username

# Add user to sudo group
usermod -aG sudo your_username

# Switch to new user
su - your_username
```

## Step 4: Upload Your Project Files

### Option A: Using SCP (from your local machine)

```bash
# Upload the entire project
scp -r C:\Users\HP\Desktop\Schoolproject username@YOUR_DROPLET_IP:/home/username/

# Or use WinSCP (Windows) or FileZilla for GUI
```

### Option B: Using Git (if your code is on GitHub)

```bash
# Install git
sudo apt update
sudo apt install -y git

# Clone your repository
git clone https://github.com/yourusername/your-repo.git
cd your-repo
```

## Step 5: Run the Deployment Script

```bash
# Make the script executable
chmod +x deployment/deploy.sh

# Run the deployment script
./deployment/deploy.sh
```

The script will:
- Install Node.js, MongoDB, Nginx
- Install PM2 for process management
- Install system dependencies
- Setup project structure
- Configure services
- Setup firewall
- Optionally setup SSL

## Step 6: Configure Your Application

### Update Environment Variables

```bash
# Edit the production environment file
nano /var/www/schoolproject/backend/.env
```

Update these important variables:
```env
MONGODB_URI=mongodb://localhost:27017/schoolproject_production
JWT_SECRET=your_super_secure_jwt_secret_key_here
FRONTEND_URL=https://your-domain.com
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
ZOOM_ACCOUNT_ID=your_zoom_account_id
```

### Update Nginx Configuration

```bash
# Edit nginx config
sudo nano /etc/nginx/sites-available/schoolproject
```

Update `server_name` with your actual domain:
```nginx
server_name your-domain.com www.your-domain.com;
```

Restart Nginx:
```bash
sudo systemctl reload nginx
```

## Step 7: Domain Configuration (If you have a domain)

1. **Point your domain to your droplet**:
   - Go to your domain registrar
   - Create an A record pointing to your droplet's IP address
   - Create a CNAME record for www pointing to your domain

2. **Setup SSL (Let's Encrypt)**:
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Step 8: Final Checks

```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs

# Check Nginx status
sudo systemctl status nginx

# Check MongoDB status
sudo systemctl status mongod

# Test your API
curl http://your-domain.com/api/health
```

## Useful Commands

### PM2 Commands
```bash
pm2 status                    # Check application status
pm2 logs                      # View logs
pm2 restart schoolproject-backend  # Restart application
pm2 stop schoolproject-backend     # Stop application
pm2 delete schoolproject-backend   # Delete application
```

### Nginx Commands
```bash
sudo nginx -t                 # Test configuration
sudo systemctl reload nginx   # Reload configuration
sudo systemctl restart nginx  # Restart Nginx
```

### MongoDB Commands
```bash
sudo systemctl status mongod  # Check MongoDB status
mongo                         # Connect to MongoDB shell
```

### System Monitoring
```bash
htop                          # Monitor system resources
df -h                         # Check disk space
free -m                       # Check memory usage
```

## Troubleshooting

### Common Issues

1. **Port 80/443 blocked**: Check firewall settings
```bash
sudo ufw status
sudo ufw allow 'Nginx Full'
```

2. **Application not starting**: Check logs
```bash
pm2 logs
sudo tail -f /var/log/nginx/error.log
```

3. **Database connection issues**: Check MongoDB
```bash
sudo systemctl status mongod
mongo # Test connection
```

4. **Memory issues**: Monitor and adjust PM2 config
```bash
free -m
pm2 monit
```

## Backup Strategy

### Database Backup
```bash
# Create backup
mongodump --db schoolproject_production --out /var/backups/mongodb/$(date +%Y%m%d)

# Restore backup
mongorestore --db schoolproject_production /var/backups/mongodb/20241216/schoolproject_production
```

### File Backup
```bash
# Backup uploads and logs
tar -czf /var/backups/files-$(date +%Y%m%d).tar.gz /var/www/schoolproject/uploads /var/www/schoolproject/logs
```

## Security Recommendations

1. **Keep system updated**:
```bash
sudo apt update && sudo apt upgrade -y
```

2. **Setup fail2ban**:
```bash
sudo apt install fail2ban
```

3. **Regular security audits**:
```bash
sudo apt install lynis
sudo lynis audit system
```

4. **Monitor logs regularly**:
```bash
sudo tail -f /var/log/auth.log
sudo tail -f /var/log/nginx/access.log
```

## Updating Your Application

```bash
# Pull latest changes (if using Git)
cd /var/www/schoolproject
git pull origin main

# Install new dependencies
cd backend && npm install --production
cd ../frontend && npm install && npm run build

# Restart application
pm2 restart schoolproject-backend
```

## Support

If you encounter issues:
1. Check the logs: `pm2 logs`
2. Check system logs: `sudo journalctl -xeu servicename`
3. Verify configurations
4. Check firewall and network settings
