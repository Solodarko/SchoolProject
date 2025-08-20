import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
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
  ListItemText as MenuListItemText,
  ListItemIcon as MenuListItemIcon,
  Divider,
  useTheme,
  Collapse,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  LightMode,
  DarkMode,
  School as SchoolIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

const drawerWidth = 280;

export default function UnifiedNavigation({
  navigation,
  searchTerm,
  onSearchChange,
  mode,
  onToggleMode,
  ProfileMenu,
  notifications = [],
  onNotificationClick,
  onSidebarToggle, // New prop to notify parent of sidebar state
  routePrefix = '/dashboard', // New prop to specify route prefix (admin vs user)
}) {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const stored = localStorage.getItem('sidebarOpen');
    if (stored === null) {
      return !isMobile; // Default: open on desktop, closed on mobile
    } else {
      return stored === 'true';
    }
  });
  const [expandedItems, setExpandedItems] = useState({});
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);

  useEffect(() => {
    localStorage.setItem('sidebarOpen', sidebarOpen);
    // Notify parent component of sidebar state change
    if (onSidebarToggle) {
      onSidebarToggle(sidebarOpen, isMobile);
    }
  }, [sidebarOpen, onSidebarToggle, isMobile]);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const handleDrawerToggle = () => setSidebarOpen((prev) => !prev);
  
  const handleExpandClick = (itemTitle) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemTitle]: !prev[itemTitle]
    }));
  };

  const handleNotifIconClick = (event) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleNotifMenuClose = () => {
    setNotifAnchorEl(null);
  };

  const handleNotifItemClick = (notif) => {
    if (onNotificationClick) onNotificationClick(notif);
    handleNotifMenuClose();
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const notifMenuOpen = Boolean(notifAnchorEl);

  const renderNavigationItems = () => (
    <List sx={{ px: 1, overflowY: 'auto' }}>
      {navigation.map((item, idx) => {
        const isScanItem = item.segment === 'scan';
        const isSelected = location.pathname.includes(item.segment);
        
        return item.segment ? (
          <ListItemButton
            key={item.segment}
            selected={isSelected}
            onClick={() => {
              navigate(`${routePrefix}/${item.segment}`);
              if (isMobile) setSidebarOpen(false);
            }}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              mx: 1,
              position: 'relative',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              // Force visibility and ensure flex layout on all screens
              display: { xs: 'flex', md: 'flex' },
              // Special styling for Scan item
              ...(isScanItem && {
                background: theme.palette.mode === 'light'
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(52, 211, 153, 0.12) 100%)'
                  : 'linear-gradient(135deg, rgba(52, 211, 153, 0.12) 0%, rgba(167, 243, 208, 0.08) 100%)',
                border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(52, 211, 153, 0.3)'}`,
                boxShadow: theme.palette.mode === 'light'
                  ? '0 2px 8px rgba(16, 185, 129, 0.15)'
                  : '0 2px 8px rgba(52, 211, 153, 0.25)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -1,
                  left: -1,
                  right: -1,
                  bottom: -1,
                  background: theme.palette.mode === 'light'
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.6), rgba(52, 211, 153, 0.4))'
                    : 'linear-gradient(135deg, rgba(52, 211, 153, 0.8), rgba(167, 243, 208, 0.6))',
                  borderRadius: 8,
                  opacity: 0,
                  animation: 'scanGlow 2s ease-in-out infinite alternate',
                  zIndex: -1,
                },
                '&::after': {
                  content: '"✨"',
                  position: 'absolute',
                  top: 4,
                  right: 8,
                  fontSize: '0.75rem',
                  opacity: 0.8,
                  animation: 'sparkle 1.5s ease-in-out infinite',
                },
              }),
              '&:hover': {
                transform: 'translateX(4px)',
                backgroundColor: isScanItem
                  ? (theme.palette.mode === 'light' 
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(52, 211, 153, 0.2)')
                  : (theme.palette.mode === 'light' 
                      ? 'rgba(37, 99, 235, 0.06)' 
                      : 'rgba(59, 130, 246, 0.08)'),
                ...(isScanItem && {
                  boxShadow: theme.palette.mode === 'light'
                    ? '0 4px 12px rgba(16, 185, 129, 0.25)'
                    : '0 4px 12px rgba(52, 211, 153, 0.35)',
                }),
              },
              '&.Mui-selected': {
                backgroundColor: isScanItem
                  ? (theme.palette.mode === 'light' 
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(52, 211, 153, 0.25)')
                  : (theme.palette.mode === 'light' 
                      ? 'rgba(37, 99, 235, 0.08)' 
                      : 'rgba(59, 130, 246, 0.12)'),
                borderLeft: `3px solid ${isScanItem 
                  ? (theme.palette.mode === 'light' ? '#10b981' : '#34d399') 
                  : theme.palette.primary.main}`,
                '&:hover': {
                  backgroundColor: isScanItem
                    ? (theme.palette.mode === 'light' 
                        ? 'rgba(16, 185, 129, 0.25)'
                        : 'rgba(52, 211, 153, 0.3)')
                    : (theme.palette.mode === 'light' 
                        ? 'rgba(37, 99, 235, 0.12)' 
                        : 'rgba(59, 130, 246, 0.16)'),
                },
              },
            }}
          >
            <ListItemIcon 
              sx={{
                // Ensure proper flex display for icon and prevent shrinking
                display: 'flex',
                flexShrink: 0,
                // FORCE VISIBILITY: Set explicit color and zIndex for debugging
                color: isScanItem ? (theme.palette.mode === 'light' ? '#000000 !important' : '#FFFFFF !important') : (isSelected ? 'primary.main' : 'text.secondary'),
                zIndex: isScanItem ? 9999 : 'auto',
                minWidth: 40,
                transition: 'all 0.2s',
                ...(isScanItem && {
                  filter: 'drop-shadow(0 1px 2px rgba(16, 185, 129, 0.3))',
                }),
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.title}
              primaryTypographyProps={{
                // Ensure proper flex display for text and allow it to grow
                display: 'flex',
                flexGrow: 1,
                // FORCE VISIBILITY: Set explicit color and zIndex for debugging
                color: isScanItem ? (theme.palette.mode === 'light' ? '#000000 !important' : '#FFFFFF !important') : 'inherit',
                zIndex: isScanItem ? 9999 : 'auto',
                fontWeight: isScanItem ? 700 : (isSelected ? 600 : 500),
                fontSize: '0.875rem',
              }}
            />
          </ListItemButton>
        ) : item.kind === 'header' ? (
          <Box 
            key={item.title} 
            sx={{ 
              px: 3, 
              py: 2, 
              mt: idx > 0 ? 2 : 1,
            }}
          >
            <Typography 
              variant="overline" 
              sx={{ 
                fontWeight: 700, 
                color: 'text.secondary',
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
              }}
            >
              {item.title}
            </Typography>
          </Box>
        ) : null;
      })}
    </List>
  );

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Brand Header */}
      <Box 
        sx={{ 
          p: 3, 
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: theme.palette.mode === 'light' 
            ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
            : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar 
            sx={{ 
              bgcolor: theme.palette.primary.main,
              width: 40,
              height: 40,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`
            }}
          >
            <SchoolIcon sx={{ fontSize: 24 }} />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700} color="text.primary">
              EduTrack
            </Typography>
            <Typography variant="caption" color="text.secondary">
              School Management
            </Typography>
          </Box>
        </Box>
      </Box>
      
      {/* Navigation Items */}
      <Box sx={{ overflow: 'visible', flexGrow: 1, py: 1 }}>
        {renderNavigationItems()}
      </Box>
    </Box>
  );

  return (
    <>
      {/* Top AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        color="inherit"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: theme.palette.mode === 'light' 
            ? 'rgba(255, 255, 255, 0.9)' 
            : 'rgba(30, 41, 59, 0.9)',
          backdropFilter: 'blur(12px) saturate(180%)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.palette.mode === 'light'
            ? '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)'
            : '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.4)',
          ml: {
            xs: 0, // Mobile: no margin
            md: sidebarOpen ? `${drawerWidth}px` : 0 // Desktop: adjust for sidebar
          },
          width: {
            xs: '100%', // Mobile: full width
            md: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%' // Desktop: adjust for sidebar
          },
          transition: theme.transitions.create(['margin-left', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar sx={{ minHeight: 64, display: 'flex', justifyContent: 'space-between', px: { xs: 1, sm: 2, md: 3 } }}>
          {/* Left: Menu Button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}>
              <IconButton
                onClick={handleDrawerToggle}
                edge="start"
                color="inherit"
                aria-label="toggle sidebar"
                sx={{
                  backgroundColor: !sidebarOpen ? 'primary.main' : 'transparent',
                  color: !sidebarOpen ? 'primary.contrastText' : 'inherit',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    backgroundColor: !sidebarOpen ? 'primary.dark' : 'action.hover',
                    transform: 'scale(1.1)',
                    boxShadow: !sidebarOpen ? theme.shadows[4] : 'none',
                  },
                  ...(!sidebarOpen && {
                    boxShadow: theme.shadows[2],
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: -2,
                      left: -2,
                      right: -2,
                      bottom: -2,
                      borderRadius: '50%',
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                      opacity: 0.3,
                      zIndex: -1,
                      animation: 'pulse 2s infinite',
                    },
                  }),
                }}
              >
                {sidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
              </IconButton>
            </Tooltip>
            
            {/* Desktop Title when sidebar is collapsed */}
            {!isMobile && !sidebarOpen && (
              <Typography 
                variant="h6" 
                fontWeight={700} 
                color="text.primary"
                sx={{
                  animation: 'slideIn 0.3s ease-out',
                  '@keyframes slideIn': {
                    from: { opacity: 0, transform: 'translateX(-20px)' },
                    to: { opacity: 1, transform: 'translateX(0)' },
                  },
                }}
              >
                EduTrack
              </Typography>
            )}
            
            {/* Mobile Title */}
            {isMobile && (
              <Typography variant="h6" fontWeight={700} color="text.primary">
                EduTrack
              </Typography>
            )}
          </Box>

          {/* Center: Search Bar */}
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
                  backgroundColor: theme.palette.mode === 'light' 
                    ? 'rgba(0,0,0,0.04)' 
                    : 'rgba(255,255,255,0.08)',
                  '& fieldset': { border: 'none' },
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:focus-within': {
                    backgroundColor: theme.palette.mode === 'light' 
                      ? 'rgba(0,0,0,0.06)' 
                      : 'rgba(255,255,255,0.12)',
                    transform: 'scale(1.02)',
                  },
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
            <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
              <IconButton 
                onClick={onToggleMode} 
                color="inherit" 
                aria-label="toggle light/dark mode"
                sx={{
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    transform: 'scale(1.1)',
                  },
                }}
              >
                {mode === 'light' ? <DarkMode /> : <LightMode />}
              </IconButton>
            </Tooltip>
            
            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton
                color="inherit"
                aria-label="notifications"
                onClick={handleNotifIconClick}
                sx={{ 
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <Badge badgeContent={unreadCount} color="error" overlap="circular">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            {/* Notifications Menu */}
            <Menu
              anchorEl={notifAnchorEl}
              open={notifMenuOpen}
              onClose={handleNotifMenuClose}
              PaperProps={{
                sx: { 
                  minWidth: 280, 
                  maxWidth: 360,
                  mt: 1,
                  borderRadius: 2,
                  boxShadow: theme.shadows[8],
                },
              }}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              {notifications.length === 0 ? (
                <MenuItem disabled>
                  <MenuListItemIcon>
                    <NotificationsNoneIcon color="disabled" />
                  </MenuListItemIcon>
                  <MenuListItemText primary="No notifications" />
                </MenuItem>
              ) : (
                notifications.map((notif, idx) => (
                  <MenuItem
                    key={notif.id || idx}
                    onClick={() => handleNotifItemClick(notif)}
                    sx={{
                      bgcolor: !notif.read ? 'action.selected' : undefined,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <MenuListItemText
                      primary={notif.title}
                      secondary={notif.time || ''}
                      primaryTypographyProps={{ fontWeight: !notif.read ? 600 : 400 }}
                    />
                  </MenuItem>
                ))
              )}
            </Menu>
            
            {/* Profile Menu */}
            {ProfileMenu ? (
              <ProfileMenu>
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    ml: 1,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: theme.shadows[4],
                    },
                  }} 
                />
              </ProfileMenu>
            ) : (
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36, 
                  ml: 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: theme.shadows[4],
                  },
                }} 
              />
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={sidebarOpen}
        onClose={isMobile ? handleDrawerToggle : undefined}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.palette.mode === 'light'
              ? '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)'
              : '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.4)',
          },
          // Ensure drawer is visible on desktop, but controlled by 'open' prop
          display: { xs: 'block', md: 'block' },
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        {sidebarContent}
      </Drawer>
    </>
  );
}
