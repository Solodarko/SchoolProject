import axios from 'axios';
import { getAuthToken } from '../utils/authUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

class AttendanceAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/attendance`;
    
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth
    this.client.interceptors.request.use((config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Start tracking a meeting
  async startTracking(meetingId) {
    const response = await this.client.post(`/start/${meetingId}`);
    return response.data;
  }

  // Stop tracking a meeting
  async stopTracking(meetingId, generateReport = true) {
    const response = await this.client.post(`/stop/${meetingId}`, {
      generateReport
    });
    return response.data;
  }

  // Get current attendance for a meeting
  async getCurrentAttendance(meetingId) {
    const response = await this.client.get(`/current/${meetingId}`);
    return response.data;
  }

  // Get live participants from Zoom API
  async getLiveParticipants(meetingId) {
    const response = await this.client.get(`/attendance/${meetingId}`);
    return response.data;
  }

  // Generate final report for a meeting
  async generateReport(meetingId) {
    const response = await this.client.post(`/generate-report/${meetingId}`);
    return response.data;
  }

  // Get attendance summary
  async getAttendanceSummary(dateFrom, dateTo, studentId = null) {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    if (studentId) params.append('studentId', studentId);
    
    const response = await this.client.get(`/summary?${params.toString()}`);
    return response.data;
  }

  // Get tracking status for all meetings
  async getTrackingStatus() {
    const response = await this.client.get('/status');
    return response.data;
  }

  // Manual update attendance for a meeting
  async manualUpdate(meetingId) {
    const response = await this.client.post(`/manual-update/${meetingId}`);
    return response.data;
  }

  // Get student attendance history
  async getStudentHistory(studentId, dateFrom = null, dateTo = null, status = null) {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    if (status) params.append('status', status);
    
    const response = await this.client.get(`/student/${studentId}?${params.toString()}`);
    return response.data;
  }

  // Get dashboard data (uses summary endpoint)
  async getDashboardData(dateFrom = null, dateTo = null) {
    try {
      // Get attendance summary
      const summaryData = await this.getAttendanceSummary(dateFrom, dateTo);
      
      // Get tracking status
      const trackingStatus = await this.getTrackingStatus();
      
      // Return combined dashboard data
      return {
        success: true,
        meetings: summaryData.meetings || [],
        overallStatistics: summaryData.overallStatistics || {
          totalMeetings: 0,
          totalParticipants: 0,
          totalStudents: 0,
          attendanceRate: 0
        },
        trackingStatus: trackingStatus,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      return {
        success: false,
        meetings: [],
        overallStatistics: {
          totalMeetings: 0,
          totalParticipants: 0,
          totalStudents: 0,
          attendanceRate: 0
        },
        trackingStatus: null,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Export attendance data
  async exportData(options = {}) {
    const { dateFrom, dateTo, format = 'json', meetingId } = options;
    const params = new URLSearchParams();
    
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    if (format) params.append('format', format);
    if (meetingId) params.append('meetingId', meetingId);
    
    const config = {
      responseType: format === 'csv' ? 'blob' : 'json',
    };
    
    const response = await this.client.get(`/export?${params.toString()}`, config);
    
    if (format === 'csv') {
      // Handle CSV download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true, message: 'CSV downloaded successfully' };
    }
    
    return response.data;
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.client.get('/tracking-status');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Enhanced AttendanceTracker APIs
  
  // Get enhanced health metrics
  async getEnhancedMetrics() {
    const response = await this.client.get('/enhanced-metrics');
    return response.data;
  }

  // Get caching statistics
  async getCacheStats() {
    const response = await this.client.get('/cache-stats');
    return response.data;
  }

  // Get retry statistics
  async getRetryStats() {
    const response = await this.client.get('/retry-stats');
    return response.data;
  }

  // Get current configuration
  async getConfiguration() {
    const response = await this.client.get('/configuration');
    return response.data;
  }

  // Update configuration
  async updateConfiguration(configuration) {
    const response = await this.client.post('/configuration', { configuration });
    return response.data;
  }

  // Reset health metrics
  async resetMetrics() {
    const response = await this.client.post('/reset-metrics');
    return response.data;
  }

  // Get comprehensive system overview
  async getSystemOverview() {
    const response = await this.client.get('/system-overview');
    return response.data;
  }

  // Start tracking with enhanced features
  async startEnhancedTracking(meetingId) {
    const response = await this.client.post(`/start/${meetingId}`);
    return response.data;
  }

  // Stop tracking with enhanced features  
  async stopEnhancedTracking(meetingId, generateReport = true) {
    const response = await this.client.post(`/stop/${meetingId}`, {
      generateReport
    });
    return response.data;
  }

  // New Dashboard APIs
  
  // Get attendance dashboard data
  async getAttendanceDashboard(dateFrom = null, dateTo = null) {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    
    const response = await axios.get(`${API_BASE_URL}/api/attendance/dashboard?${params.toString()}`);
    return response.data;
  }

  // Get real-time data from Zoom
  async getRealtimeData() {
    const response = await axios.get(`${API_BASE_URL}/api/zoom/real-time`);
    return response.data;
  }

  // Get attendance trends
  async getAttendanceTrends(dateFrom = null, dateTo = null, period = 'weekly') {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    if (period) params.append('period', period);
    
    const response = await axios.get(`${API_BASE_URL}/api/attendance/trends?${params.toString()}`);
    return response.data;
  }

  // Get meetings list
  async getMeetings() {
    const response = await axios.get(`${API_BASE_URL}/api/zoom/meetings`);
    return response.data;
  }

  // Get meeting participants
  async getMeetingParticipants(meetingId) {
    const response = await axios.get(`${API_BASE_URL}/api/zoom/meeting/${meetingId}/live-participants`);
    return response.data;
  }
}

// Create singleton instance
const attendanceAPI = new AttendanceAPI();

// Update base URL for attendance tracker routes
attendanceAPI.baseURL = `${attendanceAPI.client.defaults.baseURL.replace('/api/attendance', '')}/api/attendance-tracker`;
attendanceAPI.client.defaults.baseURL = attendanceAPI.baseURL;

export default attendanceAPI;
