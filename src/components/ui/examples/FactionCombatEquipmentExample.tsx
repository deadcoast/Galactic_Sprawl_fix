/**
 * @context: ui-system, component-library, faction-system, combat-system
 * 
 * Example component demonstrating the use of the Faction Combat Equipment API
 */
import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useFactionCombatEquipment } from '../../../hooks/factions/useFactionBehavior';
import { WeaponSystem, WeaponCategory, WeaponStatus, WeaponInstance, WeaponMount } from '../../../types/weapons/WeaponTypes';
import { FactionId } from '../../../types/ships/FactionTypes';
import { FactionShipClass } from '../../../types/ships/FactionShipTypes';
import { Position } from '../../../types/core/GameTypes';
import { FactionCombatUnit } from '../../../hooks/factions/useFactionBehavior';

// Define ship type for our demo component that has all the properties we need
interface DemoShip {
  id: string;
  name: string;
  class: string;
  faction: FactionId;
  position: Position;
  stats: {
    health: number;
    maxHealth: number;
    shield: number;
    maxShield: number;
    armor: number;
    speed: number;
    turnRate: number;
    accuracy: number;
    evasion: number;
    criticalChance: number;
    criticalDamage: number;
    armorPenetration: number;
    shieldPenetration: number;
    experience: number;
    level: number;
  };
  status: {
    main: 'active' | 'disabled' | 'destroyed';
    effects: string[];
  };
  weaponMounts: WeaponMount[]; // Will be populated by our hook
  weapons: DemoWeapon[];
  formation: {
    type: 'balanced' | 'offensive' | 'defensive';
    spacing: number;
    facing: number;
    position: number;
  };
  tactics: {
    aggression: number;
    expansion: number;
    diplomacy: number;
  };
}

// Define a weapon type that matches our demo needs
interface DemoWeapon {
  id: string;
  type: string;
  damage: number;
  range: number;
  cooldown: number;
  status: string;
}

// Sample data for demonstration
const DEMO_FACTION_ID: FactionId = 'lost-nova';

const DEMO_SHIPS: DemoShip[] = [
  {
    id: 'ship-1',
    name: 'Eclipse Scythe',
    class: 'eclipse-scythe',
    faction: DEMO_FACTION_ID,
    position: { x: 100, y: 100 },
    stats: {
      health: 800,
      maxHealth: 1000,
      shield: 200,
      maxShield: 500,
      armor: 5,
      speed: 150,
      turnRate: 2.5,
      accuracy: 0.8,
      evasion: 0.2,
      criticalChance: 0.05,
      criticalDamage: 1.5,
      armorPenetration: 2,
      shieldPenetration: 1,
      experience: 0,
      level: 1,
    },
    status: {
      main: 'active',
      effects: [],
    },
    weaponMounts: [],
    weapons: [
      {
        id: 'weapon-1',
        type: 'gaussCannon',
        damage: 50,
        range: 300,
        cooldown: 2.5,
        status: 'ready',
      },
      {
        id: 'weapon-2',
        type: 'pulseWeapon',
        damage: 30,
        range: 200,
        cooldown: 1.0,
        status: 'ready',
      },
    ],
    formation: {
      type: 'balanced',
      spacing: 100,
      facing: 0,
      position: 1,
    },
    tactics: {
      aggression: 75,
      expansion: 40,
      diplomacy: 25,
    },
  },
  {
    id: 'ship-2',
    name: 'Void Revenant',
    class: 'void-revenant',
    faction: DEMO_FACTION_ID,
    position: { x: 150, y: 120 },
    stats: {
      health: 1200,
      maxHealth: 1200,
      shield: 600,
      maxShield: 600,
      armor: 10,
      speed: 120,
      turnRate: 1.8,
      accuracy: 0.85,
      evasion: 0.15,
      criticalChance: 0.08,
      criticalDamage: 1.8,
      armorPenetration: 5,
      shieldPenetration: 3,
      experience: 500,
      level: 3,
    },
    status: {
      main: 'active',
      effects: ['cloaked'],
    },
    weaponMounts: [],
    weapons: [
      {
        id: 'weapon-3',
        type: 'beamWeapon',
        damage: 120,
        range: 450,
        cooldown: 5.0,
        status: 'cooling',
      },
      {
        id: 'weapon-4',
        type: 'torpedoes',
        damage: 200,
        range: 350,
        cooldown: 8.0,
        status: 'ready',
      },
    ],
    formation: {
      type: 'offensive',
      spacing: 150,
      facing: 0,
      position: 0,
    },
    tactics: {
      aggression: 90,
      expansion: 30,
      diplomacy: 10,
    },
  },
];

// Define our formation configuration type
interface FormationConfig {
  type: 'offensive' | 'defensive' | 'balanced' | 'stealth';
  spacing: number;
  facing: number;
}

/**
 * Converts a DemoShip to a proper FactionCombatUnit for API compatibility
 */
