import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  useTheme,
  Fade,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  CheckCircle as PersonCheckIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';

const StatCard = ({ stat, index }) => {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);

  const isPositive = stat.change.startsWith('+');
  const changeColor = stat.change === '91%' ? 'success' : 
                     isPositive ? 'success' : 'error';

  return (
    <Fade in={true} timeout={300 + index * 100}>
      <Card
        elevation={2}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        sx={{
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          background: theme.palette.mode === 'light' 
            ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
            : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${stat.gradient}, ${stat.gradientEnd || stat.gradient})`,
          },
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ fontWeight: 500, mb: 1 }}
              >
                {stat.title}
              </Typography>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: 0.5,
                }}
              >
                {stat.value}
              </Typography>
              <Chip
                label={stat.change}
                size="small"
                color={changeColor}
                variant="outlined"
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: 1,
                }}
              />
            </Box>
            <Avatar 
              sx={{ 
                bgcolor: stat.gradient,
                width: 48, 
                height: 48,
                boxShadow: theme.shadows[3],
              }}
            >
              <stat.icon sx={{ fontSize: 24, color: 'white' }} />
            </Avatar>
          </Box>
          
          {/* Progress indicator */}
          <Box mt={2}>
            <LinearProgress 
              variant="determinate" 
              value={stat.progress || 75} 
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: theme.palette.mode === 'light' ? '#f1f5f9' : '#334155',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  background: `linear-gradient(90deg, ${stat.gradient}, ${stat.gradientEnd || stat.gradient})`,
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
};

const QuickActionCard = ({ title, description, icon: Icon, color, onClick }) => {
  const theme = useTheme();
  
  return (
    <Card
      elevation={1}
      sx={{
        p: 2,
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        },
      }}
      onClick={onClick}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <Avatar sx={{ bgcolor: color, width: 40, height: 40 }}>
          <Icon sx={{ fontSize: 20 }} />
        </Avatar>
        <Box>
          <Typography variant="subtitle2" fontWeight={600}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
};

export default function EnhancedDashboardContent() {
  const theme = useTheme();
  const navigate = useNavigate();

  const stats = [
    {
      title: "Total Students",
      value: "156",
      change: "+12%",
      icon: PeopleIcon,
      gradient: theme.palette.primary.main,
      gradientEnd: theme.palette.primary.light,
      progress: 85,
    },
    {
      title: "Present Today",
      value: "142",
      change: "91%",
      icon: PersonCheckIcon,
      gradient: theme.palette.success.main,
      gradientEnd: theme.palette.success.light,
      progress: 91,
    },
    {
      title: "Late Arrivals",
      value: "8",
      change: "-23%",
      icon: ScheduleIcon,
      gradient: theme.palette.warning.main,
      gradientEnd: theme.palette.warning.light,
      progress: 23,
    },
    {
      title: "Average Attendance",
      value: "89%",
      change: "+5%",
      icon: TrendingUpIcon,
      gradient: theme.palette.secondary.main,
      gradientEnd: theme.palette.secondary.light,
      progress: 89,
    }
  ];

  const quickActions = [
    {
      title: "Take Attendance",
      description: "Record student attendance",
      icon: PersonCheckIcon,
      color: theme.palette.primary.main,
      onClick: () => navigate('/dashboard/scan'),
    },
    {
      title: "View Reports",
      description: "Analytics and insights",
      icon: AnalyticsIcon,
      color: theme.palette.secondary.main,
      onClick: () => navigate('/dashboard/analytics'),
    },
    {
      title: "My Courses",
      description: "Access your learning materials",
      icon: PersonCheckIcon,
      color: theme.palette.info.main,
      onClick: () => navigate('/dashboard/my-courses'),
    },
  ];

  return (
    <Box 
      sx={{ 
        width: '100%',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        flex: 1, // Take full available space
      }}
    >
      {/* Header Section */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={2}
        mb={4}
      >
        <Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              color: 'text.primary',
              mb: 0.5,
              fontSize: { xs: '1.75rem', sm: '2.125rem' }
            }}
          >
            Dashboard Overview
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ maxWidth: { sm: 400 } }}
          >
            Welcome back! Here's your attendance overview for today.
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<PersonCheckIcon />}
          size="large"
          onClick={() => navigate('/dashboard/scan')}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.5,
            fontSize: '0.875rem',
            textTransform: 'none',
            boxShadow: theme.shadows[3],
            minWidth: { xs: '100%', sm: 'auto' },
          }}
        >
          Take Attendance
        </Button>
      </Box>

      {/* Stats Cards with Responsive Grid */}
      <Grid container spacing={3} mb={4}>
        {stats.map((stat, index) => (
          <Grid 
            item 
            xs={12} 
            sm={6} 
            md={6}
            lg={3}
            xl={3}
            key={index}
          >
            <StatCard stat={stat} index={index} />
          </Grid>
        ))}
      </Grid>

      {/* Main Content Area with Dynamic Layout */}
      <Grid container spacing={3}>
        {/* Chart Section - Responsive to sidebar state */}
        <Grid item xs={12} lg={8} xl={8}>
          <Card elevation={2} sx={{ height: '400px' }}>
            <Box 
              display="flex" 
              justifyContent="space-between" 
              alignItems="center" 
              p={3} 
              pb={0}
            >
              <Box>
                <Typography variant="h6" fontWeight={600} mb={0.5}>
                  Attendance Trends
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Student attendance over the last 7 days
                </Typography>
              </Box>
              <Tooltip title="More options">
                <IconButton size="small">
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <CardContent>
              <Box 
                display="flex" 
                alignItems="center" 
                justifyContent="center" 
                height={280}
                sx={{ 
                  background: theme.palette.mode === 'light' 
                    ? 'linear-gradient(45deg, #f8fafc 30%, #e2e8f0 90%)'
                    : 'linear-gradient(45deg, #334155 30%, #475569 90%)',
                  borderRadius: 2,
                  border: `1px dashed ${theme.palette.divider}`,
                }}
              >
                <Typography color="text.secondary">
                  Chart component will be rendered here
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} lg={4}>
          <Card elevation={2} sx={{ height: '400px' }}>
            <Box p={3} pb={0}>
              <Typography variant="h6" fontWeight={600} mb={0.5}>
                Quick Actions
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Frequently used actions
              </Typography>
            </Box>
            <CardContent sx={{ pt: 0 }}>
              <Box display="flex" flexDirection="column" gap={2}>
                {quickActions.map((action, index) => (
                  <QuickActionCard key={index} {...action} />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity Section */}
      <Box mt={4}>
        <Card elevation={2}>
          <Box p={3} pb={0}>
            <Typography variant="h6" fontWeight={600} mb={0.5}>
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Latest attendance records and updates
            </Typography>
          </Box>
          <CardContent sx={{ pt: 0 }}>
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="center" 
              height={200}
              sx={{ 
                background: theme.palette.mode === 'light' 
                  ? 'linear-gradient(45deg, #f8fafc 30%, #e2e8f0 90%)'
                  : 'linear-gradient(45deg, #334155 30%, #475569 90%)',
                borderRadius: 2,
                border: `1px dashed ${theme.palette.divider}`,
              }}
            >
              <Typography color="text.secondary">
                Recent activity list will be rendered here
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
