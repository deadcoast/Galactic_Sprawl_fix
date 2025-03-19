import * as React from 'react';
import { Card as NewCard } from '../../ui/components/Card';
import { cn } from '../../utils/cn';

/**
 * @deprecated Use the new Card component from ui/components/Card instead
 * This is an adapter component for backward compatibility.
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <NewCard
      ref={ref}
      variant="default"
      className={cn('bg-gray-800 text-white', className)}
      {...props}
    >
      {children}
    </NewCard>
  )
);
Card.displayName = 'Card';

/**
 * @deprecated Use the new Card component with header prop from ui/components/Card instead
 */
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

/**
 * @deprecated Use the new Card component with title prop from ui/components/Card instead
 */
const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

/**
 * @deprecated Use the new Card component with subtitle prop from ui/components/Card instead
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-gray-400', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

/**
 * @deprecated Content should be passed directly to the Card component from ui/components/Card
 */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

/**
 * @deprecated Use the new Card component with footer prop from ui/components/Card instead
 */
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

// Add deprecation notice to console in development
if (process.env.NODE_ENV === 'development') {
  console.warn(
    'The Card components from components/ui/Card are deprecated. ' +
      'Please use the new Card component from ui/components/Card instead.'
  );
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
