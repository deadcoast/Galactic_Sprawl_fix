/**
 * @context: ui-system, type-definitions, ui-component-library
 * 
 * Type guards for UI-related types
 */

import { ComponentSize, ComponentVariant, ComponentState } from './ComponentTypes';
import { 
  ThemeColorName, 
  ThemeFontSizeName, 
  ThemeSpacingName, 
  ThemeBorderRadius, 
  ThemeBreakpoint,
  Theme
} from './ThemeTypes';
import { UIEventType, UIEvent } from './EventTypes';

/**
 * Type guard for checking if a value is a valid UIEventType
 */
export function isUIEventType(value: unknown): value is UIEventType {
  return typeof value === 'string' && Object.values(UIEventType).includes(value as UIEventType);
}

/**
 * Type guard for checking if a value has base component props
 */
export function hasBaseComponentProps(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  
  // Check for required or typical component props
  return (
    // At least one of these common props should be present
    'className' in obj ||
    'style' in obj ||
    'id' in obj ||
    'disabled' in obj ||
    'children' in obj ||
    'onClick' in obj
  );
}

/**
 * Type guard for checking if a value has a valid color prop
 */
export function hasValidColorProp(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  
  if (!('color' in obj)) return false;
  
  const color = obj.color;
  
  // Color can be a ThemeColorName enum value or a string
  return (
    color === undefined ||
    typeof color === 'string' || 
    Object.values(ThemeColorName).includes(color as ThemeColorName)
  );
}

/**
 * Type guard for checking if a value has a valid size prop
 */
export function hasValidSizeProp(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  
  if (!('size' in obj)) return false;
  
  const size = obj.size;
  
  // Size can be a ComponentSize enum value or a string
  return (
    size === undefined ||
    typeof size === 'string' || 
    Object.values(ComponentSize).includes(size as ComponentSize)
  );
}

/**
 * Type guard for checking if a value has a valid variant prop
 */
export function hasValidVariantProp(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  
  if (!('variant' in obj)) return false;
  
  const variant = obj.variant;
  
  // Variant can be a ComponentVariant enum value or a string
  return (
    variant === undefined ||
    typeof variant === 'string' || 
    Object.values(ComponentVariant).includes(variant as ComponentVariant)
  );
}

/**
 * Type guard for checking if a value is a valid CSS property name
 */
export function isValidCSSPropertyName(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  
  // Simple check for common CSS properties - this is not exhaustive
  const commonCSSProperties = [
    'color', 'background', 'margin', 'padding', 'border',
    'display', 'position', 'top', 'right', 'bottom', 'left',
    'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
    'font', 'font-size', 'font-weight', 'text-align', 'line-height',
    'flex', 'grid', 'transform', 'transition', 'animation',
    'opacity', 'visibility', 'z-index', 'overflow'
  ];
  
  return (
    commonCSSProperties.includes(value) ||
    /^[a-zA-Z][\w-]*$/.test(value) // General CSS property name pattern
  );
}

/**
 * Type guard for checking if a value is a valid CSS style object
 */
export function isValidStyleObject(value: unknown): value is React.CSSProperties {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  
  // Check a few random keys to see if they look like CSS properties
  const keys = Object.keys(obj);
  
  if (keys.length === 0) return true; // Empty style object is valid
  
  // Check at least some of the keys are valid CSS properties
  return keys.some(key => {
    // Convert camelCase to kebab-case for checking
    const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    return isValidCSSPropertyName(kebabKey);
  });
}

/**
 * Type guard for checking if a value is a valid layout prop
 */
export function isValidLayoutProp(prop: string): boolean {
  const layoutProps = [
    'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'display', 'position', 'width', 'height', 'maxWidth', 'maxHeight',
    'minWidth', 'minHeight', 'top', 'right', 'bottom', 'left',
    'flex', 'flexDirection', 'flexWrap', 'justifyContent', 'alignItems',
    'alignContent', 'order', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf',
    'grid', 'gridTemplate', 'gridTemplateRows', 'gridTemplateColumns',
    'gridTemplateAreas', 'gridAutoRows', 'gridAutoColumns', 'gridAutoFlow',
    'gridRow', 'gridColumn', 'gridArea',
    'gap', 'rowGap', 'columnGap'
  ];
  
  return layoutProps.includes(prop);
}

/**
 * Type guard for checking if a value is a valid theme object
 */
export function isValidTheme(value: unknown): value is Theme {
  if (!value || typeof value !== 'object') return false;
  
  const theme = value as Partial<Theme>;
  
  // Check for required theme properties
  return (
    typeof theme.name === 'string' &&
    !!theme.colors &&
    !!theme.typography &&
    !!theme.spacing &&
    !!theme.breakpoints
  );
}

/**
 * Type guard for checking if a value is a valid React event handler
 */
export function isEventHandler(value: unknown): value is (event: React.SyntheticEvent) => void {
  if (typeof value !== 'function') return false;
  
  // Check if the property name follows React event handler pattern
  return true;
}

/**
 * Type guard for checking if a property name is a React event handler prop
 */
export function isEventHandlerProp(propName: string): boolean {
  return /^on[A-Z]/.test(propName);
}

/**
 * Type guard for checking if a value is a valid React element
 */
export function isReactElement(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  
  return (
    '$$typeof' in obj &&
    typeof obj.type !== 'undefined' &&
    'props' in obj &&
    typeof obj.props === 'object'
  );
}

/**
 * Type guard for checking if a value is a valid responsive prop - one that changes based on breakpoint
 */
export function isResponsiveProp(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  
  // Check if the object has breakpoint keys
  const hasBreakpointKeys = Object.keys(obj).some(key => 
    Object.values(ThemeBreakpoint).includes(key as ThemeBreakpoint)
  );
  
  return hasBreakpointKeys;
}

/**
 * Type guard for checking if a value is a valid aria attribute
 */
export function isAriaAttribute(propName: string): boolean {
  return /^aria-[a-z]+$/.test(propName);
}

/**
 * Type guard for checking if a value is a valid data attribute
 */
export function isDataAttribute(propName: string): boolean {
  return /^data-[a-z-]+$/.test(propName);
}

/**
 * Safely extracts a color value from props
 */
export function extractColorProp(props: Record<string, unknown>, defaultColor?: string): string | undefined {
  if (!('color' in props)) return defaultColor;
  
  const color = props.color;
  
  if (color === undefined) return defaultColor;
  if (typeof color !== 'string') return defaultColor;
  
  return color;
}

/**
 * Safely extracts a size value from props
 */
export function extractSizeProp(props: Record<string, unknown>, defaultSize?: ComponentSize): ComponentSize | undefined {
  if (!('size' in props)) return defaultSize;
  
  const size = props.size;
  
  if (size === undefined) return defaultSize;
  
  if (typeof size === 'string' && Object.values(ComponentSize).includes(size as ComponentSize)) {
    return size as ComponentSize;
  }
  
  return defaultSize;
}

/**
 * Safely extracts a variant value from props
 */
export function extractVariantProp(props: Record<string, unknown>, defaultVariant?: ComponentVariant): ComponentVariant | undefined {
  if (!('variant' in props)) return defaultVariant;
  
  const variant = props.variant;
  
  if (variant === undefined) return defaultVariant;
  
  if (typeof variant === 'string' && Object.values(ComponentVariant).includes(variant as ComponentVariant)) {
    return variant as ComponentVariant;
  }
  
  return defaultVariant;
} 