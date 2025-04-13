/**
 * @context: ui-theme-system
 *
 * Default theme implementation for the Galactic Sprawl UI
 */

import {
  Theme,
  ThemeBorderRadius,
  ThemeBreakpoint,
  ThemeColorName,
  ThemeFontSizeName,
  ThemeSpacingName,
} from '../../types/ui/ThemeTypes';

/**
 * Default theme for the application
 */
export const defaultTheme: Theme = {
  name: 'Galactic Sprawl Default Theme',
  colors: {
    // Primary palette
    [ThemeColorName.PRIMARY]: '#2563EB',
    [ThemeColorName.SECONDARY]: '#7C3AED',
    [ThemeColorName.ACCENT]: '#06B6D4',

    // Status colors
    [ThemeColorName.SUCCESS]: '#10B981',
    [ThemeColorName.combatNING]: '#F59E0B',
    [ThemeColorName.DANGER]: '#EF4444',
    [ThemeColorName.INFO]: '#3B82F6',

    // UI theme colors
    [ThemeColorName.LIGHT]: '#F8FAFC',
    [ThemeColorName.DARK]: '#0F172A',
    [ThemeColorName.BACKGROUND]: '#0F172A',
    [ThemeColorName.SURFACE]: '#1E293B',
    [ThemeColorName.TEXT]: '#F8FAFC',
    [ThemeColorName.TEXT_SECONDARY]: '#94A3B8',
    [ThemeColorName.BORDER]: '#334155',
    [ThemeColorName.HIGHLIGHT]: '#3B82F6',

    // Extended colors (these are allowed by the Record<string, string> part of the type)
    primaryLight: '#3B82F6',
    primaryDark: '#1D4ED8',
    secondaryLight: '#8B5CF6',
    secondaryDark: '#6D28D9',
    accentLight: '#22D3EE',
    accentDark: '#0891B2',
    surfaceMedium: '#334155',
    surfaceDark: '#0F172A',
    textDisabled: '#64748B',
  },

  typography: {
    fontFamily: {
      base: "'Exo 2', sans-serif",
      heading: "'Exo 2', sans-serif",
      monospace: "'IBM Plex Mono', monospace",
    },
    fontSizes: {
      [ThemeFontSizeName.XSMALL]: '0.75rem',
      [ThemeFontSizeName.SMALL]: '0.875rem',
      [ThemeFontSizeName.MEDIUM]: '1rem',
      [ThemeFontSizeName.LARGE]: '1.125rem',
      [ThemeFontSizeName.XLARGE]: '1.25rem',
      [ThemeFontSizeName.XXLARGE]: '1.5rem',
      [ThemeFontSizeName.DISPLAY1]: '2rem',
      [ThemeFontSizeName.DISPLAY2]: '2.5rem',
      [ThemeFontSizeName.DISPLAY3]: '3rem',
    },
    fontWeights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.8,
    },
    letterSpacings: {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
    },
  },

  spacing: {
    [ThemeSpacingName.NONE]: 0,
    [ThemeSpacingName.XSMALL]: 4,
    [ThemeSpacingName.SMALL]: 8,
    [ThemeSpacingName.MEDIUM]: 16,
    [ThemeSpacingName.LARGE]: 24,
    [ThemeSpacingName.XLARGE]: 32,
    [ThemeSpacingName.XXLARGE]: 48,
  },

  sizes: {
    maxWidth: '1200px',
    navbarHeight: '64px',
    sidebarWidth: '280px',
    modalWidth: {
      small: '400px',
      medium: '600px',
      large: '800px',
    },
  },

  borders: {
    radius: {
      [ThemeBorderRadius.NONE]: '0',
      [ThemeBorderRadius.SMALL]: '4px',
      [ThemeBorderRadius.MEDIUM]: '8px',
      [ThemeBorderRadius.LARGE]: '12px',
      [ThemeBorderRadius.FULL]: '9999px',
    },
    width: {
      none: 0,
      thin: 1,
      medium: 2,
      thick: 4,
    },
  },

  shadows: {
    none: 'none',
    small: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    large: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },

  transitions: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    timing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  zIndices: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modal: 40,
    tooltip: 50,
    toast: 60,
  },

  breakpoints: {
    [ThemeBreakpoint.XS]: '0px',
    [ThemeBreakpoint.SM]: '600px',
    [ThemeBreakpoint.MD]: '960px',
    [ThemeBreakpoint.LG]: '1280px',
    [ThemeBreakpoint.XL]: '1920px',
    [ThemeBreakpoint.XXL]: '2560px',
  },
};

/**
 * Light theme variant
 */
export const lightTheme: Theme = {
  ...defaultTheme,
  name: 'Galactic Sprawl Light Theme',
  colors: {
    ...defaultTheme.colors,
    // Override dark theme values with light theme values
    [ThemeColorName.BACKGROUND]: '#F8FAFC',
    [ThemeColorName.SURFACE]: '#F1F5F9',
    [ThemeColorName.TEXT]: '#0F172A',
    [ThemeColorName.TEXT_SECONDARY]: '#334155',

    // Extended colors
    surfaceMedium: '#E2E8F0',
    surfaceDark: '#CBD5E1',
    textDisabled: '#64748B',
  },
};

/**
 * Export the default dark theme as default
 */
export default defaultTheme;
