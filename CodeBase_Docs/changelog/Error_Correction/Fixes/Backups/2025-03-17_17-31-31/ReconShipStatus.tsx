import * as React from "react";
import { ChevronRight, Rocket } from 'lucide-react';

interface ReconShip {
  id: string;
  name: string;
  status: 'idle' | 'scanning' | 'investigating' | 'returning';
  targetSector?: string;
  experience: number;
  specialization: 'mapping' | 'anomaly' | 'resource';
  efficiency: number;
}

interface ReconShipStatusProps {
  ships: ReconShip[];
}

export function ReconShipStatus({ ships }: ReconShipStatusProps) {
  return (
    <div className="mt-6 rounded-lg bg-gray-800/50 p-4">
      <h3 className="mb-3 text-sm font-medium text-gray-300">Active Recon Ships</h3>
      <div className="space-y-2">
        {ships.map(ship => (
          <div
            key={ship.id}
            className="flex items-center justify-between rounded-lg bg-gray-800 p-3"
          >
            <div className="flex items-center space-x-3">
              <Rocket
                className={`h-5 w-5 ${
                  ship.status === 'scanning'
                    ? 'text-teal-400'
                    : ship.status === 'investigating'
                      ? 'text-yellow-400'
                      : ship.status === 'returning'
                        ? 'text-blue-400'
                        : 'text-gray-400'
                }`}
              />
              <div>
                <div className="text-sm font-medium text-gray-200">{ship.name}</div>
                <div className="text-xs text-gray-400">
                  {ship.status.charAt(0).toUpperCase() + ship.status.slice(1)} • XP:{' '}
                  {ship.experience.toLocaleString()}
                </div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-500" />
          </div>
        ))}
      </div>
    </div>
  );
}
