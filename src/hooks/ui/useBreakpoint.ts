/**
 * @context: ui-responsive-system, ui-hook-system
 * 
 * Hook for responsive design with breakpoint detection
 */

import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../types/ui/ThemeTypes';

/**
 * Breakpoint keys in order from smallest to largest
 */
const BREAKPOINT_KEYS: Array<keyof Theme['breakpoints']> = ['xs', 'sm', 'md', 'lg', 'xl'];

/**
 * Available breakpoint sizes
 */
export type Breakpoint = keyof Theme['breakpoints'];

/**
 * Results from the useBreakpoint hook
 */
export interface UseBreakpointResult {
  /**
   * Current active breakpoint
   */
  current: Breakpoint;
  
  /**
   * Whether the viewport is mobile-sized (sm or smaller)
   */
  isMobile: boolean;
  
  /**
   * Whether the viewport is tablet-sized (md)
   */
  isTablet: boolean;
  
  /**
   * Whether the viewport is desktop-sized (lg or larger)
   */
  isDesktop: boolean;
  
  /**
   * Check if the current breakpoint is at least the given size
   * @param breakpoint The breakpoint to check against
   * @returns True if the current breakpoint is at least the given size
   */
  isAtLeast: (breakpoint: Breakpoint) => boolean;
  
  /**
   * Check if the current breakpoint is at most the given size
   * @param breakpoint The breakpoint to check against
   * @returns True if the current breakpoint is at most the given size
   */
  isAtMost: (breakpoint: Breakpoint) => boolean;
  
  /**
   * Check if the current breakpoint is exactly the given size
   * @param breakpoint The breakpoint to check against
   * @returns True if the current breakpoint is exactly the given size
   */
  is: (breakpoint: Breakpoint) => boolean;
}

/**
 * Hook for responsive design with breakpoint detection
 * @returns An object with breakpoint information and utility functions
 */
export function useBreakpoint(): UseBreakpointResult {
  const { theme } = useTheme();
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );
  
  // Convert breakpoint strings to numbers for comparison
  const breakpointValues = useMemo(() => {
    return BREAKPOINT_KEYS.reduce<Record<Breakpoint, number>>((acc, key) => {
      acc[key] = parseInt(theme.breakpoints[key].replace('px', ''), 10);
      return acc;
    }, {} as Record<Breakpoint, number>);
  }, [theme.breakpoints]);
  
  // Determine current breakpoint based on window width
  const current = useMemo<Breakpoint>(() => {
    // Default to xs for SSR
    if (windowWidth === 0) return 'xs';
    
    // Find the largest breakpoint that is less than or equal to the window width
    for (let i = BREAKPOINT_KEYS.length - 1; i >= 0; i--) {
      const key = BREAKPOINT_KEYS[i];
      if (windowWidth >= breakpointValues[key]) {
        return key;
      }
    }
    
    return 'xs';
  }, [windowWidth, breakpointValues]);
  
  // Update window width on resize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Create result object with various helper properties and functions
  return {
    current,
    isMobile: current === 'xs' || current === 'sm',
    isTablet: current === 'md',
    isDesktop: current === 'lg' || current === 'xl',
    
    isAtLeast: (breakpoint: Breakpoint) => {
      const currentIndex = BREAKPOINT_KEYS.indexOf(current);
      const targetIndex = BREAKPOINT_KEYS.indexOf(breakpoint);
      return currentIndex >= targetIndex;
    },
    
    isAtMost: (breakpoint: Breakpoint) => {
      const currentIndex = BREAKPOINT_KEYS.indexOf(current);
      const targetIndex = BREAKPOINT_KEYS.indexOf(breakpoint);
      return currentIndex <= targetIndex;
    },
    
    is: (breakpoint: Breakpoint) => current === breakpoint,
  };
} 