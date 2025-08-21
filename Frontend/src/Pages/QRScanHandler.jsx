import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  Button,
  Chip
} from '@mui/material';
import {
  QrCodeScanner as QrCodeIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Phone as PhoneIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import QRAttendanceModal from '../Components/QR/QRAttendanceModal';

const QRScanHandler = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrData, setQrData] = useState(null);
  const [processedResult, setProcessedResult] = useState(null);
  const attendanceModalRef = useRef(null);

  // Initialize attendance modal
  useEffect(() => {
    attendanceModalRef.current = new QRAttendanceModal();
  }, []);

  // Process QR code data when component mounts
  useEffect(() => {
    processQRCode();
  }, [location, searchParams]);

  const processQRCode = async () => {
    try {
      setLoading(true);
      setError('');

      // Try to get QR data from URL parameters
      let qrCodeData = null;

      // Method 1: From 'data' parameter
      const dataParam = searchParams.get('data');
      if (dataParam) {
        try {
          qrCodeData = JSON.parse(decodeURIComponent(dataParam));
        } catch (parseError) {
          console.warn('Failed to parse data parameter:', parseError);
        }
      }

      // Method 2: From 'qr' parameter  
      if (!qrCodeData) {
        const qrParam = searchParams.get('qr');
        if (qrParam) {
          try {
            qrCodeData = JSON.parse(decodeURIComponent(qrParam));
          } catch (parseError) {
            console.warn('Failed to parse qr parameter:', parseError);
          }
        }
      }

      // Method 3: From fragment/hash
      if (!qrCodeData && window.location.hash) {
        try {
          const hashData = window.location.hash.substring(1);
          qrCodeData = JSON.parse(decodeURIComponent(hashData));
        } catch (parseError) {
          console.warn('Failed to parse hash data:', parseError);
        }
      }

      if (!qrCodeData) {
        throw new Error('No QR code data found in URL. Please scan a valid attendance QR code.');
      }

      console.log('📱 QR Code data received:', qrCodeData);

      // Validate that this is an attendance QR code
      if (!qrCodeData.type || qrCodeData.type !== 'attendance_check') {
        throw new Error('This QR code is not for attendance tracking.');
      }

      // Check if QR code has the enhanced attendance configuration
      if (!qrCodeData.attendanceConfig || !qrCodeData.attendanceConfig.showForm) {
        throw new Error('This QR code does not support the attendance form feature.');
      }

      // Check if QR code has expired
      if (qrCodeData.expiresAt) {
        const expirationDate = new Date(qrCodeData.expiresAt);
        if (expirationDate < new Date()) {
          throw new Error('This QR code has expired. Please scan a new one.');
        }
      }

      setQrData(qrCodeData);
      setLoading(false);

      // Automatically show the attendance form after a short delay
      setTimeout(() => {
        showAttendanceForm(qrCodeData);
      }, 1000);

    } catch (error) {
      console.error('❌ Error processing QR code:', error);
      setError(error.message || 'Invalid QR code');
      setLoading(false);
    }
  };

  const showAttendanceForm = async (qrCodeData) => {
    try {
      console.log('📋 Showing attendance form for mobile device');
      
      await attendanceModalRef.current.showAttendanceForm(
        qrCodeData,
        (responseData) => {
          // Success callback
          console.log('✅ Attendance recorded successfully:', responseData);
          setProcessedResult({
            success: true,
            message: 'Attendance recorded successfully!',
            data: responseData
          });
        },
        (error) => {
          // Error callback
          console.error('❌ Error recording attendance:', error);
          setProcessedResult({
            success: false,
            message: typeof error === 'string' ? error : 'Failed to record attendance',
            error: error
          });
        }
      );
    } catch (error) {
      console.error('Error showing attendance form:', error);
      setProcessedResult({
        success: false,
        message: 'Unable to display attendance form',
        error: error.message
      });
    }
  };

  const retryProcess = () => {
    setProcessedResult(null);
    processQRCode();
  };

  const refreshPage = () => {
    window.location.reload();
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'primary.main',
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)'
      }}>
        <Card sx={{ maxWidth: 400, mx: 2, textAlign: 'center' }}>
          <CardContent sx={{ p: 4 }}>
            <QrCodeIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Processing QR Code
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Please wait while we process your attendance QR code...
            </Typography>
            <CircularProgress sx={{ mt: 2 }} />
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'error.main',
        background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
        p: 2
      }}>
        <Card sx={{ maxWidth: 500, textAlign: 'center' }}>
          <CardContent sx={{ p: 4 }}>
            <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="error">
              Invalid QR Code
            </Typography>
            <Typography variant="body1" paragraph>
              {error}
            </Typography>
            <Stack spacing={2} sx={{ mt: 3 }}>
              <Button 
                variant="contained" 
                onClick={retryProcess}
                startIcon={<RefreshIcon />}
              >
                Try Again
              </Button>
              <Typography variant="caption" color="text.secondary">
                Make sure you're scanning a valid attendance QR code
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Success state - QR code processed, waiting for form interaction
  if (qrData && !processedResult) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'success.main',
        background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
        p: 2
      }}>
        <Card sx={{ maxWidth: 500, textAlign: 'center' }}>
          <CardContent sx={{ p: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              📱 QR Code Scanned Successfully!
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50', textAlign: 'left' }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                📋 {qrData.attendanceConfig.sessionTitle}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Chip size="small" label="✅ Form Enabled" color="success" />
                <Chip size="small" label="📱 Mobile Ready" color="primary" />
                <Chip size="small" label="🔒 Secure" color="info" />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Generated by: {qrData.generatedBy?.username || 'Admin'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expires: {qrData.expiresAt ? new Date(qrData.expiresAt).toLocaleString() : 'No expiration'}
              </Typography>
            </Paper>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                📋 The attendance form should appear automatically.
                If it doesn't show, tap the button below.
              </Typography>
            </Alert>

            <Button 
              variant="contained" 
              size="large"
              onClick={() => showAttendanceForm(qrData)}
              startIcon={<QrCodeIcon />}
              fullWidth
              sx={{ mb: 2 }}
            >
              Show Attendance Form
            </Button>

            <Typography variant="caption" color="text.secondary">
              Complete the form to register your attendance
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Result state - after form submission
  if (processedResult) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: processedResult.success ? 'success.main' : 'error.main',
        background: processedResult.success 
          ? 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)'
          : 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
        p: 2
      }}>
        <Card sx={{ maxWidth: 500, textAlign: 'center' }}>
          <CardContent sx={{ p: 4 }}>
            {processedResult.success ? (
              <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            ) : (
              <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            )}
            
            <Typography variant="h5" gutterBottom color={processedResult.success ? 'success.main' : 'error.main'}>
              {processedResult.success ? '🎉 Attendance Recorded!' : '❌ Error Occurred'}
            </Typography>
            
            <Typography variant="body1" paragraph>
              {processedResult.message}
            </Typography>

            {processedResult.success && processedResult.data && (
              <Paper sx={{ p: 3, mb: 3, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'success.800' }}>
                  📊 Attendance Details:
                </Typography>
                <Stack spacing={1} sx={{ textAlign: 'left' }}>
                  {processedResult.data.studentId && (
                    <Typography variant="body2">
                      <strong>Student ID:</strong> {processedResult.data.studentId}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    <strong>Date:</strong> {new Date().toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Time:</strong> {new Date().toLocaleTimeString()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> Present ✅
                  </Typography>
                  {processedResult.data.attendanceId && (
                    <Typography variant="body2">
                      <strong>Reference:</strong> {String(processedResult.data.attendanceId).slice(-8)}
                    </Typography>
                  )}
                </Stack>
              </Paper>
            )}

            <Stack spacing={2}>
              <Button 
                variant="contained" 
                onClick={refreshPage}
                startIcon={<CheckCircleIcon />}
                size="large"
              >
                Done
              </Button>
              <Typography variant="caption" color="text.secondary">
                {processedResult.success 
                  ? 'Thank you for registering your attendance!' 
                  : 'Please try again or contact support if the problem persists.'
                }
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return null;
};

export default QRScanHandler;
