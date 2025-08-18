# Schoolproject Deployment Guide

## Overview

This guide will help you deploy the Schoolproject application using Docker and Nginx. The application consists of:

- **Frontend**: React application built with Vite
- **Backend**: Node.js/Express API server with Socket.IO
- **Database**: MongoDB
- **Proxy**: Nginx reverse proxy
- **Optional**: Redis for caching

## Prerequisites

Before starting, ensure you have:

- [Docker](https://www.docker.com/products/docker-desktop) installed and running
- [Docker Compose](https://docs.docker.com/compose/install/) installed
- Git (for version control)
- At least 4GB of available RAM
- At least 10GB of free disk space

### For Windows Users
- Install Docker Desktop for Windows
- Enable WSL 2 if prompted
- PowerShell 5.1 or later (for management scripts)

### For Linux/Mac Users
- Install Docker and Docker Compose
- Bash shell (for management scripts)

## Quick Start

1. **Clone and Navigate**
   ```bash
   cd /path/to/Schoolproject
   ```

2. **Configure Environment**
   ```bash
   # Copy and edit the production environment file
   cp .env.production .env
   # Edit .env with your actual values (see Configuration section)
   ```

3. **Deploy with Docker Compose**

   **On Windows (PowerShell):**
   ```powershell
   .\manage.ps1 start
   ```

   **On Linux/Mac (Bash):**
   ```bash
   chmod +x manage.sh
   ./manage.sh start
   ```

4. **Access the Application**
   - Frontend: http://localhost
   - Backend API: http://localhost/api
   - MongoDB: localhost:27017

## Configuration

### Environment Variables

Edit the `.env.production` file with your actual values:

```env
# Database
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-password
MONGO_DB_NAME=schoolproject

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key

# Zoom API (get from Zoom Marketplace)
ZOOM_CLIENT_ID=your-zoom-client-id
ZOOM_CLIENT_SECRET=your-zoom-client-secret
ZOOM_ACCOUNT_ID=your-zoom-account-id

# Frontend URL (change to your domain in production)
FRONTEND_URL=http://localhost  # or https://yourdomain.com
```

### SSL/HTTPS Configuration

For production with HTTPS:

1. Obtain SSL certificates (Let's Encrypt, CloudFlare, etc.)
2. Place certificates in `./ssl/` directory
3. Update `docker-compose.yml` to mount SSL certificates
4. Update `schoolproject.conf` to use HTTPS

## Management Commands

Use the management scripts to control your deployment:

### PowerShell (Windows)

```powershell
# Start all services
.\manage.ps1 start

# Stop all services
.\manage.ps1 stop

# Restart all services (rebuild + restart)
.\manage.ps1 restart

# Build Docker images
.\manage.ps1 build

# View logs
.\manage.ps1 logs

# Check service status
.\manage.ps1 status

# Health check
.\manage.ps1 health

# Run command in a service
.\manage.ps1 run -Service backend -Command "npm run seed"
```

### Bash (Linux/Mac)

```bash
# Start all services
./manage.sh start

# Stop all services
./manage.sh stop

# Restart all services
./manage.sh restart

# Build Docker images
./manage.sh build

# View logs
./manage.sh logs

# Run command in a service
./manage.sh run backend "npm run seed"
```

## Architecture

### Service Overview

| Service | Port | Purpose |
|---------|------|---------|
| Nginx | 80, 443 | Reverse proxy, static files |
| Backend | 5000 | API server, Socket.IO |
| Frontend | 3000 | React app (internal) |
| MongoDB | 27017 | Database |
| Redis | 6379 | Caching (optional) |

### Network Flow

```
Internet → Nginx (80/443) → Backend (5000) → MongoDB (27017)
                ↓
            Static Files (Frontend)
```

## Monitoring and Logs

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f nginx

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Health Checks

All services include health checks:

```bash
# Check container health
docker ps

# Check service endpoints
curl http://localhost/health    # Backend health
curl http://localhost           # Frontend
```

## Backup and Recovery

### Database Backup

```bash
# Create backup
docker exec schoolproject-mongodb mongodump --out /backup --db schoolproject

# Copy backup from container
docker cp schoolproject-mongodb:/backup ./mongodb-backup-$(date +%Y%m%d)
```

### Database Restore

```bash
# Copy backup to container
docker cp ./mongodb-backup schoolproject-mongodb:/backup

# Restore database
docker exec schoolproject-mongodb mongorestore /backup
```

### File Uploads Backup

```bash
# Backup uploads directory
docker cp schoolproject-backend:/app/uploads ./uploads-backup-$(date +%Y%m%d)
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error**: `bind: address already in use`

**Solution**:
```bash
# Find what's using the port
netstat -tulpn | grep :80

# Kill the process
sudo kill -9 <PID>

# Or change ports in docker-compose.yml
```

#### 2. Permission Denied

**Error**: `permission denied`

**Solution**:
```bash
# Fix script permissions (Linux/Mac)
chmod +x manage.sh

# Fix Docker permissions (Linux)
sudo usermod -aG docker $USER
# Then logout and login again
```

#### 3. MongoDB Connection Failed

**Error**: `MongoNetworkError` or connection timeout

**Solution**:
1. Check if MongoDB container is running: `docker ps`
2. Check MongoDB logs: `docker-compose logs mongodb`
3. Verify environment variables in `.env`
4. Ensure MongoDB container is healthy before backend starts

#### 4. Frontend Not Loading

**Error**: White screen or 404 errors

**Solution**:
1. Check if frontend build was successful
2. Verify Nginx configuration
3. Check browser console for errors
4. Ensure `REACT_APP_API_BASE_URL` is correct

#### 5. API Calls Failing

**Error**: CORS errors or API not found

**Solution**:
1. Check backend logs: `docker-compose logs backend`
2. Verify Nginx proxy configuration
3. Check environment variables
4. Test backend directly: `curl http://localhost:5000/health`

### Debug Commands

```bash
# Enter a running container
docker exec -it schoolproject-backend sh
docker exec -it schoolproject-mongodb mongosh

# Check container resource usage
docker stats

# Inspect container configuration
docker inspect schoolproject-backend

# Check network connectivity
docker exec schoolproject-backend ping mongodb
```

## Performance Optimization

### Production Recommendations

1. **Resource Limits**: Set memory and CPU limits in docker-compose.yml
2. **Nginx Caching**: Enable caching for static assets
3. **Database Optimization**: Add indexes to frequently queried fields
4. **Log Rotation**: Configure log rotation to prevent disk space issues
5. **Monitoring**: Set up monitoring with Prometheus/Grafana

### Example Resource Limits

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Security Considerations

### Production Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Configure firewall rules
- [ ] Enable fail2ban for brute force protection
- [ ] Regular security updates
- [ ] Database access restrictions
- [ ] Environment variable security

### Security Headers

The Nginx configuration includes security headers:

```nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-XSS-Protection "1; mode=block";
add_header X-Content-Type-Options "nosniff";
```

## Maintenance

### Regular Tasks

1. **Weekly**: Check logs for errors
2. **Monthly**: Update Docker images
3. **Quarterly**: Database maintenance and optimization
4. **As needed**: Security updates

### Update Process

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
./manage.ps1 restart  # Windows
./manage.sh restart   # Linux/Mac
```

## Support

### Getting Help

1. Check the logs first: `./manage.ps1 logs`
2. Verify configuration files
3. Test individual components
4. Check Docker and system resources

### Useful Resources

- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## Quick Reference Commands

```bash
# Start everything
./manage.sh start

# Stop everything
./manage.sh stop

# View all logs
./manage.sh logs

# Check health
./manage.ps1 health

# Database backup
docker exec schoolproject-mongodb mongodump --out /backup

# Update application
git pull && ./manage.sh restart
```

That's it! Your Schoolproject should now be running successfully on Nginx.
