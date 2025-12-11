import React from "react";
// Use type-only import to break circular dependency with Chart.tsx
import type {
  ChartOptions as BaseChartOptions,
  ChartAxes,
  ChartData,
  ChartLegend,
  ChartRenderer,
  ChartTooltip,
  ChartType,
} from "../Chart";

// Define interfaces for chart area and scale
interface ChartArea {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface Scale {
  min: number;
  max: number;
}

interface ExtendedChartOptions
  extends Omit<BaseChartOptions, "axes" | "legend" | "tooltip"> {
  axes: ChartAxes;
  legend?: ChartLegend;
  tooltip?: ChartTooltip;
}

/**
 * Shader attribute names for type safety
 */
type ShaderAttributeName = "a_position" | "a_color";

/**
 * Shader uniform names for type safety
 */
type ShaderUniformName = "u_resolution" | "u_pointSize" | "u_baseline";

/**
 * Shader program type for better type safety
 */
interface ShaderAttributeInfo {
  location: number;
  size: number;
  type: number;
  normalized: boolean;
  stride: number;
  offset: number;
}

interface ShaderUniformInfo {
  location: WebGLUniformLocation | null;
  type: number;
  size: number;
}

interface ShaderProgram {
  program: WebGLProgram | null;
  attributes: Map<ShaderAttributeName, ShaderAttributeInfo>;
  uniforms: Map<ShaderUniformName, ShaderUniformInfo>;
  vertexShader: WebGLShader | null;
  fragmentShader: WebGLShader | null;
}

/**
 * Chart data point with validated values
 */
interface ValidatedDataPoint {
  x: number;
  y: number;
  originalX: number | string | Date;
  originalY: number;
}

interface WebGLContextEvent extends Event {
  statusMessage: string;
}

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
  private shaders: Map<string, ShaderProgram> = new Map<
    string,
    ShaderProgram
  >();
  private svgCanvas: SVGSVGElement | null = null; // SVG layer for text and axes
  private lastOptions: ExtendedChartOptions | null = null;

  private theme = {
    light: {
      textColor: "#333333",
      gridColor: "#e0e0e0",
      axisColor: "#666666",
      backgroundColor: "transparent",
    },
    dark: {
      textColor: "#e0e0e0",
      gridColor: "#444444",
      axisColor: "#999999",
      backgroundColor: "transparent",
    },
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

  private validateOptions(
    options: BaseChartOptions,
  ): asserts options is ExtendedChartOptions {
    if (!options?.axes) {
      throw new Error("WebGLRenderer requires axes configuration");
    }
  }

  /**
   * Render a chart onto the container element
   */
  public render(
    container: HTMLElement,
    _data: ChartData,
    _options: BaseChartOptions,
    type: ChartType,
  ): void {
    this.validateOptions(_options);
    this.initialize(container, _options);
    this.update(container, _data, _options, type);
  }

  /**
   * Updates the chart with new data or options
   */
  public update(
    container: HTMLElement,
    data: ChartData,
    options: BaseChartOptions,
    type: ChartType,
  ): void {
    this.validateOptions(options);
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
    const padding = options?.padding ?? {};
    const chartArea = {
      left: padding.left ?? 0,
      right: this.containerWidth - (padding.right ?? 0),
      top: padding.top ?? 0,
      bottom: this.containerHeight - (padding.bottom ?? 0),
    };

    // Render the chart based on type
    try {
      switch (type) {
        case "line":
          this.renderLineChart(data, options, chartArea);
          break;
        case "scatter":
          this.renderScatterChart(data, options, chartArea);
          break;
        case "area":
          this.renderAreaChart(data, options, chartArea);
          break;
        case "bar":
        case "pie":
        case "radar":
        case "heatmap":
          // For chart types not optimized for WebGL, fall back to SVG rendering
          this.renderFallbackChart(data, options, type, chartArea);
          break;
        default:
          throw new Error(`Unsupported chart type: ${type as string}`);
      }

      // Render axes and other SVG elements
      if (type !== "pie" && type !== "radar") {
        this.renderAxes(data, options, chartArea);
      }

      // Render legend if enabled
      if (options?.legend?.visible) {
        this.renderLegend(data, options, chartArea);
      }

      // Setup tooltips if enabled
      if (options?.tooltip?.enabled) {
        this.setupTooltip(container, data, options, chartArea);
      } else if (this.tooltipElement) {
        this.tooltipElement.remove();
        this.tooltipElement = null;
      }
    } catch (error) {
      console.error("WebGL rendering error:", error);
      // Fall back to SVG rendering if WebGL fails
      this.renderFallbackChart(data, options, type, chartArea);
    }

    this.lastRenderTime = performance.now() - startTime;
  }

  /**
   * Destroys the renderer, cleaning up unknown resources
   */
  public destroy(): void {
    try {
      // Remove DOM elements
      if (this.canvas?.parentElement) {
        this.canvas.parentElement.removeChild(this.canvas);
      }

      if (this.svgCanvas?.parentElement) {
        this.svgCanvas.parentElement.removeChild(this.svgCanvas);
      }

      if (this.tooltipElement) {
        this.tooltipElement.remove();
      }

      // Delete WebGL resources
      if (this.gl) {
        // Unbind all buffers and textures
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);

        // Delete shaders and programs
        for (const shader of this.shaders.values()) {
          try {
            // Disable vertex attributes
            for (const location of shader.attributes.values()) {
              this.gl.disableVertexAttribArray(location.location);
            }

            // Delete individual shaders first
            if (shader.vertexShader) {
              this.gl.deleteShader(shader.vertexShader);
            }
            if (shader.fragmentShader) {
              this.gl.deleteShader(shader.fragmentShader);
            }

            // Then delete the program
            if (shader.program) {
              this.gl.deleteProgram(shader.program);
            }

            // Clear references
            shader.attributes.clear();
            shader.uniforms.clear();
            shader.vertexShader = null;
            shader.fragmentShader = null;
            shader.program = null;
          } catch (shaderError) {
            console.error("Error cleaning up shader:", shaderError);
          }
        }
        this.shaders.clear();

        // Delete buffers
        if (this.buffers.points) {
          try {
            if (this.buffers.points.position) {
              this.gl.deleteBuffer(this.buffers.points.position);
              this.buffers.points.position = null;
            }
            if (this.buffers.points.color) {
              this.gl.deleteBuffer(this.buffers.points.color);
              this.buffers.points.color = null;
            }
            if (this.buffers.points.indices) {
              this.gl.deleteBuffer(this.buffers.points.indices);
              this.buffers.points.indices = null;
            }
            this.buffers.points = undefined;
          } catch (bufferError) {
            console.error("Error cleaning up point buffers:", bufferError);
          }
        }

        if (this.buffers.lines) {
          try {
            if (this.buffers.lines.position) {
              this.gl.deleteBuffer(this.buffers.lines.position);
              this.buffers.lines.position = null;
            }
            if (this.buffers.lines.color) {
              this.gl.deleteBuffer(this.buffers.lines.color);
              this.buffers.lines.color = null;
            }
            if (this.buffers.lines.indices) {
              this.gl.deleteBuffer(this.buffers.lines.indices);
              this.buffers.lines.indices = null;
            }
            this.buffers.lines = undefined;
          } catch (bufferError) {
            console.error("Error cleaning up line buffers:", bufferError);
          }
        }

        // Reset WebGL state
        this.gl.disable(this.gl.BLEND);
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.SCISSOR_TEST);
        this.gl.disable(this.gl.STENCIL_TEST);
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(
          this.gl.COLOR_BUFFER_BIT |
            this.gl.DEPTH_BUFFER_BIT |
            this.gl.STENCIL_BUFFER_BIT,
        );

        // Clear the WebGL context
        const loseContext = this.gl.getExtension("WEBGL_lose_context");
        if (loseContext) {
          loseContext.loseContext();
        }

        this.gl = null;
      }

      // Clear all other references
      this.canvas = null;
      this.svgCanvas = null;
      this.tooltipElement = null;
      this.lastOptions = null;
      this.isInitialized = false;
      this.lastRenderTime = 0;
      this.containerWidth = 0;
      this.containerHeight = 0;
    } catch (error) {
      console.error("Error during cleanup:", error);
      // Ensure we still clear references even if cleanup fails
      this.gl = null;
      this.canvas = null;
      this.svgCanvas = null;
      this.tooltipElement = null;
      this.lastOptions = null;
      this.isInitialized = false;
    }
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
   * Initialize the WebGL renderer
   */
  private initialize(
    container: HTMLElement,
    options: ExtendedChartOptions,
  ): void {
    if (this.isInitialized) {
      return;
    }

    // Create canvas
    this.canvas = document.createElement("canvas");
    container.appendChild(this.canvas);

    // Get WebGL context with context loss handling
    const gl = this.canvas.getContext("webgl", {
      antialias: true,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      throw new Error("WebGL not supported");
    }

    this.gl = gl;

    // Setup context loss handling
    this.canvas.addEventListener(
      "webglcontextlost",
      ((event: Event) => {
        this.handleContextLost(event as WebGLContextEvent);
      }) as EventListener,
      false,
    );

    this.canvas.addEventListener(
      "webglcontextrestored",
      (() => {
        this.handleContextRestored();
      }) as EventListener,
      false,
    );

    // Create SVG layer for text and axes
    this.svgCanvas = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );
    container.appendChild(this.svgCanvas);

    this.updateDimensions(container);
    this.isInitialized = true;
    this.lastOptions = options;
  }

