import
  {
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    Paper,
    Tooltip,
    Typography
  } from '@mui/material';
import { Info, Layers, Map, RadioTower } from 'lucide-react';
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { DataPoint } from '../../types/exploration/DataAnalysisTypes';



// Style objects to avoid styled component TypeScript issues
const styles = {
  container: {
    height: 400,
    width: '100%',
  },
  loadingContainer: {
    height: 400,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    height: 400,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: '1px dashed #ccc',
    borderRadius: '4px',
  },
  loadingText: {
    marginLeft: '8px',
  },
  flexRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flexRowGap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  expandedBox: {
    marginTop: '12px',
  },
  divider: {
    marginBottom: '12px',
  },
  captionBlock: {
    display: 'block',
    marginBottom: '8px',
  },
  captionBlockSmall: {
    display: 'block',
    marginBottom: '4px',
  },
  overlineText: {
    marginTop: '12px',
    marginBottom: '4px',
  },
  propertyRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  chip: {
    height: 20,
    fontSize: '0.7rem',
  },
} as const;

// Paper component function with proper typing
const DataPointPaper = ({ isSelected, children, ...props }: {
  isSelected?: boolean;
  children: React.ReactNode;
  elevation?: number;
  onClick?: () => void;
}) => {
  const paperStyles = {
    padding: '12px',
    margin: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: isSelected ? '#bbdefb' : '#ffffff',
    border: isSelected ? '1px solid #2196f3' : '1px solid transparent',
    borderColor: isSelected ? '#2196f3' : 'rgba(0, 0, 0, 0.12)',
  };

  return (
    <Paper style={paperStyles} {...props}>
      {children}
    </Paper>
  );
};

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
  // height prop is defined in interface but not used in implementation
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
    if (Array.isArray(value))
      return value
        .map(el => (typeof el === 'object' ? JSON.stringify(el) : String(el)))
        .join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    // At this point value is primitive (string | number | bigint | symbol)
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return typeof value === 'symbol' ? value.toString() : String(value);
  };

  // Render each row in the virtualized list
  const Row = useCallback(
    ({ index, style }: ListChildComponentProps) => {
      const dataPoint = dataPoints[index];
      const isExpanded = expandedDataPoint === dataPoint.id;
      const isSelected = selectedDataPointId === dataPoint.id;

      return (
        <div style={style}>
          <DataPointPaper
            elevation={isSelected ? 3 : 1}
            isSelected={isSelected}
            onClick={() => onSelectDataPoint && onSelectDataPoint(dataPoint)}
          >
            <div style={styles.flexRow}>
              <div style={styles.flexRowGap}>
                {getTypeIcon(dataPoint.type)}
                <Typography variant="subtitle2">{dataPoint.name}</Typography>
                <Chip
                  size="small"
                  label={dataPoint.type}
                  style={styles.chip}
                  color={
                    dataPoint.type === 'sector'
                      ? 'primary'
                      : dataPoint.type === 'anomaly'
                        ? 'secondary'
                        : 'success'
                  }
                />
              </div>
              <div>
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
              </div>
            </div>

            {isExpanded && (
              <div style={styles.expandedBox}>
                <Divider style={styles.divider} />
                <Typography variant="caption" color="text.secondary" style={styles.captionBlock}>
                  ID: {dataPoint.id}
                </Typography>

                <Typography variant="caption" color="text.secondary" style={styles.captionBlockSmall}>
                  Coordinates: {`(${dataPoint.coordinates.x}, ${dataPoint.coordinates.y})`}
                </Typography>

                <Typography variant="caption" color="text.secondary" style={styles.captionBlockSmall}>
                  Date: {new Date(dataPoint.date).toLocaleString()}
                </Typography>

                <Typography variant="overline" component="div" style={styles.overlineText}>
                  Properties
                </Typography>

                {Object.entries(dataPoint.properties).map(([key, value]) => (
                  <div key={key} style={styles.propertyRow}>
                    <Typography variant="caption" color="text.secondary">
                      {key}:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                      {formatValue(value)}
                    </Typography>
                  </div>
                ))}

                {dataPoint.metadata && Object.keys(dataPoint.metadata).length > 0 && (
                  <>
                    <Typography variant="overline" component="div" style={styles.overlineText}>
                      Metadata
                    </Typography>

                    {Object.entries(dataPoint.metadata).map(([key, value]) => (
                      <div key={key} style={styles.propertyRow}>
                        <Typography variant="caption" color="text.secondary">
                          {key}:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                          {formatValue(value)}
                        </Typography>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </DataPointPaper>
        </div>
      );
    },
    [dataPoints, expandedDataPoint, selectedDataPointId, onSelectDataPoint]
  );

  // Memoize the list component to prevent unnecessary re-renders
  const renderList = useMemo(() => {
    if (isLoading) {
      return (
        <div style={styles.loadingContainer}>
          <CircularProgress size={24} />
          <Typography variant="body2" style={styles.loadingText}>Loading data points...</Typography>
        </div>
      );
    }

    if (!dataPoints.length) {
      return (
        <div style={styles.emptyContainer}>
          <Typography variant="body2" color="text.secondary">
            No data points available
          </Typography>
        </div>
      );
    }

    return (
      <div style={styles.container}>
        <AutoSizer>
          {({ height: autoHeight, width }: { height: number; width: number }) => (
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
      </div>
    );
  }, [dataPoints, isLoading, expandedDataPoint, Row]);

  return renderList;
};

export default DataPointVirtualList;
