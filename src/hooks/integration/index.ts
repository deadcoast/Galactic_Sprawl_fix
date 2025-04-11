/**
 * @context: ui-system, hooks-library
 *
 * Integration hooks index file
 * Exports all hooks needed for integrating UI components with various systems
 */

// Resource System Integration
export { useResource, useResourceActions, useResources } from './useResourceSystemIntegration';

// Event System Integration
export {
  useEventMonitor,
  useEventSubscription,
  useMultiEventSubscription,
} from './useEventSystemIntegration';

// Module System Integration
export { useModule, useModules } from './useModuleSystemIntegration';

// Manager Registry Integration
export {
  useManager,
  useManagerRegistration,
  useServiceRegistry,
} from './useManagerRegistryIntegration';
