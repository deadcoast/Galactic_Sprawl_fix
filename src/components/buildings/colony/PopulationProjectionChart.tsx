import { useMemo } from 'react';

interface PopulationProjectionChartProps {
  currentPopulation: number;
  maxPopulation: number;
  growthRate: number; // Effective growth rate per cycle
  cycleLength: number; // Length of a growth cycle in milliseconds
  projectionCycles?: number; // Number of cycles to project
}

export function PopulationProjectionChart({
  currentPopulation,
  maxPopulation,
  growthRate,
  cycleLength,
  projectionCycles = 10,
}: PopulationProjectionChartProps) {
  // Calculate projected population for each cycle
  const projections = useMemo(() => {
    const result = [];
    let population = currentPopulation;

    for (let i = 0; i < projectionCycles; i++) {
      // Calculate growth for this cycle
      const growth = Math.floor(population * growthRate);
      population = Math.min(population + growth, maxPopulation);

      // Calculate time for this cycle
      const time = (i + 1) * cycleLength;

      result?.push({
        cycle: i + 1,
        population,
        time,
      });

      // Stop if we've reached max population
      if (population >= maxPopulation) {
        break;
      }
    }

    return result;
  }, [currentPopulation, maxPopulation, growthRate, cycleLength, projectionCycles]);

  // Format time in hours, minutes, and seconds
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m ` : ''}${seconds}s`;
  };

  // Calculate when max population will be reached
  const maxPopulationCycle = projections.findIndex(p => p.population >= maxPopulation);
  const timeToMaxPopulation =
    maxPopulationCycle !== -1 ? projections[maxPopulationCycle].time : null;

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
      <h3 className="mb-4 text-lg font-medium text-white">Population Projection</h3>

      {/* Max Population Estimate */}
      {timeToMaxPopulation ? (
        <div className="mb-4 rounded-md border border-gray-700 bg-gray-900 p-3">
          <div className="text-sm text-gray-400">Estimated time to max population:</div>
          <div className="text-lg font-medium text-white">{formatTime(timeToMaxPopulation)}</div>
          <div className="text-xs text-gray-500">({maxPopulationCycle + 1} growth cycles)</div>
        </div>
      ) : (
        <div className="mb-4 rounded-md border border-gray-700 bg-gray-900 p-3">
          <div className="text-sm text-gray-400">Max population estimate:</div>
          <div className="text-lg font-medium text-white">
            &gt; {formatTime(projectionCycles * cycleLength)}
          </div>
          <div className="text-xs text-gray-500">(More than {projectionCycles} growth cycles)</div>
        </div>
      )}

      {/* Projection Chart */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-gray-400">Population</span>
        <span className="text-xs text-gray-400">Time</span>
      </div>

      <div className="space-y-2">
        {/* Current Population */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-white">{currentPopulation.toLocaleString()}</span>
          </div>
          <span className="text-sm text-gray-400">Now</span>
        </div>

        {/* Projections */}
        {projections.map(projection => (
          <div key={projection.cycle} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-white">{projection.population.toLocaleString()}</span>
            </div>
            <span className="text-sm text-gray-400">{formatTime(projection.time)}</span>
          </div>
        ))}
      </div>

      {/* Visual Progress Bar */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-gray-400">Progress to Max Population</span>
          <span className="text-xs text-gray-400">
            {((currentPopulation / maxPopulation) * 100).toFixed(1)}%
          </span>
        </div>

        <div className="h-4 w-full overflow-hidden rounded-full bg-gray-900">
          {/* Current Progress */}
          <div
            className="h-full bg-blue-500"
            style={{ width: `${(currentPopulation / maxPopulation) * 100}%` }}
          ></div>
        </div>

        {/* Projection Markers */}
        <div className="relative h-2 w-full">
          {projections.map(projection => (
            <div
              key={projection.cycle}
              className="absolute top-0 h-2 w-0.5 bg-green-500"
              style={{ left: `${(projection.population / maxPopulation) * 100}%` }}
              title={`Cycle ${projection.cycle}: ${projection.population.toLocaleString()} (${formatTime(projection.time)})`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
