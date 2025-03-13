import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResourceSystem } from '../../resource/ResourceSystem';
import { ResourceType } from '../../types/resources/ResourceTypes';
import { StorageContainerConfig } from '../../resource/subsystems/ResourceStorageSubsystem';
import { eventSystem } from '../../lib/events/UnifiedEventSystem';

// Mock event system publish to avoid side effects
vi.mock('../../lib/events/UnifiedEventSystem', () => ({
  eventSystem: {
    publish: vi.fn(),
    subscribe: vi.fn().mockReturnValue(() => {}),
    getInstance: vi.fn().mockReturnThis(),
  },
}));

describe('ResourceSystem', () => {
  let resourceSystem: ResourceSystem;

  beforeEach(async () => {
    // Reset ResourceSystem singleton between tests
    ResourceSystem['resetInstance']('ResourceSystem');
    
    // Get a fresh instance
    resourceSystem = ResourceSystem.getInstance();
    
    // Initialize the system
    await resourceSystem.initialize();
  });

  afterEach(async () => {
    // Clean up
    await resourceSystem.dispose();
    vi.clearAllMocks();
  });

  it('should create a new instance and initialize subsystems', () => {
    expect(resourceSystem).toBeInstanceOf(ResourceSystem);
    expect(resourceSystem['storage']).toBeDefined();
    expect(resourceSystem['flow']).toBeDefined();
    expect(resourceSystem['transfer']).toBeDefined();
    expect(resourceSystem['threshold']).toBeDefined();
  });

  it('should update and retrieve resource states', () => {
    const energyState = {
      current: 100,
      max: 1000,
      min: 0,
      production: 10,
      consumption: 5,
    };

    resourceSystem.updateResourceState('energy', energyState);
    const retrievedState = resourceSystem.getResourceState('energy');

    expect(retrievedState).toEqual(energyState);
  });

  it('should register and use storage containers', () => {
    // Create a container config
    const containerConfig: StorageContainerConfig = {
      id: 'test-container',
      name: 'Test Container',
      type: 'container',
      capacity: 1000,
      resourceTypes: ['energy' as ResourceType, 'minerals' as ResourceType],
      priority: 1,
    };

    // Register the container
    const storageSubsystem = resourceSystem.getStorageSubsystem();
    const registered = storageSubsystem.registerContainer(containerConfig);
    expect(registered).toBe(true);

    // Store some resources
    const stored = resourceSystem.storeResource('energy', 100, 'test-container');
    expect(stored).toBe(100);

    // Retrieve resources
    const retrieved = resourceSystem.retrieveResource('energy', 50, 'test-container');
    expect(retrieved).toBe(50);

    // Check container state
    const container = storageSubsystem.getContainer('test-container');
    expect(container).toBeDefined();
    if (container) {
      const energyState = container.resources.get('energy');
      expect(energyState?.current).toBe(50); // 100 stored - 50 retrieved
    }
  });

  it('should register and use flow nodes and connections', () => {
    // Register producer and consumer nodes
    const flowSubsystem = resourceSystem.getFlowSubsystem();
    
    flowSubsystem.registerNode({
      id: 'producer-1',
      type: 'producer',
      resources: ['energy' as ResourceType],
      priority: { type: 'energy' as ResourceType, priority: 1, consumers: [] },
      active: true,
      efficiency: 1.0,
    });
    
    flowSubsystem.registerNode({
      id: 'consumer-1',
      type: 'consumer',
      resources: ['energy' as ResourceType],
      priority: { type: 'energy' as ResourceType, priority: 1, consumers: [] },
      active: true,
    });

    // Register a connection
    const registered = resourceSystem.registerResourceFlow(
      'producer-1',
      'consumer-1',
      'energy',
      10
    );
    expect(registered).toBe(true);

    // Optimize flows
    const optimizationResult = flowSubsystem.optimizeFlows();
    expect(optimizationResult).resolves.toBeDefined();
    expect(optimizationResult).resolves.toHaveProperty('updatedConnections');
  });

  it('should handle resource transfers between entities', async () => {
    // Create storage containers
    resourceSystem.getStorageSubsystem().registerContainer({
      id: 'source-container',
      name: 'Source Container',
      type: 'container',
      capacity: 1000,
      resourceTypes: ['energy' as ResourceType],
      priority: 1,
    });
    
    resourceSystem.getStorageSubsystem().registerContainer({
      id: 'target-container',
      name: 'Target Container',
      type: 'container',
      capacity: 1000,
      resourceTypes: ['energy' as ResourceType],
      priority: 1,
    });

    // Store resources in source container
    resourceSystem.storeResource('energy', 100, 'source-container');

    // Transfer resources
    const transferred = resourceSystem.transferResource(
      'energy',
      50,
      'source-container',
      'target-container'
    );
    expect(transferred).toBe(50);

    // Check container states
    const sourceContainer = resourceSystem.getStorageSubsystem().getContainer('source-container');
    const targetContainer = resourceSystem.getStorageSubsystem().getContainer('target-container');
    
    if (sourceContainer && targetContainer) {
      const sourceEnergy = sourceContainer.resources.get('energy');
      const targetEnergy = targetContainer.resources.get('energy');
      
      expect(sourceEnergy?.current).toBe(50); // 100 - 50
      expect(targetEnergy?.current).toBe(50); // 0 + 50
    }

    // Check transfer history
    const transferHistory = resourceSystem.getTransferHistory();
    expect(transferHistory.length).toBeGreaterThan(0);
    expect(transferHistory[0].source).toBe('source-container');
    expect(transferHistory[0].target).toBe('target-container');
    expect(transferHistory[0].amount).toBe(50);
  });

  it('should register and trigger resource thresholds', () => {
    // Register a threshold
    const thresholdSubsystem = resourceSystem.getThresholdSubsystem();
    
    thresholdSubsystem.registerThreshold({
      id: 'test-threshold',
      resourceType: 'energy',
      thresholdType: 'absolute',
      comparison: 'less_than',
      value: 50,
      action: 'alert',
      actionData: { message: 'Energy low!' },
      enabled: true,
    });

    // Set resource state below threshold
    resourceSystem.updateResourceState('energy', {
      current: 40,
      max: 1000,
      min: 0,
      production: 10,
      consumption: 5,
    });

    // Check if event was published
    expect(eventSystem.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'RESOURCE_THRESHOLD_REACHED',
      })
    );
  });

  it('should convert resources from one type to another', () => {
    // Create a container
    resourceSystem.getStorageSubsystem().registerContainer({
      id: 'converter-container',
      name: 'Converter Container',
      type: 'container',
      capacity: 1000,
      resourceTypes: ['minerals' as ResourceType, 'energy' as ResourceType],
      priority: 1,
    });

    // Store minerals in container
    resourceSystem.storeResource('minerals', 100, 'converter-container');

    // Convert minerals to energy
    const converted = resourceSystem.convertResources(
      'minerals',
      50,
      'energy',
      25,
      'converter-container'
    );
    expect(converted).toBe(true);

    // Check container state
    const container = resourceSystem.getStorageSubsystem().getContainer('converter-container');
    if (container) {
      const mineralsState = container.resources.get('minerals');
      const energyState = container.resources.get('energy');
      
      expect(mineralsState?.current).toBe(50); // 100 - 50
      expect(energyState?.current).toBe(25); // 0 + 25
    }
  });
});