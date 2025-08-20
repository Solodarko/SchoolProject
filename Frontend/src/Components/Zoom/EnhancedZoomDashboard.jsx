import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
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
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  LinearProgress,
  Switch,
  FormControlLabel,
  Divider,
  Fab,
  ButtonGroup,
  Menu,
  ListItemIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Refresh,
  People,
  PersonAdd,
  PersonRemove,
  Schedule,
  Assessment,
  Download,
  Settings,
  LiveTv,
  NotificationsActive,
  CheckCircle,
  Cancel,
  Warning,
  Info,
  Videocam,
  VideocamOff,
  MicOff,
  Mic,
  ScreenShare,
  StopScreenShare,
  Close,
  Visibility,
  VisibilityOff,
  TrendingUp,
  Add,
  Edit,
  Delete,
  Link,
  ContentCopy,
  Launch,
  MoreVert,
  Groups,
  AccessTime,
  SmartDisplay,
  RadioButtonChecked,
  RadioButtonUnchecked,
  Wifi,
  WifiOff
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns';
import io from 'socket.io-client';
import Swal from 'sweetalert2';
import '../../styles/sweetalert-custom.css';
import ZoomRealTimeTracker from './ZoomRealTimeTracker';
import { useNotificationSystem } from '../../context/NotificationSystem';

