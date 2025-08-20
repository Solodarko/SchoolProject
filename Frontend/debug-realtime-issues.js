#!/usr/bin/env node

/**
 * Real-Time Attendance Tracker Debug Script
 * 
 * This script helps diagnose why the attendance tracker isn't showing real-time participants
 */

console.log('🔍 REAL-TIME ATTENDANCE TRACKER DEBUG\n');

// 1. Check Backend Health
console.log('1. Backend Health Check...');
fetch('http://localhost:5000/api/health')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Backend is healthy');
    console.log(`   - Active Meetings: ${data.activeMeetings}`);
    console.log(`   - Active Participants: ${data.activeParticipants}`);
    console.log(`   - Socket.IO Connected: ${data.socketIO.connected}`);
    console.log(`   - Real-time Tracking: ${data.realTimeTracking.enabled ? 'Enabled' : 'Disabled'}`);
  })
  .catch(error => {
    console.log('❌ Backend health check failed:', error.message);
  });

// 2. Check Real-time Endpoint
console.log('\n2. Real-time Endpoint Check...');
fetch('http://localhost:5000/api/zoom/real-time')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Real-time endpoint working');
    console.log(`   - Active Meetings: ${data.activeMeetings.length}`);
    console.log(`   - Total Participants: ${data.analytics.totalParticipants}`);
    console.log(`   - Active Participants: ${data.analytics.activeParticipants}`);
    
    if (data.activeMeetings.length > 0) {
      data.activeMeetings.forEach((meeting, index) => {
        console.log(`   Meeting ${index + 1}:`);
        console.log(`     - ID: ${meeting.id}`);
        console.log(`     - Topic: ${meeting.topic}`);
        console.log(`     - Status: ${meeting.status}`);
        console.log(`     - Participants: ${meeting.participantCount}`);
      });
    } else {
      console.log('   ⚠️ No active meetings found');
    }
  })
  .catch(error => {
    console.log('❌ Real-time endpoint failed:', error.message);
  });

// 3. Environment Variables Analysis
console.log('\n3. Environment Variables Analysis...');
console.log('   Frontend should be using:');
console.log(`   - VITE_BACKEND_URL=${process.env.VITE_BACKEND_URL || 'NOT_SET'}`);
console.log(`   - VITE_API_BASE_URL=${process.env.VITE_API_BASE_URL || 'NOT_SET'}`);
console.log('   Legacy variables:');
console.log(`   - REACT_APP_BACKEND_URL=${process.env.REACT_APP_BACKEND_URL || 'NOT_SET'}`);

// 4. Common Issues & Solutions
console.log('\n4. COMMON ISSUES & SOLUTIONS:');
console.log('\n❌ Issue 1: No Real Participants');
console.log('   Solution: Someone needs to actually join the Zoom meeting');
console.log('   - Admin creates meeting → Users click "Join Live" → Participants appear');

console.log('\n❌ Issue 2: Environment Variable Inconsistency');
console.log('   Solution: Use consistent env vars across all components');
console.log('   - Replace REACT_APP_* with VITE_* variables');
console.log('   - Use import.meta.env instead of process.env');

console.log('\n❌ Issue 3: WebSocket Connection Issues');
console.log('   Solution: Ensure all components use same backend URL');
console.log('   - Use http://localhost:5000 (not ws:// or different ports)');

console.log('\n❌ Issue 4: Missing Real-time Events');
console.log('   Solution: Backend needs to emit WebSocket events');
console.log('   - participantJoined, participantLeft, meetingStarted');

console.log('\n🔧 IMMEDIATE FIXES NEEDED:');
console.log('   1. Fix environment variable usage in components');
console.log('   2. Test with actual Zoom meeting participants'); 
console.log('   3. Verify WebSocket event emissions from backend');
console.log('   4. Check browser console for WebSocket connection errors');

console.log('\n📝 TO TEST:');
console.log('   1. Create a meeting in admin dashboard');
console.log('   2. Join the meeting from user dashboard (opens Zoom)');
console.log('   3. Check if participant appears in real-time tracker');
console.log('   4. Monitor browser console for WebSocket events');
