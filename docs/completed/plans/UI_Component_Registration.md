# UI Component Registration System

## Overview

The UI Component Registration System provides a standardized way for React components to register themselves with the system, receive relevant events, and automatically update based on system state changes. This document outlines the design and implementation plan for this system.

## Design Goals

1. **Automated Event Subscription**: Allow components to automatically subscribe to relevant events based on their needs
2. **Type-Safe Registration**: Provide type-safe APIs for component registration and event handling
3. **Lifecycle Management**: Properly manage component lifecycle with automatic cleanup
4. **Performance Optimization**: Implement performance monitoring and optimization for UI updates
5. **Standardized Patterns**: Establish consistent patterns for component-system interaction

## Components

### 1. Component Registry Service

```typescript
// src/services/ComponentRegistryService.ts

export interface ComponentMetadata {
  id: string;
  type: string;
  eventSubscriptions: string[]; // Event types this component is interested in
  updatePriority: 'high' | 'medium' | 'low';
  lastUpdated?: number;
  renderCount?: number;
  averageRenderTime?: number;
}

export class ComponentRegistryService {
  private components: Map<string, ComponentMetadata> = new Map();
  private eventSubscriptions: Map<string, Set<string>> = new Map(); // Event type -> component IDs

  public registerComponent(metadata: ComponentMetadata): () => void {
    // Register component and set up event subscriptions
    // Return unregister function for cleanup
  }

  public getComponentsByEvent(eventType: string): ComponentMetadata[] {
    // Get all components that should be notified of a specific event
  }

  public updateComponentMetrics(id: string, renderTime: number): void {
    // Update component performance metrics
  }

  public getPerformanceReport(): Record<string, any> {
    // Generate performance report for all registered components
  }
}

// Singleton instance
export const componentRegistry = new ComponentRegistryService();
```

### 2. Component Registration Hook

```typescript
// src/hooks/ui/useComponentRegistration.ts

import { useEffect, useRef } from 'react';
import { componentRegistry, ComponentMetadata } from '../../services/ComponentRegistryService';
import { useComponentProfiler } from './useComponentProfiler';

export interface ComponentRegistrationOptions {
  type: string;
  eventSubscriptions: string[];
  updatePriority?: 'high' | 'medium' | 'low';
}

export function useComponentRegistration(options: ComponentRegistrationOptions): void {
  const componentId = useRef(
    `${options.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  ).current;
  const { onRender } = useComponentProfiler(componentId);

  useEffect(() => {
    // Register component with registry
    const unregister = componentRegistry.registerComponent({
      id: componentId,
      type: options.type,
      eventSubscriptions: options.eventSubscriptions,
      updatePriority: options.updatePriority || 'medium',
    });

    // Clean up on unmount
    return unregister;
  }, [componentId, options.type, options.updatePriority]);

  // Set up profiling to measure render times
  useEffect(() => {
    return () => {
      onRender(renderTime => {
        componentRegistry.updateComponentMetrics(componentId, renderTime);
      });
    };
  }, [componentId, onRender]);
}
```

### 3. Event Subscription System Integration

```typescript
// src/services/EventPropagationService.ts

import { moduleEventBus, ModuleEventType } from '../lib/modules/ModuleEvents';
import { componentRegistry } from './ComponentRegistryService';

export class EventPropagationService {
  private isInitialized = false;

  public initialize(): void {
    if (this.isInitialized) return;

    // Subscribe to all relevant event types
    const eventTypes = [
      'MODULE_CREATED',
      'MODULE_UPDATED',
      'RESOURCE_PRODUCED',
      'RESOURCE_CONSUMED',
      // ... other event types
    ] as ModuleEventType[];

    // Register for all events
    eventTypes.forEach(eventType => {
      moduleEventBus.subscribe(eventType, event => {
        this.propagateEvent(eventType, event);
      });
    });

    this.isInitialized = true;
  }

  private propagateEvent(eventType: string, eventData: any): void {
    // Get components that should receive this event
    const components = componentRegistry.getComponentsByEvent(eventType);

    // Sort by priority
    const sortedComponents = this.sortByPriority(components);

    // Notify each component (this would be implemented by context updates or direct callbacks)
    // Implementation depends on how components receive updates
  }

  private sortByPriority(components: ComponentMetadata[]): ComponentMetadata[] {
    const priorityMap = { high: 0, medium: 1, low: 2 };
    return [...components].sort(
      (a, b) => priorityMap[a.updatePriority] - priorityMap[b.updatePriority]
    );
  }
}

// Singleton instance
export const eventPropagation = new EventPropagationService();
```

### 4. Component Lifecycle Management

```typescript
// src/hooks/ui/useComponentLifecycle.ts

