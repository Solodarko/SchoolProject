import {
  Users,
  Calendar,
  BarChart3,
  UserCheck,
  Clock,
  Settings,
  BookOpen,
  PieChart,
  FileText,
  QrCode
} from "lucide-react";

import { useState } from "react";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Box,
  Toolbar,
} from "@mui/material";

const drawerWidth = 260;

const menuItems = [
  { title: "Dashboard", icon: <BarChart3 />, id: "dashboard" },
  { title: "Take Attendance", icon: <UserCheck />, id: "attendance" },
  { title: "QR Scanner", icon: <QrCode />, id: "scan" },
  { title: "Students", icon: <Users />, id: "students" },
  { title: "Classes", icon: <BookOpen />, id: "classes" },
  { title: "Schedule", icon: <Calendar />, id: "schedule" },
  { title: "Reports", icon: <FileText />, id: "reports" },
  { title: "Analytics", icon: <PieChart />, id: "analytics" },
];

const secondaryItems = [
  { title: "Settings", icon: <Settings />, id: "settings" },
];

export default function AppSidebar() {
  const [activeItem, setActiveItem] = useState("dashboard");

  const renderMenuItems = (items) =>
    items.map((item) => {
      const isScanItem = item.id === 'scan';
      const isActive = activeItem === item.id;
      
      return (
        <ListItemButton
          key={item.id}
          onClick={() => setActiveItem(item.id)}
          sx={{
            mb: 1,
            borderRadius: 2,
            px: 2.5,
            py: 1.5,
            position: 'relative',
            // Special styling for scan item
            ...(isScanItem && {
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(52, 211, 153, 0.15) 100%)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.2)",
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -1,
                left: -1,
                right: -1,
                bottom: -1,
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.6), rgba(52, 211, 153, 0.4))',
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
            // Normal styling
            background: isScanItem
              ? undefined
              : (isActive
                  ? "linear-gradient(to right, #3b82f6, #6366f1)"
                  : "transparent"),
            color: isActive ? "#fff" : (isScanItem ? "#065f46" : "text.primary"),
            "&:hover": {
              backgroundColor: isScanItem
                ? "rgba(16, 185, 129, 0.2)"
                : (isActive ? undefined : "action.hover"),
              ...(isScanItem && {
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
              }),
            },
          }}
        >
          <ListItemIcon 
            sx={{ 
              color: isScanItem
                ? "#059669"
                : (isActive ? "#fff" : "text.secondary"),
              minWidth: 32,
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
              fontWeight: isScanItem ? 700 : 500,
              fontSize: "0.95rem",
              color: isScanItem ? "#065f46" : "inherit",
            }}
          />
        </ListItemButton>
      );
    });

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          borderRight: "1px solid #cbd5e1",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(8px)",
        },
      }}
    >
      <Toolbar>
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            width={40}
            height={40}
            borderRadius={2}
            sx={{
              background: "linear-gradient(to bottom right, #3b82f6, #6366f1)",
            }}
          >
            <Clock style={{ color: "#fff" }} />
          </Box>
          <Box>
            <Typography fontWeight={700} fontSize="1rem" color="text.primary">
              AttendanceHub
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Student Management
            </Typography>
          </Box>
        </Box>
      </Toolbar>

      <Divider sx={{ my: 2 }} />

      <Box px={2}>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          fontWeight={500}
          mb={1}
        >
          Main Menu
        </Typography>
        <List disablePadding>{renderMenuItems(menuItems)}</List>

        <Divider sx={{ my: 3 }} />

        <Typography
          variant="subtitle2"
          color="text.secondary"
          fontWeight={500}
          mb={1}
        >
          System
        </Typography>
        <List disablePadding>{renderMenuItems(secondaryItems)}</List>
      </Box>
    </Drawer>
  );
}
