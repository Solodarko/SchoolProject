/**
 * Attendance Utility Functions
 * Provides consistent attendance calculation logic across the application
 */

/**
 * Calculate attendance percentage based on duration and total meeting time
 * @param {number} attendeeDuration - Duration participant attended (in minutes)
 * @param {number} totalMeetingDuration - Total meeting duration (in minutes)
 * @param {boolean} isActive - Whether participant is currently active
 * @returns {number} Attendance percentage (0-100)
 */
export const calculateAttendancePercentage = (attendeeDuration, totalMeetingDuration, isActive = false) => {
  // Handle edge cases
  if (!attendeeDuration && !isActive) return 0;
  if (!totalMeetingDuration || totalMeetingDuration <= 0) return isActive ? 100 : 0;
  
  // If participant is currently active and no duration recorded yet, return 100%
  if (isActive && (!attendeeDuration || attendeeDuration <= 0)) {
    return 100;
  }
  
  // Calculate percentage
  const percentage = Math.min(Math.round((attendeeDuration / totalMeetingDuration) * 100), 100);
  
  return Math.max(percentage, 0);
};

/**
 * Calculate meeting duration from start and end times
 * @param {string|Date} startTime - Meeting start time
 * @param {string|Date} endTime - Meeting end time (optional, uses current time if not provided)
 * @returns {number} Duration in minutes
 */
export const calculateMeetingDuration = (startTime, endTime = null) => {
  try {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    
    if (isNaN(start.getTime())) return 0;
    if (endTime && isNaN(end.getTime())) return 0;
    
    const durationMs = end.getTime() - start.getTime();
    return Math.max(Math.round(durationMs / (1000 * 60)), 0); // Convert to minutes
  } catch (error) {
    console.error('Error calculating meeting duration:', error);
    return 0;
  }
};

/**
 * Calculate participant attendance duration
 * @param {string|Date} joinTime - When participant joined
 * @param {string|Date|null} leaveTime - When participant left (null if still active)
 * @returns {number} Duration in minutes
 */
export const calculateParticipantDuration = (joinTime, leaveTime = null) => {
  try {
    const join = new Date(joinTime);
    const leave = leaveTime ? new Date(leaveTime) : new Date();
    
    if (isNaN(join.getTime())) return 0;
    if (leaveTime && isNaN(leave.getTime())) return 0;
    
    const durationMs = leave.getTime() - join.getTime();
    return Math.max(Math.round(durationMs / (1000 * 60)), 0); // Convert to minutes
  } catch (error) {
    console.error('Error calculating participant duration:', error);
    return 0;
  }
};

/**
 * Determine attendance status based on percentage and activity
 * @param {number} attendancePercentage - Attendance percentage (0-100)
 * @param {boolean} isActive - Whether participant is currently active
 * @param {number} duration - Duration attended in minutes
 * @returns {string} Status: 'Present', 'In Progress', 'Partial', 'Late', 'Absent'
 */
export const determineAttendanceStatus = (attendancePercentage, isActive = false, duration = 0) => {
  // If currently active (in meeting)
  if (isActive) {
    return 'In Progress';
  }
  
  // If no duration recorded, consider absent
  if (!duration || duration <= 0) {
    return 'Absent';
  }
  
  // Determine status based on percentage
  if (attendancePercentage >= 90) {
    return 'Present';
  } else if (attendancePercentage >= 70) {
    return 'Partial';
  } else if (attendancePercentage >= 30) {
    return 'Late';
  } else {
    return 'Absent';
  }
};

/**
 * Get color for attendance status
 * @param {string} status - Attendance status
 * @returns {string} MUI color name
 */
export const getAttendanceStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'present':
      return 'success';
    case 'in progress':
      return 'info';
    case 'partial':
      return 'warning';
    case 'late':
      return 'warning';
    case 'absent':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Format attendance percentage for display
 * @param {number} percentage - Percentage value
 * @returns {string} Formatted percentage string
 */
export const formatAttendancePercentage = (percentage) => {
  if (typeof percentage !== 'number' || isNaN(percentage)) {
    return '0%';
  }
  return `${Math.round(percentage)}%`;
};

