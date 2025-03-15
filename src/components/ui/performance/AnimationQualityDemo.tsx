import * as d3 from 'd3';
import * as React from "react";
import { useEffect, useRef, useState } from 'react';
import {
  animationQualityManager,
  bindDataWithQualityAdjustment,
  createQualityAdaptiveSimulation,
  createQualityAdaptiveVisualization,
  PerformanceTier,
  QualitySettings,
} from '../../../utils/performance/D3AnimationQualityManager';

interface AnimationQualityDemoProps {
  width?: number;
  height?: number;
}

/**
 * AnimationQualityDemo
 *
 * A demonstration of the animation quality adjustment system for D3 visualizations.
 * This component shows how animations automatically adapt to device performance
 * capabilities to maintain smooth frame rates across different devices.
 *
 * Features:
 * - Performance monitoring and reporting
 * - Quality tier visualization
 * - Manual quality overrides
 * - Visual comparison between different quality settings
 * - Real-time quality adaptation based on performance
 */
const AnimationQualityDemo: React.FC<AnimationQualityDemoProps> = ({
  width = 900,
  height = 800,
}) => {
  // References
  const visualizationContainerRef = useRef<HTMLDivElement>(null);

  // State for visualization
  const [nodeCount, setNodeCount] = useState(500);
  const [isAnimating, setIsAnimating] = useState(false);
  const [manualTier, setManualTier] = useState<PerformanceTier | 'auto'>('auto');
  const [fps, setFps] = useState(0);
  const [currentSettings, setCurrentSettings] = useState<QualitySettings>(
    animationQualityManager.getCurrentSettings()
  );
  const deviceCapabilities = useState(animationQualityManager.getDeviceCapabilities())[0];
  const [performanceState, setPerformanceState] = useState(
    animationQualityManager.getPerformanceState()
  );

  // User override settings
  const [userOverrides, setUserOverrides] = useState<Partial<QualitySettings>>({});

  // Setup quality adaptive visualization
  useEffect(() => {
    if (!visualizationContainerRef.current) return;

    // Create adaptive visualization
    const container = visualizationContainerRef.current;
    createQualityAdaptiveVisualization(container, 'quality-demo', (selection, settings) => {
      setupVisualization(selection, settings);
    });

    // Update state with current settings
    setCurrentSettings(animationQualityManager.getCurrentSettings());

    // Set up FPS monitoring
    const fpsMonitor = setInterval(() => {
      setPerformanceState(animationQualityManager.getPerformanceState());
      setFps(performanceState.currentFps);
    }, 1000);

    return () => {
      // Clean up
      animationQualityManager.unregisterAnimation('quality-demo');
      clearInterval(fpsMonitor);
    };
  }, []);

  // Setup visualization with current quality settings
  const setupVisualization = (
    selection: d3.Selection<HTMLDivElement, unknown, null, undefined>,
    settings: QualitySettings
  ) => {
    // Clear previous content
    selection.selectAll('*').remove();

    // Create SVG container
    const svgContainer = selection
      .append('svg')
      .attr('width', width)
      .attr('height', height - 200)
      .style('border', '1px solid #ccc')
      .style('border-radius', '4px')
      .style('background-color', '#f9f9f9');

    // Generate nodes based on quality settings
    const effectiveNodeCount = Math.min(nodeCount, settings.maxElementCount);
    const nodes = generateNodes(effectiveNodeCount);

    // Create force simulation with quality-appropriate settings
    const simulation = createQualityAdaptiveSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(-30 * settings.physicsDetail))
      .force('center', d3.forceCenter(width / 2, (height - 200) / 2))
      .force(
        'collision',
        d3.forceCollide().radius(d => {
          const node = d as { radius: number };
          return node.radius;
        })
      );

    if (settings.enablePhysics) {
      // Add additional forces for higher quality physics
      simulation
        .force('x', d3.forceX(width / 2).strength(0.05 * settings.physicsDetail))
        .force('y', d3.forceY((height - 200) / 2).strength(0.05 * settings.physicsDetail));
    }

    // Bind data with quality adjustment (may limit node count)
    const nodeElements = bindDataWithQualityAdjustment(
      svgContainer.selectAll('circle') as d3.Selection<Element, unknown, SVGSVGElement, unknown>,
      nodes,
      d => d.id.toString()
    );

    // Enter new nodes
    const nodeEnter = nodeElements
      .enter()
      .append('circle')
      .attr('r', d => d.radius)
      .attr('cx', width / 2)
      .attr('cy', (height - 200) / 2);

    // Apply visual complexity based on quality settings
    if (settings.visualComplexity > 0.3) {
      nodeEnter
        .style('fill', d => d.color)
        .style('stroke', '#333')
        .style('stroke-width', 1);

      // Add gradients and effects for higher visual complexity
      if (settings.visualComplexity > 0.6 && settings.enableEffects) {
        // Create gradient defs
        const defs = svgContainer.append('defs');

        nodes.forEach(node => {
          const gradient = defs
            .append('radialGradient')
            .attr('id', `gradient-${node.id}`)
            .attr('cx', '0.35')
            .attr('cy', '0.35')
            .attr('r', '0.65');

          gradient
            .append('stop')
            .attr('offset', '0%')
            .attr('stop-color', d3.rgb(node.color).brighter(1).toString());

          gradient.append('stop').attr('offset', '100%').attr('stop-color', node.color);
        });

        // Apply gradients
        nodeEnter.style('fill', d => `url(#gradient-${d.id})`);

        // Add subtle shadow for even higher quality
        if (settings.visualComplexity > 0.8) {
          defs
            .append('filter')
            .attr('id', 'shadow')
            .append('feDropShadow')
            .attr('dx', '0')
            .attr('dy', '1')
            .attr('stdDeviation', '2')
            .attr('flood-opacity', '0.3');

          nodeEnter.style('filter', 'url(#shadow)');
        }
      }
    } else {
      // Simple visuals for low quality
      nodeEnter.style('fill', d => d.color).style('stroke', 'none');
    }

    // Animation tick function
    simulation.on('tick', () => {
      // Use batched updates if enabled
      if (settings.enableBatching) {
        requestAnimationFrame(() => {
          nodeEnter.attr('cx', d => d.x as number).attr('cy', d => d.y as number);
        });
      } else {
        nodeEnter.attr('cx', d => d.x as number).attr('cy', d => d.y as number);
      }
    });

    if (isAnimating) {
      simulation.alpha(1).restart();

      // Periodically introduce energy for continuous animation
      const energizeInterval = setInterval(() => {
        if (settings.enablePhysics) {
          simulation.alpha(0.3).restart();
        }
      }, 2000);

      // Periodically change node radius for more visual activity
      const updateInterval = setInterval(() => {
        nodeEnter
          .transition()
          .duration(1000)
          .attr('r', d => d.radius * (0.8 + Math.random() * 0.4));
      }, 3000);

      // Clean up intervals when component unmounts
      return () => {
        clearInterval(energizeInterval);
        clearInterval(updateInterval);
        simulation.stop();
      };
    } else {
      simulation.stop();
    }
  };

  // Generate random nodes
  const generateNodes = (count: number) => {
    const nodes = [];
    for (let i = 0; i < count; i++) {
      nodes.push({
        id: i,
        radius: Math.random() * 10 + 5,
        color: d3.interpolateSpectral(Math.random()),
        x: Math.random() * width,
        y: Math.random() * (height - 200),
      });
    }
    return nodes;
  };

  // Toggle animation
  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
  };

  // Set quality tier manually
  const setQualityTier = (tier: PerformanceTier | 'auto') => {
    setManualTier(tier);

    if (tier === 'auto') {
      // Re-enable auto adjustment
      animationQualityManager.setAutoAdjustment(true);
    } else {
      // Disable auto adjustment and set specific tier
      animationQualityManager.setAutoAdjustment(false);
      animationQualityManager.setQualityTier(tier);
    }

    // Update state with new settings
    setCurrentSettings(animationQualityManager.getCurrentSettings());
  };

  // Update user preference
  const updateUserPreference = (key: keyof QualitySettings, value: unknown) => {
    const newOverrides = { ...userOverrides, [key]: value };
    setUserOverrides(newOverrides);

    // Apply the override
    animationQualityManager.setUserPreference(key, value);

    // Update state with new settings
    setCurrentSettings(animationQualityManager.getCurrentSettings());
  };

  // Clear user preferences
  const clearUserPreferences = () => {
    setUserOverrides({});
    animationQualityManager.clearUserPreferences();
    setCurrentSettings(animationQualityManager.getCurrentSettings());
  };

  // Render capabilities table
  const renderCapabilitiesTable = () => {
    const caps = deviceCapabilities;

    return (
      <div className="capabilities-table" style={{ marginBottom: '20px' }}>
        <h3>Detected Device Capabilities</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td>
                <strong>Device Type:</strong>
              </td>
              <td>{caps.isMobile ? 'Mobile' : 'Desktop'}</td>
              <td>
                <strong>WebGL Support:</strong>
              </td>
              <td>{caps.hasWebGL ? 'Yes' : 'No'}</td>
            </tr>
            <tr>
              <td>
                <strong>CPU Score:</strong>
              </td>
              <td>{caps.cpuScore.toFixed(1)}/100</td>
              <td>
                <strong>GPU Score:</strong>
              </td>
              <td>{caps.gpuScore.toFixed(1)}/100</td>
            </tr>
            <tr>
              <td>
                <strong>Memory Score:</strong>
              </td>
              <td>{caps.memoryScore.toFixed(1)}/100</td>
              <td>
                <strong>Connection:</strong>
              </td>
              <td>{caps.connectionType}</td>
            </tr>
            <tr>
              <td>
                <strong>Battery Saving:</strong>
              </td>
              <td>{caps.isBatterySaving ? 'Yes' : 'No'}</td>
              <td>
                <strong>Screen Category:</strong>
              </td>
              <td>{caps.screenCategory}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Render current quality settings
  const renderQualitySettings = () => {
    return (
      <div className="quality-settings" style={{ marginBottom: '20px' }}>
        <h3>Current Quality Settings</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <p>
              <strong>Quality Tier:</strong> {performanceState.currentTier}
            </p>
            <p>
              <strong>Max Elements:</strong> {currentSettings.maxElementCount}
            </p>
            <p>
              <strong>Target FPS:</strong> {currentSettings.targetFps}
            </p>
            <p>
              <strong>Current FPS:</strong>{' '}
              <span
                style={{
                  color: fps < currentSettings.targetFps * 0.7 ? 'red' : 'green',
                  fontWeight: 'bold',
                }}
              >
                {fps}
              </span>
            </p>
          </div>
          <div>
            <p>
              <strong>Visual Complexity:</strong>{' '}
              {(currentSettings.visualComplexity * 100).toFixed(0)}%
            </p>
            <p>
              <strong>Physics Enabled:</strong> {currentSettings.enablePhysics ? 'Yes' : 'No'}
            </p>
            <p>
              <strong>Physics Detail:</strong> {(currentSettings.physicsDetail * 100).toFixed(0)}%
            </p>
            <p>
              <strong>Effects Enabled:</strong> {currentSettings.enableEffects ? 'Yes' : 'No'}
            </p>
          </div>
          <div>
            <p>
              <strong>Batching Enabled:</strong> {currentSettings.enableBatching ? 'Yes' : 'No'}
            </p>
            <p>
              <strong>Memoization Enabled:</strong>{' '}
              {currentSettings.enableMemoization ? 'Yes' : 'No'}
            </p>
            <p>
              <strong>Precise Timing:</strong> {currentSettings.preciseTiming ? 'Yes' : 'No'}
            </p>
            <p>
              <strong>Animation Step Factor:</strong> {currentSettings.animationStepFactor}x
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="demo-container"
      style={{ width, padding: '20px', fontFamily: 'Arial, sans-serif' }}
    >
      <h2>Animation Quality Adjustment Demo</h2>
      <p>
        This demo shows how animations automatically adapt to device performance capabilities. The
        system detects your device's performance and adjusts visualization quality to maintain
        smooth frame rates.
      </p>

      {renderCapabilitiesTable()}

      <div className="controls" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button
            onClick={toggleAnimation}
            style={{
              padding: '8px 16px',
              backgroundColor: isAnimating ? '#f44336' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {isAnimating ? 'Stop Animation' : 'Start Animation'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label>Nodes: {nodeCount}</label>
            <input
              type="range"
              min="100"
              max="2000"
              value={nodeCount}
              onChange={e => setNodeCount(parseInt(e.target.value))}
              style={{ width: '150px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label>Quality Tier:</label>
            <select
              value={manualTier}
              onChange={e => setQualityTier(e.target.value as PerformanceTier | 'auto')}
              style={{ padding: '5px' }}
            >
              <option value="auto">Auto (Recommended)</option>
              <option value="ultra">Ultra</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>
        </div>

        {/* Quality overrides */}
        <div
          style={{
            marginTop: '15px',
            padding: '15px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Quality Overrides</h3>
            <button
              onClick={clearUserPreferences}
              style={{
                padding: '5px 10px',
                backgroundColor: '#607d8b',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Reset All Overrides
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '10px' }}>
            <div>
              <label>
                Visual Complexity:
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={userOverrides.visualComplexity ?? currentSettings.visualComplexity}
                  onChange={e =>
                    updateUserPreference('visualComplexity', parseFloat(e.target.value))
                  }
                  style={{ display: 'block', width: '150px' }}
                />
                {(
                  (userOverrides.visualComplexity ?? currentSettings.visualComplexity) * 100
                ).toFixed(0)}
                %
              </label>
            </div>

            <div>
              <label>
                Physics Detail:
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={userOverrides.physicsDetail ?? currentSettings.physicsDetail}
                  onChange={e => updateUserPreference('physicsDetail', parseFloat(e.target.value))}
                  style={{ display: 'block', width: '150px' }}
                />
                {((userOverrides.physicsDetail ?? currentSettings.physicsDetail) * 100).toFixed(0)}%
              </label>
            </div>

            <div>
              <label>
                <input
                  type="checkbox"
                  checked={userOverrides.enableEffects ?? currentSettings.enableEffects}
                  onChange={e => updateUserPreference('enableEffects', e.target.checked)}
                />
                Enable Effects
              </label>
            </div>

            <div>
              <label>
                <input
                  type="checkbox"
                  checked={userOverrides.enablePhysics ?? currentSettings.enablePhysics}
                  onChange={e => updateUserPreference('enablePhysics', e.target.checked)}
                />
                Enable Physics
              </label>
            </div>

            <div>
              <label>
                Max Elements:
                <input
                  type="number"
                  min="100"
                  max="10000"
                  step="100"
                  value={userOverrides.maxElementCount ?? currentSettings.maxElementCount}
                  onChange={e => updateUserPreference('maxElementCount', parseInt(e.target.value))}
                  style={{ width: '100px', marginLeft: '5px' }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {renderQualitySettings()}

      <div ref={visualizationContainerRef} style={{ width: '100%', height: height - 200 }}></div>

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
          The animation quality manager automatically detects your device capabilities and selects
          the optimal quality tier. It continuously monitors performance and adjusts quality
          settings to maintain smooth animations.
        </p>
        <p>Key features:</p>
        <ul>
          <li>
            <strong>Device capability detection</strong> - Analyzes CPU, GPU, memory, and other
            factors
          </li>
          <li>
            <strong>Automatic quality adjustment</strong> - Balances visual quality and performance
          </li>
          <li>
            <strong>User preference overrides</strong> - Allow fine-tuning specific aspects
          </li>
          <li>
            <strong>Performance monitoring</strong> - Continuously tracks FPS and adjusts
            accordingly
          </li>
          <li>
            <strong>Integration with existing systems</strong> - Works with our animation frame
            manager and batched updates
          </li>
        </ul>
        <p>
          This ensures consistently smooth animations across different devices from low-end mobile
          phones to high-performance desktops.
        </p>
      </div>
    </div>
  );
};

export default AnimationQualityDemo;
