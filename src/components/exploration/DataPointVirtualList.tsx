import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import { Info, Layers, Map, RadioTower } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { DataPoint } from '../../types/exploration/DataAnalysisTypes';

interface DataPointVirtualListProps {
  dataPoints: DataPoint[];
  isLoading?: boolean;
  onSelectDataPoint?: (dataPoint: DataPoint) => void;
  selectedDataPointId?: string;
  height?: number | string;
}

/**
 * A virtualized list component for efficiently rendering large lists of data points
 *
 * This component uses react-window to only render the items that are visible in the viewport,
 * significantly improving performance for large datasets.
 */
export const DataPointVirtualList: React.FC<DataPointVirtualListProps> = ({
  dataPoints,
  isLoading = false,
  onSelectDataPoint,
  selectedDataPointId,
  height = 400,
}) => {
  const [expandedDataPoint, setExpandedDataPoint] = useState<string | null>(null);

  // Get the icon based on data point type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sector':
        return <Map size={16} />;
      case 'anomaly':
        return <RadioTower size={16} />;
      case 'resource':
        return <Layers size={16} />;
      default:
        return <Info size={16} />;
    }
  };

  // Format property values for display
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Render each row in the virtualized list
  const Row = useCallback(
    ({ index, style }: ListChildComponentProps) => {
      const dataPoint = dataPoints[index];
      const isExpanded = expandedDataPoint === dataPoint.id;
      const isSelected = selectedDataPointId === dataPoint.id;

      return (
        <div style={style}>
          <Paper
            elevation={isSelected ? 3 : 1}
            sx={{
              p: 1.5,
              m: 0.5,
              cursor: 'pointer',
              transition: 'all 0.2s',
              bgcolor: isSelected ? 'primary.50' : 'background.paper',
              border: isSelected ? '1px solid' : '1px solid transparent',
              borderColor: isSelected ? 'primary.main' : 'divider',
              '&:hover': {
                bgcolor: isSelected ? 'primary.50' : 'action.hover',
              },
            }}
            onClick={() => onSelectDataPoint && onSelectDataPoint(dataPoint)}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getTypeIcon(dataPoint.type)}
                <Typography variant="subtitle2">{dataPoint.name}</Typography>
                <Chip
                  size="small"
                  label={dataPoint.type}
                  color={
                    dataPoint.type === 'sector'
                      ? 'primary'
                      : dataPoint.type === 'anomaly'
                        ? 'secondary'
                        : 'success'
                  }
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              </Box>
              <Box>
                <Tooltip title={isExpanded ? 'Show less' : 'Show details'}>
                  <IconButton
                    size="small"
                    onClick={e => {
                      e.stopPropagation();
                      setExpandedDataPoint(isExpanded ? null : dataPoint.id);
                    }}
                  >
                    {isExpanded ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M18 15L12 9L6 15"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6 9L12 15L18 9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {isExpanded && (
              <Box sx={{ mt: 1.5 }}>
                <Divider sx={{ mb: 1.5 }} />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 1 }}
                >
                  ID: {dataPoint.id}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 0.5 }}
                >
                  Coordinates: {`(${dataPoint.coordinates.x}, ${dataPoint.coordinates.y})`}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 0.5 }}
                >
                  Date: {new Date(dataPoint.date).toLocaleString()}
                </Typography>

                <Typography variant="overline" display="block" sx={{ mt: 1.5, mb: 0.5 }}>
                  Properties
                </Typography>

                {Object.entries(dataPoint.properties).map(([key, value]) => (
                  <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {key}:
                    </Typography>
                    <Typography variant="caption" fontWeight="medium">
                      {formatValue(value)}
                    </Typography>
                  </Box>
                ))}

                {dataPoint.metadata && Object.keys(dataPoint.metadata).length > 0 && (
                  <>
                    <Typography variant="overline" display="block" sx={{ mt: 1.5, mb: 0.5 }}>
                      Metadata
                    </Typography>

                    {Object.entries(dataPoint.metadata).map(([key, value]) => (
                      <Box
                        key={key}
                        sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {key}:
                        </Typography>
                        <Typography variant="caption" fontWeight="medium">
                          {formatValue(value)}
                        </Typography>
                      </Box>
                    ))}
                  </>
                )}
              </Box>
            )}
          </Paper>
        </div>
      );
    },
    [dataPoints, expandedDataPoint, selectedDataPointId, onSelectDataPoint]
  );

  if (isLoading) {
    // Use style prop instead of sx to avoid complex union type
    return (
      <Box
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: height,
        }}
      >
        <CircularProgress size={24} sx={{ mr: 1 }} />
        <Typography variant="body2">Loading data points...</Typography>
      </Box>
    );
  }

  if (!dataPoints.length) {
    // Use style prop instead of sx to avoid complex union type
    return (
      <Box
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: height,
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: '4px',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No data points available
        </Typography>
      </Box>
    );
  }

  // Use style prop instead of sx to avoid complex union type
  return (
    <Box style={{ height: height, width: '100%' }}>
      <AutoSizer>
        {({ height: autoHeight, width }) => (
          <FixedSizeList
            height={autoHeight}
            width={width}
            itemCount={dataPoints.length}
            itemSize={expandedDataPoint ? 180 : 60} // Approximate height, can be adjusted
            overscanCount={5} // Render additional items above/below the visible area
          >
            {Row}
          </FixedSizeList>
        )}
      </AutoSizer>
    </Box>
  );
};

export default DataPointVirtualList;
