/**
 * @context: ui-system, component-library
 * 
 * Icon component for displaying vector icons with consistent styling
 */
import * as React from 'react';
import { forwardRef, useMemo } from 'react';
import { BaseComponentProps, ComponentSize, isComponentSize } from '../../types/ui/ComponentTypes';
import { ThemeColor } from '../../types/ui/ThemeTypes';

/**
 * Available icon sets
 */
export enum IconSet {
  GAME = 'game',     // Game-specific icons
  UI = 'ui',         // UI controls and actions
  RESOURCE = 'resource', // Resource-specific icons
  MODULE = 'module', // Module-specific icons
  SYSTEM = 'system'  // System-related icons
}

/**
 * Icon component props
 */
export interface IconProps extends BaseComponentProps {
  /**
   * Icon name to display
   */
  name: string;
  
  /**
   * Icon set to use
   * @default 'ui'
   */
  set?: IconSet | keyof typeof IconSet;
  
  /**
   * Icon size
   * @default 'medium'
   */
  size?: ComponentSize;
  
  /**
   * Icon color
   * Uses theme colors
   */
  color?: ThemeColor;
  
  /**
   * Whether the icon should spin
   * @default false
   */
  spin?: boolean;
  
  /**
   * Whether the icon should pulse
   * @default false
   */
  pulse?: boolean;
  
  /**
   * Optional click handler
   */
  onClick?: (event: React.MouseEvent<SVGSVGElement>) => void;
  
  /**
   * Whether the icon should have hover effects
   * @default false
   */
  interactive?: boolean;
  
  /**
   * Whether the icon should be hidden from screen readers
   * @default true
   */
  'aria-hidden'?: boolean;
}

/**
 * Check if a value is a valid IconSet
 */
function isIconSet(value: unknown): value is IconSet {
  return typeof value === 'string' && Object.values(IconSet).includes(value as IconSet);
}

/**
 * Icon component
 * 
 * Displays vector icons with consistent styling
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({
    name,
    set = IconSet.UI,
    size = ComponentSize.MEDIUM,
    color,
    className = '',
    style,
    id,
    disabled = false,
    spin = false,
    pulse = false,
    onClick,
    interactive = false,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-hidden': ariaHidden = true,
    'data-testid': dataTestId,
  }, ref) => {
    // Validate set and size for type safety
    const safeSet = isIconSet(set) ? set : IconSet.UI;
    const safeSize = isComponentSize(size) ? size : ComponentSize.MEDIUM;
    
    // Compute icon path
    const iconPath = useMemo(() => {
      return `#${safeSet}-${name}`;
    }, [safeSet, name]);
    
    // Compute icon classes based on props
    const iconClasses = useMemo(() => {
      const classes = [
        'gs-icon',
        `gs-icon--${safeSize}`,
        color ? `gs-icon--color-${color}` : '',
        disabled ? 'gs-icon--disabled' : '',
        spin ? 'gs-icon--spin' : '',
        pulse ? 'gs-icon--pulse' : '',
        interactive ? 'gs-icon--interactive' : '',
        className
      ].filter(Boolean).join(' ');
      
      return classes;
    }, [safeSize, color, disabled, spin, pulse, interactive, className]);
    
    // Handle click with error boundary
    const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
      if (disabled) return;
      
      try {
        onClick?.(event);
      } catch (error) {
        console.error('[Icon] Error in onClick handler:', error);
      }
    };
    
    // Get sizing based on size prop
    const getSizeValue = (): number => {
      switch (safeSize) {
        case ComponentSize.XSMALL: return 12;
        case ComponentSize.SMALL: return 16;
        case ComponentSize.MEDIUM: return 24;
        case ComponentSize.LARGE: return 32;
        case ComponentSize.XLARGE: return 48;
        default: return 24;
      }
    };
    
    const sizeValue = getSizeValue();
    
    return (
      <svg
        ref={ref}
        id={id}
        className={iconClasses}
        width={sizeValue}
        height={sizeValue}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
        onClick={onClick ? handleClick : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-hidden={ariaHidden}
        data-testid={dataTestId}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick && !disabled ? 0 : undefined}
      >
        <use href={iconPath} />
      </svg>
    );
  }
);

Icon.displayName = 'Icon';

export default Icon; 