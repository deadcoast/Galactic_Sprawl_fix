import { Position } from '../../types/core/Position';

/**
 * Represents a WebGL shader uniform
 */
export interface ShaderUniform {
  type: 'float' | 'vec2' | 'vec3' | 'vec4' | 'int' | 'bool' | 'sampler2D';
  value: number | number[] | boolean | WebGLTexture | null;
}

/**
 * Supported shader types for data visualization
 */
export enum DataVisualizationShaderType {
  HEATMAP = 'heatmap',
  CONTOUR = 'contour',
  POINT_CLUSTER = 'pointCluster',
  HIGHLIGHT = 'highlight',
  DENSITY = 'density',
  FLOW = 'flow',
  TRANSITION = 'transition',
  CUSTOM = 'custom',
}

/**
 * Configuration for data visualization shaders
 */
export interface DataVisualizationShaderConfig {
  type: DataVisualizationShaderType;
  colors: string[];
  intensity?: number;
  resolution?: [number, number];
  animate?: boolean;
  animationSpeed?: number;
  highlightRange?: [number, number];
  dataRange?: [number, number];
  dataPoints?: Float32Array;
  customUniforms?: Record<string, ShaderUniform>;
  customVertexShader?: string;
  customFragmentShader?: string;
}

/**
 * WebGL Shader Manager for data visualization effects
 *
 * This utility manages WebGL shaders for data visualization, including
 * heatmaps, contour plots, point clustering, and data highlighting effects.
 */
export class WebGLShaderManager {
  private gl: WebGLRenderingContext | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private programs = new Map<string, WebGLProgram>();
  private shaders = new Map<string, WebGLShader>();
  private textures = new Map<string, WebGLTexture>();
  private framebuffers = new Map<string, WebGLFramebuffer>();
  private animationFrame: number | null = null;
  private _lastTimestamp = 0;

  /**
   * Initialize the WebGL context
   */
  public initialize(canvas: HTMLCanvasElement): boolean {
    try {
      this.canvas = canvas;
      this.gl = canvas.getContext('webgl', {
        alpha: true,
        premultipliedAlpha: false,
        antialias: true,
        powerPreference: 'high-performance',
      });

      if (!this.gl) {
        console.error('[WebGLShaderManager] WebGL not supported');
        return false;
      }

      this.initializeDefaultShaders();
      console.warn('[WebGLShaderManager] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[WebGLShaderManager] Initialization failed', error);
      return false;
    }
  }

  /**
   * Initialize default shaders for each visualization type
   */
  private initializeDefaultShaders(): void {
    // Set up standard shaders for each visualization type
    Object.values(DataVisualizationShaderType).forEach(type => {
      if (typeof type === 'string') {
        // Create a default shader with a predefined color array
        this.createDataVisualizationShader({
          type: type as DataVisualizationShaderType,
          colors: [
            '#3366cc', // Blue
            '#cc6633', // Orange
            '#33cc66', // Green
            '#cc33cc', // Purple
          ],
        });
      }
    });
  }

  /**
   * Convert hex color string to RGB array
   * @param hex Hex color string (e.g. "#ff0000" or "#f00")
   * @returns Array of RGB values [r, g, b] in range 0-1
   */
  private hexToRgb(hex: string): [number, number, number] {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Handle shorthand hex (e.g. #f00 -> #ff0000)
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map(c => c + c)
        .join('');
    }

    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    return [r, g, b];
  }

  /**
   * Create a shader
   */
  private createShader(type: number, source: string): WebGLShader | undefined {
    if (!this.gl) return undefined;

    const shader = this.gl.createShader(type);
    if (!shader) return undefined;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('An error occurred compiling the shaders:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return undefined;
    }

    return shader;
  }

  /**
   * Create a shader program
   */
  private createShaderProgram(
    name: string,
    vertexShaderSource: string,
    fragmentShaderSource: string
  ): WebGLProgram | undefined {
    if (!this.gl) return undefined;

    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return undefined;

    const program = this.gl.createProgram();
    if (!program) return undefined;

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Unable to initialize the shader program:', this.gl.getProgramInfoLog(program));
      return undefined;
    }