/**
 * Calculate session duration from join and leave times
 * @param {string|Date} joinTime - Session start time
 * @param {string|Date|null} leaveTime - Session end time (null if ongoing)
 * @returns {number} Session duration in minutes
 */
export const calculateSessionDuration = (joinTime, leaveTime = null) => {
  try {
    const start = new Date(joinTime);
    const end = leaveTime ? new Date(leaveTime) : new Date();
    
    if (isNaN(start.getTime())) return 0;
    if (leaveTime && isNaN(end.getTime())) return 0;
    
    const durationMs = end.getTime() - start.getTime();
    return Math.max(Math.round(durationMs / (1000 * 60)), 0); // Convert to minutes
  } catch (error) {
    console.error('Error calculating session duration:', error);
    return 0;
  }
};

/**
 * Calculate total duration from multiple sessions
 * @param {Array} sessions - Array of session objects with joinTime and leaveTime
 * @returns {number} Total duration across all sessions in minutes
 */
export const calculateTotalSessionDuration = (sessions = []) => {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return 0;
  }
  
  return sessions.reduce((total, session) => {
    const sessionDuration = calculateSessionDuration(session.joinTime || session.join_time, session.leaveTime || session.leave_time);
    return total + sessionDuration;
  }, 0);
};

/**
 * Calculate meeting duration from start and end times or from meeting data
 * @param {Object} meetingInfo - Meeting information
 * @returns {number} Meeting duration in minutes
 */
export const calculateMeetingDurationFromInfo = (meetingInfo = {}) => {
  try {
    // Priority order: explicit duration > calculated from start/end > fallback calculation
    if (meetingInfo.duration && typeof meetingInfo.duration === 'number') {
      return meetingInfo.duration;
    }
    
    if (meetingInfo.startTime && meetingInfo.endTime) {
      return calculateMeetingDuration(meetingInfo.startTime, meetingInfo.endTime);
    }
    
    if (meetingInfo.started_at && meetingInfo.ended_at) {
      return calculateMeetingDuration(meetingInfo.started_at, meetingInfo.ended_at);
    }
    
    // Fallback: if we only have start time, assume meeting is ongoing
    if (meetingInfo.startTime || meetingInfo.started_at) {
      return calculateMeetingDuration(meetingInfo.startTime || meetingInfo.started_at, null);
    }
    
    return 0;
  } catch (error) {
    console.error('Error calculating meeting duration from info:', error);
    return 0;
  }
};

/**
 * Calculate session-based attendance percentage
 * @param {number} totalSessionDuration - Total duration across all participant sessions
 * @param {number} meetingDuration - Total meeting duration
 * @param {boolean} hasActiveSessions - Whether participant has any active sessions
 * @returns {number} Attendance percentage (0-100)
 */
export const calculateSessionBasedAttendancePercentage = (totalSessionDuration, meetingDuration, hasActiveSessions = false) => {
  // Handle edge cases
  if (!totalSessionDuration && !hasActiveSessions) return 0;
  if (!meetingDuration || meetingDuration <= 0) return hasActiveSessions ? 100 : 0;
  
  // If participant has active sessions but no recorded duration yet, return 100%
  if (hasActiveSessions && (!totalSessionDuration || totalSessionDuration <= 0)) {
    return 100;
  }
  
  // Calculate percentage, cap at 100%
  const percentage = Math.min(Math.round((totalSessionDuration / meetingDuration) * 100), 100);
  
  return Math.max(percentage, 0);
};

/**
 * Determine attendance status based on session-based percentage and threshold
 * @param {number} attendancePercentage - Session-based attendance percentage (0-100)
 * @param {boolean} hasActiveSessions - Whether participant has any active sessions
 * @param {number} totalDuration - Total session duration in minutes
 * @param {number} threshold - Attendance threshold percentage (default 85%)
 * @returns {string} Status: 'Present', 'In Progress', 'Absent'
 */
