import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Badge,
  LinearProgress,
  Menu,
  MenuList,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Stack,
  ButtonGroup
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Launch,
  ContentCopy,
  Refresh,
  FilterList,
  Download,
  Schedule,
  People,
  Videocam,
  VideocamOff,
  AccessTime,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  MoreVert,
  PersonAdd,
  Stop,
  PlayArrow,
  Assessment
} from '@mui/icons-material';
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import io from 'socket.io-client';
import {
  calculateParticipantAttendance,
  calculateMeetingAttendanceStats,
  getAttendanceStatusColor as getAttendanceUtilStatusColor,
  formatAttendancePercentage,
  sanitizeAttendanceData
} from '../utils/attendanceUtils';

const MeetingManagement = () => {
  // State management
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationSeverity, setNotificationSeverity] = useState('info');
  
  // Dialog states
  const [createMeetingDialog, setCreateMeetingDialog] = useState(false);
  const [editMeetingDialog, setEditMeetingDialog] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [filterDialog, setFilterDialog] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuMeeting, setMenuMeeting] = useState(null);
  const [participantsDialog, setParticipantsDialog] = useState(false);
  const [participantsData, setParticipantsData] = useState(null);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  
  // Participants filtering and sorting
  const [participantFilter, setParticipantFilter] = useState({
    status: 'all',
    authenticated: 'all',
    matched: 'all',
    search: ''
  });
  const [participantSort, setParticipantSort] = useState({
    field: 'name',
    direction: 'asc'
  });
  
  // Form states
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    type: 'online',
    participants: '',
    location: '',
    organizer: '',
    agenda: ''
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    dateRange: 'all'
  });
  
  // Backend URL
  const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
  
  // Initialize socket connection for real-time updates
  useEffect(() => {
    const newSocket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    newSocket.on('connect', () => {
      console.log('✅ Meeting Management connected to server');
      showNotificationMessage('Connected to real-time updates', 'success');
    });

    // Listen for meeting creation events
    newSocket.on('meetingCreated', (data) => {
      console.log('🎉 New meeting created:', data);
      loadMeetings(); // Refresh the meetings list
      showNotificationMessage(`Meeting "${data.meeting?.topic || data.savedMeeting?.topic || 'New Meeting'}" was created`, 'success');
    });

    // Listen for meeting updates
    newSocket.on('meetingUpdated', (data) => {
      console.log('📝 Meeting updated:', data);
      loadMeetings();
      showNotificationMessage(`Meeting "${data.meeting?.topic || 'Meeting'}" was updated`, 'info');
    });

    // Listen for meeting started events
    newSocket.on('meetingStarted', (data) => {
      console.log('🎬 Meeting started:', data);
      loadMeetings();
      showNotificationMessage(`Meeting "${data.meeting?.topic || 'Meeting'}" has started`, 'success');
    });

    // Listen for meeting ended events
    newSocket.on('meetingEnded', (data) => {
      console.log('🏁 Meeting ended:', data);
      loadMeetings();
      showNotificationMessage(`Meeting "${data.meeting?.topic || 'Meeting'}" has ended`, 'info');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Meeting Management disconnected from server');
      showNotificationMessage('Disconnected from real-time updates', 'error');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [backendUrl]);

  // Load meetings on component mount
  useEffect(() => {
    loadMeetings();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadMeetings, 30000);
    return () => clearInterval(interval);
  }, []);

  // Helper functions
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
    
    setNotifications(prev => [notification, ...prev.slice(0, 19)]);
  }, []);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/meetings`);
      const data = await response.json();
      
      if (data.success) {
        setMeetings(data.data || []);
        console.log('📊 Loaded', data.data?.length || 0, 'meetings');
      } else {
        throw new Error(data.message || 'Failed to load meetings');
      }
    } catch (error) {
      console.error('Failed to load meetings:', error);
      showNotificationMessage('Failed to load meetings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createMeeting = async () => {
    if (!meetingForm.title.trim()) {
      showNotificationMessage('Please enter a meeting title', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingForm),
      });

      const data = await response.json();
      
      if (response.ok) {
        showNotificationMessage(`Meeting "${meetingForm.title}" created successfully!`, 'success');
        setCreateMeetingDialog(false);
        resetMeetingForm();
        await loadMeetings();
      } else {
        throw new Error(data.message || 'Failed to create meeting');
      }
    } catch (error) {
      console.error('Failed to create meeting:', error);
      showNotificationMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateMeeting = async () => {
    if (!selectedMeeting || !meetingForm.title.trim()) {
      showNotificationMessage('Please enter a meeting title', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/meetings/${selectedMeeting.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingForm),
      });

      const data = await response.json();
      
      if (response.ok) {
        showNotificationMessage(`Meeting "${meetingForm.title}" updated successfully!`, 'success');
        setEditMeetingDialog(false);
        resetMeetingForm();
        setSelectedMeeting(null);
        await loadMeetings();
      } else {
        throw new Error(data.message || 'Failed to update meeting');
      }
    } catch (error) {
      console.error('Failed to update meeting:', error);
      showNotificationMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteMeeting = async (meetingId, meetingTitle) => {
    if (!confirm(`Are you sure you want to delete "${meetingTitle}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/meetings/${meetingId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (response.ok) {
        showNotificationMessage(`Meeting "${meetingTitle}" deleted successfully!`, 'success');
        await loadMeetings();
      } else {
        throw new Error(data.message || 'Failed to delete meeting');
      }
    } catch (error) {
      console.error('Failed to delete meeting:', error);
      showNotificationMessage(error.message, 'error');
    } finally {
      setLoading(false);
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

  const resetMeetingForm = () => {
    setMeetingForm({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      type: 'online',
      participants: '',
      location: '',
      organizer: '',
      agenda: ''
    });
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Not scheduled';
    
    try {
      const date = typeof dateTime === 'string' ? parseISO(dateTime) : dateTime;
      if (!isValid(date)) return 'Invalid date';
      
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'warning';
      case 'in-progress':
        return 'success';
      case 'completed':
        return 'default';
      default:
        return 'info';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'online':
        return <Videocam />;
      case 'in-person':
        return <People />;
      default:
        return <Schedule />;
    }
  };

  const filteredMeetings = meetings.filter(meeting => {
    if (filters.status !== 'all' && meeting.status !== filters.status) return false;
    if (filters.type !== 'all' && meeting.type !== filters.type) return false;
    return true;
  });

  const openEditDialog = (meeting) => {
    setSelectedMeeting(meeting);
    setMeetingForm({
      title: meeting.title || '',
      description: meeting.description || '',
      startTime: meeting.startTime ? format(parseISO(meeting.startTime), "yyyy-MM-dd'T'HH:mm") : '',
      endTime: meeting.endTime ? format(parseISO(meeting.endTime), "yyyy-MM-dd'T'HH:mm") : '',
      type: meeting.type || 'online',
      participants: Array.isArray(meeting.participants) ? meeting.participants.join(', ') : (meeting.participants || ''),
      location: meeting.location || '',
      organizer: meeting.organizer || '',
      agenda: meeting.agenda || ''
    });
    setEditMeetingDialog(true);
    setMenuAnchor(null);
  };

  const handleMenuClick = (event, meeting) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuMeeting(meeting);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuMeeting(null);
  };

  const loadParticipants = async (meeting) => {
    setParticipantsLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/meetings/${meeting.id}/participants`);
      const data = await response.json();
      
      if (data.success) {
        console.log('📊 Raw participants data received:', data.data);
        
        // The backend now provides properly calculated attendance data
        const participantsData = {
          meetingId: data.data.meetingId,
          meetingTitle: data.data.meetingTitle,
          meetingStatus: data.data.meetingStatus,
          participants: data.data.participants || [],
          statistics: {
            total: data.data.attendanceStats?.total || 0
          },
          attendanceStats: data.data.attendanceStats || {
            total: 0,
            present: 0,
            partial: 0,
            late: 0,
            absent: 0,
            inProgress: 0
          }
        };
        
        setParticipantsData(participantsData);
        setParticipantsDialog(true);
        console.log('📊 Loaded participants for meeting:', meeting.title, 'with backend-calculated attendance');
        console.log('📊 Attendance stats:', participantsData.attendanceStats);
      } else {
        throw new Error(data.message || 'Failed to load participants');
      }
    } catch (error) {
      console.error('Failed to load participants:', error);
      showNotificationMessage('Failed to load participants. Please check if the meeting has attendance data.', 'error');
    } finally {
      setParticipantsLoading(false);
    }
  };

  const getAttendanceStatusColor = (status) => {
    // Use the utility function for consistency
    return getAttendanceUtilStatusColor(status);
  };

  // Filter and sort participants
  const getFilteredAndSortedParticipants = () => {
    if (!participantsData?.participants) return [];
    
    let filtered = participantsData.participants.filter(participant => {
      // Status filter
      if (participantFilter.status !== 'all' && participant.attendanceStatus !== participantFilter.status) {
        return false;
      }
      
      // Authentication filter
      if (participantFilter.authenticated !== 'all') {
        const isAuthenticated = Boolean(participant.email);
        if (participantFilter.authenticated === 'authenticated' && !isAuthenticated) return false;
        if (participantFilter.authenticated === 'guest' && isAuthenticated) return false;
      }
      
      // Matched filter
      if (participantFilter.matched !== 'all') {
        if (participantFilter.matched === 'matched' && !participant.isMatched) return false;
        if (participantFilter.matched === 'unmatched' && participant.isMatched) return false;
      }
      
      // Search filter
      if (participantFilter.search) {
        const searchTerm = participantFilter.search.toLowerCase();
        const matchesName = participant.name?.toLowerCase().includes(searchTerm);
        const matchesEmail = participant.email?.toLowerCase().includes(searchTerm);
        const matchesStudentName = participant.student ? 
          `${participant.student.firstName} ${participant.student.lastName}`.toLowerCase().includes(searchTerm) : false;
        
        if (!matchesName && !matchesEmail && !matchesStudentName) return false;
      }
      
      return true;
    });
    
    // Sort participants
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (participantSort.field) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'attendancePercentage':
          aValue = a.attendancePercentage || 0;
          bValue = b.attendancePercentage || 0;
          break;
        case 'joinTime':
          aValue = a.joinTime ? new Date(a.joinTime).getTime() : 0;
          bValue = b.joinTime ? new Date(b.joinTime).getTime() : 0;
          break;
        case 'attendanceStatus':
          aValue = a.attendanceStatus || '';
          bValue = b.attendanceStatus || '';
          break;
        default:
          aValue = a.name || '';
          bValue = b.name || '';
      }
      
      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return participantSort.direction === 'asc' ? comparison : -comparison;
      } else {
        const comparison = aValue - bValue;
        return participantSort.direction === 'asc' ? comparison : -comparison;
      }
    });
    
    return filtered;
  };

  // Export participants to CSV
  const exportParticipantsToCSV = () => {
    if (!participantsData?.participants) return;
    
    const participants = getFilteredAndSortedParticipants();
    
    // CSV headers
    const headers = [
      'Participant Name',
      'Email',
      'Authentication Status', 
      'Student Name',
      'Student ID',
      'Department',
      'Join Time',
      'Leave Time',
      'Duration',
      'Attendance Percentage',
      'Attendance Status',
      'Matched Status',
      'Source'
    ];
    
    // CSV rows
    const rows = participants.map(participant => [
      participant.name || '',
      participant.email || '',
      participant.email ? 'Authenticated' : 'Guest',
      participant.student ? `${participant.student.firstName} ${participant.student.lastName}` : '',
      participant.student?.id || '',
      participant.student?.department || '',
      participant.joinTime ? formatDateTime(participant.joinTime) : '',
      participant.leaveTime ? formatDateTime(participant.leaveTime) : '',
      participant.duration || '',
      participant.attendancePercentage !== undefined ? formatAttendancePercentage(participant.attendancePercentage) : '',
      participant.attendanceStatus || '',
      participant.isMatched ? 'Matched' : 'Unmatched',
      participant.source || ''
    ]);
    
    // Create CSV content
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${participantsData.meetingTitle}_participants_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotificationMessage('Participants data exported successfully!', 'success');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment color="primary" />
          Meeting Management
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Badge badgeContent={meetings.length} color="primary">
            <People />
          </Badge>
          <ButtonGroup variant="outlined" size="small">
            <Tooltip title="Refresh">
              <IconButton onClick={loadMeetings} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Filter">
              <IconButton onClick={() => setFilterDialog(true)}>
                <FilterList />
              </IconButton>
            </Tooltip>
          </ButtonGroup>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateMeetingDialog(true)}
          >
            Create Meeting
          </Button>
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Meetings
              </Typography>
              <Typography variant="h4">
                {meetings.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Scheduled
              </Typography>
              <Typography variant="h4">
                {meetings.filter(m => m.status === 'scheduled').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                In Progress
              </Typography>
              <Typography variant="h4">
                {meetings.filter(m => m.status === 'in-progress').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4">
                {meetings.filter(m => m.status === 'completed').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Meetings Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              All Meetings ({filteredMeetings.length})
            </Typography>
            {loading && <LinearProgress sx={{ width: 200 }} />}
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Meeting</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Organizer</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Attendance</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMeetings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Box sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          {loading ? 'Loading meetings...' : 'No meetings found'}
                        </Typography>
                        {!loading && (
                          <Button
                            startIcon={<Add />}
                            onClick={() => setCreateMeetingDialog(true)}
                            sx={{ mt: 2 }}
                          >
                            Create Your First Meeting
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMeetings.map((meeting) => (
                    <TableRow key={meeting.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">
                            {meeting.title}
                          </Typography>
                          {meeting.description && (
                            <Typography variant="body2" color="text.secondary">
                              {meeting.description.length > 50 
                                ? `${meeting.description.substring(0, 50)}...`
                                : meeting.description
                              }
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getTypeIcon(meeting.type)}
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {meeting.type}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDateTime(meeting.startTime)}
                        </Typography>
                        {meeting.startTime && (
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(parseISO(meeting.startTime), { addSuffix: true })}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {meeting.duration}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {meeting.organizer}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={meeting.status}
                          color={getStatusColor(meeting.status)}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {formatAttendancePercentage(meeting.attendanceRate || 0)}
                          </Typography>
                          {(meeting.attendanceRate || 0) >= 80 ? (
                            <CheckCircle color="success" fontSize="small" />
                          ) : (meeting.attendanceRate || 0) >= 60 ? (
                            <Warning color="warning" fontSize="small" />
                          ) : (
                            <ErrorIcon color="error" fontSize="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={(e) => handleMenuClick(e, meeting)}
                          size="small"
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { width: 200 }
        }}
      >
        <MenuList>
          <MenuItem onClick={() => openEditDialog(menuMeeting)}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Meeting</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            loadParticipants(menuMeeting);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <People fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Participants</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            // Open meeting details view
            handleMenuClose();
          }}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          {menuMeeting?.location?.includes('zoom') && (
            <MenuItem onClick={() => {
              copyToClipboard(menuMeeting.location, 'Meeting link');
              handleMenuClose();
            }}>
              <ListItemIcon>
                <ContentCopy fontSize="small" />
              </ListItemIcon>
              <ListItemText>Copy Link</ListItemText>
            </MenuItem>
          )}
          <Divider />
          <MenuItem 
            onClick={() => {
              deleteMeeting(menuMeeting.id, menuMeeting.title);
              handleMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Meeting</ListItemText>
          </MenuItem>
        </MenuList>
      </Menu>

      {/* Create Meeting Dialog */}
      <Dialog 
        open={createMeetingDialog} 
        onClose={() => setCreateMeetingDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Meeting</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Meeting Title"
                value={meetingForm.title}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Meeting Type</InputLabel>
                <Select
                  value={meetingForm.type}
                  label="Meeting Type"
                  onChange={(e) => setMeetingForm(prev => ({ ...prev, type: e.target.value }))}
                >
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="in-person">In Person</MenuItem>
                  <MenuItem value="hybrid">Hybrid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Time"
                type="datetime-local"
                value={meetingForm.startTime}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, startTime: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Time"
                type="datetime-local"
                value={meetingForm.endTime}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, endTime: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={meetingForm.description}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Organizer"
                value={meetingForm.organizer}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, organizer: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={meetingForm.location}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, location: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Participants (comma separated)"
                value={meetingForm.participants}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, participants: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Agenda"
                multiline
                rows={2}
                value={meetingForm.agenda}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, agenda: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateMeetingDialog(false)}>Cancel</Button>
          <Button onClick={createMeeting} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Create Meeting'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Meeting Dialog */}
      <Dialog 
        open={editMeetingDialog} 
        onClose={() => setEditMeetingDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Meeting</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Meeting Title"
                value={meetingForm.title}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Meeting Type</InputLabel>
                <Select
                  value={meetingForm.type}
                  label="Meeting Type"
                  onChange={(e) => setMeetingForm(prev => ({ ...prev, type: e.target.value }))}
                >
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="in-person">In Person</MenuItem>
                  <MenuItem value="hybrid">Hybrid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Time"
                type="datetime-local"
                value={meetingForm.startTime}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, startTime: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Time"
                type="datetime-local"
                value={meetingForm.endTime}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, endTime: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={meetingForm.description}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Organizer"
                value={meetingForm.organizer}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, organizer: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={meetingForm.location}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, location: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Participants (comma separated)"
                value={meetingForm.participants}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, participants: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Agenda"
                multiline
                rows={2}
                value={meetingForm.agenda}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, agenda: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMeetingDialog(false)}>Cancel</Button>
          <Button onClick={updateMeeting} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Update Meeting'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={filterDialog} onClose={() => setFilterDialog(false)}>
        <DialogTitle>Filter Meetings</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  label="Type"
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="in-person">In Person</MenuItem>
                  <MenuItem value="hybrid">Hybrid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterDialog(false)}>Cancel</Button>
          <Button onClick={() => setFilterDialog(false)} variant="contained">
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Participants Dialog */}
      <Dialog
        open={participantsDialog}
        onClose={() => setParticipantsDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <People color="primary" />
            Meeting Participants
            {participantsData && (
              <Chip 
                label={`${participantsData.participants?.length || 0} participants`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {participantsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : participantsData ? (
            <>
              {/* Meeting Info */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Meeting Title
                      </Typography>
                      <Typography variant="body1">{participantsData.meetingTitle}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Meeting Status
                      </Typography>
                      <Chip 
                        label={participantsData.meetingStatus}
                        size="small"
                        color={getStatusColor(participantsData.meetingStatus === 'waiting' ? 'scheduled' : 
                               participantsData.meetingStatus === 'started' ? 'in-progress' : 'completed')}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Enhanced Attendance Stats */}
              {participantsData.attendanceStats && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        📊 Live Attendance Statistics
                      </Typography>
                      <Chip 
                        label={`${participantsData.attendanceStats.total} Total`}
                        color="primary" 
                        variant="outlined"
                      />
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={2}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                          <Typography variant="h3" color="success.contrastText">
                            {participantsData.attendanceStats.present}
                          </Typography>
                          <Typography variant="body2" color="success.contrastText" fontWeight="bold">
                            ✅ Present
                          </Typography>
                          <Typography variant="caption" color="success.contrastText">
                            ≥90% attendance
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={2}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                          <Typography variant="h3" color="info.contrastText">
                            {participantsData.attendanceStats.inProgress || 0}
                          </Typography>
                          <Typography variant="body2" color="info.contrastText" fontWeight="bold">
                            🔵 Active Now
                          </Typography>
                          <Typography variant="caption" color="info.contrastText">
                            Currently in meeting
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={2}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
                          <Typography variant="h3" color="warning.contrastText">
                            {participantsData.attendanceStats.partial}
                          </Typography>
                          <Typography variant="body2" color="warning.contrastText" fontWeight="bold">
                            ⚠️ Partial
                          </Typography>
                          <Typography variant="caption" color="warning.contrastText">
                            70-89% attendance
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={2}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'orange', borderRadius: 2 }}>
                          <Typography variant="h3" color="white">
                            {participantsData.attendanceStats.late}
                          </Typography>
                          <Typography variant="body2" color="white" fontWeight="bold">
                            🕐 Late
                          </Typography>
                          <Typography variant="caption" color="white">
                            30-69% attendance
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={2}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 2 }}>
                          <Typography variant="h3" color="error.contrastText">
                            {participantsData.attendanceStats.absent}
                          </Typography>
                          <Typography variant="body2" color="error.contrastText" fontWeight="bold">
                            ❌ Absent
                          </Typography>
                          <Typography variant="caption" color="error.contrastText">
                            &lt;30% attendance
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={2}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.300', borderRadius: 2 }}>
                          <Typography variant="h3" color="text.primary">
                            {participantsData.attendanceStats.total > 0 
                              ? Math.round((participantsData.attendanceStats.present / participantsData.attendanceStats.total) * 100)
                              : 0}%
                          </Typography>
                          <Typography variant="body2" color="text.primary" fontWeight="bold">
                            📈 Success Rate
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Overall attendance
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    {/* Attendance Progress Bar */}
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="body2" gutterBottom>
                        Attendance Distribution
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={participantsData.attendanceStats.total > 0 
                          ? (participantsData.attendanceStats.present / participantsData.attendanceStats.total) * 100
                          : 0
                        } 
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          bgcolor: 'error.light',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: 'success.main'
                          }
                        }} 
                      />
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Participants Filtering and Controls */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      🔍 Filter & Sort Participants
                    </Typography>
                    <Button 
                      variant="text" 
                      size="small"
                      onClick={() => {
                        setParticipantFilter({ status: 'all', authenticated: 'all', matched: 'all', search: '' });
                        setParticipantSort({ field: 'name', direction: 'asc' });
                      }}
                    >
                      Clear All
                    </Button>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Search by name or email..."
                        value={participantFilter.search}
                        onChange={(e) => setParticipantFilter(prev => ({ ...prev, search: e.target.value }))}
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1 }}>🔍</Typography>
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={participantFilter.status}
                          label="Status"
                          onChange={(e) => setParticipantFilter(prev => ({ ...prev, status: e.target.value }))}
                        >
                          <MenuItem value="all">All Status</MenuItem>
                          <MenuItem value="Present">Present</MenuItem>
                          <MenuItem value="Partial">Partial</MenuItem>
                          <MenuItem value="Late">Late</MenuItem>
                          <MenuItem value="Absent">Absent</MenuItem>
                          <MenuItem value="In Progress">In Progress</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Auth Status</InputLabel>
                        <Select
                          value={participantFilter.authenticated}
                          label="Auth Status"
                          onChange={(e) => setParticipantFilter(prev => ({ ...prev, authenticated: e.target.value }))}
                        >
                          <MenuItem value="all">All</MenuItem>
                          <MenuItem value="authenticated">Authenticated</MenuItem>
                          <MenuItem value="guest">Guest</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Matched</InputLabel>
                        <Select
                          value={participantFilter.matched}
                          label="Matched"
                          onChange={(e) => setParticipantFilter(prev => ({ ...prev, matched: e.target.value }))}
                        >
                          <MenuItem value="all">All</MenuItem>
                          <MenuItem value="matched">Matched</MenuItem>
                          <MenuItem value="unmatched">Unmatched</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Sort By</InputLabel>
                        <Select
                          value={`${participantSort.field}_${participantSort.direction}`}
                          label="Sort By"
                          onChange={(e) => {
                            const [field, direction] = e.target.value.split('_');
                            setParticipantSort({ field, direction });
                          }}
                        >
                          <MenuItem value="name_asc">Name (A-Z)</MenuItem>
                          <MenuItem value="name_desc">Name (Z-A)</MenuItem>
                          <MenuItem value="email_asc">Email (A-Z)</MenuItem>
                          <MenuItem value="email_desc">Email (Z-A)</MenuItem>
                          <MenuItem value="attendancePercentage_desc">Attendance % (High-Low)</MenuItem>
                          <MenuItem value="attendancePercentage_asc">Attendance % (Low-High)</MenuItem>
                          <MenuItem value="joinTime_asc">Join Time (Early-Late)</MenuItem>
                          <MenuItem value="joinTime_desc">Join Time (Late-Early)</MenuItem>
                          <MenuItem value="attendanceStatus_asc">Status (A-Z)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Showing {getFilteredAndSortedParticipants().length} of {participantsData?.participants?.length || 0} participants
                    </Typography>
                    {(participantFilter.status !== 'all' || participantFilter.authenticated !== 'all' || 
                      participantFilter.matched !== 'all' || participantFilter.search) && (
                      <Chip 
                        label="Filters Active" 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
              
              {/* Participants Table */}
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      👥 Participant Details
                    </Typography>
                    <ButtonGroup size="small" variant="outlined">
                      <Button startIcon={<Refresh />} onClick={() => loadParticipants({ id: participantsData?.meetingId })}>
                        Refresh
                      </Button>
                      <Button startIcon={<Download />} onClick={exportParticipantsToCSV}>
                        Export
                      </Button>
                    </ButtonGroup>
                  </Box>
                  {participantsData.participants?.length > 0 ? (
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
                          {getFilteredAndSortedParticipants().map((participant, index) => (
                            <TableRow key={participant.id || index} hover>
                              {/* Participant Column */}
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar sx={{ width: 32, height: 32 }}>
                                    {participant.name?.charAt(0)?.toUpperCase()}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" fontWeight="medium">
                                      {participant.name || 'Unknown'}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                      {participant.isMatched ? (
                                        <CheckCircle color="success" sx={{ fontSize: 14 }} />
                                      ) : (
                                        <ErrorIcon color="error" sx={{ fontSize: 14 }} />
                                      )}
                                      <Typography variant="caption" color={participant.isMatched ? 'success.main' : 'error.main'}>
                                        {participant.isMatched ? 'Matched' : 'Unmatched'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              </TableCell>
                              {/* Authentication Status Column */}
                              <TableCell>
                                <Box>
                                  <Chip
                                    label={participant.email ? 'Authenticated' : 'Guest'}
                                    size="small"
                                    color={participant.email ? 'success' : 'warning'}
                                    variant="outlined"
                                  />
                                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                    {participant.source === 'webhook' ? 'Real-time' : 
                                     participant.source === 'api_reconcile' ? 'API Verified' : 'Manual'}
                                  </Typography>
                                </Box>
                              </TableCell>
                              {/* User Details Column */}
                              <TableCell>
                                <Box>
                                  <Typography variant="body2">
                                    {participant.email || 'No email provided'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    {participant.attendancePercentage !== undefined ? 
                                      `${formatAttendancePercentage(participant.attendancePercentage)} attendance` : 
                                      'Calculating...'
                                    }
                                  </Typography>
                                </Box>
                              </TableCell>
                              {/* Student Info Column */}
                              <TableCell>
                                {participant.student ? (
                                  <Box>
                                    <Typography variant="body2" fontWeight="medium">
                                      {participant.student.firstName} {participant.student.lastName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      ID: {participant.student.id}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {participant.student.department}
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                    No student record found
                                  </Typography>
                                )}
                              </TableCell>
                              {/* Join Time Column */}
                              <TableCell>
                                <Typography variant="body2">
                                  {participant.joinTime ? formatDateTime(participant.joinTime) : 'N/A'}
                                </Typography>
                                {participant.leaveTime && (
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Left: {formatDateTime(participant.leaveTime)}
                                  </Typography>
                                )}
                              </TableCell>
                              {/* Duration Column */}
                              <TableCell>
                                <Typography variant="body2">
                                  {participant.duration || 'In progress'}
                                </Typography>
                              </TableCell>
                              {/* Status Column */}
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Chip
                                    label={participant.attendanceStatus || 'Unknown'}
                                    size="small"
                                    color={getAttendanceStatusColor(participant.attendanceStatus)}
                                  />
                                  {participant.attendancePercentage !== undefined && (
                                    <Typography variant="caption" color="text.secondary">
                                      {formatAttendancePercentage(participant.attendancePercentage)}
                                    </Typography>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <People sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No participants found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        This meeting doesn't have any recorded participants yet.
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ErrorIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Failed to load participants
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please try again later.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setParticipantsDialog(false)}>
            Close
          </Button>
          {participantsData && (
            <Button variant="outlined" startIcon={<Download />} onClick={exportParticipantsToCSV}>
              Export CSV
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={showNotification}
        autoHideDuration={6000}
        onClose={() => setShowNotification(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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

export default MeetingManagement;
