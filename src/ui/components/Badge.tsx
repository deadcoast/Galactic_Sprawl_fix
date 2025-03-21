/**
 * @context: ui-system, component-library
 * 
 * Badge component for displaying status indicators, counters, or small pieces of information
 */
import * as React from 'react';
import { forwardRef, useMemo } from 'react';
import { 
  BaseComponentProps, 
  ComponentSize, 
  ComponentVariant,
  isComponentSize,
  isComponentVariant
} from '../../types/ui/ComponentTypes';
import { ThemeColor } from '../../types/ui/ThemeTypes';

/**
 * Badge position options when used as an indicator with another component
 */
export enum BadgePosition {
  TOP_RIGHT = 'top-right',
  TOP_LEFT = 'top-left',
  BOTTOM_RIGHT = 'bottom-right',
  BOTTOM_LEFT = 'bottom-left'
}

/**
 * Badge component props
 */
export interface BadgeProps extends BaseComponentProps {
  /**
   * Badge content
   */
  content: React.ReactNode;
  
  /**
   * Badge variant determines the visual style
   * @default 'primary'
   */
  variant?: ComponentVariant;
  
  /**
   * Badge size
   * @default 'medium'
   */
  size?: ComponentSize;
  
  /**
   * Maximum value to display, shows "{max}+" if content is a number exceeding max
   */
  max?: number;
  
  /**
   * Custom color for the badge
   * Uses theme colors
   */
  color?: ThemeColor;
  
  /**
   * Whether the badge should be displayed as a dot without content
   * @default false
   */
  dot?: boolean;
  
  /**
   * Position of the badge when used as an indicator
   * @default 'top-right'
   */
  position?: BadgePosition | keyof typeof BadgePosition;
  
  /**
   * The component that the badge wraps
   */
  children?: React.ReactNode;
  
  /**
   * Whether the badge should be visible
   * @default true
   */
  visible?: boolean;
  
  /**
   * Whether the badge should be rendered inline (without absolute positioning)
   * @default false
   */
  inline?: boolean;
}

/**
 * Check if a value is a valid BadgePosition
 */
function isBadgePosition(value: unknown): value is BadgePosition {
  return typeof value === 'string' && Object.values(BadgePosition).includes(value as BadgePosition);
}

/**
 * Formats the badge content based on the max value
 */
function formatBadgeContent(content: React.ReactNode, max?: number): React.ReactNode {
  if (max === undefined || typeof content !== 'number' || content <= max) {
    return content;
  }
  
  return `${max}+`;
}

/**
 * Badge component
 * 
 * Displays status indicators, counters, or small pieces of information
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({
    content,
    variant = ComponentVariant.PRIMARY,
    size = ComponentSize.MEDIUM,
    max,
    color,
    dot = false,
    position = BadgePosition.TOP_RIGHT,
    children,
    className = '',
    style,
    id,
    visible = true,
    inline = false,
    'aria-label': ariaLabel,
    'data-testid': dataTestId,
  }, ref) => {
    // Validate variant, size, and position for type safety
    const safeVariant = isComponentVariant(variant) ? variant : ComponentVariant.PRIMARY;
    const safeSize = isComponentSize(size) ? size : ComponentSize.MEDIUM;
    const safePosition = isBadgePosition(position) ? position : BadgePosition.TOP_RIGHT;
    
    // Format badge content based on max value
    const formattedContent = useMemo(() => {
      return formatBadgeContent(content, max);
    }, [content, max]);
    
    // Compute badge classes based on props
    const badgeClasses = useMemo(() => {
      const classes = [
        'gs-badge',
        `gs-badge--${safeVariant}`,
        `gs-badge--${safeSize}`,
        `gs-badge--${safePosition}`,
        dot ? 'gs-badge--dot' : '',
        !visible ? 'gs-badge--hidden' : '',
        inline ? 'gs-badge--inline' : '',
        children ? 'gs-badge--with-children' : '',
        color ? `gs-badge--color-${color}` : '',
        className
      ].filter(Boolean).join(' ');
      
      return classes;
    }, [
      safeVariant, 
      safeSize, 
      safePosition, 
      dot, 
      visible, 
      inline, 
      children, 
      color, 
      className
    ]);
    
    // If there are no children, render the badge directly
    if (!children) {
      return (
        <span
          ref={ref}
          id={id}
          className={badgeClasses}
          style={style}
          aria-label={ariaLabel}
          data-testid={dataTestId}
        >
          {!dot && formattedContent}
        </span>
      );
    }
    
    // If there are children, render the badge as a wrapper
    return (
      <span className="gs-badge-wrapper" style={style}>
        {children}
        <span
          ref={ref}
          id={id}
          className={badgeClasses}
          aria-label={ariaLabel}
          data-testid={dataTestId}
        >
          {!dot && formattedContent}
        </span>
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge; 