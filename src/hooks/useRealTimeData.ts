import { useEffect, useState } from 'react';
import { RealTimeDataService } from '../services/RealTimeDataService';

/**
 * Hook for consuming real-time data from a data stream
 *
 * @param service The RealTimeDataService instance
 * @param streamId The ID of the stream to subscribe to
 * @param initialData Optional initial data
 * @returns [data, isConnected, error] - Current data, connection status, and any error
 */
export function useRealTimeData<T>(
  service: RealTimeDataService,
  streamId: string,
  initialData: T[] = []
): [T[], boolean, string | null] {
  const [data, setData] = useState<T[]>(initialData);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    setIsConnected(false);

    try {
      // Subscribe to the stream
      unsubscribe = service.subscribeToStream<T>(streamId, newData => {
        setData(newData);
        setIsConnected(true);
      });

      // If subscription failed
      if (!unsubscribe) {
        setError(`Failed to subscribe to stream: ${streamId}`);
        setIsConnected(false);
      } else {
        setError(null);
      }
    } catch (err) {
      setError(`Error subscribing to stream: ${err instanceof Error ? err.message : String(err)}`);
      setIsConnected(false);
    }

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [service, streamId]);

  return [data, isConnected, error];
}

/**
 * Hook for creating and consuming a new real-time data stream
 *
 * @param service The RealTimeDataService instance
 * @param streamType The type of stream to create
 * @param streamName The name of the stream
 * @param frequency Update frequency in milliseconds
 * @param bufferSize Maximum number of data points to keep
 * @param initialData Optional initial data
 * @returns [data, streamId, isActive, error] - Current data, stream ID, active status, and any error
 */
export function useRealTimeDataStream<T>(
  service: RealTimeDataService,
  streamType: string,
  streamName: string,
  frequency: number = 1000,
  bufferSize: number = 100,
  initialData: T[] = []
): [T[], string | null, boolean, string | null] {
  const [data, setData] = useState<T[]>(initialData);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let newStreamId: string;

    try {
      // Create a new stream
      newStreamId = service.createDataStream<T>(
        streamType,
        streamName,
        frequency,
        bufferSize,
        initialData
      );
      setStreamId(newStreamId);

      // Subscribe to the new stream
      unsubscribe = service.subscribeToStream<T>(newStreamId, newData => {
        setData(newData);
        setIsActive(true);
      });

      if (!unsubscribe) {
        setError(`Failed to subscribe to newly created stream: ${newStreamId}`);
        setIsActive(false);
      } else {
        setError(null);
      }
    } catch (err) {
      setError(`Error creating data stream: ${err instanceof Error ? err.message : String(err)}`);
      setIsActive(false);
      return () => {
        /* no cleanup needed */
      };
    }

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (streamId) {
        service.deleteStream(streamId);
      }
    };
  }, [service, streamType, streamName, frequency, bufferSize]);

  return [data, streamId, isActive, error];
}

/**
 * Hook for creating a data stream with a generator and consuming its data
 *
 * @param service The RealTimeDataService instance
 * @param streamType The type of stream to create
 * @param streamName The name of the stream
 * @param generator The data generator function
 * @param frequency Update frequency in milliseconds
 * @param bufferSize Maximum number of data points to keep
 * @returns [data, streamId, isActive, error] - Current data, stream ID, active status, and any error
 */
export function useGeneratedDataStream<T>(
  service: RealTimeDataService,
  streamType: string,
  streamName: string,
  generator: Parameters<typeof service.registerDataGenerator>[1],
  frequency: number = 1000,
  bufferSize: number = 100
): [T[], string | null, boolean, string | null] {
  const [data, setData] = useState<T[]>([]);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let newStreamId: string;

    try {
      // Create a new stream
      newStreamId = service.createDataStream<T>(streamType, streamName, frequency, bufferSize);
      setStreamId(newStreamId);

      // Register the generator
      service.registerDataGenerator(newStreamId, generator);

      // Subscribe to the new stream
      unsubscribe = service.subscribeToStream<T>(newStreamId, newData => {
        setData(newData);
        setIsActive(true);
      });

      if (!unsubscribe) {
        setError(`Failed to subscribe to newly created stream: ${newStreamId}`);
        setIsActive(false);
      } else {
        setError(null);
      }
    } catch (err) {
      setError(`Error creating data stream: ${err instanceof Error ? err.message : String(err)}`);
      setIsActive(false);
      return () => {
        /* no cleanup needed */
      };
    }

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (streamId) {
        service.deleteStream(streamId);
      }
    };
  }, [service, streamType, streamName, generator, frequency, bufferSize]);

  return [data, streamId, isActive, error];
}

/**
 * Hook for creating a data stream with multiple value generators (for multi-series data)
 *
 * @param service The RealTimeDataService instance
 * @param streamType The type of stream to create
 * @param streamName The name of the stream
 * @param generators Key-value pairs of series name to generator function
 * @param frequency Update frequency in milliseconds
 * @param bufferSize Maximum number of data points to keep
 * @returns [data, streamId, isActive, error] - Current data, stream ID, active status, and any error
 */
export function useMultiSeriesDataStream(
  service: RealTimeDataService,
  streamType: string,
  streamName: string,
  generators: Record<string, ReturnType<typeof service.createSineWaveGenerator>>,
  frequency: number = 1000,
  bufferSize: number = 100
): [Record<string, number>[], string | null, boolean, string | null] {
  const [data, setData] = useState<Record<string, number>[]>([]);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let newStreamId: string;
    let timestamp = Date.now();

    try {
      // Create a composite generator that returns Record<string, number>[]
      const compositeGenerator = {
        generateData: () => {
          // Generate a timestamp
          timestamp = Date.now();

          // Generate data from each generator
          const result: Record<string, number> = {
            timestamp,
          };

          // Add data from each generator
          Object.entries(generators).forEach(([key, generator]) => {
            result[key] = generator.generateData() as number;
          });

          // Return a single object (will be converted to array by the service)
          return result;
        },
        configureGenerator: (config: Record<string, unknown>) => {
          // Configure each generator
          if (config.generators && typeof config.generators === 'object') {
            Object.entries(config.generators as Record<string, Record<string, unknown>>).forEach(
              ([key, generatorConfig]) => {
                if (generators[key] && typeof generatorConfig === 'object') {
                  generators[key].configureGenerator(generatorConfig);
                }
              }
            );
          }
        },
      } as unknown as ReturnType<typeof service.createSineWaveGenerator>;

      // Create a new stream
      newStreamId = service.createDataStream(streamType, streamName, frequency, bufferSize);
      setStreamId(newStreamId);

      // Register the composite generator
      service.registerDataGenerator(newStreamId, compositeGenerator);

      // Subscribe to the new stream
      unsubscribe = service.subscribeToStream<Record<string, number>>(newStreamId, newData => {
        setData(newData);
        setIsActive(true);
      });

      if (!unsubscribe) {
        setError(`Failed to subscribe to newly created stream: ${newStreamId}`);
        setIsActive(false);
      } else {
        setError(null);
      }
    } catch (err) {
      setError(`Error creating data stream: ${err instanceof Error ? err.message : String(err)}`);
      setIsActive(false);
      return () => {
        /* no cleanup needed */
      };
    }

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (streamId) {
        service.deleteStream(streamId);
      }
    };
  }, [service, streamType, streamName, generators, frequency, bufferSize]);

  return [data, streamId, isActive, error];
}
