/**
 * @context: ui-system, component-library, faction-system
 *
 * FactionBadge component for displaying faction information and relationship status
 */
import { AlertTriangle, Info, Shield, Sword, ThumbsDown, ThumbsUp, Users } from 'lucide-react';
import * as React from 'react';
import { FactionId } from '../../../types/ships/FactionTypes';

// Define faction colors and icons
const FACTION_CONFIG: Record<
  FactionId,
  { primaryColor: string; secondaryColor: string; icon: React.ReactNode; displayName: string }
> = {
  player: {
    primaryColor: '#4287f5',
    secondaryColor: '#cfe0ff',
    icon: <Shield className="h-4 w-4" />,
    displayName: 'Player Faction',
  },
  enemy: {
    primaryColor: '#f44336',
    secondaryColor: '#ffcdd2',
    icon: <Sword className="h-4 w-4" />,
    displayName: 'Enemy Forces',
  },
  neutral: {
    primaryColor: '#9e9e9e',
    secondaryColor: '#f5f5f5',
    icon: <Info className="h-4 w-4" />,
    displayName: 'Neutral Faction',
  },
  ally: {
    primaryColor: '#4caf50',
    secondaryColor: '#c8e6c9',
    icon: <ThumbsUp className="h-4 w-4" />,
    displayName: 'Allied Forces',
  },
  'space-rats': {
    primaryColor: '#ff9800',
    secondaryColor: '#ffe0b2',
    icon: <AlertTriangle className="h-4 w-4" />,
    displayName: 'Space Rats',
  },
  'lost-nova': {
    primaryColor: '#9c27b0',
    secondaryColor: '#e1bee7',
    icon: <Users className="h-4 w-4" />,
    displayName: 'Lost Nova',
  },
  'equator-horizon': {
    primaryColor: '#009688',
    secondaryColor: '#b2dfdb',
    icon: <Shield className="h-4 w-4" />,
    displayName: 'Equator Horizon',
  },
};

// Relationship icons and colors
const RELATIONSHIP_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> =
  {
    hostile: {
      icon: <ThumbsDown className="h-3 w-3" />,
      color: '#f44336',
      label: 'Hostile',
    },
    unfriendly: {
      icon: <ThumbsDown className="h-3 w-3" />,
      color: '#ff9800',
      label: 'Unfriendly',
    },
    neutral: {
      icon: <Info className="h-3 w-3" />,
      color: '#9e9e9e',
      label: 'Neutral',
    },
    friendly: {
      icon: <ThumbsUp className="h-3 w-3" />,
      color: '#4caf50',
      label: 'Friendly',
    },
    allied: {
      icon: <ThumbsUp className="h-3 w-3" />,
      color: '#2196f3',
      label: 'Allied',
    },
  };

interface FactionBadgeProps {
  /**
   * Faction ID
   */
  factionId: FactionId;

  /**
   * Relationship with player
   * @default 'neutral'
   */
  relationship?: 'hostile' | 'unfriendly' | 'neutral' | 'friendly' | 'allied';

  /**
   * Size variant
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Whether to show the relationship indicator
   * @default true
   */
  showRelationship?: boolean;

  /**
   * Whether to use a compact display
   * @default false
   */
  compact?: boolean;

  /**
   * Click handler
   */
  onClick?: () => void;

  /**
   * Custom class name
   */
  className?: string;
}

/**
 * Component for displaying faction information and relationship status
 */
export function FactionBadge({
  factionId,
  relationship = 'neutral',
  size = 'medium',
  showRelationship = true,
  compact = false,
  onClick,
  className = '',
}: FactionBadgeProps) {
  // Get faction configuration
  const factionConfig = FACTION_CONFIG[factionId] || FACTION_CONFIG.neutral;

  // Get relationship configuration
  const relationshipConfig = RELATIONSHIP_CONFIG[relationship] || RELATIONSHIP_CONFIG.neutral;

  // Determine size-based styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          badgeClassName: 'py-1 px-2 text-xs',
          iconSize: 'h-3 w-3',
        };
      case 'large':
        return {
          badgeClassName: 'py-2 px-4 text-base',
          iconSize: 'h-5 w-5',
        };
      default:
        return {
          badgeClassName: 'py-1.5 px-3 text-sm',
          iconSize: 'h-4 w-4',
        };
    }
  };

  const { badgeClassName, iconSize } = getSizeStyles();

  // Clone the icon with the proper size
  const factionIcon = React.cloneElement(factionConfig.icon as React.ReactElement, {
    className: iconSize,
  });

  // Render in compact mode (just the styled badge)
  if (compact) {
    return (
      <div
        className={`faction-badge inline-flex items-center rounded-full ${badgeClassName} ${className}`}
        style={{
          backgroundColor: factionConfig.secondaryColor,
          color: factionConfig.primaryColor,
          borderLeft: `3px solid ${factionConfig.primaryColor}`,
          cursor: onClick ? 'pointer' : 'default',
        }}
        onClick={onClick}
        data-testid="faction-badge"
        data-faction-id={factionId}
      >
        <span className="faction-badge__icon mr-1.5">{factionIcon}</span>
        <span className="faction-badge__name font-medium">{factionConfig.displayName}</span>
      </div>
    );
  }

  // Render in standard mode
  return (
    <div
      className={`faction-badge flex items-center gap-1.5 ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      data-testid="faction-badge"
      data-faction-id={factionId}
    >
      <div
        className={`faction-badge__main inline-flex items-center rounded-l-full ${badgeClassName}`}
        style={{
          backgroundColor: factionConfig.secondaryColor,
          color: factionConfig.primaryColor,
          borderLeft: `3px solid ${factionConfig.primaryColor}`,
        }}
      >
        <span className="faction-badge__icon mr-1.5">{factionIcon}</span>
        <span className="faction-badge__name font-medium">{factionConfig.displayName}</span>
      </div>

      {showRelationship && (
        <div
          className={`faction-badge__relationship inline-flex items-center rounded-r-full ${badgeClassName}`}
          style={{
            backgroundColor: `${relationshipConfig.color}20`,
            color: relationshipConfig.color,
            paddingLeft: '0.5rem',
          }}
        >
          <span className="faction-badge__relationship-icon mr-1">{relationshipConfig.icon}</span>
          <span className="faction-badge__relationship-label text-xs">
            {relationshipConfig.label}
          </span>
        </div>
      )}
    </div>
  );
}
