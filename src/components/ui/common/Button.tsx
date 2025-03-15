import * as React from "react";
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Button as NewButton } from '../../../ui/components/Button';

interface LegacyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
}

/**
 * @deprecated Use the new Button component from ui/components/Button instead
 * This is an adapter component for backward compatibility.
 * 
 * Button component
 *
 * A reusable button component with different variants and sizes.
 */
export const Button = forwardRef<HTMLButtonElement, LegacyButtonProps>(({
  children,
  variant = 'primary',
  size = 'medium',
  className = '',
  ...props
}, ref) => {
  // Map old sizes to new sizes
  const sizeMap = {
    'small': 'sm',
    'medium': 'md',
    'large': 'lg'
  } as const;
  
  // Map old variants to new variants
  const variantMap = {
    'primary': 'primary',
    'secondary': 'secondary',
    'danger': 'danger',
    'success': 'success'
  } as const;
  
  // Convert props to new format
  const newSize = sizeMap[size];
  const newVariant = variantMap[variant];
  
  return (
    <NewButton 
      ref={ref}
      variant={newVariant} 
      size={newSize} 
      className={className}
      {...props}
    >
      {children}
    </NewButton>
  );
});

Button.displayName = 'Button';

// Add deprecation notice to console in development
if (process.env.NODE_ENV === 'development') {
  console.warn(
    'The Button component from components/ui/common/Button is deprecated. ' +
    'Please use the new Button component from ui/components/Button instead.'
  );
}
