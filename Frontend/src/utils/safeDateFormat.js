/**
 * Safe Date Formatting Utility
 * Prevents "RangeError: Invalid time value" errors in admin dashboard components
 */

import { format, isValid, parseISO } from 'date-fns';

/**
 * Safely format a date value with comprehensive error handling
 * @param {string|Date|number|null|undefined} dateValue - The date value to format
 * @param {string} formatString - The format string for date-fns format function
 * @param {string} fallback - The fallback value if date is invalid (default: 'Invalid Date')
 * @returns {string} - Formatted date string or fallback value
 */
export const safeDateFormat = (dateValue, formatString = 'yyyy-MM-dd HH:mm:ss', fallback = 'Invalid Date') => {
  try {
    // Return fallback immediately if dateValue is null, undefined, or empty
    if (!dateValue || dateValue === '' || dateValue === 'null' || dateValue === 'undefined') {
      console.warn('safeDateFormat: Invalid date value (null/undefined/empty):', dateValue);
      return fallback;
    }

    let date;

    // Handle different input types
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string') {
      // Try parsing ISO string first (most common for API responses)
      if (dateValue.includes('T') || dateValue.includes('Z')) {
        date = parseISO(dateValue);
      } else {
        date = new Date(dateValue);
      }
    } else if (typeof dateValue === 'number') {
      // Handle timestamps
      date = new Date(dateValue);
    } else {
      console.warn('safeDateFormat: Unsupported date type:', typeof dateValue, dateValue);
      return fallback;
    }

    // Check if the date is valid
    if (!isValid(date)) {
      console.warn('safeDateFormat: Invalid date object created from:', dateValue);
      return fallback;
    }

    // Check for extreme dates that might cause formatting issues
    const year = date.getFullYear();
    if (year < 1900 || year > 2100) {
      console.warn('safeDateFormat: Date year out of reasonable range:', year, dateValue);
      return fallback;
    }

    // Try to format the date
    const formatted = format(date, formatString);
    return formatted;

  } catch (error) {
    console.warn('safeDateFormat: Error formatting date:', {
      dateValue,
      formatString,
      error: error.message,
      stack: error.stack
    });
    return fallback;
  }
};

/**
 * Safe format for join time (HH:mm:ss)
 */
export const safeFormatJoinTime = (dateValue) => {
  return safeDateFormat(dateValue, 'HH:mm:ss', 'Unknown Time');
};

/**
 * Safe format for date only (MMM dd, yyyy)
 */
export const safeFormatDate = (dateValue) => {
  return safeDateFormat(dateValue, 'MMM dd, yyyy', 'Unknown Date');
};

/**
 * Safe format for datetime (MMM dd, yyyy HH:mm)
 */
export const safeFormatDateTime = (dateValue) => {
  return safeDateFormat(dateValue, 'MMM dd, yyyy HH:mm', 'Unknown Date/Time');
};

/**
 * Safe format for time only (HH:mm)
 */
export const safeFormatTime = (dateValue) => {
  return safeDateFormat(dateValue, 'HH:mm', 'Unknown Time');
};

/**
 * Safe format for short date (MMM dd)
 */
export const safeFormatShortDate = (dateValue) => {
  return safeDateFormat(dateValue, 'MMM dd', 'Unknown');
};

/**
 * Safe format for created at timestamps (MMM dd, HH:mm)
 */
export const safeFormatCreatedAt = (dateValue) => {
  return safeDateFormat(dateValue, 'MMM dd, HH:mm', 'Unknown');
};

/**
 * Safe format for last updated timestamps (HH:mm:ss)
 */
export const safeFormatLastUpdated = (dateValue) => {
  return safeDateFormat(dateValue, 'HH:mm:ss', 'Never');
};

/**
 * Safely check if a date value is valid for formatting
 * @param {any} dateValue - The date value to check
 * @returns {boolean} - True if the date value can be safely formatted
 */
export const isDateValueValid = (dateValue) => {
  try {
    if (!dateValue || dateValue === '' || dateValue === 'null' || dateValue === 'undefined') {
      return false;
    }

    let date;
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string') {
      if (dateValue.includes('T') || dateValue.includes('Z')) {
        date = parseISO(dateValue);
      } else {
        date = new Date(dateValue);
      }
    } else if (typeof dateValue === 'number') {
      date = new Date(dateValue);
    } else {
      return false;
    }

    return isValid(date) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100;
  } catch (error) {
    return false;
  }
};

/**
 * Get current timestamp in ISO format (useful for fallback values)
 */
export const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Safe date formatting with custom fallback
 * @param {any} dateValue - The date value to format
 * @param {string} formatString - The format string
 * @param {string} customFallback - Custom fallback value
 * @returns {string} - Formatted date or custom fallback
 */
export const safeFormatWithFallback = (dateValue, formatString, customFallback) => {
  return safeDateFormat(dateValue, formatString, customFallback);
};

// Export default as the main safeDateFormat function
export default safeDateFormat;
