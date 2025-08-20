import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Typography,
  Button,
  IconButton,
  Switch,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Badge,
  Tooltip,
  Stack,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Cached as CachedIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Storage as StorageIcon,
  Timeline as TimelineIcon,
  NetworkCheck as NetworkIcon,
  RestartAlt as ResetIcon,
  MonitorHeart as HealthIcon,
  Api as ApiIcon,
  CloudQueue as CloudIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Videocam as VideocamIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import attendanceAPI from '../../services/attendanceApi';

// Enhanced Attendance API functions for 85% threshold tracking
const enhancedAttendanceAPI = {
  async getDashboardSummary(days = 30) {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const response = await fetch(`${backendUrl}/enhanced-attendance/dashboard-summary?days=${days}`);
    return await response.json();
  },
  
  async getMeetings(limit = 50, offset = 0) {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const response = await fetch(`${backendUrl}/enhanced-attendance/meetings?limit=${limit}&offset=${offset}`);
    return await response.json();
  },
  
  async getMeetingDetails(meetingId) {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const response = await fetch(`${backendUrl}/enhanced-attendance/user-sessions/${meetingId}`);
    return await response.json();
  },
  
  async downloadReport(meetingId, format = 'csv') {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const response = await fetch(`${backendUrl}/enhanced-attendance/report/${meetingId}?format=${format}`);
    return response;
  },
  
  async calculateAttendance(meetingId, force = false) {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const response = await fetch(`${backendUrl}/enhanced-attendance/calculate/${meetingId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force })
    });
    return await response.json();
  }
};

const EnhancedAttendanceTrackerDashboard = () => {
  const theme = useTheme();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState('');
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [systemOverview, setSystemOverview] = useState(null);
  const [healthMetrics, setHealthMetrics] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);
  const [retryStats, setRetryStats] = useState(null);
  const [configuration, setConfiguration] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // UI state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [configDialog, setConfigDialog] = useState(false);
  const [tempConfig, setTempConfig] = useState({});
  const [resetDialog, setResetDialog] = useState(false);

  // Load enhanced dashboard data
  const loadEnhancedData = useCallback(async () => {
    try {
      const [dashboardResult, meetingsResult] = await Promise.allSettled([
        enhancedAttendanceAPI.getDashboardSummary(),
        enhancedAttendanceAPI.getMeetings()
      ]);
      
      if (dashboardResult.status === 'fulfilled' && dashboardResult.value.success) {
        setDashboardSummary(dashboardResult.value.data);
      }
      
      if (meetingsResult.status === 'fulfilled' && meetingsResult.value.success) {
        setMeetings(meetingsResult.value.data);
      }
    } catch (error) {
      console.error('Failed to load enhanced dashboard data:', error);
      showNotification('Failed to load enhanced dashboard data', 'error');
    }
  }, []);

  // Load all data
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load enhanced attendance data first
      await loadEnhancedData();
      
      const [overviewResult, metricsResult, cacheResult, retryResult, configResult] = await Promise.allSettled([
        attendanceAPI.getSystemOverview(),
        attendanceAPI.getEnhancedMetrics(),
        attendanceAPI.getCacheStats(),
        attendanceAPI.getRetryStats(),
        attendanceAPI.getConfiguration()
      ]);

      if (overviewResult.status === 'fulfilled') {
        setSystemOverview(overviewResult.value.overview);
      }
      
      if (metricsResult.status === 'fulfilled') {
        setHealthMetrics(metricsResult.value.healthMetrics);
        setTrackingStatus(metricsResult.value.trackingStatus);
      }
      
      if (cacheResult.status === 'fulfilled') {
        setCacheStats(cacheResult.value.cache);
      }
      
      if (retryResult.status === 'fulfilled') {
        setRetryStats(retryResult.value.retries);
      }
      
      if (configResult.status === 'fulfilled') {
        setConfiguration(configResult.value.configuration);
        setTempConfig(configResult.value.configuration);
      }
      
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      showNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto refresh effect
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadAllData, refreshInterval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, loadAllData]);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Utility functions
  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value) => {
    return `${parseFloat(value || 0).toFixed(1)}%`;
  };

  const handleConfigUpdate = async () => {
    try {
      setLoading(true);
      await attendanceAPI.updateConfiguration(tempConfig);
      setConfiguration(tempConfig);
      setConfigDialog(false);
      showNotification('Configuration updated successfully', 'success');
      await loadAllData();
    } catch (error) {
      console.error('Failed to update configuration:', error);
      showNotification('Failed to update configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetMetrics = async () => {
    try {
      setLoading(true);
      await attendanceAPI.resetMetrics();
      setResetDialog(false);
      showNotification('Metrics reset successfully', 'success');
      await loadAllData();
    } catch (error) {
      console.error('Failed to reset metrics:', error);
      showNotification('Failed to reset metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Render overview cards
  const renderOverviewCards = () => {
    if (!systemOverview) return null;

    const cards = [
      {
        title: 'System Health',
        value: systemOverview.health?.status || 'unknown',
        icon: <HealthIcon />,
        color: getStatusColor(systemOverview.health?.status),
        subtitle: `${systemOverview.health?.requests?.total || 0} total requests`
      },
      {
        title: 'Cache Hit Rate',
        value: `${systemOverview.cache?.hitRate || 0}%`,
        icon: <CachedIcon />,
        color: parseFloat(systemOverview.cache?.hitRate || 0) > 80 ? 'success' : 'warning',
        subtitle: `${systemOverview.cache?.hits || 0} hits, ${systemOverview.cache?.misses || 0} misses`
      },
      {
        title: 'Active Meetings',
        value: systemOverview.tracking?.activeMeetings || 0,
        icon: <VideocamIcon />,
        color: 'primary',
        subtitle: `${systemOverview.tracking?.totalMeetingsTracked || 0} total tracked`
      },
      {
        title: 'API Success Rate',
        value: systemOverview.health?.requests?.total > 0 ? 
               `${((systemOverview.health.requests.successful / systemOverview.health.requests.total) * 100).toFixed(1)}%` : 
               '0%',
        icon: <ApiIcon />,
        color: systemOverview.health?.requests?.total > 0 && 
               (systemOverview.health.requests.successful / systemOverview.health.requests.total) > 0.95 ? 'success' : 'warning',
        subtitle: `${systemOverview.health?.requests?.successful || 0}/${systemOverview.health?.requests?.total || 0} successful`
      }
    ];

    return (
      <Grid container spacing={3}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 1, 
                    bgcolor: `${card.color}.main`, 
                    color: 'white',
                    mr: 2
                  }}>
                    {card.icon}
                  </Box>
                  <Box>
                    <Typography variant="h6" color={`${card.color}.main`}>
                      {card.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.title}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {card.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Render health monitoring
  const renderHealthMonitoring = () => {
    if (!healthMetrics) return <Typography>No health data available</Typography>;

    return (
      <Grid container spacing={3}>
        {/* Request Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="API Request Statistics" avatar={<ApiIcon />} />
            <CardContent>
              <List dense>
                <ListItem>
                  <ListItemIcon><TrendingUpIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Total Requests" 
                    secondary={healthMetrics.requests?.total || 0} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><SuccessIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Successful Requests" 
                    secondary={healthMetrics.requests?.successful || 0} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><ErrorIcon color="error" /></ListItemIcon>
                  <ListItemText 
                    primary="Failed Requests" 
                    secondary={healthMetrics.requests?.failed || 0} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><NetworkIcon color="warning" /></ListItemIcon>
                  <ListItemText 
                    primary="Rate Limited" 
                    secondary={healthMetrics.rateLimit?.hits || 0} 
                  />
                </ListItem>
              </List>
              
              {healthMetrics.requests?.total > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Success Rate: {((healthMetrics.requests.successful / healthMetrics.requests.total) * 100).toFixed(1)}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(healthMetrics.requests.successful / healthMetrics.requests.total) * 100}
                    color={(healthMetrics.requests.successful / healthMetrics.requests.total) > 0.9 ? 'success' : 'warning'}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Memory Usage */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Memory Usage" avatar={<MemoryIcon />} />
            <CardContent>
              <List dense>
                <ListItem>
                  <ListItemIcon><StorageIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Used Memory" 
                    secondary={formatBytes(healthMetrics.memory?.used || 0)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CloudIcon color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Total Memory" 
                    secondary={formatBytes(healthMetrics.memory?.total || 0)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><AssessmentIcon color="warning" /></ListItemIcon>
                  <ListItemText 
                    primary="Usage Percentage" 
                    secondary={formatPercentage(healthMetrics.memory?.percentage)} 
                  />
                </ListItem>
              </List>
              
              {healthMetrics.memory?.percentage && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Memory Usage: {formatPercentage(healthMetrics.memory.percentage)}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={parseFloat(healthMetrics.memory.percentage)}
                    color={healthMetrics.memory.percentage > 80 ? 'error' : 
                           healthMetrics.memory.percentage > 60 ? 'warning' : 'success'}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Error Tracking */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Error Tracking" avatar={<ErrorIcon />} />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main">
                      {healthMetrics.errors?.total || 0}
                    </Typography>
                    <Typography variant="caption">Total Errors</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {healthMetrics.errors?.apiErrors || 0}
                    </Typography>
                    <Typography variant="caption">API Errors</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      {healthMetrics.errors?.networkErrors || 0}
                    </Typography>
                    <Typography variant="caption">Network Errors</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {healthMetrics.errors?.resolved || 0}
                    </Typography>
                    <Typography variant="caption">Resolved</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Render cache analytics
  const renderCacheAnalytics = () => {
    if (!cacheStats) return <Typography>No cache data available</Typography>;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Cache Performance" avatar={<CachedIcon />} />
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h4" color="primary.main" align="center">
                  {cacheStats.hits + cacheStats.misses > 0 ? 
                   `${((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(1)}%` : 
                   '0%'}
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary">
                  Hit Rate
                </Typography>
              </Box>
              
              <List dense>
                <ListItem>
                  <ListItemIcon><SuccessIcon color="success" /></ListItemIcon>
                  <ListItemText primary="Cache Hits" secondary={cacheStats.hits || 0} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><ErrorIcon color="error" /></ListItemIcon>
                  <ListItemText primary="Cache Misses" secondary={cacheStats.misses || 0} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><StorageIcon color="info" /></ListItemIcon>
                  <ListItemText primary="Cache Size" secondary={cacheStats.size || 0} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><RefreshIcon color="warning" /></ListItemIcon>
                  <ListItemText primary="Cleanups" secondary={cacheStats.cleanups || 0} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Cache Details" avatar={<InfoIcon />} />
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" gutterBottom>Memory Usage</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min((cacheStats.memoryUsed / cacheStats.maxMemory) * 100 || 0, 100)}
                    color={cacheStats.memoryUsed / cacheStats.maxMemory > 0.8 ? 'warning' : 'success'}
                  />
                  <Typography variant="caption">
                    {formatBytes(cacheStats.memoryUsed || 0)} / {formatBytes(cacheStats.maxMemory || 0)}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" gutterBottom>TTL Coverage</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min((cacheStats.itemsWithTTL / Math.max(cacheStats.size, 1)) * 100 || 0, 100)}
                    color="info"
                  />
                  <Typography variant="caption">
                    {cacheStats.itemsWithTTL || 0} items with TTL
                  </Typography>
                </Box>

                {cacheStats.lastCleanup && (
                  <Alert severity="info" size="small">
                    Last cleanup: {formatDistanceToNow(new Date(cacheStats.lastCleanup))} ago
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Render retry monitoring
  const renderRetryMonitoring = () => {
    if (!retryStats) return <Typography>No retry data available</Typography>;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="Retry Statistics" avatar={<RefreshIcon />} />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary.main">
                      {retryStats.totalRetries || 0}
                    </Typography>
                    <Typography variant="caption">Total Retries</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {retryStats.successfulRetries || 0}
                    </Typography>
                    <Typography variant="caption">Successful</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main">
                      {retryStats.failedRetries || 0}
                    </Typography>
                    <Typography variant="caption">Failed</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {retryStats.maxRetriesReached || 0}
                    </Typography>
                    <Typography variant="caption">Max Reached</Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              {retryStats.totalRetries > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    Success Rate: {((retryStats.successfulRetries / retryStats.totalRetries) * 100).toFixed(1)}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(retryStats.successfulRetries / retryStats.totalRetries) * 100}
                    color={(retryStats.successfulRetries / retryStats.totalRetries) > 0.8 ? 'success' : 'warning'}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Retry Configuration" avatar={<SettingsIcon />} />
            <CardContent>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Max Attempts" 
                    secondary={retryStats.maxAttempts || 'Not configured'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Base Delay" 
                    secondary={retryStats.baseDelay ? `${retryStats.baseDelay}ms` : 'Not configured'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Max Delay" 
                    secondary={retryStats.maxDelay ? `${retryStats.maxDelay}ms` : 'Not configured'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Backoff Factor" 
                    secondary={retryStats.backoffFactor || 'Not configured'} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Render configuration management
  const renderConfiguration = () => {
    if (!configuration) return <Typography>No configuration data available</Typography>;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="System Configuration" 
              avatar={<SettingsIcon />}
              action={
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setConfigDialog(true)}
                  startIcon={<SettingsIcon />}
                >
                  Edit Configuration
                </Button>
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                {Object.entries(configuration).map(([key, value]) => (
                  <Grid item xs={12} sm={6} md={4} key={key}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Typography>
                      <Typography variant="body1">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DashboardIcon />
          Enhanced AttendanceTracker Dashboard
        </Typography>
        
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                size="small"
              />
            }
            label="Auto Refresh"
          />
          
          <Select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(e.target.value)}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value={10000}>10s</MenuItem>
            <MenuItem value={30000}>30s</MenuItem>
            <MenuItem value={60000}>1m</MenuItem>
            <MenuItem value={300000}>5m</MenuItem>
          </Select>
          
          <Button
            variant="outlined"
            size="small"
            onClick={loadAllData}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
          >
            Refresh
          </Button>

          <Button
            variant="outlined"
            size="small"
            color="warning"
            onClick={() => setResetDialog(true)}
            startIcon={<ResetIcon />}
          >
            Reset Metrics
          </Button>
        </Stack>
      </Box>

      {/* Last Updated */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Last updated: {format(lastUpdated, 'MMM dd, yyyy HH:mm:ss')}
      </Alert>

      {/* Overview Cards */}
      {!loading && systemOverview && (
        <Box sx={{ mb: 4 }}>
          {renderOverviewCards()}
        </Box>
      )}

      {/* Main Content Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Health Monitoring" icon={<HealthIcon />} />
          <Tab label="Cache Analytics" icon={<CachedIcon />} />
          <Tab label="Retry Monitoring" icon={<RefreshIcon />} />
          <Tab label="Configuration" icon={<SettingsIcon />} />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {activeTab === 0 && renderHealthMonitoring()}
          {activeTab === 1 && renderCacheAnalytics()}
          {activeTab === 2 && renderRetryMonitoring()}
          {activeTab === 3 && renderConfiguration()}
        </>
      )}

      {/* Configuration Dialog */}
      <Dialog open={configDialog} onClose={() => setConfigDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Configuration</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {tempConfig && Object.entries(tempConfig).map(([key, value]) => (
              <TextField
                key={key}
                fullWidth
                margin="normal"
                label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                onChange={(e) => {
                  const newValue = e.target.value;
                  try {
                    // Try to parse as JSON if it looks like an object
                    const parsedValue = newValue.startsWith('{') || newValue.startsWith('[') 
                      ? JSON.parse(newValue) 
                      : isNaN(newValue) ? newValue : Number(newValue);
                    setTempConfig(prev => ({ ...prev, [key]: parsedValue }));
                  } catch {
                    setTempConfig(prev => ({ ...prev, [key]: newValue }));
                  }
                }}
                multiline={typeof value === 'object'}
                rows={typeof value === 'object' ? 3 : 1}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialog(false)}>Cancel</Button>
          <Button onClick={handleConfigUpdate} variant="contained" disabled={loading}>
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialog} onClose={() => setResetDialog(false)}>
        <DialogTitle>Reset Metrics</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset all health metrics? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialog(false)}>Cancel</Button>
          <Button onClick={handleResetMetrics} color="warning" variant="contained" disabled={loading}>
            Reset Metrics
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={notification.severity} onClose={() => setNotification(prev => ({ ...prev, open: false }))}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnhancedAttendanceTrackerDashboard;
