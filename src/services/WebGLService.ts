import { Singleton } from '../lib/patterns/Singleton';
import { BaseService, ServiceMetadata } from '../lib/services/BaseService';
import { ChartAxes, ChartLegend, ChartOptions, ChartTooltip } from '../visualization/Chart';
import { ErrorSeverity, ErrorType, errorLoggingService } from './ErrorLoggingService';

// Add error types
export enum WebGLErrorType {
  SHADER_COMPILATION = 'SHADER_COMPILATION',
  RENDER_TARGET_CREATION = 'RENDER_TARGET_CREATION',
  CONTEXT_LOSS = 'CONTEXT_LOSS',
  BUFFER_ALLOCATION = 'BUFFER_ALLOCATION',
}

export interface ShaderProgram {
  program: WebGLProgram;
  attributes: Record<string, number>;
  uniforms: Record<string, WebGLUniformLocation>;
}

export interface ShaderConfig {
  vertexSource: string;
  fragmentSource: string;
  attributes: string[];
  uniforms: string[];
}

export interface RenderTarget {
  framebuffer: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
}

export interface ComputeShaderConfig {
  computeSource: string;
  workgroupSize: [number, number, number];
  uniforms: string[];
  storageBuffers: string[];
}

export interface StorageBuffer {
  buffer: WebGLBuffer;
  size: number;
  usage: number;
}

export interface ComputeProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation>;
  storageBuffers: Record<string, number>;
  workgroupSize: [number, number, number];
}

export interface ExtendedChartOptions extends Omit<ChartOptions, 'axes' | 'legend' | 'tooltip'> {
  axes: ChartAxes;
  legend?: ChartLegend;
  tooltip?: ChartTooltip;
}

export class WebGLServiceImpl extends Singleton<WebGLServiceImpl> implements BaseService {
  protected metadata: ServiceMetadata;
  private gl: WebGL2RenderingContext | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private programs: Map<string, ShaderProgram> = new Map();
  private renderTargets: Map<string, RenderTarget> = new Map();
  private computePrograms: Map<string, ComputeProgram> = new Map();
  private storageBuffers: Map<string, StorageBuffer> = new Map();
  private lastOptions: ExtendedChartOptions | null = null;

  // Default shaders
  private readonly defaultShaders = {
    highlight: {
      vertexSource: `#version 300 es
        in vec2 a_position;
        in vec2 a_texCoord;
        uniform mat3 u_matrix;
        out vec2 v_texCoord;
        
        void main() {
          gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
          v_texCoord = a_texCoord;
        }`,
      fragmentSource: `#version 300 es
        precision highp float;
        uniform sampler2D u_texture;
        uniform vec4 u_highlightColor;
        uniform float u_intensity;
        in vec2 v_texCoord;
        out vec4 outColor;
        
        void main() {
          vec4 color = texture(u_texture, v_texCoord);
          outColor = mix(color, u_highlightColor, u_intensity);
        }`,
      attributes: ['a_position', 'a_texCoord'],
      uniforms: ['u_matrix', 'u_texture', 'u_highlightColor', 'u_intensity'],
    },
    heatmap: {
      vertexSource: `#version 300 es
        in vec2 a_position;
        in float a_value;
        uniform mat3 u_matrix;
        out float v_value;
        
        void main() {
          gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
          v_value = a_value;
        }`,
      fragmentSource: `#version 300 es
        precision highp float;
        in float v_value;
        uniform vec3 u_colorLow;
        uniform vec3 u_colorHigh;
        uniform float u_minValue;
        uniform float u_maxValue;
        out vec4 outColor;
        
        void main() {
          float t = (v_value - u_minValue) / (u_maxValue - u_minValue);
          vec3 color = mix(u_colorLow, u_colorHigh, t);
          outColor = vec4(color, 1.0);
        }`,
      attributes: ['a_position', 'a_value'],
      uniforms: ['u_matrix', 'u_colorLow', 'u_colorHigh', 'u_minValue', 'u_maxValue'],
    },
    particles: {
      vertexSource: `#version 300 es
        in vec2 a_position;
        in vec2 a_velocity;
        in float a_age;
        uniform mat3 u_matrix;
        uniform float u_time;
        uniform float u_lifespan;
        out float v_opacity;
        
        void main() {
          float normalizedAge = a_age / u_lifespan;
          vec2 position = a_position + a_velocity * u_time;
          gl_Position = vec4((u_matrix * vec3(position, 1)).xy, 0, 1);
          gl_PointSize = mix(8.0, 2.0, normalizedAge);
          v_opacity = 1.0 - normalizedAge;
        }`,
      fragmentSource: `#version 300 es
        precision highp float;
        in float v_opacity;
        uniform vec4 u_color;
        out vec4 outColor;
        
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          outColor = u_color * v_opacity;
        }`,
      attributes: ['a_position', 'a_velocity', 'a_age'],
      uniforms: ['u_matrix', 'u_time', 'u_lifespan', 'u_color'],
    },
  };

