import { moduleEventBus } from '../../lib/modules/ModuleEvents';
import { ResourceType } from '../../types/resources/ResourceTypes';

export interface PerformanceMetrics {
  timestamp: number;
  resourceType: ResourceType;
  productionRate: number;
  consumptionRate: number;
  transferRate: number;
  utilizationRate: number;
  efficiency: number;
}

export interface ResourcePerformanceSnapshot {
  metrics: Map<ResourceType, PerformanceMetrics>;
  systemLoad: number;
  bottlenecks: ResourceType[];
  recommendations: string[];
}

/**
 * Monitors and analyzes resource management performance
 */
export class ResourcePerformanceMonitor {
  private metricsHistory: Map<ResourceType, PerformanceMetrics[]>;
  private snapshotInterval: number;
  private maxHistoryLength: number;
  private lastSnapshotTime: number;

  constructor(snapshotInterval = 5000, maxHistoryLength = 100) {
    this.metricsHistory = new Map();
    this.snapshotInterval = snapshotInterval;
    this.maxHistoryLength = maxHistoryLength;
    this.lastSnapshotTime = Date.now();

    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Starts the performance monitoring
   */
  private startMonitoring(): void {
    setInterval(() => this.takeSnapshot(), this.snapshotInterval);
    console.debug('[ResourcePerformanceMonitor] Started monitoring');
  }

  /**
   * Records performance metrics for a resource
   */
  recordMetrics(
    type: ResourceType,
    productionRate: number,
    consumptionRate: number,
    transferRate: number,
    utilizationRate: number
  ): void {
    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      resourceType: type,
      productionRate,
      consumptionRate,
      transferRate,
      utilizationRate,
      efficiency: this.calculateEfficiency(productionRate, consumptionRate, utilizationRate),
    };

    if (!this.metricsHistory.has(type)) {
      this.metricsHistory.set(type, []);
    }

    const history = this.metricsHistory.get(type)!;
    history.push(metrics);

    // Trim history if needed
    if (history.length > this.maxHistoryLength) {
      history.shift();
    }
  }

  /**
   * Calculates resource efficiency
   */
  private calculateEfficiency(
    production: number,
    consumption: number,
    utilization: number
  ): number {
    // Efficiency formula: balance between production matching consumption
    // and good utilization (not too full, not too empty)
    const productionBalance = consumption > 0 ? Math.min(production / consumption, 1.5) : 1.0;
    const utilizationScore = 1 - Math.abs(0.5 - utilization);
    return (productionBalance + utilizationScore) / 2;
  }

  /**
   * Takes a performance snapshot
   */
  private takeSnapshot(): void {
    const snapshot = this.generateSnapshot();
    this.lastSnapshotTime = Date.now();

    // Emit performance snapshot
    moduleEventBus.emit({
      type: 'STATUS_CHANGED',
      moduleId: 'resource-performance-monitor',
      moduleType: 'resource-manager',
      timestamp: Date.now(),
      data: {
        type: 'performance_snapshot',
        snapshot,
      },
    });

    // Log performance insights
    this.logPerformanceInsights(snapshot);
  }

  /**
   * Generates a performance snapshot
   */
  private generateSnapshot(): ResourcePerformanceSnapshot {
    const metrics = new Map<ResourceType, PerformanceMetrics>();
    const bottlenecks: ResourceType[] = [];
    const recommendations: string[] = [];

    // Calculate current metrics for each resource
    for (const [type, history] of this.metricsHistory) {
      if (history.length === 0) {
        continue;
      }

      const latest = history[history.length - 1];
      metrics.set(type, latest);

      // Identify bottlenecks
      if (latest.efficiency < 0.6) {
        bottlenecks.push(type);

        // Generate recommendations
        if (latest.productionRate < latest.consumptionRate) {
          recommendations.push(
            `Increase production rate for ${type} (current: ${latest.productionRate.toFixed(2)}, needed: ${latest.consumptionRate.toFixed(2)})`
          );
        } else if (latest.utilizationRate > 0.9) {
          recommendations.push(
            `Consider increasing storage capacity for ${type} (utilization: ${(latest.utilizationRate * 100).toFixed(1)}%)`
          );
        } else if (latest.utilizationRate < 0.1) {
          recommendations.push(
            `Optimize consumption or reduce production of ${type} (utilization: ${(latest.utilizationRate * 100).toFixed(1)}%)`
          );
        }
      }
    }

    // Calculate system load (average utilization across all resources)
    const systemLoad =
      Array.from(metrics.values()).reduce((sum, m) => sum + m.utilizationRate, 0) /
      Math.max(metrics.size, 1);

    return {
      metrics,
      systemLoad,
      bottlenecks,
      recommendations,
    };
  }

  /**
   * Logs performance insights
   */
  private logPerformanceInsights(snapshot: ResourcePerformanceSnapshot): void {
    console.debug(`[ResourcePerformanceMonitor] Performance Snapshot:
      System Load: ${(snapshot.systemLoad * 100).toFixed(1)}%
      Bottlenecks: ${snapshot.bottlenecks.join(', ') || 'None'}
      
      Recommendations:
      ${snapshot.recommendations.map(r => `- ${r}`).join('\n      ') || '- No recommendations'}`);
  }

  /**
   * Gets performance history for a resource
   */
  getResourceHistory(type: ResourceType): PerformanceMetrics[] {
    return [...(this.metricsHistory.get(type) || [])];
  }

  /**
   * Gets the latest snapshot
   */
  getLatestSnapshot(): ResourcePerformanceSnapshot {
    return this.generateSnapshot();
  }

  /**
   * Cleans up the monitor
   */
  cleanup(): void {
    this.metricsHistory.clear();
    console.debug('[ResourcePerformanceMonitor] Cleaned up performance monitor');
  }

  /**
   * Get all metrics history
   */
  public getAllMetricsHistory(): Record<ResourceType, PerformanceMetrics[]> {
    const result: Record<ResourceType, PerformanceMetrics[]> = {} as Record<
      ResourceType,
      PerformanceMetrics[]
    >;

    for (const [type, metrics] of Array.from(this.metricsHistory)) {
      result[type] = [...metrics];
    }

    return result;
  }
}

// Export singleton instance
export const resourcePerformanceMonitor = new ResourcePerformanceMonitor();
