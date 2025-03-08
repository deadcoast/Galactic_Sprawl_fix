import { useMemo } from 'react';
import { DataPoint } from '../../../../types/exploration/DataAnalysisTypes';

interface HeatMapProps {
  data: DataPoint[] | Record<string, unknown>[];
  valueKey: string;
  xKey?: string;
  yKey?: string;
  width?: number | string;
  height?: number | string;
  title?: string;
  colors?: string[];
  cellSize?: number;
  xLabels?: string[];
  yLabels?: string[];
}

/**
 * HeatMap component for visualizing density or intensity data
 */
export function HeatMap({
  data,
  valueKey,
  xKey = 'coordinates.x',
  yKey = 'coordinates.y',
  width = '100%',
  height = 400,
  title,
  colors = [
    '#0a2f5c',
    '#0e4c92',
    '#3373c4',
    '#5a9bd4',
    '#7fc8f8',
    '#a3d8f4',
    '#c6e7f5',
    '#e1f3fb',
    '#feebe2',
    '#fcc5c0',
    '#fa9fb5',
    '#f768a1',
    '#dd3497',
    '#ae017e',
    '#7a0177',
  ],
  cellSize = 30,
  xLabels,
  yLabels,
}: HeatMapProps) {
  // Process data into a 2D grid format for the heatmap
  const { processedData, xValues, yValues, minValue, maxValue } = useMemo(() => {
    if (!data || data.length === 0) {
      return { processedData: [], xValues: [], yValues: [], minValue: 0, maxValue: 0 };
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
      let value: number | undefined;

      // Handle DataPoint objects
      if ('properties' in item && 'metadata' in item) {
        const dataPoint = item as DataPoint;

        // Parse nested keys (e.g., 'coordinates.x')
        if (xKey.includes('.')) {
          const [objKey, propKey] = xKey.split('.');
          if (objKey === 'coordinates' && dataPoint.coordinates) {
            x = dataPoint.coordinates[propKey as keyof typeof dataPoint.coordinates] as number;
          } else if (objKey === 'properties') {
            x = dataPoint.properties[propKey] as number;
          } else if (objKey === 'metadata' && dataPoint.metadata) {
            x = dataPoint.metadata[propKey] as number;
          }
        } else {
          x =
            (dataPoint.properties[xKey] as number) ||
            (dataPoint.metadata && (dataPoint.metadata[xKey] as number));
        }

        if (yKey.includes('.')) {
          const [objKey, propKey] = yKey.split('.');
          if (objKey === 'coordinates' && dataPoint.coordinates) {
            y = dataPoint.coordinates[propKey as keyof typeof dataPoint.coordinates] as number;
          } else if (objKey === 'properties') {
            y = dataPoint.properties[propKey] as number;
          } else if (objKey === 'metadata' && dataPoint.metadata) {
            y = dataPoint.metadata[propKey] as number;
          }
        } else {
          y =
            (dataPoint.properties[yKey] as number) ||
            (dataPoint.metadata && (dataPoint.metadata[yKey] as number));
        }

        value =
          (dataPoint.properties[valueKey] as number) ||
          (dataPoint.metadata && (dataPoint.metadata[valueKey] as number));
      }
      // Handle regular objects
      else {
        const record = item as Record<string, unknown>;

        // Parse nested keys (e.g., 'coordinates.x')
        if (xKey.includes('.')) {
          const [objKey, propKey] = xKey.split('.');
          const obj = record[objKey] as Record<string, unknown> | undefined;
          x = obj ? (obj[propKey] as number) : undefined;
        } else {
          x = record[xKey] as number;
        }

        if (yKey.includes('.')) {
          const [objKey, propKey] = yKey.split('.');
          const obj = record[objKey] as Record<string, unknown> | undefined;
          y = obj ? (obj[propKey] as number) : undefined;
        } else {
          y = record[yKey] as number;
        }

        value = record[valueKey] as number;
      }

      // Ensure values are numbers
      x = typeof x === 'number' ? x : x ? parseFloat(String(x)) : undefined;
      y = typeof y === 'number' ? y : y ? parseFloat(String(y)) : undefined;
      value = typeof value === 'number' ? value : value ? parseFloat(String(value)) : 0;

      if (x !== undefined && y !== undefined && value !== undefined) {
        // Round to integers for grid positions if needed
        const gridX = Math.round(x);
        const gridY = Math.round(y);

        xCoords.add(gridX);
        yCoords.add(gridY);

        // Update min and max values
        minVal = Math.min(minVal, value);
        maxVal = Math.max(maxVal, value);

        // Store in map
        dataByCoords.set(`${gridX},${gridY}`, value);
      }
    });

    // Convert to sorted arrays
    const xValueArray = [...xCoords].sort((a, b) => a - b);
    const yValueArray = [...yCoords].sort((a, b) => a - b);

    // Create grid
    const grid = [];

    for (let y = 0; y < yValueArray.length; y++) {
      for (let x = 0; x < xValueArray.length; x++) {
        const xVal = xValueArray[x];
        const yVal = yValueArray[y];
        const value = dataByCoords.get(`${xVal},${yVal}`) || 0;

        grid.push({
          x: xVal,
          y: yVal,
          xIndex: x,
          yIndex: y,
          value,
        });
      }
    }

    return {
      processedData: grid,
      xValues: xValueArray,
      yValues: yValueArray,
      minValue: minVal !== Infinity ? minVal : 0,
      maxValue: maxVal !== -Infinity ? maxVal : 0,
    };
  }, [data, xKey, yKey, valueKey]);

  // Get color for cell based on value
  const getColorForValue = (value: number) => {
    if (minValue === maxValue) return colors[Math.floor(colors.length / 2)];

    const normalizedValue = (value - minValue) / (maxValue - minValue);
    const colorIndex = Math.min(
      colors.length - 1,
      Math.max(0, Math.floor(normalizedValue * colors.length))
    );

    return colors[colorIndex];
  };

  if (!data || data.length === 0 || processedData.length === 0) {
    return <div className="chart-empty">No data available or insufficient data for heatmap</div>;
  }

  // Calculate dimensions
  const containerStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    position: 'relative' as const,
    overflow: 'auto' as const,
  };

  // Calculate grid dimensions based on data
  const gridWidth = xValues.length * cellSize;
  const gridHeight = yValues.length * cellSize;

  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <div style={containerStyle} className="heatmap-container">
        <div
          style={{
            width: `${gridWidth}px`,
            height: `${gridHeight}px`,
            position: 'relative',
            margin: '30px', // Space for labels
          }}
        >
          {/* Render cells */}
          {processedData.map((cell, index) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: `${cell.xIndex * cellSize}px`,
                top: `${cell.yIndex * cellSize}px`,
                width: `${cellSize - 1}px`,
                height: `${cellSize - 1}px`,
                backgroundColor: getColorForValue(cell.value),
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '10px',
              }}
              title={`(${cell.x}, ${cell.y}): ${cell.value.toFixed(2)}`}
            >
              {cellSize > 25 && cell.value.toFixed(1)}
            </div>
          ))}

          {/* X-axis labels */}
          {(xLabels || xValues).map((label, index) => (
            <div
              key={`x-${index}`}
              style={{
                position: 'absolute',
                left: `${index * cellSize + cellSize / 2}px`,
                top: `${gridHeight + 5}px`,
                transform: 'translateX(-50%)',
                fontSize: '12px',
              }}
            >
              {xLabels ? label : xValues[index]}
            </div>
          ))}

          {/* Y-axis labels */}
          {(yLabels || yValues).map((label, index) => (
            <div
              key={`y-${index}`}
              style={{
                position: 'absolute',
                left: '-25px',
                top: `${index * cellSize + cellSize / 2}px`,
                transform: 'translateY(-50%)',
                fontSize: '12px',
              }}
            >
              {yLabels ? label : yValues[index]}
            </div>
          ))}

          {/* Color scale legend */}
          <div
            style={{
              position: 'absolute',
              right: '-60px',
              top: '0',
              width: '20px',
              height: '200px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {colors.map((color, index) => (
              <div
                key={`legend-${index}`}
                style={{
                  width: '20px',
                  height: `${200 / colors.length}px`,
                  backgroundColor: color,
                }}
                title={`${(minValue + (maxValue - minValue) * (index / colors.length)).toFixed(2)}`}
              />
            ))}
            <div style={{ fontSize: '10px', marginTop: '5px' }}>{maxValue.toFixed(1)}</div>
            <div style={{ fontSize: '10px', marginTop: `${180}px` }}>{minValue.toFixed(1)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
