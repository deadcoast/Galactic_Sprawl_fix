import { Box, Button, CircularProgress, Typography } from '@mui/material';
import React, { ComponentType, useEffect, useState } from 'react';
import { MemoryManagerOptions, useMemoryManager } from '../../../hooks/useMemoryManager';
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
 * Data transfer object for memory-managed component state
 */
interface MemoryManagedState {
  isLoading: boolean;
  error: string | null;
  dataTimestamp: number;
  memoryUsage: number;
  isDataLoaded: boolean;
}

// Define styles as const objects to avoid complex unions
const containerStyle = {
  position: 'relative',
} as const;

const loadingContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
} as const;

const errorContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
} as const;

const unloadedContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  border: '1px dashed #ccc',
  borderRadius: '4px',
  padding: '16px',
} as const;

const statsStyle = {
  marginTop: '8px',
} as const;

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
  WrappedComponent: ComponentType<P>,
  options: WithMemoryManagementOptions = {}
): React.FC<P> {
  // Set a display name for the wrapped component
  const wrappedComponentName = `WithMemoryManagement(${WrappedComponent.displayName || WrappedComponent.name || 'UnknownComponent'})`;

  const MemoryManagedComponent = React.memo((props: P) => {
    // Default options
    const { autoLoad = true, showMemoryStats = false, disableAutoReload = false } = options;

    // Component identifier for memory manager
    const componentKey = `memory-managed-${wrappedComponentName}`;

    // Component state using DTO
    const [state, setState] = useState<MemoryManagedState>({
      isLoading: autoLoad,
      error: null,
      dataTimestamp: 0,
      memoryUsage: 0,
      isDataLoaded: false,
    });

    // Use our memory manager hook
    const memory = useMemoryManager<P['data']>(props.data, {
      key: componentKey,
      initialDataSizeEstimate: Array.isArray(props.data) ? props.data.length * 1024 : undefined,
    });

    // Load data function with error boundary
    const loadData = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Validate data at boundary
        if (props.data === undefined || props.data === null) {
          throw new Error('Data is required');
        }

        memory.updateData(props.data);

        setState(prev => ({
          ...prev,
          isLoading: false,
          dataTimestamp: Date.now(),
          memoryUsage: memory.memoryUsage,
          isDataLoaded: true,
        }));
      } catch (err) {
        // Consistent error handling at boundary
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        console.error(`[${componentKey}] Error loading data:`, err);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
          isDataLoaded: false,
        }));
      }
    };

    // Initial load with error boundary
    useEffect(() => {
      if (autoLoad) {
        loadData().catch(err => {
          console.error(`[${componentKey}] Error in initial load:`, err);
        });
      }
    }, []);

    // Intersection observer for visibility-based loading
    useEffect(() => {
      if (disableAutoReload) return;

      const element = document.querySelector(`[data-memory-manager="${componentKey}"]`);
      if (!element) {
        console.warn(`[${componentKey}] Could not find element for intersection observer`);
        return;
      }

      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !state.isDataLoaded && !state.isLoading) {
              loadData().catch(err => {
                console.error(`[${componentKey}] Error in visibility-based load:`, err);
              });
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(element);

      return () => {
        observer.disconnect();
      };
    }, [state.isDataLoaded, state.dataTimestamp, disableAutoReload]);

    // Render loading state
    if (state.isLoading) {
      return (
        <Box
          component="div"
          style={{
            ...loadingContainerStyle,
            width: props.width || '100%',
            height: props.height || 400,
          }}
        >
          <CircularProgress />
        </Box>
      );
    }

    // Render error state
    if (state.error) {
      return (
        <Box
          component="div"
          style={{
            ...errorContainerStyle,
            width: props.width || '100%',
            height: props.height || 400,
          }}
        >
          <Typography color="error" gutterBottom>
            {state.error}
          </Typography>
          <Button variant="outlined" onClick={() => loadData()} style={{ marginTop: '8px' }}>
            Retry
          </Button>
        </Box>
      );
    }

    // Render unloaded state
    if (!state.isDataLoaded && !state.isLoading && state.dataTimestamp !== 0) {
      return (
        <Box
          component="div"
          style={{
            ...unloadedContainerStyle,
            width: props.width || '100%',
            height: props.height || 400,
          }}
          data-memory-manager={componentKey}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Data unloaded to conserve memory
          </Typography>
          <Button variant="outlined" onClick={() => loadData()} style={{ marginTop: '8px' }}>
            Reload Data
          </Button>
        </Box>
      );
    }

    // Extract only the props needed by the wrapped component
    const {
      data,
      width,
      height,
      title,
      subtitle,
      colors,
      className,
      animate,
      theme,
      onElementClick,
      showLoadingState,
      errorMessage,
      ...otherProps
    } = props;

    // Render the component with memory-managed data
    return (
      <Box component="div" style={containerStyle}>
        <div data-memory-manager={componentKey}>
          <WrappedComponent
            data={data}
            width={width}
            height={height}
            title={title}
            subtitle={subtitle}
            colors={colors}
            className={className}
            animate={animate}
            theme={theme}
            onElementClick={onElementClick}
            showLoadingState={showLoadingState}
            errorMessage={errorMessage}
            {...(otherProps as Omit<P, keyof BaseChartProps>)}
          />
          {showMemoryStats && (
            <Box style={statsStyle}>
              <Typography variant="body2" color="textSecondary">
                Memory Usage: {Math.round(state.memoryUsage / 1024 / 1024)}MB
              </Typography>
            </Box>
          )}
        </div>
      </Box>
    );
  });

  // Set display name for better debugging
  MemoryManagedComponent.displayName = wrappedComponentName;

  return MemoryManagedComponent;
}

export default withMemoryManagement;