  // Advanced shaders for GPU computation
  private readonly computeShaders = {
    dataProcessing: {
      computeSource: `#version 310 es
        layout(local_size_x = 256) in;

        layout(std430, binding = 0) readonly buffer InputData {
          float data[];
        } input_data;

        layout(std430, binding = 1) buffer OutputData {
          float data[];
        } output_data;

        uniform float u_multiplier;
        uniform float u_threshold;

        void main() {
          uint index = gl_GlobalInvocationID.x;
          if (index >= input_data?.data?.length()) return;

          float value = input_data?.data[index];
          output_data?.data[index] = value > u_threshold ? value * u_multiplier : value;
        }`,
      workgroupSize: [256, 1, 1] as [number, number, number],
      uniforms: ['u_multiplier', 'u_threshold'],
      storageBuffers: ['input_data', 'output_data'],
    },
    clustering: {
      computeSource: `#version 310 es
        layout(local_size_x = 16, local_size_y = 16) in;

        layout(std430, binding = 0) readonly buffer Points {
          vec2 points[];
        } input_points;

        layout(std430, binding = 1) buffer Clusters {
          vec2 centroids[];
          int assignments[];
        } clusters;

        uniform int u_numCentroids;
        uniform float u_convergenceThreshold;

        shared vec2 local_points[256];
        shared int local_assignments[256];

        float distance(vec2 a, vec2 b) {
          vec2 diff = a - b;
          return dot(diff, diff);
        }

        void main() {
          uint gid = gl_GlobalInvocationID.x;
          uint lid = gl_LocalInvocationID.x;
          
          if (gid >= input_points.points.length()) return;

          // Load point into shared memory
          local_points[lid] = input_points.points[gid];
          
          // Find nearest centroid
          float min_dist = 1e10;
          int nearest = 0;
          
          for (int i = 0; i < u_numCentroids; i++) {
            float dist = distance(local_points[lid], clusters.centroids[i]);
            if (dist < min_dist) {
              min_dist = dist;
              nearest = i;
            }
          }
          
          // Store assignment
          local_assignments[lid] = nearest;
          memoryBarrierShared();
          barrier();
          
          // Write back to global memory
          clusters.assignments[gid] = local_assignments[lid];
        }`,
      workgroupSize: [16, 16, 1] as [number, number, number],
      uniforms: ['u_numCentroids', 'u_convergenceThreshold'],
      storageBuffers: ['input_points', 'clusters'],
    },
  };

  constructor() {
    super();
    this.metadata = {
      name: 'WebGLService',
      version: '1.0.0',
      status: 'initializing',
    };
  }

  public async initialize(dependencies?: Record<string, unknown>): Promise<void> {
    try {
      // Initialize WebGL context and resources
      if (dependencies?.canvas instanceof HTMLCanvasElement) {
        this.canvas = dependencies.canvas;
        this.gl = this.canvas.getContext('webgl2');
        if (!this.gl) {
          throw new Error('Failed to initialize WebGL2 context');
        }
      } else {
        throw new Error('Canvas dependency required for WebGL service initialization');
      }

      // Initialize metrics
      this.metadata?.metrics = {
        shader_compile_time: 0,
        active_programs: 0,
        render_targets: 0,
        compute_programs: 0,
        storage_buffers: 0,
      };

      this.metadata?.status = 'ready';

      // Create default shaders
      await this.createDefaultShaders();

      // Initialize WebGL2 compute extensions
      if (this.gl) {
        const computeExt = this.gl.getExtension('WEBGL_compute_shader');
        const storageExt = this.gl.getExtension('WEBGL_storage_buffer');

        if (!computeExt || !storageExt) {
          console.warn('WebGL2 compute extensions not available. GPU data processing disabled.');
          return;
        }

        // Create compute shaders
        for (const [name, config] of Object.entries(this.computeShaders)) {
          await this.createComputeShader(name, config);
        }
      }
    } catch (error) {
      this.metadata?.status = 'error';
      this.handleError(error as Error);
      throw error;
    }
  }

