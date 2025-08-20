import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Avatar,
  IconButton,
  Divider,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Badge,
  Tooltip,
  Stack,
  useTheme,
  alpha,
  CardHeader,
  CardActions
} from '@mui/material';
import {
  Group as GroupIcon,
  Analytics as AnalyticsIcon,
  EventNote as EventIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  PersonAdd as PersonAddIcon,
  Settings as SettingsIcon,
  NotificationsActive as NotificationsActiveIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  ErrorOutline as ErrorOutlineIcon,
  PeopleOutline as PeopleOutlineIcon,
  BarChart as BarChartIcon,
  AddTask as AddTaskIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';
import DashboardCard from '../Components/DashboardCard';

const AdminDashboardOverview = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalUsers: { value: 1250, trend: 12 },
    totalMeetings: { value: 145, trend: 8 },
    activeUsers: { value: 987, trend: -3 },
    pendingApprovals: { value: 12, trend: 5 },
    systemHealth: 98.2,
    recentActivity: [
      { id: 1, type: 'user_registered', subject: 'John Doe', timestamp: '2024-08-14T02:53:45Z' },
      { id: 2, type: 'meeting_completed', subject: 'Project Kickoff', timestamp: '2024-08-14T02:40:45Z' },
      { id: 3, type: 'report_generated', subject: 'Monthly Attendance', timestamp: '2024-08-14T01:55:45Z' },
      { id: 4, type: 'issue_flagged', subject: 'API Latency', timestamp: '2024-08-13T23:30:00Z' },
    ],
    tasks: [
      { id: 1, title: 'Review new user registrations', completed: false },
      { id: 2, title: 'Generate weekly performance report', completed: true },
      { id: 3, title: 'Investigate server performance drop', completed: false },
    ]
  });
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    // Check if user is admin
    const userRole = Cookies.get('userRole');
    if (userRole !== 'admin') {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'You do not have permission to access this page.',
        confirmButtonText: 'OK'
      }).then(() => {
        navigate('/dashboard');
      });
      return;
    }

    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      // Simulate API call - replace with actual API endpoint
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again later.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, flexGrow: 1, overflow: 'auto' }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 'bold' }}>
        Admin Overview
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Total Users" value={stats.totalUsers.value} icon={<PeopleOutlineIcon />} trend={stats.totalUsers.trend} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Total Meetings" value={stats.totalMeetings.value} icon={<EventIcon />} trend={stats.totalMeetings.trend} color="secondary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Active Users (24h)" value={stats.activeUsers.value} icon={<TrendingUpIcon />} trend={stats.activeUsers.trend} color="success" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Pending Approvals" value={stats.pendingApprovals.value} icon={<NotificationsActiveIcon />} trend={stats.pendingApprovals.trend} color="warning" />
        </Grid>
      </Grid>

      {/* System Health */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardHeader title="System Health" />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3" color="success.main" sx={{ mr: 2 }}>
                  {stats.systemHealth}%
                </Typography>
                <Chip 
                  label={stats.systemHealth > 95 ? "Healthy" : stats.systemHealth > 80 ? "Warning" : "Critical"} 
                  color={stats.systemHealth > 95 ? "success" : stats.systemHealth > 80 ? "warning" : "error"} 
                  size="medium"
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.systemHealth} 
                color={stats.systemHealth > 95 ? "success" : stats.systemHealth > 80 ? "warning" : "error"}
                sx={{ height: 12, borderRadius: 6, mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                All systems operating normally. Last check: {new Date().toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Recent Activity */}
        <Grid item xs={12} lg={7}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardHeader title="Recent System Activity" />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <List dense>
                {stats.recentActivity.map((activity, index) => {
                  const Icon = {
                    user_registered: PeopleOutlineIcon,
                    meeting_completed: CheckCircleOutlineIcon,
                    report_generated: BarChartIcon,
                    issue_flagged: ErrorOutlineIcon,
                  }[activity.type];

                  const timeAgo = (date) => {
                    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
                    let interval = seconds / 31536000;
                    if (interval > 1) return Math.floor(interval) + " years ago";
                    interval = seconds / 2592000;
                    if (interval > 1) return Math.floor(interval) + " months ago";
                    interval = seconds / 86400;
                    if (interval > 1) return Math.floor(interval) + " days ago";
                    interval = seconds / 3600;
                    if (interval > 1) return Math.floor(interval) + " hours ago";
                    interval = seconds / 60;
                    if (interval > 1) return Math.floor(interval) + " minutes ago";
                    return Math.floor(seconds) + " seconds ago";
                  }

                  return (
                    <ListItem key={activity.id} divider={index < stats.recentActivity.length - 1}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                          <Icon sx={{ color: 'primary.main' }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={`${activity.type.replace('_', ' ')}: ${activity.subject}`}
                        secondary={timeAgo(activity.timestamp)}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Admin To-Do List & Quick Actions */}
        <Grid item xs={12} lg={5}>
          <Stack spacing={4}>
            {/* Quick Actions */}
            <Card elevation={3}>
              <CardHeader title="Quick Actions" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button fullWidth variant="outlined" startIcon={<PersonAddIcon />} onClick={() => navigate('/admin-dashboard/add-students')}>
                      Add Student
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button fullWidth variant="outlined" startIcon={<GroupIcon />} onClick={() => navigate('/admin-dashboard/users')}>
                      Manage Users
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button fullWidth variant="outlined" startIcon={<BarChartIcon />} onClick={() => navigate('/admin-dashboard/analytics')}>
                      View Analytics
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button fullWidth variant="outlined" startIcon={<SettingsIcon />} onClick={() => navigate('/admin-dashboard/security')}>
                      Settings
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Admin To-Do List */}
            <Card elevation={3}>
              <CardHeader title="Admin To-Do List" />
              <CardContent>
                <List dense>
                  {stats.tasks.map(task => (
                    <ListItem 
                      key={task.id} 
                      sx={{ textDecoration: task.completed ? 'line-through' : 'none', opacity: task.completed ? 0.6 : 1 }}
                    >
                      <ListItemIcon>
                        {task.completed ? <CheckCircleOutlineIcon color="success" /> : <AddTaskIcon />}
                      </ListItemIcon>
                      <ListItemText primary={task.title} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              <CardActions>
                <Button size="small" sx={{ ml: 'auto' }}>View All Tasks</Button>
              </CardActions>
            </Card>

          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboardOverview; 