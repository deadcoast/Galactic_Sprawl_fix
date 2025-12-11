# Performance Considerations for Critical Paths

This document provides detailed information about performance considerations for critical paths in the Galactic Sprawl codebase. It focuses on identifying potential bottlenecks and the optimization techniques implemented to address them.

## Table of Contents

1. [Resource Flow Optimization](#resource-flow-optimization)
2. [Event Processing](#event-processing)
3. [React Component Rendering](#react-component-rendering)
4. [Performance Monitoring](#performance-monitoring)

## Resource Flow Optimization

The resource flow optimization process, implemented in the `optimizeFlows` method of `ResourceFlowManager`, is one of the most computationally intensive operations in the game. It handles the calculation and distribution of resources across the entire network of producers, consumers, storage nodes, and converters.

### Critical Path: ResourceFlowManager.optimizeFlows

#### Complexity Analysis

The time complexity of the optimization process depends on several factors:

- **N**: Number of nodes in the network
- **C**: Number of connections between nodes
- **R**: Number of different resource types
- **P**: Number of priority levels

In the worst case, the time complexity approaches:

- O(N + C × log(P) + R × C)

Where:

- Node processing is linear (O(N))
- Connection priority sorting is O(C × log(P))
- Resource distribution calculation is O(R × C)

For large networks with many connections, this operation can become a performance bottleneck.

#### Implemented Optimizations

1. **Throttled Execution**

   ```typescript
   // Skip optimization if not enough time has passed
   if (startTime - this.lastOptimization < this.optimizationInterval) {
     return {
       transfers: [],
       updatedConnections: [],
       bottlenecks: [],
       underutilized: [],
       performanceMetrics: {
         executionTimeMs: 0,
         nodesProcessed: 0,
         connectionsProcessed: 0,
         transfersGenerated: 0,
       },
     };
   }
   ```

   - The optimization only runs after a configurable interval has passed
   - Prevents excessive CPU usage from frequent optimization calls
   - Default interval: 5000ms (configurable in constructor)

2. **Batch Processing**

   ```typescript
   // Process converters in batches if there are many
   const batchCount = Math.ceil(converters.length / this.batchSize);

   for (let i = 0; i < batchCount; i++) {
     const batchStart = i * this.batchSize;
     const batchEnd = Math.min((i + 1) * this.batchSize, converters.length);
     const converterBatch = converters.slice(batchStart, batchEnd);
     // Process batch
   }
   ```

   - Large networks are processed in configurable batch sizes
   - Prevents blocking the main thread for too long
   - Applies to converter processing, resource balance calculation, and flow rate optimization
   - Default batch size: 100 nodes/connections (configurable in constructor)

3. **Active Node Filtering**

   ```typescript
   // Get active nodes and connections
   const activeNodes = Array.from(this.network.nodes.values()).filter(
     (node) => node.active,
   );
   const activeConnections = Array.from(
     this.network.connections.values(),
   ).filter((conn) => conn.active);
   ```

   - Only active nodes and connections are processed
   - Inactive nodes are skipped entirely, reducing computation time
   - Allows for dynamic network optimization by activating/deactivating parts of the network

4. **Resource State Caching**

   ```typescript
   public getResourceState(type: ResourceType): ResourceState | undefined {
     const now = Date.now();

     // Check cache first
     const cacheEntry = this.resourceCache.get(type);
     if (cacheEntry && now < cacheEntry.expiresAt) {
       return cacheEntry.state;
     }

     // Cache miss or expired, get from network
     const state = this.network.resourceStates.get(type);

     // Update cache if state exists
     if (state) {
       this.resourceCache.set(type, {
         state,
         lastUpdated: now,
         expiresAt: now + this.cacheTTL,
       });
     }

     return state;
   }
   ```

   - Resource states are cached with a configurable TTL
   - Reduces repeated calculations for frequent state queries
   - Cache is invalidated when states are updated
   - Default cache TTL: 2000ms (configurable in constructor)

5. **Priority-Based Processing**

   ```typescript
   // Sort connections by priority
   const sortedConnections = connections.sort((a, b) => {
     const priorityA = a.priority.priority || 0;
     const priorityB = b.priority.priority || 0;
     return priorityB - priorityA; // Higher priority first
   });
   ```

   - Connections are processed in priority order
   - Ensures critical resources are handled first
   - Enables graceful degradation when resources are limited

6. **Incremental Updates**

   ```typescript
   return {
     transfers,
     updatedConnections, // Only connections that changed
     bottlenecks,
     underutilized,
     performanceMetrics: {
       executionTimeMs,
       nodesProcessed,
       connectionsProcessed,
       transfersGenerated,
     },
   };
   ```

   - Only returns connections that actually changed
   - Reduces the work needed for consumers to update their state
   - Includes performance metrics for monitoring

7. **Performance Metrics Collection**

   ```typescript
   const startTime = Date.now();
   // ... perform optimization ...
   const endTime = Date.now();
   const executionTimeMs = endTime - startTime;
   ```

   - All operations are timed
   - Node and connection processing counts are tracked
   - Metrics are included in the result for monitoring and debugging

### Optimization Recommendations

1. **Web Worker Offloading**
   - For extremely large networks (>1000 nodes), consider offloading optimization to a Web Worker
   - This prevents blocking the main thread during complex calculations
   - Implementation would require serialization of network state

2. **Spatial Partitioning**
   - For geographically distributed networks, implement spatial partitioning
   - Only optimize connections within relevant partitions
   - Reduces the effective network size for each optimization pass

3. **Asynchronous Processing**
   - Convert the optimization process to use async/await
   - Break up long-running operations with await setTimeout(0)
   - Allows the main thread to handle other tasks between batches

4. **Predictive Optimization**
   - Implement resource flow prediction based on current trends
   - Only perform full optimization when predictions significantly diverge from actual values
   - Can reduce optimization frequency for stable networks

## Event Processing

The event system is another critical path, especially when many events are emitted in a short period.

### Critical Path: ModuleEventBus.emit

#### Complexity Analysis

The time complexity for event emission depends on:

- **L**: Number of listeners for a specific event type
- **H**: Size of the event history

For each event emission, the complexity is O(L + min(1, H/maxHistorySize)), where:

- Notifying listeners is O(L)
- History management (add + potential removal) is O(min(1, H/maxHistorySize))

#### Implemented Optimizations

1. **Selective Event Delivery**
   - Events are only delivered to subscribed listeners
   - Listeners are stored in type-specific Sets for O(1) lookup

2. **History Size Limiting**
   - Event history is capped at a configurable maximum size
   - Oldest events are removed when the limit is reached
   - Prevents unbounded memory growth

3. **Error Isolation**
   - Errors in one listener don't prevent other listeners from receiving events
   - Each listener is called within a try/catch block

4. **Event Filtering**
   - The API supports retrieving filtered event history
   - Filters are applied after retrieval to leverage V8 optimizations

### Optimization Recommendations

1. **Event Batching**
   - For high-frequency events, implement event batching
   - Collect events for a short period (e.g., 16ms) before processing
   - Reduces listener invocation overhead

2. **Listener Throttling**
   - Add support for throttled listeners that only receive events at a maximum frequency
   - Useful for UI updates that don't need to reflect every event

3. **History Indexing**
   - Implement indexing for common query patterns (moduleId, type)
   - Speeds up filtered history retrieval for large history sizes

## React Component Rendering

React component rendering, particularly for complex UI elements that display resource networks, can become a bottleneck.

### Critical Path: ResourceVisualization Component

#### Complexity Analysis

The rendering complexity depends on:

- **N**: Number of resource nodes displayed
- **C**: Number of connections between nodes
- **E**: Number of effects/animations active

The render complexity approaches O(N + C + E) in the worst case.

#### Implemented Optimizations

1. **Memoization**

   ```typescript
   const MemoizedResourceNode = React.memo(ResourceNode);
   ```

   - Components are memoized to prevent unnecessary re-renders
   - Only re-renders when props actually change

2. **Virtual Rendering**
   - Only visible nodes and connections are fully rendered
   - Off-screen elements are simplified or not rendered

3. **Throttled Updates**
   - UI updates from high-frequency events are throttled
   - Prevents excessive re-rendering during rapid state changes

### Optimization Recommendations

1. **Canvas Rendering**
   - For very large networks (>100 visible nodes), consider switching to Canvas rendering
   - Reduces DOM node count and improves rendering performance

2. **Visibility-Based Optimization**
   - Implement progressive detail levels based on zoom level
   - Show less detail for distant or numerous nodes

3. **Worker-Based Layout Calculation**
   - Offload complex layout calculations to a Web Worker
   - Only update the DOM with the final positions

## Performance Monitoring

Effective performance monitoring is essential for identifying bottlenecks and validating optimizations.

### Implemented Monitoring

1. **Execution Time Tracking**
   - Critical operations track and report execution time
   - Included in operation results for logging and analysis

2. **Operation Metrics**
   - Node and connection processing counts are tracked
   - Transfer generation and other key metrics are recorded

3. **Benchmark Suite**
   - Dedicated benchmarks for critical systems
   - Tests different network sizes and configurations

### Recommended Enhancements

1. **Real-Time Performance Dashboard**
   - Implement a developer-focused performance dashboard
   - Show real-time metrics for critical paths
   - Support filtering and historical comparison

2. **Automated Performance Regression Testing**
   - Add performance tests to the CI pipeline
   - Alert on significant performance regressions

3. **User-Focused Performance Metrics**
   - Collect performance metrics from real users
   - Identify common bottlenecks in production environments
   - Prioritize optimizations based on actual impact
