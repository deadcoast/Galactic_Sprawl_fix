/**
 * @context: ui-system, component-library
 * 
 * Tooltip component for displaying additional information when hovering over elements
 */
import * as React from 'react';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { BaseComponentProps, ComponentSize, isComponentSize } from '../../types/ui/ComponentTypes';

/**
 * Tooltip placement options relative to the trigger element
 */
export enum TooltipPlacement {
  TOP = 'top',
  RIGHT = 'right',
  BOTTOM = 'bottom',
  LEFT = 'left',
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right'
}

/**
 * Tooltip component props
 */
export interface TooltipProps extends BaseComponentProps {
  /**
   * Tooltip content
   */
  content: React.ReactNode;
  
  /**
   * Element that triggers the tooltip
   */
  children: React.ReactElement;
  
  /**
   * Tooltip placement relative to the trigger element
   * @default 'top'
   */
  placement?: TooltipPlacement | keyof typeof TooltipPlacement;
  
  /**
   * Tooltip size
   * @default 'medium'
   */
  size?: ComponentSize;
  
  /**
   * Delay before showing the tooltip in milliseconds
   * @default 200
   */
  showDelay?: number;
  
  /**
   * Delay before hiding the tooltip in milliseconds
   * @default 0
   */
  hideDelay?: number;
  
  /**
   * Whether the tooltip should be disabled
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Whether the tooltip is visible (controlled mode)
   */
  visible?: boolean;
  
  /**
   * Called when the tooltip visibility changes
   */
  onVisibilityChange?: (visible: boolean) => void;
  
  /**
   * Maximum width of the tooltip
   */
  maxWidth?: number | string;
  
  /**
   * Whether to use a portal for rendering the tooltip
   * @default true
   */
  usePortal?: boolean;
  
  /**
   * Distance from the trigger element in pixels
   * @default 8
   */
  offset?: number;
}

/**
 * Check if a value is a valid TooltipPlacement
 */
function isTooltipPlacement(value: unknown): value is TooltipPlacement {
  return typeof value === 'string' && Object.values(TooltipPlacement).includes(value as TooltipPlacement);
}