function convertToFactionCombatUnit(ship: DemoShip): FactionCombatUnit {
  return {
    id: ship.id,
    name: ship.name,
    type: ship.class,
    class: ship.class as FactionShipClass, // Type conversion for demo
    faction: ship.faction,
    position: ship.position,
    rotation: 0, // Adding required properties
    velocity: { x: 0, y: 0 }, // Adding required properties
    stats: ship.stats,
    status: ship.status,
    weapons: ship.weapons.map(weapon => ({
      ...weapon,
      type: weapon.type as WeaponCategory,
      status: weapon.status as WeaponStatus,
      upgrades: []
    })),
    weaponMounts: ship.weaponMounts || [],
    formation: ship.formation,
    tactics: {
      formation: ship.formation.type,
      behavior: 'aggressive',
      target: undefined
    },
    experience: {
      current: ship.stats.experience,
      total: ship.stats.experience,
      level: ship.stats.level,
      skills: []
    }
  } as FactionCombatUnit;
}

/**
 * Converts a DemoWeapon to a proper WeaponSystem for API compatibility
 */
function convertToWeaponSystem(weapon: DemoWeapon): WeaponSystem {
  return {
    id: weapon.id,
    type: weapon.type as WeaponCategory,
    damage: weapon.damage,
    range: weapon.range,
    cooldown: weapon.cooldown,
    status: weapon.status as WeaponStatus
  };
}

/**
 * Example component demonstrating faction combat equipment management
 */
