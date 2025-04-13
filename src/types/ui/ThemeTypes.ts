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
  combatNING = 'warning',
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
  ACCENT = 'accent',
}

/**
 * Theme mode options (light, dark, or system preference)
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Theme context value interface
 */
export interface ThemeContextValue {
  /**
   * Current theme object
   */
  theme: Theme;

  /**
   * Current theme mode
   */
  mode: ThemeMode;

  /**
   * Function to set the theme mode
   */
  setMode: (mode: ThemeMode) => void;
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
  DISPLAY3 = 'display3',
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
  XXLARGE = 'xxlarge',
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
  FULL = 'full',
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
  XXL = 'xxl',
}

/**
 * Theme interface defining the structure of the theme
 */
export interface Theme {
  name: string;
  colors: Record<ThemeColorName, PaletteColor | string> & Record<string, PaletteColor | string | Record<string, string>>;
  typography: {
    fontFamily: {
      base: string;
      heading: string;
      monospace: string;
    };
    fontSizes: Record<ThemeFontSizeName, string>;
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
  spacing: Record<ThemeSpacingName, string | number>;
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
    radius: Record<ThemeBorderRadius, string>;
  };
  shadows: Record<string, string>;
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
  zIndices: Record<string, number>;
  breakpoints: Record<ThemeBreakpoint, string>;
  components?: Record<string, unknown>;
}

/**
 * Type guard for checking if a value is a valid ThemeColorName
 */
export function isThemeColorName(value: unknown): value is ThemeColorName {
  return (
    typeof value === 'string' && Object.values(ThemeColorName).includes(value as ThemeColorName)
  );
}

/**
 * Type guard for checking if a value is a valid ThemeFontSizeName
 */
export function isThemeFontSizeName(value: unknown): value is ThemeFontSizeName {
  return (
    typeof value === 'string' &&
    Object.values(ThemeFontSizeName).includes(value as ThemeFontSizeName)
  );
}

/**
 * Type guard for checking if a value is a valid ThemeSpacingName
 */
export function isThemeSpacingName(value: unknown): value is ThemeSpacingName {
  return (
    typeof value === 'string' && Object.values(ThemeSpacingName).includes(value as ThemeSpacingName)
  );
}

/**
 * Type guard for checking if a value is a valid ThemeBorderRadius
 */
export function isThemeBorderRadius(value: unknown): value is ThemeBorderRadius {
  return (
    typeof value === 'string' &&
    Object.values(ThemeBorderRadius).includes(value as ThemeBorderRadius)
  );
}

/**
 * Type guard for checking if a value is a valid ThemeBreakpoint
 */
export function isThemeBreakpoint(value: unknown): value is ThemeBreakpoint {
  return (
    typeof value === 'string' && Object.values(ThemeBreakpoint).includes(value as ThemeBreakpoint)
  );
}

/**
 * Safely extracts a color value from the theme
 */
export function getThemeColor(theme: Theme, color: ThemeColor, fallback?: string): string {
  if (!color) {
    return fallback ?? '';
  }

  // Handle direct color name
  if (isThemeColorName(color)) {
    const themeColorValue = theme.colors[color];
    return typeof themeColorValue === 'object' && themeColorValue !== null && 'main' in themeColorValue ? 
           themeColorValue.main ?? fallback ?? '' : 
           typeof themeColorValue === 'string' ? 
           themeColorValue ?? fallback ?? '' : 
           fallback ?? '';
  }

  // Handle color with intensity (e.g., 'primary.500')
  const [colorName, intensity] = color.split('.');
  if (colorName && intensity && typeof theme.colors[colorName] === 'object') {
    const paletteColor = theme.colors[colorName] as PaletteColor;
    return paletteColor[intensity] ?? fallback ?? '';
  }

  // Return the raw value if it doesn't match pattern
  return color;
}

/**
 * Specifies color configurations for different alert severities.
 */
export interface AlertColors {
  // Use Record type instead of index signature
  default: Record<ThemeColorName, string>;
  success: Record<ThemeColorName, string>;
  warning: Record<ThemeColorName, string>;
  error: Record<ThemeColorName, string>;
  info: Record<ThemeColorName, string>;
}