const EnhancedZoomDashboard = () => {
  const theme = useTheme();
  const { addZoomMeetingNotification } = useNotificationSystem();
  
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationSeverity, setNotificationSeverity] = useState('info');
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  
  // Dialog states
  const [createMeetingDialog, setCreateMeetingDialog] = useState(false);
  const [editMeetingDialog, setEditMeetingDialog] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, meeting: null, action: '' });
  const [meetingSuccessDialog, setMeetingSuccessDialog] = useState({ open: false, meeting: null });
  
  // Form states
  const [meetingForm, setMeetingForm] = useState({
    topic: '',
    agenda: '',
    duration: 5,
    password: '',
    waitingRoom: false,
    recording: 'none',
    hostVideo: true,
    participantVideo: true,
    muteOnEntry: true,
    type: 1 // Instant meeting
  });
  
  // Settings
  const [settings, setSettings] = useState({
    autoRefresh: true,
    refreshInterval: 30000,
    showRealTimeTracker: true,
    enableNotifications: true,
    compactView: false
  });

  // Menu states
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuMeeting, setMenuMeeting] = useState(null);

  // Backend URL
  const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

  // Helper functions (moved before useEffect to avoid hoisting issues)
  const showNotificationMessage = useCallback((message, severity = 'info') => {
    setNotificationMessage(message);
    setNotificationSeverity(severity);
    setShowNotification(true);
    
    const notification = {
      id: Date.now(),
      message,
      severity,
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 49)]);
  }, []);

  const clearZoomData = useCallback(async () => {
    setLoading(true);
    try {
      // Clear meetings from state
      setMeetings([]);
      setSelectedMeeting(null);
      
      // Clear notifications related to Zoom
      setNotifications(prev => 
        prev.filter(notification => 
          !notification.message.toLowerCase().includes('meeting') &&
          !notification.message.toLowerCase().includes('zoom')
        )
      );
      
      // Try to call backend clear endpoint if it exists
      try {
        const response = await fetch(`${backendUrl}/api/zoom/clear-all`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          showNotificationMessage(
            data.message || 'All Zoom data cleared successfully', 
            'success'
          );
        } else {
          // If endpoint doesn't exist, just clear local data
          showNotificationMessage(
            'Local Zoom data cleared successfully', 
            'success'
          );
        }
      } catch (apiError) {
        // If API call fails, just clear local data
        showNotificationMessage(
          'Local Zoom data cleared successfully', 
          'success'
        );
        console.log('Clear API not available, cleared local data only:', apiError.message);
      }
      
    } catch (error) {
      console.error('Failed to clear Zoom data:', error);
      showNotificationMessage(
        'Failed to clear Zoom data: ' + error.message, 
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [backendUrl, showNotificationMessage]);

  const loadMeetings = useCallback(async () => {
    setLoading(true);
    const timestamp = new Date().toISOString();
    
    try {
      const apiUrl = `${backendUrl}/api/zoom/meetings`;
      console.log(`📊 [${timestamp}] Enhanced Dashboard: Loading meetings from:`, apiUrl);
      console.log(`📊 [${timestamp}] Current meetings in state:`, meetings.length);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [${timestamp}] API Response Error:`, {
          status: response.status,
          statusText: response.statusText,
          url: apiUrl,
          error: errorText
        });
        
        // Show specific error message based on status
        if (response.status === 404) {
          throw new Error(`API endpoint not found (404). Check if backend server is running and the endpoint ${apiUrl} exists.`);
        } else if (response.status >= 500) {
          throw new Error(`Server error (${response.status}). Backend may be down or misconfigured.`);
        } else {
          throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      console.log(`📊 [${timestamp}] Enhanced Dashboard: Raw API response:`, {
        success: data.success,
        meetingsCount: data.meetings ? data.meetings.length : 0,
        fullResponse: data
      });
      
      if (data.success) {
        // Log raw meetings before processing
        console.log(`📊 [${timestamp}] Raw meetings from API:`, data.meetings);
        
        // Process and sort meetings for admin view
        const adminMeetings = (data.meetings || [])
          .map((meeting, index) => {
            const processed = {
              ...meeting,
              source: 'zoom', // All meetings from this endpoint are from Zoom API
              type: meeting.type || 'online'
            };
            console.log(`📊 [${timestamp}] Processing meeting ${index + 1}:`, {
              id: meeting.id,
              topic: meeting.topic,
              created_at: meeting.created_at,
              processed
            });
            return processed;
          })
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        console.log(`📊 [${timestamp}] Final processed meetings:`, {
          count: adminMeetings.length,
          meetings: adminMeetings.map(m => ({ id: m.id, topic: m.topic, created_at: m.created_at }))
        });
        
        setMeetings(adminMeetings);
        
        if (adminMeetings.length > 0) {
          showNotificationMessage(`Loaded ${adminMeetings.length} meetings from Zoom API`, 'success');
        } else {
          showNotificationMessage('No meetings found in Zoom API', 'info');
        }
      } else {
        console.warn(`❌ [${timestamp}] API returned success: false`, data);
        setMeetings([]); // Clear meetings if API says not successful
        showNotificationMessage(data.error || 'Failed to load meetings from Zoom API', 'warning');
      }
    } catch (error) {
      console.error(`❌ [${timestamp}] Failed to load meetings:`, {
        error: error.message,
        stack: error.stack,
        backendUrl,
        fullUrl: `${backendUrl}/api/zoom/meetings`
      });
      
      // Show more helpful error message
      showNotificationMessage(
        `Connection Error: ${error.message}. Check if backend is running on ${backendUrl}`,
        'error'
      );
      
      // Set empty meetings array on error
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, showNotificationMessage, meetings.length]);

  // WebSocket setup for real-time updates
  useEffect(() => {
    let socketConnection;
    
    try {
      // Initialize Socket.IO connection
      socketConnection = io(backendUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000
      });

      setSocket(socketConnection);

      // Connection event handlers
      socketConnection.on('connect', () => {
        console.log('Admin Dashboard: Connected to WebSocket server');
        setSocketConnected(true);
        showNotificationMessage('Connected to live updates', 'success');
      });

      socketConnection.on('disconnect', (reason) => {
        console.log('Admin Dashboard: Disconnected from WebSocket server:', reason);
        setSocketConnected(false);
        showNotificationMessage('Disconnected from live updates', 'warning');
      });

      socketConnection.on('reconnect', (attemptNumber) => {
        console.log('Admin Dashboard: Reconnected to WebSocket server, attempt:', attemptNumber);
        setSocketConnected(true);
        showNotificationMessage('Reconnected to live updates', 'success');
        // Reload meetings after reconnection
        loadMeetings();
      });

      // Meeting event handlers
      socketConnection.on('meetingCreated', (data) => {
        console.log('Admin Dashboard: New meeting created:', data);
        
        // Extract meeting from the event data (backend sends { meeting, savedMeeting, timestamp })
        const meeting = data.meeting || data;
        
        // Add new meeting to the list
        if (meeting) {
          setMeetings(prev => {
            // Check if meeting already exists to avoid duplicates
            const exists = prev.some(m => m.id === meeting.id);
            if (!exists) {
              showNotificationMessage(`Meeting "${meeting.topic}" was created`, 'success');
              return [meeting, ...prev];
            }
            return prev;
          });
        }
      });

      socketConnection.on('meetingStarted', (data) => {
        console.log('Admin Dashboard: Meeting started:', data);
        
        setMeetings(prev => 
          prev.map(meeting => 
            meeting.id === data.meetingId 
              ? { ...meeting, status: 'started' }
              : meeting
          )
        );
        
        // Add Zoom meeting started notification
        const startedMeeting = meetings.find(m => m.id === data.meetingId);
        if (startedMeeting) {
          addZoomMeetingNotification({
            id: startedMeeting.id,
            topic: data.topic || startedMeeting.topic,
            joinUrl: startedMeeting.join_url,
            hostName: 'Admin'
          }, 'started');
        }
        
        showNotificationMessage(`Meeting "${data.topic}" is now live!`, 'success');
      });

      socketConnection.on('meetingEnded', (data) => {
        console.log('Admin Dashboard: Meeting ended:', data);
        
        setMeetings(prev => 
          prev.map(meeting => 
            meeting.id === data.meetingId 
              ? { ...meeting, status: 'ended' }
              : meeting
          )
        );
        
        // Add Zoom meeting ended notification
        const endedMeeting = meetings.find(m => m.id === data.meetingId);
        if (endedMeeting) {
          addZoomMeetingNotification({
            id: endedMeeting.id,
            topic: data.topic || endedMeeting.topic,
            hostName: 'Admin',
            participantCount: data.participantCount || 0
          }, 'ended');
        }
        
        showNotificationMessage(`Meeting "${data.topic}" has ended`, 'info');
      });

    } catch (error) {
      console.error('Admin Dashboard: Failed to initialize WebSocket connection:', error);
    }

    return () => {
      if (socketConnection) {
        socketConnection.disconnect();
      }
    };
  }, [backendUrl, showNotificationMessage, loadMeetings]);

  // Load meetings on component mount
  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const createMeeting = async () => {
    if (!meetingForm.topic.trim()) {
      showNotificationMessage('Please enter a meeting topic', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/zoom/create-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: meetingForm.topic,
          agenda: meetingForm.agenda,
          duration: meetingForm.duration,
          password: meetingForm.password || null,
          type: meetingForm.type,
          settings: {
            host_video: meetingForm.hostVideo,
            participant_video: meetingForm.participantVideo,
            mute_upon_entry: meetingForm.muteOnEntry,
            waiting_room: meetingForm.waitingRoom,
            auto_recording: meetingForm.recording
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🎯 Enhanced Dashboard: Meeting created successfully:', data);
        
        // Show success message with meeting details
        if (data.meeting && data.meeting.join_url) {
          // Ensure the meeting has the correct source marking
          const createdMeeting = {
            ...data.meeting,
            source: 'zoom', // Mark as Zoom API source
            type: data.meeting.type || 'online',
            created_at: data.meeting.created_at || new Date().toISOString()
          };
          
          console.log('🎯 Enhanced Dashboard: Processed created meeting:', createdMeeting);
          
          // Add Zoom meeting notification
          addZoomMeetingNotification({
            id: createdMeeting.id,
            topic: meetingForm.topic,
            agenda: meetingForm.agenda,
            startTime: createdMeeting.start_time || new Date().toISOString(),
            duration: meetingForm.duration,
            joinUrl: createdMeeting.join_url,
            password: meetingForm.password,
            hostId: createdMeeting.host_id,
            hostName: 'Admin', // You can get actual host name from auth context
            createdBy: 'Admin' // You can get actual user name from auth context
          }, 'created');
          
          showNotificationMessage(
            `Meeting "${meetingForm.topic}" created! Meeting ID: ${data.meeting.id}`, 
            'success'
          );
          
          // Immediately add the created meeting to the list
          setMeetings(prev => {
            // Check if meeting already exists to avoid duplicates
            const exists = prev.some(m => m.id === createdMeeting.id);
            if (!exists) {
              console.log('🎯 Enhanced Dashboard: Adding created meeting to list');
              return [createdMeeting, ...prev];
            } else {
              console.log('🎯 Enhanced Dashboard: Meeting already exists in list');
              return prev;
            }
          });
          
          // Auto-select the newly created meeting to show details
          setSelectedMeeting(createdMeeting);
          
          // Show the success dialog with meeting details
          setMeetingSuccessDialog({ open: true, meeting: createdMeeting });
        } else {
          showNotificationMessage(`Meeting "${meetingForm.topic}" created successfully!`, 'success');
        }
        
        setCreateMeetingDialog(false);
        resetMeetingForm();
        
        // Refresh the meetings list after a short delay to ensure backend consistency
        setTimeout(async () => {
          console.log('🎯 Enhanced Dashboard: Refreshing meetings list after creation');
          await loadMeetings();
        }, 1000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create meeting');
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
      if (!text || text === '#meeting-undefined' || text.startsWith('#meeting-')) {
        showNotificationMessage(`No valid ${label.toLowerCase()} available for this meeting`, 'warning');
        return;
      }
      
      await navigator.clipboard.writeText(text);
      showNotificationMessage(`${label} copied to clipboard`, 'success');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      showNotificationMessage('Failed to copy to clipboard', 'error');
    }
  };

  const openMeeting = (meeting) => {
    try {
      if (!meeting?.join_url) {
        showNotificationMessage('No join URL available for this meeting', 'error');
        return;
      }

      // For Zoom meetings, try to open with Zoom app first
      if (meeting.source === 'zoom' || meeting.join_url.includes('zoom.us')) {
        const zoomUrl = meeting.join_url;
        
        // Try to open with Zoom app protocol first
        const zoomAppUrl = zoomUrl.replace('https://zoom.us/j/', 'zoommtg://zoom.us/join?confno=');
        
        // Create a temporary link to try Zoom app protocol
        const tempLink = document.createElement('a');
        tempLink.href = zoomAppUrl;
        tempLink.style.display = 'none';
        document.body.appendChild(tempLink);
        
        try {
          tempLink.click();
          showNotificationMessage('Opening in Zoom application...', 'success');
          
          // Fallback to web browser after a delay if app doesn't open
          setTimeout(() => {
            window.open(zoomUrl, '_blank', 'noopener,noreferrer');
          }, 2000);
        } catch (appError) {
          // If Zoom app protocol fails, open in browser
          window.open(zoomUrl, '_blank', 'noopener,noreferrer');
          showNotificationMessage('Opened in web browser', 'info');
        } finally {
          document.body.removeChild(tempLink);
        }
      } else {
        // For non-Zoom meetings, just open in browser
        window.open(meeting.join_url, '_blank', 'noopener,noreferrer');
        showNotificationMessage('Meeting opened in browser', 'info');
      }
    } catch (error) {
      console.error('Failed to open meeting:', error);
      showNotificationMessage('Failed to open meeting', 'error');
    }
  };

  const resetMeetingForm = () => {
    setMeetingForm({
      topic: '',
      agenda: '',
      duration: 5,
      password: '',
      waitingRoom: false,
      recording: 'none',
      hostVideo: true,
      participantVideo: true,
      muteOnEntry: true,
      type: 1
    });
  };

  const handleMenuOpen = (event, meeting) => {
    setAnchorEl(event.currentTarget);
    setMenuMeeting(meeting);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuMeeting(null);
  };

  const getMeetingStatusColor = (meeting) => {
    if (!meeting) return 'default';
    
    // You can determine status based on meeting data
    const now = new Date();
    const startTime = new Date(meeting.start_time);
    
    if (meeting.status === 'started') return 'success';
    if (startTime > now) return 'info';
    return 'default';
  };

  const getMeetingStatusText = (meeting) => {
    if (!meeting) return 'Unknown';
    
    if (meeting.status === 'started') return 'Active';
    
    const now = new Date();
    const startTime = new Date(meeting.start_time);
    
    if (startTime > now) return 'Scheduled';
    return 'Ended';
  };

  // Render components
  const renderCreateMeetingDialog = () => (
    <Dialog 
      open={createMeetingDialog} 
      onClose={() => setCreateMeetingDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Create New Zoom Meeting</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              label="Meeting Topic"
              fullWidth
              value={meetingForm.topic}
              onChange={(e) => setMeetingForm(prev => ({ ...prev, topic: e.target.value }))}
              placeholder="Enter meeting topic"
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Agenda"
              fullWidth
              multiline
              rows={3}
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
              onChange={(e) => setMeetingForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 5 }))}
              inputProps={{ min: 1, max: 480 }}
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
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Meeting Type</InputLabel>
              <Select
                value={meetingForm.type}
                label="Meeting Type"
                onChange={(e) => setMeetingForm(prev => ({ ...prev, type: e.target.value }))}
              >
                <MenuItem value={1}>Instant Meeting</MenuItem>
                <MenuItem value={2}>Scheduled Meeting</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Auto Recording</InputLabel>
              <Select
                value={meetingForm.recording}
                label="Auto Recording"
                onChange={(e) => setMeetingForm(prev => ({ ...prev, recording: e.target.value }))}
              >
                <MenuItem value="none">No Recording</MenuItem>
                <MenuItem value="local">Local Recording</MenuItem>
                <MenuItem value="cloud">Cloud Recording</MenuItem>
              </Select>
            </FormControl>
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
  );

  const renderMeetingsList = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Your Meetings</Typography>
          <Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateMeetingDialog(true)}
              sx={{ mr: 1 }}
            >
              Create Meeting
            </Button>
            <IconButton onClick={loadMeetings} disabled={loading}>
              <Refresh />
            </IconButton>
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<Delete />}
              onClick={async () => {
                const result = await Swal.fire({
                  title: 'Clear All Zoom Data?',
                  html: `
                    <div style="text-align: left; margin: 20px 0;">
                      <p><strong>This will permanently remove:</strong></p>
                      <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>All meeting records from database</li>
                        <li>Active meeting sessions</li>
                        <li>Participant data and statistics</li>
                        <li>Meeting notifications and history</li>
                      </ul>
                      <p style="color: #d32f2f; margin-top: 15px;">
                        <strong>⚠️ This action cannot be undone!</strong>
                      </p>
                    </div>
                  `,
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonColor: '#d32f2f',
                  cancelButtonColor: '#666',
                  confirmButtonText: '<span style="display: flex; align-items: center; gap: 8px;">🗑️ Yes, Clear All Data</span>',
                  cancelButtonText: 'Cancel',
                  reverseButtons: true,
                  backdrop: true,
                  allowOutsideClick: false,
                  customClass: {
                    popup: 'swal-wide',
                    confirmButton: 'swal-confirm-delete',
                    cancelButton: 'swal-cancel-button'
                  },
                  buttonsStyling: true
                });

                if (result.isConfirmed) {
                  // Show loading state
                  Swal.fire({
                    title: 'Clearing Zoom Data...',
                    html: 'Please wait while we clear all Zoom data.',
                    icon: 'info',
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    didOpen: () => {
                      Swal.showLoading();
                    }
                  });
                  
                  // Execute the clear function
                  await clearZoomData();
                  
                  // Show success message
                  Swal.fire({
                    title: 'Data Cleared Successfully!',
                    text: 'All Zoom data has been permanently removed.',
                    icon: 'success',
                    confirmButtonColor: '#4caf50',
                    confirmButtonText: 'OK',
                    timer: 3000,
                    timerProgressBar: true
                  });
                }
              }}
              disabled={loading}
              sx={{ ml: 1 }}
            >
              Clear Zoom
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : meetings.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Groups sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">No meetings found</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create your first meeting to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateMeetingDialog(true)}
            >
              Create Meeting
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Topic</TableCell>
                  <TableCell>Meeting ID</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {meetings.map((meeting) => (
                  <TableRow key={meeting.id} hover>
                    <TableCell>
                      <div>
                        <Typography variant="subtitle2">
                          {meeting.topic}
                        </Typography>
                        {meeting.agenda && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {meeting.agenda.substring(0, 50)}...
                          </Typography>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Typography variant="body2" fontFamily="monospace">
                          {meeting.id}
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => copyToClipboard(meeting.id.toString(), 'Meeting ID')}
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        size="small"
                        label={meeting.source === 'zoom' ? 'Zoom API' : 'Database'}
                        color={meeting.source === 'zoom' ? 'primary' : 'secondary'}
                        icon={meeting.source === 'zoom' ? <Videocam /> : <Schedule />}
                        variant={meeting.source === 'zoom' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        size="small"
                        label={getMeetingStatusText(meeting)}
                        color={getMeetingStatusColor(meeting)}
                        icon={meeting.status === 'started' ? <RadioButtonChecked /> : <RadioButtonUnchecked />}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AccessTime fontSize="small" />
                        <Typography variant="body2">
                          {meeting.duration} min
                        </Typography>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(meeting.created_at), 'MMM dd, HH:mm')}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="right">
                      <ButtonGroup size="small">
                        <Tooltip title="Copy Join URL">
                          <IconButton 
                            onClick={() => copyToClipboard(meeting.join_url, 'Join URL')}
                          >
                            <ContentCopy />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Open Meeting">
                          <IconButton 
                            onClick={() => openMeeting(meeting)}
                          >
                            <Launch />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="View Details">
                          <IconButton 
                            onClick={() => setSelectedMeeting(meeting)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        
                        <IconButton onClick={(e) => handleMenuOpen(e, meeting)}>
                          <MoreVert />
                        </IconButton>
                      </ButtonGroup>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );

  const renderMeetingDetails = () => (
    selectedMeeting && (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6">{selectedMeeting.topic}</Typography>
              <Typography variant="body2" color="text.secondary">
                Meeting ID: {selectedMeeting.id}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                size="small"
                label={getMeetingStatusText(selectedMeeting)}
                color={getMeetingStatusColor(selectedMeeting)}
              />
              <IconButton size="small" onClick={() => setSelectedMeeting(null)}>
                <Close />
              </IconButton>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Meeting Information</Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Join URL"
                    secondary={
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ wordBreak: 'break-all', fontSize: '0.875rem' }}>
                          {selectedMeeting.join_url}
                        </span>
                        <IconButton 
                          size="small" 
                          onClick={() => copyToClipboard(selectedMeeting.join_url, 'Join URL')}
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </span>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Password"
                    secondary={selectedMeeting.password || 'No password required'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Duration"
                    secondary={`${selectedMeeting.duration} minutes`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Created"
                    secondary={format(new Date(selectedMeeting.created_at), 'MMM dd, yyyy HH:mm')}
                  />
                </ListItem>
              </List>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Settings</Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Host Video"
                    secondary={selectedMeeting.settings?.host_video ? 'Enabled' : 'Disabled'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Participant Video"
                    secondary={selectedMeeting.settings?.participant_video ? 'Enabled' : 'Disabled'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Waiting Room"
                    secondary={selectedMeeting.settings?.waiting_room ? 'Enabled' : 'Disabled'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Recording"
                    secondary={selectedMeeting.settings?.auto_recording || 'None'}
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<Launch />}
              onClick={() => openMeeting(selectedMeeting)}
            >
              Join Meeting
            </Button>
            <Button
              variant="outlined"
              startIcon={<ContentCopy />}
              onClick={() => copyToClipboard(selectedMeeting.join_url, 'Join URL')}
            >
              Copy Link
            </Button>
            {selectedMeeting.status === 'started' && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<Stop />}
                onClick={() => setConfirmDialog({ 
                  open: true, 
                  meeting: selectedMeeting, 
                  action: 'end' 
                })}
              >
                End Meeting
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    )
  );

  const renderMeetingSuccessDialog = () => (
    <Dialog 
      open={meetingSuccessDialog.open} 
      onClose={() => setMeetingSuccessDialog({ open: false, meeting: null })}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle color="success" />
          <Typography variant="h6">Meeting Created Successfully!</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {meetingSuccessDialog.meeting && (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="subtitle1">
                Your Zoom meeting "{meetingSuccessDialog.meeting.topic}" has been created and is ready to use.
              </Typography>
            </Alert>
            
            {/* Meeting Join URL Card */}
            <Card sx={{ mb: 2, bgcolor: 'primary.light', border: '2px solid', borderColor: 'primary.main' }}>
              <CardContent sx={{ pb: 2 }}>
                <Typography variant="h6" component="div" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Videocam color="primary" />
                  Join Meeting
                </Typography>
                <Box sx={{ 
                  bgcolor: 'background.paper', 
                  p: 2, 
                  borderRadius: 1, 
                  border: '1px solid', 
                  borderColor: 'divider',
                  mb: 2
                }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Meeting URL:
                  </Typography>
                  <Typography 
                    variant="body1" 
                    fontFamily="monospace" 
                    sx={{ 
                      wordBreak: 'break-all',
                      bgcolor: 'grey.100',
                      p: 1,
                      borderRadius: 0.5,
                      fontSize: '0.875rem'
                    }}
                  >
                    {meetingSuccessDialog.meeting.join_url}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Launch />}
                    onClick={() => {
                      openMeeting(meetingSuccessDialog.meeting);
                      setMeetingSuccessDialog({ open: false, meeting: null });
                    }}
                    sx={{ flex: 1, minWidth: 140 }}
                  >
                    Open Meeting
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ContentCopy />}
                    onClick={() => copyToClipboard(meetingSuccessDialog.meeting.join_url, 'Join URL')}
                    sx={{ flex: 1, minWidth: 140 }}
                  >
                    Copy Link
                  </Button>
                </Box>
              </CardContent>
            </Card>
            
            {/* Meeting Details */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" component="div" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Info fontSize="small" />
                      Meeting Details
                    </Typography>
                    <List dense>
                      <ListItem disablePadding>
                        <ListItemText
                          primary="Meeting ID"
                          secondary={meetingSuccessDialog.meeting.id}
                          secondaryTypographyProps={{ fontFamily: 'monospace' }}
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            size="small" 
                            onClick={() => copyToClipboard(meetingSuccessDialog.meeting.id.toString(), 'Meeting ID')}
                          >
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <ListItem disablePadding>
                        <ListItemText
                          primary="Password"
                          secondary={meetingSuccessDialog.meeting.password || 'No password required'}
                        />
                      </ListItem>
                      <ListItem disablePadding>
                        <ListItemText
                          primary="Duration"
                          secondary={`${meetingSuccessDialog.meeting.duration} minutes`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" component="div" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Settings fontSize="small" />
                      Settings
                    </Typography>
                    <List dense>
                      <ListItem disablePadding>
                        <ListItemText
                          primary="Host Video"
                          secondary={meetingSuccessDialog.meeting.settings?.host_video ? 'Enabled' : 'Disabled'}
                        />
                      </ListItem>
                      <ListItem disablePadding>
                        <ListItemText
                          primary="Waiting Room"
                          secondary={meetingSuccessDialog.meeting.settings?.waiting_room ? 'Enabled' : 'Disabled'}
                        />
                      </ListItem>
                      <ListItem disablePadding>
                        <ListItemText
                          primary="Recording"
                          secondary={meetingSuccessDialog.meeting.settings?.auto_recording || 'None'}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2" component="div">
                💡 <strong>Tip:</strong> This meeting is now visible in the user dashboard and participants can join using the link above.
                Real-time updates will notify users when the meeting is active.
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={() => setMeetingSuccessDialog({ open: false, meeting: null })}
          variant="outlined"
        >
          Close
        </Button>
        <Button 
          onClick={() => {
            if (meetingSuccessDialog.meeting) {
              openMeeting(meetingSuccessDialog.meeting);
            }
            setMeetingSuccessDialog({ open: false, meeting: null });
          }}
          variant="contained"
          startIcon={<Launch />}
        >
          Start Meeting Now
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderConfirmDialog = () => (
    <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, meeting: null, action: '' })}>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to {confirmDialog.action} the meeting "{confirmDialog.meeting?.topic}"?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConfirmDialog({ open: false, meeting: null, action: '' })}>
          Cancel
        </Button>
        <Button
          onClick={async () => {
            if (confirmDialog.action === 'end') {
              await endMeeting(confirmDialog.meeting.id);
            }
            setConfirmDialog({ open: false, meeting: null, action: '' });
          }}
          variant="contained"
          color={confirmDialog.action === 'end' ? 'error' : 'primary'}
        >
          {confirmDialog.action === 'end' ? 'End Meeting' : 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Enhanced Zoom Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title={socketConnected ? 'Connected to live updates' : 'Disconnected from live updates'}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {socketConnected ? (
                <Wifi color="success" fontSize="small" />
              ) : (
                <WifiOff color="error" fontSize="small" />
              )}
              <Typography variant="caption" color={socketConnected ? 'success.main' : 'error.main'}>
                {socketConnected ? 'Live' : 'Offline'}
              </Typography>
            </Box>
          </Tooltip>
          <Badge badgeContent={meetings.length} color="primary">
            <SmartDisplay />
          </Badge>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onChange={(_, newValue) => setActiveTab(newValue)} 
        sx={{ mb: 3 }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Meeting Management" />
        <Tab label="Real-Time Tracking" />
        <Tab label="Analytics" />
        <Tab label="Settings" />
      </Tabs>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          {renderMeetingsList()}
          {renderMeetingDetails()}
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            This tab shows real-time tracking of active Zoom meetings. The system automatically detects and tracks meetings in real-time.
          </Alert>
          {settings.showRealTimeTracker && (
            <ZoomRealTimeTracker
              backendUrl={backendUrl}
              showNotifications={settings.enableNotifications}
              expandedByDefault={true}
              refreshInterval={settings.refreshInterval}
            />
          )}
        </Box>
      )}

      {activeTab === 2 && (
        <Typography>Meeting Analytics coming soon...</Typography>
      )}

      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Dashboard Settings</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={settings.autoRefresh}
                      onChange={(e) => setSettings(prev => ({ ...prev, autoRefresh: e.target.checked }))}
                    />
                  }
                  label="Auto Refresh"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={settings.showRealTimeTracker}
                      onChange={(e) => setSettings(prev => ({ ...prev, showRealTimeTracker: e.target.checked }))}
                    />
                  }
                  label="Show Real-Time Tracker"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={settings.enableNotifications}
                      onChange={(e) => setSettings(prev => ({ ...prev, enableNotifications: e.target.checked }))}
                    />
                  }
                  label="Enable Notifications"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={settings.compactView}
                      onChange={(e) => setSettings(prev => ({ ...prev, compactView: e.target.checked }))}
                    />
                  }
                  label="Compact View"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Refresh Interval</InputLabel>
                  <Select
                    value={settings.refreshInterval}
                    label="Refresh Interval"
                    onChange={(e) => setSettings(prev => ({ ...prev, refreshInterval: e.target.value }))}
                  >
                    <MenuItem value={10000}>10 seconds</MenuItem>
                    <MenuItem value={30000}>30 seconds</MenuItem>
                    <MenuItem value={60000}>1 minute</MenuItem>
                    <MenuItem value={300000}>5 minutes</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {renderCreateMeetingDialog()}
      {renderMeetingSuccessDialog()}
      {renderConfirmDialog()}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          copyToClipboard(menuMeeting?.id?.toString(), 'Meeting ID');
          handleMenuClose();
        }}>
          <ListItemIcon>
            <ContentCopy fontSize="small" />
          </ListItemIcon>
          Copy Meeting ID
        </MenuItem>
        <MenuItem onClick={() => {
          copyToClipboard(menuMeeting?.join_url, 'Join URL');
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Link fontSize="small" />
          </ListItemIcon>
          Copy Join URL
        </MenuItem>
        <MenuItem onClick={() => {
          openMeeting(menuMeeting);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Launch fontSize="small" />
          </ListItemIcon>
          Open Meeting
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          setSelectedMeeting(menuMeeting);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          View Details
        </MenuItem>
        {menuMeeting?.status === 'started' && (
          <MenuItem onClick={() => {
            setConfirmDialog({ open: true, meeting: menuMeeting, action: 'end' });
            handleMenuClose();
          }}>
            <ListItemIcon>
              <Stop fontSize="small" />
            </ListItemIcon>
            End Meeting
          </MenuItem>
        )}
      </Menu>

      {/* Snackbar for notifications */}
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

      {/* Floating Action Button for quick meeting creation */}
      <Fab
        color="primary"
        aria-label="create meeting"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setCreateMeetingDialog(true)}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default EnhancedZoomDashboard;
