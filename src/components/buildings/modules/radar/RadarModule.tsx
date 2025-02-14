import { BaseModule } from '../../../../types/buildings/ModuleTypes';
import { Radar } from 'lucide-react';

interface RadarModuleProps {
  module: BaseModule;
  onActivate?: () => void;
  onDeactivate?: () => void;
}

export function RadarModule({ module, onActivate, onDeactivate }: RadarModuleProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-900/50 rounded-lg">
            <Radar className="w-6 h-6 text-blue-400" />
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
              : 'bg-blue-900/50 text-blue-400 hover:bg-blue-900/70'
          }`}
        >
          {module.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>

      {/* Radar Status */}
      <div className="space-y-4">
        <div className="p-4 bg-gray-900/50 rounded-lg">
          <div className="text-sm text-gray-400 mb-2">Scan Range</div>
          <div className="text-2xl font-bold text-white">{1000 * module.level} units</div>
        </div>

        <div className="p-4 bg-gray-900/50 rounded-lg">
          <div className="text-sm text-gray-400 mb-2">Power Usage</div>
          <div className="text-2xl font-bold text-white">{50 * module.level} units/s</div>
        </div>

        <div className="p-4 bg-gray-900/50 rounded-lg">
          <div className="text-sm text-gray-400 mb-2">Detection Accuracy</div>
          <div className="text-2xl font-bold text-white">{85 + module.level * 5}%</div>
        </div>
      </div>
    </div>
  );
}
