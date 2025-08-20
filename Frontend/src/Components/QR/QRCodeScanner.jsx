import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Snackbar,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  CircularProgress,
  Chip,
  Divider,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
} from '@mui/icons-material';
import { Html5QrcodeScanner, Html5Qrcode, Html5QrcodeScanType, Html5QrcodeScannerState } from 'html5-qrcode';

const QRCodeScanner = ({ onScanSuccess, onScanError, autoStart = true }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scannerMode, setScannerMode] = useState('camera'); // 'camera' or 'file'
  const [permissions, setPermissions] = useState({ camera: false, checked: false });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  // Check camera permissions
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

  // Auto start scanner
  useEffect(() => {
    if (autoStart && permissions.camera && cameras.length > 0) {
      startScanning();
    }
  }, [autoStart, permissions.camera, cameras]);

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
      showMessage('Error accessing cameras', 'error');
    }
  };

  const startScanning = async () => {
    if (!permissions.camera) {
      showMessage('Camera permission required', 'error');
      return;
    }

    if (isScanning) {
      stopScanning();
      return;
    }

    try {
      setError('');
      setIsScanning(true);

      const cameraId = selectedCamera || cameras[0]?.id;
      if (!cameraId) {
        throw new Error('No camera available');
      }

      html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      };

      await html5QrCodeRef.current.start(
        cameraId,
        config,
        handleScanSuccess,
        handleScanError
      );

      showMessage('Scanner started successfully', 'success');
    } catch (error) {
      console.error('Error starting scanner:', error);
      setError(error.message || 'Failed to start camera scanner');
      setIsScanning(false);
      showMessage('Failed to start scanner', 'error');
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
      showMessage('Scanner stopped', 'info');
    } catch (error) {
      console.error('Error stopping scanner:', error);
      setIsScanning(false);
    }
  };

  const handleScanSuccess = (decodedText) => {
    console.log('QR Code scanned:', decodedText);
    setScanResult(decodedText);
    
    // Try to parse the QR data
    try {
      const url = new URL(decodedText);
      const dataParam = url.searchParams.get('data');
      
      if (dataParam) {
        const qrData = JSON.parse(decodeURIComponent(dataParam));
        if (qrData.type === 'attendance' && qrData.sessionId) {
          onScanSuccess?.(qrData);
          showMessage('QR Code scanned successfully!', 'success');
          return;
        }
      }
    } catch (parseError) {
      console.warn('Could not parse QR data:', parseError);
    }

    // If not our attendance QR code, still pass the raw text
    onScanSuccess?.(decodedText);
    showMessage('QR Code detected', 'success');
  };

  const handleScanError = (error) => {
    // Don't show errors for no QR code found (too noisy)
    if (error && !error.includes('No QR code found')) {
      console.warn('Scan error:', error);
      onScanError?.(error);
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
          showMessage(torchEnabled ? 'Flashlight off' : 'Flashlight on', 'info');
        }
      }
    } catch (error) {
      console.error('Error toggling torch:', error);
      showMessage('Flashlight not supported on this device', 'warning');
    }
  };

  const scanFromFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode('file-scanner');
      const text = await html5QrCode.scanFile(file, true);
      handleScanSuccess(text);
      showMessage('QR Code scanned from image!', 'success');
    } catch (error) {
      console.error('Error scanning file:', error);
      showMessage('No QR code found in the image', 'error');
    }

    // Reset file input
    event.target.value = '';
  };

  const showMessage = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (!permissions.checked) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <QrCodeScannerIcon color="primary" />
        QR Code Scanner
      </Typography>

      {/* Camera Permission Alert */}
      {!permissions.camera && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Camera access is required to scan QR codes. Please allow camera permissions and refresh the page.
        </Alert>
      )}

      {/* Scanner Mode Toggle */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={scannerMode === 'camera'}
                  onChange={(e) => setScannerMode(e.target.checked ? 'camera' : 'file')}
                  disabled={!permissions.camera}
                />
              }
              label="Use Camera"
            />
            <Divider orientation="vertical" flexItem />
            <Button
              variant={scannerMode === 'file' ? 'contained' : 'outlined'}
              startIcon={<UploadIcon />}
              onClick={scanFromFile}
              size="small"
            >
              Scan from Image
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Camera Scanner */}
      {scannerMode === 'camera' && permissions.camera && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            {/* Camera Controls */}
            <Stack direction="row" spacing={1} sx={{ mb: 2 }} justifyContent="center">
              {cameras.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Camera</InputLabel>
                  <Select
                    value={selectedCamera}
                    label="Camera"
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    disabled={isScanning}
                  >
                    {cameras.map((camera) => (
                      <MenuItem key={camera.id} value={camera.id}>
                        {camera.label || `Camera ${camera.id}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Button
                variant={isScanning ? 'contained' : 'outlined'}
                color={isScanning ? 'error' : 'primary'}
                startIcon={isScanning ? <StopIcon /> : <CameraIcon />}
                onClick={startScanning}
                disabled={!permissions.camera || cameras.length === 0}
              >
                {isScanning ? 'Stop' : 'Start'} Scanner
              </Button>

              {cameras.length > 1 && (
                <IconButton
                  onClick={switchCamera}
                  disabled={!isScanning}
                  title="Switch Camera"
                >
                  <CameraSwitchIcon />
                </IconButton>
              )}

              <IconButton
                onClick={toggleTorch}
                disabled={!isScanning}
                title="Toggle Flashlight"
                color={torchEnabled ? 'primary' : 'default'}
              >
                {torchEnabled ? <FlashlightOnIcon /> : <FlashlightOffIcon />}
              </IconButton>
            </Stack>

            {/* Scanner Display */}
            <Paper
              elevation={2}
              sx={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 2,
                minHeight: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.100',
              }}
            >
              <div id="qr-reader" style={{ width: '100%' }} />
              
              {!isScanning && !error && (
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <QrCodeScannerIcon sx={{ fontSize: 64, color: 'grey.400', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Click "Start Scanner" to begin scanning QR codes
                  </Typography>
                </Box>
              )}

              {error && (
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 1 }} />
                  <Typography variant="body2" color="error">
                    {error}
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={startScanning}
                    sx={{ mt: 2 }}
                  >
                    Try Again
                  </Button>
                </Box>
              )}
            </Paper>

            {/* Scanner Status */}
            {isScanning && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Chip
                  icon={<CircularProgress size={16} />}
                  label="Scanning for QR codes..."
                  color="primary"
                  variant="outlined"
                />
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* File Scanner Hidden Elements */}
      <div id="file-scanner" style={{ display: 'none' }} />
      <input
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />

      {/* Scan Result */}
      {scanResult && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon color="success" />
              Scan Result
            </Typography>
            <Paper sx={{ p: 2, bgcolor: 'grey.50', wordBreak: 'break-all' }}>
              <Typography variant="body2" component="code">
                {scanResult}
              </Typography>
            </Paper>
          </CardContent>
        </Card>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QRCodeScanner;
