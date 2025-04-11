import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';

/**
 * Card variants
 */
export type CardVariant = 'default' | 'bordered' | 'elevated' | 'flat';

/**
 * Card props
 */
export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Card variant */
  variant?: CardVariant;
  /** Whether the card should have hover effects */
  hoverable?: boolean;
  /** Whether the card is selectable */
  selectable?: boolean;
  /** Whether the card is selected */
  selected?: boolean;
  /** Whether the card is disabled */
  disabled?: boolean;
  /** The card's header content */
  header?: ReactNode;
  /** The card's footer content */
  footer?: ReactNode;
  /** The card's title */
  title?: ReactNode;
  /** The card's subtitle */
  subtitle?: ReactNode;
  /** The card's main content */
  children?: ReactNode;
  /** The card's background color */
  background?: string;
  /** Whether the card has compact padding */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Card component
 *
 * A versatile card component for displaying related content in a container.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      hoverable = false,
      selectable = false,
      selected = false,
      disabled = false,
      header,
      footer,
      title,
      subtitle,
      children,
      background,
      compact = false,
      className,
      ...props
    },
    ref
  ) => {
    // Card variant styles
    const variantClasses: Record<CardVariant, string> = {
      default: 'bg-white border border-gray-200',
      bordered: 'bg-white border-2 border-gray-300',
      elevated: 'bg-white border border-gray-200 shadow-md',
      flat: 'bg-gray-50',
    };

    // Background override
    const backgroundStyle = background ? { backgroundColor: background } : {};

    // Common base styles
    const cardClasses = cn(
      // Base styles
      'rounded-lg overflow-hidden transition-all duration-200',
      // Variant styles
      variantClasses[variant],
      // Interactive states
      hoverable && 'hover:shadow-lg hover:-translate-y-1',
      selectable && 'cursor-pointer',
      selected && 'ring-2 ring-blue-500',
      disabled && 'opacity-60 pointer-events-none',
      // Additional class names
      className
    );

    // Padding styles based on the compact prop
    const contentPadding = compact ? 'p-3' : 'p-5';
    const headerFooterPadding = compact ? 'px-3 py-2' : 'px-5 py-3';

    // Render the title section if title or subtitle is provided
    const renderTitle = () => {
      if (!title && !subtitle) return null;

      return (
        <div className={`${contentPadding} border-b border-gray-200`}>
          {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
      );
    };

    return (
      <div ref={ref} className={cardClasses} style={backgroundStyle} {...props}>
        {/* Card header */}
        {header && (
          <div className={`${headerFooterPadding} border-b border-gray-200 bg-gray-50`}>
            {header}
          </div>
        )}

        {/* Title section */}
        {renderTitle()}

        {/* Main content - Explicitly handle null/undefined case */}
        <div className={contentPadding}>{children ?? null}</div>

        {/* Card footer */}
        {footer && (
          <div className={`${headerFooterPadding} border-t border-gray-200 bg-gray-50`}>
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
