import { SessionPerformanceData, UserInteractionData } from './SessionPerformanceTracker';

/**
 * Interface for user behavior pattern
 */
export interface UserBehaviorPattern {
  patternType:
    | 'frequent_interaction'
    | 'rapid_sequence'
    | 'complex_operation'
    | 'sustained_activity'
    | 'custom';
  description: string;
  frequency: number;
  impactScore: number;
  relatedMetrics: string[];
  confidence: number;
}

/**
 * Interface for behavior-performance correlation result
 */
export interface BehaviorPerformanceCorrelation {
  behaviorMetric: string;
  performanceMetric: string;
  correlationCoefficient: number;
  significance: 'none' | 'weak' | 'moderate' | 'strong';
  sampleSize: number;
  description: string;
}

/**
 * Configuration options for behavior correlation analysis
 */
export interface BehaviorCorrelationConfig {
  minDataPoints: number;
  significanceThreshold: number;
  timeWindowMs: number;
  behaviorMetrics: string[];
  performanceMetrics: string[];
  groupSimilarInteractions: boolean;
}

/**
 * Service that analyzes correlations between user behavior and performance metrics
 */
export class UserBehaviorCorrelationAnalysis {
  private config: BehaviorCorrelationConfig;

  constructor(config?: Partial<BehaviorCorrelationConfig>) {
    // Default configuration
    this.config = {
      minDataPoints: 10,
      significanceThreshold: 0.3,
      timeWindowMs: 60000, // 1 minute
      behaviorMetrics: ['interactionFrequency', 'responseTime', 'interactionType'],
      performanceMetrics: ['fps', 'renderTime', 'memoryUsage', 'cpuUsage'],
      groupSimilarInteractions: true,
      ...config,
    };
  }

  /**
   * Analyze correlation between user behavior and performance metrics
   */
  public analyzeCorrelations(sessions: SessionPerformanceData[]): BehaviorPerformanceCorrelation[] {
    if (!sessions || sessions.length === 0) {
      return [];
    }

    const correlations: BehaviorPerformanceCorrelation[] = [];

    // Extract behavior metrics
    const behaviorMetrics = this.extractBehaviorMetrics(sessions);

    // Extract performance metrics
    const performanceMetrics = this.extractPerformanceMetrics(sessions);

    // Calculate correlations between behavior and performance metrics
    for (const behaviorMetric of Object.keys(behaviorMetrics)) {
      for (const performanceMetric of Object.keys(performanceMetrics)) {
        const behaviorValues = behaviorMetrics[behaviorMetric];
        const performanceValues = performanceMetrics[performanceMetric];

        // Find matching timestamps (within the time window)
        const pairedData: [number, number][] = [];

        behaviorValues.forEach(behaviorPoint => {
          // Find performance points within the time window
          const matchingPoints = performanceValues.filter(
            perfPoint =>
              Math.abs(perfPoint.timestamp - behaviorPoint.timestamp) <=
              this.config.timeWindowMs / 2
          );

          if (matchingPoints.length > 0) {
            // Use the average if multiple matching points
            const avgPerformanceValue =
              matchingPoints.reduce((sum, point) => sum + point.value, 0) / matchingPoints.length;
            pairedData.push([behaviorPoint.value, avgPerformanceValue]);
          }
        });

        // Only calculate correlation if we have enough data points
        if (pairedData.length >= this.config.minDataPoints) {
          const correlation = this.calculatePearsonCorrelation(
            pairedData.map(pair => pair[0]),
            pairedData.map(pair => pair[1])
          );

          // Determine significance
          const significance = this.determineSignificance(correlation);

          // Only include significant correlations
          if (Math.abs(correlation) >= this.config.significanceThreshold) {
            correlations.push({
              behaviorMetric,
              performanceMetric,
              correlationCoefficient: correlation,
              significance,
              sampleSize: pairedData.length,
              description: this.generateCorrelationDescription(
                behaviorMetric,
                performanceMetric,
                correlation
              ),
            });
          }
        }
      }
    }

    return correlations;
  }

  /**
   * Identify user behavior patterns from session data
   */
  public identifyBehaviorPatterns(sessions: SessionPerformanceData[]): UserBehaviorPattern[] {
    if (!sessions || sessions.length === 0) {
      return [];
    }

    const patterns: UserBehaviorPattern[] = [];

    // Aggregate all interactions across sessions
    const allInteractions = sessions.flatMap(session => session.userInteractions);

    // No interactions to analyze
    if (allInteractions.length === 0) {
      return [];
    }

    // Group interactions by type
    const interactionsByType = this.groupInteractionsByType(allInteractions);

    // Analyze frequent interaction patterns
    this.analyzeFrequentInteractions(interactionsByType, patterns);

    // Analyze rapid sequence patterns
    this.analyzeRapidSequences(allInteractions, patterns);

    // Analyze complex operations (sequences of different interaction types)
    this.analyzeComplexOperations(allInteractions, patterns);

    // Analyze sustained activity
    this.analyzeSustainedActivity(sessions, patterns);

    return patterns;
  }

