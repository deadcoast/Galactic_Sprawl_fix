import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useModuleEvents } from '../../../hooks/events/useModuleEvents';
import { ModuleEvent } from '../../../lib/events/ModuleEventBus';
import { EventType } from '../../../types/events/EventTypes';
import { ResourceType } from '../../../types/resources/ResourceTypes';
import { isResourceUpdateEvent } from '../../../utils/events/eventTypeGuards';
import { resourceColors, resourceIcons, resourceNames } from '../ResourceVisualization';
import { useTooltipContext } from '../tooltip-context';

/**
 * Enhanced version of ResourceVisualization that uses the component registration system
 *
 * This component:
 * 1. Registers with the ComponentRegistryService
 * 2. Subscribes to resource-related events
 * 3. Updates in real-time based on resource events
 * 4. Provides performance metrics through the registry
 */

interface ResourceDisplayProps {
  type: ResourceType;
  value: number;
  rate?: number;
  capacity?: number;
  thresholds?: {
    warning: number;
    critical: number;
  };
}

// Resource descriptions for tooltips
const resourceDescriptions: Record<ResourceType, string> = {
  [ResourceType.MINERALS]: 'Raw materials used for construction and manufacturing.',
  [ResourceType.ENERGY]: 'Powers all modules, buildings, and operations.',
  [ResourceType.POPULATION]: 'Citizens of your empire who can be assigned to various tasks.',
  [ResourceType.RESEARCH]: 'Scientific knowledge used to unlock new technologies.',
  [ResourceType.PLASMA]: 'High-energy matter used for advanced technology.',
  [ResourceType.GAS]: 'Various gases used for life support and manufacturing.',
  [ResourceType.EXOTIC]: 'Rare materials with unique properties for special projects.',
  [ResourceType.IRON]: 'Basic building material for structures and components.',
  [ResourceType.COPPER]: 'Conductive material used in electronics and wiring.',
  [ResourceType.TITANIUM]: 'Strong, lightweight metal used for advanced construction.',
  [ResourceType.URANIUM]: 'Radioactive material used for nuclear power and weapons.',
  [ResourceType.WATER]: 'Essential resource for life support and various processes.',
  [ResourceType.HELIUM]: 'Light gas used for cooling and various industrial processes.',
  [ResourceType.DEUTERIUM]: 'Hydrogen isotope used for fusion power and advanced propulsion.',
  [ResourceType.ANTIMATTER]: 'Exotic material with enormous energy potential.',
  [ResourceType.DARK_MATTER]: 'Mysterious substance with reality-warping properties.',
  [ResourceType.EXOTIC_MATTER]: 'Extremely rare material with unique physical properties.',
  [ResourceType.ORGANIC]: 'Biological material used for medicine and biotech.',
  [ResourceType.FOOD]: 'Essential sustenance to maintain population growth and happiness.',
};

function getResourceStatus(
  value: number,
  capacity?: number,
  thresholds?: { warning: number; critical: number }
) {
  if (!capacity || !thresholds) return null;

  const percentage = (value / capacity) * 100;

  if (percentage <= thresholds.critical) {
    return {
      icon: AlertTriangle,
      message: 'Critical',
      color: 'text-red-500',
    };
  }

  if (percentage <= thresholds.warning) {
    return {
      icon: AlertTriangle,
      message: 'Warning',
      color: 'text-yellow-500',
    };
  }

  return null;
}

// Tooltip content for resources
const ResourceTooltip = React.memo(
  ({ type, value, rate = 0, capacity, thresholds }: ResourceDisplayProps) => {
    const status = getResourceStatus(value, capacity, thresholds);
    const colors = resourceColors[type];
    const percentFilled = capacity ? ((value / capacity) * 100).toFixed(1) : 'N/A';
    const timeUntilEmpty = rate < 0 ? Math.abs(value / rate).toFixed(1) : 'N/A';
    const timeUntilFull = rate > 0 && capacity ? ((capacity - value) / rate).toFixed(1) : 'N/A';

    return (
      <div className={`rounded-md p-2 ${colors.bg} border ${colors.border}`}>
        <div className="flex items-center gap-2">
          <span className={colors.base}>{resourceNames[type]}</span>
          {status && (
            <span className={status.color}>
              <status.icon className="h-4 w-4" />
            </span>
          )}
        </div>

        <div className="mt-1 space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400">Current:</span>
            <span className={colors.base}>{value.toLocaleString()}</span>
          </div>

          {rate !== 0 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-400">Rate:</span>
              <div className="flex items-center gap-1">
                {rate > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : rate < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : null}
                <span
                  className={rate > 0 ? 'text-green-500' : rate < 0 ? 'text-red-500' : colors.base}
                >
                  {rate > 0 ? '+' : ''}
                  {rate.toLocaleString()}/s
                </span>
              </div>
            </div>
          )}

          {capacity !== undefined && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-400">Capacity:</span>
              <span className={colors.base}>{capacity.toLocaleString()}</span>
            </div>
          )}

          <div className="mt-2 text-sm text-gray-400">{resourceDescriptions[type]}</div>
        </div>
      </div>
    );
  }
);

