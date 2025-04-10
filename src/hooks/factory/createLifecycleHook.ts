import { useCallback, useEffect, useRef, useState } from 'react';
import { errorLoggingService, ErrorSeverity, ErrorType } from '../../services/ErrorLoggingService';

/**
 * Component lifecycle phases
 */
export enum LifecyclePhase {
  MOUNT = 'mount',
  UPDATE = 'update',
  UNMOUNT = 'unmount',
  IDLE = 'idle',
  ERROR = 'error',
}

/**
 * Options for lifecycle hook
 */
export interface LifecycleOptions<TProps> {
  /** Function to run when component mounts */
  onMount?: (props: TProps) => void | Promise<void>;
  /** Function to run when component updates */
  onUpdate?: (prevProps: TProps, nextProps: TProps) => void | Promise<void>;
  /** Function to run when component unmounts */
  onUnmount?: (props: TProps) => void | Promise<void>;
  /** Function to run when an error occurs */
  onError?: (error: Error, phase: LifecyclePhase, props: TProps) => void | Promise<void>;
  /** Dependencies that should trigger the update method */
  updateDependencies?: (props: TProps) => unknown[];
  /** Whether to track render times */
  trackPerformance?: boolean;
  /** Performance reporting threshold in ms */
  performanceThreshold?: number;
}

/**
 * Return type for lifecycle hook
 */
export interface LifecycleResult {
  /** The current lifecycle phase */
  phase: LifecyclePhase;
  /** Last error that occurred */
  error: Error | null;
  /** Performance metrics for the component */
  performance: {
    /** Time spent in the last mount phase in ms */
    mountTime: number | null;
    /** Time spent in the last update phase in ms */
    updateTime: number | null;
    /** Last render time in ms */
    lastRenderTime: number | null;
    /** Average render time in ms */
    averageRenderTime: number | null;
    /** Number of renders */
    renderCount: number;
  };
  /** Function to manually report an error */
  reportError: (error: Error) => void;
}

/**
 * Creates a reusable component lifecycle hook
 * @param options Lifecycle options
 * @returns A hook that manages component lifecycle
 */
