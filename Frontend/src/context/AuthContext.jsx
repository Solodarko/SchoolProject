import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setAuthToken, clearAuthToken } from '../utils/authUtils';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Get auth token from cookies
  const getAuthToken = useCallback(() => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('authToken='))
      ?.split('=')[1];
  }, []);

  // API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Fetch user profile with student information
  const fetchUserProfile = useCallback(async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
          setStudent(data.student);
          setIsAuthenticated(true);
          return data;
        } else {
          throw new Error(data.message || 'Failed to fetch profile');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
      setStudent(null);
      setIsAuthenticated(false);
      throw error;
    }
  }, [API_BASE_URL]);

  // Verify token and get user data
  const verifyToken = useCallback(async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Get full profile with student info
          await fetchUserProfile(token);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }, [API_BASE_URL, fetchUserProfile]);

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Store token using utility function for proper persistence
        const tokenData = {
          token: data.token,
          username: data.user?.username,
          role: data.user?.role
        };
        
        const tokenSet = setAuthToken(tokenData);
        console.log('🔐 Token persistence result:', tokenSet);
        
        // Fetch full profile after successful login and token storage
        await fetchUserProfile(data.token);
        return { success: true, message: data.message };
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }, [API_BASE_URL, fetchUserProfile]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Call backend logout endpoint
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state
      setUser(null);
      setStudent(null);
      setIsAuthenticated(false);
      
      // Use utility to clear all auth data properly
      clearAuthToken();
      
      // Clear any localStorage items as well
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      localStorage.removeItem('userRole');
      localStorage.removeItem('user');
      localStorage.removeItem('student');
    }
  }, [API_BASE_URL]);

  // Refresh user data
  const refreshUserData = useCallback(async () => {
    const token = getAuthToken();
    if (token) {
      try {
        await fetchUserProfile(token);
      } catch (error) {
        console.error('Failed to refresh user data:', error);
        logout();
      }
    }
  }, [getAuthToken, fetchUserProfile, logout]);

  // Get user identity for QR codes
  const getUserIdentity = useCallback(() => {
    if (!user) return null;

    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      studentId: student?.studentId || null,
      firstName: student?.firstName || null,
      lastName: student?.lastName || null,
      fullName: student?.fullName || user.username,
      department: student?.department || null,
      hasStudentRecord: !!student,
      timestamp: new Date().toISOString()
    };
  }, [user, student]);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      const token = getAuthToken();
      
      if (token) {
        try {
          await verifyToken(token);
        } catch (error) {
          console.error('Auth initialization error:', error);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, [getAuthToken, verifyToken]);

  const contextValue = {
    // State
    user,
    student,
    loading,
    isAuthenticated,
    
    // Actions
    login,
    logout,
    refreshUserData,
    getUserIdentity,
    
    // Computed values
    isAdmin: user?.role === 'admin',
    isUser: user?.role === 'user',
    hasStudentRecord: !!student,
    displayName: student?.fullName || user?.username || 'User',
    
    // API utility
    getAuthToken,
    apiBaseUrl: API_BASE_URL
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
