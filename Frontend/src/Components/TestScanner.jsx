import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { QrCodeScanner as QrCodeIcon } from '@mui/icons-material';

const TestScanner = () => {
  console.log('TestScanner component rendering...');
  
  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <QrCodeIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              🔍 Test Scanner Component
            </Typography>
            <Typography variant="body1" color="text.secondary">
              If you can see this, the component is loading correctly!
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Console should show: "TestScanner component rendering..."
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TestScanner;
