import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';
import { useAllResourceRates } from '../../../contexts/ResourceRatesContext';
import {
  ResourceType,
  ResourceTypeHelpers,
} from '../../../types/resources/StandardizedResourceTypes';

// Resource type colors matching existing styles
const resourceColors: Record<ResourceType, { base: string; bgLight: string; bgSelected: string }> =
  {
    [ResourceType.MINERALS]: {
      base: 'text-amber-400',
      bgLight: 'bg-amber-500/10',
      bgSelected: 'bg-amber-500/30',
    },
    [ResourceType.ENERGY]: {
      base: 'text-cyan-400',
      bgLight: 'bg-cyan-500/10',
      bgSelected: 'bg-cyan-500/30',
    },
    [ResourceType.POPULATION]: {
      base: 'text-green-400',
      bgLight: 'bg-green-500/10',
      bgSelected: 'bg-green-500/30',
    },
    [ResourceType.RESEARCH]: {
      base: 'text-purple-400',
      bgLight: 'bg-purple-500/10',
      bgSelected: 'bg-purple-500/30',
    },
    [ResourceType.PLASMA]: {
      base: 'text-red-400',
      bgLight: 'bg-red-500/10',
      bgSelected: 'bg-red-500/30',
    },
    [ResourceType.GAS]: {
      base: 'text-blue-400',
      bgLight: 'bg-blue-500/10',
      bgSelected: 'bg-blue-500/30',
    },
    [ResourceType.EXOTIC]: {
      base: 'text-pink-400',
      bgLight: 'bg-pink-500/10',
      bgSelected: 'bg-pink-500/30',
    },
    // Add default colors for other resource types
    [ResourceType.IRON]: {
      base: 'text-gray-400',
      bgLight: 'bg-gray-500/10',
      bgSelected: 'bg-gray-500/30',
    },
    [ResourceType.COPPER]: {
      base: 'text-orange-400',
      bgLight: 'bg-orange-500/10',
      bgSelected: 'bg-orange-500/30',
    },
    [ResourceType.TITANIUM]: {
      base: 'text-slate-400',
      bgLight: 'bg-slate-500/10',
      bgSelected: 'bg-slate-500/30',
    },
    [ResourceType.URANIUM]: {
      base: 'text-lime-400',
      bgLight: 'bg-lime-500/10',
      bgSelected: 'bg-lime-500/30',
    },
    [ResourceType.WATER]: {
      base: 'text-sky-400',
      bgLight: 'bg-sky-500/10',
      bgSelected: 'bg-sky-500/30',
    },
    [ResourceType.HELIUM]: {
      base: 'text-indigo-400',
      bgLight: 'bg-indigo-500/10',
      bgSelected: 'bg-indigo-500/30',
    },
    [ResourceType.DEUTERIUM]: {
      base: 'text-violet-400',
      bgLight: 'bg-violet-500/10',
      bgSelected: 'bg-violet-500/30',
    },
    [ResourceType.ANTIMATTER]: {
      base: 'text-fuchsia-400',
      bgLight: 'bg-fuchsia-500/10',
      bgSelected: 'bg-fuchsia-500/30',
    },
    [ResourceType.DARK_MATTER]: {
      base: 'text-rose-400',
      bgLight: 'bg-rose-500/10',
      bgSelected: 'bg-rose-500/30',
    },
    [ResourceType.EXOTIC_MATTER]: {
      base: 'text-emerald-400',
      bgLight: 'bg-emerald-500/10',
      bgSelected: 'bg-emerald-500/30',
    },
    [ResourceType.ORGANIC]: {
      base: 'text-teal-400',
      bgLight: 'bg-teal-500/10',
      bgSelected: 'bg-teal-500/30',
    },
  };

// Filter type to categorize resource rates
export enum RateFilterType {
  ALL = 'all',
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
}

interface ResourceRateFilteringProps {
  onFilterChange?: (selectedResources: ResourceType[], filterType: RateFilterType) => void;
  initialSelectedResources?: ResourceType[];
  initialFilterType?: RateFilterType;
}

interface ResourceRateDetail {
  production: number;
  consumption: number;
  net: number;
}

type ResourceRates = Record<Lowercase<keyof typeof ResourceType>, ResourceRateDetail>;

/**
 * Component for filtering resource rates by type and rate value
 */
