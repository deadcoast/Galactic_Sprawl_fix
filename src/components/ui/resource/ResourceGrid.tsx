/**
 * @context: ui-system, resource-system, component-library
 * 
 * ResourceGrid component for displaying multiple resources in a grid layout
 * Uses standardized UI components and resource type safety
 */
import React from 'react';
import { ResourceType } from '../../../types/resources/ResourceTypes';
import { ResourceDisplay } from './ResourceDisplay';
import { ResourceBar } from './ResourceBar';
import { Grid, GridTemplate } from '../../../ui/components/layout/Grid';

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
}: ResourceGridProps) {
  // Validate resources to ensure only valid ResourceTypes are used
  const validResources = React.useMemo(() => {
    return resources.filter(resource => 
      Object.values(ResourceType).includes(resource.resourceType)
    );
  }, [resources]);
  
  return (
    <Grid
      columns={columns}
      gap={gap}
      template={GridTemplate.EQUAL}
      className={`resource-grid ${className}`}
      data-testid="resource-grid"
    >
      {validResources.map((resource) => (
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
              className="p-2 bg-gray-100 rounded-md"
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
        <div className="resource-grid-empty">
          No valid resources to display
        </div>
      )}
    </Grid>
  );
} 