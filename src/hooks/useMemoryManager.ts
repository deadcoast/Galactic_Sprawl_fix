import { useEffect, useRef, useState } from 'react';

/**
 * Options for the memory manager hook
 */
export interface MemoryManagerOptions {
  /**
   * The key to use for identifying this instance in logs and metrics
   */
  key: string;

  /**
   * Initial data size estimation in bytes
   * (if not provided, it will be estimated)
   */
  initialDataSizeEstimate?: number;

  /**
   * Whether to log memory usage statistics to console
   */
  enableLogging?: boolean;

  /**
   * Maximum memory size (in bytes) before triggering cleanup recommendations
   */
  memoryThreshold?: number;

  /**
   * Auto cleanup level, controlling aggressiveness of cleanup
   * - none: No automatic cleanup
   * - low: Cleanup only very large datasets when component is hidden
   * - medium: Cleanup large datasets when component is hidden and unused
   * - high: Aggressive cleanup of all data when not in view
   */
  autoCleanupLevel?: 'none' | 'low' | 'medium' | 'high';

  /**
   * Time in milliseconds for cache expiration
   */
  cacheExpirationTime?: number;
}

/**
 * Return type for the memory manager hook
 */
export interface MemoryManagerResult<T> {
  /**
   * Current memory usage estimation in bytes
   */
  memoryUsage: number;

  /**
   * Whether the memory usage is above the threshold
   */
  isAboveThreshold: boolean;

  /**
   * (...args: unknown[]) => unknown to manually trigger cleanup
   */
  cleanup: () => void;

  /**
   * (...args: unknown[]) => unknown to update the tracked data
   */
  updateData: (newData: T | null) => void;

  /**
   * (...args: unknown[]) => unknown to get cached data
   */
  getCachedData: (key: string) => unknown;

  /**
   * (...args: unknown[]) => unknown to cache data with expiration
   */
  cacheData: (key: string, data: unknown, expiresInMs?: number) => void;

  /**
   * Clear a specific cache entry
   */
  clearCacheEntry: (key: string) => void;

  /**
   * Clear all cache entries
   */
  clearAllCache: () => void;

  /**
   * Whether data is currently loaded in memory
   */
  isDataLoaded: boolean;
}

/**
 * Rough size estimation for JavaScript objects
 */
function estimateObjectSize(object: unknown): number {
  if (object === null || object === undefined) return 0;

  // Handle primitive types
  if (typeof object !== 'object') {
    // Strings - each character is 2 bytes in JavaScript
    if (typeof object === 'string') return object.length * 2;
    // Numbers - 8 bytes for number type
    if (typeof object === 'number') return 8;
    // Boolean - 4 bytes
    if (typeof object === 'boolean') return 4;
    return 0;
  }

  // Handle arrays
  if (Array.isArray(object)) {
    let size = 0;
    // Add sample-based estimation for large arrays to avoid performance issues
    if (object.length > 1000) {
      // Sample first 100 elements
      const sampleSize = 100;
      let sampleTotal = 0;
      for (let i = 0; i < sampleSize; i++) {
        sampleTotal += estimateObjectSize(object[i]);
      }
      // Estimate total based on average
      size = (sampleTotal / sampleSize) * object.length;
    } else {
      // For smaller arrays, calculate all elements
      for (let i = 0; i < object.length; i++) {
        size += estimateObjectSize(object[i]);
      }
    }
    return size;
  }

  // Handle regular objects
  let size = 0;
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      // Size of property name
      size += key.length * 2;
      // Size of property value
      size += estimateObjectSize(object[key as keyof typeof object]);
    }
  }

  return size;
}

/**
 * Cache item with expiration
 */
interface CacheItem {
  data: unknown;
  expiry: number | null; // null means no expiration
}

/**
 * Hook for managing memory in components with large datasets
 *
 * This hook helps track memory usage, provides caching with expiration,
 * and helps with cleanup to prevent memory leaks.
 */
