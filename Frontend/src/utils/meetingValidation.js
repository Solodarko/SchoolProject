/**
 * Meeting ID validation utilities
 * Provides validation for Zoom meeting IDs and helpful error messages
 */

/**
 * Validates a Zoom meeting ID format
 * @param {string} meetingId - The meeting ID to validate
 * @returns {object} - Validation result with isValid, error, and suggestions
 */
export const validateMeetingId = (meetingId) => {
  const result = {
    isValid: false,
    error: '',
    suggestions: [],
    formattedId: null
  };

  if (!meetingId || typeof meetingId !== 'string') {
    result.error = 'Meeting ID is required';
    result.suggestions = [
      'Enter a valid Zoom meeting ID',
      'Meeting IDs are typically 9-11 digit numbers'
    ];
    return result;
  }

  // Remove all non-numeric characters for validation
  const cleanId = meetingId.replace(/\D/g, '');
  
  if (cleanId.length === 0) {
    result.error = 'Meeting ID must contain numbers';
    result.suggestions = [
      'Enter a numeric meeting ID',
      'Example: 123-456-7890 or 1234567890'
    ];
    return result;
  }

  // Check length constraints
  if (cleanId.length < 9) {
    result.error = 'Meeting ID is too short';
    result.suggestions = [
      'Zoom meeting IDs are typically 9-11 digits long',
      'Double-check your meeting ID from the Zoom invitation'
    ];
    return result;
  }

  if (cleanId.length > 11) {
    result.error = 'Meeting ID is too long';
    result.suggestions = [
      'Zoom meeting IDs are typically 9-11 digits long',
      'Remove any extra characters or spaces'
    ];
    return result;
  }

  // Check for common invalid patterns
  if (/^0+$/.test(cleanId)) {
    result.error = 'Invalid meeting ID format';
    result.suggestions = [
      'Meeting ID cannot be all zeros',
      'Check your meeting invitation for the correct ID'
    ];
    return result;
  }

  // Format the ID with standard formatting
  result.formattedId = formatMeetingId(cleanId);
  result.isValid = true;
  return result;
};

/**
 * Formats a meeting ID with standard Zoom formatting
 * @param {string} meetingId - The meeting ID to format
 * @returns {string} - Formatted meeting ID
 */
export const formatMeetingId = (meetingId) => {
  const cleanId = meetingId.replace(/\D/g, '');
  
  if (cleanId.length === 9) {
    // Format as XXX-XXX-XXX
    return `${cleanId.slice(0, 3)}-${cleanId.slice(3, 6)}-${cleanId.slice(6)}`;
  } else if (cleanId.length === 10) {
    // Format as XXX-XXX-XXXX
    return `${cleanId.slice(0, 3)}-${cleanId.slice(3, 6)}-${cleanId.slice(6)}`;
  } else if (cleanId.length === 11) {
    // Format as XXX-XXXX-XXXX
    return `${cleanId.slice(0, 3)}-${cleanId.slice(3, 7)}-${cleanId.slice(7)}`;
  }
  
  return cleanId;
};

/**
 * Gets helpful error messages for common meeting issues
 * @param {object} error - The error object from API response
 * @returns {object} - Enhanced error message with suggestions
 */
export const getMeetingErrorMessage = (error) => {
  const result = {
    title: 'Failed to Start Tracking',
    message: 'An error occurred while starting attendance tracking',
    suggestions: [],
    severity: 'error'
  };

  if (!error) {
    return result;
  }

  const errorMessage = error.response?.data?.error || error.message || '';
  const statusCode = error.response?.status;

  // Handle specific error cases
  if (statusCode === 404 || errorMessage.toLowerCase().includes('not found')) {
    result.title = 'Meeting Not Found';
    result.message = 'The meeting ID you entered could not be found';
    result.suggestions = [
      'Verify the meeting ID is correct',
      'Ensure the meeting has started',
      'Check if the meeting is scheduled for the future',
      'Confirm you have the right meeting ID from the host'
    ];
  } else if (statusCode === 401 || errorMessage.toLowerCase().includes('unauthorized')) {
    result.title = 'Authorization Error';
    result.message = 'Unable to access meeting information';
    result.suggestions = [
      'The meeting may be password protected',
      'You may not have permission to track this meeting',
      'Contact your system administrator'
    ];
  } else if (statusCode === 429 || errorMessage.toLowerCase().includes('rate limit')) {
    result.title = 'Too Many Requests';
    result.message = 'Please wait a moment before trying again';
    result.suggestions = [
      'Wait 30 seconds before retrying',
      'The system is temporarily busy'
    ];
    result.severity = 'warning';
  } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) {
    result.title = 'Connection Error';
    result.message = 'Unable to connect to Zoom services';
    result.suggestions = [
      'Check your internet connection',
      'Try again in a few moments',
      'Contact support if the problem persists'
    ];
    result.severity = 'warning';
  } else if (errorMessage.toLowerCase().includes('meeting ended') || errorMessage.toLowerCase().includes('ended')) {
    result.title = 'Meeting Has Ended';
    result.message = 'This meeting is no longer active';
    result.suggestions = [
      'The meeting may have already ended',
      'Check if you have the correct meeting ID',
      'Try tracking a different active meeting'
    ];
    result.severity = 'info';
  } else if (errorMessage.toLowerCase().includes('not started') || errorMessage.toLowerCase().includes('scheduled')) {
    result.title = 'Meeting Not Started';
    result.message = 'The meeting has not started yet';
    result.suggestions = [
      'Wait for the meeting to begin',
      'Check the meeting start time',
      'Verify the meeting is scheduled for today'
    ];
    result.severity = 'info';
  }

  return result;
};

/**
 * Extracts meeting ID from various Zoom URL formats
 * @param {string} input - URL or meeting ID string
 * @returns {string|null} - Extracted meeting ID or null if not found
 */
export const extractMeetingIdFromUrl = (input) => {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // Check if it's already a meeting ID
  const directIdMatch = input.match(/^\d{9,11}$/);
  if (directIdMatch) {
    return directIdMatch[0];
  }

  // Extract from Zoom URLs
  const urlPatterns = [
    /zoom\.us\/j\/(\d+)/,           // zoom.us/j/123456789
    /zoom\.us\/meeting\/(\d+)/,     // zoom.us/meeting/123456789
    /zoom\.us\/webinar\/(\d+)/,     // zoom.us/webinar/123456789
    /meetingId=(\d+)/,              // ?meetingId=123456789
    /confno=(\d+)/,                 // ?confno=123456789
    /\/(\d{9,11})(?:\?|$)/          // Generic URL with meeting ID
  ];

  for (const pattern of urlPatterns) {
    const match = input.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Gets meeting ID examples for user guidance
 * @returns {array} - Array of example meeting IDs and formats
 */
export const getMeetingIdExamples = () => [
  {
    format: 'Standard 10-digit',
    example: '123-456-7890',
    description: 'Most common format'
  },
  {
    format: '9-digit',
    example: '123-456-789',
    description: 'Shorter format'
  },
  {
    format: '11-digit',
    example: '123-4567-8901',
    description: 'Extended format'
  },
  {
    format: 'No dashes',
    example: '1234567890',
    description: 'Numbers only'
  }
];

export default {
  validateMeetingId,
  formatMeetingId,
  getMeetingErrorMessage,
  extractMeetingIdFromUrl,
  getMeetingIdExamples
};
