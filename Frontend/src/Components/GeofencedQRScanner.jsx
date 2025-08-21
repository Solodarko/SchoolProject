import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  Stack,
  Chip,
  Divider,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  QrCodeScanner as QrCodeIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  MyLocation as MyLocationIcon,
  Shield as ShieldIcon,
  Camera as CameraIcon,
  Stop as StopIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import QRAttendanceModal from './QR/QRAttendanceModal';

// Geofence configuration - Update these coordinates with your actual location
const GEOFENCE = {
  latitude: 5.298880,   // Your classroom/attendance location latitude
  longitude: -2.001131, // Your classroom/attendance location longitude
  radiusMeters: 50,     // 50 meters radius (adjust as needed)
  name: 'Authorized Attendance Area'
};

const GeofencedQRScanner = () => {
  console.log('🔍 GeofencedQRScanner component rendering...');
  
  // Location and geofencing state
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isWithinGeofence, setIsWithinGeofence] = useState(false);
  const [distanceFromCenter, setDistanceFromCenter] = useState(null);

  // QR Scanner state
  const [scanner, setScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [permissions, setPermissions] = useState({ camera: false, location: false, checked: false });

  // UI state
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [attendanceModal, setAttendanceModal] = useState(null);

  const scannerRef = useRef(null);

  // Initialize attendance modal
  useEffect(() => {
    setAttendanceModal(new QRAttendanceModal());
  }, []);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  // Check both camera and location permissions
  const checkPermissions = async () => {
    const permissionStatus = { camera: false, location: false, checked: true };

    // Check camera permissions
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        permissionStatus.camera = true;
      }
    } catch (error) {
      console.error('Camera permission check failed:', error);
    }

    // Check location permissions  
    if (navigator.geolocation) {
      permissionStatus.location = true;
    }

    setPermissions(permissionStatus);
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

  // Get user's current location
  const getUserLocation = async () => {
    setLocationLoading(true);
    setLocationError('');

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000 // 1 minute
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

      // Check if within geofence
      const withinFence = distance <= GEOFENCE.radiusMeters;
      setIsWithinGeofence(withinFence);

      console.log('Location obtained:', {
        location,
        distance: `${distance.toFixed(2)}m`,
        withinGeofence: withinFence
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
      setLocationLoading(false);
    }
  };

  // Initialize QR scanner (only if within geofence)
  const initializeScanner = () => {
    if (!isWithinGeofence) {
      setScanError('You must be within the authorized area to scan QR codes for attendance.');
      return;
    }

    try {
      cleanupScanner(); // Clean up any existing scanner

      const html5QrcodeScanner = new Html5QrcodeScanner(
        "geofenced-qr-container",
        { 
          fps: 10,
          qrbox: { width: 300, height: 300 },
          aspectRatio: 1.0,
          supportedScanTypes: [1] // Only QR codes
        },
        false
      );

      html5QrcodeScanner.render(
        (decodedText, decodedResult) => {
          console.log('QR Code scanned:', decodedText);
          handleScanSuccess(decodedText, decodedResult);
        },
        (error) => {
          // Only log actual errors, not "no QR found" messages
          if (error !== 'QR code parse error, error = NotFoundException: No MultiFormat Readers were able to detect the code.') {
            console.warn('QR Scanner error:', error);
          }
        }
      );

      setScanner(html5QrcodeScanner);
      setIsScanning(true);
      setScanError('');
      
    } catch (err) {
      console.error('Failed to initialize QR scanner:', err);
      setScanError('Failed to initialize QR scanner. Please check camera permissions and try again.');
    }
  };

  // Handle successful QR scan
  const handleScanSuccess = async (decodedText, decodedResult) => {
    try {
      // Parse QR data
      const qrData = JSON.parse(decodedText);
      
      // Validate that this is an attendance QR code
      if (!isValidAttendanceQR(qrData)) {
        setScanResult({
          type: 'error',
          message: 'Invalid QR code. Please scan a valid attendance QR code.',
          data: decodedText
        });
        return;
      }

      // Check if QR code is expired
      if (isExpiredQR(qrData)) {
        setScanResult({
          type: 'error', 
          message: 'This QR code has expired. Please request a new one.',
          data: qrData
        });
        return;
      }

      setScanResult({
        type: 'success',
        message: 'Valid attendance QR code detected!',
        data: qrData
      });

      // Show attendance form modal with geolocation data
      if (attendanceModal) {
        await attendanceModal.showAttendanceForm(
          qrData,
          (responseData) => {
            // Success callback
            console.log('Attendance recorded successfully:', responseData);
            setScanResult({
              type: 'success',
              message: 'Attendance recorded successfully!',
              data: responseData
            });
          },
          (error) => {
            // Error callback
            console.error('Attendance recording failed:', error);
            setScanResult({
              type: 'error',
              message: 'Failed to record attendance. Please try again.',
              error: error
            });
          }
        );
      }

    } catch (parseError) {
      // Not valid JSON or parsing failed
      setScanResult({
        type: 'error',
        message: 'Invalid QR code format. Please scan a valid attendance QR code.',
        data: decodedText
      });
    }
  };

  // Validate if QR code is for attendance
  const isValidAttendanceQR = (qrData) => {
    return qrData && 
           (qrData.type === 'attendance_check' || qrData.type === 'attendance') &&
           (qrData.id || qrData.sessionId || qrData.qrCodeId);
  };

  // Check if QR code is expired
  const isExpiredQR = (qrData) => {
    if (qrData.expiresAt) {
      return new Date(qrData.expiresAt) < new Date();
    }
    if (qrData.validUntil) {
      return new Date(qrData.validUntil) < new Date();
    }
    return false;
  };

  // Cleanup scanner
  const cleanupScanner = () => {
    if (scanner) {
      try {
        scanner.clear();
        setScanner(null);
        setIsScanning(false);
      } catch (err) {
        console.error('Error cleaning up scanner:', err);
      }
    }
  };

  // Start the complete flow: location -> geofence -> scanner
  const startAttendanceFlow = async () => {
    await getUserLocation();
  };

  // Stop scanning
  const stopScanning = () => {
    cleanupScanner();
    setScanResult(null);
    setScanError('');
  };

  // Restart scanner (if within geofence)
  const restartScanner = () => {
    stopScanning();
    setTimeout(() => {
      if (isWithinGeofence) {
        initializeScanner();
      }
    }, 500);
  };

  // Get location status color
  const getLocationStatusColor = () => {
    if (!userLocation) return 'grey';
    if (isWithinGeofence) return 'success';
    return 'error';
  };

  // Get distance display text
  const getDistanceText = () => {
    if (distanceFromCenter === null) return 'Unknown';
    if (distanceFromCenter < 1000) {
      return `${Math.round(distanceFromCenter)}m`;
    }
    return `${(distanceFromCenter / 1000).toFixed(2)}km`;
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <ShieldIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Secure QR Attendance Scanner
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Location-verified attendance tracking with geofencing
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Location Verification Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon color="primary" />
                Location Verification
              </Typography>

              {!permissions.checked ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    Checking permissions...
                  </Typography>
                </Box>
              ) : !permissions.location ? (
                <Alert severity="error">
                  <Typography variant="subtitle2">Location Access Required</Typography>
                  <Typography variant="body2">
                    This device doesn't support location services or permissions are denied.
                  </Typography>
                </Alert>
              ) : !userLocation ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={locationLoading ? <CircularProgress size={20} /> : <MyLocationIcon />}
                    onClick={startAttendanceFlow}
                    disabled={locationLoading}
                  >
                    {locationLoading ? 'Getting Location...' : 'Get My Location'}
                  </Button>
                  
                  {locationError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {locationError}
                    </Alert>
                  )}
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Click to verify you're in the authorized attendance area
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {/* Location Status */}
                  <Paper sx={{ p: 2, mb: 2, bgcolor: isWithinGeofence ? 'success.50' : 'error.50' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <CheckCircleIcon 
                        color={isWithinGeofence ? 'success' : 'error'} 
                        sx={{ fontSize: 32 }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {isWithinGeofence ? '✅ Within Attendance Area' : '❌ Outside Attendance Area'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Distance from center: {getDistanceText()}
                        </Typography>
                      </Box>
                      <IconButton onClick={getUserLocation} size="small">
                        <RefreshIcon />
                      </IconButton>
                    </Stack>
                  </Paper>

                  {/* Location Details */}
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 1.5, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">Latitude</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {userLocation.latitude.toFixed(6)}°
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 1.5, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">Longitude</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {userLocation.longitude.toFixed(6)}°
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 1.5, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">Accuracy</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          ±{Math.round(userLocation.accuracy)}m
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 1.5, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">Max Distance</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {GEOFENCE.radiusMeters}m
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {!isWithinGeofence && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        You need to be within {GEOFENCE.radiusMeters}m of the {GEOFENCE.name} to scan QR codes for attendance.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* QR Scanner Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <QrCodeIcon color="primary" />
                QR Code Scanner
              </Typography>

              {!permissions.camera ? (
                <Alert severity="error">
                  <Typography variant="subtitle2">Camera Access Required</Typography>
                  <Typography variant="body2">
                    Please allow camera permissions to scan QR codes.
                  </Typography>
                </Alert>
              ) : !isWithinGeofence ? (
                <Alert severity="warning">
                  <Typography variant="subtitle2">Location Verification Required</Typography>
                  <Typography variant="body2">
                    Please verify your location first to enable QR scanning.
                  </Typography>
                </Alert>
              ) : (
                <Box>
                  {/* Scanner Controls */}
                  <Stack direction="row" spacing={2} sx={{ mb: 2 }} justifyContent="center">
                    {!isScanning ? (
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<CameraIcon />}
                        onClick={initializeScanner}
                        disabled={!isWithinGeofence}
                      >
                        Start Scanner
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        color="error"
                        size="large"
                        startIcon={<StopIcon />}
                        onClick={stopScanning}
                      >
                        Stop Scanner
                      </Button>
                    )}
                    
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={restartScanner}
                      disabled={!scanner && !scanError}
                    >
                      Restart
                    </Button>
                  </Stack>

                  {/* Scanner Display */}
                  <Paper
                    elevation={2}
                    sx={{
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: 2,
                      minHeight: 400,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.100',
                      border: isScanning ? '3px solid' : '1px solid',
                      borderColor: isScanning ? 'success.main' : 'divider'
                    }}
                  >
                    <div id="geofenced-qr-container" style={{ width: '100%', minHeight: '400px' }} />
                    
                    {!isScanning && !scanError && (
                      <Box sx={{ textAlign: 'center', position: 'absolute' }}>
                        <QrCodeIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          Ready to Scan
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Click "Start Scanner" to begin scanning attendance QR codes
                        </Typography>
                      </Box>
                    )}
                  </Paper>

                  {/* Scanner Status */}
                  {isScanning && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        📷 Scanner active. Point your camera at an attendance QR code.
                      </Typography>
                    </Alert>
                  )}

                  {/* Error Display */}
                  {scanError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {scanError}
                    </Alert>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Results Section */}
        {scanResult && (
          <Grid item xs={12}>
            <Card sx={{ border: '2px solid', borderColor: scanResult.type === 'success' ? 'success.main' : 'error.main' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  {scanResult.type === 'success' ? (
                    <CheckCircleIcon color="success" sx={{ fontSize: 32 }} />
                  ) : (
                    <ErrorIcon color="error" sx={{ fontSize: 32 }} />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" color={scanResult.type === 'success' ? 'success.main' : 'error.main'}>
                      {scanResult.message}
                    </Typography>
                    {scanResult.type === 'success' && scanResult.data && (
                      <Typography variant="body2" color="text.secondary">
                        Session: {scanResult.data.attendanceConfig?.sessionTitle || 'Attendance Session'}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Instructions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoIcon color="primary" />
                How It Works
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>📍 Step 1: Location Verification</Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Your location is checked against the authorized attendance area. You must be within {GEOFENCE.radiusMeters} meters to proceed.
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom>📷 Step 2: QR Code Scanning</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Once location is verified, you can scan attendance QR codes. Only valid, non-expired codes will be accepted.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>✅ Step 3: Attendance Recording</Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    After scanning, a form will appear to collect your information and record your attendance with location verification.
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom>🔒 Security Features</Typography>
                  <Typography variant="body2" color="text.secondary">
                    • GPS location verification with geofencing<br />
                    • QR code expiration validation<br />
                    • Secure attendance data transmission
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GeofencedQRScanner;
