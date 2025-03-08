import React, { useEffect, useRef, useState } from 'react';

// Import optimization utilities
import {
  animationQualityManager,
  QualitySettings,
} from '../../../utils/performance/D3AnimationQualityManager';

// Type definitions
interface DataDashboardAppProps {
  width?: number;
  height?: number;
}

// Data types
interface BaseDataPoint {
  id: string;
  value: number;
  category: string;
  timestamp: Date;
}

interface NetworkNode extends BaseDataPoint {
  connections: string[];
  group: string;
  size: number;
}

interface NetworkLink {
  source: string;
  target: string;
  value: number;
  type: string;
}

interface TimeSeriesPoint extends BaseDataPoint {
  timePeriod: string;
  change: number;
}

interface GeoDataPoint extends BaseDataPoint {
  region: string;
  latitude: number;
  longitude: number;
  population: number;
}

interface HierarchyNode extends BaseDataPoint {
  parentId: string | null;
  children?: HierarchyNode[];
  size: number;
}

// Enums
enum VisualizationType {
  NETWORK = 'network',
  TIMESERIES = 'timeseries',
  GEOSPATIAL = 'geospatial',
  HIERARCHY = 'hierarchy',
}

/**
 * DataDashboardApp
 *
 * A comprehensive visualization dashboard that demonstrates multiple D3 visualization types
 * optimized with our performance techniques. It shows how various visualizations can coexist
 * and interact while maintaining smooth performance.
 *
 * Features:
 * - Multi-panel visualization layout
 * - Interactive data exploration
 * - Coordinated views and cross-filtering
 * - Integrated performance optimization
 * - Type-safe implementation
 */
