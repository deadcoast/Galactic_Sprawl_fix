import React from 'react';
import { CommonShip } from '../../types/ships/CommonShipTypes';

interface ShipCardProps {
  ship: CommonShip;
  // isSelected: boolean; // Removed unused prop
  onSelect: (shipId: string) => void;
}

const ShipCard: React.FC<ShipCardProps> = ({ ship, onSelect }) => {
  return (
    <div
      className="ship-card" // Add conditional styling based on isSelected if needed later
      onClick={() => onSelect(ship.id)}
    >
      <h3>{ship.name}</h3>
      <p>Type: {ship.category}</p>
      <p>Status: {ship.status}</p>
      {/* Add more ship details as needed */}
    </div>
  );
};

export default ShipCard;
