import { Card, CardContent, Typography } from '@mui/material';
import { Eye, Shield, Spade, Zap } from 'lucide-react';
import React from 'react';
import { CommonShip, ShipCategory, ShipStatus } from '../../../../types/ships/CommonShipTypes';

const getStatusColor = (status: ShipStatus): string => {
  switch (status) {
    case ShipStatus.READY:
      return '#4caf50';
    case ShipStatus.ENGAGING:
      return '#f44336';
    case ShipStatus.PATROLLING:
      return '#2196f3';
    case ShipStatus.RETREATING:
      return '#ff9800';
    case ShipStatus.DISABLED:
      return '#9e9e9e';
    case ShipStatus.DAMAGED:
      return '#f44336';
    case ShipStatus.REPAIRING:
      return '#ffeb3b';
    case ShipStatus.UPGRADING:
      return '#9c27b0';
    default:
      return '#607d8b';
  }
};

const getCategoryIcon = (category: ShipCategory): React.ReactNode => {
  switch (category) {
    case 'war':
      return <Shield size={18} />;
    case 'recon':
      return <Eye size={18} />;
    case 'mining':
      return <Spade size={18} />;
    default:
      return <Zap size={18} />;
  }
};

interface ShipCardProps {
  ship: CommonShip;
  isSelected?: boolean;
  onClick?: (shipId: string) => void;
}

export const ShipCard = ({ ship, isSelected = false, onClick }: ShipCardProps) => {
  const statusColor = getStatusColor(ship.status);
  const categoryIcon = getCategoryIcon(ship.category);

  const handleCardClick = () => {
    if (onClick) {
      onClick(ship.id);
    }
  };

  return (
    <Card
      // Temporarily removed sx prop to test type complexity issue
      onClick={handleCardClick}
    >
      <CardContent sx={{ padding: '12px !important' }}>
        <div className="mb-2 flex items-center justify-between">
          {categoryIcon}
          <Typography variant="h6" component="div" className="mx-2 flex-grow">
            {ship.name || 'Unnamed Ship'}
          </Typography>
          <Typography variant="caption" style={{ color: statusColor }} className="mr-1">
            {ship.status}
          </Typography>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: statusColor,
              flexShrink: 0,
            }}
          />
        </div>

        <div className="mt-3 flex justify-around gap-2" style={{ fontSize: '0.8rem' }}>
          <div className="text-center">
            <Typography variant="caption" display="block" sx={{ color: '#9ca3af' }}>
              Speed
            </Typography>
            <Typography variant="body2">{ship.stats.speed ?? 'N/A'}</Typography>
          </div>
          <div className="text-center">
            <Typography variant="caption" display="block" sx={{ color: '#9ca3af' }}>
              Shield
            </Typography>
            <Typography variant="body2">{ship.stats.defense?.shield ?? 'N/A'}</Typography>
          </div>
          <div className="text-center">
            <Typography variant="caption" display="block" sx={{ color: '#9ca3af' }}>
              Armor
            </Typography>
            <Typography variant="body2">{ship.stats.defense?.armor ?? 'N/A'}</Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShipCard;
