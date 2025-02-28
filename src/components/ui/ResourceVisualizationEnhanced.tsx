import { AnimatePresence, motion } from 'framer-motion';
import { Beaker, Database, Droplet, Users, Wind, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useResourceManagement } from '../../hooks/resources/useResourceManagement';
import { ResourceType } from '../../types/resources/ResourceTypes';

interface ResourceDisplayProps {
  type: ResourceType;
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
  plasma: Droplet,
  gas: Wind,
  exotic: Beaker,
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
  plasma: {
    base: 'text-blue-400',
    bg: 'bg-blue-900/20',
    border: 'border-blue-700/30',
    fill: 'bg-blue-500',
  },
  gas: {
    base: 'text-teal-400',
    bg: 'bg-teal-900/20',
    border: 'border-teal-700/30',
    fill: 'bg-teal-500',
  },
  exotic: {
    base: 'text-pink-400',
    bg: 'bg-pink-900/20',
    border: 'border-pink-700/30',
    fill: 'bg-pink-500',
  },
};

function ResourceDisplay({ type, thresholds }: ResourceDisplayProps) {
  const {
    getResourceAmount,
    getResourceCapacity,
    getProductionRate,
    getConsumptionRate,
    getResourcePercentage,
  } = useResourceManagement();

  const value = getResourceAmount(type);
  const capacity = getResourceCapacity(type);
  const productionRate = getProductionRate(type);
  const consumptionRate = getConsumptionRate(type);
  const rate = productionRate - consumptionRate;
  const percentage = getResourcePercentage(type);

  const Icon = resourceIcons[type] || Database;
  const colors = resourceColors[type] || resourceColors.minerals;
  const isLow = thresholds && value <= thresholds.low;
  const isCritical = thresholds && value <= thresholds.critical;

  return (
    <div className={`p-3 ${colors.bg} rounded-lg border ${colors.border}`}>
      <div className="mb-2 flex items-center space-x-3">
        <div className={`rounded-lg p-1.5 ${colors.bg}`}>
          <Icon className={`h-4 w-4 ${colors.base}`} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium capitalize text-gray-300">{type}</div>
          <div className={`text-lg font-bold ${colors.base}`}>
            {value.toLocaleString()}
            {capacity > 0 && ` / ${capacity.toLocaleString()}`}
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
              {rate.toFixed(1)}/s
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

export function ResourceVisualizationEnhanced() {
  const { isInitialized, getAllResourceStates } = useResourceManagement();
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);

  // Get all resource types
  useEffect(() => {
    if (isInitialized) {
      const states = getAllResourceStates();
      setResourceTypes(Array.from(states.keys()));
    }
  }, [isInitialized, getAllResourceStates]);

  if (!isInitialized) {
    return <div>Loading resources...</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {resourceTypes.map(type => (
        <ResourceDisplay key={type} type={type} thresholds={{ low: 1000, critical: 500 }} />
      ))}
    </div>
  );
}
