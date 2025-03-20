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

import { AbstractBaseService } from '../lib/services/BaseService';
import { apiService } from './APIService';
import { ErrorType, errorLoggingService } from './ErrorLoggingService';

export interface DataBuffer<T> {
  data: T[];
  capacity: number;
  head: number;
  tail: number;
  isFull: boolean;
}

export interface TimeWindow {
  duration: number; // in milliseconds
  resolution: number; // data points per window
}

export interface StreamConfig {
  bufferSize: number;
  batchSize: number;
  timeWindow?: TimeWindow;
  updateInterval: number;
}

export interface DataGenerator<T> {
  generateData: () => T;
  configureGenerator: (config: Record<string, unknown>) => void;
}

class RealTimeDataServiceImpl extends AbstractBaseService<RealTimeDataServiceImpl> {
  private dataBuffers: Map<string, DataBuffer<unknown>> = new Map();
  private streamConfigs: Map<string, StreamConfig> = new Map();
  private streamIds: Map<string, string> = new Map();
  private listeners: Map<string, Set<(data: unknown[]) => void>> = new Map();
  private generators: Map<string, DataGenerator<unknown>> = new Map();

  public constructor() {
    super('RealTimeDataService', '1.0.0');
  }

  protected async onInitialize(dependencies?: Record<string, unknown>): Promise<void> {
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    this.metadata.metrics = {
      active_streams: 0,
      total_data_points: 0,
      buffer_utilization: 0,
      update_rate: 0,
      generators_active: 0,
    };
  }

  protected async onDispose(): Promise<void> {
    const streamIds = Array.from(this.streamIds.values());
    await Promise.all(streamIds.map(id => this.stopStream(id)));

    this.dataBuffers.clear();
    this.streamConfigs.clear();
    this.streamIds.clear();
    this.listeners.clear();
    this.generators.clear();
  }

  public createBuffer<T>(id: string, capacity: number): DataBuffer<T> {
    const buffer: DataBuffer<T> = {
      data: new Array(capacity),
      capacity,
      head: 0,
      tail: 0,
      isFull: false,
    };
    this.dataBuffers.set(id, buffer);
    return buffer;
  }

  public appendData<T>(bufferId: string, newData: T[]): void {
    const buffer = this.dataBuffers.get(bufferId) as DataBuffer<T>;
    if (!buffer) {
      throw new Error(`Buffer '${bufferId}' not found`);
    }

    for (const item of newData) {
      buffer.data[buffer.tail] = item;
      buffer.tail = (buffer.tail + 1) % buffer.capacity;

      if (buffer.tail === buffer.head) {
        buffer.head = (buffer.head + 1) % buffer.capacity;
        buffer.isFull = true;
      }
    }

    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const metrics = this.metadata.metrics;
    metrics.total_data_points += newData.length;
    metrics.buffer_utilization = this.calculateBufferUtilization(buffer);
    this.metadata.metrics = metrics;

    this.notifyListeners(bufferId);
  }

  public async startStream<T>(
    endpoint: string,
    bufferId: string,
    config: Partial<StreamConfig> = {}
  ): Promise<void> {
    const defaultConfig: StreamConfig = {
      bufferSize: 1000,
      batchSize: 100,
      updateInterval: 1000,
    };

    const streamConfig = { ...defaultConfig, ...config };
    this.streamConfigs.set(bufferId, streamConfig);

    if (!this.dataBuffers.has(bufferId)) {
      this.createBuffer<T>(bufferId, streamConfig.bufferSize);
    }

    // Start API stream or generator stream
    const generator = this.generators.get(bufferId);
    if (generator) {
      this.startGeneratorStream(bufferId, streamConfig.updateInterval);
    } else {
      const streamId = await apiService.startStream(
        endpoint,
        data => this.handleStreamData(bufferId, data as T[]),
        {
          batchSize: streamConfig.batchSize,
          interval: streamConfig.updateInterval,
          maxRetries: 3,
        }
      );
      this.streamIds.set(bufferId, streamId);
    }

    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const metrics = this.metadata.metrics;
    metrics.active_streams = this.streamIds.size;
    this.metadata.metrics = metrics;
  }

  public async stopStream(bufferId: string): Promise<void> {
    const streamId = this.streamIds.get(bufferId);
    if (streamId) {
      await apiService.stopStream(streamId);
      this.streamIds.delete(bufferId);
    }

    // Stop generator if exists
    if (this.generators.has(bufferId)) {
      this.generators.delete(bufferId);
    }

    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const metrics = this.metadata.metrics;
    metrics.active_streams = this.streamIds.size;
    metrics.generators_active = this.generators.size;
    this.metadata.metrics = metrics;
  }

  public subscribe<T>(bufferId: string, callback: (data: T[]) => void): () => void {
    if (!this.listeners.has(bufferId)) {
      this.listeners.set(bufferId, new Set());
    }

    const listeners = this.listeners.get(bufferId)!;
    listeners.add(callback as (data: unknown[]) => void);

    return () => {
      listeners.delete(callback as (data: unknown[]) => void);
      if (listeners.size === 0) {
        this.listeners.delete(bufferId);
      }
    };
  }

  public getBufferData<T>(bufferId: string): T[] {
    const buffer = this.dataBuffers.get(bufferId) as DataBuffer<T>;
    if (!buffer) {
      throw new Error(`Buffer '${bufferId}' not found`);
    }

    if (buffer.head <= buffer.tail) {
      return buffer.data.slice(buffer.head, buffer.tail) as T[];
    } else {
      return [...buffer.data.slice(buffer.head), ...buffer.data.slice(0, buffer.tail)] as T[];
    }
  }

  public registerGenerator<T>(bufferId: string, generator: DataGenerator<T>): void {
    this.generators.set(bufferId, generator as DataGenerator<unknown>);

    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const metrics = this.metadata.metrics;
    metrics.generators_active = this.generators.size;
    this.metadata.metrics = metrics;
  }

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
        if (config.resetStep) step = 0;
      },
    };
  }

  public createRandomWalkGenerator(
    initialValue: number = 50,
    step: number = 1,
    bounds: [number, number] = [0, 100]
  ): DataGenerator<number> {
    let currentValue = initialValue;

    return {
      generateData: () => {
        const randomStep = (Math.random() * 2 - 1) * step;
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

  private handleStreamData<T>(bufferId: string, data: T[]): void {
    this.appendData(bufferId, data);

    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const metrics = this.metadata.metrics;
    const config = this.streamConfigs.get(bufferId);
    if (config) {
      metrics.update_rate = data.length / (config.updateInterval / 1000);
    }
    this.metadata.metrics = metrics;
  }

  private startGeneratorStream(bufferId: string, interval: number): void {
    const generator = this.generators.get(bufferId);
    if (!generator) return;

    const intervalId = setInterval(() => {
      const data = generator.generateData();
      this.appendData(bufferId, [data]);
    }, interval);

    // Store interval ID for cleanup
    this.streamIds.set(bufferId, intervalId.toString());
  }

  private notifyListeners(bufferId: string): void {
    const listeners = this.listeners.get(bufferId);
    if (!listeners) return;

    const data = this.getBufferData(bufferId);
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        this.handleError(error as Error);
      }
    });
  }

  private calculateBufferUtilization(buffer: DataBuffer<unknown>): number {
    if (buffer.isFull) return 1;
    return buffer.tail >= buffer.head
      ? (buffer.tail - buffer.head) / buffer.capacity
      : (buffer.capacity - buffer.head + buffer.tail) / buffer.capacity;
  }

  public override handleError(error: Error): void {
    errorLoggingService.logError(error, ErrorType.RUNTIME, undefined, {
      service: 'RealTimeDataService',
    });
  }
}

// Export singleton instance using direct instantiation
export const realTimeDataService = new RealTimeDataServiceImpl();

// Export default for easier imports
export default realTimeDataService;
