import * as React from 'react';
import { useComponentLifecycle } from '../../../hooks/ui/useComponentLifecycle';
import { useComponentRegistration } from '../../../hooks/ui/useComponentRegistration';
import { EventType } from '../../../types/events/EventTypes';
import { ResourceType, ResourceTypeInfo } from '../../../types/resources/ResourceTypes';

interface ResourceThresholdVisualizationProps {
  resourceType: ResourceType;
  currentValue: number;
  maxValue: number;
  rate: number; // Rate of change per cycle
  cycleTime: number; // Time in ms for each resource update cycle
  thresholds?: {
    critical?: number;
    low?: number;
    target?: number;
    high?: number;
    maximum?: number;
  };
}

interface ResourceStatus {
  level: 'critical' | 'low' | 'normal' | 'high' | 'maximum';
  color: string;
  message: string;
  warningLevel: number; // 0-3, with 3 being most severe
  percentToNextThreshold: number;
  nextThresholdName?: string;
  timeToThreshold?: number; // in minutes
}

/**
 * Get detailed resource status based on current value and thresholds
 */
const getResourceStatus = (
  currentValue: number,
  maxValue: number,
  rate: number,
  thresholds?: ResourceThresholdVisualizationProps['thresholds']
): ResourceStatus => {
  // Default status if no thresholds provided
  if (!thresholds) {
    return {
      level: 'normal',
      color: '#4caf50',
      message: 'Resource level is normal',
      warningLevel: 0,
      percentToNextThreshold: 0,
    };
  }

  const ratio = currentValue / maxValue;

  // Check if at critical level
  if (thresholds.critical && ratio <= thresholds.critical) {
    const percentToNext =
      thresholds.critical > 0 ? (currentValue / (maxValue * thresholds.critical)) * 100 : 0;

    // Calculate time to next threshold if rate is positive
    const timeToThreshold =
      rate > 0 ? (maxValue * (thresholds.low ?? 0) - currentValue) / rate : undefined;

    return {
      level: 'critical',
      color: '#f44336', // Red
      message: 'CRITICAL: Resource level dangerously low!',
      warningLevel: 3,
      percentToNextThreshold: percentToNext,
      nextThresholdName: 'low',
      timeToThreshold: timeToThreshold,
    };
  }

  // Check if at low level
  if (thresholds.low && ratio <= thresholds.low) {
    const percentToNext =
      ((currentValue - maxValue * (thresholds.critical ?? 0)) /
        (maxValue * (thresholds.low - (thresholds.critical ?? 0)))) *
      100;

    // Calculate time to next threshold
    const timeToThreshold =
      rate > 0
        ? (maxValue * (thresholds.target ?? 0) - currentValue) / rate
        : rate < 0
          ? (maxValue * (thresholds.critical ?? 0) - currentValue) / rate
          : undefined;

    return {
      level: 'low',
      color: '#ff9800', // Orange
      message: 'combatNING: Resource level is low',
      warningLevel: 2,
      percentToNextThreshold: percentToNext,
      nextThresholdName: rate > 0 ? 'target' : 'critical',
      timeToThreshold: timeToThreshold,
    };
  }

  // Check if at high level
  if (thresholds.high && ratio >= thresholds.high) {
    const percentToNext =
      ((currentValue - maxValue * (thresholds.target ?? 0)) /
        (maxValue * (thresholds.high - (thresholds.target ?? 0)))) *
      100;

    // Calculate time to next threshold
    const timeToThreshold =
      rate > 0
        ? (maxValue * (thresholds.maximum || 1) - currentValue) / rate
        : rate < 0
          ? (maxValue * (thresholds.target ?? 0) - currentValue) / rate
          : undefined;

    return {
      level: 'high',
      color: '#2196f3', // Blue
      message: 'Resource level is high',
      warningLevel: 0,
      percentToNextThreshold: percentToNext,
      nextThresholdName: rate > 0 ? 'maximum' : 'target',
      timeToThreshold: timeToThreshold,
    };
  }

  // Check if at maximum level
  if (thresholds.maximum && ratio >= thresholds.maximum) {
    return {
      level: 'maximum',
      color: '#673ab7', // Purple
      message: 'Resource at maximum capacity!',
      warningLevel: 1,
      percentToNextThreshold: 100,
      timeToThreshold: undefined,
    };
  }

  // Otherwise, resource is at normal/target level
  const percentToNext =
    rate > 0
      ? ((currentValue - maxValue * (thresholds.low ?? 0)) /
          (maxValue * ((thresholds.high || 1) - (thresholds.low ?? 0)))) *
        100
      : ((currentValue - maxValue * (thresholds.low ?? 0)) /
          (maxValue * ((thresholds.target ?? 0.5) - (thresholds.low ?? 0)))) *
        100;

  // Calculate time to next threshold
  const timeToThreshold =
    rate > 0
      ? (maxValue * (thresholds.high || 1) - currentValue) / rate
      : rate < 0
        ? (maxValue * (thresholds.low ?? 0) - currentValue) / rate
        : undefined;

  return {
    level: 'normal',
    color: '#4caf50', // Green
    message: 'Resource level is normal',
    warningLevel: 0,
    percentToNextThreshold: percentToNext,
    nextThresholdName: rate > 0 ? 'high' : 'low',
    timeToThreshold: timeToThreshold,
  };
};

