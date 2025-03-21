/**
 * @context: ui-system, ui-form-system, component-library
 * 
 * Switch component for toggling boolean states with a visual representation
 */

import * as React from 'react';
import { forwardRef, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  BaseComponentProps, 
  ComponentSize,
  ComponentVariant,
  LabeledComponentProps,
  ErrorComponentProps
} from '../../../types/ui/ComponentTypes';

export interface SwitchProps extends 
  BaseComponentProps, 
  LabeledComponentProps, 
  ErrorComponentProps,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'onChange'>
{
  /**
   * Switch variant
   * @default 'primary'
   */
  variant?: ComponentVariant;
  
  /**
   * Switch size
   * @default 'medium'
   */
  size?: ComponentSize;
  
  /**
   * Helper text to display below the switch
   */
  helperText?: React.ReactNode;
  
  /**
   * Whether the switch is in the on position
   */
  checked?: boolean;
  
  /**
   * Default checked state (uncontrolled)
   */
  defaultChecked?: boolean;
  
  /**
   * Callback when switch state changes
   */
  onChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
  
  /**
   * Label position relative to the switch
   * @default 'right'
   */
  labelPosition?: 'left' | 'right';
  
  /**
   * Icon to display in the on position
   */
  onIcon?: React.ReactNode;
  
  /**
   * Icon to display in the off position
   */
  offIcon?: React.ReactNode;
  
  /**
   * Custom on label text
   */
  onLabel?: string;
  
  /**
   * Custom off label text
   */
  offLabel?: string;
  
  /**
   * Whether to show state labels inside switch
   * @default false
   */
  showStateLabels?: boolean;
  
  /**
   * Custom validation function
   */
  validate?: (checked: boolean) => string | undefined;
}

/**
 * Switch component for toggling boolean states
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(({
  // Base props
  className,
  style,
  id,
  disabled = false,
  
  // Switch specific props
  variant = 'primary',
  size = 'medium',
  label,
  hideLabel = false,
  helperText,
  hasError = false,
  errorMessage,
  labelPosition = 'right',
  onIcon,
  offIcon,
  onLabel,
  offLabel,
  showStateLabels = false,
  
  // HTML input props
  checked,
  defaultChecked,
  onChange,
  onFocus,
  onBlur,
  validate,
  required,
  
  // Rest of props
  ...rest
}, ref) => {
  // Internal state
  const [isValidated, setIsValidated] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>(undefined);
  const [isChecked, setIsChecked] = useState<boolean>(() => {
    return checked !== undefined ? checked : !!defaultChecked;
  });
  const [isFocused, setIsFocused] = useState(false);
  const internalRef = useRef<HTMLInputElement>(null);
  
  // Handle external checked changes for controlled mode
  useEffect(() => {
    if (checked !== undefined) {
      setIsChecked(checked);
    }
  }, [checked]);
  
  // Forward ref
  React.useImperativeHandle(ref, () => internalRef.current!);
  
  // Handle change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked;
    
    // Update local state for uncontrolled mode
    if (checked === undefined) {
      setIsChecked(newChecked);
    }
    
    // Run validation if needed
    if (isValidated && validate) {
      setValidationError(validate(newChecked));
    }
    
    // Call external onChange handler
    if (onChange) {
      onChange(newChecked, e);
    }
  }, [checked, onChange, isValidated, validate]);
  
  // Handle focus
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Call external onFocus handler
    onFocus?.(e);
  }, [onFocus]);
  
  // Handle blur - run validation
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    
    // Run validation
    if (validate) {
      setIsValidated(true);
      setValidationError(validate(isChecked));
    }
    
    // Call external onBlur handler
    onBlur?.(e);
  }, [validate, isChecked, onBlur]);
  
  // Handle label click to toggle the switch
  const handleLabelClick = useCallback(() => {
    if (disabled) return;
    
    // Simulate a click on the input element
    if (internalRef.current) {
      internalRef.current.click();
    }
  }, [disabled]);
  
  // Determine error state
  const showError = hasError || (isValidated && !!validationError);
  const errorToShow = errorMessage || validationError;
  
  // Memoize switch class names
  const switchContainerClassName = useMemo(() => {
    const classes = ['ui-switch-container'];
    
    if (className) {
      classes.push(className);
    }
    
    if (size) {
      classes.push(`ui-switch-${size}`);
    }
    
    if (variant) {
      classes.push(`ui-switch-${variant}`);
    }
    
    if (disabled) {
      classes.push('ui-switch-disabled');
    }
    
    if (isFocused) {
      classes.push('ui-switch-focused');
    }
    
    if (isChecked) {
      classes.push('ui-switch-checked');
    }
    
    if (showError) {
      classes.push('ui-switch-error');
    }
    
    if (labelPosition === 'left') {
      classes.push('ui-switch-label-left');
    }
    
    return classes.join(' ');
  }, [
    className, size, variant, disabled,
    isFocused, isChecked, showError, labelPosition
  ]);
  
  // Generate unique ID for the switch if not provided
  const switchId = id || `switch-${Math.random().toString(36).substring(2, 9)}`;
  
  // Determine hidden label for accessibility
  const ariaLabel = hideLabel && typeof label === 'string' ? label : undefined;
  
  return (
    <div className={switchContainerClassName} style={style}>
      <div className="ui-switch-field">
        {/* Render label on the left if specified */}
        {labelPosition === 'left' && label && !hideLabel && (
          <label 
            htmlFor={switchId}
            className="ui-switch-label"
            onClick={handleLabelClick}
          >
            {label}
            {required && <span className="ui-switch-required">*</span>}
          </label>
        )}
        
        {/* Switch control */}
        <div className="ui-switch-control">
          <input
            ref={internalRef}
            id={switchId}
            type="checkbox"
            checked={isChecked}
            defaultChecked={defaultChecked}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            aria-invalid={showError}
            aria-describedby={showError ? `${switchId}-error` : undefined}
            aria-label={ariaLabel}
            className="ui-switch-input"
            {...rest}
          />
          
          <div className="ui-switch-track">
            {/* Show state labels inside track if specified */}
            {showStateLabels && (
              <div className="ui-switch-state-labels">
                <span className="ui-switch-on-label">{onLabel || 'ON'}</span>
                <span className="ui-switch-off-label">{offLabel || 'OFF'}</span>
              </div>
            )}
          </div>
          
          <div className="ui-switch-thumb">
            {isChecked && onIcon && (
              <div className="ui-switch-icon ui-switch-on-icon">
                {onIcon}
              </div>
            )}
            
            {!isChecked && offIcon && (
              <div className="ui-switch-icon ui-switch-off-icon">
                {offIcon}
              </div>
            )}
          </div>
        </div>
        
        {/* Render label on the right by default */}
        {labelPosition === 'right' && label && !hideLabel && (
          <label 
            htmlFor={switchId}
            className="ui-switch-label"
            onClick={handleLabelClick}
          >
            {label}
            {required && <span className="ui-switch-required">*</span>}
          </label>
        )}
      </div>
      
      {/* Helper text or error message */}
      {(helperText || showError) && (
        <div 
          className={`ui-switch-helper-text ${showError ? 'ui-switch-error-text' : ''}`}
          id={showError ? `${switchId}-error` : undefined}
        >
          {showError ? errorToShow : helperText}
        </div>
      )}
    </div>
  );
});

Switch.displayName = 'Switch';

export default Switch; 