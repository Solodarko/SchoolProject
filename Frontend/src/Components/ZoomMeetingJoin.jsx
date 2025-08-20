import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  Snackbar,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  Stack,
  Divider
} from '@mui/material';
import {
  Videocam as VideocamIcon,
  PersonAdd as JoinIcon,
  ExitToApp as LeaveIcon,
  AccessTime as TimeIcon,
  Group as GroupIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
  Launch as LaunchIcon,
  ContentCopy as CopyIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import io from 'socket.io-client';

const ZoomMeetingJoin = ({ userToken, userId, userInfo }) => {
  // State management
  const [meetingId, setMeetingId] = useState('');
  const [meetingPassword, setMeetingPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [joinedMeeting, setJoinedMeeting] = useState(null);
  const [attendanceSession, setAttendanceSession] = useState(null);
  const [socket, setSocket] = useState(null);
  const [availableMeetings, setAvailableMeetings] = useState([]);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Backend URL
  const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

  // Show notification helper
  const showNotification = useCallback((message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  }, []);

  // Socket connection setup
  useEffect(() => {
    if (!userToken) return;

    const newSocket = io(backendUrl, {
      transports: ['websocket'],
      autoConnect: true,
      auth: {
        token: userToken,
        userId: userId
      }
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to attendance tracking server');
      showNotification('Connected to attendance tracking', 'success');
    });

    newSocket.on('meetingJoined', (data) => {
      console.log('🎉 Meeting joined successfully:', data);
      setJoinedMeeting(data.meeting);
      setAttendanceSession(data.attendanceSession);
      showNotification(`Successfully joined: ${data.meeting.topic}`, 'success');
    });

    newSocket.on('attendanceUpdated', (data) => {
      console.log('📊 Attendance updated:', data);
      setAttendanceSession(data.attendanceSession);
    });

    newSocket.on('meetingLeft', (data) => {
      console.log('👋 Left meeting:', data);
      setJoinedMeeting(null);
      setAttendanceSession(null);
      showNotification(`Left meeting. Duration: ${data.duration} minutes`, 'info');
    });

    newSocket.on('meetingEnded', (data) => {
      console.log('🏁 Meeting ended:', data);
      setJoinedMeeting(null);
      setAttendanceSession(null);
      showNotification('Meeting has ended', 'warning');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      showNotification('Disconnected from attendance tracking', 'error');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [backendUrl, userToken, userId, showNotification]);

  // Fetch available meetings
  const fetchAvailableMeetings = useCallback(async () => {
    if (!userToken) return;

    try {
      const response = await fetch(`${backendUrl}/api/zoom/meetings/available`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setAvailableMeetings(data.meetings || []);
      } else {
        console.warn('Failed to fetch available meetings:', data.error);
      }
    } catch (error) {
      console.error('Error fetching available meetings:', error);
    }
  }, [backendUrl, userToken]);

  // Initial load
  useEffect(() => {
    fetchAvailableMeetings();
    const interval = setInterval(fetchAvailableMeetings, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchAvailableMeetings]);

  // Join meeting function
  const joinMeeting = async () => {
    if (!meetingId.trim()) {
      showNotification('Please enter a meeting ID', 'error');
      return;
    }

    if (!userToken) {
      showNotification('User authentication required', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/zoom/meeting/join-with-tracking`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          meetingId: meetingId.trim(),
          password: meetingPassword.trim() || undefined,
          userInfo: {
            userId,
            name: userInfo?.name || userInfo?.username || 'Unknown User',
            email: userInfo?.email || '',
            studentId: userInfo?.studentId || '',
            department: userInfo?.department || ''
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Open Zoom meeting in new window/tab
        window.open(data.joinUrl, '_blank');
        
        // Track the join locally
        setJoinedMeeting(data.meeting);
        setAttendanceSession(data.attendanceSession);
        
        showNotification(`Joining meeting: ${data.meeting.topic}`, 'success');
      } else {
        throw new Error(data.error || 'Failed to join meeting');
      }
    } catch (error) {
      console.error('Failed to join meeting:', error);
      showNotification(`Failed to join meeting: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Leave meeting function
  const leaveMeeting = async () => {
    if (!joinedMeeting || !attendanceSession) return;

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/zoom/meeting/leave-with-tracking`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          meetingId: joinedMeeting.id,
          attendanceSessionId: attendanceSession.id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setJoinedMeeting(null);
        setAttendanceSession(null);
        showNotification(`Left meeting. Duration: ${data.duration} minutes`, 'info');
      } else {
        throw new Error(data.error || 'Failed to leave meeting');
      }
    } catch (error) {
      console.error('Failed to leave meeting:', error);
      showNotification(`Failed to record meeting leave: ${error.message}`, 'error');
      // Still allow local state to be cleared
      setJoinedMeeting(null);
      setAttendanceSession(null);
    } finally {
      setLoading(false);
    }
  };

  // Copy meeting info to clipboard
  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification(`${label} copied to clipboard`, 'success');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      showNotification('Failed to copy to clipboard', 'error');
    }
  };

  // Select meeting from available list
  const selectMeeting = (meeting) => {
    setMeetingId(meeting.id);
    setMeetingPassword(meeting.password || '');
    setShowMeetingDialog(false);
    showNotification(`Selected meeting: ${meeting.topic}`, 'info');
  };

  // User authentication status
  if (!userToken) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <SecurityIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" color="error.main" gutterBottom>
            Authentication Required
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please log in to join Zoom meetings and track your attendance.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      {/* Header */}
      <Typography variant="h4" component="h1" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <VideocamIcon color="primary" />
        Zoom Meeting Join
      </Typography>

      {/* User Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Welcome, {userInfo?.name || userInfo?.username || 'User'}
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Chip 
              icon={<SecurityIcon />}
              label="Authenticated"
              color="success"
              size="small"
            />
            {userInfo?.studentId && (
              <Chip 
                label={`ID: ${userInfo.studentId}`}
                size="small"
                variant="outlined"
              />
            )}
            {userInfo?.department && (
              <Chip 
                label={userInfo.department}
                size="small"
                variant="outlined"
              />
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Current Meeting Status */}
      {joinedMeeting && attendanceSession ? (
        <Card sx={{ mb: 3, border: 2, borderColor: 'success.main' }}>
          <CardContent>
            <Typography variant="h6" color="success.main" gutterBottom>
              Currently in Meeting
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>{joinedMeeting.topic}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Meeting ID: {joinedMeeting.id}
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {format(new Date(attendanceSession.joinTime), 'HH:mm:ss')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Join Time
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="info.main">
                    {formatDistanceToNow(new Date(attendanceSession.joinTime))}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Duration
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button
                variant="contained"
                color="error"
                startIcon={<LeaveIcon />}
                onClick={leaveMeeting}
                disabled={loading}
              >
                Leave Meeting
              </Button>
              <Button
                variant="outlined"
                startIcon={<LaunchIcon />}
                onClick={() => window.open(joinedMeeting.join_url, '_blank')}
              >
                Open Meeting
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        /* Join Meeting Form */
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Join a Meeting
            </Typography>
            
            <Stack spacing={2}>
              <TextField
                label="Meeting ID"
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
                fullWidth
                placeholder="Enter meeting ID or URL"
                helperText="Enter the Zoom meeting ID or paste the meeting URL"
              />
              
              <TextField
                label="Password (Optional)"
                type="password"
                value={meetingPassword}
                onChange={(e) => setMeetingPassword(e.target.value)}
                fullWidth
                placeholder="Meeting password if required"
              />

              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  startIcon={<JoinIcon />}
                  onClick={joinMeeting}
                  disabled={loading || !meetingId.trim()}
                  sx={{ minWidth: 120 }}
                >
                  {loading ? <CircularProgress size={20} /> : 'Join Meeting'}
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<GroupIcon />}
                  onClick={() => setShowMeetingDialog(true)}
                >
                  Available Meetings ({availableMeetings.length})
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchAvailableMeetings}
                >
                  Refresh
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Available Meetings Dialog */}
      <Dialog 
        open={showMeetingDialog} 
        onClose={() => setShowMeetingDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Available Meetings</DialogTitle>
        <DialogContent>
          {availableMeetings.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <VideocamIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No active meetings available at the moment
              </Typography>
            </Box>
          ) : (
            <List>
              {availableMeetings.map((meeting) => (
                <ListItem 
                  key={meeting.id}
                  sx={{ 
                    border: 1, 
                    borderColor: 'divider', 
                    borderRadius: 1, 
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => selectMeeting(meeting)}
                >
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <VideocamIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={meeting.topic}
                    secondary={
                      <Stack spacing={0.5}>
                        <Typography variant="caption">
                          ID: {meeting.id}
                        </Typography>
                        <Typography variant="caption">
                          Created: {format(new Date(meeting.created_at), 'MMM dd, HH:mm')}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip 
                            label={meeting.status} 
                            size="small" 
                            color={meeting.status === 'started' ? 'success' : 'warning'}
                          />
                          {meeting.password && (
                            <Chip 
                              label="Password Protected" 
                              size="small" 
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      </Stack>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMeetingDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* How It Works */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            How Attendance Tracking Works
          </Typography>
          <Stack spacing={2}>
            <Alert severity="info" icon={<InfoIcon />}>
              Your attendance is automatically tracked when you join meetings using this interface.
            </Alert>
            <Typography variant="body2" component="div">
              <strong>What's tracked:</strong>
              <ul>
                <li>Join time and leave time</li>
                <li>Total meeting duration</li>
                <li>User identification (name, student ID, etc.)</li>
                <li>Real-time attendance status</li>
              </ul>
            </Typography>
            <Typography variant="body2" component="div">
              <strong>Security:</strong>
              <ul>
                <li>Your user token is used to authenticate all attendance records</li>
                <li>Only you can access your attendance data</li>
                <li>All communications are encrypted</li>
              </ul>
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ZoomMeetingJoin;
