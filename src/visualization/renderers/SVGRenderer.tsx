import { ChartAxes, ChartData, ChartOptions, ChartRenderer, ChartType } from '../Chart';

interface ChartArea {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface Scale {
  min: number;
  max: number;
  type?: 'linear' | 'time';
}

interface ChartScales {
  x: Scale;
  y: Scale;
}

export class SVGRenderer implements ChartRenderer {
  private containerWidth: number;
  private containerHeight: number;
  private interactiveElements: SVGElement[] = [];
  private theme = {
    light: {
      backgroundColor: '#ffffff',
      textColor: '#333333',
      axisColor: '#cccccc',
      gridColor: '#eeeeee',
    },
    dark: {
      backgroundColor: '#333333',
      textColor: '#ffffff',
      axisColor: '#666666',
      gridColor: '#444444',
    },
  };

  constructor() {
    this.containerWidth = 0;
    this.containerHeight = 0;
  }

  public render(
    container: HTMLElement,
    data: ChartData,
    options: ChartOptions,
    type: ChartType
  ): void {
    // Convert theme 'auto' to 'light' for SVG renderer
    const svgOptions = {
      ...options,
      theme: options?.theme === 'auto' ? 'light' : options?.theme || 'light',
    };

    this.containerWidth = typeof svgOptions.width === 'number' ? svgOptions.width : 300;
    this.containerHeight = typeof svgOptions.height === 'number' ? svgOptions.height : 200;

    // Clear existing content
    container.innerHTML = '';
    this.interactiveElements = [];

    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', this.containerWidth.toString());
    svg.setAttribute('height', this.containerHeight.toString());
    container.appendChild(svg);

    // Create chart group
    const chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(chartGroup);

    // Set background color
    const themeColors = svgOptions.theme === 'dark' ? this.theme.dark : this.theme.light;
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    background.setAttribute('width', this.containerWidth.toString());
    background.setAttribute('height', this.containerHeight.toString());
    background.setAttribute('fill', themeColors.backgroundColor);
    chartGroup.appendChild(background);

    // Calculate chart area
    const chartArea: ChartArea = {
      top: 40,
      right: this.containerWidth - 40,
      bottom: this.containerHeight - 40,
      left: 60,
    };

    // Render axes if enabled
    if (svgOptions?.axes) {
      this.renderAxes(data, svgOptions, chartArea, chartGroup);
    }

    // Render data based on chart type
    switch (type) {
      case 'line':
        this.renderLineChart(data, svgOptions, chartArea, chartGroup);
        break;
      case 'scatter':
        this.renderScatterChart(data, svgOptions, chartArea, chartGroup);
        break;
      default:
        console.warn(`Unsupported chart type: ${type}`);
    }
  }

  public update(
    container: HTMLElement,
    data: ChartData,
    options: ChartOptions,
    type: ChartType
  ): void {
    this.render(container, data, options, type);
  }

  public destroy(): void {
    this.interactiveElements = [];
  }

  public getStatus(): { isInitialized: boolean; lastRenderTime?: number } {
    return {
      isInitialized: true,
    };
  }

  private calculateScales(
    data: ChartData,
    chartArea: ChartArea,
    xAxis: ChartAxes['x'],
    yAxis: ChartAxes['y']
  ): ChartScales {
    if (!data?.datasets || data?.datasets.length === 0) {
      return {
        x: { min: 0, max: 1, type: xAxis.type === 'time' ? 'time' : 'linear' },
        y: { min: 0, max: 1, type: yAxis.type === 'log' ? 'linear' : yAxis.type || 'linear' },
      };
    }

    const xValues: number[] = [];
    const yValues: number[] = [];

    data?.datasets.forEach(dataset => {
      dataset.data?.forEach(point => {
        const x = this.normalizeValue(point.x);
        const { y } = point;
        if (Number.isFinite(x) && Number.isFinite(y)) {
          xValues.push(x);
          yValues.push(y);
        }
      });
    });

    if (xValues.length === 0 || yValues.length === 0) {
      return {
        x: { min: 0, max: 1, type: xAxis.type === 'time' ? 'time' : 'linear' },
        y: { min: 0, max: 1, type: 'linear' },
      };
    }

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    return {
      x: {
        min: xMin,
        max: xMax,
        type: xAxis.type === 'time' ? 'time' : 'linear',
      },
      y: {
        min: yMin,
        max: yMax,
        type: 'linear',
      },
    };
  }

