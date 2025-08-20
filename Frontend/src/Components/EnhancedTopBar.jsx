import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  TextField,
  InputAdornment,
  Badge,
  Avatar,
  Typography,
  useMediaQuery,
  Chip,
  Tooltip,
  Fade,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  LightMode,
  DarkMode,
  Search as SearchIcon,
  WifiOff,
  Wifi,
  SignalWifi4Bar,
  SignalWifiOff,
} from '@mui/icons-material';
import { NotificationBell } from '../context/NotificationSystem';
import { useConnectionStatus } from '../hooks/useRealTimeNotifications';

export default function EnhancedTopBar({
  searchTerm,
  onSearchChange,
  mode,
  onToggleMode,
  ProfileMenu,
}) {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const connectionStatus = useConnectionStatus();
  const [showConnectionAlert, setShowConnectionAlert] = useState(false);

  // Show connection status alerts
  useEffect(() => {
    if (connectionStatus.isInitialized && !connectionStatus.isOnline) {
      setShowConnectionAlert(true);
      const timer = setTimeout(() => setShowConnectionAlert(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowConnectionAlert(false);
    }
  }, [connectionStatus.isOnline, connectionStatus.isInitialized]);

  // Connection status indicator
  const getConnectionIcon = () => {
    if (!connectionStatus.isInitialized) {
      return <SignalWifiOff color="disabled" />;
    }
    
    if (connectionStatus.isOnline) {
      return <Wifi color="success" />;
    } else if (connectionStatus.reconnectAttempts > 0) {
      return <SignalWifi4Bar color="warning" />;
    } else {
      return <WifiOff color="error" />;
    }
  };

  const getConnectionStatus = () => {
    if (!connectionStatus.isInitialized) {
      return { text: 'Initializing...', color: 'default' };
    }
    
    if (connectionStatus.isOnline) {
      return { text: 'Connected', color: 'success' };
    } else if (connectionStatus.reconnectAttempts > 0) {
      return { text: `Reconnecting... (${connectionStatus.reconnectAttempts})`, color: 'warning' };
    } else {
      return { text: 'Offline', color: 'error' };
    }
  };

  const statusInfo = getConnectionStatus();

  return (
    <AppBar
      position="fixed"
      elevation={0}
      color="inherit"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: theme.palette.mode === 'light' 
          ? 'rgba(255, 255, 255, 0.9)' 
          : 'rgba(30, 41, 59, 0.9)',
        backdropFilter: 'blur(12px) saturate(180%)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.palette.mode === 'light'
          ? '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)'
          : '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.4)',
      }}
    >
      <Toolbar sx={{ minHeight: 64, display: 'flex', justifyContent: 'space-between', px: { xs: 1, sm: 2, md: 3 } }}>
        {/* Left: App Title or Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            alt="App Logo"
            sx={{ 
              width: 36, 
              height: 36, 
              mr: 1, 
              bgcolor: 'primary.main',
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`
            }}
          >
            📚
          </Avatar>
          {!isSmDown && (
            <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ letterSpacing: 1 }}>
              EduTrack
            </Typography>
          )}
          
          {/* Connection Status Indicator */}
          <Tooltip title={`Real-time notifications: ${statusInfo.text}`}>
            <Chip
              icon={getConnectionIcon()}
              label={isSmDown ? '' : statusInfo.text}
              size="small"
              color={statusInfo.color}
              variant="outlined"
              sx={{
                ml: 1,
                fontSize: '0.7rem',
                height: 24,
                '& .MuiChip-icon': {
                  fontSize: 16,
                },
              }}
            />
          </Tooltip>
        </Box>

        {/* Center: Responsive Search Bar */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', mx: { xs: 1, sm: 2 } }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search dashboard..."
            value={searchTerm}
            onChange={onSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                backgroundColor: (theme) => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
                '& fieldset': { border: 'none' },
              },
            }}
            sx={{
              width: { xs: 120, sm: 200, md: 320 },
              transition: 'width 0.3s',
            }}
            inputProps={{ 'aria-label': 'Search dashboard' }}
          />
        </Box>

        {/* Right: Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          {/* Theme Toggle */}
          <IconButton 
            onClick={onToggleMode} 
            color="inherit" 
            aria-label="toggle light/dark mode"
            sx={{
              transition: 'background 0.2s',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
              '&:active': {
                backgroundColor: 'action.selected',
              },
              '&:focus-visible': {
                outline: '2px solid',
                outlineColor: 'primary.main',
              },
            }}
          >
            {mode === 'light' ? <DarkMode /> : <LightMode />}
          </IconButton>

          {/* Real-time Notifications */}
          <NotificationBell />

          {/* Profile Menu (with Avatar) */}
          {ProfileMenu ? (
            <ProfileMenu>
              <Avatar sx={{ width: 36, height: 36, ml: 1 }} />
            </ProfileMenu>
          ) : (
            <Avatar sx={{ width: 36, height: 36, ml: 1 }} />
          )}
        </Box>
      </Toolbar>

      {/* Connection Alert Banner */}
      <Fade in={showConnectionAlert}>
        <Box
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            bgcolor: 'error.main',
            color: 'error.contrastText',
            py: 1,
            px: 2,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <WifiOff fontSize="small" />
          <Typography variant="body2">
            Real-time notifications are offline. Some features may be limited.
          </Typography>
        </Box>
      </Fade>
    </AppBar>
  );
}
