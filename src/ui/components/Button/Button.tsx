import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '../../../utils/cn';

/**
 * Button variants
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'danger'
  | 'success'
  | 'warning'
  | 'info'
  | 'ghost';

/**
 * Button sizes
 */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Button props
 */
export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'prefix'> {
  /** Button variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Whether the button is loading */
  loading?: boolean;
  /** Whether the button is full width */
  fullWidth?: boolean;
  /** Leading icon */
  leadingIcon?: ReactNode;
  /** Trailing icon */
  trailingIcon?: ReactNode;
  /** Whether the button has a border */
  bordered?: boolean;
  /** Custom focus ring color */
  focusRingColor?: string;
  /** Children */
  children?: ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * Base Button component
 *
 * Provides consistent styling, sizes, and variants for buttons throughout the application.
 * Can be extended with specialized buttons for specific use cases.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      leadingIcon,
      trailingIcon,
      bordered = false,
      focusRingColor,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Map variants to class names
    const variantClasses: Record<ButtonVariant, string> = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400',
      secondary:
        'bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400 disabled:bg-gray-100 disabled:text-gray-400',
      tertiary:
        'bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200 disabled:text-gray-300',
      danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-400',
      success:
        'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 disabled:bg-green-400',
      warning:
        'bg-yellow-600 text-white hover:bg-yellow-700 active:bg-yellow-800 disabled:bg-yellow-400',
      info: 'bg-cyan-600 text-white hover:bg-cyan-700 active:bg-cyan-800 disabled:bg-cyan-400',
      ghost:
        'bg-transparent hover:bg-gray-100 active:bg-gray-200 disabled:bg-transparent disabled:text-gray-300',
    };

    // Map sizes to class names
    const sizeClasses: Record<ButtonSize, string> = {
      xs: 'text-xs py-1 px-2 h-6',
      sm: 'text-sm py-1 px-3 h-8',
      md: 'text-base py-2 px-4 h-10',
      lg: 'text-lg py-2 px-5 h-12',
      xl: 'text-xl py-3 px-6 h-14',
    };

    // Build border class
    const borderClass = bordered
      ? variant === 'tertiary' || variant === 'ghost'
        ? 'border border-gray-300'
        : 'border border-transparent'
      : '';

    // Build focus ring class
    const focusRingClass = focusRingColor
      ? `focus:ring-2 focus:ring-${focusRingColor} focus:ring-opacity-50`
      : 'focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50';

    // Combine all classes
    const buttonClasses = cn(
      // Base styles
      'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none',
      // Variant styles
      variantClasses[variant],
      // Size styles
      sizeClasses[size],
      // Width styles
      fullWidth ? 'w-full' : '',
      // Border styles
      borderClass,
      // Focus ring styles
      focusRingClass,
      // Disabled styles
      disabled || loading ? 'cursor-not-allowed' : 'cursor-pointer',
      // Custom class names
      className
    );

    // Loading spinner component
    const LoadingSpinner = () => (
      <svg
        className="-ml-1 mr-2 h-4 w-4 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    );

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        type="button"
        {...props}
      >
        {loading && <LoadingSpinner />}
        {!loading && leadingIcon && <span className="mr-2">{leadingIcon}</span>}
        {children}
        {!loading && trailingIcon && <span className="ml-2">{trailingIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
