import { BaseModule, ModuleType } from '../../types/buildings/ModuleTypes';
import { moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
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
  alerts: {
    level: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: number;
    acknowledged: boolean;
  }[];
}

/**
 * Module status manager
 * Manages the status tracking, history, and notifications for modules
 */
export class ModuleStatusManager {
  private moduleStatuses: Map<string, ModuleStatusDetails>;
  private statusUpdateInterval: number;
  private intervalId?: NodeJS.Timeout;

  constructor(statusUpdateInterval = 60000) { // Default to 1 minute updates
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
    moduleEventBus.subscribe('MODULE_CREATED' as ModuleEventType, this.handleModuleCreated);
    moduleEventBus.subscribe('MODULE_ATTACHED' as ModuleEventType, this.handleModuleAttached);
    moduleEventBus.subscribe('MODULE_DETACHED' as ModuleEventType, this.handleModuleDetached);
    moduleEventBus.subscribe('MODULE_UPGRADED' as ModuleEventType, this.handleModuleUpgraded);
    moduleEventBus.subscribe('MODULE_ACTIVATED' as ModuleEventType, this.handleModuleActivated);
    moduleEventBus.subscribe('MODULE_DEACTIVATED' as ModuleEventType, this.handleModuleDeactivated);
    
    // Status events
    moduleEventBus.subscribe('STATUS_CHANGED' as ModuleEventType, this.handleStatusChanged);
    moduleEventBus.subscribe('ERROR_OCCURRED' as ModuleEventType, this.handleErrorOccurred);
    
    // Resource events that might affect status
    moduleEventBus.subscribe('RESOURCE_SHORTAGE' as ModuleEventType, this.handleResourceShortage);
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
    const errorEntries = statusDetails.history.filter(
      entry => ['error', 'critical', 'offline'].includes(entry.status)
    );
    const totalTime = Date.now() - statusDetails.history[0].timestamp;
    let errorTime = 0;
    
    for (const entry of errorEntries) {
      errorTime += entry.duration || 0;
    }
    
    statusDetails.metrics.reliability = Math.max(0, Math.min(1, 1 - (errorTime / totalTime)));

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

    // Emit metrics updated event
    moduleEventBus.emit({
      type: 'STATUS_CHANGED' as ModuleEventType,
      moduleId,
      moduleType: module.type,
      timestamp: Date.now(),
      data: {
        status: statusDetails.currentStatus,
        metrics: statusDetails.metrics
      }
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
          timestamp: Date.now()
        }
      ],
      lastUpdated: Date.now(),
      metrics: {
        uptime: 0,
        efficiency: 1.0,
        reliability: 1.0,
        performance: module.level / 10
      },
      alerts: []
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
      reason
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

    // Emit status changed event
    moduleEventBus.emit({
      type: 'STATUS_CHANGED' as ModuleEventType,
      moduleId,
      moduleType: module.type,
      timestamp: Date.now(),
      data: {
        status,
        previousStatus: statusDetails.previousStatus,
        reason
      }
    });

    // Create alert for critical statuses
    if (['error', 'critical', 'offline'].includes(status)) {
      this.addAlert(moduleId, 'error', `Module entered ${status} state${reason ? ': ' + reason : ''}`);
    } else if (['degraded', 'overloaded'].includes(status)) {
      this.addAlert(moduleId, 'warning', `Module performance degraded${reason ? ': ' + reason : ''}`);
    } else if (['optimized', 'boost'].includes(status)) {
      this.addAlert(moduleId, 'info', `Module performance enhanced${reason ? ': ' + reason : ''}`);
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
      acknowledged: false
    };

    statusDetails.alerts.push(alert);

    // Emit alert event
    const module = moduleManager.getModule(moduleId);
    if (module) {
      moduleEventBus.emit({
        type: 'ERROR_OCCURRED' as ModuleEventType,
        moduleId,
        moduleType: module.type,
        timestamp: Date.now(),
        data: { alert }
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
    return this.moduleStatuses.get(moduleId)?.history || [];
  }

  /**
   * Get alerts for a module
   */
  public getModuleAlerts(moduleId: string, onlyUnacknowledged = false): any[] {
    const alerts = this.moduleStatuses.get(moduleId)?.alerts || [];
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
  private handleModuleCreated = (event: any): void => {
    this.initializeModuleStatus(event.moduleId);
  };

  /**
   * Handle module attached event
   */
  private handleModuleAttached = (event: any): void => {
    const { moduleId } = event;
    this.updateModuleStatus(moduleId, 'inactive', 'Module attached');
  };

  /**
   * Handle module detached event
   */
  private handleModuleDetached = (event: any): void => {
    const { moduleId } = event;
    // We don't remove the status history, just mark it as detached
    this.updateModuleStatus(moduleId, 'inactive', 'Module detached');
  };

  /**
   * Handle module upgraded event
   */
  private handleModuleUpgraded = (event: any): void => {
    const { moduleId, newLevel } = event.data;
    this.updateModuleStatus(moduleId, 'upgrading', `Upgrading to level ${newLevel}`);
    
    // After a short delay, return to active status
    setTimeout(() => {
      this.updateModuleStatus(moduleId, 'active', 'Upgrade completed');
    }, 5000);
  };

  /**
   * Handle module activated event
   */
  private handleModuleActivated = (event: any): void => {
    const { moduleId } = event;
    this.updateModuleStatus(moduleId, 'active', 'Module activated');
  };

  /**
   * Handle module deactivated event
   */
  private handleModuleDeactivated = (event: any): void => {
    const { moduleId } = event;
    this.updateModuleStatus(moduleId, 'inactive', 'Module deactivated');
  };

  /**
   * Handle status changed event
   */
  private handleStatusChanged = (event: any): void => {
    // Only handle events from other sources to avoid loops
    if (event.data && event.data.source !== 'ModuleStatusManager') {
      const { moduleId } = event;
      const { status, reason } = event.data;
      
      if (status && status !== this.getModuleStatus(moduleId)) {
        this.updateModuleStatus(moduleId, status, reason);
      }
    }
  };

  /**
   * Handle error occurred event
   */
  private handleErrorOccurred = (event: any): void => {
    const { moduleId } = event;
    const { error, level, message } = event.data;
    
    // Add alert
    if (message) {
      this.addAlert(moduleId, level || 'error', message);
    }
    
    // Update status for serious errors
    if (level === 'critical') {
      this.updateModuleStatus(moduleId, 'critical', message || 'Critical error occurred');
    } else if (level === 'error') {
      this.updateModuleStatus(moduleId, 'error', message || 'Error occurred');
    }
  };

  /**
   * Handle resource shortage event
   */
  private handleResourceShortage = (event: any): void => {
    const { moduleId } = event;
    const { resourceType, amount, required } = event.data;
    
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
   * Clean up resources
   */
  public cleanup(): void {
    // Stop interval
    this.stopStatusUpdates();
    
    // Unsubscribe from events
    const unsubscribeCreated = moduleEventBus.subscribe('MODULE_CREATED' as ModuleEventType, this.handleModuleCreated);
    const unsubscribeAttached = moduleEventBus.subscribe('MODULE_ATTACHED' as ModuleEventType, this.handleModuleAttached);
    const unsubscribeDetached = moduleEventBus.subscribe('MODULE_DETACHED' as ModuleEventType, this.handleModuleDetached);
    const unsubscribeUpgraded = moduleEventBus.subscribe('MODULE_UPGRADED' as ModuleEventType, this.handleModuleUpgraded);
    const unsubscribeActivated = moduleEventBus.subscribe('MODULE_ACTIVATED' as ModuleEventType, this.handleModuleActivated);
    const unsubscribeDeactivated = moduleEventBus.subscribe('MODULE_DEACTIVATED' as ModuleEventType, this.handleModuleDeactivated);
    const unsubscribeStatusChanged = moduleEventBus.subscribe('STATUS_CHANGED' as ModuleEventType, this.handleStatusChanged);
    const unsubscribeErrorOccurred = moduleEventBus.subscribe('ERROR_OCCURRED' as ModuleEventType, this.handleErrorOccurred);
    const unsubscribeResourceShortage = moduleEventBus.subscribe('RESOURCE_SHORTAGE' as ModuleEventType, this.handleResourceShortage);
    
    if (typeof unsubscribeCreated === 'function') {
      unsubscribeCreated();
    }
    if (typeof unsubscribeAttached === 'function') {
      unsubscribeAttached();
    }
    if (typeof unsubscribeDetached === 'function') {
      unsubscribeDetached();
    }
    if (typeof unsubscribeUpgraded === 'function') {
      unsubscribeUpgraded();
    }
    if (typeof unsubscribeActivated === 'function') {
      unsubscribeActivated();
    }
    if (typeof unsubscribeDeactivated === 'function') {
      unsubscribeDeactivated();
    }
    if (typeof unsubscribeStatusChanged === 'function') {
      unsubscribeStatusChanged();
    }
    if (typeof unsubscribeErrorOccurred === 'function') {
      unsubscribeErrorOccurred();
    }
    if (typeof unsubscribeResourceShortage === 'function') {
      unsubscribeResourceShortage();
    }
    
    // Clear data
    this.moduleStatuses.clear();
  }
}

// Export singleton instance
export const moduleStatusManager = new ModuleStatusManager(); 