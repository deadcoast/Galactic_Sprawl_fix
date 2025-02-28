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
import { ResourceVisualization } from './ResourceVisualization';
import { NotificationSystem, notificationManager } from './NotificationSystem';

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
  const gameContext = useGame();
  const moduleContext = useModules();

  // Ensure contexts are available
  if (!gameContext || !moduleContext) {
    return null;
  }

  const { state: gameState, dispatch: gameDispatch } = gameContext;
  const { state: moduleState } = moduleContext;

  // Add notification
  const addNotification = (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => {
    notificationManager.show({
      type,
      title,
      message,
      duration: 5000,
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
              addNotification('success', `Successfully built ${item.name}`, `Successfully built ${item.name}`);
            } else {
              addNotification('error', `Insufficient resources to build ${item.name}`, `Insufficient resources to build ${item.name}`);
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
    <div className="fixed inset-0 pointer-events-none">
      {/* Top Bar */}
      <div className="pointer-events-auto p-4 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-lg font-medium text-white">{empireName}</span>
            </div>
            <ResourceVisualization />
          </div>
          <div className="flex items-center space-x-4">
            {/* ... existing buttons ... */}
          </div>
        </div>
      </div>

      {/* Menu Categories */}
      <div className="pointer-events-auto fixed left-4 top-24 space-y-2">
        {/* ... existing menu category buttons ... */}
      </div>

      {/* Active Category Menu */}
      {activeCategory && (
        <div className="pointer-events-auto fixed left-24 top-24 w-80 p-4 bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-lg">
          {/* ... existing menu items ... */}
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="pointer-events-auto fixed right-4 top-24 w-80 p-4 bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-lg">
          {/* ... existing settings ... */}
        </div>
      )}

      {/* Notification System */}
      <NotificationSystem position="top-right" maxNotifications={5} />
    </div>
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
