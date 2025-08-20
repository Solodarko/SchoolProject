/**
 * BROWSER CONSOLE COMMANDS TO FIX 401 AUTH ERRORS
 * 
 * Copy and paste these commands into your browser console to diagnose and fix auth issues
 */

// === QUICK FIX COMMAND ===
// Run this first to attempt an automatic fix
(async () => {
  console.log('🔧 Running Quick Auth Fix...');
  
  // Check if token exists
  const checkCookieToken = () => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('authToken='))
      ?.split('=')[1];
  };
  
  const checkSessionToken = () => {
    return sessionStorage.getItem('authToken');
  };
  
  const clearAllAuth = () => {
    // Clear cookies
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Clear session storage
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('userRole');
    
    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    
    console.log('✅ All auth data cleared');
  };
  
  const testToken = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return { success: response.ok, status: response.status, response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Step 1: Check for tokens
  const cookieToken = checkCookieToken();
  const sessionToken = checkSessionToken();
  
  console.log('Token Check Results:');
  console.log('- Cookie token:', cookieToken ? '✅ Found' : '❌ Missing');
  console.log('- Session token:', sessionToken ? '✅ Found' : '❌ Missing');
  
  const token = cookieToken || sessionToken;
  
  if (!token) {
    console.log('❌ No token found - user needs to log in');
    console.log('💡 Go to /login page to authenticate');
    return;
  }
  
  // Step 2: Test the token
  console.log('🧪 Testing token with server...');
  const testResult = await testToken(token);
  
  if (testResult.success) {
    console.log('✅ Token is valid - 401 error may be temporary');
    console.log('💡 Try refreshing the page');
  } else {
    console.log('❌ Token test failed:', testResult.status || testResult.error);
    console.log('🧹 Clearing invalid auth data...');
    clearAllAuth();
    console.log('💡 Please log in again at /login');
    
    // Auto-redirect after delay
    setTimeout(() => {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }, 3000);
  }
})();

// === MANUAL DIAGNOSTIC COMMANDS ===
// Use these for detailed debugging

// Check all token storage locations
console.log('=== TOKEN STORAGE CHECK ===');
console.log('Cookie token:', document.cookie.split('; ').find(row => row.startsWith('authToken=')));
console.log('Session token:', sessionStorage.getItem('authToken'));
console.log('Local token:', localStorage.getItem('authToken'));
console.log('Local token2:', localStorage.getItem('token'));

// Decode JWT token (if found)
const decodeJWT = (token) => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return {
      ...payload,
      isExpired: payload.exp ? Date.now() > payload.exp * 1000 : false,
      expiresAt: payload.exp ? new Date(payload.exp * 1000) : null
    };
  } catch (error) {
    return { error: error.message };
  }
};

const token = document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1] || sessionStorage.getItem('authToken');
if (token) {
  console.log('=== TOKEN DETAILS ===');
  console.log('Decoded payload:', decodeJWT(token));
} else {
  console.log('❌ No token to decode');
}

// Test server connectivity
fetch('http://localhost:5000/health')
  .then(response => {
    console.log('=== SERVER CONNECTIVITY ===');
    console.log('Server health:', response.ok ? '✅ Online' : '❌ Issues');
    console.log('Status:', response.status);
  })
  .catch(error => {
    console.log('=== SERVER CONNECTIVITY ===');
    console.log('❌ Server unreachable:', error.message);
  });

// === FORCE LOGIN COMMAND ===
// Use this to clear everything and go to login
const forceLogin = () => {
  console.log('🔄 Forcing fresh login...');
  
  // Clear all auth data
  document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  sessionStorage.clear();
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  
  // Redirect to login
  window.location.href = '/login';
};

console.log('\n💡 Available commands:');
console.log('- forceLogin() - Clear auth and go to login');
console.log('- decodeJWT(token) - Decode a JWT token');

// Make functions available globally
window.forceLogin = forceLogin;
window.decodeJWT = decodeJWT;
