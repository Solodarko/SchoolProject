/**
 * Content Script Template with Proper Message Handling
 * Add this to your content script to handle messaging properly
 */

(function() {
  'use strict';

  // Check if content script is already injected
  if (window.contentScriptInjected) {
    console.log('Content script already injected, skipping...');
    return;
  }
  window.contentScriptInjected = true;

  console.log('Content script injected and ready');

  // Message handler
  const messageHandler = {
    // Handle ping requests
    PING: (message, sender, sendResponse) => {
      console.log('Received PING, sending PONG');
      sendResponse({ type: 'PONG' });
      return true;
    },

    // Add your custom message handlers here
    GET_PAGE_DATA: (message, sender, sendResponse) => {
      try {
        const pageData = {
          url: window.location.href,
          title: document.title,
          timestamp: new Date().toISOString(),
          // Add more data as needed
        };
        sendResponse({ success: true, data: pageData });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
    },

    // Example: Interact with page elements
    CLICK_ELEMENT: (message, sender, sendResponse) => {
      try {
        const { selector } = message.payload;
        const element = document.querySelector(selector);
        
        if (element) {
          element.click();
          sendResponse({ success: true, message: 'Element clicked' });
        } else {
          sendResponse({ success: false, error: 'Element not found' });
        }
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
    },

    // Example: Get form data
    GET_FORM_DATA: (message, sender, sendResponse) => {
      try {
        const forms = Array.from(document.forms).map(form => ({
          action: form.action,
          method: form.method,
          elements: Array.from(form.elements).map(el => ({
            name: el.name,
            type: el.type,
            value: el.value
          }))
        }));
        
        sendResponse({ success: true, data: forms });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }
  };

  // Main message listener
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message);

    try {
      const { type } = message;
      
      if (messageHandler[type]) {
        // Call the appropriate handler
        return messageHandler[type](message, sender, sendResponse);
      } else {
        console.warn('Unknown message type:', type);
        sendResponse({ 
          success: false, 
          error: `Unknown message type: ${type}` 
        });
        return true;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ 
        success: false, 
        error: error.message 
      });
      return true;
    }
  });

  // Handle page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('Page hidden, content script still active');
    } else {
      console.log('Page visible, content script ready');
    }
  });

  // Handle page unload
  window.addEventListener('beforeunload', () => {
    console.log('Page unloading, content script cleanup...');
    // Add any cleanup code here
  });

  // Notify background script that content script is ready
  try {
    chrome.runtime.sendMessage({ 
      type: 'CONTENT_SCRIPT_READY',
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to notify background script:', error);
  }

  // Keep-alive mechanism
  setInterval(() => {
    try {
      chrome.runtime.sendMessage({ type: 'KEEP_ALIVE' });
    } catch (error) {
      // Extension might be updating or disabled
      console.warn('Keep-alive message failed:', error);
    }
  }, 30000); // Send keep-alive every 30 seconds

})();

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { contentScriptInjected: true };
}
