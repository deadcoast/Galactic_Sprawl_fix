/**
 * GeographicAnalysisDashboard
 *
 * A dashboard component that displays performance metrics segmented by geographic regions.
 * Shows performance trends, hotspots, and optimizations opportunities across different regions.
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import useSessionPerformance from '../../hooks/performance/useSessionPerformance';
import { errorLoggingService, ErrorSeverity, ErrorType } from '../../services/ErrorLoggingService';

interface RegionPerformanceData {
  region: string;
  sessionCount: number;
  avgFps: number;
  avgLoadTime: number;
  avgMemoryUsage: number;
  errorRate: number;
  interactions: {
    avgResponseTime: number;
    successRate: number;
  };
  networkStats: {
    avgLatency: number;
    connectionTypes: Record<string, number>; // Percentage distribution
  };
  deviceDistribution: {
    desktop: number;
    tablet: number;
    mobile: number;
  };
}

/**
 * Sample performance data for demonstration
 * In a real implementation, this would come from an API endpoint
 */
const SAMPLE_REGION_DATA: RegionPerformanceData[] = [
  {
    region: 'North America',
    sessionCount: 12450,
    avgFps: 58.3,
    avgLoadTime: 1250, // ms
    avgMemoryUsage: 87.2, // MB
    errorRate: 0.22, // %
    interactions: {
      avgResponseTime: 78, // ms
      successRate: 99.7, // %
    },
    networkStats: {
      avgLatency: 68, // ms
      connectionTypes: {
        '4g': 72,
        '3g': 18,
        '2g': 2,
        wifi: 8,
      },
    },
    deviceDistribution: {
      desktop: 64,
      tablet: 12,
      mobile: 24,
    },
  },
  {
    region: 'Europe',
    sessionCount: 9840,
    avgFps: 56.8,
    avgLoadTime: 1320, // ms
    avgMemoryUsage: 91.4, // MB
    errorRate: 0.28, // %
    interactions: {
      avgResponseTime: 82, // ms
      successRate: 99.5, // %
    },
    networkStats: {
      avgLatency: 72, // ms
      connectionTypes: {
        '4g': 68,
        '3g': 21,
        '2g': 3,
        wifi: 8,
      },
    },
    deviceDistribution: {
      desktop: 59,
      tablet: 11,
      mobile: 30,
    },
  },
  {
    region: 'Asia',
    sessionCount: 15630,
    avgFps: 54.2,
    avgLoadTime: 1480, // ms
    avgMemoryUsage: 94.5, // MB
    errorRate: 0.35, // %
    interactions: {
      avgResponseTime: 95, // ms
      successRate: 99.1, // %
    },
    networkStats: {
      avgLatency: 85, // ms
      connectionTypes: {
        '4g': 60,
        '3g': 25,
        '2g': 8,
        wifi: 7,
      },
    },
    deviceDistribution: {
      desktop: 45,
      tablet: 9,
      mobile: 46,
    },
  },
  {
    region: 'South America',
    sessionCount: 7230,
    avgFps: 52.9,
    avgLoadTime: 1620, // ms
    avgMemoryUsage: 92.1, // MB
    errorRate: 0.41, // %
    interactions: {
      avgResponseTime: 103, // ms
      successRate: 98.9, // %
    },
    networkStats: {
      avgLatency: 98, // ms
      connectionTypes: {
        '4g': 54,
        '3g': 28,
        '2g': 12,
        wifi: 6,
      },
    },
    deviceDistribution: {
      desktop: 41,
      tablet: 8,
      mobile: 51,
    },
  },
  {
    region: 'Africa',
    sessionCount: 4120,
    avgFps: 48.5,
    avgLoadTime: 1850, // ms
    avgMemoryUsage: 88.7, // MB
    errorRate: 0.52, // %
    interactions: {
      avgResponseTime: 118, // ms
      successRate: 98.2, // %
    },
    networkStats: {
      avgLatency: 115, // ms
      connectionTypes: {
        '4g': 45,
        '3g': 32,
        '2g': 18,
        wifi: 5,
      },
    },
    deviceDistribution: {
      desktop: 32,
      tablet: 6,
      mobile: 62,
    },
  },
  {
    region: 'Australia/Oceania',
    sessionCount: 3680,
    avgFps: 57.4,
    avgLoadTime: 1380, // ms
    avgMemoryUsage: 90.2, // MB
    errorRate: 0.25, // %
    interactions: {
      avgResponseTime: 84, // ms
      successRate: 99.6, // %
    },
    networkStats: {
      avgLatency: 74, // ms
      connectionTypes: {
        '4g': 70,
        '3g': 19,
        '2g': 1,
        wifi: 10,
      },
    },
    deviceDistribution: {
      desktop: 62,
      tablet: 13,
      mobile: 25,
    },
  },
];

