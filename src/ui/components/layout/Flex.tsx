/**
 * @context: ui-system, ui-layout-system, component-library
 * 
 * Flex component for creating flexible box layouts
 */
import * as React from 'react';
import { forwardRef, useMemo } from 'react';
import { 
  BaseComponentProps, 
  LayoutComponentProps 
} from '../../../types/ui/ComponentTypes';

/**
 * Flex direction options
 */
export enum FlexDirection {
  ROW = 'row',
  ROW_REVERSE = 'row-reverse',
  COLUMN = 'column',
  COLUMN_REVERSE = 'column-reverse'
}

/**
 * Flex alignment options
 */
export enum FlexAlignment {
  START = 'flex-start',
  CENTER = 'center',
  END = 'flex-end',
  STRETCH = 'stretch',
  BASELINE = 'baseline'
}

/**
 * Flex justification options
 */
export enum FlexJustification {
  START = 'flex-start',
  CENTER = 'center',
  END = 'flex-end',
  SPACE_BETWEEN = 'space-between',
  SPACE_AROUND = 'space-around',
  SPACE_EVENLY = 'space-evenly'
}

/**
 * Flex wrap options
 */
export enum FlexWrap {
  NOWRAP = 'nowrap',
  WRAP = 'wrap',
  WRAP_REVERSE = 'wrap-reverse'
}

/**
 * Flex component props
 */
export interface FlexProps extends BaseComponentProps, LayoutComponentProps {
  /**
   * Flex content
   */
  children: React.ReactNode;
  
  /**
   * Flex direction
   * @default 'row'
   */
  direction?: FlexDirection | keyof typeof FlexDirection;
  
  /**
   * How items align on the cross-axis
   * @default 'center'
   */
  align?: FlexAlignment | keyof typeof FlexAlignment;
  
  /**
   * How items are distributed on the main-axis
   * @default 'flex-start'
   */
  justify?: FlexJustification | keyof typeof FlexJustification;
  
  /**
   * Whether items should wrap onto multiple lines
   * @default 'nowrap'
   */
  wrap?: FlexWrap | keyof typeof FlexWrap;
  
  /**
   * Gap between flex items
   */
  gap?: number | string;
  
  /**
   * Gap between rows (if wrapping)
   */
  rowGap?: number | string;
  
  /**
   * Gap between columns
   */
  columnGap?: number | string;
  
  /**
   * HTML element to render
   * @default 'div'
   */
  as?: keyof JSX.IntrinsicElements;
  
  /**
   * Whether all items should have equal width
   * @default false
   */
  equalWidth?: boolean;
  
  /**
   * Whether the flex container should take up the full height of its parent
   * @default false
   */
  fullHeight?: boolean;
  
  /**
   * Whether items should be centered both horizontally and vertically
   * A shorthand for align="center" and justify="center"
   * @default false
   */
  center?: boolean;
  
  /**
   * Whether items should be spaced evenly
   * A shorthand for justify="space-between"
   * @default false
   */
  spaceBetween?: boolean;
  
  /**
   * Whether items should be aligned to the start
   * A shorthand for justify="flex-start"
   * @default false
   */
  inline?: boolean;
}

/**
 * Check if a value is a valid FlexDirection
 */
function isFlexDirection(value: unknown): value is FlexDirection {
  return typeof value === 'string' && Object.values(FlexDirection).includes(value as FlexDirection);
}

/**
 * Check if a value is a valid FlexAlignment
 */
function isFlexAlignment(value: unknown): value is FlexAlignment {
  return typeof value === 'string' && Object.values(FlexAlignment).includes(value as FlexAlignment);
}

/**
 * Check if a value is a valid FlexJustification
 */
function isFlexJustification(value: unknown): value is FlexJustification {
  return typeof value === 'string' && Object.values(FlexJustification).includes(value as FlexJustification);
}

/**
 * Check if a value is a valid FlexWrap
 */
function isFlexWrap(value: unknown): value is FlexWrap {
  return typeof value === 'string' && Object.values(FlexWrap).includes(value as FlexWrap);
}

/**
 * Flex component
 * 
 * Creates flexible box layouts
 */
export const Flex = forwardRef<HTMLElement, FlexProps>(
  ({
    children,
    direction = FlexDirection.ROW,
    align = FlexAlignment.CENTER,
    justify = FlexJustification.START,
    wrap = FlexWrap.NOWRAP,
    gap,
    rowGap,
    columnGap,
    as = 'div',
    equalWidth = false,
    fullHeight = false,
    center = false,
    spaceBetween = false,
    inline = false,
    className = '',
    style,
    id,
    fullWidth,
    padding,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    margin,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    display,
    position,
    'aria-labelledby': ariaLabelledBy,
    'aria-label': ariaLabel,
    'data-testid': dataTestId,
  }, ref) => {
    // Override align and justify if center prop is provided
    const effectiveAlign = center ? FlexAlignment.CENTER : align;
    const effectiveJustify = center ? FlexJustification.CENTER : (spaceBetween ? FlexJustification.SPACE_BETWEEN : justify);
    
    // Compute flex classes
    const flexClasses = useMemo(() => {
      const classes = [
        'gs-flex',
        `gs-flex--${isFlexDirection(direction) ? direction : FlexDirection.ROW}`,
        equalWidth ? 'gs-flex--equal-width' : '',
        fullWidth ? 'gs-flex--full-width' : '',
        fullHeight ? 'gs-flex--full-height' : '',
        inline ? 'gs-flex--inline' : '',
        className
      ].filter(Boolean).join(' ');
      
      return classes;
    }, [
      direction,
      equalWidth,
      fullWidth,
      fullHeight,
      inline,
      className
    ]);
    
    // Compute flex styles
    const flexStyles = useMemo(() => {
      return {
        display: inline ? 'inline-flex' : 'flex',
        flexDirection: isFlexDirection(direction) ? direction : FlexDirection.ROW,
        alignItems: isFlexAlignment(effectiveAlign) ? effectiveAlign : FlexAlignment.CENTER,
        justifyContent: isFlexJustification(effectiveJustify) ? effectiveJustify : FlexJustification.START,
        flexWrap: isFlexWrap(wrap) ? wrap : FlexWrap.NOWRAP,
        gap: gap !== undefined ? (typeof gap === 'number' ? `${gap}px` : gap) : undefined,
        rowGap: rowGap !== undefined ? (typeof rowGap === 'number' ? `${rowGap}px` : rowGap) : undefined,
        columnGap: columnGap !== undefined ? (typeof columnGap === 'number' ? `${columnGap}px` : columnGap) : undefined,
        width: fullWidth ? '100%' : undefined,
        height: fullHeight ? '100%' : undefined,
        padding,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        margin,
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        position,
        ...style
      };
    }, [
      inline,
      direction,
      effectiveAlign,
      effectiveJustify,
      wrap,
      gap,
      rowGap,
      columnGap,
      fullWidth,
      fullHeight,
      padding,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
      margin,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
      position,
      style
    ]);
    
    // Render the component with the element specified by the 'as' prop
    const Component = as;
    
    return (
      <Component
        ref={ref}
        id={id}
        className={flexClasses}
        style={flexStyles}
        aria-labelledby={ariaLabelledBy}
        aria-label={ariaLabel}
        data-testid={dataTestId}
      >
        {children}
      </Component>
    );
  }
);

Flex.displayName = 'Flex';

export default Flex; 