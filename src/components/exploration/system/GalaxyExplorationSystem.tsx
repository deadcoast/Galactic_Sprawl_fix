import { ResourceType } from '../../../types/resources/ResourceTypes';
/**
 * GalaxyExplorationSystem Component
 *
 * A unified system for exploring and analyzing the galaxy.
 * This component integrates mapping, data analysis, and anomaly investigation
 * into a single coherent interface.
 */

import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { moduleEventBus } from '../../../lib/events/ModuleEventBus';
import { EventType } from '../../../types/events/EventTypes';
import { StandardizedEvent } from '../../../types/events/StandardizedEvents';
import {
  AnalysisResult,
  AnalysisType,
  Anomaly,
  AnomalyType, // Added AnomalyType
  DangerLevel,
  DetailLevel,
  ExplorationStatus,
  MapSelection,
  MapTheme,
  MapViewport,
  MapVisualSettings,
  Planet,
  ResourceDeposit,
  Sector,
  StarSystem,
  StarType,
  TradeRoute,
} from '../../../types/exploration';
import { cn } from '../../../utils/cn';
import { ExplorationProvider, useExploration } from '../context/ExplorationContext';
import {
  BaseAnalysisVisualizer,
  BaseDataTable,
  BaseMap,
  type DataColumn,
  type MapLayer,
} from '../core';

// View mode for the system
export type ViewMode =
  | 'map' // Main map view
  | 'data-table' // Tabular data view
  | 'analysis' // Analysis view
  | 'split-view'; // Split view with map and data

// Sub-view type for data table
export type DataTableView = 'sectors' | 'systems' | 'planets' | 'anomalies' | 'resources';

// Layout mode
export type LayoutMode =
  | 'horizontal' // Map on left, details on right
  | 'vertical'; // Map on top, details on bottom

// Define a type for the exploration data
export interface ExplorationData {
  sectors: Sector[];
  systems: StarSystem[];
  anomalies: Anomaly[];
  tradeRoutes: TradeRoute[];
}

// GalaxyExplorationSystem Props
export interface GalaxyExplorationSystemProps {
  /** Initial view mode */
  initialViewMode?: ViewMode;

  /** Initial data table view */
  initialDataTableView?: DataTableView;

  /** Initial layout mode */
  initialLayoutMode?: LayoutMode;

  /** Initial map viewport */
  initialViewport?: Partial<MapViewport>;

  /** Initial map visual settings */
  initialVisualSettings?: Partial<MapVisualSettings>;

  /** Whether to allow changing visual settings */
  allowVisualSettingsChange?: boolean;

  /** Whether to allow changing layout */
  allowLayoutChange?: boolean;

  /** Initial selection */
  initialSelection?: MapSelection[];

  /** Custom class name */
  className?: string;

  /** Width of the component */
  width?: number | string;

  /** Height of the component */
  height?: number | string;

  /** Whether to show the toolbar */
  showToolbar?: boolean;

  /** Whether to show the status bar */
  showStatusBar?: boolean;

  /** Custom toolbar content */
  customToolbarContent?: React.ReactNode;

  /** Custom status bar content */
  customStatusBarContent?: React.ReactNode;

  /** Optional data fetcher for exploration data */
  dataFetcher?: () => Promise<ExplorationData>;

  /** Initial exploration data */
  initialData?: ExplorationData;
}

/**
 * GalaxyExplorationSystemContainer Component
 * This component wraps the actual system in an ExplorationProvider
 */
export const GalaxyExplorationSystem: React.FC<GalaxyExplorationSystemProps> = ({
  initialData,
  dataFetcher,
  ...props
}) => {
  return (
    <ExplorationProvider initialData={initialData} dataFetcher={dataFetcher}>
      <GalaxyExplorationSystemInner {...props} />
    </ExplorationProvider>
  );
};

/**
 * GalaxyExplorationSystemInner Component
 * This is the main component that uses the ExplorationContext
 */
const GalaxyExplorationSystemInner: React.FC<
  Omit<GalaxyExplorationSystemProps, 'initialData' | 'dataFetcher'>
