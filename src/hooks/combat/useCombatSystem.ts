import { useCallback, useEffect, useState } from 'react';
import { getCombatManager } from '../../managers/ManagerRegistry';
import { FleetFormation } from '../../types/combat/CombatTypes';
import { Position } from '../../types/core/GameTypes';
import { CombatUnitStatus } from '../../types/events/CombatEvents';
import { BaseEvent } from '../../types/events/EventTypes';

/**
 * Enhanced combat system hook for managing fleet formations and tactics
 */
export function useCombatSystem() {
  const [threatLevel, setThreatLevel] = useState(0);
  const [activeUnits, setActiveUnits] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [activeFleets, setActiveFleets] = useState<string[]>([]);
  const [formations, setFormations] = useState<Record<string, FleetFormation>>({});

  useEffect(() => {
    const combatManager = getCombatManager();

    // Subscribe to combat events
    const unsubscribeUnitSpawned = combatManager.subscribe('combat:unit-spawned', event => {
      setActiveUnits(prev => prev + 1);
      // Update threat level based on unit type and faction
      if (event?.faction !== 'player') {
        setThreatLevel(prev => prev + getThreatValueForUnit(event?.unitType));
      }
      setIsActive(true);
    });

    const unsubscribeUnitDestroyed = combatManager.subscribe('combat:unit-destroyed', event => {
      setActiveUnits(prev => prev - 1);
      // Check if combat is still active
      if (activeUnits <= 1) {
        setIsActive(false);
      }
    });

    // Initial state setup
    const currentUnits = combatManager.getAllUnits();
    setActiveUnits(currentUnits.length);
    setIsActive(currentUnits.length > 0);

    return () => {
      unsubscribeUnitSpawned();
      unsubscribeUnitDestroyed();
    };
  }, [activeUnits]);

  /**
   * Update formation configuration for a fleet
   */
  const updateFleetFormation = useCallback((fleetId: string, formation: FleetFormation) => {
    const combatManager = getCombatManager();
    // Get all units in the fleet
    const fleetUnits = combatManager.getAllUnits().filter(unit => unit.faction === fleetId);

    // Update each unit's position based on formation
    fleetUnits.forEach((unit, index) => {
      const basePosition = unit.position;
      const offset = calculateFormationOffset(formation.type, index, fleetUnits.length);
      const newPosition = {
        x: basePosition.x + offset.x,
        y: basePosition.y + offset.y,
      };
      combatManager.moveUnit(unit.id, newPosition);
    });

    setFormations(prev => ({
      ...prev,
      [fleetId]: formation,
    }));
  }, []);

  /**
   * Update tactical behavior for a fleet
   */
  const updateFleetTactic = useCallback(
    (fleetId: string, tactic: 'flank' | 'charge' | 'kite' | 'hold') => {
      const combatManager = getCombatManager();
      const fleetUnits = combatManager.getAllUnits().filter(unit => unit.faction === fleetId);

      // Update each unit's status based on tactic
      fleetUnits.forEach(unit => {
        const status = getTacticStatus(tactic);
        combatManager.changeUnitStatus(unit.id, status);
      });

      setActiveFleets(prev => {
        if (!prev.includes(fleetId)) {
          return [...prev, fleetId];
        }
        return prev;
      });
    },
    []
  );

  /**
   * Get current formations for all fleets
   */
  const getFleetFormations = useCallback(() => {
    return formations;
  }, [formations]);

  /**
   * Get current tactics for all fleets
   */
  const getFleetTactics = useCallback(() => {
    const combatManager = getCombatManager();
    const units = combatManager.getAllUnits();
    const tactics: Record<string, string> = {};

    units.forEach(unit => {
      if (unit.faction && !tactics[unit.faction]) {
        tactics[unit.faction] = getStatusTactic(unit.status);
      }
    });

    return tactics;
  }, []);

  return {
    threatLevel,
    activeUnits,
    isActive,
    activeFleets,
    formations,
    updateFleetFormation,
    updateFleetTactic,
    getFleetFormations,
    getFleetTactics,
  };
}

// Helper function to calculate threat value based on unit type
function getThreatValueForUnit(unitType: string): number {
  const threatValues: Record<string, number> = {
    spitflare: 1,
    starSchooner: 2,
    orionFrigate: 3,
    harbringerGalleon: 4,
    midwayCarrier: 5,
    motherEarthRevenge: 6,
  };
  return threatValues[unitType] || 1;
}

// Helper function to calculate formation offset based on formation type
function calculateFormationOffset(
  formationType: 'offensive' | 'defensive' | 'balanced',
  index: number,
  totalUnits: number
): Position {
  const spacing = 100; // Default spacing

  switch (formationType) {
    case 'offensive': {
      // Wedge formation
      return {
        x: index * spacing * Math.cos(Math.PI / 4),
        y: index * spacing * Math.sin(Math.PI / 4),
      };
    }
    case 'defensive': {
      // Circle formation
      const angle = (2 * Math.PI * index) / totalUnits;
      return {
        x: spacing * Math.cos(angle),
        y: spacing * Math.sin(angle),
      };
    }
    case 'balanced': {
      // Line formation
      return {
        x: index * spacing,
        y: 0,
      };
    }
  }
}

// Helper function to convert tactic to status
function getTacticStatus(tactic: string): CombatUnitStatus {
  switch (tactic) {
    case 'flank':
      return 'moving';
    case 'charge':
      return 'attacking';
    case 'kite':
      return 'retreating';
    case 'hold':
      return 'defending';
    default:
      return 'idle';
  }
}

// Helper function to convert status to tactic
function getStatusTactic(status: CombatUnitStatus): string {
  switch (status) {
    case 'moving':
      return 'flank';
    case 'attacking':
      return 'charge';
    case 'retreating':
      return 'kite';
    case 'defending':
      return 'hold';
    default:
      return 'hold';
  }
}

export function useUnitCombat(unitId: string) {
  const [unitStatus, setUnitStatus] = useState(() => getCombatManager().getUnitStatus(unitId));

  useEffect(() => {
    const interval = setInterval(() => {
      const status = getCombatManager().getUnitStatus(unitId);
      setUnitStatus(status);
    }, 250); // More frequent updates for combat units

    return () => clearInterval(interval);
  }, [unitId]);

  return {
    status: unitStatus?.status ?? 'idle',
    health: unitStatus?.stats?.health ?? 0,
    shield: unitStatus?.stats?.shield ?? 0,
    target: unitStatus?.target,
    position: unitStatus?.position,
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleDamageTaken = (_event: BaseEvent): void => {
  // Placeholder: Update UI or trigger other effects when a unit takes damage
  // Could update a unit's health bar, show damage numbers, etc.
};
