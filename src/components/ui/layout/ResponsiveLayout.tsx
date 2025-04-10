/**
 * @context: ui-system, component-library
 * 
 * A responsive layout component that adapts to different screen sizes
 * and automatically optimizes the layout for mobile devices.
 */

import * as React from 'react';
import { CSSProperties, ReactNode, useMemo } from 'react';
import { useBreakpoint } from '../../../hooks/ui/useBreakpoint';
import { ThemeBreakpoint } from '../../../types/ui/ThemeTypes';

export type LayoutDirection = 'row' | 'column';
export type LayoutGap = number | string;
export type LayoutJustify = 
  | 'start' 
  | 'end' 
  | 'center' 
  | 'space-between' 
  | 'space-around' 
  | 'space-evenly';
export type LayoutAlign = 'start' | 'end' | 'center' | 'stretch';
export type LayoutWrap = 'nowrap' | 'wrap' | 'wrap-reverse';

export interface ResponsiveLayoutProps {
  /**
   * Layout direction on different screen sizes
   */
  direction?: LayoutDirection | {
    xs?: LayoutDirection;
    sm?: LayoutDirection;
    md?: LayoutDirection;
    lg?: LayoutDirection;
    xl?: LayoutDirection;
    xxl?: LayoutDirection;
  };
  
  /**
   * Gap between items
   */
  gap?: LayoutGap | {
    xs?: LayoutGap;
    sm?: LayoutGap;
    md?: LayoutGap;
    lg?: LayoutGap;
    xl?: LayoutGap;
    xxl?: LayoutGap;
  };
  
  /**
   * Justification of items along the main axis
   */
  justify?: LayoutJustify | {
    xs?: LayoutJustify;
    sm?: LayoutJustify;
    md?: LayoutJustify;
    lg?: LayoutJustify;
    xl?: LayoutJustify;
    xxl?: LayoutJustify;
  };
  
  /**
   * Alignment of items along the cross axis
   */
  align?: LayoutAlign | {
    xs?: LayoutAlign;
    sm?: LayoutAlign;
    md?: LayoutAlign;
    lg?: LayoutAlign;
    xl?: LayoutAlign;
    xxl?: LayoutAlign;
  };
  
  /**
   * Wrapping behavior
   */
  wrap?: LayoutWrap | {
    xs?: LayoutWrap;
    sm?: LayoutWrap;
    md?: LayoutWrap;
    lg?: LayoutWrap;
    xl?: LayoutWrap;
    xxl?: LayoutWrap;
  };
  
  /**
   * Padding around the layout
   */
  padding?: string | number | {
    xs?: string | number;
    sm?: string | number;
    md?: string | number;
    lg?: string | number;
    xl?: string | number;
    xxl?: string | number;
  };
  
  /**
   * Additional CSS styles
   */
  style?: CSSProperties;
  
  /**
   * CSS class name
   */
  className?: string;
  
  /**
   * Whether to optimize the layout for touch devices
   */
  optimizeForTouch?: boolean;
  
  /**
   * Whether to center the content when there's only one child
   */
  centerSingleChild?: boolean;
  
  /**
   * Content to render
   */
  children: ReactNode;
  
  /**
   * Maximum width of the layout (set to 'none' to disable)
   */
  maxWidth?: string | {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    xxl?: string;
  };
  
  /**
   * Layout items height (set to 'auto' to disable)
   */
  itemHeight?: string | number | {
    xs?: string | number;
    sm?: string | number;
    md?: string | number;
    lg?: string | number;
    xl?: string | number;
    xxl?: string | number;
  };
  
  /**
   * Layout items width (set to 'auto' to disable)
   */
  itemWidth?: string | number | {
    xs?: string | number;
    sm?: string | number;
    md?: string | number;
    lg?: string | number;
    xl?: string | number;
    xxl?: string | number;
  };
  
  /**
   * Whether to animate layout changes
   */
  animate?: boolean;
  
  /**
   * Animation duration in milliseconds
   */
  animationDuration?: number;
  
  /**
   * How munknown columns to use for the grid (automatic grid layout when specified)
   */
  columns?: number | {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
  };
  
  /**
   * Whether the grid should use auto-fill (true) or auto-fit (false)
   */
  gridAutoFill?: boolean;
  
