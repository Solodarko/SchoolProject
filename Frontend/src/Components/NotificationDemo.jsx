import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  ButtonGroup,
  Grid,
  Alert,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  Clear as ClearIcon,
  NotificationsActive,
  Warning,
  Error,
  Info,
  Login,
  Videocam,
  QrCodeScanner,
} from '@mui/icons-material';
import { 
  useNotificationSystem, 
  NOTIFICATION_CATEGORIES, 
  NOTIFICATION_PRIORITIES 
} from '../context/NotificationSystem';

const NotificationDemo = () => {
  const {
    notifications,
    addNotification,
    addSignInNotification,
    addZoomMeetingNotification,
    addQRCodeNotification,
    addUrgentNotification,
    markAllAsRead,
    clearAll,
    getUnreadCount,
  } = useNotificationSystem();

  const [demoCategory, setDemoCategory] = useState(NOTIFICATION_CATEGORIES.GENERAL);
  const [demoPriority, setDemoPriority] = useState(NOTIFICATION_PRIORITIES.MEDIUM);
  const [demoTitle, setDemoTitle] = useState('');
  const [demoMessage, setDemoMessage] = useState('');

  // Quick demo notifications
  const addDemoNotifications = () => {
    // Add various types of notifications to test the badge
    addNotification({
      title: 'Welcome!',
      message: 'This is a demo notification system',
      category: NOTIFICATION_CATEGORIES.SYSTEM,
      priority: NOTIFICATION_PRIORITIES.MEDIUM,
    });

    setTimeout(() => {
      addNotification({
        title: 'High Priority Alert',
        message: 'This is a high priority notification',
        category: NOTIFICATION_CATEGORIES.SYSTEM,
        priority: NOTIFICATION_PRIORITIES.HIGH,
      });
    }, 1000);

    setTimeout(() => {
      addUrgentNotification('🚨 Urgent notification with shake animation!', {
        category: NOTIFICATION_CATEGORIES.SYSTEM,
      });
    }, 2000);

    setTimeout(() => {
      addSignInNotification({
        userId: 'demo123',
        username: 'demo_user',
        fullName: 'Demo User',
        email: 'demo@example.com',
        role: 'student',
      });
    }, 3000);

    setTimeout(() => {
      addZoomMeetingNotification({
        id: 'demo_meeting',
        topic: 'Demo Meeting',
        hostName: 'Demo Host',
        joinUrl: '#',
      }, 'created');
    }, 4000);

    setTimeout(() => {
      addQRCodeNotification({
        studentId: 'STU123',
        studentName: 'John Doe',
        qrCodeId: 'qr_demo',
        latitude: 40.7128,
        longitude: -74.0060,
      });
    }, 5000);
  };

  const addCustomNotification = () => {
    if (!demoTitle.trim() || !demoMessage.trim()) {
      alert('Please enter both title and message');
      return;
    }

    addNotification({
      title: demoTitle,
      message: demoMessage,
      category: demoCategory,
      priority: demoPriority,
    });

    setDemoTitle('');
    setDemoMessage('');
  };

  const addPriorityTestNotifications = () => {
    // Add notifications of different priorities to test badge colors
    addNotification({
      title: 'Low Priority',
      message: 'This is a low priority notification',
      priority: NOTIFICATION_PRIORITIES.LOW,
    });

    setTimeout(() => {
      addNotification({
        title: 'Medium Priority',
        message: 'This is a medium priority notification',
        priority: NOTIFICATION_PRIORITIES.MEDIUM,
      });
    }, 500);

    setTimeout(() => {
      addNotification({
        title: 'High Priority',
        message: 'This is a high priority notification',
        priority: NOTIFICATION_PRIORITIES.HIGH,
      });
    }, 1000);

    setTimeout(() => {
      addUrgentNotification('🔥 Urgent Priority Notification! This should trigger shake animation');
    }, 1500);
  };

  const unreadCount = getUnreadCount();
  const urgentCount = notifications.filter(n => !n.read && n.priority === NOTIFICATION_PRIORITIES.URGENT).length;
  const highCount = notifications.filter(n => !n.read && n.priority === NOTIFICATION_PRIORITIES.HIGH).length;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <NotificationsActive color="primary" />
        Dynamic Notification Badge Demo
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        This demo showcases the dynamic notification badge in the top bar. Watch the notification bell icon 
        change colors, animate, and show different counts based on notification priorities!
      </Alert>

      <Grid container spacing={3}>
        {/* Current Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Notification Status
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Chip
                  icon={<NotificationsActive />}
                  label={`Total Unread: ${unreadCount}`}
                  color={unreadCount > 0 ? 'primary' : 'default'}
                />
                {urgentCount > 0 && (
                  <Chip
                    icon={<Error />}
                    label={`Urgent: ${urgentCount} (causes shake animation)`}
                    color="error"
                  />
                )}
                {highCount > 0 && (
                  <Chip
                    icon={<Warning />}
                    label={`High Priority: ${highCount}`}
                    color="warning"
                  />
                )}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Look at the notification bell in the top bar to see the dynamic badge!
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Demo Actions
              </Typography>
              <ButtonGroup orientation="vertical" fullWidth sx={{ gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={addDemoNotifications}
                  startIcon={<AddIcon />}
                >
                  Add Demo Notifications (6 different types)
                </Button>
                <Button
                  variant="outlined"
                  onClick={addPriorityTestNotifications}
                  startIcon={<Warning />}
                >
                  Test Priority Levels & Badge Colors
                </Button>
                <Button
                  variant="outlined"
                  color="success"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  Mark All as Read
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={clearAll}
                  startIcon={<ClearIcon />}
                  disabled={notifications.length === 0}
                >
                  Clear All Notifications
                </Button>
              </ButtonGroup>
            </CardContent>
          </Card>
        </Grid>

        {/* Custom Notification Creator */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Create Custom Notification
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={demoCategory}
                      onChange={(e) => setDemoCategory(e.target.value)}
                      label="Category"
                    >
                      {Object.entries(NOTIFICATION_CATEGORIES).map(([key, value]) => (
                        <MenuItem key={value} value={value}>
                          {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={demoPriority}
                      onChange={(e) => setDemoPriority(e.target.value)}
                      label="Priority"
                    >
                      {Object.entries(NOTIFICATION_PRIORITIES).map(([key, value]) => (
                        <MenuItem key={value} value={value}>
                          {key.charAt(0) + key.slice(1).toLowerCase()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={demoTitle}
                    onChange={(e) => setDemoTitle(e.target.value)}
                    placeholder="Enter notification title"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Message"
                    value={demoMessage}
                    onChange={(e) => setDemoMessage(e.target.value)}
                    placeholder="Enter notification message"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    onClick={addCustomNotification}
                    startIcon={<AddIcon />}
                    disabled={!demoTitle.trim() || !demoMessage.trim()}
                  >
                    Add Custom Notification
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Feature Explanation */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎯 Dynamic Badge Features
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    <strong>Badge Colors:</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2">🔴 Red: Urgent notifications present</Typography>
                    <Typography variant="body2">🟠 Orange: High priority notifications</Typography>
                    <Typography variant="body2">🔵 Blue: Regular unread notifications</Typography>
                    <Typography variant="body2">⚫ Gray: No unread notifications</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    <strong>Animations:</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2">📳 Shake: Urgent notifications trigger shake</Typography>
                    <Typography variant="body2">💓 Pulse: Regular pulse for unread count</Typography>
                    <Typography variant="body2">🔄 Urgent Pulse: Faster pulse + glow for urgent</Typography>
                    <Typography variant="body2">✨ Hover: Scale animation on hover</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Real-time Integration Info */}
        <Grid item xs={12}>
          <Alert severity="success">
            <Typography variant="body2">
              <strong>🚀 Fully Integrated!</strong> This dynamic badge automatically updates when:
            </Typography>
            <Box component="ul" sx={{ mt: 1, mb: 0 }}>
              <li>Users sign in/out (tracked by useAuthNotifications hook)</li>
              <li>Zoom meetings are created, started, or ended</li>
              <li>QR codes are scanned for attendance</li>
              <li>Any other notification is added to the system</li>
            </Box>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NotificationDemo;
