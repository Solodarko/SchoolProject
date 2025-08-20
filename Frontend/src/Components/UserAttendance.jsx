import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
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
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  TrendingUp,
  CalendarToday,
  Person,
  School,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const UserAttendance = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState({});

  // Mock user attendance data
  const mockData = {
    summary: {
      totalClasses: 45,
      attended: 38,
      missed: 7,
      percentage: 84.4
    },
    recentRecords: [
      {
        id: 1,
        date: '2024-07-19',
        subject: 'Mathematics',
        status: 'present',
        time: '09:00 AM',
        duration: '2 hours'
      },
      {
        id: 2,
        date: '2024-07-18',
        subject: 'Physics',
        status: 'present',
        time: '11:00 AM',
        duration: '1.5 hours'
      },
      {
        id: 3,
        date: '2024-07-17',
        subject: 'Chemistry',
        status: 'absent',
        time: '02:00 PM',
        duration: '2 hours'
      },
      {
        id: 4,
        date: '2024-07-16',
        subject: 'Computer Science',
        status: 'present',
        time: '10:00 AM',
        duration: '3 hours'
      },
      {
        id: 5,
        date: '2024-07-15',
        subject: 'English',
        status: 'late',
        time: '01:00 PM',
        duration: '1 hour'
      }
    ]
  };

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setAttendanceData(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'late': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle />;
      case 'absent': return <Cancel />;
      case 'late': return <Schedule />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading your attendance...</Typography>
      </Box>
    );
  }

  const { summary, recentRecords } = attendanceData;

  return (
    <Fade in={true} timeout={600}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            My Attendance
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your class attendance and performance
          </Typography>
        </Box>

        {/* Attendance Summary */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <School color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {summary.totalClasses}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Classes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CheckCircle color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {summary.attended}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Attended
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Cancel color="error" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="error.main" fontWeight="bold">
                  {summary.missed}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Missed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp color="info" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  {summary.percentage}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Attendance Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Attendance Rate Progress */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Attendance Progress</Typography>
              <Typography variant="body2" color="text.secondary">
                {summary.percentage}% of {summary.totalClasses} classes
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={summary.percentage}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: theme.palette.grey[200],
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  background: summary.percentage >= 75 
                    ? 'linear-gradient(45deg, #4caf50, #81c784)'
                    : summary.percentage >= 60
                    ? 'linear-gradient(45deg, #ff9800, #ffb74d)'
                    : 'linear-gradient(45deg, #f44336, #ef5350)'
                }
              }}
            />
            <Box mt={2}>
              {summary.percentage >= 75 ? (
                <Alert severity="success">
                  Great job! Your attendance is excellent.
                </Alert>
              ) : summary.percentage >= 60 ? (
                <Alert severity="warning">
                  Your attendance is average. Try to attend more classes.
                </Alert>
              ) : (
                <Alert severity="error">
                  Your attendance is below the minimum requirement. Please attend classes regularly.
                </Alert>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Recent Attendance Records */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Attendance Records
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentRecords.map((record) => (
                    <TableRow key={record.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CalendarToday fontSize="small" color="action" />
                          {record.date}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {record.subject}
                        </Typography>
                      </TableCell>
                      <TableCell>{record.time}</TableCell>
                      <TableCell>{record.duration}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(record.status)}
                          label={record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          color={getStatusColor(record.status)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </Fade>
  );
};

export default UserAttendance;
