import {
  CategoryScale,
  Chart as ChartJS,
  ChartOptions,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { useResourceRate } from '../../../contexts/ResourceRatesContext';
import { useThreshold } from '../../../contexts/ThresholdContext';
import { useComponentLifecycle } from '../../../hooks/ui/useComponentLifecycle';
import { useComponentRegistration } from '../../../hooks/ui/useComponentRegistration';
import { ResourceType } from '../../../types/resources/ResourceTypes';
import { ResourceTypeHelpers } from '../../../types/resources/StandardizedResourceTypes';
import './ResourceForecastingVisualization.css';

// Register the Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface ResourceForecastingVisualizationProps {
  resourceType: ResourceType;
  currentValue: number;
  maxValue: number;
  rate: number;
  cycleTime: number;
  forecastPeriod?: number; // in minutes
  dataPoints?: number;
  thresholds?: {
    critical?: number;
    low?: number;
    target?: number;
    high?: number;
    maximum?: number;
  };
}

interface ForecastPoint {
  time: string;
  value: number;
  status: 'critical' | 'low' | 'normal' | 'high' | 'maximum';
}

// Add helper function to get resource name
const getResourceName = (resourceType: ResourceType): string => {
  return ResourceTypeHelpers.getDisplayName(resourceType);
};

/**
 * Component that visualizes forecasted resource levels based on current rates
 * and consumption patterns.
 */
