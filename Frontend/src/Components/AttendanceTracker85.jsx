import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Badge,
  LinearProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Refresh,
  Download,
  FilterList,
  Person,
  School,
  Schedule,
  Assessment,
  CheckCircle,
  Cancel,
  Pending,
  PersonSearch,
  TableChart,
  BarChart,
  Info,
  Close,
  Visibility,
  Timeline,
  Wifi,
  WifiOff
} from '@mui/icons-material';
import { format } from 'date-fns';
import io from 'socket.io-client';

const AttendanceTracker85 = ({ meetingId, meetingTitle, isActive, onClose }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [meetingInfo, setMeetingInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(isActive || false);
  const [filter, setFilter] = useState('all'); // all, present, absent, in_progress
  const [searchTerm, setSearchTerm] = useState('');
  const [showStudentsOnly, setShowStudentsOnly] = useState(false);
  const [attendanceThreshold, setAttendanceThreshold] = useState(85);
  
  // WebSocket states
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [websocketStatus, setWebsocketStatus] = useState('disconnected');
  const socketRef = useRef(null);

  const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

  // Fetch attendance data
  const fetchAttendanceData = useCallback(async () => {
    if (!meetingId) return;

    try {
      setError(null);
      const response = await fetch(
        `${backendUrl}/api/zoom/meeting/${meetingId}/attendance-tracker?threshold=${attendanceThreshold}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setAttendanceData(data.participants || []);
        setStatistics(data.statistics || {});
        setMeetingInfo(data.meetingInfo || {});
        setLastRefresh(new Date());
      } else {
        throw new Error(data.error || 'Failed to fetch attendance data');
      }
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [meetingId, attendanceThreshold, backendUrl]);

  // Auto-refresh effect (disabled when real-time is enabled)
  useEffect(() => {
    fetchAttendanceData();

    if (autoRefresh && isActive && !isRealTimeEnabled) {
      const interval = setInterval(fetchAttendanceData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchAttendanceData, autoRefresh, isActive, isRealTimeEnabled]);

  // Manual refresh
  const handleRefresh = () => {
    setLoading(true);
    fetchAttendanceData();
  };

  // Export to CSV
  const handleExport = async () => {
    if (!meetingId) return;

    try {
      const response = await fetch(
        `${backendUrl}/api/zoom/meeting/${meetingId}/attendance-export?threshold=${attendanceThreshold}`,
        {
          method: 'GET',
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance-tracker-${meetingId}-${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Failed to export data');
      }
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export attendance data');
    }
  };

  // Filter and search logic
  const filteredData = attendanceData.filter(participant => {
    // Filter by status
    if (filter !== 'all') {
      const status = participant.status?.toLowerCase().replace(' ', '_');
      if (filter !== status) return false;
    }

    // Filter by students only
    if (showStudentsOnly && !participant.studentInfo?.isMatched) return false;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const participantName = participant.participantName?.toLowerCase() || '';
      const email = participant.email?.toLowerCase() || '';
      const studentName = participant.studentInfo?.fullName?.toLowerCase() || '';
      const studentId = participant.studentInfo?.studentId?.toString().toLowerCase() || '';
      
      if (!participantName.includes(searchLower) &&
          !email.includes(searchLower) &&
          !studentName.includes(searchLower) &&
          !studentId.includes(searchLower)) {
        return false;
      }
    }

    return true;
  });

  // Get status color and icon
  const getStatusDisplay = (status, percentage) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return {
          color: 'success',
          icon: <CheckCircle fontSize="small" />,
          label: 'Present'
        };
      case 'absent':
        return {
          color: 'error',
          icon: <Cancel fontSize="small" />,
          label: 'Absent'
        };
      case 'in progress':
        return {
          color: 'primary',
          icon: <Pending fontSize="small" />,
          label: 'In Progress'
        };
      default:
        return {
          color: 'default',
          icon: <Info fontSize="small" />,
          label: status || 'Unknown'
        };
    }
  };

  // Format duration
  const formatDuration = (minutes) => {
    if (!minutes || minutes < 0) return '0 min';
    
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.round(minutes % 60);
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  // Format join time
  const formatJoinTime = (joinTime) => {
    if (!joinTime) return 'Not joined';
    
    try {
      return format(new Date(joinTime), 'HH:mm:ss');
    } catch (error) {
      return 'Invalid time';
    }
  };

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    if (!meetingId || socketRef.current) return;

    try {
      const socket = io(backendUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      socket.on('connect', () => {
        console.log('WebSocket connected');
        setIsWebSocketConnected(true);
        setWebsocketStatus('connected');
        setError(null);
        
        // Subscribe to attendance updates for this meeting
        socket.emit('subscribe85AttendanceTracker', {
          meetingId,
          threshold: attendanceThreshold
        });
      });

      socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setIsWebSocketConnected(false);
        setWebsocketStatus('disconnected');
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setError('WebSocket connection failed: ' + error.message);
        setWebsocketStatus('error');
      });

      socket.on('attendance85Update', (data) => {
        console.log('Received attendance update:', data);
        if (data.meetingId === meetingId) {
          setAttendanceData(data.data?.participants || []);
          setStatistics(data.data?.statistics || {});
          setMeetingInfo(data.data?.meetingInfo || {});
          setLastRefresh(new Date());
        }
      });

      socket.on('attendance85Initial', (data) => {
        console.log('Received initial attendance data:', data);
        if (data.meetingId === meetingId) {
          setAttendanceData(data.data?.participants || []);
          setStatistics(data.data?.statistics || {});
          setMeetingInfo(data.data?.meetingInfo || {});
          setLastRefresh(new Date());
        }
      });

      socket.on('attendance85Error', (error) => {
        console.error('Attendance tracker error:', error);
        setError(error.error || 'Real-time update error');
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setError('Failed to initialize real-time connection');
      setWebsocketStatus('error');
    }
  }, [meetingId, attendanceThreshold, backendUrl]);

  // Cleanup WebSocket connection
  const cleanupWebSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('unsubscribe85AttendanceTracker', { meetingId });
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsWebSocketConnected(false);
    setWebsocketStatus('disconnected');
  }, [meetingId]);

  // Toggle real-time updates
  const toggleRealTimeUpdates = useCallback(async () => {
    if (!meetingId) return;

    try {
      if (isRealTimeEnabled) {
        // Stop real-time tracking
        const response = await fetch(
          `${backendUrl}/api/zoom/meeting/${meetingId}/attendance-tracker/stop-websocket`,
          { method: 'POST' }
        );
        
        if (response.ok) {
          cleanupWebSocket();
          setIsRealTimeEnabled(false);
        } else {
          throw new Error('Failed to stop real-time tracking');
        }
      } else {
        // Start real-time tracking
        const response = await fetch(
          `${backendUrl}/api/zoom/meeting/${meetingId}/attendance-tracker/start-websocket`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ threshold: attendanceThreshold })
          }
        );
        
        if (response.ok) {
          setIsRealTimeEnabled(true);
          initializeWebSocket();
        } else {
          throw new Error('Failed to start real-time tracking');
        }
      }
    } catch (error) {
      console.error('Error toggling real-time updates:', error);
      setError(error.message);
    }
  }, [meetingId, attendanceThreshold, isRealTimeEnabled, backendUrl, initializeWebSocket, cleanupWebSocket]);

  // WebSocket effects
  useEffect(() => {
    if (isRealTimeEnabled && meetingId) {
      initializeWebSocket();
    }

    return () => {
      cleanupWebSocket();
    };
  }, [isRealTimeEnabled, meetingId, initializeWebSocket, cleanupWebSocket]);

  // Update WebSocket subscription when threshold changes
  useEffect(() => {
    if (socketRef.current && isWebSocketConnected) {
      socketRef.current.emit('subscribe85AttendanceTracker', {
        meetingId,
        threshold: attendanceThreshold
      });
    }
  }, [attendanceThreshold, meetingId, isWebSocketConnected]);

  return (
    <Dialog
      open={Boolean(meetingId)}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <Assessment color="primary" />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6">
            85% Zoom Attendance Duration Tracker
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {meetingTitle || meetingInfo.topic || `Meeting ${meetingId}`}
            {meetingInfo.duration && ` (${meetingInfo.duration} min)`}
          </Typography>
        </Box>
        <Badge badgeContent={filteredData.length} color="primary" max={999}>
          <Person />
        </Badge>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h4" color="primary">
                  {statistics.totalParticipants || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Participants
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h4" color="success.main">
                  {statistics.above85Percent || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Above 85% (Present)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h4" color="error.main">
                  {statistics.below85Percent || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Below 85% (Absent)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h4" color="info.main">
                  {statistics.studentsIdentified || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Students Identified
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Controls */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search participants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <PersonSearch sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Filter Status</InputLabel>
                <Select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  startAdornment={<FilterList sx={{ mr: 1 }} />}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="present">Present</MenuItem>
                  <MenuItem value="absent">Absent</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Threshold</InputLabel>
                <Select
                  value={attendanceThreshold}
                  onChange={(e) => setAttendanceThreshold(e.target.value)}
                >
                  <MenuItem value={70}>70%</MenuItem>
                  <MenuItem value={75}>75%</MenuItem>
                  <MenuItem value={80}>80%</MenuItem>
                  <MenuItem value={85}>85%</MenuItem>
                  <MenuItem value={90}>90%</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant={showStudentsOnly ? 'contained' : 'outlined'}
                  onClick={() => setShowStudentsOnly(!showStudentsOnly)}
                  startIcon={<School />}
                  color="info"
                >
                  Students Only
                </Button>
                <Button
                  size="small"
                  variant={isRealTimeEnabled ? 'contained' : 'outlined'}
                  onClick={toggleRealTimeUpdates}
                  startIcon={isWebSocketConnected ? <Wifi /> : <WifiOff />}
                  color={isRealTimeEnabled ? 'success' : 'default'}
                  disabled={loading}
                >
                  Real-time
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleRefresh}
                  disabled={loading || isRealTimeEnabled}
                  startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
                >
                  Refresh
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleExport}
                  startIcon={<Download />}
                  color="success"
                >
                  Export CSV
                </Button>
              </Box>
            </Grid>
          </Grid>
          
          {lastRefresh && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Last refreshed: {format(lastRefresh, 'HH:mm:ss')}
              {autoRefresh && isActive && ' (Auto-refresh: ON)'}
              {isRealTimeEnabled && (
                <span style={{ marginLeft: '1rem' }}>
                  • Real-time: 
                  <span style={{ 
                    color: isWebSocketConnected ? '#4caf50' : '#f44336',
                    fontWeight: 'bold'
                  }}>
                    {isWebSocketConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </span>
              )}
            </Typography>
          )}
        </Paper>

        {/* Attendance Table */}
        <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 400px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Participant</TableCell>
                <TableCell align="center">Duration</TableCell>
                <TableCell align="center">Percentage</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Join Time</TableCell>
                <TableCell>Student Info</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Loading attendance data...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Person sx={{ fontSize: 48, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      No participants found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((participant, index) => {
                  const statusDisplay = getStatusDisplay(participant.status, participant.percentage);
                  
                  return (
                    <TableRow key={participant.participantId || index} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                            {participant.authenticatedUser ? (
                              <Person fontSize="small" />
                            ) : (
                              participant.participantName?.charAt(0)?.toUpperCase() || '?'
                            )}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {participant.participantName || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {participant.email || 'No email'}
                              {participant.authenticatedUser && (
                                <Chip
                                  size="small"
                                  label="Auth"
                                  color="success"
                                  variant="outlined"
                                  sx={{ ml: 0.5, height: 16 }}
                                />
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight="medium">
                          {formatDuration(participant.duration)}
                        </Typography>
                        {participant.isActive && (
                          <Typography variant="caption" color="success.main">
                            (Live)
                          </Typography>
                        )}
                      </TableCell>
                      
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                          <Typography 
                            variant="body2" 
                            fontWeight="bold"
                            color={participant.percentage >= attendanceThreshold ? 'success.main' : 'error.main'}
                          >
                            {participant.percentage}%
                          </Typography>
                          {meetingInfo.duration && (
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(participant.percentage, 100)}
                              color={participant.percentage >= attendanceThreshold ? 'success' : 'error'}
                              sx={{ width: 40, height: 4 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Chip
                          size="small"
                          icon={statusDisplay.icon}
                          label={statusDisplay.label}
                          color={statusDisplay.color}
                          variant={participant.isActive ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      
                      <TableCell align="center">
                        <Typography variant="body2">
                          {formatJoinTime(participant.joinTime)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        {participant.studentInfo?.isMatched ? (
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {participant.studentInfo.fullName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {participant.studentInfo.studentId} | {participant.studentInfo.department}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            No student match
                          </Typography>
                        )}
                      </TableCell>
                      
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
          Showing {filteredData.length} of {attendanceData.length} participants
        </Typography>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AttendanceTracker85;
