/**
 * @context: ui-theme-system, styles-library
 *
 * Utility functions for working with themes in CSS
 */

import { Theme } from '../types/ui/ThemeTypes';

/**
 * Generate CSS custom properties (variables) from a theme
 * @param theme Theme object
 * @param prefix Optional prefix for CSS variables
 * @returns CSS string with all theme variables
 */
export function generateThemeVariables(theme: Theme, prefix = 'gs'): string {
  const lines: string[] = [];

  // Generate color variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    lines.push(`--${prefix}-color-${key}: ${value};`);
  });

  // Generate spacing variables
  Object.entries(theme.spacing).forEach(([key, value]) => {
    lines.push(`--${prefix}-spacing-${key}: ${value}px;`);
  });

  // Generate font variables
  // Family
  Object.entries(theme.typography.fontFamily).forEach(([key, value]) => {
    lines.push(`--${prefix}-font-family-${key}: ${value};`);
  });

  // Size
  Object.entries(theme.typography.fontSizes).forEach(([key, value]) => {
    lines.push(`--${prefix}-font-size-${key}: ${value};`);
  });

  // Weight
  Object.entries(theme.typography.fontWeights).forEach(([key, value]) => {
    lines.push(`--${prefix}-font-weight-${key}: ${value};`);
  });

  // Generate border variables
  // Radius
  Object.entries(theme.borders.radius).forEach(([key, value]) => {
    lines.push(`--${prefix}-border-radius-${key}: ${value};`);
  });

  // Width
  Object.entries(theme.borders.width).forEach(([key, value]) => {
    lines.push(`--${prefix}-border-width-${key}: ${value};`);
  });

  // Generate shadow variables
  Object.entries(theme.shadows).forEach(([key, value]) => {
    lines.push(`--${prefix}-shadow-${key}: ${value};`);
  });

  // Generate animation variables
  // Duration
  Object.entries(theme.transitions.duration).forEach(([key, value]) => {
    lines.push(`--${prefix}-duration-${key}: ${value};`);
  });

  // Easing
  Object.entries(theme.transitions.timing).forEach(([key, value]) => {
    lines.push(`--${prefix}-easing-${key}: ${value};`);
  });

  // Generate z-index variables
  Object.entries(theme.zIndices).forEach(([key, value]) => {
    lines.push(`--${prefix}-z-index-${key}: ${value};`);
  });

  // Generate breakpoint variables
  Object.entries(theme.breakpoints).forEach(([key, value]) => {
    lines.push(`--${prefix}-breakpoint-${key}: ${value};`);
  });

  return `:root {\n  ${lines.join('\n  ')}\n}`;
}

/**
 * Generate CSS for color variants (hover, active, disabled)
 * @param colorKey Color key from theme
 * @param prefix CSS variable prefix
 * @returns Object with CSS variable references for the color variants
 */
export function generateColorVariants(colorKey: string, prefix = 'gs') {
  return {
    base: `var(--${prefix}-color-${colorKey})`,
    hover: `var(--${prefix}-color-${colorKey}Light)`,
    active: `var(--${prefix}-color-${colorKey}Dark)`,
    disabled: `var(--${prefix}-color-${colorKey}Light)`,
    withOpacity: (opacity: number) => `rgba(var(--${prefix}-color-${colorKey}-rgb), ${opacity})`,
  };
}

/**
 * Create utility functions for accessing theme values in CSS-in-JS
 * @param prefix CSS variable prefix
 * @returns Object with CSS variable reference functions
 */