  /**
   * Whether to add adequate touch targets (min 44px) for mobile
   */
  ensureTouchTargets?: boolean;
  
  /**
   * Whether to add additional padding on mobile
   */
  mobileExtraPadding?: boolean;
  
  /**
   * Data attribute for testing
   */
  'data-testid'?: string;
}

/**
 * Get responsive value based on current breakpoint
 */
function getResponsiveValue<T>(
  value: T | { xs?: T; sm?: T; md?: T; lg?: T; xl?: T; xxl?: T } | undefined,
  breakpoint: string,
  defaultValue: T
): T {
  if (value === undefined) {
    return defaultValue;
  }
  
  if (typeof value === 'object' && value !== null) {
    // Get breakpoint value or find the closest smaller breakpoint with a value
    const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
    const index = breakpoints.indexOf(breakpoint);
    
    // Look for exact match first
    if (value[breakpoint as keyof typeof value] !== undefined) {
      return value[breakpoint as keyof typeof value] as T;
    }
    
    // Then look for smaller breakpoints
    for (let i = index - 1; i >= 0; i--) {
      const bp = breakpoints[i];
      if (value[bp as keyof typeof value] !== undefined) {
        return value[bp as keyof typeof value] as T;
      }
    }
    
    // Finally look for larger breakpoints
    for (let i = index + 1; i < breakpoints.length; i++) {
      const bp = breakpoints[i];
      if (value[bp as keyof typeof value] !== undefined) {
        return value[bp as keyof typeof value] as T;
      }
    }
    
    return defaultValue;
  }
  
  return value;
}

/**
 * A responsive layout component that adapts to different screen sizes
 */
