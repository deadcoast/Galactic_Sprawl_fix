import { FactionShipProps } from "../../../types/ships/FactionShipTypes";
import { Shield, Sword } from "lucide-react";

export type ShipStatus = 
  | "idle"
  | "engaging"
  | "patrolling"
  | "retreating"
  | "disabled"
  | "damaged";

interface FactionShipBaseProps extends FactionShipProps {
  className?: string;
  ship: {
    id: string;
    name: string;
    faction: string;
    class: string;
    status: ShipStatus;
    health: number;
    maxHealth: number;
    shield: number;
    maxShield: number;
    stats: any;
    tactics: "aggressive" | "defensive" | "hit-and-run";
    specialAbility?: {
      name: string;
      description: string;
      cooldown: number;
      active: boolean;
    };
  };
}

const FACTION_COLORS = {
  "space-rats": "red",
  "lost-nova": "violet",
  "equator-horizon": "amber",
} as const;

export function FactionShipBase({
  ship,
  onEngage,
  onRetreat,
  onSpecialAbility,
  className = "",
}: FactionShipBaseProps) {
  const color = FACTION_COLORS[ship.faction as keyof typeof FACTION_COLORS];

  return (
    <div
      className={`bg-${color}-900/20 border border-${color}-700/30 rounded-lg p-6 ${className}`}
    >
      {/* Ship Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-white">{ship.name}</h3>
          <div className="flex items-center text-sm text-gray-400">
            <span className="capitalize">
              {ship.faction.replace(/-/g, " ")}
            </span>
            <span className="mx-2">•</span>
            <span>{ship.class.replace(/-/g, " ")}</span>
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm ${
            ship.status === "engaging"
              ? "bg-red-900/50 text-red-400"
              : ship.status === "patrolling"
                ? "bg-green-900/50 text-green-400"
                : ship.status === "retreating"
                  ? "bg-yellow-900/50 text-yellow-400"
                  : "bg-gray-700 text-gray-400"
          }`}
        >
          {ship.status.charAt(0).toUpperCase() + ship.status.slice(1)}
        </div>
      </div>

      {/* Health & Shield Bars */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          <div className="flex-1 h-2 bg-gray-700 rounded-full">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${(ship.shield / ship.maxShield) * 100}%` }}
            />
          </div>
          <span className="text-sm text-gray-400">
            {Math.round(ship.shield)}/{ship.maxShield}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Sword className="w-4 h-4 text-red-400" />
          <div className="flex-1 h-2 bg-gray-700 rounded-full">
            <div
              className="h-full bg-red-500 rounded-full"
              style={{ width: `${(ship.health / ship.maxHealth) * 100}%` }}
            />
          </div>
          <span className="text-sm text-gray-400">
            {Math.round(ship.health)}/{ship.maxHealth}
          </span>
        </div>
      </div>

      {/* Special Ability */}
      {ship.specialAbility && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">
              {ship.specialAbility.name}
            </span>
            <span className="text-sm text-gray-400">
              {ship.specialAbility.cooldown}s
            </span>
          </div>
          <p className="text-sm text-gray-400">
            {ship.specialAbility.description}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onEngage}
          className="flex-1 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg text-sm font-medium transition-colors"
        >
          Engage
        </button>
        <button
          onClick={onRetreat}
          className="flex-1 px-4 py-2 bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-400 rounded-lg text-sm font-medium transition-colors"
        >
          Retreat
        </button>
        {ship.specialAbility && (
          <button
            onClick={onSpecialAbility}
            disabled={!ship.specialAbility.active}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              ship.specialAbility.active
                ? "bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-400"
                : "bg-gray-800 text-gray-600 cursor-not-allowed"
            }`}
          >
            Special
          </button>
        )}
      </div>
    </div>
  );
}
