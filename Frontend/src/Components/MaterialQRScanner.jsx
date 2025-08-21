import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Alert,
  Chip,
  Divider,
  Stack,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Fade,
  Zoom,
  Container,
  Grid,
} from '@mui/material';
import {
  QrCodeScanner as QrCodeScannerIcon,
  Camera as CameraIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  PhotoCamera as PhotoCameraIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
} from '@mui/icons-material';

// Geofence configuration - Update these coordinates with your actual location
const GEOFENCE = {
  latitude: 5.298880,   // Your classroom/attendance location latitude
  longitude: -2.001131, // Your classroom/attendance location longitude
  radiusMeters: 50,     // 50 meters radius (adjust as needed)
  name: 'Authorized Attendance Area'
};

const MaterialQRScanner = () => {
  // Scanner state
  const [scanner, setScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  
  // Permission and camera state
  const [cameraPermission, setCameraPermission] = useState(null);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);
  
  // Location and geofencing state
  const [locationPermission, setLocationPermission] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isWithinGeofence, setIsWithinGeofence] = useState(false);
  const [distanceFromCenter, setDistanceFromCenter] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  
  // UI state
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);

  const scannerRef = useRef(null);

  // Check permissions and automatically get location on component mount
  useEffect(() => {
    initializeComponent();
    return () => {
      // Cleanup scanner on unmount
      cleanupScanner();
    };
  }, []);

  // Initialize component by checking permissions and getting location
  const initializeComponent = async () => {
    await checkPermissions();
    // Automatically attempt to get location after permissions are checked
    if (navigator.geolocation) {
      await getUserLocation();
    }
  };

  // Check both camera and location permissions
  const checkPermissions = async () => {
    setIsCheckingPermissions(true);
    
    // Check camera permissions
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setCameraPermission('granted');
      } else {
        setCameraPermission('not-supported');
      }
    } catch (error) {
      console.error('Camera permission check failed:', error);
      if (error.name === 'NotAllowedError') {
        setCameraPermission('denied');
      } else if (error.name === 'NotFoundError') {
        setCameraPermission('not-found');
      } else {
        setCameraPermission('error');
      }
    }

    // Check location permissions
    if (navigator.geolocation) {
      setLocationPermission('available');
    } else {
      setLocationPermission('not-supported');
    }
    
    setIsCheckingPermissions(false);
  };

  // Get user's current location
  const getUserLocation = async () => {
    setIsCheckingLocation(true);
    setLocationError('');

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000, // 1 minute
          }
        );
      });

      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString()
      };

      setUserLocation(location);

      // Calculate distance from geofence center
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        GEOFENCE.latitude,
        GEOFENCE.longitude
      );

      setDistanceFromCenter(distance);
      setIsWithinGeofence(distance <= GEOFENCE.radiusMeters);

      console.log('Location obtained:', {
        location,
        distance: `${distance.toFixed(2)}m`,
        withinGeofence: distance <= GEOFENCE.radiusMeters
      });

    } catch (error) {
      console.error('Location error:', error);
      let errorMessage = 'Failed to get your location. ';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage += 'Location access was denied. Please allow location permissions and try again.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage += 'Location information is unavailable. Please check your GPS settings.';
          break;
        case error.TIMEOUT:
          errorMessage += 'Location request timed out. Please try again.';
          break;
        default:
          errorMessage += 'Please check your location settings and try again.';
      }
      
      setLocationError(errorMessage);
    } finally {
      setIsCheckingLocation(false);
    }
  };

  // Calculate distance between two GPS coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Initialize QR scanner (only if within geofence for attendance scanning)
  const startScanning = () => {
    if (cameraPermission !== 'granted') {
      setScanError('Camera permission is required to scan QR codes.');
      return;
    }

    // Check geofence only if location has been checked
    if (userLocation && !isWithinGeofence) {
      setScanError('You must be within the authorized attendance area to scan QR codes for attendance.');
      return;
    }

    try {
      // Clean up any existing scanner
      cleanupScanner();

      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-scanner-container",
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
          supportedScanTypes: [1], // Only QR codes
        },
        false
      );

      html5QrcodeScanner.render(
        (decodedText, decodedResult) => {
          console.log('QR Code scanned:', decodedText);
          handleScanSuccess(decodedText, decodedResult);
        },
        (error) => {
          // Only log actual errors, not continuous scanning messages
          if (!error.includes('NotFoundException') && !error.includes('No MultiFormat Readers')) {
            console.warn('QR Scanner error:', error);
          }
        }
      );

      setScanner(html5QrcodeScanner);
      setIsScanning(true);
      setScanError('');
      setScanResult(null);

    } catch (error) {
      console.error('Failed to start QR scanner:', error);
      setScanError('Failed to initialize QR scanner. Please refresh and try again.');
    }
  };

  // Handle successful QR scan
  const handleScanSuccess = (decodedText, decodedResult) => {
    // Add location data to scan result
    const scanData = {
      id: Date.now(),
      text: decodedText,
      timestamp: new Date().toLocaleString(),
      type: 'success',
      location: userLocation,
      withinGeofence: isWithinGeofence,
      distance: distanceFromCenter
    };

    setScanHistory(prev => [scanData, ...prev.slice(0, 9)]); // Keep last 10 scans
    setScanResult(scanData);
    setShowResultDialog(true);
    
    // Stop scanning after successful scan
    stopScanning();
  };

  // Stop scanning
  const stopScanning = () => {
    cleanupScanner();
    setScanError('');
  };

  // Clean up scanner instance
  const cleanupScanner = () => {
    if (scanner) {
      try {
        scanner.clear();
      } catch (error) {
        console.warn('Error cleaning up scanner:', error);
      }
      setScanner(null);
      setIsScanning(false);
    }
  };

  // Restart scanner
  const restartScanning = () => {
    stopScanning();
    setTimeout(() => {
      startScanning();
    }, 500);
  };

  // Get permission status display
  const getPermissionStatus = () => {
    switch (cameraPermission) {
      case 'granted':
        return { color: 'success', text: 'Camera Access Granted', icon: <CheckCircleIcon /> };
      case 'denied':
        return { color: 'error', text: 'Camera Access Denied', icon: <ErrorIcon /> };
      case 'not-found':
        return { color: 'warning', text: 'No Camera Found', icon: <WarningIcon /> };
      case 'not-supported':
        return { color: 'error', text: 'Camera Not Supported', icon: <ErrorIcon /> };
      default:
        return { color: 'info', text: 'Checking Camera...', icon: <InfoIcon /> };
    }
  };

  // Get location status display
  const getLocationStatus = () => {
    if (!userLocation) return { color: 'info', text: 'Location Not Checked' };
    if (isWithinGeofence) return { color: 'success', text: 'Within Authorized Area' };
    return { color: 'error', text: 'Outside Authorized Area' };
  };

  // Get distance display text
  const getDistanceText = () => {
    if (distanceFromCenter === null) return 'Unknown';
    if (distanceFromCenter < 1000) {
      return `${Math.round(distanceFromCenter)}m`;
    }
    return `${(distanceFromCenter / 1000).toFixed(2)}km`;
  };

  const permissionStatus = getPermissionStatus();
  const locationStatus = getLocationStatus();

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <QrCodeScannerIcon sx={{ fontSize: 48, color: 'white' }} />
          <Box>
            <Typography variant="h4" component="h1" sx={{ color: 'white', fontWeight: 'bold' }}>
              Secure QR Scanner
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              Location-verified attendance scanning with geofencing
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Show different layouts based on geofence status */}
      {!userLocation || !isWithinGeofence ? (
        // MANDATORY GEOFENCE VERIFICATION SCREEN
        <Box>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              🔒 Access Restricted
            </Typography>
            <Typography variant="body1">
              You must be within the authorized attendance area to access the QR scanner. 
              Please verify your location to continue.
            </Typography>
          </Alert>

          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} md={8}>
              <Card elevation={3}>
                <CardHeader
                  title="Location Verification Required"
                  avatar={<LocationIcon color="primary" />}
                  titleTypographyProps={{ variant: 'h5', fontWeight: 'bold' }}
                  sx={{ bgcolor: 'primary.50' }}
                />
                <CardContent>
                  <Stack spacing={3}>
                    {isCheckingPermissions && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                        <CircularProgress size={50} sx={{ mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">Initializing...</Typography>
                        <Typography variant="body2" color="text.secondary">Checking permissions and location services</Typography>
                      </Box>
                    )}

                    {locationPermission === 'not-supported' ? (
                      <Alert severity="error">
                        <Typography variant="subtitle1" gutterBottom>Location Not Supported</Typography>
                        <Typography variant="body2">
                          Your browser or device does not support geolocation services. 
                          Please use a modern browser or device with GPS capabilities.
                        </Typography>
                      </Alert>
                    ) : (
                      <Box>
                        {!userLocation ? (
                          <Box sx={{ textAlign: 'center' }}>
                            <LocationIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2, opacity: 0.7 }} />
                            <Typography variant="h6" gutterBottom>
                              Location Access Required
                            </Typography>
                            <Typography variant="body1" color="text.secondary" paragraph>
                              To ensure secure attendance tracking, we need to verify you're in the authorized area.
                            </Typography>
                            
                            <Button
                              variant="contained"
                              size="large"
                              onClick={getUserLocation}
                              disabled={isCheckingLocation}
                              startIcon={isCheckingLocation ? <CircularProgress size={20} /> : <MyLocationIcon />}
                              sx={{ 
                                mt: 2, 
                                py: 1.5, 
                                px: 4,
                                fontSize: '1.1rem',
                                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                '&:hover': {
                                  background: 'linear-gradient(45deg, #1976D2 30%, #2196F3 90%)',
                                }
                              }}
                            >
                              {isCheckingLocation ? 'Verifying Location...' : 'Verify My Location'}
                            </Button>
                            
                            <Paper sx={{ p: 2, mt: 3, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
                              <Typography variant="body2" color="info.main">
                                📍 <strong>Required:</strong> You must be within {GEOFENCE.radiusMeters} meters of {GEOFENCE.name}
                              </Typography>
                            </Paper>
                          </Box>
                        ) : (
                          <Box>
                            {/* Location obtained but outside geofence */}
                            <Paper 
                              sx={{ 
                                p: 3, 
                                textAlign: 'center',
                                bgcolor: 'error.50',
                                border: '2px solid',
                                borderColor: 'error.main',
                                borderRadius: 2
                              }}
                            >
                              <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
                              <Typography variant="h6" color="error.main" gutterBottom>
                                ❌ Outside Authorized Area
                              </Typography>
                              <Typography variant="body1" paragraph>
                                You are currently <strong>{getDistanceText()}</strong> away from the authorized attendance area.
                              </Typography>
                              <Typography variant="body2" color="text.secondary" paragraph>
                                Please move closer to {GEOFENCE.name} and try again.
                              </Typography>
                              
                              <Button
                                variant="contained"
                                color="primary"
                                onClick={getUserLocation}
                                disabled={isCheckingLocation}
                                startIcon={isCheckingLocation ? <CircularProgress size={20} /> : <RefreshIcon />}
                                sx={{ mt: 2 }}
                              >
                                {isCheckingLocation ? 'Checking...' : 'Check Location Again'}
                              </Button>
                            </Paper>

                            {/* Location Details */}
                            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>Current Location:</Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">Latitude</Typography>
                                  <Typography variant="body2" fontWeight="bold">
                                    {userLocation.latitude.toFixed(6)}°
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">Longitude</Typography>
                                  <Typography variant="body2" fontWeight="bold">
                                    {userLocation.longitude.toFixed(6)}°
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">Distance</Typography>
                                  <Typography variant="body2" fontWeight="bold" color="error.main">
                                    {getDistanceText()} away
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">Required</Typography>
                                  <Typography variant="body2" fontWeight="bold">
                                    ≤ {GEOFENCE.radiusMeters}m
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Paper>
                          </Box>
                        )}
                      </Box>
                    )}

                    {locationError && (
                      <Alert severity="error" onClose={() => setLocationError('')}>
                        <Typography variant="subtitle2" gutterBottom>Location Error</Typography>
                        <Typography variant="body2">{locationError}</Typography>
                        <Button 
                          color="inherit" 
                          size="small" 
                          onClick={getUserLocation}
                          sx={{ mt: 1 }}
                        >
                          Try Again
                        </Button>
                      </Alert>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      ) : (
        // QR SCANNER ACCESS GRANTED - FULL INTERFACE
        <Box>
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              ✅ Location Verified - Scanner Access Granted
            </Typography>
            <Typography variant="body1">
              You are within the authorized area. You can now scan QR codes for attendance.
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            {/* Location Status (Condensed) */}
            <Grid item xs={12}>
              <Paper 
                sx={{ 
                  p: 2, 
                  bgcolor: 'success.50',
                  border: '1px solid',
                  borderColor: 'success.main',
                  borderRadius: 2
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <CheckCircleIcon color="success" sx={{ fontSize: 32 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      ✅ Within Authorized Area - {getDistanceText()} from center
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Location: {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                    </Typography>
                  </Box>
                  <IconButton onClick={getUserLocation} size="small" title="Refresh location">
                    <RefreshIcon />
                  </IconButton>
                </Stack>
              </Paper>
            </Grid>

            {/* QR Scanner Section */}
            <Grid item xs={12}>
          <Card elevation={3}>
            <CardHeader
              title="QR Scanner"
              avatar={<PhotoCameraIcon color="primary" />}
              action={
                <Chip 
                  icon={permissionStatus.icon}
                  label={permissionStatus.text}
                  color={permissionStatus.color}
                  variant="outlined"
                />
              }
            />
            <CardContent>
              {isCheckingPermissions ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <CircularProgress sx={{ mb: 2 }} />
                  <Typography color="text.secondary">Checking permissions...</Typography>
                </Box>
              ) : cameraPermission !== 'granted' ? (
                <Alert 
                  severity="error" 
                  action={
                    <Button color="inherit" size="small" onClick={checkPermissions}>
                      Retry
                    </Button>
                  }
                >
                  <Typography variant="subtitle2">Camera Access Required</Typography>
                  <Typography variant="body2">
                    {cameraPermission === 'denied' && 'Please allow camera access in your browser settings and refresh the page.'}
                    {cameraPermission === 'not-found' && 'No camera device was found on this device.'}
                    {cameraPermission === 'not-supported' && 'Your browser does not support camera access.'}
                    {cameraPermission === 'error' && 'An error occurred while accessing the camera.'}
                  </Typography>
                </Alert>
              ) : (
                <Box>
                  {/* Scanner Controls */}
                  <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
                    {!isScanning ? (
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<CameraIcon />}
                        onClick={startScanning}
                        disabled={userLocation && !isWithinGeofence}
                        sx={{ 
                          background: 'linear-gradient(45deg, #4CAF50 30%, #81C784 90%)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #388E3C 30%, #4CAF50 90%)',
                          },
                          '&:disabled': {
                            background: 'grey.300',
                            color: 'grey.600'
                          }
                        }}
                      >
                        Start Scanning
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        size="large"
                        color="error"
                        startIcon={<StopIcon />}
                        onClick={stopScanning}
                      >
                        Stop Scanning
                      </Button>
                    )}
                    
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={restartScanning}
                      disabled={isScanning || (userLocation && !isWithinGeofence)}
                    >
                      Restart
                    </Button>
                  </Stack>

                  {/* Scanner Display Area */}
                  <Paper
                    elevation={4}
                    sx={{
                      position: 'relative',
                      minHeight: 300,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.50',
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: isScanning ? '3px solid' : '2px solid',
                      borderColor: isScanning ? 'success.main' : 'divider',
                    }}
                  >
                    <div 
                      id="qr-scanner-container" 
                      style={{ 
                        width: '100%', 
                        minHeight: '300px',
                      }} 
                    />
                    
                    {!isScanning && (
                      <Fade in={!isScanning}>
                        <Box 
                          sx={{ 
                            position: 'absolute',
                            textAlign: 'center',
                            color: 'text.secondary'
                          }}
                        >
                          <QrCodeScannerIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                          <Typography variant="h6" gutterBottom>
                            Ready to Scan
                          </Typography>
                          <Typography variant="body2">
                            {userLocation && !isWithinGeofence 
                              ? 'Move to authorized area to scan' 
                              : 'Click "Start Scanning" to begin'}
                          </Typography>
                        </Box>
                      </Fade>
                    )}
                  </Paper>

                  {/* Scanner Status */}
                  {isScanning && (
                    <Zoom in={isScanning}>
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          📱 Scanner is active. Point your camera at a QR code to scan.
                        </Typography>
                      </Alert>
                    </Zoom>
                  )}

                  {/* Error Display */}
                  {scanError && (
                    <Alert severity="error" sx={{ mt: 2 }} onClose={() => setScanError('')}>
                      {scanError}
                    </Alert>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar - Recent Scans and Instructions */}
        <Grid item xs={12}>
          <Grid container spacing={3}>
            {/* Recent Scans */}
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardHeader title="Recent Scans" avatar={<SecurityIcon color="primary" />} />
                <CardContent>
                  {scanHistory.length === 0 ? (
                    <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                      No scans yet
                    </Typography>
                  ) : (
                    <Stack spacing={2} sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {scanHistory.map((scan) => (
                        <Paper key={scan.id} variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {scan.timestamp} {scan.withinGeofence && '🟢'} {scan.distance && `(${scan.distance.toFixed(0)}m)`}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              wordBreak: 'break-all',
                              maxHeight: '40px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {scan.text}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Instructions */}
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardHeader title="How It Works" avatar={<InfoIcon color="primary" />} />
                <CardContent>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        📍 Step 1: Location Verification
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Your location is checked against the authorized attendance area. You must be within {GEOFENCE.radiusMeters} meters to proceed.
                      </Typography>
                    </Box>
                    
                    <Divider />
                    
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        📹 Step 2: Camera Access
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Allow camera permissions when prompted by your browser.
                      </Typography>
                    </Box>
                    
                    <Divider />
                    
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        🎯 Step 3: QR Scanning
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Once location is verified, scan QR codes for attendance. Results include location data.
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  )}

      {/* Scan Result Dialog */}
      <Dialog
        open={showResultDialog}
        onClose={() => setShowResultDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon color="success" />
          QR Code Scanned Successfully
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={() => setShowResultDialog(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {scanResult && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Scanned at: {scanResult.timestamp}
              </Typography>
              
              <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 2, mb: 2 }}>
                <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                  {scanResult.text}
                </Typography>
              </Paper>

              {scanResult.location && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Location Data:</Typography>
                  <Typography variant="body2">
                    Status: {scanResult.withinGeofence ? '✅ Within authorized area' : '❌ Outside authorized area'}
                  </Typography>
                  <Typography variant="body2">
                    Distance: {scanResult.distance ? `${scanResult.distance.toFixed(2)}m from center` : 'Unknown'}
                  </Typography>
                  <Typography variant="body2">
                    Coordinates: {scanResult.location.latitude.toFixed(6)}, {scanResult.location.longitude.toFixed(6)}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowResultDialog(false)}>
            Close
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setShowResultDialog(false);
              if (!userLocation || isWithinGeofence) {
                startScanning();
              }
            }}
          >
            Scan Another
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MaterialQRScanner;
