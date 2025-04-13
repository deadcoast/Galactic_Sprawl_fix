import {
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Tooltip,
  Typography,
  styled,
} from '@mui/material';
import { Info, Layers, Map, RadioTower } from 'lucide-react';
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { DataPoint } from '../../types/exploration/DataAnalysisTypes';

// Create styled components to avoid complex sx props
const Container = styled('div')(() => ({
  height: 400,
  width: '100%',
}));

const LoadingContainer = styled('div')(() => ({
  height: 400,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}));

const EmptyContainer = styled('div')(() => ({
  height: 400,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  border: '1px dashed #ccc',
  borderRadius: '4px',
}));

const LoadingText = styled(Typography)(({ theme }) => ({
  marginLeft: theme.spacing(1),
}));

const FlexRow = styled('div')(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const FlexRowGap = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const StyledChip = styled(Chip)(() => ({
  height: 20,
  fontSize: '0.7rem',
}));

const ExpandedBox = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(1.5),
}));

const StyledDivider = styled(Divider)(() => ({
  marginBottom: 1.5,
}));

const CaptionBlock = styled(Typography)(({ theme }) => ({
  display: 'block',
  marginBottom: theme.spacing(1),
}));

const CaptionBlockSmall = styled(Typography)(({ theme }) => ({
  display: 'block',
  marginBottom: theme.spacing(0.5),
}));

const OverlineText = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1.5),
  marginBottom: theme.spacing(0.5),
}));

const PropertyRow = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(0.5),
}));

// Create styled Paper components for selected and unselected states
const DataPointPaper = styled(Paper, {
  shouldForcombatdProp: prop => prop !== 'isSelected',
})<{ isSelected?: boolean }>(({ theme, isSelected }) => ({
  padding: theme.spacing(1.5),
  margin: theme.spacing(0.5),
  cursor: 'pointer',
  transition: 'all 0.2s',
  backgroundColor: isSelected
    ? theme.palette.primary.light // Use light instead of [50]
    : theme.palette.background.paper,
  border: isSelected ? '1px solid' : '1px solid transparent',
  borderColor: isSelected ? theme.palette.primary.main : theme.palette.divider,
  '&:hover': {
    backgroundColor: isSelected
      ? theme.palette.primary.light // Use light instead of [50]
      : theme.palette.action.hover,
  },
}));

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
          <DataPointPaper
            elevation={isSelected ? 3 : 1}
            isSelected={isSelected}
            onClick={() => onSelectDataPoint && onSelectDataPoint(dataPoint)}
          >
            <FlexRow>
              <FlexRowGap>
                {getTypeIcon(dataPoint.type)}
                <Typography variant="subtitle2">{dataPoint.name}</Typography>
                <StyledChip
                  size="small"
                  label={dataPoint.type}
                  color={
                    dataPoint.type === 'sector'
                      ? 'primary'
                      : dataPoint.type === 'anomaly'
                        ? 'secondary'
                        : 'success'
                  }
                />
              </FlexRowGap>
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
            </FlexRow>

            {isExpanded && (
              <ExpandedBox>
                <StyledDivider />
                <CaptionBlock variant="caption" color="text.secondary">
                  ID: {dataPoint.id}
                </CaptionBlock>

                <CaptionBlockSmall variant="caption" color="text.secondary">
                  Coordinates: {`(${dataPoint.coordinates.x}, ${dataPoint.coordinates.y})`}
                </CaptionBlockSmall>

                <CaptionBlockSmall variant="caption" color="text.secondary">
                  Date: {new Date(dataPoint.date).toLocaleString()}
                </CaptionBlockSmall>

                <OverlineText variant="overline" display="block">
                  Properties
                </OverlineText>

                {Object.entries(dataPoint.properties).map(([key, value]) => (
                  <PropertyRow key={key}>
                    <Typography variant="caption" color="text.secondary">
                      {key}:
                    </Typography>
                    <Typography variant="caption" fontWeight="medium">
                      {formatValue(value)}
                    </Typography>
                  </PropertyRow>
                ))}

                {dataPoint.metadata && Object.keys(dataPoint.metadata).length > 0 && (
                  <>
                    <OverlineText variant="overline" display="block">
                      Metadata
                    </OverlineText>

                    {Object.entries(dataPoint.metadata).map(([key, value]) => (
                      <PropertyRow key={key}>
                        <Typography variant="caption" color="text.secondary">
                          {key}:
                        </Typography>
                        <Typography variant="caption" fontWeight="medium">
                          {formatValue(value)}
                        </Typography>
                      </PropertyRow>
                    ))}
                  </>
                )}
              </ExpandedBox>
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
        <LoadingContainer>
          <CircularProgress size={24} />
          <LoadingText variant="body2">Loading data points...</LoadingText>
        </LoadingContainer>
      );
    }

    if (!dataPoints.length) {
      return (
        <EmptyContainer>
          <Typography variant="body2" color="text.secondary">
            No data points available
          </Typography>
        </EmptyContainer>
      );
    }

    return (
      <Container>
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
      </Container>
    );
  }, [dataPoints, isLoading, expandedDataPoint, Row]);

  return renderList;
};

export default DataPointVirtualList;
