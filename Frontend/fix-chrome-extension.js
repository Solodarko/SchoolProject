/**
 * Quick Fix for Chrome Extension Content Script Issues
 * Run this in your browser console to manually inject content scripts
 */

// Function to check if we're in an extension context
function isExtensionContext() {
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
}

// Function to inject content script into current tab
async function injectContentScriptToCurrentTab() {
  if (!isExtensionContext()) {
    console.log('Not in extension context - this script should be run from extension popup or background');
    return;
  }

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      console.error('No active tab found');
      return;
    }

    console.log('Injecting content script into tab:', tab.id, tab.url);

    // Try to inject content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Content script code to inject
        if (window.contentScriptInjected) {
          console.log('Content script already injected');
          return 'already-injected';
        }
        
        window.contentScriptInjected = true;
        console.log('Content script injected successfully');

        // Add message listener
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          console.log('Content script received message:', message);
          
          switch (message.type) {
            case 'PING':
              sendResponse({ type: 'PONG', status: 'active' });
              return true;
              
            case 'GET_PAGE_INFO':
              sendResponse({ 
                type: 'PAGE_INFO_RESPONSE',
                data: {
                  url: window.location.href,
                  title: document.title,
                  timestamp: new Date().toISOString()
                }
              });
              return true;
              
            default:
              sendResponse({ type: 'UNKNOWN_MESSAGE', received: message.type });
              return true;
          }
        });

        // Notify background script
        try {
          chrome.runtime.sendMessage({ 
            type: 'CONTENT_SCRIPT_READY',
            tabId: chrome.devtools?.inspectedWindow?.tabId || 'unknown',
            url: window.location.href
          });
        } catch (error) {
          console.warn('Failed to notify background script:', error);
        }

        return 'injected-successfully';
      }
    });

    // Test the injection
    setTimeout(async () => {
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
        if (response && response.type === 'PONG') {
          console.log('✅ Content script injection successful!');
        } else {
          console.log('⚠️ Content script may not be working properly');
        }
      } catch (error) {
        console.error('❌ Content script test failed:', error);
      }
    }, 1000);

  } catch (error) {
    console.error('Failed to inject content script:', error);
  }
}

// Function to fix all tabs
async function fixAllTabs() {
  if (!isExtensionContext()) {
    console.log('Not in extension context');
    return;
  }

  try {
    const tabs = await chrome.tabs.query({});
    console.log(`Found ${tabs.length} tabs to fix`);

    for (const tab of tabs) {
      // Skip chrome:// and extension pages
      if (tab.url && 
          !tab.url.startsWith('chrome://') && 
          !tab.url.startsWith('chrome-extension://') &&
          !tab.url.startsWith('about:')) {
        
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              if (!window.contentScriptInjected) {
                window.contentScriptInjected = true;
                
                chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                  if (message.type === 'PING') {
                    sendResponse({ type: 'PONG', status: 'active' });
                    return true;
                  }
                  return true;
                });
                
                console.log('Content script auto-injected');
              }
            }
          });
          console.log(`✅ Fixed tab ${tab.id}: ${tab.title}`);
        } catch (error) {
          console.warn(`⚠️ Could not fix tab ${tab.id}: ${error.message}`);
        }
      }
    }
  } catch (error) {
    console.error('Failed to fix tabs:', error);
  }
}

// Export functions for use
if (typeof window !== 'undefined') {
  window.fixChromeExtension = {
    injectContentScriptToCurrentTab,
    fixAllTabs,
    isExtensionContext
  };
}

console.log(`
🔧 Chrome Extension Fix Loaded!

To fix the content script issue, run one of these commands:

1. Fix current tab:
   fixChromeExtension.injectContentScriptToCurrentTab()

2. Fix all tabs:
   fixChromeExtension.fixAllTabs()

3. Check if in extension context:
   fixChromeExtension.isExtensionContext()
`);
