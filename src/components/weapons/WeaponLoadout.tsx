import { AlertTriangle, Crosshair } from 'lucide-react';
import { WeaponConfig, WeaponMount } from '../../types/weapons/WeaponTypes';

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
    <div className="rounded-lg bg-gray-800 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="rounded-lg bg-red-500/20 p-2">
            <Crosshair className="h-6 w-6 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-white">Weapon Loadout</h3>
        </div>
      </div>

      {/* Weapon Mounts */}
      <div className="mb-6 space-y-4">
        {mounts.map(mount => (
          <div key={mount.id} className="rounded-lg bg-gray-700/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className={`h-2 w-2 rounded-full ${
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
              <div className="flex items-center justify-between rounded-lg bg-gray-800 p-3">
                <div>
                  <div className="text-sm text-gray-200">{mount.currentWeapon.config.name}</div>
                  <div className="text-xs text-gray-400">
                    Damage: {mount.currentWeapon.state.currentStats.damage}
                  </div>
                </div>
                <div
                  className={`rounded px-2 py-1 text-xs ${
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
              <div className="rounded-lg bg-gray-800 p-3">
                <select
                  onChange={e => onEquipWeapon(mount.id, e.target.value)}
                  className="w-full bg-transparent text-sm text-gray-300 focus:outline-none"
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
        <div className="rounded-lg bg-gray-700/50 p-3">
          <div className="mb-1 text-sm text-gray-400">Total Mounts</div>
          <div className="text-lg font-medium text-white">{mounts.length}</div>
        </div>
        <div className="rounded-lg bg-gray-700/50 p-3">
          <div className="mb-1 text-sm text-gray-400">Armed</div>
          <div className="text-lg font-medium text-green-400">
            {mounts.filter(m => m.currentWeapon).length}
          </div>
        </div>
        <div className="rounded-lg bg-gray-700/50 p-3">
          <div className="mb-1 text-sm text-gray-400">Empty</div>
          <div className="text-lg font-medium text-yellow-400">
            {mounts.filter(m => !m.currentWeapon).length}
          </div>
        </div>
      </div>

      {/* Warnings */}
      {mounts.some(m => !m.currentWeapon) && (
        <div className="mt-4 flex items-start space-x-2 rounded-lg border border-yellow-700/30 bg-yellow-900/20 p-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-500" />
          <div className="text-sm text-yellow-200">
            Some weapon mounts are empty. Consider equipping weapons for optimal combat performance.
          </div>
        </div>
      )}
    </div>
  );
}
