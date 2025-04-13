import { useEffect, useRef } from 'react';
import { ModuleEvent, moduleEventBus } from '../../lib/events/ModuleEventBus';
import { errorLoggingService, ErrorSeverity, ErrorType } from '../../services/ErrorLoggingService';
import { EventType } from '../../types/events/EventTypes';

/**
 * Options for component lifecycle management
 */
export interface ComponentLifecycleOptions {
  /**
   * Callback to execute when the component mounts
   */
  onMount?: () => void;

  /**
   * Callback to execute when the component unmounts
   */
  onUnmount?: () => void;

  /**
   * Array of event subscriptions
   */
  eventSubscriptions?: Array<{
    /**
     * Type of the event to subscribe to
     */
    eventType: EventType;

    /**
     * Handler function for the event
     */
    handler: (event: ModuleEvent) => void;
  }>;
}

/**
 * Hook that manages component lifecycle and event subscriptions
 *
 * This hook:
 * 1. Tracks component mount/unmount state
 * 2. Handles event subscriptions with proper cleanup
 * 3. Executes callbacks at appropriate lifecycle points
 *
 * @param options Component lifecycle options
 *
 * @example
 * function ResourceDisplay({ resourceType }) {
 *   const [amount, setAmount] = useState(0);
 *
 *   useComponentLifecycle({
 *     onMount: () => console.warn('ResourceDisplay mounted'),
 *     onUnmount: () => console.warn('ResourceDisplay unmounted'),
 *     eventSubscriptions: [
 *       {
 *         eventType: EventType.RESOURCE_PRODUCED,
 *         handler: (event) => {
 *           if (event?.data?.resourceType === resourceType) {
 *             setAmount(prev => prev + event?.data?.amount);
 *           }
 *         }
 *       }
 *     ]
 *   });
 *
 *   return <div>{amount}</div>;
 * }
 */
export function useComponentLifecycle(options: ComponentLifecycleOptions): void {
  // Track mount state of the component
  const isMounted = useRef<boolean>(false);

  // Set up lifecycle handling
  useEffect(() => {
    // Mark as mounted
    isMounted.current = true;

    // Call onMount callback if provided
    if (if (options?.onMount) {
          try {
            options?.onMount();
          } catch (error) {
            errorLoggingService.logError(
              error instanceof Error ? error : new Error('Error in onMount callback'),
              ErrorType.RUNTIME,
              ErrorSeverity.MEDIUM,
              { componentName: 'useComponentLifecycle', action: 'onMount' }
            );
          }
        }) ___
    else if (________) ___

    // Set up event subscriptions
    const unsubscribers: Array<() => void> = [];

    if (options?.eventSubscriptions) {
      options?.eventSubscriptions.forEach(subscription => {
        // Subscribe to the event
        const unsubscribe = moduleEventBus.subscribe(subscription.eventType, event => {
          // Only call handler if component is still mounted
          if (isMounted.current) {
            try {
              subscription.handler(event);
            } catch (error) {
              errorLoggingService.logError(
                error instanceof Error
                  ? error
                  : new Error(`Error handling event ${subscription.eventType}`),
                ErrorType.EVENT_HANDLING,
                ErrorSeverity.MEDIUM,
                {
                  componentName: 'useComponentLifecycle',
                  action: 'eventHandler',
                  eventType: subscription.eventType,
                }
              );
            }
          }
        });

        // Store unsubscriber for cleanup
        unsubscribers.push(unsubscribe);
      });
    }

    // Clean up on unmount
    return () => {
      // Mark as unmounted
      isMounted.current = false;

      // Call onUnmount callback if provided
      if (options?.onUnmount) {
        try {
          options?.onUnmount();
        } catch (error) {
          errorLoggingService.logError(
            error instanceof Error ? error : new Error('Error in onUnmount callback'),
            ErrorType.RUNTIME,
            ErrorSeverity.MEDIUM,
            { componentName: 'useComponentLifecycle', action: 'onUnmount' }
          );
        }
      }

      // Unsubscribe from all events
      unsubscribers.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          errorLoggingService.logError(
            error instanceof Error ? error : new Error('Error during event unsubscription'),
            ErrorType.EVENT_HANDLING,
            ErrorSeverity.LOW,
            { componentName: 'useComponentLifecycle', action: 'cleanup (unsubscription)' }
          );
        }
      });
    };
  }, []); // Empty dependency array ensures this only runs once on mount
}

