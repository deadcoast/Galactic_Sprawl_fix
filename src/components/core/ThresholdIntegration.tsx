import React, { useEffect, useRef } from 'react';
import { useThreshold } from '../../contexts/ThresholdContext';
import { ThresholdEvent, thresholdEvents } from '../../contexts/ThresholdTypes';
import { moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import { ResourceManager } from '../../managers/game/ResourceManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { ResourceType } from '../../types/resources/ResourceTypes';

interface ThresholdIntegrationProps {
  resourceManager: ResourceManager;
  updateInterval?: number;
  children?: React.ReactNode;
}

/**
 * ThresholdIntegration component
 *
 * This component connects the ThresholdContext with the ResourceManager,
 * ensuring that resource thresholds are respected and appropriate actions
 * are taken when thresholds are crossed.
 *
 * It listens to resource updates from the ResourceManager and updates the ThresholdContext,
 * and also listens to threshold events from the ThresholdContext and triggers appropriate
 * actions in the ResourceManager.
 */
export function ThresholdIntegration({
  resourceManager,
  updateInterval = 1000,
  children,
}: ThresholdIntegrationProps) {
  const { state, dispatch } = useThreshold();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastResourceState = useRef<Record<string, number>>({});

  // Sync resource states from ResourceManager to ThresholdContext
  useEffect(() => {
    const syncResourceStates = () => {
      // Get current resources from manager
      const currentResources = resourceManager.getAllResources();

      // Get resource states with more details if available
      if (resourceManager.getAllResourceStates) {
        const states = resourceManager.getAllResourceStates();

        // For each resource type, update the corresponding resource in ThresholdContext
        Object.entries(states).forEach(([type, details]) => {
          if (details && type in currentResources) {
            const resourceType = type as ResourceType;
            const currentAmount = currentResources[resourceType] || 0;

            // Skip if the amount hasn't changed
            if (lastResourceState.current[resourceType] === currentAmount) {
              return;
            }

            // Update the lastResourceState ref
            lastResourceState.current[resourceType] = currentAmount;

            // Prepare resource data for ThresholdContext if it exists in state
            if (state.resources[resourceType]) {
              // Update the amount in ThresholdContext
              dispatch({
                type: 'UPDATE_AMOUNT',
                payload: {
                  resourceId: resourceType,
                  amount: currentAmount,
                },
              });
            } else {
              // Resource doesn't exist in ThresholdContext yet, add it with default thresholds
              // Use a reasonable default capacity or estimate from current amount
              const maxCapacity = details.max || currentAmount * 2;
              const minThreshold = Math.round(maxCapacity * 0.2); // 20% of capacity
              const maxThreshold = Math.round(maxCapacity * 0.8); // 80% of capacity

              dispatch({
                type: 'ADD_RESOURCE',
                payload: {
                  id: resourceType,
                  name: resourceType.charAt(0).toUpperCase() + resourceType.slice(1),
                  type: 'mineral', // Default type, should be updated based on resource
                  currentAmount: currentAmount,
                  maxCapacity: maxCapacity,
                  thresholds: {
                    min: minThreshold,
                    max: maxThreshold,
                  },
                  autoMine: true,
                },
              });
            }
          }
        });
      }
    };

    // Set up periodic synchronization
    intervalRef.current = setInterval(syncResourceStates, updateInterval);

    // Initial sync
    syncResourceStates();

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [resourceManager, dispatch, state.resources, updateInterval]);

  // Subscribe to threshold events from ThresholdContext and take appropriate actions
  useEffect(() => {
    const handleThresholdEvent = (event: ThresholdEvent) => {
      const { type, resourceId, details } = event;

      // Handle threshold violations
      if (type === 'THRESHOLD_VIOLATED') {
        console.log(`Threshold violated for ${resourceId}:`, details);

        // If resource is below minimum, emit an event that might trigger production
        if (details.type === 'below_minimum') {
          moduleEventBus.emit({
            type: 'STATUS_CHANGED' as ModuleEventType,
            moduleId: 'threshold-integration',
            moduleType: 'resource' as ModuleType,
            timestamp: Date.now(),
            data: {
              resourceType: resourceId,
              thresholdType: 'min',
              current: details.current,
              threshold: details.min,
            },
          });
        }
      }

      // Handle storage full events
      else if (type === 'STORAGE_FULL') {
        console.log(`Storage nearly full for ${resourceId}:`, details);

        // If resource is above maximum, emit an event that might reduce production
        if (details.type === 'above_maximum') {
          moduleEventBus.emit({
            type: 'STATUS_CHANGED' as ModuleEventType,
            moduleId: 'threshold-integration',
            moduleType: 'resource' as ModuleType,
            timestamp: Date.now(),
            data: {
              resourceType: resourceId,
              thresholdType: 'max',
              current: details.current,
              threshold: details.max,
            },
          });
        }
      }
    };

    // Subscribe to threshold events
    const subscription = thresholdEvents.subscribe(handleThresholdEvent);

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // This component doesn't render anything itself
  return <>{children}</>;
}
