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
import React, { useMemo, useState } from 'react';
import {
  ChartDataRecord,
  ResourceMappingVisualizationProps,
  TooltipRenderer,
} from '../../../../types/exploration/AnalysisComponentTypes';
import { ResourceType } from '../../../../types/resources/ResourceTypes';
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
  type: string;
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
  dominantType: string;
}

// Color mapping for different resource types
const resourceTypeColors: Record<ResourceType, string> = {
  minerals: '#3D85C6', // Blue
  energy: '#F1C232', // Yellow/gold
  population: '#6AA84F', // Green
  research: '#9FC5E8', // Light blue
  plasma: '#D5A6BD', // Purple
  gas: '#C27BA0', // Pink
  exotic: '#CC0000', // Red
};

/**
 * ResourceMappingVisualization component
 * Displays spatial distribution of resources in a map-like visualization
 */
export const ResourceMappingVisualization: React.FC<ResourceMappingVisualizationProps> = ({
  data,
  width = '100%',
  height = 600,
  title = 'Resource Mapping Analysis',
}) => {
  // Component state
  const [activeTab, setActiveTab] = useState(0);
  const [selectedResourceType, setSelectedResourceType] = useState<string>('all');
  const [showResourceLabels, setShowResourceLabels] = useState(false);
  const [overlayMode, setOverlayMode] = useState(false);

  // Prepare the heat map data
  const heatMapData = useMemo(() => {
    if (!data.gridCells || data.gridCells.length === 0) return [];

    return data.gridCells.map(cell => {
      let value = 0;

      if (selectedResourceType === 'all') {
        value = cell.totalValue;
      } else {
        const resourceData = cell.resources.find(r => r.type === selectedResourceType);
        if (resourceData) {
          value = resourceData[data.valueMetric] || resourceData.amount;
        }
      }

      return {
        x: cell.x,
        y: cell.y,
        value,
        resources: cell.resources,
        totalValue: cell.totalValue,
        dominantResource: cell.dominantResource,
        dominantPercentage: cell.dominantPercentage || 0,
        totalResourceCount: cell.totalResourceCount,
        dominantType: cell.dominantResource || 'none',
      } as ResourceHeatMapCell;
    });
  }, [data.gridCells, selectedResourceType, data.valueMetric]);

  // Prepare scatter plot data
  const scatterData = useMemo(() => {
    if (!data.resourcePoints || data.resourcePoints.length === 0) return [];

    return data.resourcePoints.map(point => {
      // Safely extract resource data from properties
      const properties = point.properties || {};
      const resourceType = properties.resourceType || properties.type || 'unknown';
      const amount = typeof properties.amount === 'number' ? properties.amount : 1;

      // Determine the value based on the selected metric
      let value = amount;
      if (data.valueMetric === 'quality' && typeof properties.quality === 'number') {
        value = properties.quality;
      } else if (
        data.valueMetric === 'accessibility' &&
        typeof properties.accessibility === 'number'
      ) {
        value = properties.accessibility;
      } else if (
        data.valueMetric === 'estimatedValue' &&
        typeof properties.estimatedValue === 'number'
      ) {
        value = properties.estimatedValue;
      }

      return {
        id: point.id,
        name: point.name || `Resource ${point.id}`,
        x: point.coordinates?.x || 0,
        y: point.coordinates?.y || 0,
        value,
        type: resourceType,
        coordinates: point.coordinates || { x: 0, y: 0 },
      } as ResourceChartPoint;
    });
  }, [data.resourcePoints, data.valueMetric]);

  // Event handlers
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleResourceTypeChange = (event: SelectChangeEvent<string>) => {
    setSelectedResourceType(event.target.value);
  };

  // Color function for scatter plot points
  const getPointColor = (point: ResourceChartPoint): string => {
    const resourceType = point.type as ResourceType;
    return resourceTypeColors[resourceType] || '#888888';
  };

  // Color function for heat map cells in overlay mode
  const getHeatMapCellColor = (cell: ResourceHeatMapCell): string => {
    const dominantType = cell.dominantType as ResourceType;
    return resourceTypeColors[dominantType] || '#888888';
  };

  // Tooltip for heatmap cells
  const renderCellTooltip: TooltipRenderer<ResourceHeatMapCell> = cell => {
    if (!cell) return null;

    const resources = cell.resources || [];
    const sortedResources = [...resources].sort(
      (a, b) => (b[data.valueMetric] || b.amount) - (a[data.valueMetric] || a.amount)
    );

    return (
      <Paper sx={{ p: 1, maxWidth: 300 }}>
        <Typography variant="subtitle2">
          Region ({cell.x}, {cell.y})
        </Typography>
        <Typography variant="body2">Total value: {cell.totalValue.toFixed(2)}</Typography>
        <Typography variant="body2">Resources: {cell.totalResourceCount}</Typography>
        {cell.dominantResource && (
          <Typography variant="body2">
            Dominant: {cell.dominantResource} ({(cell.dominantPercentage * 100).toFixed(1)}%)
          </Typography>
        )}
        <Box sx={{ mt: 1 }}>
          {sortedResources.map((res, idx) => (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: resourceTypeColors[res.type] || '#888888',
                  mr: 1,
                  borderRadius: '50%',
                }}
              />
              <Typography variant="body2">
                {res.type}: {(res[data.valueMetric] || res.amount).toFixed(2)}
                {data.valueMetric === 'quality' && ' (quality)'}
                {data.valueMetric === 'accessibility' && ' (access)'}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    );
  };

  // Tooltip for scatter plot points
  const renderPointTooltip: TooltipRenderer<ResourceChartPoint> = point => (
    <Paper sx={{ p: 1 }}>
      <Typography variant="subtitle2">{point.name}</Typography>
      <Typography variant="body2">Type: {point.type}</Typography>
      <Typography variant="body2">
        {data.valueMetric}: {point.value.toFixed(2)}
      </Typography>
      <Typography variant="body2">
        Location: ({point.coordinates.x.toFixed(1)}, {point.coordinates.y.toFixed(1)})
      </Typography>
    </Paper>
  );

  // Create React component versions of our tooltip renderers using the adapter
  const CellTooltipComponent = useMemo(
    () => createTooltipComponent(renderCellTooltip),
    [renderCellTooltip]
  );
  const PointTooltipComponent = useMemo(
    () => createTooltipComponent(renderPointTooltip),
    [renderPointTooltip]
  );

  // Legend for resource types
  const renderLegend = () => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2, justifyContent: 'center' }}>
      {data.resourceTypes.map(type => (
        <Box key={type} sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: resourceTypeColors[type],
              mr: 1,
              borderRadius: '50%',
            }}
          />
          <Typography variant="body2">{type}</Typography>
        </Box>
      ))}
    </Box>
  );

  // Insights display
  const renderInsights = () => {
    if (!data.insights || data.insights.length === 0) {
      return (
        <Paper sx={{ p: 2, mt: 2, backgroundColor: theme => theme.palette.background.paper }}>
          <Typography variant="body2">No insights available for this analysis.</Typography>
        </Paper>
      );
    }

    return (
      <Paper sx={{ p: 2, mt: 2, backgroundColor: theme => theme.palette.background.paper }}>
        <Typography variant="h6" gutterBottom>
          Resource Analysis Insights
        </Typography>
        <Box component="ul" sx={{ ml: 2, mt: 1 }}>
          {data.insights.map((insight, index) => (
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
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body1">
            No grid data available for heat map visualization.
          </Typography>
        </Box>
      );
    }

    // Create a color array from resource colors if in overlay mode
    const heatMapColors =
      overlayMode && selectedResourceType === 'all' ? Object.values(resourceTypeColors) : undefined;

    return (
      <Box sx={{ height: 'calc(100% - 120px)', minHeight: 400 }}>
        <HeatMap
          data={heatMapData}
          valueKey="value"
          xKey="x"
          yKey="y"
          width="100%"
          height="100%"
          showValues={false}
          showLegend={true}
          cellTooltip={true}
          customTooltip={CellTooltipComponent}
          colors={heatMapColors}
          colorAccessor={
            overlayMode && selectedResourceType === 'all' ? getHeatMapCellColor : undefined
          }
          cellBorder={{
            width: 1,
            color: 'rgba(255,255,255,0.3)',
            radius: 0,
          }}
        />
      </Box>
    );
  };

  // Scatter plot for individual resource points
  const renderScatterPlot = () => {
    if (scatterData.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body1">
            No resource points available for scatter plot visualization.
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ height: 'calc(100% - 120px)', minHeight: 400 }}>
        <ScatterPlot
          data={scatterData}
          xKey="x"
          yKey="y"
          width="100%"
          height="100%"
          sizeKey="value"
          colorAccessor={getPointColor}
          showLabels={showResourceLabels}
          labelKey="name"
          customTooltip={PointTooltipComponent}
        />
      </Box>
    );
  };

  return (
    <BaseChart title={title} width={width} height={height}>
      <Box sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Heat Map" />
          <Tab label="Resource Points" />
          <Tab label="Insights" />
        </Tabs>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
          <Select value={selectedResourceType} onChange={handleResourceTypeChange} displayEmpty>
            <MenuItem value="all">All Resources</MenuItem>
            {data.resourceTypes.map(type => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={showResourceLabels}
              onChange={e => setShowResourceLabels(e.target.checked)}
              color="primary"
            />
          }
          label="Show Labels"
        />

        {activeTab === 0 && (
          <FormControlLabel
            control={
              <Switch
                checked={overlayMode}
                onChange={e => setOverlayMode(e.target.checked)}
                color="primary"
              />
            }
            label="Resource Type Overlay"
          />
        )}

        <Tooltip title="The resource mapping visualization shows the distribution of resources across the analyzed region. Heat map displays resource concentration while the scatter plot shows individual resource points.">
          <IconButton size="small">
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {activeTab === 0 && renderHeatMap()}
      {activeTab === 1 && renderScatterPlot()}
      {activeTab === 2 && renderInsights()}

      {renderLegend()}
    </BaseChart>
  );
};
