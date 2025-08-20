import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Alert,
  CircularProgress,
  TextField,
  Grid,
  Avatar,
  Badge,
  IconButton,
  Tooltip,
  Paper,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  TrackChanges,
  Timeline,
  Refresh,
  People,
  Storage,
  AccessTime,
  Person,
  School,
  Email,
  CheckCircle,
  Cancel,
  Pending,
  TrendingUp
} from '@mui/icons-material';
import { format } from 'date-fns';
import { safeFormatJoinTime, safeFormatShortDate } from '../../utils/safeDateFormat';

const JoinTrackingDashboard = () => {
  const [trackingData, setTrackingData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  /**
   * Load join tracking data from backend API with localStorage fallback
   */
  const loadTrackingData = useCallback(async () => {
    setLoading(true);
    try {
      // Get backend URL
      const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
      
      console.log('📊 [Join Tracking Dashboard] Loading tracking data from backend API:', `${backendUrl}/api/zoom/join-tracking`);
      
      // Try to fetch from backend API first
      try {
        const response = await fetch(`${backendUrl}/api/zoom/join-tracking`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const apiResult = await response.json();
          console.log('📊 [Join Tracking Dashboard] API response:', apiResult);
          
          if (apiResult.success && apiResult.data) {
            // Use API data
            const allTrackingData = apiResult.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            console.log('📊 [Join Tracking Dashboard] Using backend API data:', allTrackingData.length, 'records');
            
            setTrackingData(allTrackingData);
            setFilteredData(allTrackingData);
            setLastUpdated(new Date());
            setLoading(false);
            return; // Success, no need for fallback
          }
        } else {
          console.warn('📊 [Join Tracking Dashboard] API request failed:', response.status, response.statusText);
        }
      } catch (apiError) {
        console.warn('📊 [Join Tracking Dashboard] API request error:', apiError.message);
      }
      
      // Fallback to localStorage if API fails
      console.log('📊 [Join Tracking Dashboard] Falling back to localStorage...');
      
      const trackingHistory = JSON.parse(localStorage.getItem('joinTrackingHistory') || '[]');
      const currentTracking = JSON.parse(localStorage.getItem('currentJoinTracking') || 'null');
      
      console.log('📊 [Join Tracking Dashboard] Loading tracking data from localStorage:', {
        historyCount: trackingHistory.length,
        currentTracking: !!currentTracking,
        historyData: trackingHistory,
        currentData: currentTracking
      });
      
      // Add current tracking to history if it exists and is not already in history
      let allTrackingData = [...trackingHistory];
      if (currentTracking && !trackingHistory.some(item => item.trackingId === currentTracking.trackingId)) {
        allTrackingData.unshift(currentTracking);
        console.log('📊 [Join Tracking Dashboard] Added current tracking to data:', currentTracking);
      }
      
      // Sort by timestamp (newest first)
      allTrackingData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      console.log('📊 [Join Tracking Dashboard] Final tracking data from localStorage:', allTrackingData);
      
      setTrackingData(allTrackingData);
      setFilteredData(allTrackingData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ [Join Tracking Dashboard] Error loading tracking data:', error);
      setTrackingData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Filter data based on selected meeting and search term
   */
  useEffect(() => {
    let filtered = [...trackingData];
    
    // Filter by meeting if selected
    if (selectedMeeting) {
      filtered = filtered.filter(item => item.meetingId === selectedMeeting);
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.userName?.toLowerCase().includes(searchLower) ||
        item.userEmail?.toLowerCase().includes(searchLower) ||
        item.meetingTopic?.toLowerCase().includes(searchLower) ||
        item.studentId?.toLowerCase().includes(searchLower) ||
        item.trackingId?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredData(filtered);
  }, [trackingData, selectedMeeting, searchTerm]);

  /**
   * Get unique meetings from tracking data
   */
  const getUniqueMeetings = () => {
    const meetings = trackingData.reduce((acc, item) => {
      if (!acc.find(m => m.id === item.meetingId)) {
        acc.push({
          id: item.meetingId,
          topic: item.meetingTopic
        });
      }
      return acc;
    }, []);
    return meetings;
  };

  /**
   * Clear all tracking data from backend and localStorage
   */
  const clearTrackingData = async () => {
    if (window.confirm('Are you sure you want to clear all join tracking data? This action cannot be undone.')) {
      try {
        // Get backend URL
        const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
        
        // Try to clear backend data first
        try {
          const response = await fetch(`${backendUrl}/api/zoom/join-tracking`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('📊 [Join Tracking Dashboard] Backend data cleared:', result);
          } else {
            console.warn('📊 [Join Tracking Dashboard] Failed to clear backend data:', response.status);
          }
        } catch (apiError) {
          console.warn('📊 [Join Tracking Dashboard] Error clearing backend data:', apiError.message);
        }
        
        // Also clear localStorage as backup
        localStorage.removeItem('joinTrackingHistory');
        localStorage.removeItem('currentJoinTracking');
        
        // Reload data
        await loadTrackingData();
      } catch (error) {
        console.error('❌ [Join Tracking Dashboard] Error clearing tracking data:', error);
      }
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadTrackingData();
    
    // Set up periodic refresh to catch new data
    const interval = setInterval(() => {
      console.log('🔄 [Join Tracking Dashboard] Auto-refreshing tracking data...');
      loadTrackingData();
    }, 5000); // Refresh every 5 seconds
    
    // Listen for localStorage changes from other tabs/windows
    const handleStorageChange = (e) => {
      if (e.key === 'joinTrackingHistory' || e.key === 'currentJoinTracking') {
        console.log('🔄 [Join Tracking Dashboard] localStorage changed, refreshing data...');
        loadTrackingData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadTrackingData]);

  /**
   * Render statistics cards
   */
  const renderStatsCards = () => {
    const totalJoins = trackingData.length;
    const uniqueUsers = new Set(trackingData.map(item => item.userId)).size;
    const uniqueMeetings = new Set(trackingData.map(item => item.meetingId)).size;
    const recentJoins = trackingData.filter(item => 
      new Date(item.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;
    
    // Calculate attendance-specific metrics
    const presentCount = trackingData.filter(item => 
      item.meetsThreshold || item.attendanceStatus === 'Present'
    ).length;
    const absentCount = trackingData.filter(item => 
      item.attendanceStatus === 'Absent' || (item.meetsThreshold === false)
    ).length;
    const averageAttendance = trackingData.length > 0 ? 
      trackingData.reduce((sum, item) => sum + (item.attendancePercentage || 0), 0) / trackingData.length
      : 0;

    const cards = [
      {
        title: 'Total Join Events',
        value: totalJoins,
        icon: <TrackChanges />,
        color: 'primary'
      },
      {
        title: 'Present (≥85%)',
        value: presentCount,
        subtitle: `${totalJoins > 0 ? Math.round((presentCount / totalJoins) * 100) : 0}% of total`,
        icon: <CheckCircle />,
        color: 'success'
      },
      {
        title: 'Absent (<85%)',
        value: absentCount,
        subtitle: `${totalJoins > 0 ? Math.round((absentCount / totalJoins) * 100) : 0}% of total`,
        icon: <Cancel />,
        color: 'error'
      },
      {
        title: 'Avg Attendance',
        value: `${Math.round(averageAttendance)}%`,
        subtitle: '85% threshold',
        icon: <TrendingUp />,
        color: averageAttendance >= 85 ? 'success' : 'warning'
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

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrackChanges color="primary" />
          Join Tracking Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Monitor user join activity and tracking responses from the user dashboard
        </Typography>
      </Box>

      {/* Controls */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Filter by Meeting"
              value={selectedMeeting}
              onChange={(e) => setSelectedMeeting(e.target.value)}
              fullWidth
              size="small"
              SelectProps={{ native: true }}
            >
              <option value="">All Meetings</option>
              {getUniqueMeetings().map((meeting) => (
                <option key={meeting.id} value={meeting.id}>
                  {meeting.topic}
                </option>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Search users, emails, tracking IDs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadTrackingData}
              disabled={loading}
              fullWidth
            >
              Refresh
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              color="error"
              onClick={clearTrackingData}
              disabled={trackingData.length === 0}
              fullWidth
            >
              Clear Data
            </Button>
          </Grid>
        </Grid>
        
        {lastUpdated && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Last updated: {format(lastUpdated, 'HH:mm:ss')}
          </Typography>
        )}
      </Box>

      {/* Statistics Cards */}
      {trackingData.length > 0 && renderStatsCards()}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Data Table */}
      {!loading && (
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Join Tracking Events ({filteredData.length})
              </Typography>
              <Badge badgeContent={filteredData.length} color="primary">
                <Timeline />
              </Badge>
            </Box>

            {filteredData.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Meeting</TableCell>
                      <TableCell>Duration / Percentage</TableCell>
                      <TableCell>Attendance Status</TableCell>
                      <TableCell>Participant Count</TableCell>
                      <TableCell>Tracking ID</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredData.map((item, index) => (
                      <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {safeFormatJoinTime(item.timestamp)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {safeFormatShortDate(item.timestamp)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                              <Person fontSize="small" />
                            </Avatar>
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
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {item.duration ? `${item.duration} min` : 'N/A'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={item.attendancePercentage || 0}
                                sx={{ 
                                  width: 80, 
                                  height: 6, 
                                  borderRadius: 3,
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: (item.attendancePercentage || 0) >= 85 ? 'success.main' : 'error.main'
                                  },
                                  backgroundColor: 'grey.300'
                                }}
                              />
                              <Typography variant="caption" sx={{ ml: 1, fontWeight: 'bold' }}>
                                {item.attendancePercentage ? `${item.attendancePercentage}%` : '0%'}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {item.meetingDuration ? `of ${item.meetingDuration} min` : ''}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {item.attendanceStatus && (
                            <Chip
                              size="small"
                              variant="filled"
                              icon={
                                item.attendanceStatus === 'Present' ? <CheckCircle /> :
                                item.attendanceStatus === 'In Progress' ? <Pending /> :
                                <Cancel />
                              }
                              label={item.attendanceStatus}
                              color={
                                item.attendanceStatus === 'Present' ? 'success' :
                                item.attendanceStatus === 'In Progress' ? 'warning' :
                                'error'
                              }
                            />
                          )}
                          {item.meetsThreshold !== undefined && (
                            <Tooltip title={`85% Attendance ${item.meetsThreshold ? 'Met' : 'Not Met'}`}>
                              <Chip
                                size="small"
                                variant="outlined"
                                label={`85%: ${item.meetsThreshold ? '✓' : '✗'}`}
                                color={item.meetsThreshold ? 'success' : 'error'}
                                sx={{ ml: 1, fontSize: '0.7rem' }}
                              />
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`#${item.participantCount}`}
                            color="info"
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Storage sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Join Tracking Data
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {trackingData.length === 0 
                    ? 'No tracking data found. Data is stored when users join meetings from the user dashboard.'
                    : 'No data matches your current filters. Try adjusting the meeting filter or search term.'}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={loadTrackingData}
                  size="small"
                >
                  Refresh Data
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Alert */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <strong>About Join Tracking:</strong> This dashboard shows tracking data stored locally when users join meetings 
        through the user dashboard. The data includes participant count, tracking IDs, timestamps, and response messages 
        from the join tracking API.
      </Alert>
    </Box>
  );
};

export default JoinTrackingDashboard;
