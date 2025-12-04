import { useCallback, useEffect, useState } from 'react';
import { workerService } from '../services/WorkerService';
import { useService } from './services/useService';

interface UseWorkerOptions {
  type: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  onProgress?: (progress: number) => void;
}

interface UseWorkerResult<T> {
  execute: (data: unknown) => Promise<T>;
  cancel: () => void;
  isRunning: boolean;
  progress: number;
  error: Error | null;
}

export function useWorker<T>({
  type,
  priority = 'MEDIUM',
  onProgress: _onProgress,
}: UseWorkerOptions): UseWorkerResult<T> {
  const { service } = useService<typeof workerService>('worker');
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentTaskId) {
        service?.cancelTask(currentTaskId);
      }
    };
  }, [currentTaskId, service]);

  const execute = useCallback(
    async (data: unknown): Promise<T> => {
      if (!service) {
        throw new Error('Worker service not available');
      }

      setIsRunning(true);
      setProgress(0);
      setError(null);

      try {
        return await service.submitTask<T>(type, data, priority);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsRunning(false);
        setCurrentTaskId(null);
      }
    },
    [service, type, priority]
  );

  const cancel = useCallback(() => {
    if (currentTaskId && service) {
      service.cancelTask(currentTaskId);
      setIsRunning(false);
      setCurrentTaskId(null);
    }
  }, [currentTaskId, service]);

  return {
    execute,
    cancel,
    isRunning,
    progress,
    error,
  };
}
