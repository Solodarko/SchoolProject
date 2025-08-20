import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  LinearProgress,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Badge,
  Snackbar,
  Tabs,
  Tab,
  Fade
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Schedule,
  Assessment,
  CheckCircle,
  Warning,
  Cancel,
  Download,
  Refresh,
  FilterList,
  DateRange,
  School,
  Business,
  Wifi,
  WifiOff,
  Notifications,
  NotificationsActive,
  Update,
  AccessTime,
  Analytics as AnalyticsIcon,
  Group as GroupIcon,
  EventNote as EventIcon,
  Timeline as TimelineIcon,
  PeopleOutline as PeopleOutlineIcon,
  BarChart as BarChartIcon,
  SupervisorAccount,
  Security,
  MonitorHeart,
  SmartDisplay
} from '@mui/icons-material';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  RadialLinearScale
} from 'chart.js';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { safeDateFormat } from '../../utils/safeDateFormat';
import attendanceAPI from '../../services/attendanceApi';
import { io } from 'socket.io-client';
import { useTheme } from '@mui/material/styles';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const UnifiedAdminAnalytics = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Date range state
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  
  // Analytics data states
  const [systemAnalytics, setSystemAnalytics] = useState(null);
  const [meetingAnalytics, setMeetingAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  
  // Real-time functionality states
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [notifications, setNotifications] = useState([]);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [updateCount, setUpdateCount] = useState(0);
  const socketRef = useRef(null);
  
  // Filter dialog state
  const [filterDialog, setFilterDialog] = useState(false);

  // Mock system analytics data
  const [analyticsData] = useState({
    userGrowth: {
      current: 1247,
      previous: 1156,
      change: 7.9,
      trend: 'up'
    },
    activeUsers: {
      current: 892,
      previous: 934,
      change: -4.5,
      trend: 'down'
    },
    meetings: {
      current: 156,
      previous: 142,
      change: 9.9,
      trend: 'up'
    },
    attendance: {
      current: 87.3,
      previous: 84.1,
      change: 3.8,
      trend: 'up'
    },
    systemMetrics: [
      { name: 'CPU Usage', value: 67, unit: '%', status: 'Good' },
      { name: 'Memory Usage', value: 74, unit: '%', status: 'Good' },
      { name: 'API Response Time', value: 245, unit: 'ms', status: 'Good' },
      { name: 'Database Performance', value: 91, unit: '%', status: 'Excellent' },
      { name: 'Zoom Integration Status', value: 98, unit: '%', status: 'Excellent' }
    ],
    userActivity: [
      { type: 'meeting', action: 'New Zoom meeting created', time: '5 minutes ago' },
      { type: 'user', action: 'Student enrollment processed', time: '12 minutes ago' },
      { type: 'system', action: 'Analytics data refreshed', time: '23 minutes ago' },
      { type: 'meeting', action: 'Meeting attendance tracked', time: '34 minutes ago' },
      { type: 'user', action: 'Bulk user import completed', time: '1 hour ago' }
    ],
    departmentStats: [
      { name: 'Computer Science', users: 324, meetings: 45, attendance: 89 },
      { name: 'Mathematics', users: 287, meetings: 38, attendance: 92 },
      { name: 'Physics', users: 198, meetings: 29, attendance: 86 },
      { name: 'Chemistry', users: 156, meetings: 22, attendance: 88 },
      { name: 'Biology', users: 234, meetings: 31, attendance: 91 }
    ]
  });

  // Load data on component mount and when filters change
  useEffect(() => {
    loadAllAnalytics();
  }, [dateRange, timeRange]);

  // Socket.IO initialization for real-time updates
  useEffect(() => {
    if (!realtimeEnabled) return;

    const socketConnection = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    socketRef.current = socketConnection;
    setSocket(socketConnection);

    // Connection event handlers
    socketConnection.on('connect', () => {
      console.log('✅ Unified Analytics Socket connected');
      setConnectionStatus('connected');
      addNotification({
        type: 'success',
        message: 'Real-time analytics connected',
        timestamp: new Date()
      });
    });

    socketConnection.on('disconnect', (reason) => {
      console.log('❌ Unified Analytics Socket disconnected:', reason);
      setConnectionStatus('disconnected');
      addNotification({
        type: 'error',
        message: 'Real-time analytics disconnected',
        timestamp: new Date()
      });
    });

    // System event handlers
    socketConnection.on('system:update', (data) => {
      console.log('🖥️ System update:', data);
      handleRealTimeUpdate('System Update', 'System metrics refreshed');
    });

    // Meeting event handlers
    socketConnection.on('meeting:started', (data) => {
      console.log('📊 Meeting started:', data);
      handleRealTimeUpdate('Meeting Started', `${data.meetingTopic || data.meetingId} has started`);
    });

    socketConnection.on('meeting:ended', (data) => {
      console.log('📊 Meeting ended:', data);
      handleRealTimeUpdate('Meeting Ended', `${data.meetingTopic || data.meetingId} has ended`);
    });

    socketConnection.on('participant:joined', (data) => {
      console.log('👥 Participant joined:', data);
      handleRealTimeUpdate(
        'Participant Joined',
        `${data.participantName} joined ${data.meetingTopic || data.meetingId}`
      );
    });

    socketConnection.on('analytics:refresh', () => {
      console.log('📈 Analytics refresh requested');
      handleRealTimeUpdate('Analytics Refresh', 'All analytics data updated');
    });

    // Cleanup
    return () => {
      if (socketConnection) {
        socketConnection.disconnect();
      }
    };
  }, [realtimeEnabled]);

  const loadAllAnalytics = async () => {
    setLoading(true);
    try {
      // Load meeting analytics
      const meetingData = await attendanceAPI.getDashboardData(
        dateRange.from?.toISOString(),
        dateRange.to?.toISOString()
      );
      setMeetingAnalytics(meetingData);
      
      // System analytics is using mock data for now
      setSystemAnalytics(analyticsData);
      
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRealTimeUpdate = async (title, message) => {
    addNotification({
      type: 'info',
      title,
      message,
      timestamp: new Date()
    });

    setUpdateCount(prev => prev + 1);
    setLastUpdateTime(new Date());
    
    // Debounce analytics refresh
    setTimeout(() => {
      loadAllAnalytics();
    }, 1000);
  };

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      ...notification
    };
    
    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 10);
      return updated;
    });

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  };

  const toggleRealTimeUpdates = () => {
    setRealtimeEnabled(prev => !prev);
    if (!realtimeEnabled && socketRef.current) {
      socketRef.current.disconnect();
      setSocket(null);
      setConnectionStatus('disconnected');
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'excellent': return 'success';
      case 'good': return 'info';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'meeting': return <SmartDisplay />;
      case 'user': return <PeopleOutlineIcon />;
      case 'system': return <MonitorHeart />;
      default: return <AnalyticsIcon />;
    }
  };

  // System Analytics Tab Content
  const renderSystemAnalytics = () => (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="primary.main" gutterBottom>
                    {analyticsData.userGrowth.current}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light' }}>
                  <PeopleOutlineIcon />
                </Avatar>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp color="success" sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption" color="success.main">
                  +{analyticsData.userGrowth.change}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="secondary.main" gutterBottom>
                    {analyticsData.meetings.current}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Meetings
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'secondary.light' }}>
                  <SmartDisplay />
                </Avatar>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp color="success" sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption" color="success.main">
                  +{analyticsData.meetings.change}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="info.main" gutterBottom>
                    {analyticsData.activeUsers.current}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Users (24h)
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.light' }}>
                  <TrendingUp />
                </Avatar>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingDown color="error" sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption" color="error.main">
                  {analyticsData.activeUsers.change}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="success.main" gutterBottom>
                    {analyticsData.attendance.current}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Attendance Rate
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.light' }}>
                  <Assessment />
                </Avatar>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp color="success" sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption" color="success.main">
                  +{analyticsData.attendance.change}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* System Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Performance
              </Typography>
              <List>
                {analyticsData.systemMetrics.map((metric, index) => (
                  <div key={index}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={metric.name}
                        secondary={
                          <Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                              <Typography variant="body2">
                                {metric.value}{metric.unit || '%'}
                              </Typography>
                              <Chip
                                label={metric.status}
                                color={getStatusColor(metric.status)}
                                size="small"
                              />
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={metric.unit === 'ms' ? Math.min(metric.value / 5, 100) : metric.value}
                              color={getStatusColor(metric.status)}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < analyticsData.systemMetrics.length - 1 && <Divider />}
                  </div>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent System Activity
              </Typography>
              <List>
                {analyticsData.userActivity.map((activity, index) => (
                  <div key={index}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        {getActivityIcon(activity.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.action}
                        secondary={activity.time}
                      />
                    </ListItem>
                    {index < analyticsData.userActivity.length - 1 && <Divider />}
                  </div>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Department Statistics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Department Statistics
              </Typography>
              <Grid container spacing={2}>
                {analyticsData.departmentStats.map((dept, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${theme.palette.primary.light}20, ${theme.palette.secondary.light}20)`,
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {dept.name}
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={1}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2" color="textSecondary">
                            Users:
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {dept.users}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2" color="textSecondary">
                            Meetings:
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {dept.meetings}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2" color="textSecondary">
                            Attendance:
                          </Typography>
                          <Chip
                            label={`${dept.attendance}%`}
                            color={dept.attendance > 90 ? 'success' : dept.attendance > 85 ? 'warning' : 'error'}
                            size="small"
                          />
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  // Meeting Analytics data processing functions
  const getAttendanceTrendData = () => {
    if (!meetingAnalytics?.meetings) return null;

    const meetings = meetingAnalytics.meetings.slice(-10);
    const labels = meetings.map(m => safeDateFormat(m.date, 'MM/dd', 'N/A'));
    const attendanceRates = meetings.map(m => m.attendanceRate || 0);
    const participantCounts = meetings.map(m => m.statistics?.total || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Attendance Rate (%)',
          data: attendanceRates,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          yAxisID: 'y'
        },
        {
          label: 'Participants',
          data: participantCounts,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1,
          yAxisID: 'y1'
        }
      ]
    };
  };

  const getAttendanceStatusData = () => {
    if (!meetingAnalytics?.overallStatistics) return null;

    const stats = meetingAnalytics.overallStatistics;
    return {
      labels: ['Present', 'Late', 'Partial', 'Absent'],
      datasets: [
        {
          data: [stats.present || 0, stats.late || 0, stats.partial || 0, stats.absent || 0],
          backgroundColor: [
            'rgba(75, 192, 192, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(255, 99, 132, 0.8)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(255, 99, 132, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  const getMeetingPerformanceData = () => {
    if (!meetingAnalytics?.meetings) return null;

    const meetings = meetingAnalytics.meetings.slice(-7);
    const labels = meetings.map(m => m.meetingTopic || `Meeting ${m.meetingId.slice(-4)}`);
    const attendanceRates = meetings.map(m => m.attendanceRate || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Attendance Rate (%)',
          data: attendanceRates,
          backgroundColor: attendanceRates.map(rate => 
            rate >= 80 ? 'rgba(75, 192, 192, 0.8)' :
            rate >= 60 ? 'rgba(255, 206, 86, 0.8)' :
            'rgba(255, 99, 132, 0.8)'
          ),
          borderColor: attendanceRates.map(rate => 
            rate >= 80 ? 'rgba(75, 192, 192, 1)' :
            rate >= 60 ? 'rgba(255, 206, 86, 1)' :
            'rgba(255, 99, 132, 1)'
          ),
          borderWidth: 1
        }
      ]
    };
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      }
    }
  };

  // Meeting Analytics Tab Content with full functionality
  const renderMeetingAnalytics = () => (
    <Box>
      {/* KPI Cards for Meeting Analytics */}
      {meetingAnalytics?.overallStatistics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="primary.main" gutterBottom>
                      {meetingAnalytics.overallStatistics.totalMeetings || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Meetings
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.light' }}>
                    <SmartDisplay />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="success.main" gutterBottom>
                      {meetingAnalytics.overallStatistics.attendanceRate || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Attendance Rate
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'success.light' }}>
                    <Assessment />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="info.main" gutterBottom>
                      {meetingAnalytics.overallStatistics.totalParticipants || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Participants
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'info.light' }}>
                    <People />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="secondary.main" gutterBottom>
                      {meetingAnalytics.overallStatistics.totalStudents || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Students Tracked
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'secondary.light' }}>
                    <School />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Attendance Trend */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Meeting Attendance Trends
              </Typography>
              {getAttendanceTrendData() ? (
                <Line 
                  data={getAttendanceTrendData()} 
                  options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        max: 100
                      },
                      y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                          drawOnChartArea: false,
                        },
                      }
                    }
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No meeting data available for the selected period
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Attendance Status Distribution */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Attendance Distribution
              </Typography>
              {getAttendanceStatusData() ? (
                <Doughnut data={getAttendanceStatusData()} options={doughnutOptions} />
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No attendance data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Meeting Performance */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Meeting Performance
              </Typography>
              {getMeetingPerformanceData() ? (
                <Bar data={getMeetingPerformanceData()} options={chartOptions} />
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No meetings found for the selected period
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Meeting Details Table */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Meeting Details
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Meeting</TableCell>
                  <TableCell align="center">Participants</TableCell>
                  <TableCell align="center">Present</TableCell>
                  <TableCell align="center">Rate</TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {meetingAnalytics?.meetings?.slice(0, 10).map((meeting) => (
                  <TableRow key={meeting.meetingId}>
                    <TableCell>
                      {safeDateFormat(meeting.date, 'MMM dd, HH:mm', 'Invalid Date')}
                    </TableCell>
                    <TableCell>
                      {meeting.meetingTopic || meeting.meetingId}
                    </TableCell>
                    <TableCell align="center">
                      {meeting.statistics?.total || 0}
                    </TableCell>
                    <TableCell align="center">
                      {meeting.statistics?.present || 0}
                    </TableCell>
                    <TableCell align="center">
                      {meeting.attendanceRate || 0}%
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={
                          meeting.attendanceRate >= 80 ? 'Excellent' :
                          meeting.attendanceRate >= 60 ? 'Good' : 'Needs Attention'
                        }
                        color={
                          meeting.attendanceRate >= 80 ? 'success' :
                          meeting.attendanceRate >= 60 ? 'warning' : 'error'
                        }
                      />
                    </TableCell>
                  </TableRow>
                )) || (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No meetings found for the selected period
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  // Combined Insights Tab Content
  const renderCombinedInsights = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Combined System & Meeting Insights
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="success.main">
                System Health Overview
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="System Running Optimally"
                    secondary="All core services operational with 98%+ performance"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SmartDisplay color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Zoom Integration Active"
                    secondary={`${analyticsData.meetings.current} meetings tracked this month`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TrendingUp color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Positive Growth Trends"
                    secondary="User engagement and meeting attendance both improving"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="info.main">
                Recommendations
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Assessment color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Monitor Peak Usage"
                    secondary="Consider scaling resources during high meeting activity"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <People color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Improve User Engagement"
                    secondary="Focus on departments with attendance below 90%"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Schedule color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Optimize Meeting Schedule"
                    secondary="Analyze time patterns for better attendance rates"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" component="h1">
              Unified Analytics Dashboard
            </Typography>
            <Tooltip title={`Real-time updates: ${connectionStatus}`}>
              <Chip
                size="small"
                icon={connectionStatus === 'connected' ? <Wifi /> : <WifiOff />}
                label={connectionStatus === 'connected' ? 'Live' : 'Offline'}
                color={connectionStatus === 'connected' ? 'success' : 'error'}
                variant={connectionStatus === 'connected' ? 'filled' : 'outlined'}
              />
            </Tooltip>
            {updateCount > 0 && (
              <Tooltip title={`${updateCount} updates received`}>
                <Badge badgeContent={updateCount} color="primary">
                  <Update color="action" />
                </Badge>
              </Tooltip>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title={`Last updated: ${format(lastUpdateTime, 'MMM dd, HH:mm:ss')}`}>
              <Chip
                size="small"
                icon={<AccessTime />}
                label={format(lastUpdateTime, 'HH:mm')}
                variant="outlined"
              />
            </Tooltip>
            
            <Tooltip title="View recent updates">
              <IconButton onClick={() => setNotifications([])}>  
                <Badge badgeContent={notifications.length} color="info">
                  {notifications.length > 0 ? <NotificationsActive /> : <Notifications />}
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title={`${realtimeEnabled ? 'Disable' : 'Enable'} real-time updates`}>
              <Button
                size="small"
                variant={realtimeEnabled ? 'contained' : 'outlined'}
                color={realtimeEnabled ? 'success' : 'primary'}
                onClick={toggleRealTimeUpdates}
                startIcon={realtimeEnabled ? <Wifi /> : <WifiOff />}
              >
                {realtimeEnabled ? 'Live' : 'Offline'}
              </Button>
            </Tooltip>
            
            <Button
              startIcon={<FilterList />}
              onClick={() => setFilterDialog(true)}
            >
              Filters
            </Button>
            <Button
              startIcon={<Refresh />}
              onClick={loadAllAnalytics}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Time Range Selector */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip
            icon={<DateRange />}
            label={`${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`}
            variant="outlined"
            onClick={() => setFilterDialog(true)}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="1d">Last 24h</MenuItem>
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 3 months</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Analytics Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              label="System Analytics" 
              icon={<AnalyticsIcon />}
              iconPosition="start"
            />
            <Tab 
              label="Meeting Analytics" 
              icon={<SmartDisplay />}
              iconPosition="start"
            />
            <Tab 
              label="Combined Insights" 
              icon={<Assessment />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <TabPanel value={activeTab} index={0}>
          {renderSystemAnalytics()}
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          {renderMeetingAnalytics()}
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          {renderCombinedInsights()}
        </TabPanel>

        {/* Filter Dialog */}
        <Dialog open={filterDialog} onClose={() => setFilterDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Analytics Filters</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="From Date"
                  value={dateRange.from}
                  onChange={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="To Date"
                  value={dateRange.to}
                  onChange={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFilterDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              setFilterDialog(false);
              loadAllAnalytics();
            }} variant="contained">
              Apply Filters
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Notifications */}
        {notifications.map((notification) => (
          <Snackbar
            key={notification.id}
            open={true}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            sx={{ bottom: 24 + (notifications.indexOf(notification) * 70) }}
          >
            <Alert
              severity={notification.type || 'info'}
              variant="filled"
              onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
              sx={{ minWidth: '300px' }}
            >
              <Box>
                <Typography variant="subtitle2" component="div">
                  {notification.title || notification.message}
                </Typography>
                {notification.title && notification.message && (
                  <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                    {notification.message}
                  </Typography>
                )}
                <Typography variant="caption" sx={{ opacity: 0.7, mt: 0.5, display: 'block' }}>
                  {format(notification.timestamp, 'HH:mm:ss')}
                </Typography>
              </Box>
            </Alert>
          </Snackbar>
        ))}
      </Box>
    </LocalizationProvider>
  );
};

export default UnifiedAdminAnalytics;
