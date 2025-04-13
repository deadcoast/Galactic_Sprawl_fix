import { useCallback, useState } from 'react';
import { shipClassConfigs } from '../../config/factions/factionConfig';
import { shipFactory } from '../../factories/ships/ShipFactory';
import { Position } from '../../types/core/GameTypes';
import { FactionShipClass } from '../../types/ships/FactionShipTypes';
import { FactionId } from '../../types/ships/FactionTypes';
import { UnifiedShip } from '../../types/ships/ShipTypes';

interface FleetComposition {
  factionId: FactionId;
  ships: UnifiedShip[];
  formation: {
    type: 'offensive' | 'defensive' | 'balanced';
    spacing: number;
    facing: number;
  };
}

const factionConfigMap: Record<FactionId, keyof typeof shipClassConfigs> = {
  'space-rats': 'spaceRats',
  'lost-nova': 'lostNova',
  'equator-horizon': 'equatorHorizon',
  player: 'spaceRats',
  enemy: 'lostNova',
  neutral: 'equatorHorizon',
  ally: 'spaceRats',
};

export function useShipClassManager() {
  const [fleets, setFleets] = useState<Record<string, FleetComposition>>({});

  const createFleet = useCallback(
    (
      factionId: FactionId,
      shipClasses: FactionShipClass[],
      position: Position,
      formation: { type: 'offensive' | 'defensive' | 'balanced'; spacing: number; facing: number }
    ) => {
      const ships = shipFactory.createFleet(factionId, shipClasses, position, formation);
      const fleetId = `${factionId}-fleet-${Date.now()}`;

      setFleets(prev => ({
        ...prev,
        [fleetId]: {
          factionId,
          ships,
          formation,
        },
      }));

      return fleetId;
    },
    []
  );

  const addShipToFleet = useCallback(
    (fleetId: string, shipClass: FactionShipClass, position: Position) => {
      setFleets(prev => {
        const fleet = prev[fleetId];
        if (!fleet) {
          console.warn(`Fleet with ID ${fleetId} not found.`);
          return prev;
        }

        const newShip = shipFactory.createShip(shipClass, {
          position,
          factionId: fleet.factionId,
        });

        return {
          ...prev,
          [fleetId]: {
            ...fleet,
            ships: [...fleet.ships, newShip],
          },
        };
      });
    },
    []
  );

  const removeShipFromFleet = useCallback((fleetId: string, shipId: string) => {
    setFleets(prev => {
      const fleet = prev[fleetId];
      if (!fleet) {
        return prev;
      }

      return {
        ...prev,
        [fleetId]: {
          ...fleet,
          ships: fleet.ships.filter(ship => ship.id !== shipId),
        },
      };
    });
  }, []);

  const updateFleetFormation = useCallback(
    (
      fleetId: string,
      formation: { type: 'offensive' | 'defensive' | 'balanced'; spacing: number; facing: number }
    ) => {
      setFleets(prev => {
        const fleet = prev[fleetId];
        if (!fleet) {
          return prev;
        }

        // Recalculate ship positions based on new formation
        const updatedShips = fleet.ships.map((ship, index) => ({
          ...ship,
          position: {
            x: fleet.ships[0].position.x + Math.cos(formation.facing) * formation.spacing * index,
            y: fleet.ships[0].position.y + Math.sin(formation.facing) * formation.spacing * index,
          },
          formation,
        }));

        return {
          ...prev,
          [fleetId]: {
            ...fleet,
            ships: updatedShips,
            formation,
          },
        };
      });
    },
    []
  );

  const getAvailableShipClasses = useCallback((factionId: FactionId): FactionShipClass[] => {
    const configKey = factionConfigMap[factionId];
    return configKey ? (shipClassConfigs[configKey]?.classes ?? []) : [];
  }, []);

  const getFleet = useCallback(
    (fleetId: string) => {
      return fleets[fleetId];
    },
    [fleets]
  );

  const getAllFleets = useCallback(() => {
    return fleets;
  }, [fleets]);

  return {
    createFleet,
    addShipToFleet,
    removeShipFromFleet,
    updateFleetFormation,
    getAvailableShipClasses,
    getFleet,
    getAllFleets,
  };
}
