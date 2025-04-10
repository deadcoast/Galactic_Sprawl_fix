/**
 * @context: ui-system, component-library, ship-system
 * 
 * ShipDisplay component for showing ship information and status
 */
import {
    AlertTriangle,
    Anchor,
    Atom,
    Box,
    CircleDashed,
    Cloud,
    Diamond,
    Droplet,
    Eye,
    Flame,
    Hammer,
    Hexagon,
    Leaf,
    Microscope,
    MountainSnow,
    Navigation,
    Radiation,
    Rocket,
    Shield,
    Sparkles,
    Star,
    Users,
    Wheat,
    Wind,
    Zap
} from 'lucide-react';
import * as React from 'react';
import { errorLoggingService } from '../../../services/ErrorLoggingService';
import { ResourceType } from '../../../types/resources/ResourceTypes';
import { Ship } from '../../../types/ships/Ship';

// Ship status types with visual indicators
const SHIP_STATUS_INDICATORS: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  'idle': { 
    icon: <Anchor className="h-4 w-4" />, 
    color: '#6c757d', 
    label: 'Idle' 
  },
  'scanning': { 
    icon: <Eye className="h-4 w-4" />, 
    color: '#2196f3', 
    label: 'Scanning' 
  },
  'investigating': { 
    icon: <Navigation className="h-4 w-4" />, 
    color: '#fb8c00', 
    label: 'Investigating' 
  },
  'returning': { 
    icon: <Anchor className="h-4 w-4" />, 
    color: '#4caf50', 
    label: 'Returning' 
  },
  'combat': { 
    icon: <AlertTriangle className="h-4 w-4" />, 
    color: '#f44336', 
    label: 'Combat' 
  },
  'mining': { 
    icon: <Box className="h-4 w-4" />, 
    color: '#ff9800', 
    label: 'Mining' 
  },
};

// Ship type icons
const SHIP_TYPE_ICONS: Record<string, React.ReactNode> = {
  'recon': <Eye className="h-5 w-5" />,
  'mining': <Box className="h-5 w-5" />,
  'war': <Shield className="h-5 w-5" />,
};

const resourceIcons: Record<ResourceType, JSX.Element> = {
  [ResourceType.ENERGY]: <Zap className="h-5 w-5 text-yellow-400" />,
  [ResourceType.MINERALS]: <MountainSnow className="h-5 w-5 text-gray-400" />,
  [ResourceType.FOOD]: <Wheat className="h-5 w-5 text-green-400" />,
  [ResourceType.POPULATION]: <Users className="h-5 w-5 text-blue-400" />,
  [ResourceType.RESEARCH]: <Microscope className="h-5 w-5 text-purple-400" />,
  [ResourceType.PLASMA]: <Flame className="h-5 w-5 text-red-500" />,
  [ResourceType.GAS]: <Cloud className="h-5 w-5 text-cyan-400" />,
  [ResourceType.EXOTIC]: <Diamond className="h-5 w-5 text-pink-400" />,
  [ResourceType.IRON]: <Hammer className="h-5 w-5 text-slate-500" />,
  [ResourceType.COPPER]: <Hexagon className="h-5 w-5 text-orange-500" />,
  [ResourceType.TITANIUM]: <Shield className="h-5 w-5 text-blue-500" />,
  [ResourceType.URANIUM]: <Radiation className="h-5 w-5 text-lime-500" />,
  [ResourceType.WATER]: <Droplet className="h-5 w-5 text-sky-400" />,
  [ResourceType.HELIUM]: <Wind className="h-5 w-5 text-indigo-400" />,
  [ResourceType.DEUTERIUM]: <Atom className="h-5 w-5 text-teal-400" />,
  [ResourceType.ANTIMATTER]: <Sparkles className="h-5 w-5 text-yellow-300" />,
  [ResourceType.DARK_MATTER]: <CircleDashed className="h-5 w-5 text-violet-500" />,
  [ResourceType.EXOTIC_MATTER]: <Star className="h-5 w-5 text-fuchsia-500" />,
  [ResourceType.ORGANIC]: <Leaf className="h-5 w-5 text-emerald-500" />,
};

interface ShipDisplayProps {
  /**
   * Ship data to display
   */
  ship: Ship;
  
  /**
   * Whether to show detailed information
   * @default false
   */
  detailed?: boolean;
  
  /**
   * Whether to show ship controls
   * @default false
   */
  showControls?: boolean;
  
  /**
   * Callback when ship is selected
   */
  onSelect?: (shipId: string) => void;
  
  /**
   * Class name for additional styling
   */
  className?: string;
}

/**
 * Component for displaying ship information and status
 */
