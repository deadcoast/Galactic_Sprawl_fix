import { AlertTriangle, Rocket, Shield, Sword } from "lucide-react";

interface EquatorHorizonShipProps {
  id: string;
  name: string;
  type:
    | "celestialArbiter"
    | "etherealGalleon"
    | "stellarEquinox"
    | "chronosSentinel"
    | "nebulasJudgement"
    | "aetherialHorizon"
    | "cosmicCrusader"
    | "balancekeepersWrath"
    | "eclipticWatcher"
    | "harmonysVanguard";
  status: "engaging" | "patrolling" | "retreating" | "disabled";
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  tactics: "aggressive" | "defensive" | "hit-and-run";
  specialAbility?: {
    name: string;
    description: string;
    cooldown: number;
    active: boolean;
  };
  onEngage?: () => void;
  onRetreat?: () => void;
}

export function EquatorHorizonShip({
  id,
  name,
  type,
  status,
  health,
  maxHealth,
  shield,
  maxShield,
  tactics,
  specialAbility,
  onEngage,
  onRetreat,
}: EquatorHorizonShipProps) {
  // Get the ship's role description based on type
  const getShipRole = (shipType: string) => {
    switch (shipType) {
      case "celestialArbiter":
        return "Ultimate Balance Enforcer";
      case "etherealGalleon":
        return "Ancient Energy Vessel";
      case "stellarEquinox":
        return "Harmony Cruiser";
      case "chronosSentinel":
        return "Time Manipulation Ship";
      case "nebulasJudgement":
        return "Swift Justice Vessel";
      case "aetherialHorizon":
        return "First Contact Flagship";
      case "cosmicCrusader":
        return "Threat Neutralizer";
      case "balancekeepersWrath":
        return "Order Dreadnought";
      case "eclipticWatcher":
        return "Stealth Observer";
      case "harmonysVanguard":
        return "Order Spearhead";
      default:
        return "Ancient Vessel";
    }
  };

  return (
    <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-6">
      {/* Ship Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-white">
            {name}
            <span className="ml-2 text-sm text-amber-400/70">#{id}</span>
          </h3>
          <div className="flex items-center text-sm text-gray-400">
            <span className="capitalize">
              {type.replace(/([A-Z])/g, " $1").trim()}
            </span>
            <span className="mx-2">•</span>
            <span>{getShipRole(type)}</span>
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm ${
            status === "engaging"
              ? "bg-amber-900/50 text-amber-400"
              : status === "patrolling"
                ? "bg-green-900/50 text-green-400"
                : status === "retreating"
                  ? "bg-yellow-900/50 text-yellow-400"
                  : "bg-gray-700 text-gray-400"
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>

      {/* Health & Shield Bars */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <div className="flex items-center">
              <Sword className="w-4 h-4 text-amber-400 mr-1" />
              <span className="text-gray-400">Hull Integrity</span>
            </div>
            <span
              className={
                health < maxHealth * 0.3 ? "text-red-400" : "text-gray-300"
              }
            >
              {Math.round((health / maxHealth) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                health < maxHealth * 0.3 ? "bg-red-500" : "bg-amber-500"
              }`}
              style={{ width: `${(health / maxHealth) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <div className="flex items-center">
              <Shield className="w-4 h-4 text-amber-400 mr-1" />
              <span className="text-gray-400">Shield Power</span>
            </div>
            <span className="text-gray-300">
              {Math.round((shield / maxShield) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${(shield / maxShield) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tactics & Special Ability */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-gray-300">
            Combat Tactics
          </div>
          <div
            className={`px-2 py-1 rounded text-xs ${
              tactics === "aggressive"
                ? "bg-red-900/50 text-red-400"
                : tactics === "defensive"
                  ? "bg-amber-900/50 text-amber-400"
                  : "bg-yellow-900/50 text-yellow-400"
            }`}
          >
            {tactics.charAt(0).toUpperCase() + tactics.slice(1)}
          </div>
        </div>

        {specialAbility && (
          <div
            className={`p-3 rounded-lg ${
              specialAbility.active
                ? "bg-amber-500/20 border border-amber-500/30"
                : "bg-gray-700/50"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white">
                {specialAbility.name}
              </span>
              <span className="text-xs text-gray-400">
                {specialAbility.cooldown}s
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {specialAbility.description}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onEngage}
          disabled={status === "disabled"}
          className={`px-4 py-2 rounded-lg text-sm flex items-center justify-center space-x-2 ${
            status === "disabled"
              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-200"
          }`}
        >
          <Rocket className="w-4 h-4" />
          <span>Enforce Balance</span>
        </button>
        <button
          onClick={onRetreat}
          disabled={status === "disabled"}
          className={`px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm flex items-center justify-center space-x-2 ${
            status === "disabled" ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Withdraw</span>
        </button>
      </div>

      {/* Status Warnings */}
      {status === "disabled" && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-700/30 rounded-lg flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-200">
            Ancient systems critically damaged
          </span>
        </div>
      )}
    </div>
  );
}
