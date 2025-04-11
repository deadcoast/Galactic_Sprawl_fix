import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Droplet, Leaf, TrendingUp, Users, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { moduleEventBus } from '../../../lib/events/ModuleEventBus';
import { EventType } from '../../../types/events/EventTypes';
import { StandardizedEvent } from '../../../types/events/StandardizedEvents';
import { ResourceType } from '../../../types/resources/ResourceTypes';

interface GrowthModifier {
  id: string;
  name: string;
  description: string;
  effect: number; // Percentage modifier (e.g., 1.1 = +10%)
  type: ResourceType.FOOD | 'housing' | 'healthcare' | 'environment' | ResourceType.ENERGY;
  active: boolean;
}

interface PopulationGrowthModuleProps {
  colonyId: string;
  currentPopulation: number;
  maxPopulation: number;
  baseGrowthRate: number; // Base growth rate per cycle (e.g., 0.05 = 5%)
  growthModifiers: GrowthModifier[];
  cycleLength: number; // Length of a growth cycle in milliseconds
  quality: 'low' | 'medium' | 'high';
  onPopulationChange?: (newPopulation: number) => void;
  onModifierToggle?: (modifierId: string, active: boolean) => void;
}

/**
 * PopulationGrowthModule component
 *
 * Displays and manages population growth mechanics for a colony.
 * Shows growth rate, modifiers, and provides controls for adjusting growth parameters.
 */
