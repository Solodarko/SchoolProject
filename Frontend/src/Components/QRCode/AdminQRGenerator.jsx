import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  QrCode,
  Refresh,
  Download,
  Share,
  Timer,
  Security,
  Visibility,
  Print,
  History,
  Info,
  CheckCircle,
  Warning,
  Person,
  Badge
} from '@mui/icons-material';
import QRCode from 'react-qr-code';
import { format, addMinutes, differenceInSeconds } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const AdminQRGenerator = ({ backendUrl, showNotifications, onNotification }) => {
  // Get auth context for user identity
  const { getUserIdentity, isAuthenticated, user, student, displayName } = useAuth();
  
  // QR Code state
  const [currentQRData, setCurrentQRData] = useState(null);
  const [nextQRData, setNextQRData] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [qrHistory, setQrHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Dialog states
  const [historyDialog, setHistoryDialog] = useState(false);
  const [infoDialog, setInfoDialog] = useState(false);
  
  // Settings
  const [autoRotate, setAutoRotate] = useState(true);
  const [showTimer, setShowTimer] = useState(true);
  
  // Generate QR code data with user identity
  const generateQRData = useCallback((timestamp = Date.now()) => {
    const qrId = `attendance_${timestamp}`;
    const expiresAt = addMinutes(new Date(timestamp), 5);
    const userIdentity = getUserIdentity();
    
    const qrData = {
      id: qrId,
      type: 'attendance_check',
      timestamp: timestamp,
      expiresAt: expiresAt.toISOString(),
      checksum: btoa(`${qrId}_${timestamp}`), // Simple checksum for validation
      location: 'admin_dashboard',
      // Automatically include user identity for logged-in users
      user: userIdentity ? {
        userId: userIdentity.userId,
        username: userIdentity.username,
        email: userIdentity.email,
        role: userIdentity.role,
        studentId: userIdentity.studentId,
        firstName: userIdentity.firstName,
        lastName: userIdentity.lastName,
        fullName: userIdentity.fullName,
        department: userIdentity.department,
        hasStudentRecord: userIdentity.hasStudentRecord
      } : null,
      // For backward compatibility
      adminId: userIdentity?.userId || 'admin'
    };
    
    return qrData;
  }, [getUserIdentity]);

  // Initialize QR code
  const initializeQR = useCallback(() => {
    const now = Date.now();
    const currentData = generateQRData(now);
    const nextData = generateQRData(now + (5 * 60 * 1000)); // Next QR in 5 minutes
    
    setCurrentQRData(currentData);
    setNextQRData(nextData);
    setTimeRemaining(300);
    
    // Add to history
    setQrHistory(prev => [{
      ...currentData,
      generatedAt: new Date(),
      status: 'active'
    }, ...prev.slice(0, 9)]); // Keep last 10 entries
    
    if (onNotification) {
      onNotification('QR Code generated successfully', 'success');
    }
  }, [generateQRData, onNotification]);

  // Rotate QR code
  const rotateQR = useCallback(() => {
    if (!isActive) return;
    
    // Move next QR to current and generate new next QR
    const newCurrentData = nextQRData;
    const newNextData = generateQRData(Date.now() + (5 * 60 * 1000));
    
    setCurrentQRData(newCurrentData);
    setNextQRData(newNextData);
    setTimeRemaining(300);
    
    // Update history - mark previous as expired and add new
    setQrHistory(prev => {
      const updated = prev.map(item => 
        item.status === 'active' ? { ...item, status: 'expired' } : item
      );
      return [{
        ...newCurrentData,
        generatedAt: new Date(),
        status: 'active'
      }, ...updated.slice(0, 9)];
    });
    
    if (onNotification) {
      onNotification('QR Code rotated - new code generated', 'info');
    }
  }, [nextQRData, generateQRData, isActive, onNotification]);

  // Timer effect
  useEffect(() => {
    if (!isActive || !autoRotate) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          rotateQR();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, autoRotate, rotateQR]);

  // Start QR generation
  const startQRGeneration = () => {
    setLoading(true);
    setTimeout(() => {
      initializeQR();
      setIsActive(true);
      setLoading(false);
    }, 1000);
  };

  // Stop QR generation
  const stopQRGeneration = () => {
    setIsActive(false);
    setCurrentQRData(null);
    setNextQRData(null);
    setTimeRemaining(300);
    
    // Mark all active QRs as stopped
    setQrHistory(prev => 
      prev.map(item => 
        item.status === 'active' ? { ...item, status: 'stopped' } : item
      )
    );
    
    if (onNotification) {
      onNotification('QR Code generation stopped', 'warning');
    }
  };

  // Manual refresh
  const manualRefresh = () => {
    if (isActive) {
      rotateQR();
    } else {
      initializeQR();
      setIsActive(true);
    }
  };

  // Download QR code
  const downloadQR = () => {
    if (!currentQRData) return;
    
    const svg = document.getElementById('admin-qr-code');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `attendance_qr_${format(new Date(), 'yyyyMMdd_HHmmss')}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  // Format time remaining
  const formatTimeRemaining = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get QR status color
  const getStatusColor = (timeLeft) => {
    if (timeLeft > 120) return 'success'; // Green
    if (timeLeft > 60) return 'warning';  // Orange
    return 'error'; // Red
  };

  return (
    <Box>
      {/* Main QR Generator Card */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <QrCode />
              Real-Time QR Code Generator
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="View History">
                <IconButton onClick={() => setHistoryDialog(true)}>
                  <History />
                </IconButton>
              </Tooltip>
              <Tooltip title="Information">
                <IconButton onClick={() => setInfoDialog(true)}>
                  <Info />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* QR Code Display */}
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'center' }}>
                {currentQRData ? (
                  <Box>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'white', 
                      borderRadius: 2, 
                      display: 'inline-block',
                      boxShadow: 2,
                      border: (theme) => `3px solid ${theme.palette[getStatusColor(timeRemaining)]?.main || theme.palette.primary.main}`
                    }}>
                      <QRCode
                        id="admin-qr-code"
                        value={JSON.stringify(currentQRData)}
                        size={200}
                        level="M"
                        includeMargin={true}
                      />
                    </Box>
                    
                    {showTimer && (
                      <Box sx={{ mt: 2 }}>
                        <Chip
                          icon={<Timer />}
                          label={`Expires in ${formatTimeRemaining(timeRemaining)}`}
                          color={getStatusColor(timeRemaining)}
                          size="large"
                          sx={{ fontSize: '1.1rem', px: 2 }}
                        />
                      </Box>
                    )}
                    
                    <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                      QR ID: {currentQRData.id}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ 
                    p: 4, 
                    border: '2px dashed', 
                    borderColor: 'divider', 
                    borderRadius: 2,
                    minHeight: 250,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <QrCode sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No QR Code Generated
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Click &quot;Start Generation&quot; to begin
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Controls and Status */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Status Alert */}
                {isActive ? (
                  <Alert 
                    severity="success" 
                    icon={<CheckCircle />}
                    action={
                      <Button color="inherit" size="small" onClick={stopQRGeneration}>
                        Stop
                      </Button>
                    }
                  >
                    <Typography variant="subtitle2">QR Generation Active</Typography>
                    <Typography variant="body2">
                      Code rotates every 5 minutes automatically
                    </Typography>
                  </Alert>
                ) : (
                  <Alert severity="info">
                    <Typography variant="subtitle2">QR Generation Stopped</Typography>
                    <Typography variant="body2">
                      Start generation to create attendance QR codes
                    </Typography>
                  </Alert>
                )}

                {/* User Identity Info */}
                {isAuthenticated && (
                  <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person color="primary" />
                      User Identity in QR Codes
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="body2">
                        <strong>Username:</strong> {user?.username}
                      </Typography>
                      {student && (
                        <>
                          <Typography variant="body2">
                            <strong>Student ID:</strong> {student.studentId}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Full Name:</strong> {student.fullName}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Department:</strong> {student.department}
                          </Typography>
                        </>
                      )}
                      <Chip 
                        size="small" 
                        icon={<Badge />}
                        label={student ? 'Student Record Found' : 'No Student Record'}
                        color={student ? 'success' : 'warning'}
                        sx={{ mt: 1, alignSelf: 'flex-start' }}
                      />
                    </Box>
                  </Box>
                )}

                {/* Settings */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Settings</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoRotate}
                          onChange={(e) => setAutoRotate(e.target.checked)}
                          disabled={!isActive}
                        />
                      }
                      label="Auto-rotate every 5 minutes"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showTimer}
                          onChange={(e) => setShowTimer(e.target.checked)}
                        />
                      }
                      label="Show countdown timer"
                    />
                  </Box>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {!isActive ? (
                    <Button
                      variant="contained"
                      startIcon={loading ? <CircularProgress size={20} /> : <QrCode />}
                      onClick={startQRGeneration}
                      disabled={loading}
                      fullWidth
                    >
                      {loading ? 'Generating...' : 'Start Generation'}
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={manualRefresh}
                        sx={{ flex: 1 }}
                      >
                        Refresh Now
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={stopQRGeneration}
                        sx={{ flex: 1 }}
                      >
                        Stop
                      </Button>
                    </>
                  )}
                </Box>

                {currentQRData && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={downloadQR}
                      sx={{ flex: 1 }}
                    >
                      Download
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Share />}
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(currentQRData))}
                      sx={{ flex: 1 }}
                    >
                      Copy Data
                    </Button>
                  </Box>
                )}

                {/* Next QR Preview */}
                {nextQRData && isActive && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Visibility />
                      Next QR Code Preview
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {nextQRData.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Activates in: {formatTimeRemaining(timeRemaining)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* History Dialog */}
      <Dialog open={historyDialog} onClose={() => setHistoryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>QR Code History</DialogTitle>
        <DialogContent>
          {qrHistory.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No QR codes generated yet
            </Typography>
          ) : (
            <List>
              {qrHistory.map((qr, index) => (
                <React.Fragment key={qr.id}>
                  <ListItem>
                    <ListItemIcon>
                      {qr.status === 'active' ? (
                        <CheckCircle color="success" />
                      ) : qr.status === 'expired' ? (
                        <Timer color="warning" />
                      ) : (
                        <Warning color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={qr.id}
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            Generated: {format(qr.generatedAt, 'MMM dd, yyyy HH:mm:ss')}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span" color="text.secondary">
                            Status: {qr.status.toUpperCase()}
                          </Typography>
                          {qr.status === 'active' && (
                            <>
                              <br />
                              <Typography variant="body2" component="span" color="success.main">
                                Expires: {format(new Date(qr.expiresAt), 'HH:mm:ss')}
                              </Typography>
                            </>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                  {index < qrHistory.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Information Dialog */}
      <Dialog open={infoDialog} onClose={() => setInfoDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>QR Code Information</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            This QR code system generates time-based attendance codes that automatically rotate every 5 minutes for security.
          </Typography>
          
          <Typography variant="subtitle2" gutterBottom>Features:</Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="• Auto-rotation every 5 minutes" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Unique timestamp-based IDs" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Built-in expiration system" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Download and sharing capabilities" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Complete generation history" />
            </ListItem>
          </List>

          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Security:</Typography>
          <Typography variant="body2" color="text.secondary">
            Each QR code contains a checksum and expiration timestamp. The system works with your existing geolocation and geofencing features to ensure secure attendance tracking.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminQRGenerator;
