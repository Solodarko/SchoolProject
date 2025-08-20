import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Badge,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Divider,
  ButtonGroup
} from '@mui/material';
import {
  Add,
  People,
  PersonAdd,
  PersonRemove,
  Videocam,
  AccessTime,
  ContentCopy,
  Launch,
  Stop,
  Refresh,
  Groups,
  SmartDisplay,
  RadioButtonChecked,
  RadioButtonUnchecked,
  Circle,
  Schedule,
  Person,
  Email,
  School,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Visibility,
  Assessment
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import io from 'socket.io-client';
import AttendanceTracker85 from '../AttendanceTracker85';
import FredAttendanceTracker from './FredAttendanceTracker';

const AdminZoomDashboard = () => {
  // State management
  const [meetings, setMeetings] = useState([]);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [liveStats, setLiveStats] = useState({
    totalParticipants: 0,
    activeNow: 0,
    studentsIdentified: 0,
    averageDuration: 0
  });
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationSeverity, setNotificationSeverity] = useState('info');

  // Dialog states
  const [createMeetingDialog, setCreateMeetingDialog] = useState(false);
  const [attendanceTracker85Open, setAttendanceTracker85Open] = useState(false);
  const [fredAttendanceTrackerOpen, setFredAttendanceTrackerOpen] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    topic: '',
    agenda: '',
    duration: 5,
    password: '',
    hostVideo: true,
    participantVideo: true,
    muteOnEntry: true,
    waitingRoom: false,
    recording: 'none'
  });

  // Backend URL
  const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

  // Helper functions (declared first to avoid hoisting issues)
  const showNotificationMessage = useCallback((message, severity = 'info') => {
    setNotificationMessage(message);
    setNotificationSeverity(severity);
    setShowNotification(true);
    
    const notification = {
      id: Date.now(),
      message,
      severity,
      timestamp: new Date()
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 19)]);
  }, []);

  const updateParticipantsList = useCallback(async () => {
    if (!activeMeeting) return;

    try {
      console.log('🔄 Fetching participants for meeting:', activeMeeting.id);
      const response = await fetch(`${backendUrl}/api/zoom/meeting/${activeMeeting.id}/live-participants`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Participants response:', data);
      
      if (data.success) {
        setParticipants(data.participants || []);
        
        // Handle statistics with fallback values
        const stats = data.statistics || {};
        setLiveStats({
          totalParticipants: stats.total_participants || 0,
          activeNow: stats.active_now || 0,
          studentsIdentified: stats.students_identified || 0,
          averageDuration: stats.average_duration || 0
        });
        
        console.log('✅ Updated participants and stats successfully');
      } else {
        console.warn('⚠️ API returned success: false', data);
        showNotificationMessage(data.error || 'Failed to fetch participants', 'warning');
      }
    } catch (error) {
      console.error('❌ Failed to update participants:', error);
      showNotificationMessage('Failed to fetch live participants. Please check if the meeting exists.', 'error');
      
      // Set empty state on error
      setParticipants([]);
      setLiveStats({
        totalParticipants: 0,
        activeNow: 0,
        studentsIdentified: 0,
        averageDuration: 0
      });
    }
  }, [activeMeeting, backendUrl, showNotificationMessage]);

  const loadMeetings = useCallback(async () => {
    setLoading(true);
    try {
      // Use the combined bridge endpoint that includes both active meetings from webhooks
      // AND recently created meetings from the database (even if not yet started)
      const response = await fetch(`${backendUrl}/api/meetings/active-with-created`);
      const data = await response.json();
      
      if (data.success) {
        const allMeetings = data.meetings || [];
        console.log('📊 Loaded meetings from combined endpoint:', {
          total: allMeetings.length,
          sources: data.sources || {}
        });
        
        setMeetings(allMeetings);
        
        // Auto-select first meeting if none selected (prioritize started/waiting meetings)
        if (!activeMeeting && allMeetings.length > 0) {
          const activeMeetings = allMeetings.filter(m => m.status === 'started' || m.status === 'waiting');
          if (activeMeetings.length > 0) {
            setActiveMeeting(activeMeetings[0]);
          } else {
            // If no active meetings, select the first one anyway
            setActiveMeeting(allMeetings[0]);
          }
        }
        
        showNotificationMessage(
          `Loaded ${allMeetings.length} meetings (${data.sources?.globalState || 0} active, ${data.sources?.database || 0} created)`, 
          'success'
        );
      } else {
        console.error('API returned success: false', data);
        showNotificationMessage(data.error || 'Failed to load meetings', 'error');
        setMeetings([]);
      }
    } catch (error) {
      console.error('Failed to load meetings:', error);
      showNotificationMessage('Failed to load meetings: ' + error.message, 'error');
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, activeMeeting, showNotificationMessage]);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(backendUrl, {
      transports: ['websocket'],
      autoConnect: true
    });

    newSocket.on('connect', () => {
      console.log('✅ Admin Dashboard connected to server');
      showNotificationMessage('Connected to real-time server', 'success');
    });

    // Listen for participant events (always refresh, let the function handle filtering)
    newSocket.on('participantJoined', (data) => {
      console.log('👤 Participant joined:', data);
      updateParticipantsList();
      showNotificationMessage(`${data.participant?.name || data.participant?.participantName || 'Anonymous'} joined the meeting`, 'info');
    });

    newSocket.on('participantLeft', (data) => {
      console.log('👋 Participant left:', data);
      updateParticipantsList();
      showNotificationMessage(
        `${data.participant?.name || data.participant?.participantName || 'Anonymous'} left after ${data.participant?.duration || 0} minutes`, 
        'warning'
      );
    });

    // Listen for authenticated user events (critical for real-time updates!)
    newSocket.on('userJoinedMeeting', (data) => {
      console.log('🔐 Authenticated user joined meeting:', data);
      updateParticipantsList();
      showNotificationMessage(`${data.user?.username || data.user?.name || 'User'} joined the meeting (authenticated)`, 'success');
    });

    newSocket.on('userLeftMeeting', (data) => {
      console.log('🔐 Authenticated user left meeting:', data);
      updateParticipantsList();
      showNotificationMessage(
        `${data.user?.username || data.user?.name || 'User'} left after ${data.duration || 0} minutes`, 
        'info'
      );
    });

    // Listen for general participant updates
    newSocket.on('participantUpdate', (data) => {
      console.log('📊 Participant update:', data);
      // Always refresh - let the API handle filtering by active meeting
      updateParticipantsList();
    });

    // Listen for immediate participant join events (from dashboard tracking)
    newSocket.on('participantJoinedImmediate', (data) => {
      console.log('🚀 Immediate participant joined:', data);
      // Always refresh - let the API handle filtering by active meeting
      updateParticipantsList();
      showNotificationMessage(`${data.participant?.name || data.participant?.participantName || 'User'} joined immediately`, 'success');
    });

    newSocket.on('meetingStarted', (data) => {
      console.log('🎬 Meeting started:', data);
      loadMeetings();
      showNotificationMessage(`Meeting "${data.meeting?.topic || 'Unknown'}" has started`, 'success');
    });

    newSocket.on('meetingEnded', (data) => {
      console.log('🏁 Meeting ended:', data);
      loadMeetings();
      setActiveMeeting(null);
      setParticipants([]);
      showNotificationMessage(`Meeting "${data.meeting?.topic || 'Unknown'}" has ended`, 'info');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Admin Dashboard disconnected from server');
      showNotificationMessage('Disconnected from real-time server', 'error');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [backendUrl, updateParticipantsList, loadMeetings, showNotificationMessage]);

  // Load meetings on component mount
  useEffect(() => {
    loadMeetings();
    const interval = setInterval(loadMeetings, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [loadMeetings]);

  // Auto-refresh participants when active meeting changes
  useEffect(() => {
    if (activeMeeting) {
      updateParticipantsList();
      const interval = setInterval(updateParticipantsList, 15000); // Refresh every 15 seconds
      return () => clearInterval(interval);
    }
  }, [activeMeeting, updateParticipantsList]);

  const createMeeting = async () => {
    if (!meetingForm.topic.trim()) {
      showNotificationMessage('Please enter a meeting topic', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/zoom/enhanced/create-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: meetingForm.topic,
          agenda: meetingForm.agenda,
          duration: meetingForm.duration,
          password: meetingForm.password || null,
          type: 1, // Instant meeting
          settings: {
            host_video: meetingForm.hostVideo,
            participant_video: meetingForm.participantVideo,
            mute_upon_entry: meetingForm.muteOnEntry,
            waiting_room: meetingForm.waitingRoom,
            auto_recording: meetingForm.recording
          }
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        showNotificationMessage(`Meeting "${meetingForm.topic}" created successfully!`, 'success');
        setCreateMeetingDialog(false);
        resetMeetingForm();
        await loadMeetings();
        
        // Auto-select the newly created meeting
        if (data.id) {
          const newMeeting = { 
            ...data, 
            status: 'waiting',
            created_at: new Date().toISOString()
          };
          setActiveMeeting(newMeeting);
        }
      } else {
        throw new Error(data.error || 'Failed to create meeting');
      }
    } catch (error) {
      console.error('Failed to create meeting:', error);
      showNotificationMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const endMeeting = async (meetingId) => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/zoom/meeting/${meetingId}/end`, {
        method: 'PATCH',
      });

      if (response.ok) {
        showNotificationMessage('Meeting ended successfully', 'success');
        if (activeMeeting && activeMeeting.id == meetingId) {
          setActiveMeeting(null);
          setParticipants([]);
        }
        await loadMeetings();
      } else {
        throw new Error('Failed to end meeting');
      }
    } catch (error) {
      console.error('Failed to end meeting:', error);
      showNotificationMessage('Failed to end meeting', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotificationMessage(`${label} copied to clipboard`, 'success');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      showNotificationMessage('Failed to copy to clipboard', 'error');
    }
  };

  const resetMeetingForm = () => {
    setMeetingForm({
      topic: '',
      agenda: '',
      duration: 5,
      password: '',
      hostVideo: true,
      participantVideo: true,
      muteOnEntry: true,
      waitingRoom: false,
      recording: 'none'
    });
  };

  const getMeetingStatusColor = (meeting) => {
    switch (meeting.status) {
      case 'started': return 'success';
      case 'waiting': return 'warning';
      case 'ended': return 'default';
      default: return 'info';
    }
  };

  const getMeetingStatusText = (meeting) => {
    switch (meeting.status) {
      case 'started': return 'Live';
      case 'waiting': return 'Waiting';
      case 'ended': return 'Ended';
      default: return 'Scheduled';
    }
  };

  // Helper function to safely format dates
  const formatSafeDate = (dateValue, formatString, fallback = 'Unknown') => {
    if (!dateValue) return fallback;
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return fallback;
      return format(date, formatString);
    } catch (error) {
      console.warn('Date formatting error:', error, 'for value:', dateValue);
      return fallback;
    }
  };

  const formatJoinTime = (joinTime) => {
    return formatSafeDate(joinTime, 'HH:mm:ss', 'Unknown');
  };

  const formatCreatedAt = (createdAt) => {
    return formatSafeDate(createdAt, 'MMM dd, HH:mm', 'Unknown');
  };

  const getParticipantStatusIcon = (participant) => {
    if (participant.status === 'in_meeting') {
      return <Circle sx={{ color: 'success.main', fontSize: 12 }} />;
    }
    return <Circle sx={{ color: 'grey.400', fontSize: 12 }} />;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartDisplay color="primary" />
          Admin Zoom Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            color="success"
            startIcon={<Assessment />}
            onClick={() => setFredAttendanceTrackerOpen(true)}
            size="small"
          >
            🎉 Fred's 85% Demo
          </Button>
          <Badge badgeContent={meetings.length} color="primary">
            <Groups />
          </Badge>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Panel - Meeting Management */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Meeting Control</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Assessment />}
                    onClick={() => setAttendanceTracker85Open(true)}
                    size="small"
                    disabled={!activeMeeting}
                  >
                    85% Tracker
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setCreateMeetingDialog(true)}
                    size="small"
                  >
                    Create Meeting
                  </Button>
                </Box>
              </Box>

              {/* Active Meetings List */}
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {meetings.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Groups sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography color="text.secondary">No meetings found</Typography>
                    <Button
                      variant="text"
                      startIcon={<Add />}
                      onClick={() => setCreateMeetingDialog(true)}
                      sx={{ mt: 1 }}
                    >
                      Create First Meeting
                    </Button>
                  </Box>
                ) : (
                  meetings.map((meeting) => (
                    <ListItem
                      key={meeting.id}
                      sx={{
                        border: '1px solid',
                        borderColor: activeMeeting?.id === meeting.id ? 'primary.main' : 'divider',
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: activeMeeting?.id === meeting.id ? 'primary.50' : 'background.paper'
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getMeetingStatusColor(meeting) + '.main' }}>
                          <Videocam />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" noWrap>
                              {meeting.topic}
                            </Typography>
                            <Chip
                              size="small"
                              label={getMeetingStatusText(meeting)}
                              color={getMeetingStatusColor(meeting)}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              ID: {meeting.id}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Created: {formatCreatedAt(meeting.created_at)}
                            </Typography>
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <ButtonGroup size="small" orientation="vertical">
                          <Tooltip title="Select Meeting">
                            <IconButton
                              size="small"
                              onClick={() => setActiveMeeting(meeting)}
                              color={activeMeeting?.id === meeting.id ? 'primary' : 'default'}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Copy Join URL">
                            <IconButton
                              size="small"
                              onClick={() => copyToClipboard(meeting.join_url, 'Join URL')}
                            >
                              <ContentCopy />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Open Meeting">
                            <IconButton
                              size="small"
                              onClick={() => window.open(meeting.join_url, '_blank')}
                            >
                              <Launch />
                            </IconButton>
                          </Tooltip>
                          {(meeting.status === 'started' || meeting.status === 'waiting') && (
                            <Tooltip title="End Meeting">
                              <IconButton
                                size="small"
                                onClick={() => endMeeting(meeting.id)}
                                color="error"
                              >
                                <Stop />
                              </IconButton>
                            </Tooltip>
                          )}
                        </ButtonGroup>
                      </Box>
                    </ListItem>
                  ))
                )}
              </List>

              {/* Refresh Button */}
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={loadMeetings}
                  disabled={loading}
                  size="small"
                >
                  {loading ? 'Loading...' : 'Refresh Meetings'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - Live Participant Tracking */}
        <Grid item xs={12} md={8}>
          {activeMeeting ? (
            <Card>
              <CardContent>
                {/* Meeting Info Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RadioButtonChecked color="success" />
                      {activeMeeting.topic}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Meeting ID: {activeMeeting.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Join URL: 
                      <Button
                        size="small"
                        startIcon={<ContentCopy />}
                        onClick={() => copyToClipboard(activeMeeting.join_url, 'Join URL')}
                        sx={{ ml: 1 }}
                      >
                        Copy Link
                      </Button>
                    </Typography>
                  </Box>
                  <Chip
                    label={getMeetingStatusText(activeMeeting)}
                    color={getMeetingStatusColor(activeMeeting)}
                    icon={<RadioButtonChecked />}
                  />
                </Box>

                {/* Live Stats */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {liveStats.totalParticipants}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Participants
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {liveStats.activeNow}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Currently Active
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="info.main">
                        {liveStats.studentsIdentified}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Students Identified
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {liveStats.averageDuration}m
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Avg. Duration
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Participants Table */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Live Participants ({participants.length})
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Refresh />}
                    onClick={updateParticipantsList}
                  >
                    Refresh
                  </Button>
                </Box>

                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Status</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Join Time</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Student Info</TableCell>
                        <TableCell>Attendance %</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {participants.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                            <People sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                            <Typography color="text.secondary">
                              No participants yet. Share the join URL with users.
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              Participants will appear here automatically when they join.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        participants.map((participant, index) => (
                          <TableRow key={participant.id || index} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getParticipantStatusIcon(participant)}
                                <Typography variant="caption">
                                  {participant.status === 'in_meeting' ? 'Active' : 'Left'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                  {participant.name?.charAt(0) || 'U'}
                                </Avatar>
                                <Typography variant="body2">
                                  {participant.name || 'Anonymous'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {participant.email || 'Not provided'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatJoinTime(participant.join_time)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={`${participant.duration || 0} min`}
                                color={participant.duration >= 30 ? 'success' : 
                                       participant.duration >= 15 ? 'warning' : 'default'}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              {participant.student_info ? (
                                <Box>
                                  <Typography variant="caption" color="success.main">
                                    <CheckCircle sx={{ fontSize: 16, mr: 0.5 }} />
                                    {participant.student_info.studentId}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    {participant.student_info.department}
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography variant="caption" color="text.secondary">
                                  <Warning sx={{ fontSize: 16, mr: 0.5 }} />
                                  Not identified
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(participant.attendance_percentage || 0, 100)}
                                  sx={{ width: 60, height: 6 }}
                                />
                                <Typography variant="caption">
                                  {participant.attendance_percentage || 0}%
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <SmartDisplay sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Meeting Selected
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create a new meeting or select an existing one to start monitoring participants in real-time.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setCreateMeetingDialog(true)}
                >
                  Create Your First Meeting
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Create Meeting Dialog */}
      <Dialog 
        open={createMeetingDialog} 
        onClose={() => setCreateMeetingDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Zoom Meeting</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Meeting Topic"
                fullWidth
                required
                value={meetingForm.topic}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="Enter meeting topic"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Agenda"
                fullWidth
                multiline
                rows={2}
                value={meetingForm.agenda}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, agenda: e.target.value }))}
                placeholder="Enter meeting agenda (optional)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Duration (minutes)"
                type="number"
                fullWidth
                value={meetingForm.duration}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                inputProps={{ min: 15, max: 480 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Password (optional)"
                fullWidth
                value={meetingForm.password}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Leave empty for no password"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Meeting Settings</Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={meetingForm.hostVideo}
                        onChange={(e) => setMeetingForm(prev => ({ ...prev, hostVideo: e.target.checked }))}
                      />
                    }
                    label="Host Video On"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={meetingForm.participantVideo}
                        onChange={(e) => setMeetingForm(prev => ({ ...prev, participantVideo: e.target.checked }))}
                      />
                    }
                    label="Participant Video On"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={meetingForm.muteOnEntry}
                        onChange={(e) => setMeetingForm(prev => ({ ...prev, muteOnEntry: e.target.checked }))}
                      />
                    }
                    label="Mute on Entry"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={meetingForm.waitingRoom}
                        onChange={(e) => setMeetingForm(prev => ({ ...prev, waitingRoom: e.target.checked }))}
                      />
                    }
                    label="Waiting Room"
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateMeetingDialog(false)}>Cancel</Button>
          <Button 
            onClick={createMeeting} 
            variant="contained"
            disabled={loading || !meetingForm.topic.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <Add />}
          >
            {loading ? 'Creating...' : 'Create Meeting'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={showNotification}
        autoHideDuration={4000}
        onClose={() => setShowNotification(false)}
      >
        <Alert
          onClose={() => setShowNotification(false)}
          severity={notificationSeverity}
          variant="filled"
        >
          {notificationMessage}
        </Alert>
      </Snackbar>

      {/* 85% Attendance Tracker Dialog */}
      {activeMeeting && (
        <AttendanceTracker85
          open={attendanceTracker85Open}
          onClose={() => setAttendanceTracker85Open(false)}
          meetingId={activeMeeting.id}
          meetingTitle={activeMeeting.topic}
          isActive={activeMeeting.status === 'started' || activeMeeting.status === 'waiting'}
        />
      )}

      {/* Fred's 85% Demo Attendance Tracker Dialog */}
      <Dialog
        open={fredAttendanceTrackerOpen}
        onClose={() => setFredAttendanceTrackerOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogContent sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
          <FredAttendanceTracker />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFredAttendanceTrackerOpen(false)} color="primary">
            Close Demo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminZoomDashboard;
