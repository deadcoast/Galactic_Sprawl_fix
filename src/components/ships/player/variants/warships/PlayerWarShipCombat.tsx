import { AlertTriangle, Crosshair, Shield } from "lucide-react";

interface WeaponSystem {
  id: string;
  name: string;
  type: "machineGun" | "railGun" | "gaussCannon" | "rockets";
  damage: number;
  range: number;
  cooldown: number;
  status: "ready" | "charging" | "cooling";
}

interface WarShipCombatProps {
  ship: {
    id: string;
    name: string;
    type:
      | "spitflare"
      | "starSchooner"
      | "orionFrigate"
      | "harbringerGalleon"
      | "midwayCarrier";
    tier: 1 | 2 | 3;
    status: "idle" | "engaging" | "retreating" | "damaged";
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

export function WarShipCombat({
  ship,
  onFireWeapon,
  onActivateAbility,
  onRetreat,
}: WarShipCombatProps) {
  const getShipTypeColor = (type: string) => {
    switch (type) {
      case "spitflare":
        return "cyan";
      case "starSchooner":
        return "indigo";
      case "orionFrigate":
        return "violet";
      case "harbringerGalleon":
        return "purple";
      case "midwayCarrier":
        return "fuchsia";
      default:
        return "blue";
    }
  };

  const color = getShipTypeColor(ship.type);

  return (
    <div
      className={`bg-${color}-900/20 border border-${color}-700/30 rounded-lg p-6`}
    >
      {/* Ship Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-white">{ship.name}</h3>
          <div className="flex items-center text-sm text-gray-400">
            <span>Tier {ship.tier}</span>
            <span className="mx-2">•</span>
            <span className="capitalize">
              {ship.type.replace(/([A-Z])/g, " $1").trim()}
            </span>
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm ${
            ship.status === "engaging"
              ? "bg-red-900/50 text-red-400"
              : ship.status === "retreating"
                ? "bg-yellow-900/50 text-yellow-400"
                : ship.status === "damaged"
                  ? "bg-red-900/50 text-red-400"
                  : "bg-green-900/50 text-green-400"
          }`}
        >
          {ship.status.charAt(0).toUpperCase() + ship.status.slice(1)}
        </div>
      </div>

      {/* Combat Status */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Hull Integrity</span>
            <span
              className={
                ship.hull < ship.maxHull * 0.3
                  ? "text-red-400"
                  : "text-gray-300"
              }
            >
              {Math.round((ship.hull / ship.maxHull) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                ship.hull < ship.maxHull * 0.3 ? "bg-red-500" : "bg-green-500"
              }`}
              style={{ width: `${(ship.hull / ship.maxHull) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Shield Power</span>
            <span className="text-gray-300">
              {Math.round((ship.shield / ship.maxShield) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${(ship.shield / ship.maxShield) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Weapon Systems */}
      <div className="space-y-4 mb-6">
        <h4 className="text-sm font-medium text-gray-300">Weapon Systems</h4>
        <div className="grid grid-cols-2 gap-3">
          {ship.weapons.map((weapon) => (
            <button
              key={weapon.id}
              onClick={() => onFireWeapon(weapon.id)}
              disabled={weapon.status !== "ready"}
              className={`p-3 rounded-lg transition-colors ${
                weapon.status === "ready"
                  ? `bg-${color}-500/20 hover:bg-${color}-500/30 border border-${color}-500/30`
                  : "bg-gray-700/50 border border-gray-600/30 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-white">
                  {weapon.name}
                </div>
                <div
                  className={`text-xs ${
                    weapon.status === "ready"
                      ? "text-green-400"
                      : weapon.status === "charging"
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {weapon.status.charAt(0).toUpperCase() +
                    weapon.status.slice(1)}
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
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            Special Abilities
          </h4>
          <div className="space-y-2">
            {ship.specialAbilities.map((ability) => (
              <button
                key={ability.name}
                onClick={() => onActivateAbility(ability.name)}
                disabled={ability.active}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  ability.active
                    ? `bg-${color}-500/20 border border-${color}-500/30`
                    : "bg-gray-700/50 hover:bg-gray-600/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">
                    {ability.name}
                  </span>
                  {ability.active ? (
                    <span className="text-xs text-green-400">Active</span>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {ability.cooldown}s
                    </span>
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
          disabled={!ship.weapons.some((w) => w.status === "ready")}
          className={`px-4 py-2 rounded-lg text-sm flex items-center justify-center space-x-2 ${
            ship.weapons.some((w) => w.status === "ready")
              ? `bg-${color}-500/20 hover:bg-${color}-500/30 text-${color}-200`
              : "bg-gray-700 text-gray-500 cursor-not-allowed"
          }`}
        >
          <Crosshair className="w-4 h-4" />
          <span>Fire Weapons</span>
        </button>
        <button
          onClick={onRetreat}
          disabled={ship.status === "damaged"}
          className={`px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm flex items-center justify-center space-x-2 ${
            ship.status === "damaged" ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Retreat</span>
        </button>
      </div>

      {/* Status Warnings */}
      {ship.status === "damaged" && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-700/30 rounded-lg flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-200">
            Ship systems critically damaged
          </span>
        </div>
      )}
    </div>
  );
}
