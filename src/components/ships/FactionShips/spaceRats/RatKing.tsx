import { SpaceRatShip } from "./SpaceRatShip";
import { WeaponMount } from "../../common/WeaponMount";
import { WeaponType } from "../../../../types/combat/CombatTypes";
import { FactionShipStats } from "../../../../types/ships/FactionShipTypes";
import { AlertTriangle, Sword, Shield, Target, SkullIcon } from "lucide-react";
import { useEffect, useState } from "react";

type ShipStatus =
  | "idle"
  | "engaging"
  | "patrolling"
  | "retreating"
  | "disabled"
  | "damaged";

interface RatKingProps {
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

export function RatKing({
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
}: RatKingProps) {
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);
  const [combatStance, setCombatStance] = useState<"aggressive" | "defensive" | "hit-and-run">("aggressive");

  // Special abilities configuration
  const specialAbilities = [
    {
      name: "Pirate's Fury",
      description: "Unleashes a devastating barrage of attacks, increasing damage output",
      cooldown: 30,
      energyCost: 0.7,
      icon: Sword,
      type: "damage"
    },
    {
      name: "Swarm Command",
      description: "Boost nearby Space Rat ships' attack speed and coordination",
      cooldown: 45,
      energyCost: 0.6,
      icon: Target,
      type: "buff"
    },
    {
      name: "Scavenger's Shield",
      description: "Reinforces shields using scavenged technology",
      cooldown: 25,
      energyCost: 0.5,
      icon: Shield,
      type: "defense"
    }
  ];

  // Combat stance effects
  useEffect(() => {
    if (health < maxHealth * 0.3) {
      setCombatStance("hit-and-run");
    } else if (status === "engaging" && stats.energy > stats.maxEnergy * 0.8) {
      setCombatStance("aggressive");
    }
  }, [health, maxHealth, status, stats.energy, stats.maxEnergy]);

  return (
    <div className="relative">
      {/* Ship Base Component */}
      <SpaceRatShip
        id={id}
        name="The Rat King"
        type="ratKing"
        status={status === "damaged" ? "disabled" : status === "idle" ? "patrolling" : status}
        health={health}
        maxHealth={maxHealth}
        shield={shield}
        maxShield={maxShield}
        tactics={combatStance}
        specialAbility={{
          name: selectedAbility || "Pirate's Fury",
          description: specialAbilities.find(a => a.name === selectedAbility)?.description || specialAbilities[0].description,
          cooldown: specialAbilities.find(a => a.name === selectedAbility)?.cooldown || 30,
          active: stats.energy > stats.maxEnergy * 0.7
        }}
      />

      {/* Combat Status Indicator */}
      <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-red-900/30 border border-red-700/50 text-red-400 text-sm font-bold flex items-center gap-2">
        <SkullIcon className="w-4 h-4" />
        <span>Flagship</span>
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-4 left-4 right-4 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={onEngage}
            disabled={status === "disabled"}
            className="flex-1 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg font-bold flex items-center justify-center gap-2"
          >
            <Sword className="w-4 h-4" />
            Attack
          </button>
          <button
            onClick={onRetreat}
            disabled={status === "disabled"}
            className="flex-1 px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 rounded-lg flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Retreat
          </button>
        </div>

        {/* Special Abilities */}
        <div className="grid grid-cols-3 gap-2">
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
                className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-bold ${
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
                damage: weapon.stats.damage * (combatStance === "aggressive" ? 1.2 : 1),
                accuracy: weapon.stats.accuracy * (combatStance === "hit-and-run" ? 1.15 : 1)
              }
            }}
            position={{
              x: 45 + index * 30,
              y: 45,
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
          <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
        </div>
      )}

      {/* Blood-red hue effect for flagship */}
      <div className="absolute inset-0 bg-red-900/10 rounded-lg pointer-events-none" />

      {/* Energy field effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-t from-red-900/5 to-transparent pointer-events-none"
        style={{
          maskImage: "radial-gradient(circle at 50% 50%, black, transparent)",
          WebkitMaskImage: "radial-gradient(circle at 50% 50%, black, transparent)"
        }}
      />
    </div>
  );
}
