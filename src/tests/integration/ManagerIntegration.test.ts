import { EventBus } from '../../lib/events/EventBus';
import { serviceRegistry } from '../../lib/managers/ServiceRegistry';
import { GameLoopManager, UpdatePriority } from '../../managers/game/GameLoopManager';
import { ResourceManager } from '../../managers/game/ResourceManager';
import { ModuleManager } from '../../managers/module/ModuleManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { BaseEvent, EventType } from '../../types/events/EventTypes';
import { ResourceType } from "./../../types/resources/ResourceTypes";

// Mock timers for testing time-based functionality
jest.useFakeTimers();

describe('Manager Integration Tests', () => {
  let resourceManager: ResourceManager;
  let moduleManager: ModuleManager;
  let gameLoopManager: GameLoopManager;
  let resourceEventBus: EventBus<BaseEvent>;
  let moduleEventBus: EventBus<BaseEvent>;
  let gameLoopEventBus: EventBus<BaseEvent>;

  beforeEach(() => {
    // Create event buses for each manager
    resourceEventBus = new EventBus<BaseEvent>();
    moduleEventBus = new EventBus<BaseEvent>();
    gameLoopEventBus = new EventBus<BaseEvent>();

    // Create manager instances
    resourceManager = new ResourceManager(1000, undefined, resourceEventBus);
    moduleManager = new ModuleManager(moduleEventBus);
    gameLoopManager = new GameLoopManager(
      {
        targetFPS: 60,
        maxDeltaTime: 100,
        priorityThrottling: true,
        fixedTimestep: false,
        throttlePriorities: [UpdatePriority.LOW, UpdatePriority.BACKGROUND],
        statsInterval: 1000,
        enableStats: true,
      },
      gameLoopEventBus
    );

    // Clear and reset the service registry for each test
    serviceRegistry['services'] = new Map();
    serviceRegistry['serviceConfigs'] = new Map();
    serviceRegistry['initializedServices'] = new Set();
  });

  afterEach(() => {
    // Clean up and dispose managers after each test
    if (resourceManager.isInitialized()) {
      resourceManager.dispose();
    }

    if (moduleManager.isInitialized()) {
      moduleManager.dispose();
    }

    if (gameLoopManager) {
      gameLoopManager.stop();
    }
  });

  test('Managers can be registered with service registry and initialized', async () => {
    // Register managers with the service registry
    serviceRegistry.register(resourceManager);
    serviceRegistry.register(moduleManager, {
      dependencies: [resourceManager.name],
    });
    serviceRegistry.register(gameLoopManager, {
      dependencies: [resourceManager.name, moduleManager.name],
    });

    // Initialize all services
    await serviceRegistry.initialize();

    // Verify all managers are initialized
    expect(resourceManager.isInitialized()).toBe(true);
    expect(moduleManager.isInitialized()).toBe(true);
    expect(gameLoopManager.isInitialized()).toBe(true);

    // Verify initialization order based on dependencies
    const metadata = serviceRegistry.getServicesMetadata();
    const initOrder = metadata.map(m => m.name);

    // ResourceManager should be initialized before ModuleManager
    expect(initOrder.indexOf('ResourceManager')).toBeLessThan(initOrder.indexOf('ModuleManager'));

    // Both should be initialized before GameLoopManager
    expect(initOrder.indexOf('ResourceManager')).toBeLessThan(initOrder.indexOf('GameLoopManager'));
    expect(initOrder.indexOf('ModuleManager')).toBeLessThan(initOrder.indexOf('GameLoopManager'));
  });

  test('ResourceManager emits events when resources change', async () => {
    // Initialize the resource manager
    await resourceManager.initialize();

    // Create a mock event handler
    const mockEventHandler = jest.fn();

    // Subscribe to resource events
    const unsubscribe = resourceEventBus.subscribe(EventType.RESOURCE_UPDATED, mockEventHandler);

    // Add resources to trigger an event
    resourceManager.addResource(ResourceType.MINERALS, 100);

    // Check that the event was emitted
    expect(mockEventHandler).toHaveBeenCalled();
    expect(mockEventHandler.mock.calls[0][0].type).toBe(EventType.RESOURCE_UPDATED);

    // Clean up
    unsubscribe();
  });

  test('ModuleManager emits events when modules are created', async () => {
    // Initialize the module manager
    await moduleManager.initialize();

    // Create a mock event handler
    const mockEventHandler = jest.fn();

    // Subscribe to module events
    const unsubscribe = moduleEventBus.subscribe(EventType.MODULE_CREATED, mockEventHandler);

    // Register a module config
    moduleManager.registerModuleConfig({
      type: 'mining' as ModuleType,
      name: 'Mining Module',
      description: 'A module for mining resources',
      cost: { minerals: 100, energy: 50 },
      size: { width: 2, height: 2 },
      allowedAttachments: [],
      buildTime: 10,
      levels: [
        { level: 1, production: 10, consumption: 5 },
        { level: 2, production: 20, consumption: 10 },
      ],
    });

    // Create a module
    const module = moduleManager.createModule('mining' as ModuleType, { x: 0, y: 0 });

    // Check that the event was emitted
    expect(mockEventHandler).toHaveBeenCalled();
    expect(mockEventHandler.mock.calls[0][0].type).toBe(EventType.MODULE_CREATED);
    expect(mockEventHandler.mock.calls[0][0].moduleId).toBe(module.id);

    // Clean up
    unsubscribe();
  });

  test('GameLoopManager can register and update managers', async () => {
    // Initialize all managers
    await resourceManager.initialize();
    await moduleManager.initialize();
    await gameLoopManager.initialize();

    // Create mock update handlers
    const resourceUpdateMock = jest.fn();
    const moduleUpdateMock = jest.fn();

    // Register managers for updates
    gameLoopManager.registerUpdate(
      'resource-manager-test',
      resourceUpdateMock,
      UpdatePriority.HIGH
    );

    gameLoopManager.registerUpdate('module-manager-test', moduleUpdateMock, UpdatePriority.NORMAL);

    // Start the game loop
    gameLoopManager.start();

    // Advance time to trigger updates
    jest.advanceTimersByTime(100);

    // Check that updates were called
    expect(resourceUpdateMock).toHaveBeenCalled();
    expect(moduleUpdateMock).toHaveBeenCalled();

    // Stop the game loop
    gameLoopManager.stop();
  });

  test('Managers can communicate through events', async () => {
    // Initialize all managers
    await resourceManager.initialize();
    await moduleManager.initialize();

    // Create a mock event handler to monitor communication
    const mockResourceEventHandler = jest.fn();
    const mockModuleEventHandler = jest.fn();

    // Subscribe to events from both managers
    const unsubscribeResource = resourceEventBus.subscribe(
      EventType.RESOURCE_PRODUCED,
      mockResourceEventHandler
    );
    const unsubscribeModule = moduleEventBus.subscribe(
      EventType.MODULE_CREATED,
      mockModuleEventHandler
    );

    // Register a module config and create a module
    moduleManager.registerModuleConfig({
      type: 'mining' as ModuleType,
      name: 'Mining Module',
      description: 'A module for mining resources',
      cost: { minerals: 100, energy: 50 },
      size: { width: 2, height: 2 },
      allowedAttachments: [],
      buildTime: 10,
      levels: [
        { level: 1, production: 10, consumption: 5 },
        { level: 2, production: 20, consumption: 10 },
      ],
    });

    const module = moduleManager.createModule('mining' as ModuleType, { x: 0, y: 0 });

    // Add resources to trigger an event
    resourceManager.addResource(ResourceType.MINERALS, 100);

    // Check that both events were emitted
    expect(mockResourceEventHandler).toHaveBeenCalled();
    expect(mockModuleEventHandler).toHaveBeenCalled();

    // Clean up
    unsubscribeResource();
    unsubscribeModule();
  });

  test('ServiceRegistry properly disposes managers in reverse initialization order', async () => {
    // Register managers with the service registry
    serviceRegistry.register(resourceManager);
    serviceRegistry.register(moduleManager, {
      dependencies: [resourceManager.name],
    });
    serviceRegistry.register(gameLoopManager, {
      dependencies: [resourceManager.name, moduleManager.name],
    });

    // Initialize all services
    await serviceRegistry.initialize();

    // Create spies to monitor disposal
    const resourceManagerDisposeSpy = jest.spyOn(resourceManager, 'dispose');
    const moduleManagerDisposeSpy = jest.spyOn(moduleManager, 'dispose');
    const gameLoopManagerDisposeSpy = jest.spyOn(gameLoopManager, 'dispose');

    // Dispose all services
    await serviceRegistry.dispose();

    // Verify all managers were disposed
    expect(resourceManagerDisposeSpy).toHaveBeenCalled();
    expect(moduleManagerDisposeSpy).toHaveBeenCalled();
    expect(gameLoopManagerDisposeSpy).toHaveBeenCalled();

    // Verify disposal order (reverse of initialization)
    expect(gameLoopManagerDisposeSpy.mock.invocationCallOrder[0]).toBeLessThan(
      moduleManagerDisposeSpy.mock.invocationCallOrder[0]
    );

    expect(moduleManagerDisposeSpy.mock.invocationCallOrder[0]).toBeLessThan(
      resourceManagerDisposeSpy.mock.invocationCallOrder[0]
    );
  });
});
