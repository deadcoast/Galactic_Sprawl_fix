/**
 * Advanced D3 Interpolation Caching System
 *
 * This module provides sophisticated caching mechanisms for D3 interpolators,
 * improving performance by reusing calculated interpolation values.
 * Features include:
 * - LRU cache eviction
 * - Customizable cache size and resolution
 * - Performance stats tracking
 * - Support for various interpolator types (number, color, object, array)
 */

import * as d3 from 'd3';
import { errorLoggingService } from '../../services/logging/ErrorLoggingService';
import { ErrorSeverity, ErrorType } from '../../services/logging/ErrorTypes';
import { logger } from '../../services/logging/loggerService';
import { TypedInterpolator, typedInterpolators } from '../../types/visualizations/D3AnimationTypes';
import { animationFrameManager } from './D3AnimationFrameManager';

/**
 * Configuration options for the interpolation cache.
 */
export interface InterpolationCacheConfig {
  /** Maximum number of entries to cache */
  maxCacheSize?: number;
  /** Time-to-live for cached values in milliseconds */
  cacheTTL?: number;
  /** Whether to use a least-recently-used eviction policy */
  useLRU?: boolean;
  /** Resolution for numeric input rounding (smaller numbers = more precision) */
  resolution?: number;
  /** Whether to enable cache statistics */
  trackStats?: boolean;
  /** Whether to profile performance impact */
  profilePerformance?: boolean;
}

/**
 * Cache statistics for performance monitoring
 */
export interface CacheStats {
  /** Total number of cache lookups */
  lookups: number;
  /** Number of cache hits */
  hits: number;
  /** Number of cache misses */
  misses: number;
  /** Hit rate as a percentage */
  hitRate: number;
  /** Number of cached entries */
  entryCount: number;
  /** Average time saved per lookup in milliseconds */
  avgTimeSaved: number;
  /** Total time saved in milliseconds */
  totalTimeSaved: number;
  /** Number of cache evictions */
  evictions: number;
  /** Memory usage estimation in bytes */
  estimatedMemoryUsage: number;
}

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  /** Cached value */
  value: T;
  /** When the entry was last accessed */
  lastAccessed: number;
  /** When the entry was created */
  created: number;
  /** Size estimation in bytes */
  size: number;
  /** Time taken to compute the value in ms */
  computeTime: number;
}

/**
 * Validates that the provided config contains valid values
 *
 * @param config The configuration to validate
 * @returns True if the config is valid, false otherwise
 */
function isValidCacheConfig(config: unknown): config is InterpolationCacheConfig {
  if (!config || typeof config !== 'object') {
    return false;
  }

  const typedConfig = config as Record<string, unknown>;

  // Check each property has the right type if provided
  if (typedConfig.maxCacheSize !== undefined && typeof typedConfig.maxCacheSize !== 'number') {
    return false;
  }
  if (typedConfig.cacheTTL !== undefined && typeof typedConfig.cacheTTL !== 'number') {
    return false;
  }
  if (typedConfig.useLRU !== undefined && typeof typedConfig.useLRU !== 'boolean') {
    return false;
  }
  if (typedConfig.resolution !== undefined && typeof typedConfig.resolution !== 'number') {
    return false;
  }
  if (typedConfig.trackStats !== undefined && typeof typedConfig.trackStats !== 'boolean') {
    return false;
  }
  if (
    typedConfig.profilePerformance !== undefined &&
    typeof typedConfig.profilePerformance !== 'boolean'
  ) {
    return false;
  }

  return true;
}

/**
 * Base memoization cache for unknown interpolation function
 */
