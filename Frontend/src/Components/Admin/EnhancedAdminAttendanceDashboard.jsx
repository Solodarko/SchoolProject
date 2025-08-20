import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
  Badge,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Refresh,
  People,
  PersonAdd,
  School,
  AccessTime,
  CheckCircle,
  Cancel,
  Wifi,
  WifiOff,
  Visibility,
  Email,
  Badge as BadgeIcon,
  AdminPanelSettings,
  Person,
  PlayArrow,
  ExpandMore,
  Timeline,
  Storage,
  TrackChanges,
  History
} from '@mui/icons-material';
import { safeFormatJoinTime, safeFormatShortDate, safeFormatLastUpdated, safeDateFormat } from '../../utils/safeDateFormat';
import io from 'socket.io-client';
import {
  calculateParticipantAttendance,
  calculateSessionBasedParticipantAttendance,
  calculateMeetingAttendanceStats,
  getAttendanceStatusColor,
  formatAttendancePercentage,
  sanitizeAttendanceData
} from '../../utils/attendanceUtils';
import { getAuthToken } from '../../utils/authUtils';

const EnhancedAdminAttendanceDashboard = ({ meetingId }) => {
  // State management
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(meetingId || '');
  const [meetings, setMeetings] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [trackingData, setTrackingData] = useState([]);
  const [realtimeTrackingEvents, setRealtimeTrackingEvents] = useState([]);

  const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

  /**
   * Load join tracking data from localStorage
   */
  const loadTrackingData = useCallback(() => {
    try {
      // Get tracking history from localStorage
      const trackingHistory = JSON.parse(localStorage.getItem('joinTrackingHistory') || '[]');
      const currentTracking = JSON.parse(localStorage.getItem('currentJoinTracking') || 'null');
      
      console.log('📊 Loading tracking data from localStorage:', {
        historyCount: trackingHistory.length,
        currentTracking: !!currentTracking
      });
      
      // Filter tracking data for the selected meeting if specified
      const filteredData = selectedMeeting 
        ? trackingHistory.filter(item => item.meetingId === selectedMeeting)
        : trackingHistory;
      
      setTrackingData(filteredData);
    } catch (error) {
      console.error('Error loading tracking data:', error);
      setTrackingData([]);
    }
  }, [selectedMeeting]);

  /**
   * Fetch enriched attendance data from backend with fallback options
   */
  const fetchEnrichedAttendanceData = useCallback(async (targetMeetingId) => {
    if (!targetMeetingId) {
      console.warn('⚠️ No meeting ID provided for attendance fetch');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use proper auth utils to get token
      const authToken = getAuthToken();
      
      console.log('🔍 Token retrieval status:', {
        foundToken: !!authToken,
        tokenLength: authToken?.length,
        firstChars: authToken?.substring(0, 20) + '...' || 'N/A'
      });

      console.log(`🔍 Fetching enriched attendance for meeting: ${targetMeetingId}`);

      // Prepare headers conditionally
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Only add Authorization header if token exists
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        console.log('✅ Using authentication token');
      } else {
        console.log('⚠️ Making request without authentication');
      }

      // Try enriched attendance data first
      let response = await fetch(
        `${backendUrl}/api/attendance-tracker/attendance/${targetMeetingId}?enriched=true`,
        { headers }
      );

      let data;
      
      if (response.ok) {
        try {
          data = await response.json();
          console.log('📊 AttendanceTracker response:', data);
          
          if (data.success) {
            setAttendanceData(data);
            setLastUpdated(new Date());
            
            console.log('✅ Enriched attendance data received:', {
              participants: data.participants?.length || 0,
              authenticated: data.authenticationStats?.totalAuthenticated || 0,
              students: data.authenticationStats?.authenticatedStudents || 0
            });
            return; // Success, exit here
          }
        } catch (jsonError) {
          console.warn('⚠️ AttendanceTracker returned non-JSON response:', await response.text());
        }
      } else {
        console.log(`⚠️ AttendanceTracker enriched endpoint failed: ${response.status} ${response.statusText}`);
      }

      // Fallback 1: Try regular attendance data
      console.log('🔄 Fallback: Trying regular attendance data...');
      response = await fetch(
        `${backendUrl}/api/attendance-tracker/attendance/${targetMeetingId}`,
        { headers }
      );
      
      if (response.ok) {
        try {
          data = await response.json();
          console.log('📊 Regular AttendanceTracker response:', data);
          
          if (data.success) {
            setAttendanceData(data);
            setLastUpdated(new Date());
            console.log('✅ Regular attendance data received:', {
              participants: data.participants?.length || 0
            });
            return; // Success, exit here
          }
        } catch (jsonError) {
          console.warn('⚠️ Regular AttendanceTracker returned non-JSON response:', await response.text());
        }
      } else {
        console.log(`⚠️ Regular AttendanceTracker endpoint failed: ${response.status} ${response.statusText}`);
      }

      // Fallback 2: Try webhook attendance data (WHERE THE DATA ACTUALLY IS!)
      console.log('🔄 Fallback: Trying webhook attendance data...');
      response = await fetch(
        `${backendUrl}/api/webhooks/attendance/${targetMeetingId}`,
        { headers }
      );
      
      if (response.ok) {
        data = await response.json();
        console.log('📊 Webhook attendance response:', data);
        
        if (data.participants && data.participants.length > 0) {
          // Convert webhook participants to our expected format with proper attendance calculation
          const rawParticipants = data.participants.map((p, index) => {
            // Safe handling of joinTime to prevent invalid date errors
            let safeJoinTime;
            try {
              if (p.joinTime && p.joinTime !== '' && p.joinTime !== 'null' && p.joinTime !== 'undefined') {
                const testDate = new Date(p.joinTime);
                if (!isNaN(testDate.getTime()) && testDate.getFullYear() >= 1900 && testDate.getFullYear() <= 2100) {
                  safeJoinTime = p.joinTime;
                } else {
                  console.warn('Invalid joinTime detected for participant:', p.participantName, p.joinTime);
                  safeJoinTime = new Date().toISOString();
                }
              } else {
                safeJoinTime = new Date().toISOString();
              }
            } catch (error) {
              console.warn('Error parsing joinTime for participant:', p.participantName, error);
              safeJoinTime = new Date().toISOString();
            }

            // Safe handling of leaveTime
            let safeLeaveTime = null;
            if (p.leaveTime && p.leaveTime !== '' && p.leaveTime !== 'null' && p.leaveTime !== 'undefined') {
              try {
                const testDate = new Date(p.leaveTime);
                if (!isNaN(testDate.getTime()) && testDate.getFullYear() >= 1900 && testDate.getFullYear() <= 2100) {
                  safeLeaveTime = p.leaveTime;
                }
              } catch (error) {
                console.warn('Error parsing leaveTime for participant:', p.participantName, error);
              }
            }

            return {
              participantName: p.participantName || p.name || `Participant ${index + 1}`,
              email: p.participantEmail || p.email || '',
              joinTime: safeJoinTime,
              leaveTime: safeLeaveTime,
              duration: p.duration || 0,
              isActive: p.attendanceStatus === 'In Progress' || p.isActive !== false,
              attendanceStatus: p.attendanceStatus || 'present',
              isAuthenticated: p.isAuthenticated || false,
              authenticatedUser: p.authenticatedUser || null,
              studentInfo: p.studentInfo || null
            };
          });
          
          // Calculate attendance data for each participant
          const meetingInfo = {
            startTime: data.meetingStartTime,
            endTime: data.meetingEndTime
          };
          
          const enhancedParticipants = rawParticipants.map(p => 
            calculateSessionBasedParticipantAttendance(p, meetingInfo, 85) // Use 85% threshold
          );
          
          const convertedData = {
            success: true,
            meetingId: targetMeetingId,
            participants: enhancedParticipants,
            statistics: {
              total: enhancedParticipants.length
            },
            authenticationStats: {
              totalAuthenticated: enhancedParticipants.filter(p => p.isAuthenticated).length,
              authenticatedStudents: enhancedParticipants.filter(p => p.isAuthenticated && p.studentInfo).length,
              authenticatedAdmins: enhancedParticipants.filter(p => p.isAuthenticated && !p.studentInfo).length,
              unauthenticatedParticipants: enhancedParticipants.filter(p => !p.isAuthenticated).length
            },
            attendanceStats: calculateMeetingAttendanceStats(enhancedParticipants)
          };
          
          setAttendanceData(convertedData);
          setLastUpdated(new Date());
          console.log('✅ Webhook attendance data converted:', {
            participants: convertedData.participants.length,
            authenticated: convertedData.authenticationStats.totalAuthenticated,
            students: convertedData.authenticationStats.authenticatedStudents
          });
          return; // Success, exit here
        }
      }

      // Fallback 3: Try live participants from Zoom API
      console.log('🔄 Fallback: Trying Zoom live participants...');
      response = await fetch(
        `${backendUrl}/api/zoom/meeting/${targetMeetingId}/live-participants`,
        { headers }
      );
      
      if (response.ok) {
        data = await response.json();
        console.log('📊 Zoom live participants response:', data);
        
        if (data.success && data.participants) {
          // Convert Zoom participants to our expected format with proper attendance calculation
          const rawParticipants = data.participants.map((p, index) => {
            // Safe handling of join_time from Zoom API
            let safeJoinTime;
            try {
              if (p.join_time && p.join_time !== '' && p.join_time !== 'null' && p.join_time !== 'undefined') {
                const testDate = new Date(p.join_time);
                if (!isNaN(testDate.getTime()) && testDate.getFullYear() >= 1900 && testDate.getFullYear() <= 2100) {
                  safeJoinTime = p.join_time;
                } else {
                  console.warn('Invalid join_time detected for Zoom participant:', p.user_name, p.join_time);
                  safeJoinTime = new Date().toISOString();
                }
              } else {
                safeJoinTime = new Date().toISOString();
              }
            } catch (error) {
              console.warn('Error parsing join_time for Zoom participant:', p.user_name, error);
              safeJoinTime = new Date().toISOString();
            }

            // Safe handling of leave_time from Zoom API
            let safeLeaveTime = null;
            if (p.leave_time && p.leave_time !== '' && p.leave_time !== 'null' && p.leave_time !== 'undefined') {
              try {
                const testDate = new Date(p.leave_time);
                if (!isNaN(testDate.getTime()) && testDate.getFullYear() >= 1900 && testDate.getFullYear() <= 2100) {
                  safeLeaveTime = p.leave_time;
                }
              } catch (error) {
                console.warn('Error parsing leave_time for Zoom participant:', p.user_name, error);
              }
            }

            return {
              participantName: p.user_name || p.display_name || `Participant ${index + 1}`,
              email: p.user_email || p.email || '',
              joinTime: safeJoinTime,
              leaveTime: safeLeaveTime,
              duration: p.duration || 0,
              isActive: p.status === 'in_meeting' || true,
              attendanceStatus: 'present',
              isAuthenticated: false,
              authenticatedUser: null,
              studentInfo: null
            };
          });
          
          // Calculate attendance data for each participant
          const meetingInfo = {
            startTime: data.meetingStartTime,
            endTime: data.meetingEndTime
          };
          
          const enhancedParticipants = rawParticipants.map(p => 
            calculateParticipantAttendance(p, meetingInfo)
          );
          
          const convertedData = {
            success: true,
            meetingId: targetMeetingId,
            participants: enhancedParticipants,
            statistics: {
              total: enhancedParticipants.length
            },
            authenticationStats: {
              totalAuthenticated: 0,
              authenticatedStudents: 0,
              authenticatedAdmins: 0,
              unauthenticatedParticipants: enhancedParticipants.length
            },
            attendanceStats: calculateMeetingAttendanceStats(enhancedParticipants)
          };
          
          setAttendanceData(convertedData);
          setLastUpdated(new Date());
          console.log('✅ Zoom live participants converted:', {
            participants: convertedData.participants.length
          });
          return; // Success, exit here
        }
      }

      // Fallback 4: Create empty data structure to show table
      console.log('🔄 Fallback: Creating empty data structure...');
      const emptyData = {
        success: true,
        meetingId: targetMeetingId,
        participants: [],
        statistics: { total: 0 },
        authenticationStats: {
          totalAuthenticated: 0,
          authenticatedStudents: 0,
          authenticatedAdmins: 0,
          unauthenticatedParticipants: 0
        }
      };
      
      setAttendanceData(emptyData);
      setLastUpdated(new Date());
      setError('No participant data available. Start attendance tracking or join the meeting to see participants.');
      console.log('📝 Empty data structure created for table display');

    } catch (error) {
      console.error('❌ Error fetching any attendance data:', error);
      
      // Even on error, create empty structure to show table
      const emptyData = {
        success: true,
        meetingId: targetMeetingId,
        participants: [],
        statistics: { total: 0 },
        authenticationStats: {
          totalAuthenticated: 0,
          authenticatedStudents: 0,
          authenticatedAdmins: 0,
          unauthenticatedParticipants: 0
        }
      };
      
      setAttendanceData(emptyData);
      setError(`Failed to fetch data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);


  /**
   * Fetch available meetings
   */
  const fetchMeetings = useCallback(async () => {
    try {
      // Try to get meetings from the database first (these are the meetings users actually join)
      const dbResponse = await fetch(`${backendUrl}/api/meetings`);
      
      if (dbResponse.ok) {
        const dbData = await dbResponse.json();
        if (dbData.success && dbData.data && dbData.data.length > 0) {
          // Use database meetings
          const meetingsWithStatus = dbData.data.map(meeting => ({
            id: meeting.id,
            topic: meeting.title,
            status: meeting.status || 'scheduled'
          }));
          
          setMeetings(meetingsWithStatus);
          
          // Auto-select first meeting if none selected
          if (!selectedMeeting) {
            setSelectedMeeting(meetingsWithStatus[0].id);
          }
          return;
        }
      }
      
      // Fallback to Zoom meetings if no database meetings
      const zoomResponse = await fetch(`${backendUrl}/api/zoom/meetings`);
      
      if (zoomResponse.ok) {
        const zoomData = await zoomResponse.json();
        if (zoomData.success) {
          setMeetings(zoomData.meetings || []);
          
          // Auto-select first meeting if none selected
          if (!selectedMeeting && zoomData.meetings && zoomData.meetings.length > 0) {
            const activeMeeting = zoomData.meetings.find(m => m.status === 'started' || m.status === 'waiting');
            if (activeMeeting) {
              setSelectedMeeting(activeMeeting.id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  }, [backendUrl, selectedMeeting]);

  /**
   * Set up WebSocket connection for real-time updates
   */
  const setupWebSocket = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }

    const newSocket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server');
      setSocketConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('📡 Disconnected from WebSocket server');
      setSocketConnected(false);
    });

    // Listen for user session events
    newSocket.on('userJoinedMeeting', (data) => {
      console.log('👤 User joined meeting:', data.user.username, 'in meeting', data.meetingId);
      
      if (data.meetingId === selectedMeeting) {
        // Refresh attendance data
        fetchEnrichedAttendanceData(selectedMeeting);
      }
    });

    newSocket.on('userLeftMeeting', (data) => {
      console.log('👋 User left meeting:', data.user.username, 'after', data.duration, 'minutes');
      
      if (data.meetingId === selectedMeeting) {
        // Refresh attendance data
        fetchEnrichedAttendanceData(selectedMeeting);
      }
    });

    newSocket.on('participantLinked', (data) => {
      console.log('🔗 Participant linked:', data.user.username);
      
      if (data.participant.meetingId === selectedMeeting) {
        // Refresh attendance data
        fetchEnrichedAttendanceData(selectedMeeting);
      }
    });

    // IMMEDIATE PARTICIPANT TRACKING - Listen for instant dashboard updates
    newSocket.on('participantJoinedImmediate', (data) => {
      console.log('🚀 IMMEDIATE: Participant joined dashboard tracking:', data);
      
      if (data.meetingId === selectedMeeting) {
        // Add participant to the table immediately without waiting for API refresh
        const newParticipant = {
          participantName: data.participant.participantName,
          email: data.participant.email,
          studentInfo: data.participant.studentId ? {
            studentId: data.participant.studentId,
            firstName: data.participant.studentId.split(' ')[0] || 'Student',
            lastName: data.participant.studentId.split(' ')[1] || '',
            department: 'Unknown'
          } : null,
          joinTime: data.participant.joinTime,
          duration: data.participant.duration || 0,
          isActive: data.participant.isActive,
          attendanceStatus: data.participant.attendanceStatus || 'present',
          isAuthenticated: data.participant.isAuthenticated || false,
          authenticatedUser: data.participant.authenticatedUser || null
        };
        
        // Update state immediately
        setAttendanceData(prevData => {
          if (!prevData) {
            return {
              success: true,
              meetingId: data.meetingId,
              participants: [newParticipant],
              statistics: { total: 1 },
              authenticationStats: {
                totalAuthenticated: newParticipant.isAuthenticated ? 1 : 0,
                authenticatedStudents: newParticipant.isAuthenticated && newParticipant.studentInfo ? 1 : 0,
                authenticatedAdmins: 0,
                unauthenticatedParticipants: newParticipant.isAuthenticated ? 0 : 1
              }
            };
          }
          
          // Check if participant already exists
          const existingIndex = prevData.participants.findIndex(p => 
            p.email === newParticipant.email || 
            p.participantName === newParticipant.participantName
          );
          
          let updatedParticipants;
          if (existingIndex !== -1) {
            // Update existing participant
            updatedParticipants = [...prevData.participants];
            updatedParticipants[existingIndex] = { ...updatedParticipants[existingIndex], ...newParticipant };
          } else {
            // Add new participant
            updatedParticipants = [newParticipant, ...prevData.participants];
          }
          
          // Recalculate statistics
          const totalAuth = updatedParticipants.filter(p => p.isAuthenticated).length;
          const totalStudents = updatedParticipants.filter(p => p.isAuthenticated && p.studentInfo).length;
          const totalUnauth = updatedParticipants.filter(p => !p.isAuthenticated).length;
          
          return {
            ...prevData,
            participants: updatedParticipants,
            statistics: { total: updatedParticipants.length },
            authenticationStats: {
              totalAuthenticated: totalAuth,
              authenticatedStudents: totalStudents,
              authenticatedAdmins: totalAuth - totalStudents,
              unauthenticatedParticipants: totalUnauth
            }
          };
        });
        
        console.log('✅ Participant added to admin dashboard table immediately');
        
        // Also refresh full data in background to sync
        setTimeout(() => {
          fetchEnrichedAttendanceData(selectedMeeting);
        }, 2000);
      }
    });

    // Additional event listeners for comprehensive tracking
    newSocket.on('participantJoined', (data) => {
      console.log('👥 Participant joined (general):', data);
      
      if (data.meetingId === selectedMeeting || data.participant?.meetingId === selectedMeeting) {
        // Refresh attendance data
        fetchEnrichedAttendanceData(selectedMeeting);
      }
    });

    newSocket.on('participantUpdate', (data) => {
      console.log('📊 Participant update:', data);
      
      if (data.meetingId === selectedMeeting) {
        // Refresh attendance data
        fetchEnrichedAttendanceData(selectedMeeting);
      }
    });

    newSocket.on('participantLeft', (data) => {
      console.log('👋 Participant left (general):', data);
      
      if (data.meetingId === selectedMeeting || data.participant?.meetingId === selectedMeeting) {
        // Refresh attendance data
        fetchEnrichedAttendanceData(selectedMeeting);
      }
    });

    // Generic event listener for debugging
    newSocket.onAny((eventName, data) => {
      console.log('🔍 WebSocket event received:', eventName, data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [backendUrl, selectedMeeting, fetchEnrichedAttendanceData]);

  // Initialize dashboard
  useEffect(() => {
    fetchMeetings();
    setupWebSocket();

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [fetchMeetings, setupWebSocket]);

  // Fetch data when meeting changes
  useEffect(() => {
    if (selectedMeeting) {
      fetchEnrichedAttendanceData(selectedMeeting);
      loadTrackingData(); // Load tracking data when meeting changes
    }
  }, [selectedMeeting, fetchEnrichedAttendanceData, loadTrackingData]);

  // Load tracking data on component mount
  useEffect(() => {
    loadTrackingData();
  }, [loadTrackingData]);

  // Auto-refresh timer
  useEffect(() => {
    let interval;
    
    if (autoRefresh && selectedMeeting) {
      interval = setInterval(() => {
        fetchEnrichedAttendanceData(selectedMeeting);
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedMeeting, fetchEnrichedAttendanceData]);

  /**
   * Get status color for attendance status using utility function
   */
  const getStatusColor = (status) => {
    return getAttendanceStatusColor(status);
  };

  /**
   * Get user role color
   */
  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'error';
      case 'user': return 'primary';
      case 'student': return 'success';
      default: return 'default';
    }
  };

  /**
   * Render statistics cards
   */
  const renderStatsCards = () => {
    if (!attendanceData) return null;

    const stats = attendanceData.statistics || {};
    const authStats = attendanceData.authenticationStats || {};

    const cards = [
      {
        title: 'Total Participants',
        value: stats.total || 0,
        icon: <People />,
        color: 'primary'
      },
      {
        title: 'Authenticated Users',
        value: authStats.totalAuthenticated || 0,
        icon: <AdminPanelSettings />,
        color: 'success'
      },
      {
        title: 'Students Identified',
        value: authStats.authenticatedStudents || 0,
        icon: <School />,
        color: 'info'
      },
      {
        title: 'Guest Users',
        value: authStats.unauthenticatedParticipants || 0,
        icon: <Person />,
        color: 'warning'
      }
    ];

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      bgcolor: `${card.color}.main`,
                      color: 'white',
                      mr: 2
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Box>
                    <Typography variant="h4" color={`${card.color}.main`}>
                      {card.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  /**
   * Render join tracking data section
   */
  const renderJoinTrackingData = () => {
    const hasTrackingData = trackingData && trackingData.length > 0;
    
    return (
      <Accordion elevation={2} sx={{ mb: 3 }}>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="tracking-data-content"
          id="tracking-data-header"
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrackChanges color="primary" />
              <Typography variant="h6">
                Join Tracking Data ({trackingData.length})
              </Typography>
            </Box>
            <Chip
              size="small"
              label={`${trackingData.length} join events`}
              color={hasTrackingData ? 'success' : 'default'}
              icon={<Timeline />}
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {hasTrackingData ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                📊 Join tracking responses stored in localStorage when users join meetings from the user dashboard.
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Meeting</TableCell>
                      <TableCell>Participant Count</TableCell>
                      <TableCell>Tracking ID</TableCell>
                      <TableCell>Response Message</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trackingData.map((item, index) => (
                      <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {safeFormatJoinTime(item.timestamp)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {safeDateFormat(item.timestamp, 'MMM dd, yyyy', 'Unknown Date')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {item.userName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.userEmail}
                            </Typography>
                            <br />
                            <Chip
                              size="small"
                              label={`ID: ${item.studentId}`}
                              color="info"
                              variant="outlined"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {item.meetingTopic}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Meeting ID: {item.meetingId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`#${item.participantCount}`}
                            color="success"
                            size="small"
                            icon={<People />}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="caption" 
                            fontFamily="monospace"
                            sx={{ 
                              bgcolor: 'grey.100', 
                              p: 0.5, 
                              borderRadius: 0.5,
                              fontSize: '0.7rem'
                            }}
                          >
                            {item.trackingId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="success.main">
                            {item.message}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Storage sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Join Tracking Data
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedMeeting 
                  ? 'No join tracking data found for this meeting. Data is stored when users join meetings from the user dashboard.' 
                  : 'Select a meeting to view join tracking data specific to that meeting.'}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadTrackingData}
                size="small"
              >
                Refresh Tracking Data
              </Button>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    );
  };

  /**
   * Render participants table (always visible when meeting selected)
   */
  const renderMeetingParticipantsTable = () => {
    const participants = attendanceData?.participants || [];
    const participantCount = participants.length;

    return (
      <Card elevation={2}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Meeting Participants ({participantCount})
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Badge
                color={socketConnected ? 'success' : 'error'}
                variant="dot"
              >
                <Tooltip title={socketConnected ? 'Real-time updates active' : 'Disconnected'}>
                  <IconButton size="small">
                    {socketConnected ? <Wifi /> : <WifiOff />}
                  </IconButton>
                </Tooltip>
              </Badge>
              <Button
                startIcon={<Refresh />}
                onClick={() => fetchEnrichedAttendanceData(selectedMeeting)}
                disabled={loading}
                size="small"
              >
                Refresh
              </Button>
            </Box>
          </Box>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Participant</TableCell>
                  <TableCell>Authentication Status</TableCell>
                  <TableCell>User Details</TableCell>
                  <TableCell>Student Info</TableCell>
                  <TableCell>Join Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {participantCount > 0 ? (
                  participants.map((participant, index) => {
                    const isAuth = participant.isAuthenticated;
                    const authUser = participant.authenticatedUser;
                    const student = participant.studentInfo;

                    return (
                      <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                        {/* Participant Name */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 1, bgcolor: isAuth ? 'success.main' : 'grey.400' }}>
                              {isAuth ? <CheckCircle /> : <Person />}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {participant.participantName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {participant.email || 'No email'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Authentication Status */}
                        <TableCell>
                          <Chip
                            label={isAuth ? 'Authenticated' : 'Guest'}
                            color={isAuth ? 'success' : 'default'}
                            size="small"
                            icon={isAuth ? <CheckCircle /> : <Cancel />}
                          />
                        </TableCell>

                        {/* User Details */}
                        <TableCell>
                          {isAuth && authUser ? (
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {authUser.username}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {authUser.email}
                              </Typography>
                              <br />
                              <Chip
                                label={authUser.role}
                                color={getRoleColor(authUser.role)}
                                size="small"
                              />
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Not authenticated
                            </Typography>
                          )}
                        </TableCell>

                        {/* Student Info */}
                        <TableCell>
                          {student ? (
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {student.firstName} {student.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {student.studentId}
                              </Typography>
                              <br />
                              <Typography variant="caption" color="text.secondary">
                                {student.department}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Not a student
                            </Typography>
                          )}
                        </TableCell>

                        {/* Join Time */}
                        <TableCell>
                          <Typography variant="body2">
                            {safeFormatJoinTime(participant.joinTime)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {safeFormatShortDate(participant.joinTime)}
                          </Typography>
                        </TableCell>

                        {/* Duration */}
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {participant.duration ? `${participant.duration} min` : 'In progress'}
                          </Typography>
                          {participant.isActive && (
                            <Chip label="Active" color="success" size="small" />
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={participant.attendanceStatus || 'Unknown'}
                              color={getStatusColor(participant.attendanceStatus)}
                              size="small"
                            />
                            {participant.attendancePercentage !== undefined && (
                              <Typography variant="caption" color="text.secondary">
                                {formatAttendancePercentage(participant.attendancePercentage)}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                      <Box>
                        <People sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No Participants Yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {loading 
                            ? 'Loading participant data...' 
                            : error 
                              ? 'Failed to load participant data. Click Refresh to try again.' 
                              : 'When users join meetings from the user dashboard, they will appear here in real-time.'
                          }
                        </Typography>
                        {!loading && (
                          <Button
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={() => fetchEnrichedAttendanceData(selectedMeeting)}
                            size="small"
                          >
                            Refresh Data
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Enhanced Admin Attendance Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          {/* Meeting Selector */}
          <TextField
            select
            label="Select Meeting"
            value={selectedMeeting}
            onChange={(e) => setSelectedMeeting(e.target.value)}
            sx={{ minWidth: 300 }}
            size="small"
          >
            {meetings.map((meeting) => (
              <option key={meeting.id} value={meeting.id}>
                {meeting.topic} ({meeting.status})
              </option>
            ))}
          </TextField>

          {/* Info Text */}
          {selectedMeeting && (
            <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 0.5, bgcolor: 'info.light', borderRadius: 1 }}>
              📡 Attendance is tracked automatically when users join meetings
            </Typography>
          )}

          {/* Auto-refresh Toggle */}
          <Button
            variant="outlined"
            startIcon={autoRefresh ? <Refresh /> : <Cancel />}
            onClick={() => setAutoRefresh(!autoRefresh)}
            color={autoRefresh ? 'success' : 'default'}
          >
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>

          {/* Last Updated */}
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Last updated: {safeFormatLastUpdated(lastUpdated)}
            </Typography>
          )}
        </Box>

        {/* Connection Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge color={socketConnected ? 'success' : 'error'} variant="dot">
            <Typography variant="body2">
              Real-time updates: {socketConnected ? 'Connected' : 'Disconnected'}
            </Typography>
          </Badge>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && !attendanceData && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* No Meeting Selected */}
      {!selectedMeeting && !loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Please select a meeting to view attendance data.
        </Alert>
      )}

      {/* Dashboard Content */}
      {selectedMeeting ? (
        <>
          {/* Statistics Cards */}
          {attendanceData && renderStatsCards()}

          {/* Authentication Stats */}
          {attendanceData?.authenticationStats && (
            <Card elevation={2} sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Authentication Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="h4" color="primary">
                      {attendanceData.authenticationStats.totalAuthenticated || 0}
                    </Typography>
                    <Typography variant="caption">Total Authenticated</Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="h4" color="success.main">
                      {attendanceData.authenticationStats.authenticatedStudents || 0}
                    </Typography>
                    <Typography variant="caption">Students</Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="h4" color="error.main">
                      {attendanceData.authenticationStats.authenticatedAdmins || 0}
                    </Typography>
                    <Typography variant="caption">Admins</Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="h4" color="warning.main">
                      {attendanceData.authenticationStats.unauthenticatedParticipants || 0}
                    </Typography>
                    <Typography variant="caption">Guests</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Join Tracking Data Section */}
          {renderJoinTrackingData()}

          {/* Participants Table - Always show when meeting is selected */}
          {renderMeetingParticipantsTable()}
        </>
      ) : null}
    </Box>
  );
};

export default EnhancedAdminAttendanceDashboard;
