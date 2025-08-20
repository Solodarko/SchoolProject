import React, { useState, useEffect, Fragment } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondary,
  Divider,
  Button,
  ButtonGroup,
  FormControl,
  FormGroup,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  Chip,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Fade,
  Collapse,
  Avatar,
  Grid,
  Container
} from '@mui/material';
import {
  Settings as SettingsIcon,
  History as HistoryIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Email as EmailIcon,
  Notifications as NotificationsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  Login,
  Videocam,
  QrCodeScanner,
  CheckCircle,
  PersonAdd,
  Assignment,
  Schedule,
  Warning,
  Error
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { 
  useNotificationSystem, 
  NOTIFICATION_CATEGORIES, 
  NOTIFICATION_PRIORITIES 
} from '../context/NotificationSystem';

const NotificationHistory = () => {
  const {
    notifications,
    settings,
    updateSettings,
    markAsRead,
    removeNotification,
    clearAll,
    getNotificationsByCategory
  } = useNotificationSystem();
  
  const theme = useTheme();
  
  // State for filtering and search
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showReadNotifications, setShowReadNotifications] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');
  
  // State for settings dialog
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);
  
  // State for notification details
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // State for expanded view
  const [expandedItems, setExpandedItems] = useState(new Set());

  // Update filtered notifications when filters change
  useEffect(() => {
    let filtered = [...notifications];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(notification => notification.category === selectedCategory);
    }

    // Priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(notification => notification.priority === selectedPriority);
    }

    // Read/Unread filter
    if (showUnreadOnly) {
      filtered = filtered.filter(notification => !notification.read);
    } else if (!showReadNotifications) {
      filtered = filtered.filter(notification => notification.read);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.timestamp) - new Date(a.timestamp);
      } else if (sortOrder === 'oldest') {
        return new Date(a.timestamp) - new Date(b.timestamp);
      } else if (sortOrder === 'priority') {
        const priorityOrder = {
          [NOTIFICATION_PRIORITIES.URGENT]: 4,
          [NOTIFICATION_PRIORITIES.HIGH]: 3,
          [NOTIFICATION_PRIORITIES.MEDIUM]: 2,
          [NOTIFICATION_PRIORITIES.LOW]: 1
        };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return 0;
    });

    setFilteredNotifications(filtered);
  }, [notifications, searchTerm, selectedCategory, selectedPriority, showReadNotifications, showUnreadOnly, sortOrder]);

  // Handle settings update
  const handleSettingsUpdate = () => {
    updateSettings(localSettings);
    setSettingsOpen(false);
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setSelectedNotification(notification);
    setDetailsOpen(true);
  };

  // Toggle expanded view
  const toggleExpanded = (notificationId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(notificationId)) {
      newExpanded.delete(notificationId);
    } else {
      newExpanded.add(notificationId);
    }
    setExpandedItems(newExpanded);
  };

  // Get category icon
  const getCategoryIcon = (category, priority) => {
    const iconProps = {
      fontSize: 'small',
      color: priority === NOTIFICATION_PRIORITIES.URGENT ? 'error' : 
             priority === NOTIFICATION_PRIORITIES.HIGH ? 'warning' : 'primary'
    };

    switch (category) {
      case NOTIFICATION_CATEGORIES.ATTENDANCE:
        return <CheckCircle {...iconProps} />;
      case NOTIFICATION_CATEGORIES.STUDENT:
        return <PersonAdd {...iconProps} />;
      case NOTIFICATION_CATEGORIES.SYSTEM:
        return <SettingsIcon {...iconProps} />;
      case NOTIFICATION_CATEGORIES.REPORT:
        return <Assignment {...iconProps} />;
      case NOTIFICATION_CATEGORIES.SCHEDULE:
        return <Schedule {...iconProps} />;
      case NOTIFICATION_CATEGORIES.SIGNIN:
        return <Login {...iconProps} />;
      case NOTIFICATION_CATEGORIES.ZOOM:
        return <Videocam {...iconProps} />;
      case NOTIFICATION_CATEGORIES.QR_CODE:
        return <QrCodeScanner {...iconProps} />;
      default:
        return <InfoIcon {...iconProps} />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case NOTIFICATION_PRIORITIES.URGENT:
        return 'error';
      case NOTIFICATION_PRIORITIES.HIGH:
        return 'warning';
      case NOTIFICATION_PRIORITIES.MEDIUM:
        return 'info';
      default:
        return 'default';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get category label
  const getCategoryLabel = (category) => {
    return category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <HistoryIcon color="primary" fontSize="large" />
            <Typography variant="h4" component="h1" fontWeight={600}>
              Notification History
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setSettingsOpen(true)}
          >
            Settings
          </Button>
        </Box>

        {/* Filters and Search */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              {/* Search */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                    endAdornment: searchTerm && (
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <ClearIcon />
                      </IconButton>
                    )
                  }}
                />
              </Grid>

              {/* Category Filter */}
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    label="Category"
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {Object.values(NOTIFICATION_CATEGORIES).map((category) => (
                      <MenuItem key={category} value={category}>
                        {getCategoryLabel(category)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Priority Filter */}
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    label="Priority"
                  >
                    <MenuItem value="all">All Priorities</MenuItem>
                    {Object.values(NOTIFICATION_PRIORITIES).map((priority) => (
                      <MenuItem key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Sort Order */}
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    label="Sort By"
                  >
                    <MenuItem value="newest">Newest First</MenuItem>
                    <MenuItem value="oldest">Oldest First</MenuItem>
                    <MenuItem value="priority">Priority</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Filter Toggles */}
              <Grid item xs={12} md={2}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={showUnreadOnly}
                        onChange={(e) => {
                          setShowUnreadOnly(e.target.checked);
                          if (e.target.checked) setShowReadNotifications(true);
                        }}
                      />
                    }
                    label="Unread Only"
                  />
                </FormGroup>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {notifications.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Notifications
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error">
                  {notifications.filter(n => !n.read).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Unread
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {notifications.filter(n => n.priority === NOTIFICATION_PRIORITIES.HIGH || n.priority === NOTIFICATION_PRIORITIES.URGENT).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  High Priority
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {filteredNotifications.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Filtered Results
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Notifications List */}
        <Paper variant="outlined" sx={{ maxHeight: 600, overflow: 'auto' }}>
          {filteredNotifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No notifications found
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Try adjusting your filters or search terms
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      backgroundColor: !notification.read ? 'action.selected' : 'transparent',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' },
                      py: 2
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          bgcolor: notification.read ? 'grey.300' : 'primary.main',
                          width: 40,
                          height: 40,
                        }}
                      >
                        {getCategoryIcon(notification.category, notification.priority)}
                      </Avatar>
                    </ListItemIcon>

                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: !notification.read ? 600 : 400, flex: 1 }}
                          >
                            {notification.title}
                          </Typography>
                          <Chip
                            label={notification.priority}
                            size="small"
                            color={getPriorityColor(notification.priority)}
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                          <Chip
                            label={getCategoryLabel(notification.category)}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 0.5 }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {formatTimestamp(notification.timestamp)}
                          </Typography>
                        </Box>
                      }
                    />

                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(notification.id);
                      }}
                    >
                      {expandedItems.has(notification.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </ListItem>

                  {/* Expanded Details */}
                  <Collapse in={expandedItems.has(notification.id)}>
                    <Box sx={{ px: 3, pb: 2, backgroundColor: 'grey.50' }}>
                      {notification.metadata && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Additional Details:
                          </Typography>
                          <pre style={{ 
                            fontSize: '0.75rem', 
                            backgroundColor: 'white',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #e0e0e0',
                            overflow: 'auto',
                            maxHeight: '200px'
                          }}>
                            {JSON.stringify(notification.metadata, null, 2)}
                          </pre>
                        </Box>
                      )}
                      
                      <Box display="flex" gap={1}>
                        {notification.actionUrl && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => window.open(notification.actionUrl, '_blank')}
                          >
                            {notification.actionText || 'Open'}
                          </Button>
                        )}
                        <Button
                          size="small"
                          color="error"
                          onClick={() => removeNotification(notification.id)}
                        >
                          Delete
                        </Button>
                      </Box>
                    </Box>
                  </Collapse>

                  {index < filteredNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>

        {/* Actions */}
        {notifications.length > 0 && (
          <Box display="flex" justifyContent="center" gap={2} mt={3}>
            <Button
              variant="outlined"
              color="error"
              onClick={clearAll}
              startIcon={<ClearIcon />}
            >
              Clear All Notifications
            </Button>
          </Box>
        )}
      </Paper>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Notification Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Sound Settings */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Sound Settings
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.soundEnabled}
                    onChange={(e) => setLocalSettings(prev => ({
                      ...prev,
                      soundEnabled: e.target.checked
                    }))}
                  />
                }
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    {localSettings.soundEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
                    Enable notification sounds
                  </Box>
                }
              />
            </Box>

            {/* Email Settings */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Email Notifications
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.emailNotifications}
                    onChange={(e) => setLocalSettings(prev => ({
                      ...prev,
                      emailNotifications: e.target.checked
                    }))}
                  />
                }
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <EmailIcon />
                    Send email notifications
                  </Box>
                }
              />
            </Box>

            {/* Category Settings */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Notification Categories
              </Typography>
              <FormGroup>
                {Object.values(NOTIFICATION_CATEGORIES).map((category) => (
                  <FormControlLabel
                    key={category}
                    control={
                      <Switch
                        checked={localSettings.categories[category] || false}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          categories: {
                            ...prev.categories,
                            [category]: e.target.checked
                          }
                        }))}
                      />
                    }
                    label={getCategoryLabel(category)}
                  />
                ))}
              </FormGroup>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
          <Button onClick={handleSettingsUpdate} variant="contained">
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        {selectedNotification && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                {getCategoryIcon(selectedNotification.category, selectedNotification.priority)}
                {selectedNotification.title}
                <Chip
                  label={selectedNotification.priority}
                  size="small"
                  color={getPriorityColor(selectedNotification.priority)}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedNotification.message}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {formatTimestamp(selectedNotification.timestamp)}
                </Typography>

                {selectedNotification.metadata && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Additional Information:
                    </Typography>
                    <pre style={{
                      fontSize: '0.875rem',
                      backgroundColor: '#f5f5f5',
                      padding: '16px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      maxHeight: '300px',
                      border: '1px solid #e0e0e0'
                    }}>
                      {JSON.stringify(selectedNotification.metadata, null, 2)}
                    </pre>
                  </>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
              {selectedNotification.actionUrl && (
                <Button
                  variant="contained"
                  onClick={() => {
                    window.open(selectedNotification.actionUrl, '_blank');
                    setDetailsOpen(false);
                  }}
                >
                  {selectedNotification.actionText || 'Open'}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default NotificationHistory;
