import * as React from 'react';
import { useCallback, useMemo } from 'react';
import {
  BaseVisualizationProps,
  ChartDataRecord,
} from '../../../../types/exploration/AnalysisComponentTypes';
import { BaseChart, ChartTooltipProps } from './BaseChart';

// Cell data structure for the heat map
export interface HeatMapCell extends ChartDataRecord {
  x: number;
  y: number;
  xIndex: number;
  yIndex: number;
  value: number;
  originalX: number;
  originalY: number;
}

export interface HeatMapProps extends BaseVisualizationProps {
  /** Key for the value to visualize */
  valueKey: string;

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

  /** Custom tooltip for cells */
  cellTooltip?: boolean;

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
}

/**
 * HeatMap component for visualizing density or intensity data across a grid
 */
export const HeatMap = React.memo(function HeatMap({
  data,
  valueKey,
  xKey = 'x',
  yKey = 'y',
  width = '100%',
  height = 400,
  title,
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
  cellSize = 40,
  xLabels,
  yLabels,
  showValues = true,
  valueFormatter = (value: number) => value.toFixed(1),
  cellTooltip = true,
  customTooltip,
  valueDecimals = 1,
  minValue,
  maxValue,
  showLegend = true,
  cellBorder = {
    width: 1,
    color: 'rgba(255,255,255,0.2)',
    radius: 0,
  },
  colorAccessor,
  theme = 'light',
  className = '',
  onElementClick,
  errorMessage,
  grid = { show: false },
  animate = true,
}: HeatMapProps) {
  // Process data into a 2D grid format for the heatmap
  const { processedData, xValues, yValues, dataMinValue, dataMaxValue } = useMemo(() => {
    console.warn('Processing heat map data'); // For debugging
    if (!data || data.length === 0) {
      return {
        processedData: [],
        xValues: [],
        yValues: [],
        dataMinValue: 0,
        dataMaxValue: 0,
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
        let current: unknown = item;
        for (const part of parts) {
          if (
            current &&
            typeof current === 'object' &&
            part in (current as Record<string, unknown>)
          ) {
            current = (current as Record<string, unknown>)[part];
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
        let current: unknown = item;
        for (const part of parts) {
          if (
            current &&
            typeof current === 'object' &&
            part in (current as Record<string, unknown>)
          ) {
            current = (current as Record<string, unknown>)[part];
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
        let current: unknown = item;
        for (const part of parts) {
          if (
            current &&
            typeof current === 'object' &&
            part in (current as Record<string, unknown>)
          ) {
            current = (current as Record<string, unknown>)[part];
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
    };
  }, [data, xKey, yKey, valueKey]);

  // Calculate effective min and max values
  const effectiveMinValue = useMemo(
    () => (minValue !== undefined ? minValue : dataMinValue),
    [minValue, dataMinValue]
  );

  const effectiveMaxValue = useMemo(
    () => (maxValue !== undefined ? maxValue : dataMaxValue),
    [maxValue, dataMaxValue]
  );

  const valueRange = useMemo(
    () => effectiveMaxValue - effectiveMinValue,
    [effectiveMaxValue, effectiveMinValue]
  );

  // Calculate cell dimensions
  const cellWidth = cellSize;
  const cellHeight = cellSize;

  const gridDimensions = useMemo(
    () => ({
      width: xValues.length * cellWidth,
      height: yValues.length * cellHeight,
    }),
    [xValues.length, yValues.length, cellWidth, cellHeight]
  );

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
          if (originalItem) {
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
              (typeof item[xKey] === 'object' &&
                (item[xKey] as Record<string, unknown>).x === cell.originalX)) &&
            (item[yKey] === cell.originalY ||
              (typeof item[yKey] === 'object' &&
                (item[yKey] as Record<string, unknown>).y === cell.originalY))
        );

        if (originalItem) {
          onElementClick(originalItem);
        } else {
          onElementClick(cell as unknown as ChartDataRecord);
        }
      }
    },
    [onElementClick, data, xKey, yKey]
  );

  // Memoize the rendered cells to prevent unnecessary re-renders
  const renderedCells = useMemo(
    () =>
      processedData.map(cell => {
        const cellColor = getColorForValue(cell.value);
        return (
          <div
            key={`${cell.x}-${cell.y}`}
            className={`heat-map-cell ${animate ? 'transition-colors duration-300' : ''} ${
              grid?.show ? 'grid-cell' : ''
            }`}
            style={{
              position: 'absolute',
              left: cell.x * cellWidth,
              top: cell.y * cellHeight,
              width: cellWidth,
              height: cellHeight,
              backgroundColor: cellColor,
              border: `${cellBorder.width}px solid ${cellBorder.color}`,
              borderRadius: cellBorder.radius,
              cursor: onElementClick ? 'pointer' : 'default',
            }}
            onClick={() => handleCellClick(cell)}
            data-tooltip-id="heat-map-tooltip"
            data-tooltip-content={
              cellTooltip
                ? `${xLabels?.[cell.xIndex] || cell.originalX}, ${
                    yLabels?.[cell.yIndex] || cell.originalY
                  }: ${valueFormatter(cell.value)}`
                : undefined
            }
          >
            {showValues && (
              <span
                className={`absolute inset-0 flex items-center justify-center text-xs ${
                  theme === 'dark' ? 'text-white' : 'text-black'
                }`}
              >
                {valueFormatter(cell.value)}
              </span>
            )}
          </div>
        );
      }),
    [
      processedData,
      getColorForValue,
      cellWidth,
      cellHeight,
      cellBorder,
      handleCellClick,
      cellTooltip,
      xLabels,
      yLabels,
      valueFormatter,
      showValues,
      theme,
      animate,
      grid?.show,
    ]
  );

  // Memoize the x-axis labels
  const renderedXLabels = useMemo(
    () =>
      xLabels?.map((label, index) => (
        <div
          key={`x-label-${index}`}
          style={{
            position: 'absolute',
            left: index * cellWidth + cellWidth / 2,
            top: gridDimensions.height + 5,
            transform: 'translateX(-50%)',
            fontSize: '12px',
          }}
        >
          {label}
        </div>
      )),
    [xLabels, cellWidth, gridDimensions.height]
  );

  // Memoize the y-axis labels
  const renderedYLabels = useMemo(
    () =>
      yLabels?.map((label, index) => (
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
      )),
    [yLabels, cellHeight]
  );

  // Memoize the legend component
  const legend = useMemo(
    () =>
      showLegend ? (
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
      ) : null,
    [showLegend, colors, effectiveMinValue, effectiveMaxValue, valueDecimals]
  );

  return (
    <BaseChart
      title={title}
      width={width}
      height={height}
      className={`heatmap-chart ${className}`}
      customTooltip={customTooltip as React.FC<ChartTooltipProps>}
      errorMessage={errorMessage}
    >
      {data.length === 0 ? (
        <div className="heat-map-no-data">No data available</div>
      ) : (
        <div
          className="heat-map-container"
          style={{
            position: 'relative',
            width: gridDimensions.width,
            height: gridDimensions.height,
            margin: 'auto',
          }}
        >
          {/* Render heat map cells */}
          {renderedCells}

          {/* X-axis labels */}
          {renderedXLabels}

          {/* Y-axis labels */}
          {renderedYLabels}

          {/* Legend */}
          {legend}
        </div>
      )}
    </BaseChart>
  );
});

export default HeatMap;
