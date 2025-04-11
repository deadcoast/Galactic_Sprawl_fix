import { forwardRef } from 'react';
import { cn } from '../../../../utils/cn'; // Adjust path as needed
import { Card, CardProps } from '../Card'; // Adjust path as needed

/**
 * Props for the CustomVariantCard
 * Extends base CardProps, allowing for variant-specific props if needed.
 */
export interface CustomVariantCardProps extends CardProps {
  // Add any variant-specific props here
  // Example: customIcon?: React.ReactNode;
}

/**
 * CustomVariantCard Component
 *
 * A custom variant of the base Card component.
 * Define specific styles, layout, or default props for this variant.
 */
export const CustomVariantCard = forwardRef<HTMLDivElement, CustomVariantCardProps>(
  (
    {
      className,
      children,
      // Destructure any variant-specific props here
      // customIcon,
      // Override or set default props for this variant
      variant = 'flat', // Example: Default to flat variant
      hoverable = true, // Example: Make this variant hoverable by default
      ...props // Pass remaining CardProps to the base Card
    },
    ref
  ) => {
    // Add variant-specific classes or styles
    const variantClassName = cn(
      'border-blue-500', // Example: Add a blue border
      'bg-blue-50', // Example: Light blue background
      className // Merge with incoming className
    );

    return (
      <Card
        ref={ref}
        className={variantClassName}
        variant={variant} // Pass down the potentially overridden variant
        hoverable={hoverable} // Pass down the potentially overridden hoverable state
        {...props} // Pass down all other base card props
      >
        {/* You can structure content specifically for this variant */}
        {/* Example: {customIcon && <div className="icon-container">{customIcon}</div>} */}
        {children}
      </Card>
    );
  }
);

CustomVariantCard.displayName = 'CustomVariantCard';

export default CustomVariantCard;
