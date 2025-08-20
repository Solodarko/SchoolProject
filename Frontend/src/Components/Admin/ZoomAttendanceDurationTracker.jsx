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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
  Paper,
  Divider,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import {
  Refresh,
  VideoCall,
  AccessTime,
  CheckCircle,
  Cancel,
  Person,
  School,
  TrendingUp,
  Timer,
  Analytics
} from '@mui/icons-material';
import { safeFormatJoinTime, safeFormatLastUpdated } from '../../utils/safeDateFormat';
import { getAuthHeaders } from '../../utils/authUtils';

const ATTENDANCE_THRESHOLD = 85; // 85% attendance threshold

const ZoomAttendanceDurationTracker = () => {
  // Theme hook
  const theme = useTheme();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [statistics, setStatistics] = useState({
    totalParticipants: 0,
    presentCount: 0,
    absentCount: 0,
    averageAttendance: 0,
    meetingDuration: 0
  });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  /**
   * Fetch available Zoom meetings
   */
  const fetchMeetings = useCallback(async () => {
    try {
      console.log('🔄 Fetching meetings from:', `${backendUrl}/zoom/meetings`);
      const response = await fetch(`${backendUrl}/zoom/meetings`, {
        headers: getAuthHeaders()
      });
      
      console.log('📡 Meetings response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Meetings data received:', data);
        setMeetings(data.meetings || []);
        
        // Auto-select first meeting if none selected
        if (!selectedMeeting && data.meetings?.length > 0) {
          setSelectedMeeting(data.meetings[0].meetingId || data.meetings[0].id);
        }
      } else {
        console.error('❌ Failed to fetch meetings:', response.status, response.statusText);
        setError(`Failed to fetch meetings: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error fetching meetings:', error);
      setError(`Network error: ${error.message}`);
    }
  }, [backendUrl, selectedMeeting]);

  /**
   * Fetch attendance data for selected meeting with 85% duration filter
   */
  const fetchAttendanceData = useCallback(async () => {
    if (!selectedMeeting) return;

    try {
      setLoading(true);
      setError(null);

      // Try the new dedicated endpoint first, fallback to existing endpoints
      let response;
      try {
        response = await fetch(
          `${backendUrl}/attendance-tracker/zoom-duration-attendance/${selectedMeeting}?threshold=${ATTENDANCE_THRESHOLD}`,
          { headers: getAuthHeaders() }
        );
      } catch (error) {
        console.warn('New endpoint not available, falling back to existing endpoint');
        response = await fetch(
          `${backendUrl}/attendance-tracker/attendance/${selectedMeeting}?enriched=true`,
          { headers: getAuthHeaders() }
        );
      }
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          const participants = data.participants || [];
          const stats = data.statistics || {};
          
          // Debug logging
          console.log('=== ATTENDANCE DATA DEBUG ===');
          console.log('Raw API response:', data);
          console.log('Participants count:', participants.length);
          console.log('Statistics:', stats);
          console.log('Sample participant:', participants[0]);
          
          // Calculate 85% threshold-based attendance
          const processedParticipants = participants.map(participant => {
            const duration = participant.totalSessionDuration || participant.duration || 0;
            const meetingDuration = stats.meetingDuration || participant.meetingDuration || 60;
            const attendancePercentage = Math.round((duration / meetingDuration) * 100);
            const meetsThreshold = attendancePercentage >= ATTENDANCE_THRESHOLD;
            
            // Debug each participant
            console.log(`Participant: ${participant.participantName}`);
            console.log(`- totalSessionDuration: ${participant.totalSessionDuration}`);
            console.log(`- duration: ${participant.duration}`);
            console.log(`- calculated duration: ${duration}`);
            console.log(`- meeting duration: ${meetingDuration}`);
            console.log(`- percentage: ${attendancePercentage}%`);
            console.log(`- meets threshold (≥85%): ${meetsThreshold}`);
            console.log('---');
            
            return {
              ...participant,
              duration,
              meetingDuration,
              attendancePercentage,
              attendanceStatus: participant.hasActiveSessions 
                ? 'In Progress' 
                : meetsThreshold 
                  ? 'Present' 
                  : 'Absent',
              meetsThreshold
            };
          });

          setAttendanceData(processedParticipants);
          
          // Calculate statistics
          const presentCount = processedParticipants.filter(p => p.meetsThreshold || p.attendanceStatus === 'In Progress').length;
          const absentCount = processedParticipants.length - presentCount;
          const totalPercentage = processedParticipants.reduce((sum, p) => sum + (p.attendancePercentage || 0), 0);
          
          setStatistics({
            totalParticipants: processedParticipants.length,
            presentCount,
            absentCount,
            averageAttendance: processedParticipants.length > 0 ? Math.round(totalPercentage / processedParticipants.length) : 0,
            meetingDuration: stats.meetingDuration || 60,
            attendanceRate: processedParticipants.length > 0 ? Math.round((presentCount / processedParticipants.length) * 100) : 0
          });
          
          setLastUpdated(new Date());
        } else {
          setError(data.message || 'Failed to fetch attendance data');
        }
      } else {
        setError('Failed to fetch attendance data from server');
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setError('Network error while fetching attendance data');
    } finally {
      setLoading(false);
    }
  }, [selectedMeeting, backendUrl]);

  // Initialize data
  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  useEffect(() => {
    if (selectedMeeting) {
      fetchAttendanceData();
    }
  }, [selectedMeeting, fetchAttendanceData]);

  /**
   * Get status color based on attendance
   */
  const getStatusColor = (participant) => {
    if (participant.hasActiveSessions || participant.attendanceStatus === 'In Progress') {
      return 'info';
    }
    return participant.meetsThreshold ? 'success' : 'error';
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (participant) => {
    if (participant.hasActiveSessions || participant.attendanceStatus === 'In Progress') {
      return <Timer color="info" />;
    }
    return participant.meetsThreshold ? <CheckCircle color="success" /> : <Cancel color="error" />;
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
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <Person color="primary" />
              <Box>
                <Typography variant="h6">{statistics.totalParticipants}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Participants
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <CheckCircle color="success" />
              <Box>
                <Typography variant="h6">{statistics.presentCount}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Present (≥85%)
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <Cancel color="error" />
              <Box>
                <Typography variant="h6">{statistics.absentCount}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Absent (&lt;85%)
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <TrendingUp color="info" />
              <Box>
                <Typography variant="h6">{statistics.attendanceRate}%</Typography>
                <Typography variant="body2" color="textSecondary">
                  Attendance Rate
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box p={3}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom display="flex" alignItems="center" gap={2}>
          <VideoCall color="primary" />
          85% Zoom Attendance Duration Tracker
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Track attendance based on 85% meeting duration threshold from Zoom meetings
        </Typography>
      </Box>

      {/* Controls */}
      <Box mb={3} display="flex" gap={2} alignItems="center">
        <FormControl variant="outlined" sx={{ minWidth: 300 }}>
          <InputLabel>Select Meeting</InputLabel>
          <Select
            value={selectedMeeting}
            onChange={(e) => setSelectedMeeting(e.target.value)}
            label="Select Meeting"
          >
            {meetings.map((meeting) => (
              <MenuItem key={meeting.meetingId || meeting.id} value={meeting.meetingId || meeting.id}>
                {meeting.topic || meeting.title} ({meeting.meetingId || meeting.id})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchAttendanceData}
          disabled={loading || !selectedMeeting}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Debug Information Panel */}
      <Card sx={{ mb: 3, bgcolor: alpha(theme.palette.warning.light, 0.05) }}>
        <CardContent>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
            <Analytics color="warning" />
            Debug Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                **Frontend Configuration:**
              </Typography>
              <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1, display: 'block' }}>
{`Backend URL: ${backendUrl}
Selected Meeting: ${selectedMeeting}
Meetings Found: ${meetings.length}
Attendance Data: ${attendanceData.length} participants`}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                **API Test Results:**
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => {
                    fetch(`${backendUrl}/health`)
                      .then(r => r.json())
                      .then(data => {
                        console.log('✅ Health check passed:', data);
                        alert(`Server Status: ${data.status}\nTimestamp: ${data.timestamp}`);
                      })
                      .catch(err => {
                        console.error('❌ Health check failed:', err);
                        alert(`Health check failed: ${err.message}`);
                      });
                  }}
                >
                  Test Server Connection
                </Button>
                
                <Button 
                  size="small" 
                  variant="contained" 
                  color="warning"
                  onClick={async () => {
                    try {
                      const response = await fetch(`${backendUrl}/attendance-tracker/generate-test-data`, {
                        method: 'POST'
                      });
                      const data = await response.json();
                      if (data.success) {
                        alert(`Test data generated!\nMeeting ID: ${data.data.meetingId}\nParticipants: ${data.data.participantCount}`);
                        // Refresh meetings list
                        await fetchMeetings();
                      } else {
                        alert(`Error: ${data.error}`);
                      }
                    } catch (err) {
                      console.error('❌ Test data generation failed:', err);
                      alert(`Failed to generate test data: ${err.message}`);
                    }
                  }}
                >
                  Generate Test Data
                </Button>
                
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="error"
                  onClick={async () => {
                    try {
                      const response = await fetch(`${backendUrl}/attendance-tracker/cleanup-test-data`, {
                        method: 'DELETE'
                      });
                      const data = await response.json();
                      if (data.success) {
                        alert('Test data cleaned up successfully!');
                        // Refresh meetings list
                        await fetchMeetings();
                      } else {
                        alert(`Error: ${data.error}`);
                      }
                    } catch (err) {
                      console.error('❌ Test data cleanup failed:', err);
                      alert(`Failed to cleanup test data: ${err.message}`);
                    }
                  }}
                >
                  Cleanup Test Data
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {!loading && attendanceData.length > 0 && <StatisticsCards />}

      {/* Meeting Info */}
      {selectedMeeting && statistics.meetingDuration > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Meeting Information</Typography>
            <Stack direction="row" spacing={4}>
              <Box>
                <Typography variant="body2" color="textSecondary">Meeting ID</Typography>
                <Typography variant="body1">{selectedMeeting}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Duration</Typography>
                <Typography variant="body1">{formatDuration(statistics.meetingDuration)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">85% Threshold</Typography>
                <Typography variant="body1">{formatDuration(Math.round(statistics.meetingDuration * 0.85))}</Typography>
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

      {/* Attendance Threshold Explanation */}
      <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
            <Timer color="primary" />
            Attendance Duration Threshold Explanation
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box p={2} bgcolor={alpha(theme.palette.info.light, 0.1)} borderRadius={1}>
                <Typography variant="subtitle1" color="primary" gutterBottom fontWeight="bold">
                  How Attendance Status Is Determined:
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  <Box component="li" mb={1}>
                    <Typography variant="body2" display="flex" alignItems="center" gap={1}>
                      <CheckCircle fontSize="small" color="success" />
                      <strong>Present</strong>: Attended ≥85% of meeting duration
                    </Typography>
                  </Box>
                  <Box component="li" mb={1}>
                    <Typography variant="body2" display="flex" alignItems="center" gap={1}>
                      <Timer fontSize="small" color="info" />
                      <strong>In Progress</strong>: Currently in the meeting (active session)
                    </Typography>
                  </Box>
                  <Box component="li">
                    <Typography variant="body2" display="flex" alignItems="center" gap={1}>
                      <Cancel fontSize="small" color="error" />
                      <strong>Absent</strong>: Attended &lt;85% of meeting duration
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box p={2} bgcolor={alpha(theme.palette.success.light, 0.1)} borderRadius={1}>
                <Typography variant="subtitle1" color="primary" gutterBottom fontWeight="bold">
                  Current Meeting Calculation:
                </Typography>
                {statistics.meetingDuration > 0 ? (
                  <Box>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Total Meeting Duration:</Typography>
                      <Typography variant="body2" fontWeight="bold">{formatDuration(statistics.meetingDuration)}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">85% Threshold Duration:</Typography>
                      <Typography variant="body2" fontWeight="bold">{formatDuration(Math.round(statistics.meetingDuration * 0.85))}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="body2">Time Needed for "Present" Status:</Typography>
                      <Chip 
                        label={formatDuration(Math.round(statistics.meetingDuration * 0.85))} 
                        color="success" 
                        size="small" 
                        icon={<CheckCircle fontSize="small" />} 
                      />
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No meeting data available
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Attendance Table - Always Visible */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
            <Analytics />
            Attendance Details (85% Duration Threshold)
            <Chip 
              label={`${attendanceData.length} participants`} 
              size="small" 
              color={attendanceData.length > 0 ? 'primary' : 'default'}
            />
          </Typography>
          
          {loading && (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography>Loading attendance data...</Typography>
            </Box>
          )}
          
          {!loading && attendanceData.length === 0 && selectedMeeting && (
            <Alert severity="info" sx={{ my: 2 }}>
              <Typography variant="body2">
                No participants found for meeting "{selectedMeeting}". 
                This could mean:
              </Typography>
              <Box component="ul" sx={{ mt: 1, mb: 0 }}>
                <li>The meeting hasn't started yet</li>
                <li>No one has joined the meeting</li>
                <li>The meeting ID doesn't exist</li>
                <li>There's an issue with the API connection</li>
              </Box>
            </Alert>
          )}
          
          {!loading && !selectedMeeting && (
            <Alert severity="warning" sx={{ my: 2 }}>
              Please select a meeting from the dropdown above to view attendance data.
            </Alert>
          )}
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Participant</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Percentage</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Join Time</TableCell>
                  <TableCell>Student Info</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && attendanceData.length > 0 ? (
                  attendanceData.map((participant, index) => (
                    <TableRow key={participant.participantId || index}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {participant.participantName?.charAt(0) || 'P'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {participant.participantName}
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
                            {participant.attendancePercentage}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(participant.attendancePercentage, 100)}
                            color={participant.attendancePercentage >= 85 ? 'success' : 'error'}
                            sx={{ width: 60, mt: 0.5 }}
                          />
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(participant)}
                          label={
                            participant.hasActiveSessions
                              ? 'In Progress'
                              : participant.meetsThreshold
                              ? 'Present'
                              : 'Absent'
                          }
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
                        {participant.studentId || participant.studentFirstName ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <School fontSize="small" color="primary" />
                            <Box>
                              <Typography variant="body2">
                                {participant.studentFirstName} {participant.studentLastName}
                              </Typography>
                              {participant.studentId && (
                                <Typography variant="caption" color="textSecondary">
                                  ID: {participant.studentId}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            Not matched
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      {loading ? (
                        <Typography color="text.secondary">
                          Loading participants...
                        </Typography>
                      ) : !selectedMeeting ? (
                        <Typography color="text.secondary">
                          Please select a meeting to view attendance data
                        </Typography>
                      ) : (
                        <Box textAlign="center">
                          <VideoCall sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                          <Typography color="text.secondary">
                            No participants found for this meeting
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            Try refreshing or selecting a different meeting
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Empty State */}
      {!loading && attendanceData.length === 0 && selectedMeeting && (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <VideoCall sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No Attendance Data Found
              </Typography>
              <Typography variant="body2" color="textSecondary">
                No participants found for the selected meeting or meeting hasn't started yet.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ZoomAttendanceDurationTracker;
