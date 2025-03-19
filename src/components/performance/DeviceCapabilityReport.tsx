/**
 * DeviceCapabilityReport
 *
 * A component that provides detailed segmentation of performance metrics
 * based on device capabilities. Shows performance patterns across different
 * device types, capabilities, and hardware configurations.
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import useSessionPerformance from '../../hooks/performance/useSessionPerformance';

interface DeviceCapabilityData {
  category: string;
  count: number;
  avgFps: number;
  avgLoadTime: number; // in ms
  avgMemoryUsage: number; // in MB
  avgCpuUsage: number; // percentage
  avgResponseTime: number; // in ms
  errorRate: number; // percentage
}

interface DeviceSegmentationData {
  // Device types
  deviceTypes: DeviceCapabilityData[];

  // Memory capabilities
  memoryCapabilities: DeviceCapabilityData[];

  // CPU capabilities
  cpuCapabilities: DeviceCapabilityData[];

  // GPU capabilities
  gpuCapabilities: DeviceCapabilityData[];

  // Screen sizes
  screenSizes: DeviceCapabilityData[];

  // Touch capabilities
  touchCapabilities: DeviceCapabilityData[];

  // Platform data
  platforms: DeviceCapabilityData[];

  // Browser engines
  browserEngines: DeviceCapabilityData[];
}

/**
 * Sample device capability data for demonstration
 */
