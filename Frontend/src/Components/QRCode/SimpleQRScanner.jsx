import React, { useState, useEffect } from 'react';
import QrScanner from 'react-qr-scanner';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  Grid,
  Paper,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  QrCodeScanner as QrCodeScannerIcon,
  Person,
  Email,
  CheckCircle,
  Error,
  Refresh,
  History,
  AccessTime,
  Info
} from '@mui/icons-material';

const SimpleQRScanner = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [cameraError, setCameraError] = useState(false);

  // Process scanned QR code
  const processQRCode = (qrText) => {
    try {
      setError(null);
      const parsedData = JSON.parse(qrText);
      
      // Check if this is a name/email token
      if (parsedData.type === 'name_email_token' && parsedData.name && parsedData.email) {
        // Extract only name and email
        const detectedInfo = {
          name: parsedData.name,
          email: parsedData.email,
          timestamp: new Date().toISOString(),
          originalTimestamp: parsedData.timestamp || null
        };
        
        setResult(detectedInfo);
        
        // Add to scan history
        setScanHistory(prev => [detectedInfo, ...prev.slice(0, 9)]); // Keep last 10 scans
        
        // Stop scanning temporarily
        setScanning(false);
        
      } else {
        // Not a name/email token
        setError({
          type: 'invalid_format',
          message: 'This QR code does not contain name and email information',
          details: 'Please scan a QR code generated for name and email identification.'
        });
      }
    } catch (parseError) {
      // Not valid JSON or parsing failed
      setError({
        type: 'parse_error',
        message: 'Invalid QR code format',
        details: 'The QR code does not contain valid name and email data.'
      });
    }
  };

  const handleScan = (data) => {
    if (data && scanning) {
      processQRCode(data.text);
    }
  };

  const handleError = (err) => {
    console.error('Scanner error:', err);
    setCameraError(true);
    setError({
      type: 'camera_error',
      message: 'Camera access error',
      details: 'Please ensure camera permissions are granted and try again.'
    });
  };

  // Reset scanner
  const resetScanner = () => {
    setResult(null);
    setError(null);
    setCameraError(false);
    setScanning(true);
  };

  // Start new scan
  const startNewScan = () => {
    setResult(null);
    setError(null);
    setScanning(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <QrCodeScannerIcon color="primary" />
            <Typography variant="h5" fontWeight={600}>
              Name & Email QR Scanner
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Scan QR codes to detect and display only name and email information. 
            Perfect for quick identification and contact details.
          </Typography>

          <Grid container spacing={3}>
            {/* Scanner Section */}
            <Grid item xs={12} md={8}>
              <Box>
                {/* Scanner Status */}
                <Alert 
                  severity={
                    result ? "success" :
                    error ? "error" :
                    scanning ? "info" : "warning"
                  }
                  sx={{ mb: 2 }}
                >
                  <Typography variant="subtitle2">
                    {result ? "✅ Name and Email Detected!" :
                     error ? "❌ Scan Error" :
                     scanning ? "📷 Scanner Active" : "⏸️ Scanner Paused"}
                  </Typography>
                  <Typography variant="body2">
                    {result ? "Successfully extracted contact information" :
                     error ? error.message :
                     scanning ? "Point your camera at a name/email QR code" : "Ready for next scan"}
                  </Typography>
                </Alert>

                {/* Camera View */}
                {scanning && !cameraError && (
                  <Box 
                    sx={{ 
                      width: '100%',
                      height: isMobile ? '300px' : '400px',
                      border: '3px solid',
                      borderColor: 'primary.main',
                      borderRadius: 2,
                      overflow: 'hidden',
                      position: 'relative',
                      backgroundColor: 'black'
                    }}
                  >
                    <QrScanner
                      delay={300}
                      onError={handleError}
                      onScan={handleScan}
                      facingMode="environment"
                      style={{ 
                        width: '100%', 
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    
                    {/* Scanning overlay */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '200px',
                        height: '200px',
                        border: '2px solid #00ff00',
                        borderRadius: 2,
                        pointerEvents: 'none',
                        '&::before, &::after': {
                          content: '""',
                          position: 'absolute',
                          width: '20px',
                          height: '20px',
                          border: '3px solid #00ff00'
                        },
                        '&::before': {
                          top: '-3px',
                          left: '-3px',
                          borderRight: 'none',
                          borderBottom: 'none'
                        },
                        '&::after': {
                          bottom: '-3px',
                          right: '-3px',
                          borderLeft: 'none',
                          borderTop: 'none'
                        }
                      }}
                    >
                      {/* Additional corners */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '-3px',
                          right: '-3px',
                          width: '20px',
                          height: '20px',
                          border: '3px solid #00ff00',
                          borderLeft: 'none',
                          borderBottom: 'none'
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: '-3px',
                          left: '-3px',
                          width: '20px',
                          height: '20px',
                          border: '3px solid #00ff00',
                          borderRight: 'none',
                          borderTop: 'none'
                        }}
                      />
                    </Box>

                    {/* Instructions */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 16,
                        left: 0,
                        right: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        pointerEvents: 'none'
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          px: 2,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          textAlign: 'center'
                        }}
                      >
                        🎯 Align QR code within the frame
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'center' }}>
                  {!scanning || error || result ? (
                    <Button
                      variant="contained"
                      startIcon={<QrCodeScannerIcon />}
                      onClick={resetScanner}
                    >
                      Start Scanning
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={resetScanner}
                    >
                      Reset Scanner
                    </Button>
                  )}
                  
                  {result && (
                    <Button
                      variant="outlined"
                      onClick={startNewScan}
                    >
                      Scan Another
                    </Button>
                  )}
                </Box>

                {/* Error Details */}
                {error && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      {error.details}
                    </Typography>
                  </Alert>
                )}
              </Box>
            </Grid>

            {/* Results and History Section */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Current Result */}
                {result && (
                  <Card variant="outlined" sx={{ bgcolor: 'success.50', border: '2px solid', borderColor: 'success.main' }}>
                    <CardContent>
                      <Typography variant="h6" color="success.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle />
                        Detected Information
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Chip
                          icon={<Person />}
                          label={result.name}
                          color="primary"
                          variant="filled"
                          sx={{ justifyContent: 'flex-start' }}
                        />
                        <Chip
                          icon={<Email />}
                          label={result.email}
                          color="secondary"
                          variant="filled"
                          sx={{ justifyContent: 'flex-start' }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                          <AccessTime sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                          Scanned: {new Date(result.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {/* Scan History */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <History color="primary" />
                      Scan History ({scanHistory.length})
                    </Typography>
                    
                    {scanHistory.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        No scans yet. Start scanning to see history.
                      </Typography>
                    ) : (
                      <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {scanHistory.map((scan, index) => (
                          <React.Fragment key={index}>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <Person color="primary" />
                              </ListItemIcon>
                              <ListItemText
                                primary={scan.name}
                                secondary={
                                  <Box>
                                    <Typography variant="caption" display="block">
                                      {scan.email}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {new Date(scan.timestamp).toLocaleTimeString()}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                            {index < scanHistory.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>

                {/* Instructions */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Info color="primary" />
                      How to Use
                    </Typography>
                    
                    <List dense>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary="1. Allow camera permissions"
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary="2. Point camera at QR code"
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary="3. Wait for automatic detection"
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary="4. View extracted name & email"
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SimpleQRScanner;
