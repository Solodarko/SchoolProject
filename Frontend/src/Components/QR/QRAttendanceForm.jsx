import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Snackbar,
  Paper,
  Stack,
  CircularProgress,
  Chip,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  QrCodeScanner as QrCodeIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import axios from 'axios';

const QRAttendanceForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [qrData, setQrData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    organization: '',
    position: '',
    notes: '',
    agreeToTerms: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Parse QR data from URL parameters
  useEffect(() => {
    const dataParam = searchParams.get('data');
    
    if (dataParam) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(dataParam));
        
        if (parsedData.type === 'attendance' && parsedData.sessionId) {
          // Check if QR code is still valid
          const now = new Date();
          const validUntil = new Date(parsedData.validUntil);
          
          if (validUntil < now) {
            setError('This QR code has expired. Please contact the organizer for a new one.');
          } else {
            setQrData(parsedData);
          }
        } else {
          setError('Invalid QR code format.');
        }
      } catch (parseError) {
        console.error('Error parsing QR data:', parseError);
        setError('Invalid QR code data.');
      }
    } else {
      setError('No QR code data found. Please scan a valid attendance QR code.');
    }

    // Get user location (optional)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('User location obtained');
        },
        (error) => {
          console.warn('Location access denied:', error);
        }
      );
    }
  }, [searchParams]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.name.trim()) {
      errors.push('Name is required');
    }
    
    if (!formData.email.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (!formData.agreeToTerms) {
      errors.push('You must agree to the terms and conditions');
    }
    
    return errors;
  };

  const submitAttendance = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      showMessage(validationErrors[0], 'error');
      return;
    }

    setSubmitting(true);
    
    try {
      // Get device info
      const deviceInfo = `${navigator.userAgent} - ${window.screen.width}x${window.screen.height}`;
      
      // Get location if available
      let location = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        } catch (locationError) {
          console.warn('Could not get location:', locationError);
        }
      }

      const attendanceData = {
        sessionId: qrData.sessionId,
        qrCodeId: qrData.qrCodeId,
        sessionTitle: qrData.sessionTitle,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        organization: formData.organization.trim(),
        position: formData.position.trim(),
        notes: formData.notes.trim(),
        deviceInfo,
        location,
      };

      const response = await axios.post('http://localhost:5000/api/qr-attendance/record', attendanceData);

      if (response.data.success) {
        setSuccess(true);
        showMessage('Attendance recorded successfully!', 'success');
      } else {
        throw new Error(response.data.error || 'Failed to record attendance');
      }
    } catch (error) {
      console.error('Error submitting attendance:', error);
      
      if (error.response?.status === 409) {
        showMessage('You have already registered for this session.', 'warning');
      } else {
        showMessage(error.response?.data?.error || 'Failed to record attendance. Please try again.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const showMessage = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const goHome = () => {
    navigate('/');
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error && !qrData) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Card sx={{ width: '100%' }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="error">
              Invalid QR Code
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {error}
            </Typography>
            <Button variant="contained" onClick={goHome}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Success state
  if (success) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Card sx={{ width: '100%' }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="success.main">
              Attendance Recorded!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Thank you for attending "{qrData?.sessionTitle}". Your attendance has been successfully recorded.
            </Typography>
            <Stack spacing={2} sx={{ mt: 3 }}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Name:</Typography>
                    <Typography variant="body2" fontWeight="bold">{formData.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Email:</Typography>
                    <Typography variant="body2" fontWeight="bold">{formData.email}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Recorded at:</Typography>
                    <Typography variant="body2" fontWeight="bold">{new Date().toLocaleString()}</Typography>
                  </Grid>
                </Grid>
              </Paper>
              <Button variant="contained" onClick={goHome}>
                Return Home
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Main form
  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <QrCodeIcon />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight="bold">
                Register Attendance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {qrData?.sessionTitle}
              </Typography>
            </Box>
            <Chip
              icon={<CheckCircleIcon />}
              label="Valid"
              color="success"
              variant="outlined"
            />
          </Stack>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ScheduleIcon fontSize="small" color="primary" />
                <Typography variant="body2">
                  Valid until: {new Date(qrData?.validUntil).toLocaleString()}
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={1} alignItems="center">
                <EventIcon fontSize="small" color="primary" />
                <Typography variant="body2">
                  Session ID: {qrData?.sessionId?.slice(0, 8)}...
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Registration Form */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Information
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Please fill in your details to register your attendance.
          </Typography>

          <Stack spacing={3}>
            {/* Required Fields */}
            <TextField
              label="Full Name"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter your full name"
              InputProps={{
                startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />

            <TextField
              label="Email Address"
              type="email"
              fullWidth
              required
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email address"
              InputProps={{
                startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />

            {/* Optional Fields */}
            <Divider />
            <Typography variant="subtitle2" color="text.secondary">
              Optional Information
            </Typography>

            <TextField
              label="Phone Number"
              fullWidth
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="Enter your phone number"
              InputProps={{
                startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Organization"
                  fullWidth
                  value={formData.organization}
                  onChange={(e) => handleInputChange('organization', e.target.value)}
                  placeholder="Company or organization"
                  InputProps={{
                    startAdornment: <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Position"
                  fullWidth
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  placeholder="Job title or role"
                  InputProps={{
                    startAdornment: <WorkIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
            </Grid>

            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional information (optional)"
            />

            {/* Terms and Conditions */}
            <Divider />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.agreeToTerms}
                  onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                  required
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the collection of my personal information for attendance tracking purposes.
                </Typography>
              }
            />

            {/* Submit Button */}
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={submitAttendance}
              disabled={submitting || !formData.name || !formData.email || !formData.agreeToTerms}
              sx={{ py: 1.5, mt: 2 }}
            >
              {submitting ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Recording Attendance...
                </>
              ) : (
                <>
                  <CheckCircleIcon sx={{ mr: 1 }} />
                  Record My Attendance
                </>
              )}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QRAttendanceForm;
