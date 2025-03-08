/**
 * @file RealTimeDataService.ts
 * Service for managing real-time data streams for visualization components
 *
 * This service:
 * 1. Manages data streams and subscriptions
 * 2. Handles data generators for simulated real-time data
 * 3. Provides data buffering and interpolation capabilities
 * 4. Implements performance optimizations for smooth visualizations
 */

import { v4 as uuidv4 } from 'uuid';
import { DataPoint } from '../types/exploration/DataAnalysisTypes';

// Define a type for data callbacks
export type DataCallback<T> = (data: T[]) => void;

// Define types for data streams
export interface DataStream<T> {
  id: string;
  type: string;
  name: string;
  isActive: boolean;
  frequency: number; // milliseconds
  bufferSize: number;
  buffer: T[];
  subscribers: Array<{
    id: string;
    callback: DataCallback<T>;
  }>;
  start: () => void;
  stop: () => void;
  addSubscriber: (callback: DataCallback<T>) => string;
  removeSubscriber: (id: string) => void;
}

// Define types for data generators
export interface DataGenerator<T> {
  generateData: () => T | T[];
  configureGenerator: (config: Record<string, unknown>) => void;
}

/**
 * Service for managing real-time data streams and processing
 */
export class RealTimeDataService {
  private streams: Map<string, DataStream<unknown>> = new Map();
  private generators: Map<string, DataGenerator<unknown>> = new Map();

  /**
   * Create a new data stream with specified type and update frequency
   */
  public createDataStream<T>(
    type: string,
    name: string,
    frequency: number = 1000,
    bufferSize: number = 100,
    initialData: T[] = []
  ): string {
    const streamId = uuidv4();

    // Create a new stream object
    const stream: DataStream<T> = {
      id: streamId,
      type,
      name,
      isActive: false,
      frequency,
      bufferSize,
      buffer: [...initialData],
      subscribers: [],

      // Method to start the stream
      start: () => {
        if (stream.isActive) return;

        stream.isActive = true;
        this.startStreamInterval(streamId);
      },

      // Method to stop the stream
      stop: () => {
        stream.isActive = false;
      },

      // Method to add a subscriber
      addSubscriber: (callback: DataCallback<T>) => {
        const subscriberId = uuidv4();
        stream.subscribers.push({
          id: subscriberId,
          callback,
        });

        // Start stream automatically when first subscriber is added
        if (stream.subscribers.length === 1 && !stream.isActive) {
          stream.start();
        }

        // Send initial data to the new subscriber
        if (stream.buffer.length > 0) {
          callback([...stream.buffer]);
        }

        return subscriberId;
      },

      // Method to remove a subscriber
      removeSubscriber: (id: string) => {
        const index = stream.subscribers.findIndex(s => s.id === id);
        if (index !== -1) {
          stream.subscribers.splice(index, 1);

          // Stop stream if no subscribers left
          if (stream.subscribers.length === 0) {
            stream.stop();
          }
        }
      },
    };

    // Store the stream
    this.streams.set(streamId, stream as DataStream<unknown>);

    return streamId;
  }

  /**
   * Get a list of all data streams
   */
  public getDataStreams(): Array<{
    id: string;
    type: string;
    name: string;
    isActive: boolean;
    frequency: number;
    bufferSize: number;
    subscribers: number;
  }> {
    return Array.from(this.streams.values()).map(stream => ({
      id: stream.id,
      type: stream.type,
      name: stream.name,
      isActive: stream.isActive,
      frequency: stream.frequency,
      bufferSize: stream.bufferSize,
      subscribers: stream.subscribers.length,
    }));
  }

  /**
   * Register a data generator for a stream
   */
  public registerDataGenerator<T>(streamId: string, generator: DataGenerator<T>): void {
    this.generators.set(streamId, generator as DataGenerator<unknown>);
  }

  /**
   * Remove a data generator
   */
  public removeDataGenerator(streamId: string): void {
    this.generators.delete(streamId);
  }

  /**
   * Subscribe to a data stream
   */
  public subscribeToStream<T>(streamId: string, callback: DataCallback<T>): (() => void) | null {
    const stream = this.streams.get(streamId) as DataStream<T> | undefined;

    if (!stream) {
      console.error(`Stream with ID ${streamId} not found.`);
      return null;
    }

    const subscriberId = stream.addSubscriber(callback);

    // Return unsubscribe function
    return () => {
      stream.removeSubscriber(subscriberId);
    };
  }

  /**
   * Add data to a stream
   */
  public addDataToStream<T>(streamId: string, data: T | T[]): void {
    const stream = this.streams.get(streamId);

    if (!stream) {
      console.error(`Stream with ID ${streamId} not found.`);
      return;
    }

    // Add data to buffer
    const dataArray = Array.isArray(data) ? data : [data];

    // Add to buffer respecting buffer size limit
    const typedStream = stream as DataStream<T>;
    typedStream.buffer = [...typedStream.buffer, ...dataArray].slice(-typedStream.bufferSize);

    // Notify subscribers
    typedStream.subscribers.forEach(subscriber => {
      subscriber.callback([...typedStream.buffer]);
    });
  }

  /**
   * Clear a stream's buffer
   */
  public clearStreamBuffer(streamId: string): void {
    const stream = this.streams.get(streamId);

    if (!stream) {
      console.error(`Stream with ID ${streamId} not found.`);
      return;
    }

    stream.buffer = [];
  }

  /**
   * Delete a data stream
   */
  public deleteStream(streamId: string): void {
    const stream = this.streams.get(streamId);

    if (!stream) {
      console.error(`Stream with ID ${streamId} not found.`);
      return;
    }

    // Stop the stream
    stream.stop();

    // Remove stream and its generator
    this.streams.delete(streamId);
    this.generators.delete(streamId);
  }

