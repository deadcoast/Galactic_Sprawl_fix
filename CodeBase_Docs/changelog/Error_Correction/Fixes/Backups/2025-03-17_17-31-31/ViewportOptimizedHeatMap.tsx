import { debounce } from 'lodash';
import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChartDataRecord } from '../../../../types/exploration/AnalysisComponentTypes';
import { BaseChart } from './BaseChart';

// Cell data structure for the heat map
export interface HeatMapCell {
  x: number;
  y: number;
  xIndex: number;
  yIndex: number;
  value: number;
  originalX: string | number;
  originalY: string | number;
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
    width: number;
    color: string;
    radius: number;
  };

  /** Array of colors for the gradient */
  colors?: string[];

  /** Theme for the chart (light or dark) */
  theme?: 'light' | 'dark';

  /** Additional CSS class name */
  className?: string;

  /** Custom click handler for cells */
  onElementClick?: (data: ChartDataRecord, index: number) => void;

  /** Error message to display if chart fails to render */
  errorMessage?: string;

  /** Maximum number of cells to render before applying optimizations */
  maxCellsBeforeOptimization?: number;

  /** Whether to show a legend */
  showLegend?: boolean;

  /** Custom function to determine cell color */
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
  // Refs for container and canvas
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State for viewport and rendering
  const [visibleViewport, setVisibleViewport] = useState({
    xMin: 0,
    xMax: 0,
    yMin: 0,
    yMax: 0,
  });

  // Calculate cell dimensions
  const cellWidth = cellSize;
  const cellHeight = cellSize;

  // Extract unique X and Y values from data
  const { xValues, yValues, valueRange, effectiveMinValue, effectiveMaxValue } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        xValues: [],
        yValues: [],
        valueRange: 0,
        effectiveMinValue: 0,
        effectiveMaxValue: 0,
      };
    }

    // Extract unique X and Y values
    const xSet = new Set<number | string>();
    const ySet = new Set<number | string>();
    let minVal = typeof minValue === 'number' ? minValue : Number.MAX_VALUE;
    let maxVal = typeof maxValue === 'number' ? maxValue : Number.MIN_VALUE;

    data.forEach(item => {
      const x = item[xKey];
      const y = item[yKey];
      const value = Number(item[valueKey]);

      if (x !== undefined && (typeof x === 'string' || typeof x === 'number')) xSet.add(x);
      if (y !== undefined && (typeof y === 'string' || typeof y === 'number')) ySet.add(y);

      if (!isNaN(value)) {
        if (typeof minValue !== 'number' && value < minVal) minVal = value;
        if (typeof maxValue !== 'number' && value > maxVal) maxVal = value;
      }
    });

    const xValueArray = Array.from(xSet).sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      return String(a).localeCompare(String(b));
    });

    const yValueArray = Array.from(ySet).sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      return String(a).localeCompare(String(b));
    });

    return {
      xValues: xValueArray,
      yValues: yValueArray,
      valueRange: maxVal - minVal,
      effectiveMinValue: minVal,
      effectiveMaxValue: maxVal,
    };
  }, [data, xKey, yKey, valueKey, minValue, maxValue]);

  // Process data into a grid format
  const processedData = useMemo(() => {
    if (!data || data.length === 0 || xValues.length === 0 || yValues.length === 0) {
      return [];
    }

    const result: HeatMapCell[] = [];

    // Create a map for faster lookups
    const dataMap = new Map<string, ChartDataRecord>();
    data.forEach(item => {
      const x = item[xKey];
      const y = item[yKey];
      if (
        x !== undefined &&
        y !== undefined &&
        (typeof x === 'string' || typeof x === 'number') &&
        (typeof y === 'string' || typeof y === 'number')
      ) {
        dataMap.set(`${x}-${y}`, item);
      }
    });

    // Create grid cells
    xValues.forEach((x, xIndex) => {
      yValues.forEach((y, yIndex) => {
        const key = `${x}-${y}`;
        const item = dataMap.get(key);

        if (item) {
          const value = Number(item[valueKey]);
          result.push({
            x: xIndex,
            y: yIndex,
            xIndex,
            yIndex,
            value: isNaN(value) ? 0 : value,
            originalX: x,
            originalY: y,
          });
        }
      });
    });

    return result;
  }, [data, xValues, yValues, xKey, yKey, valueKey]);

  // Flag to track if data processing is complete
  const dataProcessed = processedData.length > 0;

  // Calculate visible cells based on viewport
  const visibleCells = useMemo(() => {
    if (!processedData || !visibleViewport) return [];

    // If we have fewer cells than the optimization threshold, return all cells
    if (processedData.length <= maxCellsBeforeOptimization) {
      return processedData;
    }

    // Otherwise, return only cells in the visible viewport
    return processedData.filter(
      cell =>
        cell.xIndex >= visibleViewport.xMin &&
        cell.xIndex <= visibleViewport.xMax &&
        cell.yIndex >= visibleViewport.yMin &&
        cell.yIndex <= visibleViewport.yMax
    );
  }, [processedData, visibleViewport, maxCellsBeforeOptimization]);

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
                (typeof item[xKey] === 'object' &&
                  (item[xKey] as Record<string, unknown>).x === cell.originalX)) &&
              (item[yKey] === cell.originalY ||
                (typeof item[yKey] === 'object' &&
                  (item[yKey] as Record<string, unknown>).y === cell.originalY))
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

  // Track scroll position for viewport calculation
  const handleScroll = useCallback(() => {
    if (!containerRef.current || !dataProcessed) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    // Calculate visible area based on scroll position
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    const visibleLeft = Math.max(0, Math.floor(scrollLeft / cellWidth));
    const visibleTop = Math.max(0, Math.floor(scrollTop / cellHeight));
    const visibleRight = Math.min(
      xValues.length - 1,
      Math.ceil((scrollLeft + rect.width) / cellWidth)
    );
    const visibleBottom = Math.min(
      yValues.length - 1,
      Math.ceil((scrollTop + rect.height) / cellHeight)
    );

    // Add padding to prevent popping at edges
    const padding = 2; // Cells of padding
    setVisibleViewport({
      xMin: Math.max(0, visibleLeft - padding),
      xMax: Math.min(xValues.length - 1, visibleRight + padding),
      yMin: Math.max(0, visibleTop - padding),
      yMax: Math.min(yValues.length - 1, visibleBottom + padding),
    });
  }, [cellWidth, cellHeight, xValues.length, yValues.length, dataProcessed]);

  // Create a debounced version of the scroll handler
  const debouncedHandleScroll = useMemo(() => debounce(handleScroll, 50), [handleScroll]);

  // Handle click on a cell
  const handleCellClick = useCallback(
    (cell: HeatMapCell) => {
      if (onElementClick) {
        const originalItem = data.find(
          item =>
            (item[xKey] === cell.originalX ||
              (typeof item[xKey] === 'object' &&
                (item[xKey] as Record<string, unknown>).x === cell.originalX)) &&
            (item[yKey] === cell.originalY ||
              (typeof item[yKey] === 'object' &&
                (item[yKey] as Record<string, unknown>).y === cell.originalY))
        );

        if (originalItem) {
          onElementClick(originalItem, cell.xIndex * yValues.length + cell.yIndex);
        } else {
          // Create a ChartDataRecord from the cell data
          const cellDataRecord: ChartDataRecord = {
            [xKey]: cell.originalX,
            [yKey]: cell.originalY,
            [valueKey]: cell.value,
          };
          onElementClick(cellDataRecord, cell.xIndex * yValues.length + cell.yIndex);
        }
      }
    },
    [onElementClick, data, xKey, yKey, yValues.length, valueKey]
  );

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

  // Initialize viewport when data is loaded
  useEffect(() => {
    if (xValues.length > 0 && yValues.length > 0) {
      setVisibleViewport({
        xMin: 0,
        xMax: Math.min(20, xValues.length - 1), // Start with a reasonable initial view
        yMin: 0,
        yMax: Math.min(20, yValues.length - 1),
      });
    }
  }, [xValues, yValues]);

  // Use canvas for rendering large datasets
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dataProcessed || processedData.length <= maxCellsBeforeOptimization) {
      return; // Only use canvas for large datasets
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw only visible cells
    visibleCells.forEach(cell => {
      const x = cell.x * cellWidth;
      const y = cell.y * cellHeight;

      // Set cell background color
      ctx.fillStyle = getColorForValue(cell.value);
      ctx.fillRect(x, y, cellWidth, cellHeight);

      // Draw cell border
      if (cellBorder.width > 0) {
        ctx.strokeStyle = cellBorder.color;
        ctx.lineWidth = cellBorder.width;
        ctx.strokeRect(x, y, cellWidth, cellHeight);
      }

      // Draw cell value if needed
      if (showValues) {
        ctx.fillStyle = theme === 'light' ? '#000000' : '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const formattedValue = valueFormatter(cell.value);
        ctx.fillText(formattedValue, x + cellWidth / 2, y + cellHeight / 2);
      }
    });
  }, [
    visibleCells,
    cellWidth,
    cellHeight,
    cellBorder,
    showValues,
    valueFormatter,
    getColorForValue,
    theme,
    dataProcessed,
    processedData.length,
    maxCellsBeforeOptimization,
  ]);

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

  // Calculate grid dimensions
  const gridWidth = xValues.length * cellSize;
  const gridHeight = yValues.length * cellSize;

  if (!data || data.length === 0) {
    return (
      <BaseChart
        width={width}
        height={height}
        title={title}
        subtitle={subtitle}
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
      className={`viewport-optimized-heatmap ${className}`}
    >
      <div
        className="heatmap-container"
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'auto',
        }}
      >
        {processedData.length > maxCellsBeforeOptimization ? (
          // Use canvas for large datasets
          <canvas
            ref={canvasRef}
            width={gridWidth}
            height={gridHeight}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
            }}
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.floor((e.clientX - rect.left) / cellWidth);
              const y = Math.floor((e.clientY - rect.top) / cellHeight);

              const cell = processedData.find(c => c.x === x && c.y === y);
              if (cell) {
                handleCellClick(cell);
              }
            }}
          />
        ) : (
          // Use DOM elements for smaller datasets
          <div
            className="heatmap-grid"
            style={{
              position: 'relative',
              width: gridWidth,
              height: gridHeight,
            }}
          >
            {visibleCells.map(cell => (
              <div
                key={`${cell.x}-${cell.y}`}
                className="heatmap-cell"
                style={{
                  position: 'absolute',
                  left: `${cell.x * cellSize}px`,
                  top: `${cell.y * cellSize}px`,
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  backgroundColor: getColorForValue(cell.value),
                  borderWidth: `${cellBorder.width}px`,
                  borderColor: cellBorder.color,
                  borderRadius: `${cellBorder.radius}px`,
                  borderStyle: 'solid',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => handleCellClick(cell)}
              >
                {showValues && (
                  <span
                    className="cell-value"
                    style={{
                      color: theme === 'light' ? '#000000' : '#ffffff',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textShadow: theme === 'light' ? '0 0 2px #ffffff' : '0 0 2px #000000',
                    }}
                  >
                    {valueFormatter
                      ? valueFormatter(cell.value)
                      : cell.value.toFixed(valueDecimals)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* X-axis labels */}
        {xLabels && (
          <div
            className="x-axis-labels"
            style={{
              position: 'absolute',
              bottom: -25,
              left: 0,
              width: gridWidth,
              display: 'flex',
            }}
          >
            {xValues.map((value, index) => (
              <div
                key={`x-${index}`}
                className="axis-label x-label"
                style={{
                  width: `${cellSize}px`,
                  textAlign: 'center',
                  fontSize: '12px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {xLabels[index] || String(value)}
              </div>
            ))}
          </div>
        )}

        {/* Y-axis labels */}
        {yLabels && (
          <div
            className="y-axis-labels"
            style={{
              position: 'absolute',
              top: 0,
              left: -60,
              height: gridHeight,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {yValues.map((value, index) => (
              <div
                key={`y-${index}`}
                className="axis-label y-label"
                style={{
                  height: `${cellSize}px`,
                  lineHeight: `${cellSize}px`,
                  fontSize: '12px',
                  textAlign: 'right',
                  width: '50px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {yLabels[index] || String(value)}
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        {showLegend && (
          <div
            className="heatmap-legend"
            style={{
              position: 'absolute',
              bottom: -50,
              left: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              className="legend-gradient"
              style={{
                display: 'flex',
                width: '80%',
                height: '10px',
              }}
            >
              {colors.map((color, index) => (
                <div
                  key={`legend-${index}`}
                  className="legend-color"
                  style={{
                    backgroundColor: color,
                    flex: 1,
                    height: '100%',
                  }}
                />
              ))}
            </div>
            <div
              className="legend-labels"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '80%',
                marginTop: '5px',
              }}
            >
              <span style={{ fontSize: '10px' }}>{effectiveMinValue.toFixed(valueDecimals)}</span>
              <span style={{ fontSize: '10px' }}>{effectiveMaxValue.toFixed(valueDecimals)}</span>
            </div>
          </div>
        )}
      </div>
    </BaseChart>
  );
});

export default ViewportOptimizedHeatMap;
