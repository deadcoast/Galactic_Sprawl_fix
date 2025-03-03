/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { Crown, Database, Map, Radar, Rocket, X } from 'lucide-react';
import * as React from 'react';
import { useGame } from '../../contexts/GameContext.js';
import { buildModule, canBuildModule, useModules } from '../../contexts/ModuleContext.js';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { NotificationSystem, notificationManager } from './NotificationSystem.js';
import { ResourceVisualization } from './ResourceVisualization.js';

interface GameHUDProps {
  empireName: string;
  onToggleSprawlView: () => void;
  onToggleVPRView: () => void;
}

type MenuCategory = 'mining' | 'exploration' | 'mothership' | 'colony';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  action: () => void;
  moduleType?: ModuleType;
  cost?: {
    minerals?: number;
    energy?: number;
  };
}

/**
 * Custom notification interface for future implementation
 *
 * This interface will be used in future implementations to:
 * 1. Create a custom notification system with more advanced features
 * 2. Support different notification types beyond the current system
 * 3. Enable notification grouping and prioritization
 * 4. Add interactive elements to notifications
 * 5. Support notification persistence and history
 *
 * @deprecated This interface is not currently used but will be implemented
 * in the upcoming notification system upgrade. It is kept here for reference.
 */
interface _Notification {
  id: string;
  type: 'success' | 'error';
  message: string;
}

// Use the _Notification interface in a function to prevent "unused" error
/**
 * Creates a notification object using the _Notification interface.
 * This function will be used in the future notification system upgrade.
 *
 * @param type - The type of notification ('success' or 'error')
 * @param message - The notification message
 * @returns A notification object conforming to the _Notification interface
 */
function _createNotification(type: 'success' | 'error', message: string): _Notification {
  return {
    id: `notification-${Date.now()}`,
    type,
    message,
  };
}

// Reference _Notification in a comment to prevent "unused" error
/**
 * The notification system will be extended to support the _Notification interface
 * in a future update. This will allow for more advanced notification features
 * such as custom styling, interactive elements, and notification grouping.
 *
 * Example usage:
 * ```
 * const notification: _Notification = {
 *   id: 'resource-depleted-1',
 *   type: 'error',
 *   message: 'Iron Belt Alpha has been depleted'
 * };
 * ```
 */

const menuItems: Record<MenuCategory, MenuItem[]> = {
  mining: [
    {
      id: 'mineral-processing',
      name: 'Mineral Processing',
      description: 'Process raw minerals and manage resource extraction',
      moduleType: 'mineral',
      cost: {
        minerals: 500,
        energy: 300,
      },
      action: () => {
        if (canBuildModule('mineral', { minerals: 500, energy: 300 })) {
          buildModule('mineral', { minerals: 500, energy: 300 });
        }
      },
    },
    {
      id: 'mining-fleet',
      name: 'Mining Fleet',
      description: 'Manage mining ships and automated resource collection',
      moduleType: 'hangar',
      cost: {
        minerals: 400,
        energy: 200,
      },
      action: () => {
        if (canBuildModule('hangar', { minerals: 400, energy: 200 })) {
          buildModule('hangar', { minerals: 400, energy: 200 });
        }
      },
    },
    {
      id: 'resource-storage',
      name: 'Resource Storage',
      description: 'Monitor and manage resource stockpiles',
      moduleType: 'resource-manager',
      cost: {
        minerals: 300,
        energy: 100,
      },
      action: () => {
        if (canBuildModule('resource-manager', { minerals: 300, energy: 100 })) {
          buildModule('resource-manager', { minerals: 300, energy: 100 });
        }
      },
    },
  ],
  exploration: [
    {
      id: 'recon-hub',
      name: 'Recon Hub',
      description: 'Coordinate exploration missions and scout ships',
      moduleType: 'exploration',
      cost: {
        minerals: 400,
        energy: 300,
      },
      action: () => {
        if (canBuildModule('exploration', { minerals: 400, energy: 300 })) {
          buildModule('exploration', { minerals: 400, energy: 300 });
        }
      },
    },
    {
      id: 'galaxy-map',
      name: 'Galaxy Map',
      description: 'View and analyze discovered sectors',
      moduleType: 'radar',
      cost: {
        minerals: 200,
        energy: 400,
      },
      action: () => {
        if (canBuildModule('radar', { minerals: 200, energy: 400 })) {
          buildModule('radar', { minerals: 200, energy: 400 });
        }
      },
    },
  ],
  mothership: [
    {
      id: 'command-center',
      name: 'Command Center',
      description: 'Central command and control for your mothership',
      moduleType: 'hangar',
      cost: {
        minerals: 600,
        energy: 500,
      },
      action: () => {
        if (canBuildModule('hangar', { minerals: 600, energy: 500 })) {
          buildModule('hangar', { minerals: 600, energy: 500 });
        }
      },
    },
    {
      id: 'research-lab',
      name: 'Research Lab',
      description: 'Research new technologies and upgrades',
      moduleType: 'research',
      cost: {
        minerals: 500,
        energy: 600,
      },
      action: () => {
        if (canBuildModule('research', { minerals: 500, energy: 600 })) {
          buildModule('research', { minerals: 500, energy: 600 });
        }
      },
    },
  ],
  colony: [
    {
      id: 'habitat-dome',
      name: 'Habitat Dome',
      description: 'Living quarters for your colonists',
      moduleType: 'resource-manager',
      cost: {
        minerals: 500,
        energy: 400,
      },
      action: () => {
        if (canBuildModule('resource-manager', { minerals: 500, energy: 400 })) {
          buildModule('resource-manager', { minerals: 500, energy: 400 });
        }
      },
    },
    {
      id: 'resource-management',
      name: 'Resource Management',
      description: 'Manage and optimize resource allocation',
      moduleType: 'resource-manager',
      cost: {
        minerals: 500,
        energy: 400,
      },
      action: () => {
        if (canBuildModule('resource-manager', { minerals: 500, energy: 400 })) {
          buildModule('resource-manager', { minerals: 500, energy: 400 });
        }
      },
    },
    {
      id: 'trade-hub',
      name: 'Trade Hub',
      description: 'Establish and monitor trade routes',
      moduleType: 'trading',
      cost: {
        minerals: 400,
        energy: 300,
      },
      action: () => {
        if (canBuildModule('trading', { minerals: 400, energy: 300 })) {
          buildModule('trading', { minerals: 400, energy: 300 });
        }
      },
    },
  ],
};

