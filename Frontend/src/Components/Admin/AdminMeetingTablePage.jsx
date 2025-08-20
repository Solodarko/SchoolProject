import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Alert, 
  CircularProgress,
  Button,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { 
  Groups, 
  Refresh, 
  DataUsage,
  TrendingUp 
} from '@mui/icons-material';
import AdminMeetingTable from './AdminMeetingTable';

const AdminMeetingTablePage = () => {
  const [participantsData, setParticipantsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Get backend URL
  const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

  // Function to load tracking data from backend API
  const loadTrackingData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 [Admin Meeting Table] Loading tracking data from backend API...');
      
      const response = await fetch(`${backendUrl}/api/zoom/join-tracking`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const apiResult = await response.json();
        console.log('✅ [Admin Meeting Table] API response:', apiResult);
        
        if (apiResult.success && apiResult.data) {
          // Use API data and sort by timestamp (newest first)
          const allTrackingData = apiResult.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          console.log('📊 [Admin Meeting Table] Using backend API data:', allTrackingData.length, 'records');
          
          setParticipantsData(allTrackingData);
          setLastUpdated(new Date());
        } else {
          console.warn('⚠️ [Admin Meeting Table] API returned no data');
          setParticipantsData([]);
          setError('No tracking data available from the API');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ [Admin Meeting Table] API request failed:', response.status, errorText);
        setError(`API request failed: ${response.status} ${response.statusText}`);
        setParticipantsData([]);
      }
    } catch (apiError) {
      console.error('❌ [Admin Meeting Table] API request error:', apiError);
      setError(`Connection error: ${apiError.message}`);
      setParticipantsData([]);
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  // Load data on component mount
  useEffect(() => {
    loadTrackingData();
    
    // Set up periodic refresh every 10 seconds
    const interval = setInterval(() => {
      console.log('🔄 [Admin Meeting Table] Auto-refreshing tracking data...');
      loadTrackingData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [loadTrackingData]);

  // Clear all tracking data
  const clearTrackingData = async () => {
    if (window.confirm('Are you sure you want to clear all join tracking data? This action cannot be undone.')) {
      try {
        setLoading(true);
        
        const response = await fetch(`${backendUrl}/api/zoom/join-tracking`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ [Admin Meeting Table] Backend data cleared:', result);
          
          // Refresh data after clearing
          await loadTrackingData();
        } else {
          console.error('❌ [Admin Meeting Table] Failed to clear backend data:', response.status);
          setError('Failed to clear data from backend');
        }
      } catch (apiError) {
        console.error('❌ [Admin Meeting Table] Error clearing tracking data:', apiError);
        setError(`Error clearing data: ${apiError.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box sx={{ width: '100%', p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            fontWeight: 600,
            color: 'primary.main'
          }}
        >
          <Groups />
          Meeting Participants Tracker
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Real-time tracking of user join events and meeting participation
        </Typography>
        
        {/* Status and Actions */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
          <Chip 
            icon={<DataUsage />}
            label={`${participantsData.length} Records`}
            color="primary" 
            variant="outlined"
          />
          {lastUpdated && (
            <Chip 
              icon={<TrendingUp />}
              label={`Updated: ${lastUpdated.toLocaleTimeString()}`}
              color="success" 
              variant="outlined"
            />
          )}
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadTrackingData}
            disabled={loading}
            size="small"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          {participantsData.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              onClick={clearTrackingData}
              disabled={loading}
              size="small"
            >
              Clear All Data
            </Button>
          )}
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          <strong>Error:</strong> {error}
          <br />
          <Button 
            size="small" 
            onClick={loadTrackingData} 
            sx={{ mt: 1 }}
            disabled={loading}
          >
            Retry
          </Button>
        </Alert>
      )}

      {/* Connection Status */}
      <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: error ? 'error.main' : 'success.main',
                animation: error ? 'none' : 'pulse 2s infinite'
              }}
            />
            <Typography variant="body2">
              <strong>Backend API Status:</strong> {error ? 'Disconnected' : 'Connected'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Endpoint: {backendUrl}/api/zoom/join-tracking
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && participantsData.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Main Table */}
      {!loading || participantsData.length > 0 ? (
        <AdminMeetingTable
          participantsData={participantsData}
          loading={loading}
          onRefresh={loadTrackingData}
          title="Live Meeting Participants"
          showToolbar={true}
          height={600}
        />
      ) : null}

      {/* Help Information */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>About This Dashboard:</strong> This table displays real-time participant data whenever users join meetings 
          through the user dashboard. Data is automatically stored in the backend API and refreshed every 10 seconds. 
          Each join event includes tracking ID, participant count, timestamps, and user information for comprehensive 
          meeting analytics.
        </Typography>
      </Alert>

      {/* Additional CSS for pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
};

export default AdminMeetingTablePage;
