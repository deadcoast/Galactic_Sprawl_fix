import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useModulesWithStatus } from '../../../hooks/modules/useModuleStatus';
import { moduleManager } from '../../../managers/module/ModuleManager';
import { ExtendedModuleStatus } from '../../../managers/module/ModuleStatusManager';
import { BaseModule, ModuleType } from '../../../types/buildings/ModuleTypes';
import { useVirtualization } from '../../../utils/performance/ComponentOptimizer';
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
  /**
   * Whether to enable virtualization for large module lists
   * @default true
   */
  virtualized?: boolean;
  /**
   * Fixed height for each module card when using virtualization
   * @default 180
   */
  moduleHeight?: number;
}

type SortOption = 'name' | 'type' | 'level' | 'status' | 'efficiency';

// Extend BaseModule to include optional efficiency property for sorting
interface ExtendedBaseModule extends BaseModule {
  efficiency?: number;
}

/**
 * ModuleGrid component for displaying multiple modules in a grid layout
 *
 * Uses standardized patterns for event subscriptions and filtering
 * @context: ui-system, component-library, performance-optimization
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
  virtualized = true,
  moduleHeight = 180,
}: ModuleGridProps) {
  // Get modules data using our standardized hook
  const { modules, statusMap, isLoading, error } = useModulesWithStatus();

  // Local state for grid display
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [containerHeight, setContainerHeight] = useState(600);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Measure container height for virtualization
  useEffect(() => {
    if (containerRef.current && virtualized) {
      const resizeObserver = new ResizeObserver(entries => {
        const { height } = entries[0].contentRect;
        setContainerHeight(height);
      });

      resizeObserver.observe(containerRef.current);

      return () => {
        if (containerRef.current) {
          resizeObserver.unobserve(containerRef.current);
        }
      };
    }
  }, [virtualized]);

  // Filter and sort modules based on current filters
  const filteredModules = useMemo(() => {
    let filtered = [...modules] as ExtendedBaseModule[];

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

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'level':
          comparison = (a.level || 0) - (b.level || 0);
          break;
        case 'status': {
          const statusA = statusMap[a.id] || 'unknown';
          const statusB = statusMap[b.id] || 'unknown';
          comparison = statusA.localeCompare(statusB);
          break;
        }
        case 'efficiency': {
          // Handle efficiency data which might not be available on all modules
          const effA = a.efficiency || 0;
          const effB = b.efficiency || 0;
          comparison = effA - effB;
          break;
        }
        default:
          comparison = a.name.localeCompare(b.name);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Apply max items limit if specified
    if (maxItems && filtered.length > maxItems) {
      filtered = filtered.slice(0, maxItems);
    }

    return filtered;
  }, [
    modules,
    moduleType,
    buildingId,
    statusFilter,
    statusMap,
    searchTerm,
    sortBy,
    sortDirection,
    maxItems,
  ]);

  // Setup virtualization if enabled
  const virtualization = useMemo(() => {
    if (!virtualized) {
      return null;
    }

    return useVirtualization({
      itemCount: filteredModules.length,
      itemHeight: moduleHeight,
      containerHeight,
      overscan: 2,
    });
  }, [virtualized, filteredModules.length, moduleHeight, containerHeight]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (sortOption: SortOption) => {
    if (sortOption === sortBy) {
      // Toggle sort direction if clicking the same option
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort option and reset direction to ascending
      setSortBy(sortOption);
      setSortDirection('asc');
    }
  };

  // Handle module selection
  const handleModuleSelect = useCallback(
    (moduleId: string) => {
      if (onModuleSelect) {
        onModuleSelect(moduleId);
      }
    },
    [onModuleSelect]
  );

  // Render module cards
  const renderModuleCards = () => {
    if (isLoading) {
      return <div className="module-grid-loading">Loading modules...</div>;
    }

    if (error) {
      return <div className="module-grid-error">Error loading modules: {error}</div>;
    }

    if (filteredModules.length === 0) {
      return <div className="module-grid-empty">No modules found</div>;
    }

    if (virtualized && virtualization) {
      // Virtualized rendering for better performance with large lists
      const { startIndex, endIndex, totalHeight, offsetY } = virtualization;
      const visibleModules = filteredModules.slice(startIndex, endIndex + 1);

      return (
        <div
          className="module-grid-virtual-container"
          style={{ height: `${containerHeight}px`, position: 'relative', overflow: 'auto' }}
          onScroll={virtualization.handleScroll}
        >
          <div
            className="module-grid-virtual-content"
            style={{ height: `${totalHeight}px`, position: 'relative' }}
          >
            <div
              className="module-grid-virtual-items"
              style={{
                position: 'absolute',
                top: `${offsetY}px`,
                left: 0,
                right: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              {visibleModules.map(module => (
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
        </div>
      );
    }

    // Standard rendering for smaller lists
    return (
      <div className="module-grid-items">
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
    );
  };

  return (
    <div className="module-grid" ref={containerRef}>
      <div className="module-grid-header">
        <h2>{title}</h2>

        <div className="module-grid-controls">
          <input
            type="text"
            placeholder="Search modules..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="module-grid-search"
          />

          <div className="module-grid-sort">
            <span>Sort by:</span>
            <button
              className={sortBy === 'name' ? 'active' : ''}
              onClick={() => handleSortChange('name')}
            >
              Name {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              className={sortBy === 'type' ? 'active' : ''}
              onClick={() => handleSortChange('type')}
            >
              Type {sortBy === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              className={sortBy === 'level' ? 'active' : ''}
              onClick={() => handleSortChange('level')}
            >
              Level {sortBy === 'level' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              className={sortBy === 'status' ? 'active' : ''}
              onClick={() => handleSortChange('status')}
            >
              Status {sortBy === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              className={sortBy === 'efficiency' ? 'active' : ''}
              onClick={() => handleSortChange('efficiency')}
            >
              Efficiency {sortBy === 'efficiency' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>

      {renderModuleCards()}
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
