import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { loadingTracker } from '../api/loadingTracker';

export const LoadingContext = createContext({
  isLoading: false,
  loadingCount: 0,
  showLoader: () => {},
  hideLoader: () => {},
  resetLoader: () => {},
});

/**
 * LoadingProvider
 * Centralizes the application's loading state and subscribes to in-flight API requests.
 * Displays the loader immediately when any request starts, and maintains a brief smooth
 * minimum display window (e.g. 350ms) so quick local requests do not flicker or vanish before rendering.
 */
export function LoadingProvider({
  children,
  minDisplayTimeMs = 350,
  safetyTimeoutMs = 30000,
}) {
  const [loadingCount, setLoadingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Track the timestamp when loader was displayed
  const shownAtRef = useRef(0);
  const hideTimerRef = useRef(null);
  const safetyTimerRef = useRef(null);

  useEffect(() => {
    // Expose developer helpers in development for quick browser console verification
    if (typeof window !== 'undefined') {
      window.__showGlobalLoader = () => loadingTracker.startRequest();
      window.__hideGlobalLoader = () => loadingTracker.endRequest();
      window.__getGlobalLoadingCount = () => loadingTracker.getCount();
    }

    const unsubscribe = loadingTracker.subscribe((count) => {
      setLoadingCount(count);

      if (count > 0) {
        // Clear any pending dismissal timer
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }

        // Show immediately if not already visible
        setIsLoading((prev) => {
          if (!prev) {
            shownAtRef.current = Date.now();
            return true;
          }
          return prev;
        });

        // Safety watchdog: reset after 30s to prevent permanent freeze
        if (!safetyTimerRef.current) {
          safetyTimerRef.current = setTimeout(() => {
            console.warn('[LoadingProvider] 30s safety timeout triggered. Resetting loader.');
            loadingTracker.reset();
            setIsLoading(false);
            safetyTimerRef.current = null;
          }, safetyTimeoutMs);
        }
      } else {
        // Clear safety timer
        if (safetyTimerRef.current) {
          clearTimeout(safetyTimerRef.current);
          safetyTimerRef.current = null;
        }

        // Ensure loader stays visible for at least minDisplayTimeMs so fast requests
        // are clearly visible and do not flash in/out in a split millisecond
        const elapsed = Date.now() - shownAtRef.current;
        const remaining = Math.max(0, minDisplayTimeMs - elapsed);

        if (remaining > 0) {
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          hideTimerRef.current = setTimeout(() => {
            setIsLoading(false);
            hideTimerRef.current = null;
          }, remaining);
        } else {
          setIsLoading(false);
        }
      }
    });

    return () => {
      unsubscribe();
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, [minDisplayTimeMs, safetyTimeoutMs]);

  const showLoader = useCallback(() => {
    loadingTracker.startRequest();
  }, []);

  const hideLoader = useCallback(() => {
    loadingTracker.endRequest();
  }, []);

  const resetLoader = useCallback(() => {
    loadingTracker.reset();
  }, []);

  const value = useMemo(
    () => ({
      isLoading,
      loadingCount,
      showLoader,
      hideLoader,
      resetLoader,
    }),
    [isLoading, loadingCount, showLoader, hideLoader, resetLoader]
  );

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

export default LoadingContext;
