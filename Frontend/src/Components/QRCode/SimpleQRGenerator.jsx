import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  Paper,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  QrCode,
  Person,
  Email,
  Download,
  Share,
  Refresh,
  ContentCopy
} from '@mui/icons-material';
import QRCode from 'react-qr-code';

const SimpleQRGenerator = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [qrData, setQrData] = useState(null);
  const [showQR, setShowQR] = useState(false);

  // Generate QR code with just name and email
  const generateQR = () => {
    if (!name.trim() || !email.trim()) {
      return;
    }

    // Create simple token with name and email only
    const token = {
      name: name.trim(),
      email: email.trim(),
      type: 'name_email_token',
      timestamp: new Date().toISOString()
    };

    setQrData(token);
    setShowQR(true);
  };

  // Reset the form
  const resetForm = () => {
    setName('');
    setEmail('');
    setQrData(null);
    setShowQR(false);
  };

  // Download QR code as image
  const downloadQR = () => {
    if (!qrData) return;
    
    const svg = document.getElementById('simple-qr-code');
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
      downloadLink.download = `qr_${name.replace(/\s+/g, '_')}_${Date.now()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  // Copy token data to clipboard
  const copyToken = () => {
    if (qrData) {
      navigator.clipboard.writeText(JSON.stringify(qrData, null, 2));
    }
  };

  // Copy just name and email to clipboard
  const copyNameEmail = () => {
    if (qrData) {
      const simpleData = `Name: ${qrData.name}\nEmail: ${qrData.email}`;
      navigator.clipboard.writeText(simpleData);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <QrCode color="primary" />
            <Typography variant="h5" fontWeight={600}>
              Simple Name & Email QR Generator
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Generate QR codes that contain only name and email information. When scanned, 
            only the name and email will be detected and displayed.
          </Typography>

          <Grid container spacing={3}>
            {/* Input Form */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Full Name"
                  variant="outlined"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  InputProps={{
                    startAdornment: <Person color="action" sx={{ mr: 1 }} />
                  }}
                />
                
                <TextField
                  label="Email Address"
                  variant="outlined"
                  fullWidth
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  InputProps={{
                    startAdornment: <Email color="action" sx={{ mr: 1 }} />
                  }}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={generateQR}
                    disabled={!name.trim() || !email.trim()}
                    startIcon={<QrCode />}
                    fullWidth
                  >
                    Generate QR Code
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={resetForm}
                    startIcon={<Refresh />}
                  >
                    Reset
                  </Button>
                </Box>

                {/* Token Preview */}
                {qrData && (
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person />
                      Token Preview
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(qrData, null, 2)}
                    </Typography>
                  </Paper>
                )}
              </Box>
            </Grid>

            {/* QR Code Display */}
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'center' }}>
                {showQR && qrData ? (
                  <Box>
                    <Box sx={{ 
                      p: 3, 
                      bgcolor: 'white', 
                      borderRadius: 2, 
                      display: 'inline-block',
                      boxShadow: 3,
                      border: '3px solid',
                      borderColor: 'primary.main'
                    }}>
                      <QRCode
                        id="simple-qr-code"
                        value={JSON.stringify(qrData)}
                        size={200}
                        level="M"
                        includeMargin={true}
                      />
                    </Box>
                    
                    <Box sx={{ mt: 2 }}>
                      <Chip
                        label={`${qrData.name}`}
                        color="primary"
                        sx={{ mr: 1, mb: 1 }}
                      />
                      <Chip
                        label={`${qrData.email}`}
                        color="secondary"
                        sx={{ mb: 1 }}
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      This QR code contains only the name and email above.
                    </Typography>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2, flexWrap: 'wrap' }}>
                      <Tooltip title="Download QR Code">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Download />}
                          onClick={downloadQR}
                        >
                          Download
                        </Button>
                      </Tooltip>
                      
                      <Tooltip title="Copy Name & Email">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<ContentCopy />}
                          onClick={copyNameEmail}
                        >
                          Copy Info
                        </Button>
                      </Tooltip>
                      
                      <Tooltip title="Copy Full Token">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Share />}
                          onClick={copyToken}
                        >
                          Copy Token
                        </Button>
                      </Tooltip>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ 
                    p: 4, 
                    border: '2px dashed', 
                    borderColor: 'divider', 
                    borderRadius: 2,
                    minHeight: 300,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <QrCode sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      Enter Name & Email
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fill in the form to generate your QR code
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Information Alert */}
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              How it works:
            </Typography>
            <Typography variant="body2">
              • Enter your name and email in the form<br/>
              • Generate a QR code containing only this information<br/>
              • When scanned, only the name and email will be detected<br/>
              • Perfect for simple identification purposes
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SimpleQRGenerator;
