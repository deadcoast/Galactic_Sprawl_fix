import { AlertTriangle, Beaker, Database, TrendingDown, TrendingUp, Users } from 'lucide-react';
import * as React from 'react';
import { useCallback, useState } from 'react';
import { ResourceType } from '../../../types/resources/ResourceTypes';

interface ResourceVisualizationProps {
  type: ResourceType;
  value: number;
  rate?: number;
  capacity?: number;
  thresholds?: {
    warning: number;
    critical: number;
  };
  className?: string;
  onClick?: () => void;
}

// Resource icon mapping
export const resourceIcons: Record<ResourceType, React.FC<{ className?: string }>> = {
  [ResourceType.MINERALS]: ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  [ResourceType.ENERGY]: ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  [ResourceType.POPULATION]: Users,
  [ResourceType.RESEARCH]: Beaker,
  [ResourceType.PLASMA]: Beaker,
  [ResourceType.GAS]: Beaker,
  [ResourceType.EXOTIC]: Beaker,
  [ResourceType.IRON]: Database,
  [ResourceType.COPPER]: Database,
  [ResourceType.TITANIUM]: Database,
  [ResourceType.URANIUM]: Database,
  [ResourceType.WATER]: Database,
  [ResourceType.HELIUM]: Database,
  [ResourceType.DEUTERIUM]: Database,
  [ResourceType.ANTIMATTER]: Beaker,
  [ResourceType.DARK_MATTER]: Beaker,
  [ResourceType.EXOTIC_MATTER]: Beaker,
  [ResourceType.ORGANIC]: Beaker,
  [ResourceType.FOOD]: ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
      <path d="M6 12h12" />
    </svg>
  ),
};

// Resource color mapping
export const resourceColors: Record<
  ResourceType,
  {
    base: string;
    bg: string;
    border: string;
    fill: string;
  }
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

// Resource name mapping
export const resourceNames: Record<ResourceType, string> = {
  [ResourceType.MINERALS]: 'Minerals',
  [ResourceType.ENERGY]: 'Energy',
  [ResourceType.POPULATION]: 'Population',
  [ResourceType.RESEARCH]: 'Research',
  [ResourceType.PLASMA]: 'Plasma',
  [ResourceType.GAS]: 'Gas',
  [ResourceType.EXOTIC]: 'Exotic',
  [ResourceType.IRON]: 'Iron',
  [ResourceType.COPPER]: 'Copper',
  [ResourceType.TITANIUM]: 'Titanium',
  [ResourceType.URANIUM]: 'Uranium',
  [ResourceType.WATER]: 'Water',
  [ResourceType.HELIUM]: 'Helium',
  [ResourceType.DEUTERIUM]: 'Deuterium',
  [ResourceType.ANTIMATTER]: 'Antimatter',
  [ResourceType.DARK_MATTER]: 'Dark Matter',
  [ResourceType.EXOTIC_MATTER]: 'Exotic Matter',
  [ResourceType.ORGANIC]: 'Organic',
  [ResourceType.FOOD]: 'Food',
};

function getResourceStatus(
  value: number,
  capacity?: number,
  thresholds?: { warning: number; critical: number }
) {
  if (!capacity || !thresholds) {
    return null;
  }

  const percentage = (value / capacity) * 100;

  if (percentage <= thresholds.critical) {
    return {
      icon: AlertTriangle,
      message: 'Critical',
      color: 'text-red-500',
    };
  }

  if (percentage <= thresholds.warning) {
    return {
      icon: AlertTriangle,
      message: 'warning',
      color: 'text-yellow-500',
    };
  }

  return null;
}

function ResourceTooltip({
  type,
  value,
  rate = 0,
  capacity,
  thresholds,
}: ResourceVisualizationProps) {
  const status = getResourceStatus(value, capacity, thresholds);
  const colors = resourceColors[type];

  return (
    <div className={`rounded-md p-2 ${colors.bg} border ${colors.border}`}>
      <div className="flex items-center gap-2">
        <span className={colors.base}>{resourceNames[type]}</span>
        {status && (
          <span className={status.color}>
            <status.icon className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="mt-1 space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-400">Current:</span>
          <span className={colors.base}>{value.toLocaleString()}</span>
        </div>

        {rate !== 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400">Rate:</span>
            <div className="flex items-center gap-1">
              {rate > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : rate < 0 ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : null}
              <span
                className={rate > 0 ? 'text-green-500' : rate < 0 ? 'text-red-500' : colors.base}
              >
                {rate > 0 ? '+' : ''}
                {rate.toLocaleString()}/s
              </span>
            </div>
          </div>
        )}

        {capacity !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400">Capacity:</span>
            <span className={colors.base}>{capacity.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ResourceVisualization Component
 *
 * Displays a resource with its icon, amount, and name.
 * Uses the ResourceType enum for type-safe resource handling.
 */
const ResourceVisualization: React.FC<ResourceVisualizationProps> = ({
  type,
  value,
  rate = 0,
  capacity,
  thresholds,
  className = '',
  onClick,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY });
    setShowTooltip(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  const colors = resourceColors[type];
  const Icon = resourceIcons[type];
  const status = getResourceStatus(value, capacity, thresholds);

  return (
    <div
      className={`relative flex items-center gap-2 rounded-md p-2 ${colors.bg} border ${colors.border} cursor-pointer ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <Icon className={`h-5 w-5 ${colors.base}`} />
      <span className={colors.base}>{value.toLocaleString()}</span>
      {status && <status.icon className={`h-4 w-4 ${status.color}`} />}
      {showTooltip && (
        <div
          className="fixed z-50"
          style={{
            left: position.x + 10,
            top: position.y + 10,
          }}
        >
          <ResourceTooltip
            type={type}
            value={value}
            rate={rate}
            capacity={capacity}
            thresholds={thresholds}
          />
        </div>
      )}
    </div>
  );
};

export default ResourceVisualization;
