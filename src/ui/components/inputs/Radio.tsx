/**
 * @context: ui-system, ui-form-system, component-library
 *
 * Radio component for selecting one option from a set of choices
 */

import * as React from 'react';
import { forwardRef, useCallback, useMemo } from 'react';
import {
  BaseComponentProps,
  ComponentSize,
  ComponentVariant,
  ErrorComponentProps,
  LabeledComponentProps,
} from '../../../types/ui/ComponentTypes';

export interface RadioProps
  extends BaseComponentProps,
    LabeledComponentProps,
    ErrorComponentProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  /**
   * Radio variant
   * @default 'primary'
   */
  variant?: ComponentVariant;

  /**
   * Radio size
   * @default 'medium'
   */
  size?: ComponentSize;

  /**
   * Radio label position
   * @default 'right'
   */
  labelPosition?: 'left' | 'right';

  /**
   * Helper text to display below the radio
   */
  helperText?: React.ReactNode;

  /**
   * Whether the radio is checked
   */
  checked?: boolean;

  /**
   * Default checked state (uncontrolled)
   */
  defaultChecked?: boolean;

  /**
   * Value of the radio button
   */
  value: string;

  /**
   * Callback when radio state changes
   */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Radio component for single selection with accessibility
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      // Base props
      className,
      style,
      id,
      disabled = false,

      // Radio specific props
      variant = 'primary',
      size = 'medium',
      label,
      hideLabel = false,
      helperText,
      hasError = false,
      errorMessage,
      labelPosition = 'right',

      // HTML input props
      checked,
      defaultChecked,
      onChange,
      required,
      name,
      value,

      // Rest of props
      ...rest
    },
    ref
  ) => {
    // Handle change event
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e);
      },
      [onChange]
    );

    // Memoize radio class names
    const radioContainerClassName = useMemo(() => {
      const classes = ['ui-radio-container'];

      if (className) {
        classes.push(className);
      }

      if (size) {
        classes.push(`ui-radio-${size}`);
      }

      if (variant) {
        classes.push(`ui-radio-${variant}`);
      }

      if (disabled) {
        classes.push('ui-radio-disabled');
      }

      if (hasError) {
        classes.push('ui-radio-error');
      }

      if (checked) {
        classes.push('ui-radio-checked');
      }

      if (labelPosition === 'left') {
        classes.push('ui-radio-label-left');
      }

      return classes.join(' ');
    }, [className, size, variant, disabled, hasError, checked, labelPosition]);

    // Generate unique ID for the radio if not provided
    const radioId = id || `radio-${Math.random().toString(36).substring(2, 9)}`;

    // Content to render
    const radioElement = (
      <div className="ui-radio-wrapper">
        <input
          ref={ref}
          id={radioId}
          type="radio"
          onChange={handleChange}
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          required={required}
          name={name}
          value={value}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${radioId}-error` : undefined}
          className="ui-radio-input"
          {...rest}
        />
        <div className="ui-radio-custom" aria-hidden="true">
          {/* Custom radio visual - rendered by CSS with ::after for selected state */}
        </div>
      </div>
    );

    // Label element
    const labelElement = label && (
      <label htmlFor={radioId} className="ui-radio-label">
        {label}
        {required && <span className="ui-radio-required">*</span>}
      </label>
    );

    return (
      <div className={radioContainerClassName} style={style}>
        <div className="ui-radio-field">
          {/* Render label on the left if specified */}
          {labelPosition === 'left' && labelElement}

          {/* Radio input */}
          {radioElement}

          {/* Render label on the right by default */}
          {labelPosition === 'right' && labelElement}
        </div>

        {/* Helper text or error message */}
        {(helperText || hasError) && (
          <div
            className={`ui-radio-helper-text ${hasError ? 'ui-radio-error-text' : ''}`}
            id={hasError ? `${radioId}-error` : undefined}
          >
            {hasError ? errorMessage : helperText}
          </div>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

export default Radio;

/**
 * RadioGroup component to manage a group of Radio buttons
 */
export interface RadioGroupProps
  extends BaseComponentProps,
    LabeledComponentProps,
    ErrorComponentProps {
  /**
   * RadioGroup variant
   * @default 'primary'
   */
  variant?: ComponentVariant;

  /**
   * RadioGroup size
   * @default 'medium'
   */
  size?: ComponentSize;

  /**
   * Name attribute for all radio inputs in the group
   */
  name: string;

  /**
   * Current selected value
   */
  value?: string;

  /**
   * Default selected value (uncontrolled)
   */
  defaultValue?: string;

  /**
   * Radio options
   */
  options?: Array<{
    value: string;
    label: React.ReactNode;
    disabled?: boolean;
  }>;

  /**
   * Callback when selection changes
   */
  onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;

  /**
   * Layout direction of the radio group
   * @default 'vertical'
   */
  direction?: 'horizontal' | 'vertical';

  /**
   * Radio items
   */
  children?: React.ReactNode;

  /**
   * Helper text to display below the radio group
   */
  helperText?: React.ReactNode;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  className,
  style,
  variant = 'primary',
  size = 'medium',
  name,
  value,
  defaultValue,
  options,
  onChange,
  direction = 'vertical',
  children,
  label,
  hideLabel = false,
  hasError = false,
  errorMessage,
  helperText,
}) => {
  // State for uncontrolled mode
  const [selectedValue, setSelectedValue] = React.useState(defaultValue || '');

  // Determine if we're in controlled or uncontrolled mode
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : selectedValue;

  // Handle radio change
  const handleRadioChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      if (!isControlled) {
        setSelectedValue(newValue);
      }

      onChange?.(newValue, e);
    },
    [isControlled, onChange]
  );

  // Generate unique ID for the group
  const groupId = `radio-group-${Math.random().toString(36).substring(2, 9)}`;

  // Build class names
  const groupClassName = React.useMemo(() => {
    const classes = ['ui-radio-group'];

    if (className) {
      classes.push(className);
    }

    if (direction === 'horizontal') {
      classes.push('ui-radio-group-horizontal');
    } else {
      classes.push('ui-radio-group-vertical');
    }

    if (hasError) {
      classes.push('ui-radio-group-error');
    }

    return classes.join(' ');
  }, [className, direction, hasError]);

  // Render radios from options if provided
  const radioOptions =
    options &&
    options.map(option => (
      <Radio
        key={option.value}
        name={name}
        value={option.value}
        label={option.label}
        checked={currentValue === option.value}
        onChange={handleRadioChange}
        variant={variant as ComponentVariant}
        size={size as ComponentSize}
        disabled={option.disabled}
      />
    ));

  // Modify children to inject props if they are Radio components
  const enhancedChildren = React.Children.map(children, child => {
    if (React.isValidElement(child) && child.type === Radio) {
      return React.cloneElement(child, {
        name,
        checked: currentValue === child.props.value,
        onChange: handleRadioChange,
      } as React.ComponentProps<typeof Radio>);
    }
    return child;
  });

  return (
    <div
      className={groupClassName}
      style={style}
      role="radiogroup"
      aria-labelledby={`${groupId}-label`}
    >
      {label && !hideLabel && (
        <div id={`${groupId}-label`} className="ui-radio-group-label">
          {label}
        </div>
      )}

      <div className="ui-radio-group-options">{radioOptions || enhancedChildren}</div>

      {(helperText || hasError) && (
        <div
          className={`ui-radio-group-helper-text ${hasError ? 'ui-radio-group-error-text' : ''}`}
          id={hasError ? `${groupId}-error` : undefined}
        >
          {hasError ? errorMessage : helperText}
        </div>
      )}
    </div>
  );
};

RadioGroup.displayName = 'RadioGroup';