interface PerformanceBarProps {
  value: number;
  maxValue: number;
  label: string;
  color: string;
  unit?: string;
  isGoodWhenLow?: boolean;
}

/**
 * A simple bar component for displaying performance metrics
 */
const PerformanceBar: React.FC<PerformanceBarProps> = ({
  value,
  maxValue,
  label,
  color,
  unit = '',
  isGoodWhenLow = false,
}) => {
  // Calculate percentage with a minimum of 5% for visibility
  const percentage = Math.max(5, (value / maxValue) * 100);

  // Determine color shade based on performance (good or bad)
  const calculateColorShade = () => {
    // When low values are good (e.g., load time), reverse the logic
    const normalizedValue = isGoodWhenLow ? 1 - value / maxValue : value / maxValue;

    if (normalizedValue > 0.8) {
      return 'bg-green-500';
    }
    if (normalizedValue > 0.6) {
      return 'bg-green-400';
    }
    if (normalizedValue > 0.4) {
      return 'bg-yellow-400';
    }
    if (normalizedValue > 0.2) {
      return 'bg-orange-400';
    }
    return 'bg-red-500';
  };

  const barColor = color || calculateColorShade();

  return (
    <div className="mb-2">
      <div className="mb-1 flex justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-medium">
          {value.toFixed(1)}
          {unit}
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-gray-200">
        <div className={`${barColor} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

/**
 * Small donut chart component for displaying distributions
 */
const DistributionDonut: React.FC<{
  data: Record<string, number>;
  title: string;
  colorMap: Record<string, string>;
}> = ({ data, title, colorMap }) => {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  let startPercentage = 0;

  // Create segments for the donut chart
  const segments = Object.entries(data).map(([key, value]) => {
    const percentage = (value / total) * 100;
    const segment = {
      color: colorMap[key] || '#888',
      key,
      value,
      percentage,
      startPercentage,
      endPercentage: startPercentage + percentage,
    };
    startPercentage += percentage;
    return segment;
  });

  return (
    <div className="flex flex-col items-center">
      <h4 className="mb-2 text-sm font-medium">{title}</h4>
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 36 36" className="h-full w-full">
          <circle
            cx="18"
            cy="18"
            r="15.91549430918954"
            fill="transparent"
            stroke="#f3f4f6"
            strokeWidth="1"
          ></circle>
          {segments.map(segment => {
            const startAngle = (segment.startPercentage / 100) * 360;
            const endAngle = (segment.endPercentage / 100) * 360;

            // Calculate SVG arc path
            const x1 = 18 + 15.91549430918954 * Math.cos(((startAngle - 90) * Math.PI) / 180);
            const y1 = 18 + 15.91549430918954 * Math.sin(((startAngle - 90) * Math.PI) / 180);
            const x2 = 18 + 15.91549430918954 * Math.cos(((endAngle - 90) * Math.PI) / 180);
            const y2 = 18 + 15.91549430918954 * Math.sin(((endAngle - 90) * Math.PI) / 180);
            const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

            const pathData = [
              `M ${x1} ${y1}`,
              `A 15.91549430918954 15.91549430918954 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              `L 18 18`,
              `Z`,
            ].join(' ');

            return <path key={segment.key} d={pathData} fill={segment.color} />;
          })}
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {segments.map(segment => (
          <div key={segment.key} className="flex items-center">
            <div className="mr-1 h-3 w-3" style={{ backgroundColor: segment.color }}></div>
            <span className="text-xs">
              {segment.key}: {segment.percentage.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Card component for displaying region-specific performance data
 */
const RegionCard: React.FC<{
  regionData: RegionPerformanceData;
  isSelected: boolean;
  onClick: () => void;
}> = ({ regionData, isSelected, onClick }) => {
  const deviceColorMap = {
    desktop: '#3b82f6', // blue
    tablet: '#8b5cf6', // purple
    mobile: '#ec4899', // pink
  };

  const networkColorMap = {
    '4g': '#10b981', // green
    '3g': '#f59e0b', // amber
    '2g': '#ef4444', // red
    wifi: '#3b82f6', // blue
  };

  return (
    <div
      className={`cursor-pointer rounded-lg border p-4 transition-all ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-200'} `}
      onClick={onClick}
    >
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-lg font-semibold">{regionData.region}</h3>
        <span className="rounded bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          {regionData.sessionCount.toLocaleString()} sessions
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <PerformanceBar
          label="Avg FPS"
          value={regionData.avgFps}
          maxValue={60}
          color="bg-green-500"
        />
        <PerformanceBar
          label="Load Time"
          value={regionData.avgLoadTime}
          maxValue={2000}
          unit="ms"
          color="bg-yellow-500"
          isGoodWhenLow
        />
      </div>

      <div className="mb-4 flex flex-wrap justify-around">
        <DistributionDonut
          data={regionData.deviceDistribution}
          title="Devices"
          colorMap={deviceColorMap}
        />
        <DistributionDonut
          data={regionData.networkStats.connectionTypes}
          title="Network"
          colorMap={networkColorMap}
        />
      </div>

      <div className="mt-2 flex justify-between text-sm">
        <div className="text-center">
          <div className="font-medium">{regionData.interactions.avgResponseTime}ms</div>
          <div className="text-xs text-gray-500">Response Time</div>
        </div>
        <div className="text-center">
          <div className="font-medium">{regionData.errorRate.toFixed(2)}%</div>
          <div className="text-xs text-gray-500">Error Rate</div>
        </div>
        <div className="text-center">
          <div className="font-medium">{regionData.networkStats.avgLatency}ms</div>
          <div className="text-xs text-gray-500">Avg Latency</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Detailed view component for the selected region
 */
const RegionDetailView: React.FC<{
  regionData: RegionPerformanceData;
}> = ({ regionData }) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">{regionData.region} Performance Details</h2>
        <div className="flex space-x-2">
          <button className="rounded-md bg-blue-100 px-3 py-1 text-sm text-blue-700">
            Export Data
          </button>
          <button className="rounded-md bg-green-100 px-3 py-1 text-sm text-green-700">
            Optimization Suggestions
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-8">
        <div>
          <h3 className="mb-4 text-lg font-semibold">Performance Metrics</h3>
          <div className="space-y-4">
            <PerformanceBar
              label="Average FPS"
              value={regionData.avgFps}
              maxValue={60}
              color="bg-green-500"
            />
            <PerformanceBar
              label="Average Load Time"
              value={regionData.avgLoadTime}
              maxValue={2000}
              unit="ms"
              color="bg-yellow-500"
              isGoodWhenLow
            />
            <PerformanceBar
              label="Memory Usage"
              value={regionData.avgMemoryUsage}
              maxValue={150}
              unit="MB"
              color="bg-blue-500"
            />
            <PerformanceBar
              label="Error Rate"
              value={regionData.errorRate}
              maxValue={5}
              unit="%"
              color="bg-red-500"
              isGoodWhenLow
            />
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold">Network Performance</h3>
          <div className="space-y-4">
            <PerformanceBar
              label="Average Latency"
              value={regionData.networkStats.avgLatency}
              maxValue={200}
              unit="ms"
              color="bg-purple-500"
              isGoodWhenLow
            />
            <PerformanceBar
              label="Interaction Response Time"
              value={regionData.interactions.avgResponseTime}
              maxValue={200}
              unit="ms"
              color="bg-indigo-500"
              isGoodWhenLow
            />
            <PerformanceBar
              label="Interaction Success Rate"
              value={regionData.interactions.successRate}
              maxValue={100}
              unit="%"
              color="bg-green-500"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="mb-4 text-lg font-semibold">Optimization Recommendations</h3>
        <div className="space-y-4">
          {regionData.avgLoadTime > 1500 && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
              <h4 className="font-medium">High Load Times</h4>
              <p className="text-sm text-gray-700">
                Consider implementing progressive loading techniques and optimizing resource
                delivery for {regionData.region}.
              </p>
            </div>
          )}

          {Object.entries(regionData.networkStats.connectionTypes)
            .filter(([type, percentage]) => (type === '2g' || type === '3g') && percentage > 15)
            .map(([type, percentage]) => (
              <div key={type} className="rounded-md border border-orange-200 bg-orange-50 p-4">
                <h4 className="font-medium">
                  High {type.toUpperCase()} Usage ({percentage}%)
                </h4>
                <p className="text-sm text-gray-700">
                  Consider implementing low-bandwidth optimizations like image compression and
                  minimal asset loading.
                </p>
              </div>
            ))}

          {regionData.deviceDistribution.mobile > 45 && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
              <h4 className="font-medium">
                High Mobile Usage ({regionData.deviceDistribution.mobile}%)
              </h4>
              <p className="text-sm text-gray-700">
                Optimize touch interactions and responsive layouts for mobile-first experience in{' '}
                {regionData.region}.
              </p>
            </div>
          )}

          {regionData.errorRate > 0.4 && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4">
              <h4 className="font-medium">Elevated Error Rate</h4>
              <p className="text-sm text-gray-700">
                Investigate error patterns and implement better error handling and recovery
                mechanisms.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Main Geographic Analysis Dashboard component
 */
const GeographicAnalysisDashboard: React.FC = () => {
  const [regionData, setRegionData] = useState<RegionPerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<RegionPerformanceData | null>(null);
  const [timeRange, setTimeRange] = useState('7d'); // 24h, 7d, 30d, 90d

  // Use the session performance hook
  const { trackInteraction } = useSessionPerformance('geographic-analysis-dashboard');

  // Load region performance data
  useEffect(() => {
    // Simulate API call
    const loadData = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setRegionData(SAMPLE_REGION_DATA);
        setSelectedRegion(SAMPLE_REGION_DATA[0]);
      } catch (error) {
        errorLoggingService.logError(
          error instanceof Error ? error : new Error('Failed to load region data'),
          ErrorType.NETWORK,
          ErrorSeverity.MEDIUM,
          {
            componentName: 'GeographicAnalysisDashboard',
            action: 'loadData',
            timeRange,
          }
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [timeRange]);

  // Handle region selection
  const handleRegionSelect = (region: RegionPerformanceData) => {
    setSelectedRegion(region);
    trackInteraction('click', {
      targetComponent: `region-card-${region.region}`,
      successful: true,
    });
  };

  // Handle time range change
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    trackInteraction('click', {
      targetComponent: `time-range-${range}`,
      successful: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Geographic Performance Analysis</h1>

        <div className="flex space-x-2">
          <button
            className={`rounded-md px-3 py-1 text-sm ${
              timeRange === '24h' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => handleTimeRangeChange('24h')}
          >
            24 Hours
          </button>
          <button
            className={`rounded-md px-3 py-1 text-sm ${
              timeRange === '7d' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => handleTimeRangeChange('7d')}
          >
            7 Days
          </button>
          <button
            className={`rounded-md px-3 py-1 text-sm ${
              timeRange === '30d' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => handleTimeRangeChange('30d')}
          >
            30 Days
          </button>
          <button
            className={`rounded-md px-3 py-1 text-sm ${
              timeRange === '90d' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => handleTimeRangeChange('90d')}
          >
            90 Days
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="space-y-4">
            {regionData.map(region => (
              <RegionCard
                key={region.region}
                regionData={region}
                isSelected={selectedRegion?.region === region.region}
                onClick={() => handleRegionSelect(region)}
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedRegion && <RegionDetailView regionData={selectedRegion} />}
        </div>
      </div>
    </div>
  );
};

export default GeographicAnalysisDashboard;
