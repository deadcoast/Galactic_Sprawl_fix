import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChartDataRecord } from '../../../../types/exploration/AnalysisComponentTypes';
import { BaseChart } from './BaseChart';

// Cell data structure for the heat map
export interface HeatMapCell {
  x: number;
  y: number;
  xIndex: number;
  yIndex: number;
  value: number;
  originalX: number;
  originalY: number;
  [key: string]: unknown;
}

export interface ViewportOptimizedHeatMapProps {
  /** Data to visualize */
  data: ChartDataRecord[];

  /** Key for the value to visualize */
  valueKey: string;

  /** Key for X-axis values */
  xKey?: string;

  /** Key for Y-axis values */
  yKey?: string;

  /** Width of the chart */
  width?: number | string;

  /** Height of the chart */
  height?: number | string;

  /** Title displayed above the chart */
  title?: string;

  /** Subtitle displayed below the title */
  subtitle?: string;

  /** Size of each cell in pixels */
  cellSize?: number;

  /** Array of labels for X-axis */
  xLabels?: string[];

  /** Array of labels for Y-axis */
  yLabels?: string[];

  /** Whether to show values inside cells */
  showValues?: boolean;

  /** Custom function to format cell values */
  valueFormatter?: (value: number) => string;

  /** Number of decimal places for displayed values */
  valueDecimals?: number;

  /** Minimum value for color scale (if undefined, uses min from data) */
  minValue?: number;

  /** Maximum value for color scale (if undefined, uses max from data) */
  maxValue?: number;

  /** Border style for cells */
  cellBorder?: {
    width?: number;
    color?: string;
    radius?: number;
  };

  /** Theme for the chart (light or dark) */
  theme?: 'light' | 'dark';

  /** Colors to use for the heat map gradient */
  colors?: string[];

  /** CSS class name */
  className?: string;

  /** Function to call when a cell is clicked */
  onElementClick?: (data: Record<string, unknown>, index: number) => void;

  /** Error message to display if there's an error */
  errorMessage?: string;

  /** Maximum grid cells to render before applying viewport optimization */
  maxCellsBeforeOptimization?: number;

  /** Whether to show a legend */
  showLegend?: boolean;

  /** Function to determine the color of cells based on the data */
  colorAccessor?: (item: ChartDataRecord) => string;
}

/**
 * ViewportOptimizedHeatMap is a high-performance heat map component that
 * only renders cells visible in the current viewport, greatly improving
 * rendering performance for large datasets.
 */
