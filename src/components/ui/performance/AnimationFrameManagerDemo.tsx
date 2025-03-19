import * as d3 from 'd3';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  animationFrameManager,
  AnimationPriority,
  registerD3Timer,
} from '../../../utils/performance/D3AnimationFrameManager';

interface AnimationFrameManagerDemoProps {
  width?: number;
  height?: number;
}

/**
 * Demo component showcasing the animation frame manager capabilities
 *
 * This demonstrates:
 * 1. Multiple coordinated animations in a single requestAnimationFrame loop
 * 2. Priority-based animation scheduling
 * 3. Visibility-based optimization
 * 4. Animation synchronization
 * 5. Performance monitoring
 */
const AnimationFrameManagerDemo: React.FC<AnimationFrameManagerDemoProps> = ({
  width = 900,
  height = 600,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [managerStatus, setManagerStatus] = useState<{
    isRunning: boolean;
    animationCount: number;
    runningAnimations: number;
    frameCount: number;
    currentFps: number;
    syncGroups: number;
    averageFrameTime: number;
  }>({
    isRunning: false,
    animationCount: 0,
    runningAnimations: 0,
    frameCount: 0,
    currentFps: 0,
    syncGroups: 0,
    averageFrameTime: 0,
  });
  const [registeredAnimations, setRegisteredAnimations] = useState<
    Array<{
      id: string;
      name: string;
      status: string;
      priority: AnimationPriority;
      visibility: string;
      type: string;
      elapsedTime: number;
    }>
  >([]);
  const [selectedAnimation, setSelectedAnimation] = useState<string | null>(null);

  // Animation groups state
  const [circleAnimations, setCircleAnimations] = useState<{ id: string; name: string }[]>([]);
  const [pathAnimations, setPathAnimations] = useState<{ id: string; name: string }[]>([]);
  const [backgroundAnimations, setBackgroundAnimations] = useState<{ id: string; name: string }[]>(
    []
  );

  // Store animation IDs for management
  const animationIdsRef = useRef<Record<string, string>>({});

  // Update status display periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setManagerStatus(animationFrameManager.getStatus());
      setRegisteredAnimations(animationFrameManager.getAnimations());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Create and set up animations on mount
  useEffect(() => {
    if (!svgRef.current) return;

    // Clear any existing content
    d3.select(svgRef.current).selectAll('*').remove();

    // Set up container
    const svg = d3.select(svgRef.current);
    const circleGroup = svg.append('g').attr('class', 'circle-animations');
    const pathGroup = svg.append('g').attr('class', 'path-animations');
    const backgroundGroup = svg
      .append('g')
      .attr('class', 'background-animations')
      .style('opacity', 0.2);

    // 1. Set up circle animations (high priority)
    const circleCount = 10;
    const circleAnimationIds: { id: string; name: string }[] = [];

    for (let i = 0; i < circleCount; i++) {
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = 20 + i * 15;
      const angle = (i / circleCount) * Math.PI * 2;

      // Create circle
      const circle = circleGroup
        .append('circle')
        .attr('cx', centerX + Math.cos(angle) * radius)
        .attr('cy', centerY + Math.sin(angle) * radius)
        .attr('r', 10)
        .attr('fill', d3.interpolateRainbow(i / circleCount));

      // Register animation with frame manager
      const { id } = registerD3Timer(
        elapsed => {
          const speed = 0.002 + i * 0.0005;
          const currentAngle = angle + elapsed * speed;

          circle
            .attr('cx', centerX + Math.cos(currentAngle) * radius)
            .attr('cy', centerY + Math.sin(currentAngle) * radius);

          return false; // Continue animation
        },
        {
          name: `Circle ${i + 1}`,
          priority: 'high',
          duration: 0, // Infinite
          loop: true,
          runWhenHidden: false,
          enableProfiling: true,
        }
      );

      // Store animation ID
      const animName = `circle-${i + 1}`;
      animationIdsRef.current[animName] = id;
      circleAnimationIds.push({ id, name: `Circle ${i + 1}` });
    }

    setCircleAnimations(circleAnimationIds);

    // 2. Set up path animations (medium priority)
    const pathCount = 5;
    const pathAnimationIds: { id: string; name: string }[] = [];

    for (let i = 0; i < pathCount; i++) {
      const pathGenerator = d3
        .line<[number, number]>()
        .x(d => d[0])
        .y(d => d[1])
        .curve(d3.curveCatmullRom.alpha(0.5));

      // Create random control points
      const points: [number, number][] = Array(5)
        .fill(0)
        .map(() => [
          Math.random() * width * 0.8 + width * 0.1,
          Math.random() * height * 0.8 + height * 0.1,
        ]);

      // Create path
      const path = pathGroup
        .append('path')
        .attr('d', pathGenerator(points))
        .attr('fill', 'none')
        .attr('stroke', d3.interpolateViridis(i / pathCount))
        .attr('stroke-width', 4)
        .attr('stroke-linecap', 'round');

      // Create marker to animate along path
      const marker = pathGroup
        .append('circle')
        .attr('r', 8)
        .attr('fill', d3.interpolateViridis(i / pathCount));

      // Register animation with frame manager
      const { id } = registerD3Timer(
        elapsed => {
          // Calculate position along path
          const pathNode = path.node();
          if (!pathNode) return false;

          const pathLength = pathNode.getTotalLength();
          const speed = 0.1 + i * 0.05;
          const position = (elapsed * speed) % pathLength;

          // Position marker at point
          const point = pathNode.getPointAtLength(position);
          marker.attr('cx', point.x).attr('cy', point.y);

          return false; // Continue animation
        },
        {
          name: `Path ${i + 1}`,
          priority: 'medium',
          duration: 0, // Infinite
          loop: true,
          runWhenHidden: false,
          enableProfiling: true,
        }
      );

      // Store animation ID
      const animName = `path-${i + 1}`;
      animationIdsRef.current[animName] = id;
      pathAnimationIds.push({ id, name: `Path ${i + 1}` });
    }

    setPathAnimations(pathAnimationIds);

    // 3. Set up background animations (low priority)
    const bgCount = 50;
    const bgAnimationIds: { id: string; name: string }[] = [];

    for (let i = 0; i < bgCount; i++) {
      // Create random position
      const x = Math.random() * width;
      const y = Math.random() * height;

      // Create background element
      const bgElement = backgroundGroup
        .append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 2 + Math.random() * 5)
        .attr('fill', d3.interpolateCool(Math.random()));

      // Register animation with frame manager
      const { id } = registerD3Timer(
        elapsed => {
          // Simple pulsing animation
          const scale = 1 + 0.5 * Math.sin(elapsed * (0.001 + Math.random() * 0.002));

          bgElement.attr('r', (2 + Math.random() * 5) * scale);

          return false; // Continue animation
        },
        {
          name: `Background ${i + 1}`,
          priority: 'background',
          duration: 0, // Infinite
          loop: true,
          runWhenHidden: true, // Background animations keep running
          enableProfiling: false, // Don't profile background animations
        }
      );

      // Only store every 10th background animation for UI
      if (i % 10 === 0) {
        const animName = `bg-${i + 1}`;
        animationIdsRef.current[animName] = id;
        bgAnimationIds.push({ id, name: `Background ${i + 1}` });
      }
    }

    setBackgroundAnimations(bgAnimationIds);

    // Cleanup function
    return () => {
      // Cancel all animations on unmount
      Object.values(animationIdsRef.current).forEach(id => {
        animationFrameManager.cancelAnimation(id);
      });
    };
  }, [width, height]);

  // Control panel functions
  const handlePauseAll = () => {
    Object.values(animationIdsRef.current).forEach(id => {
      animationFrameManager.pauseAnimation(id);
    });
  };

  const handleResumeAll = () => {
    Object.values(animationIdsRef.current).forEach(id => {
      animationFrameManager.resumeAnimation(id);
    });
  };

  const handlePauseGroup = (group: 'circles' | 'paths' | 'background') => {
    const ids =
      group === 'circles'
        ? circleAnimations.map(a => a.id)
        : group === 'paths'
          ? pathAnimations.map(a => a.id)
          : backgroundAnimations.map(a => a.id);

    ids.forEach(id => {
      animationFrameManager.pauseAnimation(id);
    });
  };

  const handleResumeGroup = (group: 'circles' | 'paths' | 'background') => {
    const ids =
      group === 'circles'
        ? circleAnimations.map(a => a.id)
        : group === 'paths'
          ? pathAnimations.map(a => a.id)
          : backgroundAnimations.map(a => a.id);

    ids.forEach(id => {
      animationFrameManager.resumeAnimation(id);
    });
  };

  const handleSelectAnimation = (id: string) => {
    setSelectedAnimation(id === selectedAnimation ? null : id);
  };

  const handleChangePriority = (id: string, priority: AnimationPriority) => {
    animationFrameManager.updatePriority(id, priority);
  };

  return (
    <div className="animation-frame-manager-demo" ref={containerRef}>
      <h2>Animation Frame Manager Demo</h2>

      <div className="demo-layout">
        <div className="animation-container">
          <svg ref={svgRef} width={width} height={height} className="animation-svg"></svg>
        </div>

        <div className="control-panel">
          <div className="manager-status">
            <h3>Manager Status</h3>
            <div className="status-grid">
              <div className="status-item">
                <div className="status-label">Status</div>
                <div className="status-value">{managerStatus.isRunning ? 'Running' : 'Idle'}</div>
              </div>
              <div className="status-item">
                <div className="status-label">Animations</div>
                <div className="status-value">
                  {managerStatus.runningAnimations} / {managerStatus.animationCount}
                </div>
              </div>
              <div className="status-item">
                <div className="status-label">FPS</div>
                <div className="status-value">{managerStatus.currentFps.toFixed(1)}</div>
              </div>
              <div className="status-item">
                <div className="status-label">Frame Time</div>
                <div className="status-value">{managerStatus.averageFrameTime.toFixed(2)} ms</div>
              </div>
              <div className="status-item">
                <div className="status-label">Sync Groups</div>
                <div className="status-value">{managerStatus.syncGroups}</div>
              </div>
              <div className="status-item">
                <div className="status-label">Frames</div>
                <div className="status-value">{managerStatus.frameCount}</div>
              </div>
            </div>
          </div>

          <div className="control-actions">
            <h3>Animation Controls</h3>
            <div className="button-grid">
              <button onClick={handlePauseAll} className="btn btn-primary">
                Pause All
              </button>
              <button onClick={handleResumeAll} className="btn btn-primary">
                Resume All
              </button>

              <button onClick={() => handlePauseGroup('circles')} className="btn">
                Pause Circles
              </button>
              <button onClick={() => handleResumeGroup('circles')} className="btn">
                Resume Circles
              </button>

              <button onClick={() => handlePauseGroup('paths')} className="btn">
                Pause Paths
              </button>
              <button onClick={() => handleResumeGroup('paths')} className="btn">
                Resume Paths
              </button>

              <button onClick={() => handlePauseGroup('background')} className="btn">
                Pause Background
              </button>
              <button onClick={() => handleResumeGroup('background')} className="btn">
                Resume Background
              </button>
            </div>
          </div>

          <div className="animation-list">
            <h3>Active Animations</h3>
            <div className="list-container">
              {registeredAnimations.length === 0 ? (
                <div className="empty-state">No active animations</div>
              ) : (
                <ul>
                  {registeredAnimations.map(anim => (
                    <li
                      key={anim.id}
                      className={selectedAnimation === anim.id ? 'selected' : ''}
                      onClick={() => handleSelectAnimation(anim.id)}
                    >
                      <div className="animation-item">
                        <div className="animation-name">{anim.name}</div>
                        <div className="animation-meta">
                          <span className={`status-badge ${anim.status}`}>{anim.status}</span>
                          <span className={`priority-badge ${anim.priority}`}>{anim.priority}</span>
                        </div>

                        {selectedAnimation === anim.id && (
                          <div className="animation-details">
                            <div className="detail-item">
                              <span className="detail-label">Type:</span>
                              <span className="detail-value">{anim.type}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Visibility:</span>
                              <span className="detail-value">{anim.visibility}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Elapsed:</span>
                              <span className="detail-value">
                                {(anim.elapsedTime / 1000).toFixed(1)}s
                              </span>
                            </div>

                            <div className="detail-actions">
                              <label>
                                Priority:
                                <select
                                  value={anim.priority}
                                  onChange={e =>
                                    handleChangePriority(
                                      anim.id,
                                      e.target.value as AnimationPriority
                                    )
                                  }
                                >
                                  <option value="critical">Critical</option>
                                  <option value="high">High</option>
                                  <option value="medium">Medium</option>
                                  <option value="low">Low</option>
                                  <option value="background">Background</option>
                                </select>
                              </label>

                              <div className="action-buttons">
                                {anim.status === 'running' ? (
                                  <button
                                    onClick={() => animationFrameManager.pauseAnimation(anim.id)}
                                  >
                                    Pause
                                  </button>
                                ) : anim.status === 'paused' ? (
                                  <button
                                    onClick={() => animationFrameManager.resumeAnimation(anim.id)}
                                  >
                                    Resume
                                  </button>
                                ) : null}

                                <button
                                  onClick={() => animationFrameManager.cancelAnimation(anim.id)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animation-frame-manager-demo {
          width: 100%;
          max-width: ${width + 400}px;
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
          margin-bottom: 20px;
        }

        .demo-layout {
          display: flex;
          gap: 20px;
        }

        .animation-container {
          flex: 3;
        }

        .animation-svg {
          width: 100%;
          height: ${height}px;
          background: #f8f9fa;
          border: 1px solid #ddd;
          border-radius: 8px;
        }

        .control-panel {
          flex: 2;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .manager-status,
        .control-actions,
        .animation-list {
          background: #f5f5f5;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        h3 {
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 1.1rem;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .status-item {
          background: white;
          padding: 10px;
          border-radius: 4px;
        }

        .status-label {
          font-size: 0.8rem;
          color: #666;
          margin-bottom: 5px;
        }

        .status-value {
          font-size: 1.1rem;
          font-weight: 600;
        }

        .button-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .btn {
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          background: #e9ecef;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .btn:hover {
          background: #dee2e6;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background: #0069d9;
        }

        .animation-list {
          flex: 1;
          min-height: 200px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .list-container {
          flex: 1;
          overflow-y: auto;
        }

        .empty-state {
          padding: 20px;
          text-align: center;
          color: #666;
        }

        ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        li {
          padding: 8px 12px;
          border-radius: 4px;
          margin-bottom: 5px;
          background: white;
          cursor: pointer;
        }

        li:hover {
          background: #f1f3f5;
        }

        li.selected {
          background: #e7f5ff;
          border-left: 3px solid #339af0;
        }

        .animation-item {
          display: flex;
          flex-direction: column;
        }

        .animation-name {
          font-weight: 500;
        }

        .animation-meta {
          display: flex;
          gap: 5px;
          margin-top: 5px;
        }

        .status-badge,
        .priority-badge {
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .status-badge.running {
          background: #d3f9d8;
          color: #2b8a3e;
        }

        .status-badge.paused {
          background: #fff3bf;
          color: #e67700;
        }

        .status-badge.completed {
          background: #e7f5ff;
          color: #1864ab;
        }

        .status-badge.error {
          background: #ffe3e3;
          color: #c92a2a;
        }

        .priority-badge.critical {
          background: #ffe3e3;
          color: #c92a2a;
        }

        .priority-badge.high {
          background: #fff0f6;
          color: #a61e4d;
        }

        .priority-badge.medium {
          background: #e7f5ff;
          color: #1864ab;
        }

        .priority-badge.low {
          background: #f8f9fa;
          color: #495057;
        }

        .priority-badge.background {
          background: #f1f3f5;
          color: #868e96;
        }

        .animation-details {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #e9ecef;
          font-size: 0.85rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }

        .detail-label {
          color: #666;
        }

        .detail-value {
          font-weight: 500;
        }

        .detail-actions {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .detail-actions select {
          margin-left: 5px;
          padding: 3px;
          border-radius: 3px;
        }

        .action-buttons {
          display: flex;
          gap: 5px;
        }

        .action-buttons button {
          flex: 1;
          padding: 3px 6px;
          border: none;
          border-radius: 3px;
          background: #e9ecef;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .action-buttons button:hover {
          background: #dee2e6;
        }
      `}</style>
    </div>
  );
};

export default AnimationFrameManagerDemo;
