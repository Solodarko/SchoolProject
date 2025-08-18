module.exports = {
  apps: [{
    name: 'schoolproject-backend',
    script: '/var/www/schoolproject/backend/server.js',
    cwd: '/var/www/schoolproject/backend',
    instances: 1, // or 'max' for cluster mode
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    log_file: '/var/log/pm2/schoolproject-backend.log',
    out_file: '/var/log/pm2/schoolproject-backend-out.log',
    error_file: '/var/log/pm2/schoolproject-backend-error.log',
    time: true,
    // Advanced PM2 features
    kill_timeout: 3000,
    wait_ready: true,
    listen_timeout: 3000,
    // Restart conditions
    min_uptime: '10s',
    max_restarts: 10,
    // Monitoring
    monitoring: false,
    pmx: true,
    // Log rotation
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Resource limits
    max_memory_restart: '500M',
    // Health checks
    health_check_url: 'http://localhost:5000/api/health',
    health_check_grace_period: 3000
  }]
};
