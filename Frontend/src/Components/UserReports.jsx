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
  Chip,
  LinearProgress,
  Alert,
  Fade,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  Download,
  Visibility,
  Grade,
  Schedule,
  School,
  BarChart,
  PictureAsPdf,
  InsertChart,
  MoreVert,
  FilePresent,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const UserReports = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  // Initialize with empty data structure for production
  const defaultOverallStats = {
    totalReports: 0,
    currentGPA: 0.0,
    attendanceRate: 0.0,
    coursesCompleted: 0
  };

  const [overallStats, setOverallStats] = useState(defaultOverallStats);

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        setLoading(true);
        
        // TODO: Replace with actual API endpoints
        const [reportsResponse, statsResponse] = await Promise.all([
          fetch('/api/user/reports'),
          fetch('/api/user/stats')
        ]);
        
        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json();
          setReports(reportsData || []);
        }
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setOverallStats(statsData || defaultOverallStats);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching reports data:', error);
        setReports([]);
        setOverallStats(defaultOverallStats);
        setLoading(false);
      }
    };
    
    fetchReportsData();
  }, []);

  const handleMenuOpen = (event, report) => {
    setAnchorEl(event.currentTarget);
    setSelectedReport(report);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedReport(null);
  };

  const getReportTypeColor = (type) => {
    switch (type) {
      case 'academic': return 'primary';
      case 'attendance': return 'success';
      case 'performance': return 'warning';
      case 'learning': return 'info';
      default: return 'default';
    }
  };

  const getReportTypeIcon = (type) => {
    switch (type) {
      case 'academic': return <Grade />;
      case 'attendance': return <Schedule />;
      case 'performance': return <TrendingUp />;
      case 'learning': return <School />;
      default: return <Assessment />;
    }
  };

  const getGPAColor = (gpa) => {
    if (gpa >= 3.5) return 'success.main';
    if (gpa >= 3.0) return 'warning.main';
    return 'error.main';
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return 'success.main';
    if (rate >= 75) return 'warning.main';
    return 'error.main';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading your reports...</Typography>
      </Box>
    );
  }

  return (
    <Fade in={true} timeout={600}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            My Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and download your personal academic reports and progress summaries
          </Typography>
        </Box>

        {/* Summary Statistics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Assessment color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {overallStats.totalReports}
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
                <Grade sx={{ fontSize: 40, mb: 1, color: getGPAColor(overallStats.currentGPA) }} />
                <Typography variant="h4" sx={{ color: getGPAColor(overallStats.currentGPA) }} fontWeight="bold">
                  {overallStats.currentGPA}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Current GPA
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Schedule sx={{ fontSize: 40, mb: 1, color: getAttendanceColor(overallStats.attendanceRate) }} />
                <Typography variant="h4" sx={{ color: getAttendanceColor(overallStats.attendanceRate) }} fontWeight="bold">
                  {overallStats.attendanceRate}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Attendance Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <School color="info" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  {overallStats.coursesCompleted}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Courses Completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Performance Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Academic Performance
                </Typography>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">Overall Progress</Typography>
                    <Typography variant="body2" fontWeight="bold">92%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={92}
                    color="success"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUp color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Excellent performance in Computer Science"
                      secondary="Top 10% of class"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <BarChart color="warning" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Physics needs improvement"
                      secondary="Consider additional study sessions"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Attendance Insights
                </Typography>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">Attendance Goal</Typography>
                    <Typography variant="body2" fontWeight="bold">84.4% / 85%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={84.4 / 85 * 100}
                    color="warning"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Alert severity="warning" sx={{ mt: 2 }}>
                  You're close to meeting the attendance requirement. Attend 1 more class to reach 85%.
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Reports Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Available Reports
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Report Details</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>Generated</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <PictureAsPdf color="error" />
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {report.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              PDF Document
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getReportTypeIcon(report.type)}
                          <Chip
                            label={report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                            color={getReportTypeColor(report.type)}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>{report.period}</TableCell>
                      <TableCell>{report.generatedDate}</TableCell>
                      <TableCell>{report.size}</TableCell>
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

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <Download fontSize="small" />
            </ListItemIcon>
            <ListItemText>Download PDF</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            <ListItemText>Preview</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <InsertChart fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
        </Menu>

        {/* Quick Actions */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<Assessment />}>
            Request New Report
          </Button>
          <Button variant="outlined" startIcon={<TrendingUp />}>
            View Progress Charts
          </Button>
          <Button variant="outlined" startIcon={<FilePresent />}>
            Export All Reports
          </Button>
        </Box>
      </Box>
    </Fade>
  );
};

export default UserReports;
