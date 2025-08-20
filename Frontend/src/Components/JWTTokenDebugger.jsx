import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Divider,
  Chip,
  Stack
} from '@mui/material';
import { BugReport, Refresh, Token, Email, Person, Security } from '@mui/icons-material';
import { getUserFullInfo, getCurrentUserInfo, getUserEmail } from '../utils/jwtUtils';
import { getAuthToken } from '../utils/authUtils';

const JWTTokenDebugger = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [error, setError] = useState(null);

  const runDebug = () => {
    try {
      setError(null);
      
      // Get raw token
      const rawToken = getAuthToken();
      
      // Get decoded user info
      const userInfo = getCurrentUserInfo();
      
      // Get full user info with fallbacks
      const fullUserInfo = getUserFullInfo();
      
      // Get email specifically
      const email = getUserEmail();
      
      // Try to manually decode the token
      let manualDecode = null;
      if (rawToken) {
        try {
          const parts = rawToken.split('.');
          if (parts.length === 3) {
            const payload = parts[1];
            const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
            manualDecode = JSON.parse(atob(paddedPayload));
          }
        } catch (e) {
          console.error('Manual decode error:', e);
        }
      }

      setDebugInfo({
        rawToken: rawToken ? {
          exists: true,
          length: rawToken.length,
          preview: rawToken.substring(0, 50) + '...',
          parts: rawToken.split('.').length
        } : { exists: false },
        
        userInfo: userInfo,
        fullUserInfo: fullUserInfo,
        email: email,
        manualDecode: manualDecode,
        
        cookies: {
          authToken: document.cookie.includes('authToken='),
          username: document.cookie
            .split('; ')
            .find(row => row.startsWith('username='))
            ?.split('=')[1],
          userRole: document.cookie
            .split('; ')
            .find(row => row.startsWith('userRole='))
            ?.split('=')[1]
        },
        
        timestamp: new Date().toLocaleString()
      });

    } catch (err) {
      console.error('Debug error:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    runDebug();
  }, []);

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom display="flex" alignItems="center" gap={2}>
        <BugReport color="primary" />
        JWT Token Debugger
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Debug JWT token extraction and email display issues
      </Typography>

      <Box mb={3}>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={runDebug}
        >
          Refresh Debug Info
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Debug Error: {error}
        </Alert>
      )}

      {debugInfo && (
        <Stack spacing={3}>
          {/* Raw Token Info */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <Token color="primary" />
                Raw Token Information
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Token Exists:</Typography>
                  <Chip 
                    label={debugInfo.rawToken.exists ? 'YES' : 'NO'} 
                    color={debugInfo.rawToken.exists ? 'success' : 'error'} 
                    size="small" 
                  />
                </Box>
                {debugInfo.rawToken.exists && (
                  <>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Token Length:</Typography>
                      <Typography variant="body1">{debugInfo.rawToken.length} characters</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Token Parts:</Typography>
                      <Typography variant="body1">{debugInfo.rawToken.parts} (should be 3 for JWT)</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Token Preview:</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {debugInfo.rawToken.preview}
                      </Typography>
                    </Box>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Manual Decode */}
          {debugInfo.manualDecode && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                  <Security color="primary" />
                  Manual Token Decode
                </Typography>
                <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, overflow: 'auto' }}>
                  <pre style={{ margin: 0, fontSize: '12px' }}>
                    {JSON.stringify(debugInfo.manualDecode, null, 2)}
                  </pre>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Email Extraction */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <Email color="primary" />
                Email Extraction Results
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Direct Email Function:</Typography>
                  <Typography variant="body1">
                    {debugInfo.email ? (
                      <Chip label={debugInfo.email} color="success" />
                    ) : (
                      <Chip label="No email found" color="error" />
                    )}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">From User Info:</Typography>
                  <Typography variant="body1">
                    {debugInfo.userInfo?.email ? (
                      <Chip label={debugInfo.userInfo.email} color="success" />
                    ) : (
                      <Chip label="No email in userInfo" color="error" />
                    )}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">From Full User Info:</Typography>
                  <Typography variant="body1">
                    {debugInfo.fullUserInfo?.email ? (
                      <Chip label={debugInfo.fullUserInfo.email} color="success" />
                    ) : (
                      <Chip label="No email in fullUserInfo" color="error" />
                    )}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">From Manual Decode:</Typography>
                  <Typography variant="body1">
                    {debugInfo.manualDecode?.email ? (
                      <Chip label={debugInfo.manualDecode.email} color="success" />
                    ) : (
                      <Chip label="No email in manual decode" color="error" />
                    )}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* User Information */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <Person color="primary" />
                User Information
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Username:</Typography>
                  <Typography variant="body1">{debugInfo.fullUserInfo?.username || 'Not available'}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Role:</Typography>
                  <Typography variant="body1">{debugInfo.fullUserInfo?.role || 'Not available'}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">User ID:</Typography>
                  <Typography variant="body1">{debugInfo.fullUserInfo?.userId || 'Not available'}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Cookie Information */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Cookie Information</Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Auth Token Cookie:</Typography>
                  <Chip 
                    label={debugInfo.cookies.authToken ? 'Present' : 'Missing'} 
                    color={debugInfo.cookies.authToken ? 'success' : 'error'} 
                    size="small" 
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Username Cookie:</Typography>
                  <Typography variant="body1">{debugInfo.cookies.username || 'Not set'}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">User Role Cookie:</Typography>
                  <Typography variant="body1">{debugInfo.cookies.userRole || 'Not set'}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Debug Timestamp */}
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">
              Debug run at: {debugInfo.timestamp}
            </Typography>
          </Box>
        </Stack>
      )}
    </Box>
  );
};

export default JWTTokenDebugger;
