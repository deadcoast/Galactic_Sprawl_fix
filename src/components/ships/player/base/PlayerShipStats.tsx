import * as React from "react";
import { Activity, Crosshair, Shield, Zap } from 'lucide-react';
import type { CommonShipDisplayStats } from '../../../../types/ships/CommonShipTypes';

interface ShipStatsProps {
  stats: CommonShipDisplayStats;
}

export function ShipStats({ stats }: ShipStatsProps) {
  return (
    <div className="rounded-lg bg-gray-800 p-6">
      <h3 className="mb-6 text-lg font-medium text-white">Ship Statistics</h3>

      {/* Weapons */}
      <div className="mb-6">
        <div className="mb-4 flex items-center space-x-2">
          <Crosshair className="h-5 w-5 text-red-400" />
          <h4 className="text-sm font-medium text-gray-300">Weapons</h4>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="mb-1 text-sm text-gray-400">Damage</div>
            <div className="text-lg font-medium text-white">{stats.weapons.damage}</div>
          </div>
          <div>
            <div className="mb-1 text-sm text-gray-400">Range</div>
            <div className="text-lg font-medium text-white">{stats.weapons.range}ly</div>
          </div>
          <div>
            <div className="mb-1 text-sm text-gray-400">Accuracy</div>
            <div className="text-lg font-medium text-white">{stats.weapons.accuracy}%</div>
          </div>
        </div>
      </div>

      {/* Defense */}
      <div className="mb-6">
        <div className="mb-4 flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-400" />
          <h4 className="text-sm font-medium text-gray-300">Defense</h4>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="mb-1 text-sm text-gray-400">Hull</div>
            <div className="text-lg font-medium text-white">{stats.defense.hull}</div>
          </div>
          <div>
            <div className="mb-1 text-sm text-gray-400">Shield</div>
            <div className="text-lg font-medium text-white">{stats.defense.shield}</div>
          </div>
          <div>
            <div className="mb-1 text-sm text-gray-400">Armor</div>
            <div className="text-lg font-medium text-white">{stats.defense.armor}</div>
          </div>
        </div>
      </div>

      {/* Mobility */}
      <div className="mb-6">
        <div className="mb-4 flex items-center space-x-2">
          <Activity className="h-5 w-5 text-green-400" />
          <h4 className="text-sm font-medium text-gray-300">Mobility</h4>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="mb-1 text-sm text-gray-400">Speed</div>
            <div className="text-lg font-medium text-white">{stats.mobility.speed}</div>
          </div>
          <div>
            <div className="mb-1 text-sm text-gray-400">Agility</div>
            <div className="text-lg font-medium text-white">{stats.mobility.agility}</div>
          </div>
          <div>
            <div className="mb-1 text-sm text-gray-400">Jump Range</div>
            <div className="text-lg font-medium text-white">{stats.mobility.jumpRange}ly</div>
          </div>
        </div>
      </div>

      {/* Systems */}
      <div>
        <div className="mb-4 flex items-center space-x-2">
          <Zap className="h-5 w-5 text-yellow-400" />
          <h4 className="text-sm font-medium text-gray-300">Systems</h4>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="mb-1 text-sm text-gray-400">Power</div>
            <div className="text-lg font-medium text-white">{stats.systems.power}</div>
          </div>
          <div>
            <div className="mb-1 text-sm text-gray-400">Radar</div>
            <div className="text-lg font-medium text-white">{stats.systems.radar}</div>
          </div>
          <div>
            <div className="mb-1 text-sm text-gray-400">Efficiency</div>
            <div className="text-lg font-medium text-white">{stats.systems.efficiency}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
