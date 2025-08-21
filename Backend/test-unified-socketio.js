const io = require('socket.io-client');
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Connect to Socket.IO server
const socket = io(BASE_URL);

console.log('🔗 Testing Unified QR Attendance Socket.IO Integration\n');

// Set up Socket.IO event listeners
socket.on('connect', () => {
  console.log('✅ Connected to Socket.IO server');
  console.log(`📡 Socket ID: ${socket.id}`);
  
  // Join admin dashboard room
  socket.emit('joinMeeting', 'admin_dashboard');
  console.log('🏠 Joined admin_dashboard room\n');
  
  // Set up event listeners
  socket.on('attendanceRecorded', (data) => {
    console.log('🔔 RECEIVED: attendanceRecorded event');
    console.log(`   📍 Type: ${data.type}`);
    console.log(`   👤 Student: ${data.studentInfo.name}`);
    console.log(`   ✅ Status: ${data.attendanceDetails.status}`);
    console.log(`   📅 Time: ${data.timestamp}`);
    console.log(`   📱 Method: ${data.attendanceDetails.method}\n`);
  });

  socket.on('notification', (data) => {
    console.log('🔔 RECEIVED: notification event');
    console.log(`   📝 Title: ${data.title}`);
    console.log(`   💬 Message: ${data.message}`);
    console.log(`   📅 Time: ${data.timestamp}\n`);
  });

  socket.on('realTimeAttendanceUpdate', (data) => {
    console.log('🔔 RECEIVED: realTimeAttendanceUpdate event');
    console.log(`   📍 Type: ${data.type}`);
    console.log(`   👤 Student: ${data.data.attendance.studentName}`);
    console.log(`   ✅ Status: ${data.data.attendance.status}`);
    console.log(`   📅 Time: ${data.timestamp}\n`);
  });

  // Test attendance submission after connecting
  setTimeout(testUnifiedAttendance, 2000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Socket.IO connection error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log(`❌ Disconnected from Socket.IO server: ${reason}`);
});

async function testUnifiedAttendance() {
  console.log('🧪 Testing unified QR attendance with Socket.IO...\n');

  try {
    console.log('📱 Submitting unified QR attendance...');
    
    const testData = {
      qrCodeData: JSON.stringify({
        id: 'socket-test-' + Date.now(),
        location: { latitude: 5.29888, longitude: -2.001131 },
        timestamp: new Date().toISOString(),
        type: 'attendance_qr'
      }),
      userLocation: { latitude: 5.29888, longitude: -2.001131 },
      studentId: '12345',
      additionalData: { source: 'socket_test' }
    };

    const response = await axios.post(`${BASE_URL}/api/attendance-unified/qr-location`, testData);
    
    console.log('✅ Unified QR attendance submitted successfully');
    console.log(`📄 Attendance ID: ${response.data.attendanceId}`);
    console.log(`📄 Status: ${response.data.status}`);
    console.log(`📄 Verification: ${response.data.location.verification.status}\n`);
    
    console.log('⏳ Waiting for Socket.IO events...\n');
    
    // Wait for events, then disconnect
    setTimeout(() => {
      console.log('🔚 Test completed. Disconnecting...');
      socket.disconnect();
      process.exit(0);
    }, 5000);

  } catch (error) {
    console.error('❌ Error during unified attendance test:', error.message);
    if (error.response?.data) {
      console.error('📄 Error details:', error.response.data);
    }
    
    setTimeout(() => {
      socket.disconnect();
      process.exit(1);
    }, 1000);
  }
}

// Handle process exit
process.on('SIGINT', () => {
  console.log('\n🔚 Test interrupted. Disconnecting...');
  socket.disconnect();
  process.exit(0);
});
