import React from "react";
import { ChartData, ChartOptions, ChartRenderer, ChartType } from '../Chart';

/**
 * SVG-based chart renderer implementation.
 * Uses SVG for high-quality, interactive charts with moderate datasets.
 */
export class SVGRenderer implements ChartRenderer {
  private svg: SVGSVGElement | null = null;
  private container: HTMLElement | null = null;
  private containerWidth = 0;
  private containerHeight = 0;
  private isInitialized = false;
  private lastRenderTime = 0;
  private tooltipElement: HTMLDivElement | null = null;
  private interactiveElements: SVGElement[] = [];

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

    const startTime = performance.now();

    // Update dimensions if needed
    this.updateDimensions(container);

    // Clear previous content
    while (this.svg?.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }
    this.interactiveElements = [];

    // Set background color
    const themeColors = options.theme === 'dark' ? this.theme.dark : this.theme.light;
    if (options.backgroundColor && options.backgroundColor !== 'transparent') {
      const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      background.setAttribute('width', '100%');
      background.setAttribute('height', '100%');
      background.setAttribute('fill', options.backgroundColor);
      this.svg?.appendChild(background);
    }

    // Calculate chart area with padding
    const padding = options.padding || {};
    const chartArea = {
      left: padding.left || 0,
      right: this.containerWidth - (padding.right || 0),
      top: padding.top || 0,
      bottom: this.containerHeight - (padding.bottom || 0)
    };

    // Create a group for the chart area
    const chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    chartGroup.setAttribute('class', 'chart-area');
    this.svg?.appendChild(chartGroup);

    // Render the chart based on type
    switch (type) {
      case 'line':
        this.renderLineChart(data, options, chartArea, chartGroup);
        break;
      case 'bar':
        this.renderBarChart(data, options, chartArea, chartGroup);
        break;
      case 'scatter':
        this.renderScatterChart(data, options, chartArea, chartGroup);
        break;
      case 'area':
        this.renderAreaChart(data, options, chartArea, chartGroup);
        break;
      case 'pie':
        this.renderPieChart(data, options, chartGroup);
        break;
      case 'radar':
        this.renderRadarChart(data, options, chartGroup);
        break;
      case 'heatmap':
        this.renderHeatmapChart(data, options, chartArea, chartGroup);
        break;
      default:
        throw new Error(`Unsupported chart type: ${type}`);
    }

    // Render axes if needed
    if (type !== 'pie' && type !== 'radar') {
      this.renderAxes(data, options, chartArea, chartGroup);
    }

    // Render legend if enabled
    if (options.legend?.visible) {
      this.renderLegend(data, options, chartArea);
    }

    // Setup tooltips if enabled
    if (options.tooltip?.enabled) {
      this.setupTooltip(container, data, options);
    } else if (this.tooltipElement) {
      this.tooltipElement.remove();
      this.tooltipElement = null;
    }

