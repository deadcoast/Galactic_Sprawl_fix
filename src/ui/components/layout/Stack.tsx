/**
 * @context: ui-system, ui-layout-system, component-library
 * 
 * Stack component for arranging children with consistent spacing
 * either vertically or horizontally
 */

import * as React from 'react';
import { forwardRef, useMemo } from 'react';
import { 
  BaseComponentProps, 
  ChildrenProps,
  LayoutComponentProps
} from '../../../types/ui/ComponentTypes';
import { ThemeSpacing } from '../../../types/ui/ThemeTypes';

export type StackDirection = 'horizontal' | 'vertical';

export interface StackProps extends BaseComponentProps, ChildrenProps, LayoutComponentProps {
  /**
   * The direction to stack children
   * @default 'vertical'
   */
  direction?: StackDirection;
  
  /**
   * The spacing between children
   * @default 'medium'
   */
  spacing?: ThemeSpacing;
  
  /**
   * Whether to center children along the cross axis
   * @default false
   */
  align?: 'start' | 'center' | 'end' | 'stretch';
  
  /**
   * Whether to center children along the main axis
   * @default 'start'
   */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  
  /**
   * Whether to wrap children if they overflow
   * @default false
   */
  wrap?: boolean;
  
  /**
   * Whether the stack should take up the full width/height of its container
   * @default false
   */
  fullSize?: boolean;
  
  /**
   * Whether to add dividers between stack items
   * @default false
   */
  dividers?: boolean;
  
  /**
   * Custom gap between items (overrides spacing)
   */
  gap?: string | number;
  
  /**
   * HTML element to render
   * @default 'div'
   */
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Maps alignment values to CSS values
 */
function getAlignItems(align?: 'start' | 'center' | 'end' | 'stretch'): string {
  switch (align) {
    case 'start': return 'flex-start';
    case 'center': return 'center';
    case 'end': return 'flex-end';
    case 'stretch': return 'stretch';
    default: return 'flex-start';
  }
}

/**
 * Maps justification values to CSS values
 */
function getJustifyContent(justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'): string {
  switch (justify) {
    case 'start': return 'flex-start';
    case 'center': return 'center';
    case 'end': return 'flex-end';
    case 'between': return 'space-between';
    case 'around': return 'space-around';
    case 'evenly': return 'space-evenly';
    default: return 'flex-start';
  }
}

/**
 * Stack component for arranging children vertically or horizontally
 * with consistent spacing between them.
 */
export const Stack = forwardRef<HTMLDivElement, StackProps>(({
  direction = 'vertical',
  spacing = 'medium',
  align = 'start',
  justify = 'start',
  wrap = false,
  fullSize = false,
  dividers = false,
  gap,
  children,
  className,
  style,
  as: Component = 'div',
  ...rest
}, ref) => {
  // Memoize styles for better performance
  const stackStyles = useMemo(() => {
    const baseStyles: React.CSSProperties = {
      display: 'flex',
      flexDirection: direction === 'vertical' ? 'column' : 'row',
      alignItems: getAlignItems(align),
      justifyContent: getJustifyContent(justify),
      flexWrap: wrap ? 'wrap' : 'nowrap',
      gap: gap !== undefined ? gap : spacing,
      ...style
    };
    
    if (fullSize) {
      if (direction === 'vertical') {
        baseStyles.width = '100%';
      } else {
        baseStyles.height = '100%';
      }
    }
    
    return baseStyles;
  }, [direction, spacing, align, justify, wrap, fullSize, gap, style]);

  // Build class name
  const stackClassName = useMemo(() => {
    const classes = ['ui-stack'];
    
    if (className) {
      classes.push(className);
    }
    
    if (dividers) {
      classes.push('ui-stack-dividers');
    }
    
    if (direction === 'vertical') {
      classes.push('ui-stack-vertical');
    } else {
      classes.push('ui-stack-horizontal');
    }
    
    return classes.join(' ');
  }, [className, dividers, direction]);
  
  return (
    <Component
      ref={ref}
      className={stackClassName}
      style={stackStyles}
      {...rest}
    >
      {children}
    </Component>
  );
});

Stack.displayName = 'Stack';

export default Stack; 