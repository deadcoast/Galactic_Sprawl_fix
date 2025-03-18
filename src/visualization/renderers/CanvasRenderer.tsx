import {
  ChartAxes,
  ChartData,
  ChartDataPoint,
  ChartOptions,
  ChartRenderer,
  ChartType,
} from '../Chart';

// Define local types that extend the base chart interfaces
interface ChartPoint extends ChartDataPoint {
  radius?: number;
  color?: string;
  value?: number;
}

enum ChartScaleType {
  Linear = 'linear',
  Time = 'time',
  Category = 'category',
  Log = 'log',
}

enum ChartLegendPosition {
  Top = 'top',
  Bottom = 'bottom',
  Left = 'left',
  Right = 'right',
}

enum ChartTooltipMode {
  Nearest = 'nearest',
  Index = 'index',
}

interface ChartPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

type ChartAxisType = 'linear' | 'time' | 'category' | 'log';

interface ChartScale {
  min: number;
  max: number;
  type: ChartAxisType;
}

interface ChartScales {
  x: ChartScale;
  y: ChartScale;
}

interface ChartArea {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface ChartTheme {
  textColor: string;
  gridColor: string;
  axisColor: string;
  backgroundColor: string;
}

interface ChartThemes {
  light: ChartTheme;
  dark: ChartTheme;
}

interface ChartLegend {
  position: ChartLegendPosition;
  display: boolean;
}

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

  private theme: ChartThemes = {
    light: {
      backgroundColor: '#ffffff',
      textColor: '#333333',
      gridColor: '#e0e0e0',
      axisColor: '#666666',
    },
    dark: {
      backgroundColor: '#1a1a1a',
      textColor: '#ffffff',
      gridColor: '#333333',
      axisColor: '#999999',
    },
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
      const themeColors = options?.theme === 'dark' ? this.theme.dark : this.theme.light;
      this.ctx.fillStyle = options?.backgroundColor || themeColors.backgroundColor;
      if (this.ctx.fillStyle !== 'transparent') {
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }

      // Calculate chart area with padding
      const chartArea = this.calculateChartArea(options);

      // Render axes
      this.renderAxes(data, options, chartArea);

      // Render chart based on type
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
          console.warn(`Unsupported chart type: ${type}`);
      }

      // Render legend if enabled
      if (options?.legend?.visible) {
        this.renderLegend(data, options, chartArea);
      }