/**
 * Hook that creates a safe reference to a function that gets updated each render
 * but ensures the identity stays the same to prevent unnecessary effect triggers
 *
 * @param callback The function to wrap
 * @returns A stable function reference that calls the latest callback
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(callback: T): T {
  // Store the current callback in a ref
  const callbackRef = useRef<T>(callback);

  // Update the ref whenever the callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Create a stable function that calls the current callback
  return useRef<T>(((...args: unknown[]) => {
    return callbackRef.current(...args);
  }) as T).current;
}

/**
 * Hook that manages component lifecycle with auto-dependency tracking
 *
 * This hook automatically updates subscriptions when dependencies change,
 * which is useful for dynamic event handlers.
 *
 * @param options Component lifecycle options object with dynamic handlers
 * @param deps Dependencies array that triggers subscription updates
 *
 * @example
 * function ResourceDisplay({ resourceType }) {
 *   const [amount, setAmount] = useState(0);
 *
 *   useDynamicComponentLifecycle({
 *     eventSubscriptions: [
 *       {
 *         eventType: EventType.RESOURCE_PRODUCED,
 *         handler: (event) => {
 *           if (event?.data?.resourceType === resourceType) {
 *             setAmount(prev => prev + event?.data?.amount);
 *           }
 *         }
 *       }
 *     ]
 *   }, [resourceType]);
 *
 *   return <div>{amount}</div>;
 * }
 */
export function useDynamicComponentLifecycle(
  options: ComponentLifecycleOptions,
  deps: React.DependencyList
): void {
  // Track mount state of the component
  const isMounted = useRef<boolean>(false);

  // Set up lifecycle handling with dependency tracking
  useEffect(() => {
    // Already mounted? Just update subscriptions
    if (!isMounted.current) {
      // Mark as mounted
      isMounted.current = true;

      // Call onMount callback if provided
      if (options?.onMount) {
        try {
          options?.onMount();
        } catch (error) {
          errorLoggingService.logError(
            error instanceof Error ? error : new Error('Error in onMount callback'),
            ErrorType.RUNTIME,
            ErrorSeverity.MEDIUM,
            { componentName: 'useDynamicComponentLifecycle', action: 'onMount' }
          );
        }
      }
    }

    // Set up event subscriptions
    const unsubscribers: Array<() => void> = [];

    if (options?.eventSubscriptions) {
      options?.eventSubscriptions.forEach(subscription => {
        // Subscribe to the event
        const unsubscribe = moduleEventBus.subscribe(subscription.eventType, event => {
          // Only call handler if component is still mounted
          if (isMounted.current) {
            try {
              subscription.handler(event);
            } catch (error) {
              errorLoggingService.logError(
                error instanceof Error
                  ? error
                  : new Error(`Error handling event ${subscription.eventType}`),
                ErrorType.EVENT_HANDLING,
                ErrorSeverity.MEDIUM,
                {
                  componentName: 'useDynamicComponentLifecycle',
                  action: 'eventHandler',
                  eventType: subscription.eventType,
                }
              );
            }
          }
        });

        // Store unsubscriber for cleanup
        unsubscribers.push(unsubscribe);
      });
    }

    // Clean up subscriptions when dependencies change or component unmounts
    return () => {
      // Only run unmount logic if actually unmounting
      if (deps === undefined) {
        // Mark as unmounted
        isMounted.current = false;

        // Call onUnmount callback if provided
        if (options?.onUnmount) {
          try {
            options?.onUnmount();
          } catch (error) {
            errorLoggingService.logError(
              error instanceof Error ? error : new Error('Error in onUnmount callback'),
              ErrorType.RUNTIME,
              ErrorSeverity.MEDIUM,
              { componentName: 'useDynamicComponentLifecycle', action: 'onUnmount' }
            );
          }
        }
      }

      // Unsubscribe from all events
      unsubscribers.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          errorLoggingService.logError(
            error instanceof Error ? error : new Error('Error during event unsubscription'),
            ErrorType.EVENT_HANDLING,
            ErrorSeverity.LOW,
            { componentName: 'useDynamicComponentLifecycle', action: 'cleanup (unsubscription)' }
          );
        }
      });
    };
  }, deps); // Re-run when dependencies change
}
