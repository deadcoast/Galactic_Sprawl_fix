/**
 * @context: ui-system, type-definitions, ui-theme-system
 * 
 * Theme-related type definitions for the UI system
 */

/**
 * Semantic color names available in the theme
 */
export enum ThemeColorName {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  SUCCESS = 'success',
  WARNING = 'warning',
  DANGER = 'danger',
  INFO = 'info',
  LIGHT = 'light',
  DARK = 'dark',
  BACKGROUND = 'background',
  SURFACE = 'surface',
  TEXT = 'text',
  TEXT_SECONDARY = 'textSecondary',
  BORDER = 'border',
  HIGHLIGHT = 'highlight',
  ACCENT = 'accent'
}

/**
 * Valid font size names within the theme
 */
export enum ThemeFontSizeName {
  XSMALL = 'xsmall',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  XLARGE = 'xlarge',
  XXLARGE = 'xxlarge',
  DISPLAY1 = 'display1',
  DISPLAY2 = 'display2',
  DISPLAY3 = 'display3'
}

/**
 * Valid spacing scale values within the theme
 */
export enum ThemeSpacingName {
  NONE = 'none',
  XSMALL = 'xsmall',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  XLARGE = 'xlarge',
  XXLARGE = 'xxlarge'
}

/**
 * Theme type definitions
 */

/** 
 * Theme color can be a direct color name or a token with intensity
 * e.g., 'primary', 'primary.500', 'text', etc.
 */
export type ThemeColor = string | ThemeColorName;

/**
 * Theme font size can be a direct size name or a predefined token
 * e.g., 'medium', 'display1', etc.
 */
export type ThemeFontSize = string | ThemeFontSizeName;

/**
 * Theme spacing can be a direct spacing name or a number (in pixels)
 * e.g., 'medium', 4, etc.
 */
export type ThemeSpacing = number | string | ThemeSpacingName;

/**
 * Theme border radius values
 */
export enum ThemeBorderRadius {
  NONE = 'none',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  FULL = 'full'
}

/**
 * Theme breakpoint definitions for responsive design
 */
export enum ThemeBreakpoint {
  XS = 'xs',
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
  XL = 'xl',
  XXL = 'xxl'
}

/**
 * Theme interface defining the structure of the theme
 */
export interface Theme {
  name: string;
  colors: {
    [key in ThemeColorName]: string;
  } & {
    [key: string]: string | Record<string, string>;
  };
  typography: {
    fontFamily: {
      base: string;
      heading: string;
      monospace: string;
    };
    fontSizes: {
      [key in ThemeFontSizeName]: string;
    };
    fontWeights: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeights: {
      tight: number;
      normal: number;
      relaxed: number;
    };
    letterSpacings: {
      tight: string;
      normal: string;
      wide: string;
    };
  };
  spacing: {
    [key in ThemeSpacingName]: string | number;
  };
  sizes: {
    maxWidth: string;
    navbarHeight: string;
    sidebarWidth: string;
    modalWidth: {
      small: string;
      medium: string;
      large: string;
    };
  };
  borders: {
    width: {
      none: number;
      thin: number;
      medium: number;
      thick: number;
    };
    radius: {
      [key in ThemeBorderRadius]: string;
    };
  };
  shadows: {
    none: string;
    small: string;
    medium: string;
    large: string;
  };
  transitions: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    timing: {
      linear: string;
      ease: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
  zIndices: {
    base: number;
    dropdown: number;
    sticky: number;
    fixed: number;
    modal: number;
    tooltip: number;
    toast: number;
  };
  breakpoints: {
    [key in ThemeBreakpoint]: string;
  };
}

/**
 * Type guard for checking if a value is a valid ThemeColorName
 */
export function isThemeColorName(value: unknown): value is ThemeColorName {
  return typeof value === 'string' && Object.values(ThemeColorName).includes(value as ThemeColorName);
}

/**
 * Type guard for checking if a value is a valid ThemeFontSizeName
 */
export function isThemeFontSizeName(value: unknown): value is ThemeFontSizeName {
  return typeof value === 'string' && Object.values(ThemeFontSizeName).includes(value as ThemeFontSizeName);
}

/**
 * Type guard for checking if a value is a valid ThemeSpacingName
 */
export function isThemeSpacingName(value: unknown): value is ThemeSpacingName {
  return typeof value === 'string' && Object.values(ThemeSpacingName).includes(value as ThemeSpacingName);
}

/**
 * Type guard for checking if a value is a valid ThemeBorderRadius
 */
export function isThemeBorderRadius(value: unknown): value is ThemeBorderRadius {
  return typeof value === 'string' && Object.values(ThemeBorderRadius).includes(value as ThemeBorderRadius);
}

/**
 * Type guard for checking if a value is a valid ThemeBreakpoint
 */
export function isThemeBreakpoint(value: unknown): value is ThemeBreakpoint {
  return typeof value === 'string' && Object.values(ThemeBreakpoint).includes(value as ThemeBreakpoint);
}

/**
 * Safely extracts a color value from the theme
 * @param theme The theme object
 * @param color The color token to extract
 * @param fallback Optional fallback value if color doesn't exist
 */
export function getThemeColor(theme: Theme, color: ThemeColor, fallback?: string): string {
  if (!color) return fallback || '';
  
  // Handle direct color name
  if (isThemeColorName(color)) {
    return theme.colors[color] || fallback || '';
  }
  
  // Handle color with intensity (e.g., 'primary.500')
  const [colorName, intensity] = color.split('.');
  if (
    colorName && 
    intensity && 
    typeof theme.colors[colorName] === 'object'
  ) {
    return (theme.colors[colorName] as Record<string, string>)[intensity] || fallback || '';
  }
  
  // Return the raw value if it doesn't match pattern
  return color;
} 