import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Badge,
  IconButton,
  Divider,
  Button,
  Chip,
  Avatar,
  Tooltip,
  ListItemAvatar,
  List,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  CheckCircle,
  Warning,
  Error,
  Info,
  School,
  PersonAdd,
  Assignment,
  Schedule,
  Clear,
  MarkEmailRead,
  Settings,
  Login,
  Videocam,
  QrCodeScanner
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import Cookies from 'js-cookie';
// import notificationService from '../services/NotificationService'; // Not currently used

// Notification categories
export const NOTIFICATION_CATEGORIES = {
  ATTENDANCE: 'attendance',
  STUDENT: 'student',
  SYSTEM: 'system',
  REPORT: 'report',
  SCHEDULE: 'schedule',
  GENERAL: 'general',
  SIGNIN: 'signin',
  ZOOM: 'zoom',
  QR_CODE: 'qr_code'
};

// Notification priorities
export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

const NotificationSystemContext = createContext();

export const useNotificationSystem = () => {
  const context = useContext(NotificationSystemContext);
  if (!context) {
    throw new Error('useNotificationSystem must be used within a NotificationSystemProvider');
  }
  return context;
};

// Icon mapping for different notification types
const getNotificationIcon = (category, priority) => {
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
      return <Settings {...iconProps} />;
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
      return <Info {...iconProps} />;
  }
};

// Priority chip colors
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

