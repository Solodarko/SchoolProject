import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  QrCode,
  QrCodeScanner,
  Person,
  Email,
  Star,
  CheckCircle,
  Code
} from '@mui/icons-material';
import SimpleQRGenerator from '../Components/QRCode/SimpleQRGenerator';
import SimpleQRScanner from '../Components/QRCode/SimpleQRScanner';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SimpleQRDemo = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          mb: 4, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
            <QrCode sx={{ fontSize: 48 }} />
            <Typography variant="h3" fontWeight={700}>
              Simple QR Code Demo
            </Typography>
            <QrCodeScanner sx={{ fontSize: 48 }} />
          </Box>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
            Generate and scan QR codes containing only name and email information
          </Typography>
          
          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <Chip 
                icon={<Person />} 
                label="Name Detection" 
                variant="filled" 
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }} 
              />
            </Grid>
            <Grid item>
              <Chip 
                icon={<Email />} 
                label="Email Detection" 
                variant="filled" 
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }} 
              />
            </Grid>
            <Grid item>
              <Chip 
                icon={<Star />} 
                label="Simple & Clean" 
                variant="filled" 
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }} 
              />
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Features Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <QrCode color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" gutterBottom>Generate QR Codes</Typography>
              <Typography variant="body2" color="text.secondary">
                Create QR codes with just name and email. Clean, simple tokens that are easy to scan and detect.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <QrCodeScanner color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" gutterBottom>Smart Scanner</Typography>
              <Typography variant="body2" color="text.secondary">
                Automatically detects name and email QR codes. Shows only the relevant information you need.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <CheckCircle color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" gutterBottom>Instant Results</Typography>
              <Typography variant="body2" color="text.secondary">
                Get immediate feedback when scanning. View scan history and manage contact information easily.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Demo Tabs */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="fullWidth"
            sx={{ 
              '& .MuiTab-root': { 
                py: 2,
                fontSize: '1rem',
                fontWeight: 600
              }
            }}
          >
            <Tab 
              icon={<QrCode />} 
              label="QR Generator" 
              iconPosition="start"
            />
            <Tab 
              icon={<QrCodeScanner />} 
              label="QR Scanner" 
              iconPosition="start"
            />
            <Tab 
              icon={<Code />} 
              label="How It Works" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>🎯 QR Code Generator</Typography>
            <Typography variant="body2">
              Enter a name and email address to generate a QR code. The code will contain only these two pieces of information.
              Perfect for contact sharing, event check-ins, or simple identification.
            </Typography>
          </Alert>
          <SimpleQRGenerator />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>📷 QR Code Scanner</Typography>
            <Typography variant="body2">
              Use your camera to scan QR codes and automatically detect name and email information.
              Only name/email tokens will be recognized - other QR codes will be ignored.
            </Typography>
          </Alert>
          <SimpleQRScanner />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Code color="primary" />
              How It Works
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom color="primary">
                  📝 QR Code Generation
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText 
                      primary="Simple Token Format" 
                      secondary="Creates a JSON token with name, email, type, and timestamp"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText 
                      primary="Type Identification" 
                      secondary="Uses 'name_email_token' type for easy recognition"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText 
                      primary="Clean Data" 
                      secondary="Only includes essential information - no complex metadata"
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom color="primary">
                  🔍 QR Code Scanning
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText 
                      primary="Type Validation" 
                      secondary="Only processes QR codes with 'name_email_token' type"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText 
                      primary="Data Extraction" 
                      secondary="Extracts only name and email, ignoring other data"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText 
                      primary="History Tracking" 
                      secondary="Keeps record of scanned contacts for easy reference"
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>

            <Alert severity="success" sx={{ mt: 4 }}>
              <Typography variant="subtitle2" gutterBottom>✨ Key Benefits</Typography>
              <Typography variant="body2">
                • <strong>Privacy-focused:</strong> Only contains name and email - no tracking or complex data<br/>
                • <strong>Universal:</strong> Works with any QR code scanner that can read JSON<br/>
                • <strong>Lightweight:</strong> Minimal data means fast scanning and processing<br/>
                • <strong>Secure:</strong> No sensitive information beyond basic contact details
              </Typography>
            </Alert>

            <Paper sx={{ p: 3, mt: 3, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontFamily: 'monospace' }}>
                📄 Sample Token Structure:
              </Typography>
              <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'text.secondary' }}>
                <pre>{JSON.stringify({
                  name: "John Doe",
                  email: "john.doe@example.com",
                  type: "name_email_token",
                  timestamp: "2024-01-20T12:00:00.000Z"
                }, null, 2)}</pre>
              </Box>
            </Paper>
          </Box>
        </TabPanel>
      </Paper>

      {/* Footer */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          💡 Tip: Generate a QR code in the first tab, then scan it in the second tab to test the functionality!
        </Typography>
      </Box>
    </Container>
  );
};

export default SimpleQRDemo;
