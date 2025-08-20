import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Badge,
  IconButton,
  Tooltip,
  Button,
  Alert,
  Divider,
  Paper,
  Grid,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  LocationOn as LocationOnIcon,
  QrCode as QrCodeIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

const RealTimeAttendanceMonitor = ({ maxNotifications = 10, autoScroll = true }) => {
  const { apiBaseUrl } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [stats, setStats] = useState({ today: 0, thisHour: 0, total: 0 });
  const [showAll, setShowAll] = useState(false);
  const listRef = useRef(null);
  const audioRef = useRef(new Audio('/notification.mp3')); // Add notification sound

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = io(apiBaseUrl, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      forceNew: true
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('🔗 Connected to real-time attendance monitoring');
      setConnectionStatus('connected');
      
      // Join admin dashboard room
      newSocket.emit('joinRoom', 'admin_dashboard');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from real-time attendance monitoring');
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('🚨 Socket connection error:', error);
      setConnectionStatus('error');
    });

    // Real-time attendance notifications
    newSocket.on('attendanceRecorded', (notification) => {
      console.log('📢 New attendance notification:', notification);
      addNotification(notification);
      playNotificationSound();
      updateStats();
    });

    newSocket.on('notification', (notification) => {
      if (notification.type === 'attendance_recorded') {
        addNotification(notification);
        playNotificationSound();
      }
    });

    newSocket.on('realTimeAttendanceUpdate', (update) => {
      console.log('📊 Real-time attendance update:', update);
      if (update.type === 'new_attendance') {
        handleAttendanceUpdate(update);
      }
    });

    // Get initial state
    newSocket.on('initialState', (state) => {
      if (state.recentNotifications) {
        setNotifications(state.recentNotifications.filter(n => n.type === 'attendance_recorded'));
        updateStats();
      }
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [apiBaseUrl]);

  useEffect(() => {
    // Auto-scroll to latest notification
    if (autoScroll && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [notifications, autoScroll]);

  const addNotification = (notification) => {
    setNotifications(prev => {
      const updated = [notification, ...prev];
      return updated.slice(0, maxNotifications * 2); // Keep extra for "show all"
    });
  };

  const handleAttendanceUpdate = (update) => {
    const { data } = update;
    const notification = {
      id: `attendance_${data.attendance._id}`,
      type: 'attendance_recorded',
      icon: '✅',
      title: 'Attendance Recorded',
      message: `${data.attendance.studentName} marked present`,
      studentInfo: {
        studentId: data.attendance.studentId,
        name: data.attendance.studentName,
        department: data.studentInfo?.department
      },
      attendanceDetails: {
        date: new Date(data.attendance.date).toLocaleDateString(),
        time: new Date(data.attendance.date).toLocaleTimeString(),
        status: data.attendance.status,
        method: data.attendance.method,
        location: data.attendance.location,
        verification: data.attendance.verification
      },
      qrCodeInfo: data.qrCodeInfo,
      timestamp: update.timestamp,
      priority: 'high'
    };
    
    addNotification(notification);
  };

  const playNotificationSound = () => {
    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

  const updateStats = () => {
    const now = new Date();
    const today = now.toDateString();
    const currentHour = now.getHours();

    const todayCount = notifications.filter(n => 
      new Date(n.timestamp).toDateString() === today
    ).length;

    const thisHourCount = notifications.filter(n => {
      const nDate = new Date(n.timestamp);
      return nDate.toDateString() === today && nDate.getHours() === currentHour;
    }).length;

    setStats({
      today: todayCount,
      thisHour: thisHourCount,
      total: notifications.length
    });
  };

  const clearNotifications = () => {
    setNotifications([]);
    setStats({ today: 0, thisHour: 0, total: 0 });
  };

  const getConnectionStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return { color: 'success', text: 'Connected', icon: '🟢' };
      case 'disconnected':
        return { color: 'error', text: 'Disconnected', icon: '🔴' };
      case 'error':
        return { color: 'error', text: 'Connection Error', icon: '⚠️' };
      default:
        return { color: 'info', text: 'Connecting...', icon: '🟡' };
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'present': return 'success';
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const displayNotifications = showAll ? notifications : notifications.slice(0, maxNotifications);
  const statusConfig = getConnectionStatusConfig();

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, p: 0 }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <Badge badgeContent={stats.today} color="primary">
                <NotificationsIcon color="primary" />
              </Badge>
              <Typography variant="h6" fontWeight={600}>
                Live Attendance Monitor
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                label={`${statusConfig.icon} ${statusConfig.text}`}
                color={statusConfig.color}
                size="small"
                variant="outlined"
              />
              <Tooltip title="Clear all notifications">
                <IconButton size="small" onClick={clearNotifications} disabled={notifications.length === 0}>
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Statistics */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={4}>
              <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                <Typography variant="h6" fontWeight={700}>{stats.today}</Typography>
                <Typography variant="caption">Today</Typography>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Typography variant="h6" fontWeight={700}>{stats.thisHour}</Typography>
                <Typography variant="caption">This Hour</Typography>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
                <Typography variant="h6" fontWeight={700}>{stats.total}</Typography>
                <Typography variant="caption">Total</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Notifications List */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', maxHeight: '600px' }} ref={listRef}>
          {connectionStatus === 'connecting' && (
            <Box sx={{ p: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Connecting to real-time monitoring...
              </Typography>
            </Box>
          )}

          {connectionStatus === 'error' && (
            <Alert severity="error" sx={{ m: 2 }}>
              Failed to connect to real-time monitoring. Please refresh the page.
            </Alert>
          )}

          {displayNotifications.length === 0 && connectionStatus === 'connected' ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No attendance records yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                New attendance scans will appear here in real-time
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {displayNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem sx={{ px: 2, py: 1.5 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'success.main' }}>
                        {notification.studentInfo?.name ? 
                          notification.studentInfo.name.charAt(0).toUpperCase() : 
                          <PersonIcon />
                        }
                      </Avatar>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Typography variant="subtitle2" fontWeight={600}>
                            {notification.studentInfo?.name || 'Unknown Student'}
                          </Typography>
                          <Chip
                            label={notification.attendanceDetails?.status || 'Present'}
                            color={getStatusColor(notification.attendanceDetails?.status)}
                            size="small"
                          />
                          <Chip
                            label={notification.attendanceDetails?.method || 'QR Scan'}
                            variant="outlined"
                            size="small"
                            icon={<QrCodeIcon />}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            ID: {notification.studentInfo?.studentId} 
                            {notification.studentInfo?.department && ` • ${notification.studentInfo.department}`}
                          </Typography>
                          
                          <Box display="flex" alignItems="center" gap={2} sx={{ mt: 0.5 }}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {notification.attendanceDetails?.location?.distance ? 
                                  `${notification.attendanceDetails.location.distance.toFixed(1)}m from center` :
                                  'Location verified'
                                }
                              </Typography>
                            </Box>
                            
                            <Typography variant="caption" color="text.secondary">
                              {formatTime(notification.timestamp)}
                            </Typography>
                          </Box>

                          {notification.qrCodeInfo && (
                            <Typography variant="caption" color="primary.main" sx={{ display: 'block', mt: 0.5 }}>
                              QR generated by: {notification.qrCodeInfo.generatedBy}
                            </Typography>
                          )}
                        </Box>
                      }
                    />

                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={getStatusColor(notification.attendanceDetails?.verification) === 'success' ? 'Verified' : 'Pending'}
                        color={getStatusColor(notification.attendanceDetails?.verification)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </ListItem>
                  
                  {index < displayNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        {notifications.length > maxNotifications && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setShowAll(!showAll)}
              startIcon={showAll ? <ArchiveIcon /> : <VisibilityIcon />}
            >
              {showAll ? 'Show Less' : `Show All ${notifications.length} Notifications`}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RealTimeAttendanceMonitor;
