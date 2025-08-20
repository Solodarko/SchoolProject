// src/utils/authUtils.js
import Cookies from 'js-cookie';

const getCookieOptions = () => {
  const isSecure = window.location.protocol === 'https:';
  return {
    expires: 7,
    path: '/',
    sameSite: isSecure ? 'None' : 'Lax',
    secure: isSecure
  };
};

export const getAuthToken = () => {
  try {
    console.log('🔍 getAuthToken() called - checking token sources...');
    
    const cookieToken = Cookies.get('authToken');
    console.log('Cookie token check:', {
      found: !!cookieToken,
      length: cookieToken?.length || 0,
      firstChars: cookieToken?.substring(0, 20) + '...' || 'N/A'
    });
    
    if (cookieToken) {
      console.log('✅ Returning token from cookies');
      return cookieToken;
    }

    const sessionToken = sessionStorage.getItem('authToken');
    console.log('SessionStorage token check:', {
      found: !!sessionToken,
      length: sessionToken?.length || 0,
      firstChars: sessionToken?.substring(0, 20) + '...' || 'N/A'
    });
    
    if (sessionToken) {
      console.log('✅ Found token in sessionStorage, restoring to cookies...');
      // If token exists in sessionStorage but not in cookies, try to restore it
      setAuthToken({ token: sessionToken });
      return sessionToken;
    }

    console.log('❌ No token found in any storage location');
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const setAuthToken = (result) => {
  if (!result?.token || typeof result.token !== 'string' || result.token.trim() === '') {
    console.error('Invalid token value:', result?.token);
    return false;
  }

  try {
    const cookieOptions = getCookieOptions();
    
    // Set auth data in cookies
    Cookies.set('authToken', result.token, cookieOptions);
    if (result.username) Cookies.set('username', result.username, cookieOptions);
    if (result.role) Cookies.set('userRole', result.role, cookieOptions);

    // Verify cookie was set
    const cookieCheck = Cookies.get('authToken');
    if (cookieCheck) {
      console.log('Auth data set successfully in cookies');
      return true;
    }

    // Fallback to sessionStorage if cookies fail
    sessionStorage.setItem('authToken', result.token);
    if (result.username) sessionStorage.setItem('username', result.username);
    if (result.role) sessionStorage.setItem('userRole', result.role);
    
    return true;
  } catch (error) {
    console.error('Error setting auth data:', error);
    return false;
  }
};

export const clearAuthToken = () => {
  try {
    const cookieOptions = getCookieOptions();
    
    // Clear cookies
    Cookies.remove('authToken', cookieOptions);
    Cookies.remove('username', cookieOptions);
    Cookies.remove('userRole', cookieOptions);
    
    // Clear sessionStorage
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('userRole');
    
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};

export const isAuthenticated = () => {
  try {
    const token = getAuthToken();
    return !!token;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

export const getAuthHeaders = () => {
  try {
    const token = getAuthToken();
    console.log('🔐 getAuthHeaders() called:', { hasToken: !!token });
    
    if (!token) {
      console.log('❌ No auth token available for headers');
      return {
        'Content-Type': 'application/json'
      };
    }
    
    console.log('✅ Including auth token in headers');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  } catch (error) {
    console.error('Error getting auth headers:', error);
    return {
      'Content-Type': 'application/json'
    };
  }
};

export const getUserRole = () => {
  try {
    return Cookies.get('userRole') || sessionStorage.getItem('userRole') || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

export const getUsername = () => {
  try {
    return Cookies.get('username') || sessionStorage.getItem('username') || null;
  } catch (error) {
    console.error('Error getting username:', error);
    return null;
  }
};

export const isAdmin = () => {
  try {
    const role = getUserRole();
    return role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};
