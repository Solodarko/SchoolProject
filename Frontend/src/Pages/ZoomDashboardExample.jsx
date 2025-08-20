import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Alert,
  Divider
} from '@mui/material';
import {
  AdminPanelSettings,
  Person,
  SmartDisplay,
  SwapHoriz
} from '@mui/icons-material';

import AdminZoomDashboard from '../Components/Admin/AdminZoomDashboard';
import UserZoomDashboard from '../Components/User/UserZoomDashboard';

const ZoomDashboardExample = () => {
  const [currentView, setCurrentView] = useState('user'); // 'admin' or 'user'

  // Mock user data - replace with actual user from your auth system
  const mockUser = {
    id: 'user_123',
    name: 'John Smith',
    email: 'john.smith@university.edu',
    studentId: 'STU2024001',
    department: 'Computer Science',
    role: 'student'
  };

  const mockAdmin = {
    id: 'admin_123',
    name: 'Dr. Jane Doe',
    email: 'jane.doe@university.edu',
    role: 'admin',
    department: 'Computer Science'
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with View Switcher */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SmartDisplay color="primary" />
                Zoom Meeting System
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {currentView === 'admin' ? 'Admin Dashboard' : 'Student Dashboard'}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Switch View:
              </Typography>
              <ButtonGroup variant="outlined" size="small">
                <Button
                  startIcon={<Person />}
                  variant={currentView === 'user' ? 'contained' : 'outlined'}
                  onClick={() => setCurrentView('user')}
                >
                  Student View
                </Button>
                <Button
                  startIcon={<AdminPanelSettings />}
                  variant={currentView === 'admin' ? 'contained' : 'outlined'}
                  onClick={() => setCurrentView('admin')}
                >
                  Admin View
                </Button>
              </ButtonGroup>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Information Cards */}
      {currentView === 'admin' ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Admin Dashboard:</strong> Create and manage Zoom meetings, monitor participants in real-time, 
          track attendance automatically. When users click "Join Meeting", their details will be tracked live 
          on this dashboard.
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Student Dashboard:</strong> View available meetings and join with one click. 
          Your attendance will be automatically tracked when you join through these links.
        </Alert>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Render appropriate dashboard */}
      {currentView === 'admin' ? (
        <AdminZoomDashboard currentUser={mockAdmin} />
      ) : (
        <UserZoomDashboard currentUser={mockUser} />
      )}

      {/* Footer with Instructions */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            How the System Works:
          </Typography>
          <Typography component="div" variant="body2">
            <ol>
              <li><strong>Admin creates meetings:</strong> Use the Admin Dashboard to create new Zoom meetings with custom settings.</li>
              <li><strong>Users see join links:</strong> Students see available meetings in their dashboard with clear "Join" buttons.</li>
              <li><strong>Real-time tracking:</strong> When users click join, their details (name, ID, join time, duration) are tracked live on the Admin Dashboard.</li>
              <li><strong>Automatic attendance:</strong> The system automatically identifies students and tracks their participation duration.</li>
              <li><strong>Live updates:</strong> Admin can see participants joining/leaving in real-time with WebSocket connections.</li>
            </ol>
          </Typography>
          
          <Alert severity="success" sx={{ mt: 2 }}>
            <strong>Integration Ready:</strong> Both dashboards are fully functional and can be integrated 
            into your existing authentication and routing system. The components accept user props and 
            connect to your backend API automatically.
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ZoomDashboardExample;