export const ViewportOptimizedHeatMap = React.memo(function ViewportOptimizedHeatMap({
  data,
  valueKey,
  xKey = 'x',
  yKey = 'y',
  width = '100%',
  height = 400,
  title,
  subtitle,
  cellSize = 40,
  xLabels,
  yLabels,
  showValues = true,
  valueFormatter = (value: number) => value.toFixed(1),
  valueDecimals = 1,
  minValue,
  maxValue,
  cellBorder = {
    width: 1,
    color: 'rgba(255,255,255,0.2)',
    radius: 0,
  },
  colors = [
    '#0a2f5c', // Dark blue
    '#0e4c92', // Navy blue
    '#3373c4', // Medium blue
    '#5a9bd4', // Light blue
    '#7fc8f8', // Sky blue
    '#a3d8f4', // Pale blue
    '#c6e7f5', // Very pale blue
    '#e1f3fb', // Almost white blue
    '#feebe2', // Very pale red
    '#fcc5c0', // Pale red
    '#fa9fb5', // Light red
    '#f768a1', // Pink
    '#dd3497', // Medium pink
    '#ae017e', // Dark pink
    '#7a0177', // Very dark pink/purple
  ],
  theme = 'light',
  className = '',
  onElementClick,
  errorMessage,
  maxCellsBeforeOptimization = 1000,
  showLegend = true,
  colorAccessor,
}: ViewportOptimizedHeatMapProps) {
  // Keep track of the visible viewport
  const [visibleViewport, setVisibleViewport] = useState<{
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  } | null>(null);

  // Track whether initial data processing has finished
  const [dataProcessed, setDataProcessed] = useState(false);

  // Reference to the heatmap container for scroll tracking
  const containerRef = useRef<HTMLDivElement>(null);

  // Process data for rendering
  const { processedData, xValues, yValues, dataMinValue, dataMaxValue, xIndices, yIndices } =
    useMemo(() => {
      console.log('Processing heat map data');
      if (!data || data.length === 0) {
        return {
          processedData: [],
          xValues: [],
          yValues: [],
          dataMinValue: 0,
          dataMaxValue: 0,
          xIndices: new Map(),
          yIndices: new Map(),
        };
      }

      // Extract unique x and y coordinates
      const xCoords = new Set<number>();
      const yCoords = new Set<number>();

      // Keep track of min and max values
      let minVal = Infinity;
      let maxVal = -Infinity;

      // Map to hold data by coordinates
      const dataByCoords = new Map<string, number>();

      data.forEach(item => {
        let x: number | undefined;
        let y: number | undefined;

        // Get x and y coordinates from the data point
        if (typeof item[xKey] === 'number') {
          x = item[xKey] as number;
        } else if (xKey.includes('.')) {
          const parts = xKey.split('.');
          let current = item;
          for (const part of parts) {
            if (
              current &&
              typeof current === 'object' &&
              part in (current as Record<string, unknown>)
            ) {
              current = (current as Record<string, unknown>)[part] as Record<string, unknown>;
            } else {
              current = undefined;
              break;
            }
          }
          if (typeof current === 'number') {
            x = current;
          }
        }

        if (typeof item[yKey] === 'number') {
          y = item[yKey] as number;
        } else if (yKey.includes('.')) {
          const parts = yKey.split('.');
          let current = item;
          for (const part of parts) {
            if (
              current &&
              typeof current === 'object' &&
              part in (current as Record<string, unknown>)
            ) {
              current = (current as Record<string, unknown>)[part] as Record<string, unknown>;
            } else {
              current = undefined;
              break;
            }
          }
          if (typeof current === 'number') {
            y = current;
          }
        }

        // Get the value to visualize
        let value: number | undefined;
        if (typeof item[valueKey] === 'number') {
          value = item[valueKey] as number;
        } else if (valueKey.includes('.')) {
          const parts = valueKey.split('.');
          let current = item;
          for (const part of parts) {
            if (
              current &&
              typeof current === 'object' &&
              part in (current as Record<string, unknown>)
            ) {
              current = (current as Record<string, unknown>)[part] as Record<string, unknown>;
            } else {
              current = undefined;
              break;
            }
          }
          if (typeof current === 'number') {
            value = current;
          }
        }

        if (x !== undefined && y !== undefined && value !== undefined) {
          xCoords.add(x);
          yCoords.add(y);
          const key = `${x},${y}`;
          dataByCoords.set(key, value);

          // Update min and max values
          minVal = Math.min(minVal, value);
          maxVal = Math.max(maxVal, value);
        }
      });

      // Sort coordinates
      const sortedXCoords = Array.from(xCoords).sort((a, b) => a - b);
      const sortedYCoords = Array.from(yCoords).sort((a, b) => a - b);

      // Create indices for fast lookup
      const xIndexMap = new Map<number, number>();
      const yIndexMap = new Map<number, number>();

      sortedXCoords.forEach((x, idx) => xIndexMap.set(x, idx));
      sortedYCoords.forEach((y, idx) => yIndexMap.set(y, idx));

      // Create a 2D grid from the data
      const rows: HeatMapCell[] = [];

      sortedYCoords.forEach((y, yIndex) => {
        sortedXCoords.forEach((x, xIndex) => {
          const key = `${x},${y}`;
          const value = dataByCoords.get(key) || 0;

          rows.push({
            x: xIndex,
            y: yIndex,
            xIndex,
            yIndex,
            value,
            originalX: x,
            originalY: y,
          });
        });
      });

      return {
        processedData: rows,
        xValues: sortedXCoords,
        yValues: sortedYCoords,
        dataMinValue: minVal !== Infinity ? minVal : 0,
        dataMaxValue: maxVal !== -Infinity ? maxVal : 0,
        xIndices: xIndexMap,
        yIndices: yIndexMap,
      };
    }, [data, xKey, yKey, valueKey]);

  // Initialize viewport to show the full grid
  useEffect(() => {
    if (!visibleViewport && xValues.length > 0 && yValues.length > 0) {
      setVisibleViewport({
        xMin: 0,
        xMax: xValues.length - 1,
        yMin: 0,
        yMax: yValues.length - 1,
      });
      setDataProcessed(true);
    }
  }, [xValues, yValues, visibleViewport]);

  // Calculate effective min and max values
  const effectiveMinValue = minValue !== undefined ? minValue : dataMinValue;
  const effectiveMaxValue = maxValue !== undefined ? maxValue : dataMaxValue;
  const valueRange = effectiveMaxValue - effectiveMinValue;

  // Calculate cell dimensions
  const cellWidth = cellSize;
  const cellHeight = cellSize;
  const gridWidth = xValues.length * cellWidth;
  const gridHeight = yValues.length * cellHeight;

  // Track scroll position for viewport calculation
  const handleScroll = useCallback(() => {
    if (!containerRef.current || !dataProcessed) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const visibleLeft = Math.max(0, -container.scrollLeft / cellWidth);
    const visibleTop = Math.max(0, -container.scrollTop / cellHeight);
    const visibleRight = Math.min(
      xValues.length - 1,
      (-container.scrollLeft + rect.width) / cellWidth
    );
    const visibleBottom = Math.min(
      yValues.length - 1,
      (-container.scrollTop + rect.height) / cellHeight
    );

    // Add padding to prevent popping at edges
    const padding = 2; // Cells of padding
    setVisibleViewport({
      xMin: Math.max(0, Math.floor(visibleLeft) - padding),
      xMax: Math.min(xValues.length - 1, Math.ceil(visibleRight) + padding),
      yMin: Math.max(0, Math.floor(visibleTop) - padding),
      yMax: Math.min(yValues.length - 1, Math.ceil(visibleBottom) + padding),
    });
  }, [cellWidth, cellHeight, xValues.length, yValues.length, dataProcessed]);

  // Create a debounced version of the scroll handler
  const debouncedHandleScroll = useMemo(() => debounce(handleScroll, 50), [handleScroll]);

  // Attach scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', debouncedHandleScroll);

    // Call once to initialize
    handleScroll();

    return () => {
      container.removeEventListener('scroll', debouncedHandleScroll);
      debouncedHandleScroll.cancel();
    };
  }, [debouncedHandleScroll, handleScroll]);

  // Filter data to only include cells in the current viewport
  const visibleCells = useMemo(() => {
    if (!visibleViewport || !dataProcessed || processedData.length <= maxCellsBeforeOptimization) {
      return processedData; // Show all cells if it's a small grid or viewport not yet set
    }

    return processedData.filter(
      cell =>
        cell.xIndex >= visibleViewport.xMin &&
        cell.xIndex <= visibleViewport.xMax &&
        cell.yIndex >= visibleViewport.yMin &&
        cell.yIndex <= visibleViewport.yMax
    );
  }, [processedData, visibleViewport, dataProcessed, maxCellsBeforeOptimization]);

  // Function to get color for a value
  const getColorForValue = useCallback(
    (value: number) => {
      if (colorAccessor && data && processedData) {
        // Find the original data point for this cell
        const cell = processedData.find(c => c.value === value);
        if (cell) {
          // Find the original data item
          const originalItem = data.find(
            item =>
              (item[xKey] === cell.originalX ||
                (typeof item[xKey] === 'object' && (item[xKey] as any).x === cell.originalX)) &&
              (item[yKey] === cell.originalY ||
                (typeof item[yKey] === 'object' && (item[yKey] as any).y === cell.originalY))
          );
          if (originalItem && colorAccessor) {
            return colorAccessor(originalItem);
          }
        }
      }

      // Use gradient if no colorAccessor or original item not found
      if (valueRange === 0) return colors[Math.floor(colors.length / 2)];
      const normalizedValue = Math.max(0, Math.min(1, (value - effectiveMinValue) / valueRange));
      const colorIndex = Math.min(colors.length - 1, Math.floor(normalizedValue * colors.length));
      return colors[colorIndex];
    },
    [colorAccessor, data, processedData, xKey, yKey, valueRange, colors, effectiveMinValue]
  );

  // Handle click on a cell
  const handleCellClick = useCallback(
    (cell: HeatMapCell) => {
      if (onElementClick) {
        const originalItem = data.find(
          item =>
            (item[xKey] === cell.originalX ||
              (typeof item[xKey] === 'object' && (item[xKey] as any).x === cell.originalX)) &&
            (item[yKey] === cell.originalY ||
              (typeof item[yKey] === 'object' && (item[yKey] as any).y === cell.originalY))
        );

        if (originalItem) {
          onElementClick(originalItem, cell.xIndex * yValues.length + cell.yIndex);
        } else {
          onElementClick(
            cell as unknown as Record<string, unknown>,
            cell.xIndex * yValues.length + cell.yIndex
          );
        }
      }
    },
    [onElementClick, data, xKey, yKey, yValues.length]
  );

  // Track rendering stats
  const totalCells = processedData.length;
  const renderedCells = visibleCells.length;
  const isOptimized = totalCells > maxCellsBeforeOptimization;

  // Optimization metrics for subtitle
  const optimizationMetrics = useMemo(() => {
    if (!isOptimized || !dataProcessed) return null;

    return `Rendering ${renderedCells.toLocaleString()} of ${totalCells.toLocaleString()} cells (${Math.round(
      (renderedCells / totalCells) * 100
    )}%)`;
  }, [renderedCells, totalCells, isOptimized, dataProcessed]);

  // Dynamic subtitle based on optimization status
  const displaySubtitle = optimizationMetrics
    ? subtitle
      ? `${subtitle} - ${optimizationMetrics}`
      : optimizationMetrics
    : subtitle;

  if (data.length === 0) {
    return (
      <BaseChart
        width={width}
        height={height}
        title={title}
        subtitle={subtitle}
        theme={theme}
        className={`heatmap-chart ${className}`}
        errorMessage={errorMessage || 'No data available'}
      >
        <div className="heat-map-no-data">No data available</div>
      </BaseChart>
    );
  }

  return (
    <BaseChart
      width={width}
      height={height}
      title={title}
      subtitle={displaySubtitle}
      theme={theme}
      className={`heatmap-chart ${className}`}
      errorMessage={errorMessage}
    >
      <div
        className="heat-map-container"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'auto',
        }}
        ref={containerRef}
      >
        <div
          style={{
            position: 'relative',
            width: gridWidth,
            height: gridHeight,
          }}
        >
          {/* Render heat map cells */}
          {visibleCells.map(cell => {
            const cellColor = getColorForValue(cell.value);
            return (
              <div
                key={`${cell.x}-${cell.y}`}
                className="heat-map-cell"
                style={{
                  position: 'absolute',
                  left: cell.x * cellWidth,
                  top: cell.y * cellHeight,
                  width: cellWidth,
                  height: cellHeight,
                  backgroundColor: cellColor,
                  border: `${cellBorder.width}px solid ${cellBorder.color}`,
                  borderRadius: cellBorder.radius,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: onElementClick ? 'pointer' : 'default',
                }}
                onClick={() => handleCellClick(cell)}
                data-testid={`cell-${cell.x}-${cell.y}`}
              >
                {showValues && (
                  <span
                    style={{
                      color: theme === 'light' ? '#000000' : '#ffffff',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textShadow:
                        theme === 'light' ? '0 0 2px #ffffff' : '0 0 2px #000000, 0 0 3px #000000',
                    }}
                  >
                    {valueFormatter(cell.value)}
                  </span>
                )}
              </div>
            );
          })}

          {/* X-axis labels */}
          {xLabels &&
            xLabels.map((label, index) => (
              <div
                key={`x-label-${index}`}
                style={{
                  position: 'absolute',
                  left: index * cellWidth + cellWidth / 2,
                  top: gridHeight + 5,
                  transform: 'translateX(-50%)',
                  fontSize: '12px',
                }}
              >
                {label}
              </div>
            ))}

          {/* Y-axis labels */}
          {yLabels &&
            yLabels.map((label, index) => (
              <div
                key={`y-label-${index}`}
                style={{
                  position: 'absolute',
                  top: index * cellHeight + cellHeight / 2,
                  left: -5,
                  transform: 'translateX(-100%) translateY(-50%)',
                  fontSize: '12px',
                  textAlign: 'right',
                }}
              >
                {label}
              </div>
            ))}

          {/* Legend */}
          {showLegend && (
            <div
              className="heat-map-legend"
              style={{
                position: 'absolute',
                bottom: -40,
                left: 0,
                right: 0,
                height: 20,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: '80%',
                  height: '10px',
                  background: `linear-gradient(to right, ${colors.join(', ')})`,
                  borderRadius: '2px',
                  marginRight: '10px',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '80%' }}>
                <span style={{ fontSize: '10px' }}>{effectiveMinValue.toFixed(valueDecimals)}</span>
                <span style={{ fontSize: '10px' }}>{effectiveMaxValue.toFixed(valueDecimals)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </BaseChart>
  );
});

export default ViewportOptimizedHeatMap;
