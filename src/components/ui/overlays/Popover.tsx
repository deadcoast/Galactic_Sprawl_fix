/**
 * @context: ui-system, component-library, ui-library
 *
 * Popover component for displaying floating content relative to a trigger element
 */
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type PopoverPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

export interface PopoverProps {
  /**
   * The element that triggers the popover
   */
  children: React.ReactNode;

  /**
   * The content to display inside the popover
   */
  content: React.ReactNode;

  /**
   * Whether the popover is visible
   */
  isOpen: boolean;

  /**
   * Callback fired when the popover should close
   */
  onClose: () => void;

  /**
   * Placement of the popover relative to the trigger element
   * @default 'bottom'
   */
  placement?: PopoverPlacement;

  /**
   * Whether the popover should close when clicking outside
   * @default true
   */
  closeOnOutsideClick?: boolean;

  /**
   * Whether the popover should close when pressing the escape key
   * @default true
   */
  closeOnEsc?: boolean;

  /**
   * Gap between trigger and popover in pixels
   * @default 8
   */
  offset?: number;

  /**
   * Additional class name for the popover
   */
  className?: string;

  /**
   * Z-index for the popover
   */
  zIndex?: number;

  /**
   * Animation duration in milliseconds
   * @default 200
   */
  animationDuration?: number;

  /**
   * Whether the popover should have an arrow pointing to the trigger
   * @default true
   */
  shocombatrow?: boolean;

  /**
   * Min width of the popover (can be overridden by the content)
   */
  minWidth?: number | string;

  /**
   * Max width of the popover
   */
  maxWidth?: number | string;

  /**
   * Handler fired when popover has finished opening
   */
  onOpen?: () => void;

  /**
   * Whether to close when clicking on the popover content
   * @default false
   */
  closeOnContentClick?: boolean;

  /**
   * Whether the popover position should adjust when it would be clipped by the viewport
   * @default true
   */
  flip?: boolean;
}

/**
 * Popover component for displaying content that appears relative to a trigger element
 */
