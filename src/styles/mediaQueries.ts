/**
 * @context: ui-responsive-system, styles-library
 *
 * Media query utilities for CSS-in-JS libraries
 */

import { Theme, ThemeBreakpoint } from '../types/ui/ThemeTypes';

/**
 * Generate media query breakpoints from theme
 * @param theme Application theme
 * @returns Object with media query helpers
 */
export function createMediaQueries(theme: Theme) {
  /**
   * Breakpoint keys in order from smallest to largest
   */
  const BREAKPOINT_KEYS: ThemeBreakpoint[] = [
    ThemeBreakpoint.XS,
    ThemeBreakpoint.SM,
    ThemeBreakpoint.MD,
    ThemeBreakpoint.LG,
    ThemeBreakpoint.XL,
  ];

  return {
    /**
     * Create a min-width media query that matches when the viewport
     * is at least the specified breakpoint size
     *
     * @param key Breakpoint key
     * @returns Media query string
     *
     * @example
     * ```
     * up('md') // => '@media (min-width: 960px)'
     * ```
     */
    up: (key: keyof Theme['breakpoints']) => {
      const breakpointValue = theme.breakpoints[key];
      return `@media (min-width: ${breakpointValue})`;
    },

    /**
     * Create a max-width media query that matches when the viewport
     * is at most the specified breakpoint size (minus 0.05px to avoid overlap)
     *
     * @param key Breakpoint key
     * @returns Media query string
     *
     * @example
     * ```
     * down('sm') // => '@media (max-width: 599.95px)'
     * ```
     */
    down: (key: keyof Theme['breakpoints']) => {
      const nextIndex = BREAKPOINT_KEYS.indexOf(key) + 1;

      // Handle the largest breakpoint
      if (nextIndex === BREAKPOINT_KEYS.length) {
        return `@media (min-width: 0px)`;
      }

      // Use the next breakpoint's value minus 0.05px to avoid overlap
      const nextKey = BREAKPOINT_KEYS[nextIndex];
      const breakpointValue = parseInt(theme.breakpoints[nextKey].replace('px', ''), 10);
      return `@media (max-width: ${breakpointValue - 0.05}px)`;
    },

    /**
     * Create a media query that matches when the viewport is between
     * the specified start and end breakpoint sizes
     *
     * @param start Start breakpoint key (inclusive)
     * @param end End breakpoint key (exclusive)
     * @returns Media query string
     *
     * @example
     * ```
     * between('sm', 'lg') // => '@media (min-width: 600px) and (max-width: 1279.95px)'
     * ```
     */
    between: (start: keyof Theme['breakpoints'], end: keyof Theme['breakpoints']) => {
      const startValue = parseInt(theme.breakpoints[start].replace('px', ''), 10);
      const endIndex = BREAKPOINT_KEYS.indexOf(end) + 1;

      // Handle the largest breakpoint
      if (endIndex === BREAKPOINT_KEYS.length) {
        return `@media (min-width: ${startValue}px)`;
      }

      // Use the next breakpoint's value minus 0.05px to avoid overlap
      const nextKey = BREAKPOINT_KEYS[endIndex];
      const endValue = parseInt(theme.breakpoints[nextKey].replace('px', ''), 10);

      return `@media (min-width: ${startValue}px) and (max-width: ${endValue - 0.05}px)`;
    },

    /**
     * Create a media query that matches only the specified breakpoint
     *
     * @param key Breakpoint key
     * @returns Media query string
     *
     * @example
     * ```
     * only('md') // => '@media (min-width: 960px) and (max-width: 1279.95px)'
     * ```
     */
    only: (key: keyof Theme['breakpoints']) => {
      const keyIndex = BREAKPOINT_KEYS.indexOf(key);

      // If it's the largest breakpoint, use up
      if (keyIndex === BREAKPOINT_KEYS.length - 1) {
        return createMediaQueries(theme).up(key);
      }

      // Otherwise use between with the next breakpoint
      const nextKey = BREAKPOINT_KEYS[keyIndex + 1];
      return createMediaQueries(theme).between(key, nextKey);
    },

    /**
     * Additional common media queries
     */
    custom: {
      /**
       * Devices that can hover
       */
      canHover: '@media (hover: hover)',

      /**
       * Devices with fine pointer (mouse)
       */
      hasPointer: '@media (pointer: fine)',

      /**
       * Prefers reduced motion
       */
      prefersReducedMotion: '@media (prefers-reduced-motion: reduce)',

      /**
       * Portrait orientation
       */
      portrait: '@media (orientation: portrait)',

      /**
       * Landscape orientation
       */
      landscape: '@media (orientation: landscape)',

      /**
       * Prefers dark theme
       */
      prefersDarkTheme: '@media (prefers-color-scheme: dark)',

      /**
       * Prefers light theme
       */
      prefersLightTheme: '@media (prefers-color-scheme: light)',

      /**
       * High contrast mode
       */
      highContrast: '@media (forced-colors: active)',

      /**
       * Retina and high DPI screens
       */
      retina: '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
    },
  };
}

/**
 * Default media query functions based on standard breakpoints
 */
export const mediaQueries = createMediaQueries({
  breakpoints: {
    [ThemeBreakpoint.XS]: '0px',
    [ThemeBreakpoint.SM]: '600px',
    [ThemeBreakpoint.MD]: '960px',
    [ThemeBreakpoint.LG]: '1280px',
    [ThemeBreakpoint.XL]: '1920px',
    [ThemeBreakpoint.XXL]: '2560px', // Add XXL breakpoint to match ThemeBreakpoint enum
  },
} as Theme);

/**
 * Export named media query breakpoints
 */
export const { up, down, between, only, custom } = mediaQueries;
