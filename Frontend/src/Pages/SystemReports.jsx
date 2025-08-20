import { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  TablePagination,
  CircularProgress,
  Alert,
  Fade,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  Assessment as ReportIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Email as EmailIcon,
  Share as ShareIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  FilePresent as FileIcon,
} from '@mui/icons-material';
// Temporarily removed date picker imports to fix dependency issues
import Swal from 'sweetalert2';

const SystemReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialog states
  const [openGenerateReport, setOpenGenerateReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Form data
  const [reportForm, setReportForm] = useState({
    name: '',
    type: 'user_activity',
    format: 'pdf',
    dateRange: 'last_30_days',
    startDate: null,
    endDate: null,
    recipients: '',
    description: ''
  });

  // Mock data
  const mockReports = [
    {
      id: 1,
      name: 'Monthly User Activity Report',
      type: 'user_activity',
      format: 'pdf',
      status: 'completed',
      createdAt: '2024-07-15',
      createdBy: 'Admin',
      size: '2.4 MB',
      downloads: 15,
      description: 'Detailed analysis of user activity for July 2024'
    },
    {
      id: 2,
      name: 'System Performance Analysis',
      type: 'system_performance',
      format: 'excel',
      status: 'generating',
      createdAt: '2024-07-18',
      createdBy: 'System',
      size: '1.8 MB',
      downloads: 0,
      description: 'Weekly system performance metrics and analysis'
    },
    {
      id: 3,
      name: 'Security Audit Report',
      type: 'security_audit',
      format: 'pdf',
      status: 'completed',
      createdAt: '2024-07-10',
      createdBy: 'Admin',
      size: '3.2 MB',
      downloads: 8,
      description: 'Comprehensive security audit and recommendations'
    },
    {
      id: 4,
      name: 'Meeting Analytics Summary',
      type: 'meeting_analytics',
      format: 'excel',
      status: 'failed',
      createdAt: '2024-07-12',
      createdBy: 'Admin',
      size: '0 MB',
      downloads: 0,
      description: 'Failed to generate meeting analytics data'
    },
    {
      id: 5,
      name: 'Department Usage Statistics',
      type: 'department_stats',
      format: 'pdf',
      status: 'completed',
      createdAt: '2024-07-08',
      createdBy: 'HR Manager',
      size: '1.9 MB',
      downloads: 12,
      description: 'Usage statistics breakdown by department'
    },
  ];

  const reportTypes = [
    { value: 'user_activity', label: 'User Activity Report' },
    { value: 'system_performance', label: 'System Performance' },
    { value: 'security_audit', label: 'Security Audit' },
    { value: 'meeting_analytics', label: 'Meeting Analytics' },
    { value: 'department_stats', label: 'Department Statistics' },
    { value: 'attendance_summary', label: 'Attendance Summary' },
  ];

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setReports(mockReports);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to fetch reports');
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      
      // Simulate report generation
      setTimeout(() => {
        const newReport = {
          id: Date.now(),
          name: reportForm.name,
          type: reportForm.type,
          format: reportForm.format,
          status: 'generating',
          createdAt: new Date().toISOString().split('T')[0],
          createdBy: 'Admin',
          size: '0 MB',
          downloads: 0,
          description: reportForm.description
        };
        
        setReports([newReport, ...reports]);
        setOpenGenerateReport(false);
        setGenerating(false);
        
        // Simulate completion after 3 seconds
        setTimeout(() => {
          setReports(prev => prev.map(r => 
            r.id === newReport.id 
              ? { ...r, status: 'completed', size: '2.1 MB' }
              : r
          ));
          
          Swal.fire({
            icon: 'success',
            title: 'Report Generated!',
            text: `${reportForm.name} has been generated successfully.`,
            timer: 3000,
            showConfirmButton: false
          });
        }, 3000);
        
        Swal.fire({
          icon: 'info',
          title: 'Report Generation Started',
          text: 'Your report is being generated. You will be notified when it\'s ready.',
          timer: 2000,
          showConfirmButton: false
        });
      }, 1000);
      
    } catch (err) {
      setGenerating(false);
      Swal.fire('Error!', 'Failed to generate report.', 'error');
    }
  };

  const handleMenuOpen = (event, report) => {
    setAnchorEl(event.currentTarget);
    setSelectedReport(report);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedReport(null);
  };

  const handleDownloadReport = (report) => {
    handleMenuClose();
    if (report.status === 'completed') {
      // Simulate download
      const updatedReports = reports.map(r => 
        r.id === report.id ? { ...r, downloads: r.downloads + 1 } : r
      );
      setReports(updatedReports);
      
      Swal.fire({
        icon: 'success',
        title: 'Download Started',
        text: `Downloading ${report.name}...`,
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      Swal.fire('Not Available', 'Report is not ready for download yet.', 'warning');
    }
  };

  const handleDeleteReport = async (report) => {
    handleMenuClose();
    const result = await Swal.fire({
      title: 'Delete Report',
      text: `Are you sure you want to delete "${report.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#grey',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      setReports(reports.filter(r => r.id !== report.id));
      Swal.fire('Deleted!', 'Report has been deleted.', 'success');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'generating': return 'info';
      case 'failed': return 'error';
      case 'scheduled': return 'warning';
      default: return 'default';
    }
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'pdf': return <PdfIcon color="error" />;
      case 'excel': return <ExcelIcon color="success" />;
      default: return <FileIcon />;
    }
  };

  const paginatedReports = reports.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              System Reports
            </Typography>
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchReports}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenGenerateReport(true)}
                sx={{ 
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5a6fd8, #6a4190)',
                  }
                }}
              >
                Generate Report
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Report Statistics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {reports.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Reports
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {reports.filter(r => r.status === 'completed').length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Completed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    {reports.filter(r => r.status === 'generating').length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Generating
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="secondary.main" fontWeight="bold">
                    {reports.reduce((sum, r) => sum + r.downloads, 0)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Downloads
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Reports Table */}
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Report Details</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Downloads</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedReports.map((report) => (
                    <TableRow key={report.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          {getFormatIcon(report.format)}
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {report.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {report.description}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={reportTypes.find(t => t.value === report.type)?.label || report.type}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Chip
                            label={report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                            color={getStatusColor(report.status)}
                            size="small"
                          />
                          {report.status === 'generating' && (
                            <LinearProgress 
                              sx={{ mt: 1, width: 100 }} 
                              variant="indeterminate" 
                              color="info" 
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {report.createdAt}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          by {report.createdBy}
                        </Typography>
                      </TableCell>
                      <TableCell>{report.size}</TableCell>
                      <TableCell>{report.downloads}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, report)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={reports.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(event, newPage) => setPage(newPage)}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
            />
          </Card>

          {/* Actions Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => handleDownloadReport(selectedReport)}>
              <ListItemIcon>
                <DownloadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Download</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <ViewIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Preview</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <ShareIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Share</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleDeleteReport(selectedReport)} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </Menu>

          {/* Generate Report Dialog */}
          <Dialog open={openGenerateReport} onClose={() => setOpenGenerateReport(false)} maxWidth="md" fullWidth>
            <DialogTitle>Generate New Report</DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Report Name"
                    value={reportForm.name}
                    onChange={(e) => setReportForm({ ...reportForm, name: e.target.value })}
                    placeholder="Enter report name..."
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Report Type</InputLabel>
                    <Select
                      value={reportForm.type}
                      label="Report Type"
                      onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}
                    >
                      {reportTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Format</InputLabel>
                    <Select
                      value={reportForm.format}
                      label="Format"
                      onChange={(e) => setReportForm({ ...reportForm, format: e.target.value })}
                    >
                      <MenuItem value="pdf">PDF Document</MenuItem>
                      <MenuItem value="excel">Excel Spreadsheet</MenuItem>
                      <MenuItem value="csv">CSV File</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Date Range</InputLabel>
                    <Select
                      value={reportForm.dateRange}
                      label="Date Range"
                      onChange={(e) => setReportForm({ ...reportForm, dateRange: e.target.value })}
                    >
                      <MenuItem value="last_7_days">Last 7 days</MenuItem>
                      <MenuItem value="last_30_days">Last 30 days</MenuItem>
                      <MenuItem value="last_90_days">Last 90 days</MenuItem>
                      <MenuItem value="this_month">This month</MenuItem>
                      <MenuItem value="last_month">Last month</MenuItem>
                      <MenuItem value="custom">Custom range</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Recipients (optional)"
                    value={reportForm.recipients}
                    onChange={(e) => setReportForm({ ...reportForm, recipients: e.target.value })}
                    placeholder="Enter email addresses separated by commas"
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description (optional)"
                    value={reportForm.description}
                    onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                    placeholder="Enter report description..."
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenGenerateReport(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerateReport} 
                variant="contained"
                disabled={generating || !reportForm.name}
                startIcon={generating && <CircularProgress size={16} />}
              >
                {generating ? 'Generating...' : 'Generate Report'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
  );
};

export default SystemReports;
