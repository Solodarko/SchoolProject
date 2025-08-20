// Performance monitoring utility to detect and log forced reflows
class PerformanceMonitor {
  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development';
    this.reflowThreshold = 16; // 16ms threshold for performance warnings
    this.recentCalls = new Map(); // Track recent DOM property calls
    this.setupMonitoring();
  }

  setupMonitoring() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    // Monitor forced reflows using Performance Observer
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'measure' && entry.duration > this.reflowThreshold) {
            console.warn(`Performance warning: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
      } catch (e) {
        console.warn('Performance Observer not fully supported:', e);
      }
    }

    // Override problematic DOM methods to detect frequent calls
    this.monitorDOMReads();
  }

  monitorDOMReads() {
    if (typeof window === 'undefined') return;

    const problematicProperties = [
      'offsetWidth', 'offsetHeight', 'offsetTop', 'offsetLeft',
      'clientWidth', 'clientHeight', 'clientTop', 'clientLeft',
      'scrollWidth', 'scrollHeight', 'scrollTop', 'scrollLeft',
      'getComputedStyle'
    ];

    const originalMethods = {};

    problematicProperties.forEach(prop => {
      if (prop === 'getComputedStyle') {
        originalMethods[prop] = window.getComputedStyle;
        // Fix: Properly bind the context and avoid illegal invocation
        const self = this;
        window.getComputedStyle = function(...args) {
          try {
            self.trackCall('getComputedStyle');
            return originalMethods[prop].apply(window, args);
          } catch (error) {
            // Fallback to original method if there's an error
            return originalMethods[prop].apply(window, args);
          }
        };
      } else {
        // Monitor Element prototype properties
        try {
          const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, prop);
          if (descriptor && descriptor.get) {
            originalMethods[prop] = descriptor.get;
            Object.defineProperty(Element.prototype, prop, {
              get: function() {
                try {
                  performanceMonitor.trackCall(prop);
                  return originalMethods[prop].call(this);
                } catch (error) {
                  // Fallback to original method if there's an error
                  return originalMethods[prop].call(this);
                }
              },
              configurable: true
            });
          }
        } catch (error) {
          // Skip properties that can't be overridden
          console.warn(`Could not override property: ${prop}`, error);
        }
      }
    });
  }

  trackCall(methodName) {
    if (!this.isEnabled) return;

    const now = performance.now();
    const key = methodName;
    
    if (!this.recentCalls.has(key)) {
      this.recentCalls.set(key, []);
    }
    
    const calls = this.recentCalls.get(key);
    calls.push(now);
    
    // Keep only calls from the last 100ms
    const cutoff = now - 100;
    this.recentCalls.set(key, calls.filter(time => time > cutoff));
    
    // Warn if there are too many calls in a short time
    if (calls.length > 10) {
      console.warn(`Potential reflow issue: ${methodName} called ${calls.length} times in 100ms`);
    }
  }

  // Utility methods for components to use
  measurePerformance(name, fn) {
    if (!this.isEnabled) return fn();

    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = end - start;

    if (duration > this.reflowThreshold) {
      console.warn(`${name} took ${duration.toFixed(2)}ms`);
    }

    return result;
  }

  // React hook for performance monitoring
  usePerformanceMonitor(componentName) {
    if (!this.isEnabled) return () => {};

    return (operationName, fn) => {
      return this.measurePerformance(`${componentName}.${operationName}`, fn);
    };
  }

  // Method to temporarily disable monitoring (useful for expected heavy operations)
  withDisabledMonitoring(fn) {
    const wasEnabled = this.isEnabled;
    this.isEnabled = false;
    try {
      return fn();
    } finally {
      this.isEnabled = wasEnabled;
    }
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// React hook for easy integration
export const usePerformanceMonitor = (componentName) => {
  return performanceMonitor.usePerformanceMonitor(componentName);
};

// Utility functions
export const measurePerformance = (name, fn) => {
  return performanceMonitor.measurePerformance(name, fn);
};

export const withDisabledMonitoring = (fn) => {
  return performanceMonitor.withDisabledMonitoring(fn);
};

export default performanceMonitor;
