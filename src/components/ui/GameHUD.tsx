import {
  AlertTriangle,
  Crown,
  Database,
  Info,
  Map as MapIcon,
  Rocket,
  Settings,
  Terminal,
  X,
} from 'lucide-react';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GameActionType, useGameDispatch, useGameState } from '../../contexts/GameContext';
import { ModuleActionType, useModuleDispatch, useModules } from '../../contexts/ModuleContext';
import { useVPRSystem } from '../../hooks/ui/useVPRSystem';
import { moduleEventBus } from '../../lib/modules/ModuleEvents';
import { moduleManager } from '../../managers/module/ModuleManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { Position } from '../../types/core/GameTypes';
import { Module } from '../../types/modules/ModuleTypes';
import { ResourceType } from './../../types/resources/ResourceTypes';
import { NotificationSystem, notificationManager } from './NotificationSystem';
import ResourceVisualization from './ResourceVisualization';

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
 * @deprecated This function is not currently used but will be implemented
 * in the upcoming notification system upgrade. It is kept here for reference.
 */

function _createNotification(type: 'success' | 'error', message: string): _Notification {
  return {
    id: `notification-${Date.now()}`,
    type,
    message,
  };
}

// Category color mapping
const categoryColors: Record<MenuCategory, { bg: string; border: string; hover: string }> = {
  mining: {
    bg: 'from-amber-900/90 to-amber-800/80',
    border: 'border-amber-700/50',
    hover: 'hover:bg-amber-800/50 hover:border-amber-600/50',
  },
  exploration: {
    bg: 'from-blue-900/90 to-blue-800/80',
    border: 'border-blue-700/50',
    hover: 'hover:bg-blue-800/50 hover:border-blue-600/50',
  },
  mothership: {
    bg: 'from-indigo-900/90 to-indigo-800/80',
    border: 'border-indigo-700/50',
    hover: 'hover:bg-indigo-800/50 hover:border-indigo-600/50',
  },
  colony: {
    bg: 'from-green-900/90 to-green-800/80',
    border: 'border-green-700/50',
    hover: 'hover:bg-green-800/50 hover:border-green-600/50',
  },
};

// Category icons
const categoryIcons: Record<MenuCategory, React.ReactNode> = {
  mining: <Database size={18} />,
  exploration: <MapIcon size={18} />,
  mothership: <Rocket size={18} />,
  colony: <Crown size={18} />,
};

