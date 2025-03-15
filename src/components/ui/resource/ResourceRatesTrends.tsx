import { ResourceType } from "./../../../types/resources/ResourceTypes";
import * as React from "react";
import { useEffect, useRef, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAllResourceRates } from '../../../contexts/ResourceRatesContext';
import {
  ResourceType,
  ResourceTypeHelpers,
} from '../../../types/resources/StandardizedResourceTypes';

// Number of data points to keep in history
const MAX_HISTORY_POINTS = 30;

// Colors for each resource type, matching our existing color scheme
const resourceColors: Record<ResourceType, string> = {
  [ResourceType.MINERALS]: '#f59e0b', // amber
  [ResourceType.ENERGY]: '#06b6d4', // cyan
  [ResourceType.POPULATION]: '#10b981', // green
  [ResourceType.RESEARCH]: '#a855f7', // purple
  [ResourceType.PLASMA]: '#ef4444', // red
  [ResourceType.GAS]: '#3b82f6', // blue
  [ResourceType.EXOTIC]: '#ec4899', // pink
  // Add missing resource types
  [ResourceType.IRON]: '#94a3b8', // slate
  [ResourceType.COPPER]: '#f97316', // orange
  [ResourceType.TITANIUM]: '#64748b', // slate
  [ResourceType.URANIUM]: '#84cc16', // lime
  [ResourceType.WATER]: '#0ea5e9', // sky
  [ResourceType.HELIUM]: '#6366f1', // indigo
  [ResourceType.DEUTERIUM]: '#8b5cf6', // violet
  [ResourceType.ANTIMATTER]: '#d946ef', // fuchsia
  [ResourceType.DARK_MATTER]: '#f43f5e', // rose
  [ResourceType.EXOTIC_MATTER]: '#10b981', // emerald
};

// Interface for resource rate history data point
interface RateDataPoint {
  timestamp: number;
  [key: string]: number; // Dynamic keys for each resource type
}

interface ResourceRatesTrendsProps {
  selectedResources?: ResourceType[];
  height?: number;
}

/**
 * Component that displays trends of resource rates over time
 */
