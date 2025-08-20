/**
 * Example Backend API Fix for Attendance Percentage Calculation
 * This file shows how to implement proper attendance calculation on the backend
 * Place this in your backend API routes folder
 */

// Example Express.js route for meeting participants with proper attendance calculation
app.get('/api/meetings/:meetingId/participants', async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    // Get meeting information
    const meeting = await Meeting.findOne({ id: meetingId });
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    
    // Get participants from your database
    const participants = await Participant.find({ meetingId });
    
    // Calculate meeting duration
    const meetingStartTime = new Date(meeting.startTime);
    const meetingEndTime = meeting.endTime ? new Date(meeting.endTime) : new Date();
    const totalMeetingDuration = Math.max(
      Math.round((meetingEndTime.getTime() - meetingStartTime.getTime()) / (1000 * 60)), 
      1 // Minimum 1 minute to avoid division by zero
    );
    
    // Calculate attendance for each participant
    const enhancedParticipants = participants.map(participant => {
      const joinTime = new Date(participant.joinTime);
      const leaveTime = participant.leaveTime ? new Date(participant.leaveTime) : new Date();
      const participantDuration = Math.max(
        Math.round((leaveTime.getTime() - joinTime.getTime()) / (1000 * 60)),
        0
      );
      
      // Calculate attendance percentage
      const attendancePercentage = Math.min(
        Math.round((participantDuration / totalMeetingDuration) * 100),
        100
      );
      
      // Determine status based on percentage and activity
      let attendanceStatus;
      const isActive = !participant.leaveTime;
      
      if (isActive) {
        attendanceStatus = 'In Progress';
      } else if (attendancePercentage >= 90) {
        attendanceStatus = 'Present';
      } else if (attendancePercentage >= 70) {
        attendanceStatus = 'Partial';
      } else if (attendancePercentage >= 30) {
        attendanceStatus = 'Late';
      } else {
        attendanceStatus = 'Absent';
      }
      
      return {
        ...participant.toObject(),
        duration: participantDuration,
        attendancePercentage,
        attendanceStatus,
        isActive,
        meetingDuration: totalMeetingDuration
      };
    });
    
    // Calculate overall statistics
    const stats = {
      total: enhancedParticipants.length,
      present: enhancedParticipants.filter(p => p.attendanceStatus === 'Present').length,
      partial: enhancedParticipants.filter(p => p.attendanceStatus === 'Partial').length,
      late: enhancedParticipants.filter(p => p.attendanceStatus === 'Late').length,
      absent: enhancedParticipants.filter(p => p.attendanceStatus === 'Absent').length,
      inProgress: enhancedParticipants.filter(p => p.attendanceStatus === 'In Progress').length
    };
    
    res.json({
      success: true,
      data: {
        meetingId,
        meetingTitle: meeting.title,
        meetingStatus: meeting.status,
        participants: enhancedParticipants,
        attendanceStats: stats
      }
    });
    
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch participants',
      error: error.message 
    });
  }
});

// Example webhook handler for real-time attendance updates
app.post('/api/webhooks/attendance/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const participantData = req.body;
    
    // Get meeting information for duration calculation
    const meeting = await Meeting.findOne({ id: meetingId });
    const meetingStartTime = meeting ? new Date(meeting.startTime) : new Date();
    const currentTime = new Date();
    const totalMeetingDuration = Math.max(
      Math.round((currentTime.getTime() - meetingStartTime.getTime()) / (1000 * 60)),
      1
    );
    
    // Process each participant
    const processedParticipants = participantData.participants?.map(participant => {
      const joinTime = new Date(participant.joinTime || participant.join_time);
      const leaveTime = participant.leaveTime || participant.leave_time ? 
        new Date(participant.leaveTime || participant.leave_time) : null;
      const endTime = leaveTime || currentTime;
      
      const participantDuration = Math.max(
        Math.round((endTime.getTime() - joinTime.getTime()) / (1000 * 60)),
        0
      );
      
      // Calculate attendance percentage
      const attendancePercentage = Math.min(
        Math.round((participantDuration / totalMeetingDuration) * 100),
        100
      );
      
      // Determine status
      const isActive = !leaveTime;
      let attendanceStatus;
      
      if (isActive) {
        attendanceStatus = 'In Progress';
      } else if (attendancePercentage >= 90) {
        attendanceStatus = 'Present';
      } else if (attendancePercentage >= 70) {
        attendanceStatus = 'Partial';
      } else if (attendancePercentage >= 30) {
        attendanceStatus = 'Late';
      } else {
        attendanceStatus = 'Absent';
      }
      
      return {
        ...participant,
        duration: participantDuration,
        attendancePercentage,
        attendanceStatus,
        isActive,
        meetingDuration: totalMeetingDuration
      };
    }) || [];
    
    // Save to database and respond
    res.json({
      success: true,
      participants: processedParticipants,
      meetingStartTime: meetingStartTime.toISOString(),
      meetingEndTime: meeting?.endTime || null,
      processed: true
    });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Example function to update meeting attendance rate
async function updateMeetingAttendanceRate(meetingId) {
  try {
    const participants = await Participant.find({ meetingId });
    
    if (participants.length === 0) {
      await Meeting.updateOne({ id: meetingId }, { attendanceRate: 0 });
      return;
    }
    
    // Calculate average attendance percentage
    const totalPercentage = participants.reduce((sum, p) => sum + (p.attendancePercentage || 0), 0);
    const averageAttendance = Math.round(totalPercentage / participants.length);
    
    // Update meeting record
    await Meeting.updateOne({ id: meetingId }, { attendanceRate: averageAttendance });
    
    console.log(`Updated meeting ${meetingId} attendance rate: ${averageAttendance}%`);
  } catch (error) {
    console.error('Error updating attendance rate:', error);
  }
}

module.exports = {
  updateMeetingAttendanceRate
};
