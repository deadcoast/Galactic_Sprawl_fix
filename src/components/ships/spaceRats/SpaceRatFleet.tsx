import React from 'react';
import { Skull, AlertTriangle } from 'lucide-react';
import { FactionFleet } from '../../factions/FactionFleet';
import { useAdaptiveAI } from '../../../hooks/useAdaptiveAI';

interface SpaceRatFleetProps {
  fleetId: string;
  ships: {
    id: string;
    type: string;
    status: 'idle' | 'engaging' | 'retreating' | 'damaged';
  }[];
  onFleetCommand?: (command: string, targetId?: string) => void;
}

export function SpaceRatFleet({ fleetId, ships, onFleetCommand }: SpaceRatFleetProps) {
  const adaptiveAI = useAdaptiveAI(fleetId, 'spaceRats');

  return (
    <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <Skull className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">Space Rat Fleet</h3>
            <div className="text-sm text-gray-400">
              {ships.length} Ships • {ships.filter(s => s.status === 'engaging').length} Engaging
            </div>
          </div>
        </div>
      </div>

      <FactionFleet
        fleetId={fleetId}
        factionId="spaceRats"
        onFleetCommand={onFleetCommand}
      />

      {/* Space Rats Specific Behaviors */}
      <div className="mt-4 space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Aggression Level</span>
            <span className="text-red-400">
              {Math.round(adaptiveAI.performance.damageEfficiency * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full"
              style={{
                width: `${adaptiveAI.performance.damageEfficiency * 100}%`
              }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Plunder Efficiency</span>
            <span className="text-red-400">
              {Math.round(adaptiveAI.performance.objectiveCompletion * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full"
              style={{
                width: `${adaptiveAI.performance.objectiveCompletion * 100}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* Warnings */}
      {ships.some(s => s.status === 'damaged') && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-700/30 rounded-lg flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-200">
            Ships damaged! Consider tactical retreat to preserve plunder.
          </span>
        </div>
      )}
    </div>
  );
}