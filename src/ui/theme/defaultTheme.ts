/**
 * @context: ui-theme-system
 * 
 * Default theme implementation for the Galactic Sprawl UI
 */

import { Theme } from '../../types/ui/ThemeTypes';

/**
 * Default theme for the application
 */
export const defaultTheme: Theme = {
  colors: {
    // Primary colors - blue with futuristic space theme
    primary: '#2563EB',
    primaryLight: '#3B82F6',
    primaryDark: '#1D4ED8',
    
    // Secondary colors - purple for alien technologies
    secondary: '#7C3AED',
    secondaryLight: '#8B5CF6',
    secondaryDark: '#6D28D9',
    
    // Accent colors - teal for energy and tech
    accent: '#06B6D4',
    accentLight: '#22D3EE',
    accentDark: '#0891B2',
    
    // Feedback colors
    success: '#10B981', // emerald
    warning: '#F59E0B', // amber
    error: '#EF4444',   // red
    info: '#3B82F6',    // blue
    
    // Neutral colors - dark space theme
    background: '#0F172A', // dark blue/slate
    surface: '#1E293B',    // slate
    surfaceMedium: '#334155', // slate
    surfaceDark: '#0F172A',  // dark slate
    
    // Text colors
    textPrimary: '#F8FAFC',   // very light slate
    textSecondary: '#94A3B8', // lighter slate
    textDisabled: '#64748B',  // slate
  },
  
  spacing: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  fonts: {
    family: {
      primary: "'Exo 2', sans-serif", // Futuristic font
      mono: "'IBM Plex Mono', monospace",
    },
    size: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      md: '1rem',      // 16px
      lg: '1.125rem',  // 18px
      xl: '1.25rem',   // 20px
      xxl: '1.5rem',   // 24px
    },
    weight: {
      light: 300,
      regular: 400,
      medium: 500,
      bold: 700,
    },
  },
  
  borders: {
    radius: {
      none: '0',
      sm: '4px',
      md: '8px',
      lg: '12px',
      pill: '999px',
      circle: '50%',
    },
    width: {
      none: '0',
      thin: '1px',
      medium: '2px',
      thick: '4px',
    },
  },
  
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modal: 40,
    popover: 50,
    tooltip: 60,
  },
  
  animations: {
    duration: {
      instant: '0ms',
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  breakpoints: {
    xs: '0px',
    sm: '600px',
    md: '960px',
    lg: '1280px',
    xl: '1920px',
  },
};

/**
 * Light theme variant
 */
export const lightTheme: Theme = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    // Invert the color scheme for light mode
    background: '#F8FAFC', // very light slate
    surface: '#F1F5F9',    // light slate
    surfaceMedium: '#E2E8F0', // lighter slate
    surfaceDark: '#CBD5E1',  // light slate
    
    // Text colors
    textPrimary: '#0F172A',   // dark slate
    textSecondary: '#334155', // slate
    textDisabled: '#64748B',  // slate
  }
};

/**
 * Export the default dark theme as default
 */
export default defaultTheme; 