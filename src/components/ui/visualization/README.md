# Virtualized UI Components

This directory contains virtualized UI components that optimize rendering performance for large datasets by only rendering what's visible in the viewport.

## VirtualizedList

The core virtualization component that efficiently renders long lists of items.

### Key Features

- Only renders items visible in the viewport plus a configurable buffer (overscan)
- Maintains proper scroll position and scrollbar dimensions
- Supports variable height items
- Provides loading and empty state placeholders
- Optimized for scrolling performance

### Basic Usage

```tsx
import { VirtualizedList } from '../virtualized';
import { Resource } from '../../../types/resources/ResourceTypes';

function ResourceList({ resources }: { resources: Resource[] }) {
  return (
    <VirtualizedList
      items={resources}
      itemHeight={60}
      height={400}
      width="100%"
      renderItem={(resource, index, style) => (
        <div key={resource.id} style={style} className="resource-item">
          <div className="resource-name">{resource.name}</div>
          <div className="resource-amount">{resource.amount}</div>
        </div>
      )}
    />
  );
}
```

### Advanced Usage

```tsx
import { useState } from 'react';
import { VirtualizedList } from '../virtualized';
import { Module } from '../../../types/modules/ModuleTypes';
import { ModuleCard } from '../modules/ModuleCard';
import { LoadingSpinner } from '../common/LoadingSpinner';

function ModuleList({ 
  modules, 
  isLoading, 
  onModuleSelect 
}: {
  modules: Module[];
  isLoading: boolean;
  onModuleSelect: (moduleId: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const handleModuleClick = (moduleId: string) => {
    setSelectedId(moduleId);
    onModuleSelect(moduleId);
  };
  
  return (
    <VirtualizedList
      items={modules}
      itemHeight={120}
      height={600}
      width="100%"
      overscan={3}
      isLoading={isLoading}
      loadingPlaceholder={<LoadingSpinner />}
      emptyPlaceholder={<div className="empty-state">No modules available</div>}
      onScroll={(scrollTop) => console.log('Scrolled to', scrollTop)}
      renderItem={(module, index, style) => (
        <div 
          key={module.id} 
          style={style}
          className={`module-item ${module.id === selectedId ? 'selected' : ''}`}
          onClick={() => handleModuleClick(module.id)}
        >
          <ModuleCard 
            module={module}
            isSelected={module.id === selectedId}
          />
        </div>
      )}
    />
  );
}
```

## Performance Tips

1. **Set an accurate itemHeight**: This is crucial for proper scrollbar sizing and positioning
2. **Keep item renders lightweight**: Each visible item is re-rendered during scrolling
3. **Memoize complex items**: Use React.memo for complex item components
4. **Use appropriate overscan**: Too low can cause flickering, too high reduces performance benefits
5. **Avoid layout changes**: Don't change the list dimensions frequently
6. **Use fixed height items**: Variable height requires more complex implementation

## Implementing a New Virtualized Component

If you need to create a virtualized component for a specific data structure:

1. Import the base VirtualizedList component
2. Wrap it with specific rendering logic for your data type
3. Handle unknown special interactions or styling
4. Export a memoized version of your component

Example:

```tsx
import { memo } from 'react';
import { VirtualizedList } from '../virtualized';
import { ResourceType } from '../../../types/resources/ResourceTypes';

interface ResourceItem {
  id: string;
  type: ResourceType;
  amount: number;
  capacity: number;
}

interface ResourceListProps {
  resources: ResourceItem[];
  height?: number;
  onResourceClick?: (resourceId: string) => void;
}

function ResourceVirtualizedList({ 
  resources, 
  height = 400, 
  onResourceClick 
}: ResourceListProps) {
  return (
    <VirtualizedList
      items={resources}
      itemHeight={60}
      height={height}
      renderItem={(resource, index, style) => (
        <div 
          key={resource.id} 
          style={style}
          className="resource-item"
          onClick={() => onResourceClick?.(resource.id)}
        >
          <div className="resource-name">{ResourceType[resource.type]}</div>
          <div className="resource-amount">
            {resource.amount} / {resource.capacity}
          </div>
          <div className="resource-bar">
            <div 
              className="resource-bar-fill" 
              style={{ width: `${(resource.amount / resource.capacity) * 100}%` }}
            />
          </div>
        </div>
      )}
    />
  );
}

export default memo(ResourceVirtualizedList);
``` 