export const determineSessionBasedAttendanceStatus = (attendancePercentage, hasActiveSessions = false, totalDuration = 0, threshold = 85) => {
  // If currently active (in meeting)
  if (hasActiveSessions) {
    return 'In Progress';
  }
  
  // If no duration recorded, consider absent
  if (!totalDuration || totalDuration <= 0) {
    return 'Absent';
  }
  
  // Apply threshold-based determination
  if (attendancePercentage >= threshold) {
    return 'Present';
  } else {
    return 'Absent';
  }
};

/**
 * Process participant sessions and calculate comprehensive attendance data
 * @param {Object} participant - Participant data with sessions
 * @param {Object} meetingInfo - Meeting information
 * @param {number} attendanceThreshold - Attendance threshold percentage (default 85%)
 * @returns {Object} Enhanced participant data with session-based calculations
 */
export const calculateSessionBasedParticipantAttendance = (participant, meetingInfo = {}, attendanceThreshold = 85) => {
  try {
    // Extract sessions from participant data
    let sessions = [];
    
    if (participant.sessions && Array.isArray(participant.sessions)) {
      // Use provided sessions array
      sessions = participant.sessions;
    } else if (participant.joinTime || participant.join_time) {
      // Create single session from join/leave times
      sessions = [{
        joinTime: participant.joinTime || participant.join_time,
        leaveTime: participant.leaveTime || participant.leave_time,
        isActive: participant.isActive
      }];
    }
    
    // Calculate total session duration
    const totalSessionDuration = calculateTotalSessionDuration(sessions);
    
    // Calculate meeting duration
    const meetingDuration = calculateMeetingDurationFromInfo(meetingInfo);
    
    // Check if participant has any active sessions
    const hasActiveSessions = sessions.some(session => 
      session.isActive || (!session.leaveTime && !session.leave_time)
    );
    
    // Calculate session-based attendance percentage
    const attendancePercentage = calculateSessionBasedAttendancePercentage(
      totalSessionDuration, 
      meetingDuration, 
      hasActiveSessions
    );
    
    // Determine attendance status
    const attendanceStatus = determineSessionBasedAttendanceStatus(
      attendancePercentage, 
      hasActiveSessions, 
      totalSessionDuration,
      attendanceThreshold
    );
    
    return {
      ...participant,
      sessions,
      totalSessionDuration,
      duration: totalSessionDuration, // Backward compatibility
      attendancePercentage,
      attendanceStatus,
      isActive: hasActiveSessions,
      meetingDuration,
      sessionCount: sessions.length
    };
  } catch (error) {
    console.error('Error calculating session-based participant attendance:', error);
    
    // Return original participant with default values
    return {
      ...participant,
      sessions: [],
      totalSessionDuration: 0,
      duration: 0,
      attendancePercentage: 0,
      attendanceStatus: 'Unknown',
      isActive: false,
      meetingDuration: 0,
      sessionCount: 0
    };
  }
};

/**
 * Calculate attendance with 85% threshold for Zoom meetings
 * @param {number} duration - Duration participant attended (in minutes)
 * @param {number} meetingDuration - Total meeting duration (in minutes)
 * @param {boolean} isActive - Whether participant is currently active
 * @returns {Object} Attendance data with 85% threshold calculations
 */
export const calculate85PercentAttendance = (duration, meetingDuration, isActive = false) => {
  const attendancePercentage = calculateAttendancePercentage(duration, meetingDuration, isActive);
  const meetsThreshold = attendancePercentage >= 85;
  
  let status;
  if (isActive) {
    status = 'In Progress';
  } else if (meetsThreshold) {
    status = 'Present';
  } else {
    status = 'Absent';
  }
  
  return {
    duration,
    meetingDuration,
    attendancePercentage: Math.round(attendancePercentage),
    meetsThreshold,
    attendanceStatus: status,
    thresholdDuration: Math.round(meetingDuration * 0.85)
  };
};

/**
 * Process participants data for 85% threshold tracking
 * @param {Array} participants - Array of participant objects
 * @param {number} meetingDuration - Meeting duration in minutes
 * @returns {Object} Processed data with statistics
 */
