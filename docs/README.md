# Schoolproject - Nginx Deployment

A full-stack application with React frontend, Node.js backend, and MongoDB database, deployed with Docker and Nginx.

## Quick Start 🚀

1. **Prerequisites**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop)

2. **Configure Environment**:
   ```bash
   # Copy and edit environment variables
   copy .env.production .env
   # Edit .env with your actual values
   ```

3. **Deploy**:
   ```powershell
   # Windows PowerShell
   .\manage.ps1 start
   ```
   ```bash
   # Linux/Mac Bash
   ./manage.sh start
   ```

4. **Access**:
   - Frontend: http://localhost
   - Backend API: http://localhost/api
   - Database: localhost:27017

## Management Commands 🛠️

```powershell
# Windows PowerShell
.\manage.ps1 start    # Start all services
.\manage.ps1 stop     # Stop all services
.\manage.ps1 restart  # Full restart with rebuild
.\manage.ps1 logs     # View logs
.\manage.ps1 health   # Health check
.\manage.ps1 status   # Service status
```

```bash
# Linux/Mac Bash
./manage.sh start     # Start all services
./manage.sh stop      # Stop all services
./manage.sh restart   # Full restart with rebuild
./manage.sh logs      # View logs
```

## Services 📦

| Service | Port | Description |
|---------|------|-------------|
| **Nginx** | 80, 443 | Reverse proxy & static files |
| **Backend** | 5000 | Node.js API & Socket.IO |
| **Frontend** | 3000 | React app (internal) |
| **MongoDB** | 27017 | Database |
| **Redis** | 6379 | Caching (optional) |

## Configuration ⚙️

Edit `.env` file with your values:

```env
# Required
MONGO_ROOT_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret
ZOOM_CLIENT_ID=your-zoom-client-id
ZOOM_CLIENT_SECRET=your-zoom-client-secret
ZOOM_ACCOUNT_ID=your-zoom-account-id

# Optional
FRONTEND_URL=http://localhost  # Change for production
```

## Features ✨

- **Nginx Reverse Proxy**: Load balancing and SSL termination
- **Docker Containerization**: Easy deployment and scaling
- **Health Checks**: Built-in monitoring for all services
- **Auto-restart**: Services automatically restart on failure
- **Production Ready**: Optimized configurations and security headers
- **Development Friendly**: Hot reloading and debugging support

## Troubleshooting 🔧

Common issues and solutions:

1. **Port in use**: Change ports in `docker-compose.yml`
2. **Permission denied**: Run `chmod +x manage.sh` (Linux/Mac)
3. **MongoDB connection**: Check logs with `.\manage.ps1 logs`
4. **Frontend not loading**: Verify build process and Nginx config

## Documentation 📚

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete documentation including:
- Detailed setup instructions
- SSL/HTTPS configuration
- Backup and recovery procedures
- Performance optimization
- Security considerations
- Monitoring and maintenance

## Support 💬

For issues:
1. Check logs: `.\manage.ps1 logs`
2. Verify configuration files
3. Check Docker and system resources
4. Review the deployment guide

---

**Quick Commands Reference**:
```bash
# Start everything
.\manage.ps1 start

# Check what's running
.\manage.ps1 status

# View logs
.\manage.ps1 logs

# Health check
.\manage.ps1 health

# Complete restart
.\manage.ps1 restart
```
