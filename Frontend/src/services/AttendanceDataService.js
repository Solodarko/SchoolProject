/**
 * Attendance Data Service
 * Handles storage and retrieval of attendance data for dashboard updates
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

class AttendanceDataService {
  constructor() {
    this.storageKey = 'attendanceData';
    this.participantsKey = 'participantProfiles';
  }

  /**
   * Store participant data for dashboard update
   * @param {Object} participant - Participant data with name, email, ID
   * @param {Object} attendanceData - Meeting attendance details
   */
  async storeParticipantData(participant, attendanceData = null) {
    try {
      const participantRecord = {
        id: participant.id || Date.now(),
        name: participant.name,
        email: participant.email,
        participantId: participant.participantId,
        joinTime: participant.joinTime,
        leaveTime: participant.leaveTime,
        duration: participant.duration,
        attendanceStatus: participant.attendanceStatus,
        attendancePercentage: participant.attendancePercentage,
        attendanceGrade: participant.attendanceGrade,
        meetingId: attendanceData?.meetingId,
        meetingTopic: attendanceData?.meetingTopic,
        timestamp: new Date().toISOString(),
        // Additional tracking data
        deviceInfo: participant.deviceInfo || navigator.userAgent,
        ipAddress: participant.ipAddress || 'Hidden',
        sessionData: {
          actualJoinTime: participant.actualJoinTime,
          actualLeaveTime: participant.actualLeaveTime,
          actualDuration: participant.actualDuration,
          zoomUserId: participant.zoomUserId,
          isExternal: participant.isExternal || false
        }
      };

      // Store locally first
      await this.saveToLocalStorage(participantRecord);

      // Update participant profile
      await this.updateParticipantProfile(participantRecord);

      // Send to backend if available
      if (this.isBackendAvailable()) {
        await this.sendToBackend(participantRecord);
      }

      console.log('✅ Participant data stored successfully:', participantRecord);
      return participantRecord;
    } catch (error) {
      console.error('❌ Error storing participant data:', error);
      throw error;
    }
  }

  /**
   * Save attendance data to localStorage
   */
  async saveToLocalStorage(participantRecord) {
    try {
      const existingData = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      
      // Check for existing record and update if found
      const existingIndex = existingData.findIndex(
        record => record.participantId === participantRecord.participantId && 
                 record.meetingId === participantRecord.meetingId
      );

      if (existingIndex >= 0) {
        existingData[existingIndex] = { ...existingData[existingIndex], ...participantRecord };
      } else {
        existingData.push(participantRecord);
      }

      // Keep only last 100 records to prevent storage overflow
      if (existingData.length > 100) {
        existingData.splice(0, existingData.length - 100);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(existingData));
      console.log('💾 Data saved to localStorage');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      throw error;
    }
  }

  /**
   * Update participant profile for dashboard display
   */
  async updateParticipantProfile(participantRecord) {
    try {
      const profiles = JSON.parse(localStorage.getItem(this.participantsKey) || '{}');
      
      const profileKey = participantRecord.participantId;
      
      if (!profiles[profileKey]) {
        profiles[profileKey] = {
          name: participantRecord.name,
          email: participantRecord.email,
          participantId: participantRecord.participantId,
          totalMeetings: 0,
          totalDuration: 0,
          averageAttendance: 0,
          attendanceHistory: [],
          lastSeen: null,
          createdAt: new Date().toISOString()
        };
      }

      // Update profile with latest data
      const profile = profiles[profileKey];
      profile.name = participantRecord.name; // Update in case name changed
      profile.email = participantRecord.email; // Update in case email changed
      profile.lastSeen = participantRecord.timestamp;
      profile.totalMeetings += 1;
      profile.totalDuration += participantRecord.duration || 0;

      // Add to attendance history
      profile.attendanceHistory.push({
        meetingId: participantRecord.meetingId,
        meetingTopic: participantRecord.meetingTopic,
        date: participantRecord.timestamp,
        duration: participantRecord.duration,
        percentage: participantRecord.attendancePercentage,
        status: participantRecord.attendanceStatus,
        grade: participantRecord.attendanceGrade
      });

      // Calculate average attendance
      const validAttendances = profile.attendanceHistory.filter(h => h.percentage > 0);
      profile.averageAttendance = validAttendances.length > 0 
        ? Math.round(validAttendances.reduce((sum, h) => sum + h.percentage, 0) / validAttendances.length)
        : 0;

      // Keep only last 20 attendance records
      if (profile.attendanceHistory.length > 20) {
        profile.attendanceHistory = profile.attendanceHistory.slice(-20);
      }

      localStorage.setItem(this.participantsKey, JSON.stringify(profiles));
      console.log('👤 Participant profile updated');
    } catch (error) {
      console.error('Error updating participant profile:', error);
      throw error;
    }
  }

  /**
   * Send data to backend API for persistent storage
   */
  async sendToBackend(participantRecord) {
    try {
      const response = await axios.post(`${API_BASE_URL}/attendance/store`, participantRecord, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        console.log('🌐 Data sent to backend successfully');
        return response.data;
      } else {
        throw new Error('Backend storage failed');
      }
    } catch (error) {
      console.warn('⚠️ Backend storage failed, using local storage only:', error.message);
      // Don't throw error - local storage is fallback
    }
  }

  /**
   * Retrieve all attendance records
   */
  getAttendanceRecords() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    } catch (error) {
      console.error('Error retrieving attendance records:', error);
      return [];
    }
  }

  /**
   * Get participant profiles for dashboard
   */
  getParticipantProfiles() {
    try {
      return JSON.parse(localStorage.getItem(this.participantsKey) || '{}');
    } catch (error) {
      console.error('Error retrieving participant profiles:', error);
      return {};
    }
  }

  /**
   * Get attendance data for a specific participant
   */
  getParticipantAttendance(participantId) {
    const records = this.getAttendanceRecords();
    return records.filter(record => record.participantId === participantId);
  }

  /**
   * Get attendance data for a specific meeting
   */
  getMeetingAttendance(meetingId) {
    const records = this.getAttendanceRecords();
    return records.filter(record => record.meetingId === meetingId);
  }

  /**
   * Update participant information (for dashboard edits)
   */
  async updateParticipantInfo(participantId, updatedInfo) {
    try {
      // Update in attendance records
      const records = this.getAttendanceRecords();
      const updatedRecords = records.map(record => 
        record.participantId === participantId 
          ? { ...record, ...updatedInfo, updatedAt: new Date().toISOString() }
          : record
      );
      localStorage.setItem(this.storageKey, JSON.stringify(updatedRecords));

      // Update in participant profiles
      const profiles = this.getParticipantProfiles();
      if (profiles[participantId]) {
        profiles[participantId] = { ...profiles[participantId], ...updatedInfo };
        localStorage.setItem(this.participantsKey, JSON.stringify(profiles));
      }

      // Send update to backend if available
      if (this.isBackendAvailable()) {
        await axios.put(`${API_BASE_URL}/participants/${participantId}`, updatedInfo);
      }

      console.log('✅ Participant information updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating participant info:', error);
      throw error;
    }
  }

  /**
   * Export attendance data for dashboard
   */
  exportForDashboard(format = 'json') {
    const records = this.getAttendanceRecords();
    const profiles = this.getParticipantProfiles();

    const dashboardData = {
      attendanceRecords: records,
      participantProfiles: profiles,
      summary: this.generateSummary(records),
      exportedAt: new Date().toISOString()
    };

    if (format === 'csv') {
      return this.convertToCSV(records);
    }

    return dashboardData;
  }

  /**
   * Generate attendance summary for dashboard
   */
  generateSummary(records) {
    const totalParticipants = new Set(records.map(r => r.participantId)).size;
    const totalMeetings = new Set(records.map(r => r.meetingId)).size;
    const presentRecords = records.filter(r => r.attendanceStatus === 'Present');
    const averageAttendance = records.length > 0 
      ? Math.round(records.reduce((sum, r) => sum + (r.attendancePercentage || 0), 0) / records.length)
      : 0;

    return {
      totalParticipants,
      totalMeetings,
      totalRecords: records.length,
      presentCount: presentRecords.length,
      averageAttendance,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Convert records to CSV format
   */
  convertToCSV(records) {
    if (records.length === 0) return '';

    const headers = [
      'Name', 'Email', 'Participant ID', 'Meeting Topic', 'Meeting ID',
      'Join Time', 'Leave Time', 'Duration (minutes)', 'Attendance %', 
      'Status', 'Grade', 'Timestamp'
    ];

    const csvRows = [
      headers.join(','),
      ...records.map(record => [
        `"${record.name}"`,
        `"${record.email}"`,
        `"${record.participantId}"`,
        `"${record.meetingTopic || ''}"`,
        `"${record.meetingId || ''}"`,
        `"${new Date(record.joinTime).toLocaleString()}"`,
        `"${record.leaveTime ? new Date(record.leaveTime).toLocaleString() : 'N/A'}"`,
        record.duration || 0,
        record.attendancePercentage || 0,
        `"${record.attendanceStatus}"`,
        `"${record.attendanceGrade || 'N/A'}"`,
        `"${new Date(record.timestamp).toLocaleString()}"`
      ].join(','))
    ];

    return csvRows.join('\n');
  }

  /**
   * Check if backend API is available
   */
  async isBackendAvailable() {
    try {
      await axios.get(`${API_BASE_URL}/health`, { timeout: 3000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Sync local data with backend (useful for dashboard updates)
   */
  async syncWithBackend() {
    try {
      if (!(await this.isBackendAvailable())) {
        console.log('Backend not available, skipping sync');
        return;
      }

      const localRecords = this.getAttendanceRecords();
      const response = await axios.post(`${API_BASE_URL}/attendance/sync`, {
        records: localRecords
      });

      if (response.data.success) {
        console.log('🔄 Data synced with backend successfully');
        return response.data;
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  /**
   * Clear all stored data (for testing/reset)
   */
  clearAllData() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.participantsKey);
    console.log('🗑️ All attendance data cleared');
  }
}

export default new AttendanceDataService();
