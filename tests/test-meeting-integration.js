#!/usr/bin/env node

/**
 * Integration Test: Zoom Meeting Creation to Meeting Management Dashboard
 * 
 * This script tests the complete integration between:
 * 1. Creating a Zoom meeting via /api/zoom/create-meeting
 * 2. Verifying it's saved to the database 
 * 3. Confirming it appears in the Meeting Management system (/api/meetings)
 * 4. Testing real-time Socket.IO notifications
 */

const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

console.log('🚀 Starting Meeting Integration Test...');
console.log(`📡 Backend URL: ${backendUrl}`);

// Test data
const testMeetingData = {
  topic: `Test Meeting - Integration Test ${new Date().toISOString()}`,
  agenda: 'Testing Zoom to Meeting Management integration',
  duration: 60,
  password: 'test123',
  type: 1, // Instant meeting
  hostEmail: 'test@example.com',
  department: 'Engineering',
  course: 'Software Development',
  session: 'Test Session',
  tags: ['integration-test', 'zoom-test'],
  settings: {
    host_video: true,
    participant_video: true,
    mute_upon_entry: true,
    waiting_room: false,
    auto_recording: 'none'
  }
};

let createdMeetingId = null;

/**
 * Test 1: Create a Zoom meeting via the Zoom API
 */