      this.lastRenderTime = performance.now() - startTime;
    });

    // Set up tooltip if enabled
    if (options?.tooltip?.enabled) {
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
      lastRenderTime: this.lastRenderTime,
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

    // Set canvas dimensions from options if provided
    if (options?.width) {
      this.canvas.style.width =
        typeof options?.width === 'number' ? `${options?.width}px` : options?.width;
    } else {
      this.canvas.style.width = '100%';
    }

    if (options?.height) {
      this.canvas.style.height =
        typeof options?.height === 'number' ? `${options?.height}px` : options?.height;
    } else {
      this.canvas.style.height = '100%';
    }

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
  private renderLineChart(data: ChartData, options: ChartOptions, chartArea: ChartArea): void {
    const ctx = this.ctx;
    if (!ctx) return;

    const axes = options?.axes;
    if (!axes?.x || !axes?.y) return;

    const scales = this.calculateScales(data, chartArea, axes.x, axes.y);
    if (!scales) return;

    // Draw grid lines if enabled
    if (axes.x.grid || axes.y.grid) {
      this.drawGrid(scales, chartArea, options);
    }

    // Draw each dataset
    data?.datasets.forEach((dataset, datasetIndex) => {
      const points: { x: number; y: number }[] = [];

      // Map data points to canvas coordinates
      dataset.data?.forEach(point => {
        const x = this.normalizeValue(point.x);
        const y = this.normalizeValue(point.y);
        if (Number.isFinite(x) && Number.isFinite(y)) {
          points.push({
            x: this.mapValueToPixel(x, scales.x, chartArea.left, chartArea.right),
            y: this.mapValueToPixel(y, scales.y, chartArea.bottom, chartArea.top, true),
          });
        }
      });

      if (points.length === 0) return;

      // Draw lines connecting points
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }

      ctx.strokeStyle = dataset.color || this.getDefaultColor(datasetIndex);
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  /**
   * Render bar chart
   */
  private renderBarChart(data: ChartData, options: ChartOptions, chartArea: ChartArea): void {
    if (!this.ctx) return;

    const { datasets } = data;
    const axes = options?.axes || {
      x: { type: ChartScaleType.Linear as const },
      y: { type: ChartScaleType.Linear as const },
    };

    // Calculate scales
    const scales = this.calculateScales(data, chartArea, axes.x, axes.y);

    // Draw grid lines if enabled
    if (axes.x.grid || axes.y.grid) {
      this.drawGrid(scales, chartArea, options);
    }

    // Calculate bar width based on the number of datasets and data points
    const allLabels = this.getAllXValues(data);
    const totalBarGroups = allLabels.length || 1;
    const barGroupWidth = (chartArea.right - chartArea.left) / (totalBarGroups + 1);
    const barWidth = (barGroupWidth * 0.8) / (datasets.length || 1);

    // Draw each dataset
    datasets.forEach((dataset, datasetIndex) => {
      dataset.data?.forEach(point => {
        const xValue = this.normalizeValue(point.x);
        const yValue = this.normalizeValue(point.y);
        const xIndex = allLabels.indexOf(String(xValue));
        const x =
          chartArea.left +
          (xIndex + 1) * barGroupWidth -
          barGroupWidth * 0.4 +
          datasetIndex * barWidth;
        const yZero = this.mapValueToPixel(0, scales.y, chartArea.bottom, chartArea.top, true);
        const y = this.mapValueToPixel(yValue, scales.y, chartArea.bottom, chartArea.top, true);

        if (this.ctx) {
          const fillStyle = dataset.color || this.getDefaultColor(datasetIndex);
          this.setCanvasStyle(fillStyle);
          this.ctx.fillRect(x, Math.min(y, yZero), barWidth, Math.abs(y - yZero));
        }
      });
    });
  }

  /**
   * Render scatter chart
   */
  private renderScatterChart(data: ChartData, options: ChartOptions, chartArea: ChartArea): void {
    const ctx = this.ctx;
    if (!ctx) return;

    const axes = options?.axes;
    if (!axes?.x || !axes?.y) return;

    const scales = this.calculateScales(data, chartArea, axes.x, axes.y);
    if (!scales) return;

    // Draw grid lines if enabled
    if (axes.x.grid || axes.y.grid) {
      this.drawGrid(scales, chartArea, options);
    }

    // Draw each dataset
    data?.datasets.forEach((dataset, datasetIndex) => {
      dataset.data?.forEach(point => {
        const x = this.normalizeValue(point.x);
        const y = this.normalizeValue(point.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;

        const cx = this.mapValueToPixel(x, scales.x, chartArea.left, chartArea.right);
        const cy = this.mapValueToPixel(y, scales.y, chartArea.bottom, chartArea.top, true);
        const radius = (point as ChartPoint).radius || 4;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle =
          (point as ChartPoint).color || dataset.color || this.getDefaultColor(datasetIndex);
        ctx.fill();
      });
    });
  }

  /**
   * Render area chart
   */
  private renderAreaChart(data: ChartData, options: ChartOptions, chartArea: ChartArea): void {
    if (!this.ctx) return;

    const { datasets } = data;
    const axes = options?.axes || {
      x: { type: ChartScaleType.Linear as const },
      y: { type: ChartScaleType.Linear as const },
    };

    // Calculate scales
    const scales = this.calculateScales(data, chartArea, axes.x, axes.y);

    // Draw grid lines if enabled
    if (axes.x.grid || axes.y.grid) {
      this.drawGrid(scales, chartArea, options);
    }

    // Draw each dataset
    datasets.forEach((dataset, datasetIndex) => {
      const points = dataset.data?.map(point => ({
        x: this.normalizeValue(point.x),
        y: this.normalizeValue(point.y),
      }));

      if (points.length === 0 || !this.ctx) return;

      // Draw filled area
      this.ctx.beginPath();
      this.ctx.moveTo(
        this.mapValueToPixel(points[0].x, scales.x, chartArea.left, chartArea.right),
        chartArea.bottom
      );
      this.ctx.lineTo(
        this.mapValueToPixel(points[0].x, scales.x, chartArea.left, chartArea.right),
        this.mapValueToPixel(points[0].y, scales.y, chartArea.bottom, chartArea.top, true)
      );

      for (let i = 1; i < points.length; i++) {
        this.ctx.lineTo(
          this.mapValueToPixel(points[i].x, scales.x, chartArea.left, chartArea.right),
          this.mapValueToPixel(points[i].y, scales.y, chartArea.bottom, chartArea.top, true)
        );
      }

      this.ctx.lineTo(
        this.mapValueToPixel(
          points[points.length - 1].x,
          scales.x,
          chartArea.left,
          chartArea.right
        ),
        chartArea.bottom
      );
      this.ctx.closePath();

      // Create gradient fill
      const gradient = this.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      const color = dataset.color || this.getDefaultColor(datasetIndex);
      gradient.addColorStop(0, this.hexToRgba(color, 0.6));
      gradient.addColorStop(1, this.hexToRgba(color, 0.1));

      this.ctx.fillStyle = gradient;
      this.ctx.fill();
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

    // Use radius from options if provided, otherwise default to 70% of min dimension
    const radius = options?.padding?.right
      ? Math.min(centerX, centerY) * 0.7 - options?.padding.right
      : Math.min(centerX, centerY) * 0.7;

    if (datasets.length === 0 || datasets[0].data?.length === 0) return;

    // Get the first dataset for pie chart
    const dataset = datasets[0];

    // Calculate total value for proportions
    const total = dataset.data?.reduce((sum, point) => sum + point.y, 0);
    if (total <= 0) return;

    // Draw pie slices
    let startAngle = 0;
    dataset.data?.forEach((point, i) => {
      const sliceAngle = (point.y / total) * (Math.PI * 2);
      const endAngle = startAngle + sliceAngle;

      if (this.ctx) {
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        this.ctx.closePath();

        const fillStyle = (point as ChartPoint).color || this.getDefaultColor(i);
        this.setCanvasStyle(fillStyle);
        this.ctx.fill();

        // Draw slice border
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // Draw label if there's enough space (slices > 5% of total)
        if (sliceAngle > 0.1) {
          const labelAngle = startAngle + sliceAngle / 2;
          const labelRadius = radius * 0.7;
          const labelX = centerX + Math.cos(labelAngle) * labelRadius;
          const labelY = centerY + Math.sin(labelAngle) * labelRadius;

          this.ctx.fillStyle = '#fff';
          this.ctx.font = '12px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(point.x.toString(), labelX, labelY);
        }
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
    if (datasets.length === 0 || datasets[0].data?.length === 0) return;

    const centerX = this.canvas.width / (2 * this.resolutionScale);
    const centerY = this.canvas.height / (2 * this.resolutionScale);
    const radius = Math.min(centerX, centerY) * 0.7;

    // Find all unique labels (angles) from all datasets
    const allLabels = new Set<string>();
    datasets.forEach(dataset => {
      dataset.data?.forEach(point => {
        allLabels.add(String(point.x));
      });
    });

    const labels = Array.from(allLabels);
    const angleStep = (Math.PI * 2) / labels.length;

    // Draw background grid (circles and lines)
    this.ctx!.strokeStyle =
      options?.theme === 'dark' ? this.theme.dark.gridColor : this.theme.light.gridColor;
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
      this.ctx!.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
      this.ctx!.stroke();

      // Draw labels
      const labelX = centerX + Math.cos(angle) * (radius + 15);
      const labelY = centerY + Math.sin(angle) * (radius + 15);
      this.ctx!.fillStyle =
        options?.theme === 'dark' ? this.theme.dark.textColor : this.theme.light.textColor;
      this.ctx!.font = '12px Arial';
      this.ctx!.textAlign = 'center';
      this.ctx!.textBaseline = 'middle';
      this.ctx!.fillText(labels[i], labelX, labelY);
    });

    // Find max value for scaling
    const maxValue = datasets.reduce((max, dataset) => {
      const datasetMax = dataset.data?.reduce((m, point) => Math.max(m, point.y), 0);
      return Math.max(max, datasetMax);
    }, 0);

    // Draw each dataset
    datasets.forEach((dataset, datasetIndex) => {
      const dataMap = new Map<string, number>();
      dataset.data?.forEach(point => {
        dataMap.set(String(point.x), point.y);
      });

      // Create points for the radar shape
      const points: { x: number; y: number }[] = [];
      labels.forEach((label, i) => {
        const value = dataMap.get(label) ?? 0;
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
  private renderHeatmapChart(data: ChartData, options: ChartOptions, chartArea: ChartArea): void {
    if (!this.ctx) return;

    const { datasets } = data;
    if (datasets.length === 0 || datasets[0].data?.length === 0) return;

    const axes = options?.axes || {
      x: { type: ChartScaleType.Category as const },
      y: { type: ChartScaleType.Category as const },
    };

    // Use axes in a simple check - doesn't affect functionality but prevents linter warnings
    const axesProvided = Boolean(axes);
    if (!axesProvided && process.env.NODE_ENV === 'development') {
      console.warn('Using default axes configuration for heatmap chart');
    }

    // For heatmap, we need to find all unique x and y values
    const uniqueX = new Set<string>();
    const uniqueY = new Set<string>();

    datasets.forEach(dataset => {
      dataset.data?.forEach(point => {
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
      dataset.data?.forEach(point => {
        const pointData = point as ChartPoint;
        const value = pointData.value !== undefined ? pointData.value : pointData.y;
        if (typeof value === 'number') {
          minValue = Math.min(minValue, value);
          maxValue = Math.max(maxValue, value);
        }
      });
    });

    // Draw grid
    this.ctx.strokeStyle =
      options?.theme === 'dark' ? this.theme.dark.gridColor : this.theme.light.gridColor;
    this.ctx.lineWidth = 0.5;

    // Draw cells
    datasets.forEach(dataset => {
      dataset.data?.forEach(point => {
        if (!this.ctx) return;

        const pointData = point as ChartPoint;
        const xIndex = xValues.indexOf(String(point.x));
        const yIndex = yValues.indexOf(String(point.y));

        if (xIndex === -1 || yIndex === -1) return;

        const value = pointData.value !== undefined ? pointData.value : pointData.y;
        if (typeof value !== 'number') return;

        const normalizedValue = (value - minValue) / (maxValue - minValue);
        const x = chartArea.left + xIndex * cellWidth;
        const y = chartArea.top + yIndex * cellHeight;

        // Generate heatmap color
        this.setCanvasStyle(this.getHeatmapColor(normalizedValue));
        this.ctx.fillRect(x, y, cellWidth, cellHeight);
      });
    });

    // Draw axes with category labels
    this.renderCategoryAxes(xValues, yValues, chartArea, options);
  }

  /**
   * Render axes for charts
   */
  private renderAxes(data: ChartData, options: ChartOptions, chartArea: ChartArea): void {
    const ctx = this.ctx;
    if (!ctx) return;

    const axes = options?.axes;
    if (!axes?.x || !axes?.y) return;

    const scales = this.calculateScales(data, chartArea, axes.x, axes.y);
    if (!scales) return;

    const themeColors = options?.theme === 'dark' ? this.theme.dark : this.theme.light;

    // Draw x-axis line
    ctx.beginPath();
    ctx.moveTo(chartArea.left, chartArea.bottom);
    ctx.lineTo(chartArea.right, chartArea.bottom);
    ctx.strokeStyle = themeColors.axisColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw y-axis line
    ctx.beginPath();
    ctx.moveTo(chartArea.left, chartArea.top);
    ctx.lineTo(chartArea.left, chartArea.bottom);
    ctx.strokeStyle = themeColors.axisColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw x-axis ticks and labels
    const xTickCount = axes.x.tickCount || 5;
    const xStep = (scales.x.max - scales.x.min) / (xTickCount - 1);

    for (let i = 0; i < xTickCount; i++) {
      const value = scales.x.min + i * xStep;
      const x = this.mapValueToPixel(value, scales.x, chartArea.left, chartArea.right);

      // Draw tick
      ctx.beginPath();
      ctx.moveTo(x, chartArea.bottom);
      ctx.lineTo(x, chartArea.bottom + 6);
      ctx.strokeStyle = themeColors.axisColor;
      ctx.stroke();

      // Draw label
      ctx.fillStyle = themeColors.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(
        axes.x.tickFormat ? axes.x.tickFormat(value) : value.toString(),
        x,
        chartArea.bottom + 8
      );
    }

    // Draw y-axis ticks and labels
    const yTickCount = axes.y.tickCount || 5;
    const yStep = (scales.y.max - scales.y.min) / (yTickCount - 1);

    for (let i = 0; i < yTickCount; i++) {
      const value = scales.y.min + i * yStep;
      const y = this.mapValueToPixel(value, scales.y, chartArea.bottom, chartArea.top, true);

      // Draw tick
      ctx.beginPath();
      ctx.moveTo(chartArea.left - 6, y);
      ctx.lineTo(chartArea.left, y);
      ctx.strokeStyle = themeColors.axisColor;
      ctx.stroke();

      // Draw label
      ctx.fillStyle = themeColors.textColor;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        axes.y.tickFormat ? axes.y.tickFormat(value) : value.toString(),
        chartArea.left - 8,
        y
      );
    }

    // Draw axis labels if provided
    if (axes.x.label) {
      ctx.fillStyle = themeColors.textColor;
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(
        axes.x.label,
        (chartArea.left + chartArea.right) / 2,
        this.canvas!.height / this.resolutionScale - 5
      );
    }

    if (axes.y.label) {
      ctx.save();
      ctx.translate(10, (chartArea.top + chartArea.bottom) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = themeColors.textColor;
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(axes.y.label, 0, 0);
      ctx.restore();
    }
  }

  /**
   * Render category axes for heatmap
   */
  private renderCategoryAxes(
    xCategories: string[],
    yCategories: string[],
    chartArea: ChartArea,
    options: ChartOptions
  ): void {
    if (!this.ctx) return;

    const cellWidth = (chartArea.right - chartArea.left) / xCategories.length;
    const cellHeight = (chartArea.bottom - chartArea.top) / yCategories.length;

    // X-axis labels
    this.ctx.fillStyle =
      options?.theme === 'dark' ? this.theme.dark.textColor : this.theme.light.textColor;
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
  private drawGrid(scales: ChartScales, chartArea: ChartArea, options: ChartOptions): void {
    const ctx = this.ctx;
    if (!ctx) return;

    const themeColors = options?.theme === 'dark' ? this.theme.dark : this.theme.light;
    const axes = options?.axes;
    if (!axes?.x || !axes?.y) return;

    // Draw x-axis grid lines
    if (axes.y.grid) {
      const xTickCount = axes.x.tickCount || 5;
      const xStep = (scales.x.max - scales.x.min) / (xTickCount - 1);

      for (let i = 0; i < xTickCount; i++) {
        const value = scales.x.min + i * xStep;
        const x = this.mapValueToPixel(value, scales.x, chartArea.left, chartArea.right);

        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.strokeStyle = themeColors.gridColor;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Draw y-axis grid lines
    if (axes.x.grid) {
      const yTickCount = axes.y.tickCount || 5;
      const yStep = (scales.y.max - scales.y.min) / (yTickCount - 1);

      for (let i = 0; i < yTickCount; i++) {
        const value = scales.y.min + i * yStep;
        const y = this.mapValueToPixel(value, scales.y, chartArea.bottom, chartArea.top, true);

        ctx.beginPath();
        ctx.moveTo(chartArea.left, y);
        ctx.lineTo(chartArea.right, y);
        ctx.strokeStyle = themeColors.gridColor;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  /**
   * Render legend
   */
  private renderLegend(data: ChartData, options: ChartOptions, chartArea: ChartArea): void {
    if (!this.ctx || !this.canvas) return;

    const { datasets } = data;
    const legend: ChartLegend = {
      position: (options?.legend?.position as ChartLegendPosition) || ChartLegendPosition.Top,
      display: options?.legend?.visible || false,
    };

    if (!legend.display || datasets.length === 0) return;

    const padding = 10;
    const itemHeight = 20;
    const itemWidth = 80;
    const itemsPerRow = Math.floor((chartArea.right - chartArea.left) / itemWidth);
    const rows = Math.ceil(datasets.length / itemsPerRow);

    const legendWidth = Math.min(datasets.length, itemsPerRow) * itemWidth;
    const legendHeight = rows * itemHeight;

    let startX, startY;

    switch (legend.position) {
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
      this.ctx!.strokeStyle =
        options?.theme === 'dark' ? this.theme.dark.axisColor : this.theme.light.axisColor;
      this.ctx!.lineWidth = 1;
      this.ctx!.strokeRect(x, y + 4, 12, 12);

      // Draw text
      this.ctx!.fillStyle =
        options?.theme === 'dark' ? this.theme.dark.textColor : this.theme.light.textColor;
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
    this.tooltipElement.style.backgroundColor = options?.theme === 'dark' ? '#333' : '#fff';
    this.tooltipElement.style.color = options?.theme === 'dark' ? '#fff' : '#333';
    this.tooltipElement.style.border = `1px solid ${options?.theme === 'dark' ? '#555' : '#ddd'}`;
    this.tooltipElement.style.padding = '8px';
    this.tooltipElement.style.borderRadius = '4px';
    this.tooltipElement.style.pointerEvents = 'none';
    this.tooltipElement.style.zIndex = '1000';
    this.tooltipElement.style.fontSize = '12px';
    this.tooltipElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';

    container.appendChild(this.tooltipElement);

    // Add event listeners
    this.canvas.addEventListener('mousemove', e =>
      this.handleMouseMove(e, data, options, container)
    );
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

    const chartArea = this.calculateChartArea(options);

    // Only process if mouse is inside chart area
    if (x < chartArea.left || x > chartArea.right || y < chartArea.top || y > chartArea.bottom) {
      this.tooltipElement.style.display = 'none';
      return;
    }

    // Find nearest data point(s) using tooltip options
    const tooltipMode =
      options?.tooltip?.mode === 'nearest' ||
      options?.tooltip?.mode === 'point' ||
      options?.tooltip?.mode === 'dataset'
        ? ChartTooltipMode.Nearest
        : ChartTooltipMode.Index;

    const nearestPoints = this.findNearestPoints(
      x,
      y,
      data,
      options,
      chartArea,
      tooltipMode,
      options?.tooltip?.intersect !== false
    );

    if (nearestPoints.length === 0) {
      this.tooltipElement.style.display = 'none';
      return;
    }

    // Build tooltip content
    let tooltipContent = '';

    nearestPoints.forEach(({ dataset, point, dataIndex }) => {
      const formattedX = point.x instanceof Date ? point.x.toLocaleDateString() : point.x;

      const formattedY =
        typeof point.y === 'number'
          ? point.y.toLocaleString(undefined, { maximumFractionDigits: 2 })
          : point.y;

      if (options?.tooltip?.format) {
        tooltipContent += options?.tooltip.format(point, dataset);
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
    chartArea: ChartArea,
    mode: ChartTooltipMode,
    intersect: boolean
  ): Array<{ dataset: ChartData['datasets'][0]; point: ChartPoint; dataIndex: number }> {
    const { datasets } = data;
    const axes = options?.axes || { x: { type: 'linear' }, y: { type: 'linear' } };
    const scales = this.calculateScales(data, chartArea, axes.x, axes.y);

    const nearestPoints: Array<{
      dataset: ChartData['datasets'][0];
      point: ChartPoint;
      dataIndex: number;
      distance: number;
    }> = [];

    datasets.forEach((dataset, datasetIndex) => {
      dataset.data?.forEach(point => {
        const normalizedX = this.normalizeValue(point.x);
        const normalizedY = this.normalizeValue(point.y);
        const pointX = this.mapValueToPixel(normalizedX, scales.x, chartArea.left, chartArea.right);
        const pointY = this.mapValueToPixel(
          normalizedY,
          scales.y,
          chartArea.bottom,
          chartArea.top,
          true
        );

        // Calculate distance
        const distance = Math.sqrt(Math.pow(mouseX - pointX, 2) + Math.pow(mouseY - pointY, 2));
        const radius = (point as ChartPoint).radius || 4;

        nearestPoints.push({
          dataset,
          point: {
            x: normalizedX,
            y: normalizedY,
            radius,
            color: (point as ChartPoint).color,
            value: (point as ChartPoint).value,
          },
          dataIndex: datasetIndex,
          distance,
        });
      });
    });

    // Sort points by distance and return closest ones based on mode
    const filtered =
      mode === ChartTooltipMode.Nearest
        ? nearestPoints.filter(p => !intersect || p.distance < (p.point.radius ?? 4))
        : nearestPoints;

    return filtered
      .sort((a, b) => a.distance - b.distance)
      .map(({ dataset, point, dataIndex }) => ({ dataset, point, dataIndex }));
  }

  /**
   * Calculate scales for axes
   */
  private calculateScales(
    data: ChartData,
    chartArea: ChartArea,
    xAxis: ChartAxes['x'],
    yAxis: ChartAxes['y']
  ): ChartScales {
    if (!data?.datasets.length) {
      return {
        x: { min: 0, max: 1, type: 'linear' },
        y: { min: 0, max: 1, type: 'linear' },
      };
    }

    const xValues = data?.datasets
      .flatMap(dataset => dataset.data?.map(point => this.normalizeValue(point.x)))
      .filter(value => typeof value === 'number' && isFinite(value));

    const yValues = data?.datasets
      .flatMap(dataset => dataset.data?.map(point => this.normalizeValue(point.y)))
      .filter(value => typeof value === 'number' && isFinite(value));

    const xMin = xValues.length ? Math.min(...xValues) : 0;
    const xMax = xValues.length ? Math.max(...xValues) : 1;
    const yMin = yValues.length ? Math.min(...yValues) : 0;
    const yMax = yValues.length ? Math.max(...yValues) : 1;

    const padding = 0.1;
    const xPadding = (xMax - xMin) * padding;
    const yPadding = (yMax - yMin) * padding;

    return {
      x: {
        min: typeof xAxis.min === 'number' ? xAxis.min : xMin - xPadding,
        max: typeof xAxis.max === 'number' ? xAxis.max : xMax + xPadding,
        type: xAxis.type || 'linear',
      },
      y: {
        min: typeof yAxis.min === 'number' ? yAxis.min : yMin - yPadding,
        max: typeof yAxis.max === 'number' ? yAxis.max : yMax + yPadding,
        type: yAxis.type || 'linear',
      },
    };
  }

  private normalizeValue(
    value: ChartDataPoint['x'] | ChartDataPoint['y'] | null | undefined
  ): number {
    if (value === null || value === undefined) return 0;
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isFinite(parsed) ? parsed : 0;
    }
    return typeof value === 'number' && isFinite(value) ? value : 0;
  }

  /**
   * Map a data value to a pixel position
   */
  private mapValueToPixel(
    value: number,
    scale: ChartScale,
    start: number,
    end: number,
    invert: boolean = false
  ): number {
    const range = end - start;
    const domain = scale.max - scale.min;
    const normalized = (value - scale.min) / domain;
    return invert ? end - normalized * range : start + normalized * range;
  }

  /**
   * Get all unique x values from all datasets
   */
  private getAllXValues(data: ChartData): string[] {
    const allValues = new Set<string>();
    data?.datasets.forEach(dataset => {
      dataset.data?.forEach(point => {
        const value = this.normalizeValue(point.x);
        if (typeof value === 'number' && isFinite(value)) {
          allValues.add(String(value));
        }
      });
    });
    return Array.from(allValues).sort((a, b) => {
      const aNum = parseFloat(a);
      const bNum = parseFloat(b);
      return isFinite(aNum) && isFinite(bNum) ? aNum - bNum : a.localeCompare(b);
    });
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
      '#bab0ab',
    ];
    return colors[index % colors.length];
  }

  /**
   * Convert hex color to rgba for transparency
   */
  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Get color for heatmap based on normalized value
   */
  private getHeatmapColor(value: number): string {
    // Implement a color gradient from blue (cold) to red (hot)
    const hue = ((1 - value) * 240).toString(10);
    return `hsl(${hue}, 100%, 50%)`;
  }

  private calculateChartArea(options: ChartOptions): ChartArea {
    if (!this.canvas) {
      throw new Error('Canvas is not initialized');
    }

    const defaultPadding: ChartPadding = { top: 40, right: 40, bottom: 40, left: 60 };
    const padding: ChartPadding = {
      top: options?.padding?.top ?? defaultPadding.top,
      right: options?.padding?.right ?? defaultPadding.right,
      bottom: options?.padding?.bottom ?? defaultPadding.bottom,
      left: options?.padding?.left ?? defaultPadding.left,
    };

    return {
      top: padding.top,
      right: this.canvas.width / this.resolutionScale - padding.right,
      bottom: this.canvas.height / this.resolutionScale - padding.bottom,
      left: padding.left,
    };
  }

  private setCanvasStyle(style: string | CanvasGradient | CanvasPattern): void {
    if (this.ctx) {
      this.ctx.fillStyle = style;
    }
  }
}
