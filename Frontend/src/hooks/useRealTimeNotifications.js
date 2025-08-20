import { useEffect, useRef, useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useNotificationSystem } from '../context/NotificationSystem';
import notificationService from '../services/NotificationService';

export const useRealTimeNotifications = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    reconnectAttempts: 0,
    socket: false
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const notificationStore = useNotification();
  const systemNotifications = useNotificationSystem();
  const initializationRef = useRef(false);

  // Initialize the notification service
  useEffect(() => {
    if (!initializationRef.current && notificationStore && systemNotifications) {
      initializationRef.current = true;
      
      // Initialize the notification service
      notificationService.initialize(notificationStore, systemNotifications);
      setIsInitialized(true);

      // Listen for connection status changes
      const handleConnectionChange = () => {
        setConnectionStatus(notificationService.getConnectionStatus());
      };

      notificationService.on('connected', handleConnectionChange);
      notificationService.on('disconnected', handleConnectionChange);

      return () => {
        notificationService.off('connected', handleConnectionChange);
        notificationService.off('disconnected', handleConnectionChange);
      };
    }
  }, [notificationStore, systemNotifications]);

  // Update connection status periodically
  useEffect(() => {
    if (isInitialized) {
      const interval = setInterval(() => {
        setConnectionStatus(notificationService.getConnectionStatus());
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isInitialized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (initializationRef.current) {
        notificationService.disconnect();
      }
    };
  }, []);

  // Methods to expose
  const methods = {
    // Connection methods
    connect: () => notificationService.connect(),
    disconnect: () => notificationService.disconnect(),
    testConnection: () => notificationService.testConnection(),
    
    // Notification methods
    requestHistory: (limit) => notificationService.requestNotificationHistory(limit),
    markAsRead: (ids) => notificationService.markAsRead(ids),
    updatePreferences: (prefs) => notificationService.updatePreferences(prefs),
    subscribe: (types) => notificationService.subscribe(types),
    unsubscribe: (types) => notificationService.unsubscribe(types),
    
    // Event listeners
    on: (event, callback) => notificationService.on(event, callback),
    off: (event, callback) => notificationService.off(event, callback),
    
    // Status
    getConnectionStatus: () => notificationService.getConnectionStatus(),
    isConnected: () => connectionStatus.connected,
    
    // Service instance
    service: notificationService
  };

  return {
    ...methods,
    connectionStatus,
    isInitialized
  };
};

// Hook for listening to specific notification events
export const useNotificationListener = (event, callback) => {
  const { service } = useRealTimeNotifications();

  useEffect(() => {
    if (service && callback) {
      service.on(event, callback);
      
      return () => {
        service.off(event, callback);
      };
    }
  }, [service, event, callback]);
};

// Hook for connection status
export const useConnectionStatus = () => {
  const { connectionStatus, isInitialized } = useRealTimeNotifications();
  
  return {
    ...connectionStatus,
    isInitialized,
    isOnline: connectionStatus.connected && connectionStatus.socket
  };
};

export default useRealTimeNotifications;