export function createLifecycleHook<TProps = Record<string, unknown>>(
  options: LifecycleOptions<TProps>
) {
  return (props: TProps): LifecycleResult => {
    // Current lifecycle phase
    const [phase, setPhase] = useState<LifecyclePhase>(LifecyclePhase.MOUNT);
    const [error, setError] = useState<Error | null>(null);

    // Performance tracking
    const performanceRef = useRef({
      mountTime: null as number | null,
      updateTime: null as number | null,
      lastRenderTime: null as number | null,
      averageRenderTime: null as number | null,
      renderCount: 0,
      renderStart: 0,
      totalRenderTime: 0,
    });

    // Previous props for comparison in onUpdate
    const prevPropsRef = useRef<TProps>(props);

    // Track component mounting
    const isMountedRef = useRef(false);

    // Helper to track performance if enabled
    const trackRenderPerformance = useCallback(() => {
      if (!options?.trackPerformance) {
        return;
      }

      const now = performance.now();
      const perf = performanceRef.current;

      // If renderStart is set, this is the end of a render
      if (perf.renderStart > 0) {
        const renderTime = now - perf.renderStart;
        perf.lastRenderTime = renderTime;
        perf.renderCount++;
        perf.totalRenderTime += renderTime;
        perf.averageRenderTime = perf.totalRenderTime / perf.renderCount;

        // Report slow renders
        if (options?.performanceThreshold && renderTime > options?.performanceThreshold) {
          console.warn(
            `Slow render detected: ${renderTime.toFixed(2)}ms in component using lifecycle hook`
          );
        }

        // Reset render start
        perf.renderStart = 0;
      } else {
        // Start of render
        perf.renderStart = now;
      }
    }, [options?.trackPerformance, options?.performanceThreshold]);

    // Error reporting function
    const reportError = useCallback(
      (err: Error) => {
        setError(err);
        setPhase(LifecyclePhase.ERROR);

        // Log to error service
        errorLoggingService.logError(err, ErrorType.RUNTIME, undefined, {
          componentHook: 'lifecycle',
          phase,
        });

        // Call onError handler if provided
        if (options?.onError) {
          try {
            options?.onError(err, phase, props);
          } catch (handlerError) {
            errorLoggingService.logError(
              handlerError instanceof Error ? handlerError : new Error('Error in lifecycle onError handler'),
              ErrorType.EVENT_HANDLING,
              ErrorSeverity.HIGH,
              { componentName: 'createLifecycleHook', action: 'reportError (onError handler)', originalError: err.message }
            );
          }
        }
      },
      [phase, props, options?.onError]
    );

    // Helper to safely execute lifecycle methods
    const safeExecute = useCallback(
      async (
        fn:
          | ((props: TProps) => void | Promise<void>)
          | ((prevProps: TProps, nextProps: TProps) => void | Promise<void>)
          | undefined,
        phase: LifecyclePhase,
        ...args: TProps[]
      ) => {
        if (!fn) {
          return;
        }

        const startTime = options?.trackPerformance ? performance.now() : 0;

        try {
          await (fn as (...params: TProps[]) => void | Promise<void>)(...args);

          // Track performance for specific phases
          if (options?.trackPerformance) {
            const elapsedTime = performance.now() - startTime;
            if (phase === LifecyclePhase.MOUNT) {
              performanceRef.current.mountTime = elapsedTime;
            } else if (phase === LifecyclePhase.UPDATE) {
              performanceRef.current.updateTime = elapsedTime;
            }
          }
        } catch (err) {
          // Report error
          reportError(err instanceof Error ? err : new Error(String(err)));
        }
      },
      [options?.trackPerformance, reportError]
    );

    // Handle mount
    useEffect(() => {
      trackRenderPerformance();

      // Set as mounted
      isMountedRef.current = true;

      // Execute mount lifecycle
      safeExecute(options?.onMount, LifecyclePhase.MOUNT, props);

      // Set phase to idle after mount
      setPhase(LifecyclePhase.IDLE);

      // Handle unmount
      return () => {
        isMountedRef.current = false;
        setPhase(LifecyclePhase.UNMOUNT);

        // Execute unmount lifecycle
        safeExecute(options?.onUnmount, LifecyclePhase.UNMOUNT, props);
      };
    }, []);

    // Handle updates based on dependencies
    useEffect(
      () => {
        // Skip first run (mount)
        if (!isMountedRef.current) {
          return;
        }

        trackRenderPerformance();

        // Skip if no update handler
        if (!options?.onUpdate) {
          return;
        }

        // Set phase to update
        setPhase(LifecyclePhase.UPDATE);

        // Execute update lifecycle
        safeExecute(
          options?.onUpdate as (prevProps: TProps, nextProps: TProps) => void | Promise<void>,
          LifecyclePhase.UPDATE,
          prevPropsRef.current,
          props
        );

        // Set phase back to idle after update
        setPhase(LifecyclePhase.IDLE);

        // Store current props as previous for next update
        prevPropsRef.current = props;
      },
      options?.updateDependencies ? options?.updateDependencies(props) : [props]
    );

    // Record render end
    useEffect(() => {
      trackRenderPerformance();
    });

    return {
      phase,
      error,
      performance: {
        mountTime: performanceRef.current.mountTime,
        updateTime: performanceRef.current.updateTime,
        lastRenderTime: performanceRef.current.lastRenderTime,
        averageRenderTime: performanceRef.current.averageRenderTime,
        renderCount: performanceRef.current.renderCount,
      },
      reportError,
    };
  };
}

/**
 * Example usage:
 *
 * ```typescript
 * // Define the lifecycle hook
 * const useUserProfileLifecycle = createLifecycleHook<UserProfileProps>({
 *   onMount: (props) => {
 *     console.warn('UserProfile mounted with ID:', props?.userId);
 *     // Fetch data or set up subscriptions
 *   },
 *   onUpdate: (prevProps, nextProps) => {
 *     if (prevProps.userId !== nextProps.userId) {
 *       console.warn('UserProfile updated with new ID:', nextProps.userId);
 *       // Refetch data with new ID
 *     }
 *   },
 *   onUnmount: (props) => {
 *     console.warn('UserProfile unmounting, cleanup for ID:', props?.userId);
 *     // Clean up subscriptions or timers
 *   },
 *   updateDependencies: (props) => [props?.userId],
 *   trackPerformance: true,
 *   performanceThreshold: 100
 * });
 *
 * // Use in component
 * function UserProfile({ userId, name }: UserProfileProps) {
 *   const { phase, error, performance, reportError } = useUserProfileLifecycle({ userId, name });
 *
 *   // Use lifecycle info in the component
 *   if (phase === LifecyclePhase.ERROR) {
 *     return <div>Error: {error?.message}</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <h1>{name} (ID: {userId})</h1>
 *       {process.env.NODE_ENV === 'development' && (
 *         <div className="debug">
 *           <p>Phase: {phase}</p>
 *           <p>Render count: {performance.renderCount}</p>
 *           <p>Avg render time: {performance.averageRenderTime?.toFixed(2)} ms</p>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
