/**
 * Auth Refresh Utility
 * Handles token refresh and 401 error recovery
 */

import { getAuthToken, clearAuthToken, setAuthToken } from './authUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const handleAuthError = async (response, originalRequest = null) => {
  if (response.status === 401) {
    console.log('🔄 401 Error detected - attempting token refresh...');
    
    // Try to refresh the session
    const refreshSuccess = await refreshAuthSession();
    
    if (refreshSuccess && originalRequest) {
      console.log('✅ Token refreshed successfully, retrying original request...');
      // Retry the original request with new token
      const token = getAuthToken();
      if (token) {
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return fetch(originalRequest.url, originalRequest);
      }
    } else {
      console.log('❌ Token refresh failed, redirecting to login...');
      handleAuthFailure();
    }
  }
  
  return response;
};

export const refreshAuthSession = async () => {
  try {
    console.log('🔄 Attempting to refresh auth session...');
    
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.token) {
        console.log('✅ Auth session refreshed successfully');
        setAuthToken({
          token: data.token,
          username: data.username,
          role: data.role
        });
        return true;
      }
    }
    
    console.log('❌ Auth session refresh failed');
    return false;
  } catch (error) {
    console.error('Auth refresh error:', error);
    return false;
  }
};

export const handleAuthFailure = () => {
  console.log('🔄 Handling auth failure - clearing tokens and redirecting...');
  
  // Clear all auth data
  clearAuthToken();
  
  // Redirect to login page
  const currentPath = window.location.pathname;
  if (currentPath !== '/login' && currentPath !== '/') {
    window.location.href = '/login?redirect=' + encodeURIComponent(currentPath);
  }
};

export const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = getAuthToken();
  
  if (!token) {
    console.log('❌ No auth token available for request');
    handleAuthFailure();
    throw new Error('No authentication token available');
  }
  
  const requestOptions = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  };
  
  console.log('🔐 Making authenticated request to:', url);
  
  try {
    const response = await fetch(url, requestOptions);
    
    if (response.status === 401) {
      console.log('🔄 401 detected, attempting to handle auth error...');
      return await handleAuthError(response, { url, ...requestOptions });
    }
    
    return response;
  } catch (error) {
    console.error('Authenticated request failed:', error);
    throw error;
  }
};

export const validateToken = async (token) => {
  if (!token) {
    return { valid: false, reason: 'No token provided' };
  }
  
  try {
    // Check token format (should be JWT with 3 parts)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, reason: 'Invalid token format' };
    }
    
    // Try to decode the payload
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token is expired
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return { valid: false, reason: 'Token expired', expired: true };
    }
    
    // Test token with backend
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return { 
        valid: data.success, 
        reason: data.success ? 'Valid' : data.message,
        user: data.user 
      };
    } else {
      return { 
        valid: false, 
        reason: `Server error: ${response.status}`,
        status: response.status 
      };
    }
  } catch (error) {
    return { 
      valid: false, 
      reason: `Validation error: ${error.message}` 
    };
  }
};

export const ensureValidAuth = async () => {
  const token = getAuthToken();
  
  if (!token) {
    console.log('❌ No token found');
    return false;
  }
  
  const validation = await validateToken(token);
  
  if (!validation.valid) {
    console.log('❌ Token validation failed:', validation.reason);
    
    if (validation.expired) {
      console.log('🔄 Token expired, attempting refresh...');
      const refreshed = await refreshAuthSession();
      if (refreshed) {
        return true;
      }
    }
    
    handleAuthFailure();
    return false;
  }
  
  console.log('✅ Auth validation successful');
  return true;
};

export default {
  handleAuthError,
  refreshAuthSession,
  handleAuthFailure,
  makeAuthenticatedRequest,
  validateToken,
  ensureValidAuth
};