ResourceTooltip.displayName = 'ResourceTooltip';

/**
 * Enhanced resource display component that updates in real-time based on resource events
 */
const EnhancedResourceDisplay = React.memo(function EnhancedResourceDisplayBase({
  type,
  value: initialValue,
  rate: initialRate,
  capacity,
  thresholds,
}: ResourceDisplayProps) {
  const [value, setValue] = useState(initialValue);
  const [rate, setRate] = useState(initialRate);
  const { showTooltip, hideTooltip } = useTooltipContext();
  const componentRef = useRef<HTMLDivElement>(null);
  const { subscribe } = useModuleEvents();

  // Subscribe to resource update events
  useEffect(() => {
    const handleResourceUpdate = (event: ModuleEvent) => {
      if (isResourceUpdateEvent(event)) {
        const resourceAmounts = event?.data?.resourceAmounts;
        if (resourceAmounts && type in resourceAmounts) {
          const newValue = resourceAmounts[type];
          if (typeof newValue === 'number') {
            setValue(newValue);
          }
        }
      }
    };

    const unsubscribe = subscribe(EventType.RESOURCE_UPDATED, handleResourceUpdate);
    return () => {
      unsubscribe();
    };
  }, [type, subscribe]);

  // Handle mouse events for tooltip
  const handleMouseEnter = useCallback(() => {
    if (componentRef.current) {
      const rect = componentRef.current.getBoundingClientRect();
      showTooltip(
        <ResourceTooltip
          type={type}
          value={value}
          rate={rate}
          capacity={capacity}
          thresholds={thresholds}
        />,
        { x: rect.left + rect.width / 2, y: rect.top }
      );
    }
  }, [type, value, rate, capacity, thresholds, showTooltip]);

  const handleMouseLeave = useCallback(() => {
    hideTooltip();
  }, [hideTooltip]);

  // Calculate fill percentage for the progress bar
  const fillPercentage = useMemo(() => {
    if (!capacity) return 100;
    return Math.min(100, (value / capacity) * 100);
  }, [value, capacity]);

  const colors = resourceColors[type];
  const Icon = resourceIcons[type];
  const status = getResourceStatus(value, capacity, thresholds);

  return (
    <div
      ref={componentRef}
      className={`relative flex items-center gap-2 rounded-md p-2 ${colors.bg} border ${colors.border} cursor-pointer`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Icon className={`h-5 w-5 ${colors.base}`} />
      <span className={colors.base}>{value.toLocaleString()}</span>
      {status && <status.icon className={`h-4 w-4 ${status.color}`} />}
    </div>
  );
});

/**
 * ResourceVisualizationEnhanced component
 *
 * Enhanced version of ResourceVisualization that uses the new event system
 * and provides real-time updates based on resource events.
 */
export const ResourceVisualizationEnhanced = React.memo(
  function ResourceVisualizationEnhancedBase() {
    const [resources, setResources] = useState<ResourceDisplayProps[]>([]);
    const { subscribe } = useModuleEvents();

    // Subscribe to resource events
    useEffect(() => {
      const handleResourceUpdate = (event: ModuleEvent) => {
        if (isResourceUpdateEvent(event)) {
          const resourceAmounts = event?.data?.resourceAmounts;
          if (resourceAmounts && typeof resourceAmounts === 'object') {
            setResources(prev =>
              prev.map(resource => {
                const newValue =
                  resource.type in resourceAmounts ? resourceAmounts[resource.type] : null;
                return {
                  ...resource,
                  value: typeof newValue === 'number' ? newValue : resource.value,
                };
              })
            );
          }
        }
      };

      const unsubscribe = subscribe(EventType.RESOURCE_UPDATED, handleResourceUpdate);
      return () => {
        unsubscribe();
      };
    }, [subscribe]);

    return (
      <div className="space-y-2">
        {resources.map(resource => (
          <EnhancedResourceDisplay key={resource.type} {...resource} />
        ))}
      </div>
    );
  }
);
