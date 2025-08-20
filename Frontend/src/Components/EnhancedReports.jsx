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
  LinearProgress,
  CircularProgress,
  Alert,
  Fade,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Menu,
  ListItemButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Assessment as ReportIcon,
  Assessment,
  TrendingUp,
  School,
  Group,
  EventNote,
  PictureAsPdf,
  TableChart,
  BarChart,
  FilePresent,
  Share,
  Email,
  Print,
  MoreVert,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import Swal from 'sweetalert2';

const EnhancedReports = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [reports, setReports] = useState([]);
  const [openGenerateReport, setOpenGenerateReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Form data for report generation
  const [reportForm, setReportForm] = useState({
    name: '',
    type: 'student_performance',
    format: 'pdf',
    dateRange: 'this_month',
    class: 'all',
    includeCharts: true,
    recipients: ''
  });

  // Mock data for existing reports
  const mockReports = [
    {
      id: 1,
      name: 'Student Performance Analysis - Q2 2024',
      type: 'student_performance',
      format: 'pdf',
      status: 'completed',
      createdAt: '2024-07-15',
      createdBy: 'Academic Coordinator',
      size: '3.2 MB',
      downloads: 25,
      class: 'Computer Science',
      description: 'Comprehensive analysis of student academic performance for Q2 2024'
    },
    {
      id: 2,
      name: 'Monthly Attendance Summary - July 2024',
      type: 'attendance',
      format: 'excel',
      status: 'completed',
      createdAt: '2024-07-18',
      createdBy: 'System',
      size: '1.8 MB',
      downloads: 15,
      class: 'All Classes',
      description: 'Monthly attendance tracking and analysis for July 2024'
    },
    {
      id: 3,
      name: 'Grade Distribution Report',
      type: 'grades',
      format: 'pdf',
      status: 'generating',
      createdAt: '2024-07-19',
      createdBy: 'Academic Head',
      size: '0 MB',
      downloads: 0,
      class: 'Mathematics',
      description: 'Grade distribution analysis across different subjects'
    },
    {
      id: 4,
      name: 'Class Performance Comparison',
      type: 'class_comparison',
      format: 'pdf',
      status: 'completed',
      createdAt: '2024-07-10',
      createdBy: 'Principal',
      size: '2.9 MB',
      downloads: 18,
      class: 'All Classes',
      description: 'Comparative analysis of performance across different classes'
    },
    {
      id: 5,
      name: 'Student Engagement Metrics',
      type: 'engagement',
      format: 'excel',
      status: 'failed',
      createdAt: '2024-07-12',
      createdBy: 'Data Analyst',
      size: '0 MB',
      downloads: 0,
      class: 'Engineering',
      description: 'Analysis of student engagement and participation metrics'
    }
  ];

  const reportTypes = [
    { value: 'student_performance', label: 'Student Performance', icon: <TrendingUp /> },
    { value: 'attendance', label: 'Attendance Analysis', icon: <EventNote /> },
    { value: 'grades', label: 'Grade Distribution', icon: <Assessment /> },
    { value: 'class_comparison', label: 'Class Comparison', icon: <BarChart /> },
    { value: 'engagement', label: 'Student Engagement', icon: <Group /> }
  ];

  const classes = ['all', 'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Engineering', 'Biology'];
  const formats = ['pdf', 'excel', 'word'];
  const dateRanges = ['this_week', 'this_month', 'last_month', 'this_quarter', 'last_quarter', 'this_year', 'custom'];

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
          createdBy: 'User',
          size: '0 MB',
          downloads: 0,
          class: reportForm.class === 'all' ? 'All Classes' : reportForm.class,
          description: `Generated report: ${reportForm.name}`
        };
        
        setReports([newReport, ...reports]);
        setOpenGenerateReport(false);
        setGenerating(false);
        
        // Simulate completion after 5 seconds
        setTimeout(() => {
          setReports(prev => prev.map(r => 
            r.id === newReport.id 
              ? { ...r, status: 'completed', size: '2.4 MB' }
              : r
          ));
          
          Swal.fire({
            icon: 'success',
            title: 'Report Generated!',
            text: `${reportForm.name} has been generated successfully.`,
            timer: 3000,
            showConfirmButton: false
          });
        }, 5000);
        
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'generating': return 'info';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'pdf': return <PictureAsPdf color="error" />;
      case 'excel': return <TableChart color="success" />;
      case 'word': return <FilePresent color="primary" />;
      default: return <FilePresent />;
    }
  };

  const getReportTypeIcon = (type) => {
    const reportType = reportTypes.find(rt => rt.value === type);
    return reportType ? reportType.icon : <ReportIcon />;
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
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Academic Reports & Analytics
          </Typography>
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
                <ReportIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
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
                <TrendingUp color="success" sx={{ fontSize: 40, mb: 1 }} />
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
                <CircularProgress color="info" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  {reports.filter(r => r.status === 'generating').length}
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
                  {reports.reduce((sum, r) => sum + r.downloads, 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Downloads
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Report Generation */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Report Generation
                </Typography>
                <Grid container spacing={2}>
                  {reportTypes.slice(0, 4).map((type) => (
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

        {/* Reports List */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Reports
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Report Details</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Downloads</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((report) => (
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
                          {getReportTypeIcon(report.type)}
                          <Typography variant="body2">
                            {reportTypes.find(rt => rt.value === report.type)?.label || report.type}
                          </Typography>
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
                              sx={{ mt: 1, width: 80 }} 
                              variant="indeterminate" 
                              color="info" 
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{report.class}</TableCell>
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
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
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
              <Share fontSize="small" />
            </ListItemIcon>
            <ListItemText>Share</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <Email fontSize="small" />
            </ListItemIcon>
            <ListItemText>Email</ListItemText>
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
                        <Box display="flex" alignItems="center" gap={1}>
                          {type.icon}
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
                    <MenuItem value="word">Word Document</MenuItem>
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
                    <MenuItem value="this_week">This Week</MenuItem>
                    <MenuItem value="this_month">This Month</MenuItem>
                    <MenuItem value="last_month">Last Month</MenuItem>
                    <MenuItem value="this_quarter">This Quarter</MenuItem>
                    <MenuItem value="last_quarter">Last Quarter</MenuItem>
                    <MenuItem value="this_year">This Year</MenuItem>
                    <MenuItem value="custom">Custom Range</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
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
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Recipients (optional)"
                  value={reportForm.recipients}
                  onChange={(e) => setReportForm({ ...reportForm, recipients: e.target.value })}
                  placeholder="Enter email addresses separated by commas"
                  helperText="Recipients will receive the report via email once generated"
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

export default EnhancedReports;
