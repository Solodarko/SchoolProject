/**
 * Chrome Extension Messaging Fix
 * Handles safe messaging to content scripts with proper verification
 */

class ExtensionMessagingManager {
  constructor() {
    this.contentScriptPaths = [
      'content.js',
      'content-script.js',
      'scripts/content.js'
    ];
    this.injectedTabs = new Set();
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Check if content script is active in a tab
   */
  async isContentScriptActive(tabId) {
    return new Promise((resolve) => {
      try {
        chrome.tabs.sendMessage(tabId, { type: 'PING' }, (response) => {
          if (chrome.runtime.lastError) {
            resolve(false);
          } else {
            resolve(response && response.type === 'PONG');
          }
        });
      } catch (error) {
        console.error('Error checking content script:', error);
        resolve(false);
      }
    });
  }

  /**
   * Inject content script into tab
   */
  async injectContentScript(tabId, attempts = 0) {
    if (attempts >= this.retryAttempts) {
      throw new Error(`Failed to inject content script after ${this.retryAttempts} attempts`);
    }

    try {
      // Try to inject the content script
      await chrome.scripting.executeScript({
        target: { tabId },
        files: this.contentScriptPaths
      });

      // Wait a bit for the script to initialize
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify injection was successful
      const isActive = await this.isContentScriptActive(tabId);
      if (isActive) {
        this.injectedTabs.add(tabId);
        return true;
      } else {
        // Retry injection
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.injectContentScript(tabId, attempts + 1);
      }
    } catch (error) {
      console.error(`Content script injection attempt ${attempts + 1} failed:`, error);
      
      // Retry injection
      if (attempts < this.retryAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.injectContentScript(tabId, attempts + 1);
      } else {
        throw error;
      }
    }
  }

  /**
   * Safe message sending with content script verification
   */
  async sendMessageSafe(tabId, message, options = {}) {
    const { 
      autoInject = true, 
      timeout = 5000,
      retries = 2 
    } = options;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Check if content script is active
        const isActive = await this.isContentScriptActive(tabId);
        
        if (!isActive && autoInject) {
          console.log(`Content script not active in tab ${tabId}, attempting injection...`);
          await this.injectContentScript(tabId);
        } else if (!isActive) {
          throw new Error('Content script not active and auto-injection disabled');
        }

        // Send message with timeout
        return await this.sendMessageWithTimeout(tabId, message, timeout);

      } catch (error) {
        console.error(`Message send attempt ${attempt + 1} failed:`, error);
        
        if (attempt < retries) {
          // Remove tab from injected set and retry
          this.injectedTabs.delete(tabId);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Send message with timeout
   */
  sendMessageWithTimeout(tabId, message, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Message timeout after ${timeout}ms`));
      }, timeout);

      try {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          clearTimeout(timeoutId);
          
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Handle tab updates/reloads
   */
  onTabUpdated(tabId, changeInfo, tab) {
    if (changeInfo.status === 'loading') {
      // Remove tab from injected set when it starts reloading
      this.injectedTabs.delete(tabId);
    }
  }

  /**
   * Handle tab removal
   */
  onTabRemoved(tabId) {
    this.injectedTabs.delete(tabId);
  }

  /**
   * Initialize event listeners
   */
  init() {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.onUpdated.addListener(this.onTabUpdated.bind(this));
      chrome.tabs.onRemoved.addListener(this.onTabRemoved.bind(this));
      
      // Re-inject scripts on extension startup
      this.reinjectAllTabs();
    }
  }

  /**
   * Re-inject content scripts in all existing tabs
   */
  async reinjectAllTabs() {
    try {
      const tabs = await chrome.tabs.query({});
      
      for (const tab of tabs) {
        if (this.isValidTab(tab)) {
          try {
            await this.injectContentScript(tab.id);
          } catch (error) {
            console.warn(`Failed to inject script in tab ${tab.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to reinject scripts:', error);
    }
  }

  /**
   * Check if tab is valid for script injection
   */
  isValidTab(tab) {
    return tab.url && 
           !tab.url.startsWith('chrome://') && 
           !tab.url.startsWith('chrome-extension://') &&
           !tab.url.startsWith('moz-extension://') &&
           !tab.url.startsWith('about:');
  }
}

// Create global instance
window.extensionMessaging = new ExtensionMessagingManager();

// Usage examples:
/*
// Send message safely
extensionMessaging.sendMessageSafe(tabId, { 
  type: 'GET_DATA', 
  payload: { id: 123 } 
}).then(response => {
  console.log('Response:', response);
}).catch(error => {
  console.error('Message failed:', error);
});

// Send message with custom options
extensionMessaging.sendMessageSafe(tabId, message, {
  autoInject: true,    // Auto-inject content script if missing
  timeout: 10000,      // 10 second timeout
  retries: 3          // Retry 3 times
});
*/
