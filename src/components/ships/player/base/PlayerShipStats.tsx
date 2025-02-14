import type { CommonShipDisplayStats } from '../../../../types/ships/CommonShipTypes';
import { Activity, Crosshair, Shield, Zap } from 'lucide-react';

interface ShipStatsProps {
  stats: CommonShipDisplayStats;
}

export function ShipStats({ stats }: ShipStatsProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-medium text-white mb-6">Ship Statistics</h3>

      {/* Weapons */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Crosshair className="w-5 h-5 text-red-400" />
          <h4 className="text-sm font-medium text-gray-300">Weapons</h4>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-400 mb-1">Damage</div>
            <div className="text-lg font-medium text-white">{stats.weapons.damage}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Range</div>
            <div className="text-lg font-medium text-white">{stats.weapons.range}ly</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Accuracy</div>
            <div className="text-lg font-medium text-white">{stats.weapons.accuracy}%</div>
          </div>
        </div>
      </div>

      {/* Defense */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="w-5 h-5 text-blue-400" />
          <h4 className="text-sm font-medium text-gray-300">Defense</h4>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-400 mb-1">Hull</div>
            <div className="text-lg font-medium text-white">{stats.defense.hull}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Shield</div>
            <div className="text-lg font-medium text-white">{stats.defense.shield}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Armor</div>
            <div className="text-lg font-medium text-white">{stats.defense.armor}</div>
          </div>
        </div>
      </div>

      {/* Mobility */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="w-5 h-5 text-green-400" />
          <h4 className="text-sm font-medium text-gray-300">Mobility</h4>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-400 mb-1">Speed</div>
            <div className="text-lg font-medium text-white">{stats.mobility.speed}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Agility</div>
            <div className="text-lg font-medium text-white">{stats.mobility.agility}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Jump Range</div>
            <div className="text-lg font-medium text-white">{stats.mobility.jumpRange}ly</div>
          </div>
        </div>
      </div>

      {/* Systems */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h4 className="text-sm font-medium text-gray-300">Systems</h4>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-400 mb-1">Power</div>
            <div className="text-lg font-medium text-white">{stats.systems.power}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Radar</div>
            <div className="text-lg font-medium text-white">{stats.systems.radar}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Efficiency</div>
            <div className="text-lg font-medium text-white">{stats.systems.efficiency}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
