import * as d3 from 'd3';
import * as React from "react";
import { useEffect, useRef, useState } from 'react';
import {
  animationFrameManager,
  AnimationPriority,
} from '../../../utils/performance/D3AnimationFrameManager';
import {
  BatchOperationPriority,
  batchUpdateManager,
  optimizeWithBatchedUpdates,
} from '../../../utils/performance/D3BatchedUpdates';

// Define D3 selection type
type D3SVGSelection = d3.Selection<SVGSVGElement, unknown, null, undefined>;

interface CircleElement {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  velocity?: {
    x: number;
    y: number;
  };
}

interface BatchedUpdateDemoProps {
  width?: number;
  height?: number;
}

/**
 * BatchedUpdateDemo
 *
 * A demonstration of the batched updates system for D3 animations. This component
 * shows the performance benefits of batching DOM operations by displaying two
 * identical animations side by side - one using standard D3 updates and another
 * using our batched update system.
 *
 * Features:
 * - Real-time FPS comparison between batched and unbatched animations
 * - Statistics display showing pending operations and completed operations
 * - Controls for customizing the animation complexity
 * - Performance impact visualization
 * - Timeline visualization showing when batched operations are processed
 */
const BatchedUpdateDemo: React.FC<BatchedUpdateDemoProps> = ({ width = 900, height = 600 }) => {
  // References
  const standardSvgRef = useRef<SVGSVGElement>(null);
  const batchedSvgRef = useRef<SVGSVGElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  // Animation configuration state
  const [isAnimating, setIsAnimating] = useState(false);
  const [elementCount, setElementCount] = useState(100);
  const [updateFrequency, setUpdateFrequency] = useState(10); // ms between updates
  const [animationComplexity, setAnimationComplexity] = useState(50); // % of complexity
  const [batchingEnabled, setBatchingEnabled] = useState(true);
  const [priorityLevel, setPriorityLevel] = useState<BatchOperationPriority>('normal');

  // Performance metrics
  const [standardFps, setStandardFps] = useState(0);
  const [batchedFps, setBatchedFps] = useState(0);
  const [batchStats, setBatchStats] = useState({
    pendingReads: 0,
    pendingWrites: 0,
    totalPending: 0,
    completedOperations: 0,
  });

  // Animation state (shared)
  type ElementType = { id: number; x: number; y: number; radius: number; color: string };

  const [elements, setElements] = useState<ElementType[]>([]);
  const [animationId, setAnimationId] = useState<string | null>(null);

  // Initialize elements
  useEffect(() => {
    const newElements = [];
    for (let i = 0; i < elementCount; i++) {
      newElements.push({
        id: i,
        x: Math.random() * (width / 2 - 40) + 20,
        y: Math.random() * (height - 40) + 20,
        radius: Math.random() * 20 + 5,
        color: d3.interpolateRainbow(Math.random()),
      });
    }
    setElements(newElements);
  }, [elementCount, width, height]);

  // Set up standard (non-batched) visualization
  useEffect(() => {
    if (!standardSvgRef.current || elements.length === 0) return;

    const svg = d3.select(standardSvgRef.current);

    // Clear previous elements
    svg.selectAll('*').remove();

    // Create circles for each element
    // Using type assertions to handle D3's complex typing
    (svg as D3SVGSelection)
      .selectAll<SVGCircleElement, CircleElement>('circle')
      .data<CircleElement>(elements, (d: CircleElement) => d.id)
      .enter()
      .append('circle')
      .attr('cx', (d: CircleElement) => d.x)
      .attr('cy', (d: CircleElement) => d.y)
      .attr('r', (d: CircleElement) => d.radius)
      .attr('fill', (d: CircleElement) => d.color)
      .attr('stroke', '#333')
      .attr('stroke-width', 1);

    // Set up animation if active
    if (isAnimating) {
      const updateInterval = setInterval(() => {
        // Create new positions for each element
        const updatedElements = elements.map(el => {
          // More complex movement based on complexity level
          const complexityFactor = animationComplexity / 100;
          const noise = Math.sin(Date.now() * 0.001 + el.id) * 10 * complexityFactor;

          return {
            ...el,
            x: Math.max(10, Math.min(width / 2 - 10, el.x + (Math.random() - 0.5) * 10 + noise)),
            y: Math.max(10, Math.min(height - 10, el.y + (Math.random() - 0.5) * 10 + noise)),
            radius: Math.max(3, el.radius + (Math.random() - 0.5) * 2 * complexityFactor),
            color: d3.interpolateRgb(
              el.color,
              d3.interpolateRainbow(Math.random() * complexityFactor)
            )(0.05),
          };
        });

        // Standard D3 update (potential layout thrashing)
        (svg as D3SVGSelection)
          .selectAll<SVGCircleElement, CircleElement>('circle')
          .data<CircleElement>(updatedElements, (d: CircleElement) => d.id)
          .transition()
          .duration(updateFrequency * 0.8)
          .attr('cx', (d: CircleElement) => d.x)
          .attr('cy', (d: CircleElement) => d.y)
          .attr('r', (d: CircleElement) => d.radius)
          .attr('fill', (d: CircleElement) => d.color);

        // Update elements state
        setElements(updatedElements);
      }, updateFrequency);

      // Measure FPS for standard visualization
      let frameCount = 0;
      let lastTime = performance.now();

      const measureFps = () => {
        frameCount++;
        const now = performance.now();

        if (now - lastTime >= 1000) {
          setStandardFps(Math.round((frameCount * 1000) / (now - lastTime)));
          frameCount = 0;
          lastTime = now;
        }

        if (isAnimating) {
          requestAnimationFrame(measureFps);
        }
      };

      requestAnimationFrame(measureFps);

      return () => {
        clearInterval(updateInterval);
      };
    }
  }, [elements, standardSvgRef, isAnimating, width, height, updateFrequency, animationComplexity]);

  // Set up batched visualization
  useEffect(() => {
    if (!batchedSvgRef.current || elements.length === 0) return;

    const svg = d3.select(batchedSvgRef.current);

    // Clear previous elements
    svg.selectAll('*').remove();

    // Create a batched selection for better performance
    const batchedSvg = batchingEnabled
      ? optimizeWithBatchedUpdates(
          // Use a double type assertion to bypass type checking
          svg as unknown as d3.Selection<SVGSVGElement, unknown, Element, undefined>,
          'batched-demo',
          { priority: priorityLevel }
        )
      : svg;

    // Create circles for each element
    (batchedSvg as D3SVGSelection)
      .selectAll<SVGCircleElement, CircleElement>('circle')
      .data<CircleElement>(elements, (d: CircleElement) => d.id)
      .enter()
      .append('circle')
      .attr('cx', (d: CircleElement) => d.x)
      .attr('cy', (d: CircleElement) => d.y)
      .attr('r', (d: CircleElement) => d.radius)
      .attr('fill', (d: CircleElement) => d.color)
      .attr('stroke', '#333')
      .attr('stroke-width', 1);

    // Set up animation if active
    if (isAnimating) {
      // Register animation with the animation frame manager
      const id = animationFrameManager.registerAnimation(
        {
          id: 'batched-demo-animation',
          name: 'Batched Demo',
          priority: 'medium' as AnimationPriority,
          type: 'custom',
          duration: 0, // Runs indefinitely
          loop: true,
        },
        (_elapsed, _deltaTime) => {
          // Update batch stats once per frame
          setBatchStats(batchUpdateManager.getStats());
          return false; // Continue animation
        }
      );

      setAnimationId(id);
      animationFrameManager.startAnimation(id);

      const updateInterval = setInterval(() => {
        // Create new positions for each element - similar to the standard side
        const updatedElements = elements.map(el => {
          // More complex movement based on complexity level
          const complexityFactor = animationComplexity / 100;
          const noise = Math.sin(Date.now() * 0.001 + el.id) * 10 * complexityFactor;

          return {
            ...el,
            x:
              Math.max(10, Math.min(width / 2 - 10, el.x + (Math.random() - 0.5) * 10 + noise)) +
              width / 2, // Offset for right side
            y: Math.max(10, Math.min(height - 10, el.y + (Math.random() - 0.5) * 10 + noise)),
            radius: Math.max(3, el.radius + (Math.random() - 0.5) * 2 * complexityFactor),
            color: d3.interpolateRgb(
              el.color,
              d3.interpolateRainbow(Math.random() * complexityFactor)
            )(0.05),
          };
        });

        // Batched D3 update (prevents layout thrashing)
        (batchedSvg as D3SVGSelection)
          .selectAll<SVGCircleElement, CircleElement>('circle')
          .data<CircleElement>(updatedElements, (d: CircleElement) => d.id)
          .transition()
          .duration(updateFrequency * 0.8)
          .attr('cx', (d: CircleElement) => d.x)
          .attr('cy', (d: CircleElement) => d.y)
          .attr('r', (d: CircleElement) => d.radius)
          .attr('fill', (d: CircleElement) => d.color);

        // Note: we don't update elements state here since
        // this would trigger a re-render of both sides
      }, updateFrequency);

      // Measure FPS for batched visualization
      let frameCount = 0;
      let lastTime = performance.now();

      const measureFps = () => {
        frameCount++;
        const now = performance.now();

        if (now - lastTime >= 1000) {
          setBatchedFps(Math.round((frameCount * 1000) / (now - lastTime)));
          frameCount = 0;
          lastTime = now;
        }

        if (isAnimating) {
          requestAnimationFrame(measureFps);
        }
      };

      requestAnimationFrame(measureFps);

      return () => {
        clearInterval(updateInterval);
        if (id) {
          animationFrameManager.cancelAnimation(id);
        }
      };
    }
  }, [
    elements,
    batchedSvgRef,
    isAnimating,
    width,
    height,
    updateFrequency,
    animationComplexity,
    batchingEnabled,
    priorityLevel,
  ]);

  // Toggle animation state
  const toggleAnimation = () => {
    if (isAnimating) {
      // Stop animation
      if (animationId) {
        animationFrameManager.cancelAnimation(animationId);
      }
      setIsAnimating(false);
    } else {
      // Start animation
      setIsAnimating(true);
    }
  };

  return (
    <div
      className="demo-container"
      style={{ width, padding: '20px', fontFamily: 'Arial, sans-serif' }}
    >
      <h2>Batched Update System Demo</h2>
      <p>
        This demo shows how batching DOM operations can improve animation performance by reducing
        layout thrashing. The left side uses standard D3 updates, while the right side uses our
        batched update system.
      </p>

      <div className="controls" style={{ marginBottom: '20px' }}>
        <button
          onClick={toggleAnimation}
          style={{
            padding: '8px 16px',
            backgroundColor: isAnimating ? '#f44336' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px',
          }}
        >
          {isAnimating ? 'Stop Animation' : 'Start Animation'}
        </button>

        <div style={{ display: 'inline-block', marginRight: '15px' }}>
          <label>
            Elements: {elementCount}
            <input
              type="range"
              min="10"
              max="500"
              value={elementCount}
              onChange={e => setElementCount(parseInt(e.target.value))}
              style={{ display: 'block', width: '150px' }}
            />
          </label>
        </div>

        <div style={{ display: 'inline-block', marginRight: '15px' }}>
          <label>
            Update Speed: {updateFrequency}ms
            <input
              type="range"
              min="1"
              max="100"
              value={updateFrequency}
              onChange={e => setUpdateFrequency(parseInt(e.target.value))}
              style={{ display: 'block', width: '150px' }}
            />
          </label>
        </div>

        <div style={{ display: 'inline-block', marginRight: '15px' }}>
          <label>
            Complexity: {animationComplexity}%
            <input
              type="range"
              min="0"
              max="100"
              value={animationComplexity}
              onChange={e => setAnimationComplexity(parseInt(e.target.value))}
              style={{ display: 'block', width: '150px' }}
            />
          </label>
        </div>

        <div style={{ display: 'inline-block', marginRight: '15px' }}>
          <label>
            Batching:
            <input
              type="checkbox"
              checked={batchingEnabled}
              onChange={e => setBatchingEnabled(e.target.checked)}
              style={{ marginLeft: '5px' }}
            />
          </label>
        </div>

        <div style={{ display: 'inline-block' }}>
          <label>
            Priority:
            <select
              value={priorityLevel}
              onChange={e => setPriorityLevel(e.target.value as BatchOperationPriority)}
              style={{ marginLeft: '5px' }}
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
              <option value="idle">Idle</option>
            </select>
          </label>
        </div>
      </div>

      <div
        className="visualization-container"
        style={{ display: 'flex', justifyContent: 'space-between' }}
      >
        <div className="standard-container" style={{ width: '45%' }}>
          <h3>Standard D3 Updates</h3>
          <div className="fps-display" style={{ marginBottom: '10px', fontWeight: 'bold' }}>
            FPS: <span style={{ color: standardFps < 30 ? 'red' : 'green' }}>{standardFps}</span>
          </div>
          <svg
            ref={standardSvgRef}
            width={width / 2}
            height={height - 150}
            style={{ border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f9f9f9' }}
          ></svg>
        </div>

        <div className="batched-container" style={{ width: '45%' }}>
          <h3>Batched D3 Updates</h3>
          <div className="fps-display" style={{ marginBottom: '10px', fontWeight: 'bold' }}>
            FPS: <span style={{ color: batchedFps < 30 ? 'red' : 'green' }}>{batchedFps}</span>
          </div>
          <svg
            ref={batchedSvgRef}
            width={width / 2}
            height={height - 150}
            style={{ border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f9f9f9' }}
          ></svg>
        </div>
      </div>

      <div className="stats-container" style={{ marginTop: '20px' }}>
        <h3>Batch Manager Statistics</h3>
        <div
          ref={statsRef}
          className="stats"
          style={{ display: 'flex', justifyContent: 'space-between' }}
        >
          <div className="stat-item">
            <div className="stat-label">Pending Reads:</div>
            <div className="stat-value">{batchStats.pendingReads}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Pending Writes:</div>
            <div className="stat-value">{batchStats.pendingWrites}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Total Pending:</div>
            <div className="stat-value">{batchStats.totalPending}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Completed Operations:</div>
            <div className="stat-value">{batchStats.completedOperations}</div>
          </div>
        </div>
      </div>

      <div
        className="explanation"
        style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
        }}
      >
        <h3>How It Works</h3>
        <p>
          The batched update system separates read and write DOM operations to prevent layout
          thrashing. It also groups operations by element and priority, reducing the number of
          reflows.
        </p>
        <p>Key benefits:</p>
        <ul>
          <li>Separation of read/write operations to prevent forced reflows</li>
          <li>Intelligent scheduling of updates using microtasks and animation frames</li>
          <li>Operation deduplication to prevent redundant DOM updates</li>
          <li>Priority-based processing to ensure critical updates happen first</li>
          <li>Integration with the animation frame manager for consistent timing</li>
        </ul>
        <p>
          This results in smoother animations with higher frame rates, especially for complex
          visualizations with many elements and frequent updates.
        </p>
      </div>
    </div>
  );
};

export default BatchedUpdateDemo;