export class InterpolationCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private stats: CacheStats = {
    lookups: 0,
    hits: 0,
    misses: 0,
    hitRate: 0,
    entryCount: 0,
    avgTimeSaved: 0,
    totalTimeSaved: 0,
    evictions: 0,
    estimatedMemoryUsage: 0,
  };

  /**
   * Create a new interpolation cache
   *
   * @param config Optional configuration settings for the cache
   * @throws Error if the configuration is invalid
   */
  constructor(private config: InterpolationCacheConfig = {}) {
    try {
      if (!isValidCacheConfig(config)) {
        throw new Error('Invalid cache configuration provided');
      }

      const {
        maxCacheSize = 5000,
        cacheTTL = 30000, // 30 seconds
        useLRU = true,
        resolution = 0.001,
        trackStats = true,
        profilePerformance = true,
      } = config;

      this.config = {
        maxCacheSize,
        cacheTTL,
        useLRU,
        resolution,
        trackStats,
        profilePerformance,
      };
    } catch (error) {
      errorLoggingService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorType.INITIALIZATION,
        ErrorSeverity.MEDIUM,
        {
          component: 'InterpolationCache',
          config,
        }
      );
      // Use sensible defaults even when error occurs
      this.config = {
        maxCacheSize: 5000,
        cacheTTL: 30000,
        useLRU: true,
        resolution: 0.001,
        trackStats: true,
        profilePerformance: true,
      };
    }
  }

  /**
   * Generate a cache key for the input parameters
   */
  private generateKey(t: number): string {
    // Round to the configured resolution to avoid excessive unique values
    const roundedT = Math.round(t / this.config.resolution!) * this.config.resolution!;
    return roundedT.toString();
  }

  /**
   * Estimate the size of a value in bytes
   */
  private estimateSize(value: T): number {
    if (typeof value === 'number') {
      return 8; // 8 bytes for a number
    } else if (typeof value === 'string') {
      return value.length * 2; // Approximate 2 bytes per character
    } else if (typeof value === 'boolean') {
      return 4;
    } else if (value === null || value === undefined) {
      return 0;
    } else if (Array.isArray(value)) {
      return (value as unknown[]).reduce(
        (size: number, item) => size + this.estimateSize(item as T),
        0
      );
    } else if (typeof value === 'object') {
      let estimatedSize = 0;
      const valueAsRecord = value as Record<string, unknown>;
      for (const key in valueAsRecord) {
        if (Object.prototype.hasOwnProperty.call(valueAsRecord, key)) {
          const propValue = valueAsRecord[key];
          // Add size of the key
          estimatedSize += key.length * 2;
          // Add size of the value (with type safety)
          estimatedSize += this.estimateSize(propValue as T);
        }
      }
      return estimatedSize;
    }
    return 16; // Default estimation for unknown types
  }

  /**
   * Memoize an interpolation function
   *
   * @param interpolator Original interpolator function
   * @returns Memoized interpolator function
   * @example
   * ```typescript
   * // Create a simple number interpolator
   * const rawInterpolator = (t: number) => t * 100;
   * const cache = new InterpolationCache<number>();
   * const memoizedInterpolator = cache.memoize(rawInterpolator);
   *
   * // Now use the memoized version which will cache results
   * const value = memoizedInterpolator(0.5); // Computes and caches
   * const cachedValue = memoizedInterpolator(0.5); // Uses cached value
   * ```
   */
  memoize(interpolator: TypedInterpolator<T>): TypedInterpolator<T> {
    if (typeof interpolator !== 'function') {
      const error = new Error('Invalid interpolator function provided');
      errorLoggingService.logError(error, ErrorType.VALIDATION, ErrorSeverity.MEDIUM, {
        component: 'InterpolationCache',
        method: 'memoize',
      });
      // Return a safe fallback function that doesn't call the invalid interpolator
      return (t: number): T => {
        errorLoggingService.logError(
          new Error(`Attempted to use invalid interpolator with value ${t}`),
          ErrorType.RUNTIME,
          ErrorSeverity.MEDIUM,
          {
            component: 'InterpolationCache',
            method: 'memoize.fallback',
            parameter: t,
          }
        );
        // We need to return something of type T, but we don't know what T is
        // This will likely cause a runtime error, but it's the best we can do
        throw new Error(`Cannot interpolate: invalid interpolator function provided`);
      };
    }

    return (t: number): T => {
      try {
        // Skip caching logic if t is outside 0-1 range
        if (t < 0 || t > 1) {
          return interpolator(t);
        }

        const key = this.generateKey(t);
        const now = performance.now();

        if (this.config.trackStats) {
          this.stats.lookups++;
        }

        // Check cache
        if (this.cache.has(key)) {
          const entry = this.cache.get(key)!;

          // Check if entry is expired
          if (this.config.cacheTTL && now - entry.created > this.config.cacheTTL) {
            this.cache.delete(key);
            if (this.config.trackStats) {
              this.stats.evictions++;
            }
          } else {
            // Cache hit
            if (this.config.trackStats) {
              this.stats.hits++;
              this.stats.hitRate = this.stats.hits / this.stats.lookups;
              this.stats.totalTimeSaved += entry.computeTime;
              this.stats.avgTimeSaved = this.stats.totalTimeSaved / this.stats.hits;
            }

            // Update last accessed time for LRU
            if (this.config.useLRU) {
              entry.lastAccessed = now;
            }

            return entry.value;
          }
        }

        // Cache miss - compute the value
        const startTime = this.config.profilePerformance ? performance.now() : 0;
        const value = interpolator(t);
        const computeTime = this.config.profilePerformance ? performance.now() - startTime : 0;

        if (this.config.trackStats) {
          this.stats.misses++;
          this.stats.hitRate = this.stats.hits / this.stats.lookups;
        }

        // Check if we need to evict entries before adding a new one
        if (this.config.maxCacheSize && this.cache.size >= this.config.maxCacheSize) {
          this.evictEntries();
        }

        // Add to cache
        const size = this.estimateSize(value);
        this.cache.set(key, {
          value,
          lastAccessed: now,
          created: now,
          size,
          computeTime,
        });

        if (this.config.trackStats) {
          this.stats.entryCount = this.cache.size;
          this.stats.estimatedMemoryUsage += size;
        }

        return value;
      } catch (error) {
        errorLoggingService.logError(
          error instanceof Error ? error : new Error(String(error)),
          ErrorType.RUNTIME,
          ErrorSeverity.MEDIUM,
          {
            component: 'InterpolationCache',
            method: 'memoize.interpolator',
            parameter: t,
          }
        );
        throw error;
      }
    };
  }

  /**
   * Evict entries based on the configured policy
   */
  private evictEntries(): void {
    if (this.cache.size === 0) {
      return;
    }

    if (this.config.useLRU) {
      // Find the least recently used entry
      let oldestKey: string | null = null;
      let oldestTime = Infinity;

      for (const [key, entry] of this.cache.entries()) {
        if (entry.lastAccessed < oldestTime) {
          oldestTime = entry.lastAccessed;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        const entry = this.cache.get(oldestKey);
        if (entry && this.config.trackStats) {
          this.stats.estimatedMemoryUsage -= entry.size;
        }
        this.cache.delete(oldestKey);
        if (this.config.trackStats) {
          this.stats.evictions++;
          this.stats.entryCount = this.cache.size;
        }
      }
    } else {
      // Simple random eviction (evict ~10% of entries)
      const keysToEvict = Math.max(1, Math.floor(this.cache.size * 0.1));
      const keys = Array.from(this.cache.keys());

      for (let i = 0; i < keysToEvict; i++) {
        const randomIndex = Math.floor(Math.random() * keys.length);
        const key = keys[randomIndex];

        const entry = this.cache.get(key);
        if (entry && this.config.trackStats) {
          this.stats.estimatedMemoryUsage -= entry.size;
        }

        this.cache.delete(key);
        keys.splice(randomIndex, 1);

        if (this.config.trackStats) {
          this.stats.evictions++;
        }
      }

      if (this.config.trackStats) {
        this.stats.entryCount = this.cache.size;
      }
    }
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();

    if (this.config.trackStats) {
      this.stats.entryCount = 0;
      this.stats.estimatedMemoryUsage = 0;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Resize the cache
   *
   * @param newSize New maximum cache size
   */
  resize(newSize: number): void {
    this.config.maxCacheSize = newSize;

    // If new size is smaller than current size, evict entries
    if (newSize < this.cache.size) {
      const entriesToEvict = this.cache.size - newSize;
      for (let i = 0; i < entriesToEvict; i++) {
        this.evictEntries();
      }
    }
  }
}

/**
 * Factory for creating memoized interpolators for different data types
 */
export const memoizedInterpolators = {
  /**
   * Create a memoized number interpolator
   */
  number: (
    start: number,
    end: number,
    config?: InterpolationCacheConfig
  ): TypedInterpolator<number> => {
    const interpolator = typedInterpolators.number(start, end);
    const cache = new InterpolationCache<number>(config);
    return cache.memoize(interpolator);
  },

  /**
   * Create a memoized color interpolator
   */
  color: (
    start: string,
    end: string,
    config?: InterpolationCacheConfig
  ): TypedInterpolator<string> => {
    const interpolator = typedInterpolators.color(start, end);
    const cache = new InterpolationCache<string>(config);
    return cache.memoize(interpolator);
  },

  /**
   * Create a memoized date interpolator
   */
  date: (start: Date, end: Date, config?: InterpolationCacheConfig): TypedInterpolator<Date> => {
    const interpolator = typedInterpolators.date(start, end);
    const cache = new InterpolationCache<Date>(config);
    return cache.memoize(interpolator);
  },

  /**
   * Create a memoized number array interpolator
   */
  numberArray: (
    start: number[],
    end: number[],
    config?: InterpolationCacheConfig
  ): TypedInterpolator<number[]> => {
    const interpolator = typedInterpolators.numberArray(start, end);
    const cache = new InterpolationCache<number[]>(config);
    return cache.memoize(interpolator);
  },

  /**
   * Create a memoized object interpolator
   */
  object: <T extends Record<string, number>>(
    start: T,
    end: T,
    config?: InterpolationCacheConfig
  ): TypedInterpolator<T> => {
    const interpolator = typedInterpolators.object(start, end);
    const cache = new InterpolationCache<T>(config);
    return cache.memoize(interpolator);
  },

  /**
   * Create a memoized generic interpolator
   */
  generic: <T>(
    interpolator: TypedInterpolator<T>,
    config?: InterpolationCacheConfig
  ): TypedInterpolator<T> => {
    const cache = new InterpolationCache<T>(config);
    return cache.memoize(interpolator);
  },
};

/**
 * Specialized cache configuration optimized for numeric values
 */
export const numericCacheConfig: InterpolationCacheConfig = {
  maxCacheSize: 10000,
  resolution: 0.0001, // Higher precision for numeric values
  useLRU: true,
  trackStats: true,
};

/**
 * Specialized cache configuration optimized for colors
 */
export const colorCacheConfig: InterpolationCacheConfig = {
  maxCacheSize: 1000,
  resolution: 0.001, // Colors don't need as much precision
  useLRU: true,
  trackStats: true,
};

/**
 * Specialized cache configuration optimized for object values
 */
export const objectCacheConfig: InterpolationCacheConfig = {
  maxCacheSize: 500, // Lower due to higher memory overhead
  resolution: 0.005, // Lower precision to save memory
  useLRU: true,
  trackStats: true,
};

/**
 * Cache that spans across multiple animations
 */
class GlobalInterpolationCache {
  private caches: Map<string, InterpolationCache<unknown>> = new Map();

  /**
   * Get or create a cache for a specific animation ID
   */
  getCache<T>(animationId: string, config?: InterpolationCacheConfig): InterpolationCache<T> {
    if (!this.caches.has(animationId)) {
      // Fix: Apply generic to constructor
      this.caches.set(animationId, new InterpolationCache<T>(config));
    }
    return this.caches.get(animationId) as InterpolationCache<T>;
  }

  /**
   * Clear the cache for a specific animation
   */
  clearCache(animationId: string): void {
    if (this.caches.has(animationId)) {
      this.caches.get(animationId)!.clear();
    }
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }

  /**
   * Get aggregate statistics across all caches
   */
  getAggregateStats(): CacheStats {
    const stats: CacheStats = {
      lookups: 0,
      hits: 0,
      misses: 0,
      hitRate: 0,
      entryCount: 0,
      avgTimeSaved: 0,
      totalTimeSaved: 0,
      evictions: 0,
      estimatedMemoryUsage: 0,
    };

    for (const cache of this.caches.values()) {
      const cacheStats = cache.getStats();
      stats.lookups += cacheStats.lookups;
      stats.hits += cacheStats.hits;
      stats.misses += cacheStats.misses;
      stats.entryCount += cacheStats.entryCount;
      stats.totalTimeSaved += cacheStats.totalTimeSaved;
      stats.evictions += cacheStats.evictions;
      stats.estimatedMemoryUsage += cacheStats.estimatedMemoryUsage;
    }

    stats.hitRate = stats.lookups > 0 ? stats.hits / stats.lookups : 0;
    stats.avgTimeSaved = stats.hits > 0 ? stats.totalTimeSaved / stats.hits : 0;

    return stats;
  }
}

/**
 * Global cache instance for shared use
 */
export const globalInterpolationCache = new GlobalInterpolationCache();

/**
 * Helper to create a memoized D3 interpolator for unknown method
 */
export function memoizeD3Interpolator<T>(
  interpolatorFactory: (a: unknown, b: unknown) => (t: number) => T,
  a: unknown,
  b: unknown,
  config?: InterpolationCacheConfig
): TypedInterpolator<T> {
  const interpolator = interpolatorFactory(a, b);
  const cache = new InterpolationCache<T>(config);
  return cache.memoize(interpolator);
}

/**
 * Utility for dynamically adapting cache configurations based on performance
 */
export function createAdaptiveCache<T>(
  baseConfig: InterpolationCacheConfig = {}
): InterpolationCache<T> {
  // Start with default configuration
  const config: InterpolationCacheConfig = {
    maxCacheSize: 1000,
    resolution: 0.001,
    useLRU: true,
    trackStats: true,
    profilePerformance: true,
    ...baseConfig,
  };

  const cache = new InterpolationCache<T>(config);

  // Set up adaptation interval
  const adaptInterval = setInterval(() => {
    const stats = cache.getStats();

    // Adapt cache size based on hit rate
    if (stats.hitRate > 0.9 && stats.lookups > 100) {
      // High hit rate, might benefit from larger cache
      cache.resize(config.maxCacheSize! * 1.2);
    } else if (stats.hitRate < 0.5 && stats.lookups > 100) {
      // Low hit rate, reduce cache size to save memory
      cache.resize(Math.max(100, config.maxCacheSize! * 0.8));
    }

    // Adapt resolution based on performance gain
    if (stats.avgTimeSaved < 0.05 && stats.lookups > 100) {
      // Very small time savings, use coarser resolution
      config.resolution = Math.min(0.01, config.resolution! * 2);
    } else if (stats.avgTimeSaved > 0.5 && stats.lookups > 100) {
      // Significant time savings, use finer resolution
      config.resolution = Math.max(0.0001, config.resolution! * 0.5);
    }
  }, 5000); // Adapt every 5 seconds

  // Return the cache with a wrapped clear method that also clears the interval
  const originalClear = cache.clear.bind(cache);
  cache.clear = () => {
    clearInterval(adaptInterval);
    originalClear();
  };

  return cache;
}

/**
 * Integration with the animation frame manager to automatically memoize animations
 *
 * @param animationId Animation ID to enhance with memoization
 * @param config Memoization configuration
 */
export function enhanceAnimationWithMemoization(
  animationId: string,
  config?: InterpolationCacheConfig
): void {
  // Get the animation from the frame manager
  const animations = animationFrameManager.getAnimations();
  const animation = animations.find(a => a.id === animationId);

  if (!animation) {
    logger.warn(`Animation ${animationId} not found in frame manager`);
    return;
  }

  // Store the animation ID in global cache for reference
  globalInterpolationCache.getCache(animationId, config);

  // Animation is now ready to use memoized interpolators via createMemoizedInterpolators
}

/**
 * Utility to optimize an entire D3 selection's transitions with memoization
 *
 * @param selection D3 selection to optimize transitions for
 * @param config Optional configuration settings for the cache
 * @returns The enhanced D3 selection with memoized transitions
 * @example
 * ```typescript
 * // Create a standard D3 selection
 * const circles = d3.select('svg')
 *   .selectAll('circle')
 *   .data(dataset);
 *
 * // Optimize all transitions on this selection
 * const optimizedCircles = optimizeD3Transitions(circles);
 *
 * // Now all transitions will use memoized interpolators
 * optimizedCircles.transition()
 *   .duration(1000)
 *   .attr('r', d => d.radius)
 *   .attr('cx', d => d.x)
 *   .attr('cy', d => d.y)
 *   .style('fill-opacity', 0.8);
 * ```
 */
export function optimizeD3Transitions<
  GElement extends Element,
  Datum,
  PElement extends Element,
  PDatum,
>(
  selection: d3.Selection<GElement, Datum, PElement, PDatum>,
  config?: InterpolationCacheConfig
): d3.Selection<GElement, Datum, PElement, PDatum> {
  try {
    if (!selection) {
      throw new Error('Invalid D3 selection provided');
    }

    const cacheId = 'd3-transition-' + Math.random().toString(36).substring(2);

    // Store original transition method and bind 'this'
    const originalTransition = selection.transition.bind(selection);

    // Override transition method
    type TransitionFn = typeof originalTransition;
    (selection.transition as unknown) = function (
      this: d3.Selection<GElement, Datum, PElement, PDatum>,
      ...args: Parameters<TransitionFn>
    ): ReturnType<TransitionFn> {
      try {
        // Call original transition method
        const transition = originalTransition.apply(this, args);

        // Store original tween method and bind 'this'
        const originalTween = transition.tween.bind(transition);

        // Define factory function types
        type TweenFactory =
          | null
          | ((
              this: GElement,
              d: Datum,
              i: number,
              nodes: GElement[]
            ) => (this: GElement, t: number) => void);

        // Override tween method
        type TweenFn = typeof originalTween;
        type D3TweenValueFn = d3.ValueFn<GElement, Datum, (this: GElement, t: number) => void>;

        (transition.tween as unknown) = function (
          this: d3.Transition<GElement, Datum, PElement, PDatum>,
          name: string,
          factory: TweenFactory
        ): ReturnType<TweenFn> {
          if (factory === null) {
            return originalTween.call(this, name, null as unknown as D3TweenValueFn);
          }

          // Create memoized factory
          const memoizedFactory = function (this: GElement, d: Datum, i: number, a: GElement[]) {
            const originalInterpolator = factory.call(this, d, i, a);
            const cacheInstance = globalInterpolationCache.getCache<void>(
              cacheId + '-' + name,
              config
            );
            const interpolatorForMemoize = (t: number): void => originalInterpolator.call(this, t);
            return cacheInstance.memoize(interpolatorForMemoize);
          };

          // Call original tween with memoized factory
          return originalTween.call(this, name, memoizedFactory as unknown as D3TweenValueFn);
        };

        // Store original styleTween method and bind 'this'
        const originalStyleTween = transition.styleTween.bind(transition);

        // Define style factory function type
        type StyleFactory =
          | null
          | ((
              this: GElement,
              d: Datum,
              i: number,
              nodes: GElement[]
            ) => (this: GElement, t: number) => string);

        // Override styleTween method
        type StyleTweenFn = typeof originalStyleTween;
        type D3StyleValueFn = d3.ValueFn<GElement, Datum, (this: GElement, t: number) => string>;

        (transition.styleTween as unknown) = function (
          this: d3.Transition<GElement, Datum, PElement, PDatum>,
          name: string,
          factory: StyleFactory,
          priority?: 'important' | null
        ): ReturnType<StyleTweenFn> {
          if (factory === null) {
            return originalStyleTween.call(this, name, null as unknown as D3StyleValueFn, priority);
          }

          // Create memoized factory
          const memoizedFactory = function (this: GElement, d: Datum, i: number, a: GElement[]) {
            const originalInterpolator = factory.call(this, d, i, a);
            const cacheInstance = globalInterpolationCache.getCache<string>(
              cacheId + '-style-' + name + (priority ?? ''),
              config
            );
            const interpolatorForMemoize = (t: number): string => originalInterpolator.call(this, t);
            return cacheInstance.memoize(interpolatorForMemoize);
          };

          // Call original styleTween with memoized factory
          return originalStyleTween.call(
            this,
            name,
            memoizedFactory as unknown as D3StyleValueFn,
            priority
          );
        };

        return transition;
      } catch (error) {
        errorLoggingService.logError(
          error instanceof Error ? error : new Error(String(error)),
          ErrorType.RUNTIME,
          ErrorSeverity.MEDIUM,
          {
            component: 'optimizeD3Transitions',
            selectionType: selection?.constructor?.name,
          }
        );

        // Fall back to original transition
        return originalTransition.apply(this, args);
      }
    };

    return selection;
  } catch (error) {
    errorLoggingService.logError(
      error instanceof Error ? error : new Error(String(error)),
      ErrorType.RUNTIME,
      ErrorSeverity.MEDIUM,
      {
        component: 'optimizeD3Transitions',
        function: 'setup',
      }
    );

    // Return original selection without optimization
    return selection;
  }
}

/**
 * Cleanup memoization resources when an animation is removed
 */
export function cleanupMemoizationForAnimation(animationId: string): void {
  globalInterpolationCache.clearCache(animationId);
}

/**
 * Get global memoization statistics
 */
export function getMemoizationStats(): CacheStats {
  return globalInterpolationCache.getAggregateStats();
}
