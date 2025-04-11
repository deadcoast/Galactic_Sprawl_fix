/**
 * @context: ui-system, ui-form-system, component-library
 *
 * Select component for selecting from a list of options
 */

import * as React from 'react';
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BaseComponentProps,
  ComponentSize,
  ComponentVariant,
  ErrorComponentProps,
  LabeledComponentProps,
} from '../../../types/ui/ComponentTypes';

export interface SelectOption {
  /**
   * Option value (used for form submission and selection)
   */
  value: string;

  /**
   * Display label for the option
   */
  label: React.ReactNode;

  /**
   * Whether the option is disabled
   */
  disabled?: boolean;

  /**
   * Optional group this option belongs to
   */
  group?: string;

  /**
   * Optional icon to display with the option
   */
  icon?: React.ReactNode;
}

export interface SelectProps
  extends BaseComponentProps,
    LabeledComponentProps,
    ErrorComponentProps,
    Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'value' | 'onChange'> {
  /**
   * Select variant
   * @default 'primary'
   */
  variant?: ComponentVariant;

  /**
   * Select size
   * @default 'medium'
   */
  size?: ComponentSize;

  /**
   * Helper text to display below the select
   */
  helperText?: React.ReactNode;

  /**
   * Icon to display before the select content
   */
  leadingIcon?: React.ReactNode;

  /**
   * Icon to display after the select content
   */
  trailingIcon?: React.ReactNode;

  /**
   * Whether the select should take up the full width of its container
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Whether the select allows multiple selections
   * @default false
   */
  multiple?: boolean;

  /**
   * The selected value(s)
   */
  value?: string | string[];

  /**
   * Default value(s) (uncontrolled)
   */
  defaultValue?: string | string[];

  /**
   * Callback when select value changes
   */
  onChange?: (value: string | string[], event: React.ChangeEvent<HTMLSelectElement>) => void;

  /**
   * Custom validation function
   */
  validate?: (value: string | string[]) => string | undefined;

  /**
   * List of options to display
   */
  options: SelectOption[];

  /**
   * Whether to show a clear button for single-select
   * @default false
   */
  clearable?: boolean;

  /**
   * Number of visible options when open
   * @default 5
   */
  visibleOptions?: number;

  /**
   * Text to display when no option is selected
   */
  placeholderText?: string;
}

