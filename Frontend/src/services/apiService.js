/**
 * API Service for Backend Connectivity
 * Handles all API calls for student management, meetings, and attendance tracking
 */

import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Authentication APIs
  auth: {
    login: (credentials) => api.post('/api/auth/login', credentials),
    register: (userData) => api.post('/api/auth/register', userData),
    refreshToken: () => api.post('/api/auth/refresh'),
    logout: () => api.post('/api/auth/logout'),
    getProfile: () => api.get('/api/auth/profile'),
  },

  // Student Management APIs
  students: {
    getAll: (params = {}) => api.get('/students', { params }),
    getById: (id) => api.get(`/students/${id}`),
    create: (studentData) => api.post('/students', studentData),
    update: (id, studentData) => api.put(`/students/${id}`, studentData),
    delete: (id) => api.delete(`/students/${id}`),
    search: (query) => api.get(`/students/search?q=${query}`),
    getByClass: (className) => api.get(`/students/class/${className}`),
    getBulk: (studentIds) => api.post('/students/bulk', { studentIds }),
    import: (csvData) => api.post('/students/import', csvData),
    export: (format = 'csv') => api.get(`/students/export?format=${format}`),
  },

  // Course Management APIs
  courses: {
    getAll: () => api.get('/courses'),
    getById: (id) => api.get(`/courses/${id}`),
    create: (courseData) => api.post('/courses', courseData),
    update: (id, courseData) => api.put(`/courses/${id}`, courseData),
    delete: (id) => api.delete(`/courses/${id}`),
    getStudents: (courseId) => api.get(`/courses/${courseId}/students`),
    addStudent: (courseId, studentId) => api.post(`/courses/${courseId}/students/${studentId}`),
    removeStudent: (courseId, studentId) => api.delete(`/courses/${courseId}/students/${studentId}`),
  },

  // Zoom Integration APIs
  zoom: {
    // OAuth Authentication
    getAuthUrl: () => api.get('/zoom/oauth/url'),
    handleCallback: (code, state) => api.post('/zoom/oauth/callback', { code, state }),
    refreshZoomToken: () => api.post('/zoom/oauth/refresh'),
    
    // Meeting Management
    createMeeting: (meetingData) => api.post('/zoom/meetings', meetingData),
    getMeeting: (meetingId) => api.get(`/zoom/meetings/${meetingId}`),
    updateMeeting: (meetingId, meetingData) => api.put(`/zoom/meetings/${meetingId}`, meetingData),
    deleteMeeting: (meetingId) => api.delete(`/zoom/meetings/${meetingId}`),
    listMeetings: (params = {}) => api.get('/zoom/meetings', { params }),
    
    // Meeting Participants
    getParticipants: (meetingId) => api.get(`/zoom/meetings/${meetingId}/participants`),
    getParticipantReport: (meetingUuid) => api.get(`/zoom/reports/meetings/${meetingUuid}/participants`),
    
    // Signature Generation for SDK
    generateSignature: (meetingData) => api.post('/zoom/sdk/signature', meetingData),
    
    // Webhooks
    handleWebhook: (webhookData) => api.post('/zoom/webhooks', webhookData),
    
    // Meeting Data Validation - Fixed to prevent includes() errors
    validateMeetingData: (data) => {
      const errors = [];
      
      // Safe validation with type checking to prevent includes() errors
      if (!data || typeof data !== 'object') {
        errors.push('Meeting data is required');
        return errors;
      }
      
      // Topic validation with safe string checks
      if (!data.topic || typeof data.topic !== 'string' || data.topic.trim() === '') {
        errors.push('Meeting topic is required');
      } else if (data.topic && typeof data.topic === 'string' && data.topic.length > 200) {
        errors.push('Meeting topic must be less than 200 characters');
      }
      
      // Duration validation with safe number checks
      if (!data.duration || typeof data.duration !== 'number' || data.duration < 15) {
        errors.push('Duration must be at least 15 minutes');
      } else if (data.duration && typeof data.duration === 'number' && data.duration > 1440) {
        errors.push('Duration cannot exceed 24 hours (1440 minutes)');
      }
      
      // Start time validation for scheduled meetings with safe date checks
      if (data.type === 2) { // Scheduled meeting
        if (!data.startTime) {
          errors.push('Start time is required for scheduled meetings');
        } else {
          const startTime = new Date(data.startTime);
          const now = new Date();
          if (isNaN(startTime.getTime())) {
            errors.push('Invalid start time format');
          } else if (startTime <= now) {
            errors.push('Start time must be in the future');
          }
        }
      }
      
      // Password validation with safe string checks
      if (data.password && typeof data.password === 'string' && data.password.length > 10) {
        errors.push('Password cannot exceed 10 characters');
      }
      
      // Agenda validation with safe string checks
      if (data.agenda && typeof data.agenda === 'string' && data.agenda.length > 2000) {
        errors.push('Agenda cannot exceed 2000 characters');
      }
      
      return errors;
    },
  },

  // Attendance Management APIs
  attendance: {
    // Meeting Attendance
    recordAttendance: (attendanceData) => api.post('/attendance/record', attendanceData),
    getAttendance: (params = {}) => api.get('/attendance', { params }),
    getAttendanceByMeeting: (meetingId) => api.get(`/attendance/meeting/${meetingId}`),
    getAttendanceByStudent: (studentId) => api.get(`/attendance/student/${studentId}`),
    getAttendanceByDate: (date) => api.get(`/attendance/date/${date}`),
    getAttendanceByDateRange: (startDate, endDate) => api.get(`/attendance/range/${startDate}/${endDate}`),
    
    // Bulk Operations
    bulkRecordAttendance: (attendanceList) => api.post('/attendance/bulk', attendanceList),
    markAttendanceFromZoom: (meetingData) => api.post('/attendance/zoom-sync', meetingData),
    
    // Analytics
    getAttendanceStats: (params = {}) => api.get('/attendance/stats', { params }),
    getAttendanceTrends: (params = {}) => api.get('/attendance/trends', { params }),
    getClasswiseStats: (className) => api.get(`/attendance/class/${className}/stats`),
    getStudentAttendanceReport: (studentId, params = {}) => 
      api.get(`/attendance/student/${studentId}/report`, { params }),
    
    // Export
    exportAttendance: (params = {}) => api.get('/attendance/export', { params }),
  },

  // Reports APIs
  reports: {
    getDashboardStats: () => api.get('/reports/dashboard'),
    getAttendanceReport: (params = {}) => api.get('/reports/attendance', { params }),
    getStudentReport: (studentId, params = {}) => api.get(`/reports/student/${studentId}`, { params }),
    getClassReport: (className, params = {}) => api.get(`/reports/class/${className}`, { params }),
    getMeetingReport: (meetingId) => api.get(`/reports/meeting/${meetingId}`),
    getCustomReport: (reportConfig) => api.post('/reports/custom', reportConfig),
  },

  // Real-time APIs
  realtime: {
    connect: () => api.post('/realtime/connect'),
    disconnect: () => api.post('/realtime/disconnect'),
    sendMessage: (message) => api.post('/realtime/message', message),
    getActiveConnections: () => api.get('/realtime/connections'),
  },

  // Utility APIs
  utils: {
    healthCheck: () => api.get('/health'),
    getServerTime: () => api.get('/utils/time'),
    testConnection: () => api.get('/utils/test'),
    uploadFile: (file, type) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      return api.post('/utils/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  },
};

// Helper functions for common operations
export const apiHelpers = {
  // Student matching for Zoom participants
  matchStudentsToParticipants: async (participants) => {
    try {
      const response = await apiService.students.getBulk(
        participants.map(p => p.email || p.name)
      );
      return response.data;
    } catch (error) {
      console.error('Error matching students to participants:', error);
      return [];
    }
  },

  // Automatic attendance marking
  markAttendanceFromMeeting: async (meetingData, participants, threshold = 75) => {
    try {
      const attendanceData = participants.map(participant => ({
        meetingId: meetingData.id,
        studentEmail: participant.email,
        studentName: participant.name,
        joinTime: participant.joinTime,
        leaveTime: participant.leaveTime,
        duration: participant.duration,
        attendancePercentage: participant.attendancePercentage,
        status: participant.attendancePercentage >= threshold ? 'present' : 'absent',
        meetingTopic: meetingData.topic,
        meetingDate: new Date(meetingData.start_time).toISOString().split('T')[0],
      }));

      const response = await apiService.attendance.bulkRecordAttendance(attendanceData);
      return response.data;
    } catch (error) {
      console.error('Error marking attendance from meeting:', error);
      throw error;
    }
  },

  // Sync with Zoom meeting data
  syncZoomMeetingData: async (meetingId) => {
    try {
      // Get meeting details
      const meetingResponse = await apiService.zoom.getMeeting(meetingId);
      const meeting = meetingResponse.data;

      // Get participants report
      const participantsResponse = await apiService.zoom.getParticipantReport(meeting.uuid);
      const participants = participantsResponse.data;

      // Match participants with students
      const matchedStudents = await apiHelpers.matchStudentsToParticipants(participants);

      // Calculate attendance and mark
      const attendanceResult = await apiHelpers.markAttendanceFromMeeting(
        meeting, 
        participants
      );

      return {
        meeting,
        participants,
        matchedStudents,
        attendanceResult,
      };
    } catch (error) {
      console.error('Error syncing Zoom meeting data:', error);
      throw error;
    }
  },

  // Generate comprehensive attendance report
  generateAttendanceReport: async (filters = {}) => {
    try {
      const [
        attendanceData,
        stats,
        trends
      ] = await Promise.all([
        apiService.attendance.getAttendance(filters),
        apiService.attendance.getAttendanceStats(filters),
        apiService.attendance.getAttendanceTrends(filters),
      ]);

      return {
        attendance: attendanceData.data,
        statistics: stats.data,
        trends: trends.data,
        generatedAt: new Date().toISOString(),
        filters,
      };
    } catch (error) {
      console.error('Error generating attendance report:', error);
      throw error;
    }
  },
};

export default api;
