import { ResourceType } from '../../../types/resources/ResourceTypes';

interface ResourceIconProps {
  resourceType: ResourceType;
  className?: string;
}

/**
 * Get the emoji icon for a resource type
 */
function getResourceIcon(resourceType: ResourceType): ResourceType {
  switch (resourceType) {
    case ResourceType.MINERALS:
      return '⛏️';
    case ResourceType.ENERGY:
      return '⚡';
    case ResourceType.POPULATION:
      return '👥';
    case ResourceType.RESEARCH:
      return '🔬';
    case ResourceType.PLASMA:
      return '🔮';
    case ResourceType.GAS:
      return '💨';
    case ResourceType.EXOTIC:
      return '✨';
    case ResourceType.IRON:
      return '🔧';
    case ResourceType.COPPER:
      return '🧡';
    case ResourceType.TITANIUM:
      return '🛡️';
    case ResourceType.URANIUM:
      return '☢️';
    case ResourceType.WATER:
      return '💧';
    case ResourceType.HELIUM:
      return '🎈';
    case ResourceType.DEUTERIUM:
      return '🔹';
    case ResourceType.ANTIMATTER:
      return '⚛️';
    case ResourceType.DARK_MATTER:
      return '🌑';
    case ResourceType.EXOTIC_MATTER:
      return '💫';
    default:
      return '📦';
  }
}

export function ResourceIcon({ resourceType, className = '' }: ResourceIconProps) {
  return (
    <span className={className} role="img" aria-label={resourceType}>
      {getResourceIcon(resourceType)}
    </span>
  );
}