/**
 * Select component for selecting from a list of options
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      // Base props
      className,
      style,
      id,
      disabled = false,

      // Select specific props
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
      fullWidth = false,
      multiple = false,
      validate,
      options = [],
      clearable = false,
      visibleOptions = 5,
      placeholderText,

      // HTML select props
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
    // Internal state
    const [isValidated, setIsValidated] = useState(false);
    const [validationError, setValidationError] = useState<string | undefined>(undefined);
    const [isFocused, setIsFocused] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const internalRef = useRef<HTMLSelectElement>(null);

    // Use the useImperativeHandle hook to handle the ref properly
    React.useImperativeHandle(ref, () => internalRef.current!);

    // Determine if we're in controlled or uncontrolled mode
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : defaultValue;

    // Group options by their group property
    const groupedOptions = useMemo(() => {
      const groups: Record<string, SelectOption[]> = {
        '': [], // Default group for options without a group
      };

      options.forEach(option => {
        const groupKey = option.group || '';
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(option);
      });

      return groups;
    }, [options]);

    // Handle select change
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = multiple
          ? Array.from(e.target.selectedOptions).map(option => option.value)
          : e.target.value;

        // Run validation if needed
        if (isValidated && validate) {
          setValidationError(validate(newValue));
        }

        // Call external onChange handler
        if (onChange) {
          onChange(newValue, e);
        }
      },
      [multiple, isValidated, validate, onChange]
    );

    // Handle blur - run validation
    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLSelectElement>) => {
        setIsFocused(false);
        setIsOpen(false);

        // Run validation
        if (validate) {
          setIsValidated(true);
          const selectValue = multiple
            ? Array.from(e.target.selectedOptions).map(option => option.value)
            : e.target.value;
          setValidationError(validate(selectValue));
        }

        // Call external onBlur handler
        onBlur?.(e);
      },
      [validate, onBlur, multiple]
    );

    // Handle focus
    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLSelectElement>) => {
        setIsFocused(true);
        setIsOpen(true);

        // Call external onFocus handler
        onFocus?.(e);
      },
      [onFocus]
    );

    // Handle click on wrapper to focus the select
    const handleWrapperClick = useCallback(() => {
      if (internalRef.current && !disabled) {
        internalRef.current.focus();
      }
    }, [disabled]);

    // Handle clear button click
    const handleClear = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();

        if (internalRef.current) {
          const nativeSelectElement = internalRef.current;
          nativeSelectElement.value = '';

          // Create and dispatch change event
          const changeEvent = new Event('change', { bubbles: true });
          nativeSelectElement.dispatchEvent(changeEvent);

          // Create a synthetic React event to pass to onChange
          const syntheticEvent = {
            target: nativeSelectElement,
            currentTarget: nativeSelectElement,
          } as React.ChangeEvent<HTMLSelectElement>;

          handleChange(syntheticEvent);

          // Focus the select after clearing
          nativeSelectElement.focus();
        }
      },
      [handleChange]
    );

    // Close dropdown when clicking outside
    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (event: MouseEvent) => {
        if (
          internalRef.current &&
          event.target instanceof Node &&
          !internalRef.current.contains(event.target)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    // Determine error state
    const showError = hasError || (isValidated && !!validationError);
    const errorToShow = errorMessage || validationError;

    // Determine if something is selected for display purposes
    const hasSelection = Array.isArray(currentValue) ? currentValue.length > 0 : !!currentValue;

    // Get display value for single select
    const displayValue = useMemo(() => {
      if (multiple || !currentValue || Array.isArray(currentValue)) return '';

      const selectedOption = options.find(option => option.value === currentValue);
      return selectedOption?.label || '';
    }, [multiple, currentValue, options]);

    // Memoize select class names
    const selectContainerClassName = useMemo(() => {
      const classes = ['ui-select-container'];

      if (className) {
        classes.push(className);
      }

      if (size) {
        classes.push(`ui-select-${size}`);
      }

      if (variant) {
        classes.push(`ui-select-${variant}`);
      }

      if (disabled) {
        classes.push('ui-select-disabled');
      }

      if (isFocused) {
        classes.push('ui-select-focused');
      }

      if (isOpen) {
        classes.push('ui-select-open');
      }

      if (showError) {
        classes.push('ui-select-error');
      }

      if (fullWidth) {
        classes.push('ui-select-full-width');
      }

      if (multiple) {
        classes.push('ui-select-multiple');
      }

      if (hasSelection) {
        classes.push('ui-select-has-value');
      }

      if (leadingIcon) {
        classes.push('ui-select-with-leading-icon');
      }

      if (trailingIcon || (clearable && hasSelection)) {
        classes.push('ui-select-with-trailing-icon');
      }

      return classes.join(' ');
    }, [
      className,
      size,
      variant,
      disabled,
      isFocused,
      isOpen,
      showError,
      fullWidth,
      multiple,
      hasSelection,
      leadingIcon,
      trailingIcon,
      clearable,
    ]);

    // Generate unique ID for the select if not provided
    const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;

    // Determine hidden label for accessibility
    const ariaLabel = hideLabel && typeof label === 'string' ? label : undefined;

    return (
      <div className={selectContainerClassName} style={style}>
        {label && !hideLabel && (
          <label htmlFor={selectId} className="ui-select-label">
            {label}
            {required && <span className="ui-select-required">*</span>}
          </label>
        )}

        <div className="ui-select-wrapper" onClick={handleWrapperClick}>
          {leadingIcon && <div className="ui-select-leading-icon">{leadingIcon}</div>}

          <div className="ui-select-value">
            {!hasSelection && placeholderText && (
              <span className="ui-select-placeholder">{placeholderText}</span>
            )}
            {!multiple && hasSelection && (
              <span className="ui-select-single-value">{displayValue}</span>
            )}
            {multiple && hasSelection && (
              <div className="ui-select-multiple-values">
                {Array.isArray(currentValue) &&
                  currentValue.map(val => {
                    const option = options.find(opt => opt.value === val);
                    return (
                      option && (
                        <span key={val} className="ui-select-multi-value">
                          {option.label}
                        </span>
                      )
                    );
                  })}
              </div>
            )}
          </div>

          <select
            ref={internalRef}
            id={selectId}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            required={required}
            multiple={multiple}
            aria-invalid={showError}
            aria-describedby={showError ? `${selectId}-error` : undefined}
            aria-label={ariaLabel}
            className="ui-select-input"
            size={multiple ? visibleOptions : undefined}
            {...rest}
          >
            {!multiple && !required && !hasSelection && (
              <option value="">{placeholder || 'Select an option'}</option>
            )}

            {Object.entries(groupedOptions).map(([groupName, groupOptions]) => {
              // If it's the default empty group and no other groups exist
              if (groupName === '' && Object.keys(groupedOptions).length === 1) {
                return groupOptions.map(option => (
                  <option key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </option>
                ));
              }

              // If there are actual groups
              return (
                <optgroup key={groupName || 'default'} label={groupName || 'Options'}>
                  {groupOptions.map(option => (
                    <option key={option.value} value={option.value} disabled={option.disabled}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>

          {(trailingIcon || (clearable && hasSelection)) && (
            <div className="ui-select-trailing-icon">
              {clearable && hasSelection && !multiple ? (
                <button
                  type="button"
                  className="ui-select-clear-button"
                  onClick={handleClear}
                  aria-label="Clear selection"
                  tabIndex={-1}
                >
                  ✕
                </button>
              ) : (
                trailingIcon || <span className="ui-select-arrow">▼</span>
              )}
            </div>
          )}
        </div>

        {(helperText || showError) && (
          <div
            className={`ui-select-helper-text ${showError ? 'ui-select-error-text' : ''}`}
            id={showError ? `${selectId}-error` : undefined}
          >
            {showError ? errorToShow : helperText}
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