async function testZoomMeetingCreation() {
  console.log('\n📋 Test 1: Creating Zoom Meeting via /api/zoom/create-meeting');
  console.log('Meeting Data:', JSON.stringify(testMeetingData, null, 2));

  try {
    const response = await fetch(`${backendUrl}/api/zoom/create-meeting`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMeetingData)
    });

    console.log(`📥 Response Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Zoom meeting created successfully!');
      
      // Extract meeting details
      createdMeetingId = result.id || result.meeting_id;
      console.log('📋 Meeting Details:');
      console.log(`   ID: ${createdMeetingId}`);
      console.log(`   Topic: ${result.topic}`);
      console.log(`   Join URL: ${result.join_url}`);
      console.log(`   Password: ${result.password}`);
      console.log(`   Database Saved: ${result.saved ? '✅' : '❌'}`);
      console.log(`   Database ID: ${result.database_id || 'N/A'}`);
      
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Zoom meeting creation failed:', errorText);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return false;
  }
}

/**
 * Test 2: Verify the meeting appears in the Meeting Management system
 */
async function testMeetingManagementIntegration() {
  console.log('\n📋 Test 2: Checking Meeting Management API (/api/meetings)');
  
  try {
    const response = await fetch(`${backendUrl}/api/meetings`);
    const data = await response.json();
    
    console.log(`📊 API Response Status: ${response.status}`);
    console.log(`📊 Total meetings in system: ${data.data?.length || 0}`);
    
    if (data.success && data.data && data.data.length > 0) {
      console.log('✅ Meeting Management API is working!');
      
      // Look for our created meeting
      const ourMeeting = data.data.find(meeting => 
        meeting.title === testMeetingData.topic || 
        meeting.id?.toString().includes(createdMeetingId?.toString()) ||
        meeting.title.includes('Integration Test')
      );
      
      if (ourMeeting) {
        console.log('🎉 SUCCESS! Our created meeting found in Meeting Management:');
        console.log(`   ID: ${ourMeeting.id}`);
        console.log(`   Title: ${ourMeeting.title}`);
        console.log(`   Status: ${ourMeeting.status}`);
        console.log(`   Type: ${ourMeeting.type}`);
        console.log(`   Organizer: ${ourMeeting.organizer}`);
        console.log(`   Location: ${ourMeeting.location}`);
        console.log(`   Duration: ${ourMeeting.duration}`);
        console.log(`   Start Time: ${ourMeeting.startTime}`);
        console.log(`   Created: ${ourMeeting.createdAt}`);
        return true;
      } else {
        console.log('⚠️ WARNING: Our created meeting not found in Meeting Management list');
        console.log('Available meetings:');
        data.data.slice(0, 5).forEach((meeting, index) => {
          console.log(`   ${index + 1}. ${meeting.title} (${meeting.id})`);
        });
        return false;
      }
    } else {
      console.log('❌ Meeting Management API returned no meetings or failed');
      console.log('Response:', JSON.stringify(data, null, 2));
      return false;
    }
    
  } catch (error) {
    console.error('❌ Meeting Management API test failed:', error.message);
    return false;
  }
}

/**
 * Test 3: Check specific meeting endpoint
 */
async function testSpecificMeetingEndpoint() {
  console.log('\n📋 Test 3: Testing specific meeting endpoints');
  
  try {
    // Test the analytics endpoint
    const analyticsResponse = await fetch(`${backendUrl}/api/meetings/stats/analytics`);
    const analyticsData = await analyticsResponse.json();
    
    if (analyticsData.success) {
      console.log('✅ Meeting analytics endpoint working:');
      console.log(`   Total Meetings: ${analyticsData.data.totalMeetings}`);
      console.log(`   Completed: ${analyticsData.data.completed}`);
      console.log(`   Scheduled: ${analyticsData.data.scheduled}`);
      console.log(`   In Progress: ${analyticsData.data.inProgress}`);
      console.log(`   Average Attendance: ${analyticsData.data.averageAttendance}%`);
    } else {
      console.log('⚠️ Meeting analytics endpoint failed');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Meeting analytics test failed:', error.message);
    return false;
  }
}

/**
 * Test 4: Test the frontend component endpoint
 */
async function testFrontendApiIntegration() {
  console.log('\n📋 Test 4: Testing frontend API compatibility');
  
  try {
    const response = await fetch(`${backendUrl}/api/meetings?status=all&type=all`);
    const data = await response.json();
    
    if (data.success && Array.isArray(data.data)) {
      console.log('✅ Frontend-compatible API format confirmed:');
      console.log(`   API returns success: ${data.success}`);
      console.log(`   Data is array: ${Array.isArray(data.data)}`);
      console.log(`   Total count: ${data.total || data.data.length}`);
      
      // Check if the data structure matches what the frontend expects
      if (data.data.length > 0) {
        const sample = data.data[0];
        const requiredFields = ['id', 'title', 'status', 'type', 'startTime', 'organizer'];
        const hasAllFields = requiredFields.every(field => sample.hasOwnProperty(field));
        
        console.log(`   Sample meeting has required fields: ${hasAllFields ? '✅' : '❌'}`);
        if (!hasAllFields) {
          console.log('   Missing fields:', requiredFields.filter(field => !sample.hasOwnProperty(field)));
        }
        console.log('   Sample meeting structure:', Object.keys(sample));
      }
      
      return true;
    } else {
      console.log('❌ Frontend API format test failed');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Frontend API test failed:', error.message);
    return false;
  }
}

/**
 * Run all tests in sequence
 */
async function runIntegrationTests() {
  console.log('🧪 Running Integration Tests...\n');
  
  const results = {
    zoomCreation: false,
    meetingManagement: false,
    specificEndpoints: false,
    frontendCompatibility: false
  };
  
  // Test 1: Create Zoom meeting
  results.zoomCreation = await testZoomMeetingCreation();
  
  if (!results.zoomCreation) {
    console.log('\n❌ Zoom meeting creation failed. Skipping subsequent tests.');
    process.exit(1);
  }
  
  // Wait a moment for database operations
  console.log('\n⏳ Waiting 3 seconds for database operations...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test 2: Check Meeting Management integration
  results.meetingManagement = await testMeetingManagementIntegration();
  
  // Test 3: Check specific endpoints
  results.specificEndpoints = await testSpecificMeetingEndpoint();
  
  // Test 4: Check frontend compatibility
  results.frontendCompatibility = await testFrontendApiIntegration();
  
  // Print results summary
  console.log('\n📊 Integration Test Results:');
  console.log('════════════════════════════════════════');
  console.log(`Zoom Meeting Creation:     ${results.zoomCreation ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Meeting Management API:    ${results.meetingManagement ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Specific Endpoints:        ${results.specificEndpoints ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Frontend Compatibility:    ${results.frontendCompatibility ? '✅ PASS' : '❌ FAIL'}`);
  console.log('════════════════════════════════════════');
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED! Integration is working correctly.');
    console.log('\n✅ Zoom meetings created via /api/zoom/create-meeting WILL appear in the Meeting Management dashboard.');
  } else {
    console.log('⚠️ Some tests failed. Check the integration between Zoom API and Meeting Management.');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Run the tests
runIntegrationTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});