  private mapValueToPixel(
    value: number,
    scale: Scale,
    start: number,
    end: number,
    isVertical = false
  ): number {
    if (!Number.isFinite(value) || !Number.isFinite(scale.min) || !Number.isFinite(scale.max)) {
      return 0;
    }

    const range = scale.max - scale.min;
    if (range === 0) {
      return start;
    }

    const normalizedValue = (value - scale.min) / range;
    return isVertical
      ? end - normalizedValue * (end - start)
      : start + normalizedValue * (end - start);
  }

  private normalizeValue(value: unknown): number {
    if (value === null || value === undefined) {
      return 0;
    }
    if (value instanceof Date) {
      return value.getTime();
    }
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    }
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    return 0;
  }

  /**
   * Render line chart
   */
  private renderLineChart(
    data: ChartData,
    options: ChartOptions,
    chartArea: ChartArea,
    chartGroup: SVGGElement
  ): void {
    const axes = options?.axes;
    if (!axes?.x || !axes?.y) {
      return;
    }

    const scales = this.calculateScales(data, chartArea, axes.x, axes.y);
    if (!scales) {
      return;
    }

    const themeColors = options?.theme === 'dark' ? this.theme.dark : this.theme.light;

    // Draw each dataset
    data?.datasets.forEach((dataset, datasetIndex) => {
      const datasetGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      datasetGroup.setAttribute('class', `dataset-${datasetIndex}`);
      datasetGroup.setAttribute('fill', 'none');
      datasetGroup.setAttribute('stroke', dataset.color || this.getDefaultColor(datasetIndex));
      datasetGroup.setAttribute('stroke-width', '2');
      datasetGroup.setAttribute('stroke-linecap', 'round');
      datasetGroup.setAttribute('stroke-linejoin', 'round');

      // Add shadow filter for better visibility based on theme
      if (options?.theme === 'dark') {
        datasetGroup.setAttribute('filter', `drop-shadow(0 0 2px ${themeColors.textColor})`);
      }

      // Add the dataset group to the chart group
      chartGroup.appendChild(datasetGroup);

      const points: { x: number; y: number }[] = [];

      // Map data points to SVG coordinates
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

      if (points.length === 0) {
        return;
      }

      // Create the line path
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let pathData = `M ${points[0].x} ${points[0].y}`;

      for (let i = 1; i < points.length; i++) {
        pathData += ` L ${points[i].x} ${points[i].y}`;
      }

      path.setAttribute('d', pathData);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', dataset.color || this.getDefaultColor(datasetIndex));
      path.setAttribute('stroke-width', '2');

      datasetGroup.appendChild(path);
    });
  }

  /**
   * Render scatter chart
   */
  private renderScatterChart(
    data: ChartData,
    options: ChartOptions,
    chartArea: ChartArea,
    chartGroup: SVGGElement
  ): void {
    const axes = options?.axes;
    if (!axes?.x || !axes?.y) {
      return;
    }

    const scales = this.calculateScales(data, chartArea, axes.x, axes.y);
    if (!scales) {
      return;
    }

    const themeColors = options?.theme === 'dark' ? this.theme.dark : this.theme.light;

    // Draw each dataset
    data?.datasets.forEach((dataset, datasetIndex) => {
      const datasetGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      datasetGroup.setAttribute('class', `dataset-${datasetIndex}`);

      // Add the dataset group to the chart group
      chartGroup.appendChild(datasetGroup);

      // Set default circle style and color based on theme
      const pointColor = dataset.color || this.getDefaultColor(datasetIndex);
      const pointOutline = themeColors.backgroundColor;

      // Draw each point
      dataset.data?.forEach((point, pointIndex) => {
        const x = this.normalizeValue(point.x);
        const y = this.normalizeValue(point.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          return;
        }

        const cx = this.mapValueToPixel(x, scales.x, chartArea.left, chartArea.right);
        const cy = this.mapValueToPixel(y, scales.y, chartArea.bottom, chartArea.top, true);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', String(cx));
        circle.setAttribute('cy', String(cy));
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', pointColor);
        // Add a stroke with the pointOutline color for better visibility
        circle.setAttribute('stroke', pointOutline);
        circle.setAttribute('stroke-width', '1');

        // Store original data for tooltips
        circle.dataset.index = String(pointIndex);
        circle.dataset.datasetIndex = String(datasetIndex);
        circle.dataset.x = String(point.x);
        circle.dataset.y = String(point.y);

        this.interactiveElements.push(circle);
        datasetGroup.appendChild(circle);
      });
    });
  }

