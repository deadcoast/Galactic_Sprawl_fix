/**
 * @context: ui-system, component-library, ui-typography-system
 *
 * Label component for form fields and other elements that need descriptive labels
 */
import * as React from 'react';
import { forwardRef, useMemo } from 'react';
import {
  errorLoggingService,
  ErrorSeverity,
  ErrorType,
} from '../../../services/ErrorLoggingService';
import { BaseComponentProps, TextComponentProps } from '../../../types/ui/ComponentTypes';

/**
 * Label component props
 */
export interface LabelProps extends BaseComponentProps, TextComponentProps {
  /**
   * Label content
   */
  children: React.ReactNode;

  /**
   * ID of the element this label is for
   */
  htmlFor?: string;

  /**
   * Whether the label is for a required field
   * @default false
   */
  required?: boolean;

  /**
   * Whether the label should be visually hidden but still accessible to screen readers
   * @default false
   */
  srOnly?: boolean;

  /**
   * Optional tooltip or help text to display with the label
   */
  tooltip?: React.ReactNode;

  /**
   * Whether the label should be displayed inline with the form element
   * @default false
   */
  inline?: boolean;

  /**
   * Whether to apply a bold font weight to the label
   * @default false
   */
  bold?: boolean;

  /**
   * Whether the form field associated with this label is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Whether the field associated with this label has an error
   * @default false
   */
  hasError?: boolean;

  /**
   * Optional secondary text to display after the main label
   */
  secondaryText?: React.ReactNode;

  /**
   * Click handler for the label
   */
  onClick?: (event: React.MouseEvent<HTMLLabelElement>) => void;
}

/**
 * Label component
 *
 * Renders a label element with consistent styling for form fields
 */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  (
    {
      children,
      htmlFor,
      required = false,
      srOnly = false,
      tooltip,
      inline = false,
      bold = false,
      disabled = false,
      hasError = false,
      secondaryText,
      onClick,
      color,
      fontSize,
      fontWeight,
      textAlign,
      truncate,
      textTransform,
      className = '',
      style,
      id,
      'data-testid': dataTestId,
    },
    ref
  ) => {
    // Compute label classes
    const labelClasses = useMemo(() => {
      return [
              'gs-label',
              srOnly ? 'gs-label--sr-only' : '',
              inline ? 'gs-label--inline' : '',
              bold ? 'gs-label--bold' : '',
              disabled ? 'gs-label--disabled' : '',
              hasError ? 'gs-label--error' : '',
              required ? 'gs-label--required' : '',
              tooltip ? 'gs-label--with-tooltip' : '',
              secondaryText ? 'gs-label--with-secondary' : '',
              color ? `gs-label--color-${color}` : '',
              fontSize ? `gs-label--font-size-${fontSize}` : '',
              fontWeight ? `gs-label--font-weight-${fontWeight}` : '',
              textAlign ? `gs-label--align-${textAlign}` : '',
              truncate ? 'gs-label--truncate' : '',
              textTransform ? `gs-label--text-transform-${textTransform}` : '',
              className,
            ]
              .filter(Boolean)
              .join(' ');
    }, [
      srOnly,
      inline,
      bold,
      disabled,
      hasError,
      required,
      tooltip,
      secondaryText,
      color,
      fontSize,
      fontWeight,
      textAlign,
      truncate,
      textTransform,
      className,
    ]);

    // Handle click with error boundary
    const handleClick = (event: React.MouseEvent<HTMLLabelElement>) => {
      if (disabled) {
        return;
      }

      try {
        onClick?.(event);
      } catch (error) {
        errorLoggingService.logError(
          error instanceof Error ? error : new Error(String(error)),
          ErrorType.UI,
          ErrorSeverity.LOW,
          {
            componentName: 'Label',
            action: 'onClick',
          }
        );
      }
    };

    return (
      <label
        ref={ref}
        id={id}
        htmlFor={htmlFor}
        className={labelClasses}
        style={style}
        onClick={onClick ? handleClick : undefined}
        data-testid={dataTestId}
      >
        <span className="gs-label__content">
          {children}
          {required && <span className="gs-label__required-indicator">*</span>}
        </span>

        {tooltip && <span className="gs-label__tooltip">{tooltip}</span>}

        {secondaryText && <span className="gs-label__secondary">{secondaryText}</span>}
      </label>
    );
  }
);

Label.displayName = 'Label';

export default Label;
