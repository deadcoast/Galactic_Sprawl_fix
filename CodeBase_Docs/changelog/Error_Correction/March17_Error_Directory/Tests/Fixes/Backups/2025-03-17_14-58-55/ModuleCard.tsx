import * as React from "react";
import { forwardRef } from 'react';
import { Card, CardProps } from '../Card';
import { cn } from '../../../../utils/cn';

/**
 * Module status types
 */
export type ModuleStatus = 'active' | 'inactive' | 'damaged' | 'destroyed' | 'upgrading' | 'locked';

/**
 * Module type
 */
export interface Module {
  /** Unique ID of the module */
  id: string;
  /** Display name of the module */
  name: string;
  /** Description of what the module does */
  description: string;
  /** The module's current status */
  status: ModuleStatus;
  /** The module's current level (0 = not installed) */
  level: number;
  /** The module's maximum possible level */
  maxLevel: number;
  /** The module's energy consumption */
  energyConsumption: number;
  /** The module's efficiency (0-100%) */
  efficiency: number;
  /** The module's remaining durability (0-100%) */
  durability: number;
  /** Time until the module is repaired/upgraded (in seconds) */
  timeRemaining?: number;
  /** The module's image or icon URL */
  imageUrl?: string;
  /** The module's size/footprint (in grid units) */
  size?: { width: number; height: number };
  /** The module's position in the grid */
  position?: { x: number; y: number };
  /** The module's required level to unlock */
  requiredLevel?: number;
  /** The module's tags */
  tags?: string[];
  /** Resources consumed per cycle */
  resourceConsumption?: Record<string, number>;
  /** Resources produced per cycle */
  resourceProduction?: Record<string, number>;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

/**
 * ModuleCard props
 */
export interface ModuleCardProps extends Omit<CardProps, 'title' | 'subtitle'> {
  /** The module to display */
  module: Module;
  /** Whether to show the module level */
  showLevel?: boolean;
  /** Whether to show the module energy consumption */
  showEnergy?: boolean;
  /** Whether to show the module efficiency */
  showEfficiency?: boolean;
  /** Whether to show the module durability */
  showDurability?: boolean;
  /** Whether to show module resource I/O */
  showResources?: boolean;
  /** Whether the module can be selected */
  selectable?: boolean;
  /** Whether the module is selected */
  selected?: boolean;
  /** Whether to show the upgrade button */
  showUpgrade?: boolean;
  /** Click handler for the upgrade button */
  onUpgrade?: (module: Module) => void;
  /** Click handler for the module card */
  onSelect?: (module: Module) => void;
  /** Whether to show the repair button */
  showRepair?: boolean;
  /** Click handler for the repair button */
  onRepair?: (module: Module) => void;
}

/**
 * ModuleCard component
 * 
 * A specialized card for displaying ship or station modules,
 * with support for status indicators, resource I/O, and action buttons.
 */
export const ModuleCard = forwardRef<HTMLDivElement, ModuleCardProps>(
  ({
    module,
    showLevel = true,
    showEnergy = true,
    showEfficiency = true,
    showDurability = true,
    showResources = false,
    selectable = false,
    selected = false,
    showUpgrade = false,
    onUpgrade,
    onSelect,
    showRepair = false,
    onRepair,
    className,
    ...props
  }, ref) => {
    // Status colors
    const statusColors: Record<ModuleStatus, string> = {
      active: 'bg-green-500',
      inactive: 'bg-gray-500',
      damaged: 'bg-yellow-500',
      destroyed: 'bg-red-500',
      upgrading: 'bg-blue-500',
      locked: 'bg-purple-500'
    };

    // Status labels
    const statusLabels: Record<ModuleStatus, string> = {
      active: 'Active',
      inactive: 'Inactive',
      damaged: 'Damaged',
      destroyed: 'Destroyed',
      upgrading: 'Upgrading',
      locked: 'Locked'
    };

    // Format time remaining
    const formatTime = (seconds?: number): string => {
      if (!seconds) return '';
      if (seconds < 60) return `${Math.ceil(seconds)}s`;
      if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
      return `${Math.floor(seconds / 3600)}h ${Math.ceil((seconds % 3600) / 60)}m`;
    };

    // Handle card click for selection
    const handleClick = () => {
      if (selectable && onSelect) {
        onSelect(module);
      }
    };

    // Create the header with status indicator
    const moduleHeader = (
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={cn(
            "w-3 h-3 rounded-full mr-2",
            statusColors[module.status]
          )} />
          <span className="font-medium">{statusLabels[module.status]}</span>
        </div>
        {module.timeRemaining && module.timeRemaining > 0 && (
          <div className="text-sm text-gray-600">
            {formatTime(module.timeRemaining)}
          </div>
        )}
      </div>
    );

    // Create the footer with action buttons
    const moduleFooter = (
      (showUpgrade || showRepair) && (
        <div className="flex justify-end space-x-2">
          {showRepair && module.status === 'damaged' && (
            <button 
              className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded"
              onClick={(e) => {
                e.stopPropagation();
                if (onRepair) onRepair(module);
              }}
            >
              Repair
            </button>
          )}
          {showUpgrade && module.level < module.maxLevel && module.status !== 'destroyed' && (
            <button 
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded"
              onClick={(e) => {
                e.stopPropagation();
                if (onUpgrade) onUpgrade(module);
              }}
            >
              Upgrade to Lvl {module.level + 1}
            </button>
          )}
        </div>
      )
    );

    // Create progress bars for durability and efficiency
    const renderProgressBars = () => (
      <div className="mt-3 space-y-2">
        {showDurability && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Durability</span>
              <span>{module.durability}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full",
                  module.durability > 60 ? "bg-green-500" :
                  module.durability > 30 ? "bg-yellow-500" : "bg-red-500"
                )}
                style={{ width: `${module.durability}%` }}
              />
            </div>
          </div>
        )}
        
