import { AlertTriangle, Shield, Sword, Zap } from 'lucide-react';
import type { FactionId } from '../../types/ships/FactionTypes';

interface AIBehavior {
  id: string;
  type: 'aggressive' | 'defensive' | 'hit-and-run';
  priority: 'attack' | 'defend' | 'support';
  conditions: {
    healthThreshold: number;
    shieldThreshold: number;
    targetDistance: number;
    allySupport: boolean;
  };
}

interface FactionAIProps {
  faction: FactionId;
  behavior: AIBehavior;
  fleetStrength: number;
  threatLevel: number;
  onUpdateBehavior: (newBehavior: AIBehavior) => void;
}

export function FactionAI({
  faction,
  behavior,
  fleetStrength,
  threatLevel,
  onUpdateBehavior,
}: FactionAIProps) {
  const getFactionColor = (faction: FactionId) => {
    switch (faction) {
      case 'space-rats':
        return 'red';
      case 'lost-nova':
        return 'violet';
      case 'equator-horizon':
        return 'amber';
      default:
        return 'blue';
    }
  };

  const color = getFactionColor(faction);

  return (
    <div className={`bg-${color}-900/20 border border-${color}-700/30 rounded-lg p-6`}>
      {/* AI Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">
            {faction
              .split('-')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')}{' '}
            AI
          </h3>
          <div className="text-sm text-gray-400">Combat Behavior Control</div>
        </div>
        <div className={`rounded-full px-3 py-1 text-sm bg-${color}-500/20 text-${color}-400`}>
          {behavior.type.charAt(0).toUpperCase() + behavior.type.slice(1)}
        </div>
      </div>

      {/* Combat Metrics */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <div className="mb-1 text-sm text-gray-400">Fleet Strength</div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-white">{Math.round(fleetStrength * 100)}</span>
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>
        <div>
          <div className="mb-1 text-sm text-gray-400">Threat Level</div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-white">{Math.round(threatLevel * 100)}</span>
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>
      </div>

      {/* Behavior Conditions */}
      <div className="mb-6 space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-400">Health Threshold</span>
            <span className={`text-${color}-400`}>{behavior.conditions.healthThreshold}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className={`h-full bg-${color}-500 rounded-full`}
              style={{ width: `${behavior.conditions.healthThreshold}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-400">Shield Threshold</span>
            <span className={`text-${color}-400`}>{behavior.conditions.shieldThreshold}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className={`h-full bg-${color}-500 rounded-full`}
              style={{ width: `${behavior.conditions.shieldThreshold}%` }}
            />
          </div>
        </div>
      </div>

      {/* Priority Controls */}
      <div className="mb-6 grid grid-cols-3 gap-2">
        <button
          onClick={() => onUpdateBehavior({ ...behavior, priority: 'attack' })}
          className={`flex flex-col items-center justify-center space-y-2 rounded-lg p-3 ${
            behavior.priority === 'attack'
              ? `bg-${color}-500/20 border border-${color}-500/30`
              : 'bg-gray-700/50 hover:bg-gray-600/50'
          }`}
        >
          <Sword className="h-5 w-5" />
          <span className="text-sm">Attack</span>
        </button>
        <button
          onClick={() => onUpdateBehavior({ ...behavior, priority: 'defend' })}
          className={`flex flex-col items-center justify-center space-y-2 rounded-lg p-3 ${
            behavior.priority === 'defend'
              ? `bg-${color}-500/20 border border-${color}-500/30`
              : 'bg-gray-700/50 hover:bg-gray-600/50'
          }`}
        >
          <Shield className="h-5 w-5" />
          <span className="text-sm">Defend</span>
        </button>
        <button
          onClick={() => onUpdateBehavior({ ...behavior, priority: 'support' })}
          className={`flex flex-col items-center justify-center space-y-2 rounded-lg p-3 ${
            behavior.priority === 'support'
              ? `bg-${color}-500/20 border border-${color}-500/30`
              : 'bg-gray-700/50 hover:bg-gray-600/50'
          }`}
        >
          <Zap className="h-5 w-5" />
          <span className="text-sm">Support</span>
        </button>
      </div>

      {/* Behavior warnings */}
      {fleetStrength < 0.3 && (
        <div className="flex items-start space-x-2 rounded-lg border border-red-700/30 bg-red-900/20 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
          <span className="text-sm text-red-200">
            Fleet strength critical. Consider tactical retreat.
          </span>
        </div>
      )}
    </div>
  );
}
