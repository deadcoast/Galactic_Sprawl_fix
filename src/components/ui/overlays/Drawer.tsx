/**
 * @context: ui-system, component-library, ui-library
 *
 * Drawer component for sliding side panels
 */
import { X } from 'lucide-react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  errorLoggingService,
  ErrorSeverity,
  ErrorType,
} from '../../../services/logging/ErrorLoggingService';
import { UIEventType } from '../../../types/ui/EventTypes';

export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom';

export interface DrawerProps {
  /**
   * Whether the drawer is visible
   */
  isOpen: boolean;

  /**
   * Handler called when the drawer should close
   */
  onClose: () => void;

  /**
   * Drawer content
   */
  children: React.ReactNode;

  /**
   * Drawer placement
   * @default 'right'
   */
  placement?: DrawerPlacement;

  /**
   * Drawer title displayed in the header
   */
  title?: string;

  /**
   * Drawer width when placement is 'left' or 'right'
   * @default '320px'
   */
  width?: string | number;

  /**
   * Drawer height when placement is 'top' or 'bottom'
   * @default '320px'
   */
  height?: string | number;

  /**
   * Whether the drawer can be closed by pressing Escape key
   * @default true
   */
  closeOnEsc?: boolean;

  /**
   * Whether the drawer can be closed by clicking the overlay
   * @default true
   */
  closeOnOverlayClick?: boolean;

  /**
   * Additional CSS class for the drawer
   */
  className?: string;

  /**
   * Whether to show the close button in the header
   * @default true
   */
  showCloseButton?: boolean;

  /**
   * Animation duration in milliseconds
   * @default 300
   */
  animationDuration?: number;

  /**
   * Optional callback fired when the drawer finishes opening
   */
  onOpen?: () => void;

  /**
   * Optional footer content
   */
  footer?: React.ReactNode;

  /**
   * Drawer z-index to override the default
   */
  zIndex?: number;

  /**
   * Whether to push the page content when drawer opens
   * @default false
   */
  pushContent?: boolean;
}

/**
 * Drawer component for sliding side panels
 */
