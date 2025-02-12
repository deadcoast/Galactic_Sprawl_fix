import React from 'react';
import { Radar, Map, Eye, AlertTriangle, Rocket, Database } from 'lucide-react';

interface ReconShip {
  id: string;
  name: string;
  type: 'AC27G' | 'PathFinder' | 'VoidSeeker';
  status: 'idle' | 'scanning' | 'investigating' | 'returning';
  targetSector?: string;
  experience: number;
  specialization: 'mapping' | 'anomaly' | 'resource';
  efficiency: number;
  stealth: {
    active: boolean;
    level: number;
    cooldown: number;
  };
  sensors: {
    range: number;
    accuracy: number;
    anomalyDetection: number;
  };
  discoveries: {
    mappedSectors: number;
    anomaliesFound: number;
    resourcesLocated: number;
  };
  alerts?: string[];
}

interface ReconShipControlProps {
  ship: ReconShip;
  onToggleStealth: () => void;
  onSetPriority: (type: 'mapping' | 'anomaly' | 'resource') => void;
  onRecall: () => void;
}

export function ReconShipControl({ ship, onToggleStealth, onSetPriority, onRecall }: ReconShipControlProps) {
  const getShipTypeColor = (type: string) => {
    switch (type) {
      case 'AC27G': return 'teal';
      case 'PathFinder': return 'cyan';
      case 'VoidSeeker': return 'indigo';
      default: return 'blue';
    }
  };

  const color = getShipTypeColor(ship.type);

  return (
    <div className={`bg-${color}-900/20 border border-${color}-700/30 rounded-lg p-6`}>
      {/* Ship Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-white">{ship.name}</h3>
          <div className="flex items-center text-sm text-gray-400">
            <span>{ship.type}</span>
            <span className="mx-2">•</span>
            <span>XP: {ship.experience.toLocaleString()}</span>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm ${
          ship.status === 'scanning' ? 'bg-teal-900/50 text-teal-400' :
          ship.status === 'investigating' ? 'bg-yellow-900/50 text-yellow-400' :
          ship.status === 'returning' ? 'bg-blue-900/50 text-blue-400' :
          'bg-gray-700 text-gray-400'
        }`}>
          {ship.status.charAt(0).toUpperCase() + ship.status.slice(1)}
        </div>
      </div>

      {/* Sensor Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <div className="text-sm text-gray-400 mb-1">Range</div>
          <div className="text-lg font-medium text-white">{ship.sensors.range}ly</div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Accuracy</div>
          <div className="text-lg font-medium text-white">{ship.sensors.accuracy}%</div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Detection</div>
          <div className="text-lg font-medium text-white">{ship.sensors.anomalyDetection}%</div>
        </div>
      </div>

      {/* Stealth System */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-300">Stealth System</h4>
          <div className={`px-2 py-1 rounded text-xs ${
            ship.stealth.active ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400'
          }`}>
            {ship.stealth.active ? 'Active' : 'Inactive'}
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Stealth Level</span>
              <span className={`text-${color}-400`}>{ship.stealth.level}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full bg-${color}-500 rounded-full transition-all`}
                style={{ width: `${ship.stealth.level}%` }}
              />
            </div>
          </div>
          <button
            onClick={onToggleStealth}
            className={`w-full px-4 py-2 rounded-lg text-sm flex items-center justify-center space-x-2 ${
              ship.stealth.active
                ? `bg-${color}-500/20 hover:bg-${color}-500/30 text-${color}-200`
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{ship.stealth.active ? 'Deactivate Stealth' : 'Activate Stealth'}</span>
          </button>
        </div>
      </div>

      {/* Discovery Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 bg-gray-700/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Map className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Mapped</span>
          </div>
          <div className="text-lg font-medium text-white">{ship.discoveries.mappedSectors}</div>
        </div>
        <div className="p-3 bg-gray-700/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Radar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Anomalies</span>
          </div>
          <div className="text-lg font-medium text-white">{ship.discoveries.anomaliesFound}</div>
        </div>
        <div className="p-3 bg-gray-700/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Database className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Resources</span>
          </div>
          <div className="text-lg font-medium text-white">{ship.discoveries.resourcesLocated}</div>
        </div>
      </div>

      {/* Priority Controls */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Mission Priority</h4>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onSetPriority('mapping')}
            className={`px-3 py-2 rounded-lg text-sm flex items-center justify-center space-x-2 ${
              ship.specialization === 'mapping'
                ? `bg-${color}-600 text-white`
                : `bg-gray-700 text-gray-400 hover:bg-${color}-900/30`
            }`}
          >
            <Map className="w-4 h-4" />
            <span>Mapping</span>
          </button>
          <button
            onClick={() => onSetPriority('anomaly')}
            className={`px-3 py-2 rounded-lg text-sm flex items-center justify-center space-x-2 ${
              ship.specialization === 'anomaly'
                ? `bg-${color}-600 text-white`
                : `bg-gray-700 text-gray-400 hover:bg-${color}-900/30`
            }`}
          >
            <Radar className="w-4 h-4" />
            <span>Anomalies</span>
          </button>
          <button
            onClick={() => onSetPriority('resource')}
            className={`px-3 py-2 rounded-lg text-sm flex items-center justify-center space-x-2 ${
              ship.specialization === 'resource'
                ? `bg-${color}-600 text-white`
                : `bg-gray-700 text-gray-400 hover:bg-${color}-900/30`
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Resources</span>
          </button>
        </div>
      </div>

      {/* Recall Button */}
      <button
        onClick={onRecall}
        disabled={ship.status === 'idle'}
        className={`w-full px-4 py-3 rounded-lg flex items-center justify-center space-x-2 ${
          ship.status === 'idle'
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : `bg-${color}-600 hover:bg-${color}-700 text-white`
        }`}
      >
        <Rocket className="w-5 h-5" />
        <span>Recall Ship</span>
      </button>

      {/* Alerts */}
      {ship.alerts && ship.alerts.length > 0 && (
        <div className="mt-4 space-y-2">
          {ship.alerts.map((alert, index) => (
            <div
              key={index}
              className="flex items-start space-x-2 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg"
            >
              <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-yellow-200">{alert}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}