export const NotificationSystemProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({
    soundEnabled: true,
    emailNotifications: true,
    categories: {
      [NOTIFICATION_CATEGORIES.ATTENDANCE]: true,
      [NOTIFICATION_CATEGORIES.STUDENT]: true,
      [NOTIFICATION_CATEGORIES.SYSTEM]: true,
      [NOTIFICATION_CATEGORIES.REPORT]: true,
      [NOTIFICATION_CATEGORIES.SCHEDULE]: true,
    [NOTIFICATION_CATEGORIES.GENERAL]: true,
    [NOTIFICATION_CATEGORIES.SIGNIN]: true,
    [NOTIFICATION_CATEGORIES.ZOOM]: true,
    [NOTIFICATION_CATEGORIES.QR_CODE]: true,
  }
});
  const theme = useTheme();

  // Generate unique ID
  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${performance.now().toString(36).substr(2, 5)}`;
  }, []);

  // Add notification
  const addNotification = useCallback((notification) => {
    const id = generateId();
    const newNotification = {
      id,
      title: '',
      message: '',
      category: NOTIFICATION_CATEGORIES.GENERAL,
      priority: NOTIFICATION_PRIORITIES.MEDIUM,
      read: false,
      timestamp: new Date(),
      actionUrl: null,
      actionText: null,
      persistent: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Play notification sound if enabled
    if (settings.soundEnabled && newNotification.priority !== NOTIFICATION_PRIORITIES.LOW) {
      playNotificationSound(newNotification.priority);
    }

    return id;
  }, [generateId, settings.soundEnabled]);

  // Play notification sound
  const playNotificationSound = useCallback((priority) => {
    try {
      const audio = new Audio();
      
      // Different sounds for different priorities
      switch (priority) {
        case NOTIFICATION_PRIORITIES.URGENT:
          audio.src = '/sounds/urgent.mp3';
          break;
        case NOTIFICATION_PRIORITIES.HIGH:
          audio.src = '/sounds/high.mp3';
          break;
        default:
          audio.src = '/sounds/default.mp3';
          break;
      }
      
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Could not play notification sound:', e));
    } catch (error) {
      console.log('Notification sound not available:', error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Remove notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Get unread count
  const getUnreadCount = useCallback(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Get notifications by category
  const getNotificationsByCategory = useCallback((category) => {
    return notifications.filter(n => n.category === category);
  }, [notifications]);

  // Update settings
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Convenience methods for different types
  const addAttendanceNotification = useCallback((message, options = {}) => {
    return addNotification({
      title: 'Attendance Update',
      message,
      category: NOTIFICATION_CATEGORIES.ATTENDANCE,
      priority: NOTIFICATION_PRIORITIES.MEDIUM,
      ...options
    });
  }, [addNotification]);

  const addStudentNotification = useCallback((message, options = {}) => {
    return addNotification({
      title: 'Student Update',
      message,
      category: NOTIFICATION_CATEGORIES.STUDENT,
      priority: NOTIFICATION_PRIORITIES.MEDIUM,
      ...options
    });
  }, [addNotification]);

  const addSystemNotification = useCallback((message, options = {}) => {
    return addNotification({
      title: 'System Notification',
      message,
      category: NOTIFICATION_CATEGORIES.SYSTEM,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      ...options
    });
  }, [addNotification]);

  const addReportNotification = useCallback((message, options = {}) => {
    return addNotification({
      title: 'Report Ready',
      message,
      category: NOTIFICATION_CATEGORIES.REPORT,
      priority: NOTIFICATION_PRIORITIES.MEDIUM,
      ...options
    });
  }, [addNotification]);

  const addScheduleNotification = useCallback((message, options = {}) => {
    return addNotification({
      title: 'Schedule Update',
      message,
      category: NOTIFICATION_CATEGORIES.SCHEDULE,
      priority: NOTIFICATION_PRIORITIES.MEDIUM,
      ...options
    });
  }, [addNotification]);

  const addUrgentNotification = useCallback((message, options = {}) => {
    return addNotification({
      title: 'Urgent Notice',
      message,
      priority: NOTIFICATION_PRIORITIES.URGENT,
      persistent: true,
      ...options
    });
  }, [addNotification]);

  // Sign-in notification
  const addSignInNotification = useCallback((userInfo, options = {}) => {
    const isAdmin = userInfo.role === 'admin' || userInfo.role === 'teacher';
    const timestamp = new Date().toLocaleString();
    
    return addNotification({
      title: `${isAdmin ? 'Admin' : 'User'} Sign In`,
      message: `${userInfo.fullName || userInfo.username} signed in at ${timestamp}`,
      category: NOTIFICATION_CATEGORIES.SIGNIN,
      priority: NOTIFICATION_PRIORITIES.LOW,
      metadata: {
        userId: userInfo.userId,
        username: userInfo.username,
        email: userInfo.email,
        role: userInfo.role,
        studentId: userInfo.studentId,
        signInTime: timestamp,
        ipAddress: userInfo.ipAddress,
        userAgent: userInfo.userAgent
      },
      actionUrl: isAdmin ? '/admin-dashboard' : '/dashboard',
      actionText: 'View Dashboard',
      ...options
    });
  }, [addNotification]);

  // Zoom meeting notification
  const addZoomMeetingNotification = useCallback((meetingInfo, action = 'created', options = {}) => {
    const actionMessages = {
      created: 'Meeting created',
      started: 'Meeting started',
      ended: 'Meeting ended',
      updated: 'Meeting updated'
    };

    const priorities = {
      created: NOTIFICATION_PRIORITIES.MEDIUM,
      started: NOTIFICATION_PRIORITIES.HIGH,
      ended: NOTIFICATION_PRIORITIES.LOW,
      updated: NOTIFICATION_PRIORITIES.LOW
    };

    return addNotification({
      title: `Zoom ${actionMessages[action] || 'Meeting Update'}`,
      message: `"${meetingInfo.topic}" ${actionMessages[action] || 'was updated'} by ${meetingInfo.createdBy || meetingInfo.hostName || 'admin'}`,
      category: NOTIFICATION_CATEGORIES.ZOOM,
      priority: priorities[action] || NOTIFICATION_PRIORITIES.MEDIUM,
      metadata: {
        meetingId: meetingInfo.id,
        topic: meetingInfo.topic,
        agenda: meetingInfo.agenda,
        startTime: meetingInfo.startTime,
        duration: meetingInfo.duration,
        joinUrl: meetingInfo.joinUrl,
        meetingPassword: meetingInfo.password,
        hostId: meetingInfo.hostId,
        hostName: meetingInfo.hostName,
        createdBy: meetingInfo.createdBy,
        action: action,
        participantCount: meetingInfo.participantCount,
        timestamp: new Date().toISOString()
      },
      actionUrl: action === 'ended' ? '/admin-dashboard/zoom-integration' : meetingInfo.joinUrl,
      actionText: action === 'ended' ? 'View Details' : 'Join Meeting',
      persistent: action === 'created' || action === 'started',
      ...options
    });
  }, [addNotification]);

  // QR Code scan notification
  const addQRCodeNotification = useCallback((scanInfo, options = {}) => {
    const timestamp = new Date().toLocaleString();
    
    return addNotification({
      title: 'QR Code Scanned',
      message: `${scanInfo.studentName} (${scanInfo.studentId}) marked attendance via QR scan at ${timestamp}`,
      category: NOTIFICATION_CATEGORIES.QR_CODE,
      priority: NOTIFICATION_PRIORITIES.MEDIUM,
      metadata: {
        studentId: scanInfo.studentId,
        studentName: scanInfo.studentName,
        studentEmail: scanInfo.studentEmail,
        qrCodeId: scanInfo.qrCodeId,
        qrGeneratedBy: scanInfo.qrGeneratedBy,
        scanLocation: {
          latitude: scanInfo.latitude,
          longitude: scanInfo.longitude,
          distance: scanInfo.distance
        },
        attendanceStatus: scanInfo.attendanceStatus || 'present',
        scanTime: timestamp,
        meetingId: scanInfo.meetingId,
        deviceInfo: scanInfo.deviceInfo
      },
      actionUrl: '/dashboard/attendance-logs',
      actionText: 'View Attendance',
      ...options
    });
  }, [addNotification]);

  // Store notification to backend (optional persistence)
  const storeNotification = useCallback(async (notification) => {
    try {
      // Only store important notifications to avoid spam
      const shouldStore = notification.persistent || 
                         notification.priority === NOTIFICATION_PRIORITIES.HIGH ||
                         notification.priority === NOTIFICATION_PRIORITIES.URGENT ||
                         notification.category === NOTIFICATION_CATEGORIES.SIGNIN ||
                         notification.category === NOTIFICATION_CATEGORIES.ZOOM ||
                         notification.category === NOTIFICATION_CATEGORIES.QR_CODE;
      
      if (shouldStore) {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const token = Cookies.get('token') || Cookies.get('authToken');
        
        if (token) {
          await axios.post(`${apiBaseUrl}/notifications`, notification, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
        }
      }
    } catch (error) {
      console.warn('Failed to store notification to backend:', error);
      // Continue without backend storage - notification still works locally
    }
  }, []);

  // Enhanced add notification that also stores to backend
  const addNotificationWithStorage = useCallback(async (notification) => {
    const id = addNotification(notification);
    
    // Store to backend asynchronously
    const notificationWithId = { ...notification, id };
    await storeNotification(notificationWithId);
    
    return id;
  }, [addNotification, storeNotification]);

  // Auto-cleanup old notifications
  useEffect(() => {
    const cleanup = setInterval(() => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      setNotifications(prev => 
        prev.filter(n => n.persistent || n.timestamp > weekAgo)
      );
    }, 24 * 60 * 60 * 1000); // Daily cleanup

    return () => clearInterval(cleanup);
  }, []);

  const contextValue = {
    notifications,
    settings,
    addNotification,
    addAttendanceNotification,
    addStudentNotification,
    addSystemNotification,
    addReportNotification,
    addScheduleNotification,
    addUrgentNotification,
    addSignInNotification,
    addZoomMeetingNotification,
    addQRCodeNotification,
    addNotificationWithStorage,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    getUnreadCount,
    getNotificationsByCategory,
    updateSettings,
    // Export constants for easy access
    NOTIFICATION_CATEGORIES,
    NOTIFICATION_PRIORITIES
  };

  return (
    <NotificationSystemContext.Provider value={contextValue}>
      {children}
    </NotificationSystemContext.Provider>
  );
};

// Enhanced Notification Menu Component
export const NotificationMenu = ({ anchorEl, open, onClose }) => {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll,
    getUnreadCount 
  } = useNotificationSystem();
  const theme = useTheme();

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
    onClose();
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const recentNotifications = notifications.slice(0, 10);

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 380,
          maxHeight: 500,
          overflow: 'hidden',
          borderRadius: 2,
          boxShadow: theme.shadows[8],
        }
      }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            Notifications
          </Typography>
          <Box display="flex" gap={1}>
            {getUnreadCount() > 0 && (
              <Button
                size="small"
                onClick={markAllAsRead}
                startIcon={<MarkEmailRead />}
              >
                Mark all read
              </Button>
            )}
            <Button
              size="small"
              color="error"
              onClick={clearAll}
              startIcon={<Clear />}
            >
              Clear all
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Notifications List */}
      <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
        {recentNotifications.length === 0 ? (
          <MenuItem disabled>
            <ListItemIcon>
              <NotificationsNoneIcon color="disabled" />
            </ListItemIcon>
            <ListItemText 
              primary="No notifications" 
              secondary="You're all caught up!"
            />
          </MenuItem>
        ) : (
          recentNotifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                py: 1.5,
                px: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                backgroundColor: !notification.read ? 'action.selected' : 'transparent',
                '&:hover': {
                  backgroundColor: !notification.read ? 'action.hover' : 'action.hover',
                },
              }}
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: notification.read ? 'grey.300' : 'primary.main',
                    width: 36,
                    height: 36,
                  }}
                >
                  {getNotificationIcon(notification.category, notification.priority)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: !notification.read ? 600 : 400,
                        flex: 1,
                      }}
                    >
                      {notification.title}
                    </Typography>
                    <Chip
                      label={notification.priority}
                      size="small"
                      color={getPriorityColor(notification.priority)}
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  </Box>
                }
                secondary={
                  <Box mt={0.5}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      {notification.message}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: '0.7rem' }}
                    >
                      {formatTimeAgo(notification.timestamp)}
                    </Typography>
                  </Box>
                }
              />
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(notification.id);
                }}
                sx={{ ml: 1 }}
              >
                <Clear fontSize="small" />
              </IconButton>
            </MenuItem>
          ))
        )}
      </Box>
    </Menu>
  );
};

// Enhanced Notification Bell Component with Dynamic Features
export const NotificationBell = () => {
  const { 
    getUnreadCount, 
    notifications, 
    getNotificationsByCategory,
    NOTIFICATION_PRIORITIES 
  } = useNotificationSystem();
  const [anchorEl, setAnchorEl] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const unreadCount = getUnreadCount();
  const urgentCount = notifications.filter(n => !n.read && n.priority === NOTIFICATION_PRIORITIES.URGENT).length;
  const highCount = notifications.filter(n => !n.read && n.priority === NOTIFICATION_PRIORITIES.HIGH).length;
  
  // Enhanced badge color based on priority
  const getBadgeColor = () => {
    if (urgentCount > 0) return 'error';
    if (highCount > 0) return 'warning';
    if (unreadCount > 0) return 'primary';
    return 'default';
  };

  // Enhanced tooltip with breakdown
  const getTooltipTitle = () => {
    if (unreadCount === 0) return 'No new notifications';
    
    let tooltip = `${unreadCount} notification${unreadCount > 1 ? 's' : ''}`;
    if (urgentCount > 0) tooltip += ` • ${urgentCount} urgent`;
    if (highCount > 0) tooltip += ` • ${highCount} high priority`;
    
    return tooltip;
  };

  // Trigger shake animation for urgent notifications
  useEffect(() => {
    if (urgentCount > 0) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [urgentCount]);

  return (
    <>
      <Tooltip title={getTooltipTitle()}>
        <IconButton
          color="inherit"
          onClick={handleClick}
          sx={{
            position: 'relative',
            transition: 'all 0.2s',
            animation: isShaking ? 'shake 0.5s ease-in-out' : 'none',
            '&:hover': {
              backgroundColor: 'action.hover',
              transform: 'scale(1.05)',
            },
            '@keyframes shake': {
              '0%, 100%': { transform: 'translateX(0)' },
              '25%': { transform: 'translateX(-2px)' },
              '75%': { transform: 'translateX(2px)' },
            },
          }}
        >
          <Badge 
            badgeContent={unreadCount} 
            color={getBadgeColor()} 
            max={99}
            overlap="circular"
            sx={{
              '& .MuiBadge-badge': {
                animation: unreadCount > 0 ? (
                  urgentCount > 0 ? 'urgentPulse 1s ease-in-out infinite' : 
                  'pulse 2s ease-in-out infinite'
                ) : 'none',
                fontSize: unreadCount > 9 ? '0.7rem' : '0.75rem',
                minWidth: unreadCount > 99 ? '24px' : '20px',
                height: unreadCount > 99 ? '24px' : '20px',
                '@keyframes pulse': {
                  '0%': {
                    transform: 'scale(1)',
                    opacity: 1,
                  },
                  '50%': {
                    transform: 'scale(1.1)',
                    opacity: 0.8,
                  },
                  '100%': {
                    transform: 'scale(1)',
                    opacity: 1,
                  },
                },
                '@keyframes urgentPulse': {
                  '0%': {
                    transform: 'scale(1)',
                    boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.7)',
                  },
                  '70%': {
                    transform: 'scale(1.2)',
                    boxShadow: '0 0 0 10px rgba(244, 67, 54, 0)',
                  },
                  '100%': {
                    transform: 'scale(1)',
                    boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)',
                  },
                },
              },
            }}
          >
            <NotificationsIcon 
              sx={{
                color: unreadCount > 0 ? (
                  urgentCount > 0 ? 'error.main' :
                  highCount > 0 ? 'warning.main' :
                  'primary.main'
                ) : 'inherit',
                transition: 'color 0.3s ease-in-out',
              }}
            />
          </Badge>
          
          {/* Urgent notification indicator dot */}
          {urgentCount > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 8,
                height: 8,
                backgroundColor: 'error.main',
                borderRadius: '50%',
                animation: 'blink 1s ease-in-out infinite',
                '@keyframes blink': {
                  '0%, 50%': { opacity: 1 },
                  '51%, 100%': { opacity: 0 },
                },
              }}
            />
          )}
        </IconButton>
      </Tooltip>
      
      <NotificationMenu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      />
    </>
  );
};

export default NotificationSystemProvider;