  public async dispose(): Promise<void> {
    try {
      // Clean up WebGL resources
      this.disposeResources();
      this.gl = null;
      this.canvas = null;
      this.metadata?.status = 'disposed';
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  public getMetadata(): ServiceMetadata {
    return { ...this.metadata };
  }

  public isReady(): boolean {
    return this.metadata?.status === 'ready';
  }

  public handleError(error: Error, context?: Record<string, unknown>): void {
    this.metadata?.lastError = {
      type: ErrorType.RUNTIME,
      message: error.message,
      timestamp: Date.now(),
    };
    errorLoggingService.logError(error, ErrorType.RUNTIME, ErrorSeverity.HIGH, context);
  }

  private disposeResources(): void {
    if (!this.gl) return;

    // Delete shader programs
    this.programs.forEach(program => {
      this.gl?.deleteProgram(program.program);
    });
    this.programs.clear();

    // Delete render targets
    this.renderTargets.forEach(target => {
      this.gl?.deleteFramebuffer(target.framebuffer);
      this.gl?.deleteTexture(target.texture);
    });
    this.renderTargets.clear();

    // Delete compute programs
    this.computePrograms.forEach(program => {
      this.gl?.deleteProgram(program.program);
    });
    this.computePrograms.clear();

    // Delete storage buffers
    this.storageBuffers.forEach(buffer => {
      this.gl?.deleteBuffer(buffer.buffer);
    });
    this.storageBuffers.clear();

    // Update metrics
    if (this.metadata?.metrics) {
      this.metadata?.metrics.shader_compile_time +=
        performance.now() - this.metadata?.metrics.shader_compile_time;
    }
  }

  private async createDefaultShaders(): Promise<void> {
    for (const [name, config] of Object.entries(this.defaultShaders)) {
      await this.createShaderProgram(name, config);
    }
  }

  /**
   * Creates a shader program with proper error handling
   */
  public async createShaderProgram(name: string, config: ShaderConfig): Promise<ShaderProgram> {
    if (!this.gl) {
      throw new Error('WebGL context not initialized');
    }

    const startTime = performance.now();

    try {
      // Create vertex shader
      const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
      if (!vertexShader) {
        throw new Error('Failed to create vertex shader');
      }

      this.gl.shaderSource(vertexShader, config.vertexSource);
      this.gl.compileShader(vertexShader);

      if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
        const info = this.gl.getShaderInfoLog(vertexShader);
        this.gl.deleteShader(vertexShader);
        throw new Error(`Vertex shader compilation failed: ${info}`);
      }

      // Create fragment shader
      const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
      if (!fragmentShader) {
        this.gl.deleteShader(vertexShader);
        throw new Error('Failed to create fragment shader');
      }

      this.gl.shaderSource(fragmentShader, config.fragmentSource);
      this.gl.compileShader(fragmentShader);

      if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
        const info = this.gl.getShaderInfoLog(fragmentShader);
        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);
        throw new Error(`Fragment shader compilation failed: ${info}`);
      }

      // Create program
      const program = this.gl.createProgram();
      if (!program) {
        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);
        throw new Error('Failed to create shader program');
      }

      this.gl.attachShader(program, vertexShader);
      this.gl.attachShader(program, fragmentShader);
      this.gl.linkProgram(program);