export const ResourceRateFiltering: React.FC<ResourceRateFilteringProps> = ({
  onFilterChange,
  initialSelectedResources,
  initialFilterType = RateFilterType.ALL,
}) => {
  const allResourceRates = useAllResourceRates() as ResourceRates | null;
  const [selectedResources, setSelectedResources] = useState<ResourceType[]>(
    initialSelectedResources ||
      (allResourceRates ? (Object.keys(allResourceRates) as ResourceType[]) : [])
  );
  const [filterType, setFilterType] = useState<RateFilterType>(initialFilterType);
  const [isOpen, setIsOpen] = useState(false);

  // Toggle resource selection
  const toggleResource = (resourceType: ResourceType) => {
    setSelectedResources(prev => {
      let updated: ResourceType[];

      if (prev.includes(resourceType)) {
        updated = prev.filter(r => r !== resourceType);
      } else {
        updated = [...prev, resourceType];
      }

      // Notify parent component if callback provided
      if (onFilterChange) {
        onFilterChange(updated, filterType);
      }

      return updated;
    });
  };

  // Set all resources as selected or none
  const toggleAllResources = () => {
    if (!allResourceRates) return;

    const allResources = Object.keys(allResourceRates) as ResourceType[];
    const allSelected = allResources.length === selectedResources.length;

    // If all are selected, clear selection, otherwise select all
    const newSelection = allSelected ? [] : allResources;
    setSelectedResources(newSelection);

    // Notify parent component if callback provided
    if (onFilterChange) {
      onFilterChange(newSelection, filterType);
    }
  };

  // Change the filter type
  const changeFilterType = (type: RateFilterType) => {
    setFilterType(type);

    // Notify parent component if callback provided
    if (onFilterChange) {
      onFilterChange(selectedResources, type);
    }
  };

  // Check if a resource passes the current filter
  const passesFilter = (resourceType: ResourceType): boolean => {
    // Check if the resource type exists in allResourceRates
    if (!allResourceRates) return true;

    const resourceKey = ResourceTypeHelpers.enumToString(resourceType).toLowerCase();
    const rate = allResourceRates[resourceKey as keyof typeof allResourceRates];
    if (!rate) return true;

    const netRate = rate.net;

    switch (filterType) {
      case RateFilterType.POSITIVE:
        return netRate > 0;
      case RateFilterType.NEGATIVE:
        return netRate < 0;
      case RateFilterType.NEUTRAL:
        return netRate === 0;
      case RateFilterType.ALL:
        return true;
      default:
        return true;
    }
  };

  // Get available resources after filtering
  const getAvailableResources = (): ResourceType[] => {
    if (!allResourceRates) return [];

    return Object.keys(allResourceRates)
      .map(key =>
        ResourceTypeHelpers.stringToEnum(
          key.toUpperCase() as Parameters<typeof ResourceTypeHelpers.stringToEnum>[0]
        )
      )
      .filter(passesFilter);
  };

  const availableResources = getAvailableResources();

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div
        className="flex cursor-pointer items-center justify-between"
        onClick={() => setIsOpen(prev => !prev)}
      >
        <div className="flex items-center">
          <Filter className="mr-2 h-5 w-5 text-gray-400" />
          <h3 className="font-medium text-white">Resource Filters</h3>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Filter types */}
            <div className="mb-3 mt-4">
              <div className="mb-2 text-xs text-gray-400">Filter by rate:</div>
              <div className="flex flex-wrap gap-2">
                {Object.values(RateFilterType).map(type => (
                  <button
                    key={type}
                    className={`rounded-full px-3 py-1 text-xs transition-colors ${
                      filterType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                    onClick={() => changeFilterType(type)}
                  >
                    {type === RateFilterType.ALL && 'All Rates'}
                    {type === RateFilterType.POSITIVE && 'Positive Net'}
                    {type === RateFilterType.NEGATIVE && 'Negative Net'}
                    {type === RateFilterType.NEUTRAL && 'Zero Net'}
                  </button>
                ))}
              </div>
            </div>

            {/* Resource selection */}
            <div className="mb-2">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs text-gray-400">Select resources:</div>
                <button
                  className="text-xs text-blue-400 transition-colors hover:text-blue-300"
                  onClick={toggleAllResources}
                >
                  {selectedResources.length === availableResources.length &&
                  availableResources.length > 0
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {availableResources.map(resourceType => {
                  const isSelected = selectedResources.includes(resourceType);
                  const colors =
                    resourceColors[resourceType] || resourceColors[ResourceType.EXOTIC];

                  return (
                    <button
                      key={resourceType}
                      className={`flex items-center justify-between rounded px-3 py-2 text-sm transition-colors ${
                        isSelected ? colors.bgSelected : colors.bgLight
                      } ${colors.base}`}
                      onClick={() => toggleResource(resourceType)}
                    >
                      <span>{ResourceTypeHelpers.getDisplayName(resourceType)}</span>
                      {isSelected && <X size={14} className="ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Applied filters summary */}
            <div className="mt-4 border-t border-gray-800 pt-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  {selectedResources.length === 0
                    ? 'No resources selected'
                    : `${selectedResources.length} resource${selectedResources.length > 1 ? 's' : ''} selected`}
                </div>
                <div className="text-xs text-gray-400">
                  Filter:{' '}
                  {filterType === RateFilterType.ALL ? 'All rates' : `${filterType} net rates`}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResourceRateFiltering;
