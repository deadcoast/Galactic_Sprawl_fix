import { Check, Crosshair, Palette, Rocket, Shield } from 'lucide-react';

interface CustomizationOption {
  id: string;
  name: string;
  type: 'color' | 'pattern' | 'decal';
  preview: string;
  unlocked: boolean;
  selected: boolean;
}

interface LoadoutOption {
  id: string;
  name: string;
  type: 'weapon' | 'shield' | 'engine';
  stats: Record<string, number>;
  unlocked: boolean;
  equipped: boolean;
}

interface ShipCustomizationProps {
  ship: {
    id: string;
    name: string;
    type: string;
    tier: number;
    customization: {
      colors: CustomizationOption[];
      patterns: CustomizationOption[];
      decals: CustomizationOption[];
    };
    loadout: {
      weapons: LoadoutOption[];
      shields: LoadoutOption[];
      engines: LoadoutOption[];
    };
  };
  onApplyCustomization: (type: string, optionId: string) => void;
  onEquipLoadout: (type: string, optionId: string) => void;
}

export function PlayerShipCustomization({
  ship,
  onApplyCustomization,
  onEquipLoadout,
}: ShipCustomizationProps) {
  return (
    <div className="rounded-lg bg-gray-800 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">{ship.name}</h3>
          <div className="text-sm text-gray-400">Tier {ship.tier} Customization</div>
        </div>
        <div className="rounded-lg bg-violet-500/20 p-2">
          <Palette className="h-6 w-6 text-violet-400" />
        </div>
      </div>

      {/* Visual Customization */}
      <div className="mb-8">
        <h4 className="mb-4 text-sm font-medium text-gray-300">Visual Customization</h4>

        {/* Color Schemes */}
        <div className="mb-6">
          <div className="mb-3 text-sm text-gray-400">Color Scheme</div>
          <div className="grid grid-cols-4 gap-3">
            {ship.customization.colors.map(color => (
              <button
                key={color.id}
                onClick={() => onApplyCustomization('color', color.id)}
                disabled={!color.unlocked}
                className={`relative rounded-lg border-2 p-4 transition-all ${
                  color.selected
                    ? 'border-violet-500 bg-violet-900/20'
                    : color.unlocked
                      ? 'border-gray-700 bg-gray-700/50 hover:border-violet-500/50'
                      : 'cursor-not-allowed border-gray-700 bg-gray-800/50 opacity-50'
                }`}
              >
                <div className="h-8 w-full rounded" style={{ backgroundColor: color.preview }} />
                {color.selected && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-violet-400" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Patterns */}
        <div className="mb-6">
          <div className="mb-3 text-sm text-gray-400">Patterns</div>
          <div className="grid grid-cols-3 gap-3">
            {ship.customization.patterns.map(pattern => (
              <button
                key={pattern.id}
                onClick={() => onApplyCustomization('pattern', pattern.id)}
                disabled={!pattern.unlocked}
                className={`rounded-lg border-2 p-4 transition-all ${
                  pattern.selected
                    ? 'border-violet-500 bg-violet-900/20'
                    : pattern.unlocked
                      ? 'border-gray-700 bg-gray-700/50 hover:border-violet-500/50'
                      : 'cursor-not-allowed border-gray-700 bg-gray-800/50 opacity-50'
                }`}
              >
                <div className="mb-1 text-sm text-gray-300">{pattern.name}</div>
                <div className="text-xs text-gray-500">
                  {pattern.unlocked ? 'Available' : 'Locked'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Decals */}
        <div>
          <div className="mb-3 text-sm text-gray-400">Decals</div>
          <div className="grid grid-cols-4 gap-3">
            {ship.customization.decals.map(decal => (
              <button
                key={decal.id}
                onClick={() => onApplyCustomization('decal', decal.id)}
                disabled={!decal.unlocked}
                className={`rounded-lg border-2 p-4 transition-all ${
                  decal.selected
                    ? 'border-violet-500 bg-violet-900/20'
                    : decal.unlocked
                      ? 'border-gray-700 bg-gray-700/50 hover:border-violet-500/50'
                      : 'cursor-not-allowed border-gray-700 bg-gray-800/50 opacity-50'
                }`}
              >
                <div className="mb-1 text-sm text-gray-300">{decal.name}</div>
                <div className="text-xs text-gray-500">
                  {decal.unlocked ? 'Available' : 'Locked'}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loadout Customization */}
      <div>
        <h4 className="mb-4 text-sm font-medium text-gray-300">Loadout Configuration</h4>

        {/* Weapons */}
        <div className="mb-6">
          <div className="mb-3 flex items-center space-x-2">
            <Crosshair className="h-4 w-4 text-red-400" />
            <span className="text-sm text-gray-400">Weapons</span>
          </div>
          <div className="space-y-2">
            {ship.loadout.weapons.map(weapon => (
              <button
                key={weapon.id}
                onClick={() => onEquipLoadout('weapon', weapon.id)}
                disabled={!weapon.unlocked}
                className={`w-full rounded-lg border p-3 transition-all ${
                  weapon.equipped
                    ? 'border-red-500 bg-red-900/20'
                    : weapon.unlocked
                      ? 'border-gray-700 bg-gray-700/50 hover:border-red-500/50'
                      : 'cursor-not-allowed border-gray-700 bg-gray-800/50 opacity-50'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-gray-300">{weapon.name}</span>
                  {weapon.equipped && <Check className="h-4 w-4 text-red-400" />}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(weapon.stats).map(([stat, value]) => (
                    <div key={stat} className="text-xs text-gray-400">
                      {stat}: {value}
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Shields */}
        <div className="mb-6">
          <div className="mb-3 flex items-center space-x-2">
            <Shield className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-gray-400">Shields</span>
          </div>
          <div className="space-y-2">
            {ship.loadout.shields.map(shield => (
              <button
                key={shield.id}
                onClick={() => onEquipLoadout('shield', shield.id)}
                disabled={!shield.unlocked}
                className={`w-full rounded-lg border p-3 transition-all ${
                  shield.equipped
                    ? 'border-blue-500 bg-blue-900/20'
                    : shield.unlocked
                      ? 'border-gray-700 bg-gray-700/50 hover:border-blue-500/50'
                      : 'cursor-not-allowed border-gray-700 bg-gray-800/50 opacity-50'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-gray-300">{shield.name}</span>
                  {shield.equipped && <Check className="h-4 w-4 text-blue-400" />}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(shield.stats).map(([stat, value]) => (
                    <div key={stat} className="text-xs text-gray-400">
                      {stat}: {value}
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Engines */}
        <div>
          <div className="mb-3 flex items-center space-x-2">
            <Rocket className="h-4 w-4 text-green-400" />
            <span className="text-sm text-gray-400">Engines</span>
          </div>
          <div className="space-y-2">
            {ship.loadout.engines.map(engine => (
              <button
                key={engine.id}
                onClick={() => onEquipLoadout('engine', engine.id)}
                disabled={!engine.unlocked}
                className={`w-full rounded-lg border p-3 transition-all ${
                  engine.equipped
                    ? 'border-green-500 bg-green-900/20'
                    : engine.unlocked
                      ? 'border-gray-700 bg-gray-700/50 hover:border-green-500/50'
                      : 'cursor-not-allowed border-gray-700 bg-gray-800/50 opacity-50'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-gray-300">{engine.name}</span>
                  {engine.equipped && <Check className="h-4 w-4 text-green-400" />}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(engine.stats).map(([stat, value]) => (
                    <div key={stat} className="text-xs text-gray-400">
                      {stat}: {value}
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
