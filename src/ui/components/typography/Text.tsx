/**
 * @context: ui-system, component-library, ui-typography-system
 * 
 * Text component for displaying paragraphs and text blocks with consistent styling
 */
import * as React from 'react';
import { forwardRef, useMemo } from 'react';
import { 
  BaseComponentProps,
  TextComponentProps
} from '../../../types/ui/ComponentTypes';

/**
 * Text element types
 */
export enum TextElement {
  P = 'p',
  SPAN = 'span',
  DIV = 'div',
  STRONG = 'strong',
  EM = 'em',
  SMALL = 'small',
  MARK = 'mark',
  CODE = 'code',
  BLOCKQUOTE = 'blockquote'
}

/**
 * Text component props
 */
export interface TextProps extends BaseComponentProps, TextComponentProps {
  /**
   * Text content
   */
  children: React.ReactNode;
  
  /**
   * HTML element to render
   * @default 'p'
   */
  element?: TextElement | keyof typeof TextElement;
  
  /**
   * Whether to add paragraph margins
   * @default true for 'p' element, false for others
   */
  withMargin?: boolean;
  
  /**
   * Whether text should be muted (lower opacity)
   * @default false
   */
  muted?: boolean;
  
  /**
   * Whether text should be rendered as a paragraph with proper spacing
   * @default true for 'p' element, false for others
   */
  paragraph?: boolean;
  
  /**
   * Number of lines to truncate at
   * If set, text will be truncated with an ellipsis after this many lines
   */
  lines?: number;
  
  /**
   * Custom component to render
   * If provided, overrides the element prop
   */
  component?: React.ElementType;
  
  /**
   * Whether the text should use monospace font
   * @default false but true for 'code' element
   */
  monospace?: boolean;
}

/**
 * Check if a value is a valid TextElement
 */
function isTextElement(value: unknown): value is TextElement {
  return typeof value === 'string' && Object.values(TextElement).includes(value as TextElement);
}

/**
 * Text component
 * 
 * Renders a text element with consistent styling
 */
export const Text = forwardRef<HTMLElement, TextProps>(
  ({
    children,
    element = TextElement.P,
    withMargin,
    muted = false,
    paragraph,
    lines,
    component,
    monospace,
    color,
    fontSize,
    fontWeight,
    textAlign,
    truncate,
    textTransform,
    className = '',
    style,
    id,
    'aria-labelledby': ariaLabelledBy,
    'aria-label': ariaLabel,
    'data-testid': dataTestId,
  }, ref) => {
    // Validate element
    const safeElement = isTextElement(element) ? element : TextElement.P;
    
    // Set defaults based on element type
    const isParagraph = paragraph ?? (safeElement === TextElement.P);
    const hasMargin = withMargin ?? isParagraph;
    const isMonospace = monospace ?? (safeElement === TextElement.CODE);
    
    // Component to render (custom component or HTML element)
    const Component = component || safeElement;
    
    // Compute text classes
    const textClasses = useMemo(() => {
      const classes = [
        'gs-text',
        `gs-text--${safeElement}`,
        hasMargin ? 'gs-text--with-margin' : '',
        muted ? 'gs-text--muted' : '',
        isParagraph ? 'gs-text--paragraph' : '',
        lines ? 'gs-text--line-clamp' : '',
        isMonospace ? 'gs-text--monospace' : '',
        color ? `gs-text--color-${color}` : '',
        fontSize ? `gs-text--font-size-${fontSize}` : '',
        fontWeight ? `gs-text--font-weight-${fontWeight}` : '',
        textAlign ? `gs-text--align-${textAlign}` : '',
        truncate ? 'gs-text--truncate' : '',
        textTransform ? `gs-text--text-transform-${textTransform}` : '',
        className
      ].filter(Boolean).join(' ');
      
      return classes;
    }, [
      safeElement,
      hasMargin,
      muted,
      isParagraph,
      lines,
      isMonospace,
      color,
      fontSize,
      fontWeight,
      textAlign,
      truncate,
      textTransform,
      className
    ]);
    
    // Compute styles with line clamping if needed
    const textStyles = useMemo(() => {
      const baseStyle = { ...style };
      
      if (lines && lines > 0) {
        return {
          ...baseStyle,
          WebkitLineClamp: lines,
          lineClamp: lines,
        };
      }
      
      return baseStyle;
    }, [style, lines]);
    
    return (
      <Component
        ref={ref}
        id={id}
        className={textClasses}
        style={textStyles}
        aria-labelledby={ariaLabelledBy}
        aria-label={ariaLabel}
        data-testid={dataTestId}
      >
        {children}
      </Component>
    );
  }
);

Text.displayName = 'Text';

export default Text; 