import { Card, CardContent, Typography } from '@mui/material';
import { Eye, Shield, Spade, Zap } from 'lucide-react';
import { ShipCategory, ShipStatus } from '../../../../types/ships/ShipTypes';

const statusColors: Record<ShipStatus, string> = {
  [ShipStatus.READY]: 'success.main',
  [ShipStatus.IDLE]: 'grey.500',
  [ShipStatus.MOVING]: 'info.main',
  [ShipStatus.ENGAGING]: 'warning.main',
  [ShipStatus.ATTACKING]: 'error.main',
  [ShipStatus.MINING]: 'info.dark',
  [ShipStatus.RETURNING]: 'info.light',
  [ShipStatus.WITHDRAWING]: 'warning.dark',
  [ShipStatus.DISABLED]: 'error.dark',
  [ShipStatus.SCANNING]: 'info.main',
  [ShipStatus.DAMAGED]: 'error.light',
  [ShipStatus.REPAIRING]: 'secondary.main',
  [ShipStatus.UPGRADING]: 'secondary.light',
  [ShipStatus.DESTROYED]: 'error.dark',
  [ShipStatus.ASSIGNED]: 'primary.main',
  [ShipStatus.MAINTENANCE]: 'secondary.main',
  [ShipStatus.INVESTIGATING]: 'info.main',
  [ShipStatus.PATROLLING]: 'info.main',
  [ShipStatus.RETREATING]: 'warning.dark',
  [ShipStatus.COMBAT]: 'warning.main',
  [ShipStatus.ACTIVE]: 'success.light',
  [ShipStatus.INACTIVE]: 'grey.600',
};

// Define the simplified data structure for ShipCard
export interface ShipCardData {
  id: string;
  name: string | null; // Allow null for unnamed ships
  status: ShipStatus;
  category: ShipCategory;
  stats: {
    maxHealth?: number;
    health?: number;
    maxShield?: number;
    shield?: number;
    speed?: number;
    defense?: {
      armor?: number;
    };
  } | null; // Allow stats to be potentially null/undefined
}

interface ShipCardProps {
  ship: ShipCardData; // Use the simplified data type
  isSelected?: boolean;
  onClick?: (shipId: string) => void;
}

const getStatusColor = (status: ShipStatus): string => {
  const color = statusColors[status];
  if (!color) {
    return 'grey.600'; // Default color
  }
  return color;
};

const getCategoryIcon = (category: ShipCategory): JSX.Element => {
  const iconProps = { size: 18, className: 'mr-2' };
  switch (category) {
    case ShipCategory.combat:
    case ShipCategory.FIGHTER:
    case ShipCategory.CRUISER:
    case ShipCategory.BATTLESHIP:
    case ShipCategory.CARRIER:
      return <Zap {...iconProps} />; // Combat icon
    case ShipCategory.MINING:
      return <Spade {...iconProps} />; // Mining icon
    case ShipCategory.RECON:
    case ShipCategory.SCOUT:
      return <Eye {...iconProps} />; // Recon icon
    case ShipCategory.TRANSPORT:
      return <Shield {...iconProps} />; // Use Shield as placeholder for Transport
    default:
      return <Zap {...iconProps} />; // Default icon
  }
};

export const ShipCard = ({ ship, isSelected = false, onClick }: ShipCardProps) => {
  const statusColor = getStatusColor(ship.status);
  const categoryIcon = getCategoryIcon(ship.category);

  const handleCardClick = () => {
    if (onClick) {
      onClick(ship.id); // ID is directly on ShipCardData
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
            title={ship.name ?? 'Unnamed Ship'}
          >
            {ship.name ?? 'Unnamed Ship'}
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