  /**
   * Extract behavior metrics from session data
   */
  private extractBehaviorMetrics(
    sessions: SessionPerformanceData[]
  ): Record<string, { timestamp: number; value: number }[]> {
    const metrics: Record<string, { timestamp: number; value: number }[]> = {};

    // Initialize metrics
    for (const metric of this.config.behaviorMetrics) {
      metrics[metric] = [];
    }

    sessions.forEach(session => {
      // Skip sessions with no interactions
      if (!session.userInteractions || session.userInteractions.length === 0) {
        return;
      }

      // Calculate interaction frequency (interactions per minute)
      if (this.config.behaviorMetrics.includes('interactionFrequency')) {
        const sessionDurationMs =
          Math.max(...session.userInteractions.map(i => i.timestamp)) -
          Math.min(...session.userInteractions.map(i => i.timestamp));

        if (sessionDurationMs > 0) {
          const frequency = (session.userInteractions.length / sessionDurationMs) * 60000;
          metrics.interactionFrequency.push({
            timestamp: session.timestamp,
            value: frequency,
          });
        }
      }

      // Calculate average response time
      if (this.config.behaviorMetrics.includes('responseTime')) {
        const avgResponseTime =
          session.userInteractions.reduce((sum, interaction) => sum + interaction.responseTime, 0) /
          session.userInteractions.length;

        metrics.responseTime.push({
          timestamp: session.timestamp,
          value: avgResponseTime,
        });
      }

      // Calculate interaction type frequencies
      if (this.config.behaviorMetrics.includes('interactionType')) {
        const typeCount: Record<string, number> = {};

        session.userInteractions.forEach(interaction => {
          typeCount[interaction.interactionType] =
            (typeCount[interaction.interactionType] ?? 0) + 1;
        });

        Object.entries(typeCount).forEach(([type, count]) => {
          metrics[`interactionType:${type}`] = metrics[`interactionType:${type}`] ?? [];
          metrics[`interactionType:${type}`].push({
            timestamp: session.timestamp,
            value: count,
          });
        });
      }
    });

    return metrics;
  }

