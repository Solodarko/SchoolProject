import React, { useState, useRef } from 'react';
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Tooltip,
} from '@mui/material';
import {
  QrCode2 as QrCodeIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';

const QRCodeGenerator = () => {
  const [formData, setFormData] = useState({
    sessionTitle: '',
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    options: {
      width: 400,
      margin: 2,
      darkColor: '#000000',
      lightColor: '#FFFFFF',
    },
  });
  
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const qrCanvasRef = useRef(null);

  const handleInputChange = (field, value) => {
    if (field.startsWith('options.')) {
      const optionField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        options: {
          ...prev.options,
          [optionField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const generateQRCode = async () => {
    if (!formData.sessionTitle.trim()) {
      showMessage('Please enter a session title', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/qr-attendance/generate', {
        sessionTitle: formData.sessionTitle,
        validUntil: formData.validUntil.toISOString(),
        options: formData.options,
      });

      if (response.data.success) {
        setQrData(response.data.data);
        showMessage('QR Code generated successfully!', 'success');
      } else {
        showMessage('Failed to generate QR Code', 'error');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      showMessage(error.response?.data?.error || 'Error generating QR code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrData?.qrCodeDataURL) return;

    const link = document.createElement('a');
    link.download = `QR-${qrData.sessionTitle.replace(/\s+/g, '-')}-${Date.now()}.png`;
    link.href = qrData.qrCodeDataURL;
    link.click();
    showMessage('QR Code downloaded successfully!', 'success');
  };

  const copyToClipboard = async (text, type = 'text') => {
    try {
      if (type === 'image' && qrData?.qrCodeDataURL) {
        // Convert data URL to blob
        const response = await fetch(qrData.qrCodeDataURL);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
        showMessage('QR Code image copied to clipboard!', 'success');
      } else {
        await navigator.clipboard.writeText(text);
        showMessage(`${type === 'url' ? 'URL' : 'Text'} copied to clipboard!`, 'success');
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      showMessage('Failed to copy to clipboard', 'error');
    }
  };

  const printQRCode = () => {
    if (!qrData) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${qrData.sessionTitle}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              text-align: center;
            }
            .qr-container {
              border: 2px solid #000;
              padding: 20px;
              margin: 20px auto;
              width: fit-content;
            }
            .qr-title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .qr-info {
              font-size: 14px;
              color: #666;
              margin-bottom: 15px;
            }
            .qr-image {
              display: block;
              margin: 0 auto;
            }
            .qr-url {
              word-break: break-all;
              font-size: 10px;
              margin-top: 15px;
              color: #888;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="qr-title">${qrData.sessionTitle}</div>
            <div class="qr-info">Scan to Register Attendance</div>
            <img src="${qrData.qrCodeDataURL}" alt="QR Code" class="qr-image" />
            <div class="qr-url">
              Valid until: ${new Date(qrData.validUntil).toLocaleDateString()}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const shareQRCode = async () => {
    if (!qrData) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: qrData.sessionTitle,
          text: `Join the attendance session: ${qrData.sessionTitle}`,
          url: qrData.scanUrl,
        });
        showMessage('Shared successfully!', 'success');
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      copyToClipboard(qrData.scanUrl, 'url');
    }
  };

  const showMessage = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const resetForm = () => {
    setFormData({
      sessionTitle: '',
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      options: {
        width: 400,
        margin: 2,
        darkColor: '#000000',
        lightColor: '#FFFFFF',
      },
    });
    setQrData(null);
  };

  const isValidSession = qrData && new Date(qrData.validUntil) > new Date();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrCodeIcon color="primary" />
          QR Code Generator
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Generate QR codes for attendance tracking sessions
        </Typography>

        <Grid container spacing={3}>
          {/* Form Section */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Session Details
                </Typography>

                <Stack spacing={3}>
                  <TextField
                    label="Session Title"
                    fullWidth
                    value={formData.sessionTitle}
                    onChange={(e) => handleInputChange('sessionTitle', e.target.value)}
                    placeholder="e.g., Weekly Team Meeting, Training Session"
                    required
                  />

                  <DateTimePicker
                    label="Valid Until"
                    value={formData.validUntil}
                    onChange={(date) => handleInputChange('validUntil', date)}
                    renderInput={(props) => <TextField {...props} fullWidth />}
                    minDateTime={new Date()}
                  />

                  {/* Advanced Options */}
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showAdvanced}
                          onChange={(e) => setShowAdvanced(e.target.checked)}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SettingsIcon fontSize="small" />
                          Advanced Options
                        </Box>
                      }
                    />

                    {showAdvanced && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="QR Code Size (px)"
                              type="number"
                              fullWidth
                              size="small"
                              value={formData.options.width}
                              onChange={(e) => handleInputChange('options.width', parseInt(e.target.value))}
                              inputProps={{ min: 200, max: 800 }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="Margin"
                              type="number"
                              fullWidth
                              size="small"
                              value={formData.options.margin}
                              onChange={(e) => handleInputChange('options.margin', parseInt(e.target.value))}
                              inputProps={{ min: 0, max: 10 }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="Foreground Color"
                              type="color"
                              fullWidth
                              size="small"
                              value={formData.options.darkColor}
                              onChange={(e) => handleInputChange('options.darkColor', e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="Background Color"
                              type="color"
                              fullWidth
                              size="small"
                              value={formData.options.lightColor}
                              onChange={(e) => handleInputChange('options.lightColor', e.target.value)}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </Box>

                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      onClick={generateQRCode}
                      disabled={loading || !formData.sessionTitle.trim()}
                      startIcon={loading ? <CircularProgress size={20} /> : <QrCodeIcon />}
                      sx={{ flex: 1 }}
                    >
                      {loading ? 'Generating...' : 'Generate QR Code'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={resetForm}
                      startIcon={<RefreshIcon />}
                    >
                      Reset
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* QR Code Display Section */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Generated QR Code
                </Typography>

                {qrData ? (
                  <Stack spacing={2}>
                    {/* Status Badge */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip
                        icon={<CheckCircleIcon />}
                        label={isValidSession ? 'Active' : 'Expired'}
                        color={isValidSession ? 'success' : 'error'}
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Session ID: {qrData.sessionId.slice(0, 8)}...
                      </Typography>
                    </Box>

                    {/* QR Code Image */}
                    <Paper
                      elevation={2}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        bgcolor: formData.options.lightColor,
                      }}
                    >
                      <img
                        src={qrData.qrCodeDataURL}
                        alt="QR Code"
                        style={{ maxWidth: '100%', height: 'auto' }}
                      />
                    </Paper>

                    {/* Session Info */}
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {qrData.sessionTitle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Valid until: {new Date(qrData.validUntil).toLocaleString()}
                      </Typography>
                    </Box>

                    <Divider />

                    {/* Action Buttons */}
                    <Grid container spacing={1}>
                      <Grid item xs={6} sm={3}>
                        <Tooltip title="Download QR Code">
                          <Button
                            variant="outlined"
                            fullWidth
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={downloadQRCode}
                          >
                            Download
                          </Button>
                        </Tooltip>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Tooltip title="Print QR Code">
                          <Button
                            variant="outlined"
                            fullWidth
                            size="small"
                            startIcon={<PrintIcon />}
                            onClick={printQRCode}
                          >
                            Print
                          </Button>
                        </Tooltip>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Tooltip title="Share URL">
                          <Button
                            variant="outlined"
                            fullWidth
                            size="small"
                            startIcon={<ShareIcon />}
                            onClick={shareQRCode}
                          >
                            Share
                          </Button>
                        </Tooltip>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Tooltip title="Copy URL">
                          <Button
                            variant="outlined"
                            fullWidth
                            size="small"
                            startIcon={<CopyIcon />}
                            onClick={() => copyToClipboard(qrData.scanUrl, 'url')}
                          >
                            Copy
                          </Button>
                        </Tooltip>
                      </Grid>
                    </Grid>

                    {/* Preview Button */}
                    <Button
                      variant="text"
                      startIcon={<VisibilityIcon />}
                      onClick={() => setPreviewDialog(true)}
                      size="small"
                    >
                      Preview Scan Page
                    </Button>
                  </Stack>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 200,
                      border: '2px dashed',
                      borderColor: 'grey.300',
                      borderRadius: 1,
                      color: 'text.secondary',
                    }}
                  >
                    <QrCodeIcon sx={{ fontSize: 64, mb: 1 }} />
                    <Typography>Generate a QR code to see it here</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Preview Dialog */}
        <Dialog
          open={previewDialog}
          onClose={() => setPreviewDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Scan Page Preview</DialogTitle>
          <DialogContent>
            {qrData && (
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {qrData.sessionTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Users will be redirected to a registration form when they scan this QR code.
                </Typography>
                <TextField
                  fullWidth
                  label="Scan URL"
                  value={qrData.scanUrl}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <IconButton onClick={() => copyToClipboard(qrData.scanUrl, 'url')}>
                        <CopyIcon />
                      </IconButton>
                    ),
                  }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

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
    </LocalizationProvider>
  );
};

export default QRCodeGenerator;
