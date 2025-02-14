import { FactionShipBase } from "./FactionShipBase";
import { EquatorHorizonShipClass, FactionShipStats } from "../../../types/ships/FactionShipTypes";
import { ReactNode } from "react";
import { WeaponMount } from "../../../types/weapons/WeaponTypes";
import { DamageEffect } from "../../../effects/types_effects/WeaponEffects";
import { useShipEffects } from "../../../hooks/ships/useShipEffects";
import { BaseEffect } from "../../../effects/types_effects/EffectTypes";
import { Shield, Target } from "lucide-react";
import { StatusEffect } from "../../ui/status/StatusEffect";
import { AbilityButton } from "../../ui/buttons/AbilityButton";
import { useCallback } from "react";

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
  stats: FactionShipStats;
  tactics: "aggressive" | "defensive" | "hit-and-run" | "stealth";
  position: { x: number; y: number };
  rotation: number;
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
  stats,
  tactics,
  position,
  rotation,
  onEngage,
  onRetreat,
  onSpecialAbility,
  onFire,
  children,
}: EquatorHorizonShipProps) {
  const { addEffect, removeEffect, hasEffect } = useShipEffects();

  // Handle weapon firing
  const handleWeaponFire = useCallback((weaponId: string) => {
    const weapon = weapons.find(mount => 
      mount.currentWeapon?.config.id === weaponId
    )?.currentWeapon;

    if (weapon && weapon.state.status === "ready") {
      // Apply weapon effects
      weapon.state.effects.forEach(effect => {
        if (effect.type === "damage") {
          console.debug(`[EquatorHorizonShip] Firing weapon ${weaponId} with strength ${effect.strength}`);
        }
      });

      // Update weapon state
      weapon.state.status = "cooling";
      setTimeout(() => {
        if (weapon) {
          weapon.state.status = "ready";
        }
      }, weapon.config.baseStats.cooldown * 1000);

      // Call the onFire callback if provided
      onFire?.(weaponId);
    }
  }, [weapons, onFire]);

  // Faction-specific effects
  const handleOvercharge = useCallback(() => {
    if (hasEffect("overcharge")) {
      removeEffect("overcharge");
      // Remove overcharge effect from weapons
      weapons.forEach(mount => {
        if (mount.currentWeapon) {
          mount.currentWeapon.state.effects = mount.currentWeapon.state.effects.filter(
            effect => effect.name !== "Overcharge"
          );
          
          // Reset weapon stats
          mount.currentWeapon.state.currentStats = {
            ...mount.currentWeapon.config.baseStats
          };
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
          const weaponEffect: DamageEffect = {
            type: "damage",
            name: "Overcharge",
            description: "Increases weapon damage and accuracy",
            duration: 10,
            strength: 1.4,
            magnitude: 1.4,
            damageType: "energy",
            penetration: 0.2,
            active: true,
            cooldown: 0
          };
          
          mount.currentWeapon.state.effects.push(weaponEffect);
          
          // Update weapon stats with overcharge
          const {currentStats} = mount.currentWeapon.state;
          mount.currentWeapon.state.currentStats = {
            ...currentStats,
            damage: currentStats.damage * 1.4,
            accuracy: Math.min(1, currentStats.accuracy * 1.4)
          };
        }
      });
    }
    onSpecialAbility?.();
  }, [addEffect, removeEffect, hasEffect, weapons, onSpecialAbility]);

  const handleReinforcedShields = useCallback(() => {
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
  }, [addEffect, removeEffect, hasEffect]);

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
        position,
        rotation,
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
        stats,
      }}
      onEngage={onEngage}
      onRetreat={onRetreat}
      onSpecialAbility={onSpecialAbility}
      onFire={handleWeaponFire}
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
