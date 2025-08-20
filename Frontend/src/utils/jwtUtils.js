import { getAuthToken } from './authUtils';

/**
 * Decode JWT token and extract user information
 * @param {string} token - JWT token to decode
 * @returns {Object|null} Decoded user information or null if invalid
 */
export const decodeJWTToken = (token) => {
  try {
    if (!token) {
      console.warn('No token provided to decode');
      return null;
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/, '');
    
    // JWT has three parts separated by dots
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid JWT token format');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64
    const decodedPayload = JSON.parse(atob(paddedPayload));
    
    // Check if token is expired
    if (decodedPayload.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (now >= decodedPayload.exp) {
        console.warn('JWT token has expired');
        return null;
      }
    }

    return {
      userId: decodedPayload.userId,
      username: decodedPayload.username,
      email: decodedPayload.email,
      role: decodedPayload.role,
      exp: decodedPayload.exp,
      iat: decodedPayload.iat,
      isExpired: decodedPayload.exp ? Math.floor(Date.now() / 1000) >= decodedPayload.exp : false,
      expiresAt: decodedPayload.exp ? new Date(decodedPayload.exp * 1000) : null,
      issuedAt: decodedPayload.iat ? new Date(decodedPayload.iat * 1000) : null
    };
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

/**
 * Get current user information from stored auth token
 * @returns {Object|null} User information or null if no valid token
 */
export const getCurrentUserInfo = () => {
  try {
    const token = getAuthToken();
    if (!token) {
      console.warn('No auth token found');
      return null;
    }

    return decodeJWTToken(token);
  } catch (error) {
    console.error('Error getting current user info:', error);
    return null;
  }
};

/**
 * Get user email from auth token
 * @returns {string|null} User email or null if not available
 */
export const getUserEmail = () => {
  try {
    const userInfo = getCurrentUserInfo();
    return userInfo?.email || null;
  } catch (error) {
    console.error('Error getting user email:', error);
    return null;
  }
};

/**
 * Get user full information from auth token
 * @returns {Object} User information with fallbacks from cookies
 */
export const getUserFullInfo = () => {
  try {
    const userInfo = getCurrentUserInfo();
    
    if (userInfo) {
      return {
        userId: userInfo.userId,
        username: userInfo.username,
        email: userInfo.email,
        role: userInfo.role,
        isExpired: userInfo.isExpired,
        expiresAt: userInfo.expiresAt,
        issuedAt: userInfo.issuedAt
      };
    }

    // Fallback to cookies if JWT decode fails
    const username = document.cookie
      .split('; ')
      .find(row => row.startsWith('username='))
      ?.split('=')[1];
    
    const role = document.cookie
      .split('; ')
      .find(row => row.startsWith('userRole='))
      ?.split('=')[1];

    return {
      userId: null,
      username: username || 'Unknown',
      email: null,
      role: role || 'user',
      isExpired: false,
      expiresAt: null,
      issuedAt: null
    };
  } catch (error) {
    console.error('Error getting user full info:', error);
    return {
      userId: null,
      username: 'Unknown',
      email: null,
      role: 'user',
      isExpired: false,
      expiresAt: null,
      issuedAt: null
    };
  }
};

/**
 * Check if current user token is valid and not expired
 * @returns {boolean} True if token is valid
 */
export const isTokenValid = () => {
  try {
    const userInfo = getCurrentUserInfo();
    return userInfo && !userInfo.isExpired;
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
};

export default {
  decodeJWTToken,
  getCurrentUserInfo,
  getUserEmail,
  getUserFullInfo,
  isTokenValid
};
