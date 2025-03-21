/**
 * @context: ui-system, ui-layout-system, component-library
 * 
 * Spacer component that adds empty space between elements
 */

import * as React from 'react';
import { forwardRef, useMemo } from 'react';
import { BaseComponentProps } from '../../../types/ui/ComponentTypes';
import { ThemeSpacing } from '../../../types/ui/ThemeTypes';

export interface SpacerProps extends BaseComponentProps {
  /**
   * Amount of space to add horizontally
   * @default 0
   */
  x?: ThemeSpacing;
  
  /**
   * Amount of space to add vertically
   * @default 0
   */
  y?: ThemeSpacing;
  
  /**
   * Whether the spacer should take up the full width available
   * @default false
   */
  fullWidth?: boolean;
  
  /**
   * Whether the spacer should take up the full height available
   * @default false
   */
  fullHeight?: boolean;
  
  /**
   * Shorthand for both x and y spacing
   */
  size?: ThemeSpacing;
  
  /**
   * Whether the spacer should be flex-based and grow to fill available space
   * @default false
   */
  flex?: boolean;
  
  /**
   * Flex grow factor when flex is true
   * @default 1
   */
  flexGrow?: number;
  
  /**
   * The inline display property to use
   * @default 'block'
   */
  inline?: boolean;
}

/**
 * Spacer component adds empty space between elements
 */
export const Spacer = forwardRef<HTMLDivElement, SpacerProps>(({
  x,
  y,
  size,
  fullWidth = false,
  fullHeight = false,
  flex = false,
  flexGrow = 1,
  inline = false,
  className,
  style,
  ...rest
}, ref) => {
  const finalX = size !== undefined ? size : x;
  const finalY = size !== undefined ? size : y;

  // Memoize styles for better performance
  const spacerStyles = useMemo(() => {
    const baseStyles: React.CSSProperties = {
      display: inline ? 'inline-block' : 'block',
      ...style
    };
    
    if (flex) {
      baseStyles.display = 'flex';
      baseStyles.flexGrow = flexGrow;
    }
    
    if (finalX !== undefined) {
      baseStyles.width = finalX;
      baseStyles.minWidth = finalX;
    }
    
    if (finalY !== undefined) {
      baseStyles.height = finalY;
      baseStyles.minHeight = finalY;
    }
    
    if (fullWidth) {
      baseStyles.width = '100%';
    }
    
    if (fullHeight) {
      baseStyles.height = '100%';
    }
    
    return baseStyles;
  }, [finalX, finalY, fullWidth, fullHeight, flex, flexGrow, inline, style]);

  // Build class name
  const spacerClassName = useMemo(() => {
    const classes = ['ui-spacer'];
    
    if (className) {
      classes.push(className);
    }
    
    if (flex) {
      classes.push('ui-spacer-flex');
    }
    
    if (fullWidth) {
      classes.push('ui-spacer-full-width');
    }
    
    if (fullHeight) {
      classes.push('ui-spacer-full-height');
    }
    
    return classes.join(' ');
  }, [className, flex, fullWidth, fullHeight]);
  
  return (
    <div
      ref={ref}
      className={spacerClassName}
      style={spacerStyles}
      aria-hidden="true"
      {...rest}
    />
  );
});

Spacer.displayName = 'Spacer';

export default Spacer; 