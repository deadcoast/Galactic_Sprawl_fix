import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Zap, Users, Beaker } from 'lucide-react';
import { useResources } from '../../contexts/GameContext';

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

function ResourceDisplay({ type, value, rate, capacity, thresholds }: ResourceDisplayProps) {
  const Icon = resourceIcons[type];
  const colors = resourceColors[type];
  const percentage = capacity ? (value / capacity) * 100 : 100;
  const isLow = thresholds && value <= thresholds.low;
  const isCritical = thresholds && value <= thresholds.critical;

  return (
    <div className={`p-3 ${colors.bg} rounded-lg border ${colors.border}`}>
      <div className="flex items-center space-x-3 mb-2">
        <div className={`p-1.5 rounded-lg ${colors.bg}`}>
          <Icon className={`w-4 h-4 ${colors.base}`} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-300 capitalize">{type}</div>
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
              {rate > 0 ? '+' : ''}{rate}/s
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
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
  const resources = useResources();
  const [resourceRates, setResourceRates] = useState({
    minerals: 0,
    energy: 0,
    population: 0,
    research: 0,
  });

  // Calculate resource rates
  useEffect(() => {
    const interval = setInterval(() => {
      setResourceRates(prev => ({
        minerals: Math.random() * 10 - 2, // Example rate calculation
        energy: Math.random() * 15 - 5,
        population: Math.random() * 2 - 0.5,
        research: Math.random() * 5,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4">
      <ResourceDisplay
        type="minerals"
        value={resources.minerals}
        rate={resourceRates.minerals}
        capacity={10000}
        thresholds={{ low: 1000, critical: 500 }}
      />
      <ResourceDisplay
        type="energy"
        value={resources.energy}
        rate={resourceRates.energy}
        capacity={8000}
        thresholds={{ low: 800, critical: 400 }}
      />
      <ResourceDisplay
        type="population"
        value={resources.population}
        rate={resourceRates.population}
        thresholds={{ low: 50, critical: 25 }}
      />
      <ResourceDisplay
        type="research"
        value={resources.research}
        rate={resourceRates.research}
      />
    </div>
  );
} 