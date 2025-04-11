import { Card, CardContent, Typography } from '@mui/material';
import { Eye, Shield, Spade, Zap } from 'lucide-react';
import React from 'react';
import {
  ShipCategory,
  UnifiedShip,
  UnifiedShipStatus,
} from '../../../../types/ships/UnifiedShipTypes';

const getStatusColor = (status: UnifiedShipStatus): string => {
  switch (status) {
    case UnifiedShipStatus.READY:
      return '#4caf50';
    case UnifiedShipStatus.ENGAGING:
    case UnifiedShipStatus.ATTACKING:
      return '#f44336';
    case UnifiedShipStatus.PATROLLING:
      return '#2196f3';
    case UnifiedShipStatus.RETREATING:
    case UnifiedShipStatus.RETURNING:
    case UnifiedShipStatus.WITHDRAWING:
      return '#ff9800';
    case UnifiedShipStatus.DISABLED:
      return '#9e9e9e';
    case UnifiedShipStatus.DAMAGED:
      return '#f44336';
    case UnifiedShipStatus.REPAIRING:
      return '#ffeb3b';
    case UnifiedShipStatus.UPGRADING:
      return '#9c27b0';
    case UnifiedShipStatus.IDLE:
      return '#2196f3';
    case UnifiedShipStatus.MAINTENANCE:
      return '#607d8b';
    case UnifiedShipStatus.MINING:
      return '#795548';
    case UnifiedShipStatus.SCANNING:
    case UnifiedShipStatus.INVESTIGATING:
      return '#00bcd4';
    default:
      console.warn(`[ShipCard] Unexpected status: ${status}`);
      return '#607d8b';
  }
};

const getCategoryIcon = (category: ShipCategory): React.ReactNode => {
  switch (category) {
    case ShipCategory.WAR:
    case ShipCategory.FIGHTER:
    case ShipCategory.CRUISER:
    case ShipCategory.BATTLESHIP:
    case ShipCategory.CARRIER:
      return <Shield size={18} />;
    case ShipCategory.RECON:
    case ShipCategory.SCOUT:
      return <Eye size={18} />;
    case ShipCategory.MINING:
      return <Spade size={18} />;
    case ShipCategory.TRANSPORT:
      return <Zap size={18} />;
    default:
      console.warn(`[ShipCard] Unexpected category: ${category}`);
      return <Zap size={18} />;
  }
};

interface ShipCardProps {
  ship: UnifiedShip;
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
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        border: isSelected ? '2px solid #6366f1' : '2px solid transparent',
        backgroundColor: '#374151',
        color: '#ffffff',
        transition: 'border-color 0.2s ease-in-out',
        '&:hover': {
          borderColor: onClick ? '#4f46e5' : 'transparent',
        },
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ padding: '12px !important' }}>
        <div className="mb-2 flex items-center justify-between">
          {categoryIcon}
          <Typography
            variant="h6"
            component="div"
            className="mx-2 flex-grow truncate"
            title={ship.name || 'Unnamed Ship'}
          >
            {ship.name || 'Unnamed Ship'}
          </Typography>
          <Typography
            variant="caption"
            style={{ color: statusColor }}
            className="mr-1 whitespace-nowrap"
          >
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
            <Typography variant="body2">{ship.stats?.speed?.toFixed(0) ?? 'N/A'}</Typography>
          </div>
          <div className="text-center">
            <Typography variant="caption" display="block" sx={{ color: '#9ca3af' }}>
              Shield
            </Typography>
            <Typography variant="body2">{ship.stats?.maxShield?.toFixed(0) ?? 'N/A'}</Typography>
          </div>
          <div className="text-center">
            <Typography variant="caption" display="block" sx={{ color: '#9ca3af' }}>
              Armor
            </Typography>
            <Typography variant="body2">
              {ship.stats?.defense?.armor?.toFixed(0) ?? 'N/A'}
            </Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShipCard;
