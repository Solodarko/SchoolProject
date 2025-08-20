import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  TextField,
  CircularProgress,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  Paper
} from '@mui/material';
import { TestTube, CheckCircle, Error, Warning } from '@mui/icons-material';

const ApiTestPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  // Get backend URL from environment
  const envBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const testEndpoints = [
    {
      name: 'Health Check',
      url: '/api/health',
      method: 'GET'
    },
    {
      name: 'Attendance Dashboard',
      url: '/api/attendance/dashboard',
      method: 'GET'
    },
    {
      name: 'Attendance Trends',
      url: '/api/attendance/trends',
      method: 'GET'
    },
    {
      name: 'Attendance Summary',
      url: '/api/attendance/summary',
      method: 'GET'
    },
    {
      name: 'Attendance Tracker Status',
      url: '/api/attendance-tracker/status',
      method: 'GET'
    }
  ];

  const testApi = async (baseUrl = envBackendUrl) => {
    setLoading(true);
    setResults([]);
    
    const testResults = [];
    
    console.log(`🧪 Starting API tests with base URL: ${baseUrl}`);

    for (const endpoint of testEndpoints) {
      const testResult = {
        name: endpoint.name,
        url: endpoint.url,
        fullUrl: `${baseUrl}${endpoint.url}`,
        method: endpoint.method,
        status: 'pending',
        responseTime: 0,
        error: null,
        data: null,
        isJson: false
      };

      try {
        const startTime = Date.now();
        
        const response = await fetch(testResult.fullUrl, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        const endTime = Date.now();
        testResult.responseTime = endTime - startTime;
        testResult.statusCode = response.status;

        if (response.ok) {
          // Try to parse as JSON
          const responseText = await response.text();
          
          try {
            testResult.data = JSON.parse(responseText);
            testResult.isJson = true;
            testResult.status = 'success';
            testResult.dataSize = JSON.stringify(testResult.data).length;
          } catch (jsonError) {
            testResult.data = responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '');
            testResult.isJson = false;
            testResult.status = 'json_error';
            testResult.error = `JSON Parse Error: ${jsonError.message}`;
          }
        } else {
          testResult.status = 'http_error';
          testResult.error = `HTTP ${response.status}: ${response.statusText}`;
          
          // Try to get response body for debugging
          try {
            const responseText = await response.text();
            testResult.data = responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '');
          } catch (e) {
            testResult.data = 'Could not read response body';
          }
        }
      } catch (networkError) {
        testResult.status = 'network_error';
        testResult.error = networkError.message;
      }

      testResults.push(testResult);
      setResults([...testResults]); // Update results in real-time
    }

    setLoading(false);
    console.log('🏁 API tests completed:', testResults);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle color="success" />;
      case 'json_error': return <Warning color="warning" />;
      case 'http_error': return <Error color="error" />;
      case 'network_error': return <Error color="error" />;
      default: return <CircularProgress size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'success';
      case 'json_error': return 'warning';
      case 'http_error': return 'error';
      case 'network_error': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <TestTube color="primary" />
            <Typography variant="h4" component="h1">
              API Connection Test
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            This page tests all the API endpoints to diagnose JSON parsing errors. 
            Use this to verify backend connectivity and response formats.
          </Alert>

          {/* Environment Variables Display */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom>Environment Configuration</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>VITE_BACKEND_URL:</strong> {envBackendUrl}
            </Typography>
            <Typography variant="body2">
              <strong>VITE_API_BASE_URL:</strong> {envApiBaseUrl}
            </Typography>
          </Paper>

          {/* Custom URL Test */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
            <TextField
              label="Custom Backend URL"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="http://localhost:5000"
              fullWidth
            />
            <Button
              variant="outlined"
              onClick={() => testApi(customUrl || envBackendUrl)}
              disabled={loading}
            >
              Test Custom URL
            </Button>
          </Box>

          {/* Test Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              onClick={() => testApi()}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <TestTube />}
            >
              {loading ? 'Testing...' : 'Test Default Environment URLs'}
            </Button>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Test Results */}
          {results.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Test Results ({results.length} endpoints)
              </Typography>
              
              <List>
                {results.map((result, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <Card sx={{ width: '100%', mb: 1 }}>
                      <CardContent sx={{ pb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {getStatusIcon(result.status)}
                            <Typography variant="h6">{result.name}</Typography>
                            <Chip 
                              label={result.status.toUpperCase()} 
                              color={getStatusColor(result.status)}
                              size="small"
                            />
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {result.responseTime > 0 && (
                              <Chip label={`${result.responseTime}ms`} size="small" variant="outlined" />
                            )}
                            {result.statusCode && (
                              <Chip 
                                label={`HTTP ${result.statusCode}`} 
                                size="small" 
                                variant="outlined"
                                color={result.statusCode === 200 ? 'success' : 'error'}
                              />
                            )}
                          </Box>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontFamily: 'monospace' }}>
                          {result.method} {result.fullUrl}
                        </Typography>

                        {result.error && (
                          <Alert severity="error" sx={{ mb: 2 }}>
                            {result.error}
                          </Alert>
                        )}

                        {result.data && (
                          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="subtitle2">
                                Response Data:
                              </Typography>
                              <Chip 
                                label={result.isJson ? 'JSON' : 'TEXT/HTML'} 
                                color={result.isJson ? 'success' : 'error'}
                                size="small"
                              />
                              {result.dataSize && (
                                <Chip label={`${result.dataSize} bytes`} size="small" variant="outlined" />
                              )}
                            </Box>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontFamily: 'monospace', 
                                fontSize: '0.8rem',
                                whiteSpace: 'pre-wrap',
                                maxHeight: 150,
                                overflow: 'auto'
                              }}
                            >
                              {result.isJson ? JSON.stringify(result.data, null, 2) : result.data}
                            </Typography>
                          </Paper>
                        )}
                      </CardContent>
                    </Card>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Instructions */}
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>How to use this test:</Typography>
            <Typography variant="body2">
              1. Click "Test Default Environment URLs" to test with your .env configuration<br/>
              2. If you see JSON parsing errors, check that your backend is running on the correct port<br/>
              3. Look for "TEXT/HTML" responses - these indicate 404 errors or server issues<br/>
              4. Green "JSON" labels mean the API is working correctly<br/>
              5. Check response times - slow responses may indicate network issues
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ApiTestPage;
