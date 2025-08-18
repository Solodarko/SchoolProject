# Schoolproject - Full-Stack Application

A comprehensive school management system with React frontend, Node.js backend, and MongoDB database, featuring Zoom integration for meeting management and attendance tracking.

## 📁 Project Structure

```
Schoolproject/
├── Backend/                 # Node.js API server
│   ├── config/             # Database configuration
│   ├── middleware/         # Express middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── services/          # Business logic services
│   ├── utils/             # Utility functions
│   └── server.js          # Main server file
├── Frontend/               # React application
│   ├── src/               # Source code
│   │   ├── Components/    # React components
│   │   ├── Pages/         # Application pages
│   │   └── services/      # API services
│   └── dist/              # Built files
├── configs/               # Configuration files
│   ├── docker-compose.yml # Docker services configuration
│   ├── nginx.conf         # Nginx configuration
│   ├── .env.production    # Production environment variables
│   └── schoolproject.conf # Additional configurations
├── docs/                  # Documentation
│   ├── README.md          # This file (moved from root)
│   ├── DEPLOYMENT_GUIDE.md # Detailed deployment instructions
│   └── *.md              # Other documentation files
├── scripts/               # Utility scripts
│   ├── manage.ps1         # Windows management script
│   └── manage.sh          # Linux/Mac management script
├── tests/                 # Test files
│   ├── test-meeting-integration.js
│   ├── test-user-tracking.js
│   └── zoom-complete-debug.html
├── .env                   # Environment variables
└── package.json           # Node.js dependencies
```

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/) (if running locally)

### Installation

1. **Clone and navigate to the project**:
   ```bash
   git clone <your-repo-url>
   cd Schoolproject
   ```

2. **Configure Environment**:
   ```bash
   # Copy production config as template
   copy configs/.env.production .env
   # Edit .env with your actual values
   ```

3. **Deploy with Docker**:
   ```powershell
   # Windows PowerShell
   .\scripts\manage.ps1 start
   ```
   ```bash
   # Linux/Mac Bash
   ./scripts/manage.sh start
   ```

4. **Access the Application**:
   - **Frontend**: http://localhost
   - **Backend API**: http://localhost/api
   - **Database**: localhost:27017

## 🛠️ Management Commands

### Windows PowerShell
```powershell
.\scripts\manage.ps1 start    # Start all services
.\scripts\manage.ps1 stop     # Stop all services
.\scripts\manage.ps1 restart  # Full restart with rebuild
.\scripts\manage.ps1 logs     # View logs
.\scripts\manage.ps1 health   # Health check
.\scripts\manage.ps1 status   # Service status
```

### Linux/Mac Bash
```bash
./scripts/manage.sh start     # Start all services
./scripts/manage.sh stop      # Stop all services
./scripts/manage.sh restart   # Full restart with rebuild
./scripts/manage.sh logs      # View logs
```

## 📦 Services & Architecture

| Service | Port | Description |
|---------|------|-------------|
| **Nginx** | 80, 443 | Reverse proxy & static file server |
| **Backend** | 5000 | Node.js API with Socket.IO |
| **Frontend** | 3000 | React SPA (internal) |
| **MongoDB** | 27017 | Primary database |
| **Redis** | 6379 | Caching layer (optional) |

### Key Features
- 🎯 **Advanced Attendance Tracking**: Real-time webhook-based attendance with HMAC security
- 🎥 **Zoom Integration**: Meeting creation, management, and comprehensive reporting
- 👥 **Smart Student Matching**: Automatic participant-to-student linking
- 📊 **Real-time Analytics**: Live attendance monitoring with Socket.IO
- 📋 **Admin Reports**: Meeting ID | Student Name | Student ID | Email | Time Joined | Status
- 🔒 **Production Security**: HMAC signature verification and rate limiting
- 📱 **Responsive UI**: Modern React-based interface
- 🐳 **Containerized**: Docker-based deployment
- 🧪 **Comprehensive Testing**: Automated test suite for all components
- 📈 **Data Reconciliation**: Post-meeting API calls to ensure accuracy

## ⚙️ Configuration

### Environment Variables
Edit `.env` file with your configuration:

```env
# Database
MONGO_ROOT_PASSWORD=your-secure-password
MONGODB_URI=mongodb://localhost:27017/schoolproject

# Authentication
JWT_SECRET=your-jwt-secret-key

# Zoom Integration
ZOOM_CLIENT_ID=your-zoom-client-id
ZOOM_CLIENT_SECRET=your-zoom-client-secret
ZOOM_ACCOUNT_ID=your-zoom-account-id

# Application URLs
FRONTEND_URL=http://localhost
BACKEND_URL=http://localhost:5000

# Development
NODE_ENV=production
PORT=5000
```

