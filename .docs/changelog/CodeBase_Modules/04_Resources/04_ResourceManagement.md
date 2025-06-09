# Resource Management System Documentation

## Overview

The Resource Management System is a comprehensive solution for handling game resources, including production, consumption, transfer, and optimization. It provides real-time monitoring, performance analysis, and automatic optimization strategies.

## Fix for TypeScript Error in MiningResourceIntegration.ts

The issue is that you're using a method `getNode()` on the `ResourceFlowManager` class, but this method doesn't exist in the class. However, the `getNodes()` method does exist.

To fix this issue, you need to add the missing `getNode()` method to the `ResourceFlowManager` class:

1. Open `src/managers/resource/ResourceFlowManager.ts`
2. Find the `getNodes()` method (around line 2305)
3. Add the following code just before the `getNodes()` method:

```typescript
  /**
   * Get node by ID
   * 
   * @param id The ID of the node to retrieve
   * @returns The flow node with the specified ID, or undefined if not found
   */
  public getNode(id: string): FlowNode | undefined {
    return this.network.nodes.get(id);
  }
```

This method will retrieve a single node by its ID, which is what your code in `MiningResourceIntegration.ts` is trying to do.

Alternatively, as a temporary fix, you can modify the two places in `MiningResourceIntegration.ts` to use the existing `getNodes()` method and filter the results:

```typescript
// Instead of:
const node = this.flowManager.getNode(`mining-ship-${ship.id}`);

// Use:
const node = this.flowManager.getNodes().find(n => n.id === `mining-ship-${ship.id}`);
```

However, adding the `getNode()` method to `ResourceFlowManager` would be a more efficient and cleaner solution. 

## Core Components

### ResourceManager

The main class responsible for managing all resource-related operations.

#### Key Features

- Resource state tracking
- Production and consumption management
- Resource transfer handling
- Automatic optimization
- Performance monitoring
- Error handling and validation

#### Basic Usage

```typescript
import { resourceManager } from '../managers/resource/ResourceManager';

// Get resource amount
const minerals = resourceManager.getResourceAmount('minerals');

// Add resources
resourceManager.addResource('energy', 100);

// Set production rate
resourceManager.setResourceProduction('minerals', 10);

// Register production
resourceManager.registerProduction('miner-1', {
  type: 'minerals',
  amount: 10,
  interval: 1000,
  conditions: [{ type: 'energy', min: 0.2 }],
});

// Register consumption
resourceManager.registerConsumption('factory-1', {
  type: 'minerals',
  amount: 5,
  interval: 2000,
  required: true,
});

// Set up resource flow
resourceManager.registerFlow('storage-transfer', {
  source: 'mine',
  target: 'storage',
  resources: [{ type: 'minerals', amount: 10, interval: 5000 }],
});
```

### Resource Optimization

The system includes automatic optimization strategies:

1. **Production Optimization**

   - Balances production rates based on demand
   - Maintains optimal buffer levels
   - Adjusts to consumption patterns

2. **Consumption Optimization**

   - Reduces resource waste
   - Prioritizes critical consumers
   - Adjusts consumption rates based on availability

3. **Transfer Optimization**
   - Optimizes resource distribution
   - Adjusts transfer intervals based on demand
   - Prevents bottlenecks

#### Example: Optimization Usage

```typescript
// Get optimization metrics
const metrics = resourceManager.getOptimizationMetrics();

// Check specific resource performance
const mineralMetrics = resourceManager.getPerformanceMetrics('minerals');

// Get overall performance snapshot
const snapshot = resourceManager.getPerformanceSnapshot();
```

### Performance Monitoring

The ResourcePerformanceMonitor provides detailed insights into resource management efficiency:

- Resource utilization rates
- Production/consumption balance
- Transfer efficiency
- System bottlenecks
- Optimization recommendations

#### Example: Performance Monitoring

```typescript
import { resourcePerformanceMonitor } from '../managers/resource/ResourcePerformanceMonitor';

// Get resource history
const history = resourcePerformanceMonitor.getResourceHistory('minerals');

// Get latest performance snapshot
const snapshot = resourcePerformanceMonitor.getLatestSnapshot();
console.log(`System Load: ${snapshot.systemLoad * 100}%`);
console.log('Bottlenecks:', snapshot.bottlenecks);
console.log('Recommendations:', snapshot.recommendations);
```

## Configuration

The system uses several configuration objects:

### Resource Thresholds

```typescript
RESOURCE_THRESHOLDS: {
  LOW: 0.2,    // 20% capacity
  HIGH: 0.8,   // 80% capacity
  CRITICAL: 0.1 // 10% capacity
}
```

### Production Intervals

```typescript
PRODUCTION_INTERVALS: {
  FAST: 1000,    // 1 second
  NORMAL: 2000,  // 2 seconds
  SLOW: 5000     // 5 seconds
}
```

### Transfer Configuration

```typescript
TRANSFER_CONFIG: {
  MIN_AMOUNT: 1,
  MAX_BATCH_SIZE: 100,
  DEFAULT_INTERVAL: 2000,
  TRANSFER_RATE_MULTIPLIER: 1.5
}
```

## Best Practices

1. **Resource Registration**

   - Always register productions and consumptions with appropriate intervals
   - Set realistic thresholds for resource flows
   - Use conditions to prevent resource waste

2. **Error Handling**

   - Check return values from transfer operations
   - Monitor error events for failed operations
   - Handle resource shortages appropriately

3. **Performance Optimization**

   - Monitor performance metrics regularly
   - Address bottlenecks promptly
   - Follow optimization recommendations

4. **Cleanup**
   - Always clean up when shutting down systems
   - Unregister productions and consumptions when no longer needed
   - Clear flows that are no longer active

## Event System

The resource management system emits various events:

- `RESOURCE_PRODUCED`
- `RESOURCE_CONSUMED`
- `RESOURCE_TRANSFERRED`
- `RESOURCE_SHORTAGE`
- `STATUS_CHANGED`

### Example: Event Handling

```typescript
moduleEventBus.on('RESOURCE_SHORTAGE', event => {
  const { resourceType, required, available } = event.data;
  console.log(`Resource shortage: ${resourceType}, needs ${required}, has ${available}`);
});
```

## Troubleshooting

Common issues and solutions:

1. **Resource Shortages**

   - Check production rates
   - Verify consumption requirements
   - Look for bottlenecks in transfer system

2. **Performance Issues**

   - Monitor system load
   - Check for resource bottlenecks
   - Optimize transfer intervals

3. **Transfer Problems**
   - Verify source/target existence
   - Check transfer configurations
   - Monitor error events

## API Reference

See the following interfaces for detailed API information:

- `ResourceManager`
- `ResourcePerformanceMonitor`
- `ResourceType`
- `ResourceState`
- `ResourceTransfer`
- `ResourceProduction`
- `ResourceConsumption`
- `ResourceFlow`
- `PerformanceMetrics`
- `ResourcePerformanceSnapshot`
