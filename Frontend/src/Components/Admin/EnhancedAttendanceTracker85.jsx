import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Avatar,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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
  Sync as SyncIcon,
  Download as DownloadIcon,
  Notifications as NotificationsIcon,
  WifiTethering as LiveIcon,
  SignalWifiOff as OfflineIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import io from 'socket.io-client';
import { getAuthHeaders } from '../../utils/authUtils';

const ATTENDANCE_THRESHOLD = 85; // 85% attendance threshold

const EnhancedAttendanceTracker85 = ({ 
  onMeetingSelect, 
  selectedMeetingId: initialMeetingId,
  autoStart = true 
}) => {
  const theme = useTheme();
  const socketRef = useRef(null);
  
  // State management
  const [loading, setLoading] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(initialMeetingId || '');
  const [attendanceData, setAttendanceData] = useState([]);
  const [statistics, setStatistics] = useState({
    totalParticipants: 0,
    presentCount: 0,
    absentCount: 0,
    inProgressCount: 0,
    averageAttendance: 0,
    meetingDuration: 0,
    above85Percent: 0,
    below85Percent: 0
  });
  
  // UI state
  const [isTracking, setIsTracking] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10); // seconds
  const [lastUpdated, setLastUpdated] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [activeTab, setActiveTab] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // API Base URL
  const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
  const apiUrl = `${backendUrl}/api`;

  /**
   * Show notification
   */
  const showNotification = useCallback((message, severity = 'info') => {
    setNotification({ open: true, message, severity });
    
    // Add to notifications list
    const newNotification = {
      id: Date.now(),
      message,
      severity,
      timestamp: new Date()
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep last 10
  }, []);

  /**
   * Initialize WebSocket connection
   */
  const initializeSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    try {
      socketRef.current = io(backendUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000
      });

      const socket = socketRef.current;

      socket.on('connect', () => {
        console.log('✅ Connected to WebSocket server');
        setSocketConnected(true);
        showNotification('Connected to real-time updates', 'success');
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from WebSocket server:', reason);
        setSocketConnected(false);
        setIsTracking(false);
        showNotification('Disconnected from real-time updates', 'warning');
      });

      socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        setSocketConnected(false);
        showNotification(`Connection error: ${error.message}`, 'error');
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Reconnected to WebSocket server');
        setSocketConnected(true);
        showNotification('Reconnected to real-time updates', 'success');
        
        // Re-subscribe if we were tracking
        if (selectedMeeting && isTracking) {
          startTracking();
        }
      });

      // 85% Attendance Tracker WebSocket Events
      socket.on('attendance85Subscribed', (data) => {
        console.log('📊 85% Attendance tracker subscription confirmed:', data);
        setIsTracking(true);
        showNotification(`Started tracking meeting ${data.meetingId}`, 'success');
      });

      socket.on('attendance85Unsubscribed', (data) => {
        console.log('📊 85% Attendance tracker unsubscribed:', data);
        setIsTracking(false);
        showNotification(`Stopped tracking meeting ${data.meetingId}`, 'info');
      });

      socket.on('attendance85Initial', (data) => {
        console.log('📊 Initial 85% attendance data received:', data);
        if (data.data && data.data.success) {
          setAttendanceData(data.data.participants || []);
          setStatistics(data.data.statistics || statistics);
          setLastUpdated(new Date());
        }
      });

      socket.on('attendance85Update', (data) => {
        console.log('📊 85% Attendance update received:', data);
        if (data.data && data.data.success) {
          setAttendanceData(data.data.participants || []);
          setStatistics(data.data.statistics || statistics);
          setLastUpdated(new Date());
        }
      });

      socket.on('attendance85TableUpdate', (data) => {
        console.log('📊 85% Attendance table update received:', data);
        if (data.tableData) {
          setAttendanceData(data.tableData);
          setStatistics(data.statistics || statistics);
          setLastUpdated(new Date());
        }
      });

      socket.on('attendance85ParticipantJoined', (data) => {
        console.log('👋 Participant joined:', data);
        showNotification(`${data.participant?.name || 'Someone'} joined the meeting`, 'info');
        
        // Force refresh of data
        setTimeout(() => {
          fetchAttendanceData();
        }, 1000);
      });

      socket.on('attendance85Statistics', (data) => {
        console.log('📈 Statistics update received:', data);
        if (data.statistics) {
          setStatistics(data.statistics);
          setLastUpdated(new Date());
        }
      });

      socket.on('attendance85Status', (data) => {
        console.log('📊 Tracking status received:', data);
        setIsTracking(data.isTracked || false);
      });

      socket.on('attendance85Error', (data) => {
        console.error('❌ 85% Attendance tracker error:', data);
        showNotification(`Error: ${data.error}`, 'error');
        setIsTracking(false);
      });

      // User session events
      socket.on('userJoinedMeeting', (data) => {
        if (data.meetingId === selectedMeeting) {
          console.log('👤 User joined meeting:', data);
          showNotification(`${data.user?.username || 'User'} joined the meeting`, 'success');
          
          // Trigger immediate refresh
          setTimeout(() => {
            fetchAttendanceData();
          }, 1500); // Give time for database to update
        }
      });

      socket.on('participantJoined', (data) => {
        if (data.type === 'authenticated_user') {
          console.log('🎯 Authenticated participant joined:', data);
          showNotification(`${data.user?.username || 'User'} joined (authenticated)`, 'success');
          
          // Trigger immediate refresh
          setTimeout(() => {
            fetchAttendanceData();
          }, 1500);
        }
      });

    } catch (error) {
      console.error('❌ Failed to initialize WebSocket connection:', error);
      showNotification(`Failed to connect: ${error.message}`, 'error');
    }
  }, [backendUrl, selectedMeeting, isTracking, showNotification]);

  /**
   * Fetch available meetings
   */
  const fetchMeetings = useCallback(async () => {
    try {
      console.log('🔄 Fetching meetings...');
      const response = await fetch(`${apiUrl}/zoom/meetings`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Meetings fetched:', data);
        setMeetings(data.meetings || []);
        
        // Auto-select first meeting if none selected
        if (!selectedMeeting && data.meetings?.length > 0) {
          const firstMeeting = data.meetings[0];
          const meetingId = firstMeeting.meetingId || firstMeeting.id;
          setSelectedMeeting(meetingId);
          if (onMeetingSelect) {
            onMeetingSelect(meetingId);
          }
        }
      } else {
        console.error('❌ Failed to fetch meetings:', response.status);
        showNotification(`Failed to fetch meetings: ${response.status}`, 'error');
      }
    } catch (error) {
      console.error('❌ Error fetching meetings:', error);
      showNotification(`Error: ${error.message}`, 'error');
    }
  }, [apiUrl, selectedMeeting, onMeetingSelect, showNotification]);

  /**
   * Fetch attendance data using REST API
   */
  const fetchAttendanceData = useCallback(async () => {
    if (!selectedMeeting) return;

    try {
      console.log(`🔄 Fetching attendance data for meeting: ${selectedMeeting}`);
      setLoading(true);

      const response = await fetch(
        `${apiUrl}/zoom/meeting/${selectedMeeting}/attendance-tracker?threshold=${ATTENDANCE_THRESHOLD}`,
        { headers: getAuthHeaders() }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Attendance data received:', data);
        
        if (data.success) {
          setAttendanceData(data.participants || []);
          setStatistics(data.statistics || statistics);
          setLastUpdated(new Date());
          showNotification(`Updated ${data.participants?.length || 0} participants`, 'info');
        } else {
          showNotification(data.message || 'Failed to fetch data', 'warning');
        }
      } else {
        console.error('❌ Failed to fetch attendance data:', response.status);
        showNotification(`Failed to fetch data: ${response.status}`, 'error');
      }
    } catch (error) {
      console.error('❌ Error fetching attendance data:', error);
      showNotification(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedMeeting, apiUrl, showNotification]);

  /**
   * Start WebSocket tracking
   */
  const startTracking = useCallback(() => {
    if (!selectedMeeting || !socketRef.current) {
      showNotification('Please select a meeting and ensure connection', 'warning');
      return;
    }

    console.log(`🔄 Starting 85% attendance tracking for meeting: ${selectedMeeting}`);
    
    socketRef.current.emit('subscribe85AttendanceTracker', {
      meetingId: selectedMeeting,
      options: {
        threshold: ATTENDANCE_THRESHOLD,
        interval: refreshInterval * 1000,
        includeInactive: false
      }
    });
  }, [selectedMeeting, refreshInterval, showNotification]);

  /**
   * Stop WebSocket tracking
   */
  const stopTracking = useCallback(() => {
    if (!selectedMeeting || !socketRef.current) return;

    console.log(`🛑 Stopping 85% attendance tracking for meeting: ${selectedMeeting}`);
    
    socketRef.current.emit('unsubscribe85AttendanceTracker', {
      meetingId: selectedMeeting
    });

    setIsTracking(false);
  }, [selectedMeeting]);

  /**
   * Handle meeting selection
   */
  const handleMeetingChange = useCallback((event) => {
    const meetingId = event.target.value;
    console.log(`🎯 Meeting selected: ${meetingId}`);
    
    // Stop current tracking
    if (isTracking) {
      stopTracking();
    }
    
    setSelectedMeeting(meetingId);
    setAttendanceData([]);
    setStatistics({
      totalParticipants: 0,
      presentCount: 0,
      absentCount: 0,
      inProgressCount: 0,
      averageAttendance: 0,
      meetingDuration: 0,
      above85Percent: 0,
      below85Percent: 0
    });
    
    if (onMeetingSelect) {
      onMeetingSelect(meetingId);
    }

    // Fetch initial data
    if (meetingId) {
      setTimeout(() => {
        fetchAttendanceData();
      }, 500);
    }
  }, [isTracking, stopTracking, onMeetingSelect, fetchAttendanceData]);

  /**
   * Toggle tracking
   */
  const toggleTracking = useCallback(() => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  }, [isTracking, startTracking, stopTracking]);

  /**
   * Export attendance data as CSV
   */
  const exportData = useCallback(async () => {
    if (!selectedMeeting) {
      showNotification('Please select a meeting first', 'warning');
      return;
    }

    try {
      console.log(`📊 Exporting attendance data for meeting: ${selectedMeeting}`);
      const response = await fetch(
        `${apiUrl}/zoom/meeting/${selectedMeeting}/attendance-export?threshold=${ATTENDANCE_THRESHOLD}`,
        { headers: getAuthHeaders() }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `attendance-85-tracker-${selectedMeeting}-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotification('Data exported successfully', 'success');
      } else {
        showNotification('Failed to export data', 'error');
      }
    } catch (error) {
      console.error('❌ Error exporting data:', error);
      showNotification(`Export error: ${error.message}`, 'error');
    }
  }, [selectedMeeting, apiUrl, showNotification]);

  /**
   * Get status color
   */
  const getStatusColor = (participant) => {
    if (participant.isActive || participant.status === 'In Progress') {
      return theme.palette.info.main;
    }
    return participant.percentage >= ATTENDANCE_THRESHOLD ? theme.palette.success.main : theme.palette.error.main;
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (participant) => {
    if (participant.isActive || participant.status === 'In Progress') {
      return <AccessTimeIcon color="info" />;
    }
    return participant.percentage >= ATTENDANCE_THRESHOLD ? 
      <CheckCircle color="success" /> : 
      <ErrorIcon color="error" />;
  };

  /**
   * Format duration
   */
  const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return '0 min';
    
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    
    return `${minutes} min`;
  };

  // Effects
  useEffect(() => {
    fetchMeetings();
    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [fetchMeetings, initializeSocket]);

  // Auto-start tracking effect
  useEffect(() => {
    if (autoStart && selectedMeeting && socketConnected && !isTracking) {
      setTimeout(() => {
        startTracking();
      }, 1000);
    }
  }, [autoStart, selectedMeeting, socketConnected, isTracking, startTracking]);

  // Update selected meeting from props
  useEffect(() => {
    if (initialMeetingId && initialMeetingId !== selectedMeeting) {
      setSelectedMeeting(initialMeetingId);
    }
  }, [initialMeetingId, selectedMeeting]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AnalyticsIcon color="primary" />
                85% Zoom Attendance Tracker
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Real-time attendance monitoring with 85% duration threshold
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Connection Status */}
              <Chip
                icon={socketConnected ? <LiveIcon /> : <OfflineIcon />}
                label={socketConnected ? 'Live' : 'Offline'}
                color={socketConnected ? 'success' : 'error'}
                variant="outlined"
              />
              
              {/* Tracking Status */}
              <Chip
                icon={isTracking ? <SyncIcon /> : <StopIcon />}
                label={isTracking ? 'Tracking' : 'Stopped'}
                color={isTracking ? 'info' : 'default'}
                variant="outlined"
              />
              
              <IconButton onClick={() => setShowSettings(true)}>
                <SettingsIcon />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Meeting</InputLabel>
                <Select
                  value={selectedMeeting}
                  label="Select Meeting"
                  onChange={handleMeetingChange}
                >
                  {meetings.map((meeting) => (
                    <MenuItem key={meeting.id || meeting.meetingId} value={meeting.meetingId || meeting.id}>
                      {meeting.topic} ({meeting.meetingId || meeting.id})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <ButtonGroup variant="contained" fullWidth>
                <Button
                  onClick={toggleTracking}
                  startIcon={isTracking ? <StopIcon /> : <StartIcon />}
                  color={isTracking ? "error" : "success"}
                  disabled={!selectedMeeting || !socketConnected}
                >
                  {isTracking ? 'Stop' : 'Start'} Tracking
                </Button>
                <Button
                  onClick={fetchAttendanceData}
                  startIcon={<RefreshIcon />}
                  disabled={!selectedMeeting || loading}
                >
                  Refresh
                </Button>
              </ButtonGroup>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <ButtonGroup variant="outlined" fullWidth>
                <Button
                  onClick={exportData}
                  startIcon={<DownloadIcon />}
                  disabled={!selectedMeeting || attendanceData.length === 0}
                >
                  Export CSV
                </Button>
                <Button
                  onClick={fetchMeetings}
                  startIcon={<RefreshIcon />}
                >
                  Reload Meetings
                </Button>
              </ButtonGroup>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <GroupIcon color="primary" />
                <Box>
                  <Typography variant="h6">{statistics.totalParticipants}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Participants
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <SuccessIcon color="success" />
                <Box>
                  <Typography variant="h6">{statistics.above85Percent}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Present (≥85%)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <ErrorIcon color="error" />
                <Box>
                  <Typography variant="h6">{statistics.below85Percent}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Absent (&lt;85%)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <AccessTimeIcon color="info" />
                <Box>
                  <Typography variant="h6">{statistics.inProgressCount}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    In Progress
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Card>
        <CardHeader
          title="Attendance Details"
          subheader={lastUpdated ? `Last updated: ${formatDistanceToNow(lastUpdated)} ago` : 'No data available'}
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {loading && <CircularProgress size={20} />}
              <Badge badgeContent={notifications.length} color="primary">
                <NotificationsIcon />
              </Badge>
            </Box>
          }
        />
        <CardContent>
          {attendanceData.length === 0 ? (
            <Alert severity="info">
              No attendance data available. {selectedMeeting ? 'Start tracking to see live data.' : 'Please select a meeting.'}
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Participant</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Percentage</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Join Time</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendanceData.map((participant, index) => (
                    <TableRow key={participant.id || participant.participantId || index}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ bgcolor: getStatusColor(participant), width: 32, height: 32 }}>
                            {getStatusIcon(participant)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {participant.name || participant.participantName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {participant.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDuration(participant.duration)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          of {formatDuration(statistics.meetingDuration)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(participant.percentage || 0, 100)}
                            sx={{ width: 60, height: 8, borderRadius: 4 }}
                            color={participant.percentage >= ATTENDANCE_THRESHOLD ? 'success' : 'error'}
                          />
                          <Typography variant="body2">
                            {participant.percentage || 0}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={participant.status}
                          size="small"
                          color={
                            participant.status === 'In Progress' ? 'info' :
                            participant.percentage >= ATTENDANCE_THRESHOLD ? 'success' : 'error'
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {participant.joinTime ? 
                            format(new Date(participant.joinTime), 'HH:mm:ss') : 
                            'Not joined'
                          }
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tracker Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={autoRefresh} 
                  onChange={(e) => setAutoRefresh(e.target.checked)} 
                />
              }
              label="Auto Refresh"
            />
            
            <TextField
              label="Refresh Interval (seconds)"
              type="number"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Math.max(5, parseInt(e.target.value) || 10))}
              InputProps={{ inputProps: { min: 5, max: 300 } }}
              helperText="How often to update data (5-300 seconds)"
            />
            
            <Typography variant="h6">Connection Status</Typography>
            <Box>
              <Typography variant="body2">
                WebSocket: {socketConnected ? '✅ Connected' : '❌ Disconnected'}
              </Typography>
              <Typography variant="body2">
                Tracking: {isTracking ? '✅ Active' : '❌ Stopped'}
              </Typography>
              <Typography variant="body2">
                Selected Meeting: {selectedMeeting || 'None'}
              </Typography>
            </Box>
            
            <Typography variant="h6">Recent Notifications</Typography>
            <List dense>
              {notifications.slice(0, 5).map((notif) => (
                <ListItem key={notif.id}>
                  <ListItemIcon>
                    {notif.severity === 'success' ? <SuccessIcon color="success" /> :
                     notif.severity === 'error' ? <ErrorIcon color="error" /> :
                     notif.severity === 'warning' ? <WarningIcon color="warning" /> :
                     <InfoIcon color="info" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={notif.message}
                    secondary={format(notif.timestamp, 'HH:mm:ss')}
                  />
                </ListItem>
              ))}
              {notifications.length === 0 && (
                <ListItem>
                  <ListItemText primary="No recent notifications" />
                </ListItem>
              )}
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnhancedAttendanceTracker85;
