/**
 * @context: ui-system, component-library, module-registry
 *
 * Index file for module UI components
 * This file aggregates module-related UI component exports to simplify imports
 */

// Export module components
export { ModuleCard } from './ModuleCard';
export { ModuleControls } from './ModuleControls';
export { ModuleGrid } from './ModuleGrid';
export { ModuleHUD } from './ModuleHUD';
export { ModuleStatusDisplay } from './ModuleStatusDisplay';
export { ModuleStatusIndicator } from './ModuleStatusIndicator';
export { ModuleUpgradeDisplay } from './ModuleUpgradeDisplay';
export { ModuleUpgradeVisualization } from './ModuleUpgradeVisualization';
export { SubModuleHUD } from './SubModuleHUD';

// Export types
export type { ButtonVariant } from './ModuleControls';
export { MODULE_STATUS_ICONS } from './ModuleStatusIndicator';
