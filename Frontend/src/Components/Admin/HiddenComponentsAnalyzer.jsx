import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Button,
  Paper,
  Stack,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore,
  Visibility,
  VisibilityOff,
  BugReport,
  Analytics,
  Dashboard,
  Security,
  Notifications,
  Api,
  Code,
  Assessment,
  Timeline,
  Person,
  Settings,
  Warning,
  CheckCircle,
  Add,
  Info
} from '@mui/icons-material';

const HiddenComponentsAnalyzer = () => {
  const [expanded, setExpanded] = useState('visible');

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  // Current visible components
  const visibleComponents = [
    { name: 'AdminDashboardOverview', description: 'Admin overview page', route: '/dashboard' },
    { name: 'UserManagement', description: 'User management', route: '/users' },
    { name: 'AttendanceLogs', description: 'Attendance logs', route: '/attendance' },
    { name: 'EnhancedStudentManagement', description: 'Student management', route: '/manage-students' },
    { name: 'ViewStudents', description: 'View students', route: '/view-students' },
    { name: 'AddStudents', description: 'Add students', route: '/add-students' },
    { name: 'AttendanceTrends', description: 'Attendance trends', route: '/attendance-trends' },
    { name: 'UnifiedReports', description: 'Reports', route: '/reports' },
    { name: 'EnhancedZoomDashboard', description: 'Zoom meetings', route: '/zoom-integration' },
    { name: 'MeetingAnalytics', description: 'Meeting analytics', route: '/meeting-analytics' },
    { name: 'MeetingManagement', description: 'Meeting management', route: '/meeting-management' },
    { name: 'QRCodeGenerator', description: 'QR code generator', route: '/qr-generator' },
    { name: 'EnhancedAttendanceTrackerDashboard', description: 'Enhanced tracker', route: '/enhanced-attendance-tracker' },
    { name: 'AdminMeetingTablePage', description: 'Meeting participants', route: '/meeting-participants' },
    { name: 'AdminTools', description: 'Admin tools', route: '/admin-tools' },
    { name: 'UnifiedAdminAnalytics', description: 'Unified analytics', route: '/analytics' },
    { name: 'JoinTrackingDashboard', description: 'Join tracking', route: '/join-tracking' },
    { name: 'ZoomAttendanceDurationTracker', description: '85% duration tracker', route: '/attendance-tracker' },
    { name: 'AttendanceDataDebugger', description: 'Attendance debugger', route: '/debug-attendance' }
  ];

  // Hidden components that could be valuable
  const hiddenComponents = {
    'Admin Analysis & Debugging': [
      { name: 'AdminMeetingTable.jsx', description: 'Raw meeting table component', value: 'Medium' },
      { name: 'AdminMeetingTableExample.jsx', description: 'Example implementation', value: 'Low' },
      { name: 'AdminZoomDashboard.jsx', description: 'Alternative Zoom dashboard', value: 'Medium' },
      { name: 'AttendanceTrackerDashboard.jsx', description: 'Old attendance tracker (replaced)', value: 'Low' }
    ],
    'Reporting & Analytics': [
      { name: 'AdvancedReporting.jsx', description: 'Advanced reporting features', value: 'High' },
      { name: 'AttendanceAnalytics.jsx', description: 'Detailed attendance analytics', value: 'High' },
      { name: 'AttendanceReports.jsx', description: 'Attendance report generation', value: 'High' },
      { name: 'EnhancedReports.jsx', description: 'Enhanced reporting system', value: 'High' },
      { name: 'RealTimeAttendanceMonitor.jsx', description: 'Real-time attendance monitoring', value: 'High' }
    ],
    'Debug & Development Tools': [
      { name: 'ApiTestPage.jsx', description: 'API testing interface', value: 'High' },
      { name: 'BackendDebug.jsx', description: 'Backend debugging', value: 'High' },
      { name: 'SocketDebugger.jsx', description: 'Socket debugging', value: 'Medium' },
      { name: 'JWTTokenDebugger.jsx', description: 'JWT token debugging', value: 'Medium' },
      { name: 'NotificationDemo.jsx', description: 'Notification testing', value: 'Low' }
    ],
    'Notification Components': [
      { name: 'NotificationHistory.jsx', description: 'Notification history', value: 'High' },
      { name: 'NotificationService.jsx', description: 'Notification service UI', value: 'Medium' },
      { name: 'RealTimeNotificationInit.jsx', description: 'Real-time notification init', value: 'Low' }
    ],
    'Feature Components': [
      { name: 'AttendanceChart.jsx', description: 'Attendance charts', value: 'Medium' },
      { name: 'ParticipantCard.jsx', description: 'Participant cards', value: 'Medium' },
      { name: 'QuickActions.jsx', description: 'Quick action buttons', value: 'Medium' },
      { name: 'RecentSessions.jsx', description: 'Recent sessions view', value: 'Medium' }
    ]
  };

  const getValueColor = (value) => {
    switch (value) {
      case 'High': return 'success';
      case 'Medium': return 'warning';
      case 'Low': return 'error';
      default: return 'default';
    }
  };

  const getValueIcon = (value) => {
    switch (value) {
      case 'High': return <CheckCircle />;
      case 'Medium': return <Warning />;
      case 'Low': return <Info />;
      default: return <Info />;
    }
  };

  const totalComponents = visibleComponents.length + Object.values(hiddenComponents).flat().length;
  const utilizationRate = Math.round((visibleComponents.length / totalComponents) * 100);

  const highValueComponents = Object.values(hiddenComponents)
    .flat()
    .filter(comp => comp.value === 'High');

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom display="flex" alignItems="center" gap={2}>
        <VisibilityOff color="primary" />
        Hidden Components Analyzer
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Analysis of components that exist in the codebase but are not accessible in the admin dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <Visibility color="success" />
                <Box>
                  <Typography variant="h6">{visibleComponents.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Visible Components
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <VisibilityOff color="error" />
                <Box>
                  <Typography variant="h6">{Object.values(hiddenComponents).flat().length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hidden Components
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <Analytics color="primary" />
                <Box>
                  <Typography variant="h6">{utilizationRate}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Utilization Rate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircle color="success" />
                <Box>
                  <Typography variant="h6">{highValueComponents.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    High Value Hidden
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Utilization Progress */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Component Utilization</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LinearProgress
              variant="determinate"
              value={utilizationRate}
              sx={{ flexGrow: 1, height: 10, borderRadius: 5 }}
              color={utilizationRate > 70 ? 'success' : utilizationRate > 40 ? 'warning' : 'error'}
            />
            <Typography variant="body2" fontWeight="bold">
              {utilizationRate}%
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {visibleComponents.length} of {totalComponents} components are currently accessible in the admin dashboard
          </Typography>
        </CardContent>
      </Card>

      {/* High Priority Recommendations */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>💡 Quick Wins</Typography>
        <Typography variant="body2">
          Consider adding these {highValueComponents.length} high-value components to significantly enhance admin functionality:
          {highValueComponents.slice(0, 3).map(comp => ` ${comp.name.replace('.jsx', '')}`).join(', ')}
          {highValueComponents.length > 3 && ` and ${highValueComponents.length - 3} more...`}
        </Typography>
      </Alert>

      {/* Visible Components */}
      <Accordion expanded={expanded === 'visible'} onChange={handleChange('visible')}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" display="flex" alignItems="center" gap={1}>
            <Visibility color="success" />
            Currently Visible Components ({visibleComponents.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {visibleComponents.map((component, index) => (
              <ListItem key={index} divider>
                <ListItemIcon>
                  <Dashboard color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={component.name}
                  secondary={
                    <Box>
                      <Typography variant="body2">{component.description}</Typography>
                      <Chip label={component.route} size="small" variant="outlined" sx={{ mt: 0.5 }} />
                    </Box>
                  }
                />
                <Chip label="Accessible" color="success" size="small" />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Hidden Components by Category */}
      {Object.entries(hiddenComponents).map(([category, components]) => (
        <Accordion key={category} expanded={expanded === category} onChange={handleChange(category)}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6" display="flex" alignItems="center" gap={1}>
              <VisibilityOff color="error" />
              {category} ({components.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {components.map((component, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    {getValueIcon(component.value)}
                  </ListItemIcon>
                  <ListItemText
                    primary={component.name}
                    secondary={component.description}
                  />
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip 
                      label={`${component.value} Value`} 
                      color={getValueColor(component.value)} 
                      size="small" 
                    />
                    <Chip label="Hidden" color="error" variant="outlined" size="small" />
                    <Tooltip title="Add to Admin Dashboard">
                      <IconButton size="small" color="primary">
                        <Add />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Implementation Guide */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
            <Code color="primary" />
            How to Add Hidden Components
          </Typography>
          <Stack spacing={2}>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>Step 1: Import Component</Typography>
              <Typography variant="body2" fontFamily="monospace" sx={{ bgcolor: 'background.paper', p: 1, borderRadius: 1 }}>
                {`// In AdminDashboardRoutes.jsx\nimport AdvancedReporting from '../Components/AdvancedReporting';`}
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>Step 2: Add Route</Typography>
              <Typography variant="body2" fontFamily="monospace" sx={{ bgcolor: 'background.paper', p: 1, borderRadius: 1 }}>
                {`<Route path="/advanced-reports" element={<AdvancedReporting />} />`}
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>Step 3: Add Navigation Item</Typography>
              <Typography variant="body2" fontFamily="monospace" sx={{ bgcolor: 'background.paper', p: 1, borderRadius: 1 }}>
                {`// In AdminDashboard.jsx ADMIN_NAVIGATION array\n{ segment: "advanced-reports", title: "Advanced Reports", icon: <AnalyticsIcon /> }`}
              </Typography>
            </Paper>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default HiddenComponentsAnalyzer;
