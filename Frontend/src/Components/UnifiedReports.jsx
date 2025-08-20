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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemButton,
  FormControlLabel,
  Switch,
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
  TrendingUp,
  School,
  Group,
  EventNote,
  Assessment,
  BarChart,
  Print,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import Swal from 'sweetalert2';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const UnifiedReports = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Combined reports state
  const [systemReports, setSystemReports] = useState([]);
  const [academicReports, setAcademicReports] = useState([]);
  
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
    description: '',
    class: 'all',
    includeCharts: true
  });

  // Mock data for system reports
  const mockSystemReports = [
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
      description: 'Detailed analysis of user activity for July 2024',
      category: 'system'
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
      description: 'Weekly system performance metrics and analysis',
      category: 'system'
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
      description: 'Comprehensive security audit and recommendations',
      category: 'system'
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
      description: 'Failed to generate meeting analytics data',
      category: 'system'
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
      description: 'Usage statistics breakdown by department',
      category: 'system'
    }
  ];

  // Mock data for academic reports
  const mockAcademicReports = [
    {
      id: 6,
      name: 'Student Performance Analysis - Q2 2024',
      type: 'student_performance',
      format: 'pdf',
      status: 'completed',
      createdAt: '2024-07-15',
      createdBy: 'Academic Coordinator',
      size: '3.2 MB',
      downloads: 25,
      class: 'Computer Science',
      description: 'Comprehensive analysis of student academic performance for Q2 2024',
      category: 'academic'
    },
    {
      id: 7,
      name: 'Monthly Attendance Summary - July 2024',
      type: 'attendance',
      format: 'excel',
      status: 'completed',
      createdAt: '2024-07-18',
      createdBy: 'System',
      size: '1.8 MB',
      downloads: 15,
      class: 'All Classes',
      description: 'Monthly attendance tracking and analysis for July 2024',
      category: 'academic'
    },
    {
      id: 8,
      name: 'Grade Distribution Report',
      type: 'grades',
      format: 'pdf',
      status: 'generating',
      createdAt: '2024-07-19',
      createdBy: 'Academic Head',
      size: '0 MB',
      downloads: 0,
      class: 'Mathematics',
      description: 'Grade distribution analysis across different subjects',
      category: 'academic'
    },
    {
      id: 9,
      name: 'Class Performance Comparison',
      type: 'class_comparison',
      format: 'pdf',
      status: 'completed',
      createdAt: '2024-07-10',
      createdBy: 'Principal',
      size: '2.9 MB',
      downloads: 18,
      class: 'All Classes',
      description: 'Comparative analysis of performance across different classes',
      category: 'academic'
    },
    {
      id: 10,
      name: 'Student Engagement Metrics',
      type: 'engagement',
      format: 'excel',
      status: 'failed',
      createdAt: '2024-07-12',
      createdBy: 'Data Analyst',
      size: '0 MB',
      downloads: 0,
      class: 'Engineering',
      description: 'Analysis of student engagement and participation metrics',
      category: 'academic'
    }
  ];

  // Combined report types
  const systemReportTypes = [
    { value: 'user_activity', label: 'User Activity Report' },
    { value: 'system_performance', label: 'System Performance' },
    { value: 'security_audit', label: 'Security Audit' },
    { value: 'meeting_analytics', label: 'Meeting Analytics' },
    { value: 'department_stats', label: 'Department Statistics' },
    { value: 'attendance_summary', label: 'Attendance Summary' },
  ];

  const academicReportTypes = [
    { value: 'student_performance', label: 'Student Performance', icon: <TrendingUp /> },
    { value: 'attendance', label: 'Attendance Analysis', icon: <EventNote /> },
    { value: 'grades', label: 'Grade Distribution', icon: <Assessment /> },
    { value: 'class_comparison', label: 'Class Comparison', icon: <BarChart /> },
    { value: 'engagement', label: 'Student Engagement', icon: <Group /> }
  ];

  const classes = ['all', 'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Engineering', 'Biology'];

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setSystemReports(mockSystemReports);
        setAcademicReports(mockAcademicReports);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to fetch reports');
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0); // Reset pagination when switching tabs
  };

  const getCurrentReports = () => {
    return tabValue === 0 ? systemReports : academicReports;
  };

  const getCurrentReportTypes = () => {
    return tabValue === 0 ? systemReportTypes : academicReportTypes;
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      
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
          description: reportForm.description,
          category: tabValue === 0 ? 'system' : 'academic',
          ...(tabValue === 1 && { class: reportForm.class === 'all' ? 'All Classes' : reportForm.class })
        };
        
        if (tabValue === 0) {
          setSystemReports([newReport, ...systemReports]);
        } else {
          setAcademicReports([newReport, ...academicReports]);
        }
        
        setOpenGenerateReport(false);
        setGenerating(false);
        
        // Simulate completion
        setTimeout(() => {
          const updateReports = (prev) => prev.map(r => 
            r.id === newReport.id 
              ? { ...r, status: 'completed', size: '2.1 MB' }
              : r
          );
          
          if (tabValue === 0) {
            setSystemReports(updateReports);
          } else {
            setAcademicReports(updateReports);
          }
          
          Swal.fire({
            icon: 'success',
            title: 'Report Generated!',
            text: `${reportForm.name} has been generated successfully.`,
            timer: 3000,
            showConfirmButton: false
          });
        }, tabValue === 0 ? 3000 : 5000);
        
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
      const updateReports = (reports) => reports.map(r => 
        r.id === report.id ? { ...r, downloads: r.downloads + 1 } : r
      );
      
      if (report.category === 'system') {
        setSystemReports(updateReports);
      } else {
        setAcademicReports(updateReports);
      }
      
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
      if (report.category === 'system') {
        setSystemReports(systemReports.filter(r => r.id !== report.id));
      } else {
        setAcademicReports(academicReports.filter(r => r.id !== report.id));
      }
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
      case 'word': return <FileIcon color="primary" />;
      default: return <FileIcon />;
    }
  };

  const getReportTypeIcon = (type) => {
    const academicType = academicReportTypes.find(rt => rt.value === type);
    return academicType ? academicType.icon : <ReportIcon />;
  };

  const currentReports = getCurrentReports();
  const paginatedReports = currentReports.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
            Reports & Analytics
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
              onClick={() => {
                setReportForm({
                  ...reportForm,
                  type: tabValue === 0 ? 'user_activity' : 'student_performance'
                });
                setOpenGenerateReport(true);
              }}
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

        {/* Tabs */}
        <Card sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="System Reports" />
            <Tab label="Academic Reports" />
          </Tabs>
        </Card>

        {/* Report Statistics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <ReportIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {currentReports.length}
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
                <TrendingUp color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {currentReports.filter(r => r.status === 'completed').length}
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
                <CircularProgress color="info" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  {currentReports.filter(r => r.status === 'generating').length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Processing
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <DownloadIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="secondary.main" fontWeight="bold">
                  {currentReports.reduce((sum, r) => sum + r.downloads, 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Downloads
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Report Generation for Academic Reports */}
        {tabValue === 1 && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Report Generation
                  </Typography>
                  <Grid container spacing={2}>
                    {academicReportTypes.slice(0, 4).map((type) => (
                      <Grid item xs={12} sm={6} md={3} key={type.value}>
                        <Paper
                          elevation={2}
                          sx={{
                            p: 2,
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: 4
                            }
                          }}
                          onClick={() => {
                            setReportForm(prev => ({ ...prev, type: type.value, name: type.label }));
                            setOpenGenerateReport(true);
                          }}
                        >
                          <Box sx={{ color: theme.palette.primary.main, mb: 1 }}>
                            {type.icon}
                          </Box>
                          <Typography variant="body2" fontWeight="bold">
                            {type.label}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Reports Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Report Details</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  {tabValue === 1 && <TableCell>Class</TableCell>}
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
                      <Box display="flex" alignItems="center" gap={1}>
                        {tabValue === 1 && getReportTypeIcon(report.type)}
                        <Chip
                          label={getCurrentReportTypes().find(t => t.value === report.type)?.label || report.type}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
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
                    {tabValue === 1 && <TableCell>{report.class}</TableCell>}
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
            count={currentReports.length}
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
          {tabValue === 1 && (
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <EmailIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Email</ListItemText>
            </MenuItem>
          )}
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
          <DialogTitle>Generate New {tabValue === 0 ? 'System' : 'Academic'} Report</DialogTitle>
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
                    {getCurrentReportTypes().map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {tabValue === 1 && type.icon}
                          {type.label}
                        </Box>
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
                    {tabValue === 1 && <MenuItem value="word">Word Document</MenuItem>}
                    {tabValue === 0 && <MenuItem value="csv">CSV File</MenuItem>}
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
                    {tabValue === 1 && <MenuItem value="this_quarter">This Quarter</MenuItem>}
                    {tabValue === 1 && <MenuItem value="last_quarter">Last Quarter</MenuItem>}
                    {tabValue === 1 && <MenuItem value="this_year">This Year</MenuItem>}
                    <MenuItem value="custom">Custom range</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {tabValue === 1 && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Class Filter</InputLabel>
                    <Select
                      value={reportForm.class}
                      label="Class Filter"
                      onChange={(e) => setReportForm({ ...reportForm, class: e.target.value })}
                    >
                      {classes.map((cls) => (
                        <MenuItem key={cls} value={cls}>
                          {cls === 'all' ? 'All Classes' : cls}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Recipients (optional)"
                  value={reportForm.recipients}
                  onChange={(e) => setReportForm({ ...reportForm, recipients: e.target.value })}
                  placeholder="Enter email addresses separated by commas"
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                  helperText={tabValue === 1 ? "Recipients will receive the report via email once generated" : undefined}
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
              {tabValue === 1 && (
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={reportForm.includeCharts}
                        onChange={(e) => setReportForm({ ...reportForm, includeCharts: e.target.checked })}
                      />
                    }
                    label="Include Charts and Visualizations"
                  />
                </Grid>
              )}
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

export default UnifiedReports;
