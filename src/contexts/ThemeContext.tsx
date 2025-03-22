/**
 * @context: ui-theme-system, context-library
 * 
 * Theme context provider for the application
 */

import * as React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Theme, ThemeMode, ThemeContextValue } from '../types/ui/ThemeTypes';
import defaultTheme, { lightTheme } from '../ui/theme/defaultTheme';

// Define the theme context with default values
const ThemeContext = createContext<ThemeContextValue>({
  theme: defaultTheme,
  mode: 'dark',
  setMode: () => {/* Empty function as placeholder */},
});

// Local storage key for theme preference
const THEME_STORAGE_KEY = 'gs-theme-mode';

/**
 * Props for the ThemeProvider component
 */
interface ThemeProviderProps {
  children: React.ReactNode;
  initialMode?: ThemeMode;
  themes?: {
    dark: Theme;
    light: Theme;
  };
}

/**
 * Theme provider component
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialMode = 'system',
  themes = {
    dark: defaultTheme,
    light: lightTheme,
  },
}) => {
  // State for the current theme mode
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  
  // State for the current theme object
  const [theme, setTheme] = useState<Theme>(
    mode === 'light' ? themes.light : themes.dark
  );

  /**
   * Set the theme mode with storage persistence
   */
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    
    // Persist to local storage
    if (newMode !== 'system') {
      localStorage.setItem(THEME_STORAGE_KEY, newMode);
    } else {
      localStorage.removeItem(THEME_STORAGE_KEY);
    }
  }, []);

  // Effect for loading theme preference from storage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (storedTheme && (storedTheme === 'dark' || storedTheme === 'light')) {
      setModeState(storedTheme);
    }
  }, []);

  // Effect for handling system theme preference
  useEffect(() => {
    // Skip if not using system preference
    if (mode !== 'system') {
      return;
    }
    
    // Check system preference
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    
    // Set theme based on system preference
    setTheme(prefersLight ? themes.light : themes.dark);
    
    // Listen for changes to system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? themes.light : themes.dark);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [mode, themes.dark, themes.light]);

  // Effect for setting theme based on mode
  useEffect(() => {
    if (mode === 'light') {
      setTheme(themes.light);
    } else if (mode === 'dark') {
      setTheme(themes.dark);
    }
    // 'system' mode is handled in the other effect
  }, [mode, themes.dark, themes.light]);

  // Create context value
  const contextValue = {
    theme,
    mode,
    setMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook for accessing the theme context
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

export default ThemeContext; 