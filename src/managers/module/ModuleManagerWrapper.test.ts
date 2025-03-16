import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventBus } from '../../lib/events/EventBus';
import { BaseModule, ModularBuilding } from '../../types/buildings/ModuleTypes';
import { BaseEvent } from '../../types/events/EventTypes';
import { ModuleManager } from './ModuleManager';
import { ModuleManagerWrapper, convertToModule, convertToModules } from './ModuleManagerWrapper';

// Define a mock interface for the ModuleManager to avoid 'any'
interface MockModuleManager {
  getActiveModules: () => BaseModule[];
  getModule?: (id: string) => BaseModule | undefined;
  getModulesByType: (type: string) => BaseModule[];
  getBuildings?: () => ModularBuilding[];
  setModuleActive?: (moduleId: string, active: boolean) => void;
  eventBus: EventBus<BaseEvent>;
  dispatchAction?: (action: unknown) => void;
  dispatch?: (action: unknown) => void;
}

describe('ModuleManagerWrapper', () => {
  describe('Type Conversion (...args: unknown[]) => unknowns', () => {
    it('should convert BaseModule to Module with convertToModule', () => {
      // Create a mock BaseModule
      const baseModule: BaseModule = {
        id: 'module-1',
        name: 'Test Module',
        type: 'radar',
        position: { x: 10, y: 10 },
        isActive: true,
        level: 2,
        status: 'active',
        progress: 0.5,
        subModules: [],
      };

      // Add runtime-only properties that exist in practice but not in type definition
      const extendedModule = {
        ...baseModule,
        buildingId: 'building-1',
        attachmentPointId: 'point-1',
      };

      // Convert to Module
      const result = convertToModule(extendedModule as BaseModule);

      // Verify conversion
      expect(result).toBeDefined();
      expect(result?.id).toBe('module-1');
      expect(result?.name).toBe('Test Module');
      expect(result?.type).toBe('radar');
      expect(result?.buildingId).toBe('building-1');
      expect(result?.attachmentPointId).toBe('point-1');
      expect(result?.position).toEqual({ x: 10, y: 10 });
      expect(result?.isActive).toBe(true);
      expect(result?.level).toBe(2);
      expect(result?.status).toBe('active');
      expect(result?.progress).toBe(0.5);
    });

    it('should handle undefined input in convertToModule', () => {
      const result = convertToModule(undefined);
      expect(result).toBeUndefined();
    });

    it('should convert an array of BaseModules to Modules with convertToModules', () => {
      // Create mock BaseModules
      const baseModules: BaseModule[] = [
        {
          id: 'module-1',
          name: 'Test Module 1',
          type: 'radar',
          position: { x: 10, y: 10 },
          isActive: true,
          level: 2,
          status: 'active',
        },
        {
          id: 'module-2',
          name: 'Test Module 2',
          type: 'hangar',
          position: { x: 20, y: 20 },
          isActive: false,
          level: 1,
          status: 'inactive',
        },
      ];

      // Convert to Modules
      const results = convertToModules(baseModules);

      // Verify conversion
      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('module-1');
      expect(results[0].type).toBe('radar');
      expect(results[1].id).toBe('module-2');
      expect(results[1].type).toBe('hangar');
    });
  });

  describe('ModuleManagerWrapper Class', () => {
    let mockModuleManager: MockModuleManager;
    let wrapper: ModuleManagerWrapper;

    beforeEach(() => {
      // Create a mock ModuleManager
      mockModuleManager = {
        getActiveModules: vi.fn().mockReturnValue([]),
        getModule: vi.fn(),
        getModulesByType: vi.fn().mockReturnValue([]),
        getBuildings: vi.fn().mockReturnValue([]),
        setModuleActive: vi.fn(),
        eventBus: { subscribe: vi.fn() } as unknown as EventBus<BaseEvent>,
      };

      wrapper = new ModuleManagerWrapper(mockModuleManager as unknown as ModuleManager);
    });

    it('should convert modules when calling getModules', () => {
      // Mock the result of getActiveModules
      const mockModules: BaseModule[] = [
        {
          id: 'module-1',
          name: 'Test Module',
          type: 'radar',
          position: { x: 10, y: 10 },
          isActive: true,
          level: 2,
          status: 'active',
        },
      ];

      (mockModuleManager.getActiveModules as jest.Mock).mockReturnValue(mockModules);

      // Call the method
      const results = wrapper.getModules();

      // Verify conversion
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('module-1');
      expect(results[0].type).toBe('radar');

      // Verify the original function was called
      expect(mockModuleManager.getActiveModules).toHaveBeenCalled();
    });

    it('should convert module when calling getModule', () => {
      // Mock the result of getModule
      const mockModule: BaseModule = {
        id: 'module-1',
        name: 'Test Module',
        type: 'radar',
        position: { x: 10, y: 10 },
        isActive: true,
        level: 2,
        status: 'active',
      };

      (mockModuleManager.getModule as jest.Mock).mockReturnValue(mockModule);

      // Call the method
      const result = wrapper.getModule('module-1');

      // Verify conversion
      expect(result).toBeDefined();
      expect(result?.id).toBe('module-1');
      expect(result?.type).toBe('radar');

      // Verify the original function was called
      expect(mockModuleManager.getModule).toHaveBeenCalledWith('module-1');
    });

    it('should properly handle dispatch with dispatchAction', () => {
      // Mock manager with dispatchAction
      const mockManagerWithDispatchAction: MockModuleManager = {
        ...mockModuleManager,
        dispatchAction: vi.fn(),
      };

      const wrapperWithDispatchAction = new ModuleManagerWrapper(
        mockManagerWithDispatchAction as unknown as ModuleManager
      );

      // Create action
      const action = { type: 'TEST_ACTION', moduleId: 'module-1' };

      // Call dispatch
      wrapperWithDispatchAction.dispatch(action);

      // Verify dispatchAction was called
      expect(mockManagerWithDispatchAction.dispatchAction).toHaveBeenCalledWith(action);
    });

    it('should properly handle dispatch with dispatch', () => {
      // Mock manager with dispatch
      const mockManagerWithDispatch: MockModuleManager = {
        ...mockModuleManager,
        dispatch: vi.fn(),
      };

      const wrapperWithDispatch = new ModuleManagerWrapper(
        mockManagerWithDispatch as unknown as ModuleManager
      );

      // Create action
      const action = { type: 'TEST_ACTION', moduleId: 'module-1' };

      // Call dispatch
      wrapperWithDispatch.dispatch(action);

      // Verify dispatch was called
      expect(mockManagerWithDispatch.dispatch).toHaveBeenCalledWith(action);
    });

    it('should properly handle dispatch when neither method exists', () => {
      // Mock warning
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Create action
      const action = { type: 'TEST_ACTION', moduleId: 'module-1' };

      // Call dispatch
      wrapper.dispatch(action);

      // Verify warning was logged
      expect(consoleWarnSpy).toHaveBeenCalled();

      // Clean up
      consoleWarnSpy.mockRestore();
    });
  });
});
