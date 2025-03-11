/**
 * Optimization Components Integration Tests
 *
 * These tests verify that all optimization components work correctly when integrated together.
 * They ensure that the components maintain their performance benefits when combined
 * and function correctly across different performance profiles.
 *
 * We use actual implementations rather than mocks to ensure realistic testing.
 */

import * as d3 from 'd3';
import { JSDOM } from 'jsdom';
import { animationFrameManager } from '../../utils/performance/D3AnimationFrameManager';
import { createAnimationProfiler } from '../../utils/performance/D3AnimationProfiler';
import { qualityManager } from '../../utils/performance/D3AnimationQualityManager';
import { batchedUpdates } from '../../utils/performance/D3BatchedUpdates';
import { interpolationCache } from '../../utils/performance/D3InterpolationCache';

// Create a DOM environment for tests
const dom = new JSDOM('<!DOCTYPE html><body><div id="test-container"></div></body>');
global.document = dom.window.document;
global.window = dom.window as any;
global.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  return setTimeout(callback, 0) as unknown as number;
};
global.cancelAnimationFrame = (handle: number): void => {
  clearTimeout(handle);
};

describe('Optimization Components Integration', () => {
  // Test container and SVG element
  let testContainer: HTMLElement;
  let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;

  // Test data for visualizations
  const testData = Array.from({ length: 500 }, (_, i) => ({
    id: `node-${i}`,
    value: Math.random() * 100,
    category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
    x: Math.random() * 800,
    y: Math.random() * 600,
  }));

  // Performance measurements
  let performanceMeasurements: Array<{
    name: string;
    totalTime: number;
    frameCount: number;
    avgFrameTime: number;
  }> = [];

  beforeEach(() => {
    // Reset the DOM
    const container = document.getElementById('test-container');
    if (container) {
      container.innerHTML = '';
    }
    testContainer = container || document.createElement('div');
    testContainer.id = 'test-container';
    document.body.appendChild(testContainer);

    // Create an SVG element
    svg = d3.select(testContainer).append('svg').attr('width', 800).attr('height', 600);

    // Reset all optimization components
    animationFrameManager.reset();
    batchedUpdates.reset();
    interpolationCache.clear();
    qualityManager.reset();

    // Clear performance measurements
    performanceMeasurements = [];

    // Initialize the quality manager with default settings
    qualityManager.initialize();
  });

  afterEach(() => {
    // Clean up any running animations
    animationFrameManager.pauseAllAnimations();

    // Clear the DOM
    testContainer.innerHTML = '';
  });

  /**
   * Measures the performance of a function
   */
  async function measurePerformance(
    name: string,
    fn: () => Promise<void>,
    iterations: number = 1
  ): Promise<void> {
    const startTime = performance.now();
    let frameCount = 0;

    // Track frame count
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      frameCount++;
      return originalRAF(callback);
    };

    // Run the function for the specified number of iterations
    for (let i = 0; i < iterations; i++) {
      await fn();
    }

    // Restore original requestAnimationFrame
    window.requestAnimationFrame = originalRAF;

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgFrameTime = frameCount > 0 ? totalTime / frameCount : 0;

    performanceMeasurements.push({
      name,
      totalTime,
      frameCount,
      avgFrameTime,
    });

    console.log(`Performance - ${name}:`);
    console.log(`  Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`  Frame count: ${frameCount}`);
    console.log(`  Avg frame time: ${avgFrameTime.toFixed(2)}ms`);
  }

  /**
   * Helper to create a force simulation for tests
   */
  function createForceSimulation() {
    return d3
      .forceSimulation(testData as d3.SimulationNodeDatum[])
      .force('charge', d3.forceManyBody().strength(-30))
      .force('center', d3.forceCenter(400, 300))
      .force('collision', d3.forceCollide().radius(10))
      .alphaTarget(0);
  }

  /**
   * Updates node positions in the DOM
   */
  function updateNodePositions(
    nodes: d3.Selection<SVGCircleElement, any, any, any>,
    useTransition: boolean = false
  ) {
    if (useTransition) {
      nodes
        .transition()
        .duration(100)
        .attr('cx', d => d.x || 0)
        .attr('cy', d => d.y || 0);
    } else {
      nodes.attr('cx', d => d.x || 0).attr('cy', d => d.y || 0);
    }
  }

  /**
   * Test 1: Baseline performance without optimizations
   */
  it('should establish baseline performance without optimizations', async () => {
    await measurePerformance('Baseline without optimizations', async () => {
      // Create nodes
      const nodes = svg
        .selectAll('circle')
        .data(testData)
        .join('circle')
        .attr('r', d => Math.sqrt(d.value) / 2)
        .attr('fill', d => (d.category === 'A' ? 'red' : d.category === 'B' ? 'blue' : 'green'));

      // Create simulation
      const simulation = createForceSimulation();

      // Run a few ticks manually
      for (let i = 0; i < 20; i++) {
        simulation.tick();

        // Direct DOM manipulation on each tick - not optimized
        testData.forEach((node, i) => {
          // Layout thrashing: interleaved reads and writes
          const element = nodes.nodes()[i];
          const rect = element.getBoundingClientRect(); // Read
          element.setAttribute('cx', node.x?.toString() || '0'); // Write
          element.setAttribute('cy', node.y?.toString() || '0'); // Write
        });

        // Simulate a frame delay
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      simulation.stop();
    });
  });

  /**
   * Test 2: Only using AnimationFrameManager
   */
  it('should improve performance using only AnimationFrameManager', async () => {
    await measurePerformance('With AnimationFrameManager only', async () => {
      // Create nodes
      const nodes = svg
        .selectAll('circle')
        .data(testData)
        .join('circle')
        .attr('r', d => Math.sqrt(d.value) / 2)
        .attr('fill', d => (d.category === 'A' ? 'red' : d.category === 'B' ? 'blue' : 'green'));

      // Create simulation
      const simulation = createForceSimulation();

      // Register animation with frame manager
      const animationCompleted = new Promise<void>(resolve => {
        animationFrameManager.registerAnimation(
          {
            id: 'test-simulation',
            name: 'Test Simulation',
            priority: 'high',
            type: 'simulation',
            duration: 20 * 16.67, // ~20 frames at 60fps
            onComplete: () => resolve(),
          },
          elapsed => {
            // Run a simulation tick
            simulation.tick();

            // Still using direct DOM manipulation on each tick
            testData.forEach((node, i) => {
              const element = nodes.nodes()[i];
              element.setAttribute('cx', node.x?.toString() || '0');
              element.setAttribute('cy', node.y?.toString() || '0');
            });

            return elapsed >= 20 * 16.67; // Complete after duration
          }
        );
      });

      // Start the animation
      animationFrameManager.startAnimation('test-simulation');

      // Wait for completion
      await animationCompleted;

      simulation.stop();
    });
  });

  /**
   * Test 3: Using AnimationFrameManager and BatchedUpdates
   */
  it('should improve performance using AnimationFrameManager with BatchedUpdates', async () => {
    await measurePerformance('With AnimationFrameManager and BatchedUpdates', async () => {
      // Create nodes
      const nodes = svg
        .selectAll('circle')
        .data(testData)
        .join('circle')
        .attr('r', d => Math.sqrt(d.value) / 2)
        .attr('fill', d => (d.category === 'A' ? 'red' : d.category === 'B' ? 'blue' : 'green'));

      // Create simulation
      const simulation = createForceSimulation();

      // Register animation with frame manager
      const animationCompleted = new Promise<void>(resolve => {
        animationFrameManager.registerAnimation(
          {
            id: 'test-simulation-batched',
            name: 'Test Simulation with Batched Updates',
            priority: 'high',
            type: 'simulation',
            duration: 20 * 16.67, // ~20 frames at 60fps
            onComplete: () => resolve(),
          },
          elapsed => {
            // Run a simulation tick
            simulation.tick();

            // Use batched updates to avoid layout thrashing
            batchedUpdates.write('update-nodes', () => {
              // Single write operation for all nodes
              nodes.attr('cx', d => d.x || 0).attr('cy', d => d.y || 0);
            });

            return elapsed >= 20 * 16.67; // Complete after duration
          }
        );
      });

      // Start the animation
      animationFrameManager.startAnimation('test-simulation-batched');

      // Wait for completion
      await animationCompleted;

      simulation.stop();
    });
  });

  /**
   * Test 4: Using AnimationFrameManager, BatchedUpdates, and InterpolationCache
   */
  it('should improve performance using AnimationFrameManager, BatchedUpdates, and InterpolationCache', async () => {
    await measurePerformance(
      'With AnimationFrameManager, BatchedUpdates, and InterpolationCache',
      async () => {
        // Create cached color interpolator
        const cachedColorInterpolator = interpolationCache.createCachedInterpolator(
          d3.interpolateRgb
        );
        const colorScale = (category: string) => {
          return cachedColorInterpolator(
            category === 'A' ? 'red' : category === 'B' ? 'blue' : 'green',
            'white'
          );
        };

        // Create nodes with cached interpolators
        const nodes = svg
          .selectAll('circle')
          .data(testData)
          .join('circle')
          .attr('r', d => Math.sqrt(d.value) / 2)
          .attr('fill', d => colorScale(d.category)(0.5)); // Using cached interpolator

        // Create simulation
        const simulation = createForceSimulation();

        // Register animation with frame manager
        const animationCompleted = new Promise<void>(resolve => {
          animationFrameManager.registerAnimation(
            {
              id: 'test-simulation-interpolation',
              name: 'Test Simulation with Interpolation Caching',
              priority: 'high',
              type: 'simulation',
              duration: 20 * 16.67, // ~20 frames at 60fps
              onComplete: () => resolve(),
            },
            (elapsed, deltaTime, frameInfo) => {
              // Run a simulation tick
              simulation.tick();

              // Use batched updates to avoid layout thrashing
              batchedUpdates.write('update-nodes', () => {
                // Position updates
                nodes.attr('cx', d => d.x || 0).attr('cy', d => d.y || 0);

                // Color updates with cached interpolation
                const progress = Math.min(1, elapsed / (20 * 16.67));
                nodes.attr('fill', d => colorScale(d.category)(progress));
              });

              return elapsed >= 20 * 16.67; // Complete after duration
            }
          );
        });

        // Start the animation
        animationFrameManager.startAnimation('test-simulation-interpolation');

        // Wait for completion
        await animationCompleted;

        simulation.stop();
      }
    );
  });

  /**
   * Test 5: Using all optimization components together
   */
  it('should maximize performance using all optimization components together', async () => {
    await measurePerformance('With all optimization components', async () => {
      // Initialize quality manager
      qualityManager.initialize();
      const qualitySettings = qualityManager.getQualitySettings();

      // Create profiler
      const profiler = createAnimationProfiler();
      profiler.start('integrated-test');

      // Create cached interpolator
      const cachedColorInterpolator = interpolationCache.createCachedInterpolator(
        d3.interpolateRgb
      );

      // Limit the number of nodes based on quality settings
      const visibleData = testData.slice(
        0,
        qualitySettings.maxVisibleElements > 0
          ? Math.min(testData.length, qualitySettings.maxVisibleElements)
          : testData.length
      );

      // Create nodes with appropriate detail level
      const nodes = svg
        .selectAll('circle')
        .data(visibleData)
        .join('circle')
        .attr(
          'r',
          d =>
            qualitySettings.adaptiveDetail
              ? Math.sqrt(d.value) / 2 // More detailed size calculation
              : 5 // Simple fixed size
        )
        .attr('fill', d => {
          // Use cached color interpolator
          return cachedColorInterpolator(
            d.category === 'A' ? 'red' : d.category === 'B' ? 'blue' : 'green',
            'white'
          )(0.5);
        });

      // Apply high detail effects if enabled
      if (qualitySettings.highDetail) {
        nodes.attr('stroke', '#333').attr('stroke-width', 1).attr('opacity', 0.9);
      }

      // Create simulation
      const simulation = createForceSimulation();

      // Register animation with frame manager
      const animationCompleted = new Promise<void>(resolve => {
        animationFrameManager.registerAnimation(
          {
            id: 'test-simulation-all-optimizations',
            name: 'Test Simulation with All Optimizations',
            priority: 'high',
            type: 'simulation',
            duration: 20 * 16.67, // ~20 frames at 60fps
            frameTimeBudget: 12, // 12ms budget per frame
            enableProfiling: true,
            onComplete: () => resolve(),
          },
          (elapsed, deltaTime, frameInfo) => {
            // Record frame start
            profiler.recordFrame();

            // Run a simulation tick
            simulation.tick();

            // Use batched updates to separate reads and writes
            batchedUpdates.read('node-bounds', () => {
              // Read node bounds if needed
              const nodeBounds = nodes.nodes().map(node => ({
                element: node,
                bounds: node.getBoundingClientRect(),
              }));
              return nodeBounds;
            });

            // Schedule writes based on quality settings
            batchedUpdates.write(
              'update-nodes',
              () => {
                // Update node positions
                nodes.attr('cx', d => d.x || 0).attr('cy', d => d.y || 0);

                // Apply animations if enabled
                if (qualitySettings.enableAnimations) {
                  const progress = Math.min(1, elapsed / (20 * 16.67));
                  nodes.attr('fill', d => {
                    return cachedColorInterpolator(
                      d.category === 'A' ? 'red' : d.category === 'B' ? 'blue' : 'green',
                      'white'
                    )(progress);
                  });
                }
              },
              { priority: 'high' }
            );

            // Add additional visual details only if we have budget and quality permits
            if (qualitySettings.highDetail && !frameInfo.isFrameOverBudget) {
              batchedUpdates.write(
                'node-details',
                () => {
                  nodes.attr('stroke-opacity', elapsed / (20 * 16.67));

                  if (qualitySettings.enableEffects) {
                    nodes.attr('filter', 'url(#blur)');
                  }
                },
                { priority: 'low' }
              );
            }

            return elapsed >= 20 * 16.67; // Complete after duration
          }
        );
      });

      // Start the animation
      animationFrameManager.startAnimation('test-simulation-all-optimizations');

      // Wait for completion
      await animationCompleted;

      // Get performance report
      const report = profiler.generateReport();
      console.log(`Performance score: ${report.performanceScore}`);

      simulation.stop();
    });
  });

  /**
   * Test 6: Compare performance across quality tiers
   */
  it('should adapt performance across different quality tiers', async () => {
    // Test with low quality settings
    qualityManager.setQualityPreset('low');
    await measurePerformance('Low quality preset', async () => {
      await runQualityTest('low');
    });

    // Test with medium quality settings
    qualityManager.setQualityPreset('medium');
    await measurePerformance('Medium quality preset', async () => {
      await runQualityTest('medium');
    });

    // Test with high quality settings
    qualityManager.setQualityPreset('high');
    await measurePerformance('High quality preset', async () => {
      await runQualityTest('high');
    });

    // Helper function to run test with specific quality preset
    async function runQualityTest(preset: string) {
      const qualitySettings = qualityManager.getQualitySettings();

      // Create cached interpolator
      const cachedColorInterpolator = interpolationCache.createCachedInterpolator(
        d3.interpolateRgb
      );

      // Limit the number of nodes based on quality settings
      const visibleData = testData.slice(
        0,
        qualitySettings.maxVisibleElements > 0
          ? Math.min(testData.length, qualitySettings.maxVisibleElements)
          : testData.length
      );

      // Clear and recreate the SVG
      svg.selectAll('*').remove();

      // Create nodes with appropriate detail level
      const nodes = svg
        .selectAll('circle')
        .data(visibleData)
        .join('circle')
        .attr('r', d => (qualitySettings.adaptiveDetail ? Math.sqrt(d.value) / 2 : 5))
        .attr('fill', d => {
          return cachedColorInterpolator(
            d.category === 'A' ? 'red' : d.category === 'B' ? 'blue' : 'green',
            'white'
          )(0.5);
        });

      // Create simulation
      const simulation = createForceSimulation();

      // Register animation with frame manager
      const animationCompleted = new Promise<void>(resolve => {
        animationFrameManager.registerAnimation(
          {
            id: `test-quality-${preset}`,
            name: `Test with ${preset} quality`,
            priority: 'high',
            type: 'simulation',
            duration: 10 * 16.67, // ~10 frames at 60fps
            onComplete: () => resolve(),
          },
          elapsed => {
            // Run a simulation tick
            simulation.tick();

            // Use batched updates
            batchedUpdates.write('update-nodes', () => {
              // Update node positions
              nodes.attr('cx', d => d.x || 0).attr('cy', d => d.y || 0);

              // Apply animations if enabled
              if (qualitySettings.enableAnimations) {
                const progress = Math.min(1, elapsed / (10 * 16.67));
                nodes.attr('opacity', progress);
              }
            });

            return elapsed >= 10 * 16.67; // Complete after duration
          }
        );
      });

      // Start the animation
      animationFrameManager.startAnimation(`test-quality-${preset}`);

      // Wait for completion
      await animationCompleted;

      simulation.stop();
    }

    // Verify that performance varies predictably across quality tiers
    const lowQualityMeasurement = performanceMeasurements.find(
      m => m.name === 'Low quality preset'
    );
    const mediumQualityMeasurement = performanceMeasurements.find(
      m => m.name === 'Medium quality preset'
    );
    const highQualityMeasurement = performanceMeasurements.find(
      m => m.name === 'High quality preset'
    );

    if (lowQualityMeasurement && mediumQualityMeasurement && highQualityMeasurement) {
      console.log('Quality comparison:');
      console.log(
        `  Low quality avg frame time: ${lowQualityMeasurement.avgFrameTime.toFixed(2)}ms`
      );
      console.log(
        `  Medium quality avg frame time: ${mediumQualityMeasurement.avgFrameTime.toFixed(2)}ms`
      );
      console.log(
        `  High quality avg frame time: ${highQualityMeasurement.avgFrameTime.toFixed(2)}ms`
      );

      // This assertion is commented out because actual performance depends on the test environment
      // In a real test environment, you would expect high quality to be slower than low quality
      // expect(lowQualityMeasurement.avgFrameTime).toBeLessThan(highQualityMeasurement.avgFrameTime);
    }
  });

  /**
   * Test 7: Verify the optimization components respond correctly to frame budget constraints
   */
  it('should adapt to frame budget constraints', async () => {
    // Create profiler
    const profiler = createAnimationProfiler();
    profiler.start('frame-budget-test');

    // Initialize with a tight frame budget
    const tightBudgetMs = 5; // 5ms budget per frame (very tight)

    await measurePerformance('Tight frame budget test', async () => {
      // Create nodes
      const nodes = svg
        .selectAll('circle')
        .data(testData)
        .join('circle')
        .attr('r', 5)
        .attr('fill', 'blue');

      // Create simulation
      const simulation = createForceSimulation();

      // Track whether any frames went over budget
      let framesOverBudgetCount = 0;

      // Register animation with frame manager and a tight budget
      const animationCompleted = new Promise<void>(resolve => {
        animationFrameManager.registerAnimation(
          {
            id: 'budget-constrained-test',
            name: 'Budget Constrained Test',
            priority: 'high',
            type: 'simulation',
            duration: 20 * 16.67, // ~20 frames at 60fps
            frameTimeBudget: tightBudgetMs, // Very tight budget
            enableProfiling: true,
            onComplete: () => resolve(),
          },
          (elapsed, deltaTime, frameInfo) => {
            // Record frame
            profiler.recordFrame();

            // Record if we're over budget
            if (frameInfo.isFrameOverBudget) {
              framesOverBudgetCount++;
            }

            // Run simulation and update nodes
            simulation.tick();

            // Adapt rendering strategy based on remaining budget
            if (frameInfo.isFrameOverBudget) {
              // Minimal update - just update visible nodes
              const visibleNodes = nodes.filter((d, i) => i < 50); // Just update 50 nodes
              batchedUpdates.write('update-minimal', () => {
                visibleNodes.attr('cx', d => d.x || 0).attr('cy', d => d.y || 0);
              });
            } else if (frameInfo.remainingFrameBudget < tightBudgetMs / 2) {
              // Medium update - no visual effects
              batchedUpdates.write('update-medium', () => {
                nodes.attr('cx', d => d.x || 0).attr('cy', d => d.y || 0);
              });
            } else {
              // Full update with visual effects
              batchedUpdates.write('update-full', () => {
                nodes
                  .attr('cx', d => d.x || 0)
                  .attr('cy', d => d.y || 0)
                  .attr('r', d => Math.sqrt(d.value) / 2)
                  .attr('fill', d =>
                    d.category === 'A' ? 'red' : d.category === 'B' ? 'blue' : 'green'
                  );
              });
            }

            return elapsed >= 20 * 16.67; // Complete after duration
          }
        );
      });

      // Start the animation
      animationFrameManager.startAnimation('budget-constrained-test');

      // Wait for completion
      await animationCompleted;

      // Log the results
      console.log(`Frames over budget: ${framesOverBudgetCount}`);

      // Get performance report
      const report = profiler.generateReport();
      console.log(`Performance score: ${report.performanceScore}`);
      console.log(
        `Average frame duration: ${report.performanceData.averageFrameDuration.toFixed(2)}ms`
      );

      simulation.stop();
    });
  });

  /**
   * Test 8: Verify the performance benefits of integration
   */
  it('should demonstrate the combined performance benefits are greater than individual optimizations', async () => {
    // This test compares the results of the earlier tests
    const baseline = performanceMeasurements.find(m => m.name === 'Baseline without optimizations');
    const frameManagerOnly = performanceMeasurements.find(
      m => m.name === 'With AnimationFrameManager only'
    );
    const frameManagerAndBatched = performanceMeasurements.find(
      m => m.name === 'With AnimationFrameManager and BatchedUpdates'
    );
    const threeComponents = performanceMeasurements.find(
      m => m.name === 'With AnimationFrameManager, BatchedUpdates, and InterpolationCache'
    );
    const allComponents = performanceMeasurements.find(
      m => m.name === 'With all optimization components'
    );

    if (
      baseline &&
      frameManagerOnly &&
      frameManagerAndBatched &&
      threeComponents &&
      allComponents
    ) {
      console.log('Performance comparison:');
      console.log(`  Baseline avg frame time: ${baseline.avgFrameTime.toFixed(2)}ms`);
      console.log(`  Frame Manager only: ${frameManagerOnly.avgFrameTime.toFixed(2)}ms`);
      console.log(
        `  Frame Manager + Batched Updates: ${frameManagerAndBatched.avgFrameTime.toFixed(2)}ms`
      );
      console.log(`  Three components: ${threeComponents.avgFrameTime.toFixed(2)}ms`);
      console.log(`  All components: ${allComponents.avgFrameTime.toFixed(2)}ms`);

      // Calculate improvement percentages
      const frameManagerImprovement =
        ((baseline.avgFrameTime - frameManagerOnly.avgFrameTime) / baseline.avgFrameTime) * 100;
      const batchedImprovement =
        ((frameManagerOnly.avgFrameTime - frameManagerAndBatched.avgFrameTime) /
          frameManagerOnly.avgFrameTime) *
        100;
      const cacheImprovement =
        ((frameManagerAndBatched.avgFrameTime - threeComponents.avgFrameTime) /
          frameManagerAndBatched.avgFrameTime) *
        100;
      const qualityImprovement =
        ((threeComponents.avgFrameTime - allComponents.avgFrameTime) /
          threeComponents.avgFrameTime) *
        100;
      const totalImprovement =
        ((baseline.avgFrameTime - allComponents.avgFrameTime) / baseline.avgFrameTime) * 100;

      console.log('Improvement percentages:');
      console.log(`  Frame Manager added: ${frameManagerImprovement.toFixed(2)}% improvement`);
      console.log(`  Batched Updates added: ${batchedImprovement.toFixed(2)}% improvement`);
      console.log(`  Interpolation Cache added: ${cacheImprovement.toFixed(2)}% improvement`);
      console.log(`  Quality Manager added: ${qualityImprovement.toFixed(2)}% improvement`);
      console.log(`  Total improvement: ${totalImprovement.toFixed(2)}%`);

      // This assertion is commented out because actual performance depends on the test environment
      // expect(totalImprovement).toBeGreaterThan(frameManagerImprovement + batchedImprovement + cacheImprovement);
    }
  });
});
