/**
 * @context: ui-responsive-system, ui-hook-system
 *
 * Hook for media query detection
 */

import { useEffect, useState } from 'react';

/**
 * Hook to detect if a media query matches
 * @param query Media query string to match against
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with SSR-safe default (false)
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Set initial value once in the browser
    if (typeof window !== 'undefined') {
      setMatches(window.matchMedia(query).matches);
    }

    // Create media query listener
    const mediaQuery = window.matchMedia(query);

    // Update state when media query matches
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    // Clean up listener
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * Predefined media query shortcuts
 */
export const mediaQueries = {
  /**
   * Mobile devices (small screens)
   */
  mobile: '(max-width: 599px)',

  /**
   * Tablet devices (medium screens)
   */
  tablet: '(min-width: 600px) and (max-width: 959px)',

  /**
   * Desktop devices (large screens)
   */
  desktop: '(min-width: 960px)',

  /**
   * Large desktop devices (extra large screens)
   */
  largeDesktop: '(min-width: 1280px)',

  /**
   * Devices with hover capability
   */
  canHover: '(hover: hover)',

  /**
   * Devices with pointer capability
   */
  hasPointer: '(pointer: fine)',

  /**
   * Prefers reduced motion
   */
  prefersReducedMotion: '(prefers-reduced-motion: reduce)',

  /**
   * Portrait orientation
   */
  portrait: '(orientation: portrait)',

  /**
   * Landscape orientation
   */
  landscape: '(orientation: landscape)',

  /**
   * Prefers dark theme
   */
  prefersDarkTheme: '(prefers-color-scheme: dark)',

  /**
   * Prefers light theme
   */
  prefersLightTheme: '(prefers-color-scheme: light)',
};

/**
 * Hook to detect if a predefined media query matches
 * @param key Key of the predefined media query
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQueryPreset(key: keyof typeof mediaQueries): boolean {
  return useMediaQuery(mediaQueries[key]);
}
