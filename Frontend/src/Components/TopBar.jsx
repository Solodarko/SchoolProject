import  { useState } from 'react';
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
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  LightMode,
  DarkMode,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
} from '@mui/icons-material';
import { NotificationBell } from '../context/NotificationSystem';

export default function TopBar({
  searchTerm,
  onSearchChange,
  mode,
  onToggleMode,
  ProfileMenu,
}) {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));

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
          {/* Notifications */}
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
    </AppBar>
  );
} 