export function Drawer({
  isOpen,
  onClose,
  children,
  placement = 'right',
  title,
  width = '320px',
  height = '320px',
  closeOnEsc = true,
  closeOnOverlayClick = true,
  className = '',
  showCloseButton = true,
  animationDuration = 300,
  onOpen,
  footer,
  zIndex,
  pushContent = false,
}: DrawerProps) {
  // Track internal open state for animations
  const [isVisible, setIsVisible] = useState(false);

  // Ref for drawer content for focus management
  const drawerRef = useRef<HTMLDivElement>(null);

  // Ref to restore focus when drawer closes
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Create container for portal if it doesn't exist
  useEffect(() => {
    let portalContainer = document.getElementById('drawer-portal');

    if (!portalContainer) {
      portalContainer = document.createElement('div');
      portalContainer.id = 'drawer-portal';
      document.body.appendChild(portalContainer);
    }

    return () => {
      if (portalContainer && portalContainer.childNodes.length === 0) {
        document.body.removeChild(portalContainer);
      }
    };
  }, []);

  // Handle opening and closing animations, focus management, and page content pushing
  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Set visible for animation
      setIsVisible(true);

      // Lock body scroll
      if (!pushContent) {
        document.body.style.overflow = 'hidden';
      }

      // Apply push content styles if enabled
      if (pushContent) {
        const mainContent = document.getElementById('main-content'); // Main content container
        if (mainContent) {
          const translateValue = getTranslateValue(placement, width, height);
          mainContent.style.transition = `transform ${animationDuration}ms ease`;
          mainContent.style.transform = translateValue;
        }
      }

      // Focus drawer after animation
      const timeout = setTimeout(() => {
        if (drawerRef.current) {
          drawerRef.current.focus();
        }
        onOpen?.();
      }, animationDuration);

      // Emit drawer opened event
      try {
        const event = new CustomEvent(UIEventType.MODAL_OPENED, {
          detail: { modalId: title ?? 'drawer', modalType: 'drawer' },
        });
        document.dispatchEvent(event);
      } catch (error) {
        errorLoggingService.logError(
          error instanceof Error ? error : new Error(String(error)),
          ErrorType.EVENT_HANDLING,
          ErrorSeverity.LOW,
          {
            componentName: 'Drawer',
            action: 'dispatchDrawerOpenedEvent',
            eventType: UIEventType.MODAL_OPENED,
            drawerId: title ?? 'drawer',
          }
        );
      }

      return () => clearTimeout(timeout);
    } else {
      // Handle closing animation
      if (isVisible) {
        // Reset pushed content
        if (pushContent) {
          const mainContent = document.getElementById('main-content');
          if (mainContent) {
            mainContent.style.transform = '';
          }
        }

        const timeout = setTimeout(() => {
          setIsVisible(false);

          // Restore body scroll
          document.body.style.overflow = '';

          // Restore focus
          if (previousFocusRef.current) {
            previousFocusRef.current.focus();
          }

          // Emit drawer closed event
          try {
            const event = new CustomEvent(UIEventType.MODAL_CLOSED, {
              detail: { modalId: title ?? 'drawer', modalType: 'drawer' },
            });
            document.dispatchEvent(event);
          } catch (error) {
            errorLoggingService.logError(
              error instanceof Error ? error : new Error(String(error)),
              ErrorType.EVENT_HANDLING,
              ErrorSeverity.LOW,
              {
                componentName: 'Drawer',
                action: 'dispatchDrawerClosedEvent',
                eventType: UIEventType.MODAL_CLOSED,
                drawerId: title ?? 'drawer',
              }
            );
          }
        }, animationDuration);

        return () => clearTimeout(timeout);
      }

      // Reset body overflow if not visible
      document.body.style.overflow = '';
    }
  }, [isOpen, isVisible, title, onOpen, animationDuration, placement, width, height, pushContent]);

  // Handle ESC key for closing
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

  // Handle click on overlay
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on the overlay, not its children
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  // Don't render unknownnownthing if not open or visible
  if (!isOpen && !isVisible) {
    return null;
  }

  // Calculate drawer position styles based on placement
  const getDrawerPositionStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      backgroundColor: 'var(--color-background-surface, #fff)',
      boxShadow: 'var(--shadow-large, 0 10px 15px -3px rgba(0, 0, 0, 0.1))',
      display: 'flex',
      flexDirection: 'column',
      transition: `transform ${animationDuration}ms ease`,
      overflow: 'hidden',
    };

    // Set dimensions and position based on placement
    if (placement === 'left') {
      return {
        ...baseStyles,
        top: 0,
        left: 0,
        height: '100%',
        width: typeof width === 'number' ? `${width}px` : width,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
      };
    }

    if (placement === 'right') {
      return {
        ...baseStyles,
        top: 0,
        right: 0,
        height: '100%',
        width: typeof width === 'number' ? `${width}px` : width,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      };
    }

    if (placement === 'top') {
      return {
        ...baseStyles,
        top: 0,
        left: 0,
        width: '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        transform: isOpen ? 'translateY(0)' : 'translateY(-100%)',
      };
    }

    // Bottom placement
    return {
      ...baseStyles,
      bottom: 0,
      left: 0,
      width: '100%',
      height: typeof height === 'number' ? `${height}px` : height,
      transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
    };
  };

  // Helper to calculate translate value for push content
  const getTranslateValue = (
    placement: DrawerPlacement,
    drawerWidth: string | number,
    drawerHeight: string | number
  ): string => {
    const widthValue = typeof drawerWidth === 'number' ? `${drawerWidth}px` : drawerWidth;
    const heightValue = typeof drawerHeight === 'number' ? `${drawerHeight}px` : drawerHeight;

    switch (placement) {
      case 'left':
        return `translateX(${widthValue})`;
      case 'right':
        return `translateX(-${widthValue})`;
      case 'top':
        return `translateY(${heightValue})`;
      case 'bottom':
        return `translateY(-${heightValue})`;
      default:
        return '';
    }
  };

  // Calculate overlay styles
  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    opacity: isOpen ? 1 : 0,
    transition: `opacity ${animationDuration}ms ease`,
    zIndex: zIndex ?? 1300,
    pointerEvents: isOpen ? 'auto' : 'none',
  };

  // Portal the drawer to the end of the document body
  return createPortal(
    <>
      {/* Backdrop overlay, only if not pushing content */}
      {!pushContent && (
        <div
          className="drawer-overlay"
          style={overlayStyles}
          onClick={handleOverlayClick}
          data-testid="drawer-overlay"
        />
      )}

      {/* Drawer content */}
      <div
        ref={drawerRef}
        className={`drawer drawer-${placement} ${className}`}
        style={{
          ...getDrawerPositionStyles(),
          zIndex: zIndex ?? 1300,
        }}
        tabIndex={-1}
        aria-modal="true"
        role="dialog"
        aria-labelledby={title ? 'drawer-title' : undefined}
        data-testid="drawer-content"
      >
        {/* Drawer Header */}
        {(title ?? showCloseButton) && (
          <div
            className="drawer-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--spacing-4, 16px)',
              borderBottom: '1px solid var(--color-border, #e2e8f0)',
            }}
          >
            {title && (
              <h2
                id="drawer-title"
                className="drawer-title"
                style={{
                  margin: 0,
                  fontSize: 'var(--font-size-lg, 18px)',
                  fontWeight: 'var(--font-weight-bold, 600)',
                  color: 'var(--color-text-primary, #2d3748)',
                }}
              >
                {title}
              </h2>
            )}

            {showCloseButton && (
              <button
                type="button"
                className="drawer-close-button"
                onClick={onClose}
                aria-label="Close drawer"
                style={{
                  appearance: 'none',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                  borderRadius: 'var(--border-radius-small, 4px)',
                  color: 'var(--color-text-secondary, #718096)',
                }}
                data-testid="drawer-close-button"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Drawer Body */}
        <div
          className="drawer-body"
          style={{
            padding: 'var(--spacing-4, 16px)',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {children}
        </div>

        {/* Drawer Footer */}
        {footer && (
          <div
            className="drawer-footer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              padding: 'var(--spacing-4, 16px)',
              borderTop: '1px solid var(--color-border, #e2e8f0)',
              gap: 'var(--spacing-2, 8px)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </>,
    document.getElementById('drawer-portal') ?? document.body
  );
}

export default Drawer;
