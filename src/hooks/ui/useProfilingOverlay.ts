import { useCallback, useEffect, useState } from 'react';
import { errorLoggingService, ErrorSeverity, ErrorType } from '../../services/ErrorLoggingService';
import { applicationProfiler } from '../../utils/profiling/applicationProfiler';

interface ProfilingOverlayOptions {
  /**
   * Keyboard shortcut to toggle the overlay
   * @default 'p'
   */
  toggleKey?: string;

  /**
   * Whether to enable the overlay by default
   * @default false
   */
  enabledByDefault?: boolean;

  /**
   * Whether to auto-start profiling when the overlay is shown
   * @default true
   */
  autoStartProfiling?: boolean;

  /**
   * Whether to persist the overlay state in localStorage
   * @default true
   */
  persistState?: boolean;

  /**
   * Whether to show the overlay in production
   * @default false
   */
  enableInProduction?: boolean;
}

/**
 * Hook for controlling the profiling overlay
 *
 * @param options Profiling overlay options
 * @returns An object with methods to control the profiling overlay
 */
export function useProfilingOverlay(options: ProfilingOverlayOptions = {}) {
  const {
    toggleKey = 'p',
    enabledByDefault = false,
    autoStartProfiling = true,
    persistState = true,
    enableInProduction = false,
  } = options;

  // Check if we're in production
  const isProduction = process.env.NODE_ENV === 'production';

  // Get initial state from localStorage if available
  const getInitialState = () => {
    if (persistState) {
      try {
        const savedState = localStorage.getItem('profiling-overlay-visible');
        if (savedState !== null) {
          return savedState === 'true';
        }
      } catch (error) {
        errorLoggingService.logError(
          error instanceof Error
            ? error
            : new Error('Error reading profiling overlay state from localStorage'),
          ErrorType.INITIALIZATION,
          ErrorSeverity.LOW,
          { componentName: 'useProfilingOverlay', action: 'getInitialState' }
        );
      }
    }
    return enabledByDefault;
  };

  // State for overlay visibility
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    // Don't show in production unless explicitly enabled
    if (isProduction && !enableInProduction) {
      return false;
    }
    return getInitialState();
  });

  // Toggle overlay visibility
  const toggleOverlay = useCallback(() => {
    setIsVisible(prev => {
      const newState = !prev;

      // Save state to localStorage
      if (persistState) {
        try {
          localStorage.setItem('profiling-overlay-visible', String(newState));
        } catch (error) {
          errorLoggingService.logError(
            error instanceof Error
              ? error
              : new Error('Error saving profiling overlay state to localStorage'),
            ErrorType.RUNTIME,
            ErrorSeverity.LOW,
            { componentName: 'useProfilingOverlay', action: 'toggleOverlay (persistence)' }
          );
        }
      }

      return newState;
    });
  }, [persistState]);

  // Show overlay
  const showOverlay = useCallback(() => {
    if (!isVisible) {
      toggleOverlay();
    }
  }, [isVisible, toggleOverlay]);

  // Hide overlay
  const hideOverlay = useCallback(() => {
    if (isVisible) {
      toggleOverlay();
    }
  }, [isVisible, toggleOverlay]);

  // Handle keyboard shortcut
  useEffect(() => {
    // Don't enable keyboard shortcut in production unless explicitly enabled
    if (isProduction && !enableInProduction) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Alt+Shift+toggleKey is pressed
      if (
        event?.altKey &&
        event?.shiftKey &&
        event?.key.toLowerCase() === toggleKey.toLowerCase()
      ) {
        toggleOverlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleOverlay, toggleKey, isProduction, enableInProduction]);

  // Start profiling if overlay is visible and autoStartProfiling is true
  useEffect(() => {
    if (isVisible && autoStartProfiling && !applicationProfiler.isActive()) {
      applicationProfiler.start();
    }
  }, [isVisible, autoStartProfiling]);

  return {
    isVisible,
    toggleOverlay,
    showOverlay,
    hideOverlay,
    startProfiling: applicationProfiler.start,
    stopProfiling: applicationProfiler.stop,
    resetProfiling: applicationProfiler.resetAll,
    getMetrics: applicationProfiler.getMetrics,
  };
}
