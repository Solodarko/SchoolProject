const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testQRAttendance() {
  console.log('🧪 Testing QR Attendance Functionality\n');

  try {
    // Test 1: Check if unified attendance routes exist
    console.log('1️⃣ Testing unified attendance endpoint...');
    
    const unifiedTestData = {
      qrCodeData: JSON.stringify({
        id: 'qr-unified-test-123',
        location: { latitude: 5.29888, longitude: -2.001131 },
        timestamp: new Date().toISOString(),
        type: 'attendance_qr'
      }),
      userLocation: { latitude: 5.29888, longitude: -2.001131 },
      studentId: '12345',
      additionalData: { source: 'unified_test_script' }
    };

    try {
      const response = await axios.post(`${BASE_URL}/api/attendance-unified/qr-location`, unifiedTestData);
      console.log('   ✅ Unified attendance QR endpoint works');
      console.log(`   📄 Response: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('   ✅ Unified attendance endpoint exists but validation failed');
        console.log(`   📄 Error: ${error.response.data.error}`);
      } else if (error.response?.status === 404) {
        console.log('   ❌ Unified attendance endpoint not found');
      } else {
        console.log('   ❌ Unified attendance endpoint error');
        console.log(`   📄 Error: ${error.response?.data?.error || error.message}`);
      }
    }

    // Test 2: Check if regular attendance routes exist (from routes/Attendance.js)
    console.log('\n2️⃣ Testing regular attendance endpoint...');
    
    const regularTestData = {
      studentId: "12345",
      scannerLocation: {
        coordinates: {
          latitude: 5.298880,
          longitude: -2.001131
        },
        distance: 5.0
      },
      userLocation: {
        lat: 5.298880,
        lng: -2.001131,
        accuracy: 3.0
      },
      attendanceType: 'qr_scan',
      scannedAt: new Date().toISOString()
    };
    
    try {
      const response = await axios.post(`${BASE_URL}/api/attendance/qr-location`, regularTestData);
      console.log('   ✅ Regular attendance endpoint works');
      console.log(`   📄 Response: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('   ✅ Regular attendance endpoint exists but validation failed (expected)');
        console.log(`   📄 Error: ${error.response.data.error}`);
      } else {
        console.log('   ❌ Regular attendance endpoint not found');
        console.log(`   📄 Error: ${error.message}`);
      }
    }

    // Test 3: Check QR location info endpoint
    console.log('\n3️⃣ Testing QR location info endpoint...');
    
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const response = await axios.get(`${BASE_URL}/api/attendance-unified/qr-location/stats`);
      console.log('   ✅ Unified QR location stats endpoint works');
      console.log(`   📄 Stats: ${JSON.stringify(response.data.stats, null, 2)}`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('   ❌ Unified QR location stats endpoint not found');
      } else {
        console.log(`   ❌ Unified QR location stats endpoint error: ${error.message}`);
      }
    }

    try {
      const response = await axios.get(`${BASE_URL}/api/attendance/qr-location/info?dateFrom=${today}&dateTo=${today}`);
      console.log('   ✅ Regular QR location info endpoint works');
      console.log(`   📄 Stats: ${JSON.stringify(response.data.statistics, null, 2)}`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('   ❌ Regular QR location info endpoint not found');
      } else {
        console.log(`   ❌ Regular QR location info endpoint error: ${error.message}`);
      }
    }

    // Test 4: Check QR attendance generation endpoint
    console.log('\n4️⃣ Testing QR attendance generation...');
    
    const qrData = {
      sessionTitle: "Test QR Attendance Session",
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      options: {
        width: 300,
        margin: 2
      }
    };

    try {
      const response = await axios.post(`${BASE_URL}/api/qr-attendance/generate`, qrData);
      console.log('   ✅ QR attendance generation works');
      console.log(`   📄 QR Session ID: ${response.data.data.sessionId}`);
      console.log(`   📄 QR Code ID: ${response.data.data.qrCodeId}`);
      console.log(`   📄 Valid Until: ${response.data.data.validUntil}`);
    } catch (error) {
      console.log(`   ❌ QR attendance generation failed: ${error.message}`);
    }

    // Test 5: Check health endpoint
    console.log('\n5️⃣ Testing system health...');
    
    try {
      const response = await axios.get(`${BASE_URL}/api/health`);
      console.log('   ✅ System health endpoint works');
      console.log(`   📄 Active Meetings: ${response.data.activeMeetings}`);
      console.log(`   📄 Active Participants: ${response.data.activeParticipants}`);
      console.log(`   📄 Socket.IO Connected: ${response.data.socketIO?.connected || 0}`);
    } catch (error) {
      console.log(`   ❌ System health endpoint failed: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run the test
testQRAttendance().then(() => {
  console.log('\n✅ QR Attendance test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test suite error:', error.message);
  process.exit(1);
});
