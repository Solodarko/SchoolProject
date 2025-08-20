import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Badge,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Refresh,
  People,
  Videocam,
  VideocamOff,
  Mic,
  MicOff,
  ScreenShare,
  RadioButtonChecked,
  Wifi,
  WifiOff,
  AccessTime
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import io from 'socket.io-client';

const ZoomRealTimeTracker = ({ 
  backendUrl, 
  showNotifications = true, 
  expandedByDefault = true,
  refreshInterval = 30000 
}) => {
  const [activeMeetings, setActiveMeetings] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [useWebSocket, setUseWebSocket] = useState(true);
  const [socket, setSocket] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Fetch real-time meeting data
  const fetchRealTimeData = useCallback(async () => {
    if (!backendUrl) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/zoom/real-time`);
      if (response.ok) {
        const data = await response.json();
        setActiveMeetings(data.activeMeetings || []);
        setParticipants(data.participants || []);
        setConnectionStatus('connected');
        setLastUpdate(new Date());
      } else {
        setConnectionStatus('error');
        console.warn('Failed to fetch real-time data');
      }
    } catch (error) {
      console.error('Real-time tracking error:', error);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  // WebSocket connection setup
  useEffect(() => {
    if (!useWebSocket || !backendUrl) return;

    let socketConnection;
    
    try {
      console.log('🔌 ZoomRealTimeTracker: Initializing WebSocket connection to', backendUrl);
      
      socketConnection = io(backendUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000
      });

      setSocket(socketConnection);

      // Connection events
      socketConnection.on('connect', () => {
        console.log('✅ ZoomRealTimeTracker: WebSocket connected');
        setWsConnected(true);
        setConnectionStatus('connected');
        setLastUpdate(new Date());
      });

      socketConnection.on('disconnect', (reason) => {
        console.log('🔌 ZoomRealTimeTracker: WebSocket disconnected:', reason);
        setWsConnected(false);
        setConnectionStatus('error');
      });

      socketConnection.on('connect_error', (error) => {
        console.error('❌ ZoomRealTimeTracker: WebSocket connection error:', error);
        setWsConnected(false);
        setConnectionStatus('error');
      });

      // Real-time meeting events
      socketConnection.on('initialState', (data) => {
        console.log('📊 ZoomRealTimeTracker: Received initial state:', data);
        if (data.activeMeetings) {
          setActiveMeetings(data.activeMeetings);
        }
        if (data.activeParticipants) {
          setParticipants(Array.from(data.activeParticipants));
        }
        setLastUpdate(new Date());
      });

      socketConnection.on('meetingStarted', (data) => {
        console.log('🎥 ZoomRealTimeTracker: Meeting started:', data);
        setActiveMeetings(prev => {
          const updated = prev.map(meeting => 
            meeting.id === data.meetingId 
              ? { ...meeting, status: 'started', start_time: new Date().toISOString() }
              : meeting
          );
          // If meeting not found, add it
          if (!updated.find(m => m.id === data.meetingId)) {
            updated.push({
              id: data.meetingId,
              topic: data.topic || `Meeting ${data.meetingId}`,
              status: 'started',
              start_time: new Date().toISOString(),
              participants: [],
              participantCount: 0
            });
          }
          return updated;
        });
        setLastUpdate(new Date());
      });

      socketConnection.on('meetingEnded', (data) => {
        console.log('🔚 ZoomRealTimeTracker: Meeting ended:', data);
        setActiveMeetings(prev => 
          prev.filter(meeting => meeting.id !== data.meetingId)
        );
        setLastUpdate(new Date());
      });

      socketConnection.on('participantUpdate', (data) => {
        console.log('👥 ZoomRealTimeTracker: Participant update:', data);
        // Update participants and meeting data
        const { meetingId, participantData } = data;
        
        setActiveMeetings(prev => 
          prev.map(meeting => {
            if (meeting.id === meetingId) {
              const updatedParticipants = meeting.participants || [];
              const existingIndex = updatedParticipants.findIndex(p => p.id === participantData.id);
              
              if (existingIndex >= 0) {
                updatedParticipants[existingIndex] = participantData;
              } else {
                updatedParticipants.push(participantData);
              }
              
              return {
                ...meeting,
                participants: updatedParticipants,
                participantCount: updatedParticipants.length
              };
            }
            return meeting;
          })
        );
        setLastUpdate(new Date());
      });

    } catch (error) {
      console.error('❌ ZoomRealTimeTracker: Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
    }

    return () => {
      if (socketConnection) {
        socketConnection.disconnect();
      }
    };
  }, [useWebSocket, backendUrl]);

  // Setup auto-refresh (fallback when WebSocket is disabled)
  useEffect(() => {
    if (useWebSocket) return; // Skip if using WebSocket
    
    fetchRealTimeData();
    
    const interval = setInterval(fetchRealTimeData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchRealTimeData, refreshInterval, useWebSocket]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'warning';
      case 'started': return 'success';
      case 'ended': return 'default';
      default: return 'info';
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi color="success" />;
      case 'error': return <WifiOff color="error" />;
      default: return <CircularProgress size={20} />;
    }
  };

  const renderMeetingCard = (meeting) => (
    <Card key={meeting.id} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" component="h3">
              {meeting.topic || `Meeting ${meeting.id}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {meeting.id}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              label={meeting.status} 
              color={getStatusColor(meeting.status)}
              size="small"
              icon={<RadioButtonChecked />}
            />
            <Badge badgeContent={meeting.participantCount || 0} color="primary">
              <People />
            </Badge>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              <AccessTime sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              Started: {meeting.start_time ? format(new Date(meeting.start_time), 'PPp') : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Duration: {meeting.duration ? `${meeting.duration} min` : 'Ongoing'}
            </Typography>
          </Grid>
        </Grid>

        {meeting.participants && meeting.participants.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 1 }} />
            <Typography variant="subtitle2" gutterBottom>
              Active Participants ({meeting.participants.length})
            </Typography>
            <List dense>
              {meeting.participants.slice(0, 5).map((participant, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {participant.name ? participant.name.charAt(0).toUpperCase() : 'U'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={participant.name || 'Unknown User'}
                    secondary={`Joined ${participant.join_time ? formatDistanceToNow(new Date(participant.join_time), { addSuffix: true }) : 'recently'}`}
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title={participant.video ? 'Video On' : 'Video Off'}>
                        <IconButton size="small">
                          {participant.video ? <Videocam fontSize="small" /> : <VideocamOff fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={participant.audio ? 'Unmuted' : 'Muted'}>
                        <IconButton size="small">
                          {participant.audio ? <Mic fontSize="small" /> : <MicOff fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      {participant.sharing && (
                        <Tooltip title="Screen Sharing">
                          <IconButton size="small">
                            <ScreenShare fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {meeting.participants.length > 5 && (
                <ListItem>
                  <ListItemText
                    primary={`+${meeting.participants.length - 5} more participants`}
                    sx={{ textAlign: 'center', fontStyle: 'italic' }}
                  />
                </ListItem>
              )}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2">
          Real-Time Meeting Tracker
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={useWebSocket}
                onChange={(e) => setUseWebSocket(e.target.checked)}
                size="small"
              />
            }
            label="WebSocket"
            sx={{ mr: 1 }}
          />
          <Tooltip title={`Connection: ${connectionStatus} (${useWebSocket ? 'WebSocket' : 'HTTP Polling'})`}>
            {getConnectionIcon()}
          </Tooltip>
          <IconButton 
            onClick={fetchRealTimeData} 
            disabled={loading || (useWebSocket && wsConnected)}
            size="small"
          >
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Status Bar */}
      <Alert 
        severity={connectionStatus === 'connected' ? 'success' : connectionStatus === 'error' ? 'error' : 'info'}
        sx={{ mb: 2 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2">
            {connectionStatus === 'connected' && 'Real-time tracking is active'}
            {connectionStatus === 'error' && 'Connection error - retrying...'}
            {connectionStatus === 'disconnected' && 'Connecting to real-time data...'}
          </Typography>
          {lastUpdate && (
            <Typography variant="caption">
              Last update: {formatDistanceToNow(lastUpdate, { addSuffix: true })}
            </Typography>
          )}
        </Box>
      </Alert>

      {/* Loading State */}
      {loading && activeMeetings.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* No Active Meetings */}
      {!loading && activeMeetings.length === 0 && (
        <Alert severity="info">
          No active meetings detected. When meetings start, they will appear here automatically.
        </Alert>
      )}

      {/* Active Meetings */}
      {activeMeetings.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Active Meetings ({activeMeetings.length})
          </Typography>
          {activeMeetings.map(renderMeetingCard)}
        </Box>
      )}
    </Box>
  );
};

export default ZoomRealTimeTracker;
