import * as d3 from 'd3';
import * as React from "react";
import { useEffect, useRef, useState } from 'react';
import { typedInterpolators } from '../../../types/visualizations/D3AnimationTypes';
import {
  animationFrameManager,
  registerD3Timer,
} from '../../../utils/performance/D3AnimationFrameManager';
import {
  CacheStats,
  createMemoizedInterpolators,
  getMemoizationStats,
} from '../../../utils/performance/D3InterpolationCache';

interface InterpolationMemoizationDemoProps {
  width?: number;
  height?: number;
}

/**
 * Demo component showcasing the benefits of memoized interpolation
 * for performance optimization in animations.
 *
 * This component demonstrates:
 * 1. Performance comparison between memoized and non-memoized interpolation
 * 2. Real-time cache statistics visualization
 * 3. Multiple types of interpolation with different cache configurations
 * 4. Integration with the animation frame manager
 */
const InterpolationMemoizationDemo: React.FC<InterpolationMemoizationDemoProps> = ({
  width = 900,
  height = 600,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const standardSvgRef = useRef<SVGSVGElement>(null);
  const memoizedSvgRef = useRef<SVGSVGElement>(null);

  const [isAnimating, setIsAnimating] = useState(false);
  const [particleCount, setParticleCount] = useState(500);
  const [interpolationType, setInterpolationType] = useState<'position' | 'color' | 'mixed'>(
    'position'
  );
  const [showStats, setShowStats] = useState(true);
  const [useMemoization, setUseMemoization] = useState(true);
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    lookups: 0,
    hits: 0,
    misses: 0,
    hitRate: 0,
    entryCount: 0,
    avgTimeSaved: 0,
    totalTimeSaved: 0,
    evictions: 0,
    estimatedMemoryUsage: 0,
  });

  const [standardFps, setStandardFps] = useState(0);
  const [memoizedFps, setMemoizedFps] = useState(0);
  const [performanceGain, setPerformanceGain] = useState(0);

  // Animation IDs for cleanup
  const animationIdsRef = useRef<string[]>([]);

  // Update cache stats periodically
  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      setCacheStats(getMemoizationStats());
    }, 500);

    return () => clearInterval(interval);
  }, [isAnimating]);

  // Set up and run the animations
  useEffect(() => {
    if (!isAnimating || !standardSvgRef.current || !memoizedSvgRef.current) return;

    // Clean up previous animations
    animationIdsRef.current.forEach(id => {
      animationFrameManager.cancelAnimation(id);
    });
    animationIdsRef.current = [];

    // Clear SVGs
    d3.select(standardSvgRef.current).selectAll('*').remove();
    d3.select(memoizedSvgRef.current).selectAll('*').remove();

    // Generate particle data
    const generateParticles = (count: number) => {
      return Array.from({ length: count }, (_, i) => ({
        id: `particle-${i}`,
        x: Math.random() * (width / 2 - 20),
        y: Math.random() * (height - 20),
        size: Math.random() * 8 + 2,
        color: d3.interpolateSpectral(Math.random()),
        targetX: Math.random() * (width / 2 - 20),
        targetY: Math.random() * (height - 20),
        targetSize: Math.random() * 8 + 2,
        targetColor: d3.interpolateSpectral(Math.random()),
        speed: Math.random() * 0.2 + 0.1,
      }));
    };

    const particles = generateParticles(particleCount);

    // Setup SVGs - Standard (non-memoized) version
    const standardSvg = d3.select(standardSvgRef.current);
    const standardParticles = standardSvg
      .selectAll('circle')
      .data(particles, (d: any) => d.id)
      .join('circle')
      .attr('r', d => d.size)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('fill', d => d.color);

    // Memoized version
    const memoizedSvg = d3.select(memoizedSvgRef.current);
    const memoizedParticles = memoizedSvg
      .selectAll('circle')
      .data(particles, (d: any) => d.id)
      .join('circle')
      .attr('r', d => d.size)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('fill', d => d.color);

    // FPS monitoring
    let standardFrameCount = 0;
    let memoizedFrameCount = 0;
    let lastStandardCheck = performance.now();
    let lastMemoizedCheck = performance.now();

    // Create interpolators for each particle
    const standardInterpolators = particles.map(p => {
      const createStandardInterpolators = () => {
        switch (interpolationType) {
          case 'position':
            return {
              position: typedInterpolators.object(
                { x: p.x, y: p.y },
                { x: p.targetX, y: p.targetY }
              ),
              size: typedInterpolators.number(p.size, p.size),
            };
          case 'color':
            return {
              position: typedInterpolators.object({ x: p.x, y: p.y }, { x: p.x, y: p.y }),
              size: typedInterpolators.number(p.size, p.size),
              color: typedInterpolators.color(p.color, p.targetColor),
            };
          case 'mixed':
          default:
            return {
              position: typedInterpolators.object(
                { x: p.x, y: p.y },
                { x: p.targetX, y: p.targetY }
              ),
              size: typedInterpolators.number(p.size, p.targetSize),
              color: typedInterpolators.color(p.color, p.targetColor),
            };
        }
      };

      return createStandardInterpolators();
    });

    // Create memoized interpolators (using animation-specific cache)
    const animationId = `memoization-demo-${Date.now()}`;
    const memoizedInterpolatorFactory = createMemoizedInterpolators(animationId);

    const memoizedParticleInterpolators = particles.map(p => {
      const createMemoizedInterpolators = () => {
        switch (interpolationType) {
          case 'position':
            return {
              position: memoizedInterpolatorFactory.object(
                { x: p.x, y: p.y },
                { x: p.targetX, y: p.targetY }
              ),
              size: memoizedInterpolatorFactory.number(p.size, p.size),
            };
          case 'color':
            return {
              position: memoizedInterpolatorFactory.object({ x: p.x, y: p.y }, { x: p.x, y: p.y }),
              size: memoizedInterpolatorFactory.number(p.size, p.size),
              color: memoizedInterpolatorFactory.color(p.color, p.targetColor),
            };
          case 'mixed':
          default:
            return {
              position: memoizedInterpolatorFactory.object(
                { x: p.x, y: p.y },
                { x: p.targetX, y: p.targetY }
              ),
              size: memoizedInterpolatorFactory.number(p.size, p.targetSize),
              color: memoizedInterpolatorFactory.color(p.color, p.targetColor),
            };
        }
      };

      return createMemoizedInterpolators();
    });

    // Register animation for standard version
    const { id: standardAnimationId } = registerD3Timer(
      elapsed => {
        // Update FPS counter
        standardFrameCount++;
        const now = performance.now();
        if (now - lastStandardCheck >= 1000) {
          setStandardFps(Math.round((standardFrameCount * 1000) / (now - lastStandardCheck)));
          standardFrameCount = 0;
          lastStandardCheck = now;
        }

        // Animation with standard interpolators
        standardParticles.each(function (d: any, i) {
          const interpolators = standardInterpolators[i];

          // Calculate t value oscillating between 0 and 1
          const t = (Math.sin(elapsed * d.speed * 0.001) + 1) / 2;

          // Apply interpolated values
          const pos = interpolators.position(t);

          const element = d3.select(this);
          element.attr('cx', pos.x);
          element.attr('cy', pos.y);

          if (interpolationType === 'color' || interpolationType === 'mixed') {
            element.attr('fill', interpolators.color!(t));
          }

          if (interpolationType === 'mixed') {
            element.attr('r', interpolators.size(t));
          }
        });

        return false; // Continue animation
      },
      {
        name: 'Standard Animation',
        priority: 'high',
        duration: 0, // Infinite
        loop: true,
      }
    );

    // Register animation for memoized version
    const { id: memoizedAnimationId } = registerD3Timer(
      elapsed => {
        // Update FPS counter
        memoizedFrameCount++;
        const now = performance.now();
        if (now - lastMemoizedCheck >= 1000) {
          setMemoizedFps(Math.round((memoizedFrameCount * 1000) / (now - lastMemoizedCheck)));
          memoizedFrameCount = 0;
          lastMemoizedCheck = now;

          // Calculate performance gain percentage
          if (standardFps > 0 && memoizedFps > 0) {
            const gain = ((memoizedFps - standardFps) / standardFps) * 100;
            setPerformanceGain(Math.round(gain));
          }
        }

        // Skip memoized version if disabled
        if (!useMemoization) return false;

        // Animation with memoized interpolators
        memoizedParticles.each(function (d: any, i) {
          const interpolators = memoizedParticleInterpolators[i];

          // Calculate t value oscillating between 0 and 1
          const t = (Math.sin(elapsed * d.speed * 0.001) + 1) / 2;

          // Apply interpolated values
          const pos = interpolators.position(t);

          const element = d3.select(this);
          element.attr('cx', pos.x);
          element.attr('cy', pos.y);

          if (interpolationType === 'color' || interpolationType === 'mixed') {
            element.attr('fill', interpolators.color!(t));
          }

          if (interpolationType === 'mixed') {
            element.attr('r', interpolators.size(t));
          }
        });

        return false; // Continue animation
      },
      {
        name: 'Memoized Animation',
        priority: 'high',
        duration: 0, // Infinite
        loop: true,
      }
    );

    // Store animation IDs for cleanup
    animationIdsRef.current = [standardAnimationId, memoizedAnimationId];

    // Cleanup function
    return () => {
      animationIdsRef.current.forEach(id => {
        animationFrameManager.cancelAnimation(id);
      });
    };
  }, [
    isAnimating,
    width,
    height,
    particleCount,
    interpolationType,
    useMemoization,
    standardFps,
    memoizedFps,
  ]);

  // Start/stop animation
  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
  };

  // Render the cache statistics visualization
  const renderCacheStats = () => {
    if (!showStats || !cacheStats) return null;

    return (
      <div className="cache-stats">
        <h3>Cache Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">Hit Rate</div>
            <div className="stat-value">{(cacheStats.hitRate * 100).toFixed(1)}%</div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: `${cacheStats.hitRate * 100}%` }} />
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-label">Lookups</div>
            <div className="stat-value">{cacheStats.lookups.toLocaleString()}</div>
          </div>

          <div className="stat-item">
            <div className="stat-label">Cache Hits</div>
            <div className="stat-value">{cacheStats.hits.toLocaleString()}</div>
          </div>

          <div className="stat-item">
            <div className="stat-label">Cache Misses</div>
            <div className="stat-value">{cacheStats.misses.toLocaleString()}</div>
          </div>

          <div className="stat-item">
            <div className="stat-label">Cache Size</div>
            <div className="stat-value">{cacheStats.entryCount.toLocaleString()} entries</div>
          </div>

          <div className="stat-item">
            <div className="stat-label">Memory Usage</div>
            <div className="stat-value">
              {(cacheStats.estimatedMemoryUsage / 1024).toFixed(2)} KB
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-label">Time Saved</div>
            <div className="stat-value">{cacheStats.totalTimeSaved.toFixed(2)} ms</div>
          </div>

          <div className="stat-item">
            <div className="stat-label">Avg. Time Saved</div>
            <div className="stat-value">{cacheStats.avgTimeSaved.toFixed(3)} ms/call</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="interpolation-memoization-demo">
      <h2>Interpolation Memoization Demo</h2>
      <p className="demo-description">
        This demo compares the performance of standard D3 interpolation (left) with memoized
        interpolation (right) using the same number of elements and animation complexity.
      </p>

      <div className="controls">
        <div className="control-group">
          <label>
            <span>Particle Count:</span>
            <input
              type="range"
              min="100"
              max="2000"
              step="100"
              value={particleCount}
              onChange={e => setParticleCount(parseInt(e.target.value))}
              disabled={isAnimating}
            />
            <span className="value">{particleCount}</span>
          </label>
        </div>

        <div className="control-group">
          <label>
            <span>Interpolation Type:</span>
            <select
              value={interpolationType}
              onChange={e => setInterpolationType(e.target.value as any)}
              disabled={isAnimating}
            >
              <option value="position">Position Only</option>
              <option value="color">Color Only</option>
              <option value="mixed">Position + Color + Size</option>
            </select>
          </label>
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={useMemoization}
              onChange={e => setUseMemoization(e.target.checked)}
            />
            <span>Enable Memoization</span>
          </label>
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={showStats}
              onChange={e => setShowStats(e.target.checked)}
            />
            <span>Show Cache Stats</span>
          </label>
        </div>

        <div className="control-group">
          <button
            className={`toggle-button ${isAnimating ? 'stop' : 'start'}`}
            onClick={toggleAnimation}
          >
            {isAnimating ? 'Stop Animation' : 'Start Animation'}
          </button>
        </div>
      </div>

      {isAnimating && (
        <div className="performance-meter">
          <div className="fps-display">
            <div className="fps-item">
              <span className="fps-label">Standard:</span>
              <span className="fps-value">{standardFps} FPS</span>
            </div>
            <div className="fps-item">
              <span className="fps-label">Memoized:</span>
              <span className="fps-value">{memoizedFps} FPS</span>
            </div>
            <div className="fps-item performance-gain">
              <span className="fps-label">Performance Gain:</span>
              <span
                className={`fps-value ${performanceGain > 0 ? 'positive' : performanceGain < 0 ? 'negative' : ''}`}
              >
                {performanceGain > 0 ? '+' : ''}
                {performanceGain}%
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="visualization-container">
        <div className="visualization-half">
          <h3>Standard Interpolation</h3>
          <svg
            ref={standardSvgRef}
            width={width / 2}
            height={height}
            className="visualization-svg"
          />
        </div>

        <div className="visualization-half">
          <h3>Memoized Interpolation</h3>
          <svg
            ref={memoizedSvgRef}
            width={width / 2}
            height={height}
            className="visualization-svg"
          />
        </div>
      </div>

      {renderCacheStats()}

      <style jsx>{`
        .interpolation-memoization-demo {
          width: 100%;
          max-width: ${width}px;
          margin: 0 auto;
          font-family:
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            Roboto,
            sans-serif;
        }

        h2 {
          text-align: center;
          margin-bottom: 10px;
        }

        .demo-description {
          text-align: center;
          margin-bottom: 20px;
          color: #666;
        }

        .controls {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 15px;
          background: #f5f5f5;
          border-radius: 8px;
        }

        .control-group {
          margin: 5px 10px;
        }

        label {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        input[type='range'] {
          width: 150px;
        }

        select {
          padding: 5px;
          border-radius: 4px;
          border: 1px solid #ccc;
        }

        .value {
          min-width: 30px;
          text-align: right;
        }

        .toggle-button {
          padding: 8px 15px;
          border: none;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .toggle-button.start {
          background-color: #2ecc71;
          color: white;
        }

        .toggle-button.stop {
          background-color: #e74c3c;
          color: white;
        }

        .toggle-button:hover {
          opacity: 0.9;
        }

        .performance-meter {
          margin-bottom: 20px;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .fps-display {
          display: flex;
          justify-content: space-around;
          font-family: monospace;
          font-size: 1.1rem;
        }

        .fps-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .fps-label {
          font-weight: bold;
          color: #495057;
        }

        .fps-value {
          padding: 4px 8px;
          background: #e9ecef;
          border-radius: 4px;
          min-width: 80px;
          text-align: center;
        }

        .performance-gain .fps-value.positive {
          background: #d3f9d8;
          color: #2b8a3e;
        }

        .performance-gain .fps-value.negative {
          background: #ffe3e3;
          color: #c92a2a;
        }

        .visualization-container {
          display: flex;
          margin-bottom: 20px;
        }

        .visualization-half {
          flex: 1;
          text-align: center;
        }

        .visualization-half h3 {
          margin-bottom: 10px;
        }

        .visualization-svg {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
        }

        .cache-stats {
          padding: 15px;
          background: #f5f5f5;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .cache-stats h3 {
          margin-top: 0;
          margin-bottom: 15px;
          text-align: center;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
        }

        .stat-item {
          background: white;
          padding: 10px;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .stat-label {
          font-size: 0.8rem;
          color: #6c757d;
          margin-bottom: 5px;
        }

        .stat-value {
          font-size: 1.1rem;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .stat-bar {
          height: 4px;
          width: 100%;
          background: #e9ecef;
          border-radius: 2px;
          overflow: hidden;
        }

        .stat-bar-fill {
          height: 100%;
          background: #4dabf7;
          border-radius: 2px;
          transition: width 0.5s ease;
        }
      `}</style>
    </div>
  );
};

export default InterpolationMemoizationDemo;
