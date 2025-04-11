# Performance Optimization Components

This directory contains components and utilities for optimizing UI rendering performance in the Galactic Sprawl system.

## Memoization Utilities

These utilities help optimize component re-rendering by providing enhanced React.memo functionality with performance tracking.

### Basic Usage

```tsx
import { createMemoizedComponent } from '../optimized';

// Basic component
function ExpensiveComponent({ data, onClick }: ExpensiveComponentProps) {
  // Component logic...
  return <div>...</div>;
}

// Export with memoization
export default createMemoizedComponent(ExpensiveComponent, 'ExpensiveComponent');
```

### Advanced Usage

```tsx
import { withMemoization } from '../optimized';

function ComplexComponent(props: ComplexComponentProps) {
  // Component logic...
  return <div>...</div>;
}

export default withMemoization(ComplexComponent, {
  componentName: 'ComplexComponent',
  trackRenders: true,
  logPerformance: true,
  renderTimeThreshold: 8, // Log renders that take more than 8ms
  arePropsEqual: (prev, next) => {
    // Custom comparison logic
    return prev.id === next.id && prev.data.version === next.data.version;
  },
});
```

### With ForwardRef

```tsx
import { withMemoizationForwardRef } from '../optimized';

const InputComponent = (
  { label, value, onChange }: InputComponentProps,
  ref: React.ForwardedRef<HTMLInputElement>
) => {
  return (
    <div>
      <label>{label}</label>
      <input ref={ref} value={value} onChange={onChange} />
    </div>
  );
};

export default withMemoizationForwardRef(InputComponent, {
  componentName: 'InputComponent',
  trackRenders: true,
});
```

## Virtualized List

The `VirtualizedList` component renders only the items that are visible in the viewport, greatly improving performance for long lists.

### Basic Usage

```tsx
import { VirtualizedList } from '../optimized';

function ResourceList({ resources }) {
  return (
    <VirtualizedList
      items={resources}
      itemHeight={50}
      height={400}
      width="100%"
      renderItem={(resource, index, style) => (
        <div key={resource.id} style={style}>
          {resource.name}: {resource.amount}
        </div>
      )}
    />
  );
}
```

### Advanced Usage

```tsx
import { VirtualizedList } from '../optimized';

function ModuleList({ modules, isLoading, onModuleSelected }) {
  return (
    <VirtualizedList
      items={modules}
      itemHeight={80}
      height={600}
      width="100%"
      overscan={3}
      isLoading={isLoading}
      loadingPlaceholder={<CustomLoadingIndicator />}
      emptyPlaceholder={<div>No modules available</div>}
      onScroll={scrollTop => console.log('Scrolled to', scrollTop)}
      renderItem={(module, index, style) => (
        <div key={module.id} style={style} onClick={() => onModuleSelected(module.id)}>
          <ModuleCard module={module} />
        </div>
      )}
    />
  );
}
```

## Lazy-Loaded Components

These components use dynamic imports to load heavy visualization components only when needed.

### Usage

```tsx
import { LazyNetworkGraph, LazyResourceFlowDiagram, LazyMiniMap } from '../optimized';

function SystemOverview() {
  return (
    <div className="dashboard">
      <div className="panel">
        <h2>Resource Network</h2>
        <LazyResourceFlowDiagram
          resourceTypes={[ResourceType.ENERGY, ResourceType.MINERALS]}
          width={800}
          height={500}
        />
      </div>

      <div className="panel">
        <h2>Galaxy Map</h2>
        <LazyMiniMap
          stars={starSystems}
          viewport={currentViewport}
          onStarSelected={handleStarSelection}
        />
      </div>
    </div>
  );
}
```

## Performance Best Practices

1. **Use memoization** for components that render frequently or have expensive render logic
2. **Virtualize long lists** to avoid rendering off-screen items
3. **Lazy-load heavy components** that aren't immediately needed
4. **Use useCallback and useMemo** for functions and computed values that are used as props or dependencies
5. **Avoid anonymous functions** in render methods to prevent unnecessary re-renders
6. **Measure performance** using the built-in tracking in development mode
