import { SpaceRatShip } from "./SpaceRatShip";
import { WeaponMount } from "../../common/WeaponMount";
import { WeaponType } from "../../../../types/combat/CombatTypes";
import { FactionShipStats } from "../../../../types/ships/FactionShipTypes";
import { AlertTriangle, Eye, EyeOff, Radar, Shield } from "lucide-react";
import { useEffect, useState } from "react";

type ShipStatus =
  | "idle"
  | "engaging"
  | "patrolling"
  | "retreating"
  | "disabled"
  | "damaged";

interface RogueNebulaProps {
  id: string;
  status: ShipStatus;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  weapons: WeaponType[];
  stats: FactionShipStats;
  onFire: (weaponId: string) => void;
  onEngage?: () => void;
  onRetreat: () => void;
  onSpecialAbility?: (abilityName: string) => void;
}

export function RogueNebula({
  id,
  status,
  health,
  maxHealth,
  shield,
  maxShield,
  weapons,
  stats,
  onFire,
  onEngage,
  onRetreat,
  onSpecialAbility,
}: RogueNebulaProps) {
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);
  const [isStealthed, setIsStealthed] = useState(false);
  const [combatStance, setCombatStance] = useState<"aggressive" | "defensive" | "hit-and-run">("hit-and-run");

  // Special abilities configuration
  const specialAbilities = [
    {
      name: "Deep Space Vanish",
      description: "Temporarily become invisible to enemy sensors",
      cooldown: 20,
      energyCost: 0.4,
      icon: EyeOff,
      type: "stealth"
    },
    {
      name: "Sensor Jam",
      description: "Disrupt enemy targeting systems",
      cooldown: 25,
      energyCost: 0.5,
      icon: Radar,
      type: "defense"
    }
  ];

  // Combat stance effects
  useEffect(() => {
    if (health < maxHealth * 0.4) {
      setCombatStance("hit-and-run");
    } else if (isStealthed) {
      setCombatStance("aggressive");
    }
  }, [health, maxHealth, isStealthed]);

  // Handle stealth activation
  useEffect(() => {
    if (selectedAbility === "Deep Space Vanish" && stats.energy > stats.maxEnergy * 0.4) {
      setIsStealthed(true);
      const timer = setTimeout(() => setIsStealthed(false), 10000); // 10s stealth duration
      return () => clearTimeout(timer);
    }
  }, [selectedAbility, stats.energy, stats.maxEnergy]);

  return (
    <div className="relative">
      {/* Ship Base Component */}
      <SpaceRatShip
        id={id}
        name="Rogue Nebula"
        type="rogueNebula"
        status={status === "damaged" ? "disabled" : status === "idle" ? "patrolling" : status}
        health={health}
        maxHealth={maxHealth}
        shield={shield}
        maxShield={maxShield}
        tactics={combatStance}
        specialAbility={{
          name: selectedAbility || specialAbilities[0].name,
          description: specialAbilities.find(a => a.name === selectedAbility)?.description || specialAbilities[0].description,
          cooldown: specialAbilities.find(a => a.name === selectedAbility)?.cooldown || 20,
          active: isStealthed || stats.energy > stats.maxEnergy * 0.4
        }}
      />

      {/* Stealth Status Indicator */}
      <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-red-900/30 border border-red-700/50 text-red-400 text-sm font-bold flex items-center gap-2">
        {isStealthed ? (
          <>
            <EyeOff className="w-4 h-4" />
            <span>Stealthed</span>
          </>
        ) : (
          <>
            <Eye className="w-4 h-4" />
            <span>Visible</span>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-4 left-4 right-4 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={onEngage}
            disabled={status === "disabled"}
            className="flex-1 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Ambush
          </button>
          <button
            onClick={onRetreat}
            disabled={status === "disabled"}
            className="flex-1 px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 rounded-lg flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Vanish
          </button>
        </div>

        {/* Special Abilities */}
        <div className="grid grid-cols-2 gap-2">
          {specialAbilities.map((ability) => {
            const Icon = ability.icon;
            const isSelected = selectedAbility === ability.name;
            const isDisabled = status === "disabled" || stats.energy <= stats.maxEnergy * ability.energyCost;

            return (
              <button
                key={ability.name}
                onClick={() => {
                  setSelectedAbility(ability.name);
                  onSpecialAbility?.(ability.name);
                }}
                disabled={isDisabled}
                className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
                  isSelected
                    ? "bg-red-700/30 text-red-300 border border-red-500/50"
                    : "bg-red-800/20 hover:bg-red-800/30 text-red-300"
                } disabled:opacity-50 transition-all`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{ability.name.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Enhanced Weapon Mounts */}
      <div className="absolute inset-0 pointer-events-none">
        {weapons.map((weapon, index) => (
          <WeaponMount
            key={weapon.id}
            weapon={{
              ...weapon,
              stats: {
                ...weapon.stats,
                damage: weapon.stats.damage * (isStealthed ? 1.5 : 1),
                accuracy: weapon.stats.accuracy * (combatStance === "hit-and-run" ? 1.2 : 1)
              }
            }}
            position={{
              x: 40 + index * 25,
              y: 40,
            }}
            rotation={0}
            isFiring={status === "engaging"}
            onFire={() => onFire?.(weapon.id)}
            className="absolute"
          />
        ))}
      </div>

      {/* Warning indicator for damaged state */}
      {status === "damaged" && (
        <div className="absolute top-0 right-0 p-2">
          <AlertTriangle className="w-6 h-6 text-yellow-500 animate-pulse" />
        </div>
      )}

      {/* Stealth visual effect */}
      <div 
        className={`absolute inset-0 transition-opacity duration-500 ${
          isStealthed ? "opacity-60" : "opacity-0"
        }`}
        style={{
          background: "radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.5) 100%)"
        }}
      />
    </div>
  );
}