export const process85PercentAttendanceData = (participants, meetingDuration) => {
  const processedParticipants = participants.map(participant => {
    const duration = participant.totalSessionDuration || participant.duration || 0;
    const hasActiveSessions = participant.hasActiveSessions || participant.isActive;
    
    const attendanceData = calculate85PercentAttendance(duration, meetingDuration, hasActiveSessions);
    
    return {
      ...participant,
      ...attendanceData
    };
  });
  
  // Calculate statistics
  const totalParticipants = processedParticipants.length;
  const presentCount = processedParticipants.filter(p => 
    p.meetsThreshold || p.attendanceStatus === 'In Progress'
  ).length;
  const absentCount = totalParticipants - presentCount;
  const inProgressCount = processedParticipants.filter(p => p.attendanceStatus === 'In Progress').length;
  
  const totalPercentage = processedParticipants.reduce((sum, p) => sum + (p.attendancePercentage || 0), 0);
  const averageAttendance = totalParticipants > 0 ? Math.round(totalPercentage / totalParticipants) : 0;
  const attendanceRate = totalParticipants > 0 ? Math.round((presentCount / totalParticipants) * 100) : 0;
  
  const statistics = {
    totalParticipants,
    presentCount,
    absentCount,
    inProgressCount,
    averageAttendance,
    attendanceRate,
    meetingDuration,
    thresholdDuration: Math.round(meetingDuration * 0.85),
    threshold: 85
  };
  
  return {
    participants: processedParticipants,
    statistics
  };
};

/**
 * Calculate comprehensive attendance data for a participant (legacy function for backward compatibility)
 * @param {Object} participant - Participant data
 * @param {Object} meetingInfo - Meeting information with start/end times
 * @returns {Object} Enhanced participant data with calculated attendance
 */
export const calculateParticipantAttendance = (participant, meetingInfo = {}) => {
  // Use new session-based calculation with default threshold
  return calculateSessionBasedParticipantAttendance(participant, meetingInfo, 85);
};

/**
 * Calculate attendance statistics for a meeting
 * @param {Array} participants - Array of participant data
 * @returns {Object} Attendance statistics
 */
export const calculateMeetingAttendanceStats = (participants = []) => {
  try {
    const total = participants.length;
    
    if (total === 0) {
      return {
        total: 0,
        present: 0,
        partial: 0,
        late: 0,
        absent: 0,
        inProgress: 0,
        averagePercentage: 0
      };
    }
    
    let present = 0;
    let partial = 0;
    let late = 0;
    let absent = 0;
    let inProgress = 0;
    let totalPercentage = 0;
    
    participants.forEach(participant => {
      const status = participant.attendanceStatus?.toLowerCase();
      const percentage = participant.attendancePercentage || 0;
      
      totalPercentage += percentage;
      
      switch (status) {
        case 'present':
          present++;
          break;
        case 'partial':
          partial++;
          break;
        case 'late':
          late++;
          break;
        case 'in progress':
          inProgress++;
          break;
        default:
          absent++;
          break;
      }
    });
    
    return {
      total,
      present,
      partial,
      late,
      absent,
      inProgress,
      averagePercentage: Math.round(totalPercentage / total)
    };
  } catch (error) {
    console.error('Error calculating meeting attendance stats:', error);
    return {
      total: 0,
      present: 0,
      partial: 0,
      late: 0,
      absent: 0,
      inProgress: 0,
      averagePercentage: 0
    };
  }
};

/**
 * Validate and sanitize attendance data
 * @param {Object} data - Raw attendance data
 * @returns {Object} Sanitized data
 */
export const sanitizeAttendanceData = (data) => {
  if (!data || typeof data !== 'object') {
    return {
      participants: [],
      statistics: { total: 0 },
      authenticationStats: {
        totalAuthenticated: 0,
        authenticatedStudents: 0,
        authenticatedAdmins: 0,
        unauthenticatedParticipants: 0
      }
    };
  }
  
  const participants = Array.isArray(data.participants) ? data.participants : [];
  
  return {
    ...data,
    participants,
    statistics: data.statistics || { total: participants.length },
    authenticationStats: data.authenticationStats || {
      totalAuthenticated: 0,
      authenticatedStudents: 0,
      authenticatedAdmins: 0,
      unauthenticatedParticipants: participants.length
    }
  };
};
