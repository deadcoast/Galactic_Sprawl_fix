import React from "react";
import { ChartData, ChartOptions, ChartRenderer, ChartType } from '../Chart';

/**
 * Canvas-based chart renderer implementation.
 * Uses the HTML Canvas API for efficient rendering of charts with large datasets.
 */
export class CanvasRenderer implements ChartRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private containerWidth = 0;
  private containerHeight = 0;
  private resolutionScale = window.devicePixelRatio || 1;
  private animationFrame: number | null = null;
  private isInitialized = false;
  private lastRenderTime = 0;
  private tooltipElement: HTMLDivElement | null = null;

  private theme = {
    light: {
      textColor: '#333333',
      gridColor: '#e0e0e0',
      axisColor: '#666666',
      backgroundColor: 'transparent'
    },
    dark: {
      textColor: '#e0e0e0',
      gridColor: '#444444',
      axisColor: '#999999',
      backgroundColor: 'transparent'
    }
  };

  /**
   * Render a chart onto the container element
   */
  public render(
    container: HTMLElement,
    data: ChartData,
    options: ChartOptions,
    type: ChartType
  ): void {
    this.initialize(container, options);
    this.update(container, data, options, type);
  }

  /**
   * Updates the chart with new data or options
   */
  public update(
    container: HTMLElement,
    data: ChartData,
    options: ChartOptions,
    type: ChartType
  ): void {
    if (!this.isInitialized) {
      this.initialize(container, options);
    }

    // Cancel any pending animation frame
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }

    const startTime = performance.now();

    // Update chart dimensions if container size has changed
    this.updateDimensions(container);

    // Render the chart based on type
    this.animationFrame = requestAnimationFrame(() => {
      if (!this.ctx || !this.canvas) return;

      // Clear the canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Set background color
      const themeColors = options.theme === 'dark' ? this.theme.dark : this.theme.light;
      this.ctx.fillStyle = options.backgroundColor || themeColors.backgroundColor;
      if (this.ctx.fillStyle !== 'transparent') {
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }

      // Calculate chart area with padding
      const padding = options.padding || {};
      const chartArea = {
        left: (padding.left || 0) * this.resolutionScale,
        right: this.canvas.width - (padding.right || 0) * this.resolutionScale,
        top: (padding.top || 0) * this.resolutionScale,
        bottom: this.canvas.height - (padding.bottom || 0) * this.resolutionScale
      };

      // Render based on chart type
      switch (type) {
        case 'line':
          this.renderLineChart(data, options, chartArea);
          break;
        case 'bar':
          this.renderBarChart(data, options, chartArea);
          break;
        case 'scatter':
          this.renderScatterChart(data, options, chartArea);
          break;
        case 'area':
          this.renderAreaChart(data, options, chartArea);
          break;
        case 'pie':
          this.renderPieChart(data, options);
          break;
        case 'radar':
          this.renderRadarChart(data, options);
          break;
        case 'heatmap':
          this.renderHeatmapChart(data, options, chartArea);
          break;
        default:
          throw new Error(`Unsupported chart type: ${type}`);
      }

      // Render axes
      if (type !== 'pie' && type !== 'radar') {
        this.renderAxes(data, options, chartArea);
      }

      // Render legend if enabled
      if (options.legend?.visible) {
        this.renderLegend(data, options, chartArea);
      }

      this.lastRenderTime = performance.now() - startTime;
    });

    // Set up tooltip if enabled
    if (options.tooltip?.enabled) {
      this.setupTooltip(container, data, options);
    } else if (this.tooltipElement) {
      this.tooltipElement.remove();
      this.tooltipElement = null;
    }
  }

  /**
   * Destroys the renderer, cleaning up any resources
   */
  public destroy(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.tooltipElement) {
      this.tooltipElement.remove();
      this.tooltipElement = null;
    }

    this.canvas = null;
    this.ctx = null;
    this.isInitialized = false;
  }

  /**
   * Returns the current status of the renderer
   */
  public getStatus(): { isInitialized: boolean; lastRenderTime?: number } {
    return {
      isInitialized: this.isInitialized,
      lastRenderTime: this.lastRenderTime
    };
  }

  /**
   * Initialize the canvas renderer
   */
  private initialize(container: HTMLElement, options: ChartOptions): void {
    // Clean existing canvas if any
    const existingCanvas = container.querySelector('canvas');
    if (existingCanvas) {
      container.removeChild(existingCanvas);
    }

    // Create new canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    container.appendChild(this.canvas);

    // Get context
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Could not get canvas context');
    }

    // Set dimensions
    this.updateDimensions(container);

    this.isInitialized = true;
  }

  /**
   * Update canvas dimensions based on container size
   */
  private updateDimensions(container: HTMLElement): void {
    if (!this.canvas || !this.ctx) return;

    const rect = container.getBoundingClientRect();
    this.containerWidth = rect.width;
    this.containerHeight = rect.height;

    // Set canvas dimensions with higher resolution for retina displays
    this.canvas.width = this.containerWidth * this.resolutionScale;
    this.canvas.height = this.containerHeight * this.resolutionScale;

    // Scale context
    this.ctx.scale(this.resolutionScale, this.resolutionScale);
  }

  /**
   * Render line chart
   */
  private renderLineChart(data: ChartData, options: ChartOptions, chartArea: unknown): void {
    if (!this.ctx) return;

    const { datasets } = data;
    const xAxis = options.axes?.x || { type: 'linear' };
    const yAxis = options.axes?.y || { type: 'linear' };

    // Calculate scales
    const scales = this.calculateScales(data, chartArea, xAxis, yAxis);

    // Draw grid lines if enabled
    if (xAxis.grid || yAxis.grid) {
      this.drawGrid(scales, chartArea, options);
    }

    // Draw each dataset
    datasets.forEach((dataset, datasetIndex) => {
      const points: { x: number; y: number }[] = [];

      // Map data points to canvas coordinates
      dataset.data.forEach(point => {
        const x = this.mapValueToPixel(point.x, scales.x, chartArea.left, chartArea.right);
        const y = this.mapValueToPixel(point.y, scales.y, chartArea.bottom, chartArea.top, true);
        points.push({ x, y });
      });

      if (points.length === 0) return;

      // Draw lines connecting points
      this.ctx!.beginPath();
      this.ctx!.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i++) {
        this.ctx!.lineTo(points[i].x, points[i].y);
      }

      this.ctx!.strokeStyle = dataset.color || this.getDefaultColor(datasetIndex);
      this.ctx!.lineWidth = 2;
      this.ctx!.stroke();

      // Draw data points
      points.forEach(point => {
        this.ctx!.beginPath();
        this.ctx!.arc(point.x, point.y, 3, 0, Math.PI * 2);
        this.ctx!.fillStyle = dataset.color || this.getDefaultColor(datasetIndex);
        this.ctx!.fill();
      });
    });
  }

  /**
   * Render bar chart
   */
  private renderBarChart(data: ChartData, options: ChartOptions, chartArea: unknown): void {
    if (!this.ctx) return;

    const { datasets } = data;
    const xAxis = options.axes?.x || { type: 'category' };
    const yAxis = options.axes?.y || { type: 'linear' };

    // Calculate scales
    const scales = this.calculateScales(data, chartArea, xAxis, yAxis);

    // Draw grid lines if enabled
    if (xAxis.grid || yAxis.grid) {
      this.drawGrid(scales, chartArea, options);
    }

    // Calculate bar width based on the number of datasets and data points
    const allLabels = this.getAllXValues(data);
    const totalBarGroups = allLabels.length;
    const barGroupWidth = (chartArea.right - chartArea.left) / (totalBarGroups + 1);
    const barWidth = barGroupWidth * 0.8 / datasets.length;

    // Draw each dataset
    datasets.forEach((dataset, datasetIndex) => {
      dataset.data.forEach(point => {
        const xIndex = allLabels.indexOf(String(point.x));
        const x = chartArea.left + (xIndex + 1) * barGroupWidth - barGroupWidth * 0.4 + datasetIndex * barWidth;
        const yZero = this.mapValueToPixel(0, scales.y, chartArea.bottom, chartArea.top, true);
        const y = this.mapValueToPixel(point.y, scales.y, chartArea.bottom, chartArea.top, true);

        this.ctx!.fillStyle = dataset.color || this.getDefaultColor(datasetIndex);
        this.ctx!.fillRect(x, Math.min(y, yZero), barWidth, Math.abs(y - yZero));
      });
    });
  }

  /**
   * Render scatter chart
   */
  private renderScatterChart(data: ChartData, options: ChartOptions, chartArea: unknown): void {
    if (!this.ctx) return;

    const { datasets } = data;
    const xAxis = options.axes?.x || { type: 'linear' };
    const yAxis = options.axes?.y || { type: 'linear' };

    // Calculate scales
    const scales = this.calculateScales(data, chartArea, xAxis, yAxis);

    // Draw grid lines if enabled
    if (xAxis.grid || yAxis.grid) {
      this.drawGrid(scales, chartArea, options);
    }

    // Draw each dataset
    datasets.forEach((dataset, datasetIndex) => {
      dataset.data.forEach(point => {
        const x = this.mapValueToPixel(point.x, scales.x, chartArea.left, chartArea.right);
        const y = this.mapValueToPixel(point.y, scales.y, chartArea.bottom, chartArea.top, true);

        this.ctx!.beginPath();
        this.ctx!.arc(x, y, point.radius || 5, 0, Math.PI * 2);
        this.ctx!.fillStyle = dataset.color || this.getDefaultColor(datasetIndex);
        this.ctx!.fill();
      });
    });
  }

  /**
   * Render area chart
   */
  private renderAreaChart(data: ChartData, options: ChartOptions, chartArea: unknown): void {
    if (!this.ctx) return;

    const { datasets } = data;
    const xAxis = options.axes?.x || { type: 'linear' };
    const yAxis = options.axes?.y || { type: 'linear' };

    // Calculate scales
    const scales = this.calculateScales(data, chartArea, xAxis, yAxis);

    // Draw grid lines if enabled
    if (xAxis.grid || yAxis.grid) {
      this.drawGrid(scales, chartArea, options);
    }

    // Draw each dataset
    datasets.forEach((dataset, datasetIndex) => {
      const points: { x: number; y: number }[] = [];

      // Map data points to canvas coordinates
      dataset.data.forEach(point => {
        const x = this.mapValueToPixel(point.x, scales.x, chartArea.left, chartArea.right);
        const y = this.mapValueToPixel(point.y, scales.y, chartArea.bottom, chartArea.top, true);
        points.push({ x, y });
      });

      if (points.length === 0) return;

      // Draw filled area
      this.ctx!.beginPath();
      this.ctx!.moveTo(points[0].x, chartArea.bottom);
      this.ctx!.lineTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i++) {
        this.ctx!.lineTo(points[i].x, points[i].y);
      }

      this.ctx!.lineTo(points[points.length - 1].x, chartArea.bottom);
      this.ctx!.closePath();

      // Create gradient fill
      const gradient = this.ctx!.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      const color = dataset.color || this.getDefaultColor(datasetIndex);
      gradient.addColorStop(0, this.hexToRgba(color, 0.6));
      gradient.addColorStop(1, this.hexToRgba(color, 0.1));
      
      this.ctx!.fillStyle = gradient;
      this.ctx!.fill();

      // Draw the line on top
      this.ctx!.beginPath();
      this.ctx!.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i++) {
        this.ctx!.lineTo(points[i].x, points[i].y);
      }

      this.ctx!.strokeStyle = color;
      this.ctx!.lineWidth = 2;
      this.ctx!.stroke();
    });
  }

  /**
   * Render pie chart
   */
  private renderPieChart(data: ChartData, options: ChartOptions): void {
    if (!this.ctx || !this.canvas) return;

    const { datasets } = data;
    const centerX = this.canvas.width / (2 * this.resolutionScale);
    const centerY = this.canvas.height / (2 * this.resolutionScale);
    const radius = Math.min(centerX, centerY) * 0.7;

    if (datasets.length === 0 || datasets[0].data.length === 0) return;

    // Get the first dataset for pie chart
    const dataset = datasets[0];
    
    // Calculate total value for proportions
    const total = dataset.data.reduce((sum, point) => sum + point.y, 0);
    if (total <= 0) return;

    // Draw pie slices
    let startAngle = 0;
    dataset.data.forEach((point, i) => {
      const sliceAngle = (point.y / total) * (Math.PI * 2);
      const endAngle = startAngle + sliceAngle;

      this.ctx!.beginPath();
      this.ctx!.moveTo(centerX, centerY);
      this.ctx!.arc(centerX, centerY, radius, startAngle, endAngle);
      this.ctx!.closePath();

      this.ctx!.fillStyle = point.color || this.getDefaultColor(i);
      this.ctx!.fill();

      // Draw slice border
      this.ctx!.strokeStyle = '#fff';
      this.ctx!.lineWidth = 1;
      this.ctx!.stroke();

      // Draw label if there's enough space (slices > 5% of total)
      if (sliceAngle > 0.1) {
        const labelAngle = startAngle + sliceAngle / 2;
        const labelRadius = radius * 0.7;
        const labelX = centerX + Math.cos(labelAngle) * labelRadius;
        const labelY = centerY + Math.sin(labelAngle) * labelRadius;

        this.ctx!.fillStyle = '#fff';
        this.ctx!.font = '12px Arial';
        this.ctx!.textAlign = 'center';
        this.ctx!.textBaseline = 'middle';
        this.ctx!.fillText(point.x.toString(), labelX, labelY);
      }

      startAngle = endAngle;
    });
  }

  /**
   * Render radar chart
   */
  private renderRadarChart(data: ChartData, options: ChartOptions): void {
    if (!this.ctx || !this.canvas) return;

    const { datasets } = data;
    if (datasets.length === 0 || datasets[0].data.length === 0) return;

    const centerX = this.canvas.width / (2 * this.resolutionScale);
    const centerY = this.canvas.height / (2 * this.resolutionScale);
    const radius = Math.min(centerX, centerY) * 0.7;

    // Find all unique labels (angles) from all datasets
    const allLabels = new Set<string>();
    datasets.forEach(dataset => {
      dataset.data.forEach(point => {
        allLabels.add(String(point.x));
      });
    });

    const labels = Array.from(allLabels);
    const angleStep = (Math.PI * 2) / labels.length;

    // Draw background grid (circles and lines)
    this.ctx!.strokeStyle = options.theme === 'dark' ? this.theme.dark.gridColor : this.theme.light.gridColor;
    this.ctx!.lineWidth = 0.5;

    // Draw circular grid lines
    for (let i = 1; i <= 5; i++) {
      const gridRadius = radius * (i / 5);
      this.ctx!.beginPath();
      this.ctx!.arc(centerX, centerY, gridRadius, 0, Math.PI * 2);
      this.ctx!.stroke();
    }

    // Draw radial grid lines
    labels.forEach((_, i) => {
      const angle = i * angleStep - Math.PI / 2; // Start from top
      this.ctx!.beginPath();
      this.ctx!.moveTo(centerX, centerY);
      this.ctx!.lineTo(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );
      this.ctx!.stroke();

      // Draw labels
      const labelX = centerX + Math.cos(angle) * (radius + 15);
      const labelY = centerY + Math.sin(angle) * (radius + 15);
      this.ctx!.fillStyle = options.theme === 'dark' ? this.theme.dark.textColor : this.theme.light.textColor;
      this.ctx!.font = '12px Arial';
      this.ctx!.textAlign = 'center';
      this.ctx!.textBaseline = 'middle';
      this.ctx!.fillText(labels[i], labelX, labelY);
    });

    // Find max value for scaling
    const maxValue = datasets.reduce((max, dataset) => {
      const datasetMax = dataset.data.reduce((m, point) => Math.max(m, point.y), 0);
      return Math.max(max, datasetMax);
    }, 0);

    // Draw each dataset
    datasets.forEach((dataset, datasetIndex) => {
      const dataMap = new Map<string, number>();
      dataset.data.forEach(point => {
        dataMap.set(String(point.x), point.y);
      });

      // Create points for the radar shape
      const points: { x: number; y: number }[] = [];
      labels.forEach((label, i) => {
        const value = dataMap.get(label) || 0;
        const valueRatio = Math.max(0, Math.min(1, value / maxValue));
        const angle = i * angleStep - Math.PI / 2; // Start from top
        const x = centerX + Math.cos(angle) * radius * valueRatio;
        const y = centerY + Math.sin(angle) * radius * valueRatio;
        points.push({ x, y });
      });

      if (points.length < 3) return;

      // Draw filled area
      this.ctx!.beginPath();
      this.ctx!.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        this.ctx!.lineTo(points[i].x, points[i].y);
      }
      
      this.ctx!.closePath();
      
      const color = dataset.color || this.getDefaultColor(datasetIndex);
      this.ctx!.fillStyle = this.hexToRgba(color, 0.2);
      this.ctx!.fill();
      
      // Draw outline
      this.ctx!.strokeStyle = color;
      this.ctx!.lineWidth = 2;
      this.ctx!.stroke();
      
      // Draw points
      points.forEach(point => {
        this.ctx!.beginPath();
        this.ctx!.arc(point.x, point.y, 3, 0, Math.PI * 2);
        this.ctx!.fillStyle = color;
        this.ctx!.fill();
      });
    });
  }

  /**
   * Render heatmap chart
   */
  private renderHeatmapChart(data: ChartData, options: ChartOptions, chartArea: unknown): void {
    if (!this.ctx) return;

    const { datasets } = data;
    if (datasets.length === 0 || datasets[0].data.length === 0) return;

    const xAxis = options.axes?.x || { type: 'category' };
    const yAxis = options.axes?.y || { type: 'category' };

    // For heatmap, we need to find all unique x and y values
    const uniqueX = new Set<string>();
    const uniqueY = new Set<string>();

    datasets.forEach(dataset => {
      dataset.data.forEach(point => {
        uniqueX.add(String(point.x));
        uniqueY.add(String(point.y));
      });
    });

    const xValues = Array.from(uniqueX).sort();
    const yValues = Array.from(uniqueY).sort();

    // Calculate cell dimensions
    const cellWidth = (chartArea.right - chartArea.left) / xValues.length;
    const cellHeight = (chartArea.bottom - chartArea.top) / yValues.length;

    // Find min and max values for color scaling
    let minValue = Infinity;
    let maxValue = -Infinity;

    datasets.forEach(dataset => {
      dataset.data.forEach(point => {
        const value = point.value !== undefined ? point.value : point.y;
        minValue = Math.min(minValue, value);
        maxValue = Math.max(maxValue, value);
      });
    });

    // Draw grid
    this.ctx.strokeStyle = options.theme === 'dark' ? this.theme.dark.gridColor : this.theme.light.gridColor;
    this.ctx.lineWidth = 0.5;

    // Vertical grid lines
    for (let i = 0; i <= xValues.length; i++) {
      const x = chartArea.left + i * cellWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(x, chartArea.top);
      this.ctx.lineTo(x, chartArea.bottom);
      this.ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 0; i <= yValues.length; i++) {
      const y = chartArea.top + i * cellHeight;
      this.ctx.beginPath();
      this.ctx.moveTo(chartArea.left, y);
      this.ctx.lineTo(chartArea.right, y);
      this.ctx.stroke();
    }

    // Draw cells
    datasets.forEach(dataset => {
      dataset.data.forEach(point => {
        const xIndex = xValues.indexOf(String(point.x));
        const yIndex = yValues.indexOf(String(point.y));
        
        if (xIndex === -1 || yIndex === -1) return;
        
        const value = point.value !== undefined ? point.value : point.y;
        const normalizedValue = (value - minValue) / (maxValue - minValue);
        
        const x = chartArea.left + xIndex * cellWidth;
        const y = chartArea.top + yIndex * cellHeight;
        
        // Generate heatmap color
        this.ctx!.fillStyle = this.getHeatmapColor(normalizedValue);
        this.ctx!.fillRect(x, y, cellWidth, cellHeight);
      });
    });

    // Draw axes
    this.renderCategoryAxes(xValues, yValues, chartArea, options);
  }

  /**
   * Render axes for charts
   */
  private renderAxes(data: ChartData, options: ChartOptions, chartArea: unknown): void {
    if (!this.ctx) return;

    const xAxis = options.axes?.x || { type: 'linear' };
    const yAxis = options.axes?.y || { type: 'linear' };
    const scales = this.calculateScales(data, chartArea, xAxis, yAxis);

    // Draw x-axis
    this.ctx.beginPath();
    this.ctx.moveTo(chartArea.left, chartArea.bottom);
    this.ctx.lineTo(chartArea.right, chartArea.bottom);
    this.ctx.strokeStyle = options.theme === 'dark' ? this.theme.dark.axisColor : this.theme.light.axisColor;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Draw y-axis
    this.ctx.beginPath();
    this.ctx.moveTo(chartArea.left, chartArea.top);
    this.ctx.lineTo(chartArea.left, chartArea.bottom);
    this.ctx.stroke();

    // Draw x-axis ticks and labels
    const xTickCount = xAxis.tickCount || 5;
    const xStep = (scales.x.max - scales.x.min) / (xTickCount - 1);

    for (let i = 0; i < xTickCount; i++) {
      const value = scales.x.min + i * xStep;
      const x = this.mapValueToPixel(value, scales.x, chartArea.left, chartArea.right);
      const y = chartArea.bottom;

      // Draw tick
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x, y + 5);
      this.ctx.stroke();

      // Draw label
      this.ctx.fillStyle = options.theme === 'dark' ? this.theme.dark.textColor : this.theme.light.textColor;
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';
      
      let tickLabel = String(value);
      if (xAxis.tickFormat) {
        tickLabel = xAxis.tickFormat(value);
      } else if (xAxis.type === 'time' && value instanceof Date) {
        tickLabel = value.toLocaleDateString();
      }
      
      this.ctx.fillText(tickLabel, x, y + 8);
    }

    // Draw y-axis ticks and labels
    const yTickCount = yAxis.tickCount || 5;
    const yStep = (scales.y.max - scales.y.min) / (yTickCount - 1);

    for (let i = 0; i < yTickCount; i++) {
      const value = scales.y.min + i * yStep;
      const x = chartArea.left;
      const y = this.mapValueToPixel(value, scales.y, chartArea.bottom, chartArea.top, true);

      // Draw tick
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x - 5, y);
      this.ctx.stroke();

      // Draw label
      this.ctx.fillStyle = options.theme === 'dark' ? this.theme.dark.textColor : this.theme.light.textColor;
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'right';
      this.ctx.textBaseline = 'middle';
      
      let tickLabel = String(value);
      if (yAxis.tickFormat) {
        tickLabel = yAxis.tickFormat(value);
      }
      
      this.ctx.fillText(tickLabel, x - 8, y);
    }

    // Draw axis labels if provided
    if (xAxis.label) {
      this.ctx.fillStyle = options.theme === 'dark' ? this.theme.dark.textColor : this.theme.light.textColor;
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'bottom';
      this.ctx.fillText(xAxis.label, (chartArea.left + chartArea.right) / 2, this.canvas!.height / this.resolutionScale - 5);
    }

    if (yAxis.label) {
      this.ctx.save();
      this.ctx.translate(10, (chartArea.top + chartArea.bottom) / 2);
      this.ctx.rotate(-Math.PI / 2);
      this.ctx.fillStyle = options.theme === 'dark' ? this.theme.dark.textColor : this.theme.light.textColor;
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'bottom';
      this.ctx.fillText(yAxis.label, 0, 0);
      this.ctx.restore();
    }
  }

  /**
   * Render category axes for heatmap
   */
  private renderCategoryAxes(
    xCategories: string[],
    yCategories: string[],
    chartArea: unknown,
    options: ChartOptions
  ): void {
    if (!this.ctx) return;

    const cellWidth = (chartArea.right - chartArea.left) / xCategories.length;
    const cellHeight = (chartArea.bottom - chartArea.top) / yCategories.length;

    // X-axis labels
    this.ctx.fillStyle = options.theme === 'dark' ? this.theme.dark.textColor : this.theme.light.textColor;
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';

    xCategories.forEach((category, i) => {
      const x = chartArea.left + (i + 0.5) * cellWidth;
      const y = chartArea.bottom + 5;
      this.ctx!.fillText(category, x, y);
    });

    // Y-axis labels
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';

    yCategories.forEach((category, i) => {
      const x = chartArea.left - 5;
      const y = chartArea.top + (i + 0.5) * cellHeight;
      this.ctx!.fillText(category, x, y);
    });
  }

  /**
   * Draw grid lines
   */
  private drawGrid(scales: unknown, chartArea: unknown, options: ChartOptions): void {
    if (!this.ctx) return;

    const xAxis = options.axes?.x || { type: 'linear', grid: true };
    const yAxis = options.axes?.y || { type: 'linear', grid: true };
    
    this.ctx.strokeStyle = options.theme === 'dark' ? this.theme.dark.gridColor : this.theme.light.gridColor;
    this.ctx.lineWidth = 0.5;

    // Draw x-axis grid lines
    if (yAxis.grid) {
      const xTickCount = xAxis.tickCount || 5;
      const xStep = (scales.x.max - scales.x.min) / (xTickCount - 1);

      for (let i = 0; i < xTickCount; i++) {
        const value = scales.x.min + i * xStep;
        const x = this.mapValueToPixel(value, scales.x, chartArea.left, chartArea.right);

        this.ctx.beginPath();
        this.ctx.moveTo(x, chartArea.top);
        this.ctx.lineTo(x, chartArea.bottom);
        this.ctx.stroke();
      }
    }

    // Draw y-axis grid lines
    if (xAxis.grid) {
      const yTickCount = yAxis.tickCount || 5;
      const yStep = (scales.y.max - scales.y.min) / (yTickCount - 1);

      for (let i = 0; i < yTickCount; i++) {
        const value = scales.y.min + i * yStep;
        const y = this.mapValueToPixel(value, scales.y, chartArea.bottom, chartArea.top, true);

        this.ctx.beginPath();
        this.ctx.moveTo(chartArea.left, y);
        this.ctx.lineTo(chartArea.right, y);
        this.ctx.stroke();
      }
    }
  }

  /**
   * Render legend
   */
  private renderLegend(data: ChartData, options: ChartOptions, chartArea: unknown): void {
    if (!this.ctx || !this.canvas) return;

    const { datasets } = data;
    const legendOptions = options.legend || { visible: true, position: 'top' };
    
    if (!legendOptions.visible || datasets.length === 0) return;

    const padding = 10;
    const itemHeight = 20;
    const itemWidth = 80;
    const itemsPerRow = Math.floor((chartArea.right - chartArea.left) / itemWidth);
    const rows = Math.ceil(datasets.length / itemsPerRow);
    
    let startX, startY, legendWidth, legendHeight;
    
    legendWidth = Math.min(datasets.length, itemsPerRow) * itemWidth;
    legendHeight = rows * itemHeight;
    
    switch (legendOptions.position) {
      case 'top':
        startX = (chartArea.left + chartArea.right - legendWidth) / 2;
        startY = chartArea.top - legendHeight - padding;
        break;
      case 'bottom':
        startX = (chartArea.left + chartArea.right - legendWidth) / 2;
        startY = chartArea.bottom + padding;
        break;
      case 'left':
        startX = chartArea.left - legendWidth - padding;
        startY = (chartArea.top + chartArea.bottom - legendHeight) / 2;
        break;
      case 'right':
        startX = chartArea.right + padding;
        startY = (chartArea.top + chartArea.bottom - legendHeight) / 2;
        break;
      default:
        startX = (chartArea.left + chartArea.right - legendWidth) / 2;
        startY = chartArea.top - legendHeight - padding;
    }
    
    // Ensure legend stays within bounds
    startX = Math.max(padding, startX);
    startY = Math.max(padding, startY);
    
    // Draw legend items
    datasets.forEach((dataset, i) => {
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;
      const x = startX + col * itemWidth;
      const y = startY + row * itemHeight;
      
      // Draw color box
      this.ctx!.fillStyle = dataset.color || this.getDefaultColor(i);
      this.ctx!.fillRect(x, y + 4, 12, 12);
      
      // Draw border around color box
      this.ctx!.strokeStyle = options.theme === 'dark' ? this.theme.dark.axisColor : this.theme.light.axisColor;
      this.ctx!.lineWidth = 1;
      this.ctx!.strokeRect(x, y + 4, 12, 12);
      
      // Draw text
      this.ctx!.fillStyle = options.theme === 'dark' ? this.theme.dark.textColor : this.theme.light.textColor;
      this.ctx!.font = '12px Arial';
      this.ctx!.textAlign = 'left';
      this.ctx!.textBaseline = 'middle';
      this.ctx!.fillText(dataset.label || `Series ${i + 1}`, x + 18, y + 10);
    });
  }

  /**
   * Set up tooltip for chart
   */
  private setupTooltip(container: HTMLElement, data: ChartData, options: ChartOptions): void {
    if (!this.canvas) return;

    // Remove existing tooltip if any
    if (this.tooltipElement) {
      this.tooltipElement.remove();
    }

    // Create tooltip element
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.className = 'chart-tooltip';
    this.tooltipElement.style.position = 'absolute';
    this.tooltipElement.style.display = 'none';
    this.tooltipElement.style.backgroundColor = options.theme === 'dark' ? '#333' : '#fff';
    this.tooltipElement.style.color = options.theme === 'dark' ? '#fff' : '#333';
    this.tooltipElement.style.border = `1px solid ${options.theme === 'dark' ? '#555' : '#ddd'}`;
    this.tooltipElement.style.padding = '8px';
    this.tooltipElement.style.borderRadius = '4px';
    this.tooltipElement.style.pointerEvents = 'none';
    this.tooltipElement.style.zIndex = '1000';
    this.tooltipElement.style.fontSize = '12px';
    this.tooltipElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
    
    container.appendChild(this.tooltipElement);

    // Add event listeners
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e, data, options, container));
    this.canvas.addEventListener('mouseout', () => {
      if (this.tooltipElement) {
        this.tooltipElement.style.display = 'none';
      }
    });
  }

  /**
   * Handle mouse move for tooltips
   */
  private handleMouseMove(
    e: MouseEvent,
    data: ChartData,
    options: ChartOptions,
    container: HTMLElement
  ): void {
    if (!this.canvas || !this.ctx || !this.tooltipElement) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Get chart area with padding
    const padding = options.padding || {};
    const chartArea = {
      left: padding.left || 0,
      right: this.containerWidth - (padding.right || 0),
      top: padding.top || 0,
      bottom: this.containerHeight - (padding.bottom || 0)
    };

    // Only process if mouse is inside chart area
    if (
      x < chartArea.left ||
      x > chartArea.right ||
      y < chartArea.top ||
      y > chartArea.bottom
    ) {
      this.tooltipElement.style.display = 'none';
      return;
    }

    // Find nearest data point(s)
    const nearestPoints = this.findNearestPoints(x, y, data, options, chartArea);
    
    if (nearestPoints.length === 0) {
      this.tooltipElement.style.display = 'none';
      return;
    }

    // Build tooltip content
    let tooltipContent = '';
    
    nearestPoints.forEach(({ dataset, point, dataIndex }) => {
      const formattedX = point.x instanceof Date 
        ? point.x.toLocaleDateString() 
        : point.x;
      
      const formattedY = typeof point.y === 'number' 
        ? point.y.toLocaleString(undefined, { maximumFractionDigits: 2 }) 
        : point.y;
      
      if (options.tooltip?.format) {
        tooltipContent += options.tooltip.format(point, dataset);
      } else {
        tooltipContent += `
          <div style="margin-bottom: 4px">
            <span style="font-weight: bold; color: ${dataset.color || this.getDefaultColor(dataIndex)}">${dataset.label || `Series ${dataIndex + 1}`}:</span>
            <span>${formattedX}, ${formattedY}</span>
          </div>
        `;
      }
    });

    // Update tooltip
    this.tooltipElement.innerHTML = tooltipContent;
    this.tooltipElement.style.display = 'block';
    
    // Position tooltip
    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    let tooltipX = e.clientX - rect.left + container.scrollLeft + 10;
    let tooltipY = e.clientY - rect.top + container.scrollTop + 10;
    
    // Adjust position to ensure tooltip stays within container
    if (tooltipX + tooltipRect.width > container.clientWidth) {
      tooltipX = e.clientX - rect.left - tooltipRect.width - 10;
    }
    
    if (tooltipY + tooltipRect.height > container.clientHeight) {
      tooltipY = e.clientY - rect.top - tooltipRect.height - 10;
    }
    
    this.tooltipElement.style.left = `${tooltipX}px`;
    this.tooltipElement.style.top = `${tooltipY}px`;
  }

  /**
   * Find nearest data points to mouse position
   */
  private findNearestPoints(
    mouseX: number,
    mouseY: number,
    data: ChartData,
    options: ChartOptions,
    chartArea: any
  ): Array<{ dataset: ChartData['datasets'][0]; point: ChartDataPoint; dataIndex: number }> {
    const { datasets } = data;
    const xAxis = options.axes?.x || { type: 'linear' };
    const yAxis = options.axes?.y || { type: 'linear' };
    const scales = this.calculateScales(data, chartArea, xAxis, yAxis);
    const tooltipMode = options.tooltip?.mode || 'nearest';
    const intersect = options.tooltip?.intersect !== false;
    
    const nearestPoints: Array<{
      dataset: ChartData['datasets'][0];
      point: ChartDataPoint;
      dataIndex: number;
      distance: number;
    }> = [];
    
    // Find nearest points based on chart type and tooltip mode
    datasets.forEach((dataset, datasetIndex) => {
      dataset.data.forEach(point => {
        const pointX = this.mapValueToPixel(point.x, scales.x, chartArea.left, chartArea.right);
        const pointY = this.mapValueToPixel(point.y, scales.y, chartArea.bottom, chartArea.top, true);
        
        // Calculate distance
        const distance = Math.sqrt(Math.pow(mouseX - pointX, 2) + Math.pow(mouseY - pointY, 2));
        
        nearestPoints.push({
          dataset,
          point,
          dataIndex: datasetIndex,
          distance
        });
      });
    });
    
    // Sort by distance
    nearestPoints.sort((a, b) => a.distance - b.distance);
    
    // Filter based on mode
    let result: typeof nearestPoints = [];
    
    if (tooltipMode === 'nearest') {
      // Only include the nearest point
      if (nearestPoints.length > 0) {
        if (!intersect || nearestPoints[0].distance < 20) {
          result = [nearestPoints[0]];
        }
      }
    } else if (tooltipMode === 'point') {
      // Include all points within a threshold distance
      result = nearestPoints.filter(item => {
        return !intersect || item.distance < 20;
      });
    } else if (tooltipMode === 'dataset') {
      // Include the nearest point from each dataset
      const datasetMap = new Map<number, typeof nearestPoints[0]>();
      
      for (const item of nearestPoints) {
        if (!datasetMap.has(item.dataIndex) || 
            item.distance < datasetMap.get(item.dataIndex)!.distance) {
          datasetMap.set(item.dataIndex, item);
        }
      }
      
      result = Array.from(datasetMap.values()).filter(item => !intersect || item.distance < 40);
    }
    
    // Return without the distance property
    return result.map(({ dataset, point, dataIndex }) => ({ dataset, point, dataIndex }));
  }

  /**
   * Calculate scales for axes
   */
  private calculateScales(
    data: ChartData,
    chartArea: unknown,
    xAxis: ChartOptions['axes']['x'],
    yAxis: ChartOptions['axes']['y']
  ): { x: { min: number, max: number }, y: { min: number, max: number } } {
    const { datasets } = data;
    
    // Find min and max x values
    let xMin = xAxis?.min !== undefined ? Number(xAxis.min) : Infinity;
    let xMax = xAxis?.max !== undefined ? Number(xAxis.max) : -Infinity;
    
    // Find min and max y values
    let yMin = yAxis?.min !== undefined ? yAxis.min : Infinity;
    let yMax = yAxis?.max !== undefined ? yAxis.max : -Infinity;
    
    datasets.forEach(dataset => {
      dataset.data.forEach(point => {
        // Handle x values
        let xValue = point.x;
        if (typeof xValue === 'string' && xAxis?.type === 'category') {
          // For category axes, use index
          xValue = 0; // Will be handled later
        } else if (xValue instanceof Date && xAxis?.type === 'time') {
          xValue = xValue.getTime();
        } else if (typeof xValue === 'string') {
          xValue = parseFloat(xValue);
        }
        
        if (typeof xValue === 'number' && !isNaN(xValue)) {
          xMin = Math.min(xMin, xValue);
          xMax = Math.max(xMax, xValue);
        }
        
        // Handle y values
        if (typeof point.y === 'number') {
          yMin = Math.min(yMin, point.y);
          yMax = Math.max(yMax, point.y);
        }
      });
    });
    
    // Handle case where all values are the same
    if (xMin === xMax) {
      xMin -= 1;
      xMax += 1;
    }
    
    if (yMin === yMax) {
      yMin = yMin === 0 ? -1 : yMin * 0.9;
      yMax = yMax === 0 ? 1 : yMax * 1.1;
    }
    
    // For Y axis, typically we want to include zero if it's nearby
    if (yAxis?.type === 'linear' && yMin > 0 && yMin < yMax * 0.3) {
      yMin = 0;
    }
    
    if (yAxis?.type === 'linear' && yMax < 0 && yMax > yMin * 0.3) {
      yMax = 0;
    }
    
    // Add some padding
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    
    xMin -= xRange * 0.05;
    xMax += xRange * 0.05;
    yMin -= yRange * 0.05;
    yMax += yRange * 0.05;
    
    return {
      x: { min: xMin, max: xMax },
      y: { min: yMin, max: yMax }
    };
  }

  /**
   * Map a data value to a pixel position
   */
  private mapValueToPixel(
    value: unknown,
    scale: { min: number; max: number },
    pixelMin: number,
    pixelMax: number,
    invert = false
  ): number {
    let normalizedValue: number;
    
    if (value instanceof Date) {
      normalizedValue = value.getTime();
    } else if (typeof value === 'string') {
      normalizedValue = parseFloat(value);
      if (isNaN(normalizedValue)) {
        normalizedValue = 0; // Fallback for categories
      }
    } else {
      normalizedValue = Number(value);
    }
    
    const normalizedPosition = (normalizedValue - scale.min) / (scale.max - scale.min);
    return invert
      ? pixelMax - normalizedPosition * (pixelMax - pixelMin)
      : pixelMin + normalizedPosition * (pixelMax - pixelMin);
  }

  /**
   * Get all unique x values from all datasets
   */
  private getAllXValues(data: ChartData): string[] {
    const uniqueValues = new Set<string>();
    
    data.datasets.forEach(dataset => {
      dataset.data.forEach(point => {
        uniqueValues.add(String(point.x));
      });
    });
    
    return Array.from(uniqueValues);
  }

  /**
   * Get a default color based on index
   */
  private getDefaultColor(index: number): string {
    const colors = [
      '#4e79a7',
      '#f28e2c',
      '#e15759',
      '#76b7b2',
      '#59a14f',
      '#edc949',
      '#af7aa1',
      '#ff9da7',
      '#9c755f',
      '#bab0ab'
    ];
    
    return colors[index % colors.length];
  }

  /**
   * Convert hex color to rgba for transparency
   */
  private hexToRgba(hex: string, alpha: number): string {
    // Handle shorthand hex
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    
    if (!result) {
      return `rgba(0, 0, 0, ${alpha})`;
    }
    
    return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
  }

  /**
   * Get color for heatmap based on normalized value
   */
  private getHeatmapColor(normalizedValue: number): string {
    // Use a multi-stop gradient: blue -> cyan -> green -> yellow -> red
    const stops = [
      { value: 0.0, color: [0, 0, 255] },      // blue
      { value: 0.25, color: [0, 255, 255] },   // cyan
      { value: 0.5, color: [0, 255, 0] },      // green
      { value: 0.75, color: [255, 255, 0] },   // yellow
      { value: 1.0, color: [255, 0, 0] }       // red
    ];
    
    // Find the two stops that our value is between
    let i = 0;
    while (i < stops.length - 1 && normalizedValue > stops[i + 1].value) {
      i++;
    }
    
    if (i === stops.length - 1) {
      const [r, g, b] = stops[i].color;
      return `rgb(${r}, ${g}, ${b})`;
    }
    
    // Interpolate between the two stops
    const lowerStop = stops[i];
    const upperStop = stops[i + 1];
    const range = upperStop.value - lowerStop.value;
    const relativePosition = (normalizedValue - lowerStop.value) / range;
    
    const r = Math.round(lowerStop.color[0] + relativePosition * (upperStop.color[0] - lowerStop.color[0]));
    const g = Math.round(lowerStop.color[1] + relativePosition * (upperStop.color[1] - lowerStop.color[1]));
    const b = Math.round(lowerStop.color[2] + relativePosition * (upperStop.color[2] - lowerStop.color[2]));
    
    return `rgb(${r}, ${g}, ${b})`;
  }
}