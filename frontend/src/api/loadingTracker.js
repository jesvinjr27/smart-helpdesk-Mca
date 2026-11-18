/**
 * loadingTracker.js
 * Centralized, decoupled pub/sub tracker for in-flight API requests.
 * Used by Axios interceptors in client.js and subscribed to by LoadingContext.
 */

class LoadingTracker {
  constructor() {
    this.activeRequests = 0;
    this.listeners = new Set();
  }

  /**
   * Subscribe to loading count changes
   * @param {Function} listener - Callback function receiving (activeRequests)
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    // Initial call
    try {
      listener(this.activeRequests);
    } catch (e) {
      console.error('[LoadingTracker] Error in initial listener execution:', e);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all registered subscribers
   */
  notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.activeRequests);
      } catch (e) {
        console.error('[LoadingTracker] Error notifying listener:', e);
      }
    });
  }

  /**
   * Increment active request counter
   * @param {Object} config - Axios request config
   */
  startRequest(config = {}) {
    if (config?.skipGlobalLoader || config?.headers?.['X-Skip-Global-Loader']) {
      return;
    }
    this.activeRequests++;
    this.notify();
  }

  /**
   * Decrement active request counter
   * @param {Object} config - Axios request config
   */
  endRequest(config = {}) {
    if (config?.skipGlobalLoader || config?.headers?.['X-Skip-Global-Loader']) {
      return;
    }
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    this.notify();
  }

  /**
   * Reset the active counter to 0 (useful for safety fallbacks and full resets)
   */
  reset() {
    this.activeRequests = 0;
    this.notify();
  }

  /**
   * Get current active request count
   * @returns {number}
   */
  getCount() {
    return this.activeRequests;
  }
}

export const loadingTracker = new LoadingTracker();
export default loadingTracker;
