import { TechTree } from './TechTree';
import {
  ChevronDown,
  ChevronRight,
  Crown,
  Database,
  Map,
  Radar,
  Rocket,
  Settings,
  X,
  Zap,
  AlertCircle,
  CheckCircle,
  Leaf,
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useModules, canBuildModule, buildModule } from '../../contexts/ModuleContext';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { ThresholdStatusIndicator } from '../buildings/modules/MiningHub/ThresholdStatusIndicator';
import { motion } from 'framer-motion';

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

interface Notification {
  id: string;
  type: 'success' | 'error';
  message: string;
}

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
      description: 'View and analyze discovered star systems',
      moduleType: 'radar',
      cost: {
        minerals: 200,
        energy: 100,
      },
      action: () => {
        if (canBuildModule('radar', { minerals: 200, energy: 100 })) {
          buildModule('radar', { minerals: 200, energy: 100 });
        }
      },
    },
    {
      id: 'anomaly-scanner',
      name: 'Anomaly Scanner',
      description: 'Track and investigate spatial anomalies',
      moduleType: 'radar',
      cost: {
        minerals: 300,
        energy: 200,
      },
      action: () => {
        if (canBuildModule('radar', { minerals: 300, energy: 200 })) {
          buildModule('radar', { minerals: 300, energy: 200 });
        }
      },
    },
  ],
  mothership: [
    {
      id: 'ship-hanger',
      name: 'Ship Hangar',
      description: 'Build and manage your fleet of ships',
      moduleType: 'hangar',
      cost: {
        minerals: 600,
        energy: 400,
      },
      action: () => {
        if (canBuildModule('hangar', { minerals: 600, energy: 400 })) {
          buildModule('hangar', { minerals: 600, energy: 400 });
        }
      },
    },
    {
      id: 'radar-system',
      name: 'Radar System',
      description: 'Monitor system-wide activity and threats',
      moduleType: 'radar',
      cost: {
        minerals: 300,
        energy: 200,
      },
      action: () => {
        if (canBuildModule('radar', { minerals: 300, energy: 200 })) {
          buildModule('radar', { minerals: 300, energy: 200 });
        }
      },
    },
    {
      id: 'defense-grid',
      name: 'Defense Grid',
      description: 'Manage defensive systems and fortifications',
      moduleType: 'resource-manager',
      cost: {
        minerals: 500,
        energy: 300,
      },
      action: () => {
        if (canBuildModule('resource-manager', { minerals: 500, energy: 300 })) {
          buildModule('resource-manager', { minerals: 500, energy: 300 });
        }
      },
    },
  ],
  colony: [
    {
      id: 'population',
      name: 'Population',
      description: 'Manage colonists and population growth',
      moduleType: 'resource-manager',
      cost: {
        minerals: 400,
        energy: 300,
      },
      action: () => {
        if (canBuildModule('resource-manager', { minerals: 400, energy: 300 })) {
          buildModule('resource-manager', { minerals: 400, energy: 300 });
        }
      },
    },
    {
      id: 'infrastructure',
      name: 'Infrastructure',
      description: 'Build and upgrade colony facilities',
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

const categoryColors: Record<MenuCategory, { bg: string; border: string; hover: string }> = {
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

const categoryIcons = {
  mining: Database,
  exploration: Radar,
  mothership: Rocket,
  colony: Map,
};

export function GameHUD({ empireName, onToggleSprawlView, onToggleVPRView }: GameHUDProps) {
  const [activeCategory, setActiveCategory] = useState<MenuCategory | null>(null);
  const [showTechTree, setShowTechTree] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { state: gameState, dispatch: gameDispatch } = useGame();
  const { state: moduleState } = useModules();

  const addNotification = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
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
              addNotification('success', `Successfully built ${item.name}`);
            } else {
              addNotification('error', `Insufficient resources to build ${item.name}`);
            }
          }
        },
      }));
    });
    return updatedItems;
  };

  const currentMenuItems = getUpdatedMenuItems();

  const resourceStats = useMemo(() => ({
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
  }), [gameState.resources, gameState.resourceRates]);

  useEffect(() => {
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

  return (
    <>
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-white ${
              notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{notification.message}</span>
          </motion.div>
        ))}
      </div>

      {/* Main Menu */}
      <div className="fixed left-20 top-20 w-80 space-y-4">
        {/* Resource Display */}
        <div className="bg-gray-800/90 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50">
          <div className="text-sm text-gray-400 mb-4">Resources</div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="text-amber-100 font-medium">Minerals</div>
              </div>
              <ThresholdStatusIndicator
                currentAmount={resourceStats.minerals.currentAmount}
                minThreshold={resourceStats.minerals.minThreshold}
                maxThreshold={resourceStats.minerals.maxThreshold}
                maxCapacity={resourceStats.minerals.maxCapacity}
                extractionRate={resourceStats.minerals.extractionRate}
                showDetails
              />
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500" />
                <div className="text-cyan-100 font-medium">Energy</div>
              </div>
              <ThresholdStatusIndicator
                currentAmount={resourceStats.energy.currentAmount}
                minThreshold={resourceStats.energy.minThreshold}
                maxThreshold={resourceStats.energy.maxThreshold}
                maxCapacity={resourceStats.energy.maxCapacity}
                extractionRate={resourceStats.energy.extractionRate}
                showDetails
              />
            </div>
          </div>
        </div>

        {/* Buildings and Modules */}
        <div className="bg-gray-800/90 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50">
          <div className="text-sm text-gray-400 mb-4">Buildings</div>
          {moduleState.buildings.map(building => (
            <div key={building.id} className="mb-6 last:mb-0">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 bg-${getTierColor(building.level)}-500/20 rounded-lg`}>
                  <Leaf className={`w-5 h-5 text-${getTierColor(building.level)}-400`} />
                </div>
                <div>
                  <div className="text-gray-200 font-medium">{building.type}</div>
                  <div className="text-sm text-gray-400">Level {building.level}</div>
                </div>
                <div className={`ml-auto px-3 py-1 rounded-full bg-${getTierColor(building.level)}-500/20 text-${getTierColor(building.level)}-300 text-sm`}>
                  {building.status}
                </div>
              </div>
              <div className="pl-4 space-y-3">
                {building.modules.map(module => (
                  <div
                    key={module.id}
                    className={`p-3 rounded-lg bg-${getTierColor(module.level)}-900/20 border border-${getTierColor(module.level)}-700/30`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          module.status === 'active'
                            ? 'bg-green-500 animate-pulse'
                            : module.status === 'constructing'
                              ? 'bg-yellow-500 animate-pulse'
                              : 'bg-red-500'
                        }`} />
                        <div className="text-gray-200">{module.name}</div>
                      </div>
                      <div className="text-sm text-gray-400">Level {module.level}</div>
                    </div>
                    {/* Module Progress */}
                    <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-${getTierColor(module.level)}-500 rounded-full transition-all`}
                        style={{ width: `${(module.progress || 0) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {building.modules.length === 0 && (
                  <div className="text-gray-500 text-sm italic">No modules installed</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Category Menu */}
        <div className="space-y-2">
          {(Object.keys(menuItems) as MenuCategory[]).map(category => {
            const Icon = categoryIcons[category];
            const colors = categoryColors[category];
            const isActive = activeCategory === category;

            return (
              <div key={category} className="relative">
                {/* Category Header */}
                <button
                  onClick={() => setActiveCategory(isActive ? null : category)}
                  className={`w-full px-4 py-3 rounded-lg bg-gradient-to-b ${colors.bg} border ${colors.border} flex items-center justify-between group transition-colors`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium capitalize">{category}</span>
                  </div>
                  {isActive ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>

                {/* Submenu Items */}
                {isActive && (
                  <div className="pl-4 space-y-1">
                    {currentMenuItems[category].map(item => {
                      const canBuild = item.moduleType && item.cost ? canBuildModule(item.moduleType, item.cost) : true;
                      return (
                        <button
                          key={item.id}
                          onClick={item.action}
                          disabled={!canBuild}
                          className={`w-full px-4 py-3 rounded-lg text-left group ${
                            canBuild ? colors.hover : 'opacity-50 cursor-not-allowed'
                          } transition-colors`}
                        >
                          <div className="text-gray-200 font-medium mb-0.5">{item.name}</div>
                          <div className="text-gray-400 text-sm group-hover:text-gray-300">
                            {item.description}
                          </div>
                          {item.cost && (
                            <div className="mt-2 text-sm text-gray-400">
                              Cost:{' '}
                              {Object.entries(item.cost)
                                .map(([resource, amount]) => `${resource}: ${amount}`)
                                .join(', ')}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tech Tree */}
      {showTechTree && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm">
          <div className="absolute inset-8 bg-gray-900 rounded-lg border border-gray-700">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setShowTechTree(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <TechTree />
          </div>
        </div>
      )}

      {/* Settings */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm">
          <div className="absolute inset-8 bg-gray-900 rounded-lg border border-gray-700">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-6">Settings</h2>
              {/* Add settings content here */}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getTierColor(tier: number) {
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
