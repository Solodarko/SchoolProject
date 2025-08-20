/**
 * Chrome Extension Communication Fix
 * Handles Chrome extension communication errors gracefully
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Handle Chrome extension communication errors
export const handleChromeExtensionErrors = () => {
  if (!isBrowser) return;

  // Override console.error to filter out Chrome extension errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    try {
      const safeString = (val) => {
        try {
          if (typeof val === 'string') return val;
          if (val instanceof Error) return val.message || String(val);
          return JSON.stringify(val);
        } catch {
          return String(val);
        }
      };
      const message = [args].flat().map(safeString).join(' ');
      
      // Filter out Chrome extension communication errors and common noisy warnings
      if ((message.includes('Could not establish connection') && 
           message.includes('Receiving end does not exist')) ||
          message.includes('You are importing createRoot from "react-dom" which is not supported') ||
          message.includes('Each child in a list should have a unique "key" prop')) {
        // Silently ignore these errors
        return;
      }
    } catch {
      // If there's any error in our filtering, just proceed with original logging
    }
    
    // Log all other errors normally
    originalConsoleError.apply(console, args);
  };

  // Handle unhandled promise rejections related to Chrome extensions
  window.addEventListener('unhandledrejection', (event) => {
    try {
      const reason = event?.reason;
      let message = '';
      if (typeof reason === 'string') message = reason;
      else if (reason instanceof Error) message = reason.message || String(reason);
      else message = JSON.stringify(reason);

      if (message.includes('Could not establish connection') && 
          message.includes('Receiving end does not exist')) {
        // Prevent the error from being logged
        event.preventDefault();
        return;
      }
    } catch {
      // no-op
    }
  });
};

// Initialize the fix
if (isBrowser) {
  handleChromeExtensionErrors();
}

export default handleChromeExtensionErrors;
