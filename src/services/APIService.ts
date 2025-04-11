import { AbstractBaseService } from '../lib/services/BaseService';
import { ErrorType, errorLoggingService } from './ErrorLoggingService';

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface StreamConfig {
  batchSize: number;
  interval: number;
  maxRetries: number;
}

export interface TimeSeriesAggregation {
  interval: 'minute' | 'hour' | 'day' | 'week' | 'month';
  aggregationType: 'sum' | 'avg' | 'min' | 'max' | 'count';
  fields: string[];
}

class APIServiceImpl extends AbstractBaseService<APIServiceImpl> {
  private activeStreams: Map<string, AbortController> = new Map();
  private streamListeners: Map<string, Set<(data: unknown) => void>> = new Map();

  private defaultStreamConfig: StreamConfig = {
    batchSize: 100,
    interval: 1000,
    maxRetries: 3,
  };

  public constructor() {
    super('APIService', '1.0.0');
  }

  protected async onInitialize(): Promise<void> {
    // Initialize metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    this.metadata.metrics = {
      total_requests: 0,
      active_streams: 0,
      failed_requests: 0,
      average_response_time: 0,
      cache_hit_rate: 0,
    };
  }

  protected async onDispose(): Promise<void> {
    // Stop all active streams
    for (const [streamId] of this.activeStreams) {
      await this.stopStream(streamId);
    }
  }

  public async fetchPaginated<T>(
    endpoint: string,
    params: PaginationParams
  ): Promise<PaginatedResponse<T>> {
    const startTime = performance.now();

    try {
      // Build query string
      const queryParams = new URLSearchParams({
        page: params.page.toString(),
        pageSize: params.pageSize.toString(),
        ...(params.sortBy && { sortBy: params.sortBy }),
        ...(params.sortOrder && { sortOrder: params.sortOrder }),
        ...(params.filters && { filters: JSON.stringify(params.filters) }),
      });

      // Make request
      const response = await fetch(`${endpoint}?${queryParams}`);
      if (!response || !response.ok) {
        throw new Error(`HTTP error! status: ${response?.status}`);
      }

      const result = await response.json();

      // Update metrics
      this.updateMetrics('success', startTime);

      return {
        data: result?.data,
        total: result?.total,
        page: params.page,
        pageSize: params.pageSize,
        hasMore: result?.total > params.page * params.pageSize,
      };
    } catch (error) {
      this.updateMetrics('error', startTime);
      throw error;
    }
  }

  public async startStream(
    endpoint: string,
    onData: (data: unknown) => void,
    config: Partial<StreamConfig> = {}
  ): Promise<string> {
    const streamId = crypto.randomUUID();
    const streamConfig = { ...this.defaultStreamConfig, ...config };
    const abortController = new AbortController();

    // Store stream control
    this.activeStreams.set(streamId, abortController);

    // Initialize listener set if needed
    if (!this.streamListeners.has(endpoint)) {
      this.streamListeners.set(endpoint, new Set());
    }
    this.streamListeners.get(endpoint)!.add(onData);

    // Start streaming
    this.streamData(endpoint, streamConfig, abortController.signal);

    // Update metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const { metrics } = this.metadata;
    metrics.active_streams = this.activeStreams.size;
    this.metadata.metrics = metrics;

    return streamId;
  }

  public async stopStream(streamId: string): Promise<void> {
    const controller = this.activeStreams.get(streamId);
    if (!controller) {
      return;
    }

    controller.abort();
    this.activeStreams.delete(streamId);

    // Update metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const { metrics } = this.metadata;
    metrics.active_streams = this.activeStreams.size;
    this.metadata.metrics = metrics;
  }

  private async streamData(
    endpoint: string,
    config: StreamConfig,
    signal: AbortSignal
  ): Promise<void> {
    let lastId: string | undefined;
    let retryCount = 0;

    while (!signal.aborted) {
      try {
        // Build query for next batch
        const queryParams = new URLSearchParams({
          batchSize: config.batchSize.toString(),
          ...(lastId && { after: lastId }),
        });

        // Fetch next batch
        const response = await fetch(`${endpoint}?${queryParams}`, { signal });
        if (!response || !response.ok) {
          throw new Error(`HTTP error! status: ${response?.status}`);
        }

        // Safely parse JSON
        const result = await response.json();
        const { data, lastItemId } = result;
        if (lastItemId) {
          lastId = lastItemId;
        }

        // Notify listeners
        const listeners = this.streamListeners.get(endpoint) || new Set();
        for (const listener of listeners) {
          listener(data);
        }

        // Reset retry count on success
        retryCount = 0;

        // Wait for next interval
        await new Promise(resolve => setTimeout(resolve, config.interval));
      } catch (error) {
        if (signal.aborted) {
          break;
        }

        retryCount++;
        if (retryCount >= config.maxRetries) {
          this.handleError(error as Error);
          break;
        }

        // Exponential backoff
        await new Promise(resolve =>
          setTimeout(resolve, Math.min(1000 * Math.pow(2, retryCount), 30000))
        );
      }
    }

    // Clean up listeners when stream ends
    const listeners = this.streamListeners.get(endpoint);
    if (listeners) {
      listeners.clear();
      this.streamListeners.delete(endpoint);
    }
  }

  public async aggregateTimeSeries(
    endpoint: string,
    timeRange: { start: Date; end: Date },
    aggregation: TimeSeriesAggregation
  ): Promise<unknown[]> {
    const startTime = performance.now();

    try {
      const queryParams = new URLSearchParams({
        start: timeRange.start.toISOString(),
        end: timeRange.end.toISOString(),
        interval: aggregation.interval,
        aggregationType: aggregation.aggregationType,
        fields: aggregation.fields.join(','),
      });

      const response = await fetch(`${endpoint}/aggregate?${queryParams}`);
      if (!response || !response.ok) {
        throw new Error(`HTTP error! status: ${response?.status}`);
      }

      const result = await response.json();

      // Update metrics
      this.updateMetrics('success', startTime);

      return result;
    } catch (error) {
      this.updateMetrics('error', startTime);
      throw error;
    }
  }

  private updateMetrics(status: 'success' | 'error', startTime: number): void {
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const { metrics } = this.metadata;
    metrics.total_requests = (metrics.total_requests ?? 0) + 1;

    if (status === 'error') {
      metrics.failed_requests = (metrics.failed_requests ?? 0) + 1;
    }

    const responseTime = performance.now() - startTime;
    metrics.average_response_time = metrics.average_response_time
      ? (metrics.average_response_time + responseTime) / 2
      : responseTime;

    this.metadata.metrics = metrics;
  }

  public override handleError(error: Error): void {
    errorLoggingService.logError(error, ErrorType.NETWORK, undefined, {
      service: 'APIService',
    });
  }
}

// Export singleton instance
export const apiService = new APIServiceImpl();

// Export default for easier imports
export default apiService;
