import { AlertTriangle, Beaker, Database, Users, Zap } from 'lucide-react';
import * as React from "react";
import { ResourceType } from "./../../types/resources/ResourceTypes";
import { resourceTypeToString } from '../../utils/ResourceTypeConverter';
import { useTooltipContext } from './tooltip-context';

interface ResourceVisualizationProps {
  resourceType: ResourceType | string;
  amount: number;
  showIcon?: boolean;
  showAmount?: boolean;
  showName?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  onClick?: () => void;
}

/**
 * ResourceVisualization Component
 *
 * Displays a resource with its icon, amount, and name.
 * This component is designed to work with both string and enum resource types
 * to facilitate the transition from string-based to enum-based resource types.
 */
const ResourceVisualization: React.FC<ResourceVisualizationProps> = ({
  resourceType,
  amount,
  showIcon = true,
  showAmount = true,
  showName = false,
  size = 'medium',
  className = '',
  onClick,
}) => {
  // Convert the resource type to string format for consistent handling
  const stringType =
    typeof resourceType === 'string' ? resourceType : resourceTypeToString(resourceType);

  // Convert to lowercase for map lookups (for backward compatibility)
  const lowerType = stringType.toLowerCase();

  // Determine the size of the component
  const sizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  // Resource icon mapping
  const iconComponents = {
    minerals: Database,
    energy: Zap,
    population: Users,
    research: Beaker,
  };

  // Resource color mapping
  const colors = {
    minerals: '#8884d8',
    energy: '#ffc658',
    population: '#82ca9d',
    research: '#8dd1e1',
  };

  // Resource name mapping
  const names = {
    minerals: 'Minerals',
    energy: 'Energy',
    population: 'Population',
    research: 'Research',
  };

  // Get the appropriate icon based on the resource type
  const getIcon = () => {
    const IconComponent = iconComponents[lowerType as keyof typeof iconComponents] || AlertTriangle;
    return <IconComponent className="h-4 w-4" />;
  };

  // Get the appropriate color based on the resource type
  const getColor = () => {
    return colors[lowerType as keyof typeof colors] || '#999999';
  };

  // Get the appropriate name based on the resource type
  const getName = () => {
    return names[lowerType as keyof typeof names] || stringType;
  };

  // Get the tooltip context
  const { showTooltip, hideTooltip } = useTooltipContext();

  // Create a ref for the component
  const componentRef = React.useRef<HTMLDivElement>(null);

  // Handle mouse enter event
  const handleMouseEnter = () => {
    if (componentRef.current) {
      const rect = componentRef.current.getBoundingClientRect();
      showTooltip(
        <div className="rounded bg-gray-800 p-2 text-white shadow-lg">
          <div className="font-bold">{getName()}</div>
          <div>Amount: {amount}</div>
        </div>,
        { x: rect.left + rect.width / 2, y: rect.top }
      );
    }
  };

  // Handle mouse leave event
  const handleMouseLeave = () => {
    hideTooltip();
  };

  return (
    <div
      ref={componentRef}
      className={`resource-visualization flex items-center ${sizeClasses[size]} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {showIcon && (
        <div
          className="resource-icon mr-1 flex h-6 w-6 items-center justify-center rounded-full"
          style={{ backgroundColor: getColor() }}
        >
          {getIcon()}
        </div>
      )}
      {showAmount && <div className="resource-amount mr-1">{amount}</div>}
      {showName && <div className="resource-name">{getName()}</div>}
    </div>
  );
};

export default ResourceVisualization;
