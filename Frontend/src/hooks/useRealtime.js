import { useState, useEffect, useCallback, useRef } from 'react';

export const useRealtime = () => {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('disconnected'); // disconnected, connecting, connected, error
  const [lastHeartbeat, setLastHeartbeat] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  
  const MAX_RECONNECT_ATTEMPTS = 5;
  const HEARTBEAT_INTERVAL = 30000; // 30 seconds
  const RECONNECT_DELAY = 3000; // 3 seconds

  // Connect to real-time service (WebSocket simulation)
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    setStatus('connecting');
    setConnectionError(null);

    try {
      // Simulate WebSocket connection for real-time updates
      // In a real implementation, this would connect to your WebSocket server
      console.log('🔄 Connecting to real-time service...');
      
      // Simulate connection success after a delay
      setTimeout(() => {
        setConnected(true);
        setStatus('connected');
        setLastHeartbeat(new Date());
        reconnectAttemptsRef.current = 0;
        
        console.log('✅ Real-time connection established');
        
        // Start heartbeat
        startHeartbeat();
        
        // Simulate receiving real-time updates
        simulateRealTimeUpdates();
        
      }, 1000);

    } catch (error) {
      console.error('❌ Failed to connect to real-time service:', error);
      setStatus('error');
      setConnectionError(error.message);
      setConnected(false);
      
      // Attempt reconnection
      scheduleReconnect();
    }
  }, []);

  // Disconnect from real-time service
  const disconnect = useCallback(() => {
    console.log('🔄 Disconnecting from real-time service...');
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    
    setConnected(false);
    setStatus('disconnected');
    setLastHeartbeat(null);
    reconnectAttemptsRef.current = 0;
    
    console.log('✅ Disconnected from real-time service');
  }, []);

  // Schedule reconnection attempt
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error(`❌ Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached`);
      setStatus('error');
      setConnectionError('Connection failed after maximum retry attempts');
      return;
    }
    
    reconnectAttemptsRef.current += 1;
    const delay = RECONNECT_DELAY * reconnectAttemptsRef.current;
    
    console.log(`🔄 Scheduling reconnection attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms...`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  // Start heartbeat to maintain connection
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (connected) {
        setLastHeartbeat(new Date());
        
        // Simulate heartbeat check
        // In real implementation, send ping to server
        console.log('💓 Heartbeat sent');
        
        // Emit heartbeat event for other components
        window.dispatchEvent(new CustomEvent('realtimeHeartbeat', {
          detail: { timestamp: new Date(), status: 'connected' }
        }));
      }
    }, HEARTBEAT_INTERVAL);
  }, [connected]);

  // Simulate real-time updates (replace with actual WebSocket message handling)
  const simulateRealTimeUpdates = useCallback(() => {
    // Simulate periodic updates
    const updateInterval = setInterval(() => {
      if (connected) {
        // Emit simulated real-time events
        window.dispatchEvent(new CustomEvent('realtimeUpdate', {
          detail: { 
            type: 'participant_update', 
            timestamp: new Date(),
            data: { activeParticipants: Math.floor(Math.random() * 10) + 1 }
          }
        }));
      } else {
        clearInterval(updateInterval);
      }
    }, 5000); // Every 5 seconds

    return () => clearInterval(updateInterval);
  }, [connected]);

  // Get connection statistics
  const getConnectionStats = useCallback(() => {
    return {
      connected,
      status,
      lastHeartbeat,
      reconnectAttempts: reconnectAttemptsRef.current,
      connectionError,
      uptime: connected && lastHeartbeat ? Date.now() - lastHeartbeat.getTime() : 0
    };
  }, [connected, status, lastHeartbeat, connectionError]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Handle page visibility changes (reconnect when page becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !connected) {
        console.log('🔄 Page became visible, attempting to reconnect...');
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connected, connect]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network came online, attempting to reconnect...');
      if (!connected) {
        connect();
      }
    };

    const handleOffline = () => {
      console.log('🌐 Network went offline');
      setStatus('error');
      setConnectionError('Network offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connected, connect]);

  return {
    // State
    connected,
    status,
    lastHeartbeat,
    connectionError,
    
    // Actions
    connect,
    disconnect,
    getConnectionStats,
    
    // Computed values
    isConnecting: status === 'connecting',
    hasError: status === 'error',
    reconnectAttempts: reconnectAttemptsRef.current
  };
};
