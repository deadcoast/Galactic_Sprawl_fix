import { useCallback, useEffect, useState } from 'react';
import { errorLoggingService, ErrorType } from '../../services/ErrorLoggingService';

/**
 * Options for data fetching hook
 */
export interface DataFetchOptions {
  /** Whether to fetch immediately on mount */
  fetchOnMount?: boolean;
  /** Custom condition to trigger fetch */
  enabled?: boolean;
  /** Refetch interval in milliseconds */
  refetchInterval?: number;
  /** Maximum number of retries on error */
  maxRetries?: number;
  /** Whether to reset data when refetching */
  resetOnFetch?: boolean;
  /** Cache key for the request */
  cacheKey?: string;
  /** Cache time in milliseconds */
  cacheTime?: number;
}

/**
 * Return type for data fetching hook
 */
export interface DataFetchResult<T> {
  /** The fetched data */
  data: T | null;
  /** Whether data is currently being fetched */
  isLoading: boolean;
  /** unknown error that occurred during fetching */
  error: Error | null;
  /** (...args: unknown[]) => unknown to manually trigger a fetch */
  fetch: () => Promise<void>;
  /** (...args: unknown[]) => unknown to reset the hook state */
  reset: () => void;
  /** Last time data was fetched successfully */
  lastFetched: number | null;
  /** Number of retries attempted */
  retryCount: number;
}

/**
 * Creates a reusable data fetching hook with standardized loading, error, and data states
 * @param fetchFn The function that fetches data
 * @param defaultOptions Default options for the hook
 * @returns A React hook that manages data fetching
 */
export function createDataFetchHook<T, P extends unknown[] = []>(
  fetchFn: (...args: P) => Promise<T>,
  defaultOptions: DataFetchOptions = {}
) {
  return (...args: P): DataFetchResult<T> => {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(defaultOptions.fetchOnMount !== false);
    const [error, setError] = useState<Error | null>(null);
    const [lastFetched, setLastFetched] = useState<number | null>(null);
    const [retryCount, setRetryCount] = useState<number>(0);

    // Determine if fetch is enabled
    const enabled = defaultOptions.enabled !== false;

    // Memoized fetch function
    const fetch = useCallback(async () => {
      if (!enabled) return;

      try {
        if (defaultOptions.resetOnFetch) {
          setData(null);
        }

        setIsLoading(true);
        setError(null);

        const result = await fetchFn(...args);

        setData(result);
        setLastFetched(Date.now());
        setRetryCount(0);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));

        // Log error to the error service
        errorLoggingService.logError(
          err instanceof Error ? err : new Error(String(err)),
          ErrorType.NETWORK,
          undefined,
          { hook: 'dataFetch', args: JSON.stringify(args) }
        );

        // Retry logic
        if (defaultOptions.maxRetries && retryCount < defaultOptions.maxRetries) {
          setRetryCount(current => current + 1);

          // Exponential backoff
          const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 30000);

          setTimeout(() => {
            fetch();
          }, backoffTime);
        }
      } finally {
        setIsLoading(false);
      }
    }, [enabled, ...args]);

    // Reset function
    const reset = useCallback(() => {
      setData(null);
      setIsLoading(false);
      setError(null);
      setLastFetched(null);
      setRetryCount(0);
    }, []);

    // Handle automatic fetching on mount
    useEffect(() => {
      let mounted = true;
      let intervalId: NodeJS.Timeout | null = null;

      if (defaultOptions.fetchOnMount !== false && enabled) {
        fetch();
      }

      // Set up refetch interval if specified
      if (defaultOptions.refetchInterval && enabled) {
        intervalId = setInterval(() => {
          if (mounted) {
            fetch();
          }
        }, defaultOptions.refetchInterval);
      }

      return () => {
        mounted = false;
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }, [fetch, enabled]);

    return {
      data,
      isLoading,
      error,
      fetch,
      reset,
      lastFetched,
      retryCount,
    };
  };
}

/**
 * Example usage:
 *
 * ```typescript
 * // Define the hook
 * const useUserData = createDataFetchHook(
 *   (userId: string) => fetch(`/api/users/${userId}`).then(res => res.json()),
 *   { fetchOnMount: true }
 * );
 *
 * // Use in component
 * function UserProfile({ userId }) {
 *   const { data, isLoading, error, fetch } = useUserData(userId);
 *
 *   if (isLoading) return <Loading />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return (
 *     <div>
 *       <h1>{data?.name}</h1>
 *       <button onClick={fetch}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
