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
  LayoutComponentProps,
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
    case 'start':
      return 'flex-start';
    case 'center':
      return 'center';
    case 'end':
      return 'flex-end';
    case 'stretch':
      return 'stretch';
    default:
      return 'flex-start';
  }
}

/**
 * Maps justification values to CSS values
 */
function getJustifyContent(
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
): string {
  switch (justify) {
    case 'start':
      return 'flex-start';
    case 'center':
      return 'center';
    case 'end':
      return 'flex-end';
    case 'between':
      return 'space-between';
    case 'around':
      return 'space-around';
    case 'evenly':
      return 'space-evenly';
    default:
      return 'flex-start';
  }
}

/**
 * Stack component for creating vertical or horizontal layouts
 * with consistent spacing between them.
 */
export const Stack = forwardRef<HTMLDivElement, StackProps>(
  (
    {
      children,
      className,
      style,
      direction = 'vertical',
      spacing = 'medium',
      align,
      justify = 'start',
      wrap = false,
      fullSize = false,
      dividers = false,
      gap,
      as = 'div',
      ...rest
    },
    ref
  ) => {
    // Memoize styles for better performance
    const stackStyles = useMemo(() => {
      return {
        ...style,
        display: 'flex',
        flexDirection: direction === 'vertical' ? ('column' as const) : ('row' as const),
        alignItems: getAlignItems(align),
        justifyContent: getJustifyContent(justify),
        gap: gap !== undefined ? (typeof gap === 'number' ? `${gap}px` : gap) : undefined,
        flexWrap: wrap ? ('wrap' as const) : ('nowrap' as const),
        width: fullSize ? '100%' : undefined,
        height: direction === 'vertical' && fullSize ? '100%' : undefined,
      };
    }, [style, direction, align, justify, gap, wrap, fullSize]);

    // Compute classes
    const stackClassName = useMemo(() => {
      const classes = ['ui-stack'];

      // Add direction class
      classes.push(`ui-stack-${direction}`);

      // Add spacing class if no custom gap
      if (gap === undefined) {
        classes.push(`ui-stack-spacing-${spacing}`);
      }

      // Add divider class if needed
      if (dividers) {
        classes.push('ui-stack-dividers');
      }

      // Add custom class if provided
      if (className) {
        classes.push(className);
      }

      return classes.join(' ');
    }, [className, dividers, direction, gap, spacing]);

    // The specific component type to render, but we use div for the ref type
    if (as === 'div') {
      return (
        <div ref={ref} className={stackClassName} style={stackStyles} {...rest}>
          {children}
        </div>
      );
    }

    // For other HTML elements, we need to use createElement
    // This avoids the type conflicts with the ref
    return React.createElement(
      as,
      {
        className: stackClassName,
        style: stackStyles,
        ...rest,
      },
      children
    );
  }
);

Stack.displayName = 'Stack';

export default Stack;
