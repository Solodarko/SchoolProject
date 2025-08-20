import { io } from 'socket.io-client';

class RealTimeService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
    this.notifications = [];
    this.currentMeetingId = null;
    this.isConnecting = false;
    this.initialized = false; // Track if service has been initialized
    this.reconnectTimeout = null;
    this.connectionAttempts = 1; // Start from 1 to align with useEffect logic
    
    // Configuration
    this.config = {
      serverUrl: import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000',
      reconnectionAttempts: 10, // Increased attempts
      reconnectionDelay: 2000, // Increased initial delay
      timeout: 10000, // Increased timeout
      maxReconnectionDelay: 30000, // Increased max delay
      healthCheckUrl: (import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:5000') + '/api/health',
      maxConnectionAttempts: 10 // Add explicit max connection attempts
    };

    // Don't auto-connect, let components decide when to connect
    // this.connect();
  }

  // Prevent multiple connection attempts
  preventMultipleConnections() {
    if (this.isConnecting || this.connected) {
      console.warn('⚠️ Connection already in progress or established');
      return false;
    }
    
    // Add a small delay to prevent rapid successive calls
    if (this.lastConnectionAttempt && Date.now() - this.lastConnectionAttempt < 1000) {
      console.warn('⚠️ Connection attempt too soon after last attempt');
      return false;
    }
    
    this.lastConnectionAttempt = Date.now();
    return true;
  }

  // Connect to Socket.IO server
  connect() {
    // Prevent multiple simultaneous connection attempts
    if (!this.preventMultipleConnections()) {
      return this.socket;
    }

    this.isConnecting = true;
    this.connectionAttempts++;

    try {
      console.log(`🔗 Connecting to real-time server (attempt ${this.connectionAttempts}):`, this.config.serverUrl);
      
    // Clear any existing socket first
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
      
    this.socket = io(this.config.serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: false, // Manual connect for better control
      reconnection: false, // Handle reconnection manually
      timeout: this.config.timeout,
      forceNew: true, // Force new connection to avoid conflicts
      withCredentials: true,
      upgrade: true,
      rememberUpgrade: false // Don't remember upgrades to avoid conflicts
    });

    this.socket.connect(); // Explicit connect call
    this.setupEventListeners();
    
      return this.socket;
    } catch (error) {
      console.error('❌ Failed to connect to real-time server:', error);
      this.isConnecting = false;
      this.handleConnectionError(error);
      throw error;
    }
  }

  // Setup core event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to real-time server');
      this.connected = true;
      this.isConnecting = false;
      const isInitialConnection = this.connectionAttempts === 1; // First successful connection
      this.connectionAttempts = 0; // Reset attempts on successful connection
      // Show notification for initial connection and after reconnection attempts
      this.emit('connectionStatus', { 
        connected: true, 
        silent: false, // Always show connection notifications
        isInitial: isInitialConnection 
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from real-time server:', reason);
      this.connected = false;
      this.isConnecting = false;
      // Only show disconnect notification for unexpected disconnections
      const isUnexpected = reason !== 'io client disconnect' && reason !== 'transport close';
      this.emit('connectionStatus', { connected: false, reason, silent: !isUnexpected });
      
      // Only attempt reconnection for certain disconnect reasons
      if (reason === 'io server disconnect' || reason === 'transport close') {
        this.attemptReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      this.connected = false;
      this.isConnecting = false;
      // Only emit error for the first few attempts to avoid spam
      const shouldNotify = this.connectionAttempts <= 2;
      this.emit('connectionError', { ...error, silent: !shouldNotify });
      this.handleConnectionError(error);
    });

    // Real-time notifications
    this.socket.on('notification', (notification) => {
      console.log('📢 Real-time notification:', notification);
      this.notifications.unshift(notification);
      // Keep only last 100 notifications
      if (this.notifications.length > 100) {
        this.notifications = this.notifications.slice(0, 100);
      }
      this.emit('notification', notification);
    });

    // Meeting events
    this.socket.on('meetingCreated', (data) => {
      console.log('🎥 Meeting created:', data);
      this.emit('meetingCreated', data);
    });

    this.socket.on('meetingEnded', (data) => {
      console.log('🔚 Meeting ended:', data);
      this.emit('meetingEnded', data);
    });

    this.socket.on('meetingEventUpdate', (data) => {
      console.log('📋 Meeting event update:', data);
      this.emit('meetingEventUpdate', data);
    });

    // Participant events
    this.socket.on('participantJoined', (data) => {
      console.log('👋 Participant joined:', data);
      this.emit('participantJoined', data);
    });

    this.socket.on('participantLeft', (data) => {
      console.log('👋 Participant left:', data);
      this.emit('participantLeft', data);
    });

    this.socket.on('participantStatusUpdate', (data) => {
      console.log('📊 Participant status update:', data);
      this.emit('participantStatusUpdate', data);
    });

    this.socket.on('participantUpdate', (data) => {
      console.log('🔄 Participant update:', data);
      this.emit('participantUpdate', data);
    });

    // Link click events
    this.socket.on('linkClicked', (data) => {
      console.log('🔗 Link clicked:', data);
      this.emit('linkClicked', data);
    });

    // Room events
    this.socket.on('userJoinedRoom', (data) => {
      console.log('🏠 User joined room:', data);
      this.emit('userJoinedRoom', data);
    });

    this.socket.on('userLeftRoom', (data) => {
      console.log('🏠 User left room:', data);
      this.emit('userLeftRoom', data);
    });

    // Analytics events
    this.socket.on('analyticsUpdate', (data) => {
      console.log('📈 Analytics update:', data);
      this.emit('analyticsUpdate', data);
    });

    // Initial state
    this.socket.on('initialState', (data) => {
      console.log('🎯 Initial state received:', data);
      if (data.recentNotifications) {
        this.notifications = data.recentNotifications;
      }
      this.emit('initialState', data);
    });

    // Notifications cleared
    this.socket.on('notificationsCleared', (data) => {
      console.log('🧹 Notifications cleared');
      this.notifications = [];
      this.emit('notificationsCleared', data);
    });
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Meeting room management
  joinMeeting(meetingId) {
    if (!this.socket || !this.connected) {
      console.warn('⚠️ Socket not connected, cannot join meeting');
      return false;
    }

    console.log(`🏠 Joining meeting room: ${meetingId}`);
    this.currentMeetingId = meetingId;
    this.socket.emit('joinMeeting', meetingId);
    return true;
  }

  leaveMeeting(meetingId = null) {
    if (!this.socket || !this.connected) {
      console.warn('⚠️ Socket not connected, cannot leave meeting');
      return false;
    }

    const targetMeetingId = meetingId || this.currentMeetingId;
    if (targetMeetingId) {
      console.log(`🚪 Leaving meeting room: ${targetMeetingId}`);
      this.socket.emit('leaveMeeting', targetMeetingId);
      if (meetingId === this.currentMeetingId || !meetingId) {
        this.currentMeetingId = null;
      }
    }
    return true;
  }

  // Send participant updates
  updateParticipant(meetingId, participantData) {
    if (!this.socket || !this.connected) {
      console.warn('⚠️ Socket not connected, cannot update participant');
      return false;
    }

    console.log('📤 Sending participant update:', { meetingId, participantData });
    this.socket.emit('participantUpdate', { meetingId, participantData });
    return true;
  }

  // Send meeting events
  sendMeetingEvent(meetingId, eventType, eventData) {
    if (!this.socket || !this.connected) {
      console.warn('⚠️ Socket not connected, cannot send meeting event');
      return false;
    }

    console.log('📤 Sending meeting event:', { meetingId, eventType, eventData });
    this.socket.emit('meetingEvent', { meetingId, eventType, eventData });
    return true;
  }

  // Request analytics
  requestAnalytics(meetingId) {
    if (!this.socket || !this.connected) {
      console.warn('⚠️ Socket not connected, cannot request analytics');
      return false;
    }

    console.log('📈 Requesting analytics for meeting:', meetingId);
    this.socket.emit('getAnalytics', meetingId);
    return true;
  }

  // Get connection status
  isConnected() {
    return this.connected && this.socket?.connected;
  }

  // Get notifications
  getNotifications() {
    return this.notifications;
  }

  // Clear notifications locally
  clearNotifications() {
    this.notifications = [];
  }

  // Handle connection errors with improved logic
  handleConnectionError(error) {
    console.log(`🔄 Connection error handled (attempt ${this.connectionAttempts}/${this.config.reconnectionAttempts})`);
    
    // Check if we should attempt reconnection
    if (this.connectionAttempts < this.config.reconnectionAttempts) {
      // Don't reconnect immediately for certain errors
      if (error?.code === 'ECONNREFUSED' || error?.type === 'TransportError') {
        console.log('🚫 Backend unavailable - not attempting reconnection');
        this.emit('maxReconnectionAttemptsReached', { 
          error, 
          attempts: this.connectionAttempts,
          reason: 'Backend unavailable' 
        });
        return;
      }
      
      this.attemptReconnection();
    } else {
      console.log('🚫 Max reconnection attempts reached. Switching to offline mode.');
      this.emit('maxReconnectionAttemptsReached', { 
        error, 
        attempts: this.connectionAttempts,
        reason: 'Max attempts exceeded'
      });
    }
  }

  // Attempt reconnection with health check and exponential backoff
  async attemptReconnection() {
    if (this.reconnectTimeout || this.isConnecting || this.connected) {
      return;
    }

    const delay = Math.min(
      this.config.reconnectionDelay * Math.pow(2, this.connectionAttempts - 1),
      this.config.maxReconnectionDelay
    );

    console.log(`🔄 Attempting reconnection in ${delay}ms (attempt ${this.connectionAttempts + 1}/${this.config.reconnectionAttempts})`);
    
    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectTimeout = null;
      
      // Check if backend is available before attempting connection
      try {
        const healthCheck = await fetch(this.config.healthCheckUrl, {
          method: 'GET',
          timeout: 3000
        });
        
        if (!healthCheck.ok) {
          console.log('🚫 Backend health check failed - skipping reconnection');
          this.handleConnectionError({ type: 'HealthCheckFailed', message: 'Backend not healthy' });
          return;
        }
      } catch (healthError) {
        console.log('🚫 Backend not available - skipping reconnection');
        this.handleConnectionError({ type: 'BackendUnavailable', message: 'Backend not reachable' });
        return;
      }
      
      // Proceed with connection if backend is healthy
      if (!this.connected && !this.isConnecting) {
        this.connect();
      }
    }, delay);
  }

  // Initialize connection with backend availability check
  async initialize() {
    if (this.initialized) {
      console.log('Real-time service already initialized');
      return this;
    }
    
    if (this.connected || this.isConnecting) {
      console.log('Real-time service already connected or connecting');
      return this;
    }
    
    console.log('🚀 Initializing real-time service...');
    this.initialized = true;
    
    // Reset connection attempts when manually initializing
    this.connectionAttempts = 0;
    
    // Check backend availability first
    try {
      const healthCheck = await fetch(this.config.healthCheckUrl, {
        method: 'GET',
        timeout: 3000
      });
      
      if (!healthCheck.ok) {
        console.log('🚫 Backend not healthy - real-time service unavailable');
        this.emit('maxReconnectionAttemptsReached', { 
          error: { type: 'BackendUnhealthy', message: 'Backend health check failed' }, 
          attempts: 0,
          reason: 'Backend not healthy'
        });
        return this;
      }
    } catch (error) {
      console.log('🚫 Backend not available - real-time service unavailable');
      this.emit('maxReconnectionAttemptsReached', { 
        error: { type: 'BackendUnavailable', message: 'Backend not reachable' }, 
        attempts: 0,
        reason: 'Backend not available'
      });
      return this;
    }
    
    // Backend is available, proceed with connection
    this.connect();
    return this;
  }

  // Disconnect
  disconnect() {
    console.log('🔌 Disconnecting from real-time server');
    
    // Clear any pending reconnection
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      try {
        // Leave current meeting before disconnecting
        if (this.currentMeetingId) {
          this.socket.emit('leaveMeeting', this.currentMeetingId);
          this.currentMeetingId = null;
        }
        
        // Remove all event listeners to prevent memory leaks
        this.socket.removeAllListeners();
        
        // Disconnect the socket
        this.socket.disconnect();
        
        console.log('✅ Socket cleaned up and disconnected');
      } catch (error) {
        console.error('❌ Error during socket cleanup:', error);
      } finally {
        this.socket = null;
        this.connected = false;
        this.isConnecting = false;
        this.initialized = false;
      }
    }
    
    // Reset state
    this.connectionAttempts = 0;
    this.lastConnectionAttempt = null;
  }

  // Reconnect
  reconnect() {
    this.disconnect();
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  // Send custom event
  send(event, data) {
    if (!this.socket || !this.connected) {
      console.warn(`⚠️ Socket not connected, cannot send ${event}`);
      return false;
    }

    this.socket.emit(event, data);
    return true;
  }

  // API Integration helpers
  async trackLinkClick(clickData) {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBaseUrl}/zoom/track-link-click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clickData)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Link click tracked:', result);
        return result;
      } else {
        console.error('❌ Failed to track link click:', result);
        return null;
      }
    } catch (error) {
      console.error('❌ Error tracking link click:', error);
      return null;
    }
  }

  async createRealtimeMeeting(meetingData) {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBaseUrl}/realtime/meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Real-time meeting created:', result);
        return result;
      } else {
        console.error('❌ Failed to create real-time meeting:', result);
        return null;
      }
    } catch (error) {
      console.error('❌ Error creating real-time meeting:', error);
      return null;
    }
  }

  async trackParticipant(participantData) {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBaseUrl}/realtime/participant/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(participantData)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Participant tracked:', result);
        return result;
      } else {
        console.error('❌ Failed to track participant:', result);
        return null;
      }
    } catch (error) {
      console.error('❌ Error tracking participant:', error);
      return null;
    }
  }

  async getRealtimeAnalytics(meetingId = null) {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const url = meetingId 
        ? `${apiBaseUrl}/realtime/analytics/${meetingId}`
        : `${apiBaseUrl}/realtime/analytics`;
        
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Analytics retrieved:', result);
        return result.analytics;
      } else {
        console.error('❌ Failed to get analytics:', result);
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting analytics:', error);
      return null;
    }
  }

  async endMeeting(meetingId) {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBaseUrl}/realtime/meeting/${meetingId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Meeting ended:', result);
        return result;
      } else {
        console.error('❌ Failed to end meeting:', result);
        return null;
      }
    } catch (error) {
      console.error('❌ Error ending meeting:', error);
      return null;
    }
  }
}

// Create singleton instance
const realtimeService = new RealTimeService();

// Export both the class and instance
export { RealTimeService };
export default realtimeService;
