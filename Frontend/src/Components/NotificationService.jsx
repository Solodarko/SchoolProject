import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Snackbar,
  Badge,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  Email,
  Sms,
  Chat as SlackIcon,
  BusinessCenter as TeamsIcon,
  Notifications,
  NotificationsActive,
  Settings,
  Send,
  Schedule,
  Person,
  Group,
  CheckCircle,
  Error,
  Warning,
  Info,
  Add as AddIcon,
  Edit,
  Delete,
  History,
  Webhook,
  Phone,
  Campaign
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';

const NotificationService = ({ participants = [], meetingHistory = [] }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      enabled: true,
      lowAttendanceThreshold: 70,
      reminderMinutes: 30,
      smtpSettings: {
        host: '',
        port: 587,
        secure: false,
        username: '',
        password: ''
      }
    },
    sms: {
      enabled: false,
      apiKey: '',
      sender: '',
      lowAttendanceThreshold: 50
    },
    slack: {
      enabled: false,
      webhookUrl: '',
      channel: '#general',
      lowAttendanceThreshold: 60
    },
    teams: {
      enabled: false,
      webhookUrl: '',
      lowAttendanceThreshold: 60
    }
  });

  // Notification rules
  const [notificationRules, setNotificationRules] = useState([
    {
      id: 1,
      name: 'Low Attendance Alert',
      type: 'attendance',
      condition: 'below',
      threshold: 70,
      channels: ['email', 'slack'],
      enabled: true,
      recipients: ['admin@example.com'],
      message: 'Meeting attendance is below threshold'
    },
    {
      id: 2,
      name: 'Late Arrival Notification',
      type: 'punctuality',
      condition: 'late',
      threshold: 5,
      channels: ['email'],
      enabled: true,
      recipients: [],
      message: 'Participant arrived late to meeting'
    }
  ]);

  // Notification history
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Test notification states
  const [testNotification, setTestNotification] = useState({
    channel: 'email',
    recipient: '',
    message: 'This is a test notification'
  });

  // Auto-check for notifications
  useEffect(() => {
    const interval = setInterval(() => {
      checkAndSendNotifications();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [participants, notificationRules]);

  const checkAndSendNotifications = useCallback(() => {
    notificationRules.forEach(rule => {
      if (!rule.enabled) return;

      switch (rule.type) {
        case 'attendance':
          checkAttendanceRule(rule);
          break;
        case 'punctuality':
          checkPunctualityRule(rule);
          break;
        default:
          break;
      }
    });
  }, [participants, notificationRules]);

  const checkAttendanceRule = (rule) => {
    const currentAttendance = calculateCurrentAttendance();
    
    if (rule.condition === 'below' && currentAttendance < rule.threshold) {
      const notification = {
        id: Date.now(),
        rule: rule.name,
        type: 'attendance',
        message: `Current attendance (${currentAttendance}%) is below threshold (${rule.threshold}%)`,
        timestamp: new Date().toISOString(),
        channels: rule.channels,
        recipients: rule.recipients,
        status: 'pending'
      };
      
      sendNotification(notification);
    }
  };

  const checkPunctualityRule = (rule) => {
    const lateParticipants = participants.filter(p => 
      p.lateMinutes && p.lateMinutes > rule.threshold
    );

    lateParticipants.forEach(participant => {
      const notification = {
        id: Date.now() + Math.random(),
        rule: rule.name,
        type: 'punctuality',
        message: `${participant.name} arrived ${participant.lateMinutes} minutes late`,
        timestamp: new Date().toISOString(),
        channels: rule.channels,
        recipients: rule.recipients.length > 0 ? rule.recipients : [participant.email],
        status: 'pending',
        participantId: participant.id
      };
      
      sendNotification(notification);
    });
  };

  const calculateCurrentAttendance = () => {
    if (participants.length === 0) return 100;
    const presentCount = participants.filter(p => 
      p.attendanceStatus === 'Present' || p.attendanceStatus === 'In Progress'
    ).length;
    return Math.round((presentCount / participants.length) * 100);
  };

  const sendNotification = async (notification) => {
    try {
      // Add to history
      setNotificationHistory(prev => [notification, ...prev.slice(0, 99)]); // Keep last 100

      // Send via each enabled channel
      for (const channel of notification.channels) {
        if (notificationSettings[channel]?.enabled) {
          switch (channel) {
            case 'email':
              await sendEmailNotification(notification);
              break;
            case 'sms':
              await sendSMSNotification(notification);
              break;
            case 'slack':
              await sendSlackNotification(notification);
              break;
            case 'teams':
              await sendTeamsNotification(notification);
              break;
            default:
              break;
          }
        }
      }

      // Update notification status
      setNotificationHistory(prev => 
        prev.map(n => n.id === notification.id ? { ...n, status: 'sent' } : n)
      );

      showSnackbar(`Notification sent successfully via ${notification.channels.join(', ')}`, 'success');
    } catch (error) {
      console.error('Failed to send notification:', error);
      setNotificationHistory(prev => 
        prev.map(n => n.id === notification.id ? { ...n, status: 'failed', error: error.message } : n)
      );
      showSnackbar('Failed to send notification', 'error');
    }
  };

  const sendEmailNotification = async (notification) => {
    const emailData = {
      to: notification.recipients,
      subject: `Zoom Meeting Alert: ${notification.rule}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2>🚨 Meeting Alert</h2>
          </div>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
            <h3>${notification.rule}</h3>
            <p><strong>Message:</strong> ${notification.message}</p>
            <p><strong>Time:</strong> ${new Date(notification.timestamp).toLocaleString()}</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              This is an automated notification from the Zoom Attendance System.
            </p>
          </div>
        </div>
      `
    };

    // In a real implementation, you would use your email service
    // For now, we'll simulate the API call
    console.log('Sending email:', emailData);
    return new Promise(resolve => setTimeout(resolve, 1000));
  };

  const sendSMSNotification = async (notification) => {
    const smsData = {
      to: notification.recipients.filter(r => r.includes('+')), // Phone numbers
      message: `Alert: ${notification.message} - Time: ${new Date(notification.timestamp).toLocaleString()}`,
      apiKey: notificationSettings.sms.apiKey,
      sender: notificationSettings.sms.sender
    };

    console.log('Sending SMS:', smsData);
    return new Promise(resolve => setTimeout(resolve, 1000));
  };

  const sendSlackNotification = async (notification) => {
    const slackData = {
      channel: notificationSettings.slack.channel,
      text: `🚨 *${notification.rule}*`,
      attachments: [
        {
          color: notification.type === 'attendance' ? '#ff6b6b' : '#feca57',
          fields: [
            {
              title: 'Message',
              value: notification.message,
              short: false
            },
            {
              title: 'Time',
              value: new Date(notification.timestamp).toLocaleString(),
              short: true
            }
          ]
        }
      ]
    };

    if (notificationSettings.slack.webhookUrl) {
      await axios.post(notificationSettings.slack.webhookUrl, slackData);
    }
  };

  const sendTeamsNotification = async (notification) => {
    const teamsData = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      'themeColor': notification.type === 'attendance' ? 'FF6B6B' : 'FECA57',
      'summary': notification.rule,
      'sections': [
        {
          'activityTitle': `🚨 ${notification.rule}`,
          'activitySubtitle': new Date(notification.timestamp).toLocaleString(),
          'facts': [
            {
              'name': 'Message',
              'value': notification.message
            }
          ],
          'markdown': true
        }
      ]
    };

    if (notificationSettings.teams.webhookUrl) {
      await axios.post(notificationSettings.teams.webhookUrl, teamsData);
    }
  };

  const testNotificationSend = async () => {
    const testData = {
      id: Date.now(),
      rule: 'Test Notification',
      type: 'test',
      message: testNotification.message,
      timestamp: new Date().toISOString(),
      channels: [testNotification.channel],
      recipients: [testNotification.recipient],
      status: 'pending'
    };

    await sendNotification(testData);
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSaveRule = () => {
    if (editingRule) {
      setNotificationRules(prev => 
        prev.map(rule => rule.id === editingRule.id ? editingRule : rule)
      );
    } else {
      const newRule = {
        ...editingRule,
        id: Date.now()
      };
      setNotificationRules(prev => [...prev, newRule]);
    }
    setDialogOpen(false);
    setEditingRule(null);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'attendance': return <Group color="error" />;
      case 'punctuality': return <Schedule color="warning" />;
      case 'test': return <Info color="info" />;
      default: return <Notifications />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'success';
      case 'failed': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index} style={{ paddingTop: 16 }}>
      {value === index && children}
    </div>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          🔔 Notification Center
        </Typography>
        
        <Box display="flex" gap={2}>
          <Badge badgeContent={notificationHistory.filter(n => n.status === 'pending').length} color="error">
            <Button
              variant="outlined"
              startIcon={<History />}
              onClick={() => setActiveTab(2)}
            >
              History
            </Button>
          </Badge>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingRule({
                name: '',
                type: 'attendance',
                condition: 'below',
                threshold: 70,
                channels: ['email'],
                enabled: true,
                recipients: [],
                message: ''
              });
              setDialogOpen(true);
            }}
          >
            Add Rule
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Settings" icon={<Settings />} />
          <Tab label="Rules" icon={<Campaign />} />
          <Tab label="History" icon={<History />} />
          <Tab label="Test" icon={<Send />} />
        </Tabs>
      </Paper>

      {/* Tab 1: Settings */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          {/* Email Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Email color="primary" />
                  <Typography variant="h6">Email Notifications</Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.email.enabled}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          email: { ...prev.email, enabled: e.target.checked }
                        }))}
                      />
                    }
                    label=""
                  />
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="SMTP Host"
                      value={notificationSettings.email.smtpSettings.host}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        email: {
                          ...prev.email,
                          smtpSettings: { ...prev.email.smtpSettings, host: e.target.value }
                        }
                      }))}
                      disabled={!notificationSettings.email.enabled}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Port"
                      type="number"
                      value={notificationSettings.email.smtpSettings.port}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        email: {
                          ...prev.email,
                          smtpSettings: { ...prev.email.smtpSettings, port: parseInt(e.target.value) }
                        }
                      }))}
                      disabled={!notificationSettings.email.enabled}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Low Attendance Threshold (%)"
                      type="number"
                      value={notificationSettings.email.lowAttendanceThreshold}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        email: { ...prev.email, lowAttendanceThreshold: parseInt(e.target.value) }
                      }))}
                      disabled={!notificationSettings.email.enabled}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* SMS Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Sms color="secondary" />
                  <Typography variant="h6">SMS Notifications</Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.sms.enabled}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          sms: { ...prev.sms, enabled: e.target.checked }
                        }))}
                      />
                    }
                    label=""
                  />
                </Box>
                
                <form onSubmit={(e) => e.preventDefault()}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="API Key"
                        type="password"
                        value={notificationSettings.sms.apiKey}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          sms: { ...prev.sms, apiKey: e.target.value }
                        }))}
                        disabled={!notificationSettings.sms.enabled}
                        autoComplete="new-password"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Sender ID"
                        value={notificationSettings.sms.sender}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          sms: { ...prev.sms, sender: e.target.value }
                        }))}
                        disabled={!notificationSettings.sms.enabled}
                      />
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </Card>
          </Grid>

          {/* Slack Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <SlackIcon sx={{ color: '#4A154B' }} />
                  <Typography variant="h6">Slack Integration</Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.slack.enabled}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          slack: { ...prev.slack, enabled: e.target.checked }
                        }))}
                      />
                    }
                    label=""
                  />
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Webhook URL"
                      value={notificationSettings.slack.webhookUrl}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        slack: { ...prev.slack, webhookUrl: e.target.value }
                      }))}
                      disabled={!notificationSettings.slack.enabled}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Channel"
                      value={notificationSettings.slack.channel}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        slack: { ...prev.slack, channel: e.target.value }
                      }))}
                      disabled={!notificationSettings.slack.enabled}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Teams Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <TeamsIcon sx={{ color: '#6264A7' }} />
                  <Typography variant="h6">Microsoft Teams</Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.teams.enabled}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          teams: { ...prev.teams, enabled: e.target.checked }
                        }))}
                      />
                    }
                    label=""
                  />
                </Box>
                
                <TextField
                  fullWidth
                  label="Webhook URL"
                  value={notificationSettings.teams.webhookUrl}
                  onChange={(e) => setNotificationSettings(prev => ({
                    ...prev,
                    teams: { ...prev.teams, webhookUrl: e.target.value }
                  }))}
                  disabled={!notificationSettings.teams.enabled}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 2: Rules */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={2}>
          {notificationRules.map((rule) => (
            <Grid item xs={12} key={rule.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        {getNotificationIcon(rule.type)}
                        <Typography variant="h6">{rule.name}</Typography>
                        <Chip 
                          label={rule.enabled ? 'Active' : 'Inactive'} 
                          color={rule.enabled ? 'success' : 'default'} 
                          size="small" 
                        />
                      </Box>
                      
                      <Typography variant="body2" color="textSecondary" mb={1}>
                        {rule.message}
                      </Typography>
                      
                      <Box display="flex" gap={1} flexWrap="wrap">
                        <Chip label={`Type: ${rule.type}`} size="small" />
                        <Chip label={`Threshold: ${rule.threshold}${rule.type === 'attendance' ? '%' : 'min'}`} size="small" />
                        <Chip label={`Channels: ${rule.channels.join(', ')}`} size="small" />
                      </Box>
                    </Box>
                    
                    <Box display="flex" gap={1}>
                      <IconButton
                        onClick={() => {
                          setEditingRule(rule);
                          setDialogOpen(true);
                        }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          setNotificationRules(prev => prev.filter(r => r.id !== rule.id));
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Tab 3: History */}
      <TabPanel value={activeTab} index={2}>
        <List>
          {notificationHistory.slice(0, 50).map((notification) => (
            <React.Fragment key={notification.id}>
              <ListItem>
                <ListItemIcon>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={notification.rule}
                  secondary={
                    <>
                      <Typography component="span" variant="body2">
                        {notification.message}
                      </Typography>
                      <br />
                      <Typography component="span" variant="caption" color="textSecondary">
                        {new Date(notification.timestamp).toLocaleString()} • 
                        Channels: {notification.channels.join(', ')}
                      </Typography>
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <Chip 
                    label={notification.status} 
                    color={getStatusColor(notification.status)} 
                    size="small"
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
          
          {notificationHistory.length === 0 && (
            <ListItem>
              <ListItemText
                primary="No notifications yet"
                secondary="Notifications will appear here when they are sent"
              />
            </ListItem>
          )}
        </List>
      </TabPanel>

      {/* Tab 4: Test */}
      <TabPanel value={activeTab} index={3}>
        <Card sx={{ maxWidth: 600, mx: 'auto' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Test Notifications
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Channel</InputLabel>
                  <Select
                    value={testNotification.channel}
                    label="Channel"
                    onChange={(e) => setTestNotification(prev => ({ ...prev, channel: e.target.value }))}
                  >
                    <MenuItem value="email">Email</MenuItem>
                    <MenuItem value="sms">SMS</MenuItem>
                    <MenuItem value="slack">Slack</MenuItem>
                    <MenuItem value="teams">Microsoft Teams</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Recipient"
                  value={testNotification.recipient}
                  onChange={(e) => setTestNotification(prev => ({ ...prev, recipient: e.target.value }))}
                  placeholder="email@example.com or +1234567890"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Message"
                  value={testNotification.message}
                  onChange={(e) => setTestNotification(prev => ({ ...prev, message: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Send />}
                  onClick={testNotificationSend}
                  disabled={!testNotification.recipient || !testNotification.message}
                >
                  Send Test Notification
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Edit Rule Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRule?.id ? 'Edit Notification Rule' : 'Add Notification Rule'}
        </DialogTitle>
        
        <DialogContent>
          {editingRule && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Rule Name"
                  value={editingRule.name}
                  onChange={(e) => setEditingRule(prev => ({ ...prev, name: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={editingRule.type}
                    label="Type"
                    onChange={(e) => setEditingRule(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <MenuItem value="attendance">Attendance</MenuItem>
                    <MenuItem value="punctuality">Punctuality</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Threshold"
                  type="number"
                  value={editingRule.threshold}
                  onChange={(e) => setEditingRule(prev => ({ ...prev, threshold: parseInt(e.target.value) }))}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Message"
                  value={editingRule.message}
                  onChange={(e) => setEditingRule(prev => ({ ...prev, message: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editingRule.enabled}
                      onChange={(e) => setEditingRule(prev => ({ ...prev, enabled: e.target.checked }))}
                    />
                  }
                  label="Enable this rule"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveRule} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationService;
