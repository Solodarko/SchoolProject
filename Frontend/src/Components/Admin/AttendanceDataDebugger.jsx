import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Paper
} from '@mui/material';
import { Refresh, BugReport } from '@mui/icons-material';

const AttendanceDataDebugger = () => {
  const [loading, setLoading] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState('');
  const [rawData, setRawData] = useState(null);
  const [error, setError] = useState(null);

  const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const fetchMeetings = async () => {
    try {
      const response = await fetch(`${backendUrl}/zoom/meetings`);
      if (response.ok) {
        const data = await response.json();
        setMeetings(data.meetings || []);
        if (!selectedMeeting && data.meetings?.length > 0) {
          setSelectedMeeting(data.meetings[0].meetingId || data.meetings[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setError('Failed to fetch meetings: ' + error.message);
    }
  };

  const fetchAttendanceData = async () => {
    if (!selectedMeeting) return;

    try {
      setLoading(true);
      setError(null);

      // Try different endpoints to see what data is available
      const endpoints = [
        `${backendUrl}/attendance-tracker/zoom-duration-attendance/${selectedMeeting}?threshold=85`,
        `${backendUrl}/attendance-tracker/attendance/${selectedMeeting}?enriched=true`,
        `${backendUrl}/attendance-tracker/attendance/${selectedMeeting}`
      ];

      const results = {};

      for (let i = 0; i < endpoints.length; i++) {
        try {
          const response = await fetch(endpoints[i]);
          if (response.ok) {
            const data = await response.json();
            results[`endpoint_${i + 1}`] = {
              url: endpoints[i],
              data: data,
              status: 'success'
            };
          } else {
            results[`endpoint_${i + 1}`] = {
              url: endpoints[i],
              error: `HTTP ${response.status}`,
              status: 'failed'
            };
          }
        } catch (err) {
          results[`endpoint_${i + 1}`] = {
            url: endpoints[i],
            error: err.message,
            status: 'error'
          };
        }
      }

      setRawData(results);

    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setError('Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  useEffect(() => {
    if (selectedMeeting) {
      fetchAttendanceData();
    }
  }, [selectedMeeting]);

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom display="flex" alignItems="center" gap={2}>
        <BugReport color="primary" />
        Attendance Data Debugger
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        This component helps debug attendance data structure and API responses
      </Typography>

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
          Debug Data
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Raw Data Display */}
      {rawData && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              API Response Data for Meeting: {selectedMeeting}
            </Typography>
            
            {Object.entries(rawData).map(([key, result]) => (
              <Paper key={key} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>{key.toUpperCase()}</strong> - Status: {result.status}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  URL: {result.url}
                </Typography>
                
                {result.status === 'success' && (
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      <strong>Participants Found:</strong> {result.data?.participants?.length || 0}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Meeting Duration:</strong> {result.data?.statistics?.meetingDuration || 'N/A'} minutes
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Sample Participant Data Structure:</strong>
                    </Typography>
                    <Paper sx={{ p: 1, bgcolor: 'grey.100', mt: 1 }}>
                      <pre style={{ fontSize: '12px', margin: 0, overflow: 'auto' }}>
                        {JSON.stringify(result.data?.participants?.[0] || {}, null, 2)}
                      </pre>
                    </Paper>
                    <Typography variant="body2" gutterBottom sx={{ mt: 1 }}>
                      <strong>Statistics:</strong>
                    </Typography>
                    <Paper sx={{ p: 1, bgcolor: 'grey.100', mt: 1 }}>
                      <pre style={{ fontSize: '12px', margin: 0, overflow: 'auto' }}>
                        {JSON.stringify(result.data?.statistics || {}, null, 2)}
                      </pre>
                    </Paper>
                  </Box>
                )}
                
                {result.status !== 'success' && (
                  <Alert severity="error">
                    Error: {result.error}
                  </Alert>
                )}
              </Paper>
            ))}
          </CardContent>
        </Card>
      )}

      {!rawData && !loading && (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <BugReport sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No Data to Debug
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Select a meeting and click "Debug Data" to see the raw API responses.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AttendanceDataDebugger;
