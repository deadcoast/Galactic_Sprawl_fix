/**
 * @context: ui-system, hooks-library
 * 
 * Integration hooks index file
 * Exports all hooks needed for integrating UI components with various systems
 */

// Resource System Integration
export {
  useResource,
  useResources,
  useResourceActions
} from './useResourceSystemIntegration';

// Event System Integration
export {
  useEventSubscription,
  useMultiEventSubscription,
  useEventMonitor
} from './useEventSystemIntegration';

// Module System Integration
export {
  useModule,
  useModules
} from './useModuleSystemIntegration';

// Manager Registry Integration
export {
  useManager,
  useServiceRegistry,
  useManagerRegistration
} from './useManagerRegistryIntegration'; 