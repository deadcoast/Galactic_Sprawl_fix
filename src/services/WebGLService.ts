import { AbstractBaseService } from '../lib/services/BaseService';
import { ErrorType, errorLoggingService } from './ErrorLoggingService';

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

class WebGLServiceImpl extends AbstractBaseService {
  private static instance: WebGLServiceImpl;
  private gl: WebGL2RenderingContext | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private programs: Map<string, ShaderProgram> = new Map();
  private renderTargets: Map<string, RenderTarget> = new Map();
  private computePrograms: Map<string, ComputeProgram> = new Map();
  private storageBuffers: Map<string, StorageBuffer> = new Map();

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
          if (index >= input_data.data.length()) return;

          float value = input_data.data[index];
          output_data.data[index] = value > u_threshold ? value * u_multiplier : value;
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

  private constructor() {
    super('WebGLService', '1.0.0');
  }

  public static getInstance(): WebGLServiceImpl {
    if (!WebGLServiceImpl.instance) {
      WebGLServiceImpl.instance = new WebGLServiceImpl();
    }
    return WebGLServiceImpl.instance;
  }

  protected async onInitialize(): Promise<void> {
    // Initialize metrics
    this.metadata.metrics = {
      active_programs: 0,
      render_targets: 0,
      draw_calls: 0,
      shader_compile_time: 0,
    };

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
  }

  protected async onDispose(): Promise<void> {
    if (!this.gl) return;

    // Delete compute programs
    for (const program of this.computePrograms.values()) {
      this.gl.deleteProgram(program.program);
    }
    this.computePrograms.clear();

    // Delete storage buffers
    for (const buffer of this.storageBuffers.values()) {
      this.gl.deleteBuffer(buffer.buffer);
    }
    this.storageBuffers.clear();

    // Call original dispose
    this.disposeResources();
  }

  public initializeContext(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2');

    if (!this.gl) {
      throw new Error('WebGL 2 not supported');
    }

    // Enable necessary WebGL features
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
  }

  private async createDefaultShaders(): Promise<void> {
    for (const [name, config] of Object.entries(this.defaultShaders)) {
      await this.createShaderProgram(name, config);
    }
  }

  public async createShaderProgram(name: string, config: ShaderConfig): Promise<ShaderProgram> {
    if (!this.gl) {
      throw new Error('WebGL context not initialized');
    }

    const startTime = performance.now();

    try {
      // Create and compile vertex shader
      const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER)!;
      this.gl.shaderSource(vertexShader, config.vertexSource);
      this.gl.compileShader(vertexShader);

      if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
        throw new Error(
          `Vertex shader compilation failed: ${this.gl.getShaderInfoLog(vertexShader)}`
        );
      }

      // Create and compile fragment shader
      const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER)!;
      this.gl.shaderSource(fragmentShader, config.fragmentSource);
      this.gl.compileShader(fragmentShader);

      if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
        throw new Error(
          `Fragment shader compilation failed: ${this.gl.getShaderInfoLog(fragmentShader)}`
        );
      }

      // Create and link program
      const program = this.gl.createProgram()!;
      this.gl.attachShader(program, vertexShader);
      this.gl.attachShader(program, fragmentShader);
      this.gl.linkProgram(program);

      if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
        throw new Error(`Program link failed: ${this.gl.getProgramInfoLog(program)}`);
      }

      // Get attribute locations
      const attributes: Record<string, number> = {};
      for (const attribute of config.attributes) {
        attributes[attribute] = this.gl.getAttribLocation(program, attribute);
      }

      // Get uniform locations
      const uniforms: Record<string, WebGLUniformLocation> = {};
      for (const uniform of config.uniforms) {
        const location = this.gl.getUniformLocation(program, uniform);
        if (location) {
          uniforms[uniform] = location;
        }
      }

      const shaderProgram = { program, attributes, uniforms };
      this.programs.set(name, shaderProgram);

      // Update metrics
      const metrics = this.metadata.metrics || {};
      metrics.active_programs = this.programs.size;
      metrics.shader_compile_time += performance.now() - startTime;
      this.metadata.metrics = metrics;

      return shaderProgram;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  public createRenderTarget(name: string, width: number, height: number): RenderTarget {
    if (!this.gl) {
      throw new Error('WebGL context not initialized');
    }

    // Create framebuffer
    const framebuffer = this.gl.createFramebuffer()!;
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);

    // Create texture
    const texture = this.gl.createTexture()!;
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

    // Attach texture to framebuffer
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      texture,
      0
    );

    const renderTarget = { framebuffer, texture, width, height };
    this.renderTargets.set(name, renderTarget);

    // Update metrics
    const metrics = this.metadata.metrics || {};
    metrics.render_targets = this.renderTargets.size;
    this.metadata.metrics = metrics;

    return renderTarget;
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

  private disposeResources(): void {
    if (!this.gl) return;

    // Delete shader programs
    for (const program of this.programs.values()) {
      this.gl.deleteProgram(program.program);
    }
    this.programs.clear();

    // Delete render targets
    for (const target of this.renderTargets.values()) {
      this.gl.deleteFramebuffer(target.framebuffer);
      this.gl.deleteTexture(target.texture);
    }
    this.renderTargets.clear();

    // Update metrics
    const metrics = this.metadata.metrics || {};
    metrics.active_programs = 0;
    metrics.render_targets = 0;
    this.metadata.metrics = metrics;
  }

  public override handleError(error: Error): void {
    errorLoggingService.logError(error, ErrorType.RUNTIME, undefined, { service: 'WebGLService' });
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
      const metrics = this.metadata.metrics || {};
      metrics.active_programs = this.programs.size + this.computePrograms.size;
      metrics.shader_compile_time += performance.now() - startTime;
      this.metadata.metrics = metrics;

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
    const metrics = this.metadata.metrics || {};
    metrics.draw_calls = (metrics.draw_calls || 0) + 1;
    this.metadata.metrics = metrics;
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
