import React from 'react';
import {
  Box,
  Typography,
  Alert,
  Paper,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  QrCode,
  Home,
  AdminPanelSettings
} from '@mui/icons-material';
import AdminQRGenerator from '../Components/QRCode/AdminQRGenerator';

const QRCodeGenerator = () => {
  // Backend URL
  const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
  
  const showNotificationMessage = (message, severity = 'info') => {
    // You can integrate with your notification system here
    console.log(`${severity.toUpperCase()}: ${message}`);
  };

  return (
    <Box sx={{ p: 3, maxWidth: '100%', mx: 'auto' }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link 
          underline="hover" 
          color="inherit" 
          href="/admin-dashboard"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <Home fontSize="inherit" />
          Admin Dashboard
        </Link>
        <Typography 
          color="text.primary" 
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <QrCode fontSize="inherit" />
          QR Code Generator
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            mb: 2, 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <QrCode sx={{ fontSize: 40, color: 'primary.main' }} />
          QR Code Generator
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Generate secure, time-based QR codes for attendance tracking. Codes automatically rotate every 5 minutes for enhanced security.
        </Typography>
      </Box>

      {/* Information Alert */}
      <Alert 
        severity="info" 
        sx={{ mb: 4 }}
        icon={<AdminPanelSettings />}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
          🎯 Real-Time QR Code Generator for Attendance Tracking
        </Typography>
        <Typography variant="body2">
          • Generate time-based QR codes that change every 5 minutes<br />
          • Integrated with your existing geolocation and geofencing system<br />
          • Secure attendance tracking with automatic code rotation<br />
          • Download QR codes as images or copy data to clipboard<br />
          • View history of all generated codes with timestamps
        </Typography>
      </Alert>

      {/* QR Generator Component */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <AdminQRGenerator
          backendUrl={backendUrl}
          showNotifications={true}
          onNotification={showNotificationMessage}
        />
      </Paper>

      {/* Additional Information */}
      <Box sx={{ mt: 4 }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Security Features:</strong> Each QR code includes a unique timestamp, 
            checksum validation, and expires automatically after 5 minutes to prevent unauthorized access.
          </Typography>
        </Alert>
        
        <Alert severity="warning">
          <Typography variant="body2">
            <strong>Integration Note:</strong> Students can scan these QR codes using the mobile app 
            or user dashboard, and their location will be verified against the configured geofencing boundaries.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default QRCodeGenerator;
