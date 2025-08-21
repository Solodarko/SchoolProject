const io = require('socket.io-client');
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Connect to Socket.IO server
const socket = io(BASE_URL);

console.log('🔗 Testing Socket.IO Real-time Attendance Updates\n');

// Set up Socket.IO event listeners
socket.on('connect', () => {
  console.log('✅ Connected to Socket.IO server');
  console.log(`📡 Socket ID: ${socket.id}\n`);
  
  // Start listening for attendance updates
  socket.on('attendance_update', (data) => {
    console.log('🔔 Received real-time attendance update:');
    console.log(`   📍 Type: ${data.type}`);
    console.log(`   👤 Student: ${data.data.studentName || data.data.studentId}`);
    console.log(`   ✅ Status: ${data.data.status || data.data.verificationStatus}`);
    console.log(`   📅 Time: ${data.timestamp}`);
    console.log(`   📄 Details: ${JSON.stringify(data.data, null, 2)}\n`);
  });

  socket.on('notification', (notification) => {
    console.log('🔔 Received notification:');
    console.log(`   📝 Title: ${notification.title}`);
    console.log(`   💬 Message: ${notification.message}`);
    console.log(`   📅 Time: ${notification.timestamp}\n`);
  });

  // Test attendance submissions after connecting
  setTimeout(testAttendanceSubmissions, 2000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Socket.IO connection error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log(`❌ Disconnected from Socket.IO server: ${reason}`);
});

async function testAttendanceSubmissions() {
  console.log('🧪 Starting attendance submission tests...\n');

  try {
    // Test 1: Submit regular QR attendance
    console.log('1️⃣ Testing regular QR attendance submission...');
    const regularData = {
      studentId: "STU001",
      scannerLocation: {
        coordinates: {
          latitude: 5.298880,
          longitude: -2.001131
        },
        distance: 3.0
      },
      userLocation: {
        lat: 5.298880,
        lng: -2.001131,
        accuracy: 2.0
      },
      attendanceType: 'qr_scan',
      scannedAt: new Date().toISOString()
    };

    await axios.post(`${BASE_URL}/api/attendance/qr-location`, regularData);
    console.log('   ✅ Regular QR attendance submitted');
    
    // Wait for Socket.IO event
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Submit unified QR attendance
    console.log('\n2️⃣ Testing unified QR attendance submission...');
    const unifiedData = {
      qrCodeData: JSON.stringify({
        id: 'qr-live-test-456',
        location: { latitude: 5.29888, longitude: -2.001131 },
        timestamp: new Date().toISOString(),
        type: 'attendance_qr'
      }),
      userLocation: { latitude: 5.29888, longitude: -2.001131 },
      studentId: 'STU002',
      additionalData: { source: 'live_test' }
    };

    await axios.post(`${BASE_URL}/api/attendance-unified/qr-location`, unifiedData);
    console.log('   ✅ Unified QR attendance submitted');
    
    // Wait for Socket.IO event
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: Submit another QR attendance with failed location
    console.log('\n3️⃣ Testing QR attendance with failed location verification...');
    const failedLocationData = {
      qrCodeData: JSON.stringify({
        id: 'qr-failed-test-789',
        location: { latitude: 5.29888, longitude: -2.001131 },
        timestamp: new Date().toISOString(),
        type: 'attendance_qr'
      }),
      userLocation: { latitude: 5.30000, longitude: -2.00500 }, // Different location (should fail)
      studentId: 'STU003',
      additionalData: { source: 'failed_location_test' }
    };

    await axios.post(`${BASE_URL}/api/attendance-unified/qr-location`, failedLocationData);
    console.log('   ✅ Failed location QR attendance submitted');
    
    // Wait for Socket.IO event
    await new Promise(resolve => setTimeout(resolve, 1000));

  } catch (error) {
    console.error('❌ Error during attendance submission tests:', error.message);
  }

  // Disconnect after tests
  setTimeout(() => {
    console.log('\n🔚 Test completed. Disconnecting...');
    socket.disconnect();
    process.exit(0);
  }, 3000);
}

// Handle process exit
process.on('SIGINT', () => {
  console.log('\n🔚 Test interrupted. Disconnecting...');
  socket.disconnect();
  process.exit(0);
});
