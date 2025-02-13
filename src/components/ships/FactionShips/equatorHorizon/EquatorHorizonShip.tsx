import { FactionShipBase } from "../FactionShipBase";
import { EquatorHorizonShipClass } from "../../../../types/ships/FactionShipTypes";
import { ReactNode } from "react";
import { 
  WeaponMount, 
  WeaponInstance,
  WeaponEffect,
  CombatWeaponStats 
} from "../../../../types/weapons/WeaponTypes";
import { useShipEffects } from "../../../../hooks/ships/useShipEffects";
import { BaseEffect } from "../../../../types/effects/EffectTypes";
import { Effect } from "../../../../types/core/GameTypes";
import { Zap, Shield, Target } from "lucide-react";
import { StatusEffect } from "../../../ui/status/StatusEffect";
import { AbilityButton } from "../../../ui/buttons/AbilityButton";

interface EquatorHorizonShipProps {
  id: string;
  name: string;
  type: EquatorHorizonShipClass;
  status: "engaging" | "patrolling" | "retreating" | "disabled";
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  weapons: WeaponMount[];
  tactics: "aggressive" | "defensive" | "hit-and-run" | "stealth";
  onEngage?: () => void;
  onRetreat?: () => void;
  onSpecialAbility?: () => void;
  onFire?: (weaponId: string) => void;
  children?: ReactNode;
}

/**
 * EquatorHorizonShip Component
 * 
 * Base component for Equator Horizon faction ships.
 * Provides faction-specific styling and behavior.
 */
export function EquatorHorizonShip({
  id,
  name,
  type,
  status,
  health,
  maxHealth,
  shield,
  maxShield,
  weapons,
  tactics,
  onEngage,
  onRetreat,
  onSpecialAbility,
  onFire,
  children,
}: EquatorHorizonShipProps) {
  const { addEffect, removeEffect, hasEffect } = useShipEffects();

  // Faction-specific effects
  const handleOvercharge = () => {
    if (hasEffect("overcharge")) {
      removeEffect("overcharge");
      // Remove overcharge effect from weapons
      weapons.forEach(mount => {
        if (mount.currentWeapon) {
          mount.currentWeapon.state.effects = mount.currentWeapon.state.effects.filter(
            effect => effect.name !== "Overcharge"
          );
        }
      });
    } else {
      const baseEffect: BaseEffect = {
        id: "overcharge",
        name: "Overcharge",
        description: "Increases weapon damage and accuracy",
        type: "accuracy",
        magnitude: 1.4,
        duration: 10,
        active: true,
      };
      addEffect(baseEffect);

      // Apply overcharge effect to all weapons
      weapons.forEach(mount => {
        if (mount.currentWeapon) {
          const weaponEffect: Effect = {
            name: "Overcharge",
            description: "Increases weapon damage and accuracy",
            type: "accuracy",
            magnitude: 1.4,
            duration: 10,
            active: true,
            cooldown: 0,
          };
          
          mount.currentWeapon.state.effects.push(weaponEffect);
        }
      });
    }
    onSpecialAbility?.();
  };

  const handleReinforcedShields = () => {
    if (hasEffect("reinforced-shields")) {
      removeEffect("reinforced-shields");
    } else {
      const shieldEffect: BaseEffect = {
        id: "reinforced-shields",
        name: "Reinforced Shields",
        description: "Boosts shield strength and regeneration",
        type: "shield",
        magnitude: 1.5,
        duration: 15,
        active: true,
      };
      addEffect(shieldEffect);
    }
  };

  return (
    <FactionShipBase
      ship={{
        id,
        name,
        class: type,
        faction: "equator-horizon",
        status,
        tactics,
        category: "war",
        health,
        maxHealth,
        shield,
        maxShield,
        abilities: [
          {
            name: "Overcharge",
            description: "Increases weapon damage and accuracy",
            cooldown: 15,
            duration: 10,
            active: hasEffect("overcharge"),
            effect: {
              type: "accuracy",
              name: "Overcharge",
              description: "Increases weapon damage and accuracy",
              magnitude: 1.4,
              duration: 10,
            },
          },
          {
            name: "Reinforced Shields",
            description: "Boosts shield strength and regeneration",
            cooldown: 20,
            duration: 15,
            active: hasEffect("reinforced-shields"),
            effect: {
              type: "shield",
              name: "Reinforced Shields",
              description: "Boosts shield strength and regeneration",
              magnitude: 1.5,
              duration: 15,
            },
          },
        ],
        stats: {
          health,
          maxHealth,
          shield,
          maxShield,
          energy: 100,
          maxEnergy: 100,
          speed: 80,
          turnRate: 2,
          cargo: 200,
          weapons,
          abilities: [],
          defense: {
            armor: 200,
            shield,
            evasion: 0.3,
            regeneration: 3,
          },
          mobility: {
            speed: 80,
            turnRate: 2,
            acceleration: 40,
          },
        },
      }}
      onEngage={onEngage}
      onRetreat={onRetreat}
      onSpecialAbility={onSpecialAbility}
    >
      {/* Status Effects */}
      <StatusEffect
        active={hasEffect("overcharge")}
        icon={Target}
        label="Overcharge"
        color="amber"
      />
      <StatusEffect
        active={hasEffect("reinforced-shields")}
        icon={Shield}
        label="Reinforced Shields"
        color="cyan"
      />

      {/* Ability Buttons */}
      <AbilityButton
        active={hasEffect("overcharge")}
        icon={Target}
        label="Overcharge"
        color="amber"
        onClick={handleOvercharge}
      />
      <AbilityButton
        active={hasEffect("reinforced-shields")}
        icon={Shield}
        label="Reinforced Shields"
        color="cyan"
        onClick={handleReinforcedShields}
      />

      {children}
    </FactionShipBase>
  );
}
