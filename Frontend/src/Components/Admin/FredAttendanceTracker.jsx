import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
  Paper,
  Divider,
  Stack,
  useTheme,
  alpha,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Refresh,
  VideoCall,
  CheckCircle,
  Cancel,
  Person,
  School,
  TrendingUp,
  Timer,
  Analytics,
  PlayArrow,
  Stop,
  Visibility,
  PersonAdd,
  Celebration,
  EmojiEvents,
  Grade
} from '@mui/icons-material';
import { safeFormatJoinTime, safeFormatLastUpdated } from '../../utils/safeDateFormat';

const FredAttendanceTracker = () => {
  const theme = useTheme();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [testDialog, setTestDialog] = useState(false);
  const [webSocketConnected, setWebSocketConnected] = useState(false);

  const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // Test meeting ID from our successful test
  const [currentMeetingId, setCurrentMeetingId] = useState('');
  
  // Test data for demo purposes - representing Fred's successful test
  const mockTestData = {
    success: true,
    meetingInfo: {
      meetingId: 'fred_85percent_success_1755677713551',
      topic: 'Fred 85% Attendance Test Meeting',
      duration: 60
    },
    participants: [
      {
        participantId: 'fred_success_1755677713719',
        participantName: 'fred',
        email: 'fred@gmail.com',
        joinTime: new Date(Date.now() - 52 * 60 * 1000).toISOString(),
        leaveTime: new Date().toISOString(),
        duration: 52,
        percentage: 87,
        status: 'Present',
        studentInfo: {
          studentId: 'FRED001',
          firstName: 'Fred',
          lastName: 'TestUser',
          fullName: 'Fred TestUser',
          department: 'Computer Science',
          email: 'fred@gmail.com',
          isMatched: true
        },
        authenticatedUser: {
          userId: 'fred_test_user_123',
          username: 'fred',
          email: 'fred@gmail.com',
          role: 'user',
          joinedViaAuth: true
        },
        source: 'jwt_token',
        meetingDuration: 60,
        attendanceThreshold: 85
      },
      {
        participantId: 'alice_1755677713720',
        participantName: 'alice',
        email: 'alice@example.com',
        joinTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        leaveTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        duration: 30,
        percentage: 50,
        status: 'Absent',
        studentInfo: null,
        authenticatedUser: null,
        source: 'zoom_webhook',
        meetingDuration: 60,
        attendanceThreshold: 85
      },
      {
        participantId: 'bob_1755677713721',
        participantName: 'bob',
        email: 'bob@example.com',
        joinTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        leaveTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        duration: 45,
        percentage: 75,
        status: 'Absent',
        studentInfo: null,
        authenticatedUser: null,
        source: 'zoom_webhook',
        meetingDuration: 60,
        attendanceThreshold: 85
      },
      {
        participantId: 'charlie_1755677713722',
        participantName: 'charlie',
        email: 'charlie@example.com',
        joinTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        leaveTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        duration: 55,
        percentage: 92,
        status: 'Present',
        studentInfo: {
          studentId: 'CHAR001',
          firstName: 'Charlie',
          lastName: 'Brown',
          fullName: 'Charlie Brown',
          department: 'Mathematics',
          email: 'charlie@example.com',
          isMatched: true
        },
        authenticatedUser: null,
        source: 'zoom_webhook',
        meetingDuration: 60,
        attendanceThreshold: 85
      }
    ],
    statistics: {
      totalParticipants: 4,
      presentCount: 2,
      absentCount: 2,
      inProgressCount: 0,
      above85Percent: 2,
      below85Percent: 2,
      averageAttendance: 76,
      authenticatedCount: 1,
      studentsIdentified: 2,
      meetingDuration: 60,
      attendanceThreshold: 85
    }
  };

  /**
   * Load test data
   */
  const loadTestData = useCallback(async (meetingId = null) => {
    if (!meetingId && !currentMeetingId) {
      // Use mock data if no meeting ID
      setTestData(mockTestData);
      setLastUpdated(new Date());
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const targetMeetingId = meetingId || currentMeetingId;
      
      // Try to fetch real data from our test meeting
      const response = await fetch(
        `${backendUrl}/api/zoom/meeting/${targetMeetingId}/attendance-tracker?threshold=85`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.participants.length > 0) {
          setTestData(data);
          setLastUpdated(new Date());
          console.log('✅ Real data loaded:', data);
        } else {
          // Fallback to mock data
          console.log('ℹ️ No real data found, using mock data');
          setTestData(mockTestData);
          setLastUpdated(new Date());
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load real data, using mock data:', error);
      setTestData(mockTestData);
      setLastUpdated(new Date());
      setError(`Using demo data (${error.message})`);
    } finally {
      setLoading(false);
    }
  }, [currentMeetingId, backendUrl]);

  /**
   * Start real-time WebSocket tracking
   */
  const startRealTimeTracking = async () => {
    try {
      if (currentMeetingId) {
        const response = await fetch(
          `${backendUrl}/api/zoom/meeting/${currentMeetingId}/attendance-tracker/start-websocket`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interval: 3000 })
          }
        );
        
        if (response.ok) {
          setWebSocketConnected(true);
          setRealTimeUpdates(true);
          console.log('✅ WebSocket tracking started');
        }
      }
    } catch (error) {
      console.error('❌ Failed to start WebSocket tracking:', error);
    }
  };

  /**
   * Stop real-time tracking
   */
  const stopRealTimeTracking = () => {
    setRealTimeUpdates(false);
    setWebSocketConnected(false);
    console.log('🛑 WebSocket tracking stopped');
  };

  // Initialize with test data
  useEffect(() => {
    loadTestData();
  }, [loadTestData]);

  // Real-time update simulation
  useEffect(() => {
    let interval;
    if (realTimeUpdates) {
      interval = setInterval(() => {
        loadTestData();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [realTimeUpdates, loadTestData]);

  /**
   * Get status color based on attendance
   */
  const getStatusColor = (participant) => {
    if (participant.status === 'In Progress') return 'info';
    return participant.percentage >= 85 ? 'success' : 'error';
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (participant) => {
    if (participant.status === 'In Progress') return <Timer color="info" />;
    return participant.percentage >= 85 ? <CheckCircle color="success" /> : <Cancel color="error" />;
  };

  /**
   * Format duration for display
   */
  const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return '0 min';
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    return `${minutes} min`;
  };

  // Statistics Cards Component
  const StatisticsCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <Person color="primary" />
              <Box>
                <Typography variant="h4" color="primary">{testData?.statistics.totalParticipants || 0}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Participants
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <CheckCircle color="success" />
              <Box>
                <Typography variant="h4" color="success.main">{testData?.statistics.presentCount || 0}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Present (≥85%)
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: alpha(theme.palette.error.main, 0.1) }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <Cancel color="error" />
              <Box>
                <Typography variant="h4" color="error.main">{testData?.statistics.absentCount || 0}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Absent (\u003c85%)
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <TrendingUp color="info" />
              <Box>
                <Typography variant="h4" color="info.main">{testData?.statistics.averageAttendance || 0}%</Typography>
                <Typography variant="body2" color="textSecondary">
                  Average Attendance
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Fred Success Highlight Component
  const FredSuccessHighlight = () => {
    const fredParticipant = testData?.participants.find(p => p.participantName === 'fred');
    if (!fredParticipant) return null;

    return (
      <Card sx={{ mb: 3, bgcolor: alpha(theme.palette.success.main, 0.05), border: `2px solid ${alpha(theme.palette.success.main, 0.3)}` }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <EmojiEvents color="success" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h5" color="success.main" fontWeight="bold">
                🎉 Fred's Success Story!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Fred has successfully met the 85% attendance requirement!
              </Typography>
            </Box>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box p={2} bgcolor={alpha(theme.palette.success.main, 0.1)} borderRadius={1}>
                <Typography variant="h6" color="success.main" gutterBottom fontWeight="bold">
                  Fred's Attendance Details:
                </Typography>
                <Stack spacing={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">👤 Name:</Typography>
                    <Typography variant="body2" fontWeight="bold">{fredParticipant.participantName}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">📧 Email:</Typography>
                    <Typography variant="body2" fontWeight="bold">{fredParticipant.email}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">⏱️ Duration:</Typography>
                    <Typography variant="body2" fontWeight="bold">{fredParticipant.duration} minutes</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">📊 Percentage:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="success.main">{fredParticipant.percentage}%</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">🎯 Status:</Typography>
                    <Chip label={fredParticipant.status} color="success" size="small" icon={<Grade />} />
                  </Box>
                </Stack>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box p={2} bgcolor={alpha(theme.palette.info.main, 0.1)} borderRadius={1}>
                <Typography variant="h6" color="info.main" gutterBottom fontWeight="bold">
                  Authentication & Student Info:
                </Typography>
                <Stack spacing={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">🔐 Authenticated:</Typography>
                    <Chip label="Yes (JWT Token)" color="info" size="small" />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">👤 User ID:</Typography>
                    <Typography variant="body2" fontFamily="monospace">{fredParticipant.authenticatedUser?.userId}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">🎓 Student Match:</Typography>
                    <Chip label={fredParticipant.studentInfo ? "Matched" : "Not Matched"} 
                          color={fredParticipant.studentInfo ? "success" : "default"} size="small" />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">🔗 Data Source:</Typography>
                    <Typography variant="body2" fontWeight="bold">{fredParticipant.source}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">✅ 85% Threshold:</Typography>
                    <Chip label="MET" color="success" size="small" icon={<Celebration />} />
                  </Box>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box p={3}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom display="flex" alignItems="center" gap={2}>
          <VideoCall color="primary" />
          Fred's 85% Attendance Tracker Demo
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Live demonstration of the 85% Zoom Attendance Duration Tracker with Fred's successful test data
        </Typography>
      </Box>

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              label="Meeting ID"
              value={currentMeetingId}
              onChange={(e) => setCurrentMeetingId(e.target.value)}
              placeholder="fred_85percent_success_1755677713551"
              size="small"
              sx={{ minWidth: 300 }}
            />
            
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => loadTestData(currentMeetingId)}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh Data'}
            </Button>

            <Button
              variant={realTimeUpdates ? "contained" : "outlined"}
              color={realTimeUpdates ? "error" : "success"}
              startIcon={realTimeUpdates ? <Stop /> : <PlayArrow />}
              onClick={realTimeUpdates ? stopRealTimeTracking : startRealTimeTracking}
            >
              {realTimeUpdates ? 'Stop Real-time' : 'Start Real-time'}
            </Button>

            <Button
              variant="outlined"
              color="info"
              startIcon={<Visibility />}
              onClick={() => setTestDialog(true)}
            >
              View Test Details
            </Button>

            <FormControlLabel
              control={
                <Switch
                  checked={webSocketConnected}
                  color="success"
                  disabled
                />
              }
              label={webSocketConnected ? "WebSocket Connected" : "WebSocket Disconnected"}
            />
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Fred Success Highlight */}
      {testData && <FredSuccessHighlight />}

      {/* Statistics Cards */}
      {testData && <StatisticsCards />}

      {/* Meeting Info */}
      {testData?.meetingInfo && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Meeting Information</Typography>
            <Stack direction="row" spacing={4} flexWrap="wrap">
              <Box>
                <Typography variant="body2" color="textSecondary">Meeting ID</Typography>
                <Typography variant="body1" fontFamily="monospace">{testData.meetingInfo.meetingId}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Topic</Typography>
                <Typography variant="body1">{testData.meetingInfo.topic}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Duration</Typography>
                <Typography variant="body1">{formatDuration(testData.meetingInfo.duration)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">85% Threshold</Typography>
                <Typography variant="body1">{formatDuration(Math.round(testData.meetingInfo.duration * 0.85))}</Typography>
              </Box>
              {lastUpdated && (
                <Box>
                  <Typography variant="body2" color="textSecondary">Last Updated</Typography>
                  <Typography variant="body1">{safeFormatLastUpdated(lastUpdated)}</Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Attendance Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
            <Analytics />
            Admin Dashboard - Attendance Table
            <Chip 
              label={`${testData?.participants?.length || 0} participants`} 
              size="small" 
              color="primary"
            />
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Participant</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Attendance %</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Join Time</TableCell>
                    <TableCell>Authentication</TableCell>
                    <TableCell>Student Info</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {testData?.participants?.map((participant, index) => (
                    <TableRow 
                      key={participant.participantId || index}
                      sx={{
                        bgcolor: participant.participantName === 'fred' 
                          ? alpha(theme.palette.success.main, 0.05)
                          : 'transparent',
                        border: participant.participantName === 'fred' 
                          ? `2px solid ${alpha(theme.palette.success.main, 0.2)}`
                          : 'none'
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar 
                            sx={{ 
                              width: 32, 
                              height: 32,
                              bgcolor: participant.participantName === 'fred' ? 'success.main' : 'primary.main'
                            }}
                          >
                            {participant.participantName?.charAt(0).toUpperCase() || 'P'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {participant.participantName}
                              {participant.participantName === 'fred' && (
                                <Chip label="SUCCESS!" size="small" color="success" sx={{ ml: 1 }} />
                              )}
                            </Typography>
                            {participant.email && (
                              <Typography variant="caption" color="textSecondary">
                                {participant.email}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {formatDuration(participant.duration)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            of {formatDuration(participant.meetingDuration)}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {participant.percentage}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(participant.percentage, 100)}
                            color={participant.percentage >= 85 ? 'success' : 'error'}
                            sx={{ width: 80, mt: 0.5 }}
                          />
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(participant)}
                          label={participant.status}
                          color={getStatusColor(participant)}
                          size="small"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {participant.joinTime
                            ? safeFormatJoinTime(participant.joinTime)
                            : 'Not available'
                          }
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        {participant.authenticatedUser ? (
                          <Box>
                            <Chip label="JWT Token" size="small" color="info" />
                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                              {participant.authenticatedUser.role}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            Guest ({participant.source})
                          </Typography>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {participant.studentInfo ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <School fontSize="small" color="primary" />
                            <Box>
                              <Typography variant="body2">
                                {participant.studentInfo.fullName}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {participant.studentInfo.department}
                              </Typography>
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            Not matched
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Test Details Dialog */}
      <Dialog open={testDialog} onClose={() => setTestDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Test Configuration & Results</DialogTitle>
        <DialogContent>
          <Box>
            <Typography variant="h6" gutterBottom>Test Scenario:</Typography>
            <Typography variant="body2" paragraph>
              This demo shows the results of Fred's successful attendance test where he attended 
              52 out of 60 minutes (87% attendance), successfully meeting the 85% threshold requirement.
            </Typography>
            
            <Typography variant="h6" gutterBottom>API Endpoints Being Used:</Typography>
            <Typography variant="body2" component="pre" sx={{ 
              bgcolor: 'grey.100', 
              p: 2, 
              borderRadius: 1, 
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              overflow: 'auto'
            }}>
{`GET ${backendUrl}/api/zoom/meeting/{meetingId}/attendance-tracker?threshold=85
POST ${backendUrl}/api/zoom/meeting/{meetingId}/attendance-tracker/start-websocket
GET ${backendUrl}/api/attendance-unified/meeting/{meetingId}?threshold=85`}
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Live Data vs Demo Data:</Typography>
            <Typography variant="body2">
              This component can display both live data from your backend (if available) 
              or demo data showing Fred's successful test results. Use the Meeting ID field 
              to test with real meeting data.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FredAttendanceTracker;