      if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
        const info = this.gl.getProgramInfoLog(program);
        this.gl.deleteProgram(program);
        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);
        throw new Error(`Shader program linking failed: ${info}`);
      }

      // Get attribute and uniform locations
      const attributes: Record<string, number> = {};
      const uniforms: Record<string, WebGLUniformLocation> = {};

      config.attributes.forEach(attr => {
        const location = this.gl!.getAttribLocation(program, attr);
        if (location !== -1) {
          attributes[attr] = location;
        }
      });

      config.uniforms.forEach(uniform => {
        const location = this.gl!.getUniformLocation(program, uniform);
        if (location) {
          uniforms[uniform] = location;
        }
      });

      // Clean up shaders
      this.gl.deleteShader(vertexShader);
      this.gl.deleteShader(fragmentShader);

      const shaderProgram: ShaderProgram = { program, attributes, uniforms };
      this.programs.set(name, shaderProgram);

      // Update metrics
      if (this.metadata?.metrics) {
        this.metadata?.metrics.shader_compile_time += performance.now() - startTime;
        this.metadata?.metrics.active_programs = this.programs.size;
      }

      return shaderProgram;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Creates a render target with proper error handling
   */
  public createRenderTarget(name: string, width: number, height: number): RenderTarget {
    if (!this.gl) {
      throw new Error('WebGL context not initialized');
    }

    try {
      // Create framebuffer
      const framebuffer = this.gl.createFramebuffer();
      if (!framebuffer) {
        throw new Error('Failed to create framebuffer');
      }

      // Create texture
      const texture = this.gl.createTexture();
      if (!texture) {
        this.gl.deleteFramebuffer(framebuffer);
        throw new Error('Failed to create texture');
      }

      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        width,
        height,
        0,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        null
      );

      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

      // Attach texture to framebuffer
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER,
        this.gl.COLOR_ATTACHMENT0,
        this.gl.TEXTURE_2D,
        texture,
        0
      );

      // Check framebuffer status
      const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
      if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
        this.gl.deleteFramebuffer(framebuffer);
        this.gl.deleteTexture(texture);
        throw new Error(`Framebuffer is not complete: ${status}`);
      }

      // Reset bindings
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      this.gl.bindTexture(this.gl.TEXTURE_2D, null);

      const renderTarget: RenderTarget = { framebuffer, texture, width, height };
      this.renderTargets.set(name, renderTarget);

      // Update metrics
      if (this.metadata?.metrics) {
        this.metadata?.metrics.render_targets = this.renderTargets.size;
      }

      return renderTarget;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  public useProgram(name: string): ShaderProgram {
    const program = this.programs.get(name);
    if (!program) {
      throw new Error(`Shader program '${name}' not found`);
    }

    if (!this.gl) {
      throw new Error('WebGL context not initialized');
    }

    this.gl.useProgram(program.program);
    return program;
  }

  public useRenderTarget(name: string | null): void {
    if (!this.gl) {
      throw new Error('WebGL context not initialized');
    }

    if (name === null) {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      return;
    }

    const renderTarget = this.renderTargets.get(name);
    if (!renderTarget) {
      throw new Error(`Render target '${name}' not found`);
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, renderTarget.framebuffer);
  }

  public async createComputeShader(
    name: string,
    config: ComputeShaderConfig
  ): Promise<ComputeProgram> {
    if (!this.gl) {
      throw new Error('WebGL context not initialized');
    }

    const computeExt = this.gl.getExtension('WEBGL_compute_shader');
    if (!computeExt) {
      throw new Error('Compute shaders not supported');
    }

    const startTime = performance.now();

    try {
      // Create and compile compute shader
      const computeShader = this.gl.createShader(computeExt.COMPUTE_SHADER)!;
      this.gl.shaderSource(computeShader, config.computeSource);
      this.gl.compileShader(computeShader);

      if (!this.gl.getShaderParameter(computeShader, this.gl.COMPILE_STATUS)) {
        throw new Error(
          `Compute shader compilation failed: ${this.gl.getShaderInfoLog(computeShader)}`
        );
      }

      // Create and link program
      const program = this.gl.createProgram()!;
      this.gl.attachShader(program, computeShader);
      this.gl.linkProgram(program);

      if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
        throw new Error(`Program link failed: ${this.gl.getProgramInfoLog(program)}`);
      }

      // Get uniform locations
      const uniforms: Record<string, WebGLUniformLocation> = {};
      for (const uniform of config.uniforms) {
        const location = this.gl.getUniformLocation(program, uniform);
        if (location) {
          uniforms[uniform] = location;
        }
      }

      // Get storage buffer bindings
      const storageBuffers: Record<string, number> = {};
      for (let i = 0; i < config.storageBuffers.length; i++) {
        storageBuffers[config.storageBuffers[i]] = i;
      }

      const computeProgram: ComputeProgram = {
        program,
        uniforms,
        storageBuffers,
        workgroupSize: config.workgroupSize,
      };
      this.computePrograms.set(name, computeProgram);

      // Update metrics
      const metrics = this.metadata?.metrics ?? {};
      metrics.active_programs = this.programs.size + this.computePrograms.size;
      metrics.shader_compile_time += performance.now() - startTime;
      this.metadata?.metrics = metrics;

      return computeProgram;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  public createStorageBuffer(
    name: string,
    data: BufferSource | null,
    size: number,
    usage: number = WebGL2RenderingContext.STATIC_DRAW
  ): StorageBuffer {
    if (!this.gl) {
      throw new Error('WebGL context not initialized');
    }

    const storageExt = this.gl.getExtension('WEBGL_storage_buffer');
    if (!storageExt) {
      throw new Error('Storage buffers not supported');
    }

    const buffer = this.gl.createBuffer()!;
    this.gl.bindBuffer(storageExt.SHADER_STORAGE_BUFFER, buffer);
    this.gl.bufferData(storageExt.SHADER_STORAGE_BUFFER, size, usage);

    if (data) {
      this.gl.bufferSubData(storageExt.SHADER_STORAGE_BUFFER, 0, data);
    }

    const storageBuffer = { buffer, size, usage };
    this.storageBuffers.set(name, storageBuffer);

    return storageBuffer;
  }

  public updateStorageBuffer(name: string, data: BufferSource, offset: number = 0): void {
    if (!this.gl) {
      throw new Error('WebGL context not initialized');
    }

    const storageExt = this.gl.getExtension('WEBGL_storage_buffer');
    if (!storageExt) {
      throw new Error('Storage buffers not supported');
    }

    const buffer = this.storageBuffers.get(name);
    if (!buffer) {
      throw new Error(`Storage buffer '${name}' not found`);
    }

    this.gl.bindBuffer(storageExt.SHADER_STORAGE_BUFFER, buffer.buffer);
    this.gl.bufferSubData(storageExt.SHADER_STORAGE_BUFFER, offset, data);
  }

  public readStorageBuffer(name: string, output: ArrayBufferView): void {
    if (!this.gl) {
      throw new Error('WebGL context not initialized');
    }

    const storageExt = this.gl.getExtension('WEBGL_storage_buffer');
    if (!storageExt) {
      throw new Error('Storage buffers not supported');
    }

    const buffer = this.storageBuffers.get(name);
    if (!buffer) {
      throw new Error(`Storage buffer '${name}' not found`);
    }

    this.gl.bindBuffer(storageExt.SHADER_STORAGE_BUFFER, buffer.buffer);
    this.gl.getBufferSubData(storageExt.SHADER_STORAGE_BUFFER, 0, output);
  }

  public dispatchCompute(name: string, x: number, y: number = 1, z: number = 1): void {
    if (!this.gl) {
      throw new Error('WebGL context not initialized');
    }

    const computeExt = this.gl.getExtension('WEBGL_compute_shader');
    if (!computeExt) {
      throw new Error('Compute shaders not supported');
    }

    const program = this.computePrograms.get(name);
    if (!program) {
      throw new Error(`Compute shader '${name}' not found`);
    }

    this.gl.useProgram(program.program);
    computeExt.dispatchCompute(x, y, z);
    computeExt.memoryBarrier(computeExt.SHADER_STORAGE_BARRIER_BIT);

    // Update metrics
    const metrics = this.metadata?.metrics ?? {};
    metrics.draw_calls = (metrics.draw_calls ?? 0) + 1;
    this.metadata?.metrics = metrics;
  }

  public disposeStorageBuffer(name: string): void {
    if (!this.gl) {
      throw new Error('WebGL context not initialized');
    }

    const buffer = this.storageBuffers.get(name);
    if (!buffer) return;

    this.gl.deleteBuffer(buffer.buffer);
    this.storageBuffers.delete(name);
  }

  public setUniformValue(location: WebGLUniformLocation, value: number | number[]): void {
    if (!this.gl) {
      throw new Error('WebGL context not initialized');
    }

    if (Array.isArray(value)) {
      this.gl.uniform1fv(location, value);
    } else {
      this.gl.uniform1f(location, value);
    }
  }
}

// Export singleton instance
export const webglService = WebGLServiceImpl.getInstance();

// Export default for easier imports
export default webglService;
