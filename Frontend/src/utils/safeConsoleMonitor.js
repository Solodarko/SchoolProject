// Safe Console Monitor - No React dependencies
// This utility monitors console errors without requiring React to be globally accessible

class SafeConsoleMonitor {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.fixesApplied = [];
    this.isProduction = process.env.NODE_ENV === 'production';
    this.initialized = false;
  }

  // Safe initialization that won't throw errors
  initialize() {
    if (this.initialized || this.isProduction) return;

    try {
      this.setupErrorMonitoring();
      this.setupWarningMonitoring();
      this.checkCommonIssues();
      this.applyPreventiveFixes();
      this.initialized = true;
      console.log('✅ Safe console monitoring initialized');
    } catch (error) {
      console.warn('Console monitor initialization failed:', error.message);
    }
  }

  // Monitor console errors safely
  setupErrorMonitoring() {
    if (typeof console === 'undefined') return;

    const originalError = console.error;
    console.error = (...args) => {
      try {
        const message = args.map(arg => 
          typeof arg === 'string' ? arg : String(arg)
        ).join(' ');
        
        this.logError('CONSOLE_ERROR', message);
      } catch (e) {
        // Silently fail to avoid recursive errors
      }
      originalError.apply(console, args);
    };

    // Monitor window errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        try {
          this.logError('WINDOW_ERROR', `${event.message} at ${event.filename}:${event.lineno}`);
        } catch (e) {
          // Silently fail
        }
      });

      // Monitor unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        try {
          const message = event.reason?.message || String(event.reason) || 'Unknown rejection';
          this.logError('UNHANDLED_REJECTION', message);
        } catch (e) {
          // Silently fail
        }
      });
    }
  }

  // Monitor console warnings safely
  setupWarningMonitoring() {
    if (typeof console === 'undefined') return;

    const originalWarn = console.warn;
    console.warn = (...args) => {
      try {
        const message = args.map(arg => 
          typeof arg === 'string' ? arg : String(arg)
        ).join(' ');
        
        this.logWarning('CONSOLE_WARN', message);
        this.handleSpecificWarnings(message);
      } catch (e) {
        // Silently fail to avoid recursive errors
      }
      originalWarn.apply(console, args);
    };
  }

  // Handle specific warning patterns
  handleSpecificWarnings(message) {
    try {
      if (message.includes('validateDOMNesting')) {
        this.addFix('DOM_NESTING_WARNING', 'Check JSX structure for invalid nesting');
      } else if (message.includes('componentWillReceiveProps')) {
        this.addFix('DEPRECATED_LIFECYCLE', 'Update to modern React patterns');
      } else if (message.includes('findDOMNode')) {
        this.addFix('FINDDOMNODE_WARNING', 'Use refs instead of findDOMNode');
      } else if (message.includes('Each child in a list should have a unique "key" prop')) {
        this.addFix('MISSING_KEY_WARNING', 'Add unique key props to list items');
      } else if (message.includes('Password field is not contained in a form')) {
        this.addFix('PASSWORD_FORM_WARNING', 'Wrap password fields in form elements');
      }
    } catch (e) {
      // Silently fail
    }
  }

  // Safely log errors
  logError(type, message) {
    try {
      const error = {
        type,
        message: String(message).substring(0, 500), // Limit message length
        timestamp: new Date().toISOString(),
        id: Date.now() + Math.random()
      };
      
      this.errors.push(error);
      
      // Keep only last 50 errors to prevent memory issues
      if (this.errors.length > 50) {
        this.errors = this.errors.slice(-50);
      }
      
      // Store safely in localStorage
      this.safeLocalStorageSet('consoleErrors', JSON.stringify(this.errors.slice(-20)));
    } catch (e) {
      // Silently fail to prevent recursive errors
    }
  }

  // Safely log warnings
  logWarning(type, message) {
    try {
      const warning = {
        type,
        message: String(message).substring(0, 500),
        timestamp: new Date().toISOString(),
        id: Date.now() + Math.random()
      };
      
      this.warnings.push(warning);
      
      // Keep only last 50 warnings
      if (this.warnings.length > 50) {
        this.warnings = this.warnings.slice(-50);
      }
    } catch (e) {
      // Silently fail
    }
  }

  // Safe localStorage operations
  safeLocalStorageSet(key, value) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      // Storage quota exceeded or localStorage not available
    }
  }

  safeLocalStorageGet(key) {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch (e) {
      // localStorage not available
    }
    return null;
  }

  // Check for common issues without dependencies
  checkCommonIssues() {
    try {
      this.checkAccessibility();
      this.checkPerformanceIssues();
      this.checkMemoryLeaks();
    } catch (e) {
      // Silently fail
    }
  }

  // Check accessibility issues safely
  checkAccessibility() {
    if (typeof document === 'undefined') return;

    setTimeout(() => {
      try {
        // Check for missing alt attributes
        const images = document.querySelectorAll('img:not([alt])');
        if (images && images.length > 0) {
          this.logWarning('ACCESSIBILITY_ISSUE', `${images.length} images missing alt attributes`);
        }
        
        // Check for missing labels
        const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
        if (inputs && inputs.length > 0) {
          this.logWarning('ACCESSIBILITY_ISSUE', `${inputs.length} inputs missing labels`);
        }
      } catch (e) {
        // DOM query failed
      }
    }, 3000);
  }

  // Check performance issues safely
  checkPerformanceIssues() {
    if (typeof window === 'undefined' || !window.performance) return;

    try {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          try {
            const entries = list.getEntries();
            entries.forEach(entry => {
              if (entry.duration > 100) {
                this.logWarning('PERFORMANCE_ISSUE', `Slow operation: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
              }
            });
          } catch (e) {
            // Observer callback failed
          }
        });
        
        observer.observe({ entryTypes: ['measure'] });
      }
    } catch (e) {
      // Performance Observer not supported
    }
  }

  // Check for memory leaks safely
  checkMemoryLeaks() {
    if (typeof window === 'undefined') return;

    // Monitor memory usage if available
    if ('memory' in performance) {
      try {
        const checkMemory = () => {
          const memory = performance.memory;
          const usedMB = memory.usedJSHeapSize / 1024 / 1024;
          const totalMB = memory.totalJSHeapSize / 1024 / 1024;
          
          if (usedMB > 100) { // 100MB threshold
            this.logWarning('MEMORY_USAGE', `High memory usage: ${usedMB.toFixed(2)}MB used`);
          }
        };

        // Check memory every 30 seconds
        setInterval(checkMemory, 30000);
      } catch (e) {
        // Memory monitoring failed
      }
    }
  }

  // Apply safe preventive fixes
  applyPreventiveFixes() {
    try {
      this.addGlobalHelpers();
      this.fixesApplied.push('GLOBAL_HELPERS');
    } catch (e) {
      // Preventive fixes failed
    }
  }

  // Add global helper functions safely
  addGlobalHelpers() {
    if (typeof window === 'undefined') return;

    try {
      // Safe console methods
      window.safeConsole = {
        log: (...args) => {
          try {
            console.log(...args);
          } catch (e) {
            // Console not available
          }
        },
        error: (...args) => {
          try {
            console.error(...args);
          } catch (e) {
            // Console not available
          }
        }
      };

      // Safe DOM helper
      window.safeQuerySelector = (selector) => {
        try {
          return document.querySelector(selector);
        } catch (e) {
          return null;
        }
      };
    } catch (e) {
      // Global helpers setup failed
    }
  }

  // Add a fix to the list
  addFix(type, description) {
    try {
      if (!this.fixesApplied.includes(type)) {
        this.fixesApplied.push(type);
        console.log(`🔧 ${description}`);
      }
    } catch (e) {
      // Adding fix failed
    }
  }

  // Get error summary safely
  getErrorSummary() {
    try {
      return {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
        fixesApplied: this.fixesApplied.length,
        recentErrors: this.errors.slice(-10),
        recentWarnings: this.warnings.slice(-10),
        appliedFixes: this.fixesApplied,
        isMonitoring: this.initialized
      };
    } catch (e) {
      return {
        totalErrors: 0,
        totalWarnings: 0,
        fixesApplied: 0,
        recentErrors: [],
        recentWarnings: [],
        appliedFixes: [],
        isMonitoring: false,
        error: 'Summary generation failed'
      };
    }
  }

  // Clear stored errors safely
  clearErrors() {
    try {
      this.errors = [];
      this.warnings = [];
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('consoleErrors');
      }
    } catch (e) {
      // Clear operation failed
    }
  }

  // Export error report safely
  exportErrorReport() {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        userAgent: (typeof navigator !== 'undefined') ? navigator.userAgent : 'unknown',
        url: (typeof window !== 'undefined') ? window.location.href : 'unknown',
        summary: this.getErrorSummary(),
        environment: {
          NODE_ENV: process.env.NODE_ENV || 'unknown',
          isProduction: this.isProduction,
          hasReact: typeof window !== 'undefined' && !!window.React,
          hasDocument: typeof document !== 'undefined',
          hasConsole: typeof console !== 'undefined'
        }
      };
      
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `safe-console-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Failed to export error report:', e.message);
    }
  }
}

// Create global instance
const safeConsoleMonitor = new SafeConsoleMonitor();

// Safe initialization
if (typeof window !== 'undefined') {
  // Initialize immediately or when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      safeConsoleMonitor.initialize();
    });
  } else {
    // DOM already loaded
    setTimeout(() => {
      safeConsoleMonitor.initialize();
    }, 100);
  }
}

// Export for use
export { safeConsoleMonitor };
export default safeConsoleMonitor;
