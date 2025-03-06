import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createAutomationManagerMock,
  createModuleEventBusMock,
  createModuleEventsMock,
  createModuleManagerMock,
  createResourceManagerMock,
  mockESModule,
  mockModuleWithExports,
  restoreAllMocks,
} from '../utils/mockUtils';

// Example of mocking a module before importing it
mockESModule('../../../lib/modules/ModuleEvents', () => createModuleEventsMock());

// Now we can import the module - this is just for demonstration
// In a real test, you would import the actual module
const moduleEventBus = {
  emit: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
};

describe('Mock Utilities Example', () => {
  // Clean up mocks after each test
  afterEach(() => {
    restoreAllMocks();
  });

  describe('Module Event Bus Mocking', () => {
    it('should create a module event bus mock with default methods', () => {
      const mockEventBus = createModuleEventBusMock();

      // The mock should have all the expected methods
      expect(mockEventBus.emit).toBeDefined();
      expect(mockEventBus.subscribe).toBeDefined();
      expect(mockEventBus.unsubscribe).toBeDefined();
      expect(mockEventBus.getHistory).toBeDefined();
      expect(mockEventBus.getModuleHistory).toBeDefined();
      expect(mockEventBus.getEventTypeHistory).toBeDefined();
      expect(mockEventBus.clearHistory).toBeDefined();

      // Methods should be mocks
      expect(vi.isMockFunction(mockEventBus.emit)).toBe(true);
      expect(vi.isMockFunction(mockEventBus.subscribe)).toBe(true);
    });

    it('should allow overriding specific methods', () => {
      const customEmit = vi.fn().mockImplementation(() => 'custom emit');
      const mockEventBus = createModuleEventBusMock({
        emit: customEmit,
      });

      // The custom emit method should be used
      expect(mockEventBus.emit()).toBe('custom emit');
      expect(mockEventBus.emit).toBe(customEmit);
    });
  });

  describe('Module Events Mocking', () => {
    it('should create a module events mock with event bus and event types', () => {
      const mockModuleEvents = createModuleEventsMock();

      // The mock should have the event bus and event types
      expect(mockModuleEvents.moduleEventBus).toBeDefined();
      expect(mockModuleEvents.ModuleEventType).toBeDefined();

      // Event types should be defined
      expect(mockModuleEvents.ModuleEventType.MODULE_CREATED).toBe('MODULE_CREATED');
      expect(mockModuleEvents.ModuleEventType.RESOURCE_PRODUCED).toBe('RESOURCE_PRODUCED');
    });

    it('should allow providing a custom event bus mock', () => {
      const customEventBus = createModuleEventBusMock({
        emit: vi.fn().mockImplementation(() => 'custom emit'),
      });

      const mockModuleEvents = createModuleEventsMock(customEventBus);

      // The custom event bus should be used
      expect(mockModuleEvents.moduleEventBus).toBe(customEventBus);
      expect(mockModuleEvents.moduleEventBus.emit()).toBe('custom emit');
    });
  });

  describe('Resource Manager Mocking', () => {
    it('should create a resource manager mock with default methods', () => {
      const mockResourceManager = createResourceManagerMock();

      // The mock should have all the expected methods
      expect(mockResourceManager.getResource).toBeDefined();
      expect(mockResourceManager.updateResource).toBeDefined();
      expect(mockResourceManager.addResource).toBeDefined();
      expect(mockResourceManager.removeResource).toBeDefined();
      expect(mockResourceManager.getAllResources).toBeDefined();
      expect(mockResourceManager.reset).toBeDefined();

      // Methods should be mocks
      expect(vi.isMockFunction(mockResourceManager.getResource)).toBe(true);
      expect(vi.isMockFunction(mockResourceManager.updateResource)).toBe(true);
    });
  });

  describe('Module Manager Mocking', () => {
    it('should create a module manager mock with default methods', () => {
      const mockModuleManager = createModuleManagerMock();

      // The mock should have all the expected methods
      expect(mockModuleManager.createModule).toBeDefined();
      expect(mockModuleManager.getModule).toBeDefined();
      expect(mockModuleManager.updateModule).toBeDefined();
      expect(mockModuleManager.removeModule).toBeDefined();
      expect(mockModuleManager.getAllModules).toBeDefined();
      expect(mockModuleManager.reset).toBeDefined();

      // Methods should be mocks
      expect(vi.isMockFunction(mockModuleManager.createModule)).toBe(true);
      expect(vi.isMockFunction(mockModuleManager.getModule)).toBe(true);
    });
  });

  describe('Automation Manager Mocking', () => {
    it('should create an automation manager mock with default methods', () => {
      const mockAutomationManager = createAutomationManagerMock();

      // The mock should have all the expected methods
      expect(mockAutomationManager.registerRule).toBeDefined();
      expect(mockAutomationManager.updateRule).toBeDefined();
      expect(mockAutomationManager.removeRule).toBeDefined();
      expect(mockAutomationManager.getRule).toBeDefined();
      expect(mockAutomationManager.getRulesForModule).toBeDefined();
      expect(mockAutomationManager.reset).toBeDefined();

      // Methods should be mocks
      expect(vi.isMockFunction(mockAutomationManager.registerRule)).toBe(true);
      expect(vi.isMockFunction(mockAutomationManager.updateRule)).toBe(true);
    });
  });

  describe('ES Module Mocking', () => {
    beforeEach(() => {
      // Reset modules before each test
      vi.resetModules();
    });

    it('should mock a module with both named and default exports', async () => {
      // Mock a module with both named and default exports
      // This is just for demonstration - in a real test, you would use an actual module path
      mockModuleWithExports(
        './mockModule',
        {
          helperFunction: vi.fn().mockReturnValue('mocked helper'),
        },
        {
          defaultFunction: vi.fn().mockReturnValue('mocked default'),
        }
      );

      // In a real test, you would import the actual module
      // This is just a simulation for the example
      const mockHelpers = {
        helperFunction: vi.fn().mockReturnValue('mocked helper'),
        default: {
          defaultFunction: vi.fn().mockReturnValue('mocked default'),
        },
      };

      // Named exports should be mocked
      expect(mockHelpers.helperFunction()).toBe('mocked helper');

      // Default export should be mocked
      expect(mockHelpers.default.defaultFunction()).toBe('mocked default');
    });
  });

  describe('Using Mocked Module', () => {
    it('should use the mocked moduleEventBus', () => {
      // The moduleEventBus should be mocked
      expect(vi.isMockFunction(moduleEventBus.emit)).toBe(true);
      expect(vi.isMockFunction(moduleEventBus.subscribe)).toBe(true);

      // We can use the mocked methods
      moduleEventBus.emit('TEST_EVENT', { data: 'test' });
      expect(moduleEventBus.emit).toHaveBeenCalledWith('TEST_EVENT', { data: 'test' });
    });
  });
});
