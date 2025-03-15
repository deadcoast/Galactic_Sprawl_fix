import { Box, Button, LinearProgress, Skeleton, Typography } from '@mui/material';
import * as React from "react";
import { ComponentType, useCallback, useEffect, useState } from 'react';
import useMemoryManager, { MemoryManagerOptions } from '../../../hooks/useMemoryManager';
import { BaseChartProps } from './charts/BaseChart';

/**
 * Options for the withMemoryManagement HOC
 */
export interface WithMemoryManagementOptions extends Partial<MemoryManagerOptions> {
  /**
   * Whether to automatically load data when component mounts
   * @default true
   */
  autoLoad?: boolean;

  /**
   * Whether to show memory usage statistics in the UI
   * @default false
   */
  showMemoryStats?: boolean;

  /**
   * Custom loading component
   */
  loadingComponent?: React.ReactNode;

  /**
   * Custom error component
   */
  errorComponent?: React.ReactNode;

  /**
   * Whether to disable automatic reloading of data when component becomes visible again
   * @default false
   */
  disableAutoReload?: boolean;
}

/**
 * HOC that adds memory management to chart components
 *
 * This component ensures proper cleanup of large datasets when the component
 * is unmounted or not visible, automatically handles loading states, and
 * provides memory usage metrics.
 *
 * @param Component The chart component to wrap
 * @param options Configuration options for memory management
 */
export function withMemoryManagement<P extends BaseChartProps>(
  Component: ComponentType<P>,
  options: WithMemoryManagementOptions = {}
) {
  // The wrapped component
  const MemoryManagedComponent = (props: P) => {
    // Default options
    const {
      autoLoad = true,
      showMemoryStats = false,
      loadingComponent,
      errorComponent,
      disableAutoReload = false,
      ...memoryOptions
    } = options;

    // Component identifier for memory manager
    const componentKey = `memory-managed-${Component.displayName || Component.name || 'component'}`;

    // Loading state
    const [isLoading, setIsLoading] = useState(autoLoad);
    const [error, setError] = useState<string | null>(null);
    const [dataTimestamp, setDataTimestamp] = useState<number>(0);

    // Use our memory manager hook
    const memory = useMemoryManager(props.data, {
      key: componentKey,
      // Set sensible initial memory estimations based on data array length
      initialDataSizeEstimate: Array.isArray(props.data)
        ? props.data.length * 1024 // rough estimate of 1KB per data point
        : undefined,
      // Default to medium cleanup level
      autoCleanupLevel: 'medium',
      ...memoryOptions,
    });

    // Load data function
    const loadData = useCallback(() => {
      setIsLoading(true);
      setError(null);

      try {
        // In a real implementation, this might be an async data fetch
        // Here we're just updating the memory manager with the props data
        memory.updateData(props.data);
        setDataTimestamp(Date.now());
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading data');
        setIsLoading(false);
      }
    }, [props.data, memory]);

    // Cleanup data function
    const cleanupData = useCallback(() => {
      memory.cleanup();
      setDataTimestamp(0);
    }, [memory]);

    // Load data on component mount if autoLoad is true
    useEffect(() => {
      if (autoLoad) {
        loadData();
      }
    }, [autoLoad, loadData]);

    // Handle visibility changes for auto-reloading
    useEffect(() => {
      if (disableAutoReload) return;

      // Set up visibility observer to reload data when component becomes visible
      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            // When component becomes visible again and data was previously unloaded
            if (entry.isIntersecting && !memory.isDataLoaded && dataTimestamp !== 0) {
              loadData();
            }
          });
        },
        { threshold: 0.1 } // 10% visibility threshold
      );

      // Find the component's element
      const element = document.querySelector(`[data-memory-manager="${componentKey}"]`);

      if (element) {
        observer.observe(element);
      }

      return () => {
        observer.disconnect();
      };
    }, [loadData, memory.isDataLoaded, dataTimestamp, disableAutoReload, componentKey]);

    // If data has been cleaned up and we're not loading, show reload button
    if (!memory.isDataLoaded && !isLoading && dataTimestamp !== 0) {
      return (
        <Box
          sx={{
            width: props.width || '100%',
            height: props.height || 400,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            border: '1px dashed #ccc',
            borderRadius: 1,
            p: 2,
          }}
          data-memory-manager={componentKey}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Data unloaded to conserve memory
          </Typography>
          <Button variant="outlined" onClick={loadData} sx={{ mt: 1 }}>
            Reload Data
          </Button>
        </Box>
      );
    }

    // Show loading state
    if (isLoading) {
      if (loadingComponent) {
        return (
          <Box
            sx={{ width: props.width || '100%', height: props.height || 400 }}
            data-memory-manager={componentKey}
          >
            {loadingComponent}
          </Box>
        );
      }

      return (
        <Box
          sx={{
            width: props.width || '100%',
            height: props.height || 400,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: 2,
          }}
          data-memory-manager={componentKey}
        >
          <Skeleton variant="rectangular" width="100%" height="100%" />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Loading chart data...
          </Typography>
          <LinearProgress sx={{ width: '100%', mt: 1 }} />
        </Box>
      );
    }

    // Show error state
    if (error) {
      if (errorComponent) {
        return (
          <Box
            sx={{ width: props.width || '100%', height: props.height || 400 }}
            data-memory-manager={componentKey}
          >
            {errorComponent}
          </Box>
        );
      }

      return (
        <Box
          sx={{
            width: props.width || '100%',
            height: props.height || 400,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            border: '1px solid #f44336',
            borderRadius: 1,
            p: 2,
          }}
          data-memory-manager={componentKey}
        >
          <Typography variant="body1" color="error" gutterBottom>
            Error loading chart data
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error}
          </Typography>
          <Button variant="outlined" color="error" onClick={loadData} sx={{ mt: 2 }}>
            Retry
          </Button>
        </Box>
      );
    }

    // Render the wrapped component with memory stats if enabled
    return (
      <Box
        sx={{
          width: props.width || '100%',
          height: 'auto',
          position: 'relative',
        }}
        data-memory-manager={componentKey}
      >
        {/* Pass the managed data to the component */}
        <Component {...props} />

        {/* Show memory stats if enabled */}
        {showMemoryStats && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: 1,
              fontSize: '0.75rem',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="caption" color="inherit">
              Memory: {(memory.memoryUsage / (1024 * 1024)).toFixed(2)} MB
            </Typography>
            {memory.isAboveThreshold && (
              <Typography variant="caption" color="error">
                Above threshold
              </Typography>
            )}
            <Button
              variant="text"
              size="small"
              onClick={cleanupData}
              sx={{ color: 'white', minWidth: 'auto', padding: '0px 4px' }}
            >
              Clear
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  // Set display name for the wrapped component
  MemoryManagedComponent.displayName = `withMemoryManagement(${Component.displayName || Component.name || 'Component'})`;

  return MemoryManagedComponent;
}

export default withMemoryManagement;