  /**
   * Render axes for charts
   */
  private renderAxes(
    data: ChartData,
    options: ChartOptions,
    chartArea: ChartArea,
    chartGroup: SVGGElement
  ): void {
    const axes = options?.axes;
    if (!axes?.x || !axes?.y) {
      return;
    }

    const scales = this.calculateScales(data, chartArea, axes.x, axes.y);
    if (!scales) {
      return;
    }

    const themeColors = options?.theme === 'dark' ? this.theme.dark : this.theme.light;

    // Create a group for axes
    const axesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    axesGroup.setAttribute('class', 'axes');
    chartGroup.appendChild(axesGroup);

    // Draw x-axis ticks and labels
    const xTickCount = axes.x.tickCount || 5;
    const xStep = (scales.x.max - scales.x.min) / (xTickCount - 1);

    for (let i = 0; i < xTickCount; i++) {
      const value = scales.x.min + i * xStep;
      if (!Number.isFinite(value)) {
        continue;
      }

      const x = this.mapValueToPixel(value, scales.x, chartArea.left, chartArea.right);
      const y = chartArea.bottom;

      // Draw tick line
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tick.setAttribute('x1', String(x));
      tick.setAttribute('y1', String(y));
      tick.setAttribute('x2', String(x));
      tick.setAttribute('y2', String(y + 6));
      tick.setAttribute('stroke', themeColors.axisColor || '#000');
      axesGroup.appendChild(tick);

      // Draw label
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', String(x));
      label.setAttribute('y', String(y + 20));
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('fill', themeColors.textColor || '#000');
      label.setAttribute('font-size', '12px');

      let tickLabel = String(value);
      if (axes.x.tickFormat) {
        tickLabel = axes.x.tickFormat(value);
      } else if (axes.x.type === 'time') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          tickLabel = date.toLocaleDateString();
        }
      }