export function GameHUD({ empireName, onToggleSprawlView, onToggleVPRView }: GameHUDProps) {
  const [activeCategory, setActiveCategory] = useState<MenuCategory | null>(null);
  const [showTechTree, setShowTechTree] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTooltip, setShowTooltip] = useState<{ id: string; x: number; y: number } | null>(null);

  // Get contexts
  const gameState = useGameState(state => state);
  const gameDispatch = useGameDispatch();
  const moduleState = useModules(state => state);
  const moduleDispatch = useModuleDispatch();
  const vprSystem = useVPRSystem();

  // Ensure contexts are available
  if (!gameState || !moduleState) {
    return null;
  }

  // Combine contexts for backward compatibility
  const gameContext = { state: gameState, dispatch: gameDispatch };
  const moduleContext = { state: moduleState, dispatch: moduleDispatch };

  // Check if a module can be built based on resources and available attachment points
  const canBuildModule = (
    moduleType: ModuleType,
    cost: { minerals?: number; energy?: number }
  ): boolean => {
    console.warn('Checking if can build module:', moduleType, cost);

    // Check resources
    const hasResources =
      (cost.minerals || 0) <= gameState.resources.minerals &&
      (cost.energy || 0) <= gameState.resources.energy;

    if (!hasResources) {
      console.warn('Not enough resources to build module');
      return false;
    }

    // Find a suitable building and attachment point
    for (const building of moduleState.buildings) {
      for (const point of building.attachmentPoints) {
        if (point.allowedTypes.includes(moduleType) && !point.currentModule) {
          console.warn('Found suitable attachment point for module');
          return true;
        }
      }
    }

    console.warn('No suitable attachment point found for module');
    return false;
  };

  // Updated buildModuleLocally function with improved error handling and logging
  const buildModuleLocally = (
    moduleType: ModuleType,
    cost: { minerals?: number; energy?: number }
  ): boolean => {
    console.warn('Building module:', moduleType, cost);

    if (!moduleDispatch) {
      console.error('Module context dispatch is not available');
      return false;
    }

    // Find a suitable building and attachment point
    let targetBuilding = undefined;
    let targetPoint = undefined;

    // Get first available building with a suitable attachment point
    for (const building of moduleState.buildings) {
      for (const point of building.attachmentPoints) {
        if (point.allowedTypes.includes(moduleType) && !point.currentModule) {
          targetBuilding = building;
          targetPoint = point.id;
          break;
        }
      }
      if (targetBuilding && targetPoint) {
        break;
      }
    }

    if (!targetBuilding || !targetPoint) {
      console.error('No suitable attachment point found for module:', moduleType);
      return false;
    }

    // Create and attach the module
    const position: Position = targetBuilding.attachmentPoints.find(p => p.id === targetPoint)
      ?.position || {
      x: 0,
      y: 0,
    };

    console.warn('Creating module at position:', position);

    try {
      // Create the module
      const module: Module = {
        id: uuidv4(),
        name: `${moduleType} Module`,
        type: moduleType,
        position,
        status: 'active',
        isActive: true,
        level: 1,
      };

      moduleDispatch({
        type: ModuleActionType.ADD_MODULE,
        payload: {
          module,
        },
      });

      // Get the newly created module's ID (it will be the last one created)
      const newModule = moduleManager.getModulesByType(moduleType).pop();
      if (!newModule) {
        console.error('Failed to create module:', moduleType);
        return false;
      }

      console.warn('Created module:', newModule);

      // Attach the module
      moduleDispatch({
        type: ModuleActionType.UPDATE_MODULE,
        payload: {
          moduleId: newModule.id,
          updates: {
            buildingId: targetBuilding.id,
            attachmentPointId: targetPoint,
          },
        },
      });

      // Activate the module
      moduleDispatch({
        type: ModuleActionType.SET_ACTIVE_MODULES,
        payload: {
          activeModuleIds: [...moduleState.activeModuleIds, newModule.id],
        },
      });

      // Register with VPR system for visualization if it's a relevant type
      if (
        vprSystem &&
        ['exploration', 'mining', 'colony', 'hangar', 'mineral', 'resource-manager'].includes(
          moduleType
        )
      ) {
        // Map module type to VPR type
        const vprType =
          moduleType === 'exploration'
            ? 'exploration'
            : moduleType === 'hangar'
              ? 'mining'
              : moduleType === 'mineral'
                ? 'mining'
                : moduleType === 'resource-manager'
                  ? 'colony'
                  : 'mothership';

        // Use the new addModule function to add the module to the VPR system
        vprSystem.addModule(newModule.id, vprType, 1, 'active');

        // Emit an event to notify the system of the new module
        moduleEventBus.emit({
          type: 'MODULE_UPDATED',
          moduleId: newModule.id,
          moduleType: moduleType,
          timestamp: Date.now(),
          data: {
            vprRegistered: true,
            vprType: vprType,
          },
        });
      }

      console.warn(`Successfully built module of type ${moduleType} with ID ${newModule.id}`);
      return true;
    } catch (error) {
      console.error('Error building module:', error);
      return false;
    }
  };

  // Add notification
  const addNotification = (
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message: string
  ): void => {
    // Current implementation using the notification manager
    notificationManager.show({
      title,
      message,
      type,
    });
  };

  // Toggle tech tree
  const toggleTechTree = () => {
    setShowTechTree(!showTechTree);
  };

  // Toggle settings
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  // Add keyboard shortcuts for menu navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Mapping keys to categories
      const keyMap: Record<string, MenuCategory> = {
        m: 'mining',
        e: 'exploration',
        h: 'mothership',
        c: 'colony',
      };

      // Function keys mapping
      if (event.key === 'F1') {
        toggleTechTree();
        return;
      }

      if (event.key === 'F2') {
        toggleSettings();
        return;
      }

      // Alt + key combinations for categories
      if (event.altKey && keyMap[event.key]) {
        setActiveCategory(keyMap[event.key]);
        event.preventDefault();
      }

      // Escape key to close active category
      if (event.key === 'Escape' && activeCategory) {
        setActiveCategory(null);
        event.preventDefault();
      }
    },
    [activeCategory, toggleTechTree, toggleSettings]
  );

  // Set up keyboard shortcut listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Resource status indicators
  const getResourceStatus = useCallback((current: number, min: number, max: number) => {
    if (current < min) {
      return {
        status: 'critical',
        color: 'text-red-400',
        icon: <AlertTriangle size={14} className="text-red-400" />,
      };
    } else if (current > max) {
      return {
        status: 'abundant',
        color: 'text-green-400',
        icon: <Info size={14} className="text-green-400" />,
      };
    } else {
      return { status: 'normal', color: 'text-gray-300', icon: null };
    }
  }, []);

  // Enhanced tooltip display
  const renderTooltip = () => {
    if (!showTooltip) return null;

    const menuCategory = Object.keys(menuItems).find(category =>
      menuItems[category as MenuCategory].some(item => item.id === showTooltip.id)
    ) as MenuCategory | undefined;

    if (!menuCategory) return null;

    const menuItem = menuItems[menuCategory].find(item => item.id === showTooltip.id);
    if (!menuItem) return null;

    const canBuild =
      menuItem.moduleType && menuItem.cost
        ? canBuildModule(menuItem.moduleType, menuItem.cost)
        : false;

    return (
      <div
        className="absolute z-50 w-72 rounded-lg border border-gray-700 bg-gray-800 p-3 shadow-lg"
        style={{ top: showTooltip.y + 10, left: showTooltip.x }}
      >
        <h4 className="text-md font-semibold text-white">{menuItem.name}</h4>
        <p className="mt-1 text-sm text-gray-300">{menuItem.description}</p>

        {menuItem.cost && (
          <div className="mt-2 space-y-1 text-sm">
            <h5 className="font-medium text-gray-200">Required Resources:</h5>
            <div className="flex justify-between">
              {menuItem.cost.minerals && (
                <div
                  className={`flex items-center space-x-1 ${
                    gameState.resources.minerals >= menuItem.cost.minerals
                      ? 'text-amber-300'
                      : 'text-red-400'
                  }`}
                >
                  <span>Minerals:</span>
                  <span className="font-medium">{menuItem.cost.minerals}</span>
                </div>
              )}
              {menuItem.cost.energy && (
                <div
                  className={`flex items-center space-x-1 ${
                    gameState.resources.energy >= menuItem.cost.energy
                      ? 'text-cyan-300'
                      : 'text-red-400'
                  }`}
                >
                  <span>Energy:</span>
                  <span className="font-medium">{menuItem.cost.energy}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-3 text-sm">
          <span className={`font-medium ${canBuild ? 'text-green-400' : 'text-red-400'}`}>
            {canBuild ? 'Available to build' : 'Cannot build'}
          </span>
        </div>
      </div>
    );
  };

  // Define menu items with actions
  const getMenuItems = () => {
    return {
      mining: [
        {
          id: 'mineral-processing',
          name: 'Mineral Processing',
          description: 'Process raw minerals and manage resource extraction',
          moduleType: 'mineral' as ModuleType,
          cost: {
            minerals: 500,
            energy: 300,
          },
          action: () => {},
        },
        {
          id: 'mining-fleet',
          name: 'Mining Fleet',
          description: 'Manage mining ships and automated resource collection',
          moduleType: 'hangar' as ModuleType,
          cost: {
            minerals: 400,
            energy: 200,
          },
          action: () => {},
        },
        {
          id: 'resource-storage',
          name: 'Resource Storage',
          description: 'Monitor and manage resource stockpiles',
          moduleType: 'resource-manager' as ModuleType,
          cost: {
            minerals: 300,
            energy: 100,
          },
          action: () => {},
        },
      ],
      exploration: [
        {
          id: 'recon-hub',
          name: 'Recon Hub',
          description: 'Coordinate exploration missions and scout ships',
          moduleType: 'exploration' as ModuleType,
          cost: {
            minerals: 400,
            energy: 300,
          },
          action: () => {},
        },
        {
          id: 'galaxy-map',
          name: 'Galaxy Map',
          description: 'View and analyze discovered sectors',
          moduleType: 'radar' as ModuleType,
          cost: {
            minerals: 200,
            energy: 400,
          },
          action: () => {},
        },
      ],
      mothership: [
        {
          id: 'command-center',
          name: 'Command Center',
          description: 'Central command and control for your mothership',
          moduleType: 'hangar' as ModuleType,
          cost: {
            minerals: 600,
            energy: 500,
          },
          action: () => {},
        },
        {
          id: 'research-lab',
          name: 'Research Lab',
          description: 'Research new technologies and upgrades',
          moduleType: ResourceType.RESEARCH as ModuleType,
          cost: {
            minerals: 500,
            energy: 600,
          },
          action: () => {},
        },
      ],
      colony: [
        {
          id: 'habitat-dome',
          name: 'Habitat Dome',
          description: 'Living quarters for your colonists',
          moduleType: 'resource-manager' as ModuleType,
          cost: {
            minerals: 500,
            energy: 400,
          },
          action: () => {},
        },
        {
          id: 'trade-hub',
          name: 'Trade Hub',
          description: 'Establish and monitor trade routes',
          moduleType: 'trading' as ModuleType,
          cost: {
            minerals: 400,
            energy: 300,
          },
          action: () => {},
        },
      ],
    };
  };

  // Update the getUpdateMenuItems function to properly implement actions
  const getUpdatedMenuItems = () => {
    const menuItems = getMenuItems();

    // Add the real actions
    Object.keys(menuItems).forEach(category => {
      menuItems[category as MenuCategory] = menuItems[category as MenuCategory].map(item => ({
        ...item,
        action: () => {
          console.warn(`Attempting to build ${item.name}...`);
          if (item.moduleType && item.cost) {
            if (canBuildModule(item.moduleType, item.cost)) {
              // Actually build the module using our local implementation
              const success = buildModuleLocally(item.moduleType, item.cost);

              if (success) {
                // Update resources in game state
                gameDispatch({
                  type: GameActionType.UPDATE_RESOURCES,
                  payload: {
                    minerals: gameState.resources.minerals - (item.cost?.minerals || 0),
                    energy: gameState.resources.energy - (item.cost?.energy || 0),
                  },
                });

                // Show success notification
                addNotification(
                  'success',
                  `Successfully built ${item.name}`,
                  `Your ${item.name} module is now operational.`
                );

                console.warn(`Successfully built ${item.name}!`);

                // Activate the appropriate view based on module type
                if (category === 'mining') {
                  onToggleSprawlView();
                } else if (category === 'exploration') {
                  onToggleVPRView();
                }
              } else {
                // Show error notification if building failed
                addNotification(
                  'error',
                  `Failed to build ${item.name}`,
                  `Technical error occurred while building ${item.name}. Please try again.`
                );
              }
            } else {
              // Show error notification
              const missingResources = [];
              if ((item.cost?.minerals || 0) > gameState.resources.minerals) {
                missingResources.push(
                  `${item.cost?.minerals - gameState.resources.minerals} minerals`
                );
              }
              if ((item.cost?.energy || 0) > gameState.resources.energy) {
                missingResources.push(`${item.cost?.energy - gameState.resources.energy} energy`);
              }

              const resourceMessage =
                missingResources.length > 0
                  ? `You need ${missingResources.join(' and ')} more.`
                  : 'No suitable attachment point available.';

              addNotification(
                'error',
                `Cannot build ${item.name}`,
                `Insufficient resources to build ${item.name}. ${resourceMessage}`
              );
            }
          }
        },
      }));
    });

    return menuItems;
  };

  // Get menu items with actions
  const menuItems = getUpdatedMenuItems();

  // Enhanced UI for the category style with better visual feedback
  const getCategoryStyle = (category: MenuCategory) => {
    const baseStyle =
      'flex w-full items-center rounded-lg border px-4 py-2 transition-colors duration-200';
    const activeStyle = `${baseStyle} ${categoryColors[category].border} bg-gradient-to-r ${categoryColors[category].bg} text-white shadow-md`;
    const inactiveStyle = `${baseStyle} border-gray-700/50 bg-gray-800/30 text-gray-300 hover:bg-gray-700/40 hover:border-gray-600/50`;

    return activeCategory === category ? activeStyle : inactiveStyle;
  };

  // Resource statistics for basic display
  const resourceStats = useMemo(
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

  // Display resource warnings based on thresholds
  useEffect(() => {
    if (
      resourceStats.minerals.currentAmount < resourceStats.minerals.minThreshold ||
      resourceStats.energy.currentAmount < resourceStats.energy.minThreshold
    ) {
      // Only show the warning if it's critical (less than half of the min threshold)
      if (
        resourceStats.minerals.currentAmount < resourceStats.minerals.minThreshold / 2 ||
        resourceStats.energy.currentAmount < resourceStats.energy.minThreshold / 2
      ) {
        addNotification(
          'error',
          'Critical Resource Shortage',
          'Resources are critically low. Prioritize resource collection immediately.'
        );
      } else {
        addNotification(
          'warning',
          'Low Resources',
          'Resource levels are getting low. Consider increasing production.'
        );
      }
    }
  }, [resourceStats]);

  // Render the component
  return (
    <div className="flex h-screen flex-col overflow-hidden rounded-lg border border-gray-800 bg-gray-900 bg-opacity-80 shadow-lg">
      {/* Top bar with empire name and resource visualization */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 bg-opacity-50 px-4 py-3">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-white">{empireName}</h1>
          <div className="ml-4 rounded-md bg-gray-700 bg-opacity-50 px-3 py-1">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <span className="font-medium text-amber-300">
                  Minerals: {gameState.resources.minerals}
                </span>
                {resourceStats.minerals.extractionRate !== 0 && (
                  <span
                    className={`ml-1 text-xs ${resourceStats.minerals.extractionRate > 0 ? 'text-green-400' : 'text-red-400'}`}
                  >
                    ({resourceStats.minerals.extractionRate > 0 ? '+' : ''}
                    {resourceStats.minerals.extractionRate}/s)
                  </span>
                )}
                {
                  getResourceStatus(
                    resourceStats.minerals.currentAmount,
                    resourceStats.minerals.minThreshold,
                    resourceStats.minerals.maxThreshold
                  ).icon
                }
              </div>
              <span className="text-gray-400">|</span>
              <div className="flex items-center">
                <span className="font-medium text-cyan-300">
                  Energy: {gameState.resources.energy}
                </span>
                {resourceStats.energy.extractionRate !== 0 && (
                  <span
                    className={`ml-1 text-xs ${resourceStats.energy.extractionRate > 0 ? 'text-green-400' : 'text-red-400'}`}
                  >
                    ({resourceStats.energy.extractionRate > 0 ? '+' : ''}
                    {resourceStats.energy.extractionRate}/s)
                  </span>
                )}
                {
                  getResourceStatus(
                    resourceStats.energy.currentAmount,
                    resourceStats.energy.minThreshold,
                    resourceStats.energy.maxThreshold
                  ).icon
                }
              </div>
            </div>
          </div>
        </div>
        <ResourceVisualization
          resourceType={ResourceType.MINERALS}
          amount={gameState.resources.minerals}
        />
        <ResourceVisualization
          resourceType={ResourceType.ENERGY}
          amount={gameState.resources.energy}
        />
      </div>
      {/* Main content with menu and active panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left menu with categories */}
        <div className="flex w-64 flex-col overflow-y-auto border-r border-gray-800 bg-gray-900 bg-opacity-60">
          {/* Menu categories */}
          <div className="space-y-2 p-4">
            {Object.keys(menuItems).map(category => (
              <button
                key={category}
                className={getCategoryStyle(category as MenuCategory)}
                onClick={() => setActiveCategory(category as MenuCategory)}
              >
                {categoryIcons[category as MenuCategory]}
                <span className="ml-2 font-medium">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </span>
                <span className="ml-auto text-xs text-gray-400">Alt+{category.charAt(0)}</span>
              </button>
            ))}
          </div>
          {/* Action buttons at the bottom */}
          <div className="mt-auto space-y-2 border-t border-gray-800 p-4">
            <button
              className="flex w-full items-center rounded-lg border border-indigo-700/50 bg-indigo-900/30 px-4 py-2 transition-colors duration-200 hover:bg-indigo-800/40"
              onClick={toggleTechTree}
            >
              <Terminal size={18} />
              <span className="ml-2 font-medium text-white">Tech Tree</span>
              <span className="ml-auto text-xs text-gray-400">F1</span>
            </button>
            <button
              className="flex w-full items-center rounded-lg border border-gray-700/50 bg-gray-900/30 px-4 py-2 transition-colors duration-200 hover:bg-gray-800/40"
              onClick={toggleSettings}
            >
              <Settings size={18} />
              <span className="ml-2 font-medium text-white">Settings</span>
              <span className="ml-auto text-xs text-gray-400">F2</span>
            </button>
          </div>
        </div>
        {/* Right panel with active category content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeCategory ? (
            <div>
              {/* Category header */}
              <div
                className={`mb-6 border-b pb-4 ${
                  categoryColors[activeCategory].border
                } flex items-center justify-between`}
              >
                <h2 className="flex items-center text-2xl font-bold text-white">
                  {categoryIcons[activeCategory]}
                  <span className="ml-2">
                    {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}
                  </span>
                </h2>
                <button
                  className="rounded-full p-1 transition-colors duration-200 hover:bg-gray-800"
                  onClick={() => setActiveCategory(null)}
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              {/* Category items */}
              <div className="space-y-3">
                {menuItems[activeCategory].map(item => (
                  <button
                    key={item.id}
                    className={`w-full rounded-lg border p-4 text-left ${
                      categoryColors[activeCategory].border
                    } bg-gray-800 bg-opacity-50 transition-colors duration-200 hover:bg-opacity-70`}
                    onClick={item.action}
                    onMouseEnter={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setShowTooltip({
                        id: item.id,
                        x: rect.right,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setShowTooltip(null)}
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-medium text-white">{item.name}</h3>
                      {item.cost ? (
                        <div className="flex space-x-3 text-sm">
                          {item.cost.minerals ? (
                            <span
                              className={`rounded px-2 py-1 ${
                                gameState.resources.minerals < (item.cost.minerals || 0)
                                  ? 'bg-red-900/60 text-red-300'
                                  : 'bg-amber-900/60 text-amber-300'
                              }`}
                            >
                              {item.cost.minerals} minerals
                            </span>
                          ) : null}
                          {item.cost.energy ? (
                            <span
                              className={`rounded px-2 py-1 ${
                                gameState.resources.energy < (item.cost.energy || 0)
                                  ? 'bg-red-900/60 text-red-300'
                                  : 'bg-cyan-900/60 text-cyan-300'
                              }`}
                            >
                              {item.cost.energy} energy
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <p className="mt-1 text-gray-300">{item.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Welcome screen when no category is selected */
            <div className="flex h-full flex-col items-center justify-center text-center">
              <h2 className="mb-4 text-2xl font-bold text-white">Welcome to {empireName}</h2>
              <p className="mb-8 max-w-md text-gray-300">
                Select a category from the left menu to manage your empire. Build modules to expand
                your capabilities.
              </p>
              <div className="grid w-full max-w-md grid-cols-2 gap-4">
                {Object.keys(menuItems).map(category => (
                  <button
                    key={category}
                    className={`rounded-lg border p-4 ${
                      categoryColors[category as MenuCategory].border
                    } bg-gray-800/50 transition-colors duration-200 hover:bg-opacity-70`}
                    onClick={() => setActiveCategory(category as MenuCategory)}
                  >
                    <div className="flex flex-col items-center justify-center">
                      {categoryIcons[category as MenuCategory]}
                      <span className="mt-2 font-medium text-white">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </span>
                      <span className="mt-1 text-xs text-gray-400">Alt+{category.charAt(0)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Tooltips */}
      {renderTooltip()}
      {/* Notification system */}
      <NotificationSystem />
    </div>
  );
}
