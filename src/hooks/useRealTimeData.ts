import { useCallback, useEffect, useState } from 'react';
import { errorLoggingService, ErrorSeverity, ErrorType } from '../services/ErrorLoggingService';
import { DataGenerator, realTimeDataService, StreamConfig } from '../services/RealTimeDataService';
import { useService } from './services/useService';

interface UseRealTimeDataOptions<T> {
  endpoint?: string;
  bufferId: string;
  config?: Partial<StreamConfig>;
  transform?: (data: unknown) => T;
  generator?: DataGenerator<T>;
}

interface UseRealTimeDataResult<T> {
  data: T[];
  isStreaming: boolean;
  error: Error | null;
  startStream: () => Promise<void>;
  stopStream: () => Promise<void>;
}

export function useRealTimeData<T>({
  endpoint,
  bufferId,
  config,
  transform = (data: unknown) => data as T,
  generator,
}: UseRealTimeDataOptions<T>): UseRealTimeDataResult<T> {
  const { service } = useService<typeof realTimeDataService>('realTimeData');
  const [data, setData] = useState<T[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Handle data updates
  const handleData = useCallback(
    (newData: unknown[]) => {
      try {
        const transformedData = newData.map(transform);
        setData(transformedData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [transform]
  );

  // Subscribe to data updates
  useEffect(() => {
    if (!service) {
      return;
    }

    const unsubscribe = service.subscribe<unknown>(bufferId, handleData);
    return () => {
      unsubscribe();
    };
  }, [service, bufferId, handleData]);

  // Register generator if provided
  useEffect(() => {
    if (!service || !generator) {
      return;
    }
    service.registerGenerator(bufferId, generator);
  }, [service, bufferId, generator]);

  // Start streaming
  const startStream = useCallback(async () => {
    if (!service) {
      throw new Error('RealTimeData service not available');
    }

    if (!endpoint && !generator) {
      throw new Error('Either endpoint or generator must be provided');
    }

    try {
      setError(null);
      await service.startStream(endpoint ?? '', bufferId, config);
      setIsStreaming(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [service, endpoint, bufferId, config, generator]);

  // Stop streaming
  const stopStream = useCallback(async () => {
    if (!service) {
      return;
    }

    try {
      await service.stopStream(bufferId);
      setIsStreaming(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [service, bufferId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isStreaming) {
        stopStream().catch(err => {
          errorLoggingService.logError(
            err instanceof Error ? err : new Error('Error stopping stream on unmount'),
            ErrorType.RUNTIME,
            ErrorSeverity.MEDIUM,
            {
              componentName: 'useRealTimeData',
              action: 'cleanupEffect',
              bufferId,
            }
          ).slice(________);
        });
      }
    };
  }, [isStreaming, stopStream, bufferId]);

  return {
    data,
    isStreaming,
    error,
    startStream,
    stopStream,
  };
}