const ResourceForecastingVisualization: React.FC<ResourceForecastingVisualizationProps> = ({
  resourceType,
  currentValue,
  maxValue,
  rate,
  cycleTime,
  forecastPeriod = 60, // Default to 60 minutes
  dataPoints = 12, // Default to 12 data points
  thresholds,
}) => {
  // Calculate rate per minute for easier forecasting
  const _ratePerMinute = rate * (60000 / cycleTime);

  // Register component
  const _componentId = useComponentRegistration({
    type: ResourceType.MINERALS,
    eventSubscriptions: ['RESOURCE_UPDATED', 'RESOURCE_THRESHOLD_CHANGED', 'RESOURCE_FLOW_UPDATED'],
    updatePriority: 'low', // Forecasting is less critical than actual resource displays
  });

  // Initialize with current state
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [_criticalPoint, _setCriticalPoint] = useState<number | null>(null);
  const _resourceRates = useResourceRate(resourceType);
  const { state: _thresholdState } = useThreshold();

  // Component lifecycle tracking for performance monitoring
  useComponentLifecycle({
    onMount: () => {
      console.warn('ResourceForecastingVisualization mounted');
    },
    onUnmount: () => {
      console.warn('ResourceForecastingVisualization unmounted');
    },
  });

  // Generate forecast data points
  useEffect(() => {
    const generateForecast = () => {
      const interval = forecastPeriod / dataPoints; // minutes per data point
      const points: ForecastPoint[] = [];
      let projectedValue = currentValue;
      const projectedRate = rate; // Current rate of change

      // Add current value as first point
      points.push({
        time: 'Now',
        value: projectedValue,
        status: getResourceStatus(projectedValue, maxValue, thresholds),
      });

      // Generate future data points
      for (let i = 1; i <= dataPoints; i++) {
        const timePoint = `+${Math.round(i * interval)}m`;

        // Calculate projected value based on current rate
        // We assume rate is units per minute, so we multiply by interval
        projectedValue += projectedRate * interval;

        // Enforce min/max bounds
        projectedValue = Math.max(0, Math.min(projectedValue, maxValue));

        points.push({
          time: timePoint,
          value: projectedValue,
          status: getResourceStatus(projectedValue, maxValue, thresholds),
        });
      }

      return points;
    };

    setForecast(generateForecast());
  }, [currentValue, rate, maxValue, forecastPeriod, dataPoints, thresholds, cycleTime]);

  // Calculate when critical thresholds will be reached (if applicable)
  const criticalEvents = useMemo(() => {
    if (rate === 0) return null;

    const events = [];
    const resourceThresholds = thresholds || {
      critical: 0.1,
      low: 0.25,
      target: 0.5,
      high: 0.75,
      maximum: 0.95,
    };

    // Check if we'll deplete resources
    if (rate < 0) {
      const timeToEmpty = currentValue / Math.abs(rate);
      if (timeToEmpty < forecastPeriod) {
        events.push({
          type: 'depletion',
          time: formatTime(timeToEmpty),
          label: `Resource depleted in ${formatTime(timeToEmpty)}`,
          severity: 'critical',
        });
      }

      // Check when we'll hit critical threshold
      if (resourceThresholds.critical) {
        const criticalValue = maxValue * resourceThresholds.critical;
        if (currentValue > criticalValue) {
          const timeToCritical = (currentValue - criticalValue) / Math.abs(rate);
          if (timeToCritical < forecastPeriod) {
            events.push({
              type: 'critical',
              time: formatTime(timeToCritical),
              label: `Critical level in ${formatTime(timeToCritical)}`,
              severity: 'high',
            });
          }
        }
      }
    }

    // Check if we'll overflow resources
    if (rate > 0) {
      const timeToFull = (maxValue - currentValue) / rate;
      if (timeToFull < forecastPeriod) {
        events.push({
          type: 'overflow',
          time: formatTime(timeToFull),
          label: `Storage full in ${formatTime(timeToFull)}`,
          severity: 'medium',
        });
      }
    }

    return events;
  }, [currentValue, rate, maxValue, forecastPeriod, thresholds]);

  // Chart data and options
  const chartData = {
    labels: forecast.map(point => point.time),
    datasets: [
      {
        label: `${getResourceName(resourceType)} Forecast`,
        data: forecast.map(point => point.value),
        borderColor: getLineColor(forecast),
        backgroundColor: getBackgroundColor(forecast),
        tension: 0.3,
        pointBackgroundColor: forecast.map(point => getPointColor(point.status)),
        pointRadius: 4,
        borderWidth: 2,
        fill: true,
      },
      // Add threshold lines if available
      ...(thresholds?.critical
        ? [
            {
              label: 'Critical Threshold',
              data: Array(forecast.length).fill(maxValue * (thresholds.critical ?? 0.1)),
              borderColor: 'rgba(255, 0, 0, 0.7)',
              backgroundColor: 'transparent',
              borderDash: [5, 5],
              borderWidth: 1,
              pointRadius: 0,
              fill: false,
            },
          ]
        : []),
      ...(thresholds?.low
        ? [
            {
              label: 'Low Threshold',
              data: Array(forecast.length).fill(maxValue * (thresholds.low ?? 0.25)),
              borderColor: 'rgba(255, 165, 0, 0.7)',
              backgroundColor: 'transparent',
              borderDash: [5, 5],
              borderWidth: 1,
              pointRadius: 0,
              fill: false,
            },
          ]
        : []),
      ...(thresholds?.high
        ? [
            {
              label: 'High Threshold',
              data: Array(forecast.length).fill(maxValue * (thresholds.high ?? 0.75)),
              borderColor: 'rgba(0, 128, 0, 0.7)',
              backgroundColor: 'transparent',
              borderDash: [5, 5],
              borderWidth: 1,
              pointRadius: 0,
              fill: false,
            },
          ]
        : []),
    ],
  };

  // Chart options
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: maxValue * 1.1, // Add 10% buffer at top
        title: {
          display: true,
          text: `${getResourceName(resourceType)} Units`,
        },
      },
      x: {
        title: {
          display: true,
          text: 'Time',
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context: { dataset: { label?: string }; parsed: { y?: number } }) {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            const percentage = ((value / maxValue) * 100).toFixed(1);
            return `${label}: ${value.toFixed(1)} (${percentage}%)`;
          },
        },
      },
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${getResourceName(resourceType)} Forecast (${rate > 0 ? '+' : ''}${rate.toFixed(2)}/min)`,
      },
    },
  };

  return (
    <div className="resource-forecasting-visualization">
      <div className="forecast-chart-container">
        <Line data={chartData} options={chartOptions} />
      </div>

      {criticalEvents && criticalEvents.length > 0 && (
        <div className="forecast-critical-events">
          <h4>Important Events:</h4>
          <ul>
            {criticalEvents.map((event, index) => (
              <li key={index} className={`event-${event.severity}`}>
                {event.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="forecast-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: 'rgba(255, 0, 0, 0.7)' }}></span>
          <span>Critical</span>
        </div>
        <div className="legend-item">
          <span
            className="legend-color"
            style={{ backgroundColor: 'rgba(255, 165, 0, 0.7)' }}
          ></span>
          <span>Low</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: 'rgba(0, 128, 0, 0.7)' }}></span>
          <span>Normal</span>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getResourceStatus = (
  value: number,
  maxValue: number,
  thresholds?: ResourceForecastingVisualizationProps['thresholds']
): 'critical' | 'low' | 'normal' | 'high' | 'maximum' => {
  // Default thresholds if not provided
  const defaultThresholds = {
    critical: 0.1,
    low: 0.25,
    target: 0.5,
    high: 0.75,
    maximum: 0.95,
  };

  const { critical, low, high, maximum } = { ...defaultThresholds, ...thresholds };
  const percentage = value / maxValue;

  if (percentage <= critical) return 'critical';
  if (percentage <= low) return 'low';
  if (percentage >= maximum) return 'maximum';
  if (percentage >= high) return 'high';
  return 'normal';
};

const getPointColor = (status: string): string => {
  switch (status) {
    case 'critical':
      return 'rgba(255, 0, 0, 1)';
    case 'low':
      return 'rgba(255, 165, 0, 1)';
    case 'high':
      return 'rgba(255, 255, 0, 1)';
    case 'maximum':
      return 'rgba(255, 0, 255, 1)';
    case 'normal':
    default:
      return 'rgba(0, 128, 0, 1)';
  }
};

const getLineColor = (forecast: ForecastPoint[]): string => {
  // Determine line color based on overall forecast trend
  const lastPoint = forecast[forecast.length - 1];
  switch (lastPoint?.status) {
    case 'critical':
      return 'rgba(255, 0, 0, 1)';
    case 'low':
      return 'rgba(255, 165, 0, 1)';
    case 'high':
      return 'rgba(255, 255, 0, 1)';
    case 'maximum':
      return 'rgba(255, 0, 255, 1)';
    case 'normal':
    default:
      return 'rgba(0, 128, 0, 1)';
  }
};

const getBackgroundColor = (forecast: ForecastPoint[]): string => {
  // Determine background color based on overall forecast trend
  const lastPoint = forecast[forecast.length - 1];
  switch (lastPoint?.status) {
    case 'critical':
      return 'rgba(255, 0, 0, 0.1)';
    case 'low':
      return 'rgba(255, 165, 0, 0.1)';
    case 'high':
      return 'rgba(255, 255, 0, 0.1)';
    case 'maximum':
      return 'rgba(255, 0, 255, 0.1)';
    case 'normal':
    default:
      return 'rgba(0, 128, 0, 0.1)';
  }
};

const formatTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  }
};

export default ResourceForecastingVisualization;
