import React, { useState, useEffect } from 'react';
import QrScanner from 'react-qr-scanner';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  Button,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  LocationOn,
  QrCodeScanner as QrCodeScannerIcon,
  Refresh,
  CheckCircle,
  Error,
  Warning,
  Settings,
  Person,
  Badge,
  Schedule
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNotificationSystem } from '../context/NotificationSystem';
import Swal from 'sweetalert2';

// Configurable geofence - Your actual GPS coordinates
const GEOFENCE = {
  latitude: 5.636096,  // Your actual latitude
  longitude: -0.196608, // Your actual longitude
  radiusMeters: 5,    // 5 meters radius - Very precise location required
  name: 'Authorized Attendance Area'
};

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  // Haversine formula
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const QRScanner = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { getUserIdentity, isAuthenticated, user, student, apiBaseUrl } = useAuth();
  const { addQRCodeNotification } = useNotificationSystem();
  
  const [result, setResult] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [attendanceResult, setAttendanceResult] = useState(null);
  const [geoStatus, setGeoStatus] = useState('loading'); // loading, inside, outside, denied, error
  const [coords, setCoords] = useState(null);
  const [distance, setDistance] = useState(null);
  const [scanCount, setScanCount] = useState(0);
  const [lastScanTime, setLastScanTime] = useState(null);
  const [scannerActive, setScannerActive] = useState(false); // Add this state to track if scanner is active
  const navigate = useNavigate();

  const refreshLocation = () => {
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ latitude, longitude });
        const dist = getDistanceMeters(
          latitude,
          longitude,
          GEOFENCE.latitude,
          GEOFENCE.longitude
        );
        setDistance(dist);
        if (dist <= GEOFENCE.radiusMeters) {
          setGeoStatus('inside');
        } else {
          setGeoStatus('outside');
        }
      },
      (err) => {
        if (err.code === 1) setGeoStatus('denied');
        else setGeoStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGeoStatus('error');
      return;
    }
    refreshLocation();
  }, []);

  // Set scanner active when geoStatus changes to 'inside' with a small delay for better UX
  useEffect(() => {
    if (geoStatus === 'inside') {
      // Add a 1-second delay to let the camera initialize properly
      const timer = setTimeout(() => {
        setScannerActive(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      setScannerActive(false);
    }
  }, [geoStatus]);

  // Process QR code data and extract user identity
  const processQRCode = async (qrText) => {
    try {
      setProcessing(true);
      const parsedData = JSON.parse(qrText);
      
      // Validate QR code structure
      if (!parsedData.id || !parsedData.type || parsedData.type !== 'attendance_check') {
        throw new Error('Invalid QR code format');
      }
      
      // Check if QR code is expired
      const expiresAt = new Date(parsedData.expiresAt);
      if (expiresAt < new Date()) {
        throw new Error('QR code has expired');
      }
      
      setQrData(parsedData);
      
      // Record attendance with user identity from QR code
      await recordAttendance(parsedData);
      
    } catch (error) {
      console.error('QR processing error:', error);
      setAttendanceResult({
        success: false,
        message: `❌ QR Code Error: ${error.message || 'Failed to process QR code'}`,
        detailedMessage: 'Please ensure you\'re scanning a valid attendance QR code.',
        timestamp: new Date().toISOString()
      });
    } finally {
      setProcessing(false);
    }
  };
  
  // Record attendance using QR code data and user location
  const recordAttendance = async (qrCodeData) => {
    try {
      const currentUser = getUserIdentity();
      
      // Validate that current user is authenticated and has student info
      if (!currentUser || !currentUser.studentId) {
        throw new Error('You must be logged in as a student to record attendance');
      }
      
      // QR code contains admin info who generated it, but we record attendance for the scanning student
      const qrGeneratedBy = qrCodeData.user; // Admin who generated the QR
      
      // Prepare attendance data - record for the SCANNING student, not the QR generator
      const attendanceData = {
        // Send the QR code data to validate it on backend
        qrCodeData: qrCodeData,
        qrCodeString: JSON.stringify(qrCodeData),
        
        // Location data from the scanning user
        scannerLocation: {
          coordinates: {
            latitude: coords.latitude,
            longitude: coords.longitude
          },
          distance: distance
        },
        userLocation: coords,
        
        // The scanning student's info (currentUser) - this is who attendance gets recorded for
        studentId: currentUser.studentId,
        
        // Metadata about who scanned
        scannedBy: {
          userId: currentUser.userId,
          username: currentUser.username,
          email: currentUser.email,
          studentId: currentUser.studentId
        },
        scannedAt: new Date().toISOString(),
        attendanceType: 'qr_scan'
      };
      
      // Send to backend
      const response = await fetch(`${apiBaseUrl}/attendance/qr-location`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        const studentInfo = {
          studentId: currentUser.studentId,
          name: currentUser.fullName || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
          department: currentUser.department
        };
        
        const qrInfo = {
          generatedBy: qrGeneratedBy ? qrGeneratedBy.username : 'Unknown Admin',
          location: qrCodeData.location,
          qrId: qrCodeData.id
        };
        
        // Add QR code scan notification
        addQRCodeNotification({
          studentId: currentUser.studentId,
          studentName: studentInfo.name,
          studentEmail: currentUser.email || 'N/A',
          qrCodeId: qrCodeData.id,
          qrGeneratedBy: qrInfo.generatedBy,
          latitude: coords.latitude,
          longitude: coords.longitude,
          distance: distance,
          attendanceStatus: 'present',
          meetingId: result.meetingId || null,
          deviceInfo: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        });
        
        // Set immediate success message
        setAttendanceResult({
          success: true,
          message: `🎉 Welcome ${studentInfo.name}! Your attendance for this session has been recorded.`,
          detailedMessage: `📌 Attendance recorded: ${studentInfo.name} (${studentInfo.studentId}, ${currentUser.email || 'N/A'})`,
          studentInfo,
          qrInfo,
          timestamp: result.timestamp
        });
        
        setScanCount(prev => prev + 1);
        setLastScanTime(new Date().toISOString());
        
        // Show beautiful SweetAlert success notification
        await Swal.fire({
          icon: 'success',
          title: '🎉 Attendance Recorded!',
          html: `
            <div style="text-align: left; margin-top: 20px;">
              <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <h4 style="color: #0369a1; margin: 0 0 10px 0;">📚 Student Information</h4>
                <p style="margin: 5px 0;"><strong>Student ID:</strong> ${studentInfo.studentId}</p>
                <p style="margin: 5px 0;"><strong>Name:</strong> ${studentInfo.name}</p>
                ${studentInfo.department ? `<p style="margin: 5px 0;"><strong>Department:</strong> ${studentInfo.department}</p>` : ''}
              </div>
              
              <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <h4 style="color: #15803d; margin: 0 0 10px 0;">📍 Location & Time</h4>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
                <p style="margin: 5px 0;"><strong>Location:</strong> ${distance?.toFixed(1)}m from center</p>
                <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #15803d; font-weight: bold;">✅ PRESENT</span></p>
              </div>
              
              <div style="background: #fefce8; border: 1px solid #eab308; border-radius: 8px; padding: 15px;">
                <h4 style="color: #a16207; margin: 0 0 10px 0;">🔐 QR Code Details</h4>
                <p style="margin: 5px 0;"><strong>Generated by:</strong> ${qrInfo.generatedBy}</p>
                <p style="margin: 5px 0;"><strong>Location:</strong> ${qrInfo.location}</p>
                <p style="margin: 5px 0;"><strong>QR ID:</strong> ${qrInfo.qrId}</p>
              </div>
            </div>
          `,
          confirmButtonText: '📝 View Dashboard',
          showCancelButton: true,
          cancelButtonText: '📱 Scan Another',
          confirmButtonColor: '#3b82f6',
          cancelButtonColor: '#10b981',
          background: '#ffffff',
          customClass: {
            container: 'attendance-success-modal'
          },
          width: '90%',
          maxWidth: '600px'
        }).then((result) => {
          if (result.isConfirmed) {
            // Navigate to dashboard or attendance view
            navigate('/dashboard');
          } else {
            // Reset for another scan
            resetScan();
          }
        });
        
      } else {
        throw new Error(result.message || 'Failed to record attendance');
      }
      
    } catch (error) {
      console.error('Attendance recording error:', error);
      setAttendanceResult({
        success: false,
        message: `❌ ${error.message || 'Failed to record attendance'}`,
        detailedMessage: 'Please try again or contact support if the issue persists.',
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleScan = (data) => {
    if (data && geoStatus === 'inside' && !processing && scannerActive) {
      setScannerActive(false); // Temporarily disable scanner while processing
      setResult(data.text);
      processQRCode(data.text);
    }
  };

  const handleError = (err) => {
    console.error('Scanner error:', err);
  };
  
  // Reset scan results
  const resetScan = () => {
    setResult(null);
    setQrData(null);
    setAttendanceResult(null);
    // Ensure the scanner is active if we're inside the geofence with a small delay
    if (geoStatus === 'inside') {
      setTimeout(() => {
        setScannerActive(true);
      }, 500);
    }
  };

  const getStatusConfig = () => {
    switch (geoStatus) {
      case 'loading':
        return {
          color: 'info',
          icon: <LocationOn />,
          title: 'Checking Location',
          message: 'Verifying your location for secure scanning...'
        };
      case 'denied':
        return {
          color: 'error',
          icon: <Error />,
          title: 'Location Access Required',
          message: 'Please enable location permissions to use the QR scanner for attendance.'
        };
      case 'error':
        return {
          color: 'error',
          icon: <Error />,
          title: 'Location Error',
          message: 'Unable to access your location. Please check browser settings and try again.'
        };
      case 'outside':
        return {
          color: 'warning',
          icon: <Warning />,
          title: 'Outside Authorized Area',
          message: `Move closer to the designated area. Current distance: ${distance?.toFixed(1)} meters`
        };
      case 'inside':
        return {
          color: scannerActive ? 'success' : 'info',
          icon: scannerActive ? <CheckCircle /> : <QrCodeScannerIcon />,
          title: scannerActive ? 'Scanner Active - Ready to Scan' : 'Initializing Scanner',
          message: scannerActive 
            ? 'Scanner is active! Point your camera at a QR code to mark attendance.' 
            : 'Scanner is initializing. Please wait a moment...'
        };
      default:
        return {
          color: 'info',
          icon: <QrCodeScannerIcon />,
          title: 'QR Scanner',
          message: 'Initializing scanner...'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Box sx={{ 
      height: '100%', 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'auto',
      p: { xs: 2, md: 3 },
      maxHeight: '100%',
      boxSizing: 'border-box'
    }}>
      <Grid container spacing={3} sx={{ height: '100%' }}>
        {/* Header */}
        <Grid item xs={12}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              background: theme.palette.mode === 'light' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'linear-gradient(135deg, #2D3748 0%, #4A5568 100%)',
              color: 'white',
              borderRadius: 2
            }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <QrCodeScannerIcon sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  Smart QR Scanner
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Secure attendance tracking with geolocation
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Status and Scanner */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, p: 3 }}>
              {/* Status Alert */}
              <Alert 
                severity={statusConfig.color} 
                icon={statusConfig.icon}
                sx={{ mb: 3 }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {statusConfig.title}
                  </Typography>
                  <Typography variant="body2">
                    {statusConfig.message}
                  </Typography>
                </Box>
              </Alert>

              {/* Loading Progress */}
              {geoStatus === 'loading' && (
                <Box sx={{ mb: 3 }}>
                  <LinearProgress color="info" />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Acquiring location data...
                  </Typography>
                </Box>
              )}

              {/* QR Scanner */}
              {geoStatus === 'inside' && (
                <Box 
                  sx={{ 
                    width: '100%',
                    height: isMobile ? '300px' : '400px',
                    border: '3px solid',
                    borderColor: scannerActive ? '#10b981' : '#3b82f6',
                    borderRadius: 3,
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundColor: 'transparent', // Transparent background for camera
                    boxShadow: scannerActive 
                      ? '0 0 20px rgba(16, 185, 129, 0.3)' 
                      : '0 0 10px rgba(59, 130, 246, 0.2)'
                  }}
                >
                  {/* Camera Feed */}
                  <QrScanner
                    delay={300}
                    onError={handleError}
                    onScan={handleScan}
                    facingMode="environment"
                    style={{ 
                      width: '100%', 
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '12px'
                    }}
                  />
                  
                  {/* Scanner Overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      pointerEvents: 'none',
                      background: `
                        radial-gradient(circle at center, transparent 120px, rgba(0,0,0,0.6) 140px),
                        linear-gradient(to right, rgba(0,0,0,0.8) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.8) 100%),
                        linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.8) 100%)
                      `
                    }}
                  />
                  
                  {/* Scanning Frame */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '240px',
                      height: '240px',
                      border: '4px solid transparent',
                      borderRadius: 3,
                      pointerEvents: 'none',
                      // Animated corners
                      '&::before, &::after': {
                        content: '""',
                        position: 'absolute',
                        width: '30px',
                        height: '30px',
                        border: `4px solid ${scannerActive ? '#10b981' : '#3b82f6'}`
                      },
                      '&::before': {
                        top: '-4px',
                        left: '-4px',
                        borderRight: 'none',
                        borderBottom: 'none'
                      },
                      '&::after': {
                        bottom: '-4px',
                        right: '-4px',
                        borderLeft: 'none',
                        borderTop: 'none'
                      }
                    }}
                  >
                    {/* Top-right corner */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        width: '30px',
                        height: '30px',
                        border: `4px solid ${scannerActive ? '#10b981' : '#3b82f6'}`,
                        borderLeft: 'none',
                        borderBottom: 'none'
                      }}
                    />
                    {/* Bottom-left corner */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: '-4px',
                        left: '-4px',
                        width: '30px',
                        height: '30px',
                        border: `4px solid ${scannerActive ? '#10b981' : '#3b82f6'}`,
                        borderRight: 'none',
                        borderTop: 'none'
                      }}
                    />
                    
                    {/* Scanning line animation */}
                    {scannerActive && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '2px',
                          background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
                          animation: 'scan 2s linear infinite',
                          '@keyframes scan': {
                            '0%': { transform: 'translateY(0)' },
                            '100%': { transform: 'translateY(240px)' }
                          }
                        }}
                      />
                    )}
                  </Box>
                  
                  {/* Status Indicator */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      left: 0,
                      right: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      pointerEvents: 'none'
                    }}
                  >
                    <Chip
                      label={scannerActive ? '📹 Scanning for QR Code' : '⚙️ Initializing Camera'}
                      sx={{
                        backgroundColor: scannerActive 
                          ? 'rgba(16, 185, 129, 0.9)' 
                          : 'rgba(59, 130, 246, 0.9)',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                      }}
                    />
                  </Box>
                  
                  {/* Instructions overlay */}
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
                        borderRadius: 2,
                        fontSize: '0.75rem',
                        textAlign: 'center',
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      {scannerActive 
                        ? '🎯 Point camera at QR code' 
                        : '⏳ Preparing camera...'}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Processing Indicator */}
              {processing && (
                <Box sx={{ mt: 3 }}>
                  <LinearProgress color="primary" />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                    Processing QR code and recording attendance...
                  </Typography>
                </Box>
              )}

              {/* Attendance Result */}
              {attendanceResult && (
                <Alert 
                  severity={attendanceResult.success ? "success" : "error"} 
                  sx={{ mt: 3 }}
                  action={
                    <Button color="inherit" size="small" onClick={resetScan}>
                      Scan Again
                    </Button>
                  }
                >
                  <Typography variant="h6" fontWeight={600} sx={{ color: attendanceResult.success ? 'success.main' : 'error.main' }}>
                    {attendanceResult.success ? '✅ Attendance Successful!' : '❌ Recording Failed'}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1, fontWeight: 600 }}>
                    {attendanceResult.message}
                  </Typography>
                  {attendanceResult.detailedMessage && (
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                      {attendanceResult.detailedMessage}
                    </Typography>
                  )}
                  {attendanceResult.success && attendanceResult.studentInfo && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" fontWeight={600} color="success.main">
                        Attendance Recorded For:
                      </Typography>
                      <Typography variant="body2">
                        <strong>Student ID:</strong> {attendanceResult.studentInfo.studentId}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Name:</strong> {attendanceResult.studentInfo.name}
                      </Typography>
                      {attendanceResult.studentInfo.department && (
                        <Typography variant="body2">
                          <strong>Department:</strong> {attendanceResult.studentInfo.department}
                        </Typography>
                      )}
                      {attendanceResult.qrInfo && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="caption" display="block" fontWeight={600}>
                            QR Code Details:
                          </Typography>
                          <Typography variant="caption" display="block">
                            Generated by: {attendanceResult.qrInfo.generatedBy}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Location: {attendanceResult.qrInfo.location}
                          </Typography>
                          <Typography variant="caption" display="block">
                            QR ID: {attendanceResult.qrInfo.qrId}
                          </Typography>
                        </Box>
                      )}
                      <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                        Recorded at: {new Date(attendanceResult.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                </Alert>
              )}

              {/* QR Data Display */}
              {qrData && !attendanceResult && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  <Typography variant="h6" fontWeight={600}>
                    QR Code Detected
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      <strong>ID:</strong> {qrData.id}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Type:</strong> {qrData.type}
                    </Typography>
                    {qrData.user && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          Student Information:
                        </Typography>
                        <Typography variant="body2">
                          • ID: {qrData.user.studentId}
                        </Typography>
                        <Typography variant="body2">
                          • Name: {qrData.user.fullName}
                        </Typography>
                        {qrData.user.department && (
                          <Typography variant="body2">
                            • Department: {qrData.user.department}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Info Panel */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
            {/* Location Info */}
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <LocationOn color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Location Status
                  </Typography>
                </Box>
                
                {/* Geofence Information */}
                <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="caption" display="block" fontWeight={600} color="primary">
                    🎯 {GEOFENCE.name}
                  </Typography>
                  <Typography variant="caption" display="block">
                    📍 Center: {GEOFENCE.latitude.toFixed(5)}°N, {GEOFENCE.longitude.toFixed(5)}°E
                  </Typography>
                  <Typography variant="caption" display="block">
                    📏 Radius: {GEOFENCE.radiusMeters}m
                  </Typography>
                </Box>
                
                {coords && (
                  <Box>
                    <Chip 
                      label={geoStatus === 'inside' ? '✅ Inside Authorized Area' : '⚠️ Outside Area'}
                      color={geoStatus === 'inside' ? 'success' : 'warning'}
                      size="small"
                      sx={{ mb: 2 }}
                    />
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      📱 <strong>Your Location:</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Lat: {coords.latitude.toFixed(6)}°
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Lng: {coords.longitude.toFixed(6)}°
                    </Typography>
                    {distance !== null && (
                      <>
                        <Typography variant="body2" color={geoStatus === 'inside' ? 'success.main' : 'warning.main'} sx={{ fontWeight: 600, mt: 1 }}>
                          📐 Distance: {distance.toFixed(1)}m from center
                        </Typography>
                        {geoStatus === 'outside' && (
                          <Typography variant="caption" display="block" color="warning.main">
                            Need to be within {GEOFENCE.radiusMeters}m to scan
                          </Typography>
                        )}
                      </>
                    )}
                  </Box>
                )}
                
                <Box sx={{ mt: 2 }}>
                  <Tooltip title="Refresh location">
                    <IconButton 
                      onClick={refreshLocation} 
                      size="small"
                      color={geoStatus === 'loading' ? 'primary' : 'default'}
                      disabled={geoStatus === 'loading'}
                    >
                      <Refresh sx={{ 
                        animation: geoStatus === 'loading' ? 'spin 1s linear infinite' : 'none',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' }
                        }
                      }} />
                    </IconButton>
                  </Tooltip>
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    {geoStatus === 'loading' ? 'Updating...' : 'Refresh GPS'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Scan Statistics */}
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <QrCodeScannerIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Scan History
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Scans: {scanCount}
                  </Typography>
                  {lastScanTime && (
                    <Typography variant="body2" color="text.secondary">
                      Last Scan: {new Date(lastScanTime).toLocaleTimeString()}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card sx={{ flexGrow: 1 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Instructions
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  1. Ensure you are within the authorized area
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  2. Allow camera and location permissions
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  3. Point camera at QR code for attendance
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  4. Wait for confirmation
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default QRScanner; 