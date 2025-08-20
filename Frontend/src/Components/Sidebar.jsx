import React, { useState, useEffect } from 'react';
import { 
  Drawer, 
  List, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Box, 
  IconButton,
  Typography,
  Divider,
  Avatar,
  Tooltip,
  useTheme,
  Collapse
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  School as SchoolIcon,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';

const drawerWidth = 280;

export default function Sidebar({ navigation }) {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [open, setOpen] = useState(() => {
    const stored = localStorage.getItem('sidebarOpen');
    return stored === null ? true : stored === 'true';
  });
  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    localStorage.setItem('sidebarOpen', open);
  }, [open]);

  const handleDrawerToggle = () => setOpen((prev) => !prev);
  
  const handleExpandClick = (itemTitle) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemTitle]: !prev[itemTitle]
    }));
  };

  return (
    <>
      {/* Toggle button (show only on md and up, position fixed) */}
      <IconButton
        onClick={handleDrawerToggle}
        sx={{
          position: 'fixed',
          top: 16,
          left: open ? drawerWidth + 16 : 16,
          zIndex: (theme) => theme.zIndex.drawer + 2,
          display: { xs: 'none', md: 'inline-flex' },
          backgroundColor: 'background.paper',
          boxShadow: 1,
          transition: 'left 0.3s',
        }}
        aria-label={open ? 'Close sidebar' : 'Open sidebar'}
        size="large"
      >
        {open ? <ChevronLeftIcon /> : <MenuIcon />}
      </IconButton>
      <Drawer
        variant="persistent"
        open={open}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden',
          },
          display: { xs: 'none', md: 'block' },
        }}
      >
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
        
        <Box sx={{ overflow: 'auto', flexGrow: 1, py: 2 }}>
          <List>
            {navigation.map((item, idx) => (
              item.segment ? (
                <ListItemButton
                  key={item.segment}
                  selected={location.pathname.includes(item.segment)}
                  onClick={() => navigate(`/dashboard/${item.segment}`)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    mx: 1,
                    color: 'text.primary',
                    '&.Mui-selected': {
                      background: 'rgba(25, 118, 210, 0.08)',
                      color: 'primary.main',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.title} />
                </ListItemButton>
              ) : item.kind === 'header' ? (
                <Box key={item.title} sx={{ px: 2, py: 1, fontWeight: 700, color: 'text.secondary', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' }}>
                  {item.title}
                </Box>
              ) : null
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
} 