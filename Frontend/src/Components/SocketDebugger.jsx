import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  Divider,
  TextField,
  Grid
} from '@mui/material';
import {
  Wifi,
  WifiOff,
  Send,
  Clear,
  Refresh
} from '@mui/icons-material';
import { io } from 'socket.io-client';

const SocketDebugger = () => {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [events, setEvents] = useState([]);
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    // Connect to socket server
    const socketConnection = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      timeout: 5000
    });

    setSocket(socketConnection);

    // Connection event handlers
    socketConnection.on('connect', () => {
      console.log('✅ Socket connected:', socketConnection.id);
      setConnectionStatus('connected');
      addEvent('Connected', `Socket ID: ${socketConnection.id}`, 'success');
    });

    socketConnection.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      setConnectionStatus('error');
      addEvent('Connection Error', error.message, 'error');
    });

    socketConnection.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setConnectionStatus('disconnected');
      addEvent('Disconnected', reason, 'warning');
    });

    socketConnection.on('reconnect', () => {
      console.log('🔄 Socket reconnected');
      setConnectionStatus('connected');
      addEvent('Reconnected', 'Successfully reconnected', 'info');
    });

    // Listen to all possible events
    const eventListeners = [
      'notification',
      'meeting:started',
      'meeting:ended',
      'participant:joined',
      'participant:left',
      'attendance:updated',
      'analytics:refresh',
      'meetingStarted',
      'meetingEnded',
      'participantJoined',
      'participantLeft',
      'zoomWebhook'
    ];

    eventListeners.forEach(eventName => {
      socketConnection.on(eventName, (data) => {
        console.log(`📡 Received ${eventName}:`, data);
        addEvent(eventName, JSON.stringify(data, null, 2), 'info');
      });
    });

    // Cleanup on component unmount
    return () => {
      if (socketConnection) {
        socketConnection.disconnect();
      }
    };
  }, []);

  const addEvent = (type, message, severity = 'info') => {
    const event = {
      id: Date.now() + Math.random(),
      type,
      message,
      severity,
      timestamp: new Date().toISOString()
    };
    setEvents(prev => [event, ...prev].slice(0, 50)); // Keep last 50 events
  };

  const sendTestMessage = () => {
    if (socket && testMessage) {
      socket.emit('test', { message: testMessage, timestamp: new Date().toISOString() });
      addEvent('Sent Test Message', testMessage, 'info');
      setTestMessage('');
    }
  };

  const simulateZoomEvent = (eventType) => {
    if (socket) {
      const testData = {
        meetingId: '123456789',
        meetingTopic: 'Test Meeting',
        participantName: 'Test User',
        timestamp: new Date().toISOString()
      };
      
      socket.emit('meetingEvent', {
        meetingId: testData.meetingId,
        eventType: eventType,
        eventData: testData
      });
      
      addEvent(`Simulated ${eventType}`, JSON.stringify(testData, null, 2), 'info');
    }
  };

  const clearEvents = () => {
    setEvents([]);
  };

  const reconnect = () => {
    if (socket) {
      socket.disconnect();
      socket.connect();
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Socket.IO Debug Console
      </Typography>

      {/* Connection Status */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Chip
              icon={connectionStatus === 'connected' ? <Wifi /> : <WifiOff />}
              label={`Status: ${connectionStatus}`}
              color={
                connectionStatus === 'connected' ? 'success' : 
                connectionStatus === 'error' ? 'error' : 'default'
              }
            />
            <Typography variant="body2">
              {socket ? `Socket ID: ${socket.id || 'None'}` : 'No socket instance'}
            </Typography>
          </Box>

          {/* Controls */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              startIcon={<Refresh />}
              onClick={reconnect}
              variant="outlined"
              size="small"
            >
              Reconnect
            </Button>
            <Button
              onClick={() => simulateZoomEvent('meeting_started')}
              variant="outlined"
              size="small"
              disabled={connectionStatus !== 'connected'}
            >
              Simulate Meeting Start
            </Button>
            <Button
              onClick={() => simulateZoomEvent('participant_joined')}
              variant="outlined"
              size="small"
              disabled={connectionStatus !== 'connected'}
            >
              Simulate Participant Join
            </Button>
            <Button
              startIcon={<Clear />}
              onClick={clearEvents}
              variant="outlined"
              size="small"
            >
              Clear Events
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Test Message */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Send Test Message
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={8}>
              <TextField
                fullWidth
                size="small"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter test message..."
                onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
              />
            </Grid>
            <Grid item xs={4}>
              <Button
                startIcon={<Send />}
                onClick={sendTestMessage}
                variant="contained"
                disabled={!testMessage || connectionStatus !== 'connected'}
                fullWidth
              >
                Send
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Events Log */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Real-time Events ({events.length})
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {events.length === 0 ? (
            <Alert severity="info">
              No events received yet. Try joining a Zoom meeting or use the simulation buttons above.
            </Alert>
          ) : (
            <List sx={{ maxHeight: 600, overflow: 'auto' }}>
              {events.map((event) => (
                <ListItem key={event.id} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={event.type}
                          size="small"
                          color={
                            event.severity === 'success' ? 'success' :
                            event.severity === 'error' ? 'error' :
                            event.severity === 'warning' ? 'warning' : 'primary'
                          }
                        />
                        <Typography variant="caption">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <pre style={{ 
                        whiteSpace: 'pre-wrap', 
                        fontSize: '12px', 
                        margin: '8px 0',
                        maxHeight: '200px',
                        overflow: 'auto',
                        background: '#f5f5f5',
                        padding: '8px',
                        borderRadius: '4px'
                      }}>
                        {event.message}
                      </pre>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SocketDebugger;
