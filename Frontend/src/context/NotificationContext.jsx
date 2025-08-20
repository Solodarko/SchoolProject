import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Snackbar, Alert, AlertTitle, Slide, Zoom, Fade } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Notification positions
export const NOTIFICATION_POSITIONS = {
  TOP_RIGHT: { vertical: 'top', horizontal: 'right' },
  TOP_LEFT: { vertical: 'top', horizontal: 'left' },
  TOP_CENTER: { vertical: 'top', horizontal: 'center' },
  BOTTOM_RIGHT: { vertical: 'bottom', horizontal: 'right' },
  BOTTOM_LEFT: { vertical: 'bottom', horizontal: 'left' },
  BOTTOM_CENTER: { vertical: 'bottom', horizontal: 'center' }
};

// Notification animations
export const NOTIFICATION_ANIMATIONS = {
  SLIDE: 'slide',
  ZOOM: 'zoom',
  FADE: 'fade'
};

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Transition components
const SlideTransition = (props) => <Slide {...props} direction="left" />;
const ZoomTransition = (props) => <Zoom {...props} />;
const FadeTransition = (props) => <Fade {...props} />;

const getTransitionComponent = (animation) => {
  switch (animation) {
    case NOTIFICATION_ANIMATIONS.SLIDE:
      return SlideTransition;
    case NOTIFICATION_ANIMATIONS.ZOOM:
      return ZoomTransition;
    case NOTIFICATION_ANIMATIONS.FADE:
      return FadeTransition;
    default:
      return SlideTransition;
  }
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [globalSettings, setGlobalSettings] = useState({
    duration: 6000,
    position: NOTIFICATION_POSITIONS.TOP_RIGHT,
    animation: NOTIFICATION_ANIMATIONS.SLIDE,
    preventDuplicate: true,
    maxNotifications: 3
  });
  const theme = useTheme();

  // Generate unique ID for notifications
  const generateId = useCallback(() => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }, []);

  // Add notification
  const addNotification = useCallback((notification) => {
    const id = generateId();
    const newNotification = {
      id,
      type: NOTIFICATION_TYPES.INFO,
      title: '',
      message: '',
      duration: globalSettings.duration,
      position: globalSettings.position,
      animation: globalSettings.animation,
      action: null,
      persistent: false,
      ...notification,
      timestamp: new Date()
    };

    setNotifications((prev) => {
      // Prevent duplicate notifications if enabled
      if (globalSettings.preventDuplicate) {
        const isDuplicate = prev.some(n => 
          n.message === newNotification.message && 
          n.type === newNotification.type &&
          Date.now() - n.timestamp.getTime() < 5000 // Within 5 seconds
        );
        if (isDuplicate) return prev;
      }

      // Limit max notifications
      const updated = [...prev, newNotification];
      if (updated.length > globalSettings.maxNotifications) {
        return updated.slice(-globalSettings.maxNotifications);
      }
      return updated;
    });

    return id;
  }, [generateId, globalSettings]);

  // Remove notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const success = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      message,
      ...options
    });
  }, [addNotification]);

  const error = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      message,
      duration: 8000, // Longer duration for errors
      ...options
    });
  }, [addNotification]);

  const warning = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      message,
      ...options
    });
  }, [addNotification]);

  const info = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.INFO,
      message,
      ...options
    });
  }, [addNotification]);

  // Update global settings
  const updateSettings = useCallback((newSettings) => {
    setGlobalSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Auto-remove notifications after duration
  useEffect(() => {
    const timers = notifications
      .filter(n => !n.persistent && n.duration > 0)
      .map(notification => {
        return setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);
      });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications, removeNotification]);

  const contextValue = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info,
    updateSettings,
    globalSettings
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {/* Render notifications grouped by position */}
      {Object.values(NOTIFICATION_POSITIONS).map(position => {
        const positionNotifications = notifications.filter(n => 
          n.position.vertical === position.vertical && 
          n.position.horizontal === position.horizontal
        );

        return positionNotifications.map(notification => {
          const TransitionComponent = getTransitionComponent(notification.animation);
          
          return (
            <Snackbar
              key={notification.id}
              open={true}
              anchorOrigin={notification.position}
              TransitionComponent={TransitionComponent}
              onClose={() => removeNotification(notification.id)}
              autoHideDuration={notification.persistent ? null : notification.duration}
              sx={{
                '& .MuiSnackbarContent-root': {
                  padding: 0,
                },
                zIndex: theme.zIndex.snackbar + notifications.indexOf(notification)
              }}
            >
              <Alert
                severity={notification.type}
                onClose={() => removeNotification(notification.id)}
                variant="filled"
                sx={{
                  minWidth: 300,
                  maxWidth: 500,
                  boxShadow: theme.shadows[8],
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    width: '100%',
                  },
                  '& .MuiAlert-action': {
                    alignItems: 'flex-start',
                    paddingTop: 0,
                  },
                  animation: 'slideInRight 0.3s ease-out',
                  '@keyframes slideInRight': {
                    from: {
                      transform: 'translateX(100%)',
                      opacity: 0,
                    },
                    to: {
                      transform: 'translateX(0)',
                      opacity: 1,
                    },
                  },
                }}
                action={notification.action}
              >
                {notification.title && (
                  <AlertTitle sx={{ fontWeight: 600, mb: 0.5 }}>
                    {notification.title}
                  </AlertTitle>
                )}
                {notification.message}
              </Alert>
            </Snackbar>
          );
        });
      })}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