export function ShipDisplay({
  ship,
  detailed = false,
  showControls = false,
  onSelect,
  className = '',
}: ShipDisplayProps) {
  const statusInfo = SHIP_STATUS_INDICATORS[ship.status] || 
    { icon: <AlertTriangle className="h-4 w-4" />, color: '#9e9e9e', label: 'Unknown' };
  
  const typeIcon = SHIP_TYPE_ICONS[ship.type] || <Rocket className="h-5 w-5" />;
  
  const handleClick = () => {
    if (onSelect) {
      onSelect(ship.id);
    }
  };
  
  return (
    <div 
      className={`ship-display p-4 border rounded-md ${className}`}
      style={{ borderLeftColor: statusInfo.color, borderLeftWidth: '4px' }}
      onClick={handleClick}
      data-testid="ship-display"
      data-ship-id={ship.id}
    >
      <div className="ship-display__header flex justify-between items-center mb-2">
        <h3 className="ship-display__title text-lg font-semibold flex items-center">
          <span className="ship-display__type-icon mr-2">{typeIcon}</span>
          {ship.name}
        </h3>
        <div 
          className="ship-display__status flex items-center px-2 py-1 rounded-full"
          style={{ backgroundColor: `${statusInfo.color}20` }}
        >
          <span className="ship-display__status-icon mr-1" style={{ color: statusInfo.color }}>
            {statusInfo.icon}
          </span>
          <span className="ship-display__status-label text-sm" style={{ color: statusInfo.color }}>
            {statusInfo.label}
          </span>
        </div>
      </div>
      
      {detailed && (
        <div className="ship-display__details mt-3 text-sm">
          <div className="ship-display__capabilities grid grid-cols-2 gap-2">
            <div className="ship-display__capability flex items-center">
              <Rocket className="h-4 w-4 mr-1 text-gray-500" />
              <span className="text-gray-700">Speed:</span>
              <span className="ml-1 font-medium">{ship.capabilities.speed}</span>
            </div>
            <div className="ship-display__capability flex items-center">
              <Navigation className="h-4 w-4 mr-1 text-gray-500" />
              <span className="text-gray-700">Range:</span>
              <span className="ml-1 font-medium">{ship.capabilities.range}</span>
            </div>
            
            {ship.capabilities.cargo !== undefined && (
              <div className="ship-display__capability flex items-center">
                <Box className="h-4 w-4 mr-1 text-gray-500" />
                <span className="text-gray-700">Cargo:</span>
                <span className="ml-1 font-medium">{ship.capabilities.cargo}</span>
              </div>
            )}
            
            {ship.capabilities.weapons !== undefined && (
              <div className="ship-display__capability flex items-center">
                <Shield className="h-4 w-4 mr-1 text-gray-500" />
                <span className="text-gray-700">Weapons:</span>
                <span className="ml-1 font-medium">{ship.capabilities.weapons}</span>
              </div>
            )}
            
            {ship.capabilities.stealth !== undefined && (
              <div className="ship-display__capability flex items-center">
                <Eye className="h-4 w-4 mr-1 text-gray-500" />
                <span className="text-gray-700">Stealth:</span>
                <span className="ml-1 font-medium">{ship.capabilities.stealth}</span>
              </div>
            )}
          </div>
          
          {ship.currentTask && (
            <div className="ship-display__task mt-3 pt-3 border-t border-gray-200">
              <div className="text-sm text-gray-500">Current task:</div>
              <div className="font-medium">{ship.currentTask}</div>
            </div>
          )}
          
          <div className="ship-display__exp mt-2 flex items-center">
            <span className="text-gray-500 text-xs mr-1">Experience:</span>
            <div className="h-2 flex-grow bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.min(ship.experience * 10, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
      
      {showControls && (
        <div className="ship-display__controls mt-3 pt-3 border-t border-gray-200 flex gap-2">
          <button 
            className="ship-display__control-btn px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded"
            onClick={(e) => {
              e.stopPropagation();
              errorLoggingService.logInfo('Assign task clicked', {
                component: 'ShipDisplay',
                action: 'assignTask',
                shipId: ship.id,
              });
            }}
          >
            Assign Task
          </button>
          
          <button 
            className="ship-display__control-btn px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 rounded"
            onClick={(e) => {
              e.stopPropagation();
              errorLoggingService.logInfo('Details clicked', {
                component: 'ShipDisplay',
                action: 'viewDetails',
                shipId: ship.id,
              });
            }}
          >
            Details
          </button>
          
          {ship.stealthActive !== undefined && (
            <button 
              className={`ship-display__control-btn px-3 py-1 text-sm rounded ${ship.stealthActive ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'}`}
              onClick={(e) => {
                e.stopPropagation();
                errorLoggingService.logInfo('Toggle stealth clicked', {
                  component: 'ShipDisplay',
                  action: 'toggleStealth',
                  shipId: ship.id,
                  newState: !ship.stealthActive,
                });
              }}
            >
              {ship.stealthActive ? 'Stealth On' : 'Stealth Off'}
            </button>
          )}
        </div>
      )}
    </div>
  );
} 