        {showEfficiency && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Efficiency</span>
              <span>{module.efficiency}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${module.efficiency}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );

    // Create resource I/O display
    const renderResources = () => {
      if (!showResources) return null;
      
      const hasConsumption = module.resourceConsumption && Object.keys(module.resourceConsumption).length > 0;
      const hasProduction = module.resourceProduction && Object.keys(module.resourceProduction).length > 0;
      
      if (!hasConsumption && !hasProduction) return null;
      
      return (
        <div className="mt-3 text-sm border-t border-gray-200 pt-2">
          {hasConsumption && (
            <div>
              <span className="text-xs font-medium text-red-600">Consumes:</span>
              <div className="grid grid-cols-2 gap-x-2 ml-2">
                {Object.entries(module.resourceConsumption!).map(([resource, amount]) => (
                  <div key={resource} className="flex justify-between">
                    <span>{resource}</span>
                    <span>-{amount}/s</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {hasProduction && (
            <div className="mt-1">
              <span className="text-xs font-medium text-green-600">Produces:</span>
              <div className="grid grid-cols-2 gap-x-2 ml-2">
                {Object.entries(module.resourceProduction!).map(([resource, amount]) => (
                  <div key={resource} className="flex justify-between">
                    <span>{resource}</span>
                    <span>+{amount}/s</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <Card
        ref={ref}
        variant="bordered"
        hoverable={selectable}
        selectable={selectable}
        selected={selected}
        disabled={module.status === 'destroyed' || module.status === 'locked'}
        title={
          <div className="flex justify-between items-center">
            <span>{module.name}</span>
            {showLevel && (
              <span className="text-sm bg-gray-100 px-2 py-0.5 rounded">
                Lvl {module.level}/{module.maxLevel}
              </span>
            )}
          </div>
        }
        subtitle={module.description}
        header={moduleHeader}
        footer={moduleFooter}
        className={cn(
          "border-l-4",
          module.status === 'active' && "border-l-green-500",
          module.status === 'inactive' && "border-l-gray-500",
          module.status === 'damaged' && "border-l-yellow-500",
          module.status === 'destroyed' && "border-l-red-500",
          module.status === 'upgrading' && "border-l-blue-500",
          module.status === 'locked' && "border-l-purple-500",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <div className="flex flex-col">
          {/* Module image if available */}
          {module.imageUrl && (
            <div className="mb-3 flex justify-center">
              <img 
                src={module.imageUrl} 
                alt={module.name}
                className="h-24 object-contain rounded"
              />
            </div>
          )}
          
          {/* Main module stats */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {showEnergy && (
              <div className="flex justify-between">
                <span>Energy:</span>
                <span className="text-orange-600">{module.energyConsumption} kW</span>
              </div>
            )}
            
            {/* You can add other specific module stats here */}
            {module.size && (
              <div className="flex justify-between">
                <span>Size:</span>
                <span>{module.size.width}x{module.size.height}</span>
              </div>
            )}
          </div>
          
          {/* Progress bars */}
          {renderProgressBars()}
          
          {/* Resource I/O */}
          {renderResources()}
        </div>
      </Card>
    );
  }
);

ModuleCard.displayName = 'ModuleCard';

export default ModuleCard;