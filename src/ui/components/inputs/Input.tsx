/**
 * @context: ui-system, ui-form-system, component-library
 *
 * Input component for text entry with validation and error states
 */

import * as React from 'react';
import { forwardRef, useCallback, useMemo, useState } from 'react';
import {
  BaseComponentProps,
  ComponentSize,
  ComponentVariant,
  ErrorComponentProps,
  LabeledComponentProps,
} from '../../../types/ui/ComponentTypes';

export interface InputProps
  extends BaseComponentProps,
    LabeledComponentProps,
    ErrorComponentProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Input variant
   * @default 'primary'
   */
  variant?: ComponentVariant;

  /**
   * Input size
   * @default 'medium'
   */
  size?: ComponentSize;

  /**
   * Helper text to display below the input
   */
  helperText?: React.ReactNode;

  /**
   * Icon to display before the input content
   */
  leadingIcon?: React.ReactNode;

  /**
   * Icon to display after the input content
   */
  trailingIcon?: React.ReactNode;

  /**
   * Whether to show a clear button
   * @default false
   */
  clearable?: boolean;

  /**
   * Whether the input should take up the full width of its container
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Whether the input should be focused on mount
   * @default false
   */
  autoFocus?: boolean;

  /**
   * Custom validation function
   */
  validate?: (value: string) => string | undefined;

  /**
   * Input type (text, email, password, etc.)
   * @default 'text'
   */
  type?: string;

  /**
   * Callback when input value changes
   */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;

  /**
   * Input value
   */
  value?: string;

  /**
   * Default input value (uncontrolled)
   */
  defaultValue?: string;
}

/**
 * Input component for text entry with validation and error states
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      // Base props
      className,
      style,
      id,
      disabled = false,

      // Input specific props
      variant = 'primary',
      size = 'medium',
      label,
      hideLabel = false,
      placeholder,
      helperText,
      hasError = false,
      errorMessage,
      leadingIcon,
      trailingIcon,
      clearable = false,
      fullWidth = false,
      autoFocus = false,
      validate,
      type = 'text',

      // HTML input props
      onChange,
      onFocus,
      onBlur,
      value,
      defaultValue,
      required,

      // Rest of props
      ...rest
    },
    ref
  ) => {
    // Internal validation state
    const [isValidated, setIsValidated] = useState(false);
    const [validationError, setValidationError] = useState<string | undefined>(undefined);
    const [localValue, setLocalValue] = useState(defaultValue || '');
    const [isFocused, setIsFocused] = useState(false);

    // Determine if we're in controlled or uncontrolled mode
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : localValue;

    // Handle input change
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;

        // Update local value for uncontrolled mode
        if (!isControlled) {
          setLocalValue(newValue);
        }

        // Run validation if needed
        if (isValidated && validate) {
          setValidationError(validate(newValue));
        }

        // Call external onChange handler
        onChange?.(e);
      },
      [isControlled, isValidated, onChange, validate]
    );

    // Handle input blur - run validation
    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);

        // Run validation
        if (validate) {
          setIsValidated(true);
          setValidationError(validate(e.target.value));
        }

        // Call external onBlur handler
        onBlur?.(e);
      },
      [validate, onBlur]
    );

    // Handle input focus
    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);

        // Call external onFocus handler
        onFocus?.(e);
      },
      [onFocus]
    );

    // Handle clear button click
    const handleClear = useCallback(() => {
      if (!isControlled) {
        setLocalValue('');
      }

      // Create a synthetic event to pass to onChange
      const syntheticEvent = {
        target: { value: '' },
        currentTarget: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;

      onChange?.(syntheticEvent);

      // Focus the input after clearing
      // Need to use a setTimeout because React might not have updated the DOM yet
      setTimeout(() => {
        const input = ref && 'current' in ref ? ref.current : null;
        if (input) {
          input.focus();
        }
      }, 0);
    }, [isControlled, onChange, ref]);

    // Determine error state
    const showError = hasError || (isValidated && !!validationError);
    const errorToShow = errorMessage || validationError;

    // Memoize input class names
    const inputContainerClassName = useMemo(() => {
      const classes = ['ui-input-container'];

      if (className) {
        classes.push(className);
      }

      if (size) {
        classes.push(`ui-input-${size}`);
      }

      if (variant) {
        classes.push(`ui-input-${variant}`);
      }

      if (disabled) {
        classes.push('ui-input-disabled');
      }

      if (isFocused) {
        classes.push('ui-input-focused');
      }

      if (showError) {
        classes.push('ui-input-error');
      }

      if (fullWidth) {
        classes.push('ui-input-full-width');
      }

      if (leadingIcon) {
        classes.push('ui-input-with-leading-icon');
      }

      if (trailingIcon || (clearable && currentValue)) {
        classes.push('ui-input-with-trailing-icon');
      }

      return classes.join(' ');
    }, [
      className,
      size,
      variant,
      disabled,
      isFocused,
      showError,
      fullWidth,
      leadingIcon,
      trailingIcon,
      clearable,
      currentValue,
    ]);

    // Generate unique ID for the input if not provided
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

    // Determine hidden label for accessibility
    const ariaLabel = hideLabel && typeof label === 'string' ? label : undefined;

    return (
      <div className={inputContainerClassName} style={style}>
        {label && !hideLabel && (
          <label htmlFor={inputId} className="ui-input-label">
            {label}
            {required && <span className="ui-input-required">*</span>}
          </label>
        )}

        <div className="ui-input-wrapper">
          {leadingIcon && <div className="ui-input-leading-icon">{leadingIcon}</div>}

          <input
            ref={ref}
            id={inputId}
            type={type}
            value={isControlled ? value : localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={showError}
            aria-describedby={showError ? `${inputId}-error` : undefined}
            aria-label={ariaLabel}
            className="ui-input"
            autoFocus={autoFocus}
            required={required}
            {...rest}
          />

          {(trailingIcon || (clearable && currentValue)) && (
            <div className="ui-input-trailing-icon">
              {clearable && currentValue ? (
                <button
                  type="button"
                  className="ui-input-clear-button"
                  onClick={handleClear}
                  aria-label="Clear input"
                  tabIndex={-1}
                >
                  ✕
                </button>
              ) : (
                trailingIcon
              )}
            </div>
          )}
        </div>

        {(helperText || showError) && (
          <div
            className={`ui-input-helper-text ${showError ? 'ui-input-error-text' : ''}`}
            id={showError ? `${inputId}-error` : undefined}
          >
            {showError ? errorToShow : helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
