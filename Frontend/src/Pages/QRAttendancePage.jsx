import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Paper,
  Fade,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  QrCode2 as QrCodeGeneratorIcon,
  QrCodeScanner as QrCodeScannerIcon,
  TableView as DashboardIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import QRCodeGenerator from '../Components/QR/QRCodeGenerator';
import QRCodeScanner from '../Components/QR/QRCodeScanner';
import QRAttendanceDashboard from '../Components/QR/QRAttendanceDashboard';

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`qr-tabpanel-${index}`}
      aria-labelledby={`qr-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Fade in={value === index} timeout={300}>
          <Box>{children}</Box>
        </Fade>
      )}
    </div>
  );
};

const QRAttendancePage = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleScanSuccess = (qrData) => {
    console.log('QR Code scanned successfully:', qrData);
    // Handle successful scan - could navigate to registration form or show data
  };

  const handleScanError = (error) => {
    console.error('QR scan error:', error);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
          }}
        >
          QR Code Attendance System
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
          Generate QR codes for events, scan them for attendance tracking, and view comprehensive attendance reports
        </Typography>
      </Box>

      {/* Information Banner */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <AlertTitle>How It Works</AlertTitle>
        <Typography variant="body2">
          1. <strong>Generate:</strong> Create QR codes for your events or sessions
          • 2. <strong>Scan:</strong> Attendees scan QR codes to register their attendance
          • 3. <strong>Track:</strong> View real-time attendance data and export reports
        </Typography>
      </Alert>

      {/* Main Content with Tabs */}
      <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="QR attendance tabs"
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: 72,
                fontSize: '1rem',
                fontWeight: 'medium',
              },
            }}
          >
            <Tab
              icon={<QrCodeGeneratorIcon />}
              label="Generate QR Code"
              iconPosition="start"
              sx={{ gap: 1 }}
            />
            <Tab
              icon={<QrCodeScannerIcon />}
              label="Scan QR Code"
              iconPosition="start"
              sx={{ gap: 1 }}
            />
            <Tab
              icon={<DashboardIcon />}
              label="View Dashboard"
              iconPosition="start"
              sx={{ gap: 1 }}
            />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <Box sx={{ minHeight: 600 }}>
          {/* QR Code Generator Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: 2 }}>
              <QRCodeGenerator />
            </Box>
          </TabPanel>

          {/* QR Code Scanner Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 2 }}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <AlertTitle>Camera Permission Required</AlertTitle>
                    This feature requires camera access to scan QR codes. Please allow camera permissions when prompted.
                  </Alert>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Use this scanner to test QR codes or scan attendance codes. For actual attendance registration,
                    users should scan the QR code with their mobile device which will take them to the registration form.
                  </Typography>
                </CardContent>
              </Card>
              <QRCodeScanner 
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
                autoStart={false}
              />
            </Box>
          </TabPanel>

          {/* Dashboard Tab */}
          <TabPanel value={tabValue} index={2}>
            <QRAttendanceDashboard />
          </TabPanel>
        </Box>
      </Paper>

      {/* Feature Overview */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom textAlign="center" sx={{ mb: 4 }}>
          System Features
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <QrCodeGeneratorIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                QR Code Generation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create customizable QR codes for events with validity periods, 
                advanced options, and multiple export formats.
              </Typography>
            </CardContent>
          </Card>

          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <QrCodeScannerIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Easy Registration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Users scan QR codes and fill a simple form to register attendance
                with automatic duplicate detection and validation.
              </Typography>
            </CardContent>
          </Card>

          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <DashboardIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Comprehensive Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View real-time attendance data, export reports, track statistics,
                and manage multiple sessions from one place.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Technical Info */}
      <Box sx={{ mt: 6 }}>
        <Card elevation={0} sx={{ bgcolor: 'grey.50' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <InfoIcon color="primary" />
              <Box>
                <Typography variant="h6" gutterBottom>
                  Technical Information
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  • QR codes contain encrypted session data and are validated server-side<br />
                  • All attendance data is stored securely with timestamps and device information<br />
                  • Supports CSV export for integration with external systems<br />
                  • Real-time statistics and duplicate detection prevent fraudulent entries<br />
                  • Mobile-responsive registration forms work on all devices
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default QRAttendancePage;
