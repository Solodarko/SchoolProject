/**
 * Meeting Registration Utility
 * Handles user registration for Zoom meeting attendance tracking
 */

import { getAuthToken } from './authUtils';

class MeetingRegistration {
  constructor() {
    this.backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
    this.sessionId = null;
    this.isRegistered = false;
  }

  /**
   * Register user for meeting attendance tracking
   * This should be called when user accesses a meeting page
   */
  async registerForMeeting(meetingId) {
    try {
      const authToken = this.getAuthToken();
      
      if (!authToken) {
        console.warn('⚠️ No auth token found, skipping registration');
        return { success: false, reason: 'no_auth_token' };
      }

      if (!meetingId) {
        console.error('❌ Meeting ID is required for registration');
        return { success: false, reason: 'no_meeting_id' };
      }

      console.log('🔐 Registering user for meeting:', meetingId);

      const response = await fetch(`${this.backendUrl}/api/user-sessions/join-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          meetingId: meetingId.toString(),
          participantData: {
            participantName: 'Auto-detected from token',
            device: this.detectDevice()
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Registration failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        this.sessionId = result.sessionId;
        this.isRegistered = true;
        
        console.log('✅ Successfully registered for meeting attendance:', {
          sessionId: result.sessionId,
          user: result.userData.user,
          student: result.userData.student
        });

        // Store session info
        sessionStorage.setItem('meetingSessionId', result.sessionId);
        sessionStorage.setItem('meetingId', meetingId);

        // Show user their registration details
        this.displayRegistrationSuccess(result.userData);

        return {
          success: true,
          sessionId: result.sessionId,
          userData: result.userData
        };
      } else {
        throw new Error(result.message || 'Registration failed');
      }

    } catch (error) {
      console.error('❌ Failed to register for meeting:', error);
      return {
        success: false,
        error: error.message,
        reason: 'registration_error'
      };
    }
  }

  /**
   * Unregister from meeting when user leaves
   */
  async unregisterFromMeeting() {
    if (!this.sessionId) {
      console.log('ℹ️ No active session to unregister');
      return;
    }

    try {
      const authToken = this.getAuthToken();
      
      const response = await fetch(`${this.backendUrl}/api/user-sessions/leave-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          sessionId: this.sessionId
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('👋 Successfully unregistered from meeting. Duration:', result.sessionData?.duration || 0, 'minutes');
        
        this.sessionId = null;
        this.isRegistered = false;
        
        // Clean up session storage
        sessionStorage.removeItem('meetingSessionId');
        sessionStorage.removeItem('meetingId');
      }

    } catch (error) {
      console.error('❌ Error unregistering from meeting:', error);
    }
  }

  /**
   * Set up automatic unregistration when user leaves the page
   */
  setupAutoUnregister() {
    // Handle page unload
    window.addEventListener('beforeunload', () => {
      if (this.sessionId) {
        // Use sendBeacon for reliable delivery on page unload
        const authToken = this.getAuthToken();
        if (authToken) {
          navigator.sendBeacon(
            `${this.backendUrl}/api/user-sessions/leave-meeting`,
            JSON.stringify({
              sessionId: this.sessionId
            })
          );
        }
      }
    });

    // Handle browser back/forward navigation
    window.addEventListener('popstate', () => {
      this.unregisterFromMeeting();
    });

    // Handle when user navigates to different page
    window.addEventListener('unload', () => {
      this.unregisterFromMeeting();
    });
  }

  /**
   * Get authentication token from storage using proper auth utils
   */
  getAuthToken() {
    return getAuthToken();
  }

  /**
   * Detect user's device type
   */
  detectDevice() {
    const userAgent = navigator.userAgent;
    
    if (/Mobi|Android/i.test(userAgent)) {
      return 'Mobile';
    } else if (/Tablet|iPad/i.test(userAgent)) {
      return 'Tablet';
    } else {
      return 'Desktop';
    }
  }

  /**
   * Display registration success message to user
   */
  displayRegistrationSuccess(userData) {
    // Create or update registration status element
    let statusElement = document.getElementById('registration-status');
    
    if (!statusElement) {
      statusElement = document.createElement('div');
      statusElement.id = 'registration-status';
      statusElement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        max-width: 300px;
      `;
      document.body.appendChild(statusElement);
    }

    const userName = userData.user.username || 'User';
    const userEmail = userData.user.email || '';
    const studentId = userData.student?.studentId || '';

    statusElement.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">
        ✅ Attendance Tracking Active
      </div>
      <div style="font-size: 14px;">
        <div>Name: ${userName}</div>
        <div>Email: ${userEmail}</div>
        ${studentId ? `<div>Student ID: ${studentId}</div>` : ''}
      </div>
    `;

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (statusElement && statusElement.parentNode) {
        statusElement.style.transition = 'opacity 0.5s';
        statusElement.style.opacity = '0';
        setTimeout(() => {
          if (statusElement.parentNode) {
            statusElement.remove();
          }
        }, 500);
      }
    }, 5000);
  }

  /**
   * Check if user is currently registered for a meeting
   */
  isUserRegistered() {
    return this.isRegistered && this.sessionId !== null;
  }

  /**
   * Get current session information
   */
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      isRegistered: this.isRegistered,
      meetingId: sessionStorage.getItem('meetingId')
    };
  }
}

/**
 * Helper function to get cookie value
 */
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

/**
 * Auto-initialize meeting registration when script loads
 */
let meetingRegistration = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  meetingRegistration = new MeetingRegistration();
  
  // Try to get meeting ID from URL
  const meetingId = getMeetingIdFromURL();
  
  if (meetingId) {
    console.log('📍 Meeting ID detected in URL:', meetingId);
    
    // Register user for this meeting
    meetingRegistration.registerForMeeting(meetingId).then(result => {
      if (result.success) {
        // Set up auto-unregister
        meetingRegistration.setupAutoUnregister();
      }
    });
  }
});

/**
 * Extract meeting ID from current URL
 */
function getMeetingIdFromURL() {
  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  let meetingId = urlParams.get('meetingId') || urlParams.get('meeting_id');
  
  if (meetingId) return meetingId;
  
  // Check URL path patterns
  const pathMatch = window.location.pathname.match(/\/meeting\/([^/]+)/);
  if (pathMatch) return pathMatch[1];
  
  // Check for Zoom join URLs
  const zoomMatch = window.location.href.match(/zoom\.us\/j\/(\d+)/);
  if (zoomMatch) return zoomMatch[1];
  
  return null;
}

// Export for use in other modules
window.MeetingRegistration = MeetingRegistration;
window.meetingRegistration = meetingRegistration;

export default MeetingRegistration;
