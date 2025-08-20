import { io } from 'socket.io-client';
import Cookies from 'js-cookie';

class NotificationService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.notificationStore = null;
    this.systemNotifications = null;
  }

  // Initialize the service with notification contexts
  initialize(notificationStore, systemNotifications) {
    this.notificationStore = notificationStore;
    this.systemNotifications = systemNotifications;
    
    // Check if WebSockets are enabled via environment variables
    const enableWebsockets = process.env?.REACT_APP_ENABLE_WEBSOCKETS === 'true';
    
    if (enableWebsockets) {
      this.connect();
    } else {
      console.log('WebSocket notifications disabled via environment configuration.');
      this.isConnected = false;
    }
  }

  // Connect to WebSocket server
  async connect() {
    try {
      // Check if backend is available before attempting connection
      const isBackendAvailable = await this.checkBackendAvailability();
      
      if (!isBackendAvailable) {
        console.log('Backend not available. Running in offline mode without WebSocket notifications.');
        this.isConnected = false;
        return;
      }
      
      const token = Cookies.get('authToken');
      const username = Cookies.get('username');
      const userRole = Cookies.get('userRole');
      
      if (!token) {
        console.warn('No authentication token found. Cannot connect to notifications.');
        return;
      }

      // Connect to your backend WebSocket server
      this.socket = io('ws://localhost:5000', {
        auth: {
          token: token,
          username: username,
          userRole: userRole
        },
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 5000, // Reduced timeout
        forceNew: true,
        autoConnect: false // Prevent auto-reconnection loops
      });

      this.setupEventListeners();
      this.socket.connect();
      
    } catch (error) {
      console.error('Failed to connect to notification service:', error);
      this.isConnected = false;
      // Don't auto-reconnect if backend is not available
      if (error.code !== 'ECONNREFUSED') {
        this.handleReconnect();
      }
    }
  }

  // Setup WebSocket event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to notification service');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from notification service:', reason);
      this.isConnected = false;
      this.emit('disconnected', reason);
      
      // Only reconnect if not intentionally disconnected
      if (reason !== 'io client disconnect') {
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.log('WebSocket connection failed:', error.message);
      this.isConnected = false;
      
      // Only attempt reconnect for non-ECONNREFUSED errors
      if (error.code !== 'ECONNREFUSED' && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.handleReconnect();
      } else {
        console.log('Backend not available. Operating in offline mode.');
      }
    });

    // Notification events
    this.socket.on('notification', (data) => {
      this.handleIncomingNotification(data);
    });

    this.socket.on('student_added', (data) => {
      this.handleStudentAdded(data);
    });

    this.socket.on('student_updated', (data) => {
      this.handleStudentUpdated(data);
    });

    this.socket.on('student_deleted', (data) => {
      this.handleStudentDeleted(data);
    });

    this.socket.on('attendance_recorded', (data) => {
      this.handleAttendanceRecorded(data);
    });

    this.socket.on('attendance_updated', (data) => {
      this.handleAttendanceUpdated(data);
    });

    this.socket.on('system_alert', (data) => {
      this.handleSystemAlert(data);
    });

    this.socket.on('report_generated', (data) => {
      this.handleReportGenerated(data);
    });

    this.socket.on('schedule_updated', (data) => {
      this.handleScheduleUpdated(data);
    });

    // Bulk notifications
    this.socket.on('bulk_notifications', (notifications) => {
      notifications.forEach(notification => {
        this.handleIncomingNotification(notification);
      });
    });

    // User-specific events
    this.socket.on('user_notification', (data) => {
      this.handleUserNotification(data);
    });
  }

  // Handle incoming notifications
  handleIncomingNotification(data) {
    if (!this.notificationStore || !this.systemNotifications) return;

    const notification = {
      id: data.id || Date.now().toString(),
      title: data.title || 'New Notification',
      message: data.message || '',
      type: data.type || 'info',
      category: data.category || 'general',
      priority: data.priority || 'medium',
      timestamp: new Date(data.timestamp || Date.now()),
      actionUrl: data.actionUrl,
      actionText: data.actionText,
      persistent: data.persistent || false,
      userId: data.userId,
      read: false
    };

    // Show toast notification for immediate feedback
    if (this.notificationStore) {
      switch (notification.type) {
        case 'success':
          this.notificationStore.success(notification.message, {
            title: notification.title,
            duration: 5000
          });
          break;
        case 'error':
          this.notificationStore.error(notification.message, {
            title: notification.title,
            duration: 8000
          });
          break;
        case 'warning':
          this.notificationStore.warning(notification.message, {
            title: notification.title,
            duration: 6000
          });
          break;
        default:
          this.notificationStore.info(notification.message, {
            title: notification.title,
            duration: 5000
          });
      }
    }

    // Add to system notifications
    if (this.systemNotifications) {
      this.systemNotifications.addNotification(notification);
    }

    // Emit to listeners
    this.emit('notification_received', notification);
  }

  // Handle specific notification types
  handleStudentAdded(data) {
    if (!this.systemNotifications) return;

    this.systemNotifications.addStudentNotification(
      `New student ${data.firstName} ${data.lastName} has been registered`,
      {
        priority: 'medium',
        actionText: 'View Student',
        actionUrl: `/dashboard/students/${data.studentId}`,
        category: 'student'
      }
    );

    // Show toast
    if (this.notificationStore) {
      this.notificationStore.success(`Student ${data.firstName} ${data.lastName} registered successfully`);
    }
  }

  handleStudentUpdated(data) {
    if (!this.systemNotifications) return;

    this.systemNotifications.addStudentNotification(
      `Student ${data.firstName} ${data.lastName} information has been updated`,
      {
        priority: 'low',
        actionText: 'View Student',
        actionUrl: `/dashboard/students/${data.studentId}`,
        category: 'student'
      }
    );
  }

  handleStudentDeleted(data) {
    if (!this.systemNotifications) return;

    this.systemNotifications.addStudentNotification(
      `Student ${data.firstName} ${data.lastName} has been removed from the system`,
      {
        priority: 'medium',
        category: 'student'
      }
    );

    // Show toast
    if (this.notificationStore) {
      this.notificationStore.warning(`Student ${data.firstName} ${data.lastName} has been deleted`);
    }
  }

  handleAttendanceRecorded(data) {
    if (!this.systemNotifications) return;

    this.systemNotifications.addAttendanceNotification(
      `Attendance recorded for ${data.studentName} at ${new Date(data.timestamp).toLocaleTimeString()}`,
      {
        priority: 'low',
        actionText: 'View Attendance',
        actionUrl: '/dashboard/attendance',
        category: 'attendance'
      }
    );
  }

  handleAttendanceUpdated(data) {
    if (!this.systemNotifications) return;

    this.systemNotifications.addAttendanceNotification(
      `Attendance updated for ${data.studentName}`,
      {
        priority: 'medium',
        actionText: 'View Attendance',
        actionUrl: '/dashboard/attendance',
        category: 'attendance'
      }
    );
  }

  handleSystemAlert(data) {
    if (!this.systemNotifications) return;

    this.systemNotifications.addSystemNotification(
      data.message,
      {
        priority: data.priority || 'high',
        persistent: data.persistent || false,
        category: 'system'
      }
    );

    // Show toast for urgent alerts
    if (data.priority === 'urgent' && this.notificationStore) {
      this.notificationStore.error(data.message, {
        title: 'System Alert',
        duration: 10000
      });
    }
  }

  handleReportGenerated(data) {
    if (!this.systemNotifications) return;

    this.systemNotifications.addReportNotification(
      `${data.reportType} report has been generated`,
      {
        priority: 'medium',
        actionText: 'Download Report',
        actionUrl: data.downloadUrl,
        category: 'report'
      }
    );

    // Show toast
    if (this.notificationStore) {
      this.notificationStore.success(`${data.reportType} report is ready for download`);
    }
  }

  handleScheduleUpdated(data) {
    if (!this.systemNotifications) return;

    this.systemNotifications.addScheduleNotification(
      `Schedule has been updated for ${data.className || 'class'}`,
      {
        priority: 'medium',
        actionText: 'View Schedule',
        actionUrl: '/dashboard/schedule',
        category: 'schedule'
      }
    );
  }

  handleUserNotification(data) {
    if (!this.systemNotifications) return;

    this.systemNotifications.addNotification({
      title: data.title || 'Personal Notification',
      message: data.message,
      category: data.category || 'general',
      priority: data.priority || 'medium',
      actionUrl: data.actionUrl,
      actionText: data.actionText
    });
  }

  // Check backend availability
  async checkBackendAvailability() {
    try {
      const response = await fetch('http://localhost:5000/health', {
        method: 'GET',
        timeout: 3000
      });
      return response.ok;
    } catch (error) {
      console.log('Backend health check failed:', error.message);
      return false;
    }
  }

  // Handle reconnection
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached. Switching to offline mode.');
      this.isConnected = false;
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000); // Max 30 seconds
    
    console.log(`Attempting to reconnect in ${delay}ms... (Attempt ${this.reconnectAttempts})`);
    
    setTimeout(async () => {
      // Check if backend is available before reconnecting
      const isBackendAvailable = await this.checkBackendAvailability();
      if (isBackendAvailable) {
        this.connect();
      } else {
        console.log('Backend still not available. Stopping reconnection attempts.');
        this.isConnected = false;
      }
    }, delay);
  }

  // Send message to server
  emit(event, data) {
    // First emit to socket if connected
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
    
    // Then emit to custom listeners
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in notification listener:', error);
        }
      });
    }
  }

  // Listen for custom events
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  // Request notification history
  requestNotificationHistory(limit = 50) {
    if (this.socket && this.isConnected) {
      this.socket.emit('get_notification_history', { limit });
    }
  }

  // Mark notifications as read on server
  markAsRead(notificationIds) {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_notifications_read', { ids: notificationIds });
    }
  }

  // Update notification preferences
  updatePreferences(preferences) {
    if (this.socket && this.isConnected) {
      this.socket.emit('update_notification_preferences', preferences);
    }
  }

  // Subscribe to specific notification types
  subscribe(types) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe_notifications', { types });
    }
  }

  // Unsubscribe from notification types
  unsubscribe(types) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe_notifications', { types });
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      socket: this.socket ? this.socket.connected : false
    };
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.listeners.clear();
  }

  // Test connection
  testConnection() {
    if (this.socket && this.isConnected) {
      this.socket.emit('ping', { timestamp: Date.now() });
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