const SAMPLE_DEVICE_DATA: DeviceSegmentationData = {
  deviceTypes: [
    {
      category: 'Desktop',
      count: 15420,
      avgFps: 58.7,
      avgLoadTime: 980,
      avgMemoryUsage: 92.4,
      avgCpuUsage: 24.3,
      avgResponseTime: 82,
      errorRate: 0.21,
    },
    {
      category: 'Tablet',
      count: 4850,
      avgFps: 53.2,
      avgLoadTime: 1240,
      avgMemoryUsage: 78.2,
      avgCpuUsage: 35.7,
      avgResponseTime: 94,
      errorRate: 0.38,
    },
    {
      category: 'Mobile',
      count: 23760,
      avgFps: 48.9,
      avgLoadTime: 1520,
      avgMemoryUsage: 65.8,
      avgCpuUsage: 42.1,
      avgResponseTime: 120,
      errorRate: 0.62,
    },
  ],

  memoryCapabilities: [
    {
      category: '8GB+',
      count: 12840,
      avgFps: 59.2,
      avgLoadTime: 920,
      avgMemoryUsage: 94.7,
      avgCpuUsage: 23.5,
      avgResponseTime: 80,
      errorRate: 0.18,
    },
    {
      category: '4-8GB',
      count: 18450,
      avgFps: 54.3,
      avgLoadTime: 1150,
      avgMemoryUsage: 82.3,
      avgCpuUsage: 31.2,
      avgResponseTime: 96,
      errorRate: 0.32,
    },
    {
      category: '2-4GB',
      count: 9120,
      avgFps: 47.8,
      avgLoadTime: 1480,
      avgMemoryUsage: 68.5,
      avgCpuUsage: 38.4,
      avgResponseTime: 118,
      errorRate: 0.58,
    },
    {
      category: '<2GB',
      count: 3620,
      avgFps: 38.4,
      avgLoadTime: 1980,
      avgMemoryUsage: 45.2,
      avgCpuUsage: 52.7,
      avgResponseTime: 156,
      errorRate: 1.24,
    },
  ],

  cpuCapabilities: [
    {
      category: 'High-end',
      count: 10240,
      avgFps: 59.4,
      avgLoadTime: 890,
      avgMemoryUsage: 95.2,
      avgCpuUsage: 22.1,
      avgResponseTime: 78,
      errorRate: 0.16,
    },
    {
      category: 'Mid-range',
      count: 22350,
      avgFps: 52.8,
      avgLoadTime: 1280,
      avgMemoryUsage: 79.4,
      avgCpuUsage: 34.6,
      avgResponseTime: 104,
      errorRate: 0.42,
    },
    {
      category: 'Low-end',
      count: 11440,
      avgFps: 42.6,
      avgLoadTime: 1720,
      avgMemoryUsage: 58.7,
      avgCpuUsage: 48.3,
      avgResponseTime: 138,
      errorRate: 0.85,
    },
  ],

  gpuCapabilities: [
    {
      category: 'Dedicated GPU',
      count: 8920,
      avgFps: 59.7,
      avgLoadTime: 870,
      avgMemoryUsage: 96.8,
      avgCpuUsage: 21.4,
      avgResponseTime: 76,
      errorRate: 0.14,
    },
    {
      category: 'Integrated GPU',
      count: 27540,
      avgFps: 51.2,
      avgLoadTime: 1320,
      avgMemoryUsage: 76.3,
      avgCpuUsage: 36.2,
      avgResponseTime: 108,
      errorRate: 0.46,
    },
    {
      category: 'Basic GPU',
      count: 7570,
      avgFps: 39.8,
      avgLoadTime: 1840,
      avgMemoryUsage: 52.4,
      avgCpuUsage: 51.7,
      avgResponseTime: 148,
      errorRate: 0.98,
    },
  ],

  screenSizes: [
    {
      category: 'Large (1440p+)',
      count: 6840,
      avgFps: 57.8,
      avgLoadTime: 1020,
      avgMemoryUsage: 98.5,
      avgCpuUsage: 25.3,
      avgResponseTime: 84,
      errorRate: 0.19,
    },
    {
      category: 'Medium (1080p)',
      count: 19420,
      avgFps: 54.6,
      avgLoadTime: 1180,
      avgMemoryUsage: 85.7,
      avgCpuUsage: 31.8,
      avgResponseTime: 92,
      errorRate: 0.29,
    },
    {
      category: 'Small (720p)',
      count: 12950,
      avgFps: 48.2,
      avgLoadTime: 1420,
      avgMemoryUsage: 72.3,
      avgCpuUsage: 38.4,
      avgResponseTime: 116,
      errorRate: 0.54,
    },
    {
      category: 'Extra Small (<720p)',
      count: 4820,
      avgFps: 41.5,
      avgLoadTime: 1680,
      avgMemoryUsage: 58.1,
      avgCpuUsage: 45.9,
      avgResponseTime: 142,
      errorRate: 0.87,
    },
  ],

  touchCapabilities: [
    {
      category: 'Touch Primary',
      count: 28240,
      avgFps: 47.8,
      avgLoadTime: 1460,
      avgMemoryUsage: 68.4,
      avgCpuUsage: 39.7,
      avgResponseTime: 118,
      errorRate: 0.58,
    },
    {
      category: 'Touch Enabled',
      count: 5620,
      avgFps: 52.4,
      avgLoadTime: 1190,
      avgMemoryUsage: 79.3,
      avgCpuUsage: 32.8,
      avgResponseTime: 97,
      errorRate: 0.36,
    },
    {
      category: 'No Touch',
      count: 10170,
      avgFps: 58.1,
      avgLoadTime: 960,
      avgMemoryUsage: 94.2,
      avgCpuUsage: 24.6,
      avgResponseTime: 83,
      errorRate: 0.22,
    },
  ],

  platforms: [
    {
      category: 'Windows',
      count: 22140,
      avgFps: 55.3,
      avgLoadTime: 1080,
      avgMemoryUsage: 88.9,
      avgCpuUsage: 28.2,
      avgResponseTime: 90,
      errorRate: 0.31,
    },
    {
      category: 'macOS',
      count: 6580,
      avgFps: 57.8,
      avgLoadTime: 970,
      avgMemoryUsage: 91.7,
      avgCpuUsage: 26.5,
      avgResponseTime: 85,
      errorRate: 0.24,
    },
    {
      category: 'iOS',
      count: 9840,
      avgFps: 49.6,
      avgLoadTime: 1340,
      avgMemoryUsage: 68.9,
      avgCpuUsage: 36.8,
      avgResponseTime: 112,
      errorRate: 0.47,
    },
    {
      category: 'Android',
      count: 13920,
      avgFps: 46.2,
      avgLoadTime: 1620,
      avgMemoryUsage: 62.4,
      avgCpuUsage: 42.3,
      avgResponseTime: 124,
      errorRate: 0.73,
    },
    {
      category: 'Linux',
      count: 1550,
      avgFps: 56.7,
      avgLoadTime: 1050,
      avgMemoryUsage: 89.5,
      avgCpuUsage: 27.6,
      avgResponseTime: 88,
      errorRate: 0.28,
    },
  ],

  browserEngines: [
    {
      category: 'Chromium',
      count: 32450,
      avgFps: 53.2,
      avgLoadTime: 1160,
      avgMemoryUsage: 79.5,
      avgCpuUsage: 32.7,
      avgResponseTime: 102,
      errorRate: 0.42,
    },
    {
      category: 'WebKit',
      count: 14270,
      avgFps: 51.4,
      avgLoadTime: 1280,
      avgMemoryUsage: 74.8,
      avgCpuUsage: 34.9,
      avgResponseTime: 108,
      errorRate: 0.49,
    },
    {
      category: 'Gecko',
      count: 7310,
      avgFps: 52.8,
      avgLoadTime: 1190,
      avgMemoryUsage: 77.3,
      avgCpuUsage: 33.6,
      avgResponseTime: 105,
      errorRate: 0.45,
    },
  ],
};

