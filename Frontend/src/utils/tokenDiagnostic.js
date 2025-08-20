/**
 * Comprehensive Token Diagnostic Tool
 * Use this to diagnose and fix token issues in the user dashboard
 */

import { getAuthToken, setAuthToken, clearAuthToken } from './authUtils';
import Cookies from 'js-cookie';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

class TokenDiagnostic {
  /**
   * Run comprehensive token diagnostics
   */
  static async runFullDiagnostic() {
    console.log('🏥 ===== COMPREHENSIVE TOKEN DIAGNOSTIC =====');
    console.log('Timestamp:', new Date().toISOString());
    console.log('API Base URL:', API_BASE_URL);
    
    const results = {
      timestamp: new Date().toISOString(),
      storageCheck: this.checkTokenStorage(),
      tokenValidation: await this.validateTokenFormat(),
      apiConnectivity: await this.testAPIConnectivity(),
      authEndpointTest: await this.testAuthEndpoints(),
      recommendations: []
    };

    // Generate recommendations based on results
    results.recommendations = this.generateRecommendations(results);

    // Log summary
    this.logDiagnosticSummary(results);

    return results;
  }

  /**
   * Check token storage across different locations
   */
  static checkTokenStorage() {
    console.log('🔍 1. Checking Token Storage...');
    
    const storage = {
      cookies: {
        authToken: Cookies.get('authToken'),
        username: Cookies.get('username'),
        userRole: Cookies.get('userRole')
      },
      localStorage: {
        authToken: localStorage.getItem('authToken'),
        token: localStorage.getItem('token'),
        username: localStorage.getItem('username'),
        userRole: localStorage.getItem('userRole')
      },
      sessionStorage: {
        authToken: sessionStorage.getItem('authToken'),
        username: sessionStorage.getItem('username'),
        userRole: sessionStorage.getItem('userRole')
      }
    };

    const authUtilsToken = getAuthToken();

    const results = {
      cookiesPresent: !!storage.cookies.authToken,
      localStoragePresent: !!(storage.localStorage.authToken || storage.localStorage.token),
      sessionStoragePresent: !!storage.sessionStorage.authToken,
      authUtilsWorking: !!authUtilsToken,
      primaryToken: authUtilsToken,
      storage
    };

    console.log('   Storage Results:', {
      'Cookies': results.cookiesPresent ? '✅' : '❌',
      'LocalStorage': results.localStoragePresent ? '✅' : '❌',
      'SessionStorage': results.sessionStoragePresent ? '✅' : '❌',
      'AuthUtils': results.authUtilsWorking ? '✅' : '❌'
    });

    return results;
  }

  /**
   * Validate token format and structure
   */
  static async validateTokenFormat() {
    console.log('🔍 2. Validating Token Format...');
    
    const token = getAuthToken();
    
    if (!token) {
      console.log('   ❌ No token available for validation');
      return { valid: false, error: 'No token found' };
    }

    const validation = {
      token: token,
      length: token.length,
      format: 'unknown',
      parts: 0,
      isJWT: false,
      payload: null,
      expired: false,
      error: null
    };

    try {
      // Check if it's a JWT token
      const tokenParts = token.split('.');
      validation.parts = tokenParts.length;
      
      if (tokenParts.length === 3) {
        validation.isJWT = true;
        validation.format = 'JWT';
        
        // Try to decode payload
        try {
          const payload = JSON.parse(atob(tokenParts[1]));
          validation.payload = payload;
          
          // Check expiration
          if (payload.exp) {
            validation.expired = Date.now() >= (payload.exp * 1000);
          }
          
          console.log('   ✅ JWT Token Structure Valid');
          console.log('   📋 Payload:', {
            userId: payload.userId,
            username: payload.username,
            email: payload.email,
            role: payload.role,
            exp: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'No expiration',
            expired: validation.expired
          });
          
        } catch (decodeError) {
          validation.error = 'JWT payload decode error: ' + decodeError.message;
          console.log('   ❌ JWT Payload Decode Error:', decodeError.message);
        }
      } else {
        validation.format = 'Non-JWT';
        console.log('   ⚠️ Token is not in JWT format (parts:', tokenParts.length, ')');
      }

      // Test with backend token debugger
      if (validation.isJWT) {
        try {
          const debugResponse = await fetch(`${API_BASE_URL}/api/token-test/debug`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
          });

          if (debugResponse.ok) {
            const debugData = await debugResponse.json();
            validation.backendValidation = debugData.debug;
            console.log('   🔍 Backend Token Debug:', debugData.debug.isValid ? '✅ Valid' : '❌ Invalid');
          }
        } catch (error) {
          console.log('   ⚠️ Could not validate with backend:', error.message);
        }
      }

    } catch (error) {
      validation.error = error.message;
      console.log('   ❌ Token validation error:', error.message);
    }

