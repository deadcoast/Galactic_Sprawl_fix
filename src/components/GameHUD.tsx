import { TechTree } from "@/components/TechTree";
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
} from "lucide-react";
import { useEffect, useState } from "react";

interface GameHUDProps {
  empireName: string;
  onToggleSprawlView: () => void;
  onToggleVPRView: () => void;
}

type MenuCategory = "mining" | "exploration" | "mothership" | "colony";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  action: () => void;
}

const menuItems: Record<MenuCategory, MenuItem[]> = {
  mining: [
    {
      id: "mineral-processing",
      name: "Mineral Processing",
      description: "Process raw minerals and manage resource extraction",
      action: () => {},
    },
    {
      id: "mining-fleet",
      name: "Mining Fleet",
      description: "Manage mining ships and automated resource collection",
      action: () => {},
    },
    {
      id: "resource-storage",
      name: "Resource Storage",
      description: "Monitor and manage resource stockpiles",
      action: () => {},
    },
  ],
  exploration: [
    {
      id: "recon-hub",
      name: "Recon Hub",
      description: "Coordinate exploration missions and scout ships",
      action: () => {},
    },
    {
      id: "galaxy-map",
      name: "Galaxy Map",
      description: "View and analyze discovered star systems",
      action: () => {},
    },
    {
      id: "anomaly-scanner",
      name: "Anomaly Scanner",
      description: "Track and investigate spatial anomalies",
      action: () => {},
    },
  ],
  mothership: [
    {
      id: "ship-hanger",
      name: "Ship Hangar",
      description: "Build and manage your fleet of ships",
      action: () => {},
    },
    {
      id: "radar-system",
      name: "Radar System",
      description: "Monitor system-wide activity and threats",
      action: () => {},
    },
    {
      id: "defense-grid",
      name: "Defense Grid",
      description: "Manage defensive systems and fortifications",
      action: () => {},
    },
  ],
  colony: [
    {
      id: "population",
      name: "Population",
      description: "Manage colonists and population growth",
      action: () => {},
    },
    {
      id: "infrastructure",
      name: "Infrastructure",
      description: "Build and upgrade colony facilities",
      action: () => {},
    },
    {
      id: "trade-hub",
      name: "Trade Hub",
      description: "Establish and monitor trade routes",
      action: () => {},
    },
  ],
};

const categoryColors: Record<
  MenuCategory,
  { bg: string; border: string; hover: string }
> = {
  mining: {
    bg: "from-amber-950/80 to-amber-900/80",
    border: "border-amber-700/50",
    hover: "hover:bg-amber-800/30",
  },
  exploration: {
    bg: "from-teal-950/80 to-teal-900/80",
    border: "border-teal-700/50",
    hover: "hover:bg-teal-800/30",
  },
  mothership: {
    bg: "from-cyan-950/80 to-cyan-900/80",
    border: "border-cyan-700/50",
    hover: "hover:bg-cyan-800/30",
  },
  colony: {
    bg: "from-purple-950/80 to-purple-900/80",
    border: "border-purple-700/50",
    hover: "hover:bg-purple-800/30",
  },
};

const categoryIcons = {
  mining: Database,
  exploration: Radar,
  mothership: Rocket,
  colony: Map,
};

