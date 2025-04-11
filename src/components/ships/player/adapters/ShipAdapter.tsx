import { useState } from 'react';
import { CommonShipAbility } from '../../../../types/ships/CommonShipTypes';
import { PlayerShip, PlayerShipClass } from '../../../../types/ships/PlayerShipTypes';
import { UnifiedShipStatus } from '../../../../types/ships/UnifiedShipTypes';

// Import specific player ship components with corrected paths
import { OrionFrigate } from '../variants/warships/OrionFrigate';
import { Spitflare } from '../variants/warships/Spitflare';
import { StarSchooner } from '../variants/warships/StarSchooner'; // Corrected path
// ... import other player ship components ...
import { WarShip, WarShipProps } from '../variants/warships/WarShip'; // Fallback and its props

interface ShipAdapterProps {
  ship: PlayerShip;
  quality: 'high' | 'medium' | 'low';
  onDeploy?: () => void;
  onRecall?: () => void;
  onFire?: () => void;
  onAbility?: (ability: CommonShipAbility) => void;
  onUpgrade?: () => void;
}

// Map PlayerShipClass enum values to components
const shipTypeMap: Partial<Record<PlayerShipClass, React.ComponentType<any>>> = {
  [PlayerShipClass.SPITFLARE]: Spitflare,
  [PlayerShipClass.STAR_SCHOONER]: StarSchooner,
  [PlayerShipClass.ORION_FRIGATE]: OrionFrigate,
  // ... add mappings for all PlayerShipClass members ...
  // [PlayerShipClass.HARBRINGER_GALLEON]: HarbringerGalleon, // Example
  // Remove duplicate mappings added earlier
};

// Helper function to map UnifiedShipStatus to the string union expected by WarShip
const mapStatusForWarship = (status: UnifiedShipStatus): WarShipProps['ship']['status'] => {
  switch (status) {
    case UnifiedShipStatus.ENGAGING:
    case UnifiedShipStatus.ATTACKING:
      return 'engaging';
    case UnifiedShipStatus.PATROLLING:
    case UnifiedShipStatus.READY: // Map READY to patrolling for WarShip
      return 'patrolling';
    case UnifiedShipStatus.RETREATING:
    case UnifiedShipStatus.RETURNING:
    case UnifiedShipStatus.WITHDRAWING:
      return 'returning'; // Map to returning for WarShip
    case UnifiedShipStatus.DAMAGED:
      return 'damaged';
    case UnifiedShipStatus.DISABLED: // Map DISABLED to damaged for WarShip if no direct equivalent
    case UnifiedShipStatus.REPAIRING:
    case UnifiedShipStatus.UPGRADING:
    case UnifiedShipStatus.MAINTENANCE:
      return 'damaged'; // Or potentially 'idle' if WarShip has it
    case UnifiedShipStatus.IDLE:
    default:
      return 'idle'; // Default to idle for WarShip
  }
};

export function ShipAdapter({
  ship,
  quality,
  onDeploy,
  onRecall,
  onFire,
  onAbility,
  onUpgrade,
}: ShipAdapterProps) {
  const [activeAbilities, setActiveAbilities] = useState<Record<string, boolean>>({});

  const handleAbilityToggle = (ability: CommonShipAbility) => {
    setActiveAbilities(prev => ({
      ...prev,
      [ability.id]: !prev[ability.id],
    }));
    onAbility?.(ability);
  };

  // Determine the component based on ship class
  const ShipComponent = shipTypeMap[ship.class] || WarShip; // Use WarShip as fallback

  // Create the adapted ship object matching WarShipProps['ship'] structure
  // TODO: This mapping needs to be adjusted based on the *actual* ShipComponent selected
  const adaptedShip: WarShipProps['ship'] = {
    id: ship.id,
    name: ship.name,
    type: ship.class as WarShipProps['ship']['type'],
    tier: ship.stats.tier,
    status: mapStatusForWarship(ship.status), // Map the status
    hull: ship.stats.health,
    maxHull: ship.stats.maxHealth,
    shield: ship.stats.shield,
    maxShield: ship.stats.maxShield,
    // Filter out empty mounts before mapping weapons
    weapons: (ship.stats.weapons || [])
      .filter(w => w.currentWeapon)
      .map(w => ({
        id: w.id,
        name: w.currentWeapon!.config.name, // Use non-null assertion as we filtered
        type: w.currentWeapon!.config.category, // Assign WeaponCategory directly
        damage: w.currentWeapon!.config.baseStats.damage,
        range: w.currentWeapon!.config.baseStats.range,
        cooldown: w.currentWeapon!.config.baseStats.cooldown,
        status: w.currentWeapon!.state.status, // Use status from weapon state
      })),
    specialAbilities: ship.abilities, // Assuming PlayerShipAbility is compatible
    // alerts: ship.alerts, // Add if PlayerShip has alerts
  };

  return (
    <div className="ship-adapter-wrapper" data-quality={quality}>
      <ShipComponent
        ship={adaptedShip} // Pass the mapped ship object
        quality={quality}
        // Pass required callbacks, providing defaults
        onDeploy={onDeploy ?? (() => {})}
        onRecall={onRecall ?? (() => {})}
      />

      {/* Adapter-specific UI example (Abilities toggle state) */}
      {ship.abilities && ship.abilities.length > 0 && (
        <div
          className="adapter-abilities"
          style={{ marginTop: '10px', borderTop: '1px solid #444', paddingTop: '10px' }}
        >
          <h5 style={{ fontSize: '0.8em', color: '#aaa' }}>Adapter Ability State:</h5>
          {ship.abilities.map(ability => (
            <button
              key={ability.id} // Use id for key
              onClick={() => handleAbilityToggle(ability)} // Use adapter's handler
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '2px 5px',
                fontSize: '0.8em',
                backgroundColor: activeAbilities[ability.id] ? '#334' : 'transparent',
                color: activeAbilities[ability.id] ? 'lime' : '#aaa',
              }}
            >
              {ability.name}: {activeAbilities[ability.id] ? 'Active' : 'Inactive'} (Toggle)
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
