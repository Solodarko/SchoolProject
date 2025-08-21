const express = require('express');
const UnifiedAttendanceTracker = require('../services/unifiedAttendanceTracker');

const router = express.Router();

// Initialize the unified tracker (will be set by server.js)
let unifiedTracker = null;

/**
 * Initialize the unified attendance tracker
 */
function initializeUnifiedTracker(io) {
  unifiedTracker = new UnifiedAttendanceTracker(io);
  console.log('🎯 Unified Attendance Routes initialized');
}

// ==================== WEBHOOK ROUTES (Zoom Integration) ====================

/**
 * Zoom Webhook Endpoint - Handle all Zoom events
 */
router.post('/zoom/webhook', async (req, res) => {
  try {
    console.log('📨 [WEBHOOK] Received Zoom webhook:', req.body.event);

    const { event, payload } = req.body;

    if (!event || !payload) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid webhook payload' 
      });
    }

    const meetingId = payload.object?.id || payload.object?.uuid;
    if (!meetingId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing meeting ID in webhook' 
      });
    }

    let result = { success: true, message: 'Event processed' };

    // Handle different Zoom events
    switch (event) {
      case 'meeting.participant_joined':
        if (payload.object?.participant) {
          result = await unifiedTracker.handleWebhookJoin(payload.object.participant, meetingId);
        }
        break;

      case 'meeting.participant_left':
        if (payload.object?.participant) {
          result = await unifiedTracker.handleWebhookLeave(payload.object.participant, meetingId);
        }
        break;

      case 'meeting.started':
        console.log('📅 [WEBHOOK] Meeting started:', meetingId);
        result = { success: true, message: 'Meeting started event processed' };
        break;

      case 'meeting.ended':
        console.log('📅 [WEBHOOK] Meeting ended:', meetingId);
        result = { success: true, message: 'Meeting ended event processed' };
        break;

      default:
        console.log(`ℹ️ [WEBHOOK] Unhandled event: ${event}`);
        result = { success: true, message: `Event ${event} noted but not processed` };
    }

    res.status(200).json({
      success: result.success,
      message: result.message,
      event: event,
      meetingId: meetingId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [WEBHOOK] Error processing webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Zoom Webhook Verification (for initial setup)
 */
router.get('/zoom/webhook', (req, res) => {
  const challenge = req.query.challenge;
  if (challenge) {
    console.log('✅ [WEBHOOK] Zoom webhook verification successful');
    res.status(200).json({
      challenge: challenge
    });
  } else {
    res.status(400).json({ error: 'No challenge parameter provided' });
  }
});

// ==================== TOKEN-BASED ROUTES (User Authentication) ====================

/**
 * Token-based Check-in - User joins meeting with JWT token
 */
router.post('/checkin/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    console.log(`📝 [TOKEN CHECKIN] Processing check-in for meeting: ${meetingId}`);

    const result = await unifiedTracker.handleTokenJoin(meetingId, token, req.body);

    if (result.success) {
      const attendanceData = await unifiedTracker.calculateAttendanceData(result.participant, meetingId);
      
      res.status(200).json({
        success: true,
        message: `Successfully checked in to meeting ${meetingId}`,
        joinTime: result.participant.joinTime,
        participant: {
          name: result.userInfo.name,
          email: result.userInfo.email,
          ...attendanceData
        },
        meetingId: meetingId,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        meetingId: meetingId
      });
    }

  } catch (error) {
    console.error('❌ [TOKEN CHECKIN] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Token-based Check-out - User leaves meeting with JWT token
 */
router.post('/checkout/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    console.log(`📝 [TOKEN CHECKOUT] Processing check-out for meeting: ${meetingId}`);

    const result = await unifiedTracker.handleTokenLeave(meetingId, token);

    if (result.success) {
      const attendanceData = await unifiedTracker.calculateAttendanceData(result.participant, meetingId);
      
      res.status(200).json({
        success: true,
        message: result.message || `Successfully checked out from meeting ${meetingId}`,
        leaveTime: result.participant.leaveTime,
        duration: attendanceData.duration,
        percentage: attendanceData.attendancePercentage,
        status: attendanceData.attendanceStatus,
        meetsThreshold: attendanceData.meetsThreshold,
        participant: {
          name: unifiedTracker.getDisplayName(result.participant),
          email: result.participant.email,
          ...attendanceData
        },
        meetingId: meetingId,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        meetingId: meetingId
      });
    }

  } catch (error) {
    console.error('❌ [TOKEN CHECKOUT] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== UNIFIED DATA ROUTES ====================

/**
 * Get Complete Attendance Data - All participants (webhook + token-based)
 */
router.get('/meeting/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const threshold = parseInt(req.query.threshold) || 85;

    console.log(`📊 [UNIFIED DATA] Getting attendance for meeting: ${meetingId} (threshold: ${threshold}%)`);

    const result = await unifiedTracker.getUnifiedAttendanceData(meetingId, threshold);

    if (result.success) {
      res.status(200).json({
        success: true,
        meetingId: meetingId,
        participants: result.participants,
        statistics: result.statistics,
        metadata: {
          totalParticipants: result.participants.length,
          webhookBased: result.participants.filter(p => p.source === 'zoom_webhook').length,
          tokenBased: result.participants.filter(p => p.source === 'jwt_token').length,
          authenticated: result.participants.filter(p => p.isAuthenticated).length,
          threshold: threshold,
          timestamp: result.timestamp
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        meetingId: meetingId
      });
    }

  } catch (error) {
    console.error('❌ [UNIFIED DATA] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get My Attendance - Individual participant query with token
 */
router.get('/my-attendance/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    console.log(`👤 [MY ATTENDANCE] Getting individual attendance for meeting: ${meetingId}`);

    const result = await unifiedTracker.getMyAttendance(meetingId, token);

    if (result.success) {
      const participant = result.participant;
      
      res.status(200).json({
        success: true,
        meetingId: meetingId,
        participant: {
          name: participant.displayName,
          email: participant.email,
          joinTime: participant.joinTime,
          leaveTime: participant.leaveTime,
          duration: participant.duration,
          percentage: participant.attendancePercentage,
          status: participant.attendanceStatus,
          meetsThreshold: participant.meetsThreshold,
          isActive: participant.isActive,
          source: participant.source,
          isAuthenticated: participant.isAuthenticated || participant.tokenBased
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
        meetingId: meetingId
      });
    }

  } catch (error) {
    console.error('❌ [MY ATTENDANCE] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get Live Statistics - Real-time meeting stats
 */
router.get('/statistics/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const threshold = parseInt(req.query.threshold) || 85;

    console.log(`📈 [STATISTICS] Getting live statistics for meeting: ${meetingId}`);

    const result = await unifiedTracker.getUnifiedAttendanceData(meetingId, threshold);

    if (result.success) {
      res.status(200).json({
        success: true,
        meetingId: meetingId,
        statistics: result.statistics,
        summary: {
          totalParticipants: result.statistics.totalParticipants,
          present: result.statistics.presentCount,
          absent: result.statistics.absentCount,
          inProgress: result.statistics.inProgressCount,
          attendanceRate: result.statistics.attendanceRate,
          averageAttendance: result.statistics.averageAttendance,
          authenticated: result.statistics.authenticatedCount
        },
        timestamp: result.timestamp
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        meetingId: meetingId
      });
    }

  } catch (error) {
    console.error('❌ [STATISTICS] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== ADMIN/DEBUG ROUTES ====================

/**
 * Clear Meeting Data - For testing purposes
 */
router.delete('/meeting/:meetingId/clear', async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    console.log(`🗑️ [CLEAR] Clearing data for meeting: ${meetingId}`);

    // Clear from database
    const Participant = require('../models/Participant');
    const result = await Participant.deleteMany({ meetingId: meetingId.toString() });

    // Clear from active sessions
    if (unifiedTracker) {
      unifiedTracker.activeSessions.clear();
      unifiedTracker.webhookSessions.clear();
      unifiedTracker.tokenSessions.clear();
    }

    res.status(200).json({
      success: true,
      message: `Cleared ${result.deletedCount} participants from meeting ${meetingId}`,
      deletedCount: result.deletedCount,
      meetingId: meetingId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [CLEAR] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== QR CODE ROUTES ====================

/**
 * QR Code Location Recording - Process QR scanner attendance
 */
router.post('/qr-location', async (req, res) => {
  try {
    console.log('📱 [QR LOCATION] Processing QR location data:', req.body);

    const { qrCodeData, userLocation, studentId, additionalData } = req.body;

    // Validate required fields
    if (!qrCodeData || !userLocation || !studentId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: qrCodeData, userLocation, and studentId are required',
        received: { qrCodeData: !!qrCodeData, userLocation: !!userLocation, studentId: !!studentId }
      });
    }

    // Import models
    const Attendance = require('../models/Attendance');
    const Student = require('../models/Student');

    // Parse QR code data
    let parsedQRData;
    try {
      parsedQRData = typeof qrCodeData === 'string' ? JSON.parse(qrCodeData) : qrCodeData;
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid QR code data format',
        details: error.message
      });
    }

    // Calculate distance between user location and QR location
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      parsedQRData.location?.latitude || 0,
      parsedQRData.location?.longitude || 0
    );

    // Validate proximity (within 50 meters)
    const maxDistance = 50; // meters
    const isWithinRange = distance <= maxDistance;

    // Create attendance record with proper schema fields
    const attendanceRecord = new Attendance({
      StudentID: parseInt(studentId), // Required field
      Date: new Date(), // Required field
      Status: isWithinRange ? 'Present' : 'Absent', // Required field
      attendanceType: 'qr_scan',
      Remarks: `QR code attendance - ${isWithinRange ? 'verified location' : 'location verification failed'}`,
      verificationStatus: isWithinRange ? 'verified' : 'unverified',
      qrScannerLocation: {
        coordinates: {
          latitude: parseFloat(userLocation.latitude),
          longitude: parseFloat(userLocation.longitude),
          formatted: {
            latitude: `${userLocation.latitude}N`,
            longitude: `${userLocation.longitude}W`
          }
        },
        distance: Math.round(distance * 100) / 100,
        accuracy: userLocation.accuracy || null,
        timestamp: new Date()
      },
      locationVerification: {
        method: 'qr_scanner',
        status: isWithinRange ? 'verified' : 'failed',
        proximity: {
          distance: Math.round(distance * 100) / 100,
          maxAllowed: maxDistance,
          isWithinRange: isWithinRange
        },
        verifiedAt: isWithinRange ? new Date() : null,
        notes: isWithinRange 
          ? `Location verified - within ${distance.toFixed(2)}m of QR scanner`
          : `Location verification failed - ${distance.toFixed(2)}m from QR scanner (max: ${maxDistance}m)`
      },
      metadata: {
        ...additionalData,
        qrCodeData: parsedQRData
      }
    });

    // Save to database
    const savedRecord = await attendanceRecord.save();

    // Get student information
    const studentInfo = await Student.findOne({ studentId: studentId }).lean();

    // Prepare response data
    const responseData = {
      success: true,
      message: 'QR scanner location recorded successfully (unified)',
      attendanceId: savedRecord._id,
      studentId: studentId,
      studentInfo: studentInfo,
      location: {
        coordinates: savedRecord.qrScannerLocation.coordinates,
        distance: savedRecord.qrScannerLocation.distance,
        verification: {
          method: savedRecord.locationVerification.method,
          status: savedRecord.locationVerification.status,
          timestamp: savedRecord.locationVerification.verifiedAt || savedRecord.createdAt,
          proximity: {
            distance: savedRecord.locationVerification.proximity.distance,
            maxDistance: savedRecord.locationVerification.proximity.maxAllowed,
            isWithinRange: savedRecord.locationVerification.proximity.isWithinRange,
            message: savedRecord.locationVerification.notes
          }
        }
      },
      qrCodeInfo: parsedQRData,
      status: savedRecord.Status,
      timestamp: savedRecord.createdAt
    };

    // Emit real-time update via Socket.IO (compatible with frontend)
    if (req.app.get('io')) {
      const io = req.app.get('io');
      const globalState = req.app.get('globalState') || {};
      
      // Create comprehensive attendance notification for admin dashboard
      const attendanceNotification = {
        id: `attendance_${savedRecord._id}`,
        type: 'attendance_recorded',
        icon: '✅',
        title: 'New QR Attendance Recorded (Unified)',
        message: `${studentInfo?.name || 'Student'} marked ${savedRecord.Status.toLowerCase()}`,
        studentInfo: {
          studentId: studentId,
          name: studentInfo?.name || 'Unknown Student',
          email: studentInfo?.email || null,
          department: studentInfo?.department || null
        },
        attendanceDetails: {
          attendanceId: savedRecord._id,
          date: savedRecord.Date.toLocaleDateString(),
          time: savedRecord.Date.toLocaleTimeString(),
          status: savedRecord.Status,
          method: 'QR Code Scan',
          location: {
            coordinates: savedRecord.qrScannerLocation.coordinates,
            distance: savedRecord.qrScannerLocation.distance,
            accuracy: savedRecord.qrScannerLocation.accuracy
          },
          verification: savedRecord.locationVerification.status
        },
        qrCodeInfo: {
          qrCodeId: parsedQRData.id,
          generatedBy: 'System',
          generatedAt: parsedQRData.timestamp,
          location: parsedQRData.location
        },
        timestamp: new Date().toISOString(),
        priority: 'high'
      };
      
      // Add to global notification state
      globalState.notifications = globalState.notifications || [];
      globalState.notifications.push(attendanceNotification);
      
      // Keep only last 100 notifications
      if (globalState.notifications.length > 100) {
        globalState.notifications = globalState.notifications.slice(-100);
      }
      
      // Emit to all connected admin clients (compatible with frontend)
      console.log('📡 [QR LOCATION] Emitting attendanceRecorded event...');
      io.emit('attendanceRecorded', attendanceNotification);
      
      // Also emit as a general notification
      console.log('📡 [QR LOCATION] Emitting notification event...');
      io.emit('notification', attendanceNotification);
      
      // Emit to admin dashboard specifically
      console.log('📡 [QR LOCATION] Emitting realTimeAttendanceUpdate to admin_dashboard room...');
      io.to('admin_dashboard').emit('realTimeAttendanceUpdate', {
        type: 'new_attendance',
        data: {
          attendance: {
            _id: savedRecord._id,
            studentId: studentId,
            studentName: studentInfo?.name || 'Unknown Student',
            date: savedRecord.Date,
            status: savedRecord.Status,
            location: savedRecord.qrScannerLocation.coordinates,
            method: 'QR Scan',
            verification: savedRecord.locationVerification.status
          },
          studentInfo,
          qrCodeInfo: {
            generatedBy: 'System',
            qrId: parsedQRData.id
          }
        },
        timestamp: new Date().toISOString()
      });
      
      console.log('📡 [QR LOCATION] All Socket.IO events emitted successfully');
    }

    res.status(201).json(responseData);

  } catch (error) {
    console.error('❌ [QR LOCATION] Error processing QR location:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get QR Location Statistics
 */
router.get('/qr-location/stats', async (req, res) => {
  try {
    const Attendance = require('../models/Attendance');
    
    const stats = await Attendance.aggregate([
      {
        $group: {
          _id: null,
          totalScans: { $sum: 1 },
          uniqueStudents: { $addToSet: '$studentId' },
          averageDistance: { $avg: '$location.distance' },
          verifiedScans: {
            $sum: {
              $cond: [{ $eq: ['$location.verification.status', 'verified'] }, 1, 0]
            }
          },
          failedScans: {
            $sum: {
              $cond: [{ $eq: ['$location.verification.status', 'failed'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalScans: 0,
      uniqueStudents: [],
      averageDistance: 0,
      verifiedScans: 0,
      failedScans: 0
    };

    res.status(200).json({
      success: true,
      stats: {
        totalScans: result.totalScans,
        uniqueStudents: result.uniqueStudents.length,
        averageDistance: Math.round(result.averageDistance * 100) / 100,
        verificationStatus: {
          verified: result.verifiedScans,
          failed: result.failedScans,
          pending: 0, // QR scans are immediately verified/failed
          locationMismatch: result.failedScans
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [QR STATS] Error getting QR location stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Health Check
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Unified Attendance Tracker is running',
    services: {
      webhookTracking: 'active',
      tokenTracking: 'active',
      unifiedData: 'active',
      qrLocation: 'active'
    },
    timestamp: new Date().toISOString()
  });
});

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI/180; // φ, λ in radians
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const distance = R * c; // in metres
  return distance;
}

module.exports = { router, initializeUnifiedTracker };
