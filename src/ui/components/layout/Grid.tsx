/**
 * @context: ui-system, ui-layout-system, component-library
 *
 * Grid component for creating responsive grid layouts
 */
import * as React from 'react';
import { forwardRef, useMemo } from 'react';
import { BaseComponentProps, LayoutComponentProps } from '../../../types/ui/ComponentTypes';

/**
 * Grid template options
 */
export enum GridTemplate {
  EQUAL = 'equal', // Equal width columns
  AUTO = 'auto', // Auto width based on content
  AUTO_FILL = 'auto-fill', // Auto fill available space
  AUTO_FIT = 'auto-fit', // Auto fit available space
}

/**
 * Grid alignment options
 */
export enum GridAlignment {
  START = 'start',
  CENTER = 'center',
  END = 'end',
  STRETCH = 'stretch',
  SPACE_BETWEEN = 'space-between',
  SPACE_AROUND = 'space-around',
  SPACE_EVENLY = 'space-evenly',
}

/**
 * Grid component props
 */
export interface GridProps extends BaseComponentProps, LayoutComponentProps {
  /**
   * Grid content
   */
  children: React.ReactNode;

  /**
   * Number of columns
   * @default 12
   */
  columns?: number;

  /**
   * Grid column gap
   * @default 16
   */
  columnGap?: number | string;

  /**
   * Grid row gap
   * @default 16
   */
  rowGap?: number | string;

  /**
   * Combined shorthand for row and column gap
   */
  gap?: number | string;

  /**
   * HTML element to render
   * @default 'div'
   */
  as?: keyof JSX.IntrinsicElements;

  /**
   * Minimum column width for auto templates
   * Used with AUTO_FILL and AUTO_FIT templates
   */
  minColumnWidth?: number | string;

  /**
   * Grid template type
   * @default 'equal'
   */
  template?: GridTemplate | keyof typeof GridTemplate;

  /**
   * Custom grid-template-columns CSS value
   * Overrides columns and template props
   */
  templateColumns?: string;

  /**
   * Custom grid-template-rows CSS value
   */
  templateRows?: string;

  /**
   * Horizontal alignment of grid items
   */
  alignItems?: GridAlignment | keyof typeof GridAlignment;

  /**
   * Vertical alignment of grid items
   */
  justifyItems?: GridAlignment | keyof typeof GridAlignment;

  /**
   * Horizontal alignment of the entire grid
   */
  justifyContent?: GridAlignment | keyof typeof GridAlignment;

  /**
   * Vertical alignment of the entire grid
   */
  alignContent?: GridAlignment | keyof typeof GridAlignment;

  /**
   * Whether the grid should take up the full height of its container
   * @default false
   */
  fullHeight?: boolean;

  /**
   * Custom CSS grid-auto-flow value
   */
  autoFlow?: 'row' | 'column' | 'row dense' | 'column dense';
}

/**
 * Check if a value is a valid GridTemplate
 */
function isGridTemplate(value: unknown): value is GridTemplate {
  return typeof value === 'string' && Object.values(GridTemplate).includes(value as GridTemplate);
}

/**
 * Check if a value is a valid GridAlignment
 */
function isGridAlignment(value: unknown): value is GridAlignment {
  return typeof value === 'string' && Object.values(GridAlignment).includes(value as GridAlignment);
}

/**
 * Generate a grid template columns value based on template type
 */
function getGridTemplateColumns(
  template: GridTemplate | keyof typeof GridTemplate | undefined,
  columns: number,
  minColumnWidth: number | string | undefined
): string {
  if (!template) {
    return `repeat(${columns}, 1fr)`;
  }

  if (isGridTemplate(template)) {
    switch (template) {
      case GridTemplate.EQUAL:
        return `repeat(${columns}, 1fr)`;
      case GridTemplate.AUTO:
        return `repeat(${columns}, auto)`;
      case GridTemplate.AUTO_FILL:
        if (minColumnWidth) {
          return `repeat(auto-fill, minmax(${typeof minColumnWidth === 'number' ? `${minColumnWidth}px` : minColumnWidth}, 1fr))`;
        }
        return `repeat(auto-fill, minmax(150px, 1fr))`;
      case GridTemplate.AUTO_FIT:
        if (minColumnWidth) {
          return `repeat(auto-fit, minmax(${typeof minColumnWidth === 'number' ? `${minColumnWidth}px` : minColumnWidth}, 1fr))`;
        }
        return `repeat(auto-fit, minmax(150px, 1fr))`;
      default:
        return `repeat(${columns}, 1fr)`;
    }
  }

  return `repeat(${columns}, 1fr)`;
}

/**
 * Grid component
 *
 * Creates responsive grid layouts
 */
export const Grid = forwardRef<HTMLElement, GridProps>(
  (
    {
      children,
      columns = 12,
      columnGap = 16,
      rowGap = 16,
      gap,
      as = 'div',
      minColumnWidth,
      template = GridTemplate.EQUAL,
      templateColumns,
      templateRows,
      alignItems,
      justifyItems,
      justifyContent,
      alignContent,
      fullHeight = false,
      autoFlow,
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
    },
    _ref
  ) => {
    // Compute grid classes
    const gridClasses = useMemo(() => {
      return [
        'gs-grid',
        fullWidth ? 'gs-grid--full-width' : '',
        fullHeight ? 'gs-grid--full-height' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ');
    }, [fullWidth, fullHeight, className]);

    // Compute grid styles
    const gridStyles = useMemo(() => {
      // Calculate grid-template-columns based on props
      const gridTemplateColumns =
        templateColumns || getGridTemplateColumns(template, columns, minColumnWidth);

      return {
        display: 'grid',
        gridTemplateColumns,
        gridTemplateRows: templateRows,
        gap: gap !== undefined ? (typeof gap === 'number' ? `${gap}px` : gap) : undefined,
        columnGap:
          gap === undefined
            ? typeof columnGap === 'number'
              ? `${columnGap}px`
              : columnGap
            : undefined,
        rowGap:
          gap === undefined ? (typeof rowGap === 'number' ? `${rowGap}px` : rowGap) : undefined,
        alignItems: alignItems && isGridAlignment(alignItems) ? alignItems : undefined,
        justifyItems: justifyItems && isGridAlignment(justifyItems) ? justifyItems : undefined,
        justifyContent:
          justifyContent && isGridAlignment(justifyContent) ? justifyContent : undefined,
        alignContent: alignContent && isGridAlignment(alignContent) ? alignContent : undefined,
        gridAutoFlow: autoFlow,
        height: fullHeight ? '100%' : undefined,
        width: fullWidth ? '100%' : undefined,
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
        ...style,
      };
    }, [
      template,
      columns,
      minColumnWidth,
      templateColumns,
      templateRows,
      gap,
      columnGap,
      rowGap,
      alignItems,
      justifyItems,
      justifyContent,
      alignContent,
      autoFlow,
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
      style,
    ]);

    // Render the component with the element specified by the 'as' prop
    const Component = as;

    // Use createElement to avoid type issues
    return React.createElement(
      Component,
      {
        className: gridClasses,
        style: gridStyles,
        ...(as === 'div' ? { id } : {}),
        ...(as === 'div'
          ? {
              'aria-labelledby': ariaLabelledBy,
              'aria-label': ariaLabel,
              'data-testid': dataTestId,
            }
          : {}),

        ref: _ref,
      },
      children
    );
  }
);

Grid.displayName = 'Grid';

export default Grid;