export function GameHUD({
  empireName,
  onToggleSprawlView,
  onToggleVPRView,
}: GameHUDProps) {
  const [activeCategory, setActiveCategory] = useState<MenuCategory | null>(
    null,
  );
  const [showTechTree, setShowTechTree] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Sprawl View toggle
      if ((e.key === "s" || e.key === "S") && !e.ctrlKey && !e.metaKey) {
        onToggleSprawlView();
        return;
      }

      if ((e.key === "v" || e.key === "V") && !e.ctrlKey && !e.metaKey) {
        onToggleVPRView();
        return;
      }

      // Category shortcuts
      const categoryKeys: Record<string, MenuCategory> = {
        m: "mining",
        e: "exploration",
        h: "mothership",
        c: "colony",
      };

      const key = e.key.toLowerCase();
      if (categoryKeys[key]) {
        setActiveCategory((prev) =>
          prev === categoryKeys[key] ? null : categoryKeys[key],
        );
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [onToggleSprawlView, onToggleVPRView]);

  return (
    <div className="absolute top-20 left-6 space-y-2 w-80 max-h-[calc(100vh-8rem)] flex flex-col">
      {/* Sprawl View Button */}
      <button
        onClick={onToggleSprawlView}
        className="w-full px-4 py-3 bg-gradient-to-r from-indigo-950/80 to-indigo-900/80 rounded-lg border border-indigo-700/50 backdrop-blur-sm text-left group transition-all hover:bg-indigo-800/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Map className="w-5 h-5 text-indigo-400" />
            <span className="text-indigo-100 font-medium">
              {empireName} Map
            </span>
          </div>
          <span className="text-indigo-400 text-sm opacity-60 group-hover:opacity-100 transition-opacity">
            Press S
          </span>
        </div>
      </button>

      {/* VPR View Button */}
      <button
        onClick={onToggleVPRView}
        className="w-full px-4 py-3 bg-gradient-to-r from-violet-950/80 to-violet-900/80 rounded-lg border border-violet-700/50 backdrop-blur-sm text-left group transition-all hover:bg-violet-800/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Crown className="w-5 h-5 text-violet-400" />
            <span className="text-violet-100 font-medium">System Progress</span>
          </div>
          <span className="text-violet-400 text-sm opacity-60 group-hover:opacity-100 transition-opacity">
            Press V
          </span>
        </div>
      </button>

      {/* Tech Tree Button */}
      <button
        onClick={() => setShowTechTree(!showTechTree)}
        className="w-full px-4 py-3 bg-gradient-to-r from-violet-950/80 to-violet-900/80 rounded-lg border border-violet-700/50 backdrop-blur-sm text-left group transition-all hover:bg-violet-800/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className="w-5 h-5 text-violet-400" />
            <span className="text-violet-100 font-medium">Tech Tree</span>
          </div>
          <span className="text-violet-400 text-sm opacity-60 group-hover:opacity-100 transition-opacity">
            Press T
          </span>
        </div>
      </button>

      {/* Menu Categories */}
      <div className="space-y-2 overflow-y-auto custom-scrollbar">
        {(Object.keys(menuItems) as MenuCategory[]).map((category) => {
          const Icon = categoryIcons[category];
          const colors = categoryColors[category];
          const isActive = activeCategory === category;

          return (
            <div key={category} className="space-y-1">
              <button
                onClick={() => setActiveCategory(isActive ? null : category)}
                className={`w-full px-4 py-3 bg-gradient-to-r ${colors.bg} rounded-lg ${colors.border} backdrop-blur-sm ${colors.hover} transition-all group`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 text-gray-300" />
                    <span className="text-gray-100 font-medium capitalize group-hover:text-white">
                      {category}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-sm opacity-60 group-hover:opacity-100">
                      {category === "mining"
                        ? "M"
                        : category === "exploration"
                          ? "E"
                          : category === "mothership"
                            ? "H"
                            : "C"}
                    </span>
                    {isActive ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </button>

              {/* Submenu Items */}
              {isActive && (
                <div className="pl-4 space-y-1">
                  {menuItems[category].map((item) => (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className={`w-full px-4 py-3 rounded-lg text-left group ${colors.hover} transition-colors`}
                    >
                      <div className="text-gray-200 font-medium mb-0.5">
                        {item.name}
                      </div>
                      <div className="text-gray-400 text-sm group-hover:text-gray-300">
                        {item.description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Settings Button */}
      <button
        onClick={() => setShowSettings(true)}
        className="w-full px-4 py-3 bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-lg border border-gray-600/50 backdrop-blur-sm text-left group transition-all hover:bg-gray-700/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="w-5 h-5 text-gray-400" />
            <span className="text-gray-300 font-medium">Settings</span>
          </div>
        </div>
      </button>
      {/* Tech Tree Modal */}
      {showTechTree && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="max-w-4xl w-full mx-4">
            <div className="relative">
              <button
                onClick={() => setShowTechTree(false)}
                className="absolute -top-2 -right-2 p-1 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <TechTree />
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="max-w-lg w-full mx-4 bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-gray-700 rounded-full"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.4);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.6);
        }
      `}</style>
    </div>
  );
}