export function FactionCombatEquipmentExample() {
  // Use our new hook
  const {
    createWeaponInstance,
    createWeaponMounts,
    checkUnitStatus,
    getDistanceBetween,
    getShipClass,
    getShipStatus,
    standardizeShipClass,
    getOptimalFormation,
    combatEquipment,
  } = useFactionCombatEquipment(DEMO_FACTION_ID);

  // Local state for demo
  const [ships, setShips] = useState<DemoShip[]>(DEMO_SHIPS);
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
  const [weaponInstances, setWeaponInstances] = useState<Record<string, WeaponInstance>>({});
  const [distances, setDistances] = useState<Record<string, number>>({});
  const [formationConfig, setFormationConfig] = useState<FormationConfig | null>(null);
  const [shipClasses, setShipClasses] = useState<Record<string, string>>({});
  const [shipStatuses, setShipStatuses] = useState<Record<string, string>>({});

  // Utility function to update ship with weapon mounts
  const updateShipWithMounts = useCallback((shipId: string, mounts: WeaponMount[]) => {
    setShips(currentShips => 
      currentShips.map(ship => 
        ship.id === shipId ? { ...ship, weaponMounts: mounts } : ship
      )
    );
  }, []);

  // Generate weapon instances on mount
  useEffect(() => {
    // Process all ships
    ships.forEach(ship => {
      // Convert to FactionCombatUnit for proper typing
      const factionShip = convertToFactionCombatUnit(ship);
      
      // Get ship class and status for display
      const shipClassResult = getShipClass(factionShip);
      const shipStatusResult = getShipStatus(factionShip);
      
      setShipClasses(prev => ({
        ...prev,
        [ship.id]: shipClassResult
      }));
      
      setShipStatuses(prev => ({
        ...prev,
        [ship.id]: shipStatusResult
      }));
      
      // Create weapon mounts for the ship
      const mounts = createWeaponMounts(
        ship.weapons.map(convertToWeaponSystem), 
        ship.id
      );
      console.warn(`Created ${mounts.length} weapon mounts for ship ${ship.id}`);
      updateShipWithMounts(ship.id, mounts);
      
      // Create weapon instances
      ship.weapons.forEach(weapon => {
        const weaponInstance = createWeaponInstance(convertToWeaponSystem(weapon), {
          damageMultiplier: 1.2, // Lost Nova ships have 20% damage bonus
          rangeMultiplier: 1.1, // 10% range bonus
        });
        
        setWeaponInstances(prev => ({
          ...prev,
          [weapon.id]: weaponInstance,
        }));
      });
    });
    
    // Generate optimal formation
    const factionShips = ships.map(convertToFactionCombatUnit);
    const formation = getOptimalFormation(factionShips, 'main-fleet');
    setFormationConfig(formation);
    
    // Calculate distances between ships
    if (ships.length >= 2) {
      const distanceKey = `${ships[0].id}-${ships[1].id}`;
      const distance = getDistanceBetween(ships[0].position, ships[1].position);
      setDistances({ [distanceKey]: distance });
    }
    
    // Display combat equipment status
    console.warn('Combat equipment stats:', {
      weaponInstances: combatEquipment.weaponInstances.size,
      weaponMounts: combatEquipment.weaponMounts.size,
      shipClasses: combatEquipment.shipClassMap.size,
      shipStatuses: combatEquipment.shipStatusMap.size,
      formationConfigs: Object.keys(combatEquipment.formationConfigs).length
    });
  }, [
    ships, 
    createWeaponMounts, 
    createWeaponInstance, 
    getOptimalFormation, 
    getDistanceBetween,
    getShipClass,
    getShipStatus,
    combatEquipment,
    updateShipWithMounts
  ]);

  // Get selected ship
  const selectedShip = selectedShipId 
    ? ships.find(ship => ship.id === selectedShipId)
    : null;

  // Handle ship selection
  const handleSelectShip = (shipId: string) => {
    setSelectedShipId(shipId);
  };
  
  // Handle weapon upgrade
  const handleWeaponUpgrade = useCallback((shipId: string, weaponId: string) => {
    // Modify weapons to demonstrate state updates
    setShips(currentShips => 
      currentShips.map(ship => {
        if (ship.id === shipId) {
          return {
            ...ship,
            weapons: ship.weapons.map(weapon => {
              if (weapon.id === weaponId) {
                return {
                  ...weapon,
                  damage: Math.round(weapon.damage * 1.2) // 20% damage boost
                };
              }
              return weapon;
            })
          };
        }
        return ship;
      })
    );
    
    // Show updated weapon instances
    console.warn('Weapon instance updated:', weaponInstances[weaponId]?.config.name);
  }, [weaponInstances]);

  return (
    <div className="faction-combat-equipment-example">
      <h2>Faction Combat Equipment Example</h2>
      
      {/* Combat Equipment Stats Display */}
      <div className="combat-equipment-stats">
        <h3>Combat Equipment Status</h3>
        <div>Weapon Instances: {Object.keys(weaponInstances).length}</div>
        <div>Ship Classes: {Object.keys(shipClasses).length}</div>
        <div>Ship Statuses: {Object.keys(shipStatuses).length}</div>
      </div>
      
      {/* Ships List */}
      <div className="ship-list">
        <h3>Lost Nova Ships</h3>
        {ships.map(ship => (
          <div
            key={ship.id}
            className={`ship-item ${selectedShipId === ship.id ? 'selected' : ''}`}
            onClick={() => handleSelectShip(ship.id)}
          >
            <div className="ship-header">
              <span className="ship-name">{ship.name}</span>
              <span className="ship-class">{standardizeShipClass(ship.class)}</span>
            </div>
            <div className="ship-status">
              <div className="health-bar">
                <div 
                  className="health-fill" 
                  style={{ width: `${(ship.stats.health / ship.stats.maxHealth) * 100}%` }}
                />
              </div>
              <div className="shield-bar">
                <div 
                  className="shield-fill" 
                  style={{ width: `${(ship.stats.shield / ship.stats.maxShield) * 100}%` }}
                />
              </div>
            </div>
            <div className="ship-effects">
              {ship.status.effects.map(effect => (
                <span key={effect} className="status-effect">{effect}</span>
              ))}
            </div>
            <div className="ship-class-info">
              {shipClasses[ship.id] && (
                <div>Class: {shipClasses[ship.id]}</div>
              )}
              {shipStatuses[ship.id] && (
                <div>Status: {shipStatuses[ship.id]}</div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Selected Ship Details */}
      {selectedShip && (
        <div className="ship-details">
          <h3>{selectedShip.name} Details</h3>
          
          <div className="detail-section">
            <h4>Status</h4>
            <div>Main: {selectedShip.status.main}</div>
            <div>Has "cloaked" status: {
              checkUnitStatus(
                convertToFactionCombatUnit(selectedShip), 
                'cloaked'
              ).toString()
            }</div>
          </div>
          
          <div className="detail-section">
            <h4>Weapons</h4>
            {selectedShip.weapons.map(weapon => (
              <div key={weapon.id} className="weapon-item">
                <div><strong>{weapon.type}</strong> ({weapon.status})</div>
                <div>Damage: {weapon.damage}</div>
                <div>Range: {weapon.range}</div>
                <div>Cooldown: {weapon.cooldown}s</div>
                <button 
                  onClick={() => handleWeaponUpgrade(selectedShip.id, weapon.id)}
                  className="weapon-upgrade-btn"
                >
                  Upgrade
                </button>
                {weaponInstances[weapon.id] && (
                  <div className="weapon-instance-info">
                    <small>Instance ID: {weaponInstances[weapon.id].config.id}</small>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="detail-section">
            <h4>Weapon Mounts ({selectedShip.weaponMounts.length})</h4>
            {selectedShip.weaponMounts.map((mount, index) => (
              <div key={index} className="mount-item">
                <div>Mount {index + 1}: {mount.position} ({mount.size})</div>
                <div>Allowed weapons: {mount.allowedCategories.join(', ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Formation Display */}
      {formationConfig && (
        <div className="formation-display">
          <h3>Fleet Formation</h3>
          <div>Type: {formationConfig.type}</div>
          <div>Spacing: {formationConfig.spacing}</div>
          <div>Facing: {formationConfig.facing}°</div>
        </div>
      )}
      
      {/* Distance Display */}
      {Object.keys(distances).length > 0 && (
        <div className="distances-display">
          <h3>Distances</h3>
          {Object.entries(distances).map(([key, distance]) => (
            <div key={key}>
              <strong>{key}:</strong> {Math.round(distance)} units
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 