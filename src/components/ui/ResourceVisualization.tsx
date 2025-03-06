import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Beaker, Database, Info, Users, Zap } from 'lucide-react';
import { useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useTooltipContext } from './tooltip-context';

interface ResourceDisplayProps {
  type: 'minerals' | 'energy' | 'population' | 'research';
  value: number;
  rate: number;
  capacity?: number;
  thresholds?: {
    low: number;
    critical: number;
  };
}

const resourceIcons = {
  minerals: Database,
  energy: Zap,
  population: Users,
  research: Beaker,
};

const resourceColors = {
  minerals: {
    base: 'text-amber-400',
    bg: 'bg-amber-900/20',
    border: 'border-amber-700/30',
    fill: 'bg-amber-500',
  },
  energy: {
    base: 'text-cyan-400',
    bg: 'bg-cyan-900/20',
    border: 'border-cyan-700/30',
    fill: 'bg-cyan-500',
  },
  population: {
    base: 'text-green-400',
    bg: 'bg-green-900/20',
    border: 'border-green-700/30',
    fill: 'bg-green-500',
  },
  research: {
    base: 'text-purple-400',
    bg: 'bg-purple-900/20',
    border: 'border-purple-700/30',
    fill: 'bg-purple-500',
  },
};

// Resource descriptions for tooltips
const resourceDescriptions = {
  minerals: 'Raw materials used for construction and manufacturing.',
  energy: 'Powers all modules, buildings, and operations.',
  population: 'Citizens of your empire who can be assigned to various tasks.',
  research: 'Scientific knowledge used to unlock new technologies.',
};

// Resource status icons and messages
const getResourceStatus = (value: number, low: number, critical: number) => {
  if (value <= critical) {
    return {
      icon: <AlertTriangle className="h-4 w-4 text-red-400" />,
      message: 'Critical levels - take immediate action',
      color: 'text-red-400',
    };
  }
  if (value <= low) {
    return {
      icon: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
      message: 'Low levels - consider increasing production',
      color: 'text-yellow-400',
    };
  }
  return {
    icon: <Info className="h-4 w-4 text-green-400" />,
    message: 'Adequate levels',
    color: 'text-green-400',
  };
};

