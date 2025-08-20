import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
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
  Badge,
  Tooltip,
  Stack,
  Divider,
  useTheme,
  alpha,
  Avatar
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Refresh as RefreshIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Videocam as VideocamIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationIcon,
  QrCode as QrCodeIcon,
  School as SchoolIcon,
  Analytics as AnalyticsIcon,
  Update as UpdateIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { getAuthHeaders } from '../../utils/authUtils';
import attendanceAPI from '../../services/attendanceApi';

const AttendanceTrackerDashboard = () => {
  const theme = useTheme();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState(null);
  const [realtimeData, setRealtimeData] = useState(null);
  const [attendanceTrends, setAttendanceTrends] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // UI state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [dateFilter, setDateFilter] = useState({
    from: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });

  // API calls
  const fetchDashboardData = useCallback(async () => {
    try {
      console.log('🔄 Fetching dashboard data...');
      console.log('📅 Date filter:', dateFilter);
      
      const headers = getAuthHeaders();
      console.log('🔐 Request headers:', headers);
      
      const url = `/api/attendance/dashboard?dateFrom=${dateFilter.from}&dateTo=${dateFilter.to}`;
      console.log('🎯 Request URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      console.log('📡 Dashboard response status:', response.status);
      console.log('📡 Dashboard response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        // Read the response text first, then try to parse as JSON
        const responseText = await response.text();
        try {
          const data = JSON.parse(responseText);
          console.log('📊 Dashboard data received:', {
            success: data.success,
            meetingsCount: data.meetings?.length || 0,
            hasStatistics: !!data.overallStatistics,
            hasQrStats: !!data.qrLocationStatistics
          });
          setDashboardData(data);
          setTrackingStatus(data.trackingStatus);
        } catch (jsonError) {
          console.error('❌ Dashboard API returned non-JSON response:', {
            status: response.status,
            responseText: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''),
            jsonError: jsonError.message
          });
          throw new Error(`Invalid JSON response from dashboard API: ${jsonError.message}`);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Dashboard API error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 200) + (errorText.length > 200 ? '...' : ''),
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('📎 Full error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      showNotification(`Failed to load attendance dashboard data: ${error.message}`, 'error');
      // Set default empty data
      setDashboardData({
        success: false,
        meetings: [],
        overallStatistics: {
          totalMeetings: 0,
          totalParticipants: 0,
          totalStudents: 0,
          attendanceRate: 0
        },
        qrLocationStatistics: null
      });
    }
  }, [dateFilter]);

  const fetchRealtimeData = useCallback(async () => {
    try {
      console.log('🔄 Fetching realtime data...');
      const response = await fetch('/api/zoom/real-time', {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Realtime response status:', response.status);

      if (response.ok) {
        // Read the response text first, then try to parse as JSON
        const responseText = await response.text();
        try {
          const data = JSON.parse(responseText);
          console.log('📊 Realtime data received:', data);
          setRealtimeData(data);
        } catch (jsonError) {
          console.error('❌ Realtime API returned non-JSON response:', {
            status: response.status,
            responseText: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''),
            jsonError: jsonError.message
          });
          // Set default empty data instead of throwing
          setRealtimeData({
            success: false,
            activeMeetings: [],
            participants: [],
            analytics: {
              totalMeetings: 0,
              activeMeetings: 0,
              totalParticipants: 0,
              activeParticipants: 0
            }
          });
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Realtime API error:', response.status, errorText);
        // Set default empty data instead of throwing
        setRealtimeData({
          success: false,
          activeMeetings: [],
          participants: [],
          analytics: {
            totalMeetings: 0,
            activeMeetings: 0,
            totalParticipants: 0,
            activeParticipants: 0
          }
        });
      }
    } catch (error) {
      console.error('Error fetching realtime data:', error);
      setRealtimeData({
        success: false,
        activeMeetings: [],
        participants: []
      });
    }
  }, []);

  const fetchAttendanceTrends = useCallback(async () => {
    try {
      console.log('🔄 Fetching trends data...');
      const response = await fetch(
        `/api/attendance/trends?dateFrom=${dateFilter.from}&dateTo=${dateFilter.to}`,
        {
          method: 'GET',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('📡 Trends response status:', response.status);

      if (response.ok) {
        // Read the response text first, then try to parse as JSON
        const responseText = await response.text();
        try {
          const data = JSON.parse(responseText);
          console.log('📊 Trends data received:', data);
          setAttendanceTrends(data);
        } catch (jsonError) {
          console.error('❌ Trends API returned non-JSON response:', {
            status: response.status,
            responseText: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''),
            jsonError: jsonError.message
          });
          // Set default empty data instead of throwing
          setAttendanceTrends({
            success: false,
            trends: [],
            statistics: {}
          });
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Trends API error:', response.status, errorText);
        // Set default empty data instead of throwing
        setAttendanceTrends({
          success: false,
          trends: [],
          statistics: {}
        });
      }
    } catch (error) {
      console.error('Error fetching trends data:', error);
      setAttendanceTrends({
        success: false,
        trends: []
      });
    }
  }, [dateFilter]);

  // Load all data
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.allSettled([
        fetchDashboardData(),
        fetchRealtimeData(),
        fetchAttendanceTrends()
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load all data:', error);
      showNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardData, fetchRealtimeData, fetchAttendanceTrends]);

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
    switch (status?.toLowerCase()) {
      case 'present': return theme.palette.success.main;
      case 'late': return theme.palette.warning.main;
      case 'absent': return theme.palette.error.main;
      case 'partial': return theme.palette.info.main;
      default: return theme.palette.grey[500];
    }
  };

  const getTrackingStatusColor = (isActive) => {
    return isActive ? theme.palette.success.main : theme.palette.error.main;
  };

  // Tab handling
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Statistics cards component
  const StatisticsCards = () => {
    const stats = dashboardData?.overallStatistics || {};
    const qrStats = dashboardData?.qrLocationStatistics || {};
    
    const cards = [
      {
        title: 'Total Meetings',
        value: stats.totalMeetings || 0,
        icon: <VideocamIcon />,
        color: theme.palette.primary.main,
        subtitle: 'Tracked meetings'
      },
      {
        title: 'Total Participants',
        value: stats.totalParticipants || 0,
        icon: <GroupIcon />,
        color: theme.palette.info.main,
        subtitle: 'All participants'
      },
      {
        title: 'Present',
        value: stats.present || 0,
        icon: <SuccessIcon />,
        color: theme.palette.success.main,
        subtitle: `${stats.attendanceRate || 0}% attendance rate`
      },
      {
        title: 'Students Tracked',
        value: stats.totalStudents || 0,
        icon: <SchoolIcon />,
        color: theme.palette.secondary.main,
        subtitle: 'Registered students'
      },
      {
        title: 'QR Scans',
        value: qrStats.totalScans || 0,
        icon: <QrCodeIcon />,
        color: theme.palette.warning.main,
        subtitle: `${qrStats.uniqueStudents || 0} unique students`
      },
      {
        title: 'Average Distance',
        value: qrStats.averageDistance ? `${qrStats.averageDistance}m` : 'N/A',
        icon: <LocationIcon />,
        color: theme.palette.error.main,
        subtitle: 'QR scan distance'
      }
    ];

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(card.color, 0.1)}, ${alpha(card.color, 0.05)})`,
                border: `1px solid ${alpha(card.color, 0.2)}`
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Box sx={{ color: card.color, mb: 1 }}>
                  {card.icon}
                </Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: card.color }}>
                  {card.value}
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                  {card.title}
                </Typography>
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

  // Recent meetings component
  const RecentMeetings = () => {
    const meetings = dashboardData?.meetings || [];

    return (
      <Card>
        <CardHeader 
          title="Recent Meetings"
          avatar={<VideocamIcon />}
          action={
            <Chip 
              label={`${meetings.length} meetings`}
              size="small"
              color="primary"
            />
          }
        />
        <CardContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Meeting ID</TableCell>
                  <TableCell>Topic</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Participants</TableCell>
                  <TableCell>Attendance Rate</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {meetings.slice(0, 10).map((meeting) => (
                  <TableRow key={meeting.meetingId}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {meeting.meetingId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {meeting.meetingTopic || 'Untitled Meeting'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(meeting.date), 'MMM dd, yyyy HH:mm')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <GroupIcon fontSize="small" />
                        <Typography variant="body2">
                          {meeting.statistics?.total || 0}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${meeting.attendanceRate || 0}%`}
                        size="small"
                        color={meeting.attendanceRate >= 80 ? 'success' : 
                               meeting.attendanceRate >= 60 ? 'warning' : 'error'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={meeting.statistics?.present > 0 ? 'Active' : 'Completed'}
                        size="small"
                        variant="outlined"
                        color={meeting.statistics?.present > 0 ? 'success' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {meetings.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <VideocamIcon sx={{ fontSize: 48, color: theme.palette.grey[400], mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No meetings found in the selected date range
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // Live participants component
  const LiveParticipants = () => {
    const participants = realtimeData?.participants || [];
    const activeMeetings = realtimeData?.activeMeetings || [];

    return (
      <Card>
        <CardHeader 
          title="Live Participants"
          avatar={<GroupIcon />}
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip 
                label={`${participants.length} active`}
                size="small"
                color="success"
                icon={<PersonIcon />}
              />
              <IconButton onClick={fetchRealtimeData} size="small">
                <RefreshIcon />
              </IconButton>
            </Stack>
          }
        />
        <CardContent>
          {activeMeetings.length > 0 ? (
            activeMeetings.map((meeting) => (
              <Box key={meeting.id} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                  {meeting.topic} ({meeting.id})
                </Typography>
                <List dense>
                  {meeting.participants.map((participant) => (
                    <ListItem key={participant.id} divider>
                      <ListItemIcon>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: getStatusColor(participant.attendanceStatus) }}>
                          <PersonIcon fontSize="small" />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={participant.name}
                        secondary={
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Typography variant="caption">
                              Joined: {format(new Date(participant.joinTime), 'HH:mm')}
                            </Typography>
                            <Chip
                              label={participant.attendanceStatus}
                              size="small"
                              sx={{
                                backgroundColor: alpha(getStatusColor(participant.attendanceStatus), 0.2),
                                color: getStatusColor(participant.attendanceStatus)
                              }}
                            />
                            {participant.isActive && (
                              <Chip
                                label="Online"
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            )}
                          </Stack>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
                {meeting.participants.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No active participants
                  </Typography>
                )}
              </Box>
            ))
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <GroupIcon sx={{ fontSize: 48, color: theme.palette.grey[400], mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No active meetings or participants
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // QR Scanner Statistics
  const QRStatistics = () => {
    const qrStats = dashboardData?.qrLocationStatistics;

    if (!qrStats) {
      return (
        <Card>
          <CardHeader title="QR Scanner Statistics" avatar={<QrCodeIcon />} />
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <QrCodeIcon sx={{ fontSize: 48, color: theme.palette.grey[400], mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No QR scan data available
              </Typography>
            </Box>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader 
          title="QR Scanner Statistics"
          avatar={<QrCodeIcon />}
          action={
            <Chip 
              label={`${qrStats.totalScans} scans`}
              size="small"
              color="warning"
            />
          }
        />
        <CardContent>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {qrStats.totalScans}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Scans
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary">
                  {qrStats.uniqueStudents}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Unique Students
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Typography variant="subtitle2" sx={{ mb: 2 }}>Recent QR Scans:</Typography>
          <List dense>
            {qrStats.recentScans?.map((scan, index) => (
              <ListItem key={index} divider>
                <ListItemIcon>
                  <QrCodeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={scan.studentName}
                  secondary={
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="caption">
                        ID: {scan.studentId}
                      </Typography>
                      <Typography variant="caption">
                        {format(new Date(scan.date), 'MMM dd, HH:mm')}
                      </Typography>
                      {scan.distance && (
                        <Typography variant="caption">
                          {scan.distance}m
                        </Typography>
                      )}
                      <Chip
                        label={scan.verificationStatus}
                        size="small"
                        color={scan.verificationStatus === 'verified' ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </Stack>
                  }
                />
              </ListItem>
            )) || []}
          </List>
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
    <Box sx={{ width: '100%', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Attendance Tracker Dashboard
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small">
            <InputLabel>From</InputLabel>
            <TextField
              type="date"
              size="small"
              value={dateFilter.from}
              onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
              sx={{ minWidth: 150 }}
            />
          </FormControl>
          <FormControl size="small">
            <InputLabel>To</InputLabel>
            <TextField
              type="date"
              size="small"
              value={dateFilter.to}
              onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
              sx={{ minWidth: 150 }}
            />
          </FormControl>
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
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadAllData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* System Status */}
      {trackingStatus && (
        <Alert
          severity={trackingStatus.isActive ? 'success' : 'warning'}
          sx={{ mb: 3 }}
          icon={trackingStatus.isActive ? <SuccessIcon /> : <WarningIcon />}
        >
          <Typography variant="body2">
            Attendance tracking is {trackingStatus.isActive ? 'active' : 'inactive'}
            {trackingStatus.lastUpdate && (
              <span> - Last updated: {formatDistanceToNow(new Date(trackingStatus.lastUpdate), { addSuffix: true })}</span>
            )}
          </Typography>
        </Alert>
      )}

      {/* Statistics Cards */}
      <StatisticsCards />

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
          <Tab label="Recent Meetings" icon={<VideocamIcon />} />
          <Tab label="Live Participants" icon={<GroupIcon />} />
          <Tab label="QR Statistics" icon={<QrCodeIcon />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box>
        {activeTab === 0 && <RecentMeetings />}
        {activeTab === 1 && <LiveParticipants />}
        {activeTab === 2 && <QRStatistics />}
      </Box>

      {/* Last Updated */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Typography variant="caption" color="text.secondary">
          Last updated: {format(lastUpdated, 'MMM dd, yyyy HH:mm:ss')}
        </Typography>
      </Box>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AttendanceTrackerDashboard;
