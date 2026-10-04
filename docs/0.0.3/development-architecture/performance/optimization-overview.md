# D3 Visualization Performance Optimization Documentation

This document provides comprehensive documentation for the performance optimization components implemented in the Galactic Sprawl project. It includes usage examples, implementation patterns, and best practices for each optimization technique.

## Table of Contents

1. [Animation Frame Management](#animation-frame-management)
2. [Batched Updates](#batched-updates)
3. [Interpolation Caching](#interpolation-caching)
4. [Animation Quality Management](#animation-quality-management)
5. [Performance Profiling](#performance-profiling)
6. [Integration Patterns](#integration-patterns)
7. [Troubleshooting](#troubleshooting)

## Animation Frame Management

The `D3AnimationFrameManager` provides a centralized system for efficiently coordinating multiple animations in a single request animation frame loop.

### Key Features

- **Priority-based scheduling**: Essential animations run first, background animations run when time allows
- **Frame budget management**: Prevents long-running animations from causing frame drops
- **Visibility tracking**: Pauses animations when they're not visible to save resources
- **Animation synchronization**: Coordinates related animations to run in sync

### Usage Example

```typescript
import { animationFrameManager } from '../utils/performance/D3AnimationFrameManager';

// Register an animation
animationFrameManager.registerAnimation(
  {
    id: 'network-visualization',
    name: 'Network Visualization',
    priority: 'high',
    type: 'simulation',
    duration: 0, // Run indefinitely
    loop: true,
    runWhenHidden: false,
    frameTimeBudget: 10, // Maximum 10ms per frame
    enableProfiling: true,
  },
  (elapsed, deltaTime, frameInfo) => {
    // Animation logic here
    simulation.tick();
    updateNodes();
    updateLinks();

    // Check if over budget and distribute work if needed
    if (frameInfo.isFrameOverBudget) {
      // Only perform critical updates
      return false; // Continue running
    }

    return false; // Return true to complete the animation
  }
);

// Start the animation
animationFrameManager.startAnimation('network-visualization');

// Pause the animation
animationFrameManager.pauseAnimation('network-visualization');

// Resume the animation
animationFrameManager.resumeAnimation('network-visualization');

// Stop the animation
animationFrameManager.stopAnimation('network-visualization');
```

### Best Practices

1. **Use appropriate priorities**:

   - `critical`: Essential UI animations that must run smoothly
   - `high`: Primary visualizations that are the main focus
   - `medium`: Secondary visualizations or effects
   - `low`: Background effects or non-essential animations
   - `background`: Computations that can be spread across multiple frames

2. **Handle over-budget situations**:

   ```typescript
   if (frameInfo.isFrameOverBudget) {
     // Perform only critical updates
     updateVisibleNodesOnly();
     return false;
   }
   ```

3. **Implement progressive rendering**:

   ```typescript
   // Split work across frames based on remaining budget
   const nodesToUpdate = Math.floor(
     nodes.length * (frameInfo.remainingFrameBudget / animation.config.frameTimeBudget)
   );
   updateNodes(nodes.slice(0, nodesToUpdate));
   ```

4. **Use synchronization for related animations**:

   ```typescript
   // Register related animations with the same sync group
   animationFrameManager.registerAnimation(
     {
       id: 'nodes-animation',
       syncGroup: 'network-view',
       // other config...
     },
     nodeAnimationCallback
   );

   animationFrameManager.registerAnimation(
     {
       id: 'links-animation',
       syncGroup: 'network-view',
       // other config...
     },
     linkAnimationCallback
   );
   ```

## Batched Updates

The `D3BatchedUpdates` system prevents layout thrashing by batching DOM read and write operations.

### Key Features

- **Read/write separation**: Prevents interleaved reads and writes that cause layout thrashing
- **Operation batching**: Groups similar operations to minimize layout recalculations
- **Priority-based execution**: Critical updates run first, optional updates run if time allows
- **Operation deduplication**: Prevents redundant operations on the same elements

### Usage Example

```typescript
import { batchedUpdates } from '../utils/performance/D3BatchedUpdates';

// Schedule read operations first
batchedUpdates.read('node-positions', () => {
  // Read node positions from the DOM
  const nodePositions = nodes.map(node => {
    const element = document.getElementById(`node-${node.id}`);
    return {
      id: node.id,
      rect: element.getBoundingClientRect(),
    };
  });

  // Store for use in write operations
  return nodePositions;
});

// Schedule write operations that depend on reads
batchedUpdates.write('update-links', readResults => {
  const nodePositions = readResults.get('node-positions');

  // Update link positions based on node positions
  links.forEach(link => {
    const source = nodePositions.find(p => p.id === link.source.id);
    const target = nodePositions.find(p => p.id === link.target.id);

    // Update link position
    const linkElement = document.getElementById(`link-${link.id}`);
    linkElement.setAttribute('x1', source.rect.x + source.rect.width / 2);
    linkElement.setAttribute('y1', source.rect.y + source.rect.height / 2);
    linkElement.setAttribute('x2', target.rect.x + target.rect.width / 2);
    linkElement.setAttribute('y2', target.rect.y + target.rect.height / 2);
  });
});

// Flush updates immediately if needed
batchedUpdates.flush();
```

### Best Practices

1. **Always read before write**:

   ```typescript
   // BAD - causes layout thrashing
   nodes.forEach(node => {
     const rect = node.getBoundingClientRect(); // Read
     updateNodePosition(node, rect); // Write
   });

   // GOOD - separates reads and writes
   const rects = nodes.map(node => ({
     node,
     rect: node.getBoundingClientRect(),
   }));

   rects.forEach(({ node, rect }) => {
     updateNodePosition(node, rect);
   });
   ```

2. **Use operation IDs to deduplicate operations**:

   ```typescript
   // This will only run once even if called multiple times in the same frame
   batchedUpdates.write('update-node-color', () => {
     updateNodeColors();
   });
   ```

3. **Prioritize operations**:

   ```typescript
   batchedUpdates.write(
     'update-visible-elements',
     () => {
       // Update only visible elements
     },
     { priority: 'high' }
   );

   batchedUpdates.write(
     'update-offscreen-elements',
     () => {
       // Update elements that are currently off-screen
     },
     { priority: 'low' }
   );
   ```

## Interpolation Caching

The `D3InterpolationCache` provides sophisticated caching for interpolation values to improve performance of animations.

### Key Features

- **LRU caching**: Automatically evicts least recently used values when cache is full
- **Adaptive caching**: Adjusts to usage patterns for optimal memory usage
- **Statistics tracking**: Monitors hit rates and optimization opportunities
- **Multi-level caching**: Different cache strategies for different interpolation types

### Usage Example

```typescript
import { interpolationCache } from '../utils/performance/D3InterpolationCache';

// Create a cached interpolator
const cachedInterpolate = interpolationCache.createCachedInterpolator(d3.interpolateRgb, {
  keyFn: (a, b) => `${a}-${b}`, // Function to generate cache keys
  maxSize: 100, // Maximum cache size
  statsTracking: true, // Enable performance stats
});

// Use the cached interpolator instead of d3.interpolateRgb
const colorInterpolator = cachedInterpolate('red', 'blue');
elements.forEach((el, i) => {
  const t = i / elements.length;
  el.style.fill = colorInterpolator(t);
});

// Get cache statistics
const stats = interpolationCache.getStats();
console.log(`Cache hit rate: ${stats.hitRate}%`);
```

### Best Practices

1. **Cache frequently used interpolations**:

   ```typescript
   // Create cached versions of common interpolators
   const cachedNumberInterpolator = interpolationCache.createCachedInterpolator(
     d3.interpolateNumber
   );
   const cachedColorInterpolator = interpolationCache.createCachedInterpolator(d3.interpolateRgb);
   ```

2. **Use appropriate key functions**:

   ```typescript
   // For simple values
   const keyFn = (a, b) => `${a}-${b}`;

   // For objects, create a stable key based on important properties
   const objectKeyFn = (objA, objB) => {
     return `${objA.id}-${objA.value}-${objB.id}-${objB.value}`;
   };
   ```

3. **Pre-compute interpolations for common ranges**:
   ```typescript
   // Pre-compute and cache a color scale
   const colorScale = d3.scaleSequential(d3.interpolateViridis);
   interpolationCache.preCacheRange(colorScale, 0, 1, 0.1); // Cache at 0.1 intervals
   ```

## Animation Quality Management

The `D3AnimationQualityManager` automatically adjusts animation complexity based on device capabilities.

### Key Features

- **Device capability detection**: Determines what the current device can handle
- **Quality tier presets**: Predefined settings for different device capabilities
- **Dynamic adjustment**: Adapts in real-time based on performance metrics
- **User preference overrides**: Allows users to choose quality levels

### Usage Example

```typescript
import { qualityManager } from '../utils/performance/D3AnimationQualityManager';

// Initialize with default settings
qualityManager.initialize();

// Get current quality settings
const qualitySettings = qualityManager.getQualitySettings();

// Apply quality settings to a visualization
const nodeCount =
  qualitySettings.maxVisibleElements > 0
    ? Math.min(data.length, qualitySettings.maxVisibleElements)
    : data.length;

const nodeSizeCalculator = qualitySettings.adaptiveDetail
  ? calculateDetailedNodeSize
  : calculateSimpleNodeSize;

// Apply animation settings
const useTransitions = qualitySettings.enableAnimations;
const transitionDuration = qualitySettings.animationDuration;

// Use the highest detail settings only when appropriate
if (qualitySettings.highDetail) {
  enableShadowEffects();
  useHighResolutionTextures();
}
```

### Quality Tiers

```typescript
// Different quality presets
export interface QualitySettings {
  // Maximum visible elements to render
  maxVisibleElements: number;
  // Whether to enable animations
  enableAnimations: boolean;
  // Animation duration in ms
  animationDuration: number;
  // Whether to use high-detail rendering
  highDetail: boolean;
  // Use adaptive level of detail based on zoom level
  adaptiveDetail: boolean;
  // Frame rate target
  targetFrameRate: number;
  // Anti-aliasing level
  antiAliasing: 'none' | 'low' | 'medium' | 'high';
  // Enable custom filters and effects
  enableEffects: boolean;
}

// Example presets
const LOW_QUALITY: QualitySettings = {
  maxVisibleElements: 100,
  enableAnimations: false,
  animationDuration: 0,
  highDetail: false,
  adaptiveDetail: false,
  targetFrameRate: 30,
  antiAliasing: 'none',
  enableEffects: false,
};

const MEDIUM_QUALITY: QualitySettings = {
  maxVisibleElements: 500,
  enableAnimations: true,
  animationDuration: 250,
  highDetail: false,
  adaptiveDetail: true,
  targetFrameRate: 45,
  antiAliasing: 'low',
  enableEffects: false,
};

const HIGH_QUALITY: QualitySettings = {
  maxVisibleElements: 2000,
  enableAnimations: true,
  animationDuration: 500,
  highDetail: true,
  adaptiveDetail: true,
  targetFrameRate: 60,
  antiAliasing: 'high',
  enableEffects: true,
};
```

### Best Practices

1. **Check capabilities before enabling complex features**:

   ```typescript
   if (qualitySettings.highDetail) {
     // Add additional visual effects
     addBlurEffects();
     renderShadows();
   } else {
     // Use simplified rendering
     useBasicRendering();
   }
   ```

2. **Implement adaptive level of detail**:

   ```typescript
   const calculateNodeSize = (data, index) => {
     if (qualitySettings.adaptiveDetail) {
       // More complex size calculation based on multiple factors
       return calculateDetailedSize(data, zoom.scale());
     } else {
       // Simple fixed sizes
       return data.value > threshold ? 8 : 4;
     }
   };
   ```

3. **Adapt animation complexity**:

   ```typescript
   const transition = d3
     .select(this)
     .transition()
     .duration(qualitySettings.enableAnimations ? qualitySettings.animationDuration : 0);

   if (qualitySettings.enableEffects) {
     transition.ease(d3.easeCubicInOut);
   } else {
     transition.ease(d3.easeLinear);
   }
   ```

## Performance Profiling

The `D3PerformanceProfiler` and `D3AnimationProfiler` provide tools for measuring and analyzing performance.

### Key Features

- **Frame rate tracking**: Monitors FPS during animations
- **Bottleneck detection**: Identifies performance bottlenecks
- **Performance reports**: Generates detailed performance analysis
- **Optimization recommendations**: Suggests improvements based on profiling results

### Usage Example

```typescript
import { createAnimationProfiler } from '../utils/performance/D3AnimationProfiler';

// Create a profiler for a specific animation
const profiler = createAnimationProfiler({
  targetFps: 60,
  detailedMetrics: true,
  trackDomUpdates: true,
  trackInterpolation: true,
  onComplete: report => {
    console.log(`Performance Score: ${report.performanceScore}/100`);
    console.log(`Bottlenecks detected: ${report.bottlenecks.length}`);
    console.log(`Recommendations: ${report.recommendations.join('\n')}`);
  },
});

// Start profiling
profiler.start('network-animation', 'Network Visualization');

// Record frame metrics during animation
function animationFrame() {
  // Record a frame
  profiler.recordFrame({
    domUpdateCount: updatedElements.length,
    interpolationCount: activeInterpolators,
  });

  // Record DOM updates
  profiler.recordDomUpdates(10, 5.2); // 10 elements updated in 5.2ms

  // Record interpolation performance
  profiler.recordInterpolation(50, 3.7); // 50 interpolations in 3.7ms
}

// Stop profiling and generate report
setTimeout(() => {
  profiler.stop();
  const report = profiler.generateReport();

  // Use report to optimize
  if (report.performanceScore < 70) {
    report.recommendations.forEach(recommendation => {
      console.log(`Optimization needed: ${recommendation}`);
    });
  }
}, 5000);
```

### Performance Metrics

```typescript
interface AnimationPerformanceReport {
  // Overall performance score (0-100)
  performanceScore: number;

  // Performance data
  performanceData: {
    // Average FPS achieved
    actualFps: number;
    // Target FPS
    targetFps: number;
    // Average frame duration
    averageFrameDuration: number;
    // Number of frames that missed target
    droppedFrames: number;
    // Frame success rate (%)
    frameSuccessRate: number;
  };

  // Identified bottlenecks
  bottlenecks: Array<{
    // Type of bottleneck
    type: 'interpolation' | 'dom_updates' | 'javascript' | 'rendering';
    // How severe the bottleneck is (0-1)
    severity: number;
    // Description of the bottleneck
    description: string;
    // Suggested fix
    suggestion: string;
  }>;

  // Specific recommendations
  recommendations: string[];
}
```

### Best Practices

1. **Profile in various scenarios**:

   ```typescript
   // Profile with different data sizes
   ['small', 'medium', 'large'].forEach(size => {
     profiler.start(`network-${size}`);
     renderVisualization(getDataset(size));
     setTimeout(() => profiler.stop(), 3000);
   });
   ```

2. **Track specific operations**:

   ```typescript
   // Measure specific operations
   const startTime = performance.now();
   simulationTick();
   const endTime = performance.now();

   profiler.recordCustomTiming('simulation-tick', endTime - startTime);
   ```

3. **Use performance data to implement adaptive optimizations**:
   ```typescript
   function optimizeBasedOnPerformance(report) {
     if (report.performanceScore < 50) {
       // Apply aggressive optimizations
       qualityManager.setQualityPreset('low');
     } else if (report.performanceScore < 80) {
       qualityManager.setQualityPreset('medium');
     } else {
       qualityManager.setQualityPreset('high');
     }
   }
   ```

## Integration Patterns

This section provides guidance on integrating multiple optimization techniques together.

### Combined Optimization Strategy

```typescript
import { animationFrameManager } from '../utils/performance/D3AnimationFrameManager';
import { batchedUpdates } from '../utils/performance/D3BatchedUpdates';
import { interpolationCache } from '../utils/performance/D3InterpolationCache';
import { qualityManager } from '../utils/performance/D3AnimationQualityManager';
import { createAnimationProfiler } from '../utils/performance/D3AnimationProfiler';

// Initialize core systems
qualityManager.initialize();
const qualitySettings = qualityManager.getQualitySettings();

// Create profiler
const profiler = createAnimationProfiler();
profiler.start('integrated-visualization');

// Create cached interpolators
const cachedColorInterpolator = interpolationCache.createCachedInterpolator(d3.interpolateRgb);

// Register animation with the frame manager
animationFrameManager.registerAnimation(
  {
    id: 'visualization-main',
    name: 'Main Visualization',
    priority: 'high',
    frameTimeBudget: 10,
    enableProfiling: true,
  },
  (elapsed, deltaTime, frameInfo) => {
    // Record frame start
    profiler.recordFrame();

    // Schedule reads
    batchedUpdates.read('node-positions', () => {
      // Read node positions
      return { positions: readNodePositions() };
    });

    // Schedule writes based on quality settings
    batchedUpdates.write(
      'update-nodes',
      reads => {
        const { positions } = reads.get('node-positions');

        // Adapt rendering based on quality
        const nodeLimit =
          qualitySettings.maxVisibleElements > 0
            ? Math.min(nodes.length, qualitySettings.maxVisibleElements)
            : nodes.length;

        // Use cached interpolator for colors
        nodes.slice(0, nodeLimit).forEach(node => {
          node.color = cachedColorInterpolator(node.value, node.category)(0.5);
          updateNodeVisual(node, positions);
        });
      },
      { priority: 'high' }
    );

    // Add additional detail only if quality permits
    if (qualitySettings.highDetail && !frameInfo.isFrameOverBudget) {
      batchedUpdates.write(
        'node-details',
        () => {
          renderNodeDetails();
        },
        { priority: 'low' }
      );
    }

    return false; // Continue animation
  }
);

// Start the optimized animation
animationFrameManager.startAnimation('visualization-main');

// Periodically report performance
setInterval(() => {
  const report = profiler.generateReport();

  // Adapt quality based on performance
  if (report.performanceScore < 70) {
    qualityManager.decreaseQuality();
  } else if (report.performanceScore > 90 && report.frameSuccessRate > 95) {
    qualityManager.increaseQuality();
  }
}, 5000);
```

### Best Practices for Integrated Optimizations

1. **Layer optimizations in the right order**:

   - Quality settings should be determined first
   - Frame management controls the animation loop
   - Batched updates organize DOM operations
   - Caching reduces computation within each frame

2. **Implement progressive optimization**:

   ```typescript
   // Apply increasingly aggressive optimizations as needed
   if (frameInfo.isFrameOverBudget) {
     if (frameInfo.remainingFrameBudget < 0) {
       // Most aggressive optimization
       renderMinimumViableOutput();
     } else {
       // Moderate optimization
       renderWithReducedDetail();
     }
   } else {
     // Full quality
     renderWithFullDetail();
   }
   ```

3. **Use profiling data to drive optimization decisions**:

   ```typescript
   // Regular performance check
   function checkPerformance() {
     const report = profiler.generateReport();

     report.bottlenecks.forEach(bottleneck => {
       switch (bottleneck.type) {
         case 'dom_updates':
           // Reduce DOM operations
           reduceUpdateFrequency();
           break;
         case 'interpolation':
           // Increase caching
           expandInterpolationCache();
           break;
         case 'javascript':
           // Simplify calculations
           simplifyAlgorithms();
           break;
       }
     });
   }
   ```

## Troubleshooting

This section provides solutions for common performance issues.

### Common Issues and Solutions

#### Frame Rate Drops

**Symptoms**:

- Choppy animations
- Delayed response to interactions
- Inconsistent animation speed

**Solutions**:

```typescript
// 1. Reduce the number of animated elements
const visibleElements = Math.min(data.length, qualitySettings.maxVisibleElements || 100);

// 2. Simplify animations during interaction
function onDrag() {
  // Temporarily disable transitions during drag
  qualityManager.temporarilyReduceQuality('interaction');
  // ...drag logic
}

function onDragEnd() {
  // Restore normal quality
  qualityManager.restoreQuality('interaction');
}

// 3. Distribute work across frames
let currentIndex = 0;
const batchSize = 50;

function processInBatches() {
  const endIndex = Math.min(currentIndex + batchSize, data.length);

  for (let i = currentIndex; i < endIndex; i++) {
    processItem(data[i]);
  }

  currentIndex = endIndex;

  if (currentIndex < data.length) {
    // Schedule next batch
    animationFrameManager.requestCallback(processInBatches, { priority: 'low' });
  }
}
```

#### Layout Thrashing

**Symptoms**:

- High CPU usage
- Slow rendering despite few elements
- Browser performance warnings

**Solutions**:

```typescript
// 1. Use batched updates to separate reads and writes
function updateLayout() {
  // BAD: Causes thrashing
  nodes.forEach(node => {
    const bounds = node.getBoundingClientRect(); // READ
    updatePosition(node, bounds); // WRITE
  });

  // GOOD: Separates reads and writes
  batchedUpdates.read('node-bounds', () => {
    return nodes.map(node => ({
      node,
      bounds: node.getBoundingClientRect(),
    }));
  });

  batchedUpdates.write('update-positions', reads => {
    const nodeBounds = reads.get('node-bounds');
    nodeBounds.forEach(({ node, bounds }) => {
      updatePosition(node, bounds);
    });
  });
}

// 2. Cache computed styles
const styleCache = new Map();

function getComputedStyles(element) {
  if (styleCache.has(element)) {
    return styleCache.get(element);
  }

  const styles = window.getComputedStyle(element);
  styleCache.set(element, styles);
  return styles;
}

// Clear cache when needed
function invalidateStyleCache() {
  styleCache.clear();
}
```

#### Memory Leaks

**Symptoms**:

- Increasing memory usage over time
- Degrading performance the longer the app runs
- Browser crashes with "out of memory" errors

**Solutions**:

```typescript
// 1. Clean up D3 selections
function cleanupVisualization() {
  // Remove event listeners
  d3.select('#visualization')
    .selectAll('.node')
    .on('mouseover', null)
    .on('mouseout', null)
    .on('click', null);

  // Remove elements
  d3.select('#visualization').selectAll('*').remove();
}

// 2. Dispose animation resources
function disposeAnimation() {
  // Stop and unregister animation
  animationFrameManager.stopAnimation('visualization');
  animationFrameManager.unregisterAnimation('visualization');

  // Clear cached data
  interpolationCache.clear();

  // Remove event listeners
  window.removeEventListener('resize', onResize);
}

// 3. Implement component lifecycle cleanup
useEffect(() => {
  // Setup visualization

  return () => {
    // Cleanup when component unmounts
    cleanupVisualization();
    disposeAnimation();
  };
}, []);
```

### Performance Monitoring

If you're experiencing performance issues, use the PerformanceMonitoringDashboard to identify the source:

```typescript
import { PerformanceMonitoringDashboard } from '../components/ui/showcase/PerformanceMonitoringDashboard';

// Add to your component
<PerformanceMonitoringDashboard width={1200} height={800} />

// Select the animation to monitor and analyze the metrics
```

## Conclusion

By applying these optimization techniques strategically, you can create high-performance D3 visualizations that work well across different devices and data scales. The key is to apply optimizations selectively based on current performance metrics and device capabilities rather than implementing all optimizations at once.

For further assistance or to report issues with these optimization components, please contact the development team.
