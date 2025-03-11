import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useModulesWithStatus } from '../../../hooks/modules/useModuleStatus';
import { moduleManager } from '../../../managers/module/ModuleManager';
import { ExtendedModuleStatus } from '../../../managers/module/ModuleStatusManager';
import { BaseModule, ModuleType } from '../../../types/buildings/ModuleTypes';
import { ModuleCard } from './ModuleCard';
import './ModuleGrid.css';

interface ModuleGridProps {
  title?: string;
  moduleType?: ModuleType;
  statusFilter?: ExtendedModuleStatus[];
  onModuleSelect?: (moduleId: string) => void;
  selectedModuleId?: string;
  compact?: boolean;
  maxItems?: number;
  buildingId?: string;
}

type SortOption = 'name' | 'type' | 'level' | 'status' | 'efficiency';

/**
 * ModuleGrid component for displaying multiple modules in a grid layout
 *
 * Uses standardized patterns for event subscriptions and filtering
 */
export function ModuleGrid({
  title = 'Modules',
  moduleType,
  statusFilter,
  onModuleSelect,
  selectedModuleId,
  compact = false,
  maxItems,
  buildingId,
}: ModuleGridProps) {
  // Get modules data using our standardized hook
  const { modules, statusMap, isLoading, error } = useModulesWithStatus();

  // Local state for grid display
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filteredModules, setFilteredModules] = useState<BaseModule[]>([]);

  // Filter and sort modules based on current filters
  // Convert this to useMemo to avoid unnecessary recalculations
  const computedFilteredModules = useMemo(() => {
    let filtered = [...modules];

    // Filter by module type if specified
    if (moduleType) {
      filtered = filtered.filter(module => module.type === moduleType);
    }

    // Filter by building if specified
    if (buildingId) {
      const buildingModules = moduleManager.getBuildingModules(buildingId);
      const buildingModuleIds = new Set(buildingModules.map(m => m.id));
      filtered = filtered.filter(module => buildingModuleIds.has(module.id));
    }

    // Filter by status if specified
    if (statusFilter && statusFilter.length > 0) {
      filtered = filtered.filter(module => {
        const status = statusMap[module.id];
        return status && statusFilter.includes(status);
      });
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        module =>
          module.name.toLowerCase().includes(term) ||
          module.type.toLowerCase().includes(term) ||
          module.id.toLowerCase().includes(term)
      );
    }

    // Sort modules
    filtered.sort((a, b) => {
      let result = 0;

      // Extract values outside of switch to avoid lexical declaration issues
      const statusA = statusMap[a.id] || 'unknown';
      const statusB = statusMap[b.id] || 'unknown';

      switch (sortBy) {
        case 'name':
          result = a.name.localeCompare(b.name);
          break;
        case 'type':
          result = a.type.localeCompare(b.type);
          break;
        case 'level':
          result = a.level - b.level;
          break;
        case 'status':
          result = statusA.localeCompare(statusB);
          break;
        case 'efficiency':
          // Would need to get efficiency from metrics
          result = 0;
          break;
      }

      return sortDirection === 'asc' ? result : -result;
    });

    // Limit the number of items if specified
    if (maxItems && filtered.length > maxItems) {
      filtered = filtered.slice(0, maxItems);
    }

    return filtered;
  }, [
    modules,
    moduleType,
    statusFilter,
    sortBy,
    sortDirection,
    searchTerm,
    buildingId,
    statusMap,
    maxItems,
  ]);

  // Update filtered modules when computed value changes
  useEffect(() => {
    setFilteredModules(computedFilteredModules);
  }, [computedFilteredModules]);

  // Memoize handler functions to prevent unnecessary rerenders
  const handleSort = useCallback(
    (option: SortOption) => {
      if (sortBy === option) {
        // Toggle direction
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        // New sort option
        setSortBy(option);
        setSortDirection('asc');
      }
    },
    [sortBy, sortDirection]
  );

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleModuleSelect = useCallback(
    (moduleId: string) => {
      if (onModuleSelect) {
        onModuleSelect(moduleId);
      }
    },
    [onModuleSelect]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="module-grid module-grid--loading">
        <h2 className="module-grid__title">{title}</h2>
        <div className="module-grid__loading">Loading modules...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="module-grid module-grid--error">
        <h2 className="module-grid__title">{title}</h2>
        <div className="module-grid__error">{error}</div>
      </div>
    );
  }

  // Empty state
  if (filteredModules.length === 0) {
    return (
      <div className="module-grid module-grid--empty">
        <h2 className="module-grid__title">{title}</h2>
        <div className="module-grid__empty-message">
          {searchTerm || moduleType || statusFilter
            ? 'No modules match the current filters'
            : 'No modules available'}
        </div>
      </div>
    );
  }

  return (
    <div className="module-grid">
      <div className="module-grid__header">
        <h2 className="module-grid__title">{title}</h2>

        <div className="module-grid__controls">
          {/* Search */}
          <div className="module-grid__search">
            <input
              type="text"
              placeholder="Search modules..."
              value={searchTerm}
              onChange={handleSearch}
              className="module-grid__search-input"
            />
          </div>

          {/* Sort controls */}
          <div className="module-grid__sort">
            <label className="module-grid__sort-label">Sort by:</label>
            <select
              value={sortBy}
              onChange={e => handleSort(e.target.value as SortOption)}
              className="module-grid__sort-select"
            >
              <option value="name">Name</option>
              <option value="type">Type</option>
              <option value="level">Level</option>
              <option value="status">Status</option>
              <option value="efficiency">Efficiency</option>
            </select>

            <button
              className="module-grid__sort-direction"
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      <div className={`module-grid__items ${compact ? 'module-grid__items--compact' : ''}`}>
        {filteredModules.map(module => (
          <ModuleCard
            key={module.id}
            moduleId={module.id}
            onSelect={handleModuleSelect}
            isSelected={selectedModuleId === module.id}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}

// Export a memoized version of the component to prevent unnecessary renders
export const MemoizedModuleGrid = React.memo(ModuleGrid);

const styles = `
.module-grid {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.module-grid__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.module-grid__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #343a40;
}

.module-grid__controls {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.module-grid__search {
  position: relative;
}

.module-grid__search-input {
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ced4da;
  width: 200px;
  font-size: 14px;
}

.module-grid__sort {
  display: flex;
  align-items: center;
  gap: 8px;
}

.module-grid__sort-label {
  font-size: 14px;
  color: #6c757d;
}

.module-grid__sort-select {
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ced4da;
  font-size: 14px;
}

.module-grid__sort-direction {
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
}

.module-grid__items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.module-grid__items--compact {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.module-grid--loading,
.module-grid--error,
.module-grid--empty {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

.module-grid--error {
  color: #dc3545;
}

.module-grid__empty-message {
  margin-top: 20px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px dashed #ced4da;
}

@media (max-width: 768px) {
  .module-grid__header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .module-grid__controls {
    width: 100%;
    margin-top: 16px;
  }
  
  .module-grid__search-input {
    width: 100%;
  }
  
  .module-grid__items {
    grid-template-columns: 1fr;
  }
}
`;

// Add the styles to the document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}
