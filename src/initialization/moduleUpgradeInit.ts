import { moduleUpgradeManager } from '../managers/module/ModuleUpgradeManager';
import { initializeModuleUpgradePaths } from '../config/modules/upgradePathsConfig';

/**
 * Initialize the module upgrade system
 */
export function initializeModuleUpgradeSystem(): void {
  console.log('[Initialization] Setting up module upgrade system...');
  
  // Register upgrade paths
  initializeModuleUpgradePaths(moduleUpgradeManager);
  
  console.log('[Initialization] Module upgrade system initialized successfully.');
} 