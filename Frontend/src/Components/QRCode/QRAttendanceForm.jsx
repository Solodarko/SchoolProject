import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Divider,
  Paper,
  IconButton,
  Snackbar
} from '@mui/material';
import {
  QrCode,
  Person,
  Email,
  Badge,
  School,
  CheckCircle,
  Timer,
  LocationOn,
  Security,
  Send,
  ContentCopy
} from '@mui/icons-material';
import { format, isAfter } from 'date-fns';

const QRAttendanceForm = () => {
  const [qrData, setQrData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    organization: '',
    position: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  useEffect(() => {
    // Parse QR data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    try {
      // Check if we have QR data in URL parameters
      const session = urlParams.get('session');
      const qrId = urlParams.get('qr_id');
      const time = urlParams.get('time');
      const location = urlParams.get('location');
      const metadata = urlParams.get('metadata');
      
      if (qrId) {
        const parsedQrData = {
          id: qrId,
          session: session || 'Attendance Session',
          timestamp: time || new Date().toISOString(),
          location: location || 'Unknown',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
          metadata: metadata ? JSON.parse(metadata) : {}
        };
        
        setQrData(parsedQrData);
        
        // Pre-fill form with URL data if available
        setFormData(prev => ({
          ...prev,
          name: urlParams.get('name') || '',
          email: urlParams.get('email') || '',
          studentId: urlParams.get('student_id') || '',
          organization: urlParams.get('organization') || ''
        }));
      } else {
        setError('Invalid QR code - no attendance data found');
      }
    } catch (err) {
      setError('Failed to parse QR code data: ' + err.message);
    }
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isExpired = () => {
    if (!qrData?.expiresAt) return false;
    return isAfter(new Date(), new Date(qrData.expiresAt));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setShowCopySuccess(true);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isExpired()) {
      setError('This QR code has expired. Please request a new one.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Prepare attendance data
      const attendanceData = {
        qrId: qrData.id,
        session: qrData.session,
        timestamp: new Date().toISOString(),
        attendee: formData,
        metadata: qrData.metadata
      };

      // Create email content
      const emailSubject = `Attendance Confirmation - ${qrData.session}`;
      const emailBody = `
QR ATTENDANCE SUBMISSION

Session: ${qrData.session}
QR Code ID: ${qrData.id}
Submission Time: ${new Date().toLocaleString()}

ATTENDEE INFORMATION:
Name: ${formData.name}
Email: ${formData.email}
Student ID: ${formData.studentId}
Organization: ${formData.organization}
Position: ${formData.position}

Additional Notes: ${formData.notes}

QR VERIFICATION:
Original Time: ${qrData.timestamp}
Location: ${qrData.location}
Security ID: ${qrData.metadata?.checksum?.substring(0, 8) || 'N/A'}
      `.trim();

      // Create mailto link
      const mailtoLink = `mailto:sollybroderrick2003@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      
      // Open email client
      window.location.href = mailtoLink;
      
      setSubmitted(true);
      setSubmitting(false);

    } catch (err) {
      setError('Failed to submit attendance: ' + err.message);
      setSubmitting(false);
    }
  };

  if (error && !qrData) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">QR Code Error</Typography>
          <Typography>{error}</Typography>
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => window.history.back()}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  if (!qrData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <QrCode sx={{ fontSize: 40 }} />
          <Typography variant="h4">QR Attendance Form</Typography>
        </Box>
        <Typography variant="h6">{qrData.session}</Typography>
        <Typography variant="body1">
          {format(new Date(qrData.timestamp), 'EEEE, MMMM do, yyyy • h:mm a')}
        </Typography>
      </Paper>

      {/* QR Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Security color="primary" />
            QR Code Information
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Badge color="action" />
                <Typography variant="body2">
                  <strong>QR ID:</strong> {qrData.id}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => copyToClipboard(qrData.id)}
                  title="Copy QR ID"
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocationOn color="action" />
                <Typography variant="body2">
                  <strong>Location:</strong> {qrData.location}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Timer color={isExpired() ? 'error' : 'success'} />
                <Typography variant="body2">
                  <strong>Valid Until:</strong> {format(new Date(qrData.expiresAt), 'h:mm:ss a')}
                </Typography>
                <Chip 
                  size="small"
                  label={isExpired() ? 'EXPIRED' : 'VALID'}
                  color={isExpired() ? 'error' : 'success'}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Attendance Form */}
      {!submitted ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person color="primary" />
              Attendance Information
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {isExpired() && (
              <Alert severity="error" sx={{ mb: 2 }}>
                This QR code has expired. Please request a new one from the administrator.
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    variant="outlined"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    disabled={submitting || isExpired()}
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    variant="outlined"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    disabled={submitting || isExpired()}
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Student ID"
                    variant="outlined"
                    value={formData.studentId}
                    onChange={(e) => handleInputChange('studentId', e.target.value)}
                    required
                    disabled={submitting || isExpired()}
                    InputProps={{
                      startAdornment: <Badge sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Organization/Department"
                    variant="outlined"
                    value={formData.organization}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                    disabled={submitting || isExpired()}
                    InputProps={{
                      startAdornment: <School sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Position/Role (Optional)"
                    variant="outlined"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    disabled={submitting || isExpired()}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Additional Notes (Optional)"
                    variant="outlined"
                    multiline
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    disabled={submitting || isExpired()}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Send />}
                    disabled={submitting || isExpired() || !formData.name || !formData.email || !formData.studentId}
                    sx={{ py: 1.5 }}
                  >
                    {submitting ? 'Submitting Attendance...' : 'Submit Attendance'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="success.main">
              Attendance Submitted Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your attendance has been recorded for this session.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Session: {qrData.session}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              QR ID: {qrData.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Submitted: {new Date().toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Copy Success Snackbar */}
      <Snackbar
        open={showCopySuccess}
        autoHideDuration={2000}
        onClose={() => setShowCopySuccess(false)}
        message="Copied to clipboard!"
      />
    </Box>
  );
};

export default QRAttendanceForm;
