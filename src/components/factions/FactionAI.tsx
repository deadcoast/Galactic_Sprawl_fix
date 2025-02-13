import { AlertTriangle, Shield, Sword, Zap } from "lucide-react";
import type { FactionId } from "../../types/ships/FactionTypes";

interface AIBehavior {
  id: string;
  type: "aggressive" | "defensive" | "hit-and-run";
  priority: "attack" | "defend" | "support";
  conditions: {
    healthThreshold: number;
    shieldThreshold: number;
    targetDistance: number;
    allySupport: boolean;
  };
}

interface FactionAIProps {
  faction: FactionId;
  behavior: AIBehavior;
  fleetStrength: number;
  threatLevel: number;
  onUpdateBehavior: (newBehavior: AIBehavior) => void;
}

export function FactionAI({
  faction,
  behavior,
  fleetStrength,
  threatLevel,
  onUpdateBehavior,
}: FactionAIProps) {
  const getFactionColor = (faction: FactionId) => {
    switch (faction) {
      case "space-rats":
        return "red";
      case "lost-nova":
        return "violet";
      case "equator-horizon":
        return "amber";
      default:
        return "blue";
    }
  };

  const color = getFactionColor(faction);

  return (
    <div
      className={`bg-${color}-900/20 border border-${color}-700/30 rounded-lg p-6`}
    >
      {/* AI Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-white">
            {faction
              .split("-")
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}{" "}
            AI
          </h3>
          <div className="text-sm text-gray-400">Combat Behavior Control</div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm bg-${color}-500/20 text-${color}-400`}
        >
          {behavior.type.charAt(0).toUpperCase() + behavior.type.slice(1)}
        </div>
      </div>

      {/* Combat Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-sm text-gray-400 mb-1">Fleet Strength</div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-white">
              {Math.round(fleetStrength * 100)}
            </span>
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Threat Level</div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-white">
              {Math.round(threatLevel * 100)}
            </span>
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>
      </div>

      {/* Behavior Conditions */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Health Threshold</span>
            <span className={`text-${color}-400`}>
              {behavior.conditions.healthThreshold}%
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-${color}-500 rounded-full`}
              style={{ width: `${behavior.conditions.healthThreshold}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Shield Threshold</span>
            <span className={`text-${color}-400`}>
              {behavior.conditions.shieldThreshold}%
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-${color}-500 rounded-full`}
              style={{ width: `${behavior.conditions.shieldThreshold}%` }}
            />
          </div>
        </div>
      </div>

      {/* Priority Controls */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <button
          onClick={() => onUpdateBehavior({ ...behavior, priority: "attack" })}
          className={`p-3 rounded-lg flex flex-col items-center justify-center space-y-2 ${
            behavior.priority === "attack"
              ? `bg-${color}-500/20 border border-${color}-500/30`
              : "bg-gray-700/50 hover:bg-gray-600/50"
          }`}
        >
          <Sword className="w-5 h-5" />
          <span className="text-sm">Attack</span>
        </button>
        <button
          onClick={() => onUpdateBehavior({ ...behavior, priority: "defend" })}
          className={`p-3 rounded-lg flex flex-col items-center justify-center space-y-2 ${
            behavior.priority === "defend"
              ? `bg-${color}-500/20 border border-${color}-500/30`
              : "bg-gray-700/50 hover:bg-gray-600/50"
          }`}
        >
          <Shield className="w-5 h-5" />
          <span className="text-sm">Defend</span>
        </button>
        <button
          onClick={() => onUpdateBehavior({ ...behavior, priority: "support" })}
          className={`p-3 rounded-lg flex flex-col items-center justify-center space-y-2 ${
            behavior.priority === "support"
              ? `bg-${color}-500/20 border border-${color}-500/30`
              : "bg-gray-700/50 hover:bg-gray-600/50"
          }`}
        >
          <Zap className="w-5 h-5" />
          <span className="text-sm">Support</span>
        </button>
      </div>

      {/* Behavior Warnings */}
      {fleetStrength < 0.3 && (
        <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-lg flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-200">
            Fleet strength critical. Consider tactical retreat.
          </span>
        </div>
      )}
    </div>
  );
}
