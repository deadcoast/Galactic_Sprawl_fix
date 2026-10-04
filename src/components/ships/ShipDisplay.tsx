import React from 'react';
import { CommonShip } from '../../types/ships/CommonShipTypes';
// Removed unused ResourceType import
// import { ResourceType } from '../../types/resources/ResourceTypes';

interface ShipDisplayProps {
  ship: CommonShip;
}

// Removed unused resourceIcons constant
// const resourceIcons: Record<ResourceType, string> = {
//   [ResourceType.ENERGY]: '⚡️',
//   [ResourceType.MINERALS]: '⛏️',
//   // ... other resource icons
// };

const ShipDisplay: React.FC<ShipDisplayProps> = ({ ship }: ShipDisplayProps) => {
  return (
    <div className="ship-display">
      <h2>{ship.name}</h2>
      <p>Category: {ship.category}</p>
      <p>Status: {ship.status}</p>
      <div className="ship-stats">
        <p>
          Health: {ship.stats.health} / {ship.stats.maxHealth}
        </p>
        <p>
          Shield: {ship.stats.shield} / {ship.stats.maxShield}
        </p>
        <p>
          Energy: {ship.stats.energy} / {ship.stats.maxEnergy}
        </p>
        <p>Speed: {ship.stats.speed}</p>
        {/* Display cargo if it exists */}
        {ship.stats.cargo &&
          typeof ship.stats.cargo === 'object' &&
          'resources' in ship.stats.cargo && (
            <p>
              Cargo: {ship.stats.cargo.resources.size} items / {ship.stats.cargo.capacity}
            </p>
          )}
        {ship.stats.cargo && typeof ship.stats.cargo === 'number' && (
          <p>Cargo Capacity: {ship.stats.cargo}</p>
        )}
      </div>
      {/* Add more detailed display, weapons, abilities, etc. */}
    </div>
  );
};

export default ShipDisplay;
