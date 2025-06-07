/**
 * @context: ui-system, ui-form-system, component-library
 *
 * Checkbox component for boolean selections with accessibility support
 */

import * as React from 'react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import {
  BaseComponentProps,
  ComponentSize,
  ComponentVariant,
  ErrorComponentProps,
  LabeledComponentProps,
} from '../../../types/ui/ComponentTypes';

export interface CheckboxProps
  extends BaseComponentProps,
    LabeledComponentProps,
    ErrorComponentProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  /**
   * Checkbox variant
   * @default 'primary'
   */
  variant?: ComponentVariant;

  /**
   * Checkbox size
   * @default 'medium'
   */
  size?: ComponentSize;

  /**
   * Checkbox label position
   * @default 'right'
   */
  labelPosition?: 'left' | 'right';

  /**
   * Helper text to display below the checkbox
   */
  helperText?: React.ReactNode;

  /**
   * Whether the checkbox is checked
   */
  checked?: boolean;

  /**
   * Default checked state (uncontrolled)
   */
  defaultChecked?: boolean;

  /**
   * Whether the checkbox is in an indeterminate state
   * @default false
   */
  indeterminate?: boolean;

  /**
   * Callback when checkbox state changes
   */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Checkbox component with accessibility support
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      // Base props
      className,
      style,
      id,
      disabled = false,

      // Checkbox specific props
      variant = 'primary',
      size = 'medium',
      label,
      hideLabel = false,
      helperText,
      hasError = false,
      errorMessage,
      labelPosition = 'right',
      indeterminate = false,

      // HTML input props
      checked,
      defaultChecked,
      onChange,
      required,
      name,

      // Rest of props
      ...rest
    },
    ref
  ) => {
    // Setup internal ref
    const internalRef = useRef<HTMLInputElement>(null);

    // Expose the internal ref imperatively to the parent component
    useImperativeHandle(ref, () => internalRef.current!);

    // Update indeterminate state when it changes
    useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    // Handle change event
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e);
      },
      [onChange]
    );

    // Memoize checkbox class names
    const checkboxContainerClassName = useMemo(() => {
      const classes = ['ui-checkbox-container'];

      if (className) {
        classes.push(className);
      }

      if (size) {
        classes.push(`ui-checkbox-${size}`);
      }

      if (variant) {
        classes.push(`ui-checkbox-${variant}`);
      }

      if (disabled) {
        classes.push('ui-checkbox-disabled');
      }

      if (hasError) {
        classes.push('ui-checkbox-error');
      }

      if (indeterminate) {
        classes.push('ui-checkbox-indeterminate');
      }

      if (checked) {
        classes.push('ui-checkbox-checked');
      }

      if (labelPosition === 'left') {
        classes.push('ui-checkbox-label-left');
      }

      return classes.join(' ');
    }, [className, size, variant, disabled, hasError, indeterminate, checked, labelPosition]);

    // Generate unique ID for the checkbox if not provided
    const checkboxId = id || `checkbox-${Math.random().toString(36).substring(2, 9)}`;

    // Content to render
    const checkboxElement = (
      <div className="ui-checkbox-wrapper">
        <input
          ref={internalRef}
          id={checkboxId}
          type="checkbox"
          onChange={handleChange}
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          required={required}
          name={name}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${checkboxId}-error` : undefined}
          className="ui-checkbox-input"
          {...rest}
        />
        <div className="ui-checkbox-custom" aria-hidden="true">
          {/* Custom checkbox visual - rendered by CSS with ::after for checkmark */}
        </div>
      </div>
    );

    // Label element
    const labelElement = label && (
      <label htmlFor={checkboxId} className="ui-checkbox-label">
        {label}
        {required && <span className="ui-checkbox-required">*</span>}
      </label>
    );

    return (
      <div className={checkboxContainerClassName} style={style}>
        <div className="ui-checkbox-field">
          {/* Render label on the left if specified */}
          {labelPosition === 'left' && labelElement}

          {/* Checkbox input */}
          {checkboxElement}

          {/* Render label on the right by default */}
          {labelPosition === 'right' && labelElement}
        </div>

        {/* Helper text or error message */}
        {(helperText || hasError) && (
          <div
            className={`ui-checkbox-helper-text ${hasError ? 'ui-checkbox-error-text' : ''}`}
            id={hasError ? `${checkboxId}-error` : undefined}
          >
            {hasError ? errorMessage : helperText}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
