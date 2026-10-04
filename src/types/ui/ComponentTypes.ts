/**
 * @context: ui-system, type-definitions, ui-component-library
 *
 * Common component props and types used throughout the UI system
 */

import { CSSProperties, ReactNode, RefObject } from 'react';
import { ThemeColor, ThemeFontSize, ThemeSpacing } from './ThemeTypes';

/**
 * Standard sizes that can be used across components
 */
export enum ComponentSize {
  XSMALL = 'xsmall',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  XLARGE = 'xlarge',
}

/**
 * Standard variants that can be used across components
 */
export enum ComponentVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  TERTIARY = 'tertiary',
  SUCCESS = 'success',
  combatNING = 'warning',
  DANGER = 'danger',
  INFO = 'info',
  LIGHT = 'light',
  DARK = 'dark',
  GHOST = 'ghost',
  LINK = 'link',
}

/**
 * Standard states for interactive components
 */
export enum ComponentState {
  DEFAULT = 'default',
  HOVER = 'hover',
  ACTIVE = 'active',
  DISABLED = 'disabled',
  FOCUSED = 'focused',
}

/**
 * Common props shared across most UI components
 */
export interface BaseComponentProps {
  /** Unique identifier for the component */
  id?: string;

  /** Additional CSS class names to apply to the component */
  className?: string;

  /** Inline styles to apply to the component */
  style?: CSSProperties;

  /** Describes the component for accessibility tools */
  'aria-label'?: string;

  /** ID of an element that describes this component */
  'aria-labelledby'?: string;

  /** ID of an element that describes this component in detail */
  'aria-describedby'?: string;

  /** Indicates if the component is currently disabled */
  disabled?: boolean;

  /** Data attribute for test selection */
  'data-testid'?: string;
}

/**
 * Props for components that work with refs
 */
export interface RefProps<T> {
  /** Ref object passed to the component */
  ref?: RefObject<T>;
}

/**
 * Props for components with children
 */
export interface ChildrenProps {
  /** Content of the component */
  children?: ReactNode;
}

/**
 * Props for components with a theme color
 */
export interface ColorProps {
  /** The theme color to use */
  color?: ThemeColor;
}

/**
 * Props for components with foreground and background colors
 */
export interface ColoredComponentProps extends ColorProps {
  /** The background color to use */
  backgroundColor?: ThemeColor;
}

/**
 * Props for components with size variants
 */
export interface SizedComponentProps {
  /** The size variant of the component */
  size?: ComponentSize;
}

/**
 * Props for components with different variants
 */
export interface VariantComponentProps {
  /** The variant of the component */
  variant?: ComponentVariant;
}

/**
 * Props for components with loading states
 */
export interface LoadingComponentProps {
  /** Whether the component is in a loading state */
  loading?: boolean;

  /** Element to show while loading */
  loadingIndicator?: ReactNode;
}

/**
 * Props for components with events
 */
export interface InteractiveComponentProps {
  /** Callback for click events */
  onClick?: (event: React.MouseEvent) => void;

  /** Callback for focus events */
  onFocus?: (event: React.FocusEvent) => void;

  /** Callback for blur events */
  onBlur?: (event: React.FocusEvent) => void;

  /** Callback for hover start */
  onMouseEnter?: (event: React.MouseEvent) => void;

  /** Callback for hover end */
  onMouseLeave?: (event: React.MouseEvent) => void;
}

/**
 * Props for components with labels
 */
export interface LabeledComponentProps {
  /** The main label text */
  label?: string | ReactNode;

  /** Whether to hide the label visually (still available for screen readers) */
  hideLabel?: boolean;

  /** Text to display when the component is empty or has no selection */
  placeholder?: string;
}

/**
 * Props for components with error states
 */
export interface ErrorComponentProps {
  /** Whether the component has an error */
  hasError?: boolean;

  /** Error message to display */
  errorMessage?: string | ReactNode;
}

/**
 * Props for components with a responsive behavior
 */
export interface ResponsiveComponentProps {
  /** Hide component below this breakpoint */
  hideBelow?: string;

  /** Hide component above this breakpoint */
  hideAbove?: string;
}

/**
 * Props for layoutable components
 */
export interface LayoutComponentProps {
  /** Margin on all sides using theme spacing values */
  margin?: ThemeSpacing;

  /** Margin top using theme spacing values */
  marginTop?: ThemeSpacing;

  /** Margin right using theme spacing values */
  marginRight?: ThemeSpacing;

  /** Margin bottom using theme spacing values */
  marginBottom?: ThemeSpacing;

  /** Margin left using theme spacing values */
  marginLeft?: ThemeSpacing;

  /** Padding on all sides using theme spacing values */
  padding?: ThemeSpacing;

  /** Padding top using theme spacing values */
  paddingTop?: ThemeSpacing;

  /** Padding right using theme spacing values */
  paddingRight?: ThemeSpacing;

  /** Padding bottom using theme spacing values */
  paddingBottom?: ThemeSpacing;

  /** Padding left using theme spacing values */
  paddingLeft?: ThemeSpacing;

  /** Sets the display property */
  display?: 'block' | 'inline' | 'inline-block' | 'flex' | 'grid' | 'none';

  /** Sets the position property */
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';

  /** Whether the component should take up the full width of its container */
  fullWidth?: boolean;
}

/**
 * Props for text components
 */
export interface TextComponentProps extends ColorProps {
  /** Font size from theme */
  fontSize?: ThemeFontSize;

  /** Font weight */
  fontWeight?: 'normal' | 'bold' | 'light' | 'medium' | 'semibold';

  /** Text alignment */
  textAlign?: 'left' | 'center' | 'right' | 'justify';

  /** Whether text should be truncated with ellipsis */
  truncate?: boolean;

  /** Text transform */
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
}

/**
 * Type guard for checking if a value is a valid ComponentSize
 */
export function isComponentSize(value: unknown): value is ComponentSize {
  return typeof value === 'string' && Object.values(ComponentSize).includes(value as ComponentSize);
}

/**
 * Type guard for checking if a value is a valid ComponentVariant
 */
export function isComponentVariant(value: unknown): value is ComponentVariant {
  return (
    typeof value === 'string' && Object.values(ComponentVariant).includes(value as ComponentVariant)
  );
}

/**
 * Type guard for checking if a value is a valid ComponentState
 */
export function isComponentState(value: unknown): value is ComponentState {
  return (
    typeof value === 'string' && Object.values(ComponentState).includes(value as ComponentState)
  );
}
