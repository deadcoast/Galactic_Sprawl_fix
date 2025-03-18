import { ComponentType, useEffect, useState } from 'react';
import { BaseChartProps } from './charts/BaseChart';

/**
 * Options for memory management behavior
 */
interface MemoryOptions {
  /** Show memory usage statistics */
  showMemoryStats?: boolean;

  /** Memory threshold in bytes */
  memoryThreshold?: number;

  /** Whether to log memory usage to console */
  enableLogging?: boolean;

  /** Auto cleanup level, controlling aggressiveness of cleanup */
  autoCleanupLevel?: 'none' | 'low' | 'medium' | 'high';

  /** Time in milliseconds for cache expiration */
  cacheExpirationTime?: number;
}

/**
 * Simple function to estimate data size
 */
function estimateSize(data: unknown): number {
  if (data === null || data === undefined) return 0;

  if (Array.isArray(data)) {
    return data?.length * 1024; // Estimate 1KB per array item
  }

  if (typeof data === 'object') {
    return Object.keys(data).length * 1024; // Estimate 1KB per object property
  }

  return 1024; // Default size for primitives
}

/**
 * Higher-order component that adds memory management to visualization components
 */
export function withMemoryManagement<P extends BaseChartProps>(
  WrappedComponent: ComponentType<P>,
  options: MemoryOptions = {}
): ComponentType<P> {
  const ManagedComponent = (props: P) => {
    // Default options
    const {
      showMemoryStats = false,
      memoryThreshold = 50 * 1024 * 1024,
      enableLogging = false,
      autoCleanupLevel = 'medium',
      cacheExpirationTime = 5 * 60 * 1000,
    } = options;

    // Track memory usage
    const [memoryUsage, setMemoryUsage] = useState<number>(0);

    // Update memory usage when props change
    useEffect(() => {
      const size = estimateSize(props?.data);
      setMemoryUsage(size);

      // Log memory usage if enabled
      if (enableLogging) {
        console.log(
          `[MemoryManager] Memory usage: ${Math.round(size / 1024 / 1024)}MB, Cleanup level: ${autoCleanupLevel}`
        );
      }
    }, [props?.data, enableLogging, autoCleanupLevel]);

    // Calculate memory usage in MB for display
    const memoryMB = Math.round(memoryUsage / 1024 / 1024);

    // Check if memory usage exceeds threshold
    const isAboveThreshold = memoryUsage > memoryThreshold;

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <WrappedComponent {...props} />

        {showMemoryStats && (
          <div
            style={{
              position: 'absolute',
              bottom: 5,
              right: 5,
              fontSize: '0.75rem',
              opacity: 0.7,
              backgroundColor: isAboveThreshold ? 'rgba(255,200,200,0.8)' : 'rgba(200,200,200,0.8)',
              padding: '2px 5px',
              borderRadius: '3px',
            }}
          >
            Memory: {memoryMB}MB
          </div>
        )}
      </div>
    );
  };

  // Set display name for better debugging
  const wrappedName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  ManagedComponent.displayName = `WithMemory(${wrappedName})`;

  return ManagedComponent;
}

export default withMemoryManagement;
