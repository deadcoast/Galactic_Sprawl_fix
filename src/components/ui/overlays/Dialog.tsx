/**
 * @context: ui-system, component-library, ui-library
 *
 * Dialog component for user decision interactions
 */
import * as React from 'react';
import Modal, { ModalProps } from './Modal';

// Exclude props that will be handled differently in Dialog
type OmittedModalProps = 'footer' | 'children' | 'onClose';

export interface DialogAction {
  /**
   * Label for the action button
   */
  label: string;

  /**
   * Handler called when the action is selected
   */
  onClick: () => void;

  /**
   * Visual style of the action
   * @default 'default'
   */
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'default';

  /**
   * Whether this action should be auto-focused
   * @default false
   */
  autoFocus?: boolean;

  /**
   * Additional class name for the action button
   */
  className?: string;

  /**
   * Whether this action should close the dialog
   * @default true
   */
  closeOnClick?: boolean;

  /**
   * Whether the action is disabled
   * @default false
   */
  disabled?: boolean;
}

export interface DialogProps extends Omit<ModalProps, OmittedModalProps> {
  /**
   * Dialog title
   */
  title: string;

  /**
   * Main message or content for the dialog
   */
  message: React.ReactNode;

  /**
   * Optional additional content beneath the main message
   */
  description?: React.ReactNode;

  /**
   * Array of action buttons to display in footer
   */
  actions: DialogAction[];

  /**
   * Handler called when the dialog is closed
   */
  onClose: () => void;

  /**
   * Whether the dialog is for confirming a destructive action
   * @default false
   */
  isDestructive?: boolean;

  /**
   * Dialog type determining its icon and styling
   * @default 'default'
   */
  type?: 'info' | 'warning' | 'error' | 'success' | 'default' | 'confirm' | 'delete';

  /**
   * Optional icon to display
   */
  icon?: React.ReactNode;

  /**
   * Custom class for the content area
   */
  contentClassName?: string;
}

/**
 * Dialog component that builds on Modal for user decision interactions
 */
export function Dialog({
  title,
  message,
  description,
  actions,
  onClose,
  isDestructive = false,
  type = 'default',
  icon,
  contentClassName = '',
  ...modalProps
}: DialogProps) {
  // Generate dialog footer with action buttons
  const dialogFooter = (
    <>
      {actions.map((action, index) => {
        // Determine button style based on variant and dialog type
        let buttonStyle: React.CSSProperties = {
          padding: '8px 16px',
          borderRadius: 'var(--border-radius-small, 4px)',
          fontWeight: 'var(--font-weight-medium, 500)',
          fontSize: 'var(--font-size-sm, 14px)',
          cursor: action.disabled ? 'not-allowed' : 'pointer',
          opacity: action.disabled ? 0.5 : 1,
          transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
          outline: 'none',
          border: '1px solid transparent',
        };

        // Apply variant-specific styles
        switch (action.variant) {
          case 'primary':
            buttonStyle = {
              ...buttonStyle,
              backgroundColor: 'var(--color-primary-main, #4a90e2)',
              color: 'var(--color-primary-contrast-text, #ffffff)',
              border: '1px solid var(--color-primary-main, #4a90e2)',
            };
            break;
          case 'secondary':
            buttonStyle = {
              ...buttonStyle,
              backgroundColor: 'transparent',
              color: 'var(--color-primary-main, #4a90e2)',
              border: '1px solid var(--color-primary-main, #4a90e2)',
            };
            break;
          case 'danger':
            buttonStyle = {
              ...buttonStyle,
              backgroundColor: 'var(--color-error-main, #f44336)',
              color: 'var(--color-error-contrast-text, #ffffff)',
              border: '1px solid var(--color-error-main, #f44336)',
            };
            break;
          case 'success':
            buttonStyle = {
              ...buttonStyle,
              backgroundColor: 'var(--color-success-main, #4caf50)',
              color: 'var(--color-success-contrast-text, #ffffff)',
              border: '1px solid var(--color-success-main, #4caf50)',
            };
            break;
          case 'warning':
            buttonStyle = {
              ...buttonStyle,
              backgroundColor: 'var(--color-warning-main, #ff9800)',
              color: 'var(--color-warning-contrast-text, #000000)',
              border: '1px solid var(--color-warning-main, #ff9800)',
            };
            break;
          default:
            buttonStyle = {
              ...buttonStyle,
              backgroundColor: 'transparent',
              color: 'var(--color-text-primary, #2d3748)',
              border: '1px solid var(--color-border, #e2e8f0)',
            };
        }

        // Apply special styling for destructive dialogs if needed
        if (isDestructive && action.variant === 'primary') {
          buttonStyle.backgroundColor = 'var(--color-error-main, #f44336)';
          buttonStyle.color = 'var(--color-error-contrast-text, #ffffff)';
          buttonStyle.border = '1px solid var(--color-error-main, #f44336)';
        }

        const handleClick = () => {
          action.onClick();

          if (action.closeOnClick !== false) {
            onClose();
          }
        };

        return (
          <button
            key={`dialog-action-${index}`}
            className={`dialog-action ${action.className || ''}`}
            onClick={handleClick}
            style={buttonStyle}
            disabled={action.disabled}
            autoFocus={action.autoFocus}
            data-testid={`dialog-action-${index}`}
            type="button"
          >
            {action.label}
          </button>
        );
      })}
    </>
  );

  // Determine icon based on dialog type
  let dialogIcon = icon;
  const dialogIconStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    marginBottom: '16px',
  };

  // Apply type-specific styles and icons if no custom icon provided
  if (!dialogIcon) {
    switch (type) {
      case 'info':
        dialogIconStyle.backgroundColor = 'var(--color-info-light, #e3f2fd)';
        dialogIconStyle.color = 'var(--color-info-main, #2196f3)';
        break;
      case 'warning':
        dialogIconStyle.backgroundColor = 'var(--color-warning-light, #fff3e0)';
        dialogIconStyle.color = 'var(--color-warning-main, #ff9800)';
        break;
      case 'error':
        dialogIconStyle.backgroundColor = 'var(--color-error-light, #ffebee)';
        dialogIconStyle.color = 'var(--color-error-main, #f44336)';
        break;
      case 'success':
        dialogIconStyle.backgroundColor = 'var(--color-success-light, #e8f5e9)';
        dialogIconStyle.color = 'var(--color-success-main, #4caf50)';
        break;
      case 'confirm':
        dialogIconStyle.backgroundColor = 'var(--color-primary-light, #e3f2fd)';
        dialogIconStyle.color = 'var(--color-primary-main, #4a90e2)';
        break;
      case 'delete':
        dialogIconStyle.backgroundColor = 'var(--color-error-light, #ffebee)';
        dialogIconStyle.color = 'var(--color-error-main, #f44336)';
        break;
      default:
        dialogIcon = null;
        break;
    }
  }

  return (
    <Modal title={title} onClose={onClose} footer={dialogFooter} size="small" {...modalProps}>
      <div
        className={`dialog-content ${contentClassName}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '16px 0',
        }}
      >
        {dialogIcon && <div style={dialogIconStyle}>{dialogIcon}</div>}

        <div
          className="dialog-message"
          style={{
            fontSize: 'var(--font-size-md, 16px)',
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'var(--color-text-primary, #2d3748)',
            marginBottom: description ? '8px' : '0',
          }}
        >
          {message}
        </div>

        {description && (
          <div
            className="dialog-description"
            style={{
              fontSize: 'var(--font-size-sm, 14px)',
              color: 'var(--color-text-secondary, #718096)',
              marginTop: '8px',
            }}
          >
            {description}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default Dialog;
