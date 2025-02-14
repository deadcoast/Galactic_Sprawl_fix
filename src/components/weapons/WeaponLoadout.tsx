import { WeaponConfig, WeaponMount } from '../../types/weapons/WeaponTypes';
import { AlertTriangle, Crosshair } from 'lucide-react';

interface WeaponLoadoutProps {
  mounts: WeaponMount[];
  availableWeapons: WeaponConfig[];
  onEquipWeapon: (mountId: string, weaponId: string) => void;
  onUnequipWeapon: (mountId: string) => void;
}

export function WeaponLoadout({
  mounts,
  availableWeapons,
  onEquipWeapon,
  onUnequipWeapon,
}: WeaponLoadoutProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <Crosshair className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-white">Weapon Loadout</h3>
        </div>
      </div>

      {/* Weapon Mounts */}
      <div className="space-y-4 mb-6">
        {mounts.map(mount => (
          <div key={mount.id} className="p-4 bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    mount.currentWeapon?.state.status === 'ready' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-sm font-medium text-white">
                  {mount.position.charAt(0).toUpperCase() + mount.position.slice(1)} Mount
                </span>
                <span className="text-xs text-gray-400">
                  ({mount.size.charAt(0).toUpperCase() + mount.size.slice(1)})
                </span>
              </div>
              {mount.currentWeapon && (
                <button
                  onClick={() => onUnequipWeapon(mount.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Unequip
                </button>
              )}
            </div>

            {mount.currentWeapon ? (
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div>
                  <div className="text-sm text-gray-200">{mount.currentWeapon.config.name}</div>
                  <div className="text-xs text-gray-400">
                    Damage: {mount.currentWeapon.state.currentStats.damage}
                  </div>
                </div>
                <div
                  className={`px-2 py-1 rounded text-xs ${
                    mount.currentWeapon.state.status === 'ready'
                      ? 'bg-green-900/50 text-green-400'
                      : 'bg-red-900/50 text-red-400'
                  }`}
                >
                  {mount.currentWeapon.state.status.charAt(0).toUpperCase() +
                    mount.currentWeapon.state.status.slice(1)}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-800 rounded-lg">
                <select
                  onChange={e => onEquipWeapon(mount.id, e.target.value)}
                  className="w-full bg-transparent text-gray-300 text-sm focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select a weapon
                  </option>
                  {availableWeapons
                    .filter(w => w.mountRequirements.size === mount.size)
                    .map(weapon => (
                      <option key={weapon.id} value={weapon.id}>
                        {weapon.name} (DMG: {weapon.baseStats.damage})
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mount Status Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-gray-700/50 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Total Mounts</div>
          <div className="text-lg font-medium text-white">{mounts.length}</div>
        </div>
        <div className="p-3 bg-gray-700/50 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Armed</div>
          <div className="text-lg font-medium text-green-400">
            {mounts.filter(m => m.currentWeapon).length}
          </div>
        </div>
        <div className="p-3 bg-gray-700/50 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Empty</div>
          <div className="text-lg font-medium text-yellow-400">
            {mounts.filter(m => !m.currentWeapon).length}
          </div>
        </div>
      </div>

      {/* Warnings */}
      {mounts.some(m => !m.currentWeapon) && (
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <div className="text-sm text-yellow-200">
            Some weapon mounts are empty. Consider equipping weapons for optimal combat performance.
          </div>
        </div>
      )}
    </div>
  );
}
