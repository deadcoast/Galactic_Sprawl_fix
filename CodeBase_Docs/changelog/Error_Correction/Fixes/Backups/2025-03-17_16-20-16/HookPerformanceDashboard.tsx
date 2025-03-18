/**
 * @file HookPerformanceDashboard.tsx
 * A React component for visualizing hook performance data.
 *
 * This component provides:
 * 1. Real-time visualization of hook performance metrics
 * 2. Filtering and sorting of performance data
 * 3. Performance optimization recommendations
 */

import * as React from "react";
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import {
  clearAllHooksPerformanceData,
  clearHookPerformanceData,
  getAllHooksPerformanceData,
  getHookPerformanceReport,
  HookPerformanceData,
} from './hookPerformanceMonitor';

interface HookPerformanceDashboardProps {
  /**
   * Whether to auto-refresh the dashboard data
   */
  autoRefresh?: boolean;

  /**
   * Refresh interval in milliseconds
   */
  refreshInterval?: number;

  /**
   * Whether to show the dashboard in a collapsed state initially
   */
  initiallyCollapsed?: boolean;

  /**
   * Whether to show detailed data for each hook
   */
  showDetails?: boolean;

  /**
   * Filter hooks by name
   */
  filterByHook?: string;
}

// Type for the sort options
type SortOption = 'name' | 'renders' | 'selectors' | 'computations';

/**
 * Hook Performance Dashboard component
 */
