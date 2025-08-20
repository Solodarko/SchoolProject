import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  Badge,
  Tooltip,
  Divider,
  LinearProgress,
  Slide,
  Grow
} from '@mui/material';
import {
  Videocam,
  Launch,
  ContentCopy,
  Schedule,
  People,
  Person,
  Groups,
  SmartDisplay,
  RadioButtonChecked,
  RadioButtonUnchecked,
  AccessTime,
  CheckCircle,
  Warning,
  Info,
  Refresh,
  School,
  Login,
  Wifi,
  WifiOff,
  NotificationImportant
} from '@mui/icons-material';
import { format, formatDistanceToNow, isAfter, isBefore } from 'date-fns';
import io from 'socket.io-client';
import { useNotificationSystem } from '../../context/NotificationSystem';
import { useAuth } from '../../context/AuthContext';
import { getAuthToken } from '../../utils/authUtils';
import { logAuthTokenState } from '../../utils/authTokenTest';
import { debugTokenFlow, fixUserDashboardToken } from '../../utils/tokenDebugger';
import Cookies from 'js-cookie';

const UserZoomDashboard = ({ currentUser }) => {
  const { addZoomMeetingNotification } = useNotificationSystem();
  const { user: authUser, student, isAuthenticated, displayName, getUserIdentity } = useAuth();
  
  // State management
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationSeverity, setNotificationSeverity] = useState('info');
  const [socketConnected, setSocketConnected] = useState(false);

  // Backend URL
  const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

  // Enhanced user data extraction from multiple sources
  const getUserFromCookiesAndAuth = useCallback(() => {
    // Try to get user data from AuthContext first (most reliable)
    if (isAuthenticated && authUser) {
      return {
        id: authUser.id || authUser._id,
        name: displayName || authUser.username || authUser.firstName + ' ' + authUser.lastName,
        email: authUser.email,
        studentId: student?.StudentID || student?.studentId || authUser.id || authUser._id,
        department: student?.Department || student?.department || 'Computer Science',
        role: authUser.role || 'student',
        isAuthenticated: true
      };
    }
    
    // Fallback to cookies if AuthContext is not available
    try {
      const username = Cookies.get('username');
      const userRole = Cookies.get('userRole');
      const authToken = Cookies.get('authToken');
      
      if (username && authToken) {
        console.log('🍪 Using cookie data:', { username, userRole, hasToken: !!authToken });
        
        // Try to extract email and other info from token if possible
        let email = username;
        let studentId = username;
        
        // If username looks like an email, use it as email
        if (username.includes('@')) {
          email = username;
        } else {
          // If not an email, assume it's a username and create an email
          email = `${username}@university.edu`;
        }
        
        return {
          id: username, // Use username as ID
          name: username.charAt(0).toUpperCase() + username.slice(1), // Capitalize first letter
          email: email,
          studentId: studentId,
          department: 'Computer Science', // Default department
          role: userRole || 'student',
          isAuthenticated: true
        };
      }
    } catch (error) {
      console.error('Error reading cookies:', error);
    }
    
    // Final fallback to guest user
    return {
      id: 'guest',
      name: 'Guest User',
      email: 'guest@example.com',
      studentId: 'guest',
      department: 'N/A',
      role: 'guest',
      isAuthenticated: false
    };
  }, [isAuthenticated, authUser, displayName, student]);
  
  // Use current user prop or extract from auth/cookies
  const user = currentUser || getUserFromCookiesAndAuth();

  // Helper functions (moved before useEffect to avoid hoisting issues)
  const showNotificationMessage = useCallback((message, severity = 'info') => {
    setNotificationMessage(message);
    setNotificationSeverity(severity);
    setShowNotification(true);
    
    const notification = {
      id: Date.now(),
      message,
      severity,
      timestamp: new Date()
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 9)]);
  }, []);

  const loadMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = `${backendUrl}/api/zoom/meetings`;
      console.log('📊 User Dashboard: Loading meetings from:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Response Error:', {
          status: response.status,
          statusText: response.statusText,
          url: apiUrl,
          error: errorText
        });
        
        // Show specific error message based on status
        if (response.status === 404) {
          throw new Error(`API endpoint not found (404). Check if backend server is running and the endpoint ${apiUrl} exists.`);
        } else if (response.status >= 500) {
          throw new Error(`Server error (${response.status}). Backend may be down or misconfigured.`);
        } else {
          throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      console.log('📊 User Dashboard: Meetings API response:', data);
      
      if (data.success) {
        // Filter and sort meetings for user view
        const userMeetings = (data.meetings || [])
          .filter(meeting => {
            // Show active, waiting, and future meetings
            return meeting.status !== 'ended';
          })
          .sort((a, b) => {
            // Sort by status priority: started > waiting > scheduled
            const statusPriority = { 'started': 3, 'waiting': 2, 'scheduled': 1 };
            return (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0);
          });
        
        console.log('📊 User Dashboard: Filtered meetings:', userMeetings);
        setMeetings(userMeetings);
        
        if (userMeetings.length > 0) {
          showNotificationMessage(`Loaded ${userMeetings.length} meetings`, 'success');
        }
      } else {
        console.warn('❌ API returned success: false', data);
        setMeetings([]); // Clear meetings if API says not successful
        showNotificationMessage(data.error || 'Failed to load meetings', 'warning');
      }
    } catch (error) {
      console.error('❌ Failed to load meetings:', {
        error: error.message,
        stack: error.stack,
        backendUrl,
        fullUrl: `${backendUrl}/api/zoom/meetings`
      });
      
      // Show more helpful error message
      showNotificationMessage(
        `Connection Error: ${error.message}. Check if backend is running on ${backendUrl}`,
        'error'
      );
      
      // Set empty meetings array on error
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, showNotificationMessage]);

  // WebSocket setup for real-time updates
  useEffect(() => {
    let socket;
    
    try {
      // Initialize Socket.IO connection
      socket = io(backendUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000
      });

      // Connection event handlers
      socket.on('connect', () => {
        console.log('Connected to WebSocket server');
        setSocketConnected(true);
        showNotificationMessage('Connected to live updates', 'success');
      });

      socket.on('disconnect', (reason) => {
        console.log('Disconnected from WebSocket server:', reason);
        setSocketConnected(false);
        showNotificationMessage('Disconnected from live updates', 'warning');
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setSocketConnected(false);
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log('Reconnected to WebSocket server, attempt:', attemptNumber);
        setSocketConnected(true);
        showNotificationMessage('Reconnected to live updates', 'success');
        // Reload meetings after reconnection
        loadMeetings();
      });

      // Meeting event handlers
      socket.on('meetingCreated', (data) => {
        console.log('New meeting created:', data);
        
        // Extract meeting from the event data (backend sends { meeting, savedMeeting, timestamp })
        const meeting = data.meeting || data;
        
        // Add new meeting to the list if it's not ended
        if (meeting && meeting.status !== 'ended') {
          setMeetings(prev => {
            // Check if meeting already exists to avoid duplicates
            const exists = prev.some(m => m.id === meeting.id);
            if (!exists) {
              const newMeetings = [meeting, ...prev]
                .sort((a, b) => {
                  const statusPriority = { 'started': 3, 'waiting': 2, 'scheduled': 1 };
                  return (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0);
                });
              
              // Show notification for new meeting
              showNotificationMessage(
                `🎉 New meeting available: "${meeting.topic}"`,
                'success'
              );
              
              return newMeetings;
            }
            return prev;
          });
        }
      });

      socket.on('meetingStarted', (data) => {
        console.log('Meeting started:', data);
        
        setMeetings(prev => 
          prev.map(meeting => 
            meeting.id === data.meetingId 
              ? { ...meeting, status: 'started' }
              : meeting
          ).sort((a, b) => {
            const statusPriority = { 'started': 3, 'waiting': 2, 'scheduled': 1 };
            return (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0);
          })
        );
        
        showNotificationMessage(
          `📹 Meeting "${data.topic}" is now live! You can join now.`,
          'success'
        );
      });

      socket.on('meetingEnded', (data) => {
        console.log('Meeting ended:', data);
        
        setMeetings(prev => 
          prev.map(meeting => 
            meeting.id === data.meetingId 
              ? { ...meeting, status: 'ended' }
              : meeting
          ).filter(meeting => meeting.status !== 'ended') // Remove ended meetings from user view
        );
        
        showNotificationMessage(
          `Meeting "${data.topic}" has ended.`,
          'info'
        );
      });

      socket.on('meetingStatusUpdate', (data) => {
        console.log('Meeting status updated:', data);
        
        setMeetings(prev => 
          prev.map(meeting => 
            meeting.id === data.meetingId 
              ? { ...meeting, status: data.status }
              : meeting
          ).sort((a, b) => {
            const statusPriority = { 'started': 3, 'waiting': 2, 'scheduled': 1 };
            return (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0);
          })
        );
      });

    } catch (error) {
      console.error('Failed to initialize WebSocket connection:', error);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [backendUrl, showNotificationMessage, loadMeetings]);

    // Load meetings on component mount
  useEffect(() => {
    // Run comprehensive token debugging
    console.log('🔧 UserZoomDashboard: Running token diagnostics...');
    const tokenStatus = debugTokenFlow();
    
    // Try to auto-fix token issues
    if (!tokenStatus.hasToken || !tokenStatus.isValid) {
      console.log('🔧 UserZoomDashboard: Attempting token auto-fix...');
      const fixAttempted = fixUserDashboardToken();
      
      if (fixAttempted) {
        console.log('✅ UserZoomDashboard: Token fix attempted, re-running diagnostics...');
        setTimeout(() => {
          const newTokenStatus = debugTokenFlow();
          if (newTokenStatus.hasToken && newTokenStatus.isValid) {
            showNotificationMessage('✅ Authentication token fixed successfully', 'success');
          } else {
            showNotificationMessage('⚠️ Token issue detected - authentication may not work properly', 'warning');
          }
        }, 1000);
      } else {
        showNotificationMessage('⚠️ No authentication token found - you may need to log in again', 'warning');
      }
    } else {
      console.log('✅ UserZoomDashboard: Token is valid and ready for use');
      showNotificationMessage('✅ Authentication ready', 'success');
    }
    
    // Load meetings
    loadMeetings();
    
    // Debug authentication state on component mount
    logAuthTokenState();
    
    const interval = setInterval(loadMeetings, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [loadMeetings, showNotificationMessage]);

  const joinMeeting = async (meeting) => {
    const joinTimestamp = new Date().toISOString();
    
    try {
      console.log('🚀 User joining meeting - Immediate tracking started:', {
        user: {
          name: user.name,
          email: user.email,
          studentId: user.studentId,
          userId: user.id
        },
        meeting: {
          id: meeting.id,
          topic: meeting.topic
        },
        timestamp: joinTimestamp
      });

      // Get authentication token for user session registration using proper auth utils
      const authToken = getAuthToken();
      
      // Step 1: Register authenticated user session (this emits userJoinedMeeting event)
      let userSessionPromise = null;
      if (authToken) {
        console.log('🔐 Registering authenticated user session...');
        console.log('Token being used:', {
          present: !!authToken,
          length: authToken?.length,
          firstChars: authToken?.substring(0, 20) + '...'
        });
        userSessionPromise = fetch(`${backendUrl}/api/user-sessions/join-meeting`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            meetingId: meeting.id,
            participantData: {
              name: user.name,
              email: user.email,
              studentId: user.studentId,
              department: user.department,
              role: user.role || 'student',
              source: 'user_dashboard'
            }
          }),
        });
      } else {
        console.warn('⚠️ No authentication token found, skipping user session registration');
      }

      // Step 2: Track the link click with comprehensive user data
      const linkClickPromise = fetch(`${backendUrl}/api/zoom/track-link-click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId: meeting.id,
          meetingTopic: meeting.topic,
          name: user.name,
          email: user.email,
          studentId: user.studentId,
          userId: user.id,
          clickTime: joinTimestamp,
          joinUrl: meeting.join_url,
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        }),
      });

      // Step 3: Immediately track participant join (pre-emptive tracking)
      const participantJoinPromise = fetch(`${backendUrl}/api/zoom/track-participant-join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId: meeting.id,
          name: user.name,
          email: user.email,
          userId: user.id,
          studentId: user.studentId,
          joinTime: joinTimestamp,
          source: 'dashboard_immediate',
          userInfo: {
            department: user.department,
            role: user.role || 'student',
            deviceInfo: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              language: navigator.language,
              screenResolution: `${screen.width}x${screen.height}`,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
          }
        }),
      });

      // Execute all tracking calls simultaneously
      const promises = [linkClickPromise, participantJoinPromise];
      if (userSessionPromise) {
        promises.unshift(userSessionPromise); // Add user session as first promise
      }
      
      const results = await Promise.allSettled(promises);
      
      // Log results (adjust indices if user session promise exists)
      const userSessionIndex = userSessionPromise ? 0 : -1;
      const linkClickIndex = userSessionPromise ? 1 : 0;
      const participantJoinIndex = userSessionPromise ? 2 : 1;
      
      // Handle user session registration result
      if (userSessionPromise && results[userSessionIndex]) {
        if (results[userSessionIndex].status === 'fulfilled') {
          console.log('✅ User session registered successfully');
          try {
            const sessionResponse = await results[userSessionIndex].value.json();
            console.log('📊 User session response:', sessionResponse);
            console.log('🔍 Full response details:', JSON.stringify(sessionResponse, null, 2));
            if (sessionResponse.success) {
              showNotificationMessage(
                `🔐 Authenticated as ${sessionResponse.userData?.user?.username || user.name} for "${meeting.topic}"`,
                'success'
              );
              console.log('🎯 userJoinedMeeting event should have been emitted for meeting:', meeting.id);
            } else {
              console.error('❌ User session registration returned success: false', sessionResponse);
              showNotificationMessage(
                `⚠️ Authentication failed: ${sessionResponse.message || 'Unknown error'}`,
                'warning'
              );
            }
          } catch (e) {
            console.error('Error parsing user session response:', e);
          }
        } else {
          console.error('❌ User session registration failed:', results[userSessionIndex].reason);
          showNotificationMessage(
            '⚠️ User session registration failed - check console for details',
            'warning'
          );
        }
      } else if (!userSessionPromise) {
        console.warn('⚠️ No user session registration attempted - no auth token found');
        showNotificationMessage(
          '⚠️ No authentication token found - joining as guest only',
          'info'
        );
      }

      // Handle link click result
      if (results[linkClickIndex]?.status === 'fulfilled') {
        console.log('✅ Link click tracked successfully');
      } else {
        console.error('❌ Link click tracking failed:', results[linkClickIndex]?.reason);
      }

      // Handle participant join result
      if (results[participantJoinIndex]?.status === 'fulfilled') {
        console.log('✅ Participant join tracked immediately');
        try {
          const joinResponse = await results[participantJoinIndex].value.json();
          console.log('📊 Join tracking response:', joinResponse);
          
          // Store tracking data in backend API and localStorage for admin dashboard access
          if (joinResponse.success) {
            const trackingData = {
              meetingId: meeting.id,
              meetingTopic: meeting.topic,
              trackingId: joinResponse.trackingId,
              participantCount: joinResponse.participantCount || 1,
              timestamp: joinResponse.timestamp || new Date().toISOString(),
              userId: user.id,
              userName: user.name,
              userEmail: user.email,
              studentId: user.studentId,
              message: `Joined "${meeting.topic}" as participant #${joinResponse.participantCount || 1}`
            };
            
            // Send tracking data to backend API
            try {
              const apiTrackingResponse = await fetch(`${backendUrl}/api/zoom/join-tracking`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  meetingId: meeting.id,
                  meetingTopic: meeting.topic,
                  userId: user.id,
                  userName: user.name,
                  userEmail: user.email,
                  studentId: user.studentId,
                  participantCount: joinResponse.participantCount || 1,
                  timestamp: joinResponse.timestamp || new Date().toISOString()
                }),
              });
              
              if (apiTrackingResponse.ok) {
                const apiTrackingResult = await apiTrackingResponse.json();
                console.log('📊 [User Dashboard] Join tracking data sent to backend API successfully:', apiTrackingResult);
                
                // Update trackingData with backend response
                if (apiTrackingResult.trackingId) {
                  trackingData.backendTrackingId = apiTrackingResult.trackingId;
                }
              } else {
                console.error('❌ [User Dashboard] Failed to send join tracking data to backend API:', apiTrackingResponse.status);
              }
            } catch (apiError) {
              console.error('❌ [User Dashboard] Error sending join tracking data to backend API:', apiError);
            }
            
            // Store the current tracking response in localStorage as backup
            localStorage.setItem('currentJoinTracking', JSON.stringify(trackingData));
            
            // Also maintain a history of join tracking responses (last 10)
            try {
              const trackingHistory = JSON.parse(localStorage.getItem('joinTrackingHistory') || '[]');
              trackingHistory.unshift(trackingData); // Add newest at beginning
              
              // Keep only the last 10 items
              const trimmedHistory = trackingHistory.slice(0, 10);
              localStorage.setItem('joinTrackingHistory', JSON.stringify(trimmedHistory));
              
              console.log('📊 [User Dashboard] Join tracking data saved to localStorage as backup:', trackingData);
              console.log('📊 [User Dashboard] Updated localStorage contents:', {
                history: JSON.parse(localStorage.getItem('joinTrackingHistory') || '[]'),
                current: JSON.parse(localStorage.getItem('currentJoinTracking') || 'null')
              });
            } catch (storageError) {
              console.error('Error storing tracking history:', storageError);
            }
            
            // Show success message with participant count (only if user session didn't already show a message)
            if (!userSessionPromise) {
              showNotificationMessage(
                `✅ Joined "${meeting.topic}" - You are participant #${joinResponse.participantCount || 1}`,
                'success'
              );
            }
          }
        } catch (e) {
          console.error('Error parsing participant join response:', e);
        }
      } else {
        console.error('❌ Participant join tracking failed:', results[participantJoinIndex]?.reason);
      }

      // Step 3: Open meeting in a new tab (using original join URL)
      console.log('🔗 Opening meeting with URL:', meeting.join_url);
      const meetingWindow = window.open(meeting.join_url, '_blank', 'width=1200,height=800');
      
      if (meetingWindow) {
        console.log('🚀 Meeting window opened successfully');
        
        // Optional: Monitor if the window is closed to track leave time
        const checkClosed = setInterval(() => {
          if (meetingWindow.closed) {
            clearInterval(checkClosed);
            const leaveTime = new Date().toISOString();
            console.log('👋 Meeting window closed, tracking leave time:', leaveTime);
            
            // Track participant leave
            fetch(`${backendUrl}/api/zoom/track-participant-leave`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                meetingId: meeting.id,
                userId: user.id,
                email: user.email,
                leaveTime: leaveTime,
                source: 'window_close_detection'
              }),
            }).catch(error => {
              console.error('Failed to track window close:', error);
            });
          }
        }, 1000);
        
        // Clear the interval after 4 hours (meeting timeout)
        setTimeout(() => {
          clearInterval(checkClosed);
        }, 4 * 60 * 60 * 1000);
      }
      
      // Show default success message if join response wasn't processed
      if (results[participantJoinIndex]?.status === 'rejected') {
        showNotificationMessage(`Joining "${meeting.topic}"...`, 'success');
      }
      
    } catch (error) {
      console.error('❌ Failed to track meeting join:', error);
      
      // Still allow joining even if tracking fails
      window.open(meeting.join_url, '_blank');
      showNotificationMessage(`Joining "${meeting.topic}" (tracking failed)`, 'warning');
    }
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotificationMessage(`${label} copied to clipboard`, 'success');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      showNotificationMessage('Failed to copy to clipboard', 'error');
    }
  };

  const getMeetingStatusColor = (meeting) => {
    switch (meeting.status) {
      case 'started': return 'success';
      case 'waiting': return 'warning';
      case 'ended': return 'default';
      default: return 'info';
    }
  };

  const getMeetingStatusText = (meeting) => {
    switch (meeting.status) {
      case 'started': return 'Live Now';
      case 'waiting': return 'Ready to Join';
      case 'ended': return 'Ended';
      default: return 'Scheduled';
    }
  };

  const getMeetingStatusIcon = (meeting) => {
    switch (meeting.status) {
      case 'started': return <RadioButtonChecked />;
      case 'waiting': return <Schedule />;
      case 'ended': return <RadioButtonUnchecked />;
      default: return <Schedule />;
    }
  };

  const isJoinable = (meeting) => {
    return meeting.status === 'started' || meeting.status === 'waiting';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartDisplay color="primary" />
            Zoom Meetings
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Welcome, {user.name}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Tooltip title={socketConnected ? 'Connected to live updates' : 'Disconnected from live updates'}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {socketConnected ? (
                  <Wifi color="success" fontSize="small" />
                ) : (
                  <WifiOff color="error" fontSize="small" />
                )}
                <Typography variant="caption" color={socketConnected ? 'success.main' : 'error.main'}>
                  {socketConnected ? 'Live' : 'Offline'}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
          <Badge badgeContent={meetings.filter(m => isJoinable(m)).length} color="success">
            <Groups />
          </Badge>
          <Typography variant="caption" display="block" color="text.secondary">
            Available Meetings
          </Typography>
        </Box>
      </Box>

      {/* User Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
              <Person />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6">{user.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Student ID: {user.studentId} | {user.department}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Email: {user.email}
              </Typography>
              
              {/* Authentication Status */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mt: 1,
                px: 1, 
                py: 0.5, 
                borderRadius: 1, 
                bgcolor: isAuthenticated ? 'success.light' : 'warning.light',
                width: 'fit-content'
              }}>
                {isAuthenticated ? (
                  <>
                    <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} />
                    <Typography variant="caption" color="success.main" fontWeight="bold">
                      Authenticated User
                    </Typography>
                  </>
                ) : (
                  <>
                    <Warning sx={{ color: 'warning.main', fontSize: 16 }} />
                    <Typography variant="caption" color="warning.main" fontWeight="bold">
                      Guest Mode - Authentication Recommended
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadMeetings}
                disabled={loading}
                size="small"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Meetings Grid */}
      {loading && meetings.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : meetings.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Groups sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Meetings Available
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              There are no active meetings at the moment. Check back later or contact your instructor.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadMeetings}
            >
              Refresh Meetings
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {meetings.map((meeting) => (
            <Grid item xs={12} md={6} lg={4} key={meeting.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: isJoinable(meeting) ? 2 : 1,
                  borderColor: isJoinable(meeting) ? 'success.main' : 'divider',
                  position: 'relative',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
              >
                {/* Status Badge */}
                {isJoinable(meeting) && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 1
                    }}
                  >
                    <Chip
                      size="small"
                      label={getMeetingStatusText(meeting)}
                      color={getMeetingStatusColor(meeting)}
                      icon={getMeetingStatusIcon(meeting)}
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                )}

                <CardContent sx={{ flex: 1, pb: 1 }}>
                  {/* Meeting Header */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: getMeetingStatusColor(meeting) + '.main', mt: 0.5 }}>
                      <Videocam />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="h6" 
                        gutterBottom
                        sx={{ 
                          wordBreak: 'break-word',
                          fontSize: '1.1rem',
                          lineHeight: 1.3
                        }}
                      >
                        {meeting.topic}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Meeting ID: {meeting.id}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Meeting Info */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <AccessTime fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Created: {format(new Date(meeting.created_at), 'MMM dd, yyyy HH:mm')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Schedule fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Duration: {meeting.duration || 60} minutes
                      </Typography>
                    </Box>

                    {meeting.agenda && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        <strong>Agenda:</strong> {meeting.agenda}
                      </Typography>
                    )}
                  </Box>

                  {/* Zoom Link Section */}
                  <Box sx={{ 
                    mb: 2, 
                    p: 1.5, 
                    bgcolor: 'primary.light', 
                    borderRadius: 1, 
                    border: '1px solid', 
                    borderColor: 'primary.main'
                  }}>
                    <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Launch fontSize="small" color="primary" />
                      Zoom Meeting Link
                    </Typography>
                    <Box sx={{ 
                      bgcolor: 'background.paper', 
                      p: 1, 
                      borderRadius: 0.5, 
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}>
                      <Typography 
                        variant="body2" 
                        fontFamily="monospace" 
                        sx={{ 
                          wordBreak: 'break-all',
                          fontSize: '0.75rem',
                          color: 'primary.main'
                        }}
                      >
                        {meeting.join_url}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ContentCopy fontSize="small" />}
                        onClick={() => copyToClipboard(meeting.join_url, 'Zoom Link')}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        Copy
                      </Button>
                      {meeting.password && (
                        <Tooltip title={`Password: ${meeting.password}`}>
                          <Button
                            size="small"
                            variant="text"
                            sx={{ fontSize: '0.75rem' }}
                          >
                            Password: {meeting.password}
                          </Button>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>

                  {/* Status Indicator */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {getMeetingStatusIcon(meeting)}
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: isJoinable(meeting) ? 'bold' : 'normal',
                        color: isJoinable(meeting) ? getMeetingStatusColor(meeting) + '.main' : 'text.secondary'
                      }}
                    >
                      {getMeetingStatusText(meeting)}
                    </Typography>
                  </Box>

                  {/* Live indicator for active meetings */}
                  {meeting.status === 'started' && (
                    <Box sx={{ mb: 2 }}>
                      <Alert 
                        severity="success" 
                        icon={<RadioButtonChecked />}
                        sx={{ 
                          animation: 'pulse 2s infinite',
                          '@keyframes pulse': {
                            '0%': { opacity: 1 },
                            '50%': { opacity: 0.7 },
                            '100%': { opacity: 1 }
                          }
                        }}
                      >
                        Meeting is live! Join now.
                      </Alert>
                    </Box>
                  )}

                  {/* Ready to join indicator */}
                  {meeting.status === 'waiting' && (
                    <Box sx={{ mb: 2 }}>
                      <Alert severity="info" icon={<Info />}>
                        Meeting room is ready. You can join anytime.
                      </Alert>
                    </Box>
                  )}
                </CardContent>

                <Divider />

                {/* Actions */}
                <CardActions sx={{ p: 2, pt: 1 }}>
                  {isJoinable(meeting) ? (
                    <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                      <Button
                        variant="contained"
                        startIcon={<Launch />}
                        onClick={() => joinMeeting(meeting)}
                        sx={{ 
                          flex: 1,
                          bgcolor: meeting.status === 'started' ? 'success.main' : 'primary.main',
                          '&:hover': {
                            bgcolor: meeting.status === 'started' ? 'success.dark' : 'primary.dark'
                          }
                        }}
                      >
                        {meeting.status === 'started' ? 'Join Live' : 'Join Meeting'}
                      </Button>
                      <Tooltip title="Copy Join URL">
                        <IconButton 
                          onClick={() => copyToClipboard(meeting.join_url, 'Join URL')}
                          size="small"
                        >
                          <ContentCopy />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                      <Button
                        variant="outlined"
                        disabled
                        sx={{ flex: 1 }}
                      >
                        Meeting Ended
                      </Button>
                      <Tooltip title="Copy Join URL">
                        <IconButton 
                          onClick={() => copyToClipboard(meeting.join_url, 'Join URL')}
                          size="small"
                        >
                          <ContentCopy />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Quick Stats */}
      {meetings.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Quick Stats</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {meetings.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Meetings
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {meetings.filter(m => m.status === 'started').length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Live Now
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {meetings.filter(m => m.status === 'waiting').length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Ready to Join
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {meetings.filter(m => isJoinable(m)).length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Available
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Info color="primary" />
            How to Join Meetings
          </Typography>
          <List dense>
            <ListItem>
              <ListItemAvatar>
                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'success.main' }}>
                  1
                </Avatar>
              </ListItemAvatar>
              <ListItemText 
                primary="Look for meetings marked as 'Live Now' or 'Ready to Join'"
                secondary="These meetings are available for you to join immediately"
              />
            </ListItem>
            <ListItem>
              <ListItemAvatar>
                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                  2
                </Avatar>
              </ListItemAvatar>
              <ListItemText 
                primary="Click the 'Join Live' or 'Join Meeting' button"
                secondary="This will automatically track your attendance and open Zoom"
              />
            </ListItem>
            <ListItem>
              <ListItemAvatar>
                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'info.main' }}>
                  3
                </Avatar>
              </ListItemAvatar>
              <ListItemText 
                primary="Your attendance will be tracked automatically"
                secondary="Make sure to use the same name and email as registered"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Notification Snackbar */}
      <Snackbar
        open={showNotification}
        autoHideDuration={4000}
        onClose={() => setShowNotification(false)}
      >
        <Alert
          onClose={() => setShowNotification(false)}
          severity={notificationSeverity}
          variant="filled"
        >
          {notificationMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserZoomDashboard;