      label.textContent = tickLabel;
      axesGroup.appendChild(label);
    }

    // Draw y-axis ticks and labels
    const yTickCount = axes.y.tickCount || 5;
    const yStep = (scales.y.max - scales.y.min) / (yTickCount - 1);

    for (let i = 0; i < yTickCount; i++) {
      const value = scales.y.min + i * yStep;
      if (!Number.isFinite(value)) {
        continue;
      }

      const x = chartArea.left;
      const y = this.mapValueToPixel(value, scales.y, chartArea.bottom, chartArea.top, true);

      // Draw tick line
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tick.setAttribute('x1', String(x));
      tick.setAttribute('y1', String(y));
      tick.setAttribute('x2', String(x - 6));
      tick.setAttribute('y2', String(y));
      tick.setAttribute('stroke', themeColors.axisColor || '#000');
      axesGroup.appendChild(tick);

      // Draw label
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', String(x - 10));
      label.setAttribute('y', String(y));
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('dominant-baseline', 'middle');
      label.setAttribute('fill', themeColors.textColor || '#000');
      label.setAttribute('font-size', '12px');

      let tickLabel = String(value);
      if (axes.y.tickFormat) {
        tickLabel = axes.y.tickFormat(value);
      }

      label.textContent = tickLabel;
      axesGroup.appendChild(label);
    }

    // Draw axis lines
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', String(chartArea.left));
    xAxis.setAttribute('y1', String(chartArea.bottom));
    xAxis.setAttribute('x2', String(chartArea.right));
    xAxis.setAttribute('y2', String(chartArea.bottom));
    xAxis.setAttribute('stroke', themeColors.axisColor || '#000');
    axesGroup.appendChild(xAxis);

    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', String(chartArea.left));
    yAxis.setAttribute('y1', String(chartArea.top));
    yAxis.setAttribute('x2', String(chartArea.left));
    yAxis.setAttribute('y2', String(chartArea.bottom));
    yAxis.setAttribute('stroke', themeColors.axisColor || '#000');
    axesGroup.appendChild(yAxis);

    // Draw axis labels if provided
    if (axes.x.label) {
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', String((chartArea.left + chartArea.right) / 2));
      label.setAttribute('y', String(chartArea.bottom + 40));
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('fill', themeColors.textColor || '#000');
      label.setAttribute('font-size', '14px');
      label.setAttribute('font-weight', 'bold');
      label.textContent = axes.x.label;
      axesGroup.appendChild(label);
    }

    if (axes.y.label) {
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      const x = chartArea.left - 40;
      const y = (chartArea.top + chartArea.bottom) / 2;
      label.setAttribute('x', String(x));
      label.setAttribute('y', String(y));
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('transform', `rotate(-90, ${x}, ${y})`);
      label.setAttribute('fill', themeColors.textColor || '#000');
      label.setAttribute('font-size', '14px');
      label.setAttribute('font-weight', 'bold');
      label.textContent = axes.y.label;
      axesGroup.appendChild(label);
    }
  }

  /**
   * Draw grid lines
   */
  private drawGrid(
    scales: ChartScales,
    chartArea: ChartArea,
    options: ChartOptions,
    chartGroup: SVGGElement
  ): void {
    const xAxis = options?.axes?.x || { type: 'linear', grid: true };
    const yAxis = options?.axes?.y || { type: 'linear', grid: true };
    const themeColors = options?.theme === 'dark' ? this.theme.dark : this.theme.light;

    // Create a group for the grid
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('class', 'grid');
    chartGroup.appendChild(gridGroup);

    // Draw x-axis grid lines
    if (yAxis?.grid) {
      const xTickCount = xAxis.tickCount || 5;
      const xStep = (scales.x.max - scales.x.min) / (xTickCount - 1);

      for (let i = 0; i < xTickCount; i++) {
        const value = scales.x.min + i * xStep;
        const x = this.mapValueToPixel(value, scales.x, chartArea.left, chartArea.right);

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x.toString());
        line.setAttribute('y1', chartArea.top.toString());
        line.setAttribute('x2', x.toString());
        line.setAttribute('y2', chartArea.bottom.toString());
        line.setAttribute('stroke', themeColors.gridColor);
        line.setAttribute('stroke-width', '0.5');

        gridGroup.appendChild(line);
      }
    }

    // Draw y-axis grid lines
    if (xAxis?.grid) {
      const yTickCount = yAxis.tickCount || 5;
      const yStep = (scales.y.max - scales.y.min) / (yTickCount - 1);

      for (let i = 0; i < yTickCount; i++) {
        const value = scales.y.min + i * yStep;
        const y = this.mapValueToPixel(value, scales.y, chartArea.bottom, chartArea.top, true);

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', chartArea.left.toString());
        line.setAttribute('y1', y.toString());
        line.setAttribute('x2', chartArea.right.toString());
        line.setAttribute('y2', y.toString());
        line.setAttribute('stroke', themeColors.gridColor);
        line.setAttribute('stroke-width', '0.5');

        gridGroup.appendChild(line);
      }
    }
  }

  /**
   * Get a default color based on index
   */
  private getDefaultColor(index: number): string {
    const defaultColor = '#4285F4';
    if (typeof index !== 'number' || !isFinite(index)) {
      return defaultColor;
    }
    const colors = [
      '#4285F4', // Google Blue
      '#34A853', // Google Green
      '#FBBC05', // Google Yellow
      '#EA4335', // Google Red
      '#673AB7', // Deep Purple
      '#3F51B5', // Indigo
      '#2196F3', // Blue
      '#03A9F4', // Light Blue
      '#00BCD4', // Cyan
      '#009688', // Teal
    ];
    return colors[index % colors.length] || defaultColor;
  }
}
