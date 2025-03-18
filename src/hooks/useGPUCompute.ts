import { useCallback, useEffect, useRef, useState } from 'react';
import { webglService } from '../services/WebGLService';
import { useService } from './services/useService';

interface UseGPUComputeOptions {
  computeShader: string;
  inputData: Float32Array | Float32Array[];
  outputSize: number;
  uniforms?: Record<string, number | number[]>;
  workgroupSize?: [number, number, number];
}

interface UseGPUComputeResult {
  compute: () => Promise<Float32Array>;
  isComputing: boolean;
  error: Error | null;
}

export function useGPUCompute({
  computeShader,
  inputData,
  outputSize,
  uniforms = {},
  workgroupSize = [256, 1, 1],
}: UseGPUComputeOptions): UseGPUComputeResult {
  const { service } = useService<typeof webglService>('webgl');
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const inputBuffersRef = useRef<string[]>([]);
  const outputBufferRef = useRef<string | null>(null);

  // Initialize buffers
  useEffect(() => {
    if (!service) return;

    try {
      // Create input buffers
      const inputs = Array.isArray(inputData) ? inputData : [inputData];
      inputBuffersRef.current = inputs.map((data, i) => {
        const name = `input_${computeShader}_${i}`;
        service.createStorageBuffer(name, data, data?.byteLength);
        return name;
      });

      // Create output buffer
      const outputName = `output_${computeShader}`;
      service.createStorageBuffer(outputName, null, outputSize * Float32Array.BYTES_PER_ELEMENT);
      outputBufferRef.current = outputName;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }

    // Cleanup
    return () => {
      if (!service) return;
      inputBuffersRef.current.forEach(name => {
        try {
          service.disposeStorageBuffer(name);
        } catch (err) {
          console.error(`Error deleting input buffer ${name}:`, err);
        }
      });
      if (outputBufferRef.current) {
        try {
          service.disposeStorageBuffer(outputBufferRef.current);
        } catch (err) {
          console.error('Error deleting output buffer:', err);
        }
      }
    };
  }, [service, computeShader, inputData, outputSize]);

  const compute = useCallback(async (): Promise<Float32Array> => {
    if (!service) {
      throw new Error('WebGL service not available');
    }

    if (!outputBufferRef.current) {
      throw new Error('Output buffer not initialized');
    }

    setIsComputing(true);
    setError(null);

    try {
      // Set uniforms
      const shader = service.useProgram(computeShader);
      Object.entries(uniforms).forEach(([name, value]) => {
        const location = shader.uniforms[name];
        if (location) {
          service.setUniformValue(location, value);
        }
      });

      // Calculate dispatch size
      const numElements = outputSize;
      const [localX, localY, localZ] = workgroupSize;
      const dispatchX = Math.ceil(numElements / localX);
      const dispatchY = Math.ceil(dispatchX / localY);
      const dispatchZ = Math.ceil(dispatchY / localZ);

      // Dispatch compute shader
      service.dispatchCompute(computeShader, dispatchX, dispatchY, dispatchZ);

      // Read results
      const output = new Float32Array(outputSize);
      service.readStorageBuffer(outputBufferRef.current, output);

      return output;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsComputing(false);
    }
  }, [service, computeShader, outputSize, uniforms, workgroupSize]);

  return {
    compute,
    isComputing,
    error,
  };
}
