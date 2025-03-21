/**
 * @context: ui-system, component-library
 * 
 * Card component that provides a container with consistent styling
 */
import * as React from 'react';
import { forwardRef, useMemo } from 'react';
import { BaseComponentProps } from '../../types/ui/ComponentTypes';

/**
 * Card elevation levels
 */
export enum CardElevation {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

/**
 * Card component props
 */
export interface CardProps extends BaseComponentProps {
  /**
   * Card content
   */
  children: React.ReactNode;
  
  /**
   * Optional card title
   */
  title?: React.ReactNode;
  
  /**
   * Optional card subtitle
   */
  subtitle?: React.ReactNode;
  
  /**
   * Card elevation (shadow level)
   * @default 'medium'
   */
  elevation?: CardElevation | keyof typeof CardElevation;
  
  /**
   * Whether the card should take the full width of its container
   * @default false
   */
  fullWidth?: boolean;
  
  /**
   * Whether the card should have hover effects
   * @default false
   */
  interactive?: boolean;
  
  /**
   * Optional footer content
   */
  footer?: React.ReactNode;
  
  /**
   * Custom padding for the card content
   */
  padding?: string | number;
  
  /**
   * Click handler for interactive cards
   */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * Check if a value is a valid CardElevation
 */
function isCardElevation(value: unknown): value is CardElevation {
  return typeof value === 'string' && Object.values(CardElevation).includes(value as CardElevation);
}

/**
 * Card component
 * 
 * Container component with consistent styling, available with different elevation levels
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({
    children,
    title,
    subtitle,
    elevation = CardElevation.MEDIUM,
    className = '',
    style,
    id,
    disabled = false,
    fullWidth = false,
    interactive = false,
    footer,
    padding,
    onClick,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    'data-testid': dataTestId,
  }, ref) => {
    // Validate elevation for type safety
    const safeElevation = isCardElevation(elevation) 
      ? elevation 
      : CardElevation.MEDIUM;
    
    // Compute card classes based on props
    const cardClasses = useMemo(() => {
      const classes = [
        'gs-card',
        `gs-card--elevation-${safeElevation}`,
        disabled ? 'gs-card--disabled' : '',
        fullWidth ? 'gs-card--full-width' : '',
        interactive ? 'gs-card--interactive' : '',
        className
      ].filter(Boolean).join(' ');
      
      return classes;
    }, [safeElevation, disabled, fullWidth, interactive, className]);
    
    // Custom style with potential padding override
    const customStyle = useMemo(() => {
      if (!padding) return style;
      
      return {
        ...style,
        padding: typeof padding === 'number' ? `${padding}px` : padding
      };
    }, [style, padding]);
    
    // Handle click for interactive cards
    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || !interactive) return;
      
      try {
        onClick?.(event);
      } catch (error) {
        console.error('[Card] Error in onClick handler:', error);
      }
    };
    
    return (
      <div
        ref={ref}
        id={id}
        className={cardClasses}
        style={customStyle}
        onClick={interactive ? handleClick : undefined}
        aria-disabled={disabled}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        data-testid={dataTestId}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive && !disabled ? 0 : undefined}
      >
        {(title || subtitle) && (
          <div className="gs-card__header">
            {title && (
              <div className="gs-card__title">
                {title}
              </div>
            )}
            {subtitle && (
              <div className="gs-card__subtitle">
                {subtitle}
              </div>
            )}
          </div>
        )}
        
        <div className="gs-card__content">
          {children}
        </div>
        
        {footer && (
          <div className="gs-card__footer">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card; 