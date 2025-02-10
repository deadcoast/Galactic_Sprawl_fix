import React from 'react';
import { Settings, AlertTriangle, Truck, ArrowRight } from 'lucide-react';

interface Resource {
  id: string;
  name: string;
  type: 'mineral' | 'gas' | 'exotic';
  abundance: number;
  distance: number;
  extractionRate: number;
  depletion: number;
  priority: number;
  thresholds: {
    min: number;
    max: number;
  };
}

interface MiningControlsProps {
  resource: Resource;
}

export function MiningControls({ resource }: MiningControlsProps) {
  const getTypeColor = (type: Resource['type']) => {
    switch (type) {
      case 'mineral': return 'cyan';
      case 'gas': return 'purple';
      case 'exotic': return 'amber';
      default: return 'blue';
    }
  };

  const color = getTypeColor(resource.type);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">{resource.name}</h2>
        <div className="flex items-center text-sm text-gray-400">
          <span className="capitalize">{resource.type}</span>
          <span className="mx-2">•</span>
          <span>{resource.distance}ly away</span>
        </div>
      </div>

      {/* Priority Controls */}
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-white">Mining Priority</h3>
          <div className="px-2 py-1 bg-gray-700 rounded text-sm text-gray-300">
            Level {resource.priority}
          </div>
        </div>
        <div className="space-y-2">
          <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors">
            Increase Priority
          </button>
          <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors">
            Decrease Priority
          </button>
        </div>
      </div>

      {/* Threshold Controls */}
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-white">Storage Thresholds</h3>
          <Settings className="w-4 h-4 text-gray-400" />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Minimum Storage
            </label>
            <input
              type="range"
              min="0"
              max={resource.thresholds.max}
              value={resource.thresholds.min}
              className="w-full"
              onChange={() => {}}
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>0</span>
              <span>{resource.thresholds.min.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Maximum Storage
            </label>
            <input
              type="range"
              min={resource.thresholds.min}
              max={20000}
              value={resource.thresholds.max}
              className="w-full"
              onChange={() => {}}
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>{resource.thresholds.min.toLocaleString()}</span>
              <span>{resource.thresholds.max.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status & Warnings */}
      {resource.depletion > 0.5 && (
        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 mb-4">
          <div className="flex items-center text-yellow-500 mb-2">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span className="font-medium">Resource Depletion Warning</span>
          </div>
          <p className="text-sm text-yellow-200/70">
            This resource node is showing signs of depletion. Consider reducing extraction rate or finding alternative sources.
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-auto">
        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <span>Quick Actions</span>
          <ArrowRight className="w-4 h-4" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className={`px-4 py-2 bg-${color}-600/20 hover:bg-${color}-600/30 border border-${color}-500/30 rounded-lg text-${color}-200 text-sm transition-colors`}>
            Dispatch Mining Ship
          </button>
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 text-sm transition-colors">
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );
}