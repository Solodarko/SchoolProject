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
  Divider
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
  Person
} from '@mui/icons-material';
import { format } from 'date-fns';
import io from 'socket.io-client';

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

  const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

  /**
   * Fetch enriched attendance data from backend
   */
  const fetchEnrichedAttendanceData = useCallback(async (targetMeetingId) => {
    if (!targetMeetingId) {
      console.warn('⚠️ No meeting ID provided for attendance fetch');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      if (!authToken) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      console.log(`🔍 Fetching enriched attendance for meeting: ${targetMeetingId}`);

      const response = await fetch(
        `${backendUrl}/api/attendance-tracker/attendance/${targetMeetingId}?enriched=true`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch data: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setAttendanceData(data);
        setLastUpdated(new Date());
        
        console.log('✅ Enriched attendance data received:', {
          participants: data.participants?.length || 0,
          authenticated: data.authenticationStats?.totalAuthenticated || 0,
          students: data.authenticationStats?.authenticatedStudents || 0
        });
      } else {
        throw new Error(data.error || 'Failed to fetch attendance data');
      }

    } catch (error) {
      console.error('❌ Error fetching enriched attendance:', error);
      setError(error.message);
      setAttendanceData(null);
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  /**
   * Fetch available meetings
   */
  const fetchMeetings = useCallback(async () => {
    try {
      const response = await fetch(`${backendUrl}/api/zoom/meetings`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMeetings(data.meetings || []);
          
          // Auto-select first meeting if none selected
          if (!selectedMeeting && data.meetings && data.meetings.length > 0) {
            const activeMeeting = data.meetings.find(m => m.status === 'started' || m.status === 'waiting');
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
    }
  }, [selectedMeeting, fetchEnrichedAttendanceData]);

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
   * Get status color for attendance status
   */
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'present': return 'success';
      case 'in progress': return 'info';
      case 'late': return 'warning';
      case 'partial': return 'warning';
      case 'absent': return 'error';
      default: return 'default';
    }
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
   * Render participants table (always visible when meeting selected)
   */
  const renderAlwaysVisibleParticipantsTable = () => {
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
                            {format(new Date(participant.joinTime), 'HH:mm:ss')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(participant.joinTime), 'MMM dd')}
                          </Typography>
                        </TableCell>

                        {/* Duration */}
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {participant.duration} min
                          </Typography>
                          {participant.isActive && (
                            <Chip label="Active" color="success" size="small" />
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Chip
                            label={participant.attendanceStatus}
                            color={getStatusColor(participant.attendanceStatus)}
                            size="small"
                          />
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

  /**
   * Render participants table (legacy version - only shows when data exists)
   */
  const renderParticipantsTable = () => {
    if (!attendanceData || !attendanceData.participants) return null;

    const participants = attendanceData.participants;

    return (
      <Card elevation={2}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Meeting Participants ({participants.length})
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
                {participants.map((participant, index) => {
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
                          {format(new Date(participant.joinTime), 'HH:mm:ss')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(participant.joinTime), 'MMM dd')}
                        </Typography>
                      </TableCell>

                      {/* Duration */}
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {participant.duration} min
                        </Typography>
                        {participant.isActive && (
                          <Chip label="Active" color="success" size="small" />
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Chip
                          label={participant.attendanceStatus}
                          color={getStatusColor(participant.attendanceStatus)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {participants.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No participants found for this meeting
              </Typography>
            </Box>
          )}
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
              Last updated: {format(lastUpdated, 'HH:mm:ss')}
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

          {/* Participants Table - Always show when meeting is selected */}
          {renderAlwaysVisibleParticipantsTable()}
        </>
      ) : null}
    </Box>
  );
};

export default EnhancedAdminAttendanceDashboard;
