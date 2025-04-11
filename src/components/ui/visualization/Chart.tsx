/**
 * @context: ui-system, component-library, visualization-system
 *
 * Base Chart component that provides common functionality for different chart types
 */
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

// Define base types for chart data
export interface DataPoint {
  label: string;
  value: number;
  color?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ChartData {
  datasets: {
    label: string;
    data: DataPoint[];
    color?: string;
  }[];
}

export interface ChartProps {
  /**
   * Chart data to display
   */
  data: ChartData;

  /**
   * Width of the chart
   * @default 300
   */
  width?: number;

  /**
   * Height of the chart
   * @default 200
   */
  height?: number;

  /**
   * Chart margins
   */
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  /**
   * Chart colors
   */
  colors?: string[];

  /**
   * Chart background color
   * @default 'transparent'
   */
  backgroundColor?: string;

  /**
   * Whether the chart is responsive
   * @default true
   */
  responsive?: boolean;

  /**
   * Value threshold to highlight
   */
  threshold?: number;

  /**
   * Handler for click events on data points
   */
  onClick?: (dataPoint: DataPoint) => void;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Custom chart title
   */
  title?: string;

  /**
   * Whether to show the legend
   * @default true
   */
  showLegend?: boolean;

  /**
   * Whether to show tooltips
   * @default true
   */
  showTooltips?: boolean;

  /**
   * Whether to show grid lines
   * @default true
   */
  showGrid?: boolean;

  /**
   * Custom chart type
   */
  type?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
}

/**
 * Base Chart component that provides common functionality for different chart types
 */
export function Chart({
  data,
  width = 300,
  height = 200,
  margin = { top: 20, right: 20, bottom: 30, left: 40 },
  colors = ['#4287f5', '#f44336', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4'],
  backgroundColor = 'transparent',
  responsive = true,
  threshold,
  onClick,
  className = '',
  title,
  showLegend = true,
  showTooltips = true,
  showGrid = true,
  type = 'bar',
}: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    content: '',
  });
  const [dimensions, setDimensions] = useState({ width, height });

  // Handle responsive sizing
  useEffect(() => {
    if (!responsive || !containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width: newWidth } = entry.contentRect;
        setDimensions({
          width: newWidth,
          height: height * (newWidth / width),
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [responsive, width, height]);

  // Draw the chart on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Set background
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    }

    // Define chart area
    const chartArea = {
      x: margin.left,
      y: margin.top,
      width: dimensions.width - margin.left - margin.right,
      height: dimensions.height - margin.top - margin.bottom,
    };

    // Calculate scales
    const maxValue = Math.max(
      ...data.datasets.flatMap(dataset => dataset.data.map(d => d.value)),
      threshold || 0
    );

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx, chartArea, maxValue);
    }

    // Draw datasets
    data.datasets.forEach((dataset, datasetIndex) => {
      const color = dataset.color || colors[datasetIndex % colors.length];

      // Draw based on chart type
      switch (type) {
        case 'line':
          drawLineChart(ctx, dataset.data, chartArea, maxValue, color);
          break;
        case 'bar':
          drawBarChart(
            ctx,
            dataset.data,
            chartArea,
            maxValue,
            color,
            datasetIndex,
            data.datasets.length
          );
          break;
        case 'pie':
          drawPieChart(ctx, dataset.data, chartArea, colors);
          break;
        case 'doughnut':
          drawDoughnutChart(ctx, dataset.data, chartArea, colors);
          break;
        case 'area':
          drawAreaChart(ctx, dataset.data, chartArea, maxValue, color);
          break;
      }
    });

    // Draw threshold line if provided
    if (threshold !== undefined) {
      drawThresholdLine(ctx, threshold, chartArea, maxValue);
    }

    // Draw legend if enabled
    if (showLegend) {
      drawLegend(ctx, data.datasets, colors, {
        x: chartArea.x,
        y: chartArea.y + chartArea.height + 10,
        width: chartArea.width,
      });
    }

