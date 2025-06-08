import {
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    Paper, styled, Tooltip,
    Typography
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { Info, Layers, Map, RadioTower } from 'lucide-react';
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { DataPoint } from '../../types/exploration/DataAnalysisTypes';

// Type-safe theme access helpers
const getThemeValue = (theme: Theme, path: string, fallback = ''): string => {
  try {
    const parts = path.split('.');
    let value: unknown = theme;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return fallback;
      }
    }
    
    return typeof value === 'string' ? value : fallback;
  } catch (error) {
    console.warn(`Failed to access theme path "${path}":`, error);
    return fallback;
  }
};

const getThemeSpacing = (theme: Theme, multiplier: number): string => {
  try {
    if (typeof theme.spacing === 'function') {
      const result = theme.spacing(multiplier);
      if (typeof result === 'string') {
        return result;
      } else if (typeof result === 'number') {
        return `${result}px`;
      } else {
        return `${multiplier * 8}px`;
      }
    }
    return `${multiplier * 8}px`;
  } catch (error) {
    console.warn(`Failed to get theme spacing for multiplier ${multiplier}:`, error);
    return `${multiplier * 8}px`;
  }
};

// Create styled components to avoid complex sx props with proper typing
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

const LoadingText = styled(Typography)(({ theme }: { theme: Theme }) => ({
  marginLeft: getThemeSpacing(theme, 1),
}));

const FlexRow = styled('div')(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const FlexRowGap = styled('div')(({ theme }: { theme: Theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: getThemeSpacing(theme, 1),
}));

const StyledChip = styled(Chip)(() => ({
  height: 20,
  fontSize: '0.7rem',
}));

const ExpandedBox = styled('div')(({ theme }: { theme: Theme }) => ({
  marginTop: getThemeSpacing(theme, 1.5),
}));

const StyledDivider = styled(Divider)(() => ({
  marginBottom: 1.5,
}));

const CaptionBlock = styled(Typography)(({ theme }: { theme: Theme }) => ({
  display: 'block',
  marginBottom: getThemeSpacing(theme, 1),
}));

const CaptionBlockSmall = styled(Typography)(({ theme }: { theme: Theme }) => ({
  display: 'block',
  marginBottom: getThemeSpacing(theme, 0.5),
}));

const OverlineText = styled(Typography)(({ theme }: { theme: Theme }) => ({
  marginTop: getThemeSpacing(theme, 1.5),
  marginBottom: getThemeSpacing(theme, 0.5),
}));

const PropertyRow = styled('div')(({ theme }: { theme: Theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: getThemeSpacing(theme, 0.5),
}));

// Type-safe styled Paper component with proper theme access
interface DataPointPaperProps {
  isSelected?: boolean;
  theme: Theme;
}

const DataPointPaper = styled(Paper, {
  shouldForwardProp: (prop: PropertyKey) => prop !== 'isSelected',
})<{ isSelected?: boolean }>(({ theme, isSelected }: DataPointPaperProps) => {
  // Safe theme access with fallbacks
  const primaryLight = getThemeValue(theme, 'palette.primary.light', '#bbdefb');
  const primaryMain = getThemeValue(theme, 'palette.primary.main', '#2196f3');
  const backgroundPaper = getThemeValue(theme, 'palette.background.paper', '#ffffff');
  const actionHover = getThemeValue(theme, 'palette.action.hover', 'rgba(0, 0, 0, 0.04)');
  const dividerColor = getThemeValue(theme, 'palette.divider', 'rgba(0, 0, 0, 0.12)');
  
  return {
    padding: getThemeSpacing(theme, 1.5),
    margin: getThemeSpacing(theme, 0.5),
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: isSelected ? primaryLight : backgroundPaper,
    border: isSelected ? '1px solid' : '1px solid transparent',
    borderColor: isSelected ? primaryMain : dividerColor,
    '&:hover': {
      backgroundColor: isSelected ? primaryLight : actionHover,
    },
  };
});

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
                    <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
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
                        <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
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
      </Container>
    );
  }, [dataPoints, isLoading, expandedDataPoint, Row]);

  return renderList;
};

export default DataPointVirtualList;
