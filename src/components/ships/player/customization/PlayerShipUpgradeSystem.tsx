import { AlertTriangle, ArrowRight, Crosshair, Lock, Rocket, Shield } from 'lucide-react';

interface UpgradeRequirement {
  type: 'tech' | 'resource' | 'facility';
  name: string;
  met: boolean;
}

interface StatUpgrade {
  current: number;
  upgraded: number;
  unit?: string;
}

interface ShipUpgradeSystemProps {
  ship: {
    id: string;
    name: string;
    type: 'spitflare' | 'starSchooner' | 'orionFrigate' | 'harbringerGalleon' | 'midwayCarrier';
    tier: 1 | 2 | 3;
    upgradeAvailable: boolean;
    requirements: UpgradeRequirement[];
    stats: {
      hull: StatUpgrade;
      shield: StatUpgrade;
      weapons: StatUpgrade;
      speed: StatUpgrade;
    };
    resourceCost: {
      type: string;
      amount: number;
      available: number;
    }[];
    visualUpgrades: {
      name: string;
      description: string;
      preview: string;
    }[];
  };
  onUpgrade: () => void;
  onPreviewUpgrade: () => void;
}

export function PlayerShipUpgradeSystem({
  ship,
  onUpgrade,
  onPreviewUpgrade,
}: ShipUpgradeSystemProps) {
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
  const allRequirementsMet = ship.requirements.every(req => req.met);
  const sufficientResources = ship.resourceCost.every(cost => cost.available >= cost.amount);
  const canUpgrade = ship.upgradeAvailable && allRequirementsMet && sufficientResources;

  const getStatDifference = (current: number, upgraded: number) => {
    const diff = upgraded - current;
    return diff > 0 ? `+${diff}` : diff.toString();
  };

  return (
    <div className={`bg-${color}-900/20 border border-${color}-700/30 rounded-lg p-6`}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">{ship.name}</h3>
          <div className="text-sm text-gray-400">
            Tier {ship.tier} → {ship.tier + 1}
          </div>
        </div>
        <div className="rounded-lg bg-indigo-500/20 p-2">
          <Rocket className="h-6 w-6 text-indigo-400" />
        </div>
      </div>

      {/* Upgrade Requirements */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-medium text-gray-300">Requirements</h4>
        <div className="space-y-2">
          {ship.requirements.map((req, index) => (
            <div
              key={index}
              className={`flex items-center justify-between rounded-lg p-3 ${
                req.met ? 'border border-green-700/30 bg-green-900/20' : 'bg-gray-700/50'
              }`}
            >
              <div className="flex items-center space-x-2">
                {req.type === 'tech' && <Crosshair className="h-4 w-4 text-gray-400" />}
                {req.type === 'resource' && <Shield className="h-4 w-4 text-gray-400" />}
                {req.type === 'facility' && <Rocket className="h-4 w-4 text-gray-400" />}
                <span className="text-sm text-gray-300">{req.name}</span>
              </div>
              {req.met ? (
                <div className="text-xs text-green-400">Met</div>
              ) : (
                <Lock className="h-4 w-4 text-gray-500" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stat Improvements */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-medium text-gray-300">Improvements</h4>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(ship.stats).map(([stat, values]) => (
            <div key={stat} className="rounded-lg bg-gray-700/50 p-3">
              <div className="mb-2 text-sm capitalize text-gray-400">{stat}</div>
              <div className="flex items-center justify-between">
                <div className="text-white">
                  {values.current}
                  {values.unit}
                </div>
                <div className="flex items-center text-sm">
                  <ArrowRight className="mx-2 h-4 w-4 text-indigo-400" />
                  <span className="text-indigo-400">
                    {values.upgraded}
                    {values.unit} ({getStatDifference(values.current, values.upgraded)})
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Upgrades */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-medium text-gray-300">Visual Enhancements</h4>
        <div className="grid grid-cols-2 gap-3">
          {ship.visualUpgrades.map((upgrade, index) => (
            <div
              key={index}
              className="cursor-pointer rounded-lg bg-gray-700/50 p-3 transition-colors hover:bg-gray-600/50"
              onClick={onPreviewUpgrade}
            >
              <div className="mb-1 text-sm font-medium text-white">{upgrade.name}</div>
              <p className="text-xs text-gray-400">{upgrade.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Resource Costs */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-medium text-gray-300">Resource Requirements</h4>
        <div className="space-y-2">
          {ship.resourceCost.map((resource, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg bg-gray-700/50 p-3"
            >
              <span className="text-sm text-gray-300">{resource.type}</span>
              <div
                className={`text-sm ${
                  resource.available >= resource.amount ? 'text-green-400' : 'text-red-400'
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
        className={`flex w-full items-center justify-center space-x-2 rounded-lg px-4 py-3 ${
          canUpgrade
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'cursor-not-allowed bg-gray-700 text-gray-500'
        }`}
      >
        <Rocket className="h-5 w-5" />
        <span>Upgrade to Tier {ship.tier + 1}</span>
      </button>

      {/* Warnings */}
      {!canUpgrade && (
        <div className="mt-4 flex items-start space-x-2 rounded-lg border border-yellow-700/30 bg-yellow-900/20 p-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-500" />
          <div className="text-sm text-yellow-200">
            {!ship.upgradeAvailable && 'Ship is not eligible for upgrade.'}
            {!allRequirementsMet && 'Not all upgrade requirements are met.'}
            {!sufficientResources && 'Insufficient resources for upgrade.'}
          </div>
        </div>
      )}
    </div>
  );
}
