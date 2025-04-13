import * as React from 'react';
import { useEffect, useRef } from 'react';
import { shipBehaviorManager } from '../../../lib/ai/shipBehavior';
import { shipMovementManager } from '../../../lib/ai/shipMovement';
import { TechTreeManager } from '../../../managers/game/techTreeManager';
import { ResourceType } from '../../../types/resources/ResourceTypes';
import { getDefaultCapabilities, getShipCategory } from '../../../types/ships/CommonShipTypes';
import { ResourceTypeConverter } from '../../../utils/resources/ResourceTypeConverter';

interface Position {
  x: number;
  y: number;
}

interface CommonShipMovementProps {
  id: string;
  type: string;
  position: Position;
  rotation: number;
  stats: {
    maxSpeed: number;
    acceleration: number;
    rotationSpeed: number;
  };
  onPositionUpdate: (position: Position, rotation: number) => void;
}

export const CommonShipMovement: React.FC<CommonShipMovementProps> = ({
  id,
  type,
  position,
  rotation,
  stats,
  onPositionUpdate,
}) => {
  const positionRef = useRef(position);
  const rotationRef = useRef(rotation);

  useEffect(() => {
    // Register ship with behavior and movement systems
    const category = getShipCategory(type);
    const capabilities = getDefaultCapabilities(category);

    // Enable salvage for combat ships if they have the cutting laser
    if (category === 'combat' && TechTreeManager.getInstance().hasCombatShipSalvage()) {
      capabilities.canSalvage = true;
    }

    shipBehaviorManager.registerShip({
      id,
      type: ResourceTypeConverter.stringToEnum(type) || ResourceType.MINERALS,
      category,
      capabilities,
      position: positionRef.current,
      stats: {
        health: 100,
        shield: 100,
        speed: stats.maxSpeed,
        maneuverability: stats.rotationSpeed,
        cargo: 100,
      },
    });

    shipMovementManager.registerShip(id, positionRef.current, stats);

    // Set up movement update listener
    const handlePositionUpdate = (event: CustomEvent) => {
      if (event && event.detail) {
        const { shipId, position: newPosition, rotation: newRotation } = event.detail;
        if (shipId === id) {
          positionRef.current = newPosition;
          rotationRef.current = newRotation;
          onPositionUpdate(newPosition, newRotation);
        }
      }
    };

    window.addEventListener('positionUpdated', handlePositionUpdate as EventListener);

    // Clean up
    return () => {
      shipBehaviorManager.unregisterShip(id);
      shipMovementManager.unregisterShip(id);
      window.removeEventListener('positionUpdated', handlePositionUpdate as EventListener);
    };
  }, [id, type, stats, onPositionUpdate]);

  // Update position ref when prop changes
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Update rotation ref when prop changes
  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  return null; // This is a logic-only component
};
