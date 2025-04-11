import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownIcon, ArrowUpIcon, BarChart4, ChevronDown, ChevronUp } from 'lucide-react';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useAllResourceRates, useResourceRate } from '../../../contexts/ResourceRatesContext';
import { ResourceType, ResourceTypeInfo } from '../../../types/resources/ResourceTypes';
import { useTooltipContext } from '../tooltip-context';

// Resource type colors matching existing styles
const resourceColors: Record<
  ResourceType,
  { base: string; bg: string; border: string; fill: string }
> = {
  [ResourceType.MINERALS]: {
    base: 'text-amber-400',
    bg: 'bg-amber-900/20',
    border: 'border-amber-700/30',
    fill: 'bg-amber-500',
  },
  [ResourceType.ENERGY]: {
    base: 'text-cyan-400',
    bg: 'bg-cyan-900/20',
    border: 'border-cyan-700/30',
    fill: 'bg-cyan-500',
  },
  [ResourceType.POPULATION]: {
    base: 'text-green-400',
    bg: 'bg-green-900/20',
    border: 'border-green-700/30',
    fill: 'bg-green-500',
  },
  [ResourceType.RESEARCH]: {
    base: 'text-purple-400',
    bg: 'bg-purple-900/20',
    border: 'border-purple-700/30',
    fill: 'bg-purple-500',
  },
  [ResourceType.PLASMA]: {
    base: 'text-red-400',
    bg: 'bg-red-900/20',
    border: 'border-red-700/30',
    fill: 'bg-red-500',
  },
  [ResourceType.GAS]: {
    base: 'text-blue-400',
    bg: 'bg-blue-900/20',
    border: 'border-blue-700/30',
    fill: 'bg-blue-500',
  },
  [ResourceType.EXOTIC]: {
    base: 'text-pink-400',
    bg: 'bg-pink-900/20',
    border: 'border-pink-700/30',
    fill: 'bg-pink-500',
  },
  // Add default colors for other resource types
  [ResourceType.IRON]: {
    base: 'text-gray-400',
    bg: 'bg-gray-900/20',
    border: 'border-gray-700/30',
    fill: 'bg-gray-500',
  },
  [ResourceType.COPPER]: {
    base: 'text-orange-400',
    bg: 'bg-orange-900/20',
    border: 'border-orange-700/30',
    fill: 'bg-orange-500',
  },
  [ResourceType.TITANIUM]: {
    base: 'text-slate-400',
    bg: 'bg-slate-900/20',
    border: 'border-slate-700/30',
    fill: 'bg-slate-500',
  },
  [ResourceType.URANIUM]: {
    base: 'text-lime-400',
    bg: 'bg-lime-900/20',
    border: 'border-lime-700/30',
    fill: 'bg-lime-500',
  },
  [ResourceType.WATER]: {
    base: 'text-sky-400',
    bg: 'bg-sky-900/20',
    border: 'border-sky-700/30',
    fill: 'bg-sky-500',
  },
  [ResourceType.HELIUM]: {
    base: 'text-indigo-400',
    bg: 'bg-indigo-900/20',
    border: 'border-indigo-700/30',
    fill: 'bg-indigo-500',
  },
  [ResourceType.DEUTERIUM]: {
    base: 'text-violet-400',
    bg: 'bg-violet-900/20',
    border: 'border-violet-700/30',
    fill: 'bg-violet-500',
  },
  [ResourceType.ANTIMATTER]: {
    base: 'text-fuchsia-400',
    bg: 'bg-fuchsia-900/20',
    border: 'border-fuchsia-700/30',
    fill: 'bg-fuchsia-500',
  },
  [ResourceType.DARK_MATTER]: {
    base: 'text-rose-400',
    bg: 'bg-rose-900/20',
    border: 'border-rose-700/30',
    fill: 'bg-rose-500',
  },
  [ResourceType.EXOTIC_MATTER]: {
    base: 'text-emerald-400',
    bg: 'bg-emerald-900/20',
    border: 'border-emerald-700/30',
    fill: 'bg-emerald-500',
  },
  [ResourceType.ORGANIC]: {
    base: 'text-teal-400',
    bg: 'bg-teal-900/20',
    border: 'border-teal-700/30',
    fill: 'bg-teal-500',
  },
  [ResourceType.FOOD]: {
    base: 'text-yellow-400',
    bg: 'bg-yellow-900/20',
    border: 'border-yellow-700/30',
    fill: 'bg-yellow-500',
  },
};

// Props for detailed rate display component
interface ResourceRateItemProps {
  resourceType: ResourceType;
  expanded?: boolean;
  onToggle?: () => void;
}

/**
 * Component for detailed display of a single resource's rates
 */
