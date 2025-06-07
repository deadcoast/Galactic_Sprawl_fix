import { TypedEventEmitter } from '../../lib/events/EventEmitter';
import { ModuleEvent, moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import { moduleManager } from './ModuleManager';

/**
 * Extended module status types beyond the basic 'active', 'constructing', 'inactive'
 */
export type ExtendedModuleStatus =
  // Basic statuses
  | 'active'
  | 'constructing'
  | 'inactive'
  // Performance statuses
  | 'optimized'
  | 'degraded'
  | 'overloaded'
  // Operational statuses
  | 'maintenance'
  | 'upgrading'
  | 'repairing'
  // Error statuses
  | 'error'
  | 'critical'
  | 'offline'
  // Special statuses
  | 'standby'
  | 'powersave'
  | 'boost';

/**
 * Status history entry
 */
export interface StatusHistoryEntry {
  status: ExtendedModuleStatus;
  timestamp: number;
  duration?: number;
  reason?: string;
}

/**
 * Module alert interface
 */
export interface ModuleAlert {
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

/**
 * Module status details
 */
export interface ModuleStatusDetails {
  currentStatus: ExtendedModuleStatus;
  previousStatus?: ExtendedModuleStatus;
  history: StatusHistoryEntry[];
  lastUpdated: number;
  metrics: {
    uptime: number;
    efficiency: number;
    reliability: number;
    performance: number;
  };
  alerts: ModuleAlert[];
}

/**
 * Events emitted by the ModuleStatusManager
 */
export enum ModuleStatusManagerEventType {
  STATUS_UPDATED = 'STATUS_UPDATED',
  ALERT_ADDED = 'ALERT_ADDED',
  METRICS_UPDATED = 'METRICS_UPDATED',
}

/**
 * Event data interfaces for ModuleStatusManager events
 */
export interface StatusUpdatedEventData {
  moduleId: string;
  status: ExtendedModuleStatus;
  previousStatus?: ExtendedModuleStatus;
  reason?: string;
}

export interface AlertAddedEventData {
  moduleId: string;
  alert: ModuleAlert;
}

export interface MetricsUpdatedEventData {
  moduleId: string;
  metrics: ModuleStatusDetails['metrics'];
}

/**
 * Event map for the ModuleStatusManager
 */
export interface ModuleStatusManagerEvents extends Record<string, unknown> {
  [ModuleStatusManagerEventType.STATUS_UPDATED]: StatusUpdatedEventData;
  [ModuleStatusManagerEventType.ALERT_ADDED]: AlertAddedEventData;
  [ModuleStatusManagerEventType.METRICS_UPDATED]: MetricsUpdatedEventData;
}

/**
 * Module status manager
 * Manages the status tracking, history, and notifications for modules
 */
// Extend TypedEventEmitter
export class ModuleStatusManager extends TypedEventEmitter<ModuleStatusManagerEvents> {
  private static instance: ModuleStatusManager | null = null; // Add for singleton

  private moduleStatuses: Map<string, ModuleStatusDetails>;
  private statusUpdateInterval: number;
  private intervalId?: NodeJS.Timeout;
  // Store unsubscribe functions
  private unsubscribeHandles: (() => void)[] = [];

  private constructor(statusUpdateInterval = 60000) {
    // Make private for singleton
    super(); // Add super call
    // Default to 1 minute updates
    this.moduleStatuses = new Map();
    this.statusUpdateInterval = statusUpdateInterval;

    // Subscribe to module events
    this.subscribeToEvents();

    // Start status update interval
    this.startStatusUpdates();
  }

  /**
   * Subscribe to module events
   */
  private subscribeToEvents(): void {
    // Module lifecycle events
    this.unsubscribeHandles.push(
      moduleEventBus.subscribe('MODULE_CREATED' as ModuleEventType, this.handleModuleCreated)
    );
    this.unsubscribeHandles.push(
      moduleEventBus.subscribe('MODULE_ATTACHED' as ModuleEventType, this.handleModuleAttached)
    );
    this.unsubscribeHandles.push(
      moduleEventBus.subscribe('MODULE_DETACHED' as ModuleEventType, this.handleModuleDetached)
    );
    this.unsubscribeHandles.push(
      moduleEventBus.subscribe('MODULE_UPGRADED' as ModuleEventType, this.handleModuleUpgraded)
    );
    this.unsubscribeHandles.push(
      moduleEventBus.subscribe('MODULE_ACTIVATED' as ModuleEventType, this.handleModuleActivated)
    );
    this.unsubscribeHandles.push(
      moduleEventBus.subscribe(
        'MODULE_DEACTIVATED' as ModuleEventType,
        this.handleModuleDeactivated
      )
    );

    // Status events
    this.unsubscribeHandles.push(
      moduleEventBus.subscribe('STATUS_CHANGED' as ModuleEventType, this.handleStatusChanged)
    );
    this.unsubscribeHandles.push(
      moduleEventBus.subscribe('ERROR_OCCURRED' as ModuleEventType, this.handleErrorOccurred)
    );

    // Resource events that might affect status
    this.unsubscribeHandles.push(
      moduleEventBus.subscribe('RESOURCE_SHORTAGE' as ModuleEventType, this.handleResourceShortage)
    );
  }

  /**
   * Start periodic status updates
   */
  private startStatusUpdates(): void {
    this.intervalId = setInterval(() => {
      this.updateAllModuleMetrics();
    }, this.statusUpdateInterval);
  }

  /**
   * Stop periodic status updates
   */
  public stopStatusUpdates(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  /**
   * Update metrics for all modules
   */
  private updateAllModuleMetrics(): void {
    const modules = Array.from(moduleManager.getActiveModules());

    for (const module of modules) {
      this.updateModuleMetrics(module.id);
    }
  }

  /**
   * Update metrics for a specific module
   */
  private updateModuleMetrics(moduleId: string): void {
    const statusDetails = this.moduleStatuses.get(moduleId);
    if (!statusDetails) {
      return;
    }

    const module = moduleManager.getModule(moduleId);
    if (!module) {
      return;
    }

    // Calculate uptime (time since first activation)
    const firstActivation = statusDetails.history.find(entry => entry.status === 'active');
    if (firstActivation) {
      const uptime = module.isActive
        ? Date.now() - firstActivation.timestamp
        : statusDetails.metrics.uptime;

      statusDetails.metrics.uptime = uptime;
    }

    // Calculate efficiency based on status
    let efficiency = 1.0;
    switch (statusDetails.currentStatus) {
      case 'optimized':
        efficiency = 1.2; // 20% boost
        break;
      case 'degraded':
        efficiency = 0.8; // 20% reduction
        break;
      case 'overloaded':
        efficiency = 0.6; // 40% reduction
        break;
      case 'maintenance':
      case 'repairing':
        efficiency = 0.5; // 50% reduction
        break;
      case 'powersave':
        efficiency = 0.7; // 30% reduction
        break;
      case 'boost':
        efficiency = 1.5; // 50% boost
        break;
      case 'error':
      case 'critical':
      case 'offline':
        efficiency = 0; // No efficiency
        break;
      default:
        efficiency = 1.0; // Normal efficiency
    }
    statusDetails.metrics.efficiency = efficiency;

    // Calculate reliability (percentage of time without errors)
    const errorEntries = statusDetails.history.filter(entry =>
      ['error', 'critical', 'offline'].includes(entry.status)
    );
    const totalTime = Date.now() - statusDetails.history[0].timestamp;
    let errorTime = 0;

    for (const entry of errorEntries) {
      errorTime += entry.duration ?? 0;
    }

    statusDetails.metrics.reliability = Math.max(0, Math.min(1, 1 - errorTime / totalTime));

    // Calculate performance based on level and status
    let performance = module.level / 10; // Base performance from level (0.1 to 1.0)

    // Adjust based on status
    switch (statusDetails.currentStatus) {
      case 'optimized':
        performance *= 1.2; // 20% boost
        break;
      case 'boost':
        performance *= 1.5; // 50% boost
        break;
      case 'degraded':
        performance *= 0.8; // 20% reduction
        break;
      case 'overloaded':
        performance *= 0.7; // 30% reduction
        break;
      default:
        // No adjustment
        break;
    }

    statusDetails.metrics.performance = Math.min(1, performance);

    // Update last updated timestamp
    statusDetails.lastUpdated = Date.now();

    // Emit metrics updated event using this.emit
    this.emit(ModuleStatusManagerEventType.METRICS_UPDATED, {
      moduleId,
      metrics: statusDetails.metrics,
    });
  }

  /**
   * Initialize status tracking for a module
   */
  public initializeModuleStatus(moduleId: string): void {
    const module = moduleManager.getModule(moduleId);
    if (!module) {
      console.error(`[ModuleStatusManager] Module ${moduleId} not found`);
      return;
    }

    // Create initial status details
    const statusDetails: ModuleStatusDetails = {
      currentStatus: module.status as ExtendedModuleStatus,
      history: [
        {
          status: module.status as ExtendedModuleStatus,
          timestamp: Date.now(),
        },
      ],
      lastUpdated: Date.now(),
      metrics: {
        uptime: 0,
        efficiency: 1.0,
        reliability: 1.0,
        performance: module.level / 10,
      },
      alerts: [],
    };

    this.moduleStatuses.set(moduleId, statusDetails);
  }

  /**
   * Update the status of a module
   */
  public updateModuleStatus(
    moduleId: string,
    status: ExtendedModuleStatus,
    reason?: string
  ): boolean {
    const module = moduleManager.getModule(moduleId);
    if (!module) {
      console.error(`[ModuleStatusManager] Module ${moduleId} not found`);
      return false;
    }

    let statusDetails = this.moduleStatuses.get(moduleId);

    // Initialize status tracking if not already done
    if (!statusDetails) {
      this.initializeModuleStatus(moduleId);
      statusDetails = this.moduleStatuses.get(moduleId);
      if (!statusDetails) {
        return false;
      }
    }

    // Update previous status entry with duration
    const previousEntry = statusDetails.history[statusDetails.history.length - 1];
    if (previousEntry) {
      previousEntry.duration = Date.now() - previousEntry.timestamp;
    }

    // Add new status entry
    const newEntry: StatusHistoryEntry = {
      status,
      timestamp: Date.now(),
      reason,
    };

    statusDetails.history.push(newEntry);

    // Update current and previous status
    statusDetails.previousStatus = statusDetails.currentStatus;
    statusDetails.currentStatus = status;
    statusDetails.lastUpdated = Date.now();

    // Update module's basic status if it's one of the core statuses
    if (['active', 'constructing', 'inactive'].includes(status)) {
      module.status = status as 'active' | 'constructing' | 'inactive';

      // Update module's active state
      if (status === 'active') {
        module.isActive = true;
      } else if (status === 'inactive') {
        module.isActive = false;
      }
    }

    // Emit status changed event using this.emit
    this.emit(ModuleStatusManagerEventType.STATUS_UPDATED, {
      moduleId,
      status,
      previousStatus: statusDetails.previousStatus,
      reason,
    });

    // Create alert for critical statuses
    if (['error', 'critical', 'offline'].includes(status)) {
      this.addAlert(
        moduleId,
        'error',
        `Module entered ${status} state${reason ? ': ' + reason : ''}`
      );
    } else if (['degraded', 'overloaded'].includes(status)) {
      this.addAlert(
        moduleId,
        'warning',
        `Module performance degraded${reason ? ': ' + reason : ''}`
      );
    } else if (['optimized', 'boost'].includes(status)) {
      this.addAlert(moduleId, 'info', `Module performance enhanced${reason ? ': ' + reason : ''}`);
    }

    const moduleData = moduleManager.getModule(moduleId);
    if (moduleData) {
      // Emit alert event using this.emit
      this.emit(ModuleStatusManagerEventType.ALERT_ADDED, {
        moduleId,
        alert: {
          level: 'error',
          message: `Module entered ${status} state${reason ? ': ' + reason : ''}`,
          timestamp: Date.now(),
          acknowledged: false,
        },
      });
    }

    return true;
  }

  /**
   * Add an alert for a module
   */
  public addAlert(
    moduleId: string,
    level: 'info' | 'warning' | 'error' | 'critical',
    message: string
  ): void {
    const statusDetails = this.moduleStatuses.get(moduleId);
    if (!statusDetails) {
      return;
    }

    const alert = {
      level,
      message,
      timestamp: Date.now(),
      acknowledged: false,
    };

    statusDetails.alerts.push(alert);

    // Emit alert event
    const moduleData2 = moduleManager.getModule(moduleId);
    if (moduleData2) {
      // Emit alert event using this.emit
      this.emit(ModuleStatusManagerEventType.ALERT_ADDED, {
        moduleId,
        alert,
      });
    }
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(moduleId: string, alertIndex: number): boolean {
    const statusDetails = this.moduleStatuses.get(moduleId);
    if (!statusDetails || alertIndex >= statusDetails.alerts.length) {
      return false;
    }

    statusDetails.alerts[alertIndex].acknowledged = true;
    return true;
  }

  /**
   * Get status details for a module
   */
  public getModuleStatusDetails(moduleId: string): ModuleStatusDetails | undefined {
    return this.moduleStatuses.get(moduleId);
  }

  /**
   * Get current status for a module
   */
  public getModuleStatus(moduleId: string): ExtendedModuleStatus | undefined {
    return this.moduleStatuses.get(moduleId)?.currentStatus;
  }

  /**
   * Get status history for a module
   */
  public getModuleStatusHistory(moduleId: string): StatusHistoryEntry[] {
    return this.moduleStatuses.get(moduleId)?.history ?? [];
  }

  /**
   * Get alerts for a module
   */
  public getModuleAlerts(moduleId: string, onlyUnacknowledged = false): ModuleAlert[] {
    const alerts = this.moduleStatuses.get(moduleId)?.alerts ?? [];
    return onlyUnacknowledged ? alerts.filter(alert => !alert.acknowledged) : alerts;
  }

  /**
   * Get modules with a specific status
   */
  public getModulesByStatus(status: ExtendedModuleStatus): string[] {
    const moduleIds: string[] = [];

    this.moduleStatuses.forEach((details, moduleId) => {
      if (details.currentStatus === status) {
        moduleIds.push(moduleId);
      }
    });

    return moduleIds;
  }

  /**
   * Get modules with alerts
   */
  public getModulesWithAlerts(level?: 'info' | 'warning' | 'error' | 'critical'): string[] {
    const moduleIds: string[] = [];

    this.moduleStatuses.forEach((details, moduleId) => {
      const hasAlerts = level
        ? details.alerts.some(alert => alert.level === level && !alert.acknowledged)
        : details.alerts.some(alert => !alert.acknowledged);

      if (hasAlerts) {
        moduleIds.push(moduleId);
      }
    });

    return moduleIds;
  }

  /**
   * Handle module created event
   */
  private handleModuleCreated = (event: ModuleEvent): void => {
    this.initializeModuleStatus(event?.moduleId);
  };

  /**
   * Handle module attached event
   */
  private handleModuleAttached = (event: ModuleEvent): void => {
    const { moduleId } = event;
    this.updateModuleStatus(moduleId, 'inactive', 'Module attached');
  };

  /**
   * Handle module detached event
   */
  private handleModuleDetached = (event: ModuleEvent): void => {
    const { moduleId } = event;
    // We don't remove the status history, just mark it as detached
    this.updateModuleStatus(moduleId, 'inactive', 'Module detached');
  };

  /**
   * Handle module upgraded event
   */
  private handleModuleUpgraded = (event: ModuleEvent): void => {
    const newLevel = event?.data?.newLevel as number | undefined;
    this.updateModuleStatus(event?.moduleId, 'upgrading', `Upgrading to level ${newLevel}`);

    // After a short delay, return to active status
    setTimeout(() => {
      this.updateModuleStatus(event?.moduleId, 'active', 'Upgrade completed');
    }, 5000);
  };

  /**
   * Handle module activated event
   */
  private handleModuleActivated = (event: ModuleEvent): void => {
    const { moduleId } = event;
    this.updateModuleStatus(moduleId, 'active', 'Module activated');
  };

  /**
   * Handle module deactivated event
   */
  private handleModuleDeactivated = (event: ModuleEvent): void => {
    const { moduleId } = event;
    this.updateModuleStatus(moduleId, 'inactive', 'Module deactivated');
  };

  /**
   * Handle status changed event
   */
  private handleStatusChanged = (event: ModuleEvent): void => {
    // Only handle events from other sources to avoid loops
    if (event?.data && event?.data?.source !== 'ModuleStatusManager') {
      const { moduleId } = event;
      const status = event?.data?.status as ExtendedModuleStatus | undefined;
      const reason = event?.data?.reason as string | undefined;

      if (status && status !== this.getModuleStatus(moduleId)) {
        this.updateModuleStatus(moduleId, status, reason);
      }
    }
  };

  /**
   * Handle error occurred event
   */
  private handleErrorOccurred = (event: ModuleEvent): void => {
    const { moduleId } = event;
    const level = event?.data?.level as 'info' | 'warning' | 'error' | 'critical' | undefined;
    const message = event?.data?.message as string | undefined;

    // Add alert
    if (message) {
      this.addAlert(moduleId, level ?? 'error', message);
    }

    // Update status for serious errors
    if (level === 'critical') {
      this.updateModuleStatus(moduleId, 'critical', message ?? 'Critical error occurred');
    } else if (level === 'error') {
      this.updateModuleStatus(moduleId, 'error', message ?? 'Error occurred');
    }
  };

  /**
   * Handle resource shortage event
   */
  private handleResourceShortage = (event: ModuleEvent): void => {
    const { moduleId } = event;
    const resourceType = event?.data?.resourceType as string | undefined;
    const amount = event?.data?.amount as number | undefined;
    const required = event?.data?.required as number | undefined;

    // Add alert
    this.addAlert(
      moduleId,
      'warning',
      `Resource shortage: ${resourceType} (${amount}/${required})`
    );

    // Update status if module is active
    const currentStatus = this.getModuleStatus(moduleId);
    if (currentStatus === 'active') {
      this.updateModuleStatus(moduleId, 'degraded', `Resource shortage: ${resourceType}`);
    }
  };

  /**
   * Clean up resources - Replace with dispose
   */
  public dispose(): void {
    // Stop interval
    this.stopStatusUpdates();

    // Unsubscribe from all stored handles
    this.unsubscribeHandles.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.unsubscribeHandles = []; // Clear the array

    // TypedEventEmitter handles its own listener cleanup
    this.removeAllListeners();

    // Clear data
    this.moduleStatuses.clear();
    console.warn('[ModuleStatusManager] Disposed and cleaned up subscriptions.');
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): ModuleStatusManager {
    if (!ModuleStatusManager.instance) {
      ModuleStatusManager.instance = new ModuleStatusManager();
    }
    return ModuleStatusManager.instance;
  }
}

// Export singleton instance
export const moduleStatusManager = ModuleStatusManager.getInstance(); // Use getInstance for singleton
