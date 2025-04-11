/**
 * @context: ui-system, component-library
 *
 * Button component that provides consistent styling and behavior across the application
 */
import * as React from 'react';
import { forwardRef, memo, useCallback, useMemo } from 'react';
import {
  BaseComponentProps,
  ComponentSize,
  ComponentVariant,
  isComponentSize,
  isComponentVariant,
} from '../../types/ui/ComponentTypes';

/**
 * Button component props
 */
export interface ButtonProps extends BaseComponentProps {
  /**
   * Button variant determines the visual style
   * @default 'primary'
   */
  variant?: ComponentVariant;

  /**
   * Button size
   * @default 'medium'
   */
  size?: ComponentSize;

  /**
   * Button content
   */
  children: React.ReactNode;

  /**
   * Called when the button is clicked
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;

  /**
   * Whether the button should take the full width of its container
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Icon to display before the button content
   */
  leadingIcon?: React.ReactNode;

  /**
   * Icon to display after the button content
   */
  trailingIcon?: React.ReactNode;

  /**
   * HTML button type attribute
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset';

  /**
   * Whether the button should have a loading state
   * @default false
   */
  loading?: boolean;
}

/**
 * Button component
 *
 * Basic button with consistent styling, available in different variants and sizes
 */
const ButtonComponent = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = ComponentVariant.PRIMARY,
      size = ComponentSize.MEDIUM,
      children,
      onClick,
      disabled = false,
      id,
      className = '',
      style,
      fullWidth = false,
      leadingIcon,
      trailingIcon,
      type = 'button',
      loading = false,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
      'data-testid': dataTestId,
    },
    ref
  ) => {
    // Validate variant and size for type safety
    const safeVariant = isComponentVariant(variant) ? variant : ComponentVariant.PRIMARY;
    const safeSize = isComponentSize(size) ? size : ComponentSize.MEDIUM;

    // Compute button classes based on props
    const buttonClasses = useMemo(() => {
      return [
        'gs-button',
        `gs-button--${safeVariant}`,
        `gs-button--${safeSize}`,
        disabled ? 'gs-button--disabled' : '',
        fullWidth ? 'gs-button--full-width' : '',
        loading ? 'gs-button--loading' : '',
        leadingIcon ? 'gs-button--with-leading-icon' : '',
        trailingIcon ? 'gs-button--with-trailing-icon' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ');
    }, [safeVariant, safeSize, disabled, fullWidth, loading, leadingIcon, trailingIcon, className]);

    // Handle click with error boundary
    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled || loading) {
          return;
        }

        try {
          onClick?.(event);
        } catch (error) {
          console.error('[Button] Error in onClick handler:', error);
        }
      },
      [onClick, disabled, loading]
    );

    return (
      <button
        ref={ref}
        id={id}
        className={buttonClasses}
        onClick={handleClick}
        disabled={disabled || loading}
        type={type}
        style={style}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        data-testid={dataTestId}
      >
        {loading && (
          <span className="gs-button__loading-indicator" aria-hidden="true">
            {/* Loading spinner can be added here */}
          </span>
        )}

        {leadingIcon && <span className="gs-button__leading-icon">{leadingIcon}</span>}

        <span className="gs-button__content">{children}</span>

        {trailingIcon && <span className="gs-button__trailing-icon">{trailingIcon}</span>}
      </button>
    );
  }
);

ButtonComponent.displayName = 'Button';

/**
 * Memoized Button component to prevent unnecessary re-renders
 */
export const Button = memo(ButtonComponent);

export default Button;