  /**
   * Start interval for a stream
   */
  private startStreamInterval(streamId: string): void {
    const stream = this.streams.get(streamId);

    if (!stream) {
      console.error(`Stream with ID ${streamId} not found.`);
      return;
    }

    // Create interval
    const intervalId = setInterval(() => {
      // Check if stream is still active
      if (!stream.isActive) {
        clearInterval(intervalId);
        return;
      }

      // Generate data if a generator is registered
      const generator = this.generators.get(streamId);

      if (generator) {
        const generatedData = generator.generateData();
        this.addDataToStream(streamId, generatedData);
      }
    }, stream.frequency);
  }

  // Common data generators

  /**
   * Create a sine wave data generator
   */
  public createSineWaveGenerator(
    amplitude: number = 50,
    offset: number = 50,
    period: number = 20,
    noise: number = 0
  ): DataGenerator<number> {
    let step = 0;

    return {
      generateData: () => {
        const value = Math.sin((step / period) * 2 * Math.PI) * amplitude + offset;
        const noisyValue = value + (Math.random() * 2 - 1) * noise;

        step++;

        return noisyValue;
      },
      configureGenerator: (config: Record<string, unknown>) => {
        if (typeof config.amplitude === 'number') amplitude = config.amplitude;
        if (typeof config.offset === 'number') offset = config.offset;
        if (typeof config.period === 'number') period = config.period;
        if (typeof config.noise === 'number') noise = config.noise;

        // Reset step if requested
        if (config.resetStep) step = 0;
      },
    };
  }

  /**
   * Create a random walk data generator
   */
  public createRandomWalkGenerator(
    initialValue: number = 50,
    step: number = 1,
    bounds: [number, number] = [0, 100]
  ): DataGenerator<number> {
    let currentValue = initialValue;

    return {
      generateData: () => {
        // Random step between -step and +step
        const randomStep = (Math.random() * 2 - 1) * step;

        // Update value and apply bounds
        currentValue = Math.max(bounds[0], Math.min(bounds[1], currentValue + randomStep));

        return currentValue;
      },
      configureGenerator: (config: Record<string, unknown>) => {
        if (typeof config.step === 'number') step = config.step;
        if (Array.isArray(config.bounds) && config.bounds.length === 2) {
          bounds = config.bounds as [number, number];
        }
        if (typeof config.reset === 'number') currentValue = config.reset;
      },
    };
  }

  /**
   * Create a data point generator for exploration data
   */
  public createExplorationDataGenerator(
    type: 'sector' | 'anomaly' | 'resource',
    baseCoordinates: { x: number; y: number } = { x: 0, y: 0 },
    radius: number = 10
  ): DataGenerator<DataPoint> {
    let idCounter = 0;

    return {
      generateData: () => {
        idCounter++;

        // Random position within radius
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * radius;
        const x = baseCoordinates.x + Math.cos(angle) * distance;
        const y = baseCoordinates.y + Math.sin(angle) * distance;

        // Generate basic data point
        const dataPoint: DataPoint = {
          id: `${type}-${idCounter}`,
          type,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${idCounter}`,
          date: Date.now(),
          coordinates: { x, y },
          properties: {},
        };

        // Add type-specific properties
        switch (type) {
          case 'sector':
            dataPoint.properties = {
              status: ['unexplored', 'explored', 'surveyed'][Math.floor(Math.random() * 3)],
              resourcePotential: Math.random() * 100,
              habitabilityScore: Math.random() * 100,
              anomalyCount: Math.floor(Math.random() * 5),
              resourceCount: Math.floor(Math.random() * 10),
            };
            break;

          case 'anomaly':
            dataPoint.properties = {
              type: ['spatial', 'temporal', 'gravitational', 'magnetic', 'radiation'][
                Math.floor(Math.random() * 5)
              ],
              severity: Math.random() * 10,
              description: `Anomaly description ${idCounter}`,
              investigatedAt: Math.random() > 0.5 ? Date.now() - Math.random() * 1000000 : 0,
              sectorId: `sector-${Math.floor(Math.random() * 100)}`,
            };
            break;

          case 'resource':
            dataPoint.properties = {
              type: ['minerals', 'energy', 'gas', 'exotic', 'biomass'][
                Math.floor(Math.random() * 5)
              ],
              amount: Math.random() * 1000,
              quality: Math.random() * 10,
              accessibility: Math.random() * 10,
              sectorId: `sector-${Math.floor(Math.random() * 100)}`,
            };

            // Add metadata
            dataPoint.metadata = {
              estimatedValue:
                (dataPoint.properties.amount as number) * (dataPoint.properties.quality as number),
              purityGrade: ['Impure', 'Low-Grade', 'Standard', 'Premium', 'Ultra-Pure'][
                Math.floor(Math.random() * 5)
              ],
            };
            break;
        }

        return dataPoint;
      },
      configureGenerator: (config: Record<string, unknown>) => {
        if (typeof config.baseX === 'number' && typeof config.baseY === 'number') {
          baseCoordinates = { x: config.baseX, y: config.baseY };
        }
        if (typeof config.radius === 'number') radius = config.radius;
        if (config.resetCounter) idCounter = 0;
      },
    };
  }

  /**
   * Start a data stream
   */
  public startStream(streamId: string): void {
    const stream = this.streams.get(streamId);

    if (!stream) {
      console.error(`Stream with ID ${streamId} not found.`);
      return;
    }

    stream.start();
  }

  /**
   * Stop a data stream
   */
  public stopStream(streamId: string): void {
    const stream = this.streams.get(streamId);

    if (!stream) {
      console.error(`Stream with ID ${streamId} not found.`);
      return;
    }

    stream.stop();
  }
}
