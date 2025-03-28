# GALACTIC SPRAWL (GS) - User Interface Rules

## Overview
This document defines the rules, patterns, and best practices for implementing UI components in the Galactic Sprawl codebase. Adherence to these rules ensures consistency, maintainability, and high performance across the UI system.

## UI Component Rules

### Component Structure Rule

```json
{
  "name": "Component Structure Rule",
  "description": "Defines the required structure for UI components",
  "filePattern": ["src/components/ui/**/*.tsx", "src/ui/components/**/*.tsx"],
  "content": "All UI components must follow the standard component structure: context comment, imports, interface definition, component implementation, and optional auxiliary functions."
}
```

Components must follow this structure:

```tsx
/**
 * @context: ui-system, component-library
 * 
 * Description of the component purpose
 */
import * as React from 'react';
import { useState, useEffect } from 'react';
// Additional imports...

export interface ComponentNameProps {
  // Props with JSDoc comments
}

/**
 * Component description
 */
export const ComponentName: React.FC<ComponentNameProps> = ({ 
  // Destructured props with defaults
}) => {
  // Component implementation
};
```

### Props Documentation Rule

```json
{
  "name": "Props Documentation Rule",
  "description": "Ensures props interfaces are properly documented",
  "filePattern": ["src/components/ui/**/*.tsx", "src/ui/components/**/*.tsx"],
  "content": "All component props must be defined in an exported interface with comprehensive JSDoc documentation for each prop, including default values where applicable."
}
```

All props must be documented:

```tsx
export interface ButtonProps {
  /**
   * Text content of the button
   */
  label: string;
  
  /**
   * Called when the button is clicked
   */
  onClick?: () => void;
  
  /**
   * Visual style variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'tertiary';
  
  /**
   * Whether the button is disabled
   * @default false
   */
  disabled?: boolean;
}
```

### Component Naming Rule

```json
{
  "name": "Component Naming Rule",
  "description": "Defines naming conventions for UI components",
  "filePattern": ["src/components/ui/**/*.tsx", "src/ui/components/**/*.tsx"],
  "content": "Component names must be PascalCase, descriptive of their purpose, and end with their component type if applicable (e.g., Button, CardHeader, ResourceDisplay)."
}
```

Naming examples:

- **Correct**: `Button`, `ResourceDisplay`, `NavigationPanel`, `UserAvatar`
- **Incorrect**: `button`, `resource_display`, `navigation-panel`

### Export Pattern Rule

```json
{
  "name": "Export Pattern Rule",
  "description": "Defines export patterns for UI components",
  "filePattern": ["src/components/ui/**/*.tsx", "src/ui/components/**/*.tsx"],
  "content": "Components should export both named and default exports. Props interfaces must be exported as named exports."
}
```

Export pattern:

```tsx
// Named export for the component
export const Button: React.FC<ButtonProps> = (props) => {
  // Implementation
};

// Default export for ease of import
export default Button;

// Named export for the props interface
export interface ButtonProps {
  // Props
}
```

### Responsive Design Rule

```json
{
  "name": "Responsive Design Rule",
  "description": "Ensures components implement responsive behavior",
  "filePattern": ["src/components/ui/**/*.tsx", "src/ui/components/**/*.tsx"],
  "content": "UI components must implement responsive behavior using the useBreakpoint hook or equivalent responsive mechanisms. Mobile-first design principles must be followed."
}
```

Responsive implementation:

```tsx
import { useBreakpoint } from '../../../hooks/ui/useBreakpoint';

export const ResponsiveComponent: React.FC = () => {
  const { isMobile, current } = useBreakpoint();
  
  // Adjust layout based on screen size
  return (
    <div className={`component component--${current}`}>
      {isMobile ? <MobileView /> : <DesktopView />}
    </div>
  );
};
```

### Accessibility Rule

```json
{
  "name": "Accessibility Rule",
  "description": "Mandates accessibility requirements for UI components",
  "filePattern": ["src/components/ui/**/*.tsx", "src/ui/components/**/*.tsx"],
  "content": "UI components must implement proper accessibility features: semantic HTML, ARIA attributes, keyboard navigation, focus management, and appropriate color contrast."
}
```