export function Popover({
  children,
  content,
  isOpen,
  onClose,
  placement = 'bottom',
  closeOnOutsideClick = true,
  closeOnEsc = true,
  offset = 8,
  className = '',
  zIndex,
  animationDuration = 200,
  shocombatrow = true,
  minWidth,
  maxWidth,
  onOpen,
  closeOnContentClick = false,
  flip = true,
}: PopoverProps) {
  // Reference to the trigger element
  const triggerRef = useRef<HTMLDivElement>(null);

  // Reference to the popover element
  const popoverRef = useRef<HTMLDivElement>(null);

  // Reference to the arrow element
  const arrowRef = useRef<HTMLDivElement>(null);

  // Track popover position
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    transformOrigin: string;
  }>({
    top: 0,
    left: 0,
    transformOrigin: 'center bottom',
  });

  // Track arrow position
  const [arrowPosition, setArrowPosition] = useState<{
    top?: number;
    left?: number;
    bottom?: number;
    right?: number;
  }>({});

  // Track if rendered in portal
  const [isRendered, setIsRendered] = useState(false);

  // Initialize internal open state for animations
  const [internalOpen, setInternalOpen] = useState(false);

  // Create container for portal
  useEffect(() => {
    const portalContainer =
      document.getElementById('popover-portal') ??
      (() => {
        const container = document.createElement('div');
        container.id = 'popover-portal';
        document.body.appendChild(container);
        return container;
      })();

    setIsRendered(true);

    return () => {
      if (portalContainer.childNodes.length === 0) {
        document.body.removeChild(portalContainer);
      }
    };
  }, []);

  // Handle animation timing
  useEffect(() => {
    if (isOpen) {
      setInternalOpen(true);

      // Trigger unknownnown open callback
      const timeout = setTimeout(() => {
        onOpen?.();
      }, animationDuration);

      return () => clearTimeout(timeout);
    } else if (internalOpen) {
      // Animate out
      const timeout = setTimeout(() => {
        setInternalOpen(false);
      }, animationDuration);

      return () => clearTimeout(timeout);
    }
  }, [isOpen, animationDuration, onOpen, internalOpen]);

  // Calculate popover and arrow positions when trigger changes or when open
  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !popoverRef.current || !isOpen) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();

    // Viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Determine initial placement
    let actualPlacement = placement;

    // Handle automatic flipping if placement would cause clipping
    if (flip) {
      // Horizontal flip logic
      if (placement.startsWith('left') && triggerRect.left - popoverRect.width - offset < 0) {
        actualPlacement = placement.replace('left', 'right') as PopoverPlacement;
      } else if (
        placement.startsWith('right') &&
        triggerRect.right + popoverRect.width + offset > viewportWidth
      ) {
        actualPlacement = placement.replace('right', 'left') as PopoverPlacement;
      }

      // Vertical flip logic
      if (placement.startsWith('top') && triggerRect.top - popoverRect.height - offset < 0) {
        actualPlacement = placement.replace('top', 'bottom') as PopoverPlacement;
      } else if (
        placement.startsWith('bottom') &&
        triggerRect.bottom + popoverRect.height + offset > viewportHeight
      ) {
        actualPlacement = placement.replace('bottom', 'top') as PopoverPlacement;
      }
    }

    // Calculate popover position
    let top = 0;
    let left = 0;
    let transformOrigin = '';

    // Calculate arrow position
    const arrowPos: { top?: number; left?: number; bottom?: number; right?: number } = {};

    // Set position based on placement
    switch (actualPlacement) {
      case 'top':
        top = triggerRect.top - popoverRect.height - offset;
        left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
        transformOrigin = 'center bottom';
        arrowPos.bottom = -8;
        arrowPos.left = 50;
        break;

      case 'top-start':
        top = triggerRect.top - popoverRect.height - offset;
        left = triggerRect.left;
        transformOrigin = 'left bottom';
        arrowPos.bottom = -8;
        arrowPos.left = triggerRect.width / 4;
        break;

      case 'top-end':
        top = triggerRect.top - popoverRect.height - offset;
        left = triggerRect.right - popoverRect.width;
        transformOrigin = 'right bottom';
        arrowPos.bottom = -8;
        arrowPos.right = triggerRect.width / 4;
        break;

      case 'bottom':
        top = triggerRect.bottom + offset;
        left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
        transformOrigin = 'center top';
        arrowPos.top = -8;
        arrowPos.left = 50;
        break;

      case 'bottom-start':
        top = triggerRect.bottom + offset;
        left = triggerRect.left;
        transformOrigin = 'left top';
        arrowPos.top = -8;
        arrowPos.left = triggerRect.width / 4;
        break;

      case 'bottom-end':
        top = triggerRect.bottom + offset;
        left = triggerRect.right - popoverRect.width;
        transformOrigin = 'right top';
        arrowPos.top = -8;
        arrowPos.right = triggerRect.width / 4;
        break;

      case 'left':
        top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
        left = triggerRect.left - popoverRect.width - offset;
        transformOrigin = 'right center';
        arrowPos.right = -8;
        arrowPos.top = 50;
        break;

      case 'left-start':
        top = triggerRect.top;
        left = triggerRect.left - popoverRect.width - offset;
        transformOrigin = 'right top';
        arrowPos.right = -8;
        arrowPos.top = triggerRect.height / 4;
        break;

      case 'left-end':
        top = triggerRect.bottom - popoverRect.height;
        left = triggerRect.left - popoverRect.width - offset;
        transformOrigin = 'right bottom';
        arrowPos.right = -8;
        arrowPos.bottom = triggerRect.height / 4;
        break;

      case 'right':
        top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
        left = triggerRect.right + offset;
        transformOrigin = 'left center';
        arrowPos.left = -8;
        arrowPos.top = 50;
        break;

      case 'right-start':
        top = triggerRect.top;
        left = triggerRect.right + offset;
        transformOrigin = 'left top';
        arrowPos.left = -8;
        arrowPos.top = triggerRect.height / 4;
        break;

      case 'right-end':
        top = triggerRect.bottom - popoverRect.height;
        left = triggerRect.right + offset;
        transformOrigin = 'left bottom';
        arrowPos.left = -8;
        arrowPos.bottom = triggerRect.height / 4;
        break;

      default:
        top = triggerRect.bottom + offset;
        left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
        transformOrigin = 'center top';
        arrowPos.top = -8;
        arrowPos.left = 50;
    }

    // Boundary checks
    // Ensure popover doesn't go outside viewport
    if (left < 10) {
      left = 10;
    } else if (left + popoverRect.width > viewportWidth - 10) {
      left = viewportWidth - popoverRect.width - 10;
    }

    if (top < 10) {
      top = 10;
    } else if (top + popoverRect.height > viewportHeight - 10) {
      top = viewportHeight - popoverRect.height - 10;
    }

    // Set positions
    setPosition({ top, left, transformOrigin });
    setArrowPosition(arrowPos);
  }, [isOpen, placement, offset, flip]);

  // Update position when dependencies change
  useEffect(() => {
    if (!isOpen) return;

    // Update position when mounted and when window resizes
    updatePosition();

    const handleResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [isOpen, updatePosition]);

  // Handle click outside to close popover
  useEffect(() => {
    if (!isOpen || !closeOnOutsideClick) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, closeOnOutsideClick]);

  // Handle escape key to close popover
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, closeOnEsc]);

  // Handle popover content click
  const handleContentClick = useCallback(() => {
    if (closeOnContentClick) {
      onClose();
    }
  }, [closeOnContentClick, onClose]);

  // Don't render popover if it's not open and not in the process of closing
  if (!isOpen && !internalOpen) return <div ref={triggerRef}>{children}</div>;

  // Render the trigger and portal the popover
  return (
    <>
      <div ref={triggerRef}>{children}</div>

      {isRendered &&
        createPortal(
          <div
            ref={popoverRef}
            className={`popover ${className}`}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              zIndex: zIndex ?? 1200,
              backgroundColor: 'var(--color-background-surface, #fff)',
              border: '1px solid var(--color-border, #e2e8f0)',
              borderRadius: 'var(--border-radius-medium, 4px)',
              boxShadow: 'var(--shadow-medium, 0 4px 6px -1px rgba(0, 0, 0, 0.1))',
              padding: 'var(--spacing-3, 12px)',
              opacity: isOpen ? 1 : 0,
              transformOrigin: position.transformOrigin,
              transform: isOpen ? 'scale(1)' : 'scale(0.9)',
              transition: `opacity ${animationDuration}ms ease, transform ${animationDuration}ms ease`,
              minWidth: minWidth,
              maxWidth: maxWidth,
              overflow: 'auto',
            }}
            onClick={handleContentClick}
            data-testid="popover"
          >
            {/* Arrow */}
            {shocombatrow && (
              <div
                ref={arrowRef}
                className="popover-arrow"
                style={{
                  position: 'absolute',
                  width: 0,
                  height: 0,
                  borderStyle: 'solid',
                  borderWidth: '8px',
                  borderColor: 'transparent',
                  ...(arrowPosition.top !== undefined && {
                    top: arrowPosition.top,
                    borderBottomColor: 'var(--color-background-surface, #fff)',
                    borderTopWidth: 0,
                    marginLeft: -8,
                  }),
                  ...(arrowPosition.bottom !== undefined && {
                    bottom: arrowPosition.bottom,
                    borderTopColor: 'var(--color-background-surface, #fff)',
                    borderBottomWidth: 0,
                    marginLeft: -8,
                  }),
                  ...(arrowPosition.left !== undefined && {
                    left: arrowPosition.left,
                    ...(arrowPosition.top === -8 && {
                      borderBottomColor: 'var(--color-background-surface, #fff)',
                      borderTopWidth: 0,
                    }),
                    ...(arrowPosition.bottom === -8 && {
                      borderTopColor: 'var(--color-background-surface, #fff)',
                      borderBottomWidth: 0,
                    }),
                    ...(typeof arrowPosition.left === 'string' && { marginLeft: -8 }),
                  }),
                  ...(arrowPosition.right !== undefined && {
                    right: arrowPosition.right,
                    ...(arrowPosition.top === -8 && {
                      borderBottomColor: 'var(--color-background-surface, #fff)',
                      borderTopWidth: 0,
                    }),
                    ...(arrowPosition.bottom === -8 && {
                      borderTopColor: 'var(--color-background-surface, #fff)',
                      borderBottomWidth: 0,
                    }),
                  }),
                }}
                data-testid="popover-arrow"
              />
            )}

            {/* Content */}
            <div className="popover-content">{content}</div>
          </div>,
          document.getElementById('popover-portal') ?? document.body
        )}
    </>
  );
}

export default Popover;
