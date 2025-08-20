import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, Alert } from '@mui/material';
import AdminMeetingTable from './AdminMeetingTable';

const AdminMeetingTableExample = () => {
  const [participantsData, setParticipantsData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sample data that matches your provided format
  const sampleData = [
    {
      "meetingId": "85411858662",
      "meetingTopic": "swwwwwwwww",
      "trackingId": "join_85411858662_68a04754d16290facb3e7a9e_1755545888650",
      "participantCount": 1,
      "timestamp": "2025-08-18T19:38:08.650Z",
      "userId": "68a04754d16290facb3e7a9e",
      "userName": "fred",
      "userEmail": "fred@gmail.com",
      "studentId": "68a04754d16290facb3e7a9e",
      "message": "Joined \"swwwwwwwww\" as participant #1"
    },
    {
      "meetingId": "85411858662",
      "meetingTopic": "swwwwwwwww",
      "trackingId": "join_85411858662_68a04754d16290facb3e7a9f_1755545900000",
      "participantCount": 2,
      "timestamp": "2025-08-18T19:40:00.000Z",
      "userId": "68a04754d16290facb3e7a9f",
      "userName": "alice",
      "userEmail": "alice@university.edu",
      "studentId": "STU001",
      "message": "Joined \"swwwwwwwww\" as participant #2"
    },
    {
      "meetingId": "12345678901",
      "meetingTopic": "Computer Science Lecture",
      "trackingId": "join_12345678901_68a04754d16290facb3e7a90_1755546000000",
      "participantCount": 1,
      "timestamp": "2025-08-18T19:45:00.000Z",
      "userId": "68a04754d16290facb3e7a90",
      "userName": "bob",
      "userEmail": "bob@university.edu",
      "studentId": "STU002",
      "message": "Joined \"Computer Science Lecture\" as participant #1"
    },
    {
      "meetingId": "98765432109",
      "meetingTopic": "Mathematics Workshop",
      "trackingId": "join_98765432109_68a04754d16290facb3e7a91_1755546100000",
      "participantCount": 1,
      "timestamp": "2025-08-18T19:50:00.000Z",
      "userId": "68a04754d16290facb3e7a91",
      "userName": "charlie",
      "userEmail": "charlie@university.edu",
      "studentId": "STU003",
      "message": "Joined \"Mathematics Workshop\" as participant #1"
    },
    {
      "meetingId": "12345678901",
      "meetingTopic": "Computer Science Lecture",
      "trackingId": "join_12345678901_68a04754d16290facb3e7a92_1755546200000",
      "participantCount": 2,
      "timestamp": "2025-08-18T19:55:00.000Z",
      "userId": "68a04754d16290facb3e7a92",
      "userName": "diana",
      "userEmail": "diana@university.edu",
      "studentId": "STU004",
      "message": "Joined \"Computer Science Lecture\" as participant #2"
    }
  ];

  // Function to load data from backend API
  const loadTrackingData = async () => {
    setLoading(true);
    try {
      // Get backend URL
      const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
      
      console.log('🔄 Loading tracking data from backend API...');
      
      const response = await fetch(`${backendUrl}/api/zoom/join-tracking`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const apiResult = await response.json();
        console.log('✅ API response:', apiResult);
        
        if (apiResult.success && apiResult.data) {
          // Use API data
          const allTrackingData = apiResult.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          console.log('📊 Using backend API data:', allTrackingData.length, 'records');
          setParticipantsData(allTrackingData);
        } else {
          console.warn('⚠️ API returned no data, using sample data');
          setParticipantsData(sampleData);
        }
      } else {
        console.warn('⚠️ API request failed, using sample data');
        setParticipantsData(sampleData);
      }
    } catch (apiError) {
      console.warn('⚠️ API request error, using sample data:', apiError.message);
      setParticipantsData(sampleData);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadTrackingData();
    
    // Set up periodic refresh
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing tracking data...');
      loadTrackingData();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Function to add sample data (for testing)
  const addSampleData = () => {
    const newEntry = {
      meetingId: "11111111111",
      meetingTopic: "Test Meeting " + Date.now(),
      trackingId: "join_11111111111_test_" + Date.now(),
      participantCount: Math.floor(Math.random() * 10) + 1,
      timestamp: new Date().toISOString(),
      userId: "test_user_" + Date.now(),
      userName: "Test User " + Math.floor(Math.random() * 100),
      userEmail: `testuser${Math.floor(Math.random() * 100)}@test.com`,
      studentId: "TEST" + Math.floor(Math.random() * 1000),
      message: `Joined "Test Meeting" as participant #${Math.floor(Math.random() * 10) + 1}`
    };
    
    setParticipantsData(prev => [newEntry, ...prev]);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Admin Meeting Table Example
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          This is an example of the AdminMeetingTable component displaying meeting participant data.
        </Typography>
        
        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button 
            variant="contained" 
            onClick={loadTrackingData}
            disabled={loading}
          >
            Refresh from API
          </Button>
          <Button 
            variant="outlined" 
            onClick={addSampleData}
          >
            Add Sample Data
          </Button>
        </Box>

        {/* Info Alert */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>How it works:</strong> This table displays real-time participant data from the join tracking API. 
          If the backend API is not available, it will show sample data for demonstration purposes.
        </Alert>
      </Box>

      {/* Admin Meeting Table */}
      <AdminMeetingTable
        participantsData={participantsData}
        loading={loading}
        onRefresh={loadTrackingData}
        title="Meeting Participants Dashboard"
        showToolbar={true}
        height={600}
      />

      {/* Usage Information */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Usage Information
        </Typography>
        <Typography variant="body2" component="div">
          <strong>Props:</strong>
          <ul>
            <li><code>participantsData</code> - Array of participant objects</li>
            <li><code>loading</code> - Boolean to show loading state</li>
            <li><code>onRefresh</code> - Function to call when refresh is clicked</li>
            <li><code>title</code> - Custom title for the table</li>
            <li><code>showToolbar</code> - Boolean to show/hide the DataGrid toolbar</li>
            <li><code>height</code> - Height of the table in pixels</li>
          </ul>
          
          <strong>Features:</strong>
          <ul>
            <li>Real-time data display with auto-refresh</li>
            <li>Search and filter functionality</li>
            <li>Export to CSV/Excel</li>
            <li>Column management and sorting</li>
            <li>Statistics cards showing key metrics</li>
            <li>Copy tracking IDs to clipboard</li>
            <li>Responsive design</li>
          </ul>
        </Typography>
      </Box>
    </Container>
  );
};

export default AdminMeetingTableExample;