const ResourceRateItem: React.FC<ResourceRateItemProps> = ({
  resourceType,
  expanded = false,
  onToggle,
}) => {
  const rateDetails = useResourceRate(resourceType);
  const { showTooltip, hideTooltip } = useTooltipContext();
  const [showRateDetails, setShowRateDetails] = useState(expanded);

  // Handle toggle if not provided by parent
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setShowRateDetails(prev => !prev);
    }
  };

  // Helper to format rates with + sign for positive values
  const formatRate = (rate: number) => {
    const formatted = rate.toFixed(1);
    return rate > 0 ? `+${formatted}` : formatted;
  };

  // Calculate max value for bar scaling
  const maxValue = Math.max(rateDetails.production, rateDetails.consumption);

  // Colors for this resource
  const colors = resourceColors[resourceType] || resourceColors[ResourceType.EXOTIC];

  const getTitle = useCallback(() => {
    return `${ResourceTypeInfo[resourceType]?.displayName ?? resourceType} Rates`;
  }, [resourceType]);

  // Handle tooltip display
  const handleMouseEnter = (e: React.MouseEvent) => {
    const tooltipContent = (
      <div className="w-64 rounded-md border border-gray-700 bg-gray-800 p-3 shadow-lg">
        <div className="mb-2 flex items-center">
          <div className={`mr-2 rounded p-1 ${colors.bg}`}>
            <BarChart4 className={`h-4 w-4 ${colors.base}`} />
          </div>
          <h3 className="text-lg font-bold text-white capitalize">{getTitle()}</h3>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Production:</span>
            <span className="text-green-400">+{rateDetails.production.toFixed(1)}/tick</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Consumption:</span>
            <span className="text-red-400">-{rateDetails.consumption.toFixed(1)}/tick</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-gray-700 pt-1">
            <span className="font-medium text-gray-200">Net Rate:</span>
            <span className={rateDetails.net >= 0 ? 'text-green-400' : 'text-red-400'}>
              {formatRate(rateDetails.net)}/tick
            </span>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-400">
          <p>Click to see detailed breakdown</p>
        </div>
      </div>
    );

    showTooltip(tooltipContent, {
      x: e.clientX,
      y: e.clientY,
    });
  };

  return (
    <div className="mb-2">
      <div
        className={`flex cursor-pointer items-center rounded-md p-2 transition-colors ${colors.bg} hover:bg-opacity-30`}
        onClick={handleToggle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={hideTooltip}
      >
        <div className="flex flex-1 items-center">
          <span className={`font-medium ${colors.base}`}>
            {ResourceTypeInfo[resourceType]?.displayName ?? resourceType}
          </span>

          <span
            className={`ml-3 font-mono text-sm ${rateDetails.net >= 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            {formatRate(rateDetails.net)}/tick
          </span>
        </div>

        {expanded !== undefined ? (
          expanded ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )
        ) : showRateDetails ? (
          <ChevronUp size={16} />
        ) : (
          <ChevronDown size={16} />
        )}
      </div>

      <AnimatePresence>
        {(expanded !== undefined ? expanded : showRateDetails) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={`mt-1 rounded-md border p-3 ${colors.border} bg-opacity-20 bg-black`}>
              <div className="space-y-3">
                {/* Production Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Production</span>
                    <span className="text-green-400">
                      +{rateDetails.production.toFixed(1)}/tick
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                    <motion.div
                      className="h-full bg-green-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(rateDetails.production / (maxValue || 1)) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Consumption Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Consumption</span>
                    <span className="text-red-400">-{rateDetails.consumption.toFixed(1)}/tick</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                    <motion.div
                      className="h-full bg-red-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(rateDetails.consumption / (maxValue || 1)) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Net indicator */}
                <div className="border-t border-gray-700 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Net Rate</span>
                    <div className="flex items-center">
                      {rateDetails.net > 0 ? (
                        <ArrowUpIcon className="mr-1 h-3 w-3 text-green-400" />
                      ) : rateDetails.net < 0 ? (
                        <ArrowDownIcon className="mr-1 h-3 w-3 text-red-400" />
                      ) : null}
                      <span
                        className={`text-xs font-medium ${rateDetails.net >= 0 ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {formatRate(rateDetails.net)}/tick
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Component for displaying a summary of all resource rates
export const ResourceRatesDisplay: React.FC = () => {
  const allResourceRates = useAllResourceRates();
  const [expandedResource, setExpandedResource] = useState<ResourceType | null>(null);
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);

  // Initialize resource types from all available rates
  useEffect(() => {
    if (allResourceRates) {
      setResourceTypes(Object.keys(allResourceRates) as ResourceType[]);
    }
  }, [allResourceRates]);

  // Toggle expanded state for a resource
  const toggleResource = (resourceType: ResourceType) => {
    setExpandedResource(current => (current === resourceType ? null : resourceType));
  };

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Resource Rates</h2>
        <div className="text-xs text-gray-400">All values per tick</div>
      </div>

      <div className="space-y-1">
        {resourceTypes.map(resourceType => (
          <ResourceRateItem
            key={resourceType}
            resourceType={resourceType}
            expanded={expandedResource === resourceType}
            onToggle={() => toggleResource(resourceType)}
          />
        ))}
      </div>
    </div>
  );
};

export default ResourceRatesDisplay;
