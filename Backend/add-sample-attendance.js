const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Sample student data for demonstration
const sampleStudents = [
  {
    studentId: '12001',
    name: 'Alice Johnson',
    department: 'Computer Science',
    location: { latitude: 5.29888, longitude: -2.001131 } // Exact match - Present
  },
  {
    studentId: '12002', 
    name: 'Bob Wilson',
    department: 'Engineering',
    location: { latitude: 5.29890, longitude: -2.001130 } // Close match - Present
  },
  {
    studentId: '12003',
    name: 'Carol Davis',
    department: 'Mathematics',
    location: { latitude: 5.29885, longitude: -2.001135 } // Close match - Present
  },
  {
    studentId: '12004',
    name: 'David Brown',
    department: 'Physics',
    location: { latitude: 5.30000, longitude: -2.00500 } // Far location - Absent
  },
  {
    studentId: '12005',
    name: 'Emma Garcia',
    department: 'Chemistry',
    location: { latitude: 5.29889, longitude: -2.001132 } // Very close - Present
  }
];

async function addSampleAttendanceRecords() {
  console.log('🎯 Adding 5 sample QR attendance records to Live Pulse Monitor...\n');

  try {
    // Check if server is running
    const healthCheck = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Server is running and healthy\n');

    for (let i = 0; i < sampleStudents.length; i++) {
      const student = sampleStudents[i];
      const recordNumber = i + 1;
      
      console.log(`${recordNumber}️⃣ Adding attendance record for ${student.name}...`);
      
      // Create QR code data
      const qrCodeData = {
        id: `qr-demo-${Date.now()}-${recordNumber}`,
        location: { latitude: 5.29888, longitude: -2.001131 }, // QR scanner location
        timestamp: new Date().toISOString(),
        type: 'attendance_qr',
        sessionId: 'demo-session-001',
        generatedBy: 'Admin Demo'
      };
      
      // Create attendance submission
      const attendanceData = {
        qrCodeData: JSON.stringify(qrCodeData),
        userLocation: student.location,
        studentId: student.studentId,
        additionalData: {
          source: 'demo_data',
          studentName: student.name,
          department: student.department,
          timestamp: new Date().toISOString()
        }
      };
      
      try {
        // Submit to unified attendance system
        const response = await axios.post(`${BASE_URL}/api/attendance-unified/qr-location`, attendanceData);
        
        const isPresent = response.data.status === 'Present';
        const verificationStatus = response.data.location.verification.status;
        const distance = response.data.location.distance;
        
        console.log(`   ✅ ${student.name}: ${isPresent ? 'Present' : 'Absent'} (${verificationStatus})`);
        console.log(`   📍 Distance: ${distance}m from QR scanner`);
        console.log(`   📄 Attendance ID: ${response.data.attendanceId}`);
        
        // Add small delay between submissions to show time progression
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`   ❌ Failed to add record for ${student.name}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Sample attendance records added successfully!');
    console.log('\n📊 Verification - Getting current statistics...');
    
    // Get updated statistics
    const statsResponse = await axios.get(`${BASE_URL}/api/attendance-unified/qr-location/stats`);
    const stats = statsResponse.data.stats;
    
    console.log(`   📈 Total Scans: ${stats.totalScans}`);
    console.log(`   👥 Unique Students: ${stats.uniqueStudents}`);
    console.log(`   📐 Average Distance: ${stats.averageDistance}m`);
    console.log(`   ✅ Verified: ${stats.verificationStatus.verified}`);
    console.log(`   ❌ Failed: ${stats.verificationStatus.failed}`);
    
    console.log('\n🎯 The Live Pulse Monitor table should now show these 5 new attendance records!');
    console.log('💡 Open the admin dashboard to see the real-time updates in action.');
    
  } catch (error) {
    console.error('❌ Error adding sample attendance records:', error.message);
    if (error.response?.data) {
      console.error('📄 Error details:', error.response.data);
    }
  }
}

// Run the script
addSampleAttendanceRecords()
  .then(() => {
    console.log('\n✅ Demo data setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Demo setup failed:', error.message);
    process.exit(1);
  });