### Docker Configuration
The main docker-compose.yml is located in `configs/docker-compose.yml` and includes:
- Multi-stage builds for optimization
- Health checks for all services
- Volume mounts for persistent data
- Network isolation
- Auto-restart policies

## 🧪 Testing

Run tests from the `tests/` directory:

```bash
# API Integration Tests
node tests/test-meeting-integration.js

# User Tracking Tests
node tests/test-user-tracking.js

# Complete Attendance Tracking System Tests
node Backend/tests/attendanceTrackingTest.js

# Open debugging interface
# Open tests/zoom-complete-debug.html in browser
```

### New Attendance Tracking Tests
The comprehensive test suite covers:
- ✅ Webhook configuration and validation
- ✅ HMAC signature verification
- ✅ Event simulation (join/leave/meeting end)
- ✅ Student matching algorithms
- ✅ Data reconciliation accuracy
- ✅ Report generation and CSV export
- ✅ Rate limiting and error handling

## 📚 Documentation

- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)**: Complete deployment instructions
- **[Zoom Attendance Setup](Backend/docs/ZOOM_ATTENDANCE_SETUP.md)**: NEW! Complete webhook setup guide
- **[API Documentation](docs/DEMO_MEETING_MANAGEMENT.md)**: API endpoints and usage
- **[Zoom Integration](docs/ZOOM_MEETING_MANAGEMENT_INTEGRATION.md)**: Zoom setup and configuration
- **Backend README**: Check `Backend/README.md` for API details
- **Frontend README**: Check `Frontend/README.md` for UI documentation

### New Attendance Tracking Documentation
- **[Setup Guide](Backend/docs/ZOOM_ATTENDANCE_SETUP.md)**: Complete webhook configuration
- **[Test Suite](Backend/tests/attendanceTrackingTest.js)**: Automated testing framework
- **[API Endpoints](Backend/routes/zoomWebhooks.js)**: Webhook and attendance APIs

## 🔧 Development

### Local Development Setup

1. **Backend Development**:
   ```bash
   cd Backend
   npm install
   npm run dev
   ```

2. **Frontend Development**:
   ```bash
   cd Frontend
   npm install
   npm run dev
   ```

3. **Database Setup**:
   ```bash
   # Use Docker for MongoDB
   docker run -d -p 27017:27017 --name mongodb mongo
   ```

### Code Structure
- **Backend**: Express.js with modular routing
- **Frontend**: React with component-based architecture
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO for live updates

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   # Check what's using the port
   netstat -ano | findstr :5000
   # Kill the process or change port in .env
   ```

2. **Docker Issues**:
   ```bash
   # Clean Docker system
   docker system prune -a
   # Restart Docker Desktop
   ```

3. **MongoDB Connection**:
   ```bash
   # Check MongoDB logs
   .\scripts\manage.ps1 logs mongodb
   ```

4. **Zoom Integration**:
   - Verify Zoom app credentials in `.env`
   - Check webhook URLs are accessible
   - Review Zoom app scopes and permissions

### Logs and Debugging
```bash
# View all service logs
.\scripts\manage.ps1 logs

# View specific service logs
docker logs schoolproject-backend-1
docker logs schoolproject-frontend-1

# Debug mode
NODE_ENV=development npm run dev
```

## 🔐 Security

- JWT-based authentication
- Environment variable protection
- CORS configuration
- Rate limiting implemented
- Input validation and sanitization
- HTTPS ready (configure SSL certificates)

## 🚀 Production Deployment

1. **Update Environment**:
   ```bash
   cp configs/.env.production .env
   # Edit with production values
   ```

2. **SSL Configuration**:
   - Update `configs/nginx.conf` with SSL settings
   - Add SSL certificates to appropriate directories

3. **Domain Configuration**:
   - Update FRONTEND_URL and BACKEND_URL
   - Configure DNS settings
   - Update CORS origins

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📞 Support

For issues and support:
1. Check the logs: `.\scripts\manage.ps1 logs`
2. Review configuration files in `configs/`
3. Check documentation in `docs/`
4. Verify Docker and system resources
5. Create an issue with detailed error information

**Quick Reference**:
```bash
# Full system start
.\scripts\manage.ps1 start

# System status
.\scripts\manage.ps1 status

# View logs
.\scripts\manage.ps1 logs

# Health check
.\scripts\manage.ps1 health

# Clean restart
.\scripts\manage.ps1 restart
```