export const ResourceRatesTrends: React.FC<ResourceRatesTrendsProps> = ({
  selectedResources,
  height = 300,
}) => {
  const allResourceRates = useAllResourceRates();
  const [rateHistory, setRateHistory] = useState<RateDataPoint[]>([]);
  const [availableResources, setAvailableResources] = useState<ResourceType[]>([]);
  const [displayedResources, setDisplayedResources] = useState<ResourceType[]>([]);
  const [yAxisDomain, setYAxisDomain] = useState<[number, number]>([-10, 10]);
  const historyIntervalRef = useRef<number | null>(null);

  // Initialize available resources from resource rates
  useEffect(() => {
    if (allResourceRates) {
      const resourceTypes = Object.keys(allResourceRates) as ResourceType[];
      setAvailableResources(resourceTypes);

      // If no selected resources were provided, use all available ones
      if (!selectedResources) {
        // Default to just showing a few key resources to avoid cluttering the chart
        const defaultResources = [
          ResourceType.MINERALS,
          ResourceType.ENERGY,
          ResourceType.POPULATION,
          ResourceType.RESEARCH,
        ].filter(type => resourceTypes.includes(type));

        setDisplayedResources(defaultResources);
      } else {
        setDisplayedResources(selectedResources.filter(type => resourceTypes.includes(type)));
      }
    }
  }, [allResourceRates, selectedResources]);

  // Set up periodic data collection
  useEffect(() => {
    // Clear any existing interval
    if (historyIntervalRef.current !== null) {
      window.clearInterval(historyIntervalRef.current);
    }

    // Helper function to convert ResourceType enum to a key in allResourceRates
    const getResourceKey = (resourceType: ResourceType): keyof typeof allResourceRates | null => {
      // Map ResourceType enum values to keys in allResourceRates
      const mapping: Partial<Record<ResourceType, keyof typeof allResourceRates>> = {
        [ResourceType.MINERALS]: ResourceType.MINERALS,
        [ResourceType.ENERGY]: ResourceType.ENERGY,
        [ResourceType.POPULATION]: ResourceType.POPULATION,
        [ResourceType.RESEARCH]: ResourceType.RESEARCH,
        [ResourceType.PLASMA]: ResourceType.PLASMA,
        [ResourceType.GAS]: ResourceType.GAS,
        [ResourceType.EXOTIC]: ResourceType.EXOTIC,
      };

      return mapping[resourceType] || null;
    };

    // Function to collect current rate data
    const collectRateData = () => {
      if (!allResourceRates) return;

      const newDataPoint: RateDataPoint = { timestamp: Date.now() };

      // Collect net rates for all displayed resources
      displayedResources.forEach(resourceType => {
        const resourceKey = getResourceKey(resourceType);
        if (resourceKey && allResourceRates[resourceKey]) {
          newDataPoint[resourceType] = allResourceRates[resourceKey].net;
        }
      });

      // Update history, keeping only the most recent points
      setRateHistory(prevHistory => {
        const updatedHistory = [...prevHistory, newDataPoint];
        return updatedHistory.length > MAX_HISTORY_POINTS
          ? updatedHistory.slice(-MAX_HISTORY_POINTS)
          : updatedHistory;
      });
    };

    // Initial data point
    collectRateData();

    // Set up interval (collect data every 2 seconds)
    historyIntervalRef.current = window.setInterval(collectRateData, 2000);

    // Clean up on unmount
    return () => {
      if (historyIntervalRef.current !== null) {
        window.clearInterval(historyIntervalRef.current);
      }
    };
  }, [allResourceRates, displayedResources]);

  // Update Y-axis domain based on data
  useEffect(() => {
    if (rateHistory.length > 0) {
      // Find min and max values across all resources
      let minValue = 0;
      let maxValue = 0;

      rateHistory.forEach(dataPoint => {
        displayedResources.forEach(resourceType => {
          const value = dataPoint[resourceType];
          if (value !== undefined) {
            minValue = Math.min(minValue, value);
            maxValue = Math.max(maxValue, value);
          }
        });
      });

      // Add some padding to the domain
      const padding = Math.max(
        5,
        Math.ceil(Math.max(Math.abs(minValue), Math.abs(maxValue)) * 0.2)
      );
      setYAxisDomain([Math.floor(minValue - padding), Math.ceil(maxValue + padding)]);
    }
  }, [rateHistory, displayedResources]);

  // Format timestamp for X-axis
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getMinutes()}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  // Toggle resource display
  const toggleResource = (resourceType: ResourceType) => {
    setDisplayedResources(current => {
      if (current.includes(resourceType)) {
        return current.filter(type => type !== resourceType);
      } else {
        return [...current, resourceType];
      }
    });
  };

  // Custom tooltip formatter
  const formatTooltip = (value: number, name: string) => {
    // Convert resource type enum value to display name
    try {
      const resourceType = name as ResourceType;
      const displayName = ResourceTypeHelpers.getDisplayName(resourceType);
      return [`${value.toFixed(1)}/tick`, displayName];
    } catch (_) {
      return [value.toFixed(1), name];
    }
  };

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white">Resource Rate Trends</h2>
        <p className="text-xs text-gray-400">Showing net resource rates over time (per tick)</p>
      </div>

      {/* Resource toggles */}
      <div className="mb-4 flex flex-wrap gap-2">
        {availableResources.map(resourceType => (
          <button
            key={resourceType}
            className={`rounded-full border px-2 py-1 text-xs transition-colors ${
              displayedResources.includes(resourceType)
                ? 'border-opacity-50 bg-opacity-20'
                : 'border-gray-700 bg-gray-800 text-gray-400'
            }`}
            style={{
              backgroundColor: displayedResources.includes(resourceType)
                ? `${resourceColors[resourceType]}33` // 33 is 20% opacity in hex
                : undefined,
              borderColor: displayedResources.includes(resourceType)
                ? `${resourceColors[resourceType]}80` // 80 is 50% opacity in hex
                : undefined,
              color: displayedResources.includes(resourceType)
                ? resourceColors[resourceType]
                : undefined,
            }}
            onClick={() => toggleResource(resourceType)}
          >
            {ResourceTypeHelpers.getDisplayName(resourceType)}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div style={{ height }}>
        {rateHistory.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rateHistory} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTimestamp}
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis
                domain={yAxisDomain}
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number, name: string) => formatTooltip(value, name)}
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '4px',
                  color: '#e5e7eb',
                }}
                labelFormatter={(timestamp: number) => `Time: ${formatTimestamp(timestamp)}`}
              />
              <Legend
                formatter={(value: string) => {
                  try {
                    const resourceType = value as ResourceType;
                    return ResourceTypeHelpers.getDisplayName(resourceType);
                  } catch {
                    return value;
                  }
                }}
              />

              {/* One line per resource */}
              {displayedResources.map(resourceType => (
                <Line
                  key={resourceType}
                  type="monotone"
                  dataKey={resourceType}
                  stroke={resourceColors[resourceType]}
                  activeDot={{ r: 6 }}
                  dot={{ r: 3 }}
                  strokeWidth={2}
                  name={resourceType}
                  isAnimationActive={true}
                  animationDuration={300}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-gray-500">Collecting data...</div>
          </div>
        )}
      </div>

      {/* Legend for reference */}
      <div className="mt-4 flex flex-wrap gap-y-2">
        {displayedResources.map(resourceType => (
          <div key={resourceType} className="mr-4 flex items-center">
            <div
              className="mr-1 h-3 w-3 rounded-full"
              style={{ backgroundColor: resourceColors[resourceType] }}
            />
            <span className="text-xs text-gray-300">
              {ResourceTypeHelpers.getDisplayName(resourceType)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResourceRatesTrends;
