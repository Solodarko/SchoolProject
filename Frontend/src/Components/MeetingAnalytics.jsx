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
  Snackbar
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
  AccessTime
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
import attendanceAPI from '../services/attendanceApi';
import { io } from 'socket.io-client';

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

const MeetingAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('attendance');
  const [filterDialog, setFilterDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  
  // Real-time functionality states
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [notifications, setNotifications] = useState([]);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [updateCount, setUpdateCount] = useState(0);
  const socketRef = useRef(null);
  
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

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, selectedStudent]);

  // Socket.IO initialization and event handlers
  useEffect(() => {
    if (!realtimeEnabled) return;

    // Connect to socket server
    const socketConnection = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    socketRef.current = socketConnection;
    setSocket(socketConnection);

    // Connection event handlers
    socketConnection.on('connect', () => {
      console.log('✅ Socket connected to server');
      setConnectionStatus('connected');
      addNotification({
        type: 'success',
        message: 'Real-time updates connected',
        timestamp: new Date()
      });
    });

    socketConnection.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setConnectionStatus('disconnected');
      addNotification({
        type: 'error',
        message: 'Real-time updates disconnected',
        timestamp: new Date()
      });
    });

    socketConnection.on('reconnect', () => {
      console.log('🔄 Socket reconnected');
      setConnectionStatus('connected');
      addNotification({
        type: 'info',
        message: 'Real-time updates reconnected',
        timestamp: new Date()
      });
    });

    // Meeting event handlers - these trigger analytics refresh
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

    socketConnection.on('participant:left', (data) => {
      console.log('👥 Participant left:', data);
      handleRealTimeUpdate(
        'Participant Left',
        `${data.participantName} left ${data.meetingTopic || data.meetingId}`
      );
    });

    socketConnection.on('attendance:updated', (data) => {
      console.log('📋 Attendance updated:', data);
      handleRealTimeUpdate(
        'Attendance Updated',
        `Attendance data refreshed for ${data.meetingTopic || data.meetingId}`
      );
    });

    socketConnection.on('analytics:refresh', () => {
      console.log('📈 Analytics refresh requested');
      handleRealTimeUpdate('Analytics Refresh', 'Meeting analytics data updated');
    });

    // Generic error handler
    socketConnection.on('error', (error) => {
      console.error('❌ Socket error:', error);
      addNotification({
        type: 'error',
        message: `Connection error: ${error.message}`,
        timestamp: new Date()
      });
    });

    // Cleanup on component unmount
    return () => {
      if (socketConnection) {
        socketConnection.disconnect();
      }
    };
  }, [realtimeEnabled]);

  // Handle real-time updates
  const handleRealTimeUpdate = async (title, message) => {
    // Add notification
    addNotification({
      type: 'info',
      title,
      message,
      timestamp: new Date()
    });

    // Update analytics data
    setUpdateCount(prev => prev + 1);
    setLastUpdateTime(new Date());
    
    // Debounce analytics refresh to avoid too frequent updates
    setTimeout(() => {
      loadAnalyticsData();
    }, 1000);
  };

  // Notification management
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      ...notification
    };
    
    setNotifications(prev => {
      // Keep only the latest 10 notifications
      const updated = [newNotification, ...prev].slice(0, 10);
      return updated;
    });

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  };

  // Toggle real-time updates
  const toggleRealTimeUpdates = () => {
    setRealtimeEnabled(prev => !prev);
    if (!realtimeEnabled && socketRef.current) {
      socketRef.current.disconnect();
      setSocket(null);
      setConnectionStatus('disconnected');
    }
  };

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const response = await attendanceAPI.getDashboardData(
        dateRange.from?.toISOString(),
        dateRange.to?.toISOString()
      );
      setAnalyticsData(response);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceTrendData = () => {
    if (!analyticsData?.meetings) return null;

    const meetings = analyticsData.meetings.slice(-10);
    const labels = meetings.map(m => format(new Date(m.date), 'MM/dd'));
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
    if (!analyticsData?.overallStatistics) return null;

    const stats = analyticsData.overallStatistics;
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
    if (!analyticsData?.meetings) return null;

    const meetings = analyticsData.meetings.slice(-7);
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

  const getInsights = () => {
    if (!analyticsData) return [];

    const insights = [];
    const stats = analyticsData.overallStatistics;
    const meetings = analyticsData.meetings || [];

    // Overall attendance rate insight
    const attendanceRate = stats?.attendanceRate || 0;
    if (attendanceRate >= 85) {
      insights.push({
        type: 'success',
        title: 'Excellent Attendance',
        message: `Overall attendance rate is ${attendanceRate}% - exceeding expectations!`,
        icon: <CheckCircle color="success" />
      });
    } else if (attendanceRate >= 70) {
      insights.push({
        type: 'warning',
        title: 'Good Attendance',
        message: `Attendance rate is ${attendanceRate}%. Consider strategies to improve engagement.`,
        icon: <Warning color="warning" />
      });
    } else {
      insights.push({
        type: 'error',
        title: 'Low Attendance',
        message: `Attendance rate is ${attendanceRate}%. Immediate action recommended.`,
        icon: <Cancel color="error" />
      });
    }

    // Meeting frequency insight
    if (meetings.length > 0) {
      const recentMeetings = meetings.filter(m => 
        new Date(m.date) > subDays(new Date(), 7)
      ).length;
      
      if (recentMeetings >= 3) {
        insights.push({
          type: 'info',
          title: 'High Meeting Frequency',
          message: `${recentMeetings} meetings in the last week. Ensure quality over quantity.`,
          icon: <Schedule color="info" />
        });
      }
    }

    // Trend insight
    if (meetings.length >= 5) {
      const recent5 = meetings.slice(-5);
      const avgRecent = recent5.reduce((sum, m) => sum + (m.attendanceRate || 0), 0) / 5;
      const previous5 = meetings.slice(-10, -5);
      const avgPrevious = previous5.reduce((sum, m) => sum + (m.attendanceRate || 0), 0) / previous5.length;
      
      if (avgRecent > avgPrevious + 5) {
        insights.push({
          type: 'success',
          title: 'Improving Trend',
          message: `Attendance has improved by ${Math.round(avgRecent - avgPrevious)}% in recent meetings.`,
          icon: <TrendingUp color="success" />
        });
      } else if (avgRecent < avgPrevious - 5) {
        insights.push({
          type: 'warning',
          title: 'Declining Trend',
          message: `Attendance has declined by ${Math.round(avgPrevious - avgRecent)}% in recent meetings.`,
          icon: <TrendingDown color="warning" />
        });
      }
    }

    return insights;
  };

  const renderKPICards = () => {
    if (!analyticsData?.overallStatistics) return null;

    const stats = analyticsData.overallStatistics;
    const kpis = [
      {
        title: 'Total Meetings',
        value: stats.totalMeetings || 0,
        icon: <Business />,
        color: 'primary'
      },
      {
        title: 'Attendance Rate',
        value: `${stats.attendanceRate || 0}%`,
        icon: <Assessment />,
        color: stats.attendanceRate >= 80 ? 'success' : stats.attendanceRate >= 60 ? 'warning' : 'error'
      },
      {
        title: 'Total Participants',
        value: stats.totalParticipants || 0,
        icon: <People />,
        color: 'info'
      },
      {
        title: 'Students Tracked',
        value: stats.totalStudents || 0,
        icon: <School />,
        color: 'secondary'
      }
    ];

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color={`${kpi.color}.main`} gutterBottom>
                      {kpi.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {kpi.title}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: `${kpi.color}.light` }}>
                    {kpi.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderInsights = () => {
    const insights = getInsights();
    
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Key Insights
          </Typography>
          <List>
            {insights.map((insight, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {insight.icon}
                </ListItemIcon>
                <ListItemText
                  primary={insight.title}
                  secondary={insight.message}
                />
              </ListItem>
            ))}
            {insights.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No insights available with current data
              </Typography>
            )}
          </List>
        </CardContent>
      </Card>
    );
  };

  const renderTopPerformers = () => {
    // This would typically come from student-specific data
    // For now, we'll show a placeholder
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Top Performers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Student performance tracking coming soon...
          </Typography>
          {/* Placeholder for student performance data */}
          <Box sx={{ mt: 2 }}>
            {[1, 2, 3].map((item) => (
              <Box key={item} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.light' }}>
                  {item}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2">
                    Student {item}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={95 - (item * 5)} 
                    sx={{ mt: 0.5 }}
                  />
                </Box>
                <Typography variant="caption" sx={{ ml: 1 }}>
                  {95 - (item * 5)}%
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  };

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
              Meeting Analytics
            </Typography>
            {/* Real-time Status Indicator */}
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
            {/* Last Update Time */}
            {lastUpdateTime && (
              <Tooltip title={`Last updated: ${format(lastUpdateTime, 'MMM dd, HH:mm:ss')}`}>
                <Chip
                  size="small"
                  icon={<AccessTime />}
                  label={format(lastUpdateTime, 'HH:mm')}
                  variant="outlined"
                />
              </Tooltip>
            )}
            
            {/* Notifications */}
            <Tooltip title="View recent updates">
              <IconButton onClick={() => setNotifications([])}>  
                <Badge badgeContent={notifications.length} color="info">
                  {notifications.length > 0 ? <NotificationsActive /> : <Notifications />}
                </Badge>
              </IconButton>
            </Tooltip>
            
            {/* Real-time Toggle */}
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
              onClick={loadAnalyticsData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              startIcon={<Download />}
              onClick={() => attendanceAPI.exportData({ format: 'csv' })}
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* Date Range Display */}
        <Box sx={{ mb: 3 }}>
          <Chip
            icon={<DateRange />}
            label={`${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`}
            variant="outlined"
            onClick={() => setFilterDialog(true)}
          />
        </Box>

        {/* KPI Cards */}
        {renderKPICards()}

        {/* Insights */}
        {renderInsights()}

        {/* Charts */}
        <Grid container spacing={3}>
          {/* Attendance Trend */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Attendance Trends
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
                    No data available for the selected period
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
                    No data available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Meeting Performance */}
          <Grid item xs={12} lg={8}>
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

          {/* Top Performers */}
          <Grid item xs={12} lg={4}>
            {renderTopPerformers()}
          </Grid>
        </Grid>

        {/* Meeting Details Table */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Meeting Details
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
                  {analyticsData?.meetings?.slice(0, 10).map((meeting) => (
                    <TableRow key={meeting.meetingId}>
                      <TableCell>
                        {format(new Date(meeting.date), 'MMM dd, HH:mm')}
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
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Metric Focus</InputLabel>
                  <Select
                    value={selectedMetric}
                    label="Metric Focus"
                    onChange={(e) => setSelectedMetric(e.target.value)}
                  >
                    <MenuItem value="attendance">Attendance Rate</MenuItem>
                    <MenuItem value="participation">Participation</MenuItem>
                    <MenuItem value="engagement">Engagement</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFilterDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              setFilterDialog(false);
              loadAnalyticsData();
            }} variant="contained">
              Apply Filters
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Notifications Snackbar */}
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

export default MeetingAnalytics;
