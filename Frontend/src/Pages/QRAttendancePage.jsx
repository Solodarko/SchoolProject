import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Paper,
  Divider,
  Alert,
  Container
} from '@mui/material';
import {
  QrCodeScanner as QrCodeIcon,
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import QRCodeScanner from '../Components/QR/QRCodeScanner';
import QRAttendanceDashboard from '../Components/QR/QRAttendanceDashboard';

const QRAttendancePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('scanner');

  const handleScanSuccess = (qrData) => {
    console.log('QR Code scanned:', qrData);
    
    // If it's a valid attendance QR code, redirect to the form
    if (qrData && typeof qrData === 'object' && qrData.type === 'attendance') {
      const encodedData = encodeURIComponent(JSON.stringify(qrData));
      navigate(`/qr-scan?data=${encodedData}`);
    } else if (typeof qrData === 'string' && qrData.includes('attendance')) {
      // Handle QR codes that contain attendance URLs
      const url = new URL(qrData);
      const dataParam = url.searchParams.get('data');
      if (dataParam) {
        navigate(`/qr-scan?data=${dataParam}`);
      }
    }
  };

  const handleScanError = (error) => {
    console.warn('QR Scan error:', error);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <QrCodeIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h3" component="h1" fontWeight="bold">
            QR Attendance System
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Scan QR codes to register attendance or view attendance records
        </Typography>
      </Box>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Stack direction="row" spacing={0}>
          <Button
            variant={activeTab === 'scanner' ? 'contained' : 'text'}
            startIcon={<QrCodeIcon />}
            onClick={() => setActiveTab('scanner')}
            sx={{ 
              borderRadius: 0, 
              py: 2, 
              px: 3,
              flexGrow: 1,
              borderRight: 1,
              borderColor: 'divider'
            }}
          >
            QR Scanner
          </Button>
          <Button
            variant={activeTab === 'dashboard' ? 'contained' : 'text'}
            startIcon={<DashboardIcon />}
            onClick={() => setActiveTab('dashboard')}
            sx={{ 
              borderRadius: 0, 
              py: 2, 
              px: 3,
              flexGrow: 1
            }}
          >
            Dashboard
          </Button>
        </Stack>
      </Paper>

      {/* Content */}
      {activeTab === 'scanner' && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Instructions:</strong> Point your camera at a valid QR attendance code. 
              The scanner will automatically detect and process the code.
            </Typography>
          </Alert>

          <QRCodeScanner
            onScanSuccess={handleScanSuccess}
            onScanError={handleScanError}
            autoStart={true}
          />

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Alternative Options
              </Typography>
              <Stack spacing={2}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/qr-scan')}
                  startIcon={<QrCodeIcon />}
                >
                  Manual Entry Form
                </Button>
                <Typography variant="body2" color="text.secondary">
                  If you have trouble scanning, you can also manually enter attendance 
                  information using the form above.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 'dashboard' && (
        <QRAttendanceDashboard />
      )}
    </Container>
  );
};

export default QRAttendancePage;