Accessibility implementation:

```tsx
// Interactive element with keyboard support
<button 
  className="action-button"
  onClick={handleAction}
  disabled={isDisabled}
  aria-disabled={isDisabled}
  aria-label="Perform action"
>
  {buttonText}
</button>

// Focus management
useEffect(() => {
  if (isOpen && modalRef.current) {
    // Store previous focus
    previousFocusRef.current = document.activeElement as HTMLElement;
    // Focus the modal
    modalRef.current.focus();
  }
  
  return () => {
    // Restore focus when component unmounts
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  };
}, [isOpen]);
```

### Performance Optimization Rule

```json
{
  "name": "Performance Optimization Rule",
  "description": "Mandates performance optimizations for UI components",
  "filePattern": ["src/components/ui/**/*.tsx", "src/ui/components/**/*.tsx"],
  "content": "UI components must implement appropriate performance optimizations: memoization for pure components, useCallback for event handlers, useMemo for expensive calculations, and virtualization for long lists."
}
```

Performance implementation:

```tsx
// Memoization for pure components
export const PureComponent = React.memo(({ data }: PureComponentProps) => {
  // Component implementation
});

// Memoized calculations
const processedData = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

// Memoized event handler
const handleClick = useCallback(() => {
  // Handler implementation
}, [dependencies]);

// Virtualization for long lists
import { FixedSizeList } from 'react-window';

const VirtualizedList = ({ items }: { items: Item[] }) => (
  <FixedSizeList
    height={500}
    width={300}
    itemCount={items.length}
    itemSize={50}
  >
    {({ index, style }) => (
      <div style={style}>
        <ListItem item={items[index]} />
      </div>
    )}
  </FixedSizeList>
);
```

### Error Handling Rule

```json
{
  "name": "Error Handling Rule",
  "description": "Mandates proper error handling in UI components",
  "filePattern": ["src/components/ui/**/*.tsx", "src/ui/components/**/*.tsx"],
  "content": "UI components must implement appropriate error handling with fallbacks for data fetching errors, rendering errors, and user interaction errors."
}
```

Error handling implementation:

```tsx
// Component with error state
const [error, setError] = useState<Error | null>(null);

// Error handling in effects
useEffect(() => {
  const fetchData = async () => {
    try {
      const result = await fetchResource(resourceId);
      setData(result);
      setError(null);
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setError(error);
      
      // Log error to monitoring service
      errorLoggingService.logError(error, ErrorType.UI, ErrorSeverity.MEDIUM, {
        component: 'ResourceComponent',
        resourceId
      });
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, [resourceId]);

// Error handling in handlers
const handleSubmit = useCallback(async (values) => {
  try {
    await submitForm(values);
    onSuccess();
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    setError(error);
    
    // Log error to monitoring service
    errorLoggingService.logError(error, ErrorType.FORM, ErrorSeverity.MEDIUM, {
      component: 'FormComponent',
      formData: values
    });
  }
}, [onSuccess]);

// Error boundary usage
<UIErrorBoundary 
  fallback={<ErrorDisplay />}
  onError={(error) => {
    // Log error to monitoring service
    errorLoggingService.logError(error, ErrorType.UI, ErrorSeverity.HIGH);
  }}
>
  <ComponentContent />
</UIErrorBoundary>
```

### Manager Registry Access Rule

```json
{
  "name": "Manager Registry Access Rule",
  "description": "Defines how UI components should access manager instances",
  "filePattern": ["src/components/ui/**/*.tsx", "src/ui/components/**/*.tsx"],
  "content": "UI components must access manager instances through the manager registry using the provided getter functions, never directly importing manager classes or creating instances."
}
```

Manager registry usage:

```tsx
// CORRECT: Using manager registry
import { getResourceManager } from '../../managers/ManagerRegistry';

function ResourceComponent() {
  const [resources, setResources] = useState<ResourceData[]>([]);
  
  useEffect(() => {
    // Get manager through registry
    const resourceManager = getResourceManager();
    const resourceData = resourceManager.getAllResources();
    setResources(resourceData);
  }, []);
  
  // Component implementation
}

// INCORRECT: Direct import and instantiation
// import { ResourceManager } from '../../managers/resource/ResourceManager';
// 
// function ResourceComponent() {
//   const [resources, setResources] = useState<ResourceData[]>([]);
//   
//   useEffect(() => {
//     // Direct instantiation - NEVER DO THIS
//     const resourceManager = new ResourceManager();
//     const resourceData = resourceManager.getAllResources();
//     setResources(resourceData);
//   }, []);
//   
//   // Component implementation
// }
```