/**
 * Format time in minutes to a human-readable format
 */
const formatTime = (minutes?: number): string => {
  if (minutes === undefined) {
    return 'N/A';
  }

  if (minutes < 0) {
    return `${Math.ceil(Math.abs(minutes))} min until depletion`;
  }

  if (minutes < 1) {
    return `${Math.round(minutes * 60)} seconds`;
  }

  if (minutes < 60) {
    return `${Math.round(minutes)} minutes`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
};

/**
 * Formats a resource type for display.
 */
function formatResourceType(resourceType: ResourceType): string {
  return ResourceTypeInfo[resourceType]?.displayName ?? resourceType;
}

/**
 * ResourceThresholdVisualization component
 */
const ResourceThresholdVisualization: React.FC<ResourceThresholdVisualizationProps> = ({
  resourceType,
  currentValue,
  maxValue,
  rate,
  cycleTime,
  thresholds,
}) => {
  // Get status based on current value and thresholds
  const status = getResourceStatus(currentValue, maxValue, rate, thresholds);

  // Convert cycle rate to per-minute rate for easier understanding
  const ratePerMinute = rate * (60000 / cycleTime);

  // Register with component registry
  useComponentRegistration({
    type: ResourceType.RESEARCH,
    eventSubscriptions: ['RESOURCE_UPDATED', 'RESOURCE_THRESHOLD_CHANGED'],
    updatePriority: 'medium',
  });

  // Use component lifecycle hook for event handling
  useComponentLifecycle({
    onMount: () => {
      console.warn(
        `ResourceThresholdVisualization mounted for ${formatResourceType(resourceType)}`
      );
    },
    onUnmount: () => {
      console.warn(
        `ResourceThresholdVisualization unmounted for ${formatResourceType(resourceType)}`
      );
    },
    eventSubscriptions: [
      {
        eventType: EventType.RESOURCE_UPDATED,
        handler: event => {
          // Only update if this event is for our resource type
          if (event?.data?.resourceType === resourceType) {
            // Update logic here
          }
        },
      },
      {
        eventType: EventType.RESOURCE_THRESHOLD_CHANGED,
        handler: event => {
          // Only update if this event is for our resource type
          if (event?.data?.resourceType === resourceType) {
            // Update logic here
          }
        },
      },
    ],
  });

  return (
    <div
      className={`resource-threshold-visualization ${status.level}`}
      style={{ borderColor: status.color }}
    >
      <h3>{formatResourceType(resourceType)} Threshold Monitor</h3>

      <div className="status-section">
        <p>
          <strong>Status:</strong> {status.message}
        </p>
        <p>
          <strong>Current:</strong> {currentValue.toFixed(1)} / {maxValue.toFixed(1)}(
          {((currentValue / maxValue) * 100).toFixed(1)}%)
        </p>
        <p>
          <strong>Rate:</strong> {ratePerMinute > 0 ? '+' : ''}
          {ratePerMinute.toFixed(2)}/minute
        </p>

        <div className="progress-bar" title={`Progress to ${status.nextThresholdName} threshold`}>
          <div
            className="progress-fill"
            style={{
              width: `${Math.min(100, Math.max(0, status.percentToNextThreshold))}%`,
              backgroundColor: status.color,
            }}
          />
        </div>
      </div>

      <div className="prediction-section">
        <h4>Prediction</h4>

        {status.timeToThreshold !== undefined ? (
          <p>
            {rate > 0
              ? `Time to ${status.nextThresholdName} threshold: ${formatTime(status.timeToThreshold)}`
              : `Time until ${status.nextThresholdName} threshold: ${formatTime(status.timeToThreshold)}`}
          </p>
        ) : (
          <p>No rate change detected</p>
        )}

        <p className="trend">
          {rate > 0
            ? `At current rate, +${(ratePerMinute * 60).toFixed(1)} in next hour`
            : rate < 0
              ? `At current rate, ${(ratePerMinute * 60).toFixed(1)} in next hour`
              : 'Resource level stable'}
        </p>
      </div>
    </div>
  );
};

export default ResourceThresholdVisualization;
