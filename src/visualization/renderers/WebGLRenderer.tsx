import { ChartData, ChartOptions, ChartRenderer, ChartType } from '../Chart';

/**
 * WebGL-based chart renderer implementation.
 * Uses WebGL for high-performance rendering of charts with very large datasets.
 */
export class WebGLRenderer implements ChartRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | null = null;
  private containerWidth = 0;
  private containerHeight = 0;
  private resolutionScale = window.devicePixelRatio || 1;
  private isInitialized = false;
  private lastRenderTime = 0;
  private tooltipElement: HTMLDivElement | null = null;
  private shaders: Map<string, { program: WebGLProgram; attributes: Map<string, number>; uniforms: Map<string, WebGLUniformLocation> }> = new Map();
  private svgCanvas: SVGSVGElement | null = null; // SVG layer for text and axes
  
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

  private buffers: {
    points?: {
      position: WebGLBuffer | null;
      color: WebGLBuffer | null;
      indices: WebGLBuffer | null;
      count: number;
    };
    lines?: {
      position: WebGLBuffer | null;
      color: WebGLBuffer | null;
      indices: WebGLBuffer | null;
      count: number;
    };
  } = {};

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

    // Clear canvas
    if (this.gl) {
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    // Clear SVG layer
    if (this.svgCanvas) {
      while (this.svgCanvas.firstChild) {
        this.svgCanvas.removeChild(this.svgCanvas.firstChild);
      }
    }

    // Calculate chart area with padding
    const padding = options.padding || {};
    const chartArea = {
      left: padding.left || 0,
      right: this.containerWidth - (padding.right || 0),
      top: padding.top || 0,
      bottom: this.containerHeight - (padding.bottom || 0)
    };

    // Render the chart based on type
    try {
      switch (type) {
        case 'line':
          this.renderLineChart(data, options, chartArea);
          break;
        case 'scatter':
          this.renderScatterChart(data, options, chartArea);
          break;
        case 'area':
          this.renderAreaChart(data, options, chartArea);
          break;
        case 'bar':
        case 'pie':
        case 'radar':
        case 'heatmap':
          // For chart types not optimized for WebGL, fall back to SVG rendering
          this.renderFallbackChart(data, options, type, chartArea);
          break;
        default:
          throw new Error(`Unsupported chart type: ${type}`);
      }

      // Render axes and other SVG elements
      if (type !== 'pie' && type !== 'radar') {
        this.renderAxes(data, options, chartArea);
      }

      // Render legend if enabled
      if (options.legend?.visible) {
        this.renderLegend(data, options, chartArea);
      }

      // Setup tooltips if enabled
      if (options.tooltip?.enabled) {
        this.setupTooltip(container, data, options, chartArea);
      } else if (this.tooltipElement) {
        this.tooltipElement.remove();
        this.tooltipElement = null;
      }
    } catch (error) {
      console.error('WebGL rendering error:', error);
      // Fall back to SVG rendering if WebGL fails
      this.renderFallbackChart(data, options, type, chartArea);
    }

    this.lastRenderTime = performance.now() - startTime;
  }

  /**
   * Destroys the renderer, cleaning up any resources
   */
  public destroy(): void {
    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }

    if (this.svgCanvas && this.svgCanvas.parentElement) {
      this.svgCanvas.parentElement.removeChild(this.svgCanvas);
    }

    if (this.tooltipElement) {
      this.tooltipElement.remove();
    }

    // Delete WebGL resources
    if (this.gl) {
      // Delete shaders
      for (const shader of this.shaders.values()) {
        this.gl.deleteProgram(shader.program);
      }

      // Delete buffers
      if (this.buffers.points) {
        this.gl.deleteBuffer(this.buffers.points.position);
        this.gl.deleteBuffer(this.buffers.points.color);
        this.gl.deleteBuffer(this.buffers.points.indices);
      }

      if (this.buffers.lines) {
        this.gl.deleteBuffer(this.buffers.lines.position);
        this.gl.deleteBuffer(this.buffers.lines.color);
        this.gl.deleteBuffer(this.buffers.lines.indices);
      }
    }

    this.canvas = null;
    this.gl = null;
    this.svgCanvas = null;
    this.tooltipElement = null;
    this.isInitialized = false;
    this.shaders.clear();
    this.buffers = {};
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
   * Initialize the WebGL renderer
   */
  private initialize(container: HTMLElement, options: ChartOptions): void {
    // Clean existing elements if any
    const existingCanvas = container.querySelector('canvas');
    if (existingCanvas) {
      container.removeChild(existingCanvas);
    }

    const existingSvg = container.querySelector('svg');
    if (existingSvg) {
      container.removeChild(existingSvg);
    }

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    container.appendChild(this.canvas);

    // Get WebGL context
    this.gl = this.canvas.getContext('webgl', {
      antialias: true,
      alpha: true,
      premultipliedAlpha: false
    });

    if (!this.gl) {
      throw new Error('WebGL is not supported by your browser');
    }

    // Create SVG layer for text and axes (on top of WebGL)
    this.svgCanvas = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgCanvas.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    this.svgCanvas.style.position = 'absolute';
    this.svgCanvas.style.top = '0';
    this.svgCanvas.style.left = '0';
    this.svgCanvas.style.width = '100%';
    this.svgCanvas.style.height = '100%';
    this.svgCanvas.style.pointerEvents = 'none'; // Allow clicks to pass through
    container.appendChild(this.svgCanvas);

    // Make sure container has position relative
    if (getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }

    // Set dimensions
    this.updateDimensions(container);

    // Initialize shaders
    this.initShaders();

    this.isInitialized = true;
  }

  /**
   * Update canvas dimensions based on container size
   */
  private updateDimensions(container: HTMLElement): void {
    if (!this.canvas || !this.gl || !this.svgCanvas) return;

    const rect = container.getBoundingClientRect();
    this.containerWidth = rect.width;
    this.containerHeight = rect.height;

    // Set canvas dimensions with higher resolution for retina displays
    this.canvas.width = this.containerWidth * this.resolutionScale;
    this.canvas.height = this.containerHeight * this.resolutionScale;

    // Set SVG dimensions
    this.svgCanvas.setAttribute('width', this.containerWidth.toString());
    this.svgCanvas.setAttribute('height', this.containerHeight.toString());
    this.svgCanvas.setAttribute('viewBox', `0 0 ${this.containerWidth} ${this.containerHeight}`);

    // Update WebGL viewport
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Initialize WebGL shaders
   */
  private initShaders(): void {
    if (!this.gl) return;

    // Point shader program
    const pointVsSource = `
      attribute vec2 a_position;
      attribute vec4 a_color;
      
      uniform vec2 u_resolution;
      uniform float u_pointSize;
      
      varying vec4 v_color;
      
      void main() {
        // Convert position from pixels to clip space
        vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
        
        // Flip y axis (WebGL has y=1 at the top)
        gl_Position = vec4(clipSpace.x, -clipSpace.y, 0, 1);
        gl_PointSize = u_pointSize;
        
        v_color = a_color;
      }
    `;

    const pointFsSource = `
      precision mediump float;
      
      varying vec4 v_color;
      
      void main() {
        // Create circular points
        vec2 center = gl_PointCoord - vec2(0.5, 0.5);
        float dist = length(center);
        
        if (dist > 0.5) {
          discard;
        }
        
        gl_FragColor = v_color;
      }
    `;

    // Line shader program
    const lineVsSource = `
      attribute vec2 a_position;
      attribute vec4 a_color;
      
      uniform vec2 u_resolution;
      
      varying vec4 v_color;
      
      void main() {
        // Convert position from pixels to clip space
        vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
        
        // Flip y axis (WebGL has y=1 at the top)
        gl_Position = vec4(clipSpace.x, -clipSpace.y, 0, 1);
        
        v_color = a_color;
      }
    `;

    const lineFsSource = `
      precision mediump float;
      
      varying vec4 v_color;
      
      void main() {
        gl_FragColor = v_color;
      }
    `;

    // Area shader program
    const areaVsSource = `
      attribute vec2 a_position;
      attribute vec4 a_color;
      
      uniform vec2 u_resolution;
      
      varying vec4 v_color;
      varying vec2 v_position;
      
      void main() {
        // Convert position from pixels to clip space
        vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
        
        // Flip y axis (WebGL has y=1 at the top)
        gl_Position = vec4(clipSpace.x, -clipSpace.y, 0, 1);
        
        v_color = a_color;
        v_position = a_position;
      }
    `;

    const areaFsSource = `
      precision mediump float;
      
      varying vec4 v_color;
      varying vec2 v_position;
      
      uniform float u_baseline;
      
      void main() {
        // Calculate opacity based on distance from baseline
        float alpha = 1.0 - (abs(v_position.y - u_baseline) / 300.0);
        alpha = clamp(alpha, 0.1, 0.6);
        
        gl_FragColor = vec4(v_color.rgb, v_color.a * alpha);
      }
    `;

    // Compile and link shaders
    const pointProgram = this.createShaderProgram(pointVsSource, pointFsSource);
    const lineProgram = this.createShaderProgram(lineVsSource, lineFsSource);
    const areaProgram = this.createShaderProgram(areaVsSource, areaFsSource);

    if (!pointProgram || !lineProgram || !areaProgram) {
      throw new Error('Failed to create shader programs');
    }

    // Point shader attributes and uniforms
    const pointAttributes = new Map<string, number>();
    const pointUniforms = new Map<string, WebGLUniformLocation>();

    pointAttributes.set('a_position', this.gl.getAttribLocation(pointProgram, 'a_position'));
    pointAttributes.set('a_color', this.gl.getAttribLocation(pointProgram, 'a_color'));
    
    const pointResolutionUniform = this.gl.getUniformLocation(pointProgram, 'u_resolution');
    const pointSizeUniform = this.gl.getUniformLocation(pointProgram, 'u_pointSize');
    
    if (pointResolutionUniform && pointSizeUniform) {
      pointUniforms.set('u_resolution', pointResolutionUniform);
      pointUniforms.set('u_pointSize', pointSizeUniform);
    }

    // Line shader attributes and uniforms
    const lineAttributes = new Map<string, number>();
    const lineUniforms = new Map<string, WebGLUniformLocation>();

    lineAttributes.set('a_position', this.gl.getAttribLocation(lineProgram, 'a_position'));
    lineAttributes.set('a_color', this.gl.getAttribLocation(lineProgram, 'a_color'));
    
    const lineResolutionUniform = this.gl.getUniformLocation(lineProgram, 'u_resolution');
    
    if (lineResolutionUniform) {
      lineUniforms.set('u_resolution', lineResolutionUniform);
    }

    // Area shader attributes and uniforms
    const areaAttributes = new Map<string, number>();
    const areaUniforms = new Map<string, WebGLUniformLocation>();

    areaAttributes.set('a_position', this.gl.getAttribLocation(areaProgram, 'a_position'));
    areaAttributes.set('a_color', this.gl.getAttribLocation(areaProgram, 'a_color'));
    
    const areaResolutionUniform = this.gl.getUniformLocation(areaProgram, 'u_resolution');
    const areaBaselineUniform = this.gl.getUniformLocation(areaProgram, 'u_baseline');
    
    if (areaResolutionUniform && areaBaselineUniform) {
      areaUniforms.set('u_resolution', areaResolutionUniform);
      areaUniforms.set('u_baseline', areaBaselineUniform);
    }

    // Store shader programs
    this.shaders.set('point', { program: pointProgram, attributes: pointAttributes, uniforms: pointUniforms });
    this.shaders.set('line', { program: lineProgram, attributes: lineAttributes, uniforms: lineUniforms });
    this.shaders.set('area', { program: areaProgram, attributes: areaAttributes, uniforms: areaUniforms });
  }

  /**
   * Create a WebGL shader program
   */
  private createShaderProgram(vsSource: string, fsSource: string): WebGLProgram | null {
    if (!this.gl) return null;

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fsSource);

    if (!vertexShader || !fragmentShader) {
      return null;
    }

    const program = this.gl.createProgram();
    if (!program) {
      return null;
    }

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Unable to link shader program:', this.gl.getProgramInfoLog(program));
      this.gl.deleteProgram(program);
      return null;
    }

    return program;
  }

  /**
   * Compile a WebGL shader
   */
  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;

    const shader = this.gl.createShader(type);
    if (!shader) {
      return null;
    }

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Error compiling shader:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * Render line chart using WebGL
   */
  private renderLineChart(data: ChartData, options: ChartOptions, chartArea: any): void {
    if (!this.gl) return;

    const { datasets } = data;
    const xAxis = options.axes?.x || { type: 'linear' };
    const yAxis = options.axes?.y || { type: 'linear' };

    // Calculate scales
    const scales = this.calculateScales(data, chartArea, xAxis, yAxis);

    // Prepare WebGL buffers
    const lineVertices: number[] = [];
    const lineColors: number[] = [];
    const lineIndices: number[] = [];
    
    const pointVertices: number[] = [];
    const pointColors: number[] = [];
    const pointIndices: number[] = [];

    let lineIndexOffset = 0;
    let pointIndexOffset = 0;

    // Process each dataset
    datasets.forEach((dataset, datasetIndex) => {
      if (dataset.data.length === 0) return;

      // Parse color
      const colorStr = dataset.color || this.getDefaultColor(datasetIndex);
      const color = this.parseColor(colorStr);

      // Map data points to screen coordinates
      const points: { x: number; y: number }[] = [];
      dataset.data.forEach(point => {
        const x = this.mapValueToPixel(point.x, scales.x, chartArea.left, chartArea.right);
        const y = this.mapValueToPixel(point.y, scales.y, chartArea.bottom, chartArea.top, true);
        points.push({ x, y });
      });

      // Add line vertices
      for (let i = 0; i < points.length; i++) {
        const { x, y } = points[i];
        
        // Add to line vertices
        lineVertices.push(x * this.resolutionScale, y * this.resolutionScale);
        lineColors.push(color.r, color.g, color.b, color.a);
        
        // Add to point vertices
        pointVertices.push(x * this.resolutionScale, y * this.resolutionScale);
        pointColors.push(color.r, color.g, color.b, color.a);
        
        // Add point indices
        pointIndices.push(pointIndexOffset + i);
        
        // Add line indices (connect points)
        if (i < points.length - 1) {
          lineIndices.push(lineIndexOffset + i, lineIndexOffset + i + 1);
        }
      }

      lineIndexOffset += points.length;
      pointIndexOffset += points.length;
    });

    // Create and bind buffers
    if (lineVertices.length > 0) {
      // Line buffers
      const linePositionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, linePositionBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(lineVertices), this.gl.STATIC_DRAW);

      const lineColorBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, lineColorBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(lineColors), this.gl.STATIC_DRAW);

      const lineIndexBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, lineIndexBuffer);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lineIndices), this.gl.STATIC_DRAW);

      this.buffers.lines = {
        position: linePositionBuffer,
        color: lineColorBuffer,
        indices: lineIndexBuffer,
        count: lineIndices.length
      };

      // Point buffers
      const pointPositionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, pointPositionBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(pointVertices), this.gl.STATIC_DRAW);

      const pointColorBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, pointColorBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(pointColors), this.gl.STATIC_DRAW);

      const pointIndexBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, pointIndexBuffer);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(pointIndices), this.gl.STATIC_DRAW);

      this.buffers.points = {
        position: pointPositionBuffer,
        color: pointColorBuffer,
        indices: pointIndexBuffer,
        count: pointIndices.length
      };

      // Draw lines
      this.drawLines();
      
      // Draw points
      this.drawPoints();
    }
  }

  /**
   * Render scatter chart using WebGL
   */
  private renderScatterChart(data: ChartData, options: ChartOptions, chartArea: any): void {
    if (!this.gl) return;

    const { datasets } = data;
    const xAxis = options.axes?.x || { type: 'linear' };
    const yAxis = options.axes?.y || { type: 'linear' };

    // Calculate scales
    const scales = this.calculateScales(data, chartArea, xAxis, yAxis);

    // Prepare WebGL buffers
    const pointVertices: number[] = [];
    const pointColors: number[] = [];
    const pointIndices: number[] = [];

    let pointIndexOffset = 0;

    // Process each dataset
    datasets.forEach((dataset, datasetIndex) => {
      if (dataset.data.length === 0) return;

      // Parse color
      const colorStr = dataset.color || this.getDefaultColor(datasetIndex);
      const color = this.parseColor(colorStr);

      // Map data points to screen coordinates
      dataset.data.forEach((point, i) => {
        const x = this.mapValueToPixel(point.x, scales.x, chartArea.left, chartArea.right);
        const y = this.mapValueToPixel(point.y, scales.y, chartArea.bottom, chartArea.top, true);
        
        // Add to point vertices
        pointVertices.push(x * this.resolutionScale, y * this.resolutionScale);
        pointColors.push(color.r, color.g, color.b, color.a);
        
        // Add point indices
        pointIndices.push(pointIndexOffset + i);
      });

      pointIndexOffset += dataset.data.length;
    });

    // Create and bind buffers
    if (pointVertices.length > 0) {
      // Point buffers
      const pointPositionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, pointPositionBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(pointVertices), this.gl.STATIC_DRAW);

      const pointColorBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, pointColorBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(pointColors), this.gl.STATIC_DRAW);

      const pointIndexBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, pointIndexBuffer);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(pointIndices), this.gl.STATIC_DRAW);

      this.buffers.points = {
        position: pointPositionBuffer,
        color: pointColorBuffer,
        indices: pointIndexBuffer,
        count: pointIndices.length
      };

      // Draw points with larger size
      this.drawPoints(5.0);
    }
  }

  /**
   * Render area chart using WebGL
   */
  private renderAreaChart(data: ChartData, options: ChartOptions, chartArea: any): void {
    if (!this.gl) return;

    const { datasets } = data;
    const xAxis = options.axes?.x || { type: 'linear' };
    const yAxis = options.axes?.y || { type: 'linear' };

    // Calculate scales
    const scales = this.calculateScales(data, chartArea, xAxis, yAxis);
    const baseline = chartArea.bottom * this.resolutionScale; // For gradient calculation

    // Prepare WebGL buffers
    const areaVertices: number[] = [];
    const areaColors: number[] = [];
    const areaIndices: number[] = [];
    
    const lineVertices: number[] = [];
    const lineColors: number[] = [];
    const lineIndices: number[] = [];
    
    const pointVertices: number[] = [];
    const pointColors: number[] = [];
    const pointIndices: number[] = [];

    let areaIndexOffset = 0;
    let lineIndexOffset = 0;
    let pointIndexOffset = 0;

    // Process each dataset
    datasets.forEach((dataset, datasetIndex) => {
      if (dataset.data.length < 2) return;

      // Parse color
      const colorStr = dataset.color || this.getDefaultColor(datasetIndex);
      const color = this.parseColor(colorStr);
      
      // Map data points to screen coordinates
      const points: { x: number; y: number }[] = [];
      dataset.data.forEach(point => {
        const x = this.mapValueToPixel(point.x, scales.x, chartArea.left, chartArea.right);
        const y = this.mapValueToPixel(point.y, scales.y, chartArea.bottom, chartArea.top, true);
        points.push({ x, y });
      });

      // Create area triangles (using triangle strip)
      for (let i = 0; i < points.length; i++) {
        const { x, y } = points[i];
        
        // Add top vertices (data points)
        areaVertices.push(x * this.resolutionScale, y * this.resolutionScale);
        areaColors.push(color.r, color.g, color.b, 0.6); // Semi-transparent for gradient
        
        // Add bottom vertices (baseline)
        areaVertices.push(x * this.resolutionScale, chartArea.bottom * this.resolutionScale);
        areaColors.push(color.r, color.g, color.b, 0.1); // More transparent at bottom
        
        // Add indices for triangle strip
        if (i < points.length - 1) {
          // Create two triangles for each segment
          const topLeft = areaIndexOffset + i * 2;
          const bottomLeft = topLeft + 1;
          const topRight = topLeft + 2;
          const bottomRight = topRight + 1;
          
          // First triangle
          areaIndices.push(topLeft, bottomLeft, topRight);
          
          // Second triangle
          areaIndices.push(topRight, bottomLeft, bottomRight);
        }
        
        // Add to line and point buffers for the top line and points
        lineVertices.push(x * this.resolutionScale, y * this.resolutionScale);
        lineColors.push(color.r, color.g, color.b, 1.0); // Solid color for line
        
        pointVertices.push(x * this.resolutionScale, y * this.resolutionScale);
        pointColors.push(color.r, color.g, color.b, 1.0); // Solid color for points
        
        // Add point indices
        pointIndices.push(pointIndexOffset + i);
        
        // Add line indices (connect points)
        if (i < points.length - 1) {
          lineIndices.push(lineIndexOffset + i, lineIndexOffset + i + 1);
        }
      }

      areaIndexOffset += points.length * 2;
      lineIndexOffset += points.length;
      pointIndexOffset += points.length;
    });

    // Create and bind buffers
    if (areaVertices.length > 0) {
      // Area buffers
      const areaPositionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, areaPositionBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(areaVertices), this.gl.STATIC_DRAW);

      const areaColorBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, areaColorBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(areaColors), this.gl.STATIC_DRAW);

      const areaIndexBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, areaIndexBuffer);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(areaIndices), this.gl.STATIC_DRAW);

      // Line buffers
      const linePositionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, linePositionBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(lineVertices), this.gl.STATIC_DRAW);

      const lineColorBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, lineColorBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(lineColors), this.gl.STATIC_DRAW);

      const lineIndexBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, lineIndexBuffer);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lineIndices), this.gl.STATIC_DRAW);

      // Point buffers
      const pointPositionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, pointPositionBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(pointVertices), this.gl.STATIC_DRAW);

      const pointColorBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, pointColorBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(pointColors), this.gl.STATIC_DRAW);

      const pointIndexBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, pointIndexBuffer);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(pointIndices), this.gl.STATIC_DRAW);

      // Store buffers
      this.buffers = {
        lines: {
          position: linePositionBuffer,
          color: lineColorBuffer,
          indices: lineIndexBuffer,
          count: lineIndices.length
        },
        points: {
          position: pointPositionBuffer,
          color: pointColorBuffer,
          indices: pointIndexBuffer,
          count: pointIndices.length
        }
      };

      // Enable blending for transparent areas
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

      // Draw fill areas using area shader
      const areaShader = this.shaders.get('area');
      if (areaShader) {
        this.gl.useProgram(areaShader.program);
        
        // Set uniforms
        if (areaShader.uniforms.has('u_resolution')) {
          this.gl.uniform2f(
            areaShader.uniforms.get('u_resolution')!,
            this.canvas!.width,
            this.canvas!.height
          );
        }
        
        if (areaShader.uniforms.has('u_baseline')) {
          this.gl.uniform1f(
            areaShader.uniforms.get('u_baseline')!,
            baseline
          );
        }
        
        // Set vertex attributes
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, areaPositionBuffer);
        this.gl.vertexAttribPointer(
          areaShader.attributes.get('a_position')!,
          2, // size (x, y)
          this.gl.FLOAT, // type
          false, // normalize
          0, // stride
          0 // offset
        );
        this.gl.enableVertexAttribArray(areaShader.attributes.get('a_position')!);
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, areaColorBuffer);
        this.gl.vertexAttribPointer(
          areaShader.attributes.get('a_color')!,
          4, // size (r, g, b, a)
          this.gl.FLOAT, // type
          false, // normalize
          0, // stride
          0 // offset
        );
        this.gl.enableVertexAttribArray(areaShader.attributes.get('a_color')!);
        
        // Draw triangles
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, areaIndexBuffer);
        this.gl.drawElements(
          this.gl.TRIANGLES,
          areaIndices.length,
          this.gl.UNSIGNED_SHORT,
          0
        );
      }

      // Draw lines
      this.drawLines();
      
      // Draw points
      this.drawPoints();
    }
  }

  /**
   * Draw lines using the line shader
   */
  private drawLines(): void {
    if (!this.gl || !this.buffers.lines) return;

    const lineShader = this.shaders.get('line');
    if (!lineShader) return;

    this.gl.useProgram(lineShader.program);
    
    // Set uniforms
    if (lineShader.uniforms.has('u_resolution')) {
      this.gl.uniform2f(
        lineShader.uniforms.get('u_resolution')!,
        this.canvas!.width,
        this.canvas!.height
      );
    }
    
    // Set vertex attributes
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.lines.position!);
    this.gl.vertexAttribPointer(
      lineShader.attributes.get('a_position')!,
      2, // size (x, y)
      this.gl.FLOAT, // type
      false, // normalize
      0, // stride
      0 // offset
    );
    this.gl.enableVertexAttribArray(lineShader.attributes.get('a_position')!);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.lines.color!);
    this.gl.vertexAttribPointer(
      lineShader.attributes.get('a_color')!,
      4, // size (r, g, b, a)
      this.gl.FLOAT, // type
      false, // normalize
      0, // stride
      0 // offset
    );
    this.gl.enableVertexAttribArray(lineShader.attributes.get('a_color')!);
    
    // Draw lines
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.lines.indices!);
    this.gl.drawElements(
      this.gl.LINES,
      this.buffers.lines.count,
      this.gl.UNSIGNED_SHORT,
      0
    );
  }

  /**
   * Draw points using the point shader
   */
  private drawPoints(pointSize = 3.0): void {
    if (!this.gl || !this.buffers.points) return;

    const pointShader = this.shaders.get('point');
    if (!pointShader) return;

    this.gl.useProgram(pointShader.program);
    
    // Set uniforms
    if (pointShader.uniforms.has('u_resolution')) {
      this.gl.uniform2f(
        pointShader.uniforms.get('u_resolution')!,
        this.canvas!.width,
        this.canvas!.height
      );
    }
    
    if (pointShader.uniforms.has('u_pointSize')) {
      this.gl.uniform1f(
        pointShader.uniforms.get('u_pointSize')!,
        pointSize * this.resolutionScale
      );
    }
    
    // Set vertex attributes
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.points.position!);
    this.gl.vertexAttribPointer(
      pointShader.attributes.get('a_position')!,
      2, // size (x, y)
      this.gl.FLOAT, // type
      false, // normalize
      0, // stride
      0 // offset
    );
    this.gl.enableVertexAttribArray(pointShader.attributes.get('a_position')!);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.points.color!);
    this.gl.vertexAttribPointer(
      pointShader.attributes.get('a_color')!,
      4, // size (r, g, b, a)
      this.gl.FLOAT, // type
      false, // normalize
      0, // stride
      0 // offset
    );
    this.gl.enableVertexAttribArray(pointShader.attributes.get('a_color')!);
    
    // Draw points
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.points.indices!);
    this.gl.drawElements(
      this.gl.POINTS,
      this.buffers.points.count,
      this.gl.UNSIGNED_SHORT,
      0
    );
  }

  /**
   * Fallback to SVG rendering for chart types not optimized for WebGL
   */
  private renderFallbackChart(
    data: ChartData,
    options: ChartOptions,
    type: ChartType,
    chartArea: any
  ): void {
    if (!this.svgCanvas) return;

    // Create SVG renderer instance from imported SVGRenderer
    const svgRenderer = new SVGFallbackRenderer(this.svgCanvas);
    svgRenderer.render(data, options, type, chartArea);
  }

  /**
   * Render axes for charts
   */
  private renderAxes(data: ChartData, options: ChartOptions, chartArea: any): void {
    if (!this.svgCanvas) return;

    const xAxis = options.axes?.x || { type: 'linear' };
    const yAxis = options.axes?.y || { type: 'linear' };
    const scales = this.calculateScales(data, chartArea, xAxis, yAxis);
    const themeColors = options.theme === 'dark' ? this.theme.dark : this.theme.light;

    // Create axes group
    const axesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    axesGroup.setAttribute('class', 'axes');
    this.svgCanvas.appendChild(axesGroup);

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

    // Draw grid lines if enabled
    if (xAxis.grid || yAxis.grid) {
      this.drawGrid(scales, chartArea, options, axesGroup);
    }

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
   * Draw grid lines
   */
  private drawGrid(
    scales: any,
    chartArea: any,
    options: ChartOptions,
    axesGroup: SVGGElement
  ): void {
    const xAxis = options.axes?.x || { type: 'linear', grid: true };
    const yAxis = options.axes?.y || { type: 'linear', grid: true };
    const themeColors = options.theme === 'dark' ? this.theme.dark : this.theme.light;
    
    // Create a group for the grid
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('class', 'grid');
    axesGroup.appendChild(gridGroup);

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
    if (!this.svgCanvas) return;

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
    this.svgCanvas.appendChild(legendGroup);
    
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
  private setupTooltip(
    container: HTMLElement,
    data: ChartData,
    options: ChartOptions,
    chartArea: any
  ): void {
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

    // Add event listener to canvas for mouse movement
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Only show tooltip if within chart area
      if (
        x < chartArea.left ||
        x > chartArea.right ||
        y < chartArea.top ||
        y > chartArea.bottom
      ) {
        this.tooltipElement!.style.display = 'none';
        return;
      }
      
      // Find nearest data points
      const nearestPoints = this.findNearestPoints(x, y, data, options, chartArea);
      
      if (nearestPoints.length === 0) {
        this.tooltipElement!.style.display = 'none';
        return;
      }
      
      // Build tooltip content
      let tooltipContent = '';
      
      nearestPoints.forEach(({ dataset, point, datasetIndex }) => {
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
              <span style="font-weight: bold; color: ${dataset.color || this.getDefaultColor(datasetIndex)}">${dataset.label || `Series ${datasetIndex + 1}`}:</span>
              <span>${formattedX}, ${formattedY}</span>
            </div>
          `;
        }
      });
      
      // Update tooltip
      this.tooltipElement!.innerHTML = tooltipContent;
      this.tooltipElement!.style.display = 'block';
      
      // Position tooltip
      let tooltipX = x + 10;
      let tooltipY = y + 10;
      
      const tooltipRect = this.tooltipElement!.getBoundingClientRect();
      
      // Adjust position to ensure tooltip stays within container
      if (tooltipX + tooltipRect.width > container.clientWidth) {
        tooltipX = x - tooltipRect.width - 10;
      }
      
      if (tooltipY + tooltipRect.height > container.clientHeight) {
        tooltipY = y - tooltipRect.height - 10;
      }
      
      this.tooltipElement!.style.left = `${tooltipX}px`;
      this.tooltipElement!.style.top = `${tooltipY}px`;
    });
    
    this.canvas.addEventListener('mouseout', () => {
      if (this.tooltipElement) {
        this.tooltipElement.style.display = 'none';
      }
    });
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
  ): Array<{ dataset: ChartData['datasets'][0]; point: ChartData['datasets'][0]['data'][0]; datasetIndex: number }> {
    const { datasets } = data;
    const xAxis = options.axes?.x || { type: 'linear' };
    const yAxis = options.axes?.y || { type: 'linear' };
    const scales = this.calculateScales(data, chartArea, xAxis, yAxis);
    const tooltipMode = options.tooltip?.mode || 'nearest';
    const intersect = options.tooltip?.intersect !== false;
    
    interface NearestPoint {
      dataset: ChartData['datasets'][0];
      point: ChartData['datasets'][0]['data'][0];
      datasetIndex: number;
      distance: number;
    }
    
    const nearestPoints: NearestPoint[] = [];
    
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
          datasetIndex,
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
        if (!datasetMap.has(item.datasetIndex) || 
            item.distance < datasetMap.get(item.datasetIndex)!.distance) {
          datasetMap.set(item.datasetIndex, item);
        }
      }
      
      result = Array.from(datasetMap.values()).filter(item => !intersect || item.distance < 40);
    }
    
    // Return without the distance property
    return result.map(({ dataset, point, datasetIndex }) => ({ dataset, point, datasetIndex }));
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
   * Parse color string to RGBA values
   */
  private parseColor(color: string): { r: number; g: number; b: number; a: number } {
    // Handle shorthand hex
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    color = color.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    
    // Handle hex
    const hexRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
    const hexResult = hexRegex.exec(color);
    
    if (hexResult) {
      return {
        r: parseInt(hexResult[1], 16) / 255,
        g: parseInt(hexResult[2], 16) / 255,
        b: parseInt(hexResult[3], 16) / 255,
        a: 1
      };
    }
    
    // Handle rgba
    const rgbaRegex = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/i;
    const rgbaResult = rgbaRegex.exec(color);
    
    if (rgbaResult) {
      return {
        r: parseInt(rgbaResult[1], 10) / 255,
        g: parseInt(rgbaResult[2], 10) / 255,
        b: parseInt(rgbaResult[3], 10) / 255,
        a: rgbaResult[4] ? parseFloat(rgbaResult[4]) : 1
      };
    }
    
    // Default to black if color can't be parsed
    return { r: 0, g: 0, b: 0, a: 1 };
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
}

/**
 * Simple SVG renderer implementation for fallback rendering
 */
class SVGFallbackRenderer {
  private svg: SVGSVGElement;
  
  constructor(svg: SVGSVGElement) {
    this.svg = svg;
  }
  
  public render(
    data: ChartData,
    options: ChartOptions,
    type: ChartType,
    chartArea: any
  ): void {
    const mainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    mainGroup.setAttribute('class', 'chart');
    this.svg.appendChild(mainGroup);
    
    const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textElement.setAttribute('x', (chartArea.left + chartArea.right) / 2 + '');
    textElement.setAttribute('y', (chartArea.top + chartArea.bottom) / 2 + '');
    textElement.setAttribute('text-anchor', 'middle');
    textElement.setAttribute('dominant-baseline', 'middle');
    textElement.setAttribute('fill', '#666');
    textElement.textContent = `This chart type (${type}) is rendered using SVG for better compatibility`;
    
    mainGroup.appendChild(textElement);
  }
}