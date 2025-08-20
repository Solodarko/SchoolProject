/**
 * Quick Auth Fix Utility
 * Run this to diagnose and potentially fix 401 authentication errors
 */

import { getAuthToken, clearAuthToken } from './authUtils';
import { validateToken } from './authRefresh';

export const runQuickAuthDiagnostic = async () => {
  console.log('🔧 ===== QUICK AUTH DIAGNOSTIC START =====');
  
  const results = {
    tokenFound: false,
    tokenValid: false,
    serverReachable: false,
    recommendations: []
  };
  
  // Step 1: Check if token exists
  console.log('1. 🔍 Checking for authentication token...');
  const token = getAuthToken();
  
  if (!token) {
    console.log('❌ No authentication token found');
    results.recommendations.push('User needs to log in again');
    console.log('🔧 ===== DIAGNOSTIC COMPLETE =====');
    return results;
  }
  
  console.log('✅ Token found:', token.substring(0, 30) + '...');
  results.tokenFound = true;
  
  // Step 2: Validate token format and expiration
  console.log('2. 🔍 Validating token...');
  const validation = await validateToken(token);
  
  if (!validation.valid) {
    console.log('❌ Token validation failed:', validation.reason);
    results.recommendations.push(`Token issue: ${validation.reason}`);
    
    if (validation.expired) {
      results.recommendations.push('Token has expired - user needs to log in again');
    } else if (validation.status === 401) {
      results.recommendations.push('Server rejected token - possible JWT secret mismatch');
    }
  } else {
    console.log('✅ Token is valid');
    results.tokenValid = true;
  }
  
  // Step 3: Test server connectivity
  console.log('3. 🔍 Testing server connectivity...');
  try {
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
    const healthResponse = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (healthResponse.ok) {
      console.log('✅ Server is reachable');
      results.serverReachable = true;
    } else {
      console.log('⚠️ Server health check failed:', healthResponse.status);
      results.recommendations.push('Server may be experiencing issues');
    }
  } catch (error) {
    console.log('❌ Cannot reach server:', error.message);
    results.recommendations.push('Server is not running or not accessible');
  }
  
  // Step 4: Provide recommendations
  console.log('4. 💡 Recommendations:');
  if (results.recommendations.length === 0) {
    if (results.tokenFound && results.tokenValid && results.serverReachable) {
      console.log('✅ Authentication should be working correctly');
      results.recommendations.push('Authentication appears to be working correctly');
    } else {
      results.recommendations.push('Unknown issue - check browser console for errors');
    }
  }
  
  results.recommendations.forEach((rec, index) => {
    console.log(`   ${index + 1}. ${rec}`);
  });
  
  console.log('🔧 ===== DIAGNOSTIC COMPLETE =====');
  return results;
};

export const quickAuthFix = async () => {
  console.log('🔧 ===== QUICK AUTH FIX START =====');
  
  const diagnostic = await runQuickAuthDiagnostic();
  
  if (!diagnostic.tokenFound || !diagnostic.tokenValid) {
    console.log('🧹 Clearing invalid/missing auth data...');
    clearAuthToken();
    console.log('✅ Auth data cleared - user should log in again');
    
    // Redirect to login if we're not already there
    if (window.location.pathname !== '/login') {
      console.log('🔄 Redirecting to login page...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
    
    return { success: true, action: 'cleared_auth_and_redirecting' };
  }
  
  if (diagnostic.tokenValid && diagnostic.serverReachable) {
    console.log('✅ No fix needed - authentication is working');
    return { success: true, action: 'no_action_needed' };
  }
  
  console.log('⚠️ Unable to automatically fix the issue');
  console.log('💡 Manual intervention may be required');
  
  console.log('🔧 ===== QUICK FIX COMPLETE =====');
  return { success: false, action: 'manual_intervention_required' };
};

// Auto-run in development mode
if (import.meta.env.DEV) {
  // Check if we're getting 401 errors by monitoring console
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    
    if (response.status === 401 && args[0].includes('/api/auth/verify')) {
      console.log('🚨 401 Error detected on auth verify - running diagnostic...');
      setTimeout(runQuickAuthDiagnostic, 1000);
    }
    
    return response;
  };
}

export default {
  runQuickAuthDiagnostic,
  quickAuthFix
};