  /**
   * Handle WebGL context loss
   */
  private handleContextLost(event: WebGLContextEvent): void {
    event?.preventDefault();
    this.isInitialized = false;

    // Clear all resources
    this.shaders.clear();
    this.buffers = {};
  }

  /**
   * Handle WebGL context restoration
   */
  private handleContextRestored(): void {
    // Reinitialize WebGL resources
    if (this.canvas?.parentElement) {
      this.initialize(this.canvas.parentElement, this.lastOptions!);
    }
  }

  /**
   * Update canvas dimensions based on container size
   */
  private updateDimensions(container: HTMLElement): void {
    if (!this.canvas || !this.gl || !this.svgCanvas) {
      return;
    }

    const rect = container.getBoundingClientRect();
    this.containerWidth = rect.width;
    this.containerHeight = rect.height;

    // Set canvas dimensions with higher resolution for retina displays
    this.canvas.width = this.containerWidth * this.resolutionScale;
    this.canvas.height = this.containerHeight * this.resolutionScale;

    // Set SVG dimensions
    this.svgCanvas.setAttribute("width", this.containerWidth.toString());
    this.svgCanvas.setAttribute("height", this.containerHeight.toString());
    this.svgCanvas.setAttribute(
      "viewBox",
      `0 0 ${this.containerWidth} ${this.containerHeight}`,
    );

    // Update WebGL viewport
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Initialize WebGL shaders
   */
  private initShaders(): void {
    if (!this.gl) {
      return;
    }

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
        // Calculate distance from center of point
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        
        // Discard pixels outside circle
        if (dist > 0.5) discard;
        
        gl_FragColor = v_color;
      }
    `;

    const pointProgram = this.createShaderProgram(pointVsSource, pointFsSource);
    if (!pointProgram) {
      return;
    }

    const pointAttributes = new Map<ShaderAttributeName, ShaderAttributeInfo>();
    const positionInfo = this.getShaderAttributeInfo(
      pointProgram,
      "a_position",
    );
    const colorInfo = this.getShaderAttributeInfo(pointProgram, "a_color");

    if (!positionInfo || !colorInfo) {
      this.gl.deleteProgram(pointProgram);
      return;
    }

    pointAttributes.set("a_position", positionInfo);
    pointAttributes.set("a_color", colorInfo);

    const pointUniforms = new Map<ShaderUniformName, ShaderUniformInfo>();
    const resolutionInfo = this.getShaderUniformInfo(
      pointProgram,
      "u_resolution",
    );
    const pointSizeInfo = this.getShaderUniformInfo(
      pointProgram,
      "u_pointSize",
    );

    if (!resolutionInfo || !pointSizeInfo) {
      this.gl.deleteProgram(pointProgram);
      return;
    }

    pointUniforms.set("u_resolution", resolutionInfo);
    pointUniforms.set("u_pointSize", pointSizeInfo);

    // Create and store point shader program
    const pointVertexShader = this.compileShader(
      this.gl.VERTEX_SHADER,
      pointVsSource,
    );
    const pointFragmentShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      pointFsSource,
    );
    if (pointVertexShader && pointFragmentShader) {
      this.shaders.set("point", {
        program: pointProgram,
        attributes: pointAttributes,
        uniforms: pointUniforms,
        vertexShader: pointVertexShader,
        fragmentShader: pointFragmentShader,
      });
    }

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

    const lineProgram = this.createShaderProgram(lineVsSource, lineFsSource);
    if (!lineProgram) {
      return;
    }

    const lineAttributes = new Map<ShaderAttributeName, ShaderAttributeInfo>();
    const linePositionInfo = this.getShaderAttributeInfo(
      lineProgram,
      "a_position",
    );
    const lineColorInfo = this.getShaderAttributeInfo(lineProgram, "a_color");

    if (!linePositionInfo || !lineColorInfo) {
      this.gl.deleteProgram(lineProgram);
      return;
    }

    lineAttributes.set("a_position", linePositionInfo);
    lineAttributes.set("a_color", lineColorInfo);

    const lineUniforms = new Map<ShaderUniformName, ShaderUniformInfo>();
    const lineResolutionInfo = this.getShaderUniformInfo(
      lineProgram,
      "u_resolution",
    );

    if (!lineResolutionInfo) {
      this.gl.deleteProgram(lineProgram);
      return;
    }

    lineUniforms.set("u_resolution", lineResolutionInfo);

    // Create and store line shader program
    const lineVertexShader = this.compileShader(
      this.gl.VERTEX_SHADER,
      lineVsSource,
    );
    const lineFragmentShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      lineFsSource,
    );
    if (lineVertexShader && lineFragmentShader) {
      this.shaders.set("line", {
        program: lineProgram,
        attributes: lineAttributes,
        uniforms: lineUniforms,
        vertexShader: lineVertexShader,
        fragmentShader: lineFragmentShader,
      });
    }

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

    const areaProgram = this.createShaderProgram(areaVsSource, areaFsSource);
    if (!areaProgram) {
      return;
    }

    const areaAttributes = new Map<ShaderAttributeName, ShaderAttributeInfo>();
    const areaPositionInfo = this.getShaderAttributeInfo(
      areaProgram,
      "a_position",
    );
    const areaColorInfo = this.getShaderAttributeInfo(areaProgram, "a_color");

    if (!areaPositionInfo || !areaColorInfo) {
      this.gl.deleteProgram(areaProgram);
      return;
    }

    areaAttributes.set("a_position", areaPositionInfo);
    areaAttributes.set("a_color", areaColorInfo);

    const areaUniforms = new Map<ShaderUniformName, ShaderUniformInfo>();
    const areaResolutionInfo = this.getShaderUniformInfo(
      areaProgram,
      "u_resolution",
    );
    const areaBaselineInfo = this.getShaderUniformInfo(
      areaProgram,
      "u_baseline",
    );

    if (!areaResolutionInfo || !areaBaselineInfo) {
      this.gl.deleteProgram(areaProgram);
      return;
    }

    areaUniforms.set("u_resolution", areaResolutionInfo);
    areaUniforms.set("u_baseline", areaBaselineInfo);

    // Create and store area shader program
    const areaVertexShader = this.compileShader(
      this.gl.VERTEX_SHADER,
      areaVsSource,
    );
    const areaFragmentShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      areaFsSource,
    );
    if (areaVertexShader && areaFragmentShader) {
      this.shaders.set("area", {
        program: areaProgram,
        attributes: areaAttributes,
        uniforms: areaUniforms,
        vertexShader: areaVertexShader,
        fragmentShader: areaFragmentShader,
      });
    }
  }

  /**
   * Creates and initializes a WebGL shader program
   */
  private createShaderProgram(
    vertexSource: string,
    fragmentSource: string,
  ): WebGLProgram | null {
    if (!this.gl) {
      return null;
    }

    try {
      // Create shaders
      const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
      if (!vertexShader) {
        throw new Error("Failed to create vertex shader");
      }

      const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
      if (!fragmentShader) {
        this.gl.deleteShader(vertexShader);
        throw new Error("Failed to create fragment shader");
      }

      // Compile shaders
      this.gl.shaderSource(vertexShader, vertexSource);
      this.gl.compileShader(vertexShader);
      if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
        const error = this.gl.getShaderInfoLog(vertexShader);
        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);
        throw new Error(`Vertex shader compilation failed: ${error}`);
      }

      this.gl.shaderSource(fragmentShader, fragmentSource);
      this.gl.compileShader(fragmentShader);
      if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
        const error = this.gl.getShaderInfoLog(fragmentShader);
        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);
        throw new Error(`Fragment shader compilation failed: ${error}`);
      }

      // Create program and attach shaders
      const program = this.gl.createProgram();
      if (!program) {
        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);
        throw new Error("Failed to create shader program");
      }

      this.gl.attachShader(program, vertexShader);
      this.gl.attachShader(program, fragmentShader);
      this.gl.linkProgram(program);

      if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
        const error = this.gl.getProgramInfoLog(program);
        this.gl.deleteProgram(program);
        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);
        throw new Error(`Shader program linking failed: ${error}`);
      }

      return program;
    } catch (error) {
      console.error("Error creating shader program:", error);
      return null;
    }
  }

  /**
   * Gets shader attribute information with type safety
   */
  private getShaderAttributeInfo(
    program: WebGLProgram,
    name: ShaderAttributeName,
  ): ShaderAttributeInfo | null {
    if (!this.gl) {
      return null;
    }

    const location = this.gl.getAttribLocation(program, name);
    if (location === -1) {
      return null;
    }

    // Get attribute information
    const info = this.gl.getActiveAttrib(program, location);
    if (!info) {
      return null;
    }

    return {
      location,
      size: info.size,
      type: info.type,
      normalized: false,
      stride: 0,
      offset: 0,
    };
  }

  /**
   * Gets shader uniform information with type safety
   */
  private getShaderUniformInfo(
    program: WebGLProgram,
    name: ShaderUniformName,
  ): ShaderUniformInfo | null {
    if (!this.gl) {
      return null;
    }

    const location = this.gl.getUniformLocation(program, name);
    if (!location) {
      return null;
    }

    // First get the number of active uniforms
    const numUniforms = this.gl.getProgramParameter(
      program,
      this.gl.ACTIVE_UNIFORMS,
    ) as unknown as number;

    // Find the index of our uniform by name
    let uniformInfo = null;
    for (let i = 0; i < numUniforms; i++) {
      const info = this.gl.getActiveUniform(program, i);
      if (info && info.name === name) {
        uniformInfo = info;
        break;
      }
    }

    if (!uniformInfo) {
      return null;
    }

    return {
      location,
      type: uniformInfo.type,
      size: uniformInfo.size,
    };
  }

  /**
   * Compile a WebGL shader
   */
  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) {
      return null;
    }

    const shader = this.gl.createShader(type);
    if (!shader) {
      return null;
    }

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * Render line chart using WebGL
   */
  private renderLineChart(
    data: ChartData,
    options: ExtendedChartOptions,
    chartArea: ChartArea,
  ): void {
    if (!this.gl) {
      return;
    }

    const { datasets } = data;
    const xAxis = options?.axes?.x || { type: "linear" };
    const yAxis = options?.axes?.y || { type: "linear" };

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
      if (dataset.data?.length === 0) {
        return;
      }

      // Parse color
      const colorStr = dataset.color ?? this.getDefaultColor(datasetIndex);
      const color = this.parseColor(colorStr);

      // Process and validate points
      const points = this.processDatasetPoints(dataset, scales, chartArea);

      // Add vertices and indices
      points.forEach((point, i) => {
        // Add to line vertices
        lineVertices.push(
          point.x * this.resolutionScale,
          point.y * this.resolutionScale,
        );
        lineColors.push(color.r, color.g, color.b, color.a);

        // Add to point vertices
        pointVertices.push(
          point.x * this.resolutionScale,
          point.y * this.resolutionScale,
        );
        pointColors.push(color.r, color.g, color.b, color.a);

        // Add point indices
        pointIndices.push(pointIndexOffset + i);

        // Add line indices (connect points)
        if (i < points.length - 1) {
          lineIndices.push(lineIndexOffset + i, lineIndexOffset + i + 1);
        }
      });

      lineIndexOffset += points.length;
      pointIndexOffset += points.length;
    });

    // Create and bind buffers
    if (lineVertices.length > 0) {
      // Line buffers
      const linePositionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, linePositionBuffer);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        new Float32Array(lineVertices),
        this.gl.STATIC_DRAW,
      );

      const lineColorBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, lineColorBuffer);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        new Float32Array(lineColors),
        this.gl.STATIC_DRAW,
      );

      const lineIndexBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, lineIndexBuffer);
      this.gl.bufferData(
        this.gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(lineIndices),
        this.gl.STATIC_DRAW,
      );

      this.buffers.lines = {
        position: linePositionBuffer,
        color: lineColorBuffer,
        indices: lineIndexBuffer,
        count: lineIndices.length,
      };

      // Point buffers
      const pointPositionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, pointPositionBuffer);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        new Float32Array(pointVertices),
        this.gl.STATIC_DRAW,
      );

      const pointColorBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, pointColorBuffer);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        new Float32Array(pointColors),
        this.gl.STATIC_DRAW,
      );

      const pointIndexBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, pointIndexBuffer);
      this.gl.bufferData(
        this.gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(pointIndices),
        this.gl.STATIC_DRAW,
      );

      this.buffers.points = {
        position: pointPositionBuffer,
        color: pointColorBuffer,
        indices: pointIndexBuffer,
        count: pointIndices.length,
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
  private renderScatterChart(
    data: ChartData,
    options: ExtendedChartOptions,
    chartArea: ChartArea,
  ): void {
    if (!this.gl) {
      return;
    }

    const { datasets } = data;
    const xAxis = options?.axes?.x || { type: "linear" };
    const yAxis = options?.axes?.y || { type: "linear" };

    // Calculate scales
    const scales = this.calculateScales(data, chartArea, xAxis, yAxis);

    // Prepare WebGL buffers
    const pointVertices: number[] = [];
    const pointColors: number[] = [];
    const pointIndices: number[] = [];

    let pointIndexOffset = 0;

    // Process each dataset
    datasets.forEach((dataset, datasetIndex) => {
      if (dataset.data?.length === 0) {
        return;
      }

      // Parse color
      const colorStr = dataset.color ?? this.getDefaultColor(datasetIndex);
      const color = this.parseColor(colorStr);

      // Process and validate points
      const points = this.processDatasetPoints(dataset, scales, chartArea);

      // Add vertices and indices
      points.forEach((point, i) => {
        // Add to point vertices
        pointVertices.push(
          point.x * this.resolutionScale,
          point.y * this.resolutionScale,
        );
        pointColors.push(color.r, color.g, color.b, color.a);

        // Add point indices
        pointIndices.push(pointIndexOffset + i);
      });

      pointIndexOffset += dataset.data?.length;
    });

    // Create and bind buffers
    if (pointVertices.length > 0) {
      // Point buffers
      const pointPositionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, pointPositionBuffer);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        new Float32Array(pointVertices),
        this.gl.STATIC_DRAW,
      );

      const pointColorBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, pointColorBuffer);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        new Float32Array(pointColors),
        this.gl.STATIC_DRAW,
      );

      const pointIndexBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, pointIndexBuffer);
      this.gl.bufferData(
        this.gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(pointIndices),
        this.gl.STATIC_DRAW,
      );

      this.buffers.points = {
        position: pointPositionBuffer,
        color: pointColorBuffer,
        indices: pointIndexBuffer,
        count: pointIndices.length,
      };

      // Draw points with larger size
      this.drawPoints(5.0);
    }
  }

  /**
   * Render area chart using WebGL
   */
  private renderAreaChart(
    data: ChartData,
    options: ExtendedChartOptions,
    chartArea: ChartArea,
  ): void {
    if (!this.gl) {
      return;
    }

    const { datasets } = data;
    const xAxis = options?.axes?.x || { type: "linear" };
    const yAxis = options?.axes?.y || { type: "linear" };

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
      if (dataset.data?.length < 2) {
        return;
      }

      // Parse color
      const colorStr = dataset.color ?? this.getDefaultColor(datasetIndex);
      const color = this.parseColor(colorStr);

      // Process and validate points
      const points = this.processDatasetPoints(dataset, scales, chartArea);

      // Create area triangles (using triangle strip)
      for (let i = 0; i < points.length; i++) {
        const { x, y } = points[i];

        // Add top vertices (data points)
        areaVertices.push(x * this.resolutionScale, y * this.resolutionScale);
        areaColors.push(color.r, color.g, color.b, 0.6); // Semi-transparent for gradient

        // Add bottom vertices (baseline)
        areaVertices.push(
          x * this.resolutionScale,
          chartArea.bottom * this.resolutionScale,
        );
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
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        new Float32Array(areaVertices),
        this.gl.STATIC_DRAW,
      );

      const areaColorBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, areaColorBuffer);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        new Float32Array(areaColors),
        this.gl.STATIC_DRAW,
      );

      const areaIndexBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, areaIndexBuffer);
      this.gl.bufferData(
        this.gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(areaIndices),
        this.gl.STATIC_DRAW,
      );

      // Line buffers
      const linePositionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, linePositionBuffer);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        new Float32Array(lineVertices),
        this.gl.STATIC_DRAW,
      );

      const lineColorBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, lineColorBuffer);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        new Float32Array(lineColors),
        this.gl.STATIC_DRAW,
      );

      const lineIndexBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, lineIndexBuffer);
      this.gl.bufferData(
        this.gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(lineIndices),
        this.gl.STATIC_DRAW,
      );

      // Point buffers
      const pointPositionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, pointPositionBuffer);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        new Float32Array(pointVertices),
        this.gl.STATIC_DRAW,
      );

      const pointColorBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, pointColorBuffer);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        new Float32Array(pointColors),
        this.gl.STATIC_DRAW,
      );

      const pointIndexBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, pointIndexBuffer);
      this.gl.bufferData(
        this.gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(pointIndices),
        this.gl.STATIC_DRAW,
      );

      // Store buffers
      this.buffers = {
        lines: {
          position: linePositionBuffer,
          color: lineColorBuffer,
          indices: lineIndexBuffer,
          count: lineIndices.length,
        },
        points: {
          position: pointPositionBuffer,
          color: pointColorBuffer,
          indices: pointIndexBuffer,
          count: pointIndices.length,
        },
      };

      // Enable blending for transparent areas
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

      // Draw fill areas using area shader
      const areaShader = this.shaders.get("area");
      if (areaShader) {
        this.gl.useProgram(areaShader.program);

        // Set uniforms
        if (areaShader.uniforms.has("u_resolution")) {
          const uniformInfo = areaShader.uniforms.get("u_resolution")!;
          if (uniformInfo.location) {
            this.gl.uniform2f(
              uniformInfo.location,
              this.canvas!.width,
              this.canvas!.height,
            );
          }
        }

        if (areaShader.uniforms.has("u_baseline")) {
          const uniformInfo = areaShader.uniforms.get("u_baseline")!;
          if (uniformInfo.location) {
            this.gl.uniform1f(uniformInfo.location, baseline);
          }
        }

        // Set vertex attributes
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, areaPositionBuffer);
        this.gl.vertexAttribPointer(
          areaShader.attributes.get("a_position")!.location,
          2, // size (x, y)
          this.gl.FLOAT, // type
          false, // normalize
          0, // stride
          0, // offset
        );
        this.gl.enableVertexAttribArray(
          areaShader.attributes.get("a_position")!.location,
        );

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, areaColorBuffer);
        this.gl.vertexAttribPointer(
          areaShader.attributes.get("a_color")!.location,
          4, // size (r, g, b, a)
          this.gl.FLOAT, // type
          false, // normalize
          0, // stride
          0, // offset
        );
        this.gl.enableVertexAttribArray(
          areaShader.attributes.get("a_color")!.location,
        );

        // Draw triangles
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, areaIndexBuffer);
        this.gl.drawElements(
          this.gl.TRIANGLES,
          areaIndices.length,
          this.gl.UNSIGNED_SHORT,
          0,
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
    if (!this.gl || !this.buffers.lines) {
      return;
    }

    const lineShader = this.shaders.get("line");
    if (!lineShader) {
      return;
    }

    this.gl.useProgram(lineShader.program);

    // Set uniforms
    if (lineShader.uniforms.has("u_resolution")) {
      const uniformInfo = lineShader.uniforms.get("u_resolution")!;
      if (uniformInfo.location) {
        this.gl.uniform2f(
          uniformInfo.location,
          this.canvas!.width,
          this.canvas!.height,
        );
      }
    }

    // Set vertex attributes
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.lines.position);
    this.gl.vertexAttribPointer(
      lineShader.attributes.get("a_position")!.location,
      2, // size (x, y)
      this.gl.FLOAT, // type
      false, // normalize
      0, // stride
      0, // offset
    );
    this.gl.enableVertexAttribArray(
      lineShader.attributes.get("a_position")!.location,
    );

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.lines.color);
    this.gl.vertexAttribPointer(
      lineShader.attributes.get("a_color")!.location,
      4, // size (r, g, b, a)
      this.gl.FLOAT, // type
      false, // normalize
      0, // stride
      0, // offset
    );
    this.gl.enableVertexAttribArray(
      lineShader.attributes.get("a_color")!.location,
    );

    // Draw lines
    this.gl.bindBuffer(
      this.gl.ELEMENT_ARRAY_BUFFER,
      this.buffers.lines.indices,
    );
    this.gl.drawElements(
      this.gl.LINES,
      this.buffers.lines.count,
      this.gl.UNSIGNED_SHORT,
      0,
    );
  }

  /**
   * Draw points using the point shader
   */
  private drawPoints(pointSize = 3.0): void {
    if (!this.gl || !this.buffers.points) {
      return;
    }

    const pointShader = this.shaders.get("point");
    if (!pointShader) {
      return;
    }

    this.gl.useProgram(pointShader.program);

    // Set uniforms
    if (pointShader.uniforms.has("u_resolution")) {
      const uniformInfo = pointShader.uniforms.get("u_resolution")!;
      if (uniformInfo.location) {
        this.gl.uniform2f(
          uniformInfo.location,
          this.canvas!.width,
          this.canvas!.height,
        );
      }
    }

    if (pointShader.uniforms.has("u_pointSize")) {
      const uniformInfo = pointShader.uniforms.get("u_pointSize")!;
      if (uniformInfo.location) {
        this.gl.uniform1f(
          uniformInfo.location,
          pointSize * this.resolutionScale,
        );
      }
    }

    // Set vertex attributes
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.points.position);
    this.gl.vertexAttribPointer(
      pointShader.attributes.get("a_position")!.location,
      2, // size (x, y)
      this.gl.FLOAT, // type
      false, // normalize
      0, // stride
      0, // offset
    );
    this.gl.enableVertexAttribArray(
      pointShader.attributes.get("a_position")!.location,
    );

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.points.color);
    this.gl.vertexAttribPointer(
      pointShader.attributes.get("a_color")!.location,
      4, // size (r, g, b, a)
      this.gl.FLOAT, // type
      false, // normalize
      0, // stride
      0, // offset
    );
    this.gl.enableVertexAttribArray(
      pointShader.attributes.get("a_color")!.location,
    );

    // Draw points
    this.gl.bindBuffer(
      this.gl.ELEMENT_ARRAY_BUFFER,
      this.buffers.points.indices,
    );
    this.gl.drawElements(
      this.gl.POINTS,
      this.buffers.points.count,
      this.gl.UNSIGNED_SHORT,
      0,
    );
  }

  /**
   * Fallback to SVG rendering for chart types not optimized for WebGL
   */
  private renderFallbackChart(
    data: ChartData,
    options: ExtendedChartOptions,
    type: ChartType,
    chartArea: ChartArea,
  ): void {
    if (!this.svgCanvas) {
      return;
    }

    // Create SVG renderer instance from imported SVGRenderer
    const svgRenderer = new SVGFallbackRenderer(this.svgCanvas);
    svgRenderer.render(data, options, type, chartArea);
  }

  /**
   * Render axes for charts
   */
  private renderAxes(
    data: ChartData,
    options: ExtendedChartOptions,
    chartArea: ChartArea,
  ): void {
    if (!this.svgCanvas) {
      return;
    }

    const xAxis = options?.axes?.x || { type: "linear" };
    const yAxis = options?.axes?.y || { type: "linear" };
    const scales = this.calculateScales(data, chartArea, xAxis, yAxis);
    const themeColors =
      options?.theme === "dark" ? this.theme.dark : this.theme.light;

    // Create axes group
    const axesGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g",
    );
    axesGroup.setAttribute("class", "axes");
    this.svgCanvas.appendChild(axesGroup);

    // Draw x-axis
    const xAxisLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line",
    );
    xAxisLine.setAttribute("x1", chartArea.left.toString());
    xAxisLine.setAttribute("y1", chartArea.bottom.toString());
    xAxisLine.setAttribute("x2", chartArea.right.toString());
    xAxisLine.setAttribute("y2", chartArea.bottom.toString());
    xAxisLine.setAttribute("stroke", themeColors.axisColor);
    xAxisLine.setAttribute("stroke-width", "1");
    axesGroup.appendChild(xAxisLine);

    // Draw y-axis
    const yAxisLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line",
    );
    yAxisLine.setAttribute("x1", chartArea.left.toString());
    yAxisLine.setAttribute("y1", chartArea.top.toString());
    yAxisLine.setAttribute("x2", chartArea.left.toString());
    yAxisLine.setAttribute("y2", chartArea.bottom.toString());
    yAxisLine.setAttribute("stroke", themeColors.axisColor);
    yAxisLine.setAttribute("stroke-width", "1");
    axesGroup.appendChild(yAxisLine);

    // Draw grid lines if enabled
    if (xAxis.grid || yAxis.grid) {
      this.drawGrid(scales, chartArea, options, axesGroup);
    }

    // Draw x-axis ticks and labels
    const xTickCount = xAxis.tickCount ?? 5;
    const xStep = (scales.x.max - scales.x.min) / (xTickCount - 1);

    for (let i = 0; i < xTickCount; i++) {
      const value = scales.x.min + i * xStep;
      const x = this.mapValueToPixel(
        value,
        scales.x,
        chartArea.left,
        chartArea.right,
      );
      const y = chartArea.bottom;

      // Draw tick
      const tick = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      tick.setAttribute("x1", x.toString());
      tick.setAttribute("y1", y.toString());
      tick.setAttribute("x2", x.toString());
      tick.setAttribute("y2", (y + 5).toString());
      tick.setAttribute("stroke", themeColors.axisColor);
      tick.setAttribute("stroke-width", "1");
      axesGroup.appendChild(tick);

      // Draw label
      let tickLabel = String(value);
      if (xAxis.tickFormat) {
        tickLabel = xAxis.tickFormat(value);
      } else if (xAxis.type === "time" && this.isDate(value)) {
        tickLabel = value.toLocaleDateString();
      }

      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );
      text.setAttribute("x", x.toString());
      text.setAttribute("y", (y + 15).toString());
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("fill", themeColors.textColor);
      text.setAttribute("font-size", "12px");
      text.textContent = tickLabel;

      axesGroup.appendChild(text);
    }

    // Draw y-axis ticks and labels
    const yTickCount = yAxis.tickCount ?? 5;
    const yStep = (scales.y.max - scales.y.min) / (yTickCount - 1);

    for (let i = 0; i < yTickCount; i++) {
      const value = scales.y.min + i * yStep;
      const x = chartArea.left;
      const y = this.mapValueToPixel(
        value,
        scales.y,
        chartArea.bottom,
        chartArea.top,
        true,
      );

      // Draw tick
      const tick = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      tick.setAttribute("x1", x.toString());
      tick.setAttribute("y1", y.toString());
      tick.setAttribute("x2", (x - 5).toString());
      tick.setAttribute("y2", y.toString());
      tick.setAttribute("stroke", themeColors.axisColor);
      tick.setAttribute("stroke-width", "1");
      axesGroup.appendChild(tick);

      // Draw label
      let tickLabel = String(value);
      if (yAxis.tickFormat) {
        tickLabel = yAxis.tickFormat(value);
      }

      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );
      text.setAttribute("x", (x - 8).toString());
      text.setAttribute("y", y.toString());
      text.setAttribute("text-anchor", "end");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("fill", themeColors.textColor);
      text.setAttribute("font-size", "12px");
      text.textContent = tickLabel;

      axesGroup.appendChild(text);
    }

    // Draw axis labels if provided
    if (xAxis.label) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );
      text.setAttribute(
        "x",
        ((chartArea.left + chartArea.right) / 2).toString(),
      );
      text.setAttribute("y", (this.containerHeight - 5).toString());
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "bottom");
      text.setAttribute("fill", themeColors.textColor);
      text.setAttribute("font-size", "14px");
      text.setAttribute("font-weight", "bold");
      text.textContent = xAxis.label;

      axesGroup.appendChild(text);
    }

    if (yAxis.label) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );
      text.setAttribute(
        "transform",
        `translate(10, ${(chartArea.top + chartArea.bottom) / 2}) rotate(-90)`,
      );
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "bottom");
      text.setAttribute("fill", themeColors.textColor);
      text.setAttribute("font-size", "14px");
      text.setAttribute("font-weight", "bold");
      text.textContent = yAxis.label;

      axesGroup.appendChild(text);
    }
  }

  /**
   * Draw grid lines
   */
  private drawGrid(
    scales: { x: Scale; y: Scale },
    chartArea: ChartArea,
    options: ExtendedChartOptions,
    axesGroup: SVGGElement,
  ): void {
    const _axes = options?.axes ?? {};
    const xAxis = _axes.x || { type: "linear", grid: true };
    const yAxis = _axes.y || { type: "linear", grid: true };
    const themeColors =
      options?.theme === "dark" ? this.theme.dark : this.theme.light;

    // Create a group for the grid
    const gridGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g",
    );
    gridGroup.setAttribute("class", "grid");
    axesGroup.appendChild(gridGroup);

    // Draw x-axis grid lines
    if (yAxis.grid) {
      const xTickCount = xAxis.tickCount ?? 5;
      const xStep = (scales.x.max - scales.x.min) / (xTickCount - 1);

      for (let i = 0; i < xTickCount; i++) {
        const value = scales.x.min + i * xStep;
        const x = this.mapValueToPixel(
          value,
          scales.x,
          chartArea.left,
          chartArea.right,
        );

        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line",
        );
        line.setAttribute("x1", x.toString());
        line.setAttribute("y1", chartArea.top.toString());
        line.setAttribute("x2", x.toString());
        line.setAttribute("y2", chartArea.bottom.toString());
        line.setAttribute("stroke", themeColors.gridColor);
        line.setAttribute("stroke-width", "0.5");

        gridGroup.appendChild(line);
      }
    }

    // Draw y-axis grid lines
    if (xAxis.grid) {
      const yTickCount = yAxis.tickCount ?? 5;
      const yStep = (scales.y.max - scales.y.min) / (yTickCount - 1);

      for (let i = 0; i < yTickCount; i++) {
        const value = scales.y.min + i * yStep;
        const y = this.mapValueToPixel(
          value,
          scales.y,
          chartArea.bottom,
          chartArea.top,
          true,
        );

        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line",
        );
        line.setAttribute("x1", chartArea.left.toString());
        line.setAttribute("y1", y.toString());
        line.setAttribute("x2", chartArea.right.toString());
        line.setAttribute("y2", y.toString());
        line.setAttribute("stroke", themeColors.gridColor);
        line.setAttribute("stroke-width", "0.5");

        gridGroup.appendChild(line);
      }
    }
  }

  /**
   * Render legend
   */
  private renderLegend(
    data: ChartData,
    options: ExtendedChartOptions,
    chartArea: ChartArea,
  ): void {
    if (!this.svgCanvas) {
      return;
    }

    const { datasets } = data;
    const legendOptions = options?.legend ?? { visible: true, position: "top" };

    if (!legendOptions.visible || datasets.length === 0) {
      return;
    }

    const padding = 10;
    const itemHeight = 20;
    const itemWidth = 80;
    const itemsPerRow = Math.floor(
      (chartArea.right - chartArea.left) / itemWidth,
    );
    const rows = Math.ceil(datasets.length / itemsPerRow);

    const legendWidth = Math.min(datasets.length, itemsPerRow) * itemWidth;
    const legendHeight = rows * itemHeight;

    let startX: number | undefined;
    let startY: number | undefined;

    switch (legendOptions.position) {
      case "top":
        startX = (chartArea.left + chartArea.right - legendWidth) / 2;
        startY = chartArea.top - legendHeight - padding;
        break;
      case "bottom":
        startX = (chartArea.left + chartArea.right - legendWidth) / 2;
        startY = chartArea.bottom + padding;
        break;
      case "left":
        startX = chartArea.left - legendWidth - padding;
        startY = (chartArea.top + chartArea.bottom - legendHeight) / 2;
        break;
      case "right":
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
    const legendGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g",
    );
    legendGroup.setAttribute("class", "legend");
    this.svgCanvas.appendChild(legendGroup);

    const themeColors =
      options?.theme === "dark" ? this.theme.dark : this.theme.light;

    // Draw legend items
    datasets.forEach((dataset, i) => {
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;
      const x = (startX ?? 0) + col * itemWidth;
      const y = (startY ?? 0) + row * itemHeight;

      // Draw color box
      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      );
      rect.setAttribute("x", x.toString());
      rect.setAttribute("y", (y + 4).toString());
      rect.setAttribute("width", "12");
      rect.setAttribute("height", "12");
      rect.setAttribute("fill", dataset.color ?? this.getDefaultColor(i));
      rect.setAttribute("stroke", themeColors.axisColor);
      rect.setAttribute("stroke-width", "1");

      legendGroup.appendChild(rect);

      // Draw text
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );
      text.setAttribute("x", (x + 18).toString());
      text.setAttribute("y", (y + 10).toString());
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("fill", themeColors.textColor);
      text.setAttribute("font-size", "12px");
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
    options: ExtendedChartOptions,
    chartArea: ChartArea,
  ): void {
    if (!this.canvas) {
      return;
    }

    // Remove existing tooltip if unknown
    if (this.tooltipElement) {
      this.tooltipElement.remove();
    }

    // Create tooltip element
    this.tooltipElement = document.createElement("div");
    this.tooltipElement.className = "chart-tooltip";
    this.tooltipElement.style.position = "absolute";
    this.tooltipElement.style.display = "none";
    this.tooltipElement.style.backgroundColor =
      options?.theme === "dark" ? "#333" : "#fff";
    this.tooltipElement.style.color =
      options?.theme === "dark" ? "#fff" : "#333";
    this.tooltipElement.style.border = `1px solid ${options?.theme === "dark" ? "#555" : "#ddd"}`;
    this.tooltipElement.style.padding = "8px";
    this.tooltipElement.style.borderRadius = "4px";
    this.tooltipElement.style.pointerEvents = "none";
    this.tooltipElement.style.zIndex = "1000";
    this.tooltipElement.style.fontSize = "12px";
    this.tooltipElement.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";

    container.appendChild(this.tooltipElement);

    // Add event listener to canvas for mouse movement
    this.canvas.addEventListener("mousemove", (e) => {
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
        this.tooltipElement!.style.display = "none";
        return;
      }

      // Find nearest data points
      const nearestPoints = this.findNearestPoints(
        x,
        y,
        data,
        options,
        chartArea,
      );

      if (nearestPoints.length === 0) {
        this.tooltipElement!.style.display = "none";
        return;
      }

      // Build tooltip content
      let tooltipContent = "";

      nearestPoints.forEach(({ dataset, point, datasetIndex }) => {
        const formattedX =
          point.x instanceof Date ? point.x.toLocaleDateString() : point.x;

        const formattedY =
          typeof point.y === "number"
            ? point.y.toLocaleString(undefined, { maximumFractionDigits: 2 })
            : point.y;

        if (options?.tooltip?.format) {
          tooltipContent += options?.tooltip.format(point, dataset);
        } else {
          tooltipContent += `
            <div style="margin-bottom: 4px">
              <span style="font-weight: bold; color: ${dataset.color ?? this.getDefaultColor(datasetIndex)}">${dataset.label || `Series ${datasetIndex + 1}`}:</span>
              <span>${formattedX}, ${formattedY}</span>
            </div>
          `;
        }
      });

      // Update tooltip
      this.tooltipElement!.innerHTML = tooltipContent;
      this.tooltipElement!.style.display = "block";

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

    this.canvas.addEventListener("mouseout", () => {
      if (this.tooltipElement) {
        this.tooltipElement.style.display = "none";
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
    options: ExtendedChartOptions,
    chartArea: ChartArea,
  ): {
    dataset: ChartData["datasets"][0];
    point: ChartData["datasets"][0]["data"][0];
    datasetIndex: number;
  }[] {
    const { datasets } = data;
    const xAxis = options?.axes?.x || { type: "linear" };
    const yAxis = options?.axes?.y || { type: "linear" };
    const scales = this.calculateScales(data, chartArea, xAxis, yAxis);
    const tooltipMode = options?.tooltip?.mode ?? "nearest";
    const intersect = options?.tooltip?.intersect !== false;

    interface NearestPoint {
      dataset: ChartData["datasets"][0];
      point: ChartData["datasets"][0]["data"][0];
      datasetIndex: number;
      distance: number;
    }

    const nearestPoints: NearestPoint[] = [];

    // Find nearest points based on chart type and tooltip mode
    datasets.forEach((dataset, datasetIndex) => {
      dataset.data?.forEach((point) => {
        const pointX = this.mapValueToPixel(
          point.x,
          scales.x,
          chartArea.left,
          chartArea.right,
        );
        const pointY = this.mapValueToPixel(
          point.y,
          scales.y,
          chartArea.bottom,
          chartArea.top,
          true,
        );

        // Calculate distance
        const distance = Math.sqrt(
          Math.pow(mouseX - pointX, 2) + Math.pow(mouseY - pointY, 2),
        );

        nearestPoints.push({
          dataset,
          point,
          datasetIndex,
          distance,
        });
      });
    });

    // Sort by distance
    nearestPoints.sort((a, b) => a.distance - b.distance);

    // Filter based on mode
    let result: typeof nearestPoints = [];

    if (tooltipMode === "nearest") {
      // Only include the nearest point
      if (
        nearestPoints.length > 0 &&
        (!intersect || nearestPoints[0].distance < 20)
      ) {
        result = [nearestPoints[0]];
      }
    } else if (tooltipMode === "point") {
      // Include all points within a threshold distance
      result = nearestPoints.filter((item) => {
        return !intersect || item?.distance < 20;
      });
    } else if (tooltipMode === "dataset") {
      // Include the nearest point from each dataset
      const datasetMap = new Map<number, (typeof nearestPoints)[0]>();

      for (const item of nearestPoints) {
        if (
          !datasetMap.has(item?.datasetIndex) ||
          item?.distance < datasetMap.get(item?.datasetIndex)!.distance
        ) {
          datasetMap.set(item?.datasetIndex, item);
        }
      }

      result = Array.from(datasetMap.values()).filter(
        (item) => !intersect || item?.distance < 40,
      );
    }

    // Return without the distance property
    return result?.map(({ dataset, point, datasetIndex }) => ({
      dataset,
      point,
      datasetIndex,
    }));
  }

  /**
   * Calculate scales for axes
   */
  private calculateScales(
    data: ChartData,
    chartArea: ChartArea,
    xAxis: ChartAxes["x"],
    yAxis: ChartAxes["y"],
  ): { x: Scale; y: Scale } {
    const { datasets } = data;

    // Find min and max x values
    let xMin = xAxis?.min !== undefined ? Number(xAxis.min) : Infinity;
    let xMax = xAxis?.max !== undefined ? Number(xAxis.max) : -Infinity;

    // Find min and max y values
    let yMin = yAxis?.min !== undefined ? Number(yAxis.min) : Infinity;
    let yMax = yAxis?.max !== undefined ? Number(yAxis.max) : -Infinity;

    datasets.forEach((dataset) => {
      dataset.data?.forEach(
        (point: { x: number | string | Date; y: number }) => {
          // Handle x values
          let xValue = point.x;
          if (typeof xValue === "string" && xAxis?.type === "category") {
            // For category axes, use index
            xValue = 0; // Will be handled later
          } else if (xValue instanceof Date && xAxis?.type === "time") {
            xValue = xValue.getTime();
          } else if (typeof xValue === "string") {
            xValue = parseFloat(xValue);
          }

          if (typeof xValue === "number" && !isNaN(xValue)) {
            xMin = Math.min(xMin, xValue);
            xMax = Math.max(xMax, xValue);
          }

          // Handle y values
          if (typeof point.y === "number") {
            yMin = Math.min(yMin, point.y);
            yMax = Math.max(yMax, point.y);
          }
        },
      );
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
    if (yAxis?.type === "linear" && yMin > 0 && yMin < yMax * 0.3) {
      yMin = 0;
    }

    if (yAxis?.type === "linear" && yMax < 0 && yMax > yMin * 0.3) {
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
      y: { min: yMin, max: yMax },
    };
  }

  /**
   * Map a data value to a pixel position
   */
  private mapValueToPixel(
    value: number | string | Date,
    scale: Scale,
    pixelMin: number,
    pixelMax: number,
    invert = false,
  ): number {
    let normalizedValue: number;

    if (this.isDate(value)) {
      normalizedValue = value.getTime();
    } else if (typeof value === "string") {
      const parsed = parseFloat(value);
      if (isNaN(parsed)) {
        // For category axes, use the string's position in the category list
        // This should be handled by a proper category scale in the future
        normalizedValue = 0;
      } else {
        normalizedValue = parsed;
      }
    } else if (typeof value === "number") {
      if (isNaN(value) || !isFinite(value)) {
        throw new Error(`Invalid numeric value: ${value}`);
      }
      normalizedValue = value;
    } else {
      // This case should never happen due to TypeScript's type checking
      throw new Error(`Unsupported value type: ${typeof value}`);
    }

    if (normalizedValue < scale.min || normalizedValue > scale.max) {
      // Clamp values to scale bounds
      normalizedValue = Math.max(
        scale.min,
        Math.min(scale.max, normalizedValue),
      );
    }

    const normalizedPosition =
      (normalizedValue - scale.min) / (scale.max - scale.min);
    return invert
      ? pixelMax - normalizedPosition * (pixelMax - pixelMin)
      : pixelMin + normalizedPosition * (pixelMax - pixelMin);
  }

  /**
   * Type guard for Date objects
   */
  private isDate(value: unknown): value is Date {
    return value instanceof Date && !isNaN(value.getTime());
  }

  /**
   * Get all unique x values from all datasets
   */
  private getAllXValues(data: ChartData): string[] {
    const uniqueValues = new Set<string>();

    data?.datasets.forEach((dataset) => {
      dataset.data?.forEach((point) => {
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
      "#4e79a7",
      "#f28e2c",
      "#e15759",
      "#76b7b2",
      "#59a14f",
      "#edc949",
      "#af7aa1",
      "#ff9da7",
      "#9c755f",
      "#bab0ab",
    ];

    return colors[index % colors.length];
  }

  /**
   * Parse color string to RGBA values
   */
  private parseColor(color: string): {
    r: number;
    g: number;
    b: number;
    a: number;
  } {
    // Handle shorthand hex
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    color = color.replace(
      shorthandRegex,
      (m: string, r: string, g: string, b: string) => r + r + g + g + b + b,
    );

    // Handle hex
    const hexRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
    const hexResult = hexRegex.exec(color);

    if (hexResult) {
      return {
        r: parseInt(hexResult[1], 16) / 255,
        g: parseInt(hexResult[2], 16) / 255,
        b: parseInt(hexResult[3], 16) / 255,
        a: 1,
      };
    }

    // Handle rgba
    const rgbaRegex =
      /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/i;
    const rgbaResult = rgbaRegex.exec(color);

    if (rgbaResult) {
      return {
        r: parseInt(rgbaResult[1], 10) / 255,
        g: parseInt(rgbaResult[2], 10) / 255,
        b: parseInt(rgbaResult[3], 10) / 255,
        a: rgbaResult[4] ? parseFloat(rgbaResult[4]) : 1,
      };
    }

    // Default to black if color can't be parsed
    return { r: 0, g: 0, b: 0, a: 1 };
  }

  /**
   * Convert hex color to rgba for transparency
   */
  private hexToRgba(hex: string, alpha: number): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      return `rgba(0, 0, 0, ${alpha})`;
    }

    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Validate and normalize a data point
   */
  private validateDataPoint(
    point: ChartData["datasets"][0]["data"][0],
  ): ValidatedDataPoint {
    // Validate x value
    let x: number;
    if (this.isDate(point.x)) {
      x = point.x.getTime();
    } else if (typeof point.x === "string") {
      const parsed = parseFloat(point.x);
      if (isNaN(parsed)) {
        // For category axes, use the string's position in the category list
        // This should be handled by a proper category scale in the future
        x = 0;
      } else {
        x = parsed;
      }
    } else if (typeof point.x === "number") {
      if (isNaN(point.x) || !isFinite(point.x)) {
        throw new Error(`Invalid x value: ${point.x}`);
      }
      x = point.x;
    } else {
      throw new Error(`Unsupported x value type: ${typeof point.x}`);
    }

    // Validate y value
    if (typeof point.y !== "number" || isNaN(point.y) || !isFinite(point.y)) {
      throw new Error(`Invalid y value: ${point.y}`);
    }

    return {
      x,
      y: point.y,
      originalX: point.x,
      originalY: point.y,
    };
  }

  /**
   * Process dataset points and return validated points
   */
  private processDatasetPoints(
    dataset: ChartData["datasets"][0],
    scales: { x: Scale; y: Scale },
    chartArea: ChartArea,
  ): { x: number; y: number }[] {
    return dataset.data
      .map((point) => {
        const validated = this.validateDataPoint(point);
        return {
          x: this.mapValueToPixel(
            validated.x,
            scales.x,
            chartArea.left,
            chartArea.right,
          ),
          y: this.mapValueToPixel(
            validated.y,
            scales.y,
            chartArea.bottom,
            chartArea.top,
            true,
          ),
        };
      })
      .filter((point) => {
        // Filter out points outside the visible area
        return (
          point.x >= chartArea.left &&
          point.x <= chartArea.right &&
          point.y >= chartArea.top &&
          point.y <= chartArea.bottom
        );
      });
  }

  // React is used implicitly in JSX
  private _unusedReactImport = React;
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
    _data: ChartData,
    _options: ExtendedChartOptions,
    type: ChartType,
    chartArea: ChartArea,
  ): void {
    const mainGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g",
    );
    mainGroup.setAttribute("class", "chart");
    this.svg.appendChild(mainGroup);

    const textElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    textElement.setAttribute(
      "x",
      ((chartArea.left + chartArea.right) / 2).toString(),
    );
    textElement.setAttribute(
      "y",
      ((chartArea.top + chartArea.bottom) / 2).toString(),
    );
    textElement.setAttribute("text-anchor", "middle");
    textElement.setAttribute("dominant-baseline", "middle");
    textElement.setAttribute("fill", "#666");
    textElement.textContent = `This chart type (${type}) is rendered using SVG for better compatibility`;

    mainGroup.appendChild(textElement);
  }
}
