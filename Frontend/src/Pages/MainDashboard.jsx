import { useState, useEffect } from "react";
import { Box, Container, Grid, Fade, useTheme, useMediaQuery } from "@mui/material";
import UnifiedNavigation from '../Components/UnifiedNavigation';
import DashboardCard from '../Components/DashboardCard';
import { useThemeMode } from '../context/ThemeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import ProfileMenu from '../Components/ProfileMenu';
import DashboardRoutes from "./DashboardRoutes";

import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  QrCodeScanner as QrCodeScannerIcon,
  EventNote,
  School,
  LibraryBooks,
  LiveTv,
  Assessment,
  Science as TestIcon,
} from '@mui/icons-material';
import Videocam from '@mui/icons-material/Videocam'; // ✅ Correct

// USER NAVIGATION - Limited features for normal users
const USER_NAVIGATION = [
  { kind: "header", title: "Dashboard" },
  { segment: "dashboards", title: "My Dashboard", icon: <DashboardIcon /> },
  { kind: "header", title: "Attendance" },
  { segment: "ZoomIntegration", title: "Zoom Meetings", icon: <Videocam /> },
  { segment: "scan", title: "QR Scanner", icon: <QrCodeScannerIcon /> },
  { segment: "qr-attendance", title: "QR Attendance", icon: <QrCodeScannerIcon /> },
  { segment: "qr-token-test", title: "🔬 QR Token Test", icon: <TestIcon /> },
  { segment: "my-attendance", title: "My Attendance", icon: <EventNote /> },
  { kind: "header", title: "Learning" },
  { segment: "my-courses", title: "My Courses", icon: <School /> },
  { segment: "my-reports", title: "My Reports", icon: <LibraryBooks /> },
];

function MainDashboard(props) {
  const { window } = props;
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { mode, toggleMode } = useThemeMode();

  // User notifications - focused on personal updates
  const [notifications] = useState([
    {
      id: 1,
      title: "Your attendance updated",
      time: "5 minutes ago",
      read: false,
    },
    {
      id: 2,
      title: "New course material available",
      time: "2 hours ago",
      read: true,
    },
    {
      id: 3,
      title: "Assignment deadline reminder",
      time: "1 day ago",
      read: false,
    },
  ]);

  // Search handler
  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (value.trim() !== "") {
      const found = USER_NAVIGATION.find(
        (item) =>
          item.title && item.title.toLowerCase().includes(value.toLowerCase()) ||
          item.segment && item.segment.toLowerCase().includes(value.toLowerCase())
      );
      if (found && found.segment) {
        navigate(`/dashboard/${found.segment}`);
      }
    }
  };

  const handleNotificationClick = (notification) => {
    console.log('Notification clicked:', notification);
    // Handle notification click - mark as read, navigate, etc.
  };

  // Handle sidebar toggle from UnifiedNavigation
  const handleSidebarToggle = (isOpen, isMobileView) => {
    setSidebarOpen(isOpen && !isMobileView); // Only track sidebar state for desktop
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

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
        navigation={USER_NAVIGATION}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        mode={mode}
        onToggleMode={toggleMode}
        ProfileMenu={ProfileMenu}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onSidebarToggle={handleSidebarToggle}
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
            <DashboardRoutes />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default MainDashboard;