/**
 * A component that displays the performance metrics for a specific device capability
 */
const CapabilityMetricsTable: React.FC<{
  title: string;
  data: DeviceCapabilityData[];
  onCategorySelect: (category: string) => void;
}> = ({ title, data, onCategorySelect }) => {
  return (
    <div className="overflow-x-auto">
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Count
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              FPS
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Load Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Response Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Error Rate
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data?.map(item => (
            <tr key={item?.category} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                {item?.category}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {item?.count.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                <span
                  className={`rounded-full px-2 py-1 text-xs ${getFpsColorClass(item?.avgFps)}`}
                >
                  {item?.avgFps.toFixed(1)}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                <span
                  className={`rounded-full px-2 py-1 text-xs ${getLoadTimeColorClass(item?.avgLoadTime)}`}
                >
                  {item?.avgLoadTime}ms
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                <span
                  className={`rounded-full px-2 py-1 text-xs ${getResponseTimeColorClass(item?.avgResponseTime)}`}
                >
                  {item?.avgResponseTime}ms
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                <span
                  className={`rounded-full px-2 py-1 text-xs ${getErrorRateColorClass(item?.errorRate)}`}
                >
                  {item?.errorRate.toFixed(2)}%
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                <button
                  className="font-medium text-blue-600 hover:text-blue-800"
                  onClick={() => onCategorySelect(item?.category)}
                >
                  Analyze
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Helper functions to get color classes based on performance metrics
 */
const getFpsColorClass = (fps: number): string => {
  if (fps >= 55) return 'bg-green-100 text-green-800';
  if (fps >= 45) return 'bg-yellow-100 text-yellow-800';
  if (fps >= 30) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
};

const getLoadTimeColorClass = (loadTime: number): string => {
  if (loadTime < 1000) return 'bg-green-100 text-green-800';
  if (loadTime < 1500) return 'bg-yellow-100 text-yellow-800';
  if (loadTime < 2000) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
};

const getResponseTimeColorClass = (responseTime: number): string => {
  if (responseTime < 90) return 'bg-green-100 text-green-800';
  if (responseTime < 120) return 'bg-yellow-100 text-yellow-800';
  if (responseTime < 150) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
};

const getErrorRateColorClass = (errorRate: number): string => {
  if (errorRate < 0.3) return 'bg-green-100 text-green-800';
  if (errorRate < 0.5) return 'bg-yellow-100 text-yellow-800';
  if (errorRate < 0.8) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
};

/**
 * Component that displays detailed performance analysis for a selected category
 */
const DetailedCategoryAnalysis: React.FC<{
  categoryName: string;
  segmentType: string;
  onBack: () => void;
}> = ({ categoryName, segmentType, onBack }) => {
  // In a real implementation, this would fetch detailed data for the selected category

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            className="mb-2 flex items-center text-blue-600 hover:text-blue-800"
            onClick={onBack}
          >
            <svg
              className="mr-1 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Overview
          </button>
          <h2 className="text-xl font-bold">
            {categoryName} <span className="text-gray-500">({segmentType})</span>
          </h2>
        </div>
        <div className="flex space-x-2">
          <button className="rounded-md bg-blue-100 px-3 py-1 text-sm text-blue-700">
            Export Report
          </button>
          <button className="rounded-md bg-green-100 px-3 py-1 text-sm text-green-700">
            Optimization Guides
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-3 text-lg font-semibold">Performance Trends</h3>
        <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 p-4">
          <p className="text-gray-500">Performance trend visualization would be displayed here</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-md mb-2 font-semibold">Common Performance Bottlenecks</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <svg
                className="mr-1 mt-0.5 h-5 w-5 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>Resource intensive rendering on lower-end devices</span>
            </li>
            <li className="flex items-start">
              <svg
                className="mr-1 mt-0.5 h-5 w-5 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>High memory consumption during resource processing</span>
            </li>
            <li className="flex items-start">
              <svg
                className="mr-1 mt-0.5 h-5 w-5 text-yellow-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>JavaScript execution delays during complex calculations</span>
            </li>
          </ul>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-md mb-2 font-semibold">Recommended Optimizations</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <svg
                className="mr-1 mt-0.5 h-5 w-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Implement progressive rendering for complex visualizations</span>
            </li>
            <li className="flex items-start">
              <svg
                className="mr-1 mt-0.5 h-5 w-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Reduce JavaScript bundle size with code splitting</span>
            </li>
            <li className="flex items-start">
              <svg
                className="mr-1 mt-0.5 h-5 w-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Optimize image and asset loading based on device capabilities</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="mb-4 text-lg font-semibold">User Experience Impact</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
            <div className="mb-1 text-2xl font-bold text-red-600">+42%</div>
            <div className="text-sm text-gray-500">Bounce Rate</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
            <div className="mb-1 text-2xl font-bold text-amber-600">-28%</div>
            <div className="text-sm text-gray-500">Session Duration</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
            <div className="mb-1 text-2xl font-bold text-red-600">-35%</div>
            <div className="text-sm text-gray-500">Conversion Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * The main DeviceCapabilityReport component
 */
const DeviceCapabilityReport: React.FC = () => {
  const [deviceData, setDeviceData] = useState<DeviceSegmentationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSegmentType, setSelectedSegmentType] = useState<string>('');
  const [activeSegment, setActiveSegment] = useState<string>('deviceTypes');

  // Use the session performance hook for tracking
  const { trackInteraction } = useSessionPerformance('device-capability-report');

  // Load device performance data
  useEffect(() => {
    // Simulate API call
    const loadData = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setDeviceData(SAMPLE_DEVICE_DATA);
      } catch (error) {
        console.error('Failed to load device capability data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle segment selection
  const handleSegmentChange = (segment: string) => {
    setActiveSegment(segment);
    setSelectedCategory(null);
    trackInteraction('click', {
      targetComponent: `segment-select-${segment}`,
      successful: true,
    });
  };

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedSegmentType(getSegmentTitle(activeSegment));
    trackInteraction('click', {
      targetComponent: `category-select-${category}`,
      successful: true,
    });
  };

  // Handle back button click
  const handleBackToOverview = () => {
    setSelectedCategory(null);
    trackInteraction('click', {
      targetComponent: 'back-to-overview',
      successful: true,
    });
  };

  // Helper to get segment title
  const getSegmentTitle = (segment: string): string => {
    switch (segment) {
      case 'deviceTypes':
        return 'Device Types';
      case 'memoryCapabilities':
        return 'Memory Capabilities';
      case 'cpuCapabilities':
        return 'CPU Capabilities';
      case 'gpuCapabilities':
        return 'GPU Capabilities';
      case 'screenSizes':
        return 'Screen Sizes';
      case 'touchCapabilities':
        return 'Touch Capabilities';
      case 'platforms':
        return 'Platforms';
      case 'browserEngines':
        return 'Browser Engines';
      default:
        return segment;
    }
  };

  // Helper to get active data based on segment
  const getActiveData = (): DeviceCapabilityData[] => {
    if (!deviceData) return [];
    return deviceData[activeSegment as keyof DeviceSegmentationData] as DeviceCapabilityData[];
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="mb-4 text-2xl font-bold">Device Capability Segmentation</h1>
        <p className="mb-6 text-gray-600">
          Analyze application performance across different device capabilities and hardware
          configurations. Identify optimization opportunities for specific device segments.
        </p>

        {!selectedCategory && (
          <div className="mb-6 border-l-4 border-blue-500 bg-blue-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0 text-blue-500">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Select a device segment to analyze and click on a specific category for detailed
                  performance insights.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {!selectedCategory ? (
        <>
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex flex-wrap space-x-4">
              {Object.keys(deviceData ?? {}).map(segment => (
                <button
                  key={segment}
                  className={`px-1 pb-2 text-sm font-medium ${
                    activeSegment === segment
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => handleSegmentChange(segment)}
                >
                  {getSegmentTitle(segment)}
                </button>
              ))}
            </nav>
          </div>

          <CapabilityMetricsTable
            title={getSegmentTitle(activeSegment)}
            data={getActiveData()}
            onCategorySelect={handleCategorySelect}
          />
        </>
      ) : (
        <DetailedCategoryAnalysis
          categoryName={selectedCategory}
          segmentType={selectedSegmentType}
          onBack={handleBackToOverview}
        />
      )}
    </div>
  );
};

export default DeviceCapabilityReport;
