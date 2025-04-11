/**
 * @context: ui-system, resource-system, component-library, performance-optimization
 *
 * ResourceGrid component for displaying multiple resources in a grid layout
 * Uses standardized UI components and resource type safety
 */
import React, { useEffect, useRef, useState } from 'react';
import { ResourceType } from '../../../types/resources/ResourceTypes';
import { Grid, GridTemplate } from '../../../ui/components/layout/Grid';
import { useVirtualization } from '../../../utils/performance/ComponentOptimizer';
import { ResourceBar } from './ResourceBar';
import { ResourceDisplay } from './ResourceDisplay';

export type ResourceDisplayMode = 'compact' | 'detailed' | 'bars';

export interface ResourceGridItem {
  /**
   * Type of resource
   */
  resourceType: ResourceType;

  /**
   * Initial amount of the resource
   */
  initialAmount?: number;

  /**
   * Maximum capacity of the resource
   */
  maxCapacity?: number;
}

export interface ResourceGridProps {
  /**
   * List of resources to display
   */
  resources: ResourceGridItem[];

  /**
   * Number of columns in the grid
   * @default 3
   */
  columns?: number;

  /**
   * Gap between grid items in pixels
   * @default 16
   */
  gap?: number;

  /**
   * Display mode for resources
   * @default 'compact'
   */
  displayMode?: ResourceDisplayMode;

  /**
   * Whether to show resource percentage (only for 'bars' mode)
   * @default false
   */
  showPercentage?: boolean;

  /**
   * Class name for styling
   */
  className?: string;

  /**
   * Whether to use virtualization for large resource lists
   * @default true
   */
  virtualized?: boolean;

  /**
   * Fixed height for each resource item when using virtualization
   * @default 120
   */
  itemHeight?: number;
}

/**
 * Component that displays multiple resources in a grid layout
 *
 * Uses the standardized Grid component from the UI system for consistent layouts
 * and follows established resource type safety patterns
 */
export function ResourceGrid({
  resources,
  columns = 3,
  gap = 16,
  displayMode = 'compact',
  showPercentage = false,
  className = '',
  virtualized = true,
  itemHeight = 120,
}: ResourceGridProps) {
  // Validate resources to ensure only valid ResourceTypes are used
  const validResources = React.useMemo(() => {
    return resources.filter(resource =>
      Object.values(ResourceType).includes(resource.resourceType)
    );
  }, [resources]);

  // Virtualization setup
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);

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

  // Setup virtualization if enabled and there are enough resources
  const showVirtualized = virtualized && validResources.length > 20;

  const virtualization = React.useMemo(() => {
    if (!showVirtualized) {
      return null;
    }

    return useVirtualization({
      itemCount: validResources.length,
      itemHeight,
      containerHeight,
      overscan: 2,
    });
  }, [showVirtualized, validResources.length, itemHeight, containerHeight]);

  if (showVirtualized && virtualization) {
    // Virtualized rendering for better performance with large lists
    const { startIndex, endIndex, totalHeight, offsetY } = virtualization;
    const visibleResources = validResources.slice(startIndex, endIndex + 1);

    // Calculate grid layout
    const itemsPerRow = columns;
    const rowStartIndex = Math.floor(startIndex / itemsPerRow);
    const rowEndIndex = Math.floor(endIndex / itemsPerRow);

    // Log calculated row indices for debugging virtualization
    console.log(`Virtualized grid: Rendering rows ${rowStartIndex} to ${rowEndIndex}`);

    return (
      <div
        ref={containerRef}
        className={`resource-grid-virtual-container ${className}`}
        style={{ height: `${containerHeight}px`, position: 'relative', overflow: 'auto' }}
        onScroll={virtualization.handleScroll}
        data-testid="resource-grid"
      >
        <div
          className="resource-grid-virtual-content"
          style={{ height: `${totalHeight}px`, position: 'relative' }}
        >
          <div
            className="resource-grid-virtual-items"
            style={{
              position: 'absolute',
              top: `${offsetY}px`,
              left: 0,
              right: 0,
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap: `${gap}px`,
            }}
          >
            {visibleResources.map(resource => (
              <div key={resource.resourceType} className="resource-grid-item">
                {displayMode === 'compact' && (
                  <ResourceDisplay
                    resourceType={resource.resourceType}
                    initialAmount={resource.initialAmount}
                  />
                )}

                {displayMode === 'detailed' && (
                  <ResourceDisplay
                    resourceType={resource.resourceType}
                    initialAmount={resource.initialAmount}
                    className="rounded-md bg-gray-100 p-2"
                  />
                )}

                {displayMode === 'bars' && (
                  <ResourceBar
                    resourceType={resource.resourceType}
                    initialAmount={resource.initialAmount}
                    maxCapacity={resource.maxCapacity}
                    showPercentage={showPercentage}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Non-virtualized render for smaller lists
  return (
    <Grid
      columns={columns}
      gap={gap}
      template={GridTemplate.EQUAL}
      className={`resource-grid ${className}`}
      data-testid="resource-grid"
    >
      {validResources.map(resource => (
        <div key={resource.resourceType} className="resource-grid-item">
          {displayMode === 'compact' && (
            <ResourceDisplay
              resourceType={resource.resourceType}
              initialAmount={resource.initialAmount}
            />
          )}

          {displayMode === 'detailed' && (
            <ResourceDisplay
              resourceType={resource.resourceType}
              initialAmount={resource.initialAmount}
              className="rounded-md bg-gray-100 p-2"
            />
          )}

          {displayMode === 'bars' && (
            <ResourceBar
              resourceType={resource.resourceType}
              initialAmount={resource.initialAmount}
              maxCapacity={resource.maxCapacity}
              showPercentage={showPercentage}
            />
          )}
        </div>
      ))}

      {validResources.length === 0 && (
        <div className="resource-grid-empty">No valid resources to display</div>
      )}
    </Grid>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const MemoizedResourceGrid = React.memo(ResourceGrid);
