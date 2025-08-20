import React, { useState, useCallback } from 'react';
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
  Grid,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Stack,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  VideoCall as VideoCallIcon,
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Launch as LaunchIcon,
  Security as SecurityIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const ZoomMeetingCreator = ({ userToken, userId, userInfo, onMeetingCreated }) => {
  // Form state
  const [formData, setFormData] = useState({
    topic: '',
    agenda: '',
    duration: 60,
    password: '',
    settings: {
      hostVideo: true,
      participantVideo: true,
      muteOnEntry: true,
      waitingRoom: false,
      recording: 'none',
      allowBreakoutRooms: false,
      enableChat: true,
      enableScreenSharing: true
    }
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [createdMeeting, setCreatedMeeting] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
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

  // Handle form input changes
  const handleInputChange = (field, value) => {
    if (field.startsWith('settings.')) {
      const settingField = field.replace('settings.', '');
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Create meeting function
  const createMeeting = async () => {
    if (!formData.topic.trim()) {
      showNotification('Please enter a meeting topic', 'error');
      return;
    }

    if (!userToken) {
      showNotification('User authentication required', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/zoom/meeting/create-with-tracking`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic: formData.topic,
          agenda: formData.agenda,
          duration: formData.duration,
          password: formData.password || undefined,
          settings: formData.settings
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setCreatedMeeting(data.meeting);
        showNotification(`Meeting "${formData.topic}" created successfully!`, 'success');
        
        // Reset form
        setFormData({
          topic: '',
          agenda: '',
          duration: 60,
          password: '',
          settings: {
            hostVideo: true,
            participantVideo: true,
            muteOnEntry: true,
            waitingRoom: false,
            recording: 'none',
            allowBreakoutRooms: false,
            enableChat: true,
            enableScreenSharing: true
          }
        });

        // Callback to parent component
        if (onMeetingCreated) {
          onMeetingCreated(data.meeting);
        }
      } else {
        throw new Error(data.error || 'Failed to create meeting');
      }
    } catch (error) {
      console.error('Failed to create meeting:', error);
      showNotification(`Failed to create meeting: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification(`${label} copied to clipboard`, 'success');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      showNotification('Failed to copy to clipboard', 'error');
    }
  };

  // Generate random password
  const generatePassword = () => {
    const chars = '123456789';
    let password = '';
    for (let i = 0; i < 6; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleInputChange('password', password);
    showNotification('Password generated', 'info');
  };

  // User authentication check
  if (!userToken) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <SecurityIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" color="error.main" gutterBottom>
            Authentication Required
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please log in to create Zoom meetings with attendance tracking.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      {/* Header */}
      <Typography variant="h4" component="h1" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <VideoCallIcon color="primary" />
        Create Zoom Meeting
      </Typography>

      {/* Creator Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Meeting Creator: {userInfo?.name || userInfo?.username || 'User'}
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

      {/* Meeting Creation Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Meeting Details
          </Typography>
          
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <TextField
                label="Meeting Topic"
                value={formData.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                fullWidth
                required
                placeholder="Enter meeting topic"
                helperText="This will be visible to all participants"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Agenda"
                value={formData.agenda}
                onChange={(e) => handleInputChange('agenda', e.target.value)}
                fullWidth
                multiline
                rows={3}
                placeholder="Enter meeting agenda (optional)"
                helperText="Describe what will be covered in the meeting"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Duration (minutes)"
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 60)}
                fullWidth
                inputProps={{ min: 15, max: 480 }}
                helperText="15-480 minutes"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={1}>
                <TextField
                  label="Password (Optional)"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  fullWidth
                  placeholder="Leave empty for no password"
                />
                <Button 
                  variant="outlined" 
                  onClick={generatePassword}
                  sx={{ minWidth: 'auto', px: 2 }}
                >
                  Generate
                </Button>
              </Stack>
            </Grid>

            {/* Advanced Settings Toggle */}
            <Grid item xs={12}>
              <Divider />
              <FormControlLabel
                control={
                  <Switch
                    checked={showAdvanced}
                    onChange={(e) => setShowAdvanced(e.target.checked)}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon />
                    Advanced Settings
                  </Box>
                }
              />
            </Grid>

            {/* Advanced Settings */}
            {showAdvanced && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Meeting Settings
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.settings.hostVideo}
                            onChange={(e) => handleInputChange('settings.hostVideo', e.target.checked)}
                          />
                        }
                        label="Host Video On"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.settings.participantVideo}
                            onChange={(e) => handleInputChange('settings.participantVideo', e.target.checked)}
                          />
                        }
                        label="Participant Video On"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.settings.muteOnEntry}
                            onChange={(e) => handleInputChange('settings.muteOnEntry', e.target.checked)}
                          />
                        }
                        label="Mute on Entry"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.settings.waitingRoom}
                            onChange={(e) => handleInputChange('settings.waitingRoom', e.target.checked)}
                          />
                        }
                        label="Waiting Room"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.settings.enableChat}
                            onChange={(e) => handleInputChange('settings.enableChat', e.target.checked)}
                          />
                        }
                        label="Enable Chat"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.settings.enableScreenSharing}
                            onChange={(e) => handleInputChange('settings.enableScreenSharing', e.target.checked)}
                          />
                        }
                        label="Screen Sharing"
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Recording</InputLabel>
                    <Select
                      value={formData.settings.recording}
                      onChange={(e) => handleInputChange('settings.recording', e.target.value)}
                      label="Recording"
                    >
                      <MenuItem value="none">No Recording</MenuItem>
                      <MenuItem value="local">Local Recording</MenuItem>
                      <MenuItem value="cloud">Cloud Recording</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            {/* Create Button */}
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                  onClick={createMeeting}
                  disabled={loading || !formData.topic.trim()}
                  sx={{ minWidth: 200 }}
                >
                  {loading ? 'Creating Meeting...' : 'Create Meeting'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Created Meeting Info */}
      {createdMeeting && (
        <Card sx={{ border: 2, borderColor: 'success.main', mb: 3 }}>
          <CardContent>
            <Typography variant="h6" color="success.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SuccessIcon />
              Meeting Created Successfully!
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Meeting Information
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Topic:</strong> {createdMeeting.topic}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Meeting ID:</strong> {createdMeeting.id}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Duration:</strong> {createdMeeting.duration} minutes
                  </Typography>
                  {createdMeeting.password && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Password:</strong> {createdMeeting.password}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    <strong>Created:</strong> {format(new Date(createdMeeting.created_at), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Join Information
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Join URL:</strong>
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.75rem',
                            wordBreak: 'break-all',
                            flex: 1
                          }}
                        >
                          {createdMeeting.join_url}
                        </Typography>
                        <Tooltip title="Copy Join URL">
                          <IconButton 
                            size="small"
                            onClick={() => copyToClipboard(createdMeeting.join_url, 'Join URL')}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Open Meeting">
                          <IconButton 
                            size="small"
                            onClick={() => window.open(createdMeeting.join_url, '_blank')}
                          >
                            <LaunchIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip 
                        label={`Status: ${createdMeeting.status}`} 
                        size="small" 
                        color="warning"
                      />
                      <Chip 
                        label="Attendance Tracking Enabled" 
                        size="small" 
                        color="success"
                        icon={<PeopleIcon />}
                      />
                      {createdMeeting.password && (
                        <Chip 
                          label="Password Protected" 
                          size="small" 
                          variant="outlined"
                          icon={<SecurityIcon />}
                        />
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 2 }} icon={<InfoIcon />}>
              <Typography variant="body2">
                <strong>Attendance Tracking:</strong> All participants who join through your school's system 
                will have their attendance automatically tracked. Share the join URL with your students 
                to ensure proper attendance recording.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* How It Works */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Attendance Tracking Features
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Automatic Tracking:</strong> Attendance is tracked when users join through 
                  authenticated sessions using their student credentials.
                </Typography>
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Real-time Updates:</strong> View live attendance data and participant 
                  status in the admin dashboard during the meeting.
                </Typography>
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>Duration Tracking:</strong> System records exact join/leave times and 
                  calculates total attendance duration for each participant.
                </Typography>
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <Alert severity="success">
                <Typography variant="body2">
                  <strong>Secure Access:</strong> Only authenticated users can create meetings 
                  and access attendance data, ensuring privacy and security.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
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

export default ZoomMeetingCreator;
