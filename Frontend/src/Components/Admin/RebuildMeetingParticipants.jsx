import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  TextField,
  LinearProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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
  Warning,
  Info
} from '@mui/icons-material';
import { format } from 'date-fns';
import io from 'socket.io-client';

const RebuildMeetingParticipants = () => {
  // State management
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState('');
  const [participants, setParticipants] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [dataSource, setDataSource] = useState('none');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Ref to track current meeting ID for WebSocket events
  const currentMeetingRef = useRef('');
  // Ref to store stable fetchParticipantData function for WebSocket
  const fetchParticipantDataRef = useRef();

  const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

  /**
   * Comprehensive data fetching with multiple fallbacks
   */
  const fetchParticipantData = useCallback(async (meetingId, force = false) => {
    if (!meetingId) {
      setParticipants([]);
      setStatistics(null);
      setDataSource('none');
      return;
    }

    if (!force && loading) return;

    setLoading(true);
    setError(null);

    console.log(`🔍 Fetching participants for meeting: ${meetingId}`);

    const endpoints = [
      {
        name: 'AttendanceTracker (Enriched)',
        url: `${backendUrl}/api/attendance-tracker/attendance/${meetingId}?enriched=true`,
        parser: (data) => ({
          participants: data.participants || [],
          statistics: data.statistics || {},
          authStats: data.authenticationStats || {}
        })
      },
      {
        name: 'AttendanceTracker (Regular)',
        url: `${backendUrl}/api/attendance-tracker/attendance/${meetingId}`,
        parser: (data) => ({
          participants: data.participants || [],
          statistics: data.statistics || {},
          authStats: data.authenticationStats || {}
        })
      },
      {
        name: 'Webhook Attendance',
        url: `${backendUrl}/api/webhooks/attendance/${meetingId}`,
        parser: (data) => ({
          participants: data.participants || [],
          statistics: {
            total: data.summary?.total || 0,
            present: data.summary?.present || 0,
            inProgress: data.summary?.inProgress || 0,
            students: data.summary?.students || 0
          },
          authStats: {
            totalAuthenticated: 0,
            authenticatedStudents: data.summary?.students || 0,
            unauthenticatedParticipants: (data.summary?.total || 0) - (data.summary?.students || 0)
          }
        })
      },
      {
        name: 'Zoom Live Participants',
        url: `${backendUrl}/api/zoom/meeting/${meetingId}/live-participants`,
        parser: (data) => ({
          participants: (data.participants || []).map(p => ({
            participantName: p.user_name || p.display_name,
            email: p.user_email || p.email,
            joinTime: p.join_time || new Date().toISOString(),
            duration: p.duration || 0,
            isActive: p.status === 'in_meeting',
            attendanceStatus: 'present',
            isAuthenticated: false,
            studentInfo: null
          })),
          statistics: {
            total: data.participants?.length || 0,
            present: data.participants?.length || 0,
            inProgress: 0,
            students: 0
          },
          authStats: {
            totalAuthenticated: 0,
            authenticatedStudents: 0,
            unauthenticatedParticipants: data.participants?.length || 0
          }
        })
      }
    ];

    let dataFound = false;
    let finalData = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`🔗 Trying: ${endpoint.name} - ${endpoint.url}`);
        
        const response = await fetch(endpoint.url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`📊 ${endpoint.name} response:`, data);

          if (data.success !== false && (data.participants?.length > 0 || data.success === true)) {
            const parsedData = endpoint.parser(data);
            console.log(`✅ ${endpoint.name} - Found ${parsedData.participants.length} participants`);
            
            finalData = parsedData;
            setDataSource(endpoint.name);
            dataFound = true;
            break;
          } else {
            console.log(`ℹ️ ${endpoint.name} - No participants found`);
          }
        } else {
          console.log(`❌ ${endpoint.name} - HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name} - Error:`, error.message);
      }
    }

    if (dataFound && finalData) {
      setParticipants(finalData.participants);
      setStatistics({
        ...finalData.statistics,
        ...finalData.authStats
      });
      setError(null);
      setLastUpdated(new Date());
      console.log(`🎉 Successfully loaded ${finalData.participants.length} participants from ${dataSource}`);
    } else {
      // Create empty state but don't show error
      setParticipants([]);
      setStatistics({
        total: 0,
        present: 0,
        inProgress: 0,
        students: 0,
        totalAuthenticated: 0,
        authenticatedStudents: 0,
        unauthenticatedParticipants: 0
      });
      setDataSource('none');
      setError('No participants found. When users join meetings, they will appear here.');
      setLastUpdated(new Date());
    }

    setLoading(false);
  }, [backendUrl]);

  // Update the ref whenever fetchParticipantData changes
  useEffect(() => {
    fetchParticipantDataRef.current = fetchParticipantData;
  }, [fetchParticipantData]);

  /**
   * Load available meetings
   */
  const fetchMeetings = useCallback(async () => {
    try {
      console.log('📋 Loading meetings...');
      
      // Try multiple meeting sources
      const sources = [
        `${backendUrl}/api/zoom/meetings`,
        `${backendUrl}/api/meetings`
      ];

      let meetingsFound = false;

      for (const url of sources) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.meetings?.length > 0) {
              console.log(`✅ Found ${data.meetings.length} meetings from ${url}`);
              setMeetings(data.meetings);
              meetingsFound = true;
              break;
            } else if (data.data?.length > 0) {
              // Database format
              const formattedMeetings = data.data.map(meeting => ({
                id: meeting.id,
                topic: meeting.title,
                status: meeting.status || 'scheduled'
              }));
              console.log(`✅ Found ${formattedMeetings.length} meetings from database`);
              setMeetings(formattedMeetings);
              meetingsFound = true;
              break;
            }
          }
        } catch (error) {
          console.log(`❌ Failed to fetch from ${url}:`, error.message);
        }
      }

      if (!meetingsFound) {
        setMeetings([]);
      }
    } catch (error) {
      console.error('❌ Error loading meetings:', error);
      setMeetings([]);
    }
  }, [backendUrl]);

  /**
   * Initialize data injection for testing
   */
  const injectTestData = useCallback(async () => {
    const testMeetingId = selectedMeeting || meetings[0]?.id;
    if (!testMeetingId) return;

    console.log('💉 Injecting test data...');
    
    const testParticipants = [
      {
        participantName: 'John Smith',
        email: 'john.smith@university.edu',
        joinTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        duration: 15,
        isActive: true,
        attendanceStatus: 'In Progress',
        isAuthenticated: true,
        studentInfo: {
          firstName: 'John',
          lastName: 'Smith',
          studentId: 'STU2024001',
          department: 'Computer Science'
        },
        authenticatedUser: {
          username: 'john.smith',
          email: 'john.smith@university.edu',
          role: 'student'
        }
      },
      {
        participantName: 'Sarah Johnson',
        email: 'sarah.johnson@university.edu',
        joinTime: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        duration: 25,
        isActive: true,
        attendanceStatus: 'In Progress',
        isAuthenticated: true,
        studentInfo: {
          firstName: 'Sarah',
          lastName: 'Johnson',
          studentId: 'STU2024002',
          department: 'Engineering'
        },
        authenticatedUser: {
          username: 'sarah.johnson',
          email: 'sarah.johnson@university.edu',
          role: 'student'
        }
      },
      {
        participantName: 'Dr. Mike Wilson',
        email: 'mike.wilson@university.edu',
        joinTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        duration: 30,
        isActive: true,
        attendanceStatus: 'present',
        isAuthenticated: true,
        authenticatedUser: {
          username: 'mike.wilson',
          email: 'mike.wilson@university.edu',
          role: 'admin'
        }
      },
      {
        participantName: 'Guest User',
        email: '',
        joinTime: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        duration: 8,
        isActive: true,
        attendanceStatus: 'In Progress',
        isAuthenticated: false
      }
    ];

    setParticipants(testParticipants);
    setStatistics({
      total: testParticipants.length,
      present: testParticipants.filter(p => p.attendanceStatus === 'present').length,
      inProgress: testParticipants.filter(p => p.attendanceStatus === 'In Progress').length,
      students: testParticipants.filter(p => p.studentInfo).length,
      totalAuthenticated: testParticipants.filter(p => p.isAuthenticated).length,
      authenticatedStudents: testParticipants.filter(p => p.isAuthenticated && p.studentInfo).length,
      unauthenticatedParticipants: testParticipants.filter(p => !p.isAuthenticated).length
    });
    setDataSource('Test Data Injection');
    setLastUpdated(new Date());
    setError(null);

    console.log('✅ Test data injected successfully');
  }, [selectedMeeting, meetings]);

  /**
   * WebSocket setup
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
      console.log('🔌 WebSocket connected');
      setSocketConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('📡 WebSocket disconnected');
      setSocketConnected(false);
    });

    // Real-time participant events
    newSocket.on('participantJoinedImmediate', (data) => {
      console.log('🚀 Real-time participant joined:', data);
      const currentMeetingId = currentMeetingRef.current;
      if (data.meetingId === currentMeetingId || data.meetingId) {
        fetchParticipantDataRef.current?.(data.meetingId || currentMeetingId, true);
      }
    });

    newSocket.on('participantJoined', (data) => {
      console.log('👥 Participant joined:', data);
      const currentMeetingId = currentMeetingRef.current;
      const targetMeeting = data.meetingId || data.participant?.meetingId || currentMeetingId;
      if (targetMeeting) {
        fetchParticipantDataRef.current?.(targetMeeting, true);
      }
    });

    newSocket.on('participantLeft', (data) => {
      console.log('👋 Participant left:', data);
      const currentMeetingId = currentMeetingRef.current;
      const targetMeeting = data.meetingId || data.participant?.meetingId || currentMeetingId;
      if (targetMeeting) {
        fetchParticipantDataRef.current?.(targetMeeting, true);
      }
    });

    newSocket.on('participantUpdate', (data) => {
      console.log('📊 Participant updated:', data);
      const currentMeetingId = currentMeetingRef.current;
      if (data.meetingId === currentMeetingId || data.meetingId) {
        fetchParticipantDataRef.current?.(data.meetingId || currentMeetingId, true);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [backendUrl]);

  // Initialize component
  useEffect(() => {
    fetchMeetings();
    setupWebSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [fetchMeetings, setupWebSocket]);

  // Fetch data when meeting changes
  useEffect(() => {
    currentMeetingRef.current = selectedMeeting;
    if (selectedMeeting) {
      fetchParticipantData(selectedMeeting);
    }
  }, [selectedMeeting]);

  // Auto-refresh
  useEffect(() => {
    let interval;
    if (autoRefresh && selectedMeeting) {
      interval = setInterval(() => {
        fetchParticipantData(selectedMeeting, true);
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedMeeting]);

  /**
   * Utility functions
   */
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'present': return 'success';
      case 'in progress': return 'info';
      case 'late': return 'warning';
      case 'partial': return 'warning';
      case 'absent': return 'error';
      case 'left early': return 'error';
      default: return 'default';
    }
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'error';
      case 'student': return 'success';
      case 'user': return 'primary';
      default: return 'default';
    }
  };

  const formatDate = (dateValue, formatString) => {
    try {
      if (!dateValue) return 'N/A';
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return format(date, formatString);
    } catch (error) {
      console.warn('Date formatting error:', error, 'for value:', dateValue);
      return 'Invalid Date';
    }
  };

  /**
   * Render statistics cards
   */
  const renderStatsCards = () => {
    if (!statistics) return null;

    const cards = [
      {
        title: 'Total Participants',
        value: statistics.total || 0,
        icon: <People />,
        color: 'primary'
      },
      {
        title: 'Authenticated',
        value: statistics.totalAuthenticated || 0,
        icon: <AdminPanelSettings />,
        color: 'success'
      },
      {
        title: 'Students',
        value: statistics.authenticatedStudents || 0,
        icon: <School />,
        color: 'info'
      },
      {
        title: 'Guests',
        value: statistics.unauthenticatedParticipants || 0,
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
   * Render participants table
   */
  const renderParticipantsTable = () => {
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
                <Tooltip title={socketConnected ? 'Real-time connected' : 'Disconnected'}>
                  <IconButton size="small">
                    {socketConnected ? <Wifi /> : <WifiOff />}
                  </IconButton>
                </Tooltip>
              </Badge>
              <Button
                startIcon={<Refresh />}
                onClick={() => fetchParticipantData(selectedMeeting, true)}
                disabled={loading}
                size="small"
              >
                Refresh
              </Button>
              <Button
                startIcon={<PersonAdd />}
                onClick={injectTestData}
                variant="outlined"
                size="small"
                color="secondary"
              >
                Inject Test Data
              </Button>
            </Box>
          </Box>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Participant</TableCell>
                  <TableCell>Authentication</TableCell>
                  <TableCell>User Details</TableCell>
                  <TableCell>Student Info</TableCell>
                  <TableCell>Join Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {participants.length > 0 ? (
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
                            {formatDate(participant.joinTime, 'HH:mm:ss')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(participant.joinTime, 'MMM dd')}
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
                              ? error
                              : 'When users join meetings, they will appear here in real-time.'
                          }
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Button
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={() => fetchParticipantData(selectedMeeting, true)}
                            size="small"
                          >
                            Refresh Data
                          </Button>
                          <Button
                            variant="contained"
                            startIcon={<PersonAdd />}
                            onClick={injectTestData}
                            size="small"
                            color="secondary"
                          >
                            Add Test Data
                          </Button>
                        </Box>
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
          Meeting Participants Dashboard
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Select Meeting</InputLabel>
              <Select
                value={selectedMeeting}
                onChange={(e) => setSelectedMeeting(e.target.value)}
                label="Select Meeting"
              >
                {meetings.map((meeting) => (
                  <MenuItem key={meeting.id} value={meeting.id}>
                    {meeting.topic} ({meeting.id})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Badge color={socketConnected ? 'success' : 'error'} variant="dot">
                <Typography variant="body2">
                  Real-time: {socketConnected ? 'Connected' : 'Disconnected'}
                </Typography>
              </Badge>
              
              {dataSource && dataSource !== 'none' && (
                <Chip 
                  label={`Source: ${dataSource}`} 
                  size="small" 
                  variant="outlined"
                />
              )}

              {lastUpdated && (
                <Typography variant="caption" color="text.secondary">
                  Updated: {formatDate(lastUpdated, 'HH:mm:ss')}
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={autoRefresh ? <Refresh /> : <Cancel />}
              onClick={() => setAutoRefresh(!autoRefresh)}
              color={autoRefresh ? 'success' : 'default'}
              size="small"
              fullWidth
            >
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Error Display */}
      {error && participants.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* No Meeting Selected */}
      {!selectedMeeting && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Please select a meeting to view participant data.
        </Alert>
      )}

      {/* Dashboard Content */}
      {selectedMeeting && (
        <>
          {/* Statistics Cards */}
          {statistics && renderStatsCards()}

          {/* Participants Table */}
          {renderParticipantsTable()}
        </>
      )}
    </Box>
  );
};

export default RebuildMeetingParticipants;
