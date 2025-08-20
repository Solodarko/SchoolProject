// ===========================================
// API CONFIGURATION
// ===========================================

// Base API URL from environment variables
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${BASE_URL}/api`;

// API Endpoints Configuration
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    VERIFY: `${API_BASE_URL}/auth/verify`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
  },
  
  // User endpoints
  USER: {
    PROFILE: `${API_BASE_URL}/user/profile`,
    UPDATE: `${API_BASE_URL}/user/update`,
  },
  
  // Admin endpoints
  ADMIN: {
    DASHBOARD: `${API_BASE_URL}/admin/dashboard`,
    USERS: `${API_BASE_URL}/admin/users`,
  },
  
  // Student endpoints
  STUDENTS: {
    LIST: `${BASE_URL}/stu`,
    CREATE: `${BASE_URL}/stu`,
    UPDATE: `${BASE_URL}/stu`,
    DELETE: `${BASE_URL}/stu`,
  },
  
  // Attendance endpoints
  ATTENDANCE: {
    LOGS: `${API_BASE_URL}/attendance`,
    ANALYTICS: `${API_BASE_URL}/attendance/analytics`,
  },
  
  // Zoom endpoints
  ZOOM: {
    MEETINGS: `${API_BASE_URL}/zoom/meetings`,
    PARTICIPANTS: `${API_BASE_URL}/participants`,
    REALTIME: `${API_BASE_URL}/realtime`,
  },
  
  // Health check
  HEALTH: `${API_BASE_URL}/health`,
};

// Default fetch configuration
export const DEFAULT_FETCH_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  credentials: 'include',
  mode: 'cors',
};

// Helper function to create API requests
export const createApiRequest = (endpoint, options = {}) => {
  return fetch(endpoint, {
    ...DEFAULT_FETCH_CONFIG,
    ...options,
    headers: {
      ...DEFAULT_FETCH_CONFIG.headers,
      ...options.headers,
    },
  });
};

// Export the base URL for any custom usage
export { API_BASE_URL };