  /**
   * Extract performance metrics from session data
   */
  private extractPerformanceMetrics(
    sessions: SessionPerformanceData[]
  ): Record<string, { timestamp: number; value: number }[]> {
    const metrics: Record<string, { timestamp: number; value: number }[]> = {};

    // Initialize metrics
    for (const metric of this.config.performanceMetrics) {
      metrics[metric] = [];
    }

    sessions.forEach(session => {
      // Extract standard performance metrics
      if (this.config.performanceMetrics.includes('fps')) {
        metrics.fps.push({
          timestamp: session.timestamp,
          value: session.metrics.fps,
        });
      }

      if (this.config.performanceMetrics.includes('renderTime')) {
        metrics.renderTime.push({
          timestamp: session.timestamp,
          value: session.metrics.renderTime,
        });
      }

      if (this.config.performanceMetrics.includes('memoryUsage')) {
        metrics.memoryUsage.push({
          timestamp: session.timestamp,
          value: session.metrics.memoryUsage,
        });
      }

      if (this.config.performanceMetrics.includes('cpuUsage')) {
        metrics.cpuUsage.push({
          timestamp: session.timestamp,
          value: session.metrics.cpuUsage,
        });
      }

      if (this.config.performanceMetrics.includes('interactionLatency')) {
        metrics.interactionLatency.push({
          timestamp: session.timestamp,
          value: session.metrics.interactionLatency,
        });
      }

      // Extract resource utilization metrics
      session.metrics.resourceUtilization.forEach((value, resourceType) => {
        const metricName = `resourceUtilization:${resourceType}`;

        if (this.config.performanceMetrics.includes(metricName)) {
          metrics[metricName] = metrics[metricName] ?? [];
          metrics[metricName].push({
            timestamp: session.timestamp,
            value,
          });
        }
      });

      // Extract event processing time
      if (this.config.performanceMetrics.includes('eventProcessingTime')) {
        metrics.eventProcessingTime.push({
          timestamp: session.timestamp,
          value: session.metrics.eventProcessingTime,
        });
      }
    });

    return metrics;
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private calculatePearsonCorrelation(xValues: number[], yValues: number[]): number {
    if (xValues.length !== yValues.length || xValues.length === 0) {
      return 0;
    }

    const n = xValues.length;

    // Calculate means
    const meanX = xValues.reduce((sum, x) => sum + x, 0) / n;
    const meunknown = yValues.reduce((sum, y) => sum + y, 0) / n;

    // Calculate covariance and variances
    let covariance = 0;
    let varianceX = 0;
    let varianceY = 0;

    for (let i = 0; i < n; i++) {
      const diffX = xValues[i] - meanX;
      const diffY = yValues[i] - meunknown;

      covariance += diffX * diffY;
      varianceX += diffX * diffX;
      varianceY += diffY * diffY;
    }

    // Avoid division by zero
    if (varianceX === 0 || varianceY === 0) {
      return 0;
    }

    return covariance / Math.sqrt(varianceX * varianceY);
  }

  /**
   * Determine the significance of a correlation coefficient
   */
  private determineSignificance(correlation: number): 'none' | 'weak' | 'moderate' | 'strong' {
    const absCorrelation = Math.abs(correlation);

    if (absCorrelation < 0.3) {
      return 'none';
    } else if (absCorrelation < 0.5) {
      return 'weak';
    } else if (absCorrelation < 0.7) {
      return 'moderate';
    } else {
      return 'strong';
    }
  }

  /**
   * Generate a description for a correlation
   */
  private generateCorrelationDescription(
    behaviorMetric: string,
    performanceMetric: string,
    correlation: number
  ): string {
    const direction = correlation > 0 ? 'positive' : 'negative';
    const strength = this.determineSignificance(correlation);

    let behaviorDescription = behaviorMetric;
    if (behaviorMetric.startsWith('interactionType:')) {
      behaviorDescription = `${behaviorMetric.split(':')[1]} interactions`;
    }

    let performanceDescription = performanceMetric;
    if (performanceMetric.startsWith('resourceUtilization:')) {
      performanceDescription = `${performanceMetric.split(':')[1]} utilization`;
    }

    let impactDescription = '';
    if (direction === 'positive') {
      impactDescription = `As ${behaviorDescription} increases, ${performanceDescription} tends to increase`;
    } else {
      impactDescription = `As ${behaviorDescription} increases, ${performanceDescription} tends to decrease`;
    }

    if (strength === 'none' || strength === 'weak') {
      return `${impactDescription}, but the relationship is ${strength} (${correlation.toFixed(2)}).`;
    } else {
      return `${impactDescription}. This shows a ${strength} ${direction} correlation (${correlation.toFixed(2)}).`;
    }
  }

  /**
   * Group interactions by their type
   */
  private groupInteractionsByType(
    interactions: UserInteractionData[]
  ): Record<string, UserInteractionData[]> {
    const grouped: Record<string, UserInteractionData[]> = {};

    interactions.forEach(interaction => {
      const type = interaction.interactionType;
      grouped[type] = grouped[type] ?? [];
      grouped[type].push(interaction);
    });

    return grouped;
  }

  /**
   * Analyze frequent interaction patterns
   */
  private analyzeFrequentInteractions(
    interactionsByType: Record<string, UserInteractionData[]>,
    patterns: UserBehaviorPattern[]
  ): void {
    const totalInteractions = Object.values(interactionsByType).flat().length;

    if (totalInteractions === 0) {
      return;
    }

    Object.entries(interactionsByType).forEach(([type, interactions]) => {
      const frequency = interactions.length / totalInteractions;

      if (frequency > 0.2) {
        // If the interaction type makes up more than 20% of all interactions
        patterns.push({
          patternType: 'frequent_interaction',
          description: `Frequent use of ${type} interactions (${Math.round(frequency * 100)}% of all interactions)`,
          frequency,
          impactScore: frequency * 0.8, // Impact score based on frequency
          relatedMetrics: ['interactionFrequency', `interactionType:${type}`],
          confidence: 0.7 + frequency * 0.3, // Higher confidence for more frequent patterns
        });
      }
    });
  }

  /**
   * Analyze rapid sequence patterns (multiple interactions in quick succession)
   */
  private analyzeRapidSequences(
    interactions: UserInteractionData[],
    patterns: UserBehaviorPattern[]
  ): void {
    if (interactions.length < 3) {
      return;
    }

    // Sort interactions by timestamp
    const sortedInteractions = [...interactions].sort((a, b) => a.timestamp - b.timestamp);

    // Look for rapid sequences (interactions within 1 second of each other)
    const rapidSequences: UserInteractionData[][] = [];
    let currentSequence: UserInteractionData[] = [sortedInteractions[0]];

    for (let i = 1; i < sortedInteractions.length; i++) {
      const current = sortedInteractions[i];
      const previous = sortedInteractions[i - 1];

      if (current.timestamp - previous.timestamp <= 1000) {
        currentSequence.push(current);
      } else {
        if (currentSequence.length >= 3) {
          rapidSequences.push([...currentSequence]);
        }
        currentSequence = [current];
      }
    }

    // Add the last sequence if it's rapid
    if (currentSequence.length >= 3) {
      rapidSequences.push(currentSequence);
    }

    // Analyze rapid sequences
    rapidSequences.forEach(sequence => {
      const types = new Set(sequence.map(i => i.interactionType));
      const avgResponseTime =
        sequence.reduce((sum, i) => sum + i.responseTime, 0) / sequence.length;

      patterns.push({
        patternType: 'rapid_sequence',
        description: `Rapid sequence of ${sequence.length} interactions (${Array.from(types).join(', ')})`,
        frequency: sequence.length / interactions.length,
        impactScore: 0.6 + (avgResponseTime > 100 ? 0.3 : 0), // Higher impact if response time is slow
        relatedMetrics: ['responseTime', 'interactionFrequency'],
        confidence: 0.6 + sequence.length / 20, // Higher confidence for longer sequences, max 0.9
      });
    });
  }

  /**
   * Analyze complex operations (sequences of different interaction types)
   */
  private analyzeComplexOperations(
    interactions: UserInteractionData[],
    patterns: UserBehaviorPattern[]
  ): void {
    if (interactions.length < 5) {
      return;
    }

    // Sort interactions by timestamp
    const sortedInteractions = [...interactions].sort((a, b) => a.timestamp - b.timestamp);

    // Look for complex operations (sequences of 5+ interactions with at least 3 different types within 5 seconds)
    const complexOperations: UserInteractionData[][] = [];
    let currentOperation: UserInteractionData[] = [sortedInteractions[0]];

    for (let i = 1; i < sortedInteractions.length; i++) {
      const current = sortedInteractions[i];
      const operationStart = currentOperation[0];

      if (current.timestamp - operationStart.timestamp <= 5000) {
        currentOperation.push(current);
      } else {
        const uniqueTypes = new Set(currentOperation.map(i => i.interactionType));
        if (currentOperation.length >= 5 && uniqueTypes.size >= 3) {
          complexOperations.push([...currentOperation]);
        }
        currentOperation = [current];
      }
    }

    // Add the last operation if it's complex
    const uniqueTypes = new Set(currentOperation.map(i => i.interactionType));
    if (currentOperation.length >= 5 && uniqueTypes.size >= 3) {
      complexOperations.push(currentOperation);
    }

    // Analyze complex operations
    complexOperations.forEach(operation => {
      const types = new Set(operation.map(i => i.interactionType));
      const typeCount = Array.from(types)
        .map(type => `${type} (${operation.filter(i => i.interactionType === type).length})`)
        .join(', ');

      patterns.push({
        patternType: 'complex_operation',
        description: `Complex operation with ${operation.length} interactions: ${typeCount}`,
        frequency: operation.length / interactions.length,
        impactScore: 0.7 + types.size / 10, // Higher impact for more diverse operations
        relatedMetrics: ['responseTime', 'eventProcessingTime', 'cpuUsage'],
        confidence: 0.7,
      });
    });
  }

  /**
   * Analyze sustained activity patterns
   */
  private analyzeSustainedActivity(
    sessions: SessionPerformanceData[],
    patterns: UserBehaviorPattern[]
  ): void {
    // Find sessions with continuous activity for extended periods
    sessions.forEach(session => {
      if (!session.userInteractions || session.userInteractions.length < 10) {
        return;
      }

      // Sort interactions by timestamp
      const sortedInteractions = [...session.userInteractions].sort(
        (a, b) => a.timestamp - b.timestamp
      );

      // Calculate session duration
      const sessionDuration =
        sortedInteractions[sortedInteractions.length - 1].timestamp -
        sortedInteractions[0].timestamp;

      // Calculate average time between interactions
      let totalGap = 0;
      for (let i = 1; i < sortedInteractions.length; i++) {
        totalGap += sortedInteractions[i].timestamp - sortedInteractions[i - 1].timestamp;
      }
      const avgGap = totalGap / (sortedInteractions.length - 1);

      // If session is longer than 5 minutes and has consistent activity
      if (sessionDuration > 300000 && avgGap < 30000) {
        patterns.push({
          patternType: 'sustained_activity',
          description: `Sustained activity for ${Math.round(sessionDuration / 60000)} minutes with ${sortedInteractions.length} interactions`,
          frequency: sortedInteractions.length / sessionDuration,
          impactScore: 0.8,
          relatedMetrics: ['memoryUsage', 'cpuUsage', 'fps'],
          confidence: 0.8,
        });
      }
    });
  }
}