import { useEffect, useRef } from 'react';
import { moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';

export interface ComponentLifecycleOptions {
  onMount?: () => void;
  onUnmount?: () => void;
  eventSubscriptions?: Array<{
    eventType: ModuleEventType;
    handler: (event: any) => void;
  }>;
}

export function useComponentLifecycle(options: ComponentLifecycleOptions): void {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    // Call onMount callback if provided
    if (options.onMount) {
      options.onMount();
    }

    // Set up event subscriptions
    const unsubscribes: Array<() => void> = [];

    if (options.eventSubscriptions) {
      options.eventSubscriptions.forEach(subscription => {
        const unsubscribe = moduleEventBus.subscribe(subscription.eventType, event => {
          // Only call the handler if the component is still mounted
          if (isMounted.current) {
            subscription.handler(event);
          }
        });

        unsubscribes.push(unsubscribe);
      });
    }

    // Clean up on unmount
    return () => {
      isMounted.current = false;

      // Call onUnmount callback if provided
      if (options.onUnmount) {
        options.onUnmount();
      }

      // Unsubscribe from all events
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, []);
}
```

### 5. Performance Monitoring Integration

```typescript
// src/services/UIPerformanceMonitor.ts

import { componentRegistry } from './ComponentRegistryService';

export class UIPerformanceMonitor {
  private thresholds = {
    renderTime: 16, // ms, targeting 60fps
    renderCount: 10, // per minute
  };

  private interval: NodeJS.Timeout | null = null;

  public startMonitoring(intervalMs = 60000): void {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(() => {
      this.generatePerformanceReport();
    }, intervalMs);
  }

  public stopMonitoring(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private generatePerformanceReport(): void {
    const report = componentRegistry.getPerformanceReport();

    // Find problematic components
    const slowComponents = report.componentsExceedingRenderTime || [];
    const frequentUpdaters = report.componentsExceedingRenderCount || [];

    // Log performance issues in development
    if (process.env.NODE_ENV === 'development') {
      if (slowComponents.length > 0) {
        console.warn('Components with slow render times:', slowComponents);
      }

      if (frequentUpdaters.length > 0) {
        console.warn('Components with too frequent updates:', frequentUpdaters);
      }
    }

    // In production, could send to monitoring service
  }
}

// Singleton instance
export const uiPerformanceMonitor = new UIPerformanceMonitor();
```

## Implementation Plan

### Phase 1: Basic Implementation

1. Create the ComponentRegistryService
2. Implement useComponentRegistration hook
3. Create initial integration with EventPropagationService
4. Implement simple component lifecycle hook

### Phase 2: Advanced Features

1. Add performance monitoring integration
2. Implement priority-based updates
3. Add automatic event subscription based on component type
4. Create debugging tools for component registration

### Phase 3: Optimization

1. Implement batched updates for same-priority components
2. Add selective rendering based on event data
3. Optimize event propagation for large component trees
4. Implement performance reports and alerts

## Usage Example

```tsx
// src/components/ui/ResourceDisplay.tsx

import React, { useEffect, useState } from 'react';
import { useComponentRegistration } from '../../hooks/ui/useComponentRegistration';
import { useComponentLifecycle } from '../../hooks/ui/useComponentLifecycle';
import { moduleEventBus } from '../../lib/modules/ModuleEvents';

interface ResourceDisplayProps {
  resourceType: string;
}

export const ResourceDisplay: React.FC<ResourceDisplayProps> = ({ resourceType }) => {
  const [amount, setAmount] = useState(0);

  // Register component with registry
  useComponentRegistration({
    type: 'ResourceDisplay',
    eventSubscriptions: ['RESOURCE_PRODUCED', 'RESOURCE_CONSUMED', 'RESOURCE_TRANSFERRED'],
    updatePriority: 'high',
  });

  // Set up lifecycle and event handling
  useComponentLifecycle({
    eventSubscriptions: [
      {
        eventType: 'RESOURCE_PRODUCED',
        handler: event => {
          if (event.data.resourceType === resourceType) {
            setAmount(prev => prev + event.data.amount);
          }
        },
      },
      {
        eventType: 'RESOURCE_CONSUMED',
        handler: event => {
          if (event.data.resourceType === resourceType) {
            setAmount(prev => prev - event.data.amount);
          }
        },
      },
    ],
  });

  return (
    <div className="resource-display">
      <h3>{resourceType}</h3>
      <div className="amount">{amount}</div>
    </div>
  );
};
```

## Integration with Existing Architecture

This component registration system integrates with:

1. **Event System**: Leverages the existing ModuleEventBus for event propagation
2. **Context Providers**: Can update contexts based on events to trigger UI updates
3. **Manager Services**: Connects UI components to manager services through events
4. **Performance Monitoring**: Adds UI-specific performance metrics to the monitoring system

## Benefits

1. **Reduced Boilerplate**: Components automatically register for events they care about
2. **Improved Performance**: Monitoring identifies problematic components
3. **Better Debugging**: Registry provides insights into component state and behavior
4. **Consistent Patterns**: Standardized approach to component-system integration
5. **Memory Leak Prevention**: Automatic cleanup when components unmount
