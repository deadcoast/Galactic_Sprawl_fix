import { AlertTriangle, Crosshair, Shield } from 'lucide-react';

interface DockingBay {
  id: string;
  type: 'fighter' | 'frigate' | 'carrier';
  status: 'empty' | 'occupied' | 'launching' | 'docking';
  shipId?: string;
}

interface MotherEarthRevengeProps {
  status: 'idle' | 'engaging' | 'retreating' | 'damaged';
  hull: number;
  maxHull: number;
  shield: number;
  maxShield: number;
  dockingBays: DockingBay[];
  weapons: {
    id: string;
    name: string;
    type: 'capitalLaser' | 'torpedoes' | 'pointDefense';
    damage: number;
    status: 'ready' | 'charging' | 'cooling';
  }[];
  specialAbilities: {
    name: string;
    description: string;
    active: boolean;
    cooldown: number;
  }[];
  alerts?: string[];
  onFire: (weaponId: string) => void;
  onActivateAbility: (abilityName: string) => void;
  onLaunchShip: (bayId: string) => void;
  onRetreat: () => void;
}

export function MotherEarthRevenge({
  status,
  hull,
  maxHull,
  shield,
  maxShield,
  dockingBays,
  weapons,
  specialAbilities,
  alerts,
  onFire,
  onActivateAbility,
  onLaunchShip,
  onRetreat,
}: MotherEarthRevengeProps) {
  const occupiedBays = dockingBays.filter(bay => bay.status === 'occupied').length;

  return (
    <div className="rounded-lg border border-rose-700/30 bg-rose-900/20 p-6">
      {/* Ship Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">Mother Earth's Revenge</h3>
          <div className="text-sm text-gray-400">Special Capital Ship</div>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-sm ${
            status === 'engaging'
              ? 'bg-red-900/50 text-red-400'
              : status === 'retreating'
                ? 'bg-yellow-900/50 text-yellow-400'
                : status === 'damaged'
                  ? 'bg-red-900/50 text-red-400'
                  : 'bg-green-900/50 text-green-400'
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>

      {/* Combat Status */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-400">Hull Integrity</span>
            <span className={hull < maxHull * 0.3 ? 'text-red-400' : 'text-gray-300'}>
              {Math.round((hull / maxHull) * 100)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className={`h-full rounded-full transition-all ${
                hull < maxHull * 0.3 ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${(hull / maxHull) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-400">Shield Power</span>
            <span className="text-gray-300">{Math.round((shield / maxShield) * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${(shield / maxShield) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Docking Status */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-300">Docking Bays</h4>
          <div className="text-sm text-gray-400">
            {occupiedBays}/{dockingBays.length} Occupied
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {dockingBays.map(bay => (
            <button
              key={bay.id}
              onClick={() => bay.status === 'occupied' && onLaunchShip(bay.id)}
              disabled={bay.status === 'empty'}
              className={`rounded-lg p-3 transition-colors ${
                bay.status === 'occupied'
                  ? 'border border-rose-500/30 bg-rose-500/20 hover:bg-rose-500/30'
                  : 'border border-gray-600/30 bg-gray-700/50'
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-gray-300">{bay.type}</span>
                <div
                  className={`h-2 w-2 rounded-full ${
                    bay.status === 'occupied'
                      ? 'bg-green-500'
                      : bay.status === 'launching'
                        ? 'animate-pulse bg-yellow-500'
                        : bay.status === 'docking'
                          ? 'animate-pulse bg-blue-500'
                          : 'bg-gray-500'
                  }`}
                />
              </div>
              <div className="text-xs text-gray-400">
                {bay.status.charAt(0).toUpperCase() + bay.status.slice(1)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Weapon Systems */}
      <div className="mb-6 space-y-4">
        <h4 className="text-sm font-medium text-gray-300">Capital Weapons</h4>
        <div className="grid grid-cols-2 gap-3">
          {weapons.map(weapon => (
            <button
              key={weapon.id}
              onClick={() => onFire(weapon.id)}
              disabled={weapon.status !== 'ready'}
              className={`rounded-lg p-3 transition-colors ${
                weapon.status === 'ready'
                  ? 'border border-rose-500/30 bg-rose-500/20 hover:bg-rose-500/30'
                  : 'cursor-not-allowed border border-gray-600/30 bg-gray-700/50'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium text-white">{weapon.name}</div>
                <div
                  className={`text-xs ${
                    weapon.status === 'ready'
                      ? 'text-green-400'
                      : weapon.status === 'charging'
                        ? 'text-yellow-400'
                        : 'text-red-400'
                  }`}
                >
                  {weapon.status.charAt(0).toUpperCase() + weapon.status.slice(1)}
                </div>
              </div>
              <div className="text-xs text-gray-400">Damage: {weapon.damage}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Special Abilities */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-medium text-gray-300">Special Abilities</h4>
        <div className="space-y-2">
          {specialAbilities.map(ability => (
            <button
              key={ability.name}
              onClick={() => onActivateAbility(ability.name)}
              disabled={ability.active}
              className={`w-full rounded-lg p-3 text-left transition-colors ${
                ability.active
                  ? 'border border-rose-500/30 bg-rose-500/20'
                  : 'bg-gray-700/50 hover:bg-gray-600/50'
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-white">{ability.name}</span>
                {ability.active ? (
                  <span className="text-xs text-green-400">Active</span>
                ) : (
                  <span className="text-xs text-gray-400">{ability.cooldown}s</span>
                )}
              </div>
              <p className="text-xs text-gray-400">{ability.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Combat Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onFire(weapons[0].id)}
          disabled={!weapons.some(w => w.status === 'ready')}
          className={`flex items-center justify-center space-x-2 rounded-lg px-4 py-2 text-sm ${
            weapons.some(w => w.status === 'ready')
              ? 'bg-rose-500/20 text-rose-200 hover:bg-rose-500/30'
              : 'cursor-not-allowed bg-gray-700 text-gray-500'
          }`}
        >
          <Crosshair className="h-4 w-4" />
          <span>Fire Capital Weapons</span>
        </button>
        <button
          onClick={onRetreat}
          disabled={status === 'damaged'}
          className={`flex items-center justify-center space-x-2 rounded-lg bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600 ${
            status === 'damaged' ? 'cursor-not-allowed opacity-50' : ''
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Retreat</span>
        </button>
      </div>

      {/* Status Warnings */}
      {alerts && alerts.length > 0 && (
        <div className="mt-4 space-y-2">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className="flex items-start space-x-2 rounded-lg border border-red-700/30 bg-red-900/20 p-3"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
              <span className="text-sm text-red-200">{alert}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