const HookPerformanceDashboard: React.FC<HookPerformanceDashboardProps> = ({
  autoRefresh = true,
  refreshInterval = 1000,
  initiallyCollapsed = true,
  showDetails = false,
  filterByHook,
}) => {
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);
  const [performanceData, setPerformanceData] = useState<Record<string, HookPerformanceData>>({});
  const [selectedHook, setSelectedHook] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('renders');
  const [filterText, setFilterText] = useState(filterByHook || '');
  const [showOnlySlowHooks, setShowOnlySlowHooks] = useState(false);

  // Refresh performance data
  useEffect(() => {
    const refreshData = () => {
      setPerformanceData(getAllHooksPerformanceData());
    };

    // Initial refresh
    refreshData();

    // Auto-refresh if enabled
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(refreshData, refreshInterval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh, refreshInterval]);

  // Calculate derived data
  const filteredAndSortedHooks = useMemo(() => {
    // Convert to array for filtering and sorting
    let hooks = Object.entries(performanceData).map(([hookName, data]) => ({
      hookName,
      renderCount: data.renderCount,
      selectorCount: Object.keys(data.selectorTimes).length,
      computationCount: Object.keys(data.computationTimes).length,
      avgSelectorTime: calculateAverageTime(data.selectorTimes),
      avgComputationTime: calculateAverageTime(data.computationTimes),
      data,
    }));

    // Filter by name if filterText is provided
    if (filterText) {
      hooks = hooks.filter(hook => hook.hookName.toLowerCase().includes(filterText.toLowerCase()));
    }

    // Filter slow hooks if showOnlySlowHooks is true
    if (showOnlySlowHooks) {
      hooks = hooks.filter(hook => hook.avgSelectorTime > 2 || hook.avgComputationTime > 5);
    }

    // Sort hooks
    switch (sortBy) {
      case 'name':
        hooks.sort((a, b) => a.hookName.localeCompare(b.hookName));
        break;
      case 'renders':
        hooks.sort((a, b) => b.renderCount - a.renderCount);
        break;
      case 'selectors':
        hooks.sort((a, b) => b.avgSelectorTime - a.avgSelectorTime);
        break;
      case 'computations':
        hooks.sort((a, b) => b.avgComputationTime - a.avgComputationTime);
        break;
    }

    return hooks;
  }, [performanceData, sortBy, filterText, showOnlySlowHooks]);

  // Get selected hook report
  const selectedHookReport = useMemo(() => {
    if (!selectedHook) return null;
    return getHookPerformanceReport(selectedHook);
  }, [selectedHook]);

  // Calculate average time from a record of arrays
  function calculateAverageTime(timeRecord: Record<string, number[]>): number {
    const allTimes = Object.values(timeRecord).flat();
    if (allTimes.length === 0) return 0;
    return allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length;
  }

  // Handle sort option change
  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortOption);
  };

  // Clear all performance data
  const handleClearAll = () => {
    clearAllHooksPerformanceData();
    setPerformanceData({});
    setSelectedHook(null);
  };

  // Clear selected hook performance data
  const handleClearSelected = () => {
    if (selectedHook) {
      clearHookPerformanceData(selectedHook);
      setPerformanceData(prevData => {
        const newData = { ...prevData };
        delete newData[selectedHook];
        return newData;
      });
      setSelectedHook(null);
    }
  };

  // If collapsed, only show the header
  if (collapsed) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 9999,
          cursor: 'pointer',
        }}
        onClick={() => setCollapsed(false)}
      >
        <h3 style={{ margin: 0 }}>
          📊 Hook Performance Monitor ({Object.keys(performanceData).length} hooks)
        </h3>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        width: '600px',
        maxHeight: '80vh',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '5px',
        zIndex: 9999,
        overflowY: 'auto',
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
        }}
      >
        <h3 style={{ margin: 0 }}>
          📊 Hook Performance Monitor ({filteredAndSortedHooks.length} hooks)
        </h3>
        <div>
          <button
            onClick={handleClearAll}
            style={{
              marginRight: '5px',
              padding: '5px',
              backgroundColor: '#d9534f',
              border: 'none',
              borderRadius: '3px',
              color: 'white',
            }}
          >
            Clear All
          </button>
          <button
            onClick={() => setCollapsed(true)}
            style={{
              padding: '5px',
              backgroundColor: '#5bc0de',
              border: 'none',
              borderRadius: '3px',
              color: 'white',
            }}
          >
            Minimize
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Filter hooks..."
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          style={{ padding: '5px', flex: 1 }}
        />

        <select value={sortBy} onChange={handleSortChange} style={{ padding: '5px' }}>
          <option value="name">Sort by Name</option>
          <option value="renders">Sort by Renders</option>
          <option value="selectors">Sort by Selector Time</option>
          <option value="computations">Sort by Computation Time</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={showOnlySlowHooks}
            onChange={e => setShowOnlySlowHooks(e.target.checked)}
          />
          Slow Hooks Only
        </label>
      </div>

      <div
        style={{
          marginBottom: '15px',
          maxHeight: '200px',
          overflowY: 'auto',
          border: '1px solid #444',
          borderRadius: '3px',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#333', position: 'sticky', top: 0 }}>
              <th style={{ padding: '8px', textAlign: 'left' }}>Hook</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>Renders</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>Selector Avg (ms)</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>Compute Avg (ms)</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedHooks.map(hook => (
              <tr
                key={hook.hookName}
                style={{
                  backgroundColor: selectedHook === hook.hookName ? '#1e5f74' : 'transparent',
                  cursor: 'pointer',
                  borderBottom: '1px solid #444',
                }}
                onClick={() => setSelectedHook(hook.hookName)}
              >
                <td style={{ padding: '8px' }}>{hook.hookName}</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>{hook.renderCount}</td>
                <td
                  style={{
                    padding: '8px',
                    textAlign: 'right',
                    color: hook.avgSelectorTime > 2 ? '#ff6b6b' : 'inherit',
                  }}
                >
                  {hook.avgSelectorTime.toFixed(2)}
                </td>
                <td
                  style={{
                    padding: '8px',
                    textAlign: 'right',
                    color: hook.avgComputationTime > 5 ? '#ff6b6b' : 'inherit',
                  }}
                >
                  {hook.avgComputationTime.toFixed(2)}
                </td>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      clearHookPerformanceData(hook.hookName);
                      setPerformanceData(prevData => {
                        const newData = { ...prevData };
                        delete newData[hook.hookName];
                        return newData;
                      });
                      if (selectedHook === hook.hookName) {
                        setSelectedHook(null);
                      }
                    }}
                    style={{
                      padding: '2px 5px',
                      backgroundColor: 'transparent',
                      border: '1px solid #999',
                      borderRadius: '3px',
                      color: 'white',
                    }}
                  >
                    Clear
                  </button>
                </td>
              </tr>
            ))}
            {filteredAndSortedHooks.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>
                  No performance data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedHook && (
        <div style={{ borderTop: '1px solid #444', paddingTop: '10px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <h4 style={{ margin: 0 }}>Hook Details: {selectedHook}</h4>
            <button
              onClick={handleClearSelected}
              style={{
                padding: '5px',
                backgroundColor: '#f0ad4e',
                border: 'none',
                borderRadius: '3px',
                color: 'white',
              }}
            >
              Clear Selected
            </button>
          </div>

          <pre
            style={{
              maxHeight: '200px',
              overflowY: 'auto',
              backgroundColor: '#222',
              padding: '10px',
              borderRadius: '3px',
              margin: 0,
              fontSize: '12px',
            }}
          >
            {selectedHookReport}
          </pre>
        </div>
      )}

      <div
        style={{
          marginTop: '15px',
          borderTop: '1px solid #444',
          paddingTop: '10px',
          fontSize: '12px',
        }}
      >
        <p>
          <strong>Performance Tips:</strong>
          <br />
          • Slow selectors (&gt;2ms) may indicate inefficient state access
          <br />
          • Slow computations (&gt;5ms) may be causing render delays
          <br />• High render counts may indicate missing dependency arrays in useEffect/useMemo
        </p>
      </div>
    </div>
  );
};

export default HookPerformanceDashboard;
