import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  LinearProgress,
  CircularProgress,
  Alert,
  Fade,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Avatar,
  Stack,
  Divider,
  Badge,
  Snackbar
} from '@mui/material';
import {
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Update as LateIcon,
  QrCode as QrCodeIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const AttendanceLogs = () => {
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedMeeting, setSelectedMeeting] = useState('all');
  const [totalRecords, setTotalRecords] = useState(0);
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [newAttendanceCount, setNewAttendanceCount] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Socket.IO connection setup
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      timeout: 20000
    });
    
    newSocket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
      setConnectionStatus('connected');
      // Join admin dashboard room for real-time updates
      newSocket.emit('joinMeeting', 'admin_dashboard');
    });
    
    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from Socket.IO server');
      setConnectionStatus('disconnected');
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setConnectionStatus('error');
    });
    
    // Listen for real-time attendance updates
    newSocket.on('attendanceRecorded', (notification) => {
      console.log('📍 New attendance recorded:', notification);
      handleNewAttendanceRecord(notification);
    });
    
    // Listen for real-time dashboard updates
    newSocket.on('realTimeAttendanceUpdate', (update) => {
      console.log('📊 Real-time attendance update:', update);
      if (update.type === 'new_attendance') {
        handleNewAttendanceRecord(update.data);
      }
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Handle new attendance records from Socket.IO
  const handleNewAttendanceRecord = useCallback((data) => {
    const attendanceRecord = data.attendance || data.attendanceDetails;
    const studentInfo = data.studentInfo;
    const qrCodeInfo = data.qrCodeInfo;
    
    if (!attendanceRecord) return;
    
    const newRecord = {
      id: attendanceRecord.attendanceId || attendanceRecord._id || Date.now(),
      meetingId: attendanceRecord.meetingId || 'N/A',
      studentName: studentInfo?.name || attendanceRecord.studentName || 'Unknown Student',
      studentId: attendanceRecord.studentId || studentInfo?.studentId,
      email: studentInfo?.email || 'N/A',
      timeJoined: new Date(attendanceRecord.date || attendanceRecord.time || Date.now()).toLocaleString(),
      status: attendanceRecord.status || 'Present',
      attendanceType: attendanceRecord.method === 'QR Code Scan' ? 'qr_scan' : 'location',
      location: attendanceRecord.location?.coordinates || { latitude: 0, longitude: 0 },
      distance: attendanceRecord.location?.distance ? `${attendanceRecord.location.distance}m` : 'N/A',
      qrGeneratedBy: qrCodeInfo?.generatedBy || 'Admin',
      department: studentInfo?.department || 'Unknown'
    };
    
    // Add the new record to the top of the list
    setAttendanceData(prevData => [newRecord, ...prevData]);
    setTotalRecords(prev => prev + 1);
    setNewAttendanceCount(prev => prev + 1);
    
    // Show snackbar notification
    setSnackbarMessage(`⚡ Pulse detected: ${newRecord.studentName} is present`);
    setSnackbarOpen(true);
  }, []);

  // Get unique meetings for filter
  const uniqueMeetings = [...new Set(attendanceData.map(item => item.meetingId))];

  useEffect(() => {
    loadAttendance();
  }, [date, filterStatus, selectedMeeting]);

  // Load attendance data from backend API
  const loadAttendance = async () => {
    try {
      setLoading(true);
      
      // Format date for API call
      const dateStr = date.toISOString().split('T')[0];
      
      // Call backend API to get QR attendance data
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/attendance/qr-location/info?dateFrom=${dateStr}&dateTo=${dateStr}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.locationData) {
          // Transform backend data to match frontend format
          let transformedData = data.locationData.map((record, index) => ({
            id: record.attendanceId || index,
            meetingId: record.meetingId || 'N/A',
            studentName: record.studentName || 'Unknown Student',
            studentId: record.studentId,
            email: 'N/A', // This would need to be added to backend response
            timeJoined: new Date(record.date).toLocaleString(),
            status: record.status || 'Present',
            attendanceType: 'qr_scan',
            location: record.coordinates || { latitude: 0, longitude: 0 },
            distance: record.distance ? `${record.distance}m` : 'N/A',
            qrGeneratedBy: 'Admin', // This would need to be added to backend response
            department: 'Unknown' // This would need to be added to backend response
          }));
          
          // Apply filters
          if (filterStatus !== 'all') {
            transformedData = transformedData.filter(item => item.status.toLowerCase() === filterStatus);
          }
          
          if (selectedMeeting !== 'all') {
            transformedData = transformedData.filter(item => item.meetingId === selectedMeeting);
          }
          
          setAttendanceData(transformedData);
          setTotalRecords(transformedData.length);
        } else {
          console.warn('No attendance data found');
          setAttendanceData([]);
          setTotalRecords(0);
        }
      } else {
        console.error('Failed to fetch attendance data:', response.statusText);
        // Fallback to empty data
        setAttendanceData([]);
        setTotalRecords(0);
      }
      
    } catch (error) {
      console.error('Failed to load attendance data:', error);
      // Fallback to empty data
      setAttendanceData([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Meeting ID', 'Student Name', 'Student ID', 'Email', 'Time Joined', 'Status', 'Department', 'Generated By'];
    const csvContent = [
      headers.join(','),
      ...attendanceData.map(row => [
        row.meetingId,
        row.studentName,
        row.studentId,
        row.email,
        row.timeJoined,
        row.status,
        row.department,
        row.qrGeneratedBy
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present':
        return 'success';
      case 'Late':
        return 'warning';
      case 'Absent':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Present':
        return <PresentIcon color="success" />;
      case 'Late':
        return <LateIcon color="warning" />;
      case 'Absent':
        return <AbsentIcon color="error" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Fade in={true} timeout={600}>
        <Box sx={{ p: 3 }}>
          {/* Header Section */}
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <Badge badgeContent={newAttendanceCount} color="error" max={99}>
                <QrCodeIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              </Badge>
              <Typography variant="h4" component="h1" fontWeight="bold">
                📡 Live Pulse Monitor
              </Typography>
              <Chip 
                label={connectionStatus === 'connected' ? '🟢 Live Pulse' : connectionStatus === 'error' ? '🔴 Signal Lost' : '🟡 Connecting'}
                size="small"
                color={connectionStatus === 'connected' ? 'success' : connectionStatus === 'error' ? 'error' : 'warning'}
                variant="outlined"
              />
            </Stack>
            <Typography variant="body1" color="text.secondary">
              Track the heartbeat of student attendance with instant QR scan detection and live updates
            </Typography>
            {connectionStatus !== 'connected' && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                ⚡ Pulse signal interrupted - Live monitoring temporarily unavailable
              </Alert>
            )}
          </Box>

          {/* Filters and Controls */}
          <Card sx={{ mb: 3, p: 3 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexGrow: 1 }}>
                <TextField
                  label="📅 Select Date"
                  type="date"
                  size="small"
                  value={date.toISOString().split('T')[0]}
                  onChange={(e) => setDate(new Date(e.target.value))}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 180 }}
                />
                
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>🎯 Meeting ID</InputLabel>
                  <Select
                    value={selectedMeeting}
                    label="🎯 Meeting ID"
                    onChange={(e) => setSelectedMeeting(e.target.value)}
                  >
                    <MenuItem value="all">All Meetings</MenuItem>
                    {uniqueMeetings.map(meetingId => (
                      <MenuItem key={meetingId} value={meetingId}>
                        Meeting {meetingId}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>📊 Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="📊 Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="present">Present</MenuItem>
                    <MenuItem value="late">Late</MenuItem>
                    <MenuItem value="absent">Absent</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              
              <Stack direction="row" spacing={1}>
                <Tooltip title="Refresh Data">
                  <IconButton 
                    onClick={() => {
                      loadAttendance();
                      setNewAttendanceCount(0);
                    }} 
                    color="primary"
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Export to CSV">
                  <IconButton onClick={exportToCSV} color="success">
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Summary Stats */}
            <Stack direction="row" spacing={4} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                📈 <strong>Total Records:</strong> {totalRecords}
              </Typography>
              <Typography variant="body2" color="success.main">
                ✅ <strong>Present:</strong> {attendanceData.filter(item => item.status === 'Present').length}
              </Typography>
              <Typography variant="body2" color="warning.main">
                ⏰ <strong>Late:</strong> {attendanceData.filter(item => item.status === 'Late').length}
              </Typography>
              <Typography variant="body2" color="error.main">
                ❌ <strong>Absent:</strong> {attendanceData.filter(item => item.status === 'Absent').length}
              </Typography>
            </Stack>
          </Card>

          {/* Main Data Table */}
          <Card>
            <TableContainer>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Meeting ID</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Student Name</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Student ID</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Time Joined</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={24} sx={{ mr: 2 }} />
                        Syncing pulse data...
                      </TableCell>
                    </TableRow>
                  ) : attendanceData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        📊 No pulse signals detected for the selected timeframe
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendanceData.map((entry) => (
                      <TableRow 
                        key={entry.id} 
                        sx={{ 
                          '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                          '&:hover': { bgcolor: 'action.selected' }
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>
                          {entry.meetingId}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                              {entry.studentName.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {entry.studentName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {entry.department}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {entry.studentId}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">{entry.email}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">{entry.timeJoined}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(entry.status)}
                            label={entry.status}
                            color={getStatusColor(entry.status)}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Tooltip title={`Generated by ${entry.qrGeneratedBy}`}>
                              <Chip 
                                icon={<QrCodeIcon />} 
                                label="QR Scan" 
                                size="small" 
                                variant="outlined" 
                                color="info"
                              />
                            </Tooltip>
                            <Tooltip title={`Distance: ${entry.distance} from center`}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocationIcon sx={{ fontSize: 12 }} />
                                {entry.distance}
                              </Typography>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
          {/* Snackbar for real-time notifications */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={4000}
            onClose={() => setSnackbarOpen(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert 
              onClose={() => setSnackbarOpen(false)} 
              severity="success" 
              sx={{ width: '100%' }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </Box>
      </Fade>
  );
};

export default AttendanceLogs;
