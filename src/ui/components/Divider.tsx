/**
 * @context: ui-system, component-library
 * 
 * Divider component for visually separating content
 */
import * as React from 'react';
import { forwardRef, useMemo } from 'react';
import { BaseComponentProps } from '../../types/ui/ComponentTypes';
import { ThemeColor } from '../../types/ui/ThemeTypes';

/**
 * Divider orientation options
 */
export enum DividerOrientation {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical'
}

/**
 * Divider variant options
 */
export enum DividerVariant {
  SOLID = 'solid',
  DASHED = 'dashed',
  DOTTED = 'dotted'
}

/**
 * Divider thickness options
 */
export enum DividerThickness {
  THIN = 'thin',
  MEDIUM = 'medium',
  THICK = 'thick'
}

/**
 * Divider component props
 */
export interface DividerProps extends BaseComponentProps {
  /**
   * Divider orientation
   * @default 'horizontal'
   */
  orientation?: DividerOrientation | keyof typeof DividerOrientation;
  
  /**
   * Divider style variant
   * @default 'solid'
   */
  variant?: DividerVariant | keyof typeof DividerVariant;
  
  /**
   * Divider line thickness
   * @default 'medium'
   */
  thickness?: DividerThickness | keyof typeof DividerThickness;
  
  /**
   * Divider custom color
   */
  color?: ThemeColor;
  
  /**
   * Spacing before and after the divider in pixels or CSS length value
   */
  spacing?: number | string;
  
  /**
   * Custom width for horizontal divider or height for vertical divider
   */
  length?: number | string;
  
  /**
   * Optional label to display on the divider
   */
  label?: React.ReactNode;
  
  /**
   * Label position
   * @default 'center'
   */
  labelPosition?: 'start' | 'center' | 'end';
  
  /**
   * Whether the divider should have a glow effect
   * @default false
   */
  glow?: boolean;
  
  /**
   * Whether the divider should be hidden on certain screen sizes
   */
  hideOn?: string[];
}

/**
 * Check if a value is a valid DividerOrientation
 */
function isDividerOrientation(value: unknown): value is DividerOrientation {
  return typeof value === 'string' && Object.values(DividerOrientation).includes(value as DividerOrientation);
}

/**
 * Check if a value is a valid DividerVariant
 */
function isDividerVariant(value: unknown): value is DividerVariant {
  return typeof value === 'string' && Object.values(DividerVariant).includes(value as DividerVariant);
}

/**
 * Check if a value is a valid DividerThickness
 */
function isDividerThickness(value: unknown): value is DividerThickness {
  return typeof value === 'string' && Object.values(DividerThickness).includes(value as DividerThickness);
}

/**
 * Divider component
 * 
 * Visually separates content with a horizontal or vertical line
 */
export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  ({
    orientation = DividerOrientation.HORIZONTAL,
    variant = DividerVariant.SOLID,
    thickness = DividerThickness.MEDIUM,
    color,
    spacing,
    length,
    label,
    labelPosition = 'center',
    glow = false,
    hideOn,
    className = '',
    style,
    id,
    'aria-label': ariaLabel,
    'data-testid': dataTestId,
  }, ref) => {
    // Validate props for type safety
    const safeOrientation = isDividerOrientation(orientation) ? orientation : DividerOrientation.HORIZONTAL;
    const safeVariant = isDividerVariant(variant) ? variant : DividerVariant.SOLID;
    const safeThickness = isDividerThickness(thickness) ? thickness : DividerThickness.MEDIUM;
    
    // Compute divider classes based on props
    const dividerClasses = useMemo(() => {
      const classes = [
        'gs-divider',
        `gs-divider--${safeOrientation}`,
        `gs-divider--${safeVariant}`,
        `gs-divider--${safeThickness}`,
        glow ? 'gs-divider--glow' : '',
        label ? 'gs-divider--with-label' : '',
        label ? `gs-divider--label-${labelPosition}` : '',
        color ? `gs-divider--color-${color}` : '',
        ...(hideOn || []).map(size => `gs-divider--hide-on-${size}`),
        className
      ].filter(Boolean).join(' ');
      
      return classes;
    }, [
      safeOrientation, 
      safeVariant, 
      safeThickness, 
      glow, 
      label, 
      labelPosition, 
      color, 
      hideOn, 
      className
    ]);
    
    // Custom style with margin/padding based on spacing
    const customStyle = useMemo(() => {
      const dividerStyle = { ...style };
      
      // Add spacing if provided
      if (spacing !== undefined) {
        const spacingValue = typeof spacing === 'number' ? `${spacing}px` : spacing;
        
        if (safeOrientation === DividerOrientation.HORIZONTAL) {
          dividerStyle.marginTop = spacingValue;
          dividerStyle.marginBottom = spacingValue;
        } else {
          dividerStyle.marginLeft = spacingValue;
          dividerStyle.marginRight = spacingValue;
        }
      }
      
      // Add length if provided
      if (length !== undefined) {
        const lengthValue = typeof length === 'number' ? `${length}px` : length;
        
        if (safeOrientation === DividerOrientation.HORIZONTAL) {
          dividerStyle.width = lengthValue;
        } else {
          dividerStyle.height = lengthValue;
        }
      }
      
      return dividerStyle;
    }, [style, spacing, length, safeOrientation]);
    
    // For accessibility, we use hr for horizontal dividers and a custom div for vertical ones
    if (safeOrientation === DividerOrientation.HORIZONTAL && !label) {
      return (
        <hr
          ref={ref as React.Ref<HTMLHRElement>}
          id={id}
          className={dividerClasses}
          style={customStyle}
          aria-orientation="horizontal"
          data-testid={dataTestId}
        />
      );
    }
    
    return (
      <div
        ref={ref}
        id={id}
        className={dividerClasses}
        style={customStyle}
        role="separator"
        aria-orientation={safeOrientation}
        aria-label={ariaLabel}
        data-testid={dataTestId}
      >
        {label && (
          <div className="gs-divider__label">
            {label}
          </div>
        )}
      </div>
    );
  }
);

Divider.displayName = 'Divider';

export default Divider; 