> = ({
  initialViewMode = 'map',
  initialDataTableView = 'sectors',
  initialLayoutMode = 'horizontal',
  initialViewport,
  initialVisualSettings,
  allowVisualSettingsChange = true,
  allowLayoutChange = true,
  initialSelection = [],
  className,
  width = '100%',
  height = 800,
  showToolbar = true,
  showStatusBar = true,
  customToolbarContent,
  customStatusBarContent,
}) => {
  // Get exploration context
  const exploration = useExploration();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [dataTableView, setDataTableView] = useState<DataTableView>(initialDataTableView);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(initialLayoutMode);
  const [viewport, setViewport] = useState<MapViewport>({
    x: 0,
    y: 0,
    scale: 1,
    width: typeof width === 'number' ? width : 800,
    height: typeof height === 'number' ? height / 2 : 400,
    ...initialViewport,
  });
  const [visualSettings, setVisualSettings] = useState<MapVisualSettings>({
    showGrid: true,
    showLabels: true,
    showResourceIcons: true,
    showAnomalyIcons: true,
    showFactionBorders: false,
    showTradeRoutes: true,
    detailLevel: DetailLevel.MEDIUM,
    theme: MapTheme.STANDARD,
    ...initialVisualSettings,
  });
  const [selection, setSelection] = useState<MapSelection[]>(initialSelection);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);

  // Compute dimensions based on layout mode and view mode
  const dimensions = useMemo(() => {
    const totalWidth = typeof width === 'number' ? width : 800;
    const totalHeight = typeof height === 'number' ? height : 800;

    if (viewMode === 'map') {
      return {
        mapWidth: totalWidth,
        mapHeight: totalHeight,
        dataWidth: 0,
        dataHeight: 0,
      };
    }

    if (viewMode === 'data-table' || viewMode === 'analysis') {
      return {
        mapWidth: 0,
        mapHeight: 0,
        dataWidth: totalWidth,
        dataHeight: totalHeight,
      };
    }

    // Split view
    if (layoutMode === 'horizontal') {
      return {
        mapWidth: totalWidth * 0.6,
        mapHeight: totalHeight,
        dataWidth: totalWidth * 0.4,
        dataHeight: totalHeight,
      };
    } else {
      return {
        mapWidth: totalWidth,
        mapHeight: totalHeight * 0.6,
        dataWidth: totalWidth,
        dataHeight: totalHeight * 0.4,
      };
    }
  }, [width, height, viewMode, layoutMode]);

  // Update viewport when dimensions change
  useEffect(() => {
    setViewport(prev => ({
      ...prev,
      width: dimensions.mapWidth,
      height: dimensions.mapHeight,
    }));
  }, [dimensions.mapWidth, dimensions.mapHeight]);

  // Get data for current view
  const viewData = useMemo(() => {
    switch (dataTableView) {
      case 'sectors':
        return exploration.getSectors();

      case 'systems':
        // If we have a selected sector, show its systems
        if (selection.length > 0 && selection[0].entityType === 'sector') {
          return exploration.getSystemsBySectorId(selection[0].entityId);
        }
        // Otherwise, show all systems
        return exploration.state.systems;

      case 'planets':
        // If we have a selected system, show its planets
        if (selection.length > 0 && selection[0].entityType === 'system') {
          return exploration.getPlanetsBySystemId(selection[0].entityId);
        }
        // Otherwise, show all planets
        return exploration.state.planets;

      case 'anomalies':
        // If we have a selected sector, show its anomalies
        if (selection.length > 0 && selection[0].entityType === 'sector') {
          return exploration.getAnomaliesBySectorId(selection[0].entityId);
        }
        // Otherwise, show all anomalies
        return exploration.state.anomalies;

      case 'resources':
        // If we have a selected entity, show its resources
        if (selection.length > 0) {
          return exploration.getResourcesByEntityId(selection[0].entityId);
        }
        // Otherwise, show all resources
        return exploration.state.resources;

      default:
        return [];
    }
  }, [dataTableView, selection, exploration]);

  // Create map layers
  const mapLayers = useMemo((): MapLayer[] => {
    const layers: MapLayer[] = [];

    // Grid layer is handled internally by BaseMap

    // Sectors layer
    layers.push({
      id: 'sectors',
      type: 'sectors',
      zIndex: 10,
      visible: true,
      render: (
        ctx: CanvasRenderingContext2D,
        viewport: MapViewport,
        settings: MapVisualSettings
      ) => {
        const sectors = exploration.getSectors();

        sectors.forEach(sector => {
          const { x, y } = sector.coordinates;

          // Convert coordinates to screen space
          const screenX = (x - viewport.x) * viewport.scale + viewport.width / 2;
          const screenY = (y - viewport.y) * viewport.scale + viewport.height / 2;

          // Draw sector
          ctx.beginPath();
          ctx.arc(screenX, screenY, 20 * viewport.scale, 0, Math.PI * 2);

          // Set color based on exploration status
          switch (sector.explorationStatus) {
            case ExplorationStatus.UNDISCOVERED:
              ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
              break;
            case ExplorationStatus.DETECTED:
              ctx.fillStyle = 'rgba(100, 100, 200, 0.5)';
              break;
            case ExplorationStatus.SCANNED:
              ctx.fillStyle = 'rgba(100, 150, 250, 0.7)';
              break;
            case ExplorationStatus.ANALYZED:
              ctx.fillStyle = 'rgba(150, 200, 255, 0.8)';
              break;
            case ExplorationStatus.FULLY_EXPLORED:
              ctx.fillStyle = 'rgba(200, 230, 255, 0.9)';
              break;
            default:
              ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
          }

          ctx.fill();

          // Draw border
          ctx.strokeStyle = 'rgba(200, 200, 255, 0.8)';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Draw label if enabled
          if (settings.showLabels) {
            ctx.fillStyle = 'white';
            ctx.font = `${12 * viewport.scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(sector.name, screenX, screenY + 30 * viewport.scale);
          }
        });
      },
    });

    // Systems layer
    layers.push({
      id: 'systems',
      type: 'systems',
      zIndex: 20,
      visible: true,
      render: (
        ctx: CanvasRenderingContext2D,
        viewport: MapViewport,
        settings: MapVisualSettings
      ) => {
        const { systems } = exploration.state;

        systems.forEach(system => {
          const { x, y } = system.coordinates;

          // Convert coordinates to screen space
          const screenX = (x - viewport.x) * viewport.scale + viewport.width / 2;
          const screenY = (y - viewport.y) * viewport.scale + viewport.height / 2;

          // Draw system
          ctx.beginPath();
          ctx.arc(screenX, screenY, 8 * viewport.scale, 0, Math.PI * 2);

          // Set color based on star type
          switch (system.starType) {
            case StarType.MAIN_SEQUENCE:
              ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
              break;
            case StarType.RED_DWARF:
              ctx.fillStyle = 'rgba(255, 180, 120, 0.9)';
              break;
            case StarType.WHITE_DWARF:
              ctx.fillStyle = 'rgba(230, 230, 255, 0.9)';
              break;
            case StarType.BLUE_GIANT:
              ctx.fillStyle = 'rgba(150, 150, 255, 0.9)';
              break;
            case StarType.RED_GIANT:
              ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
              break;
            case StarType.NEUTRON_STAR:
              ctx.fillStyle = 'rgba(200, 200, 255, 0.9)';
              break;
            case StarType.BLACK_HOLE:
              ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
              break;
            default:
              ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          }

          ctx.fill();

          // Draw label if enabled and scale is sufficient
          if (settings.showLabels && viewport.scale > 0.5) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = `${10 * viewport.scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(system.name, screenX, screenY + 15 * viewport.scale);
          }
        });
      },
    });

    // Anomalies layer
    if (visualSettings.showAnomalyIcons) {
      layers.push({
        id: 'anomalies',
        type: 'anomalies',
        zIndex: 30,
        visible: true,
        render: (
          ctx: CanvasRenderingContext2D,
          viewport: MapViewport,
          settings: MapVisualSettings
        ) => {
          const { anomalies } = exploration.state;

          anomalies.forEach(anomaly => {
            const { x, y } = anomaly.coordinates;

            // Convert coordinates to screen space
            const screenX = (x - viewport.x) * viewport.scale + viewport.width / 2;
            const screenY = (y - viewport.y) * viewport.scale + viewport.height / 2;

            // Draw anomaly
            ctx.beginPath();

            // Different shapes for different anomaly types
            switch (anomaly.anomalyType) {
              case AnomalyType.SPATIAL_DISTORTION:
                // Draw a diamond
                ctx.moveTo(screenX, screenY - 8 * viewport.scale);
                ctx.lineTo(screenX + 8 * viewport.scale, screenY);
                ctx.lineTo(screenX, screenY + 8 * viewport.scale);
                ctx.lineTo(screenX - 8 * viewport.scale, screenY);
                ctx.closePath();
                break;

              case AnomalyType.ENERGY_SIGNATURE:
                // Draw a triangle
                ctx.moveTo(screenX, screenY - 8 * viewport.scale);
                ctx.lineTo(screenX + 8 * viewport.scale, screenY + 8 * viewport.scale);
                ctx.lineTo(screenX - 8 * viewport.scale, screenY + 8 * viewport.scale);
                ctx.closePath();
                break;

              case AnomalyType.GRAVITATIONAL_ANOMALY:
                // Draw a square
                ctx.rect(
                  screenX - 7 * viewport.scale,
                  screenY - 7 * viewport.scale,
                  14 * viewport.scale,
                  14 * viewport.scale
                );
                break;

              case AnomalyType.RADIATION_SOURCE:
                // Draw a pentagon
                for (let i = 0; i < 5; i++) {
                  const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                  const x = screenX + Math.cos(angle) * 8 * viewport.scale;
                  const y = screenY + Math.sin(angle) * 8 * viewport.scale;
                  if (i === 0) {
                    ctx.moveTo(x, y);
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
                ctx.closePath();
                break;

              case AnomalyType.TEMPORAL_ANOMALY:
                // Draw a star
                for (let i = 0; i < 10; i++) {
                  const angle = (i * Math.PI) / 5 - Math.PI / 2;
                  const radius = i % 2 === 0 ? 8 * viewport.scale : 4 * viewport.scale;
                  const x = screenX + Math.cos(angle) * radius;
                  const y = screenY + Math.sin(angle) * radius;
                  if (i === 0) {
                    ctx.moveTo(x, y);
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
                ctx.closePath();
                break;

              case AnomalyType.QUANTUM_FLUCTUATION:
                // Draw a circle (already handled by default arc below, maybe add effect?)
                ctx.arc(screenX, screenY, 8 * viewport.scale, 0, Math.PI * 2);
                break;

              default:
                // Draw a circle for unknown types
                ctx.arc(screenX, screenY, 6 * viewport.scale, 0, Math.PI * 2);
                break;
            }

            // Set color based on danger level
            switch (anomaly.dangerLevel) {
              case DangerLevel.LOW:
                ctx.fillStyle = 'rgba(100, 200, 100, 0.8)';
                break;
              case DangerLevel.MODERATE:
                ctx.fillStyle = 'rgba(200, 200, 100, 0.8)';
                break;
              case DangerLevel.HIGH:
                ctx.fillStyle = 'rgba(255, 150, 50, 0.8)';
                break;
              case DangerLevel.EXTREME:
                ctx.fillStyle = 'rgba(200, 50, 50, 0.8)';
                break;
              default:
                ctx.fillStyle = 'rgba(150, 150, 150, 0.8)';
            }

            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw label if enabled and scale is sufficient
            if (settings.showLabels && viewport.scale > 0.7) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
              ctx.font = `${9 * viewport.scale}px Arial`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(anomaly.name, screenX, screenY + 12 * viewport.scale);
            }
          });
        },
      });
    }

    // Resources layer
    if (visualSettings.showResourceIcons) {
      layers.push({
        id: 'resources',
        type: 'resources',
        zIndex: 25,
        visible: true,
        render: (
          ctx: CanvasRenderingContext2D,
          viewport: MapViewport,
          settings: MapVisualSettings
        ) => {
          const { resources } = exploration.state;

          resources.forEach(resource => {
            const { x, y } = resource.coordinates;

            // Convert coordinates to screen space
            const screenX = (x - viewport.x) * viewport.scale + viewport.width / 2;
            const screenY = (y - viewport.y) * viewport.scale + viewport.height / 2;

            // Only draw if detail level is sufficient
            if (settings.detailLevel === DetailLevel.LOW && viewport.scale < 0.5) {
              return;
            }

            // Draw resource
            ctx.beginPath();
            ctx.rect(
              screenX - 5 * viewport.scale,
              screenY - 5 * viewport.scale,
              10 * viewport.scale,
              10 * viewport.scale
            );

            // Set color based on resource type and theme
            const alpha = settings.theme === MapTheme.DARK ? 0.9 : 0.8;
            switch (resource.type) {
              case ResourceType.MINERALS:
                ctx.fillStyle = `rgba(150, 150, 150, ${alpha})`;
                break;
              case ResourceType.IRON:
                ctx.fillStyle = `rgba(130, 130, 130, ${alpha})`;
                break;
              case ResourceType.COPPER:
                ctx.fillStyle = `rgba(180, 120, 70, ${alpha})`;
                break;
              case ResourceType.TITANIUM:
                ctx.fillStyle = `rgba(200, 200, 200, ${alpha})`;
                break;
              case ResourceType.URANIUM:
                ctx.fillStyle = `rgba(100, 200, 100, ${alpha})`;
                break;
              case ResourceType.WATER:
                ctx.fillStyle = `rgba(100, 150, 200, ${alpha})`;
                break;
              case ResourceType.HELIUM:
                ctx.fillStyle = `rgba(200, 200, 255, ${alpha})`;
                break;
              case ResourceType.DEUTERIUM:
                ctx.fillStyle = `rgba(150, 200, 255, ${alpha})`;
                break;
              case ResourceType.ENERGY:
                ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
                break;
              case ResourceType.EXOTIC:
                ctx.fillStyle = `rgba(200, 100, 200, ${alpha})`;
                break;
              default:
                ctx.fillStyle = `rgba(150, 150, 150, ${alpha})`;
            }

            ctx.fill();
            ctx.strokeStyle = settings.theme === MapTheme.DARK ? '#ffffff' : '#000000';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw quality indicator if scale is sufficient and detail level allows
            if (viewport.scale > 0.7 && settings.detailLevel !== DetailLevel.LOW) {
              const quality = Math.min(Math.max(resource.quality, 0), 100);
              const radius = 4 * viewport.scale;
              const startAngle = -Math.PI / 2;
              const endAngle = startAngle + (2 * Math.PI * quality) / 100;

              ctx.beginPath();
              ctx.arc(screenX, screenY, radius, startAngle, endAngle);
              ctx.strokeStyle =
                settings.theme === MapTheme.DARK
                  ? 'rgba(255, 255, 100, 0.9)'
                  : 'rgba(255, 255, 100, 0.8)';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          });
        },
      });
    }

    // Trade routes layer
    if (visualSettings.showTradeRoutes) {
      layers.push({
        id: 'tradeRoutes',
        type: 'tradeRoutes',
        zIndex: 5,
        visible: true,
        render: (
          ctx: CanvasRenderingContext2D,
          viewport: MapViewport,
          settings: MapVisualSettings
        ) => {
          const { tradeRoutes } = exploration.state;

          tradeRoutes.forEach(route => {
            // Find source and target entities
            const source =
              exploration.state.sectors.find(s => s.id === route.sourceId) ??
              exploration.state.systems.find(s => s.id === route.sourceId);

            const target =
              exploration.state.sectors.find(s => s.id === route.targetId) ??
              exploration.state.systems.find(s => s.id === route.targetId);

            if (!source || !target) {
              return;
            }

            // Skip if detail level is low and route is not significant
            if (settings.detailLevel === DetailLevel.LOW && route.volume < 50) {
              return;
            }

            // Convert coordinates to screen space
            const sourceX =
              (source.coordinates.x - viewport.x) * viewport.scale + viewport.width / 2;
            const sourceY =
              (source.coordinates.y - viewport.y) * viewport.scale + viewport.height / 2;

            const targetX =
              (target.coordinates.x - viewport.x) * viewport.scale + viewport.width / 2;
            const targetY =
              (target.coordinates.y - viewport.y) * viewport.scale + viewport.height / 2;

            // Draw trade route line
            ctx.beginPath();
            ctx.moveTo(sourceX, sourceY);
            ctx.lineTo(targetX, targetY);

            // Set style based on trade volume and theme
            const baseAlpha = settings.theme === MapTheme.DARK ? 0.4 : 0.3;
            const alpha = baseAlpha + (route.volume / 100) * 0.4;
            const width = 1 + (route.volume / 100) * 3;

            ctx.strokeStyle =
              settings.theme === MapTheme.DARK
                ? `rgba(120, 220, 255, ${alpha})`
                : `rgba(100, 200, 255, ${alpha})`;
            ctx.lineWidth = width;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw direction arrow if scale is sufficient and detail level allows
            if (viewport.scale > 0.5 && settings.detailLevel !== DetailLevel.LOW) {
              const dx = targetX - sourceX;
              const dy = targetY - sourceY;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance > 0) {
                const midX = sourceX + dx * 0.6;
                const midY = sourceY + dy * 0.6;

                const arrowSize = 7 * viewport.scale;
                const angle = Math.atan2(dy, dx);

                ctx.beginPath();
                ctx.moveTo(midX, midY);
                ctx.lineTo(
                  midX - arrowSize * Math.cos(angle - Math.PI / 6),
                  midY - arrowSize * Math.sin(angle - Math.PI / 6)
                );
                ctx.lineTo(
                  midX - arrowSize * Math.cos(angle + Math.PI / 6),
                  midY - arrowSize * Math.sin(angle + Math.PI / 6)
                );
                ctx.closePath();

                ctx.fillStyle =
                  settings.theme === MapTheme.DARK
                    ? 'rgba(120, 220, 255, 0.9)'
                    : 'rgba(100, 200, 255, 0.8)';
                ctx.fill();
              }
            }
          });
        },
      });
    }

    return layers;
  }, [
    exploration,
    visualSettings.showAnomalyIcons,
    visualSettings.showResourceIcons,
    visualSettings.showTradeRoutes,
  ]);

  // Create data table columns for sectors
  const sectorColumns = useMemo(
    () => [
      {
        id: 'name',
        header: 'Name',
        accessor: (sector: Sector) => sector.name,
        sortable: true,
      },
      {
        id: 'systems',
        header: 'Systems',
        accessor: (sector: Sector) => sector.systems.length.toString(),
        sortable: true,
      },
      {
        id: 'status',
        header: 'Status',
        accessor: (sector: Sector) => sector.explorationStatus,
        sortable: true,
      },
      {
        id: 'danger',
        header: 'Danger',
        accessor: (sector: Sector) => sector.dangerLevel,
        sortable: true,
      },
      {
        id: 'resources',
        header: 'Resources',
        accessor: (sector: Sector) => sector.resources.length.toString(),
        sortable: true,
      },
      {
        id: 'anomalies',
        header: 'Anomalies',
        accessor: (sector: Sector) => sector.anomalies.length.toString(),
        sortable: true,
      },
    ],
    []
  );

  // Create data table columns for systems
  const systemColumns = useMemo(
    () => [
      {
        id: 'name',
        header: 'Name',
        accessor: (system: StarSystem) => system.name,
        sortable: true,
      },
      {
        id: 'starType',
        header: 'Star Type',
        accessor: (system: StarSystem) => system.starType,
        sortable: true,
      },
      {
        id: 'planets',
        header: 'Planets',
        accessor: (system: StarSystem) => system.planets.length.toString(),
        sortable: true,
      },
      {
        id: 'status',
        header: 'Status',
        accessor: (system: StarSystem) => system.explorationStatus,
        sortable: true,
      },
      {
        id: 'features',
        header: 'Features',
        accessor: (system: StarSystem) => system.specialFeatures.length.toString(),
        sortable: true,
      },
    ],
    []
  );

  // Create data table columns for anomalies
  const anomalyColumns = useMemo(
    () => [
      {
        id: 'name',
        header: 'Name',
        accessor: (anomaly: Anomaly) => anomaly.name,
        sortable: true,
      },
      {
        id: 'type',
        header: 'Type',
        accessor: (anomaly: Anomaly) => anomaly.anomalyType,
        sortable: true,
      },
      {
        id: 'intensity',
        header: 'Intensity',
        accessor: (anomaly: Anomaly) => anomaly.intensity.toString(),
        sortable: true,
      },
      {
        id: 'stability',
        header: 'Stability',
        accessor: (anomaly: Anomaly) => anomaly.stability.toString(),
        sortable: true,
      },
      {
        id: 'danger',
        header: 'Danger',
        accessor: (anomaly: Anomaly) => anomaly.dangerLevel,
        sortable: true,
      },
      {
        id: 'status',
        header: 'Investigation',
        accessor: (anomaly: Anomaly) => anomaly.investigation.status,
        sortable: true,
      },
    ],
    []
  );

  // Create data table columns for resources
  const resourceColumns = useMemo(
    () => [
      {
        id: 'type',
        header: 'Type',
        accessor: (resource: ResourceDeposit) => resource.type,
        sortable: true,
      },
      {
        id: 'amount',
        header: 'Amount',
        accessor: (resource: ResourceDeposit) => resource.amount.toString(),
        sortable: true,
      },
      {
        id: 'quality',
        header: 'Quality',
        accessor: (resource: ResourceDeposit) => resource.quality.toString(),
        sortable: true,
      },
      {
        id: 'accessibility',
        header: 'Accessibility',
        accessor: (resource: ResourceDeposit) => resource.accessibility.toString(),
        sortable: true,
      },
      {
        id: 'status',
        header: 'Status',
        accessor: (resource: ResourceDeposit) => resource.explorationStatus,
        sortable: true,
      },
    ],
    []
  );

  // Get current columns based on data table view
  const currentColumns = useMemo(() => {
    switch (dataTableView) {
      case 'sectors':
        return sectorColumns;
      case 'systems':
        return systemColumns;
      case 'anomalies':
        return anomalyColumns;
      case 'resources':
        return resourceColumns;
      default:
        return [];
    }
  }, [dataTableView, sectorColumns, systemColumns, anomalyColumns, resourceColumns]);

  // Handle map click with standardized events
  const handleMapClick = useCallback(
    (worldX: number, worldY: number) => {
      // Find clicked entity
      // Check sectors first
      const sectors = exploration.getSectors();
      const clickedSector = sectors.find(sector => {
        const { x, y } = sector.coordinates;
        const dx = x - worldX;
        const dy = y - worldY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 20;
      });

      if (clickedSector) {
        setSelection([
          {
            entityId: clickedSector.id,
            entityType: 'sector',
            coordinates: clickedSector.coordinates,
            selected: true,
            highlightColor: '#ffcc00',
          },
        ]);

        // Emit exploration event
        const event: StandardizedEvent = {
          type: EventType.MODULE_UPDATED,
          moduleId: clickedSector.id,
          moduleType: 'exploration',
          timestamp: Date.now(),
          data: {
            entityType: 'sector',
            coordinates: clickedSector.coordinates,
            action: 'select',
          },
        };
        moduleEventBus.emit(event);
        return;
      }

      // Check systems
      const { systems } = exploration.state;
      const clickedSystem = systems.find(system => {
        const { x, y } = system.coordinates;
        const dx = x - worldX;
        const dy = y - worldY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 8;
      });

      if (clickedSystem) {
        setSelection([
          {
            entityId: clickedSystem.id,
            entityType: 'system',
            coordinates: clickedSystem.coordinates,
            selected: true,
            highlightColor: '#88aaff',
          },
        ]);

        // Emit exploration event
        const event: StandardizedEvent = {
          type: EventType.MODULE_UPDATED,
          moduleId: clickedSystem.id,
          moduleType: 'exploration',
          timestamp: Date.now(),
          data: {
            entityType: 'system',
            coordinates: clickedSystem.coordinates,
            action: 'select',
          },
        };
        moduleEventBus.emit(event);
        return;
      }

      // Check anomalies
      const { anomalies } = exploration.state;
      const clickedAnomaly = anomalies.find(anomaly => {
        const { x, y } = anomaly.coordinates;
        const dx = x - worldX;
        const dy = y - worldY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 8;
      });

      if (clickedAnomaly) {
        setSelection([
          {
            entityId: clickedAnomaly.id,
            entityType: 'anomaly',
            coordinates: clickedAnomaly.coordinates,
            selected: true,
            highlightColor: '#ff88ff',
          },
        ]);

        // Emit exploration event
        const event: StandardizedEvent = {
          type: EventType.MODULE_UPDATED,
          moduleId: clickedAnomaly.id,
          moduleType: 'exploration',
          timestamp: Date.now(),
          data: {
            entityType: 'anomaly',
            coordinates: clickedAnomaly.coordinates,
            action: 'select',
          },
        };
        moduleEventBus.emit(event);
      }
    },
    [exploration]
  );

  // Handle row click in data table
  const handleRowClick = useCallback(
    (item: Sector | StarSystem | Anomaly | ResourceDeposit | Planet) => {
      // Different selection handling based on data type
      if ('type' in item && item?.id) {
        if (item?.type === 'sector') {
          // It's a sector
          setSelection([
            {
              entityId: item?.id,
              entityType: 'sector',
              coordinates: item?.coordinates,
              selected: true,
              highlightColor: '#ffcc00',
            },
          ]);
        } else if (item?.type === 'system') {
          // It's a system
          setSelection([
            {
              entityId: item?.id,
              entityType: 'system',
              coordinates: item?.coordinates,
              selected: true,
              highlightColor: '#88aaff',
            },
          ]);
        } else if (item?.type === 'anomaly') {
          // It's an anomaly
          setSelection([
            {
              entityId: item?.id,
              entityType: 'anomaly',
              coordinates: item?.coordinates,
              selected: true,
              highlightColor: '#ff88aa',
            },
          ]);
        }
      } else if ('amount' in item) {
        // It's a resource
        setSelection([
          {
            entityId: item?.id,
            entityType: 'resource',
            coordinates: item?.coordinates,
            selected: true,
            highlightColor: '#aaffaa',
          },
        ]);
      }

      // If in split view, adjust view mode to show map
      if (viewMode === 'data-table') {
        setViewMode('split-view');
      }
    },
    [setSelection, viewMode]
  );

  // Handle analyze with standardized events
  const handleAnalyze = useCallback(() => {
    if (selection.length === 0) {
      return;
    }

    const entity = selection[0];
    const analysisTarget = entity.entityType;
    const analysisType = AnalysisType.STRATEGIC;

    // Create a simple analysis result
    const analysisId = exploration.createAnalysis({
      name: `${analysisTarget} - ${new Date().toLocaleDateString()}`,
      type: analysisType,
      entityIds: [entity.entityId],
      data: {
        coordinates: entity.coordinates,
        analysisTime: Date.now(),
        metrics: {
          value: Math.random() * 100,
          stability: Math.random() * 100,
          potential: Math.random() * 100,
          risk: Math.random() * 100,
        },
      },
      insights: [
        {
          id: `insight-${Date.now()}-1`,
          title: 'Primary Insight',
          description: 'This entity shows significant potential for further exploration.',
          significance: Math.floor(Math.random() * 100),
          actionable: true,
          recommendedActions: ['Deploy exploration team', 'Conduct detailed scan'],
        },
        {
          id: `insight-${Date.now()}-2`,
          title: 'Secondary Insight',
          description: 'Unusual patterns detected in the surrounding area.',
          significance: Math.floor(Math.random() * 60),
          actionable: false,
          recommendedActions: [],
        },
      ],
      summary:
        'Analysis complete. This entity has been scanned and analyzed for potential exploitation.',
      confidence: Math.floor(50 + Math.random() * 50),
    });

    // Get the created analysis
    const analysis = exploration
      .getAnalysisResultsByEntityId(entity.entityId)
      .find(a => a.id === analysisId);

    if (analysis) {
      setCurrentAnalysis(analysis);
      setViewMode('analysis');

      // Emit analysis event
      const event: StandardizedEvent = {
        type: EventType.MODULE_UPDATED,
        moduleId: entity.entityId,
        moduleType: 'exploration',
        timestamp: Date.now(),
        data: {
          entityType: entity.entityType,
          analysisId: analysisId,
          analysisType: analysisType,
          action: 'analyze',
        },
      };
      moduleEventBus.emit(event);
    }
  }, [selection, exploration]);

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  // Handle data table view change
  const handleDataTableViewChange = useCallback((view: DataTableView) => {
    setDataTableView(view);
  }, []);

  // Handle layout mode change
  const handleLayoutModeChange = useCallback((mode: LayoutMode) => {
    setLayoutMode(mode);
  }, []);

  // Handle visual settings change
  const handleVisualSettingsChange = useCallback(
    (key: keyof MapVisualSettings, value: boolean | DetailLevel | MapTheme) => {
      setVisualSettings(prev => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  // Render map component
  const renderMap = () => {
    if (viewMode === 'data-table' || viewMode === 'analysis') {
      return null;
    }

    return (
      <div
        style={{
          width: dimensions.mapWidth,
          height: dimensions.mapHeight,
        }}
        className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950"
      >
        <BaseMap
          width={dimensions.mapWidth}
          height={dimensions.mapHeight}
          layers={mapLayers}
          visualSettings={visualSettings}
          selection={selection}
          onMapClick={handleMapClick}
          onViewportChange={setViewport}
          allowPanning={true}
          allowZooming={true}
        />
      </div>
    );
  };

  // Render data table component
  const renderDataTable = () => {
    if (viewMode === 'map' || viewMode === 'analysis') {
      return null;
    }

    return (
      <div
        style={{
          width: dimensions.dataWidth,
          height: dimensions.dataHeight,
        }}
        className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/90 text-slate-100"
      >
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-100">
              {dataTableView.charAt(0).toUpperCase() + dataTableView.slice(1)}
            </h2>

            <div className="flex space-x-2">
              <select
                value={dataTableView}
                onChange={e => handleDataTableViewChange(e.target.value as DataTableView)}
                className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-slate-100"
              >
                <option value="sectors">Sectors</option>
                <option value="systems">Systems</option>
                <option value="planets">Planets</option>
                <option value="anomalies">Anomalies</option>
                <option value="resources">Resources</option>
              </select>

              {selection.length > 0 && (
                <button
                  onClick={handleAnalyze}
                  className="rounded-md border border-blue-500/70 bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-500"
                >
                  Analyze
                </button>
              )}
            </div>
          </div>

          <BaseDataTable<Sector | StarSystem | Anomaly | ResourceDeposit | Planet>
            data={viewData as (Sector | StarSystem | Anomaly | ResourceDeposit | Planet)[]}
            rowKey="id"
            columns={
              currentColumns as DataColumn<
                Sector | StarSystem | Anomaly | ResourceDeposit | Planet
              >[]
            }
            height={dimensions.dataHeight - 140}
            virtualized={true}
            onRowClick={handleRowClick}
            emptyMessage={`No ${dataTableView} found.`}
            loading={exploration.state.loading}
            selectedKeys={selection.map(s => s.entityId)}
          />
        </div>
      </div>
    );
  };

  // Render analysis component
  const renderAnalysis = () => {
    if (viewMode !== 'analysis') {
      return null;
    }

    if (!currentAnalysis) {
      return (
        <div
          style={{
            width: dimensions.dataWidth,
            height: dimensions.dataHeight,
          }}
          className="flex items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/90"
        >
          <p className="text-slate-300">
            No analysis selected. Select an entity and click "Analyze" to view analysis.
          </p>
        </div>
      );
    }

    return (
      <div
        style={{
          width: dimensions.dataWidth,
          height: dimensions.dataHeight,
        }}
        className="overflow-auto rounded-xl border border-slate-700/80 bg-slate-900/90 text-slate-100"
      >
        <BaseAnalysisVisualizer
          analysis={currentAnalysis}
          width={dimensions.dataWidth - 40}
          height={400}
          showInsightsPanel={true}
          showSummary={true}
          showControls={true}
          defaultVisualizationType="bar"
          className="p-4"
        />
      </div>
    );
  };

  // Render toolbar
  const renderToolbar = () => {
    if (!showToolbar) {
      return null;
    }

    return (
      <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-700/80 bg-slate-900/90 p-2">
        <div className="flex space-x-4">
          <button
            onClick={() => handleViewModeChange('map')}
            className={cn(
              'rounded-md px-3 py-1 text-sm',
              viewMode === 'map'
                ? 'border border-blue-500/70 bg-blue-600 text-white'
                : 'border border-slate-600 bg-slate-800 text-slate-200 hover:border-slate-500'
            )}
          >
            Map
          </button>
          <button
            onClick={() => handleViewModeChange('data-table')}
            className={cn(
              'rounded-md px-3 py-1 text-sm',
              viewMode === 'data-table'
                ? 'border border-blue-500/70 bg-blue-600 text-white'
                : 'border border-slate-600 bg-slate-800 text-slate-200 hover:border-slate-500'
            )}
          >
            Data
          </button>
          <button
            onClick={() => handleViewModeChange('analysis')}
            className={cn(
              'rounded-md px-3 py-1 text-sm',
              viewMode === 'analysis'
                ? 'border border-blue-500/70 bg-blue-600 text-white'
                : 'border border-slate-600 bg-slate-800 text-slate-200 hover:border-slate-500'
            )}
            disabled={!currentAnalysis}
          >
            Analysis
          </button>
          <button
            onClick={() => handleViewModeChange('split-view')}
            className={cn(
              'rounded-md px-3 py-1 text-sm',
              viewMode === 'split-view'
                ? 'border border-blue-500/70 bg-blue-600 text-white'
                : 'border border-slate-600 bg-slate-800 text-slate-200 hover:border-slate-500'
            )}
          >
            Split View
          </button>
        </div>

        <div className="flex space-x-4">
          {allowLayoutChange && viewMode === 'split-view' && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-300">Layout:</span>
              <button
                onClick={() => handleLayoutModeChange('horizontal')}
                className={cn(
                  'rounded-md px-2 py-1 text-sm',
                  layoutMode === 'horizontal'
                    ? 'border border-blue-500/70 bg-blue-600 text-white'
                    : 'border border-slate-600 bg-slate-800 text-slate-200 hover:border-slate-500'
                )}
              >
                Horizontal
              </button>
              <button
                onClick={() => handleLayoutModeChange('vertical')}
                className={cn(
                  'rounded-md px-2 py-1 text-sm',
                  layoutMode === 'vertical'
                    ? 'border border-blue-500/70 bg-blue-600 text-white'
                    : 'border border-slate-600 bg-slate-800 text-slate-200 hover:border-slate-500'
                )}
              >
                Vertical
              </button>
            </div>
          )}

          {allowVisualSettingsChange && (viewMode === 'map' || viewMode === 'split-view') && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-300">Show:</span>
              <label className="flex items-center space-x-1 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={visualSettings.showGrid}
                  onChange={e => handleVisualSettingsChange('showGrid', e.target.checked)}
                  className="form-checkbox h-3 w-3"
                />
                <span>Grid</span>
              </label>
              <label className="flex items-center space-x-1 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={visualSettings.showLabels}
                  onChange={e => handleVisualSettingsChange('showLabels', e.target.checked)}
                  className="form-checkbox h-3 w-3"
                />
                <span>Labels</span>
              </label>
              <label className="flex items-center space-x-1 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={visualSettings.showResourceIcons}
                  onChange={e => handleVisualSettingsChange('showResourceIcons', e.target.checked)}
                  className="form-checkbox h-3 w-3"
                />
                <span>Resources</span>
              </label>
              <label className="flex items-center space-x-1 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={visualSettings.showAnomalyIcons}
                  onChange={e => handleVisualSettingsChange('showAnomalyIcons', e.target.checked)}
                  className="form-checkbox h-3 w-3"
                />
                <span>Anomalies</span>
              </label>
              <label className="flex items-center space-x-1 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={visualSettings.showTradeRoutes}
                  onChange={e => handleVisualSettingsChange('showTradeRoutes', e.target.checked)}
                  className="form-checkbox h-3 w-3"
                />
                <span>Trade Routes</span>
              </label>
            </div>
          )}
        </div>

        {customToolbarContent}
      </div>
    );
  };

  // Render status bar
  const renderStatusBar = () => {
    if (!showStatusBar) {
      return null;
    }

    return (
      <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-700/80 bg-slate-900/90 p-2 text-sm text-slate-300">
        <div className="flex space-x-4">
          <span>Sectors: {exploration.state.sectors.length}</span>
          <span>Systems: {exploration.state.systems.length}</span>
          <span>Anomalies: {exploration.state.anomalies.length}</span>
          <span>Resources: {exploration.state.resources.length}</span>
        </div>

        <div className="flex space-x-4">
          {selection.length > 0 && (
            <span>
              Selected: {selection[0].entityType} - {selection[0].entityId}
            </span>
          )}

          <span>
            View: {Math.round(viewport.x)},{Math.round(viewport.y)} ({viewport.scale.toFixed(1)}x)
          </span>
        </div>

        {customStatusBarContent}
      </div>
    );
  };

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      // unknown cleanup needed for event subscriptions
    };
  }, []);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/90 text-slate-100 shadow-2xl',
        className
      )}
      style={{
        width: width,
        height: height,
      }}
    >
      {/* Toolbar */}
      {renderToolbar()}

      {/* Main content */}
      <div
        className={cn(
          'flex',
          layoutMode === 'horizontal' ? 'flex-row' : 'flex-col',
          viewMode === 'split-view' ? 'gap-4' : 'gap-0'
        )}
      >
        {renderMap()}
        {renderDataTable()}
        {renderAnalysis()}
      </div>

      {/* Status bar */}
      {renderStatusBar()}
    </div>
  );
};

export default GalaxyExplorationSystem;