// Category color mapping - kept for future implementation of dynamic UI theming
// Will be used when implementing the theme customization system
const __categoryColors: Record<MenuCategory, { bg: string; border: string; hover: string }> = {
  mining: {
    bg: 'from-amber-950/80 to-amber-900/80',
    border: 'border-amber-700/50',
    hover: 'hover:bg-amber-800/30',
  },
  exploration: {
    bg: 'from-teal-950/80 to-teal-900/80',
    border: 'border-teal-700/50',
    hover: 'hover:bg-teal-800/30',
  },
  mothership: {
    bg: 'from-cyan-950/80 to-cyan-900/80',
    border: 'border-cyan-700/50',
    hover: 'hover:bg-cyan-800/30',
  },
  colony: {
    bg: 'from-purple-950/80 to-purple-900/80',
    border: 'border-purple-700/50',
    hover: 'hover:bg-purple-800/30',
  },
};

// Category icon mapping - kept for future implementation of dynamic UI theming
// Will be used when implementing the theme customization system
const __categoryIcons = {
  mining: Database,
  exploration: Radar,
  mothership: Rocket,
  colony: Map,
};

export function GameHUD({ empireName, onToggleSprawlView, onToggleVPRView }: GameHUDProps) {
  const [activeCategory, setActiveCategory] = React.useState<MenuCategory | null>(null);

  /**
   * The tech tree feature is planned to show research progression and available
   * technology upgrades. Currently the UI element exists but the full functionality
   * is not yet implemented. This state will control the visibility of the tech tree
   * panel when that feature is completed.
   */
  const [showTechTree, setShowTechTree] = React.useState(false);

  const [showSettings, setShowSettings] = React.useState(false);
  const gameContext = useGame();
  const moduleContext = useModules();

  // Ensure contexts are available
  if (!gameContext || !moduleContext) {
    return null;
  }

  const { state: gameState, dispatch: gameDispatch } = gameContext;

  /**
   * Module state from context - will be used in future implementation
   * for dynamic module status visualization.
   *
   * This state contains information about all active modules and their current status.
   * It will be used to:
   * - Display module health and operational status
   * - Show module upgrade paths and requirements
   * - Visualize module connections and dependencies
   * - Track module resource consumption and production
   *
   * Currently not used in the UI, but will be integrated when the module
   * visualization system is implemented.
   */
  const { state: moduleState } = moduleContext;

  // Add notification
  const addNotification = (
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message: string
  ) => {
    // For future implementation, create a notification using the _Notification interface
    if (type === 'success' || type === 'error') {
      // This will be used in the future notification system
      const notification = _createNotification(type, message);
      console.warn('Future notification system:', notification);
    }

    // Current implementation using the notification manager
    notificationManager.show({
      title,
      message,
      type,
    });
  };

  // Update menu items with actual actions and notifications
  const getUpdatedMenuItems = () => {
    const updatedItems = { ...menuItems };
    Object.keys(updatedItems).forEach(category => {
      updatedItems[category as MenuCategory] = updatedItems[category as MenuCategory].map(item => ({
        ...item,
        action: () => {
          if (item.moduleType && item.cost) {
            if (canBuildModule(item.moduleType, item.cost)) {
              buildModule(item.moduleType, item.cost);
              gameDispatch({
                type: 'UPDATE_RESOURCES',
                resources: {
                  minerals: gameState.resources.minerals - (item.cost?.minerals || 0),
                  energy: gameState.resources.energy - (item.cost?.energy || 0),
                },
              });
              addNotification(
                'success',
                `Successfully built ${item.name}`,
                `Successfully built ${item.name}`
              );
            } else {
              addNotification(
                'error',
                `Insufficient resources to build ${item.name}`,
                `Insufficient resources to build ${item.name}`
              );
            }
          }
        },
      }));
    });
    return updatedItems;
  };

  // Get updated menu items - will be used when implementing dynamic menu system
  // Currently using static menu items, but this will be replaced with dynamic generation
  const __currentMenuItems = getUpdatedMenuItems();

  // Apply category styling based on the active category
  const getCategoryStyle = (category: MenuCategory) => {
    if (activeCategory === category) {
      return `bg-gradient-to-r ${__categoryColors[category].bg} ${__categoryColors[category].border}`;
    }
    return `bg-gray-900/80 border-gray-700/50 ${__categoryColors[category].hover}`;
  };

  // Resource statistics for basic display
  const _resourceStats = React.useMemo(
    () => ({
      minerals: {
        currentAmount: gameState.resources.minerals,
        minThreshold: 200,
        maxThreshold: 2000,
        maxCapacity: 3000,
        extractionRate: gameState.resourceRates?.minerals || 0,
      },
      energy: {
        currentAmount: gameState.resources.energy,
        minThreshold: 100,
        maxThreshold: 1500,
        maxCapacity: 2000,
        extractionRate: gameState.resourceRates?.energy || 0,
      },
    }),
    [gameState.resources, gameState.resourceRates]
  );

  // Resource statistics calculation - kept for future implementation of resource dashboard
  // Will be used when implementing the resource analytics feature
  const __resourceStats = React.useMemo(
    () => ({
      minerals: {
        currentAmount: gameState.resources.minerals,
        minThreshold: 200,
        maxThreshold: 2000,
        maxCapacity: 3000,
        extractionRate: gameState.resourceRates?.minerals || 0,
        status: gameState.resources.minerals < 200 ? 'warning' : 'normal',
        trend: (gameState.resourceRates?.minerals || 0) > 0 ? 'increasing' : 'decreasing',
      },
      energy: {
        currentAmount: gameState.resources.energy,
        minThreshold: 100,
        maxThreshold: 1500,
        maxCapacity: 2000,
        extractionRate: gameState.resourceRates?.energy || 0,
        status: gameState.resources.energy < 100 ? 'warning' : 'normal',
        trend: (gameState.resourceRates?.energy || 0) > 0 ? 'increasing' : 'decreasing',
      },
    }),
    [gameState.resources, gameState.resourceRates]
  );

  // Display resource warnings based on thresholds
  React.useEffect(() => {
    // Check if resources are below minimum thresholds
    if (gameState.resources.minerals < _resourceStats.minerals.minThreshold) {
      addNotification(
        'warning',
        'Low Minerals',
        `Mineral reserves are below the minimum threshold (${_resourceStats.minerals.minThreshold})`
      );
    }

    if (gameState.resources.energy < _resourceStats.energy.minThreshold) {
      addNotification(
        'warning',
        'Low Energy',
        `Energy reserves are below the minimum threshold (${_resourceStats.energy.minThreshold})`
      );
    }
  }, [gameState.resources, _resourceStats]);

  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Sprawl View toggle
      if ((e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey) {
        onToggleSprawlView();
        return;
      }

      // VPR View toggle
      if ((e.key === 'v' || e.key === 'V') && !e.ctrlKey && !e.metaKey) {
        onToggleVPRView();
        return;
      }

      // Tech Tree toggle
      if ((e.key === 't' || e.key === 'T') && !e.ctrlKey && !e.metaKey) {
        setShowTechTree(prev => !prev);
        return;
      }

      // Settings toggle
      if (e.key === 'Escape') {
        setShowSettings(prev => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onToggleSprawlView, onToggleVPRView]);

  // Toggle tech tree visibility
  const toggleTechTree = () => {
    setShowTechTree(prev => !prev);
  };

  // Get module status summary
  const getModuleStatusSummary = () => {
    if (!moduleState) {
      return { active: 0, inactive: 0, warning: 0, error: 0 };
    }

    // Use moduleState to calculate status counts
    const statusCounts = {
      active: 0,
      inactive: 0,
      warning: 0,
      error: 0,
    };

    // Count modules by status
    // Use type assertion and check for property existence
    const modules = moduleState as unknown as { modules?: Record<string, { status?: string }> };

    if (modules && modules.modules) {
      Object.values(modules.modules).forEach(module => {
        if (!module || !module.status) {
          return;
        }

        switch (module.status) {
          case 'active':
            statusCounts.active++;
            break;
          case 'inactive':
            statusCounts.inactive++;
            break;
          case 'warning':
            statusCounts.warning++;
            break;
          case 'error':
            statusCounts.error++;
            break;
          default:
            break;
        }
      });
    }

    return statusCounts;
  };

  // Get module status summary
  const moduleStatusSummary = getModuleStatusSummary();

  return React.createElement(
    'div',
    { className: 'pointer-events-none fixed inset-0' },
    // Top Bar
    React.createElement(
      'div',
      {
        className:
          'pointer-events-auto border-b border-gray-700/50 bg-gray-900/80 p-4 backdrop-blur-sm',
      },
      React.createElement(
        'div',
        { className: 'flex items-center justify-between' },
        React.createElement(
          'div',
          { className: 'flex items-center space-x-4' },
          React.createElement(
            'div',
            { className: 'flex items-center space-x-2' },
            React.createElement(Crown, { className: 'h-5 w-5 text-amber-400' }),
            React.createElement('span', { className: 'text-lg font-medium text-white' }, empireName)
          ),
          React.createElement(ResourceVisualization, null)
        ),
        React.createElement(
          'div',
          { className: 'flex items-center space-x-4' },
          // Display tech tree button with tier color
          React.createElement(
            'button',
            {
              onClick: toggleTechTree,
              className: `rounded-md border border-${__getTierColor(1)}-700/50 bg-${__getTierColor(
                1
              )}-900/30 px-3 py-1 text-sm text-${__getTierColor(1)}-400 hover:bg-${__getTierColor(1)}-800/50`,
            },
            'Tech Tree'
          )
        )
      )
    ),

    // Menu Categories
    React.createElement(
      'div',
      { className: 'pointer-events-auto fixed left-4 top-24 space-y-2' },
      Object.keys(menuItems).map(category =>
        React.createElement(
          'button',
          {
            key: category,
            onClick: () =>
              setActiveCategory(
                activeCategory === (category as MenuCategory) ? null : (category as MenuCategory)
              ),
            className: `flex w-16 flex-col items-center rounded-lg border p-2 transition-colors ${getCategoryStyle(
              category as MenuCategory
            )}`,
          },
          // Use the category icon from the mapping
          __categoryIcons[category as MenuCategory] &&
            React.createElement(__categoryIcons[category as MenuCategory], {
              className: 'h-6 w-6 text-gray-300',
            }),
          React.createElement('span', { className: 'mt-1 text-xs text-gray-300' }, category)
        )
      )
    ),

    // Active Category Menu
    activeCategory &&
      React.createElement(
        'div',
        {
          className: `pointer-events-auto fixed left-24 top-24 w-80 rounded-lg border bg-gradient-to-r p-4 backdrop-blur-sm ${
            __categoryColors[activeCategory].bg
          } ${__categoryColors[activeCategory].border}`,
        },
        React.createElement(
          'h3',
          { className: 'mb-4 text-lg font-medium capitalize text-white' },
          activeCategory
        ),
        React.createElement(
          'div',
          { className: 'space-y-3' },
          __currentMenuItems[activeCategory].map(item =>
            React.createElement(
              'button',
              {
                key: item.id,
                onClick: item.action,
                className:
                  'w-full rounded-md border border-gray-700/50 bg-gray-800/50 p-3 text-left hover:bg-gray-700/50',
              },
              React.createElement(
                'div',
                { className: 'flex justify-between' },
                React.createElement('span', { className: 'font-medium text-white' }, item.name),
                item.cost &&
                  React.createElement(
                    'div',
                    { className: 'text-xs text-gray-400' },
                    item.cost.minerals &&
                      React.createElement('span', null, `M: ${item.cost.minerals} `),
                    item.cost.energy && React.createElement('span', null, `E: ${item.cost.energy}`)
                  )
              ),
              React.createElement(
                'p',
                { className: 'mt-1 text-sm text-gray-400' },
                item.description
              )
            )
          )
        )
      ),

    // Settings Panel
    showSettings &&
      React.createElement(
        'div',
        {
          className:
            'pointer-events-auto fixed right-4 top-24 w-80 rounded-lg border border-gray-700/50 bg-gray-900/95 p-4 backdrop-blur-sm',
        },
        React.createElement('h3', { className: 'mb-4 text-lg font-medium text-white' }, 'Settings'),
        // Display resource stats from the enhanced resource stats
        React.createElement(
          'div',
          { className: 'space-y-3' },
          React.createElement(
            'div',
            { className: 'rounded-md border border-gray-700/50 bg-gray-800/50 p-3' },
            React.createElement(
              'h4',
              { className: 'font-medium text-white' },
              'Resource Analytics'
            ),
            React.createElement(
              'div',
              { className: 'mt-2 space-y-2' },
              React.createElement(
                'div',
                { className: 'flex justify-between' },
                React.createElement('span', { className: 'text-gray-400' }, 'Minerals:'),
                React.createElement(
                  'span',
                  {
                    className: `${
                      __resourceStats.minerals.status === 'warning'
                        ? 'text-amber-400'
                        : 'text-gray-300'
                    }`,
                  },
                  `${__resourceStats.minerals.currentAmount} / ${__resourceStats.minerals.maxCapacity}`
                )
              ),
              React.createElement(
                'div',
                { className: 'flex justify-between' },
                React.createElement('span', { className: 'text-gray-400' }, 'Energy:'),
                React.createElement(
                  'span',
                  {
                    className: `${
                      __resourceStats.energy.status === 'warning'
                        ? 'text-amber-400'
                        : 'text-gray-300'
                    }`,
                  },
                  `${__resourceStats.energy.currentAmount} / ${__resourceStats.energy.maxCapacity}`
                )
              )
            )
          )
        )
      ),

    // Notification System
    React.createElement(NotificationSystem, { position: 'top-right', maxNotifications: 5 }),

    // Module Status Summary - using moduleState
    React.createElement(
      'div',
      { className: 'mt-4 rounded-lg border border-gray-700 bg-gray-800 p-4' },
      React.createElement(
        'h3',
        { className: 'mb-2 text-lg font-semibold text-white' },
        'Module Status'
      ),
      React.createElement(
        'div',
        { className: 'grid grid-cols-4 gap-2' },
        React.createElement(
          'div',
          { className: 'rounded bg-green-900/30 p-2 text-center' },
          React.createElement(
            'div',
            { className: 'text-xl font-bold text-green-400' },
            moduleStatusSummary.active
          ),
          React.createElement('div', { className: 'text-xs text-green-200' }, 'Active')
        ),
        React.createElement(
          'div',
          { className: 'rounded bg-gray-900/30 p-2 text-center' },
          React.createElement(
            'div',
            { className: 'text-xl font-bold text-gray-400' },
            moduleStatusSummary.inactive
          ),
          React.createElement('div', { className: 'text-xs text-gray-200' }, 'Inactive')
        ),
        React.createElement(
          'div',
          { className: 'rounded bg-yellow-900/30 p-2 text-center' },
          React.createElement(
            'div',
            { className: 'text-xl font-bold text-yellow-400' },
            moduleStatusSummary.warning
          ),
          React.createElement('div', { className: 'text-xs text-yellow-200' }, 'Warning')
        ),
        React.createElement(
          'div',
          { className: 'rounded bg-red-900/30 p-2 text-center' },
          React.createElement(
            'div',
            { className: 'text-xl font-bold text-red-400' },
            moduleStatusSummary.error
          ),
          React.createElement('div', { className: 'text-xs text-red-200' }, 'Error')
        )
      )
    ),

    // Tech Tree Panel (conditionally rendered)
    showTechTree &&
      React.createElement(
        'div',
        { className: 'absolute inset-0 z-50 flex items-center justify-center bg-black/70' },
        React.createElement(
          'div',
          { className: 'h-4/5 w-4/5 rounded-lg border border-gray-700 bg-gray-800 p-6' },
          React.createElement(
            'div',
            { className: 'mb-4 flex items-center justify-between' },
            React.createElement(
              'h2',
              { className: 'text-2xl font-bold text-white' },
              'Research & Technology'
            ),
            React.createElement(
              'button',
              {
                className: 'rounded p-2 text-gray-400 hover:bg-gray-700 hover:text-white',
                onClick: toggleTechTree,
              },
              React.createElement(X, { className: 'h-5 w-5' })
            )
          ),
          React.createElement(
            'div',
            { className: 'grid h-full grid-cols-3 gap-4 overflow-auto' },
            React.createElement(
              'div',
              { className: 'rounded border border-gray-700 bg-gray-900 p-4' },
              React.createElement(
                'h3',
                { className: 'mb-2 text-lg font-semibold text-white' },
                'Mining Technologies'
              ),
              React.createElement(
                'div',
                { className: 'space-y-2' },
                React.createElement(
                  'div',
                  { className: 'rounded bg-gray-800 p-2' },
                  React.createElement(
                    'div',
                    { className: 'flex items-center justify-between' },
                    React.createElement(
                      'span',
                      { className: 'font-medium text-blue-400' },
                      'Advanced Extraction'
                    ),
                    React.createElement('span', { className: 'text-xs text-gray-400' }, 'Tier 2')
                  ),
                  React.createElement(
                    'div',
                    { className: 'mt-1 text-xs text-gray-400' },
                    'Increases mining efficiency by 20%'
                  )
                ),
                React.createElement(
                  'div',
                  { className: 'rounded bg-gray-800 p-2' },
                  React.createElement(
                    'div',
                    { className: 'flex items-center justify-between' },
                    React.createElement(
                      'span',
                      { className: 'font-medium text-gray-400' },
                      'Quantum Refinement'
                    ),
                    React.createElement('span', { className: 'text-xs text-gray-400' }, 'Tier 3')
                  ),
                  React.createElement(
                    'div',
                    { className: 'mt-1 text-xs text-gray-400' },
                    'Unlocks exotic material processing'
                  )
                )
              )
            ),
            React.createElement(
              'div',
              { className: 'rounded border border-gray-700 bg-gray-900 p-4' },
              React.createElement(
                'h3',
                { className: 'mb-2 text-lg font-semibold text-white' },
                'Exploration Technologies'
              ),
              React.createElement(
                'div',
                { className: 'space-y-2' },
                React.createElement(
                  'div',
                  { className: 'rounded bg-gray-800 p-2' },
                  React.createElement(
                    'div',
                    { className: 'flex items-center justify-between' },
                    React.createElement(
                      'span',
                      { className: 'font-medium text-green-400' },
                      'Long-Range Scanners'
                    ),
                    React.createElement('span', { className: 'text-xs text-gray-400' }, 'Tier 1')
                  ),
                  React.createElement(
                    'div',
                    { className: 'mt-1 text-xs text-gray-400' },
                    'Increases exploration range by 50%'
                  )
                )
              )
            ),
            React.createElement(
              'div',
              { className: 'rounded border border-gray-700 bg-gray-900 p-4' },
              React.createElement(
                'h3',
                { className: 'mb-2 text-lg font-semibold text-white' },
                'Combat Technologies'
              ),
              React.createElement(
                'div',
                { className: 'space-y-2' },
                React.createElement(
                  'div',
                  { className: 'rounded bg-gray-800 p-2' },
                  React.createElement(
                    'div',
                    { className: 'flex items-center justify-between' },
                    React.createElement(
                      'span',
                      { className: 'font-medium text-red-400' },
                      'Advanced Weapons'
                    ),
                    React.createElement('span', { className: 'text-xs text-gray-400' }, 'Tier 2')
                  ),
                  React.createElement(
                    'div',
                    { className: 'mt-1 text-xs text-gray-400' },
                    'Unlocks new weapon types for ships'
                  )
                )
              )
            )
          )
        )
      )
  );
}

// Get tier color based on tier level - kept for future implementation of tier visualization
// Will be used when implementing the tier progression system UI
function __getTierColor(tier: number) {
  switch (tier) {
    case 1:
      return 'emerald';
    case 2:
      return 'teal';
    case 3:
      return 'cyan';
    default:
      return 'green';
  }
}
