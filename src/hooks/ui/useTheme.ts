/**
 * @context: ui-theme-system, ui-hook-system
 * 
 * Theme utility hooks for working with the theme system
 */

import { useContext, useMemo } from 'react';
import ThemeContext from '../../contexts/ThemeContext';
import { Theme, ThemeMode } from '../../types/ui/ThemeTypes';

/**
 * Hook for accessing specific theme colors
 * @returns Object with color accessor functions
 */
export function useThemeColors() {
  const { theme } = useContext(ThemeContext);
  
  return useMemo(() => ({
    /**
     * Get a specific color from the theme
     * @param colorPath Path to the color (e.g., 'primary', 'error')
     * @returns The color value
     */
    getColor: (colorPath: keyof Theme['colors']): string => {
      return theme.colors[colorPath];
    },
    
    /**
     * Get a color with specified opacity
     * @param colorPath Path to the color
     * @param opacity Opacity value (0-1)
     * @returns The color with opacity applied
     */
    getColorWithOpacity: (colorPath: keyof Theme['colors'], opacity: number): string => {
      const color = theme.colors[colorPath];
      
      // Convert hex to rgba
      if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
      
      // If already rgba, replace the opacity
      if (color.startsWith('rgba')) {
        return color.replace(/[\d.]+\)$/g, `${opacity})`);
      }
      
      // If rgb, convert to rgba
      if (color.startsWith('rgb')) {
        return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
      }
      
      // For other formats, just return the original color
      return color;
    },
    
    /**
     * Get all colors from the theme
     * @returns Object with all colors
     */
    getAllColors: (): Theme['colors'] => {
      return { ...theme.colors };
    }
  }), [theme.colors]);
}

/**
 * Hook for accessing theme spacing values
 * @returns Object with spacing accessor functions
 */
export function useThemeSpacing() {
  const { theme } = useContext(ThemeContext);
  
  return useMemo(() => ({
    /**
     * Get a specific spacing value
     * @param key Spacing key (e.g., 'sm', 'md')
     * @returns The spacing value in pixels
     */
    getSpacing: (key: keyof Theme['spacing']): number => {
      return theme.spacing[key];
    },
    
    /**
     * Get spacing in pixel string format
     * @param key Spacing key
     * @returns The spacing value as a pixel string (e.g., '8px')
     */
    getSpacingPx: (key: keyof Theme['spacing']): string => {
      return `${theme.spacing[key]}px`;
    },
    
    /**
     * Get spacing with multiplier
     * @param key Spacing key
     * @param multiplier Value to multiply spacing by
     * @returns The multiplied spacing value
     */
    getSpacingMultiple: (key: keyof Theme['spacing'], multiplier: number): number => {
      return theme.spacing[key] * multiplier;
    },
    
    /**
     * Get spacing with multiplier in pixel string format
     * @param key Spacing key
     * @param multiplier Value to multiply spacing by
     * @returns The multiplied spacing value as a pixel string
     */
    getSpacingMultiplePx: (key: keyof Theme['spacing'], multiplier: number): string => {
      return `${theme.spacing[key] * multiplier}px`;
    },
  }), [theme.spacing]);
}

/**
 * Hook for accessing theme breakpoints and responsive values
 * @returns Object with breakpoint accessor functions
 */
export function useThemeBreakpoints() {
  const { theme } = useContext(ThemeContext);
  
  return useMemo(() => ({
    /**
     * Get a specific breakpoint value
     * @param key Breakpoint key (e.g., 'sm', 'md')
     * @returns The breakpoint value
     */
    getBreakpoint: (key: keyof Theme['breakpoints']): string => {
      return theme.breakpoints[key];
    },
    
    /**
     * Get numeric value of breakpoint
     * @param key Breakpoint key
     * @returns The breakpoint value as a number
     */
    getBreakpointValue: (key: keyof Theme['breakpoints']): number => {
      const value = theme.breakpoints[key];
      return parseInt(value.replace('px', ''), 10);
    },
    
    /**
     * Create a media query string for the specified breakpoint
     * @param key Breakpoint key
     * @param direction 'up' (min-width) or 'down' (max-width)
     * @returns Media query string
     */
    getMediaQuery: (
      key: keyof Theme['breakpoints'], 
      direction: 'up' | 'down' = 'up'
    ): string => {
      const value = theme.breakpoints[key];
      if (direction === 'up') {
        return `@media (min-width: ${value})`;
      } else {
        return `@media (max-width: ${value})`;
      }
    },
  }), [theme.breakpoints]);
}

/**
 * Hook for accessing theme animation values
 * @returns Object with animation accessor functions
 */
export function useThemeAnimations() {
  const { theme } = useContext(ThemeContext);
  
  return useMemo(() => ({
    /**
     * Get a specific animation duration
     * @param key Duration key (e.g., 'fast', 'normal')
     * @returns The duration value
     */
    getDuration: (key: keyof Theme['animations']['duration']): string => {
      return theme.animations.duration[key];
    },
    
    /**
     * Get a specific easing function
     * @param key Easing key (e.g., 'easeIn', 'easeOut')
     * @returns The easing function
     */
    getEasing: (key: keyof Theme['animations']['easing']): string => {
      return theme.animations.easing[key];
    },
    
    /**
     * Get a complete transition value
     * @param property CSS property to transition
     * @param durationKey Duration key
     * @param easingKey Easing key
     * @returns Complete transition value
     */
    getTransition: (
      property: string,
      durationKey: keyof Theme['animations']['duration'] = 'normal',
      easingKey: keyof Theme['animations']['easing'] = 'easeInOut'
    ): string => {
      return `${property} ${theme.animations.duration[durationKey]} ${theme.animations.easing[easingKey]}`;
    },
  }), [theme.animations]);
}

/**
 * Helper hook for accessing all theme functionality in one place
 * @returns Consolidated theme utilities
 */
export function useThemeUtils() {
  const themeContext = useContext(ThemeContext);
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const breakpoints = useThemeBreakpoints();
  const animations = useThemeAnimations();
  
  return useMemo(() => ({
    // Basic theme context
    theme: themeContext.theme,
    mode: themeContext.mode,
    setMode: themeContext.setMode,
    
    // Specialized helpers
    colors,
    spacing,
    breakpoints,
    animations,
    
    // Additional utility functions
    isDarkMode: themeContext.mode === 'dark' || 
               (themeContext.mode === 'system' && 
                window.matchMedia('(prefers-color-scheme: dark)').matches),
    
    isLightMode: themeContext.mode === 'light' || 
                (themeContext.mode === 'system' && 
                 window.matchMedia('(prefers-color-scheme: light)').matches)
  }), [themeContext, colors, spacing, breakpoints, animations]);
}

/**
 * Default export for main theme hook
 */
export default useThemeUtils; 