import {
  BaseModule,
  ModuleType,
  ModuleConfig,
  ModuleAttachmentPoint,
  ModularBuilding
} from '../../types/buildings/ModuleTypes';
import { Position } from '../../types/core/GameTypes';
import { moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import { moduleManager } from './ModuleManager';
import { 
  validateModuleAttachmentPoint, 
  canAttachModule,
  validateModuleCompatibility
} from '../../utils/modules/moduleValidation';

/**
 * Attachment visualization options
 */
export interface AttachmentVisualizationOptions {
  showValidPoints: boolean;
  highlightIncompatible: boolean;
  showAttachmentPreview: boolean;
  animateAttachment: boolean;
  attachmentAnimationDuration: number;
}

/**
 * Attachment result
 */
export interface AttachmentResult {
  success: boolean;
  moduleId?: string;
  buildingId?: string;
  attachmentPointId?: string;
  error?: string;
}

/**
 * Module Attachment Manager
 * Handles the attachment of modules to buildings, including validation, visualization, and event handling
 */
export class ModuleAttachmentManager {
  private visualizationOptions: AttachmentVisualizationOptions;
  private previewModule: BaseModule | null = null;
  private validAttachmentPoints: Map<string, ModuleAttachmentPoint[]> = new Map();
  private incompatibleAttachmentPoints: Map<string, ModuleAttachmentPoint[]> = new Map();

  constructor(options?: Partial<AttachmentVisualizationOptions>) {
    this.visualizationOptions = {
      showValidPoints: true,
      highlightIncompatible: true,
      showAttachmentPreview: true,
      animateAttachment: true,
      attachmentAnimationDuration: 500,
      ...options
    };

    // Subscribe to module events
    moduleEventBus.subscribe('MODULE_ATTACHED' as ModuleEventType, this.handleModuleAttached);
    moduleEventBus.subscribe('MODULE_DETACHED' as ModuleEventType, this.handleModuleDetached);
  }

  /**
   * Handle module attached event
   */
  private handleModuleAttached = (event: any): void => {
    const { moduleId, buildingId, attachmentPointId } = event.data;
    console.debug(`[ModuleAttachmentManager] Module ${moduleId} attached to building ${buildingId} at point ${attachmentPointId}`);
    
    // Clear any previews or highlights for this building
    this.clearAttachmentVisualization(buildingId);
  };

  /**
   * Handle module detached event
   */
  private handleModuleDetached = (event: any): void => {
    const { moduleId, buildingId, attachmentPointId } = event.data;
    console.debug(`[ModuleAttachmentManager] Module ${moduleId} detached from building ${buildingId} at point ${attachmentPointId}`);
  };

  /**
   * Start attachment process for a module
   */
  public startAttachment(moduleType: ModuleType, buildingId: string): void {
    const building = moduleManager.getBuilding(buildingId);
    if (!building) {
      console.error(`[ModuleAttachmentManager] Building ${buildingId} not found`);
      return;
    }

    // Create a temporary preview module
    this.previewModule = {
      id: `preview-${moduleType}-${Date.now()}`,
      name: moduleType,
      type: moduleType,
      position: { x: 0, y: 0 },
      isActive: false,
      level: 1,
      status: 'inactive'
    };

    // Find valid attachment points
    this.findValidAttachmentPoints(this.previewModule, building);

    // Show visualization if enabled
    if (this.visualizationOptions.showValidPoints) {
      this.showAttachmentVisualization(buildingId);
    }

    // Emit event
    moduleEventBus.emit({
      type: 'ATTACHMENT_STARTED' as ModuleEventType,
      moduleId: this.previewModule.id,
      moduleType: moduleType,
      timestamp: Date.now(),
      data: {
        buildingId,
        validPoints: this.validAttachmentPoints.get(buildingId)?.map(p => p.id) || [],
        incompatiblePoints: this.incompatibleAttachmentPoints.get(buildingId)?.map(p => p.id) || []
      }
    });
  }

  /**
   * Cancel attachment process
   */
  public cancelAttachment(buildingId: string): void {
    this.previewModule = null;
    this.clearAttachmentVisualization(buildingId);

    // Emit event
    moduleEventBus.emit({
      type: 'ATTACHMENT_CANCELLED' as ModuleEventType,
      moduleId: 'none',
      moduleType: 'radar' as ModuleType, // Using a default module type
      timestamp: Date.now(),
      data: { buildingId }
    });
  }

  /**
   * Complete attachment process
   */
  public completeAttachment(moduleType: ModuleType, buildingId: string, attachmentPointId: string): AttachmentResult {
    const building = moduleManager.getBuilding(buildingId);
    if (!building) {
      return { success: false, error: `Building ${buildingId} not found` };
    }

    const attachmentPoint = building.attachmentPoints.find(p => p.id === attachmentPointId);
    if (!attachmentPoint) {
      return { success: false, error: `Attachment point ${attachmentPointId} not found` };
    }

    // Check if attachment point is valid for this module type
    if (!attachmentPoint.allowedTypes.includes(moduleType)) {
      return { 
        success: false, 
        error: `Module type ${moduleType} not allowed at attachment point ${attachmentPointId}` 
      };
    }

    // Check if attachment point is already occupied
    if (attachmentPoint.currentModule) {
      return { 
        success: false, 
        error: `Attachment point ${attachmentPointId} already has a module` 
      };
    }

    // Create the actual module
    const {position} = attachmentPoint;
    const module = moduleManager.createModule(moduleType, position);

    // Attach the module
    const attached = moduleManager.attachModule(module.id, buildingId, attachmentPointId);
    if (!attached) {
      return { 
        success: false, 
        error: 'Failed to attach module' 
      };
    }

    // Clear visualization
    this.previewModule = null;
    this.clearAttachmentVisualization(buildingId);

    return {
      success: true,
      moduleId: module.id,
      buildingId,
      attachmentPointId
    };
  }

  /**
   * Find valid attachment points for a module
   */
  private findValidAttachmentPoints(module: BaseModule, building: ModularBuilding): void {
    const validPoints: ModuleAttachmentPoint[] = [];
    const incompatiblePoints: ModuleAttachmentPoint[] = [];

    for (const point of building.attachmentPoints) {
      // Skip points that already have modules
      if (point.currentModule) {
        continue;
      }

      // Check if module type is allowed at this point
      if (point.allowedTypes.includes(module.type)) {
        validPoints.push(point);
      } else {
        incompatiblePoints.push(point);
      }
    }

    this.validAttachmentPoints.set(building.id, validPoints);
    this.incompatibleAttachmentPoints.set(building.id, incompatiblePoints);
  }

  /**
   * Show attachment visualization
   */
  private showAttachmentVisualization(buildingId: string): void {
    // This would be implemented with actual UI visualization code
    // For now, we'll just log the information
    const validPoints = this.validAttachmentPoints.get(buildingId) || [];
    const incompatiblePoints = this.incompatibleAttachmentPoints.get(buildingId) || [];

    console.debug(`[ModuleAttachmentManager] Showing attachment visualization for building ${buildingId}`);
    console.debug(`Valid attachment points: ${validPoints.map(p => p.id).join(', ')}`);
    
    if (this.visualizationOptions.highlightIncompatible) {
      console.debug(`Incompatible attachment points: ${incompatiblePoints.map(p => p.id).join(', ')}`);
    }
  }

  /**
   * Clear attachment visualization
   */
  private clearAttachmentVisualization(buildingId: string): void {
    // This would be implemented with actual UI visualization code
    console.debug(`[ModuleAttachmentManager] Clearing attachment visualization for building ${buildingId}`);
    
    this.validAttachmentPoints.delete(buildingId);
    this.incompatibleAttachmentPoints.delete(buildingId);
  }

  /**
   * Show attachment preview at a specific point
   */
  public showAttachmentPreview(buildingId: string, attachmentPointId: string): void {
    if (!this.previewModule || !this.visualizationOptions.showAttachmentPreview) {
      return;
    }

    const building = moduleManager.getBuilding(buildingId);
    if (!building) {
      return;
    }

    const attachmentPoint = building.attachmentPoints.find(p => p.id === attachmentPointId);
    if (!attachmentPoint) {
      return;
    }

    // This would be implemented with actual UI preview code
    console.debug(`[ModuleAttachmentManager] Showing attachment preview for module ${this.previewModule.type} at point ${attachmentPointId}`);
  }

  /**
   * Get valid attachment points for a building
   */
  public getValidAttachmentPoints(buildingId: string): ModuleAttachmentPoint[] {
    return this.validAttachmentPoints.get(buildingId) || [];
  }

  /**
   * Get incompatible attachment points for a building
   */
  public getIncompatibleAttachmentPoints(buildingId: string): ModuleAttachmentPoint[] {
    return this.incompatibleAttachmentPoints.get(buildingId) || [];
  }

  /**
   * Check if a module can be attached to a specific point
   */
  public canAttachToPoint(moduleType: ModuleType, buildingId: string, attachmentPointId: string): boolean {
    const building = moduleManager.getBuilding(buildingId);
    if (!building) {
      return false;
    }

    const attachmentPoint = building.attachmentPoints.find(p => p.id === attachmentPointId);
    if (!attachmentPoint) {
      return false;
    }

    // Check if attachment point already has a module
    if (attachmentPoint.currentModule) {
      return false;
    }

    // Check if module type is allowed at this point
    return attachmentPoint.allowedTypes.includes(moduleType);
  }

  /**
   * Detach a module from a building
   */
  public detachModule(moduleId: string, buildingId: string): AttachmentResult {
    const building = moduleManager.getBuilding(buildingId);
    if (!building) {
      return { success: false, error: `Building ${buildingId} not found` };
    }

    // Find the attachment point that has this module
    const attachmentPoint = building.attachmentPoints.find(
      p => p.currentModule && p.currentModule.id === moduleId
    );

    if (!attachmentPoint) {
      return { 
        success: false, 
        error: `Module ${moduleId} not found in building ${buildingId}` 
      };
    }

    // Remove the module from the attachment point
    if (attachmentPoint.currentModule) {
      const moduleType = attachmentPoint.currentModule.type;
      attachmentPoint.currentModule = undefined;

      // Remove the module from the building's modules array
      building.modules = building.modules.filter(m => m.id !== moduleId);

      // Emit detachment event
      moduleEventBus.emit({
        type: 'MODULE_DETACHED' as ModuleEventType,
        moduleId,
        moduleType,
        timestamp: Date.now(),
        data: {
          buildingId,
          attachmentPointId: attachmentPoint.id
        }
      });

      return {
        success: true,
        moduleId,
        buildingId,
        attachmentPointId: attachmentPoint.id
      };
    }

    return { 
      success: false, 
      error: `Module ${moduleId} not found in building ${buildingId}` 
    };
  }

  /**
   * Get visualization options
   */
  public getVisualizationOptions(): AttachmentVisualizationOptions {
    return { ...this.visualizationOptions };
  }

  /**
   * Update visualization options
   */
  public updateVisualizationOptions(options: Partial<AttachmentVisualizationOptions>): void {
    this.visualizationOptions = {
      ...this.visualizationOptions,
      ...options
    };
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Unsubscribe from events
    const unsubscribeAttached = moduleEventBus.subscribe('MODULE_ATTACHED' as ModuleEventType, this.handleModuleAttached);
    const unsubscribeDetached = moduleEventBus.subscribe('MODULE_DETACHED' as ModuleEventType, this.handleModuleDetached);
    
    // Call the unsubscribe functions
    if (typeof unsubscribeAttached === 'function') {
      unsubscribeAttached();
    }
    
    if (typeof unsubscribeDetached === 'function') {
      unsubscribeDetached();
    }
    
    // Clear data
    this.previewModule = null;
    this.validAttachmentPoints.clear();
    this.incompatibleAttachmentPoints.clear();
  }
}

// Export singleton instance
export const moduleAttachmentManager = new ModuleAttachmentManager(); 