    this.programs.set(name, program);
    return program;
  }

  /**
   * Render data visualization with WebGL shader
   */
  public renderDataVisualization(
    config: DataVisualizationShaderConfig,
    data: Float32Array,
    positions: Position[],
    width: number,
    height: number
  ): void {
    if (!this.gl || !this.canvas) {
      console.error('[WebGLShaderManager] WebGL context not initialized');
      return;
    }

    // Update canvas size if needed
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }

    // Get appropriate shader program
    const programName = `data_${config.type}`;
    let program = this.programs.get(programName);

    // Create program if not exists
    if (!program) {
      program = this.createDataVisualizationShader(config);
      if (!program) {
        console.error(`[WebGLShaderManager] Failed to create shader for ${config.type}`);
        return;
      }
    }

    // Set up rendering
    this.gl.useProgram(program);

    // Clear canvas
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Prepare data
    this.setupDataVisualizationBuffers(program, config, data, positions);

    // Perform drawing
    this.gl.drawArrays(this.gl.POINTS, 0, positions.length);
  }

  /**
   * Create data visualization shader program
   */
  private createDataVisualizationShader(
    config: DataVisualizationShaderConfig
  ): WebGLProgram | undefined {
    const vertexShader = this.getDataVisualizationVertexShader(config);
    const fragmentShader = this.getDataVisualizationFragmentShader(config);

    return this.createShaderProgram(`data_${config.type}`, vertexShader, fragmentShader);
  }

  /**
   * Set up data visualization buffers and uniforms
   */
  private setupDataVisualizationBuffers(
    program: WebGLProgram,
    config: DataVisualizationShaderConfig,
    data: Float32Array,
    positions: Position[]
  ): void {
    if (!this.gl) return;

    // Create position buffer
    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);

    // Convert positions to flat array
    const positionArray = new Float32Array(positions.length * 2);
    positions.forEach((pos, index) => {
      positionArray[index * 2] = pos.x;
      positionArray[index * 2 + 1] = pos.y;
    });

    this.gl.bufferData(this.gl.ARRAY_BUFFER, positionArray, this.gl.STATIC_DRAW);

    // Get attribute location
    const positionLocation = this.gl.getAttribLocation(program, 'a_position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    // Create data buffer
    const dataBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, dataBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);

    // Get attribute location
    const dataLocation = this.gl.getAttribLocation(program, 'a_data');
    this.gl.enableVertexAttribArray(dataLocation);
    this.gl.vertexAttribPointer(dataLocation, 1, this.gl.FLOAT, false, 0, 0);

    // Set uniforms
    this.setDataVisualizationUniforms(program, config);
  }

  /**
   * Set data visualization uniforms
   */
  private setDataVisualizationUniforms(
    program: WebGLProgram,
    config: DataVisualizationShaderConfig
  ): void {
    if (!this.gl) return;

    // Resolution
    const resolution = config.resolution ?? [this.canvas?.width ?? 800, this.canvas?.height ?? 600];
    const resolutionLocation = this.gl.getUniformLocation(program, 'u_resolution');
    this.gl.uniform2f(resolutionLocation, resolution[0], resolution[1]);

    // Colors
    const colorCount = Math.min(config.colors.length, 5);
    for (let i = 0; i < colorCount; i++) {
      const color = this.hexToRgb(config.colors[i]);
      const colorLocation = this.gl.getUniformLocation(program, `u_colors[${i}]`);
      this.gl.uniform3f(colorLocation, color[0], color[1], color[2]);
    }

    // Color count
    const colorCountLocation = this.gl.getUniformLocation(program, 'u_colorCount');
    this.gl.uniform1i(colorCountLocation, colorCount);

    // Intensity
    const intensityLocation = this.gl.getUniformLocation(program, 'u_intensity');
    this.gl.uniform1f(intensityLocation, config.intensity ?? 1.0);

    // Time (for animations)
    const timeLocation = this.gl.getUniformLocation(program, 'u_time');
    this.gl.uniform1f(timeLocation, performance.now() / 1000.0);

    // Animation speed
    const speedLocation = this.gl.getUniformLocation(program, 'u_speed');
    this.gl.uniform1f(speedLocation, config.animationSpeed ?? 1.0);

    // Data range
    const dataRange = config.dataRange ?? [0, 1];
    const dataRangeLocation = this.gl.getUniformLocation(program, 'u_dataRange');
    this.gl.uniform2f(dataRangeLocation, dataRange[0], dataRange[1]);

    // Highlight range
    const highlightRange = config.highlightRange ?? [0.7, 1.0];
    const highlightRangeLocation = this.gl.getUniformLocation(program, 'u_highlightRange');
    if (highlightRangeLocation !== null) {
      this.gl.uniform2f(highlightRangeLocation, highlightRange[0], highlightRange[1]);
    }

    // Custom uniforms
    if (config.customUniforms) {
      Object.entries(config.customUniforms).forEach(([name, uniform]) => {
        if (!this.gl) return;
        const location = this.gl.getUniformLocation(program, name);
        if (location) {
          this.setUniform(location, uniform);
        }
      });
    }
  }

  /**
   * Set uniform value
   */
  private setUniform(location: WebGLUniformLocation | null, uniform: ShaderUniform): void {
    const gl = this.gl!;
    if (!gl || !location) return;

    switch (uniform.type) {
      case 'float':
        gl.uniform1f(location, uniform.value as number);
        break;
      case 'vec2':
        gl.uniform2fv(location, uniform.value as number[]);
        break;
      case 'vec3':
        gl.uniform3fv(location, uniform.value as number[]);
        break;
      case 'vec4':
        gl.uniform4fv(location, uniform.value as number[]);
        break;
      case 'int':
        gl.uniform1i(location, uniform.value as number);
        break;
      case 'bool':
        gl.uniform1i(location, uniform.value ? 1 : 0);
        break;
      case 'sampler2D':
        if (uniform.value instanceof WebGLTexture) {
          gl.uniform1i(location, 0);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, uniform.value);
        }
        break;
    }
  }

  /**
   * Get vertex shader source for data visualization
   */
  private getDataVisualizationVertexShader(config: DataVisualizationShaderConfig): string {
    // Use custom vertex shader if provided
    if (config.type === DataVisualizationShaderType.CUSTOM && config.customVertexShader) {
      return config.customVertexShader;
    }

    // Default vertex shader
    return `
      attribute vec2 a_position;
      attribute float a_data;
      
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_speed;
      uniform vec2 u_dataRange;
      uniform vec2 u_highlightRange;
      
      varying float v_data;
      varying vec2 v_position;
      varying float v_time;
      
      void main() {
        // Normalize data
        v_data = (a_data - u_dataRange.x) / (u_dataRange.y - u_dataRange.x);
        v_position = a_position;
        v_time = u_time * u_speed;
        
        // Set point size based on data
        float highlightFactor = 1.0;
        
        // Highlight range
        if (v_data >= u_highlightRange.x && v_data <= u_highlightRange.y) {
          // Pulsing effect for highlighted data
          highlightFactor = 1.0 + 0.3 * sin(u_time * 3.0);
        }
        
        // Calculate point size 
        float baseSize = 1.0;
        ${this.getPointSizeShaderCode(config)}
        
        // Position conversion
        vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      }
    `;
  }

  /**
   * Get fragment shader source for data visualization
   */
  private getDataVisualizationFragmentShader(config: DataVisualizationShaderConfig): string {
    // Use custom fragment shader if provided
    if (config.type === DataVisualizationShaderType.CUSTOM && config.customFragmentShader) {
      return config.customFragmentShader;
    }

    // Default fragment shader
    return `
      precision mediump float;
      
      uniform vec3 u_colors[5];
      uniform int u_colorCount;
      uniform float u_intensity;
      uniform float u_time;
      uniform vec2 u_highlightRange;
      
      varying float v_data;
      varying vec2 v_position;
      varying float v_time;
      
      // Helper function to interpolate colors
      vec3 getColor(float value) {
        if (u_colorCount == 1) return u_colors[0];
        
        float indexFloat = value * float(u_colorCount - 1);
        int index = int(floor(indexFloat));
        float t = fract(indexFloat);
        
        if (index >= u_colorCount - 1) {
          return u_colors[u_colorCount - 1];
        }
        
        return mix(u_colors[index], u_colors[index + 1], t);
      }
      
      void main() {
        // Get base color from data value
        vec3 color = getColor(v_data);
        float alpha = u_intensity;
        
        ${this.getFragmentShaderEffects(config)}
        
        // Apply highlight effect if in range
        if (v_data >= u_highlightRange.x && v_data <= u_highlightRange.y) {
          // Pulse effect
          float pulse = 0.5 + 0.5 * sin(u_time * 3.0);
          
          // Brighten color 
          color = mix(color, vec3(1.0), pulse * 0.3);
          
          // Increase opacity
          alpha = mix(alpha, 1.0, pulse * 0.5);
          
          // Add glow based on distance from center of point
          float dist = length(gl_PointCoord - vec2(0.5));
          float glow = smoothstep(0.5, 0.0, dist);
          color += glow * pulse * 0.3;
        }
        
        gl_FragColor = vec4(color, alpha);
      }
    `;
  }

  /**
   * Get point size shader code based on visualization type
   */
  private getPointSizeShaderCode(config: DataVisualizationShaderConfig): string {
    let code = '';

    switch (config.type) {
      case DataVisualizationShaderType.CUSTOM:
        code = `gl_PointSize = max(baseSize, 8.0) * highlightFactor;`;
        break;

      case DataVisualizationShaderType.HEATMAP:
        code = `gl_PointSize = max(baseSize, 10.0) * highlightFactor;`;
        break;

      case DataVisualizationShaderType.CONTOUR:
        code = `
          // For contour, size based on data thresholds
          float thresholdFactor = abs(fract(v_data * 10.0) - 0.5) * 2.0;
          gl_PointSize = mix(baseSize, 12.0, thresholdFactor) * highlightFactor;
        `;
        break;

      case DataVisualizationShaderType.POINT_CLUSTER:
        code = `
          // For clustering, vary size by data value
          gl_PointSize = mix(baseSize, 15.0, v_data) * highlightFactor;
        `;
        break;

      case DataVisualizationShaderType.HIGHLIGHT:
        code = `
          // For highlighting, emphasize highlighted ranges
          float inHighlight = (v_data >= u_highlightRange.x && v_data <= u_highlightRange.y) ? 1.0 : 0.0;
          gl_PointSize = mix(baseSize, 20.0, inHighlight) * highlightFactor;
        `;
        break;

      case DataVisualizationShaderType.DENSITY:
        code = `
          // For density maps, size consistent
          gl_PointSize = 8.0 * highlightFactor;
        `;
        break;

      case DataVisualizationShaderType.FLOW:
        code = `
          // For flow visualization, animate size with time
          float flowPulse = 0.7 + 0.3 * sin(v_time + v_data * 10.0);
          gl_PointSize = mix(baseSize, 12.0, v_data) * flowPulse * highlightFactor;
        `;
        break;

      case DataVisualizationShaderType.TRANSITION:
        code = `
          float dist = length(gl_PointCoord - vec2(0.5));
          float transitionFactor = 0.5 + 0.5 * sin(v_time * 2.0 + v_data * 5.0);
          
          alpha *= smoothstep(0.5, 0.0, dist) * mix(0.5, 1.0, transitionFactor);
          color = mix(color, color * vec3(1.2, 1.1, 0.9), transitionFactor);
          
          if (transitionFactor > 0.7) {
            float glow = smoothstep(0.5, 0.0, dist) * (transitionFactor - 0.7) * 3.0;
            color += glow * vec3(1.0, 0.9, 0.7);
          }
        `;
        break;

      default:
        code = `gl_PointSize = max(baseSize, 8.0) * highlightFactor;`;
    }

    return code;
  }

  /**
   * Get fragment shader effects based on visualization type
   */
  private getFragmentShaderEffects(config: DataVisualizationShaderConfig): string {
    let effects = '';

    switch (config.type) {
      case DataVisualizationShaderType.CUSTOM:
        effects = '';
        break;

      case DataVisualizationShaderType.HEATMAP:
        effects = `
          float dist = length(gl_PointCoord - vec2(0.5));
          float fadeEdge = smoothstep(0.5, 0.35, dist);
          alpha *= fadeEdge;
        `;
        break;

      case DataVisualizationShaderType.CONTOUR:
        effects = `
          float contourBands = abs(fract(v_data * 10.0) - 0.5) * 2.0;
          float isContour = step(0.8, contourBands);
          alpha *= mix(0.3, 1.0, isContour);
          
          float dist = length(gl_PointCoord - vec2(0.5));
          alpha *= smoothstep(0.5, 0.0, dist);
        `;
        break;

      case DataVisualizationShaderType.POINT_CLUSTER:
        effects = `
          float dist = length(gl_PointCoord - vec2(0.5));
          float center = smoothstep(0.5, 0.1, dist);
          alpha *= center;
          
          if (v_data > 0.7) {
            float glow = smoothstep(0.5, 0.0, dist) * 0.5;
            color += glow * vec3(1.0, 0.8, 0.2);
          }
        `;
        break;

      case DataVisualizationShaderType.HIGHLIGHT:
        effects = `
          float dist = length(gl_PointCoord - vec2(0.5));
          alpha *= smoothstep(0.5, 0.0, dist);
          
          if (v_data >= u_highlightRange.x && v_data <= u_highlightRange.y) {
            float glow = smoothstep(1.0, 0.0, dist * 2.0) * 0.7;
            color += glow * vec3(1.0, 0.9, 0.5);
          }
        `;
        break;

      case DataVisualizationShaderType.DENSITY:
        effects = `
          float dist = length(gl_PointCoord - vec2(0.5));
          alpha *= smoothstep(0.5, 0.0, dist) * v_data;
          
          color *= 0.8 + 0.2 * v_data;
        `;
        break;

      case DataVisualizationShaderType.FLOW:
        effects = `
          float dist = length(gl_PointCoord - vec2(0.5));
          
          vec2 dir = normalize(gl_PointCoord - vec2(0.5));
          float dirFactor = 0.5 + 0.5 * dot(dir, vec2(cos(v_time), sin(v_time)));
          
          alpha *= smoothstep(0.5, 0.0, dist) * dirFactor;
          color *= 0.8 + 0.2 * dirFactor;
          
          float streak = smoothstep(0.9, 0.0, abs(dot(dir, vec2(cos(v_time), sin(v_time)))));
          color += streak * 0.2 * vec3(1.0, 0.9, 0.7);
        `;
        break;

      case DataVisualizationShaderType.TRANSITION:
        effects = `
          float dist = length(gl_PointCoord - vec2(0.5));
          float transitionFactor = 0.5 + 0.5 * sin(v_time * 2.0 + v_data * 5.0);
          
          alpha *= smoothstep(0.5, 0.0, dist) * mix(0.5, 1.0, transitionFactor);
          color = mix(color, color * vec3(1.2, 1.1, 0.9), transitionFactor);
          
          if (transitionFactor > 0.7) {
            float glow = smoothstep(0.5, 0.0, dist) * (transitionFactor - 0.7) * 3.0;
            color += glow * vec3(1.0, 0.9, 0.7);
          }
        `;
        break;

      default:
        effects = '';
    }

    return effects;
  }

  /**
   * Start animation loop for continuous rendering
   * @param renderCallback (...args: unknown[]) => unknown to call on each animation frame
   */
  public startAnimationLoop(renderCallback: () => void): void {
    // Stop unknown existing animation loop
    this.stopAnimationLoop();

    // Animation frame handler
    const animate = (timestamp: number) => {
      // Calculate delta time
      const deltaTime = this._lastTimestamp ? timestamp - this._lastTimestamp : 0;
      this._lastTimestamp = timestamp;

      // Call render callback
      renderCallback();

      // Request next frame
      this.animationFrame = requestAnimationFrame(animate);
    };

    // Start the animation loop
    this.animationFrame = requestAnimationFrame(animate);
  }

  /**
   * Stop the animation loop
   */
  public stopAnimationLoop(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Dispose of WebGL resources
   */
  public dispose(): void {
    // Stop unknown running animation
    this.stopAnimationLoop();

    // Clean up WebGL resources
    if (this.gl) {
      // Delete shaders
      this.shaders.forEach(shader => {
        this.gl?.deleteShader(shader);
      });
      this.shaders.clear();

      // Delete programs
      this.programs.forEach(program => {
        this.gl?.deleteProgram(program);
      });
      this.programs.clear();

      // Delete textures
      this.textures.forEach(texture => {
        this.gl?.deleteTexture(texture);
      });
      this.textures.clear();

      // Delete framebuffers
      this.framebuffers.forEach(framebuffer => {
        this.gl?.deleteFramebuffer(framebuffer);
      });
      this.framebuffers.clear();

      // Reset context
      this.gl = null;
      this.canvas = null;
    }

    console.warn('[WebGLShaderManager] Resources disposed');
  }

  /**
   * Updates uniforms for all managed shaders. Typically called once per frame.
   * @param _deltaTime Time elapsed since the last frame in seconds.
   */
  public updateAllUniforms(_deltaTime: number): void {
    if (!this.gl) return;
    // ... existing code ...
  }
}
