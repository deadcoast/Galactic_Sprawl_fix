/**
 * Utility for preloading critical JavaScript chunks
 * This helps improve user experience by loading important routes in the background
 */

// Define proper return type for dynamic imports
type ImportableComponent = () => Promise<unknown>;

// Preload function - accepts a list of import functions to preload
export const preloadComponents = (imports: Array<ImportableComponent>): void => {
  // Only preload in production to avoid unnecessary load during development
  if (import.meta.env.PROD) {
    // Use requestIdleCallback if available, otherwise use a short timeout
    const schedulePreload =
      typeof window.requestIdleCallback !== 'undefined'
        ? window.requestIdleCallback
        : (cb: () => void) => setTimeout(cb, 1000);

    // Schedule preloading during browser idle time
    schedulePreload(() => {
      imports.forEach(importFn => {
        // Trigger the import but don't await it - just load it in background
        importFn().catch(error => {
          console.warn('Failed to preload component:', error);
        });
      });
    });
  }
};

// Helper for types with window.requestIdleCallback
declare global {
  interface Window {
    requestIdleCallback: (callback: () => void, options?: { timeout: number }) => number;
    cancelIdleCallback: (handle: number) => void;
  }
}

// Export a function to preload common routes that are likely to be used
export const preloadCommonRoutes = (): void => {
  preloadComponents([
    // Import functions for commonly used routes
    () => import('../components/combat/CombatDashboard'),
    () => import('../components/combat/formations/FormationTacticsPage'),
    () => import('../components/combat/FleetDetails'),
  ]);
};

// Function to preload low-priority routes after the app has stabilized
export const preloadLowPriorityRoutes = (): void => {
  // Wait longer for low priority routes
  setTimeout(() => {
    preloadComponents([
      // Import functions for less commonly used routes
      () => import('../components/combat/BattleView'),
      // Add other low-priority routes here
    ]);
  }, 5000); // Wait 5 seconds after app load
};
