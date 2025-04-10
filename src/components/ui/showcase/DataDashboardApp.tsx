import * as d3 from 'd3';
import { Feature } from 'geojson';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Import optimization utilities
import {
    animationQualityManager,
    QualitySettings,
} from '../../../utils/performance/D3AnimationQualityManager';

// Import type-safe D3 utilities
import { AnimationConfig } from '../../../types/visualizations/D3AnimationTypes';
import { createSimulationDragBehavior } from '../../../types/visualizations/D3DragTypes';
import {
    d3Accessors,
    SimulationLinkDatum,
    SimulationNodeDatum
} from '../../../types/visualizations/D3Types';
import {
    createSvgZoomBehavior,
    getFitToViewportTransform
} from '../../../types/visualizations/D3ZoomTypes';

// Fix import path for error logging service
import { errorLoggingService, ErrorSeverity, ErrorType } from '../../../services/ErrorLoggingService';

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

// D3 simulation node interface with proper typing
interface D3NetworkNode extends SimulationNodeDatum<NetworkNode> {
  id: string;
  value: number;
  category: string;
  group: string;
  size: number;
  color?: string;
  radius?: number;
  // Reference to original data
  data?: NetworkNode;
}

// D3 simulation link interface with proper typing
interface _D3Link extends SimulationLinkDatum<D3NetworkNode> {
  source: string | D3NetworkNode;
  target: string | D3NetworkNode;
  value: number;
  type: string;
  width?: number;
  color?: string;
}

// D3 time series chart types with proper type safety
interface D3TimeSeriesPoint {
  id: string;
  date: Date;
  value: number;
  category: string;
  color?: string;
  originalData?: TimeSeriesPoint; // Reference to original data
}

// Interface for grouped time series data
interface CategorySeries {
  category: string;
  color: string;
  points: D3TimeSeriesPoint[];
}

// Animation configuration for time series
interface _TimeSeriesAnimationConfig extends AnimationConfig {
  // Additional animation settings specific to time series
  staggerDelay?: number; // Delay between animating different series
  pointDelay?: number; // Delay between animating different points
  lineAnimationType?: 'grow' | 'fade' | 'draw'; // How the line should animate
}

// Enums
enum VisualizationType {
  NETWORK = 'network',
  TIMESERIES = 'timeseries',
  GEOSPATIAL = 'geospatial',
  HIERARCHY = 'hierarchy',
}

// Extended quality settings for all visualization types
interface ExtendedQualitySettings extends QualitySettings {
  // Node rendering settings
  nodeDetailLevel: number;
  linkDetailLevel: number;
  showLabels: boolean;
  textScaleFactor: number;

  // Time series visualization settings
  lineWidth: number;
  pointRadius: number;
  animationsEnabled: boolean;
  animationDuration: number;
  showGridLines: boolean;
  maxDataPointsPerSeries: number;
  downsampling: boolean;

  // Geographic visualization settings
  mapProjection: 'mercator' | 'equalEarth' | 'orthographic' | 'naturalEarth';
  mapDetailLevel: 'low' | 'medium' | 'high';
  showGraticules: boolean;
  pointSizeScale: number;
  showTooltips: boolean;

  // Hierarchical visualization settings
  hierarchyLayout: 'tree' | 'treemap' | 'cluster' | 'radial';
  treeOrientation: 'vertical' | 'horizontal' | 'radial';
  nodeColor: 'byCategory' | 'byValue' | 'byDepth';
  linkStyle: 'straight' | 'curved' | 'diagonal' | 'step';
  treemapTiling: 'binary' | 'squarify' | 'slice' | 'dice' | 'sliceDice';
  includeSizeEncoding: boolean;
}

// Type for drag behavior with SVG circles
type CircleDragBehavior = d3.DragBehavior<SVGCircleElement, D3NetworkNode, unknown>;

// D3 geo data types with proper type safety
interface D3GeoPoint {
  id: string;
  coordinates: [number, number]; // [longitude, latitude]
  value: number;
  category: string;
  color?: string;
  radius?: number;
  region: string;
  population: number;
  originalData?: GeoDataPoint; // Reference to original data
}

// Interface for grouped geographic data
interface GeoCategory {
  category: string;
  color: string;
  points: D3GeoPoint[];
}

// GeoJSON world map type
interface WorldMapData {
  features: Feature[];
  type: string;
}

// D3 hierarchical data types with proper type safety
interface D3HierarchyNode {
  id: string;
  name: string;
  value: number;
  size: number;
  category: string;
  depth?: number;
  color?: string;
  children?: D3HierarchyNode[];
  originalData?: HierarchyNode; // Reference to original data
}

// Define a custom type for treemap tiling functions
type TreemapTilingFunc = (
  node: d3.HierarchyRectangularNode<D3HierarchyNode>,
  x0: number,
  y0: number,
  x1: number,
  y1: number
) => void;

// Define a custom type for hierarchy point links
interface CustomHierarchyPointLink {
  source: {
    x: number;
    y: number;
    data: D3HierarchyNode;
  };
  target: {
    x: number;
    y: number;
    data: D3HierarchyNode;
  };
}

