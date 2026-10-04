import { AlertTriangle, Crosshair, Shield } from 'lucide-react';
import { WeaponCategory, WeaponStatus } from '../../../types/weapons/WeaponTypes';

interface WeaponSystem {
  id: string;
  name: string;
  type: WeaponCategory;
  damage: number;
  range: number;
  cooldown: number;
  status: WeaponStatus;
}

interface CombatShipCombatProps {
  ship: {
    id: string;
    name: string;
    type: 'spitflare' | 'starSchooner' | 'orionFrigate' | 'harbringerGalleon' | 'midwayCarrier';
    tier: 1 | 2 | 3;
    status: 'idle' | 'engaging' | 'retreating' | 'damaged';
    hull: number;
    maxHull: number;
    shield: number;
    maxShield: number;
    weapons: WeaponSystem[];
    specialAbilities?: {
      name: string;
      description: string;
      cooldown: number;
      active: boolean;
    }[];
  };
  onFireWeapon: (weaponId: string) => void;
  onActivateAbility: (abilityName: string) => void;
  onRetreat: () => void;
}

export function CombatShipCombat({
  ship,
  onFireWeapon,
  onActivateAbility,
  onRetreat,
}: CombatShipCombatProps) {
  const getShipTypeColor = (type: string) => {
    switch (type) {
      case 'spitflare':
        return 'cyan';
      case 'starSchooner':
        return 'indigo';
      case 'orionFrigate':
        return 'violet';
      case 'harbringerGalleon':
        return 'purple';
      case 'midwayCarrier':
        return 'fuchsia';
      default:
        return 'blue';
    }
  };

  const color = getShipTypeColor(ship.type);

  return (
    <div className={`bg-${color}-900/20 border border-${color}-700/30 rounded-lg p-6`}>
      {/* Ship Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">{ship.name}</h3>
          <div className="flex items-center text-sm text-gray-400">
            <span>Tier {ship.tier}</span>
            <span className="mx-2">•</span>
            <span className="capitalize">{ship.type.replace(/([A-Z])/g, ' $1').trim()}</span>
          </div>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-sm ${
            ship.status === 'engaging'
              ? 'bg-red-900/50 text-red-400'
              : ship.status === 'retreating'
                ? 'bg-yellow-900/50 text-yellow-400'
                : ship.status === 'damaged'
                  ? 'bg-red-900/50 text-red-400'
                  : 'bg-green-900/50 text-green-400'
          }`}
        >
          {ship.status.charAt(0).toUpperCase() + ship.status.slice(1)}
        </div>
      </div>

      {/* Combat Status */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-400">Hull Integrity</span>
            <span className={ship.hull < ship.maxHull * 0.3 ? 'text-red-400' : 'text-gray-300'}>
              {Math.round((ship.hull / ship.maxHull) * 100)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className={`h-full rounded-full transition-all ${
                ship.hull < ship.maxHull * 0.3 ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${(ship.hull / ship.maxHull) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-400">Shield Power</span>
            <span className="text-gray-300">
              {Math.round((ship.shield / ship.maxShield) * 100)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${(ship.shield / ship.maxShield) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Weapon Systems */}
      <div className="mb-6 space-y-4">
        <h4 className="text-sm font-medium text-gray-300">Weapon Systems</h4>
        <div className="grid grid-cols-2 gap-3">
          {ship.weapons.map(weapon => (
            <button
              key={weapon.id}
              onClick={() => onFireWeapon(weapon.id)}
              disabled={weapon.status !== 'ready'}
              className={`rounded-lg p-3 transition-colors ${
                weapon.status === 'ready'
                  ? `bg-${color}-500/20 hover:bg-${color}-500/30 border border-${color}-500/30`
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
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Range: {weapon.range}ly</span>
                <span>DMG: {weapon.damage}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Special Abilities */}
      {ship.specialAbilities && ship.specialAbilities.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-3 text-sm font-medium text-gray-300">Special Abilities</h4>
          <div className="space-y-2">
            {ship.specialAbilities.map(ability => (
              <button
                key={ability.name}
                onClick={() => onActivateAbility(ability.name)}
                disabled={ability.active}
                className={`w-full rounded-lg p-3 text-left transition-colors ${
                  ability.active
                    ? `bg-${color}-500/20 border border-${color}-500/30`
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
      )}

      {/* Combat Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onFireWeapon(ship.weapons[0].id)}
          disabled={!ship.weapons.some(w => w.status === 'ready')}
          className={`flex items-center justify-center space-x-2 rounded-lg px-4 py-2 text-sm ${
            ship.weapons.some(w => w.status === 'ready')
              ? `bg-${color}-500/20 hover:bg-${color}-500/30 text-${color}-200`
              : 'cursor-not-allowed bg-gray-700 text-gray-500'
          }`}
        >
          <Crosshair className="h-4 w-4" />
          <span>Fire Weapons</span>
        </button>
        <button
          onClick={onRetreat}
          disabled={ship.status === 'damaged'}
          className={`flex items-center justify-center space-x-2 rounded-lg bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600 ${
            ship.status === 'damaged' ? 'cursor-not-allowed opacity-50' : ''
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Retreat</span>
        </button>
      </div>

      {/* Status warnings */}
      {ship.status === 'damaged' && (
        <div className="mt-4 flex items-start space-x-2 rounded-lg border border-red-700/30 bg-red-900/20 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
          <span className="text-sm text-red-200">Ship systems critically damaged</span>
        </div>
      )}
    </div>
  );
}
