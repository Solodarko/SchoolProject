import { useState, useCallback, useRef } from 'react';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const notificationIdCounter = useRef(0);

  // Show a notification
  const showNotification = useCallback((message, type = 'info', options = {}) => {
    const id = ++notificationIdCounter.current;
    const notification = {
      id,
      message,
      type, // 'success', 'error', 'warning', 'info'
      show: true,
      autoHide: options.autoHide !== false, // default to true
      timestamp: new Date(),
      duration: options.duration || 4000
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-hide notification if autoHide is enabled
    if (notification.autoHide) {
      setTimeout(() => {
        hideNotification(id);
      }, notification.duration);
    }

    return id;
  }, []);

  // Hide a specific notification
  const hideNotification = useCallback((id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, show: false }
          : notification
      )
    );

    // Remove from state after animation completes
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 300);
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Show success notification
  const showSuccess = useCallback((message, options = {}) => {
    return showNotification(message, 'success', options);
  }, [showNotification]);

  // Show error notification
  const showError = useCallback((message, options = {}) => {
    return showNotification(message, 'error', { ...options, autoHide: false });
  }, [showNotification]);

  // Show warning notification
  const showWarning = useCallback((message, options = {}) => {
    return showNotification(message, 'warning', options);
  }, [showNotification]);

  // Show info notification
  const showInfo = useCallback((message, options = {}) => {
    return showNotification(message, 'info', options);
  }, [showNotification]);

  return {
    // State
    notifications: notifications.filter(n => n.show),
    allNotifications: notifications,
    
    // Actions
    showNotification,
    hideNotification,
    clearNotifications,
    
    // Convenience methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
    
    // Stats
    notificationCount: notifications.filter(n => n.show).length
  };
};
