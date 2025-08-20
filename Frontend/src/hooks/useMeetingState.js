import { useState, useCallback, useRef, useEffect } from 'react';

export const useMeetingState = () => {
  const [participants, setParticipants] = useState([]);
  const [meetingData, setMeetingData] = useState(null);
  const [meetingStatus, setMeetingStatus] = useState('idle'); // idle, active, ended
  const [loading, setLoading] = useState(false);
  
  const participantIdCounter = useRef(0);

  // Add participant to the meeting
  const addParticipant = useCallback((participantInfo) => {
    const newParticipant = {
      id: participantInfo.id || `participant_${++participantIdCounter.current}`,
      name: participantInfo.name || 'Unknown Participant',
      email: participantInfo.email || '',
      participantId: participantInfo.participantId || '',
      joinTime: new Date(),
      leaveTime: null,
      duration: 0,
      isActive: true,
      attendanceStatus: 'In Progress',
      audioStatus: false,
      videoStatus: false,
      handRaised: false,
      isHost: participantInfo.isHost || false,
      connectionStatus: 'connected',
      lastActivity: new Date(),
      ...participantInfo
    };

    setParticipants(prev => {
      // Check if participant already exists
      const existingIndex = prev.findIndex(p => p.id === newParticipant.id);
      if (existingIndex !== -1) {
        // Update existing participant
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...newParticipant, isActive: true };
        return updated;
      }
      // Add new participant
      return [...prev, newParticipant];
    });

    console.log('✅ Participant added:', newParticipant);
    
    // Emit event for other components
    window.dispatchEvent(new CustomEvent('participantAdded', {
      detail: { participant: newParticipant }
    }));

    return newParticipant;
  }, []);

  // Remove participant from the meeting
  const removeParticipant = useCallback((participantId) => {
    setParticipants(prev => {
      const participantIndex = prev.findIndex(p => p.id === participantId);
      if (participantIndex === -1) return prev;

      const participant = prev[participantIndex];
      const leaveTime = new Date();
      const duration = Math.round((leaveTime - participant.joinTime) / 1000 / 60); // Duration in minutes

      // Update participant with leave information
      const updatedParticipant = {
        ...participant,
        leaveTime,
        duration,
        isActive: false,
        attendanceStatus: duration < 5 ? 'Left Early' : 'Completed',
        connectionStatus: 'disconnected'
      };

      const updated = [...prev];
      updated[participantIndex] = updatedParticipant;

      console.log('👋 Participant removed:', updatedParticipant);
      
      // Emit event for other components
      window.dispatchEvent(new CustomEvent('participantRemoved', {
        detail: { participant: updatedParticipant }
      }));

      return updated;
    });
  }, []);

  // Update participant information
  const updateParticipant = useCallback((participantId, updates) => {
    setParticipants(prev => {
      const participantIndex = prev.findIndex(p => p.id === participantId);
      if (participantIndex === -1) return prev;

      const updated = [...prev];
      updated[participantIndex] = {
        ...updated[participantIndex],
        ...updates,
        lastActivity: new Date()
      };

      // Emit event for other components
      window.dispatchEvent(new CustomEvent('participantUpdated', {
        detail: { participant: updated[participantIndex] }
      }));

      return updated;
    });
  }, []);

  // Set meeting data
  const setMeeting = useCallback((meeting) => {
    setMeetingData(meeting);
    setMeetingStatus('active');
    
    console.log('📅 Meeting data set:', meeting);
    
    // Emit event for other components
    window.dispatchEvent(new CustomEvent('meetingStarted', {
      detail: { meeting }
    }));
  }, []);

  // End the meeting
  const endMeeting = useCallback(() => {
    // Mark all active participants as completed
    setParticipants(prev => prev.map(p => {
      if (p.isActive) {
        const leaveTime = new Date();
        const duration = Math.round((leaveTime - p.joinTime) / 1000 / 60);
        
        return {
          ...p,
          leaveTime,
          duration,
          isActive: false,
          attendanceStatus: duration < 5 ? 'Left Early' : 'Completed',
          connectionStatus: 'disconnected'
        };
      }
      return p;
    }));

    setMeetingStatus('ended');
    
    console.log('🔚 Meeting ended');
    
    // Emit event for other components
    window.dispatchEvent(new CustomEvent('meetingEnded', {
      detail: { meeting: meetingData, participants }
    }));
  }, [meetingData, participants]);

  // Clear all meeting data
  const clearMeeting = useCallback(() => {
    setParticipants([]);
    setMeetingData(null);
    setMeetingStatus('idle');
    participantIdCounter.current = 0;
    
    console.log('🧹 Meeting data cleared');
  }, []);

  // Get meeting statistics
  const getMeetingStats = useCallback(() => {
    const total = participants.length;
    const active = participants.filter(p => p.isActive).length;
    const completed = participants.filter(p => p.attendanceStatus === 'Completed').length;
    const leftEarly = participants.filter(p => p.attendanceStatus === 'Left Early').length;
    const inProgress = participants.filter(p => p.attendanceStatus === 'In Progress').length;
    
    const averageDuration = participants.length > 0 
      ? participants.reduce((sum, p) => sum + (p.duration || 0), 0) / participants.length 
      : 0;

    return {
      total,
      active,
      completed,
      leftEarly,
      inProgress,
      presentPercentage: total > 0 ? Math.round((active / total) * 100) : 0,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      averageDuration: Math.round(averageDuration)
    };
  }, [participants]);

  // Get participant by ID
  const getParticipant = useCallback((participantId) => {
    return participants.find(p => p.id === participantId);
  }, [participants]);

  // Update participant activity status
  const updateParticipantActivity = useCallback((participantId, isActive = true) => {
    updateParticipant(participantId, { 
      isActive, 
      connectionStatus: isActive ? 'connected' : 'disconnected',
      lastActivity: new Date()
    });
  }, [updateParticipant]);

  // Bulk update participants (useful for real-time updates)
  const bulkUpdateParticipants = useCallback((updates) => {
    setParticipants(prev => {
      const updated = [...prev];
      
      updates.forEach(({ id, ...updateData }) => {
        const index = updated.findIndex(p => p.id === id);
        if (index !== -1) {
          updated[index] = {
            ...updated[index],
            ...updateData,
            lastActivity: new Date()
          };
        }
      });
      
      return updated;
    });
  }, []);

  // Auto-update participant durations for active participants
  useEffect(() => {
    const interval = setInterval(() => {
      setParticipants(prev => prev.map(p => {
        if (p.isActive && p.joinTime) {
          const duration = Math.round((new Date() - p.joinTime) / 1000 / 60);
          return { ...p, duration };
        }
        return p;
      }));
    }, 3600000); // Update every 60 minutes

    return () => clearInterval(interval);
  }, []);

  // Listen for real-time events
  useEffect(() => {
    const handleRealtimeUpdate = (event) => {
      const { type, data } = event.detail;
      
      switch (type) {
        case 'participant_joined':
          addParticipant(data);
          break;
        case 'participant_left':
          removeParticipant(data.id);
          break;
        case 'participant_update':
          updateParticipant(data.id, data);
          break;
        case 'bulk_participant_update':
          bulkUpdateParticipants(data);
          break;
        default:
          break;
      }
    };

    // Listen for automatic participant tracking events from Zoom SDK
    const handleParticipantJoined = (event) => {
      const { participant, meetingId, joinTime } = event.detail;
      console.log('👤 Auto-tracking participant joined:', participant);
      
      // Add participant to the meeting state
      addParticipant({
        id: participant.participantId || participant.id,
        name: participant.participantName || participant.name,
        email: participant.email,
        participantId: participant.participantId,
        userId: participant.userId,
        joinTime: joinTime || new Date(),
        isActive: true,
        attendanceStatus: 'In Progress',
        audioStatus: false,
        videoStatus: false,
        handRaised: false,
        isHost: participant.isHost || false,
        connectionStatus: 'connected',
        device: participant.device || 'Unknown',
        role: participant.role || 'participant'
      });
    };

    const handleParticipantLeft = (event) => {
      const { participant, duration, reason } = event.detail;
      console.log('👋 Auto-tracking participant left:', participant);
      
      // Update participant status when they leave
      if (participant && participant.participantId) {
        updateParticipant(participant.participantId, {
          isActive: false,
          leaveTime: new Date(),
          duration: duration || 0,
          attendanceStatus: duration && duration >= 5 ? 'Completed' : 'Left Early',
          connectionStatus: 'disconnected',
          leaveReason: reason
        });
      }
    };

    const handleZoomTrackingStarted = (event) => {
      const { participant } = event.detail;
      console.log('✅ Zoom tracking started for participant:', participant);
    };

    const handleZoomTrackingStopped = (event) => {
      const { participant, duration, reason } = event.detail;
      console.log('🛑 Zoom tracking stopped for participant:', participant);
    };

    // Add event listeners
    window.addEventListener('realtimeUpdate', handleRealtimeUpdate);
    window.addEventListener('participantJoined', handleParticipantJoined);
    window.addEventListener('zoomTrackingStopped', handleParticipantLeft);
    window.addEventListener('zoomTrackingStarted', handleZoomTrackingStarted);
    
    return () => {
      window.removeEventListener('realtimeUpdate', handleRealtimeUpdate);
      window.removeEventListener('participantJoined', handleParticipantJoined);
      window.removeEventListener('zoomTrackingStopped', handleParticipantLeft);
      window.removeEventListener('zoomTrackingStarted', handleZoomTrackingStarted);
    };
  }, [addParticipant, removeParticipant, updateParticipant, bulkUpdateParticipants]);

  return {
    // State
    participants,
    meetingData,
    meetingStatus,
    loading,
    
    // Actions
    addParticipant,
    removeParticipant,
    updateParticipant,
    setMeeting,
    endMeeting,
    clearMeeting,
    updateParticipantActivity,
    bulkUpdateParticipants,
    
    // Computed values
    meetingStats: getMeetingStats(),
    getParticipant,
    
    // Status checks
    isMeetingActive: meetingStatus === 'active',
    isMeetingEnded: meetingStatus === 'ended',
    hasParticipants: participants.length > 0,
    activeParticipantsCount: participants.filter(p => p.isActive).length
  };
};
