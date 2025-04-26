import React, { useEffect } from 'react';
import { useThreshold } from '../../contexts/ThresholdContext';
import { getResourceManager } from '../../managers/ManagerRegistry';
import { BaseEvent, EventType } from '../../types/events/EventTypes';
import { ResourceType } from './../../types/resources/ResourceTypes';

interface ThresholdIntegrationProps {
  children: React.ReactNode;
}

/**
 * ThresholdIntegration component
 *
 * Connects the ResourceManager to the ThresholdContext, enabling:
 * - Synchronization of resource amounts from ResourceManager to ThresholdContext
 * - Propagation of threshold violations from ThresholdContext to ResourceManager
 * - Automatic resource management based on threshold settings
 */
export function ThresholdIntegration({ children }: ThresholdIntegrationProps) {
  const { state, dispatch } = useThreshold();
  const resourceManager = getResourceManager();
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Initialize connection between ResourceManager and ThresholdContext
  useEffect(() => {
    const setupConnection = () => {
      try {
        // Register for resource update events from ResourceManager
        const unsubscribe = resourceManager.subscribeToEvent(
          EventType.RESOURCE_UPDATED,
          handleResourceUpdate
        );

        // Initial synchronization of all resources
        synchronizeAllResources();

        setIsInitialized(true);

        // Cleanup on unmount
        return () => {
          unsubscribe();
        };
      } catch (_error) {
        // Failed to connect ThresholdContext to ResourceManager
      }
    };

    void setupConnection();
  }, [resourceManager]);

  // Synchronize all resources from ResourceManager to ThresholdContext
  const synchronizeAllResources = () => {
    const resourceStates = resourceManager.getAllResourceStates();

    if (!resourceStates) {
      return;
    }

    // Update each resource in the ThresholdContext
    Object.entries(resourceStates).forEach(([type, state]) => {
      if (state) {
        dispatch({
          type: 'UPDATE_AMOUNT',
          payload: {
            resourceId: type,
            amount: state.current,
          },
        });
      }
    });
  };

  // Handle resource update events from ResourceManager
  const handleResourceUpdate = (event: BaseEvent) => {
    if (!event?.data || typeof event.data !== 'object') return;

    // Safely extract resources from event data
    if (
      !('resources' in event.data) ||
      typeof event.data.resources !== 'object' ||
      event.data.resources === null
    ) {
      return;
    }

    // Explicitly type resources after checks
    const resources = event.data.resources as Record<string, unknown>;

    // Update each resource in the ThresholdContext
    Object.entries(resources).forEach(([type, data]) => {
      // Check if data is an object and has a 'current' property
      if (typeof data === 'object' && data !== null && 'current' in data) {
        // Explicitly type data after checks
        const resourceData = data as { current: unknown };

        // Check if 'current' is a number
        const current = typeof resourceData.current === 'number' ? resourceData.current : 0;

        dispatch({
          type: 'UPDATE_AMOUNT',
          payload: {
            resourceId: type as ResourceType,
            amount: current,
          },
        });
      }
    });
  };

  // Listen for threshold changes and handle threshold violations
  useEffect(() => {
    if (!isInitialized) return;

    // Setup automatic resource management based on thresholds
    const checkThresholds = () => {
      Object.entries(state.resources).forEach(([resourceId, resource]) => {
        const { currentAmount, thresholds, autoMine } = resource;

        // Handle threshold violations
        if (currentAmount < thresholds.min) {
          // Publish threshold violation event
          resourceManager.publishEvent({
            type: EventType.RESOURCE_THRESHOLD_TRIGGERED,
            moduleId: resourceManager.id,
            moduleType: 'resource-manager',
            timestamp: Date.now(),
            data: {
              resourceType: resourceId as ResourceType,
              thresholdType: 'min',
              current: currentAmount,
              threshold: thresholds.min,
              violation: true,
            },
          });

          // If auto-mining is enabled, try to produce more of this resource
          if (autoMine) {
            // Here we would implement logic to automatically produce more of this resource
            // Auto-mining resource ${resourceId} due to threshold violation
          }
        } else if (currentAmount > thresholds.max) {
          // Publish threshold violation event
          resourceManager.publishEvent({
            type: EventType.RESOURCE_THRESHOLD_TRIGGERED,
            moduleId: resourceManager.id,
            moduleType: 'resource-manager',
            timestamp: Date.now(),
            data: {
              resourceType: resourceId as ResourceType,
              thresholdType: 'max',
              current: currentAmount,
              threshold: thresholds.max,
              violation: true,
            },
          });

          // Stop production if we're over the maximum
          if (autoMine) {
            // Stopping resource ${resourceId} production due to max threshold violation
          }
        }
      });
    };

    // Check thresholds when the state changes
    checkThresholds();

    // Also set up an interval to regularly check thresholds
    const intervalId = setInterval(checkThresholds, 10000); // Check every 10 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [state, isInitialized, resourceManager]);

  return (
    <>
      {!isInitialized ? (
        <div className="threshold-integration-loading">Connecting resource thresholds...</div>
      ) : (
        children
      )}
    </>
  );
}