    validation.valid = validation.isJWT && !validation.expired && !validation.error;

    return validation;
  }

  /**
   * Test API connectivity
   */
  static async testAPIConnectivity() {
    console.log('🔍 3. Testing API Connectivity...');
    
    const tests = [];

    // Test 1: Basic health check
    try {
      const healthResponse = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      tests.push({
        name: 'Health Check',
        success: healthResponse.ok,
        status: healthResponse.status,
        url: `${API_BASE_URL}/api/health`
      });

      console.log('   Health Check:', healthResponse.ok ? '✅ Success' : '❌ Failed');
    } catch (error) {
      tests.push({
        name: 'Health Check',
        success: false,
        error: error.message,
        url: `${API_BASE_URL}/api/health`
      });
      console.log('   Health Check: ❌ Error:', error.message);
    }

    // Test 2: Token source check endpoint
    const token = getAuthToken();
    if (token) {
      try {
        const tokenSourceResponse = await fetch(`${API_BASE_URL}/api/token-test/check-token-sources`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        tests.push({
          name: 'Token Source Check',
          success: tokenSourceResponse.ok,
          status: tokenSourceResponse.status,
          url: `${API_BASE_URL}/api/token-test/check-token-sources`
        });

        if (tokenSourceResponse.ok) {
          const data = await tokenSourceResponse.json();
          console.log('   Token Source Check: ✅ Success');
          console.log('   Token Sources:', data.sources);
        } else {
          console.log('   Token Source Check: ❌ Failed');
        }
      } catch (error) {
        tests.push({
          name: 'Token Source Check',
          success: false,
          error: error.message,
          url: `${API_BASE_URL}/api/token-test/check-token-sources`
        });
        console.log('   Token Source Check: ❌ Error:', error.message);
      }
    }

    return {
      allTestsPassed: tests.every(test => test.success),
      tests
    };
  }

  /**
   * Test authentication endpoints
   */
  static async testAuthEndpoints() {
    console.log('🔍 4. Testing Authentication Endpoints...');
    
    const token = getAuthToken();
    const tests = [];

    if (!token) {
      console.log('   ⚠️ No token available for auth endpoint testing');
      return { error: 'No token available', tests: [] };
    }

    // Test 1: Auth verify endpoint
    try {
      const verifyResponse = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const verifyResult = {
        name: 'Auth Verify',
        success: verifyResponse.ok,
        status: verifyResponse.status,
        url: `${API_BASE_URL}/api/auth/verify`
      };

      if (verifyResponse.ok) {
        const data = await verifyResponse.json();
        verifyResult.data = data;
        console.log('   Auth Verify: ✅ Success');
        console.log('   User Data:', data.user);
      } else {
        const error = await verifyResponse.text();
        verifyResult.error = error;
        console.log('   Auth Verify: ❌ Failed -', verifyResponse.status, error);
      }

      tests.push(verifyResult);
    } catch (error) {
      tests.push({
        name: 'Auth Verify',
        success: false,
        error: error.message,
        url: `${API_BASE_URL}/api/auth/verify`
      });
      console.log('   Auth Verify: ❌ Network Error -', error.message);
    }

    // Test 2: Token test auth endpoint
    try {
      const testAuthResponse = await fetch(`${API_BASE_URL}/api/token-test/test-auth`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const testAuthResult = {
        name: 'Token Test Auth',
        success: testAuthResponse.ok,
        status: testAuthResponse.status,
        url: `${API_BASE_URL}/api/token-test/test-auth`
      };

      if (testAuthResponse.ok) {
        const data = await testAuthResponse.json();
        testAuthResult.data = data;
        console.log('   Token Test Auth: ✅ Success');
      } else {
        const error = await testAuthResponse.text();
        testAuthResult.error = error;
        console.log('   Token Test Auth: ❌ Failed -', testAuthResponse.status);
      }

      tests.push(testAuthResult);
    } catch (error) {
      tests.push({
        name: 'Token Test Auth',
        success: false,
        error: error.message,
        url: `${API_BASE_URL}/api/token-test/test-auth`
      });
      console.log('   Token Test Auth: ❌ Network Error -', error.message);
    }

    return {
      allTestsPassed: tests.every(test => test.success),
      tests
    };
  }

  /**
   * Generate recommendations based on diagnostic results
   */
  static generateRecommendations(results) {
    const recommendations = [];

    // Check storage issues
    if (!results.storageCheck.authUtilsWorking) {
      if (results.storageCheck.localStoragePresent && !results.storageCheck.cookiesPresent) {
        recommendations.push({
          priority: 'HIGH',
          category: 'Token Storage',
          issue: 'Token found in localStorage but not accessible via authUtils',
          solution: 'Migrate token from localStorage to cookies',
          action: 'tokenMigration'
        });
      } else if (!results.storageCheck.cookiesPresent && !results.storageCheck.localStoragePresent) {
        recommendations.push({
          priority: 'CRITICAL',
          category: 'Authentication',
          issue: 'No authentication token found',
          solution: 'User needs to log in again',
          action: 'relogin'
        });
      }
    }

    // Check token validation issues
    if (results.tokenValidation.valid === false) {
      if (results.tokenValidation.expired) {
        recommendations.push({
          priority: 'HIGH',
          category: 'Token Expiry',
          issue: 'Authentication token has expired',
          solution: 'Clear expired token and prompt for re-login',
          action: 'clearAndReLogin'
        });
      } else if (results.tokenValidation.error) {
        recommendations.push({
          priority: 'HIGH',
          category: 'Token Format',
          issue: 'Token format is invalid: ' + results.tokenValidation.error,
          solution: 'Clear corrupted token and prompt for re-login',
          action: 'clearAndReLogin'
        });
      }
    }

    // Check API connectivity issues
    if (!results.apiConnectivity.allTestsPassed) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'API Connectivity',
        issue: 'Some API endpoints are not responding correctly',
        solution: 'Check backend server status and network connectivity',
        action: 'checkBackend'
      });
    }

    // Check auth endpoint issues
    if (!results.authEndpointTest.allTestsPassed) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Authentication',
        issue: 'Authentication endpoints are failing',
        solution: 'Token may be invalid or backend authentication is broken',
        action: 'debugAuth'
      });
    }

    return recommendations;
  }

  /**
   * Execute recommended fixes
   */
  static async executeRecommendedFix(actionType) {
    console.log('🔧 Executing recommended fix:', actionType);

    switch (actionType) {
      case 'tokenMigration':
        return await this.migrateTokenFromLocalStorage();
      
      case 'relogin':
        return this.redirectToLogin();
      
      case 'clearAndReLogin':
        return this.clearTokenAndRedirectToLogin();
      
      case 'checkBackend':
        return this.checkBackendStatus();
      
      case 'debugAuth':
        return await this.runAuthDebug();
      
      default:
        console.log('❌ Unknown fix action:', actionType);
        return { success: false, message: 'Unknown fix action' };
    }
  }

  /**
   * Migrate token from localStorage to cookies
   */
  static async migrateTokenFromLocalStorage() {
    const localToken = localStorage.getItem('authToken') || localStorage.getItem('token');
    const localUsername = localStorage.getItem('username');
    const localRole = localStorage.getItem('userRole');

    if (localToken) {
      try {
        const success = setAuthToken({
          token: localToken,
          username: localUsername || 'unknown',
          role: localRole || 'user'
        });

        if (success) {
          console.log('✅ Token successfully migrated to cookies');
          
          // Clear old localStorage entries
          localStorage.removeItem('authToken');
          localStorage.removeItem('token');
          
          return { success: true, message: 'Token migrated successfully' };
        } else {
          console.log('❌ Failed to migrate token to cookies');
          return { success: false, message: 'Token migration failed' };
        }
      } catch (error) {
        console.log('❌ Error during token migration:', error);
        return { success: false, message: 'Token migration error: ' + error.message };
      }
    }

    return { success: false, message: 'No token found in localStorage to migrate' };
  }

  /**
   * Clear token and redirect to login
   */
  static clearTokenAndRedirectToLogin() {
    console.log('🧹 Clearing tokens and redirecting to login...');
    
    try {
      clearAuthToken();
      console.log('✅ Tokens cleared');
      
      // Redirect to login page
      window.location.href = '/signin';
      
      return { success: true, message: 'Tokens cleared and redirecting to login' };
    } catch (error) {
      console.log('❌ Error clearing tokens:', error);
      return { success: false, message: 'Error clearing tokens: ' + error.message };
    }
  }

  /**
   * Redirect to login page
   */
  static redirectToLogin() {
    console.log('🚀 Redirecting to login page...');
    window.location.href = '/signin';
    return { success: true, message: 'Redirecting to login' };
  }

  /**
   * Check backend server status
   */
  static async checkBackendStatus() {
    console.log('🏥 Checking backend server status...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend server is healthy:', data);
        return { success: true, message: 'Backend server is running', data };
      } else {
        console.log('⚠️ Backend server returned error:', response.status);
        return { success: false, message: `Backend server error: ${response.status}` };
      }
    } catch (error) {
      console.log('❌ Cannot reach backend server:', error.message);
      return { success: false, message: 'Cannot reach backend server: ' + error.message };
    }
  }

  /**
   * Run detailed authentication debug
   */
  static async runAuthDebug() {
    console.log('🐛 Running detailed authentication debug...');
    
    const token = getAuthToken();
    if (!token) {
      return { success: false, message: 'No token available for auth debug' };
    }

    try {
      const debugResponse = await fetch(`${API_BASE_URL}/api/token-test/debug`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      if (debugResponse.ok) {
        const debugData = await debugResponse.json();
        console.log('🔍 Auth Debug Results:', debugData);
        return { success: true, message: 'Auth debug completed', data: debugData };
      } else {
        const error = await debugResponse.text();
        console.log('❌ Auth debug failed:', error);
        return { success: false, message: 'Auth debug failed: ' + error };
      }
    } catch (error) {
      console.log('❌ Auth debug error:', error.message);
      return { success: false, message: 'Auth debug error: ' + error.message };
    }
  }

  /**
   * Log diagnostic summary
   */
  static logDiagnosticSummary(results) {
    console.log('\n📋 ===== DIAGNOSTIC SUMMARY =====');
    console.log('Timestamp:', results.timestamp);
    console.log('Overall Status:', this.getOverallStatus(results));
    
    if (results.recommendations.length > 0) {
      console.log('\n🔧 RECOMMENDATIONS:');
      results.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority}] ${rec.category}: ${rec.issue}`);
        console.log(`   Solution: ${rec.solution}`);
        console.log(`   Action: ${rec.action}`);
      });
    } else {
      console.log('✅ No issues found!');
    }
    
    console.log('📋 ===== END DIAGNOSTIC SUMMARY =====\n');
  }

  /**
   * Get overall diagnostic status
   */
  static getOverallStatus(results) {
    const criticalIssues = results.recommendations.filter(r => r.priority === 'CRITICAL').length;
    const highIssues = results.recommendations.filter(r => r.priority === 'HIGH').length;
    const mediumIssues = results.recommendations.filter(r => r.priority === 'MEDIUM').length;

    if (criticalIssues > 0) return '🔴 CRITICAL - Authentication completely broken';
    if (highIssues > 0) return '🟠 HIGH - Major authentication issues';
    if (mediumIssues > 0) return '🟡 MEDIUM - Minor issues detected';
    return '🟢 HEALTHY - All systems working';
  }
}

// Auto-run diagnostic in development mode
if (import.meta.env.DEV) {
  // Make diagnostic available globally
  window.TokenDiagnostic = TokenDiagnostic;
  
  console.log('🛠️ Token Diagnostic Tool Available:');
  console.log('  TokenDiagnostic.runFullDiagnostic() - Run complete diagnostic');
  console.log('  TokenDiagnostic.executeRecommendedFix(actionType) - Execute fixes');
  
  // Auto-run after a short delay to allow page to load
  setTimeout(() => {
    console.log('🏥 Auto-running token diagnostic in development mode...');
    TokenDiagnostic.runFullDiagnostic().catch(error => {
      console.error('❌ Diagnostic error:', error);
    });
  }, 3000);
}

export default TokenDiagnostic;
