import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Paper,
  Grid,
  Divider,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  QrCode2 as QrCodeGeneratorIcon,
  QrCodeScanner as QrCodeScannerIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Security as SecurityIcon,
  AccessTime as TimeIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import QRCode from 'react-qr-code';
import { Html5Qrcode, Html5QrcodeScanType } from 'html5-qrcode';
import { format, addMinutes } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const QRTokenExtractionTest = () => {
  const { getUserIdentity, isAuthenticated, user, student } = useAuth();
  
  // QR Generation State
  const [generatedQR, setGeneratedQR] = useState(null);
  const [generatedQRString, setGeneratedQRString] = useState('');
  
  // QR Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  
  // UI State
  const [showRawData, setShowRawData] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [notifications, setNotifications] = useState([]);
  
  const html5QrCodeRef = useRef(null);

  // Generate QR code with user token data
  const generateTestQR = () => {
    const timestamp = Date.now();
    const qrId = `token_test_${timestamp}`;
    const userIdentity = getUserIdentity();
    
    const qrData = {
      id: qrId,
      type: 'token_extraction_test',
      timestamp: timestamp,
      expiresAt: addMinutes(new Date(timestamp), 30).toISOString(), // 30 minutes validity
      checksum: btoa(`${qrId}_${timestamp}`),
      location: 'token_test_page',
      
      // USER TOKEN DATA - This is what we want to extract
      userToken: {
        userId: userIdentity?.userId || 'test_user_123',
        username: userIdentity?.username || 'testuser',
        email: userIdentity?.email || 'test@example.com',
        fullName: userIdentity?.fullName || 'Test User',
        firstName: userIdentity?.firstName || 'Test',
        lastName: userIdentity?.lastName || 'User',
        role: userIdentity?.role || 'student',
        studentId: userIdentity?.studentId || 'STU001',
        department: userIdentity?.department || 'Computer Science',
        hasStudentRecord: userIdentity?.hasStudentRecord || true,
        
        // Additional token data
        tokenType: 'attendance_access',
        permissions: ['scan_qr', 'submit_attendance'],
        sessionData: {
          loginTime: new Date().toISOString(),
          deviceInfo: navigator.userAgent,
          browserInfo: {
            platform: navigator.platform,
            language: navigator.language,
          }
        }
      },
      
      // Metadata
      generatedBy: 'token_extraction_test',
      purpose: 'demonstrate_token_extraction'
    };
    
    setGeneratedQR(qrData);
    setGeneratedQRString(JSON.stringify(qrData, null, 2));
    
    addNotification('QR Code with user token generated successfully!', 'success');
  };

  // Start QR scanning
  const startQRScanning = async () => {
    try {
      setIsScanning(true);
      
      html5QrCodeRef.current = new Html5Qrcode('token-qr-reader');
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      };

      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        config,
        handleScanSuccess,
        handleScanError
      );
      
      addNotification('QR Scanner started - point camera at QR code', 'info');
    } catch (error) {
      console.error('Error starting scanner:', error);
      setIsScanning(false);
      addNotification('Failed to start camera scanner', 'error');
    }
  };

  // Stop QR scanning
  const stopQRScanning = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      }
      setIsScanning(false);
      addNotification('QR Scanner stopped', 'info');
    } catch (error) {
      console.error('Error stopping scanner:', error);
      setIsScanning(false);
    }
  };

  // Handle successful QR scan
  const handleScanSuccess = (decodedText) => {
    console.log('🎯 QR Code Scanned:', decodedText);
    setScanResult(decodedText);
    
    try {
      // Parse QR data
      const qrData = JSON.parse(decodedText);
      
      // Extract token data
      const extractedTokenData = {
        rawData: decodedText,
        parsedData: qrData,
        tokenData: qrData.userToken || null,
        extractedAt: new Date().toISOString(),
        scanSuccess: true,
        
        // Extracted user information
        userInfo: qrData.userToken ? {
          name: qrData.userToken.fullName || `${qrData.userToken.firstName} ${qrData.userToken.lastName}`,
          email: qrData.userToken.email,
          username: qrData.userToken.username,
          userId: qrData.userToken.userId,
          studentId: qrData.userToken.studentId,
          department: qrData.userToken.department,
          role: qrData.userToken.role,
        } : null
      };
      
      setExtractedData(extractedTokenData);
      
      // Add to scan history
      setScanHistory(prev => [extractedTokenData, ...prev.slice(0, 4)]); // Keep last 5 scans
      
      addNotification('✅ Token data extracted successfully!', 'success');
      
      // Auto-stop scanning after successful scan
      stopQRScanning();
      
    } catch (parseError) {
      console.error('❌ Error parsing QR data:', parseError);
      
      const failedExtraction = {
        rawData: decodedText,
        parsedData: null,
        tokenData: null,
        extractedAt: new Date().toISOString(),
        scanSuccess: false,
        error: parseError.message
      };
      
      setExtractedData(failedExtraction);
      addNotification('❌ Failed to extract token data - invalid QR format', 'error');
    }
  };

  // Handle scan error
  const handleScanError = (error) => {
    // Don't show errors for no QR code found (too noisy)
    if (error.includes('No MultiFormat Readers')) return;
    console.warn('QR scan error:', error);
  };

  // Add notification
  const addNotification = (message, severity) => {
    const notification = {
      id: Date.now(),
      message,
      severity,
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    addNotification('Copied to clipboard!', 'success');
  };

  // Toggle accordion section
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          🔍 QR Token Extraction Test
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Test QR code generation with user tokens and extraction of name, email, and profile data
        </Typography>
        
        {/* User Status */}
        {isAuthenticated ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Authenticated User:</strong> {user?.username} 
              {student && ` (${student.fullName} - ${student.studentId})`}
            </Typography>
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Not Authenticated:</strong> Using demo token data
            </Typography>
          </Alert>
        )}
      </Box>

      {/* Notifications */}
      {notifications.length > 0 && (
        <Stack spacing={1} sx={{ mb: 3 }}>
          {notifications.slice(0, 2).map((notification) => (
            <Alert key={notification.id} severity={notification.severity} size="small">
              {notification.message}
            </Alert>
          ))}
        </Stack>
      )}

      <Grid container spacing={3}>
        {/* QR Generation Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <QrCodeGeneratorIcon color="primary" />
                1. Generate QR with User Token
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Generate a QR code containing user token data including name, email, and profile information.
              </Typography>
              
              <Button 
                variant="contained" 
                onClick={generateTestQR}
                fullWidth
                sx={{ mb: 2 }}
              >
                Generate Test QR Code
              </Button>
              
              {generatedQR && (
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, display: 'inline-block', mb: 2 }}>
                    <QRCode
                      value={JSON.stringify(generatedQR)}
                      size={180}
                      level="M"
                      includeMargin={true}
                    />
                  </Box>
                  
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>
                    QR ID: {generatedQR.id}
                  </Typography>
                  
                  {/* Generated Token Summary */}
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom>Token Data Summary:</Typography>
                    <Stack spacing={1}>
                      <Chip 
                        icon={<PersonIcon />} 
                        label={`Name: ${generatedQR.userToken?.fullName}`} 
                        size="small" 
                        variant="outlined"
                      />
                      <Chip 
                        icon={<EmailIcon />} 
                        label={`Email: ${generatedQR.userToken?.email}`} 
                        size="small" 
                        variant="outlined"
                      />
                      <Chip 
                        icon={<BadgeIcon />} 
                        label={`Student ID: ${generatedQR.userToken?.studentId}`} 
                        size="small" 
                        variant="outlined"
                      />
                    </Stack>
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* QR Scanning Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <QrCodeScannerIcon color="primary" />
                2. Scan QR to Extract Token
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Use camera to scan the generated QR code and extract user token data.
              </Typography>
              
              <Stack spacing={2}>
                <Button 
                  variant={isScanning ? "outlined" : "contained"} 
                  color={isScanning ? "error" : "primary"}
                  onClick={isScanning ? stopQRScanning : startQRScanning}
                  fullWidth
                >
                  {isScanning ? 'Stop Scanner' : 'Start Camera Scanner'}
                </Button>
                
                {/* Camera View */}
                <Box 
                  id="token-qr-reader" 
                  sx={{ 
                    width: '100%', 
                    minHeight: isScanning ? 200 : 0,
                    border: isScanning ? '2px solid' : 'none',
                    borderColor: 'primary.main',
                    borderRadius: 2,
                    overflow: 'hidden'
                  }} 
                />
                
                {isScanning && (
                  <Alert severity="info" size="small">
                    <Typography variant="body2">
                      📱 Point your camera at the QR code above to extract token data
                    </Typography>
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Extraction Results Section */}
      {extractedData && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {extractedData.scanSuccess ? <SuccessIcon color="success" /> : <ErrorIcon color="error" />}
              3. Extracted Token Data Results
            </Typography>
            
            {extractedData.scanSuccess ? (
              <Box>
                {/* Extracted User Information */}
                {extractedData.userInfo && (
                  <Paper sx={{ p: 3, mb: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon />
                      ✅ Successfully Extracted User Information
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="subtitle2">👤 Full Name:</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {extractedData.userInfo.name}
                            </Typography>
                          </Box>
                          
                          <Box>
                            <Typography variant="subtitle2">📧 Email:</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {extractedData.userInfo.email}
                            </Typography>
                          </Box>
                          
                          <Box>
                            <Typography variant="subtitle2">👤 Username:</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {extractedData.userInfo.username}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="subtitle2">🎓 Student ID:</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {extractedData.userInfo.studentId}
                            </Typography>
                          </Box>
                          
                          <Box>
                            <Typography variant="subtitle2">🏢 Department:</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {extractedData.userInfo.department}
                            </Typography>
                          </Box>
                          
                          <Box>
                            <Typography variant="subtitle2">🔐 Role:</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {extractedData.userInfo.role}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Paper>
                )}
                
                {/* Detailed Data Accordions */}
                <Stack spacing={2}>
                  {/* Token Data */}
                  <Accordion expanded={expandedSections.tokenData} onChange={() => toggleSection('tokenData')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SecurityIcon />
                        Complete Token Data
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell><strong>Property</strong></TableCell>
                              <TableCell><strong>Value</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {extractedData.tokenData && Object.entries(extractedData.tokenData).map(([key, value]) => (
                              <TableRow key={key}>
                                <TableCell>{key}</TableCell>
                                <TableCell>
                                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                  
                  {/* Raw QR Data */}
                  <Accordion expanded={expandedSections.rawData} onChange={() => toggleSection('rawData')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ViewIcon />
                        Raw QR Data
                        <Tooltip title="Copy to clipboard">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(extractedData.rawData);
                            }}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                        <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          {JSON.stringify(extractedData.parsedData, null, 2)}
                        </Typography>
                      </Paper>
                    </AccordionDetails>
                  </Accordion>
                </Stack>
              </Box>
            ) : (
              <Alert severity="error">
                <Typography variant="body2">
                  <strong>Failed to extract token data:</strong> {extractedData.error}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Raw data:</strong> {extractedData.rawData}
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Scan History */}
      {scanHistory.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📜 Recent Scan History
            </Typography>
            
            <Stack spacing={2}>
              {scanHistory.map((scan, index) => (
                <Paper key={scan.extractedAt} sx={{ p: 2, bgcolor: scan.scanSuccess ? 'success.light' : 'error.light' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {scan.scanSuccess ? '✅' : '❌'} Scan #{scanHistory.length - index} - {format(new Date(scan.extractedAt), 'HH:mm:ss')}
                  </Typography>
                  
                  {scan.userInfo && (
                    <Typography variant="body2">
                      <strong>Extracted:</strong> {scan.userInfo.name} ({scan.userInfo.email})
                    </Typography>
                  )}
                </Paper>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card sx={{ mt: 3, bgcolor: 'info.light' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📖 How to Test Token Extraction
          </Typography>
          
          <Stack spacing={1}>
            <Typography variant="body2">
              1. <strong>Generate QR:</strong> Click "Generate Test QR Code" to create a QR containing your user token data
            </Typography>
            <Typography variant="body2">
              2. <strong>Start Scanner:</strong> Click "Start Camera Scanner" and allow camera permissions
            </Typography>
            <Typography variant="body2">
              3. <strong>Scan QR:</strong> Point your camera at the generated QR code
            </Typography>
            <Typography variant="body2">
              4. <strong>View Results:</strong> See extracted name, email, and profile data in the results section
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default QRTokenExtractionTest;
