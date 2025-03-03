import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Pause,
  Play,
  RotateCcw,
  Settings,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface PopulationEvent {
  id: string;
  timestamp: number;
  type: 'growth' | 'decline' | 'migration' | 'disaster' | 'policy';
  amount: number;
  reason: string;
}

interface AutomatedPopulationManagerProps {
  colonyId: string;
  colonyName: string;
  currentPopulation: number;
  maxPopulation: number;
  growthRate: number; // Effective growth rate per cycle
  cycleLength: number; // Length of a growth cycle in milliseconds
  autoGrowthEnabled?: boolean; // Whether automatic growth is enabled
  events?: PopulationEvent[]; // Population events history
  onPopulationChange?: (newPopulation: number) => void;
  onAutoGrowthToggle?: (enabled: boolean) => void;
  onCycleComplete?: (cycleCount: number) => void;
  onSettingsChange?: (settings: { cycleLength: number }) => void;
}

/**
 * AutomatedPopulationManager component
 *
 * Manages automated population growth for a colony.
 * Handles growth cycles, population events, and provides controls for automation.
 */
export function AutomatedPopulationManager({
  colonyId: _colonyId,
  colonyName: _colonyName,
  currentPopulation,
  maxPopulation,
  growthRate,
  cycleLength,
  autoGrowthEnabled = false,
  events = [],
  onPopulationChange,
  onAutoGrowthToggle,
  onCycleComplete,
  onSettingsChange,
}: AutomatedPopulationManagerProps) {
  const [isRunning, setIsRunning] = useState(autoGrowthEnabled);
  const [cycleProgress, setCycleProgress] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [nextGrowthAmount, setNextGrowthAmount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [customCycleLength, setCustomCycleLength] = useState(cycleLength);
  const [showEvents, setShowEvents] = useState(false);

  // Calculate the next growth amount based on current population and growth rate
  const calculateNextGrowthAmount = useCallback(() => {
    if (currentPopulation >= maxPopulation) {
      return 0;
    }

    // Calculate raw growth
    const rawGrowth = Math.floor(currentPopulation * growthRate);

    // Ensure we don't exceed max population
    const adjustedGrowth = Math.min(rawGrowth, maxPopulation - currentPopulation);

    // Ensure at least 1 population growth if any growth is possible
    return Math.max(1, adjustedGrowth);
  }, [currentPopulation, maxPopulation, growthRate]);

  // Update next growth amount when dependencies change
  useEffect(() => {
    setNextGrowthAmount(calculateNextGrowthAmount());
  }, [calculateNextGrowthAmount]);

  // Handle growth cycle
  const handleGrowthCycle = useCallback(() => {
    if (currentPopulation >= maxPopulation) {
      // Population is at max, stop growth
      if (isRunning) {
        setIsRunning(false);
        onAutoGrowthToggle?.(false);
      }
      return;
    }

    const growthAmount = calculateNextGrowthAmount();

    if (growthAmount > 0) {
      // Apply population growth
      onPopulationChange?.(currentPopulation + growthAmount);

      // Update cycle count
      const newCycleCount = cycleCount + 1;
      setCycleCount(newCycleCount);
      onCycleComplete?.(newCycleCount);
    }
  }, [
    currentPopulation,
    maxPopulation,
    isRunning,
    calculateNextGrowthAmount,
    cycleCount,
    onPopulationChange,
    onAutoGrowthToggle,
    onCycleComplete,
  ]);

  // Set up growth cycle interval
  useEffect(() => {
    if (!isRunning) {
      return;
    }

    // Reset progress
    setCycleProgress(0);

    // Set up progress interval (updates every second)
    const progressInterval = setInterval(() => {
      setCycleProgress(prev => {
        const newProgress = prev + (1000 / cycleLength) * 100;
        return newProgress >= 100 ? 0 : newProgress;
      });
    }, 1000);

    // Set up growth cycle interval
    const cycleInterval = setInterval(() => {
      handleGrowthCycle();
    }, cycleLength);

    // Clean up intervals
    return () => {
      clearInterval(progressInterval);
      clearInterval(cycleInterval);
    };
  }, [isRunning, cycleLength, handleGrowthCycle]);

  // Toggle auto growth
  const toggleAutoGrowth = () => {
    const newState = !isRunning;
    setIsRunning(newState);
    onAutoGrowthToggle?.(newState);
  };

  // Reset cycle count
  const resetCycleCount = () => {
    setCycleCount(0);
    onCycleComplete?.(0);
  };

  // Apply custom cycle length
  const applyCustomCycleLength = () => {
    onSettingsChange?.({ cycleLength: customCycleLength });
    setShowSettings(false);
  };

  // Format time in minutes and seconds
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format timestamp to readable date/time
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Get color for population percentage
  const getPopulationColor = () => {
    const percentage = (currentPopulation / maxPopulation) * 100;

    if (percentage >= 90) {
      return 'text-red-400';
    } else if (percentage >= 75) {
      return 'text-amber-400';
    } else if (percentage >= 50) {
      return 'text-green-400';
    } else if (percentage >= 25) {
      return 'text-blue-400';
    }

    return 'text-gray-400';
  };

  // Get icon for event type
  const getEventIcon = (type: PopulationEvent['type']) => {
    switch (type) {
      case 'growth':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'decline':
        return <TrendingUp className="h-4 w-4 rotate-180 transform text-red-400" />;
      case 'migration':
        return <Users className="h-4 w-4 text-blue-400" />;
      case 'disaster':
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case 'policy':
        return <CheckCircle className="h-4 w-4 text-purple-400" />;
      default:
        return <Users className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Population Management</h3>
        <div className="flex items-center space-x-2">
          <button
            className="rounded-md border border-gray-700 bg-gray-900 p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Population Stats */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="rounded-md border border-gray-700 bg-gray-900 p-3">
          <div className="mb-1 text-xs text-gray-400">Current Population</div>
          <div className="flex items-end justify-between">
            <div className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-blue-400" />
              <span className={`text-xl font-bold ${getPopulationColor()}`}>
                {currentPopulation.toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {((currentPopulation / maxPopulation) * 100).toFixed(1)}% of capacity
            </div>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-800">
            <motion.div
              className="h-full bg-blue-500"
              style={{ width: `${(currentPopulation / maxPopulation) * 100}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${(currentPopulation / maxPopulation) * 100}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>

        <div className="rounded-md border border-gray-700 bg-gray-900 p-3">
          <div className="mb-1 text-xs text-gray-400">Growth Rate</div>
          <div className="flex items-end justify-between">
            <div className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-green-400" />
              <span className="text-xl font-bold text-green-400">
                {(growthRate * 100).toFixed(2)}%
              </span>
            </div>
            <div className="text-xs text-gray-500">per cycle ({formatTime(cycleLength)})</div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">Next growth:</span>
            <span className="text-xs font-medium text-green-400">
              +{nextGrowthAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Growth Cycle Progress */}
      <div className="mb-4 rounded-md border border-gray-700 bg-gray-900 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-white">Growth Cycle</span>
          </div>
          <div className="text-xs text-gray-400">
            {isRunning ? 'Running' : 'Paused'} • Cycle #{cycleCount}
          </div>
        </div>

        <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-800">
          <motion.div
            className="h-full bg-blue-500"
            style={{ width: `${cycleProgress}%` }}
            animate={{ width: `${cycleProgress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              className={`flex items-center space-x-1 rounded-md px-2 py-1 text-xs ${
                isRunning
                  ? 'bg-red-900/30 text-red-400 hover:bg-red-800/50'
                  : 'bg-green-900/30 text-green-400 hover:bg-green-800/50'
              }`}
              onClick={toggleAutoGrowth}
            >
              {isRunning ? (
                <>
                  <Pause className="h-3 w-3" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  <span>Start</span>
                </>
              )}
            </button>

            <button
              className="flex items-center space-x-1 rounded-md bg-gray-800 px-2 py-1 text-xs text-gray-400 hover:bg-gray-700"
              onClick={resetCycleCount}
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          </div>

          <div className="text-xs text-gray-400">
            {formatTime(cycleLength * (1 - cycleProgress / 100))} remaining
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          className="mb-4 rounded-md border border-gray-700 bg-gray-900 p-3"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="mb-3 text-sm font-medium text-white">Growth Settings</div>

          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">Cycle Length (milliseconds)</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1000"
                step="1000"
                value={customCycleLength}
                onChange={e => setCustomCycleLength(Number(e.target.value))}
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-white"
              />
              <button
                className="rounded-md bg-blue-900/30 px-2 py-1 text-xs text-blue-400 hover:bg-blue-800/50"
                onClick={applyCustomCycleLength}
              >
                Apply
              </button>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {formatTime(customCycleLength)} per cycle
            </div>
          </div>
        </motion.div>
      )}

      {/* Population Events */}
      <div className="overflow-hidden rounded-md border border-gray-700 bg-gray-900">
        <div
          className="flex cursor-pointer items-center justify-between p-3"
          onClick={() => setShowEvents(!showEvents)}
        >
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-white">Population Events</span>
          </div>
          {showEvents ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>

        {showEvents && (
          <div className="border-t border-gray-700">
            {events.length === 0 ? (
              <div className="p-3 text-center text-sm text-gray-500">
                No population events recorded
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto">
                {events.map(event => (
                  <div key={event.id} className="border-b border-gray-700 p-3 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getEventIcon(event.type)}
                        <span className="text-sm font-medium capitalize text-white">
                          {event.type}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          event.amount > 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {event.amount > 0 ? '+' : ''}
                        {event.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-400">{event.reason}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {formatTimestamp(event.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
