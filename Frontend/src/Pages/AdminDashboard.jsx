import { useState, useEffect } from "react";
import { Box, Container, Grid, Fade, useTheme, useMediaQuery, Toolbar } from "@mui/material";
import UnifiedNavigation from '../Components/UnifiedNavigation';
import DashboardCard from '../Components/DashboardCard';
import { useThemeMode } from '../context/ThemeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import ProfileMenu from '../Components/ProfileMenu';
import AdminDashboardRoutes from "./AdminDashboardRoutes";
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';

import {
  Dashboard as DashboardIcon,
  Group as GroupIcon,
  ListAlt as ListAltIcon,
  Assessment as ReportsIcon,
  Assessment,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  People as PeopleIcon,
  EventNote as EventNoteIcon,
  TrendingUp,
  School,
  SupervisorAccount,
  Security,
  Videocam,
  QrCode,
  PersonAdd as PersonAddIcon,
  Insights,
  Hub as UnifiedIcon,
  TrackChanges as JoinTrackingIcon,
  VisibilityOff as HiddenComponentsIcon
} from '@mui/icons-material';

const ADMIN_NAVIGATION = [
  { kind: "header", title: "Admin Dashboard" },
  { segment: "dashboard", title: "Overview", icon: <DashboardIcon /> },
  { kind: "header", title: "User Management" },
  { segment: "users", title: "Users", icon: <GroupIcon /> },
  { segment: "roles", title: "Roles & Permissions", icon: <SettingsIcon /> },
  { kind: "header", title: "Student Management" },
  { segment: "view-students", title: "View Students", icon: <GroupIcon /> },
  { segment: "add-students", title: "Add Students", icon: <PersonAddIcon /> },
  { segment: "manage-students", title: "Complete Management", icon: <School /> },
  { kind: "header", title: "Analytics & Reports" },
  { segment: "analytics", title: "Unified Analytics", icon: <UnifiedIcon /> },
  { segment: "attendance", title: "Attendance Logs", icon: <ListAltIcon /> },
  { segment: "attendance-trends", title: "Attendance Trends", icon: <TrendingUp /> },
  { segment: "reports", title: "Reports", icon: <ReportsIcon /> },
  { kind: "header", title: "Meeting Management" },
  { segment: "meeting-management", title: "Meeting Management", icon: <Assessment /> },
  { segment: "zoom-integration", title: "Zoom Meetings", icon: <Videocam /> },
  { segment: "qr-generator", title: "QR Code Generator", icon: <QrCode /> },
  { kind: "header", title: "Enhanced Tracking" },
  { segment: "enhanced-admin-attendance", title: "Meeting Participants", icon: <PeopleIcon /> },
  { segment: "meeting-participants", title: "📊 Live Participants Table", icon: <EventNoteIcon /> },
  { segment: "join-tracking", title: "Join Tracking Data", icon: <JoinTrackingIcon /> },
  { kind: "header", title: "System Management" },
  { segment: "hidden-components", title: "🔍 Hidden Components", icon: <HiddenComponentsIcon /> },
  { segment: "security", title: "Security Settings", icon: <Security /> },
  { segment: "admin-tools", title: "Admin Tools", icon: <SupervisorAccount /> },
];

function AdminDashboard(props) {
  const { window } = props;
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { mode, toggleMode } = useThemeMode();

  // Admin notifications - system-level alerts
  const [notifications] = useState([
    {
      id: 1,
      title: "System backup completed",
      time: "10 minutes ago",
      read: false,
    },
    {
      id: 2,
      title: "5 new user registrations pending approval",
      time: "30 minutes ago",
      read: false,
    },
    {
      id: 3,
      title: "Monthly system report ready",
      time: "2 hours ago",
      read: true,
    },
    {
      id: 4,
      title: "Security scan completed - No issues",
      time: "1 day ago",
      read: true,
    },
  ]);

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
        navigate('/dashboard'); // Redirect to general dashboard if not admin
      });
      return;
    }

    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, [navigate]);

  // Search handler (similar to MainDashboard)
  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (value.trim() !== "") {
      const found = ADMIN_NAVIGATION.find(
        (item) =>
          item.title && item.title.toLowerCase().includes(value.toLowerCase()) ||
          item.segment && item.segment.toLowerCase().includes(value.toLowerCase())
      );
      if (found && found.segment) {
        // Stay within the admin dashboard context
        navigate(`/admin-dashboard/${found.segment}`);
      }
    }
  };

  const handleNotificationClick = (notification) => {
    console.log('Admin Notification clicked:', notification);
    // Handle notification click - mark as read, navigate, etc.
  };

  // Handle sidebar toggle from UnifiedNavigation
  const handleSidebarToggle = (isOpen, isMobileView) => {
    setSidebarOpen(isOpen && !isMobileView); // Only track sidebar state for desktop
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
        <Fade in={isLoading} unmountOnExit>
          <Box>
            <img src="https://mui.com/static/logo.png" alt="Loading..." width={80} style={{ opacity: 0.7 }} />
          </Box>
        </Fade>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh', 
      overflow: 'hidden',
      bgcolor: 'background.default',
      width: '100vw',
      position: 'relative'
    }}>
      <UnifiedNavigation 
        navigation={ADMIN_NAVIGATION}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        mode={mode}
        onToggleMode={toggleMode}
        ProfileMenu={ProfileMenu}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onSidebarToggle={handleSidebarToggle}
        routePrefix="/admin-dashboard"
      />
      <Box 
        component="main" 
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          position: 'relative',
          ml: 0,
          width: '100%',
          minWidth: 0,
          transition: theme.transitions.create([]),
          alignItems: 'stretch',
          boxSizing: 'border-box',
        }}
      >
        {/* Fixed AppBar Spacer */}
        <Box 
          sx={{ 
            height: 64,
            flexShrink: 0,
            width: '100%'
          }} 
        />
        {/* Dynamic Content Container */}
        <Box sx={{ 
          flexGrow: 1,
          overflow: 'auto',
          height: 'calc(100vh - 64px)',
          position: 'relative',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          width: '100%',
          transition: theme.transitions.create(['padding']),
          pt: 0, 
        }}>
          <Box
            sx={{
              width: '100%',
              maxWidth: '100%',
              px: {
                xs: 1,
                sm: 2,
                md: 3,
                lg: 3,
                xl: 3,
              },
              py: {
                xs: 2,
                sm: 3,
                md: 4,
                lg: 4,
                xl: 5,
              },
              mx: 0,
              minHeight: 'calc(100vh - 64px - 32px)',
              display: 'flex',
              flexDirection: 'column',
              transition: theme.transitions.create(
                ['padding'], 
                {
                  easing: theme.transitions.easing.easeInOut,
                  duration: theme.transitions.duration.standard,
                }
              ),
              position: 'relative',
              mt: 0,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'transparent',
                transition: theme.transitions.create(['background'], {
                  easing: theme.transitions.easing.easeInOut,
                  duration: theme.transitions.duration.shorter,
                }),
                zIndex: -1,
              },
            }}
          >
            <AdminDashboardRoutes />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default AdminDashboard; 