import {
  Atom,
  CircleOff,
  Cloud,
  Disc,
  Droplet,
  FlaskConical,
  Moon,
  Orbit,
  Package,
  Pickaxe,
  Radiation,
  Shield,
  Sparkles,
  Stars,
  Users,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react';
import * as React from 'react';
import { ResourceType } from '../../../types/resources/ResourceTypes';

interface ResourceIconProps {
  resourceType: ResourceType;
  className?: string;
}

/**
 * Get the icon component for a resource type
 */
function getResourceIcon(resourceType: ResourceType): React.ReactElement {
  switch (resourceType) {
    case ResourceType.MINERALS:
      return <Pickaxe />;
    case ResourceType.ENERGY:
      return <Zap />;
    case ResourceType.POPULATION:
      return <Users />;
    case ResourceType.RESEARCH:
      return <FlaskConical />;
    case ResourceType.PLASMA:
      return <Atom />;
    case ResourceType.GAS:
      return <Wind />;
    case ResourceType.EXOTIC:
      return <Sparkles />;
    case ResourceType.IRON:
      return <Wrench />;
    case ResourceType.COPPER:
      return <CircleOff color="#cd7f32" />; // Bronze color for copper
    case ResourceType.TITANIUM:
      return <Shield />;
    case ResourceType.URANIUM:
      return <Radiation />;
    case ResourceType.WATER:
      return <Droplet />;
    case ResourceType.HELIUM:
      return <Cloud />;
    case ResourceType.DEUTERIUM:
      return <Disc />;
    case ResourceType.ANTIMATTER:
      return <Orbit />;
    case ResourceType.DARK_MATTER:
      return <Moon />;
    case ResourceType.EXOTIC_MATTER:
      return <Stars />;
    case ResourceType.FOOD:
      return <Package />; // Adding FOOD resource type
    case ResourceType.ORGANIC:
      return <Droplet color="#6aa84f" />; // Green droplet for organic
    default:
      return <Package />;
  }
}

export function ResourceIcon({ resourceType, className = '' }: ResourceIconProps) {
  return (
    <span className={className} aria-label={resourceType}>
      {getResourceIcon(resourceType)}
    </span>
  );
}