// Type for D3's link data structure
interface D3LinkDatum {
  x: number;
  y: number;
  data?: D3HierarchyNode;
  // Other optional properties that might be present
  [key: string]: number | D3HierarchyNode | undefined;
}

// Type for D3's link structure
interface D3Link {
  source: D3LinkDatum;
  target: D3LinkDatum;
}

// Type definition for d3.hierarchy result with proper typing
// Using a type that doesn't extend HierarchyNode directly to avoid the 'this' type issue
interface HierarchyDatum {
  x?: number;
  y?: number;
  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;
  depth: number;
  height: number;
  parent: HierarchyDatum | null;
  children?: HierarchyDatum[];
  data: D3HierarchyNode;
  // Add methods from HierarchyNode that we need
  ancestors(): HierarchyDatum[];
  descendants(): HierarchyDatum[];
  leaves(): HierarchyDatum[];
  find(filter: (node: HierarchyDatum) => boolean): HierarchyDatum | undefined;
  path(target: HierarchyDatum): HierarchyDatum[];
  links(): Array<{ source: HierarchyDatum; target: HierarchyDatum }>;
  sum(value: (d: D3HierarchyNode) => number): HierarchyDatum;
  sort(compare: (a: HierarchyDatum, b: HierarchyDatum) => number): HierarchyDatum;
  count(): HierarchyDatum;
  copy(): HierarchyDatum;
  each(callback: (node: HierarchyDatum) => void): HierarchyDatum;
  eachAfter(callback: (node: HierarchyDatum) => void): HierarchyDatum;
  eachBefore(callback: (node: HierarchyDatum) => void): HierarchyDatum;
  [Symbol.iterator](): Iterator<HierarchyDatum>;
}

