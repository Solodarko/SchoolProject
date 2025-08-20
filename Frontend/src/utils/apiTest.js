/**
 * Backend API Test Utility
 * Use this to test if backend endpoints are working
 */

import { getAuthHeaders } from './authUtils';

export const testBackendEndpoints = async () => {
  const endpoints = [
    { name: 'Health Check', url: '/api/health', auth: false },
    { name: 'Auth Verify', url: '/api/auth/verify', auth: true },
    { name: 'Attendance Dashboard', url: '/api/attendance/dashboard', auth: true },
    { name: 'Zoom Real-time', url: '/api/zoom/real-time', auth: true },
    { name: 'Attendance Trends', url: '/api/attendance/trends', auth: true }
  ];

  console.log('🧪 Testing Backend Endpoints...');
  console.log('=====================================');

  const results = [];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing: ${endpoint.name}`);
      console.log(`   URL: ${endpoint.url}`);

      const headers = endpoint.auth ? getAuthHeaders() : { 'Content-Type': 'application/json' };
      
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers
      });

      const status = response.status;
      const statusText = response.statusText;
      
      let data;
      try {
        data = await response.json();
      } catch {
        data = await response.text();
      }

      console.log(`   Status: ${status} ${statusText}`);
      
      if (response.ok) {
        console.log(`   ✅ SUCCESS`);
        if (data && typeof data === 'object') {
          console.log(`   📊 Data keys:`, Object.keys(data));
        }
      } else {
        console.log(`   ❌ FAILED`);
        console.log(`   📄 Response:`, data);
      }

      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status,
        statusText,
        success: response.ok,
        data
      });

    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: 'ERROR',
        success: false,
        error: error.message
      });
    }
  }

  console.log('\n📋 Summary:');
  console.log('=============');
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}: ${result.status}`);
  });

  const successCount = results.filter(r => r.success).length;
  console.log(`\n🎯 Results: ${successCount}/${results.length} endpoints working`);
  
  if (successCount === 0) {
    console.log('\n💡 Recommendations:');
    console.log('   1. Check if backend server is running on port 5000');
    console.log('   2. Verify you are signed in (authentication token exists)');
    console.log('   3. Check browser console for CORS or network errors');
  }

  return results;
};

export const testAttendanceDashboard = async () => {
  console.log('🎯 Testing Attendance Dashboard Endpoint Specifically...');
  
  try {
    const dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = new Date().toISOString().split('T')[0];
    
    const url = `/api/attendance/dashboard?dateFrom=${dateFrom}&dateTo=${dateTo}`;
    console.log('📡 Request URL:', url);
    
    const headers = getAuthHeaders();
    console.log('🔐 Request Headers:', headers);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Dashboard data received:', data);
      
      if (data.success) {
        console.log('📈 Statistics:', data.overallStatistics);
        console.log('📅 Meetings count:', data.meetings?.length || 0);
        console.log('📍 QR Stats available:', !!data.qrLocationStatistics);
      }
      
      return { success: true, data };
    } else {
      const errorData = await response.text();
      console.log('❌ Error response:', errorData);
      return { success: false, error: errorData, status: response.status };
    }
    
  } catch (error) {
    console.log('💥 Network error:', error.message);
    return { success: false, error: error.message };
  }
};

// Auto-add to window for easy debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.testBackend = testBackendEndpoints;
  window.testDashboard = testAttendanceDashboard;
  
  console.log('\n🛠️ Backend Test Tools Available:');
  console.log('  window.testBackend() - Test all backend endpoints');
  console.log('  window.testDashboard() - Test attendance dashboard specifically');
}

export default {
  testBackendEndpoints,
  testAttendanceDashboard
};
