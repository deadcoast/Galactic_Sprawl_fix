import {
  AlertTriangle,
  ChevronRight,
  Crown,
  Flag,
  Handshake,
  Scale,
  Swords,
} from "lucide-react";

interface DiplomacyAction {
  type: "ceasefire" | "tradeRoute" | "alliance" | "tribute";
  name: string;
  description: string;
  requirements: {
    type: string;
    value: number;
  }[];
  available: boolean;
}

interface DiplomacyPanelProps {
  faction: {
    id: string;
    name: string;
    type: "spaceRats" | "lostNova" | "equatorHorizon";
    relationship: number; // -1 to 1
    status: "hostile" | "neutral" | "friendly";
    tradingEnabled: boolean;
    lastInteraction: number;
  };
  availableActions: DiplomacyAction[];
  onAction: (action: DiplomacyAction) => void;
  onClose: () => void;
}

export function DiplomacyPanel({
  faction,
  availableActions,
  onAction,
  onClose,
}: DiplomacyPanelProps) {
  const getFactionColor = (type: string) => {
    switch (type) {
      case "spaceRats":
        return "red";
      case "lostNova":
        return "violet";
      case "equatorHorizon":
        return "amber";
      default:
        return "blue";
    }
  };

  const color = getFactionColor(faction.type);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-700 p-6 max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 bg-${color}-500/20 rounded-lg`}>
              {faction.type === "spaceRats" && (
                <Swords className={`w-6 h-6 text-${color}-400`} />
              )}
              {faction.type === "lostNova" && (
                <Scale className={`w-6 h-6 text-${color}-400`} />
              )}
              {faction.type === "equatorHorizon" && (
                <Crown className={`w-6 h-6 text-${color}-400`} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{faction.name}</h2>
              <div className="text-sm text-gray-400">Diplomatic Relations</div>
            </div>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm ${
              faction.status === "hostile"
                ? "bg-red-900/50 text-red-400"
                : faction.status === "friendly"
                  ? "bg-green-900/50 text-green-400"
                  : "bg-gray-700 text-gray-400"
            }`}
          >
            {faction.status.charAt(0).toUpperCase() + faction.status.slice(1)}
          </div>
        </div>

        {/* Relationship Status */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Relationship</span>
            <span
              className={
                faction.relationship > 0.3
                  ? "text-green-400"
                  : faction.relationship < -0.3
                    ? "text-red-400"
                    : "text-gray-400"
              }
            >
              {Math.round(faction.relationship * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                faction.relationship > 0 ? "bg-green-500" : "bg-red-500"
              }`}
              style={{ width: `${Math.abs(faction.relationship) * 100}%` }}
            />
          </div>
        </div>

        {/* Available Actions */}
        <div className="space-y-3 mb-6">
          {availableActions.map((action) => (
            <button
              key={action.type}
              onClick={() => onAction(action)}
              disabled={!action.available}
              className={`w-full p-4 rounded-lg text-left transition-all ${
                action.available
                  ? `bg-${color}-900/20 hover:bg-${color}-900/30 border border-${color}-700/30`
                  : "bg-gray-800/50 border border-gray-700 opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {action.type === "ceasefire" && (
                    <Handshake className="w-5 h-5 text-green-400" />
                  )}
                  {action.type === "tradeRoute" && (
                    <Flag className="w-5 h-5 text-blue-400" />
                  )}
                  {action.type === "alliance" && (
                    <Crown className="w-5 h-5 text-purple-400" />
                  )}
                  {action.type === "tribute" && (
                    <Scale className="w-5 h-5 text-yellow-400" />
                  )}
                  <span className="text-white font-medium">{action.name}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </div>
              <p className="text-sm text-gray-400 mb-2">{action.description}</p>

              {/* Requirements */}
              <div className="flex flex-wrap gap-2">
                {action.requirements.map((req, index) => (
                  <div
                    key={index}
                    className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300"
                  >
                    {req.type}: {req.value}
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Warnings & Notes */}
        {faction.type === "spaceRats" && (
          <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-lg flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="text-sm text-red-200">
              Space Rats are inherently hostile. Diplomatic options are limited.
            </div>
          </div>
        )}

        {faction.type === "lostNova" && !faction.tradingEnabled && (
          <div className="p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <div className="text-sm text-yellow-200">
              Improve relations to unlock trading opportunities.
            </div>
          </div>
        )}

        {faction.type === "equatorHorizon" && (
          <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div className="text-sm text-blue-200">
              Ancient protocols govern diplomatic relations.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