export function createCssVarHelpers(prefix = 'gs') {
  return {
    /**
     * Get a color CSS variable reference
     * @param key Color key
     * @returns CSS variable reference
     */
    color: (key: string) => `var(--${prefix}-color-${key})`,

    /**
     * Get a spacing CSS variable reference
     * @param key Spacing key
     * @returns CSS variable reference
     */
    spacing: (key: string) => `var(--${prefix}-spacing-${key})`,

    /**
     * Get a font family CSS variable reference
     * @param key Font family key
     * @returns CSS variable reference
     */
    fontFamily: (key: string) => `var(--${prefix}-font-family-${key})`,

    /**
     * Get a font size CSS variable reference
     * @param key Font size key
     * @returns CSS variable reference
     */
    fontSize: (key: string) => `var(--${prefix}-font-size-${key})`,

    /**
     * Get a font weight CSS variable reference
     * @param key Font weight key
     * @returns CSS variable reference
     */
    fontWeight: (key: string) => `var(--${prefix}-font-weight-${key})`,

    /**
     * Get a border radius CSS variable reference
     * @param key Border radius key
     * @returns CSS variable reference
     */
    borderRadius: (key: string) => `var(--${prefix}-border-radius-${key})`,

    /**
     * Get a border width CSS variable reference
     * @param key Border width key
     * @returns CSS variable reference
     */
    borderWidth: (key: string) => `var(--${prefix}-border-width-${key})`,

    /**
     * Get a shadow CSS variable reference
     * @param key Shadow key
     * @returns CSS variable reference
     */
    shadow: (key: string) => `var(--${prefix}-shadow-${key})`,

    /**
     * Get an animation duration CSS variable reference
     * @param key Duration key
     * @returns CSS variable reference
     */
    duration: (key: string) => `var(--${prefix}-duration-${key})`,

    /**
     * Get an animation easing CSS variable reference
     * @param key Easing key
     * @returns CSS variable reference
     */
    easing: (key: string) => `var(--${prefix}-easing-${key})`,

    /**
     * Get a z-index CSS variable reference
     * @param key Z-index key
     * @returns CSS variable reference
     */
    zIndex: (key: string) => `var(--${prefix}-z-index-${key})`,

    /**
     * Get a breakpoint CSS variable reference
     * @param key Breakpoint key
     * @returns CSS variable reference
     */
    breakpoint: (key: string) => `var(--${prefix}-breakpoint-${key})`,

    /**
     * Generate a transition value
     * @param property CSS property to transition
     * @param durationKey Duration key
     * @param easingKey Easing key
     * @returns Complete transition value with CSS variables
     */
    transition: (property: string, durationKey = 'normal', easingKey = 'easeInOut') =>
      `${property} var(--${prefix}-duration-${durationKey}) var(--${prefix}-easing-${easingKey})`,
  };
}

/**
 * Create a stylesheet with theme variables
 * @param theme Theme object
 * @param prefix CSS variable prefix
 * @returns HTML style element with theme variables
 */
export function createThemeStylesheet(theme: Theme, prefix = 'gs'): HTMLStyleElement {
  const style = document.createElement('style');
  style.id = `${prefix}-theme-variables`;
  style.innerHTML = generateThemeVariables(theme, prefix);
  return style;
}

/**
 * Inject theme variables into the document head
 * @param theme Theme object
 * @param prefix CSS variable prefix
 * @returns The created style element
 */
export function injectThemeVariables(theme: Theme, prefix = 'gs'): HTMLStyleElement {
  // Remove existing theme style if present
  const existingStyle = document.getElementById(`${prefix}-theme-variables`);
  if (existingStyle) {
    existingStyle.remove();
  }

  // Create and inject new style
  const style = createThemeStylesheet(theme, prefix);
  document.head.appendChild(style);
  return style;
}

/**
 * Create CSS for responsive styles
 * @param breakpoints Theme breakpoints
 * @returns Object with media query functions
 */
export function createResponsiveHelpers(breakpoints: Theme['breakpoints']) {
  return {
    /**
     * Create a min-width media query
     * @param breakpoint Breakpoint key
     * @returns Media query string
     */
    up: (breakpoint: keyof Theme['breakpoints']) =>
      `@media (min-width: ${breakpoints[breakpoint]})`,

    /**
     * Create a max-width media query
     * @param breakpoint Breakpoint key
     * @returns Media query string
     */
    down: (breakpoint: keyof Theme['breakpoints']) =>
      `@media (max-width: ${breakpoints[breakpoint]})`,

    /**
     * Create a media query between two breakpoints
     * @param start Start breakpoint key
     * @param end End breakpoint key
     * @returns Media query string
     */
    between: (start: keyof Theme['breakpoints'], end: keyof Theme['breakpoints']) => {
      const startValue = parseInt(breakpoints[start].replace('px', ''), 10);
      const endValue = parseInt(breakpoints[end].replace('px', ''), 10);
      return `@media (min-width: ${startValue}px) and (max-width: ${endValue}px)`;
    },
  };
}

// Export CSS variable helpers with default prefix
export const cssVar = createCssVarHelpers();