/**
 * Defines the structure for the theme's color palette.
 */
export interface ColorPalette {
  mode: 'light' | 'dark';
  primary: PaletteColor;
  secondary: PaletteColor;
  error: PaletteColor;
  warning: PaletteColor;
  info: PaletteColor;
  success: PaletteColor;
  background: {
    default: string;
    paper: string;
  };
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    hint?: string; // Made optional
  };
  // Use Record type instead of index signature
  custom?: Record<string, string>;
}

/**
 * Defines the overall structure for a theme configuration object.
 */
export interface ThemeConfiguration {
  name: string;
  palette: ColorPalette;
  typography: {
    fontFamily: string;
    // Use Record type instead of index signature
    fontSize: Record<ThemeFontSize, string>;
  };
  spacing: (factor: number) => string;
  breakpoints: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  shadows: string[];
  components?: Record<string, unknown>; // Allow any component overrides
}

import { defaultTheme } from '../../ui/theme/defaultTheme';

// Update deepMergePalette signature and logic
function deepMergePalette(base: Theme['colors'], overrides: Partial<Theme['colors']>): Theme['colors'] {
  // Clone the base object to avoid modifying it directly
  const merged = JSON.parse(JSON.stringify(base)); 

  for (const key in overrides) {
    if (Object.prototype.hasOwnProperty.call(overrides, key)) {
      const overrideValue = overrides[key];
      const baseValue = base[key];

      // Check if both values are plain objects suitable for deep merge
      const isPlainObject = (val: unknown): val is Record<string, unknown> => 
        typeof val === 'object' && val !== null && !Array.isArray(val) && val.constructor === Object;

      if (isPlainObject(overrideValue) && isPlainObject(baseValue)) {
        // Recursively merge nested objects
        merged[key] = deepMergePalette(baseValue, overrideValue);
      } else if (overrideValue !== undefined) {
        // Override primitive values or replace non-plain objects/arrays
        merged[key] = overrideValue;
      }
    }
  }
  return merged;
}

// Update createTheme signature and logic
export function createTheme(config: Partial<Theme> = {}): Theme {
  const baseTheme = defaultTheme; // Use imported default theme constant (type Theme)

  // Deep merge palettes
  const mergedPalette = deepMergePalette(baseTheme.colors, config.colors ?? {});

  // Construct the theme, ensuring types match Theme
  const mergedTheme: Theme = {
    // Merge top-level properties
    ...baseTheme,
    ...config,
    // Deep merge nested structures explicitly
    name: config.name ?? baseTheme.name,
    colors: mergedPalette,
    typography: {
      ...baseTheme.typography,
      ...(config.typography ?? {}),
      fontFamily: { ...baseTheme.typography.fontFamily, ...(config.typography?.fontFamily ?? {}) },
      fontSizes: { ...baseTheme.typography.fontSizes, ...(config.typography?.fontSizes ?? {}) },
      fontWeights: { ...baseTheme.typography.fontWeights, ...(config.typography?.fontWeights ?? {}) },
      lineHeights: { ...baseTheme.typography.lineHeights, ...(config.typography?.lineHeights ?? {}) },
      letterSpacings: { ...baseTheme.typography.letterSpacings, ...(config.typography?.letterSpacings ?? {}) },
    },
    spacing: { ...baseTheme.spacing, ...(config.spacing ?? {}) },
    sizes: {
       ...baseTheme.sizes,
       ...(config.sizes ?? {}),
       modalWidth: { ...baseTheme.sizes.modalWidth, ...(config.sizes?.modalWidth ?? {}) },
     },
    borders: {
       ...baseTheme.borders,
       ...(config.borders ?? {}),
       width: { ...baseTheme.borders.width, ...(config.borders?.width ?? {}) },
       radius: { ...baseTheme.borders.radius, ...(config.borders?.radius ?? {}) },
     },
    shadows: { ...baseTheme.shadows, ...(config.shadows ?? {}) },
    transitions: {
       ...baseTheme.transitions,
       ...(config.transitions ?? {}),
       duration: { ...baseTheme.transitions.duration, ...(config.transitions?.duration ?? {}) },
       timing: { ...baseTheme.transitions.timing, ...(config.transitions?.timing ?? {}) },
     },
    zIndices: { ...baseTheme.zIndices, ...(config.zIndices ?? {}) },
    breakpoints: { ...baseTheme.breakpoints, ...(config.breakpoints ?? {}) },
    components: { ...baseTheme.components, ...(config.components ?? {}) },
  };
  return mergedTheme;
}

