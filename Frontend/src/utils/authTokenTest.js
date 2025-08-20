/**
 * Authentication Token Test Utility
 * Test script to verify proper token retrieval across different storage methods
 */

import { getAuthToken, setAuthToken } from './authUtils';

export const testAuthTokenRetrieval = () => {
  console.log('🧪 Testing Authentication Token Retrieval...');
  
  // Test 1: Check current token state
  console.log('1. Current token state:');
  const currentToken = getAuthToken();
  console.log('   Current token:', currentToken ? '✅ Found' : '❌ Not found');
  
  // Test 2: Check different storage locations
  console.log('2. Checking storage locations:');
  
  // Check cookies
  const cookieToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('authToken='))
    ?.split('=')[1];
  console.log('   Cookie authToken:', cookieToken ? '✅ Found' : '❌ Not found');
  
  // Check sessionStorage
  const sessionToken = sessionStorage.getItem('authToken');
  console.log('   SessionStorage authToken:', sessionToken ? '✅ Found' : '❌ Not found');
  
  // Check localStorage (old method)
  const localToken = localStorage.getItem('authToken');
  console.log('   LocalStorage authToken:', localToken ? '✅ Found' : '❌ Not found');
  
  const localToken2 = localStorage.getItem('token');
  console.log('   LocalStorage token:', localToken2 ? '✅ Found' : '❌ Not found');
  
  // Test 3: Test token setting and retrieval
  console.log('3. Testing token set/get cycle:');
  const testToken = 'test_token_' + Date.now();
  const setResult = setAuthToken({ token: testToken, username: 'testuser', role: 'student' });
  console.log('   Set token result:', setResult ? '✅ Success' : '❌ Failed');
  
  const retrievedToken = getAuthToken();
  console.log('   Retrieved token matches:', retrievedToken === testToken ? '✅ Match' : '❌ No match');
  
  // Test 4: Check User Dashboard compatibility
  console.log('4. User Dashboard compatibility test:');
  
  // This simulates what the User Dashboard was doing before the fix
  const oldMethod = localStorage.getItem('authToken') || localStorage.getItem('token');
  console.log('   Old method (localStorage):', oldMethod ? '✅ Found' : '❌ Not found');
  
  // This is what it should use now
  const newMethod = getAuthToken();
  console.log('   New method (authUtils):', newMethod ? '✅ Found' : '❌ Not found');
  
  console.log('5. Recommendation:');
  if (newMethod && !oldMethod) {
    console.log('   ✅ FIXED: Token is now accessible via proper auth utils');
    console.log('   🎯 User Dashboard should now work correctly');
  } else if (oldMethod && newMethod) {
    console.log('   ⚠️ Both methods work - migration successful');
  } else if (!newMethod && !oldMethod) {
    console.log('   ❌ No token found - user needs to log in');
  } else {
    console.log('   🔄 Mixed state - check implementation');
  }
  
  return {
    currentToken: currentToken,
    storageState: {
      cookie: !!cookieToken,
      session: !!sessionToken,
      localStorage: !!localToken,
      localStorageToken: !!localToken2
    },
    testPassed: retrievedToken === testToken,
    compatibility: {
      oldMethod: !!oldMethod,
      newMethod: !!newMethod,
      fixed: !!newMethod && !oldMethod
    }
  };
};

export const logAuthTokenState = () => {
  console.log('🔍 Current Authentication State:');
  console.log('Token via getAuthToken():', getAuthToken() ? 'Available' : 'Not available');
  console.log('User should be able to join meetings with authentication:', !!getAuthToken());
};

// Auto-run test in development
if (import.meta.env.DEV) {
  console.log('🔧 Development mode - running auth token test...');
  setTimeout(() => {
    testAuthTokenRetrieval();
  }, 1000);
}