### Event System Integration Rule

```json
{
  "name": "Event System Integration Rule",
  "description": "Defines how UI components should integrate with the event system",
  "filePattern": ["src/components/ui/**/*.tsx", "src/hooks/ui/**/*.ts"],
  "content": "UI components must use the event system following established patterns: subscribing to events with proper cleanup, using event type guards, and logging errors properly."
}
```

Event system usage:

```tsx
import { moduleEventBus } from '../../lib/events/ModuleEventBus';
import { EventType } from '../../types/events/EventTypes';
import { isResourceUpdateEvent } from '../../types/events/EventTypes';

function ResourceMonitor() {
  const [resources, setResources] = useState<Record<ResourceType, number>>({});
  
  useEffect(() => {
    // Subscribe to resource update events
    const unsubscribe = moduleEventBus.subscribe(
      EventType.RESOURCE_UPDATED,
      (event) => {
        // Use type guard to validate event data
        if (isResourceUpdateEvent(event)) {
          const { resourceType, newAmount } = event.data;
          
          // Update state with event data
          setResources(prev => ({
            ...prev,
            [resourceType]: newAmount
          }));
        }
      }
    );
    
    // Return cleanup function to unsubscribe
    return unsubscribe;
  }, []);
  
  // Component implementation
}
```

### Component Composition Rule

```json
{
  "name": "Component Composition Rule",
  "description": "Defines how components should be composed",
  "filePattern": ["src/components/ui/**/*.tsx", "src/ui/components/**/*.tsx"],
  "content": "UI components should be composable, with clear interfaces and minimal coupling. Use the compound component pattern for related components and render props for flexible rendering."
}
```

Component composition patterns:

```tsx
// Compound component pattern
function Tabs({ children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(0);
  
  // Context for sharing state with child components
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

// Tab subcomponent
Tabs.Tab = function Tab({ index, label }: TabProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  return (
    <button
      className={`tab ${activeTab === index ? 'active' : ''}`}
      onClick={() => setActiveTab(index)}
    >
      {label}
    </button>
  );
};

// Panel subcomponent
Tabs.Panel = function Panel({ index, children }: PanelProps) {
  const { activeTab } = useTabsContext();
  if (activeTab !== index) return null;
  return <div className="tab-panel">{children}</div>;
};

// Usage
<Tabs>
  <div className="tabs-list">
    <Tabs.Tab index={0} label="First Tab" />
    <Tabs.Tab index={1} label="Second Tab" />
  </div>
  <Tabs.Panel index={0}>First panel content</Tabs.Panel>
  <Tabs.Panel index={1}>Second panel content</Tabs.Panel>
</Tabs>
```

### Visualization Component Rules

```json
{
  "name": "Visualization Component Rules",
  "description": "Defines rules for visualization components",
  "filePattern": ["src/components/ui/visualizations/**/*.tsx", "src/components/visualizations/**/*.tsx"],
  "content": "Visualization components must implement memory optimization techniques, support responsive rendering, provide appropriate fallbacks, and integrate with the resource/data systems."
}
```

Visualization component implementation:

```tsx
/**
 * @context: ui-library, visualization-system
 */
export function ResourceChart({ 
  resourceType,
  width = 600,
  height = 300,
  timeRange = '1h'
}: ResourceChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Memory optimization with bounds checking
  const boundsRef = useRef({
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0
  });
  
  // Responsive adjustment
  const dimension = useResizeObserver(canvasRef);
  const actualWidth = dimension?.width || width;
  const actualHeight = dimension?.height || height;
  
  // Fetch and maintain data
  useEffect(() => {
    // Implementation...
  }, [resourceType, timeRange]);
  
  // Canvas rendering with optimizations
  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, actualWidth, actualHeight);
    
    // Calculate view bounds
    calculateBounds(data, boundsRef);
    
    // Optimize rendering for visible area only
    const visibleData = getVisibleDataPoints(data, boundsRef.current);
    
    // Render chart
    renderChart(ctx, visibleData, actualWidth, actualHeight, boundsRef.current);
  }, [data, actualWidth, actualHeight]);
  
  // Error handling and fallbacks
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  if (data.length === 0) {
    return <LoadingDisplay />;
  }
  
  return (
    <div className="resource-chart">
      <canvas 
        ref={canvasRef}
        width={actualWidth}
        height={actualHeight}
        className="resource-chart__canvas"
      />
      <ChartControls
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />
    </div>
  );
}
```

### Component Profiling Rule

```json
{
  "name": "Component Profiling Rule",
  "description": "Defines rules for component performance profiling",
  "filePattern": ["src/components/ui/**/*.tsx", "src/hooks/ui/profiling/**/*.ts"],
  "content": "UI components should implement performance profiling through the useComponentProfiler hook when necessary, especially for complex or performance-critical components."
}
```

Component profiling implementation:

```tsx
import { useComponentProfiler } from '../../hooks/ui/useComponentProfiler';

function ComplexVisualization({ data }: ComplexVisualizationProps) {
  // Enable profiling for performance monitoring
  const profiler = useComponentProfiler('ComplexVisualization');
  
  // Component implementation
  const processedData = useMemo(() => {
    // Log start of expensive calculation
    console.time('processData');
    const result = processComplexData(data);
    // Log end of expensive calculation
    console.timeEnd('processData');
    return result;
  }, [data]);
  
  // Render visualization
  return (
    <div className="complex-visualization">
      {/* Visualization rendering */}
    </div>
  );
}
```

### Dual UI Library Architecture Rule

```json
{
  "name": "Dual UI Library Architecture Rule",
  "description": "Defines how to work with the dual UI component library architecture",
  "filePattern": ["src/ui/**/*.tsx", "src/components/ui/**/*.tsx"],
  "content": "The codebase employs a dual UI library architecture where base components live in /src/ui/components/ and game-specific UI components live in /src/components/ui/. Always use the appropriate library based on component purpose."
}
```

Dual library implementation:

```tsx
// Base components from /src/ui/components/
import { Button, Card } from '../../../ui/components';

// Game-specific component in /src/components/ui/
export function ResourcePanel({ resourceType }: ResourcePanelProps) {
  // Use base components for structure
  return (
    <Card title={`${resourceType} Resources`}>
      <div className="resource-panel">
        {/* Panel implementation */}
        <Button variant="primary" onClick={handleAction}>
          Harvest Resources
        </Button>
      </div>
    </Card>
  );
}
```

### UI Hook Naming and Structure Rule

```json
{
  "name": "UI Hook Naming and Structure Rule",
  "description": "Defines naming and structure rules for UI hooks",
  "filePattern": ["src/hooks/ui/**/*.ts", "src/hooks/ui/**/*.tsx"],
  "content": "Hooks must use the 'use' prefix, have a clear purpose, follow React's rules of hooks, and implement proper cleanup."
}
```

Hook structure:

```tsx
/**
 * @context: ui-library, hooks-library
 * 
 * Hook for tracking window resize events
 */
export function useWindowSize() {
  // State for window dimensions
  const [size, setSize] = useState<WindowSize>({
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  // Effect for updating size on resize
  useEffect(() => {
    function handleResize() {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return size;
}
```

### Resource System Integration Rule

```json
{
  "name": "Resource System Integration Rule",
  "description": "Defines how UI components should integrate with the resource system",
  "filePattern": ["src/components/ui/resources/**/*.tsx", "src/hooks/ui/resources/**/*.ts"],
  "content": "UI components must access resource data through the manager registry, use proper type safety mechanisms, and handle resource updates properly."
}
```

Resource system integration:

```tsx
/**
 * @context: ui-library, resource-system
 * 
 * Component for displaying resource information
 */
export function ResourceSummary({ resourceType }: ResourceSummaryProps) {
  // Use the resource manager through registry
  const { data, loading, error } = useResource(resourceType);
  
  // Loading state
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // Error state
  if (error) {
    return <ErrorMessage message={error.message} />;
  }
  
  // Empty state
  if (!data) {
    return <EmptyState message={`No data for resource: ${resourceType}`} />;
  }
  
  // Render resource data
  return (
    <div className="resource-summary">
      <h3 className="resource-summary__title">
        {getResourceDisplayName(resourceType)}
      </h3>
      <div className="resource-summary__content">
        <div className="resource-summary__amount">
          <span className="resource-summary__value">{data.current}</span>
          <span className="resource-summary__separator">/</span>
          <span className="resource-summary__max">{data.max}</span>
        </div>
        {/* Additional resource details */}
      </div>
    </div>
  );
}
```

### Canvas Rendering Optimization Rule

```json
{
  "name": "Canvas Rendering Optimization Rule",
  "description": "Defines optimization rules for canvas-based visualizations",
  "filePattern": ["src/components/ui/visualizations/**/*.tsx", "src/ui/components/visualizations/**/*.tsx"],
  "content": "Canvas-based visualizations must implement memory and rendering optimizations: use requestAnimationFrame, optimize redraws, implement bounds checking, and properly manage memory."
}
```

Canvas optimization implementation:

```tsx
/**
 * @context: ui-library, visualization-system
 */
export function CanvasVisualization({ data, width, height }: CanvasVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Animation frame reference for cleanup
  const animationFrameRef = useRef<number | null>(null);
  
  // Last render timestamp for throttling
  const lastRenderRef = useRef<number>(0);
  
  // View bounds for optimization
  const boundsRef = useRef({
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,
    visibleArea: { x: 0, y: 0, width: 0, height: 0 }
  });
  
  // Canvas rendering loop
  useEffect(() => {
    if (!canvasRef.current || !data.length) return;
    
    // Get canvas context
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Calculate initial bounds
    calculateBounds(data, boundsRef.current);
    
    // Render function with throttling
    const render = (timestamp: number) => {
      // Throttle to 60fps
      if (timestamp - lastRenderRef.current < 16) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }
      
      // Update last render timestamp
      lastRenderRef.current = timestamp;
      
      // Clear only visible area
      const { visibleArea } = boundsRef.current;
      ctx.clearRect(visibleArea.x, visibleArea.y, visibleArea.width, visibleArea.height);
      
      // Get only visible data points
      const visibleData = filterVisibleDataPoints(data, boundsRef.current);
      
      // Render only visible data
      renderVisibleData(ctx, visibleData, boundsRef.current);
      
      // Request next frame
      animationFrameRef.current = requestAnimationFrame(render);
    };
    
    // Start render loop
    animationFrameRef.current = requestAnimationFrame(render);
    
    // Cleanup function
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [data, width, height]);
  
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="canvas-visualization"
    />
  );
}
```

## Best Practices

### Component Best Practices

1. **Keep components focused** - Each component should do one thing well
2. **Props API design** - Design props API for flexibility and reusability
3. **Context usage** - Use context for deeply nested state, not for everything
4. **State management** - Keep state as close as possible to where it's used
5. **Error handling** - Implement proper error boundaries and fallbacks
6. **Performance** - Implement memoization and other optimizations

### Hook Best Practices

1. **Isolation** - Each hook should serve a single, focused purpose
2. **Cleanup** - Always implement proper cleanup in useEffect
3. **Dependencies** - Carefully manage useEffect dependencies
4. **Error handling** - Implement proper error handling for async operations
5. **Testing** - Design hooks to be easily testable

### UI Integration Best Practices

1. **Manager access** - Always access managers through the registry
2. **Event subscriptions** - Always clean up event subscriptions
3. **Resource typing** - Always use ResourceType enum, never string literals
4. **Error reporting** - Always log errors to the error logging service
5. **Validation** - Always validate data with type guards

## Resources and References

- **UI Component Library** - See `src/ui/components` for base components
- **UI Hook Library** - See `src/hooks/ui` for standard UI hooks
- **Theming System** - See `src/styles` for theming configuration
- **Visualization Library** - See `src/components/ui/visualizations` for data visualization components 