export function PopulationGrowthModule({
  colonyId,
  currentPopulation,
  maxPopulation,
  baseGrowthRate,
  growthModifiers,
  cycleLength,
  quality,
  onPopulationChange,
  onModifierToggle,
}: PopulationGrowthModuleProps) {
  const [population, setPopulation] = useState(currentPopulation);
  const [isGrowing, setIsGrowing] = useState(false);
  const [growthHistory, setGrowthHistory] = useState<number[]>([]);
  const [showModifiers, setShowModifiers] = useState(false);
  const [autoGrowth, setAutoGrowth] = useState(false);
  const [growthInterval, setGrowthInterval] = useState<NodeJS.Timeout | null>(null);

  // Calculate effective growth rate with all active modifiers
  const effectiveGrowthRate = useCallback(() => {
    const activeModifiers = growthModifiers.filter(m => m.active);
    if (activeModifiers.length === 0) {
      return baseGrowthRate;
    }

    const totalEffect = activeModifiers.reduce((total, modifier) => {
      return total * modifier.effect;
    }, 1);

    return baseGrowthRate * totalEffect;
  }, [baseGrowthRate, growthModifiers]);

  // Format growth rate as percentage
  const formattedGrowthRate = `${(effectiveGrowthRate() * 100).toFixed(2)}%`;

  // Population percentage of maximum
  const populationPercentage = Math.min(100, Math.round((population / maxPopulation) * 100));

  // Population status
  const getPopulationStatus = useCallback(() => {
    if (populationPercentage < 30) {
      return 'low';
    }
    if (populationPercentage > 90) {
      return 'critical';
    }
    return 'normal';
  }, [populationPercentage]);

  const populationStatus = getPopulationStatus();

  // Handle manual population growth
  const handleGrowthCycle = useCallback(() => {
    if (population >= maxPopulation) {
      setIsGrowing(false);
      return;
    }

    setIsGrowing(true);

    // Calculate growth amount
    const growthAmount = Math.floor(population * effectiveGrowthRate());
    const newPopulation = Math.min(maxPopulation, population + growthAmount);

    // Update population
    setPopulation(newPopulation);
    onPopulationChange?.(newPopulation);

    // Update growth history
    setGrowthHistory(prev => [...prev.slice(-9), growthAmount]);

    // Emit population update event
    const event: StandardizedEvent = {
      type: EventType.MODULE_UPDATED,
      moduleId: colonyId,
      moduleType: ResourceType.POPULATION,
      timestamp: Date.now(),
      data: {
        stats: {
          [ResourceType.POPULATION]: newPopulation,
        },
      },
    };
    moduleEventBus.emit(event);

    setTimeout(() => {
      setIsGrowing(false);
    }, 1000);
  }, [population, maxPopulation, effectiveGrowthRate, colonyId, onPopulationChange]);

  // Handle modifier toggle
  const handleModifierToggle = useCallback(
    (modifierId: string) => {
      const modifier = growthModifiers.find(m => m.id === modifierId);
      if (modifier) {
        onModifierToggle?.(modifierId, !modifier.active);
      }
    },
    [growthModifiers, onModifierToggle]
  );

  // Handle auto growth toggle
  useEffect(() => {
    if (autoGrowth) {
      const interval = setInterval(() => {
        handleGrowthCycle();
      }, cycleLength);

      setGrowthInterval(interval);

      return () => {
        clearInterval(interval);
        setGrowthInterval(null);
      };
    } else if (growthInterval) {
      clearInterval(growthInterval);
      setGrowthInterval(null);
    }
  }, [autoGrowth, cycleLength, handleGrowthCycle]);

  // Update local population when prop changes
  useEffect(() => {
    setPopulation(currentPopulation);
  }, [currentPopulation]);

  // Get icon for modifier type
  const getModifierIcon = useCallback((type: GrowthModifier['type']) => {
    switch (type) {
      case ResourceType.FOOD:
        return <Droplet className="h-4 w-4 text-blue-400" />;
      case 'housing':
        return <Users className="h-4 w-4 text-indigo-400" />;
      case 'healthcare':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'environment':
        return <Leaf className="h-4 w-4 text-green-400" />;
      case ResourceType.ENERGY:
        return <Zap className="h-4 w-4 text-yellow-400" />;
    }
  }, []);

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-medium text-white">Population Growth</h3>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${quality === 'high' ? 'bg-green-800 text-green-300' : quality === 'medium' ? 'bg-yellow-800 text-yellow-300' : 'bg-red-800 text-red-300'}`}
          >
            {quality.charAt(0).toUpperCase() + quality.slice(1)} Quality
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Auto Growth</span>
          <button
            className={`h-6 w-12 rounded-full ${
              autoGrowth ? 'bg-green-600' : 'bg-gray-600'
            } relative transition-colors`}
            onClick={() => setAutoGrowth(!autoGrowth)}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                autoGrowth ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Population Display */}
      <div className="mb-6">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium text-gray-300">Current Population</span>
          </div>
          <span className="text-sm font-medium text-white">{population.toLocaleString()}</span>
        </div>

        <div className="mb-1 flex justify-between text-xs">
          <span className="text-gray-400">Capacity</span>
          <span
            className={`${
              populationStatus === 'critical'
                ? 'text-red-400'
                : populationStatus === 'low'
                  ? 'text-yellow-400'
                  : 'text-gray-300'
            }`}
          >
            {populationPercentage}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-gray-700">
          <motion.div
            className={`h-full rounded-full ${
              populationStatus === 'critical'
                ? 'bg-red-500'
                : populationStatus === 'low'
                  ? 'bg-yellow-500'
                  : 'bg-blue-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${populationPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>0</span>
          <span>{maxPopulation.toLocaleString()}</span>
        </div>
      </div>

      {/* Growth Rate */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <span className="text-sm font-medium text-gray-300">Growth Rate</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-sm font-medium text-green-400">{formattedGrowthRate}</span>
            <span className="text-xs text-gray-500">per cycle</span>
          </div>
        </div>

        {/* Growth History Chart */}
        <div className="mt-2 h-12 w-full">
          <div className="flex h-full items-end justify-between">
            {growthHistory.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-xs text-gray-500">No growth data yet</span>
              </div>
            ) : (
              growthHistory.map((amount, index) => {
                const percentage = Math.min(100, (amount / (maxPopulation * 0.1)) * 100);
                return (
                  <motion.div
                    key={index}
                    className="w-[8%] bg-green-500"
                    initial={{ height: 0 }}
                    animate={{ height: `${percentage}%` }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Growth Controls */}
      <div className="mb-4">
        <button
          className={`w-full rounded-md py-2 text-sm font-medium transition-colors ${
            isGrowing || population >= maxPopulation
              ? 'cursor-not-allowed bg-gray-700 text-gray-500'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          onClick={handleGrowthCycle}
          disabled={isGrowing || population >= maxPopulation}
        >
          {isGrowing
            ? 'Growing...'
            : population >= maxPopulation
              ? 'Maximum Population Reached'
              : 'Trigger Growth Cycle'}
        </button>
      </div>

      {/* Growth Modifiers */}
      <div>
        <button
          className="mb-2 flex w-full items-center justify-between rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-600"
          onClick={() => setShowModifiers(!showModifiers)}
        >
          <span>Growth Modifiers</span>
          <span className="text-xs text-gray-400">
            {growthModifiers.filter(m => m.active).length} Active
          </span>
        </button>

        <AnimatePresence>
          {showModifiers && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 rounded-md bg-gray-900 p-3">
                {growthModifiers.map(modifier => (
                  <div
                    key={modifier.id}
                    className="flex items-center justify-between rounded-md bg-gray-800 p-2"
                  >
                    <div className="flex items-center space-x-2">
                      {getModifierIcon(modifier.type)}
                      <div>
                        <div className="text-sm font-medium text-gray-300">{modifier.name}</div>
                        <div className="text-xs text-gray-500">{modifier.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span
                        className={`text-sm ${
                          modifier.effect > 1 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {modifier.effect > 1 ? '+' : ''}
                        {((modifier.effect - 1) * 100).toFixed(0)}%
                      </span>
                      <button
                        className={`h-5 w-10 rounded-full ${
                          modifier.active ? 'bg-green-600' : 'bg-gray-600'
                        } relative transition-colors`}
                        onClick={() => handleModifierToggle(modifier.id)}
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                            modifier.active ? 'left-5' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
