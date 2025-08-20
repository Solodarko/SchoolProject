/**
 * Notification Filter Service
 * Reduces notification noise by filtering out repetitive and non-critical notifications
 */

class NotificationFilter {
  constructor() {
    this.recentNotifications = new Map();
    this.suppressDuration = 30000; // 30 seconds
    this.maxNotificationsPerMinute = 5;
    this.notificationCounts = new Map();
  }

  /**
   * Check if a notification should be shown or suppressed
   */
  shouldShow(message, type = 'info', category = 'general') {
    const now = Date.now();
    const key = `${category}:${type}`;
    
    // Critical messages always show
    if (type === 'error' && message.includes('Backend server')) {
      return true;
    }

    // Check if we've shown this exact message recently
    const messageKey = `${key}:${message}`;
    if (this.recentNotifications.has(messageKey)) {
      const lastShown = this.recentNotifications.get(messageKey);
      if (now - lastShown < this.suppressDuration) {
        return false; // Suppress duplicate message
      }
    }

    // Check rate limiting
    if (!this.notificationCounts.has(key)) {
      this.notificationCounts.set(key, []);
    }

    const timestamps = this.notificationCounts.get(key);
    const oneMinuteAgo = now - 60000;
    
    // Clean old timestamps
    const recentTimestamps = timestamps.filter(t => t > oneMinuteAgo);
    this.notificationCounts.set(key, recentTimestamps);

    // Check if we're over the limit
    if (recentTimestamps.length >= this.maxNotificationsPerMinute) {
      return false; // Rate limited
    }

    // Allow notification and record it
    this.recentNotifications.set(messageKey, now);
    recentTimestamps.push(now);
    
    return true;
  }

  /**
   * Filter connection status notifications
   */
  shouldShowConnectionNotification(status, attempts = 0, isInitial = false) {
    // Always show initial connection success notification
    if (status === 'connected') {
      return isInitial || attempts > 0; // Show if initial connection OR after previous attempts
    }

    // For disconnections, only show unexpected ones
    if (status === 'disconnected') {
      return false; // Most disconnections are expected
    }

    // Show connection errors only for first few attempts
    if (status === 'error') {
      return attempts <= 2;
    }

    return true;
  }

  /**
   * Clear old notifications to prevent memory leaks
   */
  cleanup() {
    const now = Date.now();
    const cutoff = now - (this.suppressDuration * 2);

    // Clean recent notifications
    for (const [key, timestamp] of this.recentNotifications.entries()) {
      if (timestamp < cutoff) {
        this.recentNotifications.delete(key);
      }
    }

    // Clean notification counts
    for (const [key, timestamps] of this.notificationCounts.entries()) {
      const recent = timestamps.filter(t => t > cutoff);
      if (recent.length === 0) {
        this.notificationCounts.delete(key);
      } else {
        this.notificationCounts.set(key, recent);
      }
    }
  }

  /**
   * Reset all filters (useful for testing or manual reset)
   */
  reset() {
    this.recentNotifications.clear();
    this.notificationCounts.clear();
  }
}

// Create singleton instance
const notificationFilter = new NotificationFilter();

// Set up periodic cleanup
setInterval(() => {
  notificationFilter.cleanup();
}, 60000); // Clean up every minute

export default notificationFilter;
