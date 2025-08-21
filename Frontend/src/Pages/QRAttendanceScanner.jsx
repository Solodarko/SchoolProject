import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  Stack,
  Chip,
  Grid,
  Divider
} from '@mui/material';
import {
  QrCodeScanner as QrCodeScannerIcon,
  CameraAlt as CameraIcon,
  FlashlightOn as FlashlightOnIcon,
  FlashlightOff as FlashlightOffIcon,
  Cameraswitch as CameraSwitchIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  PhotoCamera as PhotoCameraIcon,
  Upload as UploadIcon,
  Visibility as VisibilityIcon,
  Home as HomeIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { Html5Qrcode, Html5QrcodeScanType, Html5QrcodeScannerState } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import QRAttendanceModal from '../Components/QR/QRAttendanceModal';

const QRAttendanceScanner = () => {
  const navigate = useNavigate();
  
  // QR Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [permissions, setPermissions] = useState({ camera: false, checked: false });
  const [scanCount, setScanCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);

  // Refs
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const attendanceModalRef = useRef(null);

  // Initialize attendance modal
  useEffect(() => {
    attendanceModalRef.current = new QRAttendanceModal();
  }, []);

  // Check camera permissions and get cameras
  useEffect(() => {
    checkCameraPermissions();
    getCameras();
    
    // Cleanup on unmount
    return () => {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop();
        } catch (err) {
          console.warn('Error stopping scanner:', err);
        }
      }
    };
  }, []);

  // Auto start scanner when ready
  useEffect(() => {
    if (permissions.camera && cameras.length > 0 && !isScanning) {
      startScanning();
    }
  }, [permissions.camera, cameras]);

  const checkCameraPermissions = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setPermissions({ camera: true, checked: true });
      } else {
        setPermissions({ camera: false, checked: true });
      }
    } catch (error) {
      console.error('Camera permission check failed:', error);
      setPermissions({ camera: false, checked: true });
      setError('Camera access is required for QR scanning. Please allow camera permissions and refresh the page.');
    }
  };

  const getCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);
      if (devices.length > 0 && !selectedCamera) {
        // Prefer back camera if available
        const backCamera = devices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear')
        );
        setSelectedCamera(backCamera ? backCamera.id : devices[0].id);
      }
    } catch (error) {
      console.error('Error getting cameras:', error);
      setError('Error accessing cameras. Please check your device permissions.');
    }
  };

  const startScanning = async () => {
    if (!permissions.camera) {
      setError('Camera permission required for QR scanning');
      return;
    }

    if (isScanning) {
      await stopScanning();
      return;
    }

    try {
      setError('');
      setIsScanning(true);

      const cameraId = selectedCamera || cameras[0]?.id;
      if (!cameraId) {
        throw new Error('No camera available');
      }

      html5QrCodeRef.current = new Html5Qrcode('qr-reader-container');
      
      const config = {
        fps: 10,
        qrbox: { width: 280, height: 280 },
        aspectRatio: 1.0,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      };

      await html5QrCodeRef.current.start(
        cameraId,
        config,
        handleScanSuccess,
        handleScanError
      );

      console.log('📱 QR Scanner started successfully');
    } catch (error) {
      console.error('Error starting scanner:', error);
      setError(error.message || 'Failed to start camera scanner');
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      }
      setIsScanning(false);
      setTorchEnabled(false);
      console.log('📱 QR Scanner stopped');
    } catch (error) {
      console.error('Error stopping scanner:', error);
      setIsScanning(false);
    }
  };

  const handleScanSuccess = async (decodedText) => {
    console.log('📱 QR Code scanned:', decodedText);
    setScanResult(decodedText);
    setScanCount(prev => prev + 1);
    
    try {
      // Parse the QR data
      let qrData;
      try {
        qrData = JSON.parse(decodedText);
      } catch (parseError) {
        // If direct parse fails, check if it's a URL with data parameter
        try {
          const url = new URL(decodedText);
          const dataParam = url.searchParams.get('data');
          if (dataParam) {
            qrData = JSON.parse(decodeURIComponent(dataParam));
          } else {
            throw new Error('No data parameter found in URL');
          }
        } catch (urlError) {
          throw new Error('QR code does not contain valid attendance data');
        }
      }

      // Check if this is an attendance QR code with the new format
      if (qrData && qrData.type === 'attendance_check' && qrData.attendanceConfig?.showForm) {
        console.log('📋 Detected enhanced attendance QR code - showing form modal');
        
        // Pause scanning while showing form
        if (isScanning) {
          await stopScanning();
        }

        // Show the attendance form modal
        await attendanceModalRef.current.showAttendanceForm(
          qrData,
          (responseData) => {
            // Success callback
            console.log('✅ Attendance recorded successfully:', responseData);
            setSuccessCount(prev => prev + 1);
            setScanResult({
              type: 'success',
              message: 'Attendance recorded successfully!',
              data: responseData
            });
            
            // Auto restart scanning after a delay
            setTimeout(() => {
              if (!isScanning) {
                startScanning();
              }
            }, 3000);
          },
          (error) => {
            // Error callback
            console.error('❌ Error recording attendance:', error);
            setScanResult({
              type: 'error',
              message: typeof error === 'string' ? error : 'Failed to record attendance',
              data: null
            });
            
            // Restart scanning after error
            setTimeout(() => {
              if (!isScanning) {
                startScanning();
              }
            }, 2000);
          }
        );
      } else if (qrData && (qrData.type === 'attendance' || qrData.type === 'attendance_check')) {
        // Handle legacy QR codes
        console.log('📋 Legacy attendance QR code detected - redirecting to form page');
        const encodedData = encodeURIComponent(JSON.stringify(qrData));
        navigate(`/qr-scan?data=${encodedData}`);
      } else {
        // Not an attendance QR code
        setScanResult({
          type: 'warning',
          message: 'This QR code is not for attendance tracking',
          data: qrData
        });
        console.warn('🚫 Non-attendance QR code scanned:', qrData);
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      setScanResult({
        type: 'error',
        message: error.message || 'Invalid QR code format',
        data: null
      });
    }
  };

  const handleScanError = (error) => {
    // Don't show errors for no QR code found (too noisy)
    if (error && !error.includes('No QR code found') && !error.includes('NotFoundException')) {
      console.warn('Scan error:', error);
    }
  };

  const switchCamera = async () => {
    if (cameras.length < 2) return;

    const currentIndex = cameras.findIndex(cam => cam.id === selectedCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];

    setSelectedCamera(nextCamera.id);
    
    if (isScanning) {
      await stopScanning();
      setTimeout(() => startScanning(), 500);
    }
  };

  const toggleTorch = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
        const settings = html5QrCodeRef.current.getRunningTrackSettings();
        if (settings && settings.torch !== undefined) {
          await html5QrCodeRef.current.applyVideoConstraints({
            torch: !torchEnabled
          });
          setTorchEnabled(!torchEnabled);
        }
      }
    } catch (error) {
      console.error('Error toggling torch:', error);
    }
  };

  const scanFromFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode('file-scanner-temp');
      const text = await html5QrCode.scanFile(file, true);
      await handleScanSuccess(text);
    } catch (error) {
      console.error('Error scanning file:', error);
      setScanResult({
        type: 'error',
        message: 'No QR code found in the selected image',
        data: null
      });
    }

    // Reset file input
    event.target.value = '';
  };

  if (!permissions.checked) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, maxWidth: 800, mx: 'auto', minHeight: '100vh' }}>
      {/* Header */}
      <Paper sx={{ mb: 3, p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <QrCodeScannerIcon color="primary" />
              QR Attendance Scanner
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Scan QR codes to register attendance instantly
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
          >
            Home
          </Button>
        </Stack>
      </Paper>

      {/* Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h3" color="primary">{scanCount}</Typography>
              <Typography variant="body2" color="text.secondary">QR Scans</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h3" color="success.main">{successCount}</Typography>
              <Typography variant="body2" color="text.secondary">Successful</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Camera Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} action={
          <Button color="inherit" size="small" onClick={checkCameraPermissions}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      )}

      {!permissions.camera && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>Camera Access Required</Typography>
          <Typography variant="body2">
            This app needs camera access to scan QR codes. Please allow camera permissions and refresh the page.
          </Typography>
        </Alert>
      )}

      {/* Scanner Interface */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {/* Scanner Status */}
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Chip 
              icon={isScanning ? <CheckCircleIcon /> : <ErrorIcon />}
              label={isScanning ? 'Scanner Active' : 'Scanner Stopped'}
              color={isScanning ? 'success' : 'error'}
              variant="outlined"
            />
            <Stack direction="row" spacing={1}>
              {cameras.length > 1 && (
                <IconButton onClick={switchCamera} disabled={!isScanning} title="Switch Camera">
                  <CameraSwitchIcon />
                </IconButton>
              )}
              <IconButton onClick={toggleTorch} disabled={!isScanning} title="Toggle Flashlight">
                {torchEnabled ? <FlashlightOffIcon /> : <FlashlightOnIcon />}
              </IconButton>
              <IconButton onClick={scanFromFile} title="Scan from Image">
                <UploadIcon />
              </IconButton>
            </Stack>
          </Stack>

          {/* QR Scanner Display */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              minHeight: 350,
              border: '3px solid',
              borderColor: isScanning ? 'success.main' : 'grey.300',
              borderRadius: 2,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'black'
            }}
          >
            <div id="qr-reader-container" style={{ width: '100%', height: '100%' }} />
            
            {!isScanning && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(0,0,0,0.8)',
                  color: 'white'
                }}
              >
                <QrCodeScannerIcon sx={{ fontSize: 64, mb: 2, opacity: 0.7 }} />
                <Typography variant="h6" gutterBottom>Ready to Scan</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, textAlign: 'center', px: 2 }}>
                  Position a QR code within the camera view to scan automatically
                </Typography>
              </Box>
            )}
          </Box>

          {/* Scanner Controls */}
          <Stack direction="row" spacing={2} sx={{ mt: 2, justifyContent: 'center' }}>
            <Button
              variant={isScanning ? "outlined" : "contained"}
              color={isScanning ? "error" : "primary"}
              startIcon={isScanning ? <StopIcon /> : <CameraIcon />}
              onClick={isScanning ? stopScanning : startScanning}
              disabled={!permissions.camera}
              size="large"
            >
              {isScanning ? 'Stop Scanner' : 'Start Scanner'}
            </Button>
            {!isScanning && (
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={startScanning}
                disabled={!permissions.camera}
              >
                Restart
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Scan Result */}
      {scanResult && (
        <Alert 
          severity={
            typeof scanResult === 'object' && scanResult.type 
              ? scanResult.type === 'success' ? 'success' 
              : scanResult.type === 'error' ? 'error' 
              : 'warning'
              : 'info'
          } 
          sx={{ mb: 3 }}
          onClose={() => setScanResult(null)}
        >
          <Typography variant="subtitle2">
            {typeof scanResult === 'object' && scanResult.message 
              ? scanResult.message 
              : 'QR Code Scanned Successfully'}
          </Typography>
          {typeof scanResult === 'object' && scanResult.data && (
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
              {typeof scanResult.data === 'string' 
                ? scanResult.data 
                : JSON.stringify(scanResult.data).slice(0, 100) + '...'}
            </Typography>
          )}
        </Alert>
      )}

      {/* Instructions */}
      <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VisibilityIcon color="primary" />
          How to Use
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" paragraph>
              <strong>1. Allow Camera Access:</strong> Grant permission when prompted
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>2. Scan QR Code:</strong> Point camera at attendance QR code
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>3. Fill Form:</strong> Complete attendance form when it appears
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" paragraph>
              <strong>4. Get Confirmation:</strong> Receive success notification
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>5. Continue Scanning:</strong> Scanner restarts automatically
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Tip:</strong> Make sure QR code is well-lit and in focus
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Hidden div for file scanning */}
      <div id="file-scanner-temp" style={{ display: 'none' }} />
    </Box>
  );
};

export default QRAttendanceScanner;
