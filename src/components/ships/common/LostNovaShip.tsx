import { FactionShipBase } from "./FactionShipBase";
import { LostNovaShipClass } from "../../../types/ships/FactionShipTypes";
import { ReactNode } from "react";
import { 
  WeaponMount, 
  WeaponInstance,
  CombatWeaponStats 
} from "../../../types/weapons/WeaponTypes";
import { WeaponEffect } from "../../../effects/types_effects/WeaponEffects";
import { useShipEffects } from "../../../hooks/ships/useShipEffects";
import { BaseEffect } from "../../../effects/types_effects/EffectTypes";
import { Effect } from "../../../types/core/GameTypes";
import { Zap, Eye, Shield } from "lucide-react";
import { StatusEffect } from "../../ui/status/StatusEffect";
import { AbilityButton } from "../../ui/buttons/AbilityButton";
import { FactionShip } from "./FactionShipStats";
import { FactionShipStats } from "../../../types/ships/FactionShipTypes";

interface LostNovaShipProps {
  id: string;
  name: string;
  type: LostNovaShipClass;
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
 * LostNovaShip Component
 * 
 * Base component for Lost Nova faction ships.
 * Provides faction-specific styling and behavior.
 */
export function LostNovaShip({
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
}: LostNovaShipProps) {
  const { addEffect, removeEffect, hasEffect } = useShipEffects();

  // Faction-specific effects
  const handleVoidPulse = () => {
    if (hasEffect("void-pulse")) {
      removeEffect("void-pulse");
      // Remove void pulse effect from weapons
      weapons.forEach(mount => {
        if (mount.currentWeapon) {
          mount.currentWeapon.state.effects = mount.currentWeapon.state.effects.filter(
            effect => effect.name !== "Void Pulse"
          );
        }
      });
    } else {
      const baseEffect: BaseEffect = {
        id: "void-pulse",
        name: "Void Pulse",
        description: "Disrupts enemy shields and cloaking",
        type: "jamming",
        magnitude: 1.0,
        duration: 8,
        active: true,
      };
      addEffect(baseEffect);

      // Apply void pulse effect to all weapons
      weapons.forEach(mount => {
        if (mount.currentWeapon) {
          const weaponEffect: WeaponEffect = {
            type: "damage",
            name: "Void Pulse",
            description: "Disrupts enemy shields and cloaking",
            duration: 8,
            strength: 1.0,
            magnitude: 1.0,
            active: true,
            cooldown: 0
          };
          mount.currentWeapon.state.effects.push(weaponEffect);
        }
      });
    }
    onSpecialAbility?.();
  };

  const handleStealthField = () => {
    if (hasEffect("stealth-field")) {
      removeEffect("stealth-field");
    } else {
      const stealthEffect: BaseEffect = {
        id: "stealth-field",
        name: "Stealth Field",
        description: "Reduces detection range and increases evasion",
        type: "stealth",
        magnitude: 1.0,
        duration: 12,
        active: true,
      };
      addEffect(stealthEffect);
    }
  };

  return (
    <>
      <FactionShipBase
        ship={{
          id,
          name,
          class: type,
          faction: "lost-nova",
          status,
          tactics,
          category: "recon",
          health,
          maxHealth,
          shield,
          maxShield,
          position,
          rotation,
          abilities: [
            {
              name: "Void Pulse",
              description: "Disrupts enemy shields and cloaking",
              cooldown: 12,
              duration: 8,
              active: hasEffect("void-pulse"),
              effect: {
                type: "jamming",
                name: "Void Pulse",
                description: "Disrupts enemy shields and cloaking",
                magnitude: 1.0,
                duration: 8,
              },
            },
            {
              name: "Stealth Field",
              description: "Reduces detection range and increases evasion",
              cooldown: 15,
              duration: 12,
              active: hasEffect("stealth-field"),
              effect: {
                type: "stealth",
                name: "Stealth Field",
                description: "Reduces detection range and increases evasion",
                magnitude: 1.0,
                duration: 12,
              },
            },
          ],
          stats,
        }}
        onEngage={onEngage}
        onRetreat={onRetreat}
        onSpecialAbility={onSpecialAbility}
      >
        {/* Status Effects */}
        <StatusEffect
          active={hasEffect("void-pulse")}
          icon={Zap}
          label="Void Pulse"
          color="purple"
        />
        <StatusEffect
          active={hasEffect("stealth-field")}
          icon={Eye}
          label="Stealth Field"
          color="indigo"
        />

        {/* Ability Buttons */}
        <AbilityButton
          active={hasEffect("void-pulse")}
          icon={Zap}
          label="Void Pulse"
          color="purple"
          onClick={handleVoidPulse}
        />
        <AbilityButton
          active={hasEffect("stealth-field")}
          icon={Eye}
          label="Stealth Field"
          color="indigo"
          onClick={handleStealthField}
        />

        {children}
      </FactionShipBase>

      {/* Ship Stats Display */}
      <FactionShip
        ship={{
          id,
          name,
          class: type,
          faction: "lost-nova",
          status,
          tactics,
          category: "recon",
          health,
          maxHealth,
          shield,
          maxShield,
          position,
          rotation,
          stats,
          abilities: [
            {
              name: "Void Pulse",
              description: "Disrupts enemy shields and cloaking",
              cooldown: 12,
              duration: 8,
              active: hasEffect("void-pulse"),
              effect: {
                type: "jamming",
                name: "Void Pulse",
                description: "Disrupts enemy shields and cloaking",
                magnitude: 1.0,
                duration: 8,
              },
            },
            {
              name: "Stealth Field",
              description: "Reduces detection range and increases evasion",
              cooldown: 15,
              duration: 12,
              active: hasEffect("stealth-field"),
              effect: {
                type: "stealth",
                name: "Stealth Field",
                description: "Reduces detection range and increases evasion",
                magnitude: 1.0,
                duration: 12,
              },
            },
          ],
        }}
        onEngage={onEngage}
        onRetreat={onRetreat}
        onSpecialAbility={onSpecialAbility}
      />
    </>
  );
}
