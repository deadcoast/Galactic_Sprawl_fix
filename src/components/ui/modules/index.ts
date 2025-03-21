/**
 * @context: ui-system, component-library, module-registry
 * 
 * Index file for module UI components
 * This file aggregates module-related UI component exports to simplify imports
 */

// Export module components
export { ModuleCard } from './ModuleCard';
export { ModuleGrid } from './ModuleGrid';
export { ModuleStatusIndicator } from './ModuleStatusIndicator';
export { ModuleControls } from './ModuleControls';
export { ModuleStatusDisplay } from './ModuleStatusDisplay';
export { ModuleHUD } from './ModuleHUD';
export { ModuleUpgradeDisplay } from './ModuleUpgradeDisplay';
export { ModuleUpgradeVisualization } from './ModuleUpgradeVisualization';
export { SubModuleHUD } from './SubModuleHUD';

// Export types
export { MODULE_STATUS_ICONS } from './ModuleStatusIndicator';
export type { ButtonVariant } from './ModuleControls'; 