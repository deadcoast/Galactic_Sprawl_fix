# System Architecture Diagrams

This document contains architectural diagrams for the complex systems in Galactic Sprawl, explaining how components interact and how data flows through the system.

## Table of Contents

1. [Resource Flow System](#resource-flow-system)
2. [Event System](#event-system)

## Resource Flow System

### Overview

The Resource Flow System handles the movement of resources between producers, consumers, storage facilities, and converters. The core of this system is the `ResourceFlowManager` which optimizes resource distribution based on priorities and availability.

```
┌──────────────────────────────────────────────────────────────────────┐
│                      Resource Flow System                             │
│                                                                      │
│   ┌──────────────┐          ┌──────────────┐      ┌──────────────┐   │
│   │   Producer   │          │   Storage    │      │   Consumer   │   │
│   │    Nodes     │───┐  ┌───│    Nodes     │──┐   │    Nodes     │   │
│   └──────────────┘   │  │   └──────────────┘  │   └──────────────┘   │
│                      │  │                     │                      │
│                      ▼  ▼                     ▼                      │
│                 ┌──────────────────────────────────┐                 │
│                 │                                  │                 │
│                 │      ResourceFlowManager         │                 │
│                 │                                  │                 │
│                 └──────────────────────────────────┘                 │
│                       │               ▲                              │
│                       │               │                              │
│                       ▼               │                              │
│                 ┌──────────────┐      │                              │
│                 │   Converter  │──────┘                              │
│                 │    Nodes     │                                     │
│                 └──────────────┘                                     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Relationships

#### ResourceFlowManager

The central component that coordinates all resource flows. It has the following responsibilities:

1. **Node Management**

   - Registers and unregisters resource nodes (producers, consumers, storage, converters)
   - Tracks node state and capabilities

2. **Connection Management**

   - Establishes connections between nodes
   - Controls flow rates between connected nodes

3. **Resource Optimization**

   - Calculates optimal flow distributions based on priorities
   - Identifies resource bottlenecks and underutilized resources
   - Applies efficiency modifiers for converter nodes

4. **Resource State Tracking**
   - Maintains current state of all resources in the system
   - Provides caching for efficient state retrieval

### Data Flow

```
┌────────────────┐    Register    ┌────────────────────────┐
│  Game Modules  │───────────────▶│                        │
└────────────────┘                │                        │
                                  │                        │
┌────────────────┐    Updates     │  ResourceFlowManager   │
│  User Actions  │───────────────▶│                        │
└────────────────┘                │                        │
                                  │                        │
┌────────────────┐    Query       │                        │
│  UI Components │◀──────────────▶└────────────────────────┘
└────────────────┘                           │
                                             │
                                             │ Optimization Cycle
                                             │
                                             ▼
                                  ┌────────────────────────┐
                                  │   Resource Transfers   │
                                  └────────────────────────┘
                                             │
                                             │
                                             ▼
                                  ┌────────────────────────┐
                                  │     Event Emission     │
                                  └────────────────────────┘
```

### Key Processes

#### Flow Optimization Process

1. Resource nodes register with the ResourceFlowManager
2. Connections are established between compatible nodes
3. The optimizeFlows method runs periodically (or on-demand) to:
   - Process converters to apply efficiency modifiers
   - Calculate resource availability from producers and storage
   - Calculate resource demand from consumers
   - Identify bottlenecks and underutilized resources
   - Optimize flow rates based on priorities and available resources
   - Generate transfer records for the optimized flows
4. UI components query the ResourceFlowManager for current state and flows
5. Events are emitted when significant changes occur (shortages, transfers, etc.)

#### Converter Node Processing

Converters are special nodes that can transform resources:

1. Each converter has an efficiency rating that affects resource production
2. When the flow optimization runs, converters are processed first
3. Output connections from converters have their rates modified by the efficiency factor
4. This enables both simple conversion (e.g., minerals to processed minerals) and complex chains

### Performance Considerations

The ResourceFlowManager includes several optimizations for performance:

1. **Batch Processing**

   - Processes large networks in batches to avoid blocking the main thread
   - The batch size is configurable based on network complexity

2. **Resource State Caching**

   - Caches resource states with configurable TTL (time-to-live)
   - Invalidates cache entries when states are updated

3. **Incremental Updates**

   - Updates only connections that have changed, not the entire network
   - Returns only the changes in the optimization result

4. **History Management**
   - Limits transfer history size to prevent memory issues
   - Provides filtered history queries for efficient access

## Event System

### Overview

The Event System provides a communication mechanism for modules without requiring direct dependencies. It consists of a core event bus (`ModuleEventBus`) and a React context provider (`EventDispatcherProvider`) that integrates the event system with the React component tree.

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Event System                                 │
│                                                                      │
│   ┌──────────────┐                          ┌──────────────────┐     │
│   │    Module    │                          │ React Components │     │
│   │    Events    │                          │                  │     │
│   └──────────────┘                          └──────────────────┘     │
│          │                                           │               │
│          │                                           │               │
│          ▼                                           ▼               │
│   ┌──────────────┐                          ┌──────────────────┐     │
│   │              │       References         │                  │     │
│   │ ModuleEventBus│◀─────────────────────────│EventDispatcher   │     │
│   │ (Singleton)   │                         │Context & Hooks    │     │
│   │              │                          │                  │     │
│   └──────────────┘                          └──────────────────┘     │
│          ▲                                           ▲               │
│          │                                           │               │
│          │                                           │               │
│   ┌──────────────┐                          ┌──────────────────┐     │
│   │  System      │                          │   UI Event       │     │
│   │  Components  │                          │   Handlers       │     │
│   └──────────────┘                          └──────────────────┘     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Relationships

#### ModuleEventBus

The core event bus that handles event subscription, emission, and history management:

1. **Event Subscription**

   - Manages listeners for different event types
   - Provides unsubscribe functions for cleanup

2. **Event Emission**

   - Distributes events to registered listeners
   - Adds events to history with size limiting

3. **Event History**
   - Maintains a history of all events
   - Provides filtered history queries (by module, type, etc.)

#### EventDispatcherProvider

A React context provider that integrates the ModuleEventBus with React components:

1. **React Integration**

   - Wraps the ModuleEventBus in a React context
   - Manages component lifecycle for subscriptions

2. **Event Hooks**
   - Provides hooks for easy event subscription
   - Tracks latest events by type
   - Offers filtered event access

### Data Flow

```
┌────────────────┐    Emit       ┌────────────────────────┐
│    Modules     │───────────────▶│                        │
└────────────────┘                │                        │
                                  │     ModuleEventBus     │
┌────────────────┐    Subscribe   │                        │
│    Listeners   │◀──────────────▶│                        │
└────────────────┘                └────────────────────────┘
                                             │
                                             │
                                             ▼
                                  ┌────────────────────────┐
                                  │      Event History     │
                                  └────────────────────────┘
                                             ▲
                                             │
┌────────────────┐    Queries     ┌────────────────────────┐
│  React Hooks   │◀──────────────▶│   EventDispatcher      │
└────────────────┘                │   (React Context)      │
                                  └────────────────────────┘
                                             ▲
                                             │
┌────────────────┐    Uses        ┌────────────────────────┐
│     UI         │───────────────▶│  useEventSubscription  │
│  Components    │                │  useLatestEvent        │
└────────────────┘                │  useFilteredEvents     │
                                  └────────────────────────┘
```

### Key Processes

#### Event Subscription and Emission

1. Components or modules subscribe to specific event types they're interested in
2. When an event occurs, the source emits it through the ModuleEventBus
3. The ModuleEventBus:
   - Adds the event to its history
   - Notifies all listeners for that event type
4. Listeners handle the event, potentially causing UI updates or state changes
5. React components use hooks to subscribe, with automatic cleanup on unmount

#### React Integration

The EventDispatcherProvider connects React components to the event system:

1. Initializes with the ModuleEventBus
2. Subscribes to all event types to track latest events
3. Provides hooks for components to easily:
   - Subscribe to events (`useEventSubscription`)
   - Access latest events (`useLatestEvent`)
   - Get filtered event sets (`useFilteredEvents`)
4. Manages subscription cleanup when components unmount

### Performance Considerations

The event system includes several optimizations for performance:

1. **Selective Subscription**

   - Components only subscribe to events they need
   - Events are only delivered to interested listeners

2. **History Size Limiting**

   - Event history is capped to prevent memory issues
   - History size is configurable based on application needs

3. **Filtered Queries**

   - Filtered history queries avoid processing irrelevant events
   - Latest events are tracked by type for instant access

4. **Error Isolation**

   - Errors in event listeners don't break the entire system
   - Each listener is called in a try/catch block

5. **Efficient React Integration**
   - React hooks follow best practices for dependency tracking
   - Only re-render when relevant events change
