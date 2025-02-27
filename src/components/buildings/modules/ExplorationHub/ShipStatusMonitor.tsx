import React, { useEffect, useState } from 'react';
import { Activity, Battery, Shield, Target, Zap } from 'lucide-react';
import { useGame } from '../../../../contexts/GameContext';

interface ShipStatusMonitorProps {
  shipIds: string[];
  onSelectShip?: (shipId: string) => void;
}

interface ShipStatus {
  health: number;
  energy: number;
  shield: number;
  stealth: number;
  experience: number;
  currentTask?: string;
  lastUpdate: number;
}

export function ShipStatusMonitor({ shipIds, onSelectShip }: ShipStatusMonitorProps) {
  const [shipStatuses, setShipStatuses] = useState<Record<string, ShipStatus>>({});
  const context = useGame();
  if (!context) {
    throw new Error('ShipStatusMonitor must be used within a GameProvider');
  }
  const { state } = context;
  const ships = shipIds
    .map(id => state.exploration.ships[id])
    .filter((ship): ship is NonNullable<typeof ship> => ship !== undefined);

  // Update ship statuses
  useEffect(() => {
    const interval = setInterval(() => {
      const newStatuses: Record<string, ShipStatus> = {};
      
      ships.forEach(ship => {
        // Calculate real-time status values
        const timeSinceLastUpdate = Date.now() - (shipStatuses[ship.id]?.lastUpdate || 0);
        const energyDrain = ship.currentTask ? 0.001 * timeSinceLastUpdate : 0;
        const shieldRecharge = !ship.currentTask ? 0.002 * timeSinceLastUpdate : 0;
        
        newStatuses[ship.id] = {
          health: Math.max(0, Math.min(100, (shipStatuses[ship.id]?.health || 100))),
          energy: Math.max(0, Math.min(100, (shipStatuses[ship.id]?.energy || 100) - energyDrain)),
          shield: Math.max(0, Math.min(100, (shipStatuses[ship.id]?.shield || 100) + shieldRecharge)),
          stealth: calculateStealthLevel(ship),
          experience: ship.experience,
          currentTask: ship.currentTask,
          lastUpdate: Date.now(),
        };
      });

      setShipStatuses(newStatuses);
    }, 1000);

    return () => clearInterval(interval);
  }, [ships, shipStatuses]);

  const calculateStealthLevel = (ship: NonNullable<typeof state.exploration.ships[string]>): number => {
    // Calculate stealth based on ship status and stealthActive flag
    const baseStealthLevel = ship.stealthActive ? 80 : 50;
    const activityPenalty = ship.status === 'investigating' ? 20 : 0;
    return Math.max(0, Math.min(100, baseStealthLevel - activityPenalty));
  };

  const getStatusColor = (value: number): string => {
    if (value > 66) return 'text-emerald-400';
    if (value > 33) return 'text-amber-400';
    return 'text-red-400';
  };

  const getTaskColor = (status?: 'idle' | 'scanning' | 'investigating' | 'returning'): string => {
    if (!status) return 'text-gray-400';
    switch (status) {
      case 'scanning':
        return 'text-blue-400';
      case 'investigating':
        return 'text-amber-400';
      case 'returning':
        return 'text-violet-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-4 p-4">
      {ships.map(ship => {
        const status = shipStatuses[ship.id];
        if (!status) return null;

        return (
          <div
            key={ship.id}
            className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer"
            onClick={() => onSelectShip?.(ship.id)}
          >
            {/* Ship Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Activity className={getTaskColor(ship.status)} />
                <span className="text-white font-medium">{ship.id}</span>
              </div>
              <span className={`text-sm ${getTaskColor(ship.status)}`}>
                {ship.status || 'Idle'}
              </span>
            </div>

            {/* Status Bars */}
            <div className="space-y-2">
              {/* Health */}
              <div className="flex items-center space-x-2">
                <Shield className={`w-4 h-4 ${getStatusColor(status.health)}`} />
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getStatusColor(status.health)} transition-all duration-300`}
                    style={{ width: `${status.health}%` }}
                  />
                </div>
                <span className={`text-xs ${getStatusColor(status.health)}`}>
                  {Math.round(status.health)}%
                </span>
              </div>

              {/* Energy */}
              <div className="flex items-center space-x-2">
                <Battery className={`w-4 h-4 ${getStatusColor(status.energy)}`} />
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getStatusColor(status.energy)} transition-all duration-300`}
                    style={{ width: `${status.energy}%` }}
                  />
                </div>
                <span className={`text-xs ${getStatusColor(status.energy)}`}>
                  {Math.round(status.energy)}%
                </span>
              </div>

              {/* Shield */}
              <div className="flex items-center space-x-2">
                <Shield className={`w-4 h-4 ${getStatusColor(status.shield)}`} />
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getStatusColor(status.shield)} transition-all duration-300`}
                    style={{ width: `${status.shield}%` }}
                  />
                </div>
                <span className={`text-xs ${getStatusColor(status.shield)}`}>
                  {Math.round(status.shield)}%
                </span>
              </div>

              {/* Stealth */}
              <div className="flex items-center space-x-2">
                <Target className={`w-4 h-4 ${getStatusColor(status.stealth)}`} />
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getStatusColor(status.stealth)} transition-all duration-300`}
                    style={{ width: `${status.stealth}%` }}
                  />
                </div>
                <span className={`text-xs ${getStatusColor(status.stealth)}`}>
                  {Math.round(status.stealth)}%
                </span>
              </div>

              {/* Experience */}
              <div className="flex items-center space-x-2">
                <Zap className={`w-4 h-4 ${getStatusColor(status.experience)}`} />
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getStatusColor(status.experience)} transition-all duration-300`}
                    style={{ width: `${status.experience}%` }}
                  />
                </div>
                <span className={`text-xs ${getStatusColor(status.experience)}`}>
                  {Math.round(status.experience)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 