export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  direction = 'row',
  gap = 16,
  justify = 'start',
  align = 'start',
  wrap = 'wrap',
  padding,
  style,
  className,
  optimizeForTouch = false,
  centerSingleChild = false,
  children,
  maxWidth,
  itemHeight,
  itemWidth,
  animate = false,
  animationDuration = 300,
  columns,
  gridAutoFill = false,
  ensureTouchTargets = true,
  mobileExtraPadding = true,
  'data-testid': testId,
}) => {
  // Get current breakpoint
  const breakpoint = useBreakpoint();
  
  // Whether to use grid layout
  const useGrid = columns !== undefined;
  
  // Calculate styles based on breakpoint
  const layoutStyles = useMemo(() => {
    // Get responsive values for current breakpoint
    const currentDirection = getResponsiveValue(direction, breakpoint.current, 'row');
    const currentGap = getResponsiveValue(gap, breakpoint.current, 16);
    const currentJustify = getResponsiveValue(justify, breakpoint.current, 'start');
    const currentAlign = getResponsiveValue(align, breakpoint.current, 'start');
    const currentWrap = getResponsiveValue(wrap, breakpoint.current, 'wrap');
    const currentPadding = getResponsiveValue(padding, breakpoint.current, '0');
    const currentMaxWidth = getResponsiveValue(maxWidth, breakpoint.current, 'none');
    const currentItemHeight = getResponsiveValue(itemHeight, breakpoint.current, 'auto');
    const currentItemWidth = getResponsiveValue(itemWidth, breakpoint.current, 'auto');
    const currentColumns = getResponsiveValue(columns, breakpoint.current, 0);
    
    // Convert justification values to CSS values
    const justifyMap: Record<LayoutJustify, string> = {
      'start': 'flex-start',
      'end': 'flex-end',
      'center': 'center',
      'space-between': 'space-between',
      'space-around': 'space-around',
      'space-evenly': 'space-evenly'
    };
    
    // Convert alignment values to CSS values
    const alignMap: Record<LayoutAlign, string> = {
      'start': 'flex-start',
      'end': 'flex-end',
      'center': 'center',
      'stretch': 'stretch'
    };
    
    // Base styles
    const baseStyles: CSSProperties = {
      display: useGrid ? 'grid' : 'flex',
      maxWidth: currentMaxWidth === 'none' ? undefined : currentMaxWidth,
      margin: currentMaxWidth === 'none' ? undefined : '0 auto',
      padding: typeof currentPadding === 'number' ? `${currentPadding}px` : currentPadding,
      boxSizing: 'border-box',
      transition: animate ? `all ${animationDuration}ms ease-in-out` : undefined,
    };
    
    // Add extra padding on mobile if needed
    if (mobileExtraPadding && breakpoint.isAtMost(ThemeBreakpoint.SM)) {
      const paddingValue = typeof currentPadding === 'number' 
        ? currentPadding 
        : parseInt(currentPadding.toString(), 10);
      
      if (!isNaN(paddingValue)) {
        const extraPadding = Math.max(16, paddingValue * 1.5);
        baseStyles.padding = `${extraPadding}px`;
      }
    }
    
    // Add flex or grid styles
    if (useGrid && currentColumns > 0) {
      const fillMode = gridAutoFill ? 'auto-fill' : 'auto-fit';
      const minWidth = breakpoint.isAtMost(ThemeBreakpoint.SM) ? '100%' : `${100 / currentColumns}%`;
      
      Object.assign(baseStyles, {
        gridTemplateColumns: `repeat(${fillMode}, minmax(${minWidth}, 1fr))`,
        gap: typeof currentGap === 'number' ? `${currentGap}px` : currentGap,
        justifyItems: justifyMap[currentJustify],
        alignItems: alignMap[currentAlign],
      });
    } else {
      Object.assign(baseStyles, {
        flexDirection: currentDirection,
        flexWrap: currentWrap,
        gap: typeof currentGap === 'number' ? `${currentGap}px` : currentGap,
        justifyContent: justifyMap[currentJustify],
        alignItems: alignMap[currentAlign],
      });
    }
    
    // Add touch optimization if needed
    if ((optimizeForTouch || breakpoint.isMobile) && ensureTouchTargets) {
      // Ensure minimum touch target size
      const minTouchSize = '44px';
      
      if (currentDirection === 'row') {
        baseStyles.minHeight = minTouchSize;
      } else {
        baseStyles.minWidth = minTouchSize;
      }
    }
    
    // Center single child if needed
    const childCount = React.Children.count(children);
    if (centerSingleChild && childCount === 1) {
      baseStyles.justifyContent = 'center';
      baseStyles.alignItems = 'center';
    }
    
    // Create item styles
    const itemStyles: CSSProperties = {};
    
    if (currentItemHeight !== 'auto') {
      itemStyles.height = typeof currentItemHeight === 'number' 
        ? `${currentItemHeight}px` 
        : currentItemHeight;
    }
    
    if (currentItemWidth !== 'auto') {
      itemStyles.width = typeof currentItemWidth === 'number' 
        ? `${currentItemWidth}px` 
        : currentItemWidth;
    }
    
    return { containerStyles: { ...baseStyles, ...style }, itemStyles };
  }, [
    breakpoint,
    direction,
    gap,
    justify,
    align,
    wrap,
    padding,
    style,
    optimizeForTouch,
    centerSingleChild,
    children,
    maxWidth,
    itemHeight,
    itemWidth,
    animate,
    animationDuration,
    useGrid,
    columns,
    gridAutoFill,
    ensureTouchTargets,
    mobileExtraPadding,
  ]);
  
  // Apply styles to children if item styles are defined
  const hasItemStyles = 
    layoutStyles.itemStyles.height !== undefined || 
    layoutStyles.itemStyles.width !== undefined;
  
  const styledChildren = hasItemStyles
    ? React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          // Get props with the correct type
          const childProps = child.props as React.HTMLAttributes<HTMLElement>;
          
          return React.cloneElement(child, {
            style: {
              ...(childProps.style || {}),
              ...layoutStyles.itemStyles,
            },
          } as React.JSX.IntrinsicAttributes);
        }
        return child;
      })
    : children;
  
  return (
    <div 
      data-testid={testId}
      className={className}
      style={layoutStyles.containerStyles}
    >
      {styledChildren}
    </div>
  );
};

/**
 * Example usage:
 * 
 * <ResponsiveLayout
 *   direction={{ xs: 'column', md: 'row' }}
 *   gap={{ xs: 8, md: 16 }}
 *   padding={{ xs: 16, md: 24 }}
 *   optimizeForTouch
 * >
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </ResponsiveLayout>
 *
 * // Grid layout
 * <ResponsiveLayout
 *   columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
 *   gap={16}
 *   padding={24}
 * >
 *   <div>Card 1</div>
 *   <div>Card 2</div>
 *   <div>Card 3</div>
 *   <div>Card 4</div>
 * </ResponsiveLayout>
 */ 