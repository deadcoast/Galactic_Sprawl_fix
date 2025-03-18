import { AbstractBaseService } from '../lib/services/BaseService';
import { ErrorType, errorLoggingService } from './ErrorLoggingService';

export interface DataPoint {
  id: string;
  values: number[];
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

export interface AnomalyScore {
  dataPointId: string;
  score: number; // 0-1 where higher means more likely to be an anomaly
  confidence: number; // 0-1 confidence in the prediction
  explanation?: string[];
  detectionMethod: 'statistical' | 'isolationForest';
}

export interface StatisticalThresholds {
  zscore: number; // Number of standard deviations for zscore method
  iqrFactor: number; // Factor to multiply IQR for outlier detection
  minSampleSize: number; // Minimum samples needed for statistical validity
}

class AnomalyDetectionServiceImpl extends AbstractBaseService {
  private static instance: AnomalyDetectionServiceImpl;
  private dataPoints: DataPoint[] = [];
  private anomalyScores: Map<string, AnomalyScore> = new Map();
  private thresholds: StatisticalThresholds = {
    zscore: 3,
    iqrFactor: 1.5,
    minSampleSize: 30,
  };

  private constructor() {
    super('AnomalyDetectionService', '1.0.0');
  }

  public static getInstance(): AnomalyDetectionServiceImpl {
    if (!AnomalyDetectionServiceImpl.instance) {
      AnomalyDetectionServiceImpl.instance = new AnomalyDetectionServiceImpl();
    }
    return AnomalyDetectionServiceImpl.instance;
  }

  protected async onInitialize(): Promise<void> {
    // Initialize metrics
    this.metadata.metrics = {
      total_datapoints: 0,
      total_anomalies: 0,
      last_detection_run: 0,
      average_detection_time: 0,
    };
  }

  protected async onDispose(): Promise<void> {
    // Clear all data
    this.dataPoints = [];
    this.anomalyScores.clear();
  }

  public addDataPoints(points: DataPoint[]): void {
    this.dataPoints.push(...points);

    // Update metrics
    const metrics = this.metadata.metrics || {};
    metrics.total_datapoints = this.dataPoints.length;
    this.metadata.metrics = metrics;
  }

  public async detectAnomalies(
    method: 'statistical' | 'isolationForest' = 'statistical'
  ): Promise<AnomalyScore[]> {
    const startTime = performance.now();

    try {
      let scores: AnomalyScore[];

      if (method === 'statistical') {
        scores = await this.detectStatisticalAnomalies();
      } else {
        scores = await this.detectIsolationForestAnomalies();
      }

      // Store scores in map
      scores.forEach(score => this.anomalyScores.set(score.dataPointId, score));

      // Update metrics
      const metrics = this.metadata.metrics || {};
      metrics.total_anomalies = scores.filter(s => s.score > 0.7).length;
      metrics.last_detection_run = Date.now();

      const detectionTime = performance.now() - startTime;
      metrics.average_detection_time = metrics.average_detection_time
        ? (metrics.average_detection_time + detectionTime) / 2
        : detectionTime;

      this.metadata.metrics = metrics;

      return scores;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  private async detectStatisticalAnomalies(): Promise<AnomalyScore[]> {
    if (this.dataPoints.length < this.thresholds.minSampleSize) {
      throw new Error(
        `Insufficient data points for statistical analysis. Need at least ${this.thresholds.minSampleSize}`
      );
    }

    const scores: AnomalyScore[] = [];

    // Calculate mean and standard deviation for each dimension
    const dimensions = this.dataPoints[0].values.length;
    const stats = Array.from({ length: dimensions }, (_, dim) => {
      const values = this.dataPoints.map(p => p.values[dim]);
      const mean = values.reduce((a, b) => a + b) / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const std = Math.sqrt(variance);
      return { mean, std };
    });

    // Calculate z-scores for each point
    for (const point of this.dataPoints) {
      const zscores = point.values.map((v, i) => Math.abs((v - stats[i].mean) / stats[i].std));
      const maxZscore = Math.max(...zscores);
      const anomalousDimensions = zscores
        .map((z, i) => (z > this.thresholds.zscore ? i : -1))
        .filter(i => i !== -1);

      scores.push({
        dataPointId: point.id,
        score: Math.min(maxZscore / (2 * this.thresholds.zscore), 1),
        confidence: 0.8,
        explanation: anomalousDimensions.map(
          dim => `Dimension ${dim} has z-score ${zscores[dim].toFixed(2)}`
        ),
        detectionMethod: 'statistical',
      });
    }

    return scores;
  }

  private async detectIsolationForestAnomalies(): Promise<AnomalyScore[]> {
    // This is a placeholder for the isolation forest implementation
    // In a real implementation, you would use a proper machine learning library
    throw new Error('Isolation Forest implementation pending');
  }

  public getAnomalyScore(dataPointId: string): AnomalyScore | undefined {
    return this.anomalyScores.get(dataPointId);
  }

  public override handleError(error: Error): void {
    errorLoggingService.logError(error, ErrorType.RUNTIME, undefined, {
      service: 'AnomalyDetectionService',
    });
  }
}

// Export singleton instance
export const anomalyDetectionService = AnomalyDetectionServiceImpl.getInstance();

// Export default for easier imports
export default anomalyDetectionService;
