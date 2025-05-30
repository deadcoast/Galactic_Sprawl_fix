import InfoIcon from '@mui/icons-material/Info';
import {
  Box,
  FormControl,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Switch,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import * as React from 'react';
import { useMemo, useState } from 'react';
import {
  ChartDataRecord,
  ColorAccessorFn,
  ResourceGridCell,
  TooltipRenderer,
} from '../../../../types/exploration/AnalysisComponentTypes';
import { DataPoint } from '../../../../types/exploration/DataAnalysisTypes';
import { ResourceType, ResourceTypeString } from '../../../../types/resources/ResourceTypes';
import { ResourceTypeConverter } from '../../../../utils/resources/ResourceTypeConverter';
import { BaseChart } from './BaseChart';
import { HeatMap } from './HeatMap';
import { ScatterPlot } from './ScatterPlot';
import { createTooltipComponent } from './TooltipAdapter';

/**
 * Type definitions for internal use in ResourceMappingVisualization
 */
interface ResourceChartPoint extends ChartDataRecord {
  id: string;
  name: string;
  x: number;
  y: number;
  value: number;
  type: ResourceType;
  coordinates: { x: number; y: number };
}

interface ResourceHeatMapCell extends ChartDataRecord {
  x: number;
  y: number;
  value: number;
  resources: Array<{
    type: ResourceType;
    amount: number;
    quality?: number;
    accessibility?: number;
    estimatedValue?: number;
  }>;
  totalValue: number;
  dominantResource?: ResourceType;
  dominantPercentage?: number;
  totalResourceCount: number;
  dominantType: ResourceType;
}

/**
 * Interface for the data structure passed to ResourceMappingVisualization
 */
interface ResourceMappingData {
  resourcePoints: DataPoint[];
  gridCells?: ResourceGridCell[];
  resourceTypes: ResourceType[];
  valueMetric: 'amount' | 'quality' | 'accessibility' | 'estimatedValue';
  regionSize: number;
  xRange: [number, number];
  yRange: [number, number];
  density?: Record<string, number>;
  insights?: string[];
  summary?: string;
}

interface ResourceMappingVisualizationProps {
  data: ResourceMappingData;
  width?: number | string;
  height?: number;
  title?: string;
}

// Color mapping for different resource types
const resourceTypeColors: Record<ResourceType, string> = {
  [ResourceType.MINERALS]: '#3D85C6', // Blue
  [ResourceType.ENERGY]: '#F1C232', // Yellow/gold
  [ResourceType.POPULATION]: '#6AA84F', // Green
  [ResourceType.RESEARCH]: '#9FC5E8', // Light blue
  [ResourceType.PLASMA]: '#D5A6BD', // Purple
  [ResourceType.GAS]: '#C27BA0', // Pink
  [ResourceType.EXOTIC]: '#CC0000', // Red
  [ResourceType.ORGANIC]: '#8B4513', // Saddle brown
  [ResourceType.FOOD]: '#228B22', // Forest green
  [ResourceType.IRON]: '#8B8B8B', // Gray
  [ResourceType.COPPER]: '#CD7F32', // Bronze
  [ResourceType.TITANIUM]: '#B5B5B5', // Silver
  [ResourceType.URANIUM]: '#7CFC00', // Bright green
  [ResourceType.WATER]: '#1E90FF', // Dodger blue
  [ResourceType.HELIUM]: '#FFD700', // Gold
  [ResourceType.DEUTERIUM]: '#00FFFF', // Cyan
  [ResourceType.ANTIMATTER]: '#FF00FF', // Magenta
  [ResourceType.DARK_MATTER]: '#800080', // Purple
  [ResourceType.EXOTIC_MATTER]: '#FF1493', // Deep pink
};

// Define a function to get color for a resource type
const getResourceColor = (resourceType: ResourceType | ResourceTypeString): string => {
  // Handle both string and enum resource types
  if (Object.values(ResourceType).includes(resourceType as ResourceType)) {
    return resourceTypeColors[resourceType] || '#999999';
  } else if (
    typeof resourceType === 'string' &&
    !Object.values(ResourceType).includes(resourceType as ResourceType)
  ) {
    // Convert string to enum and get color
    const enumType = ResourceTypeConverter.stringToEnum(resourceType);
    return enumType ? resourceTypeColors[enumType] || '#999999' : '#999999';
  }
  return '#999999'; // Restore default color return
};

/**
 * ResourceMappingVisualization Component
 * Displays resource distribution across a 2D map with various visualization options
 */
export const ResourceMappingVisualization: React.FC<ResourceMappingVisualizationProps> = ({
  data,
  width = '100%',
  height = 600,
  title = 'Resource Mapping Analysis',
}) => {
  // Component state
  const [activeTab, setActiveTab] = useState(0);
  const [selectedResourceType, setSelectedResourceType] = useState<string | ResourceType>('all');
  const [showResourceLabels, setShowResourceLabels] = useState(false);
  const [overlayMode, setOverlayMode] = useState(false);

  // Prepare the heat map data
  const heatMapData = useMemo(() => {
    if (!data?.gridCells || data?.gridCells.length === 0) return [];

    return data?.gridCells.map((cell: ResourceGridCell) => {
      let value = 0;

      if (selectedResourceType === 'all') {
        value = cell.totalValue;
      } else {
        // Fix the type mismatch by using a more generic approach
        const resourceData = cell.resources.find(r => {
          // Convert both to string for comparison to avoid type mismatches
          const resourceTypeStr = Object.values(ResourceType).includes(r.type as ResourceType)
            ? ResourceTypeConverter.enumToString(r.type)
            : String(r.type);

          const selectedTypeStr = Object.values(ResourceType).includes(
            selectedResourceType as ResourceType
          )
            ? ResourceTypeConverter.enumToString(selectedResourceType as ResourceType)
            : String(selectedResourceType);

          return resourceTypeStr === selectedTypeStr;
        });

        if (resourceData) {
          value =
            (resourceData[data?.valueMetric as keyof typeof resourceData] as number) ||
            resourceData.amount;
        }
      }

      return {
        ...cell,
        value,
      };
    });
  }, [data?.gridCells, selectedResourceType, data?.valueMetric]);

  // Prepare scatter plot data
  const scatterData = useMemo(() => {
    if (!data?.resourcePoints || data?.resourcePoints.length === 0) return [];

    return data?.resourcePoints.map((point: DataPoint) => {
      // Safely extract resource data from properties
      const properties = point.properties ?? {};
      const resourceType = properties.resourceType || properties.type || 'unknown';
      const value = properties[data?.valueMetric] || properties.amount || 1;

      return {
        id: point.id,
        name: point.name || `Resource ${point.id}`,
        x: point.coordinates?.x ?? 0,
        y: point.coordinates?.y ?? 0,
        value,
        type: resourceType,
        coordinates: point.coordinates || { x: 0, y: 0 },
      };
    });
  }, [data?.resourcePoints, data?.valueMetric]);

  // Event handlers
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleResourceTypeChange = (event: SelectChangeEvent<string>) => {
    setSelectedResourceType(event?.target.value);
  };

  // Color function for scatter plot points
  const getPointColor = (point: ResourceChartPoint): string => {
    return getResourceColor(point.type as ResourceType | ResourceTypeString);
  };

  // Color function for heat map cells in overlay mode
  const getHeatMapCellColor = (cell: ResourceHeatMapCell): string => {
    return getResourceColor(cell.dominantType as ResourceType | ResourceTypeString);
  };

  // Tooltip for heatmap cells
  const renderCellTooltip: TooltipRenderer<ResourceHeatMapCell> = heatMapCell => {
    if (!heatMapCell) return null;

    const resources = heatMapCell.resources ?? [];
    const sortedResources = [...resources].sort((a, b) => {
      const aValue = (a[data?.valueMetric as keyof typeof a] as number) || a.amount;
      const bValue = (b[data?.valueMetric as keyof typeof b] as number) || b.amount;
      return bValue - aValue;
    });

    return (
      <Paper sx={{ p: 1.5, maxWidth: 300 }}>
        <Typography variant="subtitle2">
          Region ({heatMapCell.x}, {heatMapCell.y})
        </Typography>
        <Typography variant="body2">Total value: {heatMapCell.totalValue.toFixed(2)}</Typography>
        <Typography variant="body2">Resources: {heatMapCell.totalResourceCount}</Typography>
        {heatMapCell.dominantResource && typeof heatMapCell.dominantPercentage === 'number' && (
          <Typography variant="body2">
            Dominant: {heatMapCell.dominantResource} (
            {(heatMapCell.dominantPercentage * 100).toFixed(1)}%)
          </Typography>
        )}
        <div style={{ marginTop: 8 }}>
          {sortedResources.map((res, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: getResourceColor(res.type),
                  marginRight: 8,
                }}
              />
              <Typography variant="body2">
                {res.type}: {res.amount.toFixed(1)}{' '}
                {res.quality ? `(Q: ${res.quality.toFixed(1)})` : ''}
              </Typography>
            </div>
          ))}
        </div>
      </Paper>
    );
  };

  // Tooltip for scatter plot points
  const renderPointTooltip: TooltipRenderer<ResourceChartPoint> = point => (
    <Paper sx={{ p: 1 }}>
      <Typography variant="subtitle2">{point.name}</Typography>
      <Typography variant="body2">Type: {point.type}</Typography>
      <Typography variant="body2">
        {data?.valueMetric}: {point.value.toFixed(2)}
      </Typography>
      <Typography variant="body2">
        Location: ({point.coordinates.x.toFixed(1)}, {point.coordinates.y.toFixed(1)})
      </Typography>
    </Paper>
  );

  // Create tooltip components using adapter
  const PointTooltipComponent = useMemo(
    () => createTooltipComponent(renderPointTooltip),
    [renderPointTooltip]
  );

  // Create cell tooltip component using adapter
  const CellTooltipComponentFromRenderer = useMemo(
    () => createTooltipComponent(renderCellTooltip),
    [renderCellTooltip]
  );

  // Legend for resource types
  const renderLegend = () => (
    <Paper
      sx={{
        p: 2,
        mt: 2,
        backgroundColor: theme => theme.palette.background.paper,
      }}
    >
      {data?.resourceTypes.map((type: ResourceType) => (
        <div key={type} style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              backgroundColor: resourceTypeColors[type],
              marginRight: '8px',
              borderRadius: '50%',
            }}
          />
          <Typography variant="body2">{type}</Typography>
        </div>
      ))}
    </Paper>
  );

  // Insights display
  const renderInsights = () => {
    if (!data?.insights || data?.insights.length === 0) {
      return (
        <Paper sx={{ p: 2, mt: 2, backgroundColor: theme => theme.palette.background.paper }}>
          <Typography variant="body2">No insights available for this analysis.</Typography>
        </Paper>
      );
    }

    return (
      <Paper sx={{ p: 2, mt: 2, backgroundColor: theme => theme.palette.background.paper }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Key Insights
        </Typography>
        <Box component="ul" sx={{ ml: 2, mt: 1 }}>
          {data?.insights.map((insight: string, index: number) => (
            <Typography component="li" key={index} variant="body2" sx={{ mb: 1 }}>
              {insight}
            </Typography>
          ))}
        </Box>
      </Paper>
    );
  };

  // Heat map for resource distribution
  const renderHeatMap = () => {
    if (heatMapData.length === 0) {
      return (
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Typography variant="body1">
            No grid data available for heat map visualization.
          </Typography>
        </div>
      );
    }

    // Process colors for heat map
    const heatMapColors =
      overlayMode && selectedResourceType === 'all' ? Object.values(resourceTypeColors) : undefined;

    const colorAccessor =
      overlayMode && selectedResourceType === 'all'
        ? (getHeatMapCellColor as ColorAccessorFn<ChartDataRecord>)
        : undefined;

    return (
      <div style={{ height: 'calc(100% - 120px)', minHeight: '400px' }}>
        <HeatMap
          data={heatMapData}
          xKey="x"
          yKey="y"
          valueKey="value"
          width="100%"
          height="100%"
          showValues={false}
          showLegend={true}
          cellTooltip={true}
          customTooltip={CellTooltipComponentFromRenderer}
          colors={heatMapColors}
          colorAccessor={colorAccessor}
          cellBorder={{
            width: 1,
            color: 'rgba(255,255,255,0.3)',
            radius: 0,
          }}
        />
      </div>
    );
  };

  // Scatter plot for individual resource points
  const renderScatterPlot = () => {
    // Use the pre-processed scatter data
    const filteredScatterData =
      selectedResourceType === 'all'
        ? scatterData
        : scatterData.filter(point => point.type === selectedResourceType);

    if (filteredScatterData.length === 0) {
      return (
        <div
          style={{
            width: '100%',
            height: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="body1">No resources to display</Typography>
        </div>
      );
    }

    // Set up props for ScatterPlot
    const scatterPlotProps = {
      data: filteredScatterData,
      xAxisKey: 'x',
      yAxisKey: 'y',
      width: typeof width === 'number' ? width : 800,
      height: 400,
      sizeKey: 'value',
      colorAccessor: getPointColor as ColorAccessorFn<ChartDataRecord>,
      showLabels: true,
      labelKey: 'name',
      customTooltip: PointTooltipComponent,
    };

    return <ScatterPlot {...scatterPlotProps} />;
  };

  return (
    <BaseChart title={title} width={width} height={height}>
      <>
        <div style={{ width: '100%', marginBottom: '16px' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Heat Map" />
            <Tab label="Scatter Plot" />
            <Tab label="Insights" />
          </Tabs>
        </div>

        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={
                typeof selectedResourceType === 'string'
                  ? selectedResourceType
                  : ResourceTypeConverter.enumToString(selectedResourceType as ResourceType)
              }
              onChange={handleResourceTypeChange}
              displayEmpty
              size="small"
            >
              <MenuItem value="all">All Resources</MenuItem>
              {data?.resourceTypes.map((type: ResourceType) => (
                <MenuItem key={type} value={ResourceTypeConverter.enumToString(type)}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={overlayMode}
                onChange={e => setOverlayMode(e.target.checked)}
                size="small"
              />
            }
            label="Overlay Mode"
          />

          {activeTab === 1 && (
            <FormControlLabel
              control={
                <Switch
                  checked={showResourceLabels}
                  onChange={e => setShowResourceLabels(e.target.checked)}
                  size="small"
                />
              }
              label="Show Labels"
            />
          )}

          <Tooltip title="Overlay mode shows resource types with different colors. For heat maps, it colors cells by dominant resource type.">
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>

        {overlayMode && selectedResourceType === 'all' && renderLegend()}

        {activeTab === 0 && renderHeatMap()}
        {activeTab === 1 && renderScatterPlot()}
        {activeTab === 2 && renderInsights()}
      </>
    </BaseChart>
  );
};