const DataDashboardApp: React.FC<DataDashboardAppProps> = ({ width = 1200, height = 900 }) => {
  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<SVGSVGElement>(null);
  const timeSeriesRef = useRef<SVGSVGElement>(null);
  const geoMapRef = useRef<SVGSVGElement>(null);
  const hierarchyRef = useRef<SVGSVGElement>(null);

  // State
  const [currentView, setCurrentView] = useState<VisualizationType>(VisualizationType.NETWORK);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [optimizationsEnabled, setOptimizationsEnabled] = useState(true);
  const [timeRange, setTimeRange] = useState<[Date, Date]>([
    new Date(2022, 0, 1),
    new Date(2023, 0, 1),
  ]);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [filterValue, setFilterValue] = useState<number>(0);

  // Data state
  const [networkData, setNetworkData] = useState<{ nodes: NetworkNode[]; links: NetworkLink[] }>({
    nodes: [],
    links: [],
  });
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesPoint[]>([]);
  const [geoData, setGeoData] = useState<GeoDataPoint[]>([]);
  const [hierarchyData, setHierarchyData] = useState<HierarchyNode[]>([]);

  // Quality settings
  const [qualitySettings, setQualitySettings] = useState<QualitySettings>(
    animationQualityManager.getCurrentSettings()
  );

  // Load data
  useEffect(() => {
    // In a real application, this would be an API call
    // For now, we'll generate synthetic data

    // TODO: Implement data generation functions
    const generateData = async () => {
      try {
        // Generate network data
        const networkData = generateNetworkData(50, 100);
        setNetworkData(networkData);

        // Generate time series data
        const timeSeriesData = generateTimeSeriesData(100);
        setTimeSeriesData(timeSeriesData);

        // Generate geo data
        const geoData = generateGeoData(200);
        setGeoData(geoData);

        // Generate hierarchy data
        const hierarchyData = generateHierarchyData(100);
        setHierarchyData(hierarchyData);

        // Mark data as loaded
        setDataLoaded(true);
      } catch (error) {
        console.error('Error generating data:', error);
      }
    };

    generateData();
  }, []);

  // Register with animation quality manager
  useEffect(() => {
    if (optimizationsEnabled) {
      animationQualityManager.registerAnimation('data-dashboard', settings => {
        setQualitySettings(settings);
      });
    }

    return () => {
      animationQualityManager.unregisterAnimation('data-dashboard');
    };
  }, [optimizationsEnabled]);

  // Initialize visualizations once data is loaded
  useEffect(() => {
    if (!dataLoaded) return;

    // Initialize visualizations based on current view
    switch (currentView) {
      case VisualizationType.NETWORK:
        initializeNetworkVisualization();
        break;
      case VisualizationType.TIMESERIES:
        initializeTimeSeriesVisualization();
        break;
      case VisualizationType.GEOSPATIAL:
        initializeGeoVisualization();
        break;
      case VisualizationType.HIERARCHY:
        initializeHierarchyVisualization();
        break;
    }
  }, [
    dataLoaded,
    currentView,
    networkData,
    timeSeriesData,
    geoData,
    hierarchyData,
    selectedEntities,
    timeRange,
    optimizationsEnabled,
    qualitySettings,
  ]);

  // Generate mock network data
  const generateNetworkData = (nodeCount: number, linkCount: number) => {
    const nodes: NetworkNode[] = [];
    const links: NetworkLink[] = [];

    // Generate nodes
    const groups = ['A', 'B', 'C', 'D'];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: `node-${i}`,
        value: Math.random() * 100,
        category: ['primary', 'secondary', 'tertiary'][Math.floor(Math.random() * 3)],
        timestamp: new Date(2022, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
        connections: [],
        group: groups[Math.floor(Math.random() * groups.length)],
        size: Math.random() * 10 + 5,
      });
    }

    // Generate links
    for (let i = 0; i < linkCount; i++) {
      const source = Math.floor(Math.random() * nodeCount);
      let target = Math.floor(Math.random() * nodeCount);

      // Avoid self-links
      while (target === source) {
        target = Math.floor(Math.random() * nodeCount);
      }

      const link = {
        source: `node-${source}`,
        target: `node-${target}`,
        value: Math.random() * 10,
        type: ['direct', 'indirect'][Math.floor(Math.random() * 2)],
      };

      links.push(link);

      // Update node connections
      nodes[source].connections.push(`node-${target}`);
      nodes[target].connections.push(`node-${source}`);
    }

    return { nodes, links };
  };

  // Generate mock time series data
  const generateTimeSeriesData = (pointCount: number) => {
    const data: TimeSeriesPoint[] = [];
    const categories = ['revenue', 'expenses', 'profit', 'users'];
    const timePeriods = ['Q1', 'Q2', 'Q3', 'Q4'];

    // Generate time series points
    for (let year = 2020; year <= 2023; year++) {
      for (let periodIdx = 0; periodIdx < timePeriods.length; periodIdx++) {
        for (let catIdx = 0; catIdx < categories.length; catIdx++) {
          const prevValue =
            catIdx === 0
              ? 0
              : data.find(
                  d =>
                    d.category === categories[catIdx] &&
                    d.timePeriod === timePeriods[periodIdx === 0 ? 3 : periodIdx - 1]
                )?.value || 0;

          const randomChange = Math.random() * 20 - 10; // -10 to +10
          const value = Math.max(0, prevValue + randomChange + Math.random() * 5 + 50);

          data.push({
            id: `ts-${year}-${timePeriods[periodIdx]}-${categories[catIdx]}`,
            value,
            category: categories[catIdx],
            timestamp: new Date(year, periodIdx * 3, 15), // Quarterly data
            timePeriod: `${year}-${timePeriods[periodIdx]}`,
            change: value - prevValue,
          });
        }
      }
    }

    return data;
  };

  // Generate mock geo data
  const generateGeoData = (pointCount: number) => {
    const data: GeoDataPoint[] = [];
    const regions = ['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania'];

    // Generate geo points
    for (let i = 0; i < pointCount; i++) {
      const region = regions[Math.floor(Math.random() * regions.length)];

      // Generate latitude/longitude based on rough region bounds
      let latitude, longitude;
      switch (region) {
        case 'North America':
          latitude = 30 + Math.random() * 20;
          longitude = -130 + Math.random() * 60;
          break;
        case 'Europe':
          latitude = 40 + Math.random() * 15;
          longitude = -10 + Math.random() * 50;
          break;
        case 'Asia':
          latitude = 10 + Math.random() * 40;
          longitude = 60 + Math.random() * 80;
          break;
        case 'South America':
          latitude = -40 + Math.random() * 40;
          longitude = -80 + Math.random() * 30;
          break;
        case 'Africa':
          latitude = -30 + Math.random() * 50;
          longitude = -20 + Math.random() * 60;
          break;
        case 'Oceania':
          latitude = -40 + Math.random() * 30;
          longitude = 110 + Math.random() * 50;
          break;
        default:
          latitude = Math.random() * 180 - 90;
          longitude = Math.random() * 360 - 180;
      }

      data.push({
        id: `geo-${i}`,
        value: Math.random() * 100,
        category: ['customers', 'sales', 'partners'][Math.floor(Math.random() * 3)],
        timestamp: new Date(2022, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
        region,
        latitude,
        longitude,
        population: Math.floor(Math.random() * 1000000),
      });
    }

    return data;
  };

  // Generate mock hierarchy data
  const generateHierarchyData = (nodeCount: number) => {
    const data: HierarchyNode[] = [];

    // Create root node
    data.push({
      id: 'root',
      value: 1000,
      category: 'root',
      timestamp: new Date(),
      parentId: null,
      size: 100,
    });

    // Create first level children
    const firstLevelCount = 5;
    for (let i = 0; i < firstLevelCount; i++) {
      data.push({
        id: `level1-${i}`,
        value: 200 + Math.random() * 200,
        category: ['category-A', 'category-B', 'category-C'][Math.floor(Math.random() * 3)],
        timestamp: new Date(),
        parentId: 'root',
        size: 50 + Math.random() * 20,
      });
    }

    // Create second level children
    const remainingNodes = nodeCount - 1 - firstLevelCount;
    const nodesPerFirstLevel = Math.floor(remainingNodes / firstLevelCount);

    for (let i = 0; i < firstLevelCount; i++) {
      for (let j = 0; j < nodesPerFirstLevel; j++) {
        data.push({
          id: `level2-${i}-${j}`,
          value: 50 + Math.random() * 100,
          category: ['subcategory-1', 'subcategory-2', 'subcategory-3'][
            Math.floor(Math.random() * 3)
          ],
          timestamp: new Date(),
          parentId: `level1-${i}`,
          size: 20 + Math.random() * 10,
        });
      }
    }

    return data;
  };

  // Visualization initialization functions
  // These will be replaced with actual D3 visualizations in future steps

  const initializeNetworkVisualization = () => {
    if (!networkRef.current) return;
    console.log('Initializing network visualization');
    // TODO: Implement network visualization
  };

  const initializeTimeSeriesVisualization = () => {
    if (!timeSeriesRef.current) return;
    console.log('Initializing time series visualization');
    // TODO: Implement time series visualization
  };

  const initializeGeoVisualization = () => {
    if (!geoMapRef.current) return;
    console.log('Initializing geo visualization');
    // TODO: Implement geo visualization
  };

  const initializeHierarchyVisualization = () => {
    if (!hierarchyRef.current) return;
    console.log('Initializing hierarchy visualization');
    // TODO: Implement hierarchy visualization
  };

  // Event handlers
  const handleViewChange = (view: VisualizationType) => {
    setCurrentView(view);
  };

  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
  };

  const toggleOptimizations = () => {
    setOptimizationsEnabled(!optimizationsEnabled);
  };

  const handleEntitySelection = (entityId: string) => {
    setSelectedEntities(prev => {
      if (prev.includes(entityId)) {
        return prev.filter(id => id !== entityId);
      } else {
        return [...prev, entityId];
      }
    });
  };

  const handleTimeRangeChange = (range: [Date, Date]) => {
    setTimeRange(range);
  };

  const handleFilterChange = (value: number) => {
    setFilterValue(value);
  };

  // Rendering
  return (
    <div
      className="data-dashboard-app"
      ref={containerRef}
      style={{
        width,
        height,
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        className="dashboard-header"
        style={{
          padding: '1rem',
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ddd',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Data Visualization Dashboard</h1>
        <p>A comprehensive showcase of optimized D3 visualizations</p>

        <div
          className="dashboard-controls"
          style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '0.5rem',
          }}
        >
          <div className="view-selector" style={{ display: 'flex', gap: '0.5rem' }}>
            {Object.values(VisualizationType).map(type => (
              <button
                key={type}
                onClick={() => handleViewChange(type)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: currentView === type ? '#2196F3' : '#e0e0e0',
                  color: currentView === type ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={toggleAnimation}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isAnimating ? '#f44336' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {isAnimating ? 'Stop Animation' : 'Start Animation'}
          </button>

          <button
            onClick={toggleOptimizations}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: optimizationsEnabled ? '#9C27B0' : '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {optimizationsEnabled ? 'Optimizations On' : 'Optimizations Off'}
          </button>
        </div>
      </div>

      <div
        className="dashboard-main"
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '70% 30%',
          gridTemplateRows: '60% 40%',
          gap: '1rem',
          padding: '1rem',
          overflow: 'hidden',
        }}
      >
        <div
          className="main-visualization"
          style={{
            gridColumn: '1',
            gridRow: '1 / span 2',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {currentView === VisualizationType.NETWORK && (
            <svg ref={networkRef} width="100%" height="100%"></svg>
          )}

          {currentView === VisualizationType.TIMESERIES && (
            <svg ref={timeSeriesRef} width="100%" height="100%"></svg>
          )}

          {currentView === VisualizationType.GEOSPATIAL && (
            <svg ref={geoMapRef} width="100%" height="100%"></svg>
          )}

          {currentView === VisualizationType.HIERARCHY && (
            <svg ref={hierarchyRef} width="100%" height="100%"></svg>
          )}

          {!dataLoaded && (
            <div
              className="loading-overlay"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
              }}
            >
              <div>Loading visualization data...</div>
            </div>
          )}
        </div>

        <div
          className="detail-panel"
          style={{
            gridColumn: '2',
            gridRow: '1',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
            borderRadius: '4px',
            padding: '1rem',
            overflow: 'auto',
          }}
        >
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>Details</h2>

          {selectedEntities.length > 0 ? (
            <div className="selected-entities">
              <h3>Selected Items</h3>
              <ul>
                {selectedEntities.map(id => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="no-selection">
              <p>No items selected. Click on elements in the visualization to see details.</p>
            </div>
          )}
        </div>

        <div
          className="controls-panel"
          style={{
            gridColumn: '2',
            gridRow: '2',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
            borderRadius: '4px',
            padding: '1rem',
            overflow: 'auto',
          }}
        >
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>Controls</h2>

          <div className="filter-controls" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Filter by value: {filterValue}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={filterValue}
              onChange={e => handleFilterChange(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div className="time-range-controls">
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Time Range</h3>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}
            >
              <span>{timeRange[0].toLocaleDateString()}</span>
              <span>{timeRange[1].toLocaleDateString()}</span>
            </div>
            {/* This is a simplified time range selector - would be replaced with a proper date range picker */}
            <input
              type="range"
              min="0"
              max="100"
              value={50}
              onChange={() => {}}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      <div
        className="dashboard-footer"
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#f5f5f5',
          borderTop: '1px solid #ddd',
          fontSize: '0.8rem',
          color: '#666',
        }}
      >
        <div>
          Quality Tier:{' '}
          {qualitySettings.visualComplexity >= 0.8
            ? 'High'
            : qualitySettings.visualComplexity >= 0.5
              ? 'Medium'
              : 'Low'}
        </div>
      </div>
    </div>
  );
};

export default DataDashboardApp;
