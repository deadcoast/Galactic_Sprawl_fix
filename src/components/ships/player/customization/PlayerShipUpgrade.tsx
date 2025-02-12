import {
  AlertTriangle,
  ArrowRight,
  Crosshair,
  Lock,
  Rocket,
  Shield,
} from "lucide-react";

interface UpgradeRequirement {
  type: "tech" | "resource" | "facility";
  name: string;
  met: boolean;
}

interface StatComparison {
  current: number;
  upgraded: number;
  unit?: string;
}

interface ShipUpgradeProps {
  ship: {
    id: string;
    name: string;
    type: string;
    tier: 1 | 2 | 3;
    upgradeAvailable: boolean;
    requirements: UpgradeRequirement[];
    stats: {
      weapons: StatComparison;
      armor: StatComparison;
      shield: StatComparison;
      speed: StatComparison;
    };
    resourceCost: {
      type: string;
      amount: number;
      available: number;
    }[];
  };
  onUpgrade: () => void;
}

export function ShipUpgrade({ ship, onUpgrade }: ShipUpgradeProps) {
  const allRequirementsMet = ship.requirements.every((req) => req.met);
  const sufficientResources = ship.resourceCost.every(
    (cost) => cost.available >= cost.amount,
  );
  const canUpgrade =
    ship.upgradeAvailable && allRequirementsMet && sufficientResources;

  const getStatDifference = (current: number, upgraded: number) => {
    const diff = upgraded - current;
    return diff > 0 ? `+${diff}` : diff.toString();
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-white">{ship.name}</h3>
          <div className="text-sm text-gray-400">
            Tier {ship.tier} → {ship.tier + 1}
          </div>
        </div>
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <Rocket className="w-6 h-6 text-indigo-400" />
        </div>
      </div>

      {/* Upgrade Requirements */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Requirements</h4>
        <div className="space-y-2">
          {ship.requirements.map((req, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg ${
                req.met
                  ? "bg-green-900/20 border border-green-700/30"
                  : "bg-gray-700/50"
              }`}
            >
              <div className="flex items-center space-x-2">
                {req.type === "tech" && (
                  <Crosshair className="w-4 h-4 text-gray-400" />
                )}
                {req.type === "resource" && (
                  <Shield className="w-4 h-4 text-gray-400" />
                )}
                {req.type === "facility" && (
                  <Rocket className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm text-gray-300">{req.name}</span>
              </div>
              {req.met ? (
                <div className="text-xs text-green-400">Met</div>
              ) : (
                <Lock className="w-4 h-4 text-gray-500" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stat Comparisons */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Improvements</h4>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(ship.stats).map(([stat, values]) => (
            <div key={stat} className="p-3 bg-gray-700/50 rounded-lg">
              <div className="text-sm text-gray-400 capitalize mb-2">
                {stat}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-white">{values.current}</div>
                <div className="flex items-center text-sm">
                  <ArrowRight className="w-4 h-4 text-indigo-400 mx-2" />
                  <span className="text-indigo-400">
                    {values.upgraded} (
                    {getStatDifference(values.current, values.upgraded)})
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resource Costs */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3">
          Resource Requirements
        </h4>
        <div className="space-y-2">
          {ship.resourceCost.map((resource, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
            >
              <span className="text-sm text-gray-300">{resource.type}</span>
              <div
                className={`text-sm ${
                  resource.available >= resource.amount
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {resource.available} / {resource.amount}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Button */}
      <button
        onClick={onUpgrade}
        disabled={!canUpgrade}
        className={`w-full px-4 py-3 rounded-lg flex items-center justify-center space-x-2 ${
          canUpgrade
            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
            : "bg-gray-700 text-gray-500 cursor-not-allowed"
        }`}
      >
        <Rocket className="w-5 h-5" />
        <span>Upgrade to Tier {ship.tier + 1}</span>
      </button>

      {/* Warnings */}
      {!canUpgrade && (
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <div className="text-sm text-yellow-200">
            {!ship.upgradeAvailable && "Ship is not eligible for upgrade."}
            {!allRequirementsMet && "Not all upgrade requirements are met."}
            {!sufficientResources && "Insufficient resources for upgrade."}
          </div>
        </div>
      )}
    </div>
  );
}
