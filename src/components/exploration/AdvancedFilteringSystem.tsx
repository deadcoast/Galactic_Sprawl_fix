import { Check, ChevronDown, ChevronUp, Filter, Search, X } from 'lucide-react';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { ResourceType } from './../../types/resources/ResourceTypes';

// Anomaly types and severities
const ANOMALY_TYPES = ['artifact', 'signal', 'phenomenon'] as const;
type AnomalyType = (typeof ANOMALY_TYPES)[number];
const ANOMALY_SEVERITIES = ['low', 'medium', 'high'] as const;
type AnomalySeverity = (typeof ANOMALY_SEVERITIES)[number] | 'unknown';

// Resource types from the game's resource system
const RESOURCE_TYPES: ResourceType[] = [
  ResourceType.MINERALS,
  ResourceType.ENERGY,
  ResourceType.GAS,
  ResourceType.EXOTIC,
];

// Time periods for "last scanned" filter
const TIME_PERIODS = [
  { label: 'unknown time', value: 0 },
  { label: 'Last hour', value: 1 },
  { label: 'Last 6 hours', value: 6 },
  { label: 'Last 24 hours', value: 24 },
  { label: 'Last 3 days', value: 72 },
  { label: 'Last week', value: 168 },
];

// Status options for sector filtering
const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Unmapped', value: 'unmapped' },
  { label: 'Mapped', value: 'mapped' },
  { label: 'Scanning', value: 'scanning' },
  { label: 'Analyzed', value: 'analyzed' },
];

export interface AdvancedFilters {
  minResourcePotential: number;
  minHabitabilityScore: number;
  hasAnomalies: boolean;
  anomalyTypes: AnomalyType[];
  anomalySeverity: AnomalySeverity;
  lastScannedWithin: number; // hours
  resourceTypes: ResourceType[];
  statusFilter: 'all' | 'unmapped' | 'mapped' | 'scanning' | 'analyzed';
  searchQuery: string;
}

interface AdvancedFilteringSystemProps {
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  onSearchChange: (query: string) => void;
  onReset: () => void;
  className?: string;
  compact?: boolean;
}