// Tooltip content for resources
const ResourceTooltip = ({ type, value, rate, capacity, thresholds }: ResourceDisplayProps) => {
  const status = thresholds ? getResourceStatus(value, thresholds.low, thresholds.critical) : null;
  const percentFilled = capacity ? ((value / capacity) * 100).toFixed(1) : 'N/A';
  const timeUntilEmpty = rate < 0 ? Math.abs(value / rate).toFixed(1) : 'N/A';
  const timeUntilFull = rate > 0 && capacity ? ((capacity - value) / rate).toFixed(1) : 'N/A';

  return (
    <div className="w-64 rounded-md border border-gray-700 bg-gray-800 p-3 shadow-lg">
      <div className="mb-2 flex items-center">
        <div className={`mr-2 rounded p-1 ${resourceColors[type].bg}`}>
          {resourceIcons[type]({ className: `h-4 w-4 ${resourceColors[type].base}` })}
        </div>
        <h3 className="flex-1 text-lg font-bold capitalize text-white">{type}</h3>
        {status?.icon}
      </div>

      <p className="mb-3 text-sm text-gray-300">{resourceDescriptions[type]}</p>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Current:</span>
          <span className={resourceColors[type].base}>{value.toLocaleString()}</span>
        </div>

        {capacity && (
          <div className="flex justify-between">
            <span className="text-gray-400">Capacity:</span>
            <span className="text-white">
              {capacity.toLocaleString()} ({percentFilled}%)
            </span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-gray-400">Rate:</span>
          <span
            className={rate > 0 ? 'text-green-400' : rate < 0 ? 'text-red-400' : 'text-gray-400'}
          >
            {rate > 0 ? '+' : ''}
            {rate}/sec
          </span>
        </div>

        {rate !== 0 && (
          <div className="flex justify-between">
            <span className="text-gray-400">
              {rate < 0 ? 'Time until empty:' : 'Time until full:'}
            </span>
            <span className="text-white">{rate < 0 ? timeUntilEmpty : timeUntilFull} seconds</span>
          </div>
        )}

        {thresholds && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-400">Low threshold:</span>
              <span className="text-yellow-400">{thresholds.low.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Critical threshold:</span>
              <span className="text-red-400">{thresholds.critical.toLocaleString()}</span>
            </div>
          </>
        )}
      </div>

      {status && (
        <div
          className={`mt-3 flex items-center rounded border border-gray-700 bg-gray-900 p-2 ${status.color}`}
        >
          {status.icon}
          <span className="ml-2 text-sm">{status.message}</span>
        </div>
      )}
    </div>
  );
};

function ResourceDisplay({ type, value, rate, capacity, thresholds }: ResourceDisplayProps) {
  const Icon = resourceIcons[type];
  const colors = resourceColors[type];
  const percentage = capacity ? (value / capacity) * 100 : 100;
  const isLow = thresholds && value <= thresholds.low;
  const isCritical = thresholds && value <= thresholds.critical;
  const { showTooltip, hideTooltip } = useTooltipContext();
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      showTooltip(
        <ResourceTooltip
          type={type}
          value={value}
          rate={rate}
          capacity={capacity}
          thresholds={thresholds}
        />,
        { x: rect.left + rect.width / 2, y: rect.top }
      );
    }
  };

  return (
    <div
      ref={ref}
      className={`p-3 ${colors.bg} rounded-lg border ${colors.border} cursor-help transition-colors hover:border-opacity-50`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={hideTooltip}
    >
      <div className="mb-2 flex items-center space-x-3">
        <div className={`rounded-lg p-1.5 ${colors.bg}`}>
          <Icon className={`h-4 w-4 ${colors.base}`} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium capitalize text-gray-300">{type}</div>
          <div className={`text-lg font-bold ${colors.base}`}>
            {value.toLocaleString()}
            {capacity && ` / ${capacity.toLocaleString()}`}
          </div>
        </div>
        <AnimatePresence>
          {rate !== 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`text-sm ${rate > 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {rate > 0 ? '+' : ''}
              {rate}/s
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-800">
        <motion.div
          className={`h-full ${colors.fill} transition-all duration-500`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          style={{
            opacity: isCritical ? 0.5 : isLow ? 0.7 : 1,
          }}
        />
      </div>

      {/* Warning Indicator */}
      <AnimatePresence>
        {(isLow || isCritical) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mt-2 text-xs ${isCritical ? 'text-red-400' : 'text-yellow-400'}`}
          >
            {isCritical ? 'Critical' : 'Low'} {type} levels
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ResourceVisualization() {
  const { state } = useGame();

  // Get the resources and rates from the game state
  const resources = state.resources;
  const resourceRates = state.resourceRates;

  // Set up thresholds based on resource types - these could come from a config or context
  const resourceThresholds = {
    minerals: { low: 1000, critical: 500 },
    energy: { low: 800, critical: 400 },
    population: { low: 50, critical: 25 },
    research: { low: 20, critical: 10 },
  };

  // Set up capacities - these could come from a resource manager
  const resourceCapacities = {
    minerals: 10000,
    energy: 8000,
    population: 1000,
    research: 1000,
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <ResourceDisplay
        type="minerals"
        value={resources.minerals}
        rate={resourceRates.minerals}
        capacity={resourceCapacities.minerals}
        thresholds={resourceThresholds.minerals}
      />
      <ResourceDisplay
        type="energy"
        value={resources.energy}
        rate={resourceRates.energy}
        capacity={resourceCapacities.energy}
        thresholds={resourceThresholds.energy}
      />
      <ResourceDisplay
        type="population"
        value={resources.population}
        rate={resourceRates.population}
        capacity={resourceCapacities.population}
        thresholds={resourceThresholds.population}
      />
      <ResourceDisplay
        type="research"
        value={resources.research}
        rate={resourceRates.research}
        capacity={resourceCapacities.research}
        thresholds={resourceThresholds.research}
      />
    </div>
  );
}
