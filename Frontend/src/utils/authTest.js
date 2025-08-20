/**
 * Authentication Test Utility
 * Use this to debug authentication issues
 */

import Cookies from 'js-cookie';
import { getAuthToken } from './authUtils';

export const debugAuthStatus = () => {
  console.log('🔍 Authentication Debug Status:');
  console.log('================================');
  
  // Check cookies
  const authToken = Cookies.get('authToken');
  const userRole = Cookies.get('userRole');
  const username = Cookies.get('username');
  
  console.log('📄 Cookie Values:');
  console.log('  authToken:', authToken ? `${authToken.substring(0, 20)}...` : 'NOT FOUND');
  console.log('  userRole:', userRole || 'NOT FOUND');
  console.log('  username:', username || 'NOT FOUND');
  
  // Check localStorage as backup
  console.log('\n💾 LocalStorage Values:');
  try {
    const lsToken = localStorage.getItem('authToken');
    const lsRole = localStorage.getItem('userRole');
    const lsUsername = localStorage.getItem('username');
    
    console.log('  authToken:', lsToken ? `${lsToken.substring(0, 20)}...` : 'NOT FOUND');
    console.log('  userRole:', lsRole || 'NOT FOUND');
    console.log('  username:', lsUsername || 'NOT FOUND');
  } catch (e) {
    console.log('  localStorage not available');
  }
  
  // Test auth utility
  console.log('\n🔧 Auth Utility Test:');
  const utilToken = getAuthToken();
  console.log('  getAuthToken():', utilToken ? `${utilToken.substring(0, 20)}...` : 'NOT FOUND');
  
  // Recommendation
  console.log('\n💡 Recommendation:');
  if (!authToken && !utilToken) {
    console.log('  ❌ No authentication token found');
    console.log('  🚀 Solution: Sign in first at /signin');
    console.log('  📝 Then navigate to admin dashboard');
  } else {
    console.log('  ✅ Authentication token found');
    console.log('  🧪 Test /api/auth/verify endpoint');
  }
  
  return {
    hasToken: !!(authToken || utilToken),
    userRole,
    username
  };
};

export const testAuthEndpoint = async () => {
  console.log('🧪 Testing Auth Endpoint...');
  
  const token = getAuthToken();
  if (!token) {
    console.log('❌ No token available for testing');
    return { success: false, error: 'No authentication token' };
  }
  
  try {
    const response = await fetch('/api/auth/verify', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Auth endpoint working:', data);
      return { success: true, data };
    } else {
      const error = await response.text();
      console.log('❌ Auth endpoint failed:', error);
      return { success: false, error, status: response.status };
    }
  } catch (error) {
    console.log('💥 Network error:', error.message);
    return { success: false, error: error.message };
  }
};

// Auto-run debug on import in development
if (process.env.NODE_ENV === 'development') {
  // Add to window for easy access in console
  window.debugAuth = debugAuthStatus;
  window.testAuth = testAuthEndpoint;
  
  console.log('\n🛠️ Auth Debug Tools Available:');
  console.log('  window.debugAuth() - Check auth status');
  console.log('  window.testAuth() - Test auth endpoint');
}

export default {
  debugAuthStatus,
  testAuthEndpoint
};
