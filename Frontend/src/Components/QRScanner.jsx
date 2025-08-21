import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  Box, 
  Typography, 
  Button, 
  Alert,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  QrCode as QrCodeIcon, 
  Stop as StopIcon, 
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const QRScanner = ({ onScanResult, onError, open, onClose }) => {
  const [scanner, setScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    if (open && !scanner) {
      initializeScanner();
    }

    return () => {
      if (scanner) {
        cleanupScanner();
      }
    };
  }, [open]);

  const initializeScanner = () => {
    try {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-scanner-container",
        { 
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          supportedScanTypes: [1] // Only QR codes
        },
        false
      );

      html5QrcodeScanner.render(
        (decodedText, decodedResult) => {
          console.log('QR Code scanned:', decodedText);
          if (onScanResult) {
            onScanResult(decodedText, decodedResult);
          }
          // Don't automatically stop scanning to allow continuous scanning
        },
        (error) => {
          // This is called for every scan attempt, so we only log actual errors
          if (error !== 'QR code parse error, error = NotFoundException: No MultiFormat Readers were able to detect the code.') {
            console.warn('QR Scanner error:', error);
          }
        }
      );

      setScanner(html5QrcodeScanner);
      setIsScanning(true);
      setError('');
    } catch (err) {
      console.error('Failed to initialize QR scanner:', err);
      setError('Failed to initialize QR scanner. Please check camera permissions.');
      if (onError) {
        onError(err);
      }
    }
  };

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

  const handleClose = () => {
    cleanupScanner();
    setError('');
    if (onClose) {
      onClose();
    }
  };

  const handleRetry = () => {
    cleanupScanner();
    setTimeout(() => {
      initializeScanner();
    }, 100);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrCodeIcon color="primary" />
          <Typography variant="h6">
            QR Code Scanner
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Position the QR code within the scanner frame
          </Typography>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleRetry}
                startIcon={<RefreshIcon />}
              >
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box
              id="qr-scanner-container"
              ref={scannerRef}
              sx={{
                width: '100%',
                minHeight: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '& #qr-scanner-container__dashboard': {
                  display: 'none' // Hide the default dashboard
                }
              }}
            >
              {!isScanning && !error && (
                <Box sx={{ textAlign: 'center' }}>
                  <QrCodeIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                  <Typography variant="body2" color="textSecondary">
                    Initializing camera...
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Make sure to allow camera access when prompted by your browser.
            The scanner will automatically detect QR codes in the camera view.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Button
          onClick={handleRetry}
          startIcon={<RefreshIcon />}
          disabled={!scanner && !error}
        >
          Restart Scanner
        </Button>
        
        <Button
          onClick={handleClose}
          variant="contained"
          startIcon={<StopIcon />}
        >
          Close Scanner
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QRScanner;