// Update generateThemeCSSVariables signature
export function generateThemeCSSVariables(theme: Theme): Record<string, string> {
  const variables: Record<string, string> = {};
  const colors = theme.colors;

  // Palette colors
  Object.keys(colors).forEach(key => {
    const colorKey = key;
    const value = colors[colorKey];

    if (typeof value === 'string') {
      variables[`--color-${key}`] = value;
    } else if (typeof value === 'object' && value !== null && 'main' in value) {
      // Handle PaletteColor objects
      const paletteColor = value as PaletteColor;
      Object.keys(paletteColor).forEach(shadeKey => {
        const colorValue = paletteColor[shadeKey];
        // Add check for undefined before assignment (Fix Line 444)
        if (colorValue !== undefined) {
          variables[`--color-${key}-${shadeKey}`] = colorValue;
        }
      });
    } else if (key === 'background' || key === 'text') { // Assuming these are Record<string, string>
      const nestedObj = value; 
      Object.keys(nestedObj).forEach(nestedKey => {
        if (nestedObj[nestedKey] !== undefined) { 
           variables[`--color-${key}-${nestedKey}`] = nestedObj[nestedKey];
        }
      });
    }
    // Handle other potential nested color objects if necessary
  });

  // Custom colors are handled by the loop above if they are part of theme.colors

  // Typography
  if (theme.typography) {
    if (theme.typography.fontFamily) {
        Object.entries(theme.typography.fontFamily).forEach(([key, value]) => {
            if (value !== undefined) { variables[`--font-family-${key}`] = value; }
        });
    }
    if (theme.typography.fontSizes) {
      Object.entries(theme.typography.fontSizes).forEach(([key, value]) => {
        if (value !== undefined) { variables[`--font-size-${key}`] = value; }
      });
    }
     // Add similar loops for fontWeights, lineHeights, letterSpacings
     if (theme.typography.fontWeights) {
        Object.entries(theme.typography.fontWeights).forEach(([key, value]) => {
            if (value !== undefined) { variables[`--font-weight-${key}`] = String(value); } // Convert number to string
        });
     }
     if (theme.typography.lineHeights) {
         Object.entries(theme.typography.lineHeights).forEach(([key, value]) => {
             if (value !== undefined) { variables[`--line-height-${key}`] = String(value); } // Convert number to string
         });
     }
     if (theme.typography.letterSpacings) {
         Object.entries(theme.typography.letterSpacings).forEach(([key, value]) => {
             if (value !== undefined) { variables[`--letter-spacing-${key}`] = value; }
         });
     }
  }

  // Spacing
  if (theme.spacing) {
     Object.entries(theme.spacing).forEach(([key, value]) => {
       if (value !== undefined) { variables[`--spacing-${key}`] = typeof value === 'number' ? `${value}px` : value; }
     });
  }

  // Breakpoints
  if (theme.breakpoints) {
     Object.entries(theme.breakpoints).forEach(([key, value]) => {
       if (value !== undefined) { variables[`--breakpoint-${key}`] = value; } // Already strings
     });
  }

  // Shadows
  if (theme.shadows) {
      Object.entries(theme.shadows).forEach(([key, value]) => {
         if (value !== undefined) { variables[`--shadow-${key}`] = value; }
       });
  }

  // Add Borders, Transitions, zIndices, Sizes if needed
  // ... (similar loops with undefined checks) ...

  return variables;
}

// Refine ThemeColorShade type definition
export type ThemeColorShade = 'main' | 'light' | 'dark' | 'contrastText';

// PaletteColor definition
export interface PaletteColor {
  main: string;
  light?: string;
  dark?: string;
  contrastText?: string;
  [key: string]: string | undefined;
}

