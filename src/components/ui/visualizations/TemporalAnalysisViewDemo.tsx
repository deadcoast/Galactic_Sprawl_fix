import * as d3 from 'd3';
import * as React from "react";
import { useState } from 'react';
import TemporalAnalysisView from './TemporalAnalysisView';

/**
 * Represents a data point in time series
 */
interface TimeDataPoint {
  timestamp: Date;
  value: number;
  category: string;
  id: string;
}

/**
 * Demo component for TemporalAnalysisView
 */
const TemporalAnalysisViewDemo: React.FC = () => {
  // Generate sample data with proper typing
  const generateRandomData = (): TimeDataPoint[] => {
    const categories = ['Production', 'Consumption', 'Storage'];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    const data: TimeDataPoint[] = [];

    // Generate data for each category
    categories.forEach(category => {
      let lastValue = Math.random() * 50 + 50; // Start with value between 50-100

      // Generate 20 data points per category
      for (let i = 0; i < 20; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i * 9); // Every 9 days

        // Random walk with momentum
        const change = (Math.random() - 0.5) * 10;
        lastValue = Math.max(10, Math.min(150, lastValue + change));

        data.push({
          id: `${category}-${i}`,
          timestamp: currentDate,
          value: lastValue,
          category,
        });
      }
    });

    return data;
  };

  // State with proper typing
  const [timeData, setTimeData] = useState<TimeDataPoint[]>(generateRandomData());
  const [showLabels, setShowLabels] = useState(true);
  const [loopAnimation, setLoopAnimation] = useState(false);
  const [transitionDuration, setTransitionDuration] = useState(750);

  // Regenerate data with type safety
  const regenerateData = () => {
    setTimeData(generateRandomData());
  };

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-bold">Temporal Analysis Visualization</h2>

      <div className="mb-4 flex flex-wrap gap-4">
        <button
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={regenerateData}
        >
          Regenerate Data
        </button>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={() => setShowLabels(!showLabels)}
            className="mr-2"
          />
          Show Value Labels
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={loopAnimation}
            onChange={() => setLoopAnimation(!loopAnimation)}
            className="mr-2"
          />
          Loop Animation
        </label>

        <div className="flex items-center">
          <span className="mr-2">Animation Speed:</span>
          <select
            value={transitionDuration}
            onChange={e => setTransitionDuration(Number(e.target.value))}
            className="rounded border border-gray-300 p-1"
          >
            <option value="250">Fast (250ms)</option>
            <option value="750">Medium (750ms)</option>
            <option value="1500">Slow (1500ms)</option>
          </select>
        </div>
      </div>

      <div className="rounded border border-gray-300 p-4">
        <TemporalAnalysisView
          data={timeData}
          showLabels={showLabels}
          animationConfig={{
            transitionDuration,
            loop: loopAnimation,
            staggerDelay: 20,
            easingFunction: d3.easeLinear,
          }}
        />
      </div>

      <div className="mt-4">
        <h3 className="mb-2 text-lg font-semibold">Data Description</h3>
        <p className="text-gray-700">
          This visualization shows resource trends over the past 6 months. The data represents
          production, consumption, and storage metrics with type-safe animations and transitions.
          The chart demonstrates properly typed D3 time scales, animations, and event handling.
        </p>

        <h3 className="mb-2 mt-4 text-lg font-semibold">Type Safety Features</h3>
        <ul className="list-disc pl-6 text-gray-700">
          <li>Strongly typed data points with TimeDataPoint interface</li>
          <li>Type-safe D3 selections and transitions</li>
          <li>Proper generic typing for D3 scale functions</li>
          <li>Type-safe animation configuration</li>
          <li>React state with proper TypeScript interfaces</li>
        </ul>
      </div>
    </div>
  );
};

export default TemporalAnalysisViewDemo;
