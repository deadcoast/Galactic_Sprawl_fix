/**
 * @context: ui-system, component-library, ui-library
 * 
 * Modal component for displaying content over the current view
 */
import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { UIEventType } from '../../../types/ui/EventTypes';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  /**
   * Whether the modal is visible
   */
  isOpen: boolean;
  
  /**
   * Handler called when the modal should close
   */
  onClose: () => void;
  
  /**
   * Modal title displayed in the header
   */
  title?: string;
  
  /**
   * Modal content
   */
  children: React.ReactNode;
  
  /**
   * Size of the modal
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  
  /**
   * Whether the modal can be closed by pressing Escape key
   * @default true
   */
  closeOnEsc?: boolean;
  
  /**
   * Whether the modal can be closed by clicking the overlay
   * @default true
   */
  closeOnOverlayClick?: boolean;
  
  /**
   * Optional footer content
   */
  footer?: React.ReactNode;
  
  /**
   * Additional CSS class for the modal
   */
  className?: string;
  
  /**
   * Whether to show the close button in the header
   * @default true
   */
  showCloseButton?: boolean;
  
  /**
   * Modal z-index to override the default
   */
  zIndex?: number;
  
  /**
   * Optional callback fired when the modal finishes opening
   */
  onOpen?: () => void;
  
  /**
   * Whether the modal should be centered vertically
   * @default true
   */
  centered?: boolean;
  
  /**
   * Animation duration in milliseconds
   * @default 300
   */
  animationDuration?: number;
}

/**
 * Modal component for displaying content over the current view
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  closeOnEsc = true,
  closeOnOverlayClick = true,
  footer,
  className = '',
  showCloseButton = true,
  zIndex,
  onOpen,
  centered = true,
  animationDuration = 300,
}: ModalProps) {
  // Track internal open state for animations
  const [isVisible, setIsVisible] = useState(false);
  
  // Ref for modal content for focus management
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Ref to restore focus when modal closes
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  // Create container for portal if it doesn't exist
  useEffect(() => {
    let portalContainer = document.getElementById('modal-portal');
    
    if (!portalContainer) {
      portalContainer = document.createElement('div');
      portalContainer.id = 'modal-portal';
      document.body.appendChild(portalContainer);
    }
    
    return () => {
      if (portalContainer && portalContainer.childNodes.length === 0) {
        document.body.removeChild(portalContainer);
      }
    };
  }, []);
  
  // Handle opening and closing animations
  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Set visible for animation
      setIsVisible(true);
      
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      
      // Focus modal after animation
      const timeout = setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
        onOpen?.();
      }, animationDuration);
      
      // Emit modal opened event
      try {
        const event = new CustomEvent(UIEventType.MODAL_OPENED, {
          detail: { modalId: title || 'modal' }
        });
        document.dispatchEvent(event);
      } catch (error) {
        console.error('[Modal] Error dispatching modal opened event:', error);
      }
      
      return () => clearTimeout(timeout);
    } else {
      // Handle closing animation
      if (isVisible) {
        const timeout = setTimeout(() => {
          setIsVisible(false);
          
          // Restore body scroll
          document.body.style.overflow = '';
          
          // Restore focus
          if (previousFocusRef.current) {
            previousFocusRef.current.focus();
          }
          
          // Emit modal closed event
          try {
            const event = new CustomEvent(UIEventType.MODAL_CLOSED, {
              detail: { modalId: title || 'modal' }
            });
            document.dispatchEvent(event);
          } catch (error) {
            console.error('[Modal] Error dispatching modal closed event:', error);
          }
        }, animationDuration);
        
        return () => clearTimeout(timeout);
      }
      
      // Reset body overflow if not visible
      document.body.style.overflow = '';
    }
  }, [isOpen, isVisible, title, onOpen, animationDuration]);
  
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
  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      // Only close if clicking directly on the overlay, not its children
      if (closeOnOverlayClick && event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose, closeOnOverlayClick]
  );
  
  // Determine size class
  const sizeClass = {
    small: 'modal-content-small',
    medium: 'modal-content-medium',
    large: 'modal-content-large',
    fullscreen: 'modal-content-fullscreen',
  }[size];
  
  // Don't render anything if not open or visible
  if (!isOpen && !isVisible) {
    return null;
  }
  
  // Calculate animation classes
  const overlayClass = isOpen 
    ? 'modal-overlay modal-overlay-visible' 
    : 'modal-overlay';
  
  const contentClass = isOpen 
    ? `modal-content ${sizeClass} modal-content-visible ${className}` 
    : `modal-content ${sizeClass} ${className}`;
  
  // Portal the modal to the end of the document body
  return createPortal(
    <div 
      className={overlayClass}
      onClick={handleOverlayClick}
      style={{ 
        zIndex: zIndex || 1400,
        transition: `opacity ${animationDuration}ms ease`,
        display: 'flex',
        alignItems: centered ? 'center' : 'flex-start',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: centered ? 0 : '80px 0 0 0'
      }}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? 'modal-title' : undefined}
      data-testid="modal-overlay"
    >
      <div
        ref={modalRef}
        className={contentClass}
        style={{ 
          transition: `transform ${animationDuration}ms ease, opacity ${animationDuration}ms ease`,
          backgroundColor: 'var(--color-background-surface, #fff)',
          borderRadius: 'var(--border-radius-medium, 8px)',
          boxShadow: 'var(--shadow-large, 0 10px 15px -3px rgba(0, 0, 0, 0.1))',
          maxWidth: size === 'fullscreen' ? '100%' : undefined,
          width: size === 'fullscreen' ? '100%' : undefined,
          height: size === 'fullscreen' ? '100%' : undefined,
          margin: size === 'fullscreen' ? 0 : undefined,
          maxHeight: size === 'fullscreen' ? '100%' : '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        tabIndex={-1}
        data-testid="modal-content"
      >
        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div 
            className="modal-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--spacing-4, 16px)',
              borderBottom: '1px solid var(--color-border, #e2e8f0)'
            }}
          >
            {title && (
              <h2 
                id="modal-title" 
                className="modal-title"
                style={{
                  margin: 0,
                  fontSize: 'var(--font-size-lg, 18px)',
                  fontWeight: 'var(--font-weight-bold, 600)',
                  color: 'var(--color-text-primary, #2d3748)'
                }}
              >
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <button
                type="button"
                className="modal-close-button"
                onClick={onClose}
                aria-label="Close modal"
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
                  color: 'var(--color-text-secondary, #718096)'
                }}
                data-testid="modal-close-button"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        
        {/* Modal Body */}
        <div 
          className="modal-body"
          style={{
            padding: 'var(--spacing-4, 16px)',
            overflowY: 'auto',
            flex: 1
          }}
        >
          {children}
        </div>
        
        {/* Modal Footer */}
        {footer && (
          <div 
            className="modal-footer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              padding: 'var(--spacing-4, 16px)',
              borderTop: '1px solid var(--color-border, #e2e8f0)',
              gap: 'var(--spacing-2, 8px)'
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.getElementById('modal-portal') || document.body
  );
}

export default Modal; 