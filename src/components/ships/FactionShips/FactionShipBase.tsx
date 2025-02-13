import { FactionShipProps, FactionShip } from "../../../types/ships/FactionShipTypes";
import { BaseShip } from "../base/BaseShip";
import { StatusEffectContainer } from "../../ui/status/StatusEffect";
import { AbilityButtonContainer } from "../../ui/buttons/AbilityButton";
import { ReactNode, useEffect } from "react";
import { ShipStatus } from "../../../types/ships/ShipTypes";
import { useShipState } from "../../../contexts/ShipContext";
import { useShipActions } from "../../../hooks/ships/useShipActions";
import { useShipEffects } from "../../../hooks/ships/useShipEffects";
import { BaseEffect } from "../../../effects/types_effects/EffectTypes";

const FACTION_COLORS = {
  "space-rats": "red",
  "lost-nova": "violet",
  "equator-horizon": "amber",
} as const;

interface FactionShipBaseProps {
  className?: string;
  ship: FactionShip;
  onEngage?: () => void;
  onRetreat?: () => void;
  onSpecialAbility?: () => void;
  children?: ReactNode;
}

/**
 * Maps the full ShipStatus to the limited status type used by BaseShip
 */
function mapShipStatus(status: ShipStatus): "engaging" | "patrolling" | "retreating" | "disabled" {
  switch (status) {
    case "engaging":
      return "engaging";
    case "patrolling":
      return "patrolling";
    case "retreating":
      return "retreating";
    case "disabled":
      return "disabled";
    case "damaged":
      return "disabled";
    case "ready":
    case "idle":
    default:
      return "patrolling";
  }
}

/**
 * FactionShipContent Component
 * 
 * Internal component that uses ship state hooks
 */
function FactionShipContent({
  ship,
  onEngage,
  onRetreat,
  onSpecialAbility,
  className = "",
  children,
}: FactionShipBaseProps) {
  const { state } = useShipState();
  const { updateStatus } = useShipActions();
  const { activeEffects, clearExpiredEffects } = useShipEffects();

  // Clear expired effects periodically
  useEffect(() => {
    const interval = setInterval(clearExpiredEffects, 1000);
    return () => clearInterval(interval);
  }, [clearExpiredEffects]);

  // Update ship status when faction status changes
  useEffect(() => {
    updateStatus(mapShipStatus(ship.status));
  }, [ship.status, updateStatus]);

  const color = FACTION_COLORS[ship.faction];

  return (
    <div className={`bg-${color}-900/20 border border-${color}-700/30 rounded-lg p-6 ${className}`}>
      {/* Faction Info */}
      <div className="flex items-center text-sm text-gray-400 mb-4">
        <span className="capitalize">
          {ship.faction.replace(/-/g, " ")}
        </span>
        <span className="mx-2">•</span>
        <span>{ship.class.replace(/([A-Z])/g, ' $1').trim()}</span>
      </div>

      {/* Status Effects */}
      <StatusEffectContainer className="mb-4">
        {activeEffects.map((effect: BaseEffect) => (
          <div
            key={effect.id}
            className={`px-3 py-2 bg-${color}-900/30 rounded-lg text-sm mb-2 last:mb-0`}
          >
            <div className="font-medium text-gray-300">{effect.name}</div>
            <div className="text-xs text-gray-400">{effect.description}</div>
          </div>
        ))}
        {children}
      </StatusEffectContainer>

      {/* Ship Stats */}
      {ship.stats.abilities.length > 0 && (
        <div className="mb-4">
          {ship.stats.abilities.map((ability, index) => (
            <div key={index} className="mb-2 last:mb-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-300">
                  {ability.name}
                </span>
                <span className="text-sm text-gray-400">
                  {ability.cooldown}s
                </span>
              </div>
              <p className="text-sm text-gray-400">
                {ability.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Ability Buttons */}
      <AbilityButtonContainer>
        {children}
      </AbilityButtonContainer>
    </div>
  );
}

/**
 * FactionShipBase Component
 * 
 * Base component for all faction ships that provides:
 * - Faction-specific styling and colors
 * - Integration with BaseShip functionality
 * - Status effect and ability button containers
 */
export function FactionShipBase(props: FactionShipBaseProps) {
  const { ship, ...rest } = props;

  return (
    <BaseShip
      id={ship.id}
      name={ship.name}
      status={mapShipStatus(ship.status)}
      health={ship.health}
      maxHealth={ship.maxHealth}
      shield={ship.shield}
      maxShield={ship.maxShield}
      weapons={ship.stats.weapons}
      stats={ship.stats}
    >
      <FactionShipContent ship={ship} {...rest} />
    </BaseShip>
  );
}
