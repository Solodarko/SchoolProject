import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Stack,
  Alert,
  Snackbar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Avatar,
  Tooltip,
  TableSortLabel,
  Divider,
} from '@mui/material';
import {
  TableView as TableIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Assessment as StatsIcon,
  QrCode2 as QrCodeIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  FileDownload as ExportIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';

const QRAttendanceDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  
  // Pagination and Filtering
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rowsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('-scannedAt');
  
  // UI State
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [statsDialog, setStatsDialog] = useState(false);
  const [sessionStats, setSessionStats] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRecord, setMenuRecord] = useState(null);

  // Fetch sessions on component mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Fetch attendance records when session changes
  useEffect(() => {
    if (selectedSession) {
      fetchAttendanceRecords();
    }
  }, [selectedSession, page, searchTerm, sortOrder]);

  const fetchSessions = async () => {
    try {
      setSessionLoading(true);
      const response = await axios.get('http://localhost:5000/api/qr-attendance/sessions');
      
      if (response.data.success) {
        setSessions(response.data.data.sessions);
        if (response.data.data.sessions.length > 0 && !selectedSession) {
          setSelectedSession(response.data.data.sessions[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      showMessage('Failed to load sessions', 'error');
    } finally {
      setSessionLoading(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    if (!selectedSession) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: rowsPerPage.toString(),
        sort: sortOrder,
      });

      if (searchTerm.trim()) {
        // Backend should support search in the future
        // params.append('search', searchTerm.trim());
      }

      const response = await axios.get(
        `http://localhost:5000/api/qr-attendance/session/${selectedSession}?${params}`
      );

      if (response.data.success) {
        const { records, totalRecords: total, totalPages: pages } = response.data.data;
        setAttendanceRecords(records);
        setTotalRecords(total);
        setTotalPages(pages);
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      showMessage('Failed to load attendance records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionStats = async (sessionId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/qr-attendance/stats/${sessionId}`);
      if (response.data.success) {
        setSessionStats(response.data.data);
        setStatsDialog(true);
      }
    } catch (error) {
      console.error('Error fetching session stats:', error);
      showMessage('Failed to load session statistics', 'error');
    }
  };

  const exportAttendance = async (sessionId, format = 'csv') => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/qr-attendance/export/${sessionId}`,
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-${sessionId}-${Date.now()}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      showMessage('Attendance exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting attendance:', error);
      showMessage('Failed to export attendance', 'error');
    }
  };

  const deleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session and all its attendance records?')) {
      return;
    }

    try {
      const response = await axios.delete(`http://localhost:5000/api/qr-attendance/session/${sessionId}`);
      
      if (response.data.success) {
        showMessage(`Deleted ${response.data.deletedCount} attendance records`, 'success');
        
        // Refresh sessions and select a new one
        await fetchSessions();
        if (selectedSession === sessionId) {
          setSelectedSession(sessions.length > 1 ? sessions[0]._id : '');
          setAttendanceRecords([]);
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      showMessage('Failed to delete session', 'error');
    }
  };

  const handleSort = (field) => {
    const isCurrentField = sortOrder === field || sortOrder === `-${field}`;
    const newOrder = isCurrentField && sortOrder.startsWith('-') ? field : `-${field}`;
    setSortOrder(newOrder);
    setPage(1); // Reset to first page
  };

  const handleMenuOpen = (event, record) => {
    setAnchorEl(event.currentTarget);
    setMenuRecord(record);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRecord(null);
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setViewDialog(true);
    handleMenuClose();
  };

  const showMessage = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getStatusColor = (scannedAt) => {
    const scanTime = new Date(scannedAt);
    const now = new Date();
    const diffMinutes = (now - scanTime) / (1000 * 60);
    
    if (diffMinutes < 30) return 'success';
    if (diffMinutes < 60) return 'warning';
    return 'default';
  };

  const filteredRecords = attendanceRecords.filter(record =>
    searchTerm === '' ||
    record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.organization && record.organization.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const currentSession = sessions.find(s => s._id === selectedSession);

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TableIcon color="primary" />
          QR Attendance Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage QR code attendance records across all sessions
        </Typography>
      </Box>

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            {/* Session Selector */}
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Session</InputLabel>
                <Select
                  value={selectedSession}
                  onChange={(e) => {
                    setSelectedSession(e.target.value);
                    setPage(1);
                  }}
                  label="Session"
                  disabled={sessionLoading}
                >
                  {sessions.map((session) => (
                    <MenuItem key={session._id} value={session._id}>
                      <Box>
                        <Typography variant="body1" noWrap>
                          {session.sessionTitle}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {session.totalAttendees} attendees • {format(new Date(session.firstScan), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Search */}
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Search by name, email, or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  endAdornment: searchTerm && (
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <ClearIcon />
                    </IconButton>
                  ),
                }}
              />
            </Grid>

            {/* Actions */}
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Tooltip title="Refresh">
                  <IconButton onClick={fetchAttendanceRecords} disabled={loading}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                
                {selectedSession && (
                  <>
                    <Tooltip title="View Statistics">
                      <IconButton onClick={() => fetchSessionStats(selectedSession)}>
                        <StatsIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Export CSV">
                      <IconButton onClick={() => exportAttendance(selectedSession)}>
                        <ExportIcon />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Session Info */}
      {currentSession && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PeopleIcon color="primary" />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {currentSession.totalAttendees}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Attendees
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <ScheduleIcon color="primary" />
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {format(new Date(currentSession.firstScan), 'MMM dd, yyyy')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      First Scan
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <QrCodeIcon color="primary" />
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {currentSession.qrCodeId?.slice(0, 8)}...
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      QR Code ID
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => deleteSession(selectedSession)}
                  fullWidth
                >
                  Delete Session
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Attendance Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              Attendance Records ({filteredRecords.length} of {totalRecords})
            </Typography>
            {loading && <CircularProgress size={20} />}
          </Box>

          {filteredRecords.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              {loading ? (
                <CircularProgress />
              ) : (
                <>
                  <TableIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    {selectedSession ? 'No attendance records found' : 'Select a session to view attendance records'}
                  </Typography>
                  {searchTerm && (
                    <Typography variant="body2" color="text.secondary">
                      Try adjusting your search criteria
                    </Typography>
                  )}
                </>
              )}
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={sortOrder === 'name' || sortOrder === '-name'}
                          direction={sortOrder === 'name' ? 'asc' : 'desc'}
                          onClick={() => handleSort('name')}
                        >
                          Attendee
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Organization</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortOrder === 'scannedAt' || sortOrder === '-scannedAt'}
                          direction={sortOrder === 'scannedAt' ? 'asc' : 'desc'}
                          onClick={() => handleSort('scannedAt')}
                        >
                          Scanned At
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record._id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {record.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body1" fontWeight="medium">
                                {record.name}
                              </Typography>
                              {record.position && (
                                <Typography variant="caption" color="text.secondary">
                                  {record.position}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>
                        
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <EmailIcon fontSize="small" color="disabled" />
                              <Typography variant="body2">{record.email}</Typography>
                            </Stack>
                            {record.phoneNumber && (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <PhoneIcon fontSize="small" color="disabled" />
                                <Typography variant="body2">{record.phoneNumber}</Typography>
                              </Stack>
                            )}
                          </Stack>
                        </TableCell>
                        
                        <TableCell>
                          {record.organization ? (
                            <Chip
                              icon={<BusinessIcon />}
                              label={record.organization}
                              size="small"
                              variant="outlined"
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2">
                            {format(new Date(record.scannedAt), 'MMM dd, yyyy')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(record.scannedAt), 'h:mm a')}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Chip
                            label={record.status}
                            color={getStatusColor(record.scannedAt)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        
                        <TableCell align="right">
                          <IconButton
                            onClick={(e) => handleMenuOpen(e, record)}
                            size="small"
                          >
                            <MoreIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(e, newPage) => setPage(newPage)}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 160 }
        }}
      >
        <MenuItem onClick={() => handleViewRecord(menuRecord)}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
      </Menu>

      {/* View Record Dialog */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Attendance Record Details</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Full Name</Typography>
                <Typography variant="body1">{selectedRecord.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{selectedRecord.email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                <Typography variant="body1">{selectedRecord.phoneNumber || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Organization</Typography>
                <Typography variant="body1">{selectedRecord.organization || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Position</Typography>
                <Typography variant="body1">{selectedRecord.position || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Scan Time</Typography>
                <Typography variant="body1">
                  {format(new Date(selectedRecord.scannedAt), 'PPpp')}
                </Typography>
              </Grid>
              {selectedRecord.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                  <Typography variant="body1">{selectedRecord.notes}</Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Device Info</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedRecord.deviceInfo || 'Not available'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Statistics Dialog */}
      <Dialog
        open={statsDialog}
        onClose={() => setStatsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Session Statistics</DialogTitle>
        <DialogContent>
          {sessionStats && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">{sessionStats.totalAttendees}</Typography>
                  <Typography variant="caption">Total Attendees</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="secondary">{sessionStats.uniqueAttendees}</Typography>
                  <Typography variant="caption">Unique Attendees</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4">{sessionStats.organizationCount}</Typography>
                  <Typography variant="caption">Organizations</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4">
                    {sessionStats.firstScan ? format(new Date(sessionStats.firstScan), 'HH:mm') : '—'}
                  </Typography>
                  <Typography variant="caption">First Scan</Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QRAttendanceDashboard;