export function useMemoryManager<T>(
  initialData: T | null = null,
  options: MemoryManagerOptions
): MemoryManagerResult<T> {
  // Default options
  const {
    key,
    initialDataSizeEstimate,
    enableLogging = false,
    memoryThreshold = 50 * 1024 * 1024, // 50MB default threshold
    autoCleanupLevel = 'medium',
    cacheExpirationTime = 5 * 60 * 1000, // 5 minutes by default
  } = options;

  // Store the current data
  const dataRef = useRef<T | null>(initialData);

  // Store memory usage estimation
  const [memoryUsage, setMemoryUsage] = useState<number>(
    initialDataSizeEstimate || estimateObjectSize(initialData)
  );

  // Track if memory is above threshold
  const [isAboveThreshold, setIsAboveThreshold] = useState<boolean>(memoryUsage > memoryThreshold);

  // Track if data is currently loaded
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(!!initialData);

  // Cache storage
  const cacheRef = useRef<Map<string, CacheItem>>(new Map());

  // Visibility tracking
  const isVisibleRef = useRef<boolean>(true);

  // Track last user interaction with the component
  const lastInteractionRef = useRef<number>(Date.now());

  // Update memory usage estimation
  const updateMemoryUsage = () => {
    const estimatedSize = estimateObjectSize(dataRef.current);
    setMemoryUsage(estimatedSize);
    setIsAboveThreshold(estimatedSize > memoryThreshold);

    if (enableLogging) {
      console.warn(
        `[MemoryManager:${key}] Memory usage: ${(estimatedSize / 1024 / 1024).toFixed(2)}MB`
      );
    }

    return estimatedSize;
  };

  // Update tracked data
  const updateData = (newData: T | null) => {
    dataRef.current = newData;
    setIsDataLoaded(!!newData);

    // Track interaction
    lastInteractionRef.current = Date.now();

    // Update memory usage
    updateMemoryUsage();
  };

  // Cache data with expiration
  const cacheData = (
    cacheKey: string,
    data: unknown,
    expiresInMs: number = cacheExpirationTime
  ) => {
    const expiry = expiresInMs ? Date.now() + expiresInMs : null;
    cacheRef.current.set(cacheKey, { data, expiry });

    if (enableLogging) {
      console.warn(
        `[MemoryManager:${key}] Cached data: ${cacheKey}, expires: ${expiry ? new Date(expiry).toLocaleString() : 'never'}`
      );
    }
  };

  // Get cached data
  const getCachedData = (cacheKey: string): unknown => {
    const item = cacheRef.current.get(cacheKey);

    if (!item) return null;

    // Check if item has expired
    if (item?.expiry && Date.now() > item?.expiry) {
      cacheRef.current.delete(cacheKey);
      if (enableLogging) {
        console.warn(`[MemoryManager:${key}] Cache expired: ${cacheKey}`);
      }
      return null;
    }

    // Track interaction
    lastInteractionRef.current = Date.now();

    return item?.data;
  };

  // Clear a specific cache entry
  const clearCacheEntry = (cacheKey: string) => {
    cacheRef.current.delete(cacheKey);
    if (enableLogging) {
      console.warn(`[MemoryManager:${key}] Cache cleared: ${cacheKey}`);
    }
  };

  // Clear all cache entries
  const clearAllCache = () => {
    cacheRef.current.clear();
    if (enableLogging) {
      console.warn(`[MemoryManager:${key}] All cache cleared`);
    }
  };

  // (...args: unknown[]) => unknown to clean up data
  const cleanup = () => {
    // Clear the data reference
    dataRef.current = null;
    setIsDataLoaded(false);

    // Clear expired cache entries
    const now = Date.now();
    for (const [cacheKey, item] of cacheRef.current.entries()) {
      if (item?.expiry && now > item?.expiry) {
        cacheRef.current.delete(cacheKey);
      }
    }

    // Update memory usage
    const newUsage = updateMemoryUsage();

    if (enableLogging) {
      console.warn(
        `[MemoryManager:${key}] Cleanup performed. New memory usage: ${(newUsage / 1024 / 1024).toFixed(2)}MB`
      );
    }
  };

  // Set up visibility observer
  useEffect(() => {
    // Skip if autoCleanupLevel is none
    if (autoCleanupLevel === 'none') return;

    // Use IntersectionObserver to track visibility
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          isVisibleRef.current = entry.isIntersecting;

          // Perform cleanup when element goes out of view
          if (!entry.isIntersecting) {
            const timeSinceLastInteraction = Date.now() - lastInteractionRef.current;

            // Different cleanup strategies based on level
            if (
              autoCleanupLevel === 'high' ||
              (autoCleanupLevel === 'medium' && timeSinceLastInteraction > 60000) || // 1 minute
              (autoCleanupLevel === 'low' && timeSinceLastInteraction > 300000) // 5 minutes
            ) {
              if (enableLogging) {
                console.warn(`[MemoryManager:${key}] Auto cleanup triggered (${autoCleanupLevel})`);
              }
              cleanup();
            }
          }
        });
      },
      { threshold: 0.1 } // 10% visibility threshold
    );

    // We need to find the parent element to observe
    // This assumes the component using this hook has an element with a specific data attribute
    const element = document.querySelector(`[data-memory-manager="${key}"]`);

    if (element) {
      observer.observe(element);
    } else if (enableLogging) {
      console.warn(`[MemoryManager:${key}] No element found with data-memory-manager="${key}"`);
    }

    // Cleanup function for the effect
    return () => {
      observer.disconnect();
      cleanup();
    };
  }, [key, autoCleanupLevel, enableLogging]);

  // Regular cache cleanup interval
  useEffect(() => {
    // Clean up expired cache items every minute
    const interval = setInterval(() => {
      const now = Date.now();
      let removedCount = 0;

      for (const [cacheKey, item] of cacheRef.current.entries()) {
        if (item?.expiry && now > item?.expiry) {
          cacheRef.current.delete(cacheKey);
          removedCount++;
        }
      }

      if (removedCount > 0 && enableLogging) {
        console.warn(`[MemoryManager:${key}] Auto-cleared ${removedCount} expired cache items`);
      }
    }, 60000); // 1 minute interval

    return () => clearInterval(interval);
  }, [key, enableLogging]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (enableLogging) {
        console.warn(`[MemoryManager:${key}] Component unmounted, cleaning up resources`);
      }

      // Clear all data and cache
      dataRef.current = null;
      cacheRef.current.clear();
    };
  }, [key, enableLogging]);

  return {
    memoryUsage,
    isAboveThreshold,
    cleanup,
    updateData,
    getCachedData,
    cacheData,
    clearCacheEntry,
    clearAllCache,
    isDataLoaded,
  };
}

export default useMemoryManager;