export function AdvancedFilteringSystem({
  filters,
  onFiltersChange,
  onSearchChange,
  onReset,
  className = '',
  compact = false,
}: AdvancedFilteringSystemProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Calculate the number of active filters
  useEffect(() => {
    let count = 0;

    if (filters.minResourcePotential > 0) count++;
    if (filters.minHabitabilityScore > 0) count++;
    if (filters.hasAnomalies) count++;
    if (filters.anomalySeverity !== 'unknown') count++;
    if (filters.lastScannedWithin > 0) count++;
    if (filters.resourceTypes.length > 0) count++;
    if (filters.statusFilter !== 'all') count++;
    if (filters.anomalyTypes.length > 0) count++;
    if (filters.searchQuery) count++;

    setActiveFiltersCount(count);
  }, [filters]);

  // Handle resource potential change
  const handleResourcePotentialChange = useCallback(
    (value: number) => {
      onFiltersChange({
        ...filters,
        minResourcePotential: value,
      });
    },
    [filters, onFiltersChange]
  );

  // Handle habitability score change
  const handleHabitabilityScoreChange = useCallback(
    (value: number) => {
      onFiltersChange({
        ...filters,
        minHabitabilityScore: value,
      });
    },
    [filters, onFiltersChange]
  );

  // Handle anomaly checkbox change
  const handleAnomalyCheckboxChange = useCallback(
    (checked: boolean) => {
      onFiltersChange({
        ...filters,
        hasAnomalies: checked,
        // Reset anomaly severity if unchecking anomalies
        anomalySeverity: checked ? filters.anomalySeverity : 'unknown',
      });
    },
    [filters, onFiltersChange]
  );

  // Handle anomaly type selection
  const handleAnomalyTypeChange = useCallback(
    (type: AnomalyType) => {
      const newTypes = filters.anomalyTypes.includes(type)
        ? filters.anomalyTypes.filter(t => t !== type)
        : [...filters.anomalyTypes, type];

      onFiltersChange({
        ...filters,
        anomalyTypes: newTypes,
        // If selecting anomaly types, ensure hasAnomalies is true
        hasAnomalies: newTypes.length > 0 ? true : filters.hasAnomalies,
      });
    },
    [filters, onFiltersChange]
  );

  // Handle anomaly severity change
  const handleAnomalySeverityChange = useCallback(
    (severity: AnomalySeverity) => {
      onFiltersChange({
        ...filters,
        anomalySeverity: severity,
      });
    },
    [filters, onFiltersChange]
  );

  // Handle last scanned time change
  const handleLastScannedChange = useCallback(
    (hours: number) => {
      onFiltersChange({
        ...filters,
        lastScannedWithin: hours,
      });
    },
    [filters, onFiltersChange]
  );

  // Handle resource type selection
  const handleResourceTypeChange = useCallback(
    (type: ResourceType) => {
      const newTypes = filters.resourceTypes.includes(type)
        ? filters.resourceTypes.filter(t => t !== type)
        : [...filters.resourceTypes, type];

      onFiltersChange({
        ...filters,
        resourceTypes: newTypes,
      });
    },
    [filters, onFiltersChange]
  );

  // Handle status filter change
  const handleStatusFilterChange = useCallback(
    (status: 'all' | 'unmapped' | 'mapped' | 'scanning' | 'analyzed') => {
      onFiltersChange({
        ...filters,
        statusFilter: status,
      });
    },
    [filters, onFiltersChange]
  );

  // Handle search query change
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      onSearchChange(query);
    },
    [onSearchChange]
  );

  return (
    <div className={`rounded-md bg-gray-800 shadow-md ${className}`}>
      {/* Header with toggle */}
      <div
        className="flex cursor-pointer items-center justify-between border-b border-gray-700 p-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <Filter
            size={18}
            className={activeFiltersCount > 0 ? 'text-blue-400' : 'text-gray-400'}
          />
          <h3 className="text-sm font-medium text-white">
            Advanced Filters
            {activeFiltersCount > 0 && (
              <span className="ml-2 rounded-full bg-blue-500 px-1.5 py-0.5 text-xs text-white">
                {activeFiltersCount}
              </span>
            )}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={e => {
                e.stopPropagation();
                onReset();
              }}
              className="text-xs text-gray-400 transition-colors hover:text-white"
            >
              Reset
            </button>
          )}
          {isExpanded ? (
            <ChevronUp size={18} className="text-gray-400" />
          ) : (
            <ChevronDown size={18} className="text-gray-400" />
          )}
        </div>
      </div>

      {/* Filter content */}
      {isExpanded && (
        <div className="space-y-4 p-4">
          {/* Search and Status Filter Row */}
          <div className="flex flex-col gap-4 md:flex-row">
            {/* Search input */}
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-400">Search Sectors</label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by name, ID, or anomaly..."
                  className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 pl-8 text-sm text-white placeholder-gray-500"
                />
                <Search size={16} className="absolute left-2.5 top-2.5 text-gray-500" />
                {filters.searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-2.5 top-2.5 text-gray-500 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Status filter */}
            <div className="w-full md:w-48">
              <label className="mb-1 block text-xs text-gray-400">Sector Status</label>
              <select
                value={filters.statusFilter}
                onChange={e =>
                  handleStatusFilterChange(
                    e.target.value as 'all' | 'unmapped' | 'mapped' | 'scanning' | 'analyzed'
                  )
                }
                className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Resource Potential and Habitability Score */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Resource Potential slider */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs text-gray-400">Min Resource Potential</label>
                <span className="text-xs text-blue-400">
                  {Math.round(filters.minResourcePotential * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={filters.minResourcePotential}
                onChange={e => handleResourcePotentialChange(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Habitability Score slider */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs text-gray-400">Min Habitability Score</label>
                <span className="text-xs text-blue-400">
                  {Math.round(filters.minHabitabilityScore * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={filters.minHabitabilityScore}
                onChange={e => handleHabitabilityScoreChange(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Anomaly Filters */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="has-anomalies"
                checked={filters.hasAnomalies}
                onChange={e => handleAnomalyCheckboxChange(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="has-anomalies" className="cursor-pointer text-sm text-white">
                Has Anomalies
              </label>
            </div>

            {filters.hasAnomalies && (
              <div className="space-y-3 pl-6">
                {/* Anomaly Types */}
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Anomaly Types</label>
                  <div className="flex flex-wrap gap-2">
                    {ANOMALY_TYPES.map(type => (
                      <button
                        key={type}
                        onClick={() => handleAnomalyTypeChange(type)}
                        className={`flex items-center rounded-full px-3 py-1 text-xs ${
                          filters.anomalyTypes.includes(type)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {filters.anomalyTypes.includes(type) && (
                          <Check size={12} className="mr-1" />
                        )}
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Anomaly Severity */}
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Anomaly Severity</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleAnomalySeverityChange('unknown')}
                      className={`rounded-full px-3 py-1 text-xs ${
                        filters.anomalySeverity === 'unknown'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      unknown
                    </button>
                    {ANOMALY_SEVERITIES.map(severity => (
                      <button
                        key={severity}
                        onClick={() => handleAnomalySeverityChange(severity)}
                        className={`rounded-full px-3 py-1 text-xs ${
                          filters.anomalySeverity === severity
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Last Scanned */}
          <div>
            <label className="mb-1 block text-xs text-gray-400">Last Scanned Within</label>
            <div className="flex flex-wrap gap-2">
              {TIME_PERIODS.map(period => (
                <button
                  key={period.value}
                  onClick={() => handleLastScannedChange(period.value)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    filters.lastScannedWithin === period.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resource Types */}
          <div>
            <label className="mb-1 block text-xs text-gray-400">Resource Types</label>
            <div className="flex flex-wrap gap-2">
              {RESOURCE_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => handleResourceTypeChange(type)}
                  className={`flex items-center rounded-full px-3 py-1 text-xs ${
                    filters.resourceTypes.includes(type)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {filters.resourceTypes.includes(type) && <Check size={12} className="mr-1" />}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Reset button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={onReset}
              className="rounded bg-gray-700 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-600"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Default filters
export const defaultAdvancedFilters: AdvancedFilters = {
  minResourcePotential: 0,
  minHabitabilityScore: 0,
  hasAnomalies: false,
  anomalyTypes: [],
  anomalySeverity: 'unknown',
  lastScannedWithin: 0,
  resourceTypes: [],
  statusFilter: 'all',
  searchQuery: '',
};
