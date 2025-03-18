import { initializeModuleUpgradePaths } from '../config/modules/upgradePathsConfig';
import { moduleUpgradeManager } from '../managers/module/ModuleUpgradeManager';

/**
 * Initialize the module upgrade system
 */
export function initializeModuleUpgradeSystem(): void {
  console.warn('[Initialization] Setting up module upgrade system...');

  // Register upgrade paths
  initializeModuleUpgradePaths(moduleUpgradeManager);

  console.warn('[Initialization] Module upgrade system initialized successfully.');
}
