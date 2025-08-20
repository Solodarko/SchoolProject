// Debug script to test meeting synchronization
import { io } from 'socket.io-client';

const backendUrl = 'http://localhost:5000';

console.log('🔍 Testing meeting synchronization between admin and user dashboards...');
console.log(`Backend URL: ${backendUrl}`);

// Test API endpoint
async function testMeetingsAPI() {
  console.log('\n📡 Testing /api/zoom/meetings endpoint...');
  
  try {
    const response = await fetch(`${backendUrl}/api/zoom/meetings`);
    const data = await response.json();
    
    console.log('✅ API Response Status:', response.status);
    console.log('📊 API Response Data:', JSON.stringify(data, null, 2));
    
    if (data.meetings && data.meetings.length > 0) {
      console.log(`🎯 Found ${data.meetings.length} meetings:`);
      data.meetings.forEach((meeting, index) => {
        console.log(`   ${index + 1}. ${meeting.topic} (ID: ${meeting.id})`);
        console.log(`      📧 Join URL: ${meeting.join_url}`);
        console.log(`      📊 Status: ${meeting.status}`);
        console.log(`      🕐 Created: ${meeting.created_at}`);
      });
    } else {
      console.log('⚠️  No meetings found in API response');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Failed to fetch meetings:', error.message);
    return null;
  }
}

// Test WebSocket connection
function testWebSocketConnection() {
  return new Promise((resolve) => {
    console.log('\n🔌 Testing WebSocket connection...');
    
    const socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000
    });

    let connected = false;

    socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      connected = true;
      
      // Listen for meeting events
      socket.on('meetingCreated', (meeting) => {
        console.log('🎉 Received meetingCreated event:', {
          id: meeting.id,
          topic: meeting.topic,
          status: meeting.status,
          join_url: meeting.join_url
        });
      });

      socket.on('meetingStarted', (data) => {
        console.log('🟢 Received meetingStarted event:', data);
      });

      socket.on('meetingEnded', (data) => {
        console.log('🔴 Received meetingEnded event:', data);
      });

      setTimeout(() => {
        socket.disconnect();
        resolve(true);
      }, 3000);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection failed:', error.message);
      resolve(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      if (!connected) {
        resolve(false);
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!connected) {
        console.log('⏰ WebSocket connection timeout');
        socket.disconnect();
        resolve(false);
      }
    }, 10000);
  });
}

// Main test function
async function runDiagnostics() {
  console.log('🚀 Starting diagnostics...\n');
  
  // Test 1: API endpoint
  const apiData = await testMeetingsAPI();
  
  // Test 2: WebSocket connection
  const wsConnected = await testWebSocketConnection();
  
  // Summary
  console.log('\n📋 DIAGNOSTIC SUMMARY:');
  console.log('='.repeat(50));
  console.log(`API Endpoint: ${apiData ? '✅ Working' : '❌ Failed'}`);
  console.log(`WebSocket: ${wsConnected ? '✅ Connected' : '❌ Failed'}`);
  
  if (apiData && apiData.meetings) {
    console.log(`Total Meetings: ${apiData.meetings.length}`);
    const activeMeetings = apiData.meetings.filter(m => m.status !== 'ended');
    console.log(`Active Meetings: ${activeMeetings.length}`);
  }
  
  console.log('\n💡 TROUBLESHOOTING TIPS:');
  console.log('1. Make sure your backend server is running on port 5000');
  console.log('2. Check that the meeting was created successfully in the admin dashboard');
  console.log('3. Verify that WebSocket events are being emitted from the backend');
  console.log('4. Refresh both admin and user dashboards');
  console.log('5. Check browser console for any errors');
  
  process.exit(0);
}

// Run diagnostics
runDiagnostics();
