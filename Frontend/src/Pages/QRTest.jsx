import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  Alert,
  Tabs,
  Tab,
  TextField,
  Stack,
  Chip,
  Divider
} from '@mui/material';
import {
  QrCode,
  QrCodeScanner,
  PlayArrow,
  CheckCircle,
  Person,
  Email
} from '@mui/icons-material';
import QRCode from 'qrcode';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`qr-tabpanel-${index}`}
      aria-labelledby={`qr-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const QRTest = () => {
  const [tabValue, setTabValue] = useState(0);
  const [qrData, setQrData] = useState(null);
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'john.doe@test.com',
    studentId: 'STU123456'
  });
  const [attendanceData, setAttendanceData] = useState(null);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Generate simple QR code for testing
  const generateSimpleQR = () => {
    const qrContent = {
      type: 'name_email_token',
      name: formData.name,
      email: formData.email,
      timestamp: new Date().toISOString(),
      id: `qr_${Date.now()}`
    };
    
    setQrData(qrContent);
  };

  // Generate attendance QR code
  const generateAttendanceQR = () => {
    const attendanceQR = {
      type: 'attendance',
      sessionId: `session_${Date.now()}`,
      sessionTitle: 'Test Attendance Session',
      timestamp: new Date().toISOString(),
      validUntil: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      location: 'Test Location',
      id: `attendance_${Date.now()}`
    };
    
    setAttendanceData(attendanceQR);
  };

  // Test QR scan URL
  const testQRScanURL = () => {
    if (!attendanceData) return;
    
    const baseUrl = window.location.origin;
    const qrScanUrl = `${baseUrl}/qr-scan?qr_id=${attendanceData.id}&session=${encodeURIComponent(attendanceData.sessionTitle)}&time=${attendanceData.timestamp}&location=${attendanceData.location}`;
    
    window.open(qrScanUrl, '_blank');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          mb: 4, 
          background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
          color: 'white',
          borderRadius: 3
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
            <QrCode sx={{ fontSize: 48 }} />
            <Typography variant="h3" fontWeight={700}>
              QR Code Test Suite
            </Typography>
            <QrCodeScanner sx={{ fontSize: 48 }} />
          </Box>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Test QR code generation, scanning, and attendance functionality
          </Typography>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="fullWidth"
            sx={{ 
              '& .MuiTab-root': { 
                py: 2,
                fontSize: '1rem',
                fontWeight: 600
              }
            }}
          >
            <Tab 
              icon={<QrCode />} 
              label="Simple QR Generator" 
              iconPosition="start"
            />
            <Tab 
              icon={<QrCodeScanner />} 
              label="Attendance QR Test" 
              iconPosition="start"
            />
            <Tab 
              icon={<CheckCircle />} 
              label="Live Scanner Test" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Tab 1: Simple QR Generator */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Generate Simple QR Code
                  </Typography>
                  
                  <Stack spacing={3}>
                    <TextField
                      label="Full Name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      fullWidth
                      InputProps={{
                        startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />
                      }}
                    />
                    
                    <TextField
                      label="Email Address"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      fullWidth
                      InputProps={{
                        startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />
                      }}
                    />
                    
                    <TextField
                      label="Student ID"
                      value={formData.studentId}
                      onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                      fullWidth
                    />
                    
                    <Button
                      variant="contained"
                      onClick={generateSimpleQR}
                      startIcon={<QrCode />}
                      size="large"
                    >
                      Generate QR Code
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Generated QR Code
                  </Typography>
                  
                  {qrData ? (
                    <Box sx={{ textAlign: 'center' }}>
                      <Paper sx={{ p: 3, mb: 2, bgcolor: 'white', display: 'inline-block' }}>
                        <QRCode 
                          value={JSON.stringify(qrData)}
                          size={200}
                          level="M"
                          includeMargin={true}
                        />
                      </Paper>
                      
                      <Alert severity="success" sx={{ mb: 2 }}>
                        QR Code generated successfully!
                      </Alert>
                      
                      <Paper sx={{ p: 2, bgcolor: 'grey.50', textAlign: 'left' }}>
                        <Typography variant="subtitle2" gutterBottom>QR Code Data:</Typography>
                        <pre style={{ fontSize: '0.75rem', margin: 0 }}>
                          {JSON.stringify(qrData, null, 2)}
                        </pre>
                      </Paper>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 200,
                        border: '2px dashed',
                        borderColor: 'grey.300',
                        borderRadius: 1,
                        color: 'text.secondary',
                      }}
                    >
                      <QrCode sx={{ fontSize: 64, mb: 1 }} />
                      <Typography>Generate a QR code to see it here</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 2: Attendance QR Test */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Generate Attendance QR Code
                  </Typography>
                  
                  <Stack spacing={3}>
                    <Alert severity="info">
                      This generates a QR code that will open the attendance form when scanned.
                    </Alert>
                    
                    <Button
                      variant="contained"
                      onClick={generateAttendanceQR}
                      startIcon={<PlayArrow />}
                      size="large"
                      fullWidth
                    >
                      Generate Attendance QR Code
                    </Button>
                    
                    {attendanceData && (
                      <>
                        <Divider />
                        <Button
                          variant="outlined"
                          onClick={testQRScanURL}
                          startIcon={<QrCodeScanner />}
                          size="large"
                          fullWidth
                        >
                          Test QR Scan URL
                        </Button>
                        
                        <Typography variant="body2" color="text.secondary">
                          This will open the QR attendance form in a new tab
                        </Typography>
                      </>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Attendance QR Code
                  </Typography>
                  
                  {attendanceData ? (
                    <Box sx={{ textAlign: 'center' }}>
                      <Paper sx={{ p: 3, mb: 2, bgcolor: 'white', display: 'inline-block' }}>
                        <QRCode 
                          value={JSON.stringify(attendanceData)}
                          size={200}
                          level="M"
                          includeMargin={true}
                        />
                      </Paper>
                      
                      <Stack spacing={1} sx={{ mb: 2 }}>
                        <Chip label={`Session: ${attendanceData.sessionTitle}`} color="primary" />
                        <Chip label={`Valid for: 10 minutes`} color="success" />
                      </Stack>
                      
                      <Alert severity="success" sx={{ mb: 2 }}>
                        Attendance QR Code generated successfully!
                      </Alert>
                      
                      <Paper sx={{ p: 2, bgcolor: 'grey.50', textAlign: 'left' }}>
                        <Typography variant="subtitle2" gutterBottom>QR Code Data:</Typography>
                        <pre style={{ fontSize: '0.75rem', margin: 0 }}>
                          {JSON.stringify(attendanceData, null, 2)}
                        </pre>
                      </Paper>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 200,
                        border: '2px dashed',
                        borderColor: 'grey.300',
                        borderRadius: 1,
                        color: 'text.secondary',
                      }}
                    >
                      <QrCodeScanner sx={{ fontSize: 64, mb: 1 }} />
                      <Typography>Generate an attendance QR code to see it here</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 3: Live Scanner Test */}
        <TabPanel value={tabValue} index={2}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>📱 Live Scanner Test</Typography>
            <Typography variant="body2">
              Use your mobile device to scan the QR codes generated in the previous tabs.
              The QR attendance form should open automatically.
            </Typography>
          </Alert>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Test URLs
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle2" gutterBottom>QR Attendance Form:</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {window.location.origin}/qr-scan
                      </Typography>
                    </Paper>
                    
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle2" gutterBottom>QR Attendance Page:</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {window.location.origin}/qr-attendance
                      </Typography>
                    </Paper>
                    
                    <Button
                      variant="outlined"
                      onClick={() => window.open('/qr-scan', '_blank')}
                      fullWidth
                    >
                      Open QR Form
                    </Button>
                    
                    <Button
                      variant="outlined"
                      onClick={() => window.open('/qr-attendance', '_blank')}
                      fullWidth
                    >
                      Open QR Attendance Page
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Testing Instructions
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Alert severity="success">
                      <Typography variant="body2">
                        1. Generate QR codes in the previous tabs<br/>
                        2. Use your phone's camera to scan them<br/>
                        3. The attendance form should open automatically<br/>
                        4. Fill in the form and submit
                      </Typography>
                    </Alert>
                    
                    <Divider />
                    
                    <Typography variant="subtitle2">Expected Behavior:</Typography>
                    <Typography variant="body2">
                      • QR codes should scan successfully<br/>
                      • Attendance form should display<br/>
                      • Form should accept user input<br/>
                      • Submission should show success message
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Footer Instructions */}
      <Paper sx={{ mt: 4, p: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          🧪 How to Test:
        </Typography>
        <Stack spacing={1}>
          <Typography variant="body2">
            1. <strong>Generate QR Codes:</strong> Use the first two tabs to create test QR codes
          </Typography>
          <Typography variant="body2">
            2. <strong>Mobile Scan:</strong> Use your phone's camera or QR scanner app
          </Typography>
          <Typography variant="body2">
            3. <strong>Form Testing:</strong> Fill out the attendance form that appears
          </Typography>
          <Typography variant="body2">
            4. <strong>Verify Results:</strong> Check that the form submits successfully
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
};

export default QRTest;
