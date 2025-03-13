import React, { useEffect, useState } from 'react';
import { useComponentLifecycle } from '../../../hooks/ui/useComponentLifecycle';
import { useComponentRegistration } from '../../../hooks/ui/useComponentRegistration';
import { ModuleEventType } from '../../../lib/modules/ModuleEvents';
import {
  ResourceType,
  ResourceTypeHelpers,
} from '../../../types/resources/StandardizedResourceTypes';

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
      rate > 0 ? (maxValue * (thresholds.low || 0) - currentValue) / rate : undefined;

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
      ((currentValue - maxValue * (thresholds.critical || 0)) /
        (maxValue * (thresholds.low - (thresholds.critical || 0)))) *
      100;

    // Calculate time to next threshold
    const timeToThreshold =
      rate > 0
        ? (maxValue * (thresholds.target || 0) - currentValue) / rate
        : rate < 0
          ? (maxValue * (thresholds.critical || 0) - currentValue) / rate
          : undefined;

    return {
      level: 'low',
      color: '#ff9800', // Orange
      message: 'WARNING: Resource level is low',
      warningLevel: 2,
      percentToNextThreshold: percentToNext,
      nextThresholdName: rate > 0 ? 'target' : 'critical',
      timeToThreshold: timeToThreshold,
    };
  }

  // Check if at high level
  if (thresholds.high && ratio >= thresholds.high) {
    const percentToNext =
      ((currentValue - maxValue * (thresholds.target || 0)) /
        (maxValue * (thresholds.high - (thresholds.target || 0)))) *
      100;

    // Calculate time to next threshold
    const timeToThreshold =
      rate > 0
        ? (maxValue * (thresholds.maximum || 1) - currentValue) / rate
        : rate < 0
          ? (maxValue * (thresholds.target || 0) - currentValue) / rate
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
      ? ((currentValue - maxValue * (thresholds.low || 0)) /
          (maxValue * ((thresholds.high || 1) - (thresholds.low || 0)))) *
        100
      : ((currentValue - maxValue * (thresholds.low || 0)) /
          (maxValue * ((thresholds.target || 0.5) - (thresholds.low || 0)))) *
        100;

  // Calculate time to next threshold
  const timeToThreshold =
    rate > 0
      ? (maxValue * (thresholds.high || 1) - currentValue) / rate
      : rate < 0
        ? (maxValue * (thresholds.low || 0) - currentValue) / rate
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
  if (minutes === undefined) return 'N/A';

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
 * Get title for the resource type
 */
const getResourceTitle = (resourceType: ResourceType): string => {
  return ResourceTypeHelpers.getDisplayName(resourceType);
};

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
  const [resourceStatus, setResourceStatus] = useState<ResourceStatus>(
    getResourceStatus(currentValue, maxValue, rate, thresholds)
  );

  // Convert cycle rate to per-minute rate for easier understanding
  const ratePerMinute = rate * (60000 / cycleTime);

  // Register with component registry
  useComponentRegistration({
    type: 'ResourceThresholdVisualization',
    eventSubscriptions: ['RESOURCE_UPDATED', 'RESOURCE_THRESHOLD_CHANGED'],
    updatePriority: 'medium',
  });

  // Use component lifecycle hook for event handling
  useComponentLifecycle({
    onMount: () => {
      console.warn(
        `ResourceThresholdVisualization mounted for ${ResourceTypeHelpers.getDisplayName(
          resourceType
        )}`
      );
    },
    onUnmount: () => {
      console.warn(
        `ResourceThresholdVisualization unmounted for ${ResourceTypeHelpers.getDisplayName(
          resourceType
        )}`
      );
    },
    eventSubscriptions: [
      {
        eventType: 'RESOURCE_UPDATED' as ModuleEventType,
        handler: event => {
          // Only update if this event is for our resource type
          if (event.data?.resourceType === resourceType) {
            // Update logic here
          }
        },
      },
      {
        eventType: 'RESOURCE_UPDATED' as ModuleEventType, // Changed from 'RESOURCE_THRESHOLD_CHANGED'
        handler: event => {
          // Only update if this event is for our resource type
          if (event.data?.resourceType === resourceType) {
            // Update logic here
          }
        },
      },
    ],
  });

  // Get status based on current value and thresholds
  const currentStatus = getResourceStatus(currentValue, maxValue, rate, thresholds);

  // Update status when resource values change
  useEffect(() => {
    setResourceStatus(getResourceStatus(currentValue, maxValue, rate, thresholds));
  }, [resourceType, currentValue, maxValue, rate, thresholds]);

  return (
    <div
      className={`resource-threshold-visualization ${resourceStatus.level}`}
      style={{ borderColor: resourceStatus.color }}
    >
      <h3>{getResourceTitle(resourceType)} Threshold Monitor</h3>

      <div className="status-section">
        <p>
          <strong>Status:</strong> {resourceStatus.message}
        </p>
        <p>
          <strong>Current:</strong> {currentValue.toFixed(1)} / {maxValue.toFixed(1)}(
          {((currentValue / maxValue) * 100).toFixed(1)}%)
        </p>
        <p>
          <strong>Rate:</strong> {ratePerMinute > 0 ? '+' : ''}
          {ratePerMinute.toFixed(2)}/minute
        </p>

        <div
          className="progress-bar"
          title={`Progress to ${resourceStatus.nextThresholdName} threshold`}
        >
          <div
            className="progress-fill"
            style={{
              width: `${Math.min(100, Math.max(0, resourceStatus.percentToNextThreshold))}%`,
              backgroundColor: resourceStatus.color,
            }}
          />
        </div>
      </div>

      <div className="prediction-section">
        <h4>Prediction</h4>

        {resourceStatus.timeToThreshold !== undefined ? (
          <p>
            {rate > 0
              ? `Time to ${resourceStatus.nextThresholdName} threshold: ${formatTime(resourceStatus.timeToThreshold)}`
              : `Time until ${resourceStatus.nextThresholdName} threshold: ${formatTime(resourceStatus.timeToThreshold)}`}
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
