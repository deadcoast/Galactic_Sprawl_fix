import { useCallback, useEffect, useRef, useState } from 'react';
import { apiService, StreamConfig } from '../services/APIService';
import { useService } from './services/useService';

interface UseStreamedDataOptions<T> {
  endpoint: string;
  config?: Partial<StreamConfig>;
  transform?: (data: unknown) => T;
  bufferSize?: number;
}

interface UseStreamedDataResult<T> {
  data: T[];
  isStreaming: boolean;
  error: Error | null;
  startStreaming: () => void;
  stopStreaming: () => void;
  clearBuffer: () => void;
}

export function useStreamedData<T>({
  endpoint,
  config,
  transform = (data: unknown) => data as T,
  bufferSize = 1000,
}: UseStreamedDataOptions<T>): UseStreamedDataResult<T> {
  const { service } = useService<typeof apiService>('api');
  const [data, setData] = useState<T[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const streamIdRef = useRef<string>();

  const handleData = useCallback(
    (newData: unknown) => {
      try {
        const transformedData = Array.isArray(newData)
          ? newData.map(transform)
          : [transform(newData)];

        setData(prevData => {
          const updatedData = [...prevData, ...transformedData];
          // Keep buffer size under limit by removing oldest items
          return updatedData.slice(Math.max(0, updatedData.length - bufferSize));
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [transform, bufferSize]
  );

  const startStreaming = useCallback(async () => {
    if (!service || isStreaming) return;

    try {
      const streamId = await service.startStream(endpoint, handleData, config);
      streamIdRef.current = streamId;
      setIsStreaming(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [service, endpoint, handleData, config, isStreaming]);

  const stopStreaming = useCallback(async () => {
    if (!service || !streamIdRef.current) return;

    try {
      await service.stopStream(streamIdRef.current);
      streamIdRef.current = undefined;
      setIsStreaming(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [service]);

  const clearBuffer = useCallback(() => {
    setData([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamIdRef.current) {
        service?.stopStream(streamIdRef.current);
      }
    };
  }, [service]);

  return {
    data,
    isStreaming,
    error,
    startStreaming,
    stopStreaming,
    clearBuffer,
  };
}
