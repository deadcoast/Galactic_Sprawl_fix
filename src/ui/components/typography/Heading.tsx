/**
 * @context: ui-system, component-library, ui-typography-system
 * 
 * Heading component for displaying headings with consistent styling
 */
import * as React from 'react';
import { forwardRef, useMemo, memo } from 'react';
import { 
  BaseComponentProps,
  TextComponentProps
} from '../../../types/ui/ComponentTypes';

/**
 * Available heading levels
 */
export enum HeadingLevel {
  H1 = 'h1',
  H2 = 'h2',
  H3 = 'h3',
  H4 = 'h4',
  H5 = 'h5',
  H6 = 'h6'
}

/**
 * Heading alignment options
 */
export type HeadingAlignment = 'left' | 'center' | 'right';

/**
 * Heading component props
 */
export interface HeadingProps extends BaseComponentProps, TextComponentProps {
  /**
   * Heading content
   */
  children: React.ReactNode;
  
  /**
   * Heading level - determines which HTML element is rendered
   * @default 'h2'
   */
  level?: HeadingLevel | keyof typeof HeadingLevel;
  
  /**
   * Heading text alignment
   * @default 'left'
   */
  align?: HeadingAlignment;
  
  /**
   * Whether to add a bottom margin to the heading
   * @default true
   */
  withMargin?: boolean;

  /**
   * Whether the heading should have a divider underneath
   * @default false 
   */
  withDivider?: boolean;
  
  /**
   * Whether the heading should be responsive (adjusts size on smaller screens)
   * @default true
   */
  responsive?: boolean;
}

/**
 * Check if a value is a valid HeadingLevel
 */
function isHeadingLevel(value: unknown): value is HeadingLevel {
  return typeof value === 'string' && Object.values(HeadingLevel).includes(value as HeadingLevel);
}

/**
 * Heading component
 * 
 * Renders a heading element with consistent styling
 */
const HeadingComponent = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({
    children,
    level = HeadingLevel.H2,
    align = 'left',
    withMargin = true,
    withDivider = false,
    responsive = true,
    color,
    fontSize,
    fontWeight,
    textAlign,
    truncate,
    textTransform,
    className = '',
    style,
    id,
    'aria-labelledby': ariaLabelledBy,
    'aria-label': ariaLabel,
    'data-testid': dataTestId,
  }, ref) => {
    // Validate level
    const safeLevel = isHeadingLevel(level) ? level : HeadingLevel.H2;
    
    // Compute heading classes
    const headingClasses = useMemo(() => {
      return [
              'gs-heading',
              `gs-heading--${safeLevel}`,
              `gs-heading--align-${align || textAlign || 'left'}`,
              withMargin ? 'gs-heading--with-margin' : '',
              withDivider ? 'gs-heading--with-divider' : '',
              responsive ? 'gs-heading--responsive' : '',
              color ? `gs-heading--color-${color}` : '',
              fontSize ? `gs-heading--font-size-${fontSize}` : '',
              fontWeight ? `gs-heading--font-weight-${fontWeight}` : '',
              truncate ? 'gs-heading--truncate' : '',
              textTransform ? `gs-heading--text-transform-${textTransform}` : '',
              className
            ].filter(Boolean).join(' ');
    }, [
      safeLevel,
      align,
      textAlign,
      withMargin,
      withDivider,
      responsive,
      color,
      fontSize,
      fontWeight,
      truncate,
      textTransform,
      className
    ]);
    
    // Render the heading with the appropriate HTML element
    const Component = safeLevel as keyof JSX.IntrinsicElements;
    
    // Use createElement to avoid type issues
    return React.createElement(
      Component,
      {
        ref,
        className: headingClasses,
        style: style,
        ...(Component === 'h1' || Component === 'h2' || Component === 'h3' || 
           Component === 'h4' || Component === 'h5' || Component === 'h6' 
           ? { id } : {}),
        'aria-labelledby': ariaLabelledBy,
        'aria-label': ariaLabel,
        'data-testid': dataTestId
      },
      children
    );
  }
);

HeadingComponent.displayName = 'Heading';

/**
 * Memoized Heading component to prevent unnecessary re-renders
 */
export const Heading = memo(HeadingComponent);

export default Heading; 