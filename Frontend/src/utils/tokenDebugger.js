/**
 * Token Debugger Utility
 * Helps diagnose token issues in the UserZoomDashboard component
 */

import { getAuthToken, setAuthToken } from './authUtils';
import Cookies from 'js-cookie';

export const debugTokenFlow = () => {
  console.log('🔧 ===== TOKEN DEBUG FLOW START =====');
  
  // 1. Check all possible token storage locations
  console.log('1. Token Storage Analysis:');
  const cookieToken = Cookies.get('authToken');
  const sessionToken = sessionStorage.getItem('authToken');
  const localToken = localStorage.getItem('authToken');
  const localToken2 = localStorage.getItem('token');
  
  console.log('   - Cookie authToken:', cookieToken ? '✅ Present' : '❌ Missing');
  console.log('   - SessionStorage authToken:', sessionToken ? '✅ Present' : '❌ Missing');
  console.log('   - LocalStorage authToken:', localToken ? '✅ Present' : '❌ Missing');
  console.log('   - LocalStorage token:', localToken2 ? '✅ Present' : '❌ Missing');
  
  // 2. Test getAuthToken() function
  console.log('2. getAuthToken() Function Test:');
  const retrievedToken = getAuthToken();
  console.log('   - Retrieved token:', retrievedToken ? '✅ Success' : '❌ Failed');
  
  if (retrievedToken) {
    console.log('   - Token length:', retrievedToken.length);
    console.log('   - First 30 chars:', retrievedToken.substring(0, 30) + '...');
    
    // Try to decode JWT to see if it's valid
    try {
      const tokenParts = retrievedToken.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('   - JWT Payload:', {
          userId: payload.userId,
          username: payload.username,
          email: payload.email,
          role: payload.role,
          exp: payload.exp ? new Date(payload.exp * 1000) : 'No expiration',
          isExpired: payload.exp ? Date.now() > payload.exp * 1000 : false
        });
      }
    } catch (error) {
      console.log('   - JWT decode error:', error.message);
    }
  }
  
  // 3. Test token in API call
  console.log('3. API Call Test:');
  if (retrievedToken) {
    testTokenAPICall(retrievedToken);
  } else {
    console.log('   - ❌ Cannot test API call without token');
  }
  
  // 4. Recommendations
  console.log('4. Recommendations:');
  if (!retrievedToken) {
    console.log('   - ❌ No token found - user needs to log in');
    console.log('   - 💡 Check if login process is storing token correctly');
  } else {
    console.log('   - ✅ Token is available for API calls');
    console.log('   - 💡 UserZoomDashboard should work with authentication');
  }
  
  console.log('🔧 ===== TOKEN DEBUG FLOW END =====\n');
  
  return {
    hasToken: !!retrievedToken,
    tokenSource: cookieToken ? 'cookies' : sessionToken ? 'sessionStorage' : localToken ? 'localStorage-authToken' : localToken2 ? 'localStorage-token' : 'none',
    tokenLength: retrievedToken?.length || 0,
    isValid: !!retrievedToken && retrievedToken.length > 10
  };
};

const testTokenAPICall = async (token) => {
  try {
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
    
    console.log('🧪 Testing token with API call to:', `${backendUrl}/api/auth/verify`);
    console.log('🧪 Token being sent:', token.substring(0, 30) + '...');
    
    // Test with a simple authenticated endpoint
    const response = await fetch(`${backendUrl}/api/auth/verify`, {
      method: 'GET',
      credentials: 'include', // Include cookies
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('   - ✅ Token verification successful:', data.success ? 'Valid' : 'Invalid');
    } else {
      console.log('   - ❌ Token verification failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('   - ❌ API call error:', error.message);
  }
};

export const fixUserDashboardToken = () => {
  console.log('🔧 Attempting to fix UserZoomDashboard token issues...');
  
  // Check if token exists in old locations and migrate
  const localToken = localStorage.getItem('authToken') || localStorage.getItem('token');
  const sessionToken = sessionStorage.getItem('authToken');
  const cookieToken = Cookies.get('authToken');
  
  if (localToken && !cookieToken) {
    console.log('📦 Found token in localStorage, migrating to cookies...');
    setAuthToken({ token: localToken, username: 'unknown', role: 'user' });
    console.log('✅ Token migrated to cookies');
    return true;
  }
  
  if (sessionToken && !cookieToken) {
    console.log('📦 Found token in sessionStorage, migrating to cookies...');
    setAuthToken({ token: sessionToken, username: 'unknown', role: 'user' });
    console.log('✅ Token migrated to cookies');
    return true;
  }
  
  if (cookieToken) {
    console.log('✅ Token already properly stored in cookies');
    return true;
  }
  
  console.log('❌ No token found to fix');
  return false;
};

// Auto-run debug if in development
if (import.meta.env.DEV) {
  // Delay to allow other components to load
  setTimeout(() => {
    console.log('🔧 Auto-running token debug in development mode...');
    debugTokenFlow();
  }, 2000);
}

export default {
  debugTokenFlow,
  fixUserDashboardToken,
  testTokenAPICall
};
