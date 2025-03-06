/**
 * VPR Diagnostic Utilities
 * Helps troubleshoot VPR (Visual Planetary Resources) system integration
 */

import { moduleEventBus, ModuleEventType } from '../lib/modules/ModuleEvents';
import { moduleManager } from '../managers/module/ModuleManager';
import { ModuleType } from '../types/buildings/ModuleTypes';
import { Position } from '../types/core/GameTypes';

/**
 * Maps a module type to its corresponding VPR visualization type
 */
export function mapModuleTypeToVPRType(
  moduleType: ModuleType
): 'mothership' | 'colony' | 'planet' | 'exploration' | 'mining' {
  if (moduleType === 'exploration') return 'exploration';
  if (['hangar', 'mineral'].includes(moduleType)) return 'mining';
  if (['resource-manager'].includes(moduleType)) return 'colony';
  return 'mothership';
}

/**
 * Creates a test module and registers it with the VPR system
 * Useful for testing VPR integration without using the UI
 */
export function createTestVPRModule(
  moduleType: ModuleType,
  position: Position = { x: 0, y: 0 }
): { success: boolean; moduleId?: string; error?: string } {
  try {
    // Create module using the module manager
    const module = moduleManager.createModule(moduleType, position);

    if (!module || !module.id) {
      return {
        success: false,
        error: 'Failed to create module - module manager returned null ID',
      };
    }

    // Emit an event to notify the system
    moduleEventBus.emit({
      type: 'MODULE_UPDATED',
      moduleId: module.id,
      moduleType,
      timestamp: Date.now(),
      data: {
        vprRegistered: true,
        vprType: mapModuleTypeToVPRType(moduleType),
      },
    });

    return {
      success: true,
      moduleId: module.id,
    };
  } catch (error) {
    return {
      success: false,
      error: `Error creating test VPR module: ${error}`,
    };
  }
}

/**
 * Verifies if a module is properly registered with the VPR system
 * Call this from the browser console to debug VPR registration issues
 */
export function checkVPRModuleRegistration(moduleId: string): void {
  // Get the module
  const module = moduleManager.getModule(moduleId);

  if (!module) {
    console.warn(`[VPR Diagnostic] Module with ID ${moduleId} does not exist`);
    return;
  }

  const moduleType = module.type;

  console.warn(`[VPR Diagnostic] Module exists in ModuleManager:`);
  console.warn(module);

  // Log VPR registration information
  console.warn(`[VPR Diagnostic] To verify VPR integration:`);
  console.warn(`1. Access VPR system state: 'const vpr = useVPRSystem()'`);
  console.warn(
    `2. Check if module exists: 'vpr.systemState.modules.find(m => m.id === "${moduleId}")'`
  );
  console.warn(
    `3. If missing, register manually: 'vpr.addModule("${moduleId}", "${mapModuleTypeToVPRType(moduleType)}", 1, "active")'`
  );
}

/**
 * Registers event listeners for monitoring VPR-related events
 * This helps understand what events are being triggered during normal operation
 */
export function monitorVPREvents(): () => void {
  const unsubscribers: Array<() => void> = [];

  // Monitor module events that are relevant to VPR
  const eventsToMonitor: ModuleEventType[] = [
    'MODULE_CREATED',
    'MODULE_ATTACHED',
    'MODULE_ACTIVATED',
    'MODULE_UPDATED',
    'RESOURCE_PRODUCED',
    'RESOURCE_CONSUMED',
    'STATUS_CHANGED',
  ];

  eventsToMonitor.forEach(eventType => {
    const unsubscribe = moduleEventBus.subscribe(eventType, event => {
      console.warn(`[VPR Event Monitor] ${eventType}:`);
      console.warn(event);
    });
    unsubscribers.push(unsubscribe);
  });

  console.warn(
    `[VPR Diagnostic] Monitoring ${eventsToMonitor.length} events related to VPR system`
  );
  console.warn(
    `[VPR Diagnostic] To stop monitoring, call the function returned by monitorVPREvents()`
  );

  // Return a cleanup function
  return () => {
    unsubscribers.forEach(unsubscribe => unsubscribe());
    console.warn(`[VPR Diagnostic] Stopped monitoring events`);
  };
}
