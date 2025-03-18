import { useCallback, useEffect, useRef } from 'react';
import { ShaderProgram, webglService } from '../services/WebGLService';
import { useService } from './services/useService';

interface UseWebGLOptions {
  width: number;
  height: number;
  onInit?: (gl: WebGL2RenderingContext) => void;
}

interface UseWebGLResult {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  gl: WebGL2RenderingContext | null;
  useShader: (name: string) => ShaderProgram;
  createBuffer: (data: BufferSource, usage?: number) => WebGLBuffer;
  setUniform: (location: WebGLUniformLocation, value: number | number[] | Float32Array) => void;
  clear: (r?: number, g?: number, b?: number, a?: number) => void;
}

export function useWebGL({ width, height, onInit }: UseWebGLOptions): UseWebGLResult {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { service } = useService<typeof webglService>('webgl');
  const glRef = useRef<WebGL2RenderingContext | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !service) return;

    // Initialize WebGL context
    const gl = canvas.getContext('webgl2');
    if (!gl) return;

    glRef.current = gl;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);

    // Initialize the WebGL service
    service.initialize({ canvas, gl });

    // Call user initialization
    onInit?.(gl);

    return () => {
      // Cleanup will be handled by the service
      service.dispose();
    };
  }, [service, width, height, onInit]);

  const useShader = useCallback(
    (name: string): ShaderProgram => {
      if (!service) {
        throw new Error('WebGL service not available');
      }
      return service.useProgram(name);
    },
    [service]
  );

  const createBuffer = useCallback(
    (data: BufferSource, usage: number = WebGL2RenderingContext.STATIC_DRAW): WebGLBuffer => {
      const gl = glRef.current;
      if (!gl) {
        throw new Error('WebGL context not initialized');
      }

      const buffer = gl.createBuffer();
      if (!buffer) {
        throw new Error('Failed to create buffer');
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, usage);
      return buffer;
    },
    []
  );

  const setUniform = useCallback(
    (location: WebGLUniformLocation, value: number | number[] | Float32Array): void => {
      const gl = glRef.current;
      if (!gl) {
        throw new Error('WebGL context not initialized');
      }

      if (typeof value === 'number') {
        gl.uniform1f(location, value);
      } else if (value instanceof Float32Array) {
        switch (value.length) {
          case 2:
            gl.uniform2fv(location, value);
            break;
          case 3:
            gl.uniform3fv(location, value);
            break;
          case 4:
            gl.uniform4fv(location, value);
            break;
          case 9:
            gl.uniformMatrix3fv(location, false, value);
            break;
          case 16:
            gl.uniformMatrix4fv(location, false, value);
            break;
          default:
            throw new Error(`Unsupported uniform size: ${value.length}`);
        }
      } else {
        switch (value.length) {
          case 2:
            gl.uniform2f(location, value[0], value[1]);
            break;
          case 3:
            gl.uniform3f(location, value[0], value[1], value[2]);
            break;
          case 4:
            gl.uniform4f(location, value[0], value[1], value[2], value[3]);
            break;
          default:
            throw new Error(`Unsupported uniform size: ${value.length}`);
        }
      }
    },
    []
  );

  const clear = useCallback((r = 0, g = 0, b = 0, a = 1) => {
    const gl = glRef.current;
    if (!gl) return;

    gl.clearColor(r, g, b, a);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }, []);

  return {
    canvasRef,
    gl: glRef.current,
    useShader,
    createBuffer,
    setUniform,
    clear,
  };
}
