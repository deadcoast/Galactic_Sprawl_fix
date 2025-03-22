/**
 * @context: ui-system, ui-layout-system, component-library
 * 
 * Container component that provides a centered, width-constrained wrapper with consistent margin and padding
 */
import * as React from 'react';
import { forwardRef, useMemo } from 'react';
import { 
  BaseComponentProps, 
  LayoutComponentProps 
} from '../../../types/ui/ComponentTypes';

/**
 * Container width options
 */
export enum ContainerWidth {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  XLARGE = 'xlarge',
  FULL = 'full',
  AUTO = 'auto'
}

/**
 * Container component props
 */
export interface ContainerProps extends BaseComponentProps, LayoutComponentProps {
  /**
   * Container content
   */
  children: React.ReactNode;
  
  /**
   * Container maximum width
   * @default 'medium'
   */
  maxWidth?: ContainerWidth | keyof typeof ContainerWidth | string | number;
  
  /**
   * Whether the container should be centered horizontally
   * @default true
   */
  centered?: boolean;
  
  /**
   * Whether to make the container a flex container
   * @default false
   */
  flex?: boolean;
  
  /**
   * HTML element to render
   * @default 'div'
   */
  as?: keyof JSX.IntrinsicElements;
  
  /**
   * Whether to add a subtle background color to the container
   * @default false
   */
  withBackground?: boolean;
  
  /**
   * Whether to add a border to the container
   * @default false
   */
  withBorder?: boolean;
  
  /**
   * Whether to add a drop shadow to the container
   * @default false
   */
  withShadow?: boolean;
  
  /**
   * Custom max width value when maxWidth is not one of the predefined options
   */
  customMaxWidth?: string | number;
}

/**
 * Check if a value is a valid ContainerWidth
 */
function isContainerWidth(value: unknown): value is ContainerWidth {
  return typeof value === 'string' && Object.values(ContainerWidth).includes(value as ContainerWidth);
}

/**
 * Convert maxWidth to CSS value
 */
function getMaxWidthValue(
  maxWidth: ContainerWidth | keyof typeof ContainerWidth | string | number | undefined, 
  customMaxWidth?: string | number
): string | number | undefined {
  // Custom max width takes precedence
  if (customMaxWidth !== undefined) {
    return typeof customMaxWidth === 'number' ? `${customMaxWidth}px` : customMaxWidth;
  }
  
  // Return undefined if no maxWidth
  if (maxWidth === undefined) {
    return undefined;
  }
  
  // If maxWidth is a direct number, return as pixels
  if (typeof maxWidth === 'number') {
    return `${maxWidth}px`;
  }
  
  // If maxWidth is a predefined option, return the corresponding value
  if (isContainerWidth(maxWidth)) {
    switch (maxWidth) {
      case ContainerWidth.SMALL:
        return '600px';
      case ContainerWidth.MEDIUM:
        return '1000px';
      case ContainerWidth.LARGE:
        return '1400px';
      case ContainerWidth.XLARGE:
        return '1800px';
      case ContainerWidth.FULL:
        return '100%';
      case ContainerWidth.AUTO:
      default:
        return 'auto';
    }
  }
  
  // Otherwise, return the maxWidth as is
  return maxWidth;
}

/**
 * Container component
 * 
 * Provides a centered, width-constrained wrapper with consistent margin and padding
 */
export const Container = forwardRef<HTMLElement, ContainerProps>(
  ({
    children,
    maxWidth = ContainerWidth.MEDIUM,
    centered = true,
    flex = false,
    as = 'div',
    withBackground = false,
    withBorder = false,
    withShadow = false,
    customMaxWidth,
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
    ...rest
  }, ref) => {
    // Convert maxWidth to CSS value
    const maxWidthValue = getMaxWidthValue(maxWidth, customMaxWidth);
    
    // Compute container classes
    const containerClasses = useMemo(() => {
      const classes = [
        'gs-container',
        withBackground ? 'gs-container--with-background' : '',
        withBorder ? 'gs-container--with-border' : '',
        withShadow ? 'gs-container--with-shadow' : '',
        centered ? 'gs-container--centered' : '',
        fullWidth ? 'gs-container--full-width' : '',
        className
      ].filter(Boolean).join(' ');
      
      return classes;
    }, [
      withBackground,
      withBorder,
      withShadow,
      centered,
      fullWidth,
      className
    ]);
    
    // Compute container styles
    const containerStyles = useMemo(() => {
      return {
        maxWidth: maxWidthValue,
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
        display: flex ? 'flex' : display,
        position,
        ...style
      };
    }, [
      maxWidthValue,
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
      flex,
      display,
      position,
      style
    ]);
    
    // Render the component with the element specified by the 'as' prop
    if (as === 'div') {
      return (
        <div
          ref={ref as React.ForwardedRef<HTMLDivElement>}
          className={containerClasses}
          style={containerStyles}
          id={id}
          aria-labelledby={ariaLabelledBy}
          aria-label={ariaLabel}
          data-testid={dataTestId}
          {...rest}
        >
          {children}
        </div>
      );
    }
    
    // For other elements, use createElement to avoid type issues
    return React.createElement(
      as,
      {
        className: containerClasses,
        style: containerStyles,
        // Only add additional props when they are defined and relevant
        ...(id ? { id } : {}),
        ...(ariaLabelledBy ? { 'aria-labelledby': ariaLabelledBy } : {}),
        ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
        ...(dataTestId ? { 'data-testid': dataTestId } : {}),
        ...rest
      },
      children
    );
  }
);

Container.displayName = 'Container';

export default Container; 