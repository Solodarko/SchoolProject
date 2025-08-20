/**
 * Background Script / Service Worker Fix
 * Handles proper content script injection and messaging
 */

// For Manifest V2 (background.js) or V3 (service-worker.js)
const isManifestV3 = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest().manifest_version === 3;

class BackgroundScriptManager {
  constructor() {
    this.contentScriptFiles = [
      'content.js',
      'content-script.js',
      'scripts/content.js'
    ];
    this.activeConnections = new Map();
    this.injectedTabs = new Set();
    this.retryAttempts = 3;
    this.init();
  }

  init() {
    // Listen for extension installation/startup
    chrome.runtime.onInstalled.addListener((details) => {
      console.log('Extension installed/updated:', details);
      this.handleExtensionStartup();
    });

    if (!isManifestV3) {
      chrome.runtime.onStartup.addListener(() => {
        console.log('Extension started');
        this.handleExtensionStartup();
      });
    }

    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

    // Listen for tab updates
    chrome.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this));

    // Listen for tab removal
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.activeConnections.delete(tabId);
      this.injectedTabs.delete(tabId);
    });

    // Listen for connect events (for long-lived connections)
    chrome.runtime.onConnect.addListener(this.handleConnection.bind(this));
  }

  async handleExtensionStartup() {
    console.log('Handling extension startup...');
    
    try {
      // Get all existing tabs
      const tabs = await chrome.tabs.query({});
      
      // Inject content scripts into valid tabs
      for (const tab of tabs) {
        if (this.isValidTab(tab)) {
          await this.injectContentScriptSafe(tab.id);
        }
      }
    } catch (error) {
      console.error('Error during startup injection:', error);
    }
  }

  handleMessage(message, sender, sendResponse) {
    console.log('Background received message:', message, 'from:', sender);

    switch (message.type) {
      case 'CONTENT_SCRIPT_READY':
        this.injectedTabs.add(sender.tab?.id);
        this.activeConnections.set(sender.tab?.id, {
          tab: sender.tab,
          timestamp: new Date(),
          ready: true
        });
        sendResponse({ success: true });
        return true;

      case 'KEEP_ALIVE':
        if (sender.tab?.id) {
          const connection = this.activeConnections.get(sender.tab.id);
          if (connection) {
            connection.lastPing = new Date();
          }
        }
        sendResponse({ success: true });
        return true;

      case 'GET_TAB_INFO':
        this.sendToContentScript(sender.tab?.id, {
          type: 'TAB_INFO_RESPONSE',
          data: {
            tabId: sender.tab?.id,
            url: sender.tab?.url,
            title: sender.tab?.title
          }
        });
        return true;

      default:
        console.warn('Unknown message type:', message.type);
        sendResponse({ success: false, error: 'Unknown message type' });
        return true;
    }
  }

  handleConnection(port) {
    console.log('New connection established:', port.name);
    
    const tabId = port.sender?.tab?.id;
    if (tabId) {
      this.activeConnections.set(tabId, {
        port,
        tab: port.sender.tab,
        timestamp: new Date(),
        ready: true
      });

      port.onDisconnect.addListener(() => {
        console.log('Connection disconnected for tab:', tabId);
        this.activeConnections.delete(tabId);
      });
    }
  }

  async handleTabUpdated(tabId, changeInfo, tab) {
    console.log('Tab updated:', tabId, changeInfo);

    if (changeInfo.status === 'loading') {
      // Tab is reloading, remove from tracked sets
      this.injectedTabs.delete(tabId);
      this.activeConnections.delete(tabId);
    } else if (changeInfo.status === 'complete' && this.isValidTab(tab)) {
      // Page loaded completely, inject content script
      await this.injectContentScriptSafe(tabId);
    }
  }

  async injectContentScriptSafe(tabId, attempts = 0) {
    if (attempts >= this.retryAttempts) {
      console.error(`Failed to inject content script in tab ${tabId} after ${this.retryAttempts} attempts`);
      return false;
    }

    try {
      console.log(`Injecting content script into tab ${tabId}, attempt ${attempts + 1}`);

      // Check if already injected
      const isActive = await this.isContentScriptActive(tabId);
      if (isActive) {
        console.log(`Content script already active in tab ${tabId}`);
        return true;
      }

      if (isManifestV3) {
        // Manifest V3 approach
        await chrome.scripting.executeScript({
          target: { tabId },
          files: this.contentScriptFiles.filter(file => this.fileExists(file))
        });
      } else {
        // Manifest V2 approach
        for (const file of this.contentScriptFiles) {
          if (this.fileExists(file)) {
            await new Promise((resolve, reject) => {
              chrome.tabs.executeScript(tabId, { file }, (result) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(result);
                }
              });
            });
            break; // Only inject the first available file
          }
        }
      }

      // Wait for injection to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify injection
      const injectionSuccessful = await this.isContentScriptActive(tabId);
      if (injectionSuccessful) {
        this.injectedTabs.add(tabId);
        console.log(`Successfully injected content script into tab ${tabId}`);
        return true;
      } else {
        // Retry
        return this.injectContentScriptSafe(tabId, attempts + 1);
      }

    } catch (error) {
      console.error(`Content script injection attempt ${attempts + 1} failed:`, error);
      
      if (attempts < this.retryAttempts - 1) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.injectContentScriptSafe(tabId, attempts + 1);
      }
      return false;
    }
  }

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
        resolve(false);
      }
    });
  }

  async sendToContentScript(tabId, message, options = {}) {
    const { retries = 2, timeout = 5000, autoInject = true } = options;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Check if content script is active
        if (!(await this.isContentScriptActive(tabId)) && autoInject) {
          console.log(`Content script not active in tab ${tabId}, injecting...`);
          await this.injectContentScriptSafe(tabId);
        }

        // Send message
        return await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error(`Message timeout after ${timeout}ms`));
          }, timeout);

          chrome.tabs.sendMessage(tabId, message, (response) => {
            clearTimeout(timeoutId);
            
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });

      } catch (error) {
        console.error(`Message send attempt ${attempt + 1} failed:`, error);
        
        if (attempt < retries) {
          this.injectedTabs.delete(tabId);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          throw error;
        }
      }
    }
  }

  isValidTab(tab) {
    return tab && 
           tab.url && 
           !tab.url.startsWith('chrome://') &&
           !tab.url.startsWith('chrome-extension://') &&
           !tab.url.startsWith('moz-extension://') &&
           !tab.url.startsWith('about:') &&
           !tab.url.startsWith('edge://') &&
           !tab.url.startsWith('safari-extension://');
  }

  fileExists(filename) {
    // This is a simplified check - in practice, you'd want to verify the file exists
    // For now, assume the first file in the array exists
    return this.contentScriptFiles.indexOf(filename) === 0;
  }

  // Utility methods for external use
  getActiveConnections() {
    return Array.from(this.activeConnections.entries());
  }

  getInjectedTabs() {
    return Array.from(this.injectedTabs);
  }

  async reinjectAllTabs() {
    const tabs = await chrome.tabs.query({});
    const results = [];
    
    for (const tab of tabs) {
      if (this.isValidTab(tab)) {
        try {
          const success = await this.injectContentScriptSafe(tab.id);
          results.push({ tabId: tab.id, success, url: tab.url });
        } catch (error) {
          results.push({ tabId: tab.id, success: false, error: error.message, url: tab.url });
        }
      }
    }
    
    return results;
  }
}

// Initialize the background script manager
const backgroundManager = new BackgroundScriptManager();

// Export for external access (if needed)
if (typeof global !== 'undefined') {
  global.backgroundManager = backgroundManager;
}