// Define a proper interface for the link data expected by d3.linkHorizontal
interface D3LinkData {
  source: [number, number];
  target: [number, number];
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
export const DataDashboardApp: React.FC<DataDashboardAppProps> = ({
  width = 1200,
  height = 900,
}) => {
  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<SVGSVGElement>(null);
  const timeSeriesRef = useRef<SVGSVGElement>(null);
  const geoMapRef = useRef<SVGSVGElement>(null);
  const hierarchyRef = useRef<SVGSVGElement>(null);

  // Simulation state reference for force-directed graph
  const simulationRef = useRef<d3.Simulation<D3NetworkNode, _D3Link> | null>(null);

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

  // World map GeoJSON data reference
  const [worldMapData, setWorldMapData] = useState<WorldMapData | null>(null);

  // State for hierarchical visualization layout type
  const [hierarchyLayoutType, setHierarchyLayoutType] =
    useState<ExtendedQualitySettings['hierarchyLayout']>('tree');

  // Define data conversion functions before they are used in initialization callbacks
  /**
   * Converts network data to D3-compatible format with proper typing
   * This creates new objects with additional properties needed for D3
   * while maintaining references to the original data
   */
  const convertNetworkDataToD3Format = useCallback(() => {
    // Create node map for quick lookups
    const nodeMap = new Map<string, D3NetworkNode>();

    // Convert nodes with proper typing
    const nodes: D3NetworkNode[] = networkData.nodes.map(node => {
      // Create a color based on the group
      let color = '';
      switch (node.group) {
        case 'A':
          color = '#4285F4';
          break; // Blue
        case 'B':
          color = '#EA4335';
          break; // Red
        case 'C':
          color = '#FBBC05';
          break; // Yellow
        case 'D':
          color = '#34A853';
          break; // Green
        default:
          color = '#9AA0A6'; // Grey
      }

      // Calculate radius based on size and current quality settings
      const baseRadius = Math.sqrt(node.size) * 3;
      // Cast to ExtendedQualitySettings to use the additional properties
      const extendedSettings = qualitySettings as ExtendedQualitySettings;
      const nodeDetailLevel = extendedSettings.nodeDetailLevel || 1; // Default to 1 if not defined
      const radius = optimizationsEnabled ? baseRadius * nodeDetailLevel : baseRadius;

      // Create D3 node with proper typing
      const d3Node: D3NetworkNode = {
        id: node.id,
        value: node.value,
        category: node.category,
        group: node.group,
        size: node.size,
        color,
        radius,
        // Store reference to original data
        data: node,
      };

      // Add to map for quick lookups when creating links
      nodeMap.set(node.id, d3Node);

      return d3Node;
    });

    // Convert links with proper typing
    const links: _D3Link[] = networkData.links.map(link => {
      // Calculate link width based on value and quality settings
      const baseWidth = Math.sqrt(link.value) * 1.5;
      // Cast to ExtendedQualitySettings to use the additional properties
      const extendedSettings = qualitySettings as ExtendedQualitySettings;
      const linkDetailLevel = extendedSettings.linkDetailLevel || 1; // Default to 1 if not defined
      const width = optimizationsEnabled ? baseWidth * linkDetailLevel : baseWidth;

      // Create color based on link type
      const color = link.type === 'direct' ? '#4285F4' : '#9AA0A6';

      // Create D3 link with proper typing
      const d3Link: _D3Link = {
        source: link.source,
        target: link.target,
        value: link.value,
        type: link.type,
        width,
        color,
      };

      return d3Link;
    });

    return { nodes, links, nodeMap };
  }, [networkData, optimizationsEnabled, qualitySettings]);

  /**
   * Converts time series data to D3-compatible format with proper typing
   * Creates points and series objects needed for D3 visualization
   */
  const convertTimeSeriesDataToD3Format = useCallback(() => {
    // Create color mapping for consistent colors per category
    const categoryColors: Record<string, string> = {
      revenue: '#4285F4', // Blue
      expenses: '#EA4335', // Red
      profit: '#34A853', // Green
      users: '#FBBC05', // Yellow
    };

    // Convert points with proper typing
    const points: D3TimeSeriesPoint[] = timeSeriesData.map(point => {
      // Get color based on category
      const color = categoryColors[point.category] || '#9AA0A6';

      // Create D3 point with proper typing
      const d3Point: D3TimeSeriesPoint = {
        id: point.id,
        date: point.timestamp,
        value: point.value,
        category: point.category,
        color,
        originalData: point,
      };

      return d3Point;
    });

    // Group points by category for line generation
    const categories = Array.from(new Set(points.map(p => p.category)));
    const series: CategorySeries[] = categories.map(category => {
      return {
        category,
        color: categoryColors[category] || '#9AA0A6',
        points: points
          .filter(p => p.category === category)
          .sort((a, b) => a.date.getTime() - b.date.getTime()),
      };
    });

    return { points, series };
  }, [timeSeriesData]);

  /**
   * Converts geographic data to D3-compatible format with proper typing
   */
  const convertGeoDataToD3Format = useCallback(() => {
    // Color mapping for categories
    const categoryColors: Record<string, string> = {
      commerce: '#4285F4', // Blue
      customers: '#EA4335', // Red
      sales: '#34A853', // Green
    };

    // Convert points with proper typing
    const points: D3GeoPoint[] = geoData.map(point => {
      // Calculate radius based on population
      const radius = Math.sqrt(point.population) / 10;
      // Get color based on category
      const color = categoryColors[point.category] || '#9AA0A6';

      // Create D3 geo point with proper typing
      const d3GeoPoint: D3GeoPoint = {
        id: point.id,
        coordinates: [point.longitude, point.latitude],
        value: point.value,
        category: point.category,
        color,
        radius,
        region: point.region,
        population: point.population,
        originalData: point,
      };

      return d3GeoPoint;
    });

    // Group points by category
    const categoriesList = Array.from(new Set(points.map(p => p.category)));
    const geoCategories: GeoCategory[] = categoriesList.map(category => {
      return {
        category,
        color: categoryColors[category] || '#9AA0A6',
        points: points.filter(p => p.category === category),
      };
    });

    return { points, geoCategories };
  }, [geoData]);

  /**
   * Converts flat hierarchy data to a proper hierarchical structure with proper typing
   * This creates a tree structure suitable for D3 hierarchical layouts
   */
  const convertHierarchyDataToD3Format = useCallback(() => {
    // Create a map to store nodes by ID for quick lookup
    const nodeMap = new Map<string, D3HierarchyNode>();

    // Define category colors
    const categoryColors: Record<string, string> = {
      'category-A': '#4285F4', // Blue
      'category-B': '#EA4335', // Red
      'category-C': '#34A853', // Green
      'subcategory-1': '#9AA0A6', // Gray
      'subcategory-2': '#FBBC05', // Yellow
      'subcategory-3': '#DADCE0', // Light gray
      root: '#5F6368', // Dark gray
    };

    // First pass: create D3HierarchyNode objects for all nodes
    hierarchyData.forEach(node => {
      const color = categoryColors[node.category] || '#9AA0A6';

      const d3Node: D3HierarchyNode = {
        id: node.id,
        name: node.id, // Use ID as name
        value: node.value,
        size: node.size,
        category: node.category,
        color,
        children: [],
        originalData: node,
      };

      nodeMap.set(node.id, d3Node);
    });

    // Second pass: build the tree structure
    const rootNodes: D3HierarchyNode[] = [];

    hierarchyData.forEach(node => {
      const d3Node = nodeMap.get(node.id);

      if (node.parentId === null) {
        // This is a root node
        rootNodes.push(d3Node!);
      } else {
        // This node has a parent, add it to the parent's children
        const parentNode = nodeMap.get(node.parentId);
        if (parentNode) {
          if (!parentNode.children) {
            parentNode.children = [];
          }
          parentNode.children.push(d3Node!);
        }
      }
    });

    // Return the root of the hierarchy (should be only one)
    return rootNodes.length > 0 ? rootNodes[0] : null;
  }, [hierarchyData]);

  // Define event handlers before visualization initializers
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

  const handleTimeRangeChange = useCallback((range: [Date, Date]) => {
    setTimeRange(range);
    errorLoggingService.logInfo('Time range changed', {
      component: 'DataDashboardApp',
      action: 'handleTimeRangeChange',
      newRange: range,
    });
  }, []);

  const handleFilterChange = (value: number) => {
    setFilterValue(value);
  };

  // Define visualization initialization functions early to avoid "used before declaration" errors
  const initializeTimeSeriesVisualization = useCallback(() => {
    console.warn('Initializing time series visualization');
    const { points, series } = convertTimeSeriesDataToD3Format();
    errorLoggingService.logDebug('Processed Time Series Data', {
      component: 'DataDashboardApp',
      method: 'initializeTimeSeriesVisualization',
      pointsCount: points.length,
      seriesCount: series.length,
    });
    // Implementation would use points and series here
  }, [timeSeriesData, selectedEntities, timeRange, optimizationsEnabled, qualitySettings, convertTimeSeriesDataToD3Format]);

  const initializeGeoVisualization = useCallback(() => {
    console.warn('Initializing geo visualization');
    const { points, geoCategories } = convertGeoDataToD3Format();
    errorLoggingService.logDebug('Processed Geo Data', {
      component: 'DataDashboardApp',
      method: 'initializeGeoVisualization',
      pointsCount: points.length,
      categoriesCount: geoCategories.length,
    });
    // Implementation would use points and categories here
    // Also uses worldMapData state
  }, [geoData, selectedEntities, optimizationsEnabled, qualitySettings, worldMapData, convertGeoDataToD3Format]);

  /**
   * Creates a hierarchical visualization with tree or treemap layout
   * Uses D3's hierarchical layouts with proper type safety
   */
  const initializeHierarchyVisualization = useCallback(() => {
    const rootNodeData = convertHierarchyDataToD3Format();
    if (!hierarchyRef.current || hierarchyData.length === 0 || !rootNodeData) return;

    console.warn(`Initializing hierarchical visualization with ${hierarchyLayoutType} layout`);

    // Clear previous visualization
    d3.select(hierarchyRef.current).selectAll('*').remove();

    // Get the container dimensions
    const svgWidth = width;
    const svgHeight = height * 0.8; // 80% of total height for the visualization

    // Cast quality settings
    const extendedSettings = qualitySettings as ExtendedQualitySettings;

    // Default settings with fallbacks
    const animationsEnabled =
      extendedSettings.animationsEnabled !== undefined ? extendedSettings.animationsEnabled : true;
    const animationDuration = extendedSettings.animationDuration || 1000;
    const showLabels =
      extendedSettings.showLabels !== undefined ? extendedSettings.showLabels : true;
    const textScaleFactor = extendedSettings.textScaleFactor || 1;
    const nodeColor = extendedSettings.nodeColor || 'byCategory';
    const linkStyle = extendedSettings.linkStyle || 'diagonal';
    const treemapTiling = extendedSettings.treemapTiling || 'squarify';
    const includeSizeEncoding =
      extendedSettings.includeSizeEncoding !== undefined
        ? extendedSettings.includeSizeEncoding
        : true;
    const treeOrientation = extendedSettings.treeOrientation || 'vertical';

    // Create the SVG container
    const svg = d3
      .select(hierarchyRef.current)
      .attr('width', svgWidth)
      .attr('height', svgHeight)
      .attr('viewBox', [0, 0, svgWidth, svgHeight])
      .attr('style', 'max-width: 100%; height: auto; font: 10px sans-serif;');

    // Set up margins and visualization dimensions
    const margin = { top: 40, right: 40, bottom: 40, left: 120 };
    const visWidth = svgWidth - margin.left - margin.right;
    const visHeight = svgHeight - margin.top - margin.bottom;

    // Create visualization area with margin
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .attr('class', 'hierarchy-container');

    // Main visualization title
    svg
      .append('text')
      .attr('class', 'hierarchy-title')
      .attr('text-anchor', 'middle')
      .attr('x', svgWidth / 2)
      .attr('y', 20)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text(
        `Hierarchical Data Visualization (${hierarchyLayoutType.charAt(0).toUpperCase() + hierarchyLayoutType.slice(1)})`
      );

    // Create a group for zoom/pan transformations
    const zoomG = g.append('g');

    // Apply category filter if selected entities exist
    const _filterByCategory = (node: D3HierarchyNode): boolean => {
      if (selectedEntities.length === 0) return true;
      if (selectedEntities.includes(node.category)) return true;
      if (node.children) {
        // Include if any children match the filter
        return node.children.some(_filterByCategory);
      }
      return false;
    };

    // Create a value scale for node size
    const valueExtent = d3.extent(hierarchyData, d => d.value) as [number, number];
    const sizeScale = d3.scaleSqrt().domain(valueExtent).range([5, 20]);

    // Create color scales
    const categoryScale = (category: string): string => {
      const colorMap: Record<string, string> = {
        'category-A': '#4285F4',
        'category-B': '#EA4335',
        'category-C': '#34A853',
        'subcategory-1': '#9AA0A6',
        'subcategory-2': '#FBBC05',
        'subcategory-3': '#DADCE0',
        root: '#5F6368',
      };
      return colorMap[category] || '#9AA0A6';
    };

    const valueColorScale = d3.scaleSequential(d3.interpolateViridis).domain(valueExtent);

    const depthColorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Function to determine node color based on settings
    const getNodeColor = (d: HierarchyDatum): string => {
      switch (nodeColor) {
        case 'byValue':
          return valueColorScale(d.data?.value);
        case 'byDepth':
          return depthColorScale(d.depth.toString());
        case 'byCategory':
        default:
          return d.data?.color || categoryScale(d.data?.category);
      }
    };

    // Create hierarchy from the rootNodeData using d3.hierarchy
    const root = d3.hierarchy<D3HierarchyNode>(rootNodeData) as unknown as HierarchyDatum;

    // Apply filtering if needed
    // Apply filter to only include nodes that match selectedEntities
    if (selectedEntities.length > 0) {
      root.descendants().forEach(node => {
        if (node.children) {
          node.children = node.children.filter(
            child =>
              selectedEntities.length === 0 ||
              selectedEntities.includes(child.data?.category) ||
              (child.children &&
                child.children.some(grandchild =>
                  selectedEntities.includes(grandchild.data?.category)
                ))
          );
        }
      });
    }

    // Size the hierarchy based on values
    root.sum(d => (includeSizeEncoding ? d.value : 1));

    // Implement different layouts based on the selected type
    if (hierarchyLayoutType === 'treemap') {
      // TREEMAP LAYOUT

      // Create the treemap layout
      let tilingMethod: TreemapTilingFunc;
      switch (treemapTiling) {
        case 'binary':
          tilingMethod = d3.treemapBinary;
          break;
        case 'slice':
          tilingMethod = d3.treemapSlice;
          break;
        case 'dice':
          tilingMethod = d3.treemapDice;
          break;
        case 'sliceDice':
          tilingMethod = d3.treemapSliceDice;
          break;
        case 'squarify':
        default:
          tilingMethod = d3.treemapSquarify;
          break;
      }

      const treemap = d3
        .treemap<D3HierarchyNode>()
        .size([visWidth, visHeight])
        .padding(3)
        .round(true)
        .tile(tilingMethod);

      // Compute the treemap layout
      treemap(root as unknown as d3.HierarchyNode<D3HierarchyNode>);

      // Create the treemap cells
      const nodes = zoomG
        .selectAll('g')
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('transform', d => {
          // Use non-null assertions since we know these values exist after treemap layout
          return `translate(${d.x0!},${d.y0!})`;
        })
        .attr('class', 'node')
        .classed('selected', d => selectedEntities.includes(d.data?.id));

      // Add rectangles for each node
      nodes
        .append('rect')
        .attr('width', d => Math.max(0, d.x1! - d.x0!))
        .attr('height', d => Math.max(0, d.y1! - d.y0!))
        .attr('fill', getNodeColor)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .on('click', (event, d) => {
          event?.stopPropagation();
          handleEntitySelection(d.data?.id);
        });

      // Add text labels to cells
      nodes
        .append('text')
        .attr('x', d => (d.x1! - d.x0!) / 2)
        .attr('y', d => (d.y1! - d.y0!) / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', d => {
          const width = d.x1! - d.x0!;
          const height = d.y1! - d.y0!;
          return Math.min(width, height) / 8 + 'px';
        })
        .style('fill', '#fff')
        .text(d => d.data?.name)
        .style('pointer-events', 'none');

      // Add tooltips
      nodes
        .append('title')
        .text(
          d =>
            `${d.data?.name}\nCategory: ${d.data?.category}\nValue: ${d.data?.value.toFixed(2)}\nSize: ${d.data?.size}`
        );

      // Add click handlers for selection
      nodes.on('click', (event, d) => {
        event?.stopPropagation();
        handleEntitySelection(d.data?.id);
      });

      // Add zoom behavior
      const zoom = createSvgZoomBehavior<SVGSVGElement>({ // Explicitly type element
        scaleExtentMin: 0.5,
        scaleExtentMax: 8,
        targetElement: zoomG,
        constrainPan: true,
      });

      // Apply zoom to the SVG
      svg.call(zoom);

      // Add animations if enabled
      if (animationsEnabled && isAnimating) {
        // Animate the nodes appearing
        nodes
          .attr('opacity', 0)
          .transition()
          .duration(animationDuration)
          .attr('opacity', 0.8)
          .ease(d3.easeBackOut);
      }
    } else {
      // TREE LAYOUT

      // Determine tree orientation
      let treeLayout: d3.TreeLayout<D3HierarchyNode>;

      if (treeOrientation === 'horizontal') {
        // Horizontal tree (left to right)
        treeLayout = d3.tree<D3HierarchyNode>().size([visHeight, visWidth]);

        // Swap x and y in the resulting layout
        root.descendants().forEach(d => {
          const temp = d.x;
          d.x = d.y;
          d.y = temp;
        });
      } else if (treeOrientation === 'radial') {
        // Radial tree
        treeLayout = d3
          .tree<D3HierarchyNode>()
          .size([2 * Math.PI, Math.min(visWidth, visHeight) / 2 - 40]);

        // Apply layout without transforming yet
        treeLayout(root as unknown as d3.HierarchyNode<D3HierarchyNode>);

        // Convert from polar to Cartesian coordinates
        root.descendants().forEach(d => {
          const radius = d.y!; // Add non-null assertion
          const angle = d.x!; // Add non-null assertion
          d.x = radius * Math.cos(angle - Math.PI / 2) + visWidth / 2;
          d.y = radius * Math.sin(angle - Math.PI / 2) + visHeight / 2;
        });
      } else {
        // Default: Vertical tree (top to bottom)
        treeLayout = d3.tree<D3HierarchyNode>().size([visWidth, visHeight]);
      }

      // Apply the tree layout if not already applied
      if (treeOrientation !== 'radial') {
        treeLayout(root as unknown as d3.HierarchyNode<D3HierarchyNode>);
      }

      // Create the link generator based on the selected style
      const linkGenerator = (d: CustomHierarchyPointLink) => {
        const source = { x: d.source.x ?? 0, y: d.source.y ?? 0, data: d.source.data };
        const target = { x: d.target.x ?? 0, y: d.target.y ?? 0, data: d.target.data };

        // Create properly formatted link data for d3.linkHorizontal
        const linkData: D3LinkData = {
          source: [source.y, source.x],
          target: [target.y, target.x],
        };

        // Define the link generator instance
        const horizontalLinkGenerator = d3.linkHorizontal<D3LinkData, [number, number]>()
            .source(d => d.source)
            .target(d => d.target);

        switch (linkStyle) {
          case 'straight':
            return horizontalLinkGenerator(linkData);
          case 'step':
            return `M${source.y},${source.x} V${target.x} H${target.y}`;
          case 'diagonal':
          default:
            return horizontalLinkGenerator(linkData);
        }
      };

      // Draw links
      const links = zoomG
        .append('g')
        .attr('class', 'links')
        .selectAll('path')
        .data(root.links()) // root.links() returns {source, target}
        .enter()
        .append('path')
        .attr('d', d => {
          // Cast the HierarchyDatum link to CustomHierarchyPointLink
          const link = {
            source: {
              x: d.source.x ?? 0,
              y: d.source.y ?? 0,
              data: d.source.data,
            },
            target: {
              x: d.target.x ?? 0,
              y: d.target.y ?? 0,
              data: d.target.data,
            },
          } as CustomHierarchyPointLink;

          const pathData = linkGenerator(link);
          return pathData === null ? '' : pathData; // Return empty string if generator returns null
        })
        .attr('fill', 'none')
        .attr('stroke', '#ccc')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.5);

      // Draw nodes
      const nodes = zoomG
        .append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x},${d.y})`)
        .classed('selected', d => selectedEntities.includes(d.data?.category));

      // Add circles for each node
      const circles = nodes
        .append('circle')
        .attr('r', d => (includeSizeEncoding ? sizeScale(d.data?.value) : 6))
        .attr('fill', getNodeColor)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .attr('cursor', 'pointer');

      // Add labels if enabled
      if (showLabels) {
        nodes
          .append('text')
          .attr('dy', '.31em')
          .attr('x', d => (d.children ? -8 : 8))
          .style('text-anchor', d => (d.children ? 'end' : 'start'))
          .text(d => d.data?.name)
          .attr('font-size', `${10 * textScaleFactor}px`)
          .attr('pointer-events', 'none'); // Don't interfere with click events
      }

      // Add tooltips
      nodes
        .append('title')
        .text(
          d =>
            `${d.data?.name}\nCategory: ${d.data?.category}\nValue: ${d.data?.value.toFixed(2)}\nSize: ${d.data?.size}`
        );

      // Add click handlers for selection
      nodes.on('click', (event, d) => {
        event?.stopPropagation();
        handleEntitySelection(d.data?.category);
      });

      // Add zoom behavior
      const zoom = createSvgZoomBehavior<SVGSVGElement>({ // Explicitly type element
        scaleExtentMin: 0.5,
        scaleExtentMax: 8,
        targetElement: zoomG,
        constrainPan: true,
      });

      // Apply zoom to the SVG
      svg.call(zoom);

      // Add initial transform to center the root node
      if (treeOrientation === 'horizontal') {
        const initialTransform = d3.zoomIdentity.translate(margin.left, visHeight / 2);
        svg.call(zoom.transform, initialTransform);
      }

      // Add animations if enabled
      if (animationsEnabled && isAnimating) {
        // Animate the links
        links
          .attr('stroke-dasharray', function () {
            const length = this.getTotalLength();
            return `${length} ${length}`;
          })
          .attr('stroke-dashoffset', function () {
            return this.getTotalLength();
          })
          .transition()
          .duration(animationDuration)
          .attr('stroke-dashoffset', 0)
          .ease(d3.easeLinear);

        // Animate the nodes appearing
        circles
          .attr('r', 0)
          .transition()
          .duration(animationDuration)
          .delay((d, i) => d.depth * 300 + i * 10)
          .attr('r', d => (includeSizeEncoding ? sizeScale(d.data?.value) : 6))
          .ease(d3.easeElastic);
      }
    }

    // Add layout toggle buttons
    const buttonGroup = svg
      .append('g')
      .attr('class', 'layout-buttons')
      .attr('transform', `translate(${svgWidth - 180}, ${margin.top - 20})`);

    const layouts = ['tree', 'treemap', 'cluster', 'radial'];

    layouts.forEach((layout, i) => {
      const button = buttonGroup
        .append('g')
        .attr('class', 'layout-button')
        .attr('transform', `translate(${i * 45}, 0)`)
        .style('cursor', 'pointer')
        .on('click', () => {
          setHierarchyLayoutType(layout as ExtendedQualitySettings['hierarchyLayout']);
        });

      button
        .append('rect')
        .attr('width', 40)
        .attr('height', 20)
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('fill', layout === hierarchyLayoutType ? '#4285F4' : '#e0e0e0');

      button
        .append('text')
        .attr('x', 20)
        .attr('y', 14)
        .attr('text-anchor', 'middle')
        .attr('fill', layout === hierarchyLayoutType ? '#fff' : '#333')
        .attr('font-size', '10px')
        .text(layout.charAt(0).toUpperCase() + layout.slice(1));
    });

    // Reset selection when clicking on the background
    svg.on('click', event => {
      // Prevent triggering if clicking on nodes
      if (event?.target === svg.node()) {
        setSelectedEntities([]);
      }
    });
  }, [
    hierarchyData,
    hierarchyRef.current,
    width,
    height,
    hierarchyLayoutType,
    isAnimating,
    optimizationsEnabled,
    qualitySettings,
    selectedEntities,
    convertHierarchyDataToD3Format,
    handleEntitySelection,
  ]);

  /**
   * Initialize the network visualization with a force-directed graph
   * This uses D3's force layout with type-safe implementation
   */
  const initializeNetworkVisualization = useCallback(() => {
    if (!networkRef.current || networkData.nodes.length === 0) return;

    console.warn('Initializing network visualization with force-directed graph');

    // Clear previous visualization
    d3.select(networkRef.current).selectAll('*').remove();

    // Get the container dimensions
    const svgWidth = width;
    const svgHeight = height * 0.8; // 80% of total height for the visualization

    // Convert data to D3 format with proper typing
    const { nodes, links, nodeMap } = convertNetworkDataToD3Format();

    // Create the SVG container
    const svg = d3
      .select(networkRef.current)
      .attr('width', svgWidth)
      .attr('height', svgHeight)
      .attr('viewBox', [0, 0, svgWidth, svgHeight])
      .attr('style', 'max-width: 100%; height: auto; font: 10px sans-serif;');

    // Create a group for zoom/pan transformations
    const g = svg.append('g').attr('class', 'network-container');

    // Create the zoom behavior with type safety
    const zoom = createSvgZoomBehavior<SVGSVGElement>({ // Explicitly type element
      scaleExtentMin: 0.1,
      scaleExtentMax: 5,
      targetElement: g,
      constrainPan: true,
    });

    // Apply zoom to the SVG
    svg.call(zoom);

    // Initial transform to fit content
    const initialTransform = getFitToViewportTransform(
      svgWidth,
      svgHeight,
      svgWidth,
      svgHeight,
      50
    );
    svg.call(zoom.transform, initialTransform);

    // Create link elements
    const link = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', d => d.color || '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => d.width || 1);

    // Create node elements
    const node = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', d => d.radius || 5)
      .attr('fill', d => d.color || '#666')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .classed('selected', d => selectedEntities.includes(d.id));

    // Add titles for tooltips
    node.append('title').text(d => `${d.id} (${d.group})\nValue: ${d.value}`);

    // Cast to ExtendedQualitySettings to use the additional properties
    const extendedSettings = qualitySettings as ExtendedQualitySettings;
    const showLabels =
      extendedSettings.showLabels !== undefined ? extendedSettings.showLabels : true; // Default to true
    const textScaleFactor = extendedSettings.textScaleFactor || 1; // Default to 1

    // Create text labels based on quality settings
    if (showLabels) {
      const labels = g // Removed underscore from variable name
        .append('g')
        .attr('class', 'labels')
        .selectAll('text')
        .data(nodes.filter(n => n.value > filterValue)) // Only label significant nodes
        .enter()
        .append('text')
        .attr('dx', 12)
        .attr('dy', '.35em')
        .text(d => d.id)
        .style('font-size', `${10 * textScaleFactor}px`)
        .style('fill', '#333');
    }

    // Create the force simulation with proper typing
    const simulation = d3
      .forceSimulation<D3NetworkNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<D3NetworkNode, _D3Link>(links)
          .id(d => d.id)
          .distance(d => 30 + d.value)
      )
      .force(
        'charge',
        d3.forceManyBody<D3NetworkNode>().strength((d: D3NetworkNode) => {
          // Safely access the size property (no need for cast now)
          return -30 * (d.size || 1);
        })
      )
      .force('center', d3.forceCenter(svgWidth / 2, svgHeight / 2))
      .force(
        'collision',
        d3.forceCollide<D3NetworkNode>().radius(d => (d.radius || 5) + 2)
      );

    // Create drag behavior with type safety
    const drag = createSimulationDragBehavior<D3NetworkNode, SVGCircleElement>(simulation);

    // Apply the drag behavior with proper type casting
    node.call(drag as CircleDragBehavior);

    // Node click handler
    node.on('click', (event, d) => {
      event?.stopPropagation(); // Prevent triggering container click
      handleEntitySelection(d.id);
    });

    // Update function for the simulation
    simulation.on('tick', () => {
      // Use safe accessors to prevent type errors
      link
        .attr('x1', d =>
          d3Accessors.getX(typeof d.source === 'string' ? nodeMap.get(d.source) : d.source)
        )
        .attr('y1', d =>
          d3Accessors.getY(typeof d.source === 'string' ? nodeMap.get(d.source) : d.source)
        )
        .attr('x2', d =>
          d3Accessors.getX(typeof d.target === 'string' ? nodeMap.get(d.target) : d.target)
        )
        .attr('y2', d =>
          d3Accessors.getY(typeof d.target === 'string' ? nodeMap.get(d.target) : d.target)
        );

      node.attr('cx', d => d3Accessors.getX(d)).attr('cy', d => d3Accessors.getY(d));

      // Update labels position if they exist
      if (showLabels) {
        g.selectAll('.labels text')
          .attr('x', d => d3Accessors.getX(d))
          .attr('y', d => d3Accessors.getY(d));
      }
    });

    // Store simulation reference for cleanup
    simulationRef.current = simulation;

    // Animation toggle
    if (!isAnimating) {
      simulation.alpha(0).stop();
    }

    // Cleanup function for when component unmounts or view changes
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
    };
  }, [
    networkData,
    width,
    height,
    selectedEntities,
    filterValue,
    isAnimating,
    optimizationsEnabled,
    qualitySettings,
    convertNetworkDataToD3Format,
    handleEntitySelection,
  ]);

   // Define data generation functions before they are used in useEffect
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
  const generateTimeSeriesData = useCallback((_pointCount: number) => {
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
              : (data?.find(
                  d =>
                    d.category === categories[catIdx] &&
                    d.timePeriod === timePeriods[periodIdx === 0 ? 3 : periodIdx - 1]
                )?.value ?? 0);

          const randomChange = Math.random() * 20 - 10; // -10 to +10
          const value = Math.max(0, prevValue + randomChange + Math.random() * 5 + 50);

          data?.push({
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
  }, []);

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

      data?.push({
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
    data?.push({
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
      data?.push({
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
        data?.push({
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

  // Load data
  useEffect(() => {
    // In a real application, this would be an API call
    // For now, we'll generate synthetic data

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
  }, [generateTimeSeriesData]); // Added dependency

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
    initializeNetworkVisualization,
    initializeTimeSeriesVisualization,
    initializeGeoVisualization,
    initializeHierarchyVisualization,
    hierarchyLayoutType,
  ]);

  // Load world map data once
  useEffect(() => {
    // In a real application, this would load from an API or local file
    // For this demo, we'll use a simplified world map in GeoJSON format
    const fetchWorldMap = async () => {
      try {
        // Simplified world map in GeoJSON format (low resolution for performance)
        const response = await fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json');
        const data = await response?.json();
        setWorldMapData(data);
      } catch (error) {
        // Replace console.error with errorLoggingService.logError
        errorLoggingService.logError(
          error instanceof Error ? error : new Error('Failed to load world map data'),
          ErrorType.NETWORK,
          ErrorSeverity.MEDIUM,
          {
            componentName: 'DataDashboardApp',
            action: 'fetchWorldMapData',
            url: 'https://unpkg.com/world-atlas@2.0.2/countries-110m.json',
          }
        );
        // Fallback to null if fetch fails
        setWorldMapData(null);
      }
    };

    fetchWorldMap();
  }, []);

  // Memoized labels
  const _labels = useMemo(() => {
    return {
      network: {
        title: 'Network Visualization',
        subtitle: 'Interactive force-directed graph',
      },
      timeseries: {
        title: 'Time Series Analysis',
        subtitle: 'Multi-category temporal data',
      },
      geospatial: {
        title: 'Geographic Distribution',
        subtitle: 'Global data visualization',
      },
      hierarchy: {
        title: 'Hierarchical Structure',
        subtitle: 'Tree-based organization',
      },
    };
  }, []);

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
              <div>Loading visualization data?...</div>
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

          <div className="time-range-controls">
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Time Range</h3>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}
            >
              <span>{timeRange[0].toLocaleDateString()}</span>
              <span>{timeRange[1].toLocaleDateString()}</span>
            </div>
            {/* Add placeholder button for time range change */}
            <button
              onClick={() =>
                handleTimeRangeChange([
                  new Date(2022, Math.floor(Math.random() * 12), 1),
                  new Date(2023, Math.floor(Math.random() * 12), 1),
                ])
              }
              className="ml-4 rounded bg-purple-500 px-2 py-1 text-sm text-white hover:bg-purple-600"
            >
              Change Time Range (Dummy)
            </button>
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
