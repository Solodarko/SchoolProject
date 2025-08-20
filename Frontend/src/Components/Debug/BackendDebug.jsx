import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  Grid,
  Paper,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Info,
  Refresh,
  ExpandMore,
  Launch,
  Code
} from '@mui/icons-material';

const BackendDebug = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

  const testEndpoints = [
    {
      name: 'Health Check',
      url: '/api/zoom/health',
      description: 'Basic server health check'
    },
    {
      name: 'Meetings List',
      url: '/api/zoom/meetings',
      description: 'Get all meetings (main endpoint for user dashboard)'
    },
    {
      name: 'Create Meeting',
      url: '/api/zoom/create-meeting',
      method: 'POST',
      description: 'Create new Zoom meeting',
      testData: {
        topic: 'Debug Test Meeting',
        duration: 30,
        type: 1,
        settings: {
          host_video: true,
          participant_video: true,
          mute_upon_entry: true,
          waiting_room: false,
          auto_recording: 'none'
        }
      }
    },
    {
      name: 'Test Minimal',
      url: '/api/zoom/test-minimal',
      description: 'Test basic Zoom API access without meeting scopes'
    },
    {
      name: 'Test Meeting Scopes',
      url: '/api/zoom/test-meeting-scopes',
      description: 'Test if meeting scopes are properly configured'
    }
  ];

  const testEndpoint = async (endpoint) => {
    const testUrl = customUrl || backendUrl;
    const fullUrl = `${testUrl}${endpoint.url}`;
    
    try {
      const options = {
        method: endpoint.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (endpoint.testData) {
        options.body = JSON.stringify(endpoint.testData);
      }

      console.log(`Testing ${endpoint.name}:`, fullUrl);
      const response = await fetch(fullUrl, options);
      
      const result = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: fullUrl,
        timestamp: new Date().toISOString()
      };

      try {
        result.data = await response.json();
      } catch (jsonError) {
        const textResponse = await response.text();
        result.error = 'Failed to parse JSON response';
        result.rawResponse = textResponse;
      }

      return result;
    } catch (error) {
      return {
        status: 0,
        statusText: 'Network Error',
        ok: false,
        url: fullUrl,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    const results = {};

    for (const endpoint of testEndpoints) {
      try {
        results[endpoint.name] = await testEndpoint(endpoint);
      } catch (error) {
        results[endpoint.name] = {
          status: 0,
          ok: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }

    setTestResults(results);
    setLoading(false);
  };

  const getStatusIcon = (result) => {
    if (!result) return <Info color="disabled" />;
    if (result.ok) return <CheckCircle color="success" />;
    if (result.status === 404) return <Warning color="warning" />;
    return <Error color="error" />;
  };

  const getStatusColor = (result) => {
    if (!result) return 'default';
    if (result.ok) return 'success';
    if (result.status === 404) return 'warning';
    return 'error';
  };

  const getStatusText = (result) => {
    if (!result) return 'Not tested';
    if (result.ok) return 'OK';
    if (result.status === 404) return 'Not Found';
    if (result.status === 0) return 'Network Error';
    return `Error ${result.status}`;
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Backend Debug & Diagnostics
      </Typography>

      {/* Configuration Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Configuration</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Environment Variables</Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="VITE_API_BASE_URL"
                      secondary={import.meta.env.VITE_API_BASE_URL || 'Not set'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Derived Backend URL"
                      secondary={backendUrl}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="NODE_ENV"
                      secondary={import.meta.env.NODE_ENV || 'development'}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Quick Tests</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <TextField
                    label="Custom Backend URL (optional)"
                    variant="outlined"
                    size="small"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder={backendUrl}
                  />
                  <Button
                    variant="contained"
                    onClick={runAllTests}
                    disabled={loading}
                    startIcon={loading ? <Refresh className="rotating" /> : <Refresh />}
                  >
                    {loading ? 'Testing...' : 'Test All Endpoints'}
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Endpoint Tests</Typography>
          
          {Object.keys(testResults).length === 0 && !loading && (
            <Alert severity="info">
              Click &quot;Test All Endpoints&quot; to check backend connectivity and API endpoints.
            </Alert>
          )}

          {testEndpoints.map((endpoint) => {
            const result = testResults[endpoint.name];
            return (
              <Accordion key={endpoint.name} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    {getStatusIcon(result)}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1">{endpoint.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {endpoint.description}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={getStatusText(result)}
                      color={getStatusColor(result)}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {result ? (
                    <Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="subtitle2" gutterBottom>Request Info</Typography>
                            <List dense>
                              <ListItem>
                                <ListItemText
                                  primary="URL"
                                  secondary={result.url}
                                />
                              </ListItem>
                              <ListItem>
                                <ListItemText
                                  primary="Method"
                                  secondary={endpoint.method || 'GET'}
                                />
                              </ListItem>
                              <ListItem>
                                <ListItemText
                                  primary="Status"
                                  secondary={`${result.status} ${result.statusText}`}
                                />
                              </ListItem>
                              <ListItem>
                                <ListItemText
                                  primary="Timestamp"
                                  secondary={new Date(result.timestamp).toLocaleString()}
                                />
                              </ListItem>
                            </List>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="subtitle2" gutterBottom>Response Data</Typography>
                            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                              {result.data ? (
                                <pre style={{ fontSize: '0.75rem', margin: 0 }}>
                                  {JSON.stringify(result.data, null, 2)}
                                </pre>
                              ) : result.error ? (
                                <Alert severity="error" size="small">
                                  <strong>Error:</strong> {result.error}
                                  {result.rawResponse && (
                                    <Box sx={{ mt: 1, fontSize: '0.75rem' }}>
                                      <strong>Raw Response:</strong>
                                      <pre>{result.rawResponse}</pre>
                                    </Box>
                                  )}
                                </Alert>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  No response data
                                </Typography>
                              )}
                            </Box>
                          </Paper>
                        </Grid>
                      </Grid>
                      
                      {/* Test specific endpoint button */}
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => testEndpoint(endpoint).then(r => 
                            setTestResults(prev => ({ ...prev, [endpoint.name]: r }))
                          )}
                          startIcon={<Refresh />}
                        >
                          Retest
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => window.open(result?.url || `${customUrl || backendUrl}${endpoint.url}`, '_blank')}
                          startIcon={<Launch />}
                        >
                          Open in Browser
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Alert severity="info">
                      This endpoint hasn't been tested yet. Click "Test All Endpoints" or use the individual test button.
                    </Alert>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </CardContent>
      </Card>

      {/* Quick Fix Suggestions */}
      {Object.keys(testResults).length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Troubleshooting</Typography>
            <List>
              {testResults['Meetings List'] && !testResults['Meetings List'].ok && (
                <ListItem>
                  <Alert severity="error" sx={{ width: '100%' }}>
                    <strong>Meetings endpoint failing:</strong> This is the main issue causing the user dashboard to show 404.
                    <br />• Check if your backend server is running on {customUrl || backendUrl}
                    <br />• Verify the Zoom routes are properly mounted in your Express app
                    <br />• Check if CORS is configured to allow requests from your frontend
                  </Alert>
                </ListItem>
              )}
              
              {testResults['Test Meeting Scopes'] && testResults['Test Meeting Scopes'].status === 400 && (
                <ListItem>
                  <Alert severity="warning" sx={{ width: '100%' }}>
                    <strong>Zoom API Scopes Issue:</strong> Your Zoom app may be missing required scopes.
                    <br />• Add meeting:read:list_meetings and meeting:read:meeting scopes to your Zoom app
                    <br />• Reinstall the app after adding scopes
                  </Alert>
                </ListItem>
              )}
              
              {Object.values(testResults).every(r => r.status === 0) && (
                <ListItem>
                  <Alert severity="error" sx={{ width: '100%' }}>
                    <strong>All endpoints failing with network error:</strong>
                    <br />• Backend server is likely not running
                    <br />• Start your backend server: <code>npm start</code> or <code>node server.js</code>
                    <br />• Check if it's running on the correct port ({customUrl || backendUrl})
                  </Alert>
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rotating {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </Box>
  );
};

export default BackendDebug;