/**
 * Tooltip component
 * 
 * Displays additional information when hovering over elements
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = TooltipPlacement.TOP,
  size = ComponentSize.MEDIUM,
  showDelay = 200,
  hideDelay = 0,
  disabled = false,
  visible: controlledVisible,
  onVisibilityChange,
  className = '',
  style,
  id,
  maxWidth,
  usePortal = true,
  offset = 8,
  'data-testid': dataTestId,
}) => {
  // Validate placement and size for type safety
  const safePlacement = isTooltipPlacement(placement) ? placement : TooltipPlacement.TOP;
  const safeSize = isComponentSize(size) ? size : ComponentSize.MEDIUM;
  
  // State for uncontrolled visibility
  const [internalVisible, setInternalVisible] = useState(false);
  
  // Use controlled state if provided, internal state otherwise
  const isVisible = controlledVisible !== undefined ? controlledVisible : internalVisible;
  
  // References for tooltip and trigger elements
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  
  // Timer refs for delays
  const showTimeoutRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  
  // Position state for the tooltip
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  // Clear unknown existing timers
  const clearTimers = useCallback(() => {
    if (showTimeoutRef.current !== null) {
      window.clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);
  
  // Set the visibility state with delays
  const setVisibility = useCallback((visible: boolean) => {
    clearTimers();
    
    if (visible && !disabled) {
      showTimeoutRef.current = window.setTimeout(() => {
        setInternalVisible(true);
        onVisibilityChange?.(true);
      }, showDelay);
    } else {
      hideTimeoutRef.current = window.setTimeout(() => {
        setInternalVisible(false);
        onVisibilityChange?.(false);
      }, hideDelay);
    }
  }, [clearTimers, showDelay, hideDelay, disabled, onVisibilityChange]);
  
  // Handle mouse events for the trigger element
  const handleMouseEnter = useCallback(() => {
    setVisibility(true);
  }, [setVisibility]);
  
  const handleMouseLeave = useCallback(() => {
    setVisibility(false);
  }, [setVisibility]);
  
  // Handle focus events for accessibility
  const handleFocus = useCallback(() => {
    setVisibility(true);
  }, [setVisibility]);
  
  const handleBlur = useCallback(() => {
    setVisibility(false);
  }, [setVisibility]);
  
  // Calculate tooltip position based on trigger element and placement
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    
    let top = 0;
    let left = 0;
    
    switch (safePlacement) {
      case TooltipPlacement.TOP:
        top = triggerRect.top - tooltipRect.height - offset + scrollY;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2) + scrollX;
        break;
      
      case TooltipPlacement.BOTTOM:
        top = triggerRect.bottom + offset + scrollY;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2) + scrollX;
        break;
      
      case TooltipPlacement.LEFT:
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2) + scrollY;
        left = triggerRect.left - tooltipRect.width - offset + scrollX;
        break;
      
      case TooltipPlacement.RIGHT:
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2) + scrollY;
        left = triggerRect.right + offset + scrollX;
        break;
      
      case TooltipPlacement.TOP_LEFT:
        top = triggerRect.top - tooltipRect.height - offset + scrollY;
        left = triggerRect.left + scrollX;
        break;
      
      case TooltipPlacement.TOP_RIGHT:
        top = triggerRect.top - tooltipRect.height - offset + scrollY;
        left = triggerRect.right - tooltipRect.width + scrollX;
        break;
      
      case TooltipPlacement.BOTTOM_LEFT:
        top = triggerRect.bottom + offset + scrollY;
        left = triggerRect.left + scrollX;
        break;
      
      case TooltipPlacement.BOTTOM_RIGHT:
        top = triggerRect.bottom + offset + scrollY;
        left = triggerRect.right - tooltipRect.width + scrollX;
        break;
      
      default:
        top = triggerRect.top - tooltipRect.height - offset + scrollY;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2) + scrollX;
        break;
    }
    
    // Constrain to viewport boundaries
    const padding = 5;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (left < padding + scrollX) {
      left = padding + scrollX;
    } else if (left + tooltipRect.width > viewportWidth - padding + scrollX) {
      left = viewportWidth - tooltipRect.width - padding + scrollX;
    }
    
    if (top < padding + scrollY) {
      top = padding + scrollY;
    } else if (top + tooltipRect.height > viewportHeight - padding + scrollY) {
      top = viewportHeight - tooltipRect.height - padding + scrollY;
    }
    
    setPosition({ top, left });
  }, [safePlacement, offset]);
  
  // Update position when visibility or placement changes
  useEffect(() => {
    if (isVisible) {
      // Use requestAnimationFrame to allow the DOM to update
      requestAnimationFrame(() => {
        calculatePosition();
      });
      
      // Add resize listener
      window.addEventListener('resize', calculatePosition);
      window.addEventListener('scroll', calculatePosition, true);
      
      return () => {
        window.removeEventListener('resize', calculatePosition);
        window.removeEventListener('scroll', calculatePosition, true);
      };
    }
  }, [isVisible, calculatePosition]);
  
  // Clone the child with refs and event handlers
  const triggerElement = useMemo(() => {
    return React.cloneElement(React.Children.only(children), {
      ref: (node: HTMLElement | null) => {
        triggerRef.current = node;
        
        // Forward ref if the child has one
        // Using type assertion with unknown as intermediate step for type safety
        const childElement = children as unknown as { ref?: React.Ref<HTMLElement> };
        if (childElement.ref) {
          if (typeof childElement.ref === 'function') {
            childElement.ref(node);
          } else {
            (childElement.ref as React.MutableRefObject<HTMLElement | null>).current = node;
          }
        }
      },
      onMouseEnter: (e: React.MouseEvent) => {
        handleMouseEnter();
        
        // Forward the original event handler if it exists
        if (children.props.onMouseEnter) {
          children.props.onMouseEnter(e);
        }
      },
      onMouseLeave: (e: React.MouseEvent) => {
        handleMouseLeave();
        
        // Forward the original event handler if it exists
        if (children.props.onMouseLeave) {
          children.props.onMouseLeave(e);
        }
      },
      onFocus: (e: React.FocusEvent) => {
        handleFocus();
        
        // Forward the original event handler if it exists
        if (children.props.onFocus) {
          children.props.onFocus(e);
        }
      },
      onBlur: (e: React.FocusEvent) => {
        handleBlur();
        
        // Forward the original event handler if it exists
        if (children.props.onBlur) {
          children.props.onBlur(e);
        }
      },
    });
  }, [children, handleMouseEnter, handleMouseLeave, handleFocus, handleBlur]);
  
  // Compute tooltip classes
  const tooltipClasses = useMemo(() => {
    return [
      'gs-tooltip',
      `gs-tooltip--${safePlacement}`,
      `gs-tooltip--${safeSize}`,
      isVisible ? 'gs-tooltip--visible' : '',
      className
    ].filter(Boolean).join(' ');
  }, [safePlacement, safeSize, isVisible, className]);
  
  // Generate tooltip styles
  const tooltipStyles = useMemo(() => {
    return {
      ...style,
      top: `${position.top}px`,
      left: `${position.left}px`,
      maxWidth: maxWidth !== undefined 
        ? (typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth) 
        : undefined
    };
  }, [style, position.top, position.left, maxWidth]);
  
  // Clean up timers on unmount
  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);
  
  // If disabled, don't render the tooltip
  if (disabled) {
    return <>{children}</>;
  }
  
  // Render the tooltip and trigger element
  const tooltipElement = (
    <div
      ref={tooltipRef}
      id={id}
      className={tooltipClasses}
      style={tooltipStyles}
      role="tooltip"
      data-testid={dataTestId}
    >
      <div className="gs-tooltip__content">
        {content}
      </div>
      <div className="gs-tooltip__arrow" />
    </div>
  );
  
  return (
    <>
      {triggerElement}
      {isVisible && (
        usePortal
          ? createPortal(tooltipElement, document.body)
          : tooltipElement
      )}
    </>
  );
};

Tooltip.displayName = 'Tooltip';

export default Tooltip; 