    // Draw title if provided
    if (title) {
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#333333';
      ctx.fillText(title, dimensions.width / 2, 15);
    }
  }, [data, dimensions, margin, colors, backgroundColor, threshold, showLegend, showGrid, type]);

  // Handle mouse move for tooltips
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!showTooltips) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate chart area
    const chartArea = {
      x: margin.left,
      y: margin.top,
      width: dimensions.width - margin.left - margin.right,
      height: dimensions.height - margin.top - margin.bottom,
    };

    // Check if mouse is in chart area
    if (
      x >= chartArea.x &&
      x <= chartArea.x + chartArea.width &&
      y >= chartArea.y &&
      y <= chartArea.y + chartArea.height
    ) {
      // Find closest data point based on chart type
      let closestPoint: DataPoint | null = null;
      let content = '';

      // Implementation varies by chart type
      if (type === 'bar' || type === 'line') {
        // For simplicity, just show the first dataset that has a point close to cursor
        const dataset = data.datasets[0];
        const barWidth = chartArea.width / dataset.data.length;
        const barIndex = Math.floor((x - chartArea.x) / barWidth);

        if (barIndex >= 0 && barIndex < dataset.data.length) {
          closestPoint = dataset.data[barIndex];
          content = `${closestPoint.label}: ${closestPoint.value}`;
        }
      }

      if (closestPoint) {
        setTooltip({
          visible: true,
          x,
          y,
          content,
        });
      } else {
        setTooltip(prev => ({ ...prev, visible: false }));
      }
    } else {
      setTooltip(prev => ({ ...prev, visible: false }));
    }
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  // Handle click events
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onClick) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate chart area
    const chartArea = {
      x: margin.left,
      y: margin.top,
      width: dimensions.width - margin.left - margin.right,
      height: dimensions.height - margin.top - margin.bottom,
    };

    // Similar logic to handleMouseMove, but trigger onClick
    if (type === 'bar' || type === 'line') {
      const dataset = data.datasets[0];
      const barWidth = chartArea.width / dataset.data.length;
      const barIndex = Math.floor((x - chartArea.x) / barWidth);

      if (
        barIndex >= 0 &&
        barIndex < dataset.data.length &&
        x >= chartArea.x &&
        x <= chartArea.x + chartArea.width &&
        y >= chartArea.y &&
        y <= chartArea.y + chartArea.height
      ) {
        onClick(dataset.data[barIndex]);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`chart-container ${className}`}
      style={{ width: responsive ? '100%' : `${width}px` }}
      data-testid="chart"
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="chart-canvas"
      />

      {tooltip.visible && (
        <div
          className="chart-tooltip"
          style={{
            position: 'absolute',
            left: `${tooltip.x + 10}px`,
            top: `${tooltip.y - 10}px`,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '5px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 100,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}

// Helper functions for drawing different chart types
function drawGrid(
  ctx: CanvasRenderingContext2D,
  chartArea: { x: number; y: number; width: number; height: number },
  maxValue: number
) {
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 0.5;

  // Draw horizontal grid lines
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = chartArea.y + (chartArea.height / gridLines) * i;

    ctx.beginPath();
    ctx.moveTo(chartArea.x, y);
    ctx.lineTo(chartArea.x + chartArea.width, y);
    ctx.stroke();

    // Draw labels
    const value = maxValue - (maxValue / gridLines) * i;
    ctx.fillStyle = '#666666';
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(value.toFixed(0), chartArea.x - 5, y + 3);
  }
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  datasets: ChartData['datasets'],
  colors: string[],
  area: { x: number; y: number; width: number }
) {
  const legendItemWidth = 80;
  const legendItemHeight = 20;
  const itemsPerRow = Math.floor(area.width / legendItemWidth);

  datasets.forEach((dataset, index) => {
    const row = Math.floor(index / itemsPerRow);
    const col = index % itemsPerRow;

    const x = area.x + col * legendItemWidth;
    const y = area.y + row * legendItemHeight;

    const color = dataset.color || colors[index % colors.length];

    // Draw color box
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 12, 12);

    // Draw label
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(dataset.label, x + 16, y + 10);
  });
}

function drawLineChart(
  ctx: CanvasRenderingContext2D,
  data: DataPoint[],
  chartArea: { x: number; y: number; width: number; height: number },
  maxValue: number,
  color: string
) {
  if (data.length === 0) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();

  const xStep = chartArea.width / (data.length - 1 || 1);

  data.forEach((point, index) => {
    const x = chartArea.x + index * xStep;
    const y = chartArea.y + chartArea.height - (point.value / maxValue) * chartArea.height;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  // Draw points
  data.forEach((point, index) => {
    const x = chartArea.x + index * xStep;
    const y = chartArea.y + chartArea.height - (point.value / maxValue) * chartArea.height;

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
}

function drawBarChart(
  ctx: CanvasRenderingContext2D,
  data: DataPoint[],
  chartArea: { x: number; y: number; width: number; height: number },
  maxValue: number,
  color: string,
  datasetIndex: number,
  datasetCount: number
) {
  if (data.length === 0) return;

  const barWidth = chartArea.width / data.length;
  const groupWidth = barWidth * 0.8;
  const individualBarWidth = groupWidth / datasetCount;

  data.forEach((point, index) => {
    const x = chartArea.x + index * barWidth + barWidth * 0.1 + datasetIndex * individualBarWidth;
    const barHeight = (point.value / maxValue) * chartArea.height;
    const y = chartArea.y + chartArea.height - barHeight;

    ctx.fillStyle = point.color || color;
    ctx.fillRect(x, y, individualBarWidth, barHeight);

    // Draw label below the bar
    if (datasetIndex === 0) {
      ctx.fillStyle = '#666666';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        point.label,
        chartArea.x + index * barWidth + barWidth / 2,
        chartArea.y + chartArea.height + 15
      );
    }
  });
}

function drawPieChart(
  ctx: CanvasRenderingContext2D,
  data: DataPoint[],
  chartArea: { x: number; y: number; width: number; height: number },
  colors: string[]
) {
  if (data.length === 0) return;

  const centerX = chartArea.x + chartArea.width / 2;
  const centerY = chartArea.y + chartArea.height / 2;
  const radius = Math.min(chartArea.width, chartArea.height) / 2;

  const total = data.reduce((sum, point) => sum + point.value, 0);

  let startAngle = 0;

  data.forEach((point, index) => {
    const portionValue = point.value / total;
    const endAngle = startAngle + portionValue * Math.PI * 2;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();

    ctx.fillStyle = point.color || colors[index % colors.length];
    ctx.fill();

    // Draw label if slice is large enough
    if (portionValue > 0.05) {
      const midAngle = startAngle + (endAngle - startAngle) / 2;
      const labelRadius = radius * 0.7;
      const labelX = centerX + Math.cos(midAngle) * labelRadius;
      const labelY = centerY + Math.sin(midAngle) * labelRadius;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(portionValue > 0.1 ? point.label : '', labelX, labelY);
    }

    startAngle = endAngle;
  });
}

function drawDoughnutChart(
  ctx: CanvasRenderingContext2D,
  data: DataPoint[],
  chartArea: { x: number; y: number; width: number; height: number },
  colors: string[]
) {
  if (data.length === 0) return;

  const centerX = chartArea.x + chartArea.width / 2;
  const centerY = chartArea.y + chartArea.height / 2;
  const outerRadius = Math.min(chartArea.width, chartArea.height) / 2;
  const innerRadius = outerRadius * 0.6;

  const total = data.reduce((sum, point) => sum + point.value, 0);

  let startAngle = 0;

  data.forEach((point, index) => {
    const portionValue = point.value / total;
    const endAngle = startAngle + portionValue * Math.PI * 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
    ctx.closePath();

    ctx.fillStyle = point.color || colors[index % colors.length];
    ctx.fill();

    startAngle = endAngle;
  });
}

function drawAreaChart(
  ctx: CanvasRenderingContext2D,
  data: DataPoint[],
  chartArea: { x: number; y: number; width: number; height: number },
  maxValue: number,
  color: string
) {
  if (data.length === 0) return;

  const xStep = chartArea.width / (data.length - 1 || 1);

  // Draw filled area
  ctx.beginPath();
  ctx.moveTo(chartArea.x, chartArea.y + chartArea.height);

  data.forEach((point, index) => {
    const x = chartArea.x + index * xStep;
    const y = chartArea.y + chartArea.height - (point.value / maxValue) * chartArea.height;
    ctx.lineTo(x, y);
  });

  ctx.lineTo(chartArea.x + chartArea.width, chartArea.y + chartArea.height);
  ctx.closePath();

  const gradient = ctx.createLinearGradient(0, chartArea.y, 0, chartArea.y + chartArea.height);
  gradient.addColorStop(0, color + '80'); // Semi-transparent color at top
  gradient.addColorStop(1, color + '10'); // Almost transparent at bottom

  ctx.fillStyle = gradient;
  ctx.fill();

  // Draw line on top
  drawLineChart(ctx, data, chartArea, maxValue, color);
}

function drawThresholdLine(
  ctx: CanvasRenderingContext2D,
  threshold: number,
  chartArea: { x: number; y: number; width: number; height: number },
  maxValue: number
) {
  const y = chartArea.y + chartArea.height - (threshold / maxValue) * chartArea.height;

  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 3]);

  ctx.beginPath();
  ctx.moveTo(chartArea.x, y);
  ctx.lineTo(chartArea.x + chartArea.width, y);
  ctx.stroke();

  ctx.setLineDash([]);

  // Draw threshold label
  ctx.fillStyle = '#ff0000';
  ctx.font = '10px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Threshold: ${threshold}`, chartArea.x, y - 5);
}
