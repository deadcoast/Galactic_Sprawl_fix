/**
 * @context: ui-system, ui-form-system, component-library
 *
 * Slider component for selecting numeric values from a range
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

export interface SliderMarker {
  /**
   * Value where marker should appear
   */
  value: number;

  /**
   * Label for the marker
   */
  label?: React.ReactNode;
}

export interface SliderProps
  extends BaseComponentProps,
    LabeledComponentProps,
    ErrorComponentProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'value' | 'onChange'> {
  /**
   * Slider variant
   * @default 'primary'
   */
  variant?: ComponentVariant;

  /**
   * Slider size
   * @default 'medium'
   */
  size?: ComponentSize;

  /**
   * Helper text to display below the slider
   */
  helperText?: React.ReactNode;

  /**
   * Whether the slider should take up the full width of its container
   * @default true
   */
  fullWidth?: boolean;

  /**
   * The current value of the slider
   */
  value?: number;

  /**
   * Default value (uncontrolled)
   */
  defaultValue?: number;

  /**
   * Callback when value changes
   */
  onChange?: (value: number, event: React.ChangeEvent<HTMLInputElement>) => void;

  /**
   * Callback when user starts interacting with the slider
   */
  onChangeStart?: (value: number) => void;

  /**
   * Callback when user stops interacting with the slider
   */
  onChangeEnd?: (value: number) => void;

  /**
   * Minimum value
   * @default 0
   */
  min?: number;

  /**
   * Maximum value
   * @default 100
   */
  max?: number;

  /**
   * Step increment
   * @default 1
   */
  step?: number;

  /**
   * Custom validation function
   */
  validate?: (value: number) => string | undefined;

  /**
   * Whether to show value label
   * @default true
   */
  showValue?: boolean;

  /**
   * Format function for the value display
   */
  formatValue?: (value: number) => string;

  /**
   * Whether to show value only on hover/drag
   * @default false
   */
  showValueOnHover?: boolean;

  /**
   * Whether to show minimum and maximum labels
   * @default false
   */
  showMinMaxLabels?: boolean;

  /**
   * Whether to show track fill
   * @default true
   */
  showTrackFill?: boolean;

  /**
   * Array of marks to show on the slider track
   */
  marks?: SliderMarker[];

  /**
   * Whether to show input field next to slider
   * @default false
   */
  showInputField?: boolean;
}

