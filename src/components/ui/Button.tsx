import { cva, type VariantProps } from 'class-variance-authority';
import * as React from "react";
import { cn } from '../../utils/cn';

// Improved type for React elements with ref
type ElementWithRef = React.ReactElement & {
  ref?: React.Ref<unknown>;
};

// Add Slot component implementation with improved typing
const Slot = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ children, ...props }, ref) => {
    const child = React.Children.only(children) as ElementWithRef;
    return React.cloneElement(child, {
      ...props,
      ...child.props,
      ref: mergeRefs(ref, child.ref),
    });
  }
);
Slot.displayName = 'Slot';

// Helper function to merge refs
function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (value: T) => {
    refs.forEach(ref => {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T>).current = value;
      }
    });
  };
}

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 text-white hover:bg-blue-700 shadow',
        destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
        outline: 'border border-gray-600 bg-transparent hover:bg-gray-700 hover:text-white',
        secondary: 'bg-gray-700 text-white hover:bg-gray-600 shadow-sm',
        ghost: 'hover:bg-gray-700 hover:text-white',
        link: 'text-blue-500 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // Use the Slot component when asChild is true
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
