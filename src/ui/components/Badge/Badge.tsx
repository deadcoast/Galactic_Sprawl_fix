import React, { forwardRef, HTMLAttributes } from 'react';
import { cn } from '../../../utils/cn';

/**
 * Badge variants
 */
export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';

/**
 * Badge sizes
 */
export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Badge props
 */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Badge variant */
  variant?: BadgeVariant;
  /** Badge size */
  size?: BadgeSize;
  /** Whether the badge has a border */
  bordered?: boolean;
  /** Whether the badge is rounded */
  rounded?: boolean;
  /** Whether the badge has a dot indicator */
  withDot?: boolean;
  /** Dot color (only when withDot is true) */
  dotColor?: string;
  /** Whether the badge is interactive (has hover state) */
  interactive?: boolean;
  /** Children to render */
  children?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * Badge component
 * 
 * A versatile badge component for displaying status, count or categories.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ 
    variant = 'default', 
    size = 'md', 
    bordered = false,
    rounded = true,
    withDot = false,
    dotColor,
    interactive = false,
    className,
    children,
    ...props 
  }, ref) => {
    // Variant classes
    const variantClasses: Record<BadgeVariant, string> = {
      default: 'bg-gray-100 text-gray-800',
      primary: 'bg-blue-100 text-blue-800',
      secondary: 'bg-purple-100 text-purple-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      danger: 'bg-red-100 text-red-800',
      info: 'bg-cyan-100 text-cyan-800',
      outline: 'bg-transparent border border-gray-300 text-gray-800',
    };

    // Size classes
    const sizeClasses: Record<BadgeSize, string> = {
      xs: 'text-xs px-1.5 py-0.5',
      sm: 'text-xs px-2 py-1',
      md: 'text-sm px-2.5 py-1',
      lg: 'text-base px-3 py-1.5',
    };

    // Border classes
    const borderClasses = bordered
      ? 'border border-current border-opacity-20'
      : '';

    // Rounded classes
    const roundedClasses = rounded
      ? 'rounded-full'
      : 'rounded';

    // Interactive classes
    const interactiveClasses = interactive
      ? 'cursor-pointer hover:bg-opacity-80'
      : '';

    // Combine all classes
    const badgeClasses = cn(
      // Base styles
      'inline-flex items-center font-medium',
      // Variant styles
      variantClasses[variant],
      // Size styles
      sizeClasses[size],
      // Border styles
      borderClasses,
      // Rounded styles
      roundedClasses,
      // Interactive styles
      interactiveClasses,
      // Additional class names
      className
    );

    return (
      <span ref={ref} className={badgeClasses} {...props}>
        {withDot && (
          <span 
            className={cn(
              "w-2 h-2 rounded-full mr-1.5",
              dotColor ? `bg-${dotColor}` : "bg-current"
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;