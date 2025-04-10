/**
 * useSessionPerformance
 *
 * A React hook for tracking component performance and user interactions.
 * Provides access to the SessionPerformanceTracker for anonymous telemetry.
 */

import { useEffect, useRef } from 'react';
import {
  SessionPerformanceTracker,
  TelemetryOptions,
  UserInteractionData,
} from '../../services/telemetry/SessionPerformanceTracker';

// Create a singleton instance of the tracker to be shared across the application
let globalTracker: SessionPerformanceTracker | null = null;

/**
 * Initialize the global performance tracker
 */
export function initializeSessionPerformanceTracker(options?: Partial<TelemetryOptions>): void {
  if (!globalTracker) {
    globalTracker = new SessionPerformanceTracker(options);
  }
}

/**
 * React hook for tracking component performance
 */
export default function useSessionPerformance(componentId: string) {
  const trackerRef = useRef<SessionPerformanceTracker | null>(null);

  // Initialize the tracker on the first render
  useEffect(() => {
    // Create global instance if it doesn't exist yet
    if (!globalTracker) {
      initializeSessionPerformanceTracker();
    }

    trackerRef.current = globalTracker;

    // Start timing the component load
    if (trackerRef.current) {
      trackerRef.current.startComponentLoadTimer(componentId);
    }

    // When component mounts, record completion time
    const tracker = trackerRef.current;
    if (tracker) {
      // Use queueMicrotask to ensure we measure after initial render
      queueMicrotask(() => {
        tracker.endComponentLoadTimer(componentId);
      });
    }

    return () => {
      // Optionally track unmount time or other component lifecycle events
    };
  }, [componentId]);

  /**
   * Track a custom user interaction within the component
   */
  const trackInteraction = (
    interactionType: 'click' | 'hover' | 'scroll' | 'keypress' | 'custom',
    details: Partial<UserInteractionData> = {}
  ) => {
    if (!trackerRef.current) return;

    trackerRef.current.trackUserInteraction({
      interactionType,
      targetComponent: componentId,
      timestamp: Date.now(),
      responseTime: 0, // Will be populated with measured time
      successful: true,
      ...details,
    });
  };

  /**
   * Create a performance-tracked event handler
   */
  const withPerformanceTracking = <T extends (...args: unknown[]) => unknown>(
    handler: T,
    interactionType: 'click' | 'hover' | 'scroll' | 'keypress' | 'custom' = 'click'
  ): ((...args: Parameters<T>) => ReturnType<T>) => {
    return (...args: Parameters<T>) => {
      const startTime = performance.now();

      try {
        const result = handler(...args);

        // For promise-returning handlers, track completion when promise resolves
        if (result instanceof Promise) {
          result
            .then(() => {
              if (trackerRef.current) {
                trackerRef.current.trackUserInteraction({
                  interactionType,
                  targetComponent: componentId,
                  timestamp: Date.now(),
                  responseTime: performance.now() - startTime,
                  successful: true,
                });
              }
            })
            .catch(() => {
              if (trackerRef.current) {
                trackerRef.current.trackUserInteraction({
                  interactionType,
                  targetComponent: componentId,
                  timestamp: Date.now(),
                  responseTime: performance.now() - startTime,
                  successful: false,
                });
              }
            });
        } else {
          // For synchronous handlers, track completion immediately
          if (trackerRef.current) {
            trackerRef.current.trackUserInteraction({
              interactionType,
              targetComponent: componentId,
              timestamp: Date.now(),
              responseTime: performance.now() - startTime,
              successful: true,
            });
          }
        }

        return result;
      } catch (error) {
        // Track failed interactions
        if (trackerRef.current) {
          trackerRef.current.trackUserInteraction({
            interactionType,
            targetComponent: componentId,
            timestamp: Date.now(),
            responseTime: performance.now() - startTime,
            successful: false,
          });
        }
        throw error;
      }
    };
  };

  return {
    trackInteraction,
    withPerformanceTracking,
  };
}