/**
 * Slider component for selecting numeric values from a range
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      // Base props
      className,
      style,
      id,
      disabled = false,

      // Slider specific props
      variant = 'primary',
      size = 'medium',
      label,
      hideLabel = false,
      helperText,
      hasError = false,
      errorMessage,
      fullWidth = true,

      // Range props
      min = 0,
      max = 100,
      step = 1,
      value,
      defaultValue,
      showValue = true,
      formatValue,
      showValueOnHover = false,
      showMinMaxLabels = false,
      showTrackFill = true,
      marks = [],
      showInputField = false,

      // Event handlers
      onChange,
      onChangeStart,
      onChangeEnd,
      onFocus,
      onBlur,
      validate,
      required,

      // Rest of props
      ...rest
    },
    ref
  ) => {
    // Internal state
    const [isValidated, setIsValidated] = useState(false);
    const [validationError, setValidationError] = useState<string | undefined>(undefined);
    const [localValue, setLocalValue] = useState<number>(() => {
      // Initialize with controlled or uncontrolled value, or default to min
      return value !== undefined ? value : defaultValue !== undefined ? defaultValue : min;
    });
    const [isDragging, setIsDragging] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [inputValue, setInputValue] = useState<string>('');
    const internalRef = useRef<HTMLInputElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);

    // Handle external value changes
    useEffect(() => {
      if (value !== undefined) {
        setLocalValue(value);
        setInputValue(value.toString());
      }
    }, [value]);

    // Forcombatd ref
    React.useImperativeHandle(ref, () => internalRef.current!);

    // Format value for display
    const formattedValue = useMemo(() => {
      if (formatValue) {
        return formatValue(localValue);
      }
      return localValue.toString();
    }, [localValue, formatValue]);

    // Calculate percentage for visual indicators
    const percentage = useMemo(() => {
      return ((localValue - min) / (max - min)) * 100;
    }, [localValue, min, max]);

    // Handle change from slider input
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value);

        setLocalValue(newValue);
        setInputValue(newValue.toString());

        // Run validation if needed
        if (isValidated && validate) {
          setValidationError(validate(newValue));
        }

        // Call external onChange handler
        if (onChange) {
          onChange(newValue, e);
        }
      },
      [onChange, isValidated, validate]
    );

    // Handle change from number input field
    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputVal = e.target.value;
        setInputValue(inputVal);

        // Only update slider and call onChange if value is a valid number
        const numericValue = parseFloat(inputVal);
        if (!isNaN(numericValue)) {
          // Clamp value to min/max range
          const clampedValue = Math.min(Math.max(numericValue, min), max);

          setLocalValue(clampedValue);

          // Run validation if needed
          if (isValidated && validate) {
            setValidationError(validate(clampedValue));
          }

          // Call external onChange handler with a synthetic event
          if (onChange && internalRef.current) {
            const syntheticEvent = {
              target: internalRef.current,
              currentTarget: internalRef.current,
            } as React.ChangeEvent<HTMLInputElement>;

            onChange(clampedValue, syntheticEvent);
          }
        }
      },
      [min, max, onChange, isValidated, validate]
    );

    // Handle input field blur - enforce min/max and step
    const handleInputBlur = useCallback(() => {
      let finalValue = parseFloat(inputValue);

      // Handle invalid input
      if (isNaN(finalValue)) {
        finalValue = localValue;
      }

      // Clamp to min/max
      finalValue = Math.min(Math.max(finalValue, min), max);

      // Adjust to step if needed
      if (step !== 0) {
        const steps = Math.round((finalValue - min) / step);
        finalValue = min + steps * step;
        // Adjust for floating point precision issues
        finalValue = parseFloat(finalValue.toFixed(10));
      }

      setLocalValue(finalValue);
      setInputValue(finalValue.toString());

      // Update validation on blur
      if (validate) {
        setIsValidated(true);
        setValidationError(validate(finalValue));
      }
    }, [inputValue, localValue, min, max, step, validate]);

    // Handle mousedown - start dragging
    const handleMouseDown = useCallback(() => {
      setIsDragging(true);
      if (onChangeStart) {
        onChangeStart(localValue);
      }
    }, [localValue, onChangeStart]);

    // Handle mouseup - end dragging
    const handleMouseUp = useCallback(() => {
      if (isDragging) {
        setIsDragging(false);
        if (onChangeEnd) {
          onChangeEnd(localValue);
        }
      }
    }, [isDragging, localValue, onChangeEnd]);

    // Add global mouse event listeners for drag end
    useEffect(() => {
      if (isDragging) {
        const handleGlobalMouseUp = () => {
          setIsDragging(false);
          if (onChangeEnd) {
            onChangeEnd(localValue);
          }
        };

        document.addEventListener('mouseup', handleGlobalMouseUp);
        document.addEventListener('touchend', handleGlobalMouseUp);

        return () => {
          document.removeEventListener('mouseup', handleGlobalMouseUp);
          document.removeEventListener('touchend', handleGlobalMouseUp);
        };
      }
    }, [isDragging, localValue, onChangeEnd]);

    // Handle mouseenter/leave for hover state
    const handleMouseEnter = useCallback(() => {
      setIsHovering(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
      setIsHovering(false);
    }, []);

    // Handle blur - run validation
    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        // Update validation on blur
        if (validate) {
          setIsValidated(true);
          setValidationError(validate(localValue));
        }

        // Call external onBlur handler
        onBlur?.(e);
      },
      [validate, localValue, onBlur]
    );

    // Determine if value should be shown
    const shouldShowValue = showValue && (!showValueOnHover || isHovering || isDragging);

    // Determine error state
    const showError = hasError || (isValidated && !!validationError);
    const errorToShow = errorMessage || validationError;

    // Build slider class names
    const sliderContainerClassName = useMemo(() => {
      const classes = ['ui-slider-container'];

      if (className) {
        classes.push(className);
      }

      if (size) {
        classes.push(`ui-slider-${size}`);
      }

      if (variant) {
        classes.push(`ui-slider-${variant}`);
      }

      if (disabled) {
        classes.push('ui-slider-disabled');
      }

      if (isDragging) {
        classes.push('ui-slider-dragging');
      }

      if (showError) {
        classes.push('ui-slider-error');
      }

      if (fullWidth) {
        classes.push('ui-slider-full-width');
      }

      return classes.join(' ');
    }, [className, size, variant, disabled, isDragging, showError, fullWidth]);

    // Generate a unique ID for the component if not provided
    const sliderId = id || `slider-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div
        className={sliderContainerClassName}
        style={style}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Label and value display */}
        {(label || (showValue && !showValueOnHover)) && (
          <div className="ui-slider-header">
            {label && !hideLabel && (
              <label htmlFor={sliderId} className="ui-slider-label">
                {label}
                {required && <span className="ui-slider-required">*</span>}
              </label>
            )}

            {shouldShowValue && !showInputField && (
              <div className="ui-slider-value">{formattedValue}</div>
            )}
          </div>
        )}

        <div className="ui-slider-controls">
          {/* Slider track */}
          <div className="ui-slider-track-container" ref={trackRef}>
            {/* Min-max labels */}
            {showMinMaxLabels && (
              <div className="ui-slider-min-max-labels">
                <div className="ui-slider-min-label">{formatValue ? formatValue(min) : min}</div>
                <div className="ui-slider-max-label">{formatValue ? formatValue(max) : max}</div>
              </div>
            )}

            {/* Main track */}
            <div className="ui-slider-track">
              {/* Fill part of track */}
              {showTrackFill && (
                <div className="ui-slider-track-fill" style={{ width: `${percentage}%` }} />
              )}

              {/* Track markers */}
              {marks.map(mark => {
                const markPercentage = ((mark.value - min) / (max - min)) * 100;
                return (
                  <div
                    key={mark.value}
                    className="ui-slider-mark"
                    style={{ left: `${markPercentage}%` }}
                  >
                    {mark.label && <div className="ui-slider-mark-label">{mark.label}</div>}
                  </div>
                );
              })}

              {/* Range input */}
              <input
                ref={internalRef}
                id={sliderId}
                type="range"
                min={min}
                max={max}
                step={step}
                value={localValue}
                disabled={disabled}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={onFocus}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={localValue}
                aria-invalid={showError}
                aria-describedby={showError ? `${sliderId}-error` : undefined}
                className="ui-slider-input"
                {...rest}
              />

              {/* Thumb indicator */}
              <div className="ui-slider-thumb" style={{ left: `${percentage}%` }}>
                {/* Floating value indicator shown when hovering/dragging */}
                {shouldShowValue && showValueOnHover && (
                  <div className="ui-slider-thumb-value">{formattedValue}</div>
                )}
              </div>
            </div>
          </div>

          {/* Optional number input field */}
          {showInputField && (
            <div className="ui-slider-input-field-container">
              <input
                type="number"
                min={min}
                max={max}
                step={step}
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                disabled={disabled}
                className="ui-slider-input-field"
                aria-label={`${label || 'Slider'} value input`}
              />
            </div>
          )}
        </div>

        {/* Helper text or error message */}
        {(helperText || showError) && (
          <div
            className={`ui-slider-helper-text ${showError ? 'ui-slider-error-text' : ''}`}
            id={showError ? `${sliderId}-error` : undefined}
          >
            {showError ? errorToShow : helperText}
          </div>
        )}
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export default Slider;
