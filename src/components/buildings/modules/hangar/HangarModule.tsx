import { useEffect } from 'react';
import { BaseModule } from '../../../../types/buildings/ModuleTypes';
import { Rocket, ShieldAlert, Wrench } from 'lucide-react';
import { automationManager } from '../../../../managers/game/AutomationManager';
import { hangarRules } from '../../../../config/automation/hangarRules';

interface HangarModuleProps {
  module: BaseModule;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onOpenShipyard?: () => void;
  onOpenRepairBay?: () => void;
  stats?: {
    shipsInProduction: number;
    shipsNeedingRepair: number;
    maxCapacity: number;
    currentCapacity: number;
  };
}

export function HangarModule({
  module,
  onActivate,
  onDeactivate,
  onOpenShipyard,
  onOpenRepairBay,
  stats = {
    shipsInProduction: 0,
    shipsNeedingRepair: 0,
    maxCapacity: 10,
    currentCapacity: 0,
  },
}: HangarModuleProps) {
  // Register automation rules on mount
  useEffect(() => {
    // Register each automation rule
    hangarRules.forEach(rule => {
      automationManager.registerRule(rule);
    });

    // Cleanup on unmount
    return () => {
      hangarRules.forEach(rule => {
        automationManager.removeRule(rule.id);
      });
    };
  }, []);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-900/50 rounded-lg">
            <Rocket className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">{module.name}</h3>
            <div className="text-sm text-gray-400">Level {module.level}</div>
          </div>
        </div>
        <button
          onClick={module.isActive ? onDeactivate : onActivate}
          className={`px-4 py-2 rounded-lg text-sm ${
            module.isActive
              ? 'bg-red-900/50 text-red-400 hover:bg-red-900/70'
              : 'bg-indigo-900/50 text-indigo-400 hover:bg-indigo-900/70'
          }`}
        >
          {module.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>

      {/* Hangar Status */}
      <div className="space-y-4">
        <div className="p-4 bg-gray-900/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-400">Hangar Capacity</div>
            <div className="text-sm text-gray-300">
              {stats.currentCapacity} / {stats.maxCapacity}
            </div>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all"
              style={{
                width: `${(stats.currentCapacity / stats.maxCapacity) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onOpenShipyard}
            disabled={!module.isActive}
            className="p-4 bg-gray-900/50 hover:bg-gray-900/70 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg group"
          >
            <div className="flex items-center space-x-3 mb-2">
              <Wrench className="w-5 h-5 text-indigo-400" />
              <div className="text-sm font-medium text-white">Shipyard</div>
            </div>
            <div className="text-xs text-gray-400">
              {stats.shipsInProduction} ships in production
            </div>
          </button>

          <button
            onClick={onOpenRepairBay}
            disabled={!module.isActive}
            className="p-4 bg-gray-900/50 hover:bg-gray-900/70 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg group"
          >
            <div className="flex items-center space-x-3 mb-2">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
              <div className="text-sm font-medium text-white">Repair Bay</div>
            </div>
            <div className="text-xs text-gray-400">
              {stats.shipsNeedingRepair} ships need repair
            </div>
          </button>
        </div>

        {/* Production Stats */}
        <div className="p-4 bg-gray-900/50 rounded-lg">
          <div className="text-sm text-gray-400 mb-2">Production Speed</div>
          <div className="text-2xl font-bold text-white">{100 + module.level * 25}%</div>
        </div>
      </div>
    </div>
  );
}
