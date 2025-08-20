import { useEffect } from 'react';
import { useNotificationSystem } from '../context/NotificationSystem';

/**
 * Hook to automatically track authentication events and create notifications
 * This hook should be used in components where authentication state changes occur
 */
export const useAuthNotifications = () => {
  const { addSignInNotification } = useNotificationSystem();

  /**
   * Manually trigger a sign-in notification
   * Call this function when a user successfully signs in
   * 
   * @param {Object} userInfo - User information object
   * @param {string} userInfo.userId - User ID
   * @param {string} userInfo.username - Username
   * @param {string} userInfo.email - User email
   * @param {string} userInfo.fullName - User's full name
   * @param {string} userInfo.role - User role (admin, student, teacher, etc.)
   * @param {string} userInfo.studentId - Student ID (if applicable)
   * @param {string} userInfo.department - User's department
   * @param {string} [userInfo.ipAddress] - User's IP address (if available)
   * @param {string} [userInfo.userAgent] - User's browser/device info
   */
  const triggerSignInNotification = (userInfo) => {
    try {
      // Validate required fields
      if (!userInfo || !userInfo.username) {
        console.warn('useAuthNotifications: Cannot create sign-in notification - missing user information');
        return;
      }

      // Enhance user info with additional metadata
      const enhancedUserInfo = {
        ...userInfo,
        ipAddress: userInfo.ipAddress || 'Unknown',
        userAgent: userInfo.userAgent || navigator.userAgent,
        signInTime: new Date().toISOString(),
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      console.log('🔔 Creating sign-in notification for user:', enhancedUserInfo.username);
      
      // Create the notification
      addSignInNotification(enhancedUserInfo);
      
      console.log('✅ Sign-in notification created successfully');
      
    } catch (error) {
      console.error('❌ Failed to create sign-in notification:', error);
    }
  };

  /**
   * Track sign-out event (optional)
   * Call this function when a user signs out
   */
  const triggerSignOutNotification = (userInfo) => {
    try {
      if (!userInfo || !userInfo.username) {
        return;
      }

      // You can add a sign-out notification if desired
      console.log('👋 User signed out:', userInfo.username);
      
      // Optionally create a sign-out notification
      // addSignOutNotification(userInfo);
      
    } catch (error) {
      console.error('❌ Failed to track sign-out:', error);
    }
  };

  /**
   * Auto-detect authentication changes from localStorage/sessionStorage
   * This will automatically trigger notifications when auth state changes
   */
  useEffect(() => {
    const checkAuthChanges = () => {
      try {
        // Check for authentication tokens
        const token = localStorage.getItem('token') || 
                     localStorage.getItem('authToken') || 
                     sessionStorage.getItem('token');
        
        const userDataString = localStorage.getItem('userData') || 
                              localStorage.getItem('user') || 
                              sessionStorage.getItem('userData');

        // If we have both token and user data, and haven't notified for this session
        if (token && userDataString) {
          try {
            const userData = JSON.parse(userDataString);
            const sessionKey = `notified_signin_${userData.userId || userData.id}`;
            const lastNotifiedTime = sessionStorage.getItem(sessionKey);
            const currentTime = Date.now();
            
            // Only notify if we haven't notified in the last 5 minutes (to avoid spam)
            if (!lastNotifiedTime || (currentTime - parseInt(lastNotifiedTime)) > 5 * 60 * 1000) {
              triggerSignInNotification({
                userId: userData.userId || userData.id,
                username: userData.username || userData.email,
                email: userData.email,
                fullName: userData.fullName || userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
                role: userData.role,
                studentId: userData.studentId,
                department: userData.department,
                ipAddress: userData.ipAddress,
                userAgent: navigator.userAgent
              });
              
              // Mark this session as notified
              sessionStorage.setItem(sessionKey, currentTime.toString());
            }
          } catch (parseError) {
            console.warn('Failed to parse user data for auto sign-in notification:', parseError);
          }
        }
      } catch (error) {
        console.warn('Error in auto auth detection:', error);
      }
    };

    // Check immediately
    checkAuthChanges();
    
    // Set up listeners for storage changes (when user signs in/out in another tab)
    const handleStorageChange = (event) => {
      if (event.key === 'token' || event.key === 'authToken' || event.key === 'userData') {
        // Small delay to ensure all auth data is updated
        setTimeout(checkAuthChanges, 100);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically (every 30 seconds) in case of programmatic changes
    const interval = setInterval(checkAuthChanges, 30000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [addSignInNotification]);

  return {
    triggerSignInNotification,
    triggerSignOutNotification
  };
};

export default useAuthNotifications;