    this.lastRenderTime = performance.now() - startTime;
  }

  /**
   * Destroys the renderer, cleaning up any resources
   */
  public destroy(): void {
    if (this.svg && this.container) {
      this.container.removeChild(this.svg);
    }

    if (this.tooltipElement) {
      this.tooltipElement.remove();
    }

    this.svg = null;
    this.container = null;
    this.tooltipElement = null;
    this.interactiveElements = [];
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
   * Initialize the SVG renderer
   */
  private initialize(container: HTMLElement, options: ChartOptions): void {
    // Clean existing SVG if any
    const existingSvg = container.querySelector('svg');
    if (existingSvg) {
      container.removeChild(existingSvg);
    }

    // Create new SVG
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    this.svg.style.display = 'block';
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
    
    container.appendChild(this.svg);
    this.container = container;

    // Set dimensions
    this.updateDimensions(container);

    this.isInitialized = true;
  }

  /**
   * Update SVG dimensions based on container size
   */
  private updateDimensions(container: HTMLElement): void {
    if (!this.svg) return;

    const rect = container.getBoundingClientRect();
    this.containerWidth = rect.width;
    this.containerHeight = rect.height;

    this.svg.setAttribute('width', this.containerWidth.toString());
    this.svg.setAttribute('height', this.containerHeight.toString());
    this.svg.setAttribute('viewBox', `0 0 ${this.containerWidth} ${this.containerHeight}`);
  }

  /**
   * Render line chart
   */
  private renderLineChart(
    data: ChartData,
    options: ChartOptions,
    chartArea: any,
    chartGroup: SVGGElement
  ): void {
    const { datasets } = data;
    const xAxis = options.axes?.x || { type: 'linear' };
    const yAxis = options.axes?.y || { type: 'linear' };

    // Calculate scales
    const scales = this.calculateScales(data, chartArea, xAxis, yAxis);

    // Draw grid lines if enabled
    if (xAxis.grid || yAxis.grid) {
      this.drawGrid(scales, chartArea, options, chartGroup);
    }

    // Create a group for each dataset
    datasets.forEach((dataset, datasetIndex) => {
      const datasetGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      datasetGroup.setAttribute('class', `dataset-${datasetIndex}`);
      chartGroup.appendChild(datasetGroup);

      const points: { x: number; y: number }[] = [];

      // Map data points to SVG coordinates
      dataset.data.forEach(point => {
        const x = this.mapValueToPixel(point.x, scales.x, chartArea.left, chartArea.right);
        const y = this.mapValueToPixel(point.y, scales.y, chartArea.bottom, chartArea.top, true);
        points.push({ x, y });
      });

      if (points.length === 0) return;

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

      // Draw data points
      points.forEach((point, i) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', point.x.toString());
        circle.setAttribute('cy', point.y.toString());
        circle.setAttribute('r', '3');
        circle.setAttribute('fill', dataset.color || this.getDefaultColor(datasetIndex));
        
        // Store original data for tooltips
        circle.dataset.index = i.toString();
        circle.dataset.datasetIndex = datasetIndex.toString();
        circle.dataset.x = dataset.data[i].x.toString();
        circle.dataset.y = dataset.data[i].y.toString();
        
        this.interactiveElements.push(circle);
        datasetGroup.appendChild(circle);
      });
    });
  }

  /**
   * Render bar chart
   */
  private renderBarChart(
    data: ChartData,
    options: ChartOptions,
    chartArea: any,
    chartGroup: SVGGElement
  ): void {
    const { datasets } = data;
    const xAxis = options.axes?.x || { type: 'category' };
    const yAxis = options.axes?.y || { type: 'linear' };

    // Calculate scales
    const scales = this.calculateScales(data, chartArea, xAxis, yAxis);

    // Draw grid lines if enabled
    if (xAxis.grid || yAxis.grid) {
      this.drawGrid(scales, chartArea, options, chartGroup);
    }

    // Calculate bar width based on the number of datasets and data points
    const allLabels = this.getAllXValues(data);
    const totalBarGroups = allLabels.length;
    const barGroupWidth = (chartArea.right - chartArea.left) / (totalBarGroups + 1);
    const barWidth = barGroupWidth * 0.8 / datasets.length;

    // Draw each dataset
    datasets.forEach((dataset, datasetIndex) => {
      const datasetGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      datasetGroup.setAttribute('class', `dataset-${datasetIndex}`);
      chartGroup.appendChild(datasetGroup);

      dataset.data.forEach((point, i) => {
        const xIndex = allLabels.indexOf(String(point.x));
        const x = chartArea.left + (xIndex + 1) * barGroupWidth - barGroupWidth * 0.4 + datasetIndex * barWidth;
        const yZero = this.mapValueToPixel(0, scales.y, chartArea.bottom, chartArea.top, true);
        const y = this.mapValueToPixel(point.y, scales.y, chartArea.bottom, chartArea.top, true);

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x.toString());
        rect.setAttribute('y', Math.min(y, yZero).toString());
        rect.setAttribute('width', barWidth.toString());
        rect.setAttribute('height', Math.abs(y - yZero).toString());
        rect.setAttribute('fill', dataset.color || this.getDefaultColor(datasetIndex));
        
        // Store original data for tooltips
        rect.dataset.index = i.toString();
        rect.dataset.datasetIndex = datasetIndex.toString();
        rect.dataset.x = point.x.toString();
        rect.dataset.y = point.y.toString();
        
        this.interactiveElements.push(rect);
        datasetGroup.appendChild(rect);
      });
    });
  }

  /**
   * Render scatter chart
   */
  private renderScatterChart(
    data: ChartData,
    options: ChartOptions,
    chartArea: any,
    chartGroup: SVGGElement
  ): void {
    const { datasets } = data;
    const xAxis = options.axes?.x || { type: 'linear' };
    const yAxis = options.axes?.y || { type: 'linear' };

    // Calculate scales
    const scales = this.calculateScales(data, chartArea, xAxis, yAxis);

    // Draw grid lines if enabled
    if (xAxis.grid || yAxis.grid) {
      this.drawGrid(scales, chartArea, options, chartGroup);
    }

    // Draw each dataset
    datasets.forEach((dataset, datasetIndex) => {
      const datasetGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      datasetGroup.setAttribute('class', `dataset-${datasetIndex}`);
      chartGroup.appendChild(datasetGroup);

      dataset.data.forEach((point, i) => {
        const x = this.mapValueToPixel(point.x, scales.x, chartArea.left, chartArea.right);
        const y = this.mapValueToPixel(point.y, scales.y, chartArea.bottom, chartArea.top, true);
        const radius = point.radius || 5;

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x.toString());
        circle.setAttribute('cy', y.toString());
        circle.setAttribute('r', radius.toString());
        circle.setAttribute('fill', dataset.color || this.getDefaultColor(datasetIndex));
        
        // Store original data for tooltips
        circle.dataset.index = i.toString();
        circle.dataset.datasetIndex = datasetIndex.toString();
        circle.dataset.x = point.x.toString();
        circle.dataset.y = point.y.toString();
        
        this.interactiveElements.push(circle);
        datasetGroup.appendChild(circle);
      });
    });
  }

  /**
   * Render area chart
   */
  private renderAreaChart(
    data: ChartData,
    options: ChartOptions,
    chartArea: any,
    chartGroup: SVGGElement
  ): void {
    const { datasets } = data;
    const xAxis = options.axes?.x || { type: 'linear' };
    const yAxis = options.axes?.y || { type: 'linear' };

    // Calculate scales
    const scales = this.calculateScales(data, chartArea, xAxis, yAxis);

    // Draw grid lines if enabled
    if (xAxis.grid || yAxis.grid) {
      this.drawGrid(scales, chartArea, options, chartGroup);
    }

    // Draw each dataset
    datasets.forEach((dataset, datasetIndex) => {
      const datasetGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      datasetGroup.setAttribute('class', `dataset-${datasetIndex}`);
      chartGroup.appendChild(datasetGroup);

      const points: { x: number; y: number }[] = [];

      // Map data points to SVG coordinates
      dataset.data.forEach(point => {
        const x = this.mapValueToPixel(point.x, scales.x, chartArea.left, chartArea.right);
        const y = this.mapValueToPixel(point.y, scales.y, chartArea.bottom, chartArea.top, true);
        points.push({ x, y });
      });

      if (points.length === 0) return;

      // Create the area path
      const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let pathData = `M ${points[0].x} ${chartArea.bottom}`;
      pathData += ` L ${points[0].x} ${points[0].y}`;

      for (let i = 1; i < points.length; i++) {
        pathData += ` L ${points[i].x} ${points[i].y}`;
      }

      pathData += ` L ${points[points.length - 1].x} ${chartArea.bottom} Z`;

      areaPath.setAttribute('d', pathData);
      
      // Create gradient for area
      const color = dataset.color || this.getDefaultColor(datasetIndex);
      const gradientId = `gradient-${datasetIndex}`;
      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      gradient.setAttribute('id', gradientId);
      gradient.setAttribute('x1', '0');
      gradient.setAttribute('y1', '0');
      gradient.setAttribute('x2', '0');
      gradient.setAttribute('y2', '1');
      
      const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', color);
      stop1.setAttribute('stop-opacity', '0.6');
      
      const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', color);
      stop2.setAttribute('stop-opacity', '0.1');
      
      gradient.appendChild(stop1);
      gradient.appendChild(stop2);
      
      // Add gradient to defs
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.appendChild(gradient);
      datasetGroup.appendChild(defs);
      
      areaPath.setAttribute('fill', `url(#${gradientId})`);
      datasetGroup.appendChild(areaPath);

      // Create the line path
      const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let linePathData = `M ${points[0].x} ${points[0].y}`;

      for (let i = 1; i < points.length; i++) {
        linePathData += ` L ${points[i].x} ${points[i].y}`;
      }

      linePath.setAttribute('d', linePathData);
      linePath.setAttribute('fill', 'none');
      linePath.setAttribute('stroke', color);
      linePath.setAttribute('stroke-width', '2');
      datasetGroup.appendChild(linePath);

      // Draw data points
      points.forEach((point, i) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', point.x.toString());
        circle.setAttribute('cy', point.y.toString());
        circle.setAttribute('r', '3');
        circle.setAttribute('fill', color);
        
        // Store original data for tooltips
        circle.dataset.index = i.toString();
        circle.dataset.datasetIndex = datasetIndex.toString();
        circle.dataset.x = dataset.data[i].x.toString();
        circle.dataset.y = dataset.data[i].y.toString();
        
        this.interactiveElements.push(circle);
        datasetGroup.appendChild(circle);
      });
    });
  }

  /**
   * Render pie chart
   */
  private renderPieChart(
    data: ChartData,
    options: ChartOptions,
    chartGroup: SVGGElement
  ): void {
    const { datasets } = data;
    
    const centerX = this.containerWidth / 2;
    const centerY = this.containerHeight / 2;
    const radius = Math.min(centerX, centerY) * 0.7;

    if (datasets.length === 0 || datasets[0].data.length === 0) return;

    // Get the first dataset for pie chart
    const dataset = datasets[0];
    
    // Calculate total value for proportions
    const total = dataset.data.reduce((sum, point) => sum + point.y, 0);
    if (total <= 0) return;

    // Create a group for the pie
    const pieGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    pieGroup.setAttribute('class', 'pie');
    chartGroup.appendChild(pieGroup);

    // Draw pie slices
    let startAngle = 0;
    dataset.data.forEach((point, i) => {
      const sliceAngle = (point.y / total) * (Math.PI * 2);
      const endAngle = startAngle + sliceAngle;
      
      // Calculate SVG arc path
      const x1 = centerX + Math.cos(startAngle) * radius;
      const y1 = centerY + Math.sin(startAngle) * radius;
      const x2 = centerX + Math.cos(endAngle) * radius;
      const y2 = centerY + Math.sin(endAngle) * radius;
      
      // Use largeArcFlag (0/1) to determine if arc is > 180 degrees
      const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
      
      // Create pie slice
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
      path.setAttribute('d', pathData);
      path.setAttribute('fill', point.color || this.getDefaultColor(i));
      path.setAttribute('stroke', 'white');
      path.setAttribute('stroke-width', '1');
      
      // Store original data for tooltips
      path.dataset.index = i.toString();
      path.dataset.datasetIndex = '0';
      path.dataset.x = point.x.toString();
      path.dataset.y = point.y.toString();
      path.dataset.percentage = ((point.y / total) * 100).toFixed(1);
      
      this.interactiveElements.push(path);
      pieGroup.appendChild(path);

      // Draw label if there's enough space (slices > 5% of total)
      if (sliceAngle > 0.1) {
        const labelAngle = startAngle + sliceAngle / 2;
        const labelRadius = radius * 0.7;
        const labelX = centerX + Math.cos(labelAngle) * labelRadius;
        const labelY = centerY + Math.sin(labelAngle) * labelRadius;

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', labelX.toString());
        text.setAttribute('y', labelY.toString());
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '12px');
        text.textContent = point.x.toString();
        
        pieGroup.appendChild(text);
      }

      startAngle = endAngle;
    });
  }

  /**
   * Render radar chart
   */
  private renderRadarChart(
    data: ChartData,
    options: ChartOptions,
    chartGroup: SVGGElement
  ): void {
    const { datasets } = data;
    
    const centerX = this.containerWidth / 2;
    const centerY = this.containerHeight / 2;
    const radius = Math.min(centerX, centerY) * 0.7;

    if (datasets.length === 0 || datasets[0].data.length === 0) return;

    // Find all unique labels (angles) from all datasets
    const allLabels = new Set<string>();
    datasets.forEach(dataset => {
      dataset.data.forEach(point => {
        allLabels.add(String(point.x));
      });
    });

    const labels = Array.from(allLabels);
    const angleStep = (Math.PI * 2) / labels.length;

    // Create a group for the radar chart
    const radarGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    radarGroup.setAttribute('class', 'radar');
    chartGroup.appendChild(radarGroup);

    // Draw background grid (circles and lines)
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('class', 'grid');
    radarGroup.appendChild(gridGroup);

    const themeColors = options.theme === 'dark' ? this.theme.dark : this.theme.light;

    // Draw circular grid lines
    for (let i = 1; i <= 5; i++) {
      const gridRadius = radius * (i / 5);
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', centerX.toString());
      circle.setAttribute('cy', centerY.toString());
      circle.setAttribute('r', gridRadius.toString());
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', themeColors.gridColor);
      circle.setAttribute('stroke-width', '0.5');
      gridGroup.appendChild(circle);
    }

    // Draw radial grid lines and labels
    labels.forEach((label, i) => {
      const angle = i * angleStep - Math.PI / 2; // Start from top
      
      // Draw grid line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', centerX.toString());
      line.setAttribute('y1', centerY.toString());
      line.setAttribute('x2', (centerX + Math.cos(angle) * radius).toString());
      line.setAttribute('y2', (centerY + Math.sin(angle) * radius).toString());
      line.setAttribute('stroke', themeColors.gridColor);
      line.setAttribute('stroke-width', '0.5');
      gridGroup.appendChild(line);

      // Draw label
      const labelX = centerX + Math.cos(angle) * (radius + 15);
      const labelY = centerY + Math.sin(angle) * (radius + 15);
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', labelX.toString());
      text.setAttribute('y', labelY.toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', themeColors.textColor);
      text.setAttribute('font-size', '12px');
      text.textContent = label;
      
      gridGroup.appendChild(text);
    });

    // Find max value for scaling
    const maxValue = datasets.reduce((max, dataset) => {
      const datasetMax = dataset.data.reduce((m, point) => Math.max(m, point.y), 0);
      return Math.max(max, datasetMax);
    }, 0);

    // Draw each dataset
    datasets.forEach((dataset, datasetIndex) => {
      const datasetGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      datasetGroup.setAttribute('class', `dataset-${datasetIndex}`);
      radarGroup.appendChild(datasetGroup);

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

      // Create the radar shape
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let pathData = `M ${points[0].x} ${points[0].y}`;
      
      for (let i = 1; i < points.length; i++) {
        pathData += ` L ${points[i].x} ${points[i].y}`;
      }
      
      pathData += ' Z'; // Close the path
      
      path.setAttribute('d', pathData);
      
      const color = dataset.color || this.getDefaultColor(datasetIndex);
      path.setAttribute('fill', this.hexToRgba(color, 0.2));
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', '2');
      
      datasetGroup.appendChild(path);
      
      // Draw points
      points.forEach((point, i) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', point.x.toString());
        circle.setAttribute('cy', point.y.toString());
        circle.setAttribute('r', '3');
        circle.setAttribute('fill', color);
        
        // Store original data for tooltips
        const originalValue = dataMap.get(labels[i]) || 0;
        circle.dataset.index = i.toString();
        circle.dataset.datasetIndex = datasetIndex.toString();
        circle.dataset.x = labels[i];
        circle.dataset.y = originalValue.toString();
        
        this.interactiveElements.push(circle);
        datasetGroup.appendChild(circle);
      });
    });
  }

  /**
   * Render heatmap chart
   */
  private renderHeatmapChart(
    data: ChartData,
    options: ChartOptions,
    chartArea: any,
    chartGroup: SVGGElement
  ): void {
    const { datasets } = data;
    
    if (datasets.length === 0 || datasets[0].data.length === 0) return;

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

    // Create a group for the heatmap
    const heatmapGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    heatmapGroup.setAttribute('class', 'heatmap');
    chartGroup.appendChild(heatmapGroup);

    // Draw grid
    const themeColors = options.theme === 'dark' ? this.theme.dark : this.theme.light;
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('class', 'grid');
    heatmapGroup.appendChild(gridGroup);

    // Vertical grid lines
    for (let i = 0; i <= xValues.length; i++) {
      const x = chartArea.left + i * cellWidth;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x.toString());
      line.setAttribute('y1', chartArea.top.toString());
      line.setAttribute('x2', x.toString());
      line.setAttribute('y2', chartArea.bottom.toString());
      line.setAttribute('stroke', themeColors.gridColor);
      line.setAttribute('stroke-width', '0.5');
      gridGroup.appendChild(line);
    }

    // Horizontal grid lines
    for (let i = 0; i <= yValues.length; i++) {
      const y = chartArea.top + i * cellHeight;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', chartArea.left.toString());
      line.setAttribute('y1', y.toString());
      line.setAttribute('x2', chartArea.right.toString());
      line.setAttribute('y2', y.toString());
      line.setAttribute('stroke', themeColors.gridColor);
      line.setAttribute('stroke-width', '0.5');
      gridGroup.appendChild(line);
    }

    // Draw cells
    datasets.forEach((dataset, datasetIndex) => {
      dataset.data.forEach((point, i) => {
        const xIndex = xValues.indexOf(String(point.x));
        const yIndex = yValues.indexOf(String(point.y));
        
        if (xIndex === -1 || yIndex === -1) return;
        
        const value = point.value !== undefined ? point.value : point.y;
        const normalizedValue = (value - minValue) / (maxValue - minValue);
        
        const x = chartArea.left + xIndex * cellWidth;
        const y = chartArea.top + yIndex * cellHeight;
        
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x.toString());
        rect.setAttribute('y', y.toString());
        rect.setAttribute('width', cellWidth.toString());
        rect.setAttribute('height', cellHeight.toString());
        rect.setAttribute('fill', this.getHeatmapColor(normalizedValue));
        
        // Store original data for tooltips
        rect.dataset.index = i.toString();
        rect.dataset.datasetIndex = datasetIndex.toString();
        rect.dataset.x = point.x.toString();
        rect.dataset.y = point.y.toString();
        rect.dataset.value = value.toString();
        
        this.interactiveElements.push(rect);
        heatmapGroup.appendChild(rect);
      });
    });

    // Draw axes labels
    this.renderCategoryAxes(xValues, yValues, chartArea, options, chartGroup);
  }

  /**
   * Render axes for charts
   */
  private renderAxes(
    data: ChartData,
    options: ChartOptions,
    chartArea: any,
    chartGroup: SVGGElement
  ): void {
    const xAxis = options.axes?.x || { type: 'linear' };
    const yAxis = options.axes?.y || { type: 'linear' };
    const scales = this.calculateScales(data, chartArea, xAxis, yAxis);
    const themeColors = options.theme === 'dark' ? this.theme.dark : this.theme.light;

    // Create a group for the axes
    const axesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    axesGroup.setAttribute('class', 'axes');
    chartGroup.appendChild(axesGroup);

    // Draw x-axis
    const xAxisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxisLine.setAttribute('x1', chartArea.left.toString());
    xAxisLine.setAttribute('y1', chartArea.bottom.toString());
    xAxisLine.setAttribute('x2', chartArea.right.toString());
    xAxisLine.setAttribute('y2', chartArea.bottom.toString());
    xAxisLine.setAttribute('stroke', themeColors.axisColor);
    xAxisLine.setAttribute('stroke-width', '1');
    axesGroup.appendChild(xAxisLine);

    // Draw y-axis
    const yAxisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxisLine.setAttribute('x1', chartArea.left.toString());
    yAxisLine.setAttribute('y1', chartArea.top.toString());
    yAxisLine.setAttribute('x2', chartArea.left.toString());
    yAxisLine.setAttribute('y2', chartArea.bottom.toString());
    yAxisLine.setAttribute('stroke', themeColors.axisColor);
    yAxisLine.setAttribute('stroke-width', '1');
    axesGroup.appendChild(yAxisLine);

    // Draw x-axis ticks and labels
    const xTickCount = xAxis.tickCount || 5;
    const xStep = (scales.x.max - scales.x.min) / (xTickCount - 1);

    for (let i = 0; i < xTickCount; i++) {
      const value = scales.x.min + i * xStep;
      const x = this.mapValueToPixel(value, scales.x, chartArea.left, chartArea.right);
      const y = chartArea.bottom;

      // Draw tick
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tick.setAttribute('x1', x.toString());
      tick.setAttribute('y1', y.toString());
      tick.setAttribute('x2', x.toString());
      tick.setAttribute('y2', (y + 5).toString());
      tick.setAttribute('stroke', themeColors.axisColor);
      tick.setAttribute('stroke-width', '1');
      axesGroup.appendChild(tick);

      // Draw label
      let tickLabel = String(value);
      if (xAxis.tickFormat) {
        tickLabel = xAxis.tickFormat(value);
      } else if (xAxis.type === 'time' && value instanceof Date) {
        tickLabel = value.toLocaleDateString();
      }
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x.toString());
      text.setAttribute('y', (y + 15).toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', themeColors.textColor);
      text.setAttribute('font-size', '12px');
      text.textContent = tickLabel;
      
      axesGroup.appendChild(text);
    }

    // Draw y-axis ticks and labels
    const yTickCount = yAxis.tickCount || 5;
    const yStep = (scales.y.max - scales.y.min) / (yTickCount - 1);

    for (let i = 0; i < yTickCount; i++) {
      const value = scales.y.min + i * yStep;
      const x = chartArea.left;
      const y = this.mapValueToPixel(value, scales.y, chartArea.bottom, chartArea.top, true);

      // Draw tick
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tick.setAttribute('x1', x.toString());
      tick.setAttribute('y1', y.toString());
      tick.setAttribute('x2', (x - 5).toString());
      tick.setAttribute('y2', y.toString());
      tick.setAttribute('stroke', themeColors.axisColor);
      tick.setAttribute('stroke-width', '1');
      axesGroup.appendChild(tick);

      // Draw label
      let tickLabel = String(value);
      if (yAxis.tickFormat) {
        tickLabel = yAxis.tickFormat(value);
      }
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', (x - 8).toString());
      text.setAttribute('y', y.toString());
      text.setAttribute('text-anchor', 'end');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', themeColors.textColor);
      text.setAttribute('font-size', '12px');
      text.textContent = tickLabel;
      
      axesGroup.appendChild(text);
    }

    // Draw axis labels if provided
    if (xAxis.label) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', ((chartArea.left + chartArea.right) / 2).toString());
      text.setAttribute('y', (this.containerHeight - 5).toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'bottom');
      text.setAttribute('fill', themeColors.textColor);
      text.setAttribute('font-size', '14px');
      text.setAttribute('font-weight', 'bold');
      text.textContent = xAxis.label;
      
      axesGroup.appendChild(text);
    }

    if (yAxis.label) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('transform', `translate(10, ${(chartArea.top + chartArea.bottom) / 2}) rotate(-90)`);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'bottom');
      text.setAttribute('fill', themeColors.textColor);
      text.setAttribute('font-size', '14px');
      text.setAttribute('font-weight', 'bold');
      text.textContent = yAxis.label;
      
      axesGroup.appendChild(text);
    }
  }

  /**
   * Render category axes for heatmap
   */
  private renderCategoryAxes(
    xCategories: string[],
    yCategories: string[],
    chartArea: any,
    options: ChartOptions,
    chartGroup: SVGGElement
  ): void {
    const cellWidth = (chartArea.right - chartArea.left) / xCategories.length;
    const cellHeight = (chartArea.bottom - chartArea.top) / yCategories.length;
    const themeColors = options.theme === 'dark' ? this.theme.dark : this.theme.light;

    // Create a group for the axes labels
    const labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    labelsGroup.setAttribute('class', 'axis-labels');
    chartGroup.appendChild(labelsGroup);

    // X-axis labels
    xCategories.forEach((category, i) => {
      const x = chartArea.left + (i + 0.5) * cellWidth;
      const y = chartArea.bottom + 15;
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x.toString());
      text.setAttribute('y', y.toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', themeColors.textColor);
      text.setAttribute('font-size', '12px');
      text.textContent = category;
      
      labelsGroup.appendChild(text);
    });

    // Y-axis labels
    yCategories.forEach((category, i) => {
      const x = chartArea.left - 8;
      const y = chartArea.top + (i + 0.5) * cellHeight;
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x.toString());
      text.setAttribute('y', y.toString());
      text.setAttribute('text-anchor', 'end');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', themeColors.textColor);
      text.setAttribute('font-size', '12px');
      text.textContent = category;
      
      labelsGroup.appendChild(text);
    });
  }

  /**
   * Draw grid lines
   */
  private drawGrid(
    scales: any,
    chartArea: any,
    options: ChartOptions,
    chartGroup: SVGGElement
  ): void {
    const xAxis = options.axes?.x || { type: 'linear', grid: true };
    const yAxis = options.axes?.y || { type: 'linear', grid: true };
    const themeColors = options.theme === 'dark' ? this.theme.dark : this.theme.light;
    
    // Create a group for the grid
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('class', 'grid');
    chartGroup.appendChild(gridGroup);

    // Draw x-axis grid lines
    if (yAxis.grid) {
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
    if (xAxis.grid) {
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
   * Render legend
   */
  private renderLegend(data: ChartData, options: ChartOptions, chartArea: any): void {
    if (!this.svg) return;

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
    
    // Create legend group
    const legendGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    legendGroup.setAttribute('class', 'legend');
    this.svg.appendChild(legendGroup);
    
    const themeColors = options.theme === 'dark' ? this.theme.dark : this.theme.light;
    
    // Draw legend items
    datasets.forEach((dataset, i) => {
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;
      const x = startX + col * itemWidth;
      const y = startY + row * itemHeight;
      
      // Draw color box
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x.toString());
      rect.setAttribute('y', (y + 4).toString());
      rect.setAttribute('width', '12');
      rect.setAttribute('height', '12');
      rect.setAttribute('fill', dataset.color || this.getDefaultColor(i));
      rect.setAttribute('stroke', themeColors.axisColor);
      rect.setAttribute('stroke-width', '1');
      
      legendGroup.appendChild(rect);
      
      // Draw text
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', (x + 18).toString());
      text.setAttribute('y', (y + 10).toString());
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', themeColors.textColor);
      text.setAttribute('font-size', '12px');
      text.textContent = dataset.label || `Series ${i + 1}`;
      
      legendGroup.appendChild(text);
    });
  }

  /**
   * Set up tooltip for chart
   */
  private setupTooltip(container: HTMLElement, data: ChartData, options: ChartOptions): void {
    if (!this.svg) return;

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

    // Add event listeners to interactive elements
    this.interactiveElements.forEach(element => {
      // Add events to each data point
      element.addEventListener('mouseenter', (e) => {
        if (!this.tooltipElement) return;
        
        const target = e.target as SVGElement;
        const datasetIndex = parseInt(target.dataset.datasetIndex || '0');
        const index = parseInt(target.dataset.index || '0');
        const x = target.dataset.x || '';
        const y = target.dataset.y || '';
        const dataset = data.datasets[datasetIndex];
        
        // Build tooltip content
        let tooltipContent = '';
        
        if (options.tooltip?.format) {
          const dataPoint = dataset.data[index];
          tooltipContent = options.tooltip.format(dataPoint, dataset);
        } else {
          tooltipContent = `
            <div style="margin-bottom: 4px">
              <span style="font-weight: bold; color: ${dataset.color || this.getDefaultColor(datasetIndex)}">${dataset.label || `Series ${datasetIndex + 1}`}:</span>
              <span>${x}, ${y}</span>
            </div>
          `;
          
          // Show percentage for pie charts
          if (target.dataset.percentage) {
            tooltipContent += `<div>${target.dataset.percentage}%</div>`;
          }
        }
        
        this.tooltipElement.innerHTML = tooltipContent;
        this.tooltipElement.style.display = 'block';
        
        // Position tooltip
        const rect = container.getBoundingClientRect();
        const elementRect = target.getBoundingClientRect();
        const tooltipRect = this.tooltipElement.getBoundingClientRect();
        
        let tooltipX = elementRect.left - rect.left + container.scrollLeft + 10;
        let tooltipY = elementRect.top - rect.top + container.scrollTop + 10;
        
        // Adjust position to ensure tooltip stays within container
        if (tooltipX + tooltipRect.width > container.clientWidth) {
          tooltipX = elementRect.left - rect.left - tooltipRect.width - 10;
        }
        
        if (tooltipY + tooltipRect.height > container.clientHeight) {
          tooltipY = elementRect.top - rect.top - tooltipRect.height - 10;
        }
        
        this.tooltipElement.style.left = `${tooltipX}px`;
        this.tooltipElement.style.top = `${tooltipY}px`;
      });
      
      element.addEventListener('mouseleave', () => {
        if (this.tooltipElement) {
          this.tooltipElement.style.display = 'none';
        }
      });
    });
  }

  /**
   * Calculate scales for axes
   */
  private calculateScales(
    data: ChartData,
    chartArea: any,
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
    value: any,
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