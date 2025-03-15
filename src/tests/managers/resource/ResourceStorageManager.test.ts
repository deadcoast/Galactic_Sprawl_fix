import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ResourceStorageManager,
  StorageContainerConfig,
} from '../../../managers/resource/ResourceStorageManager';
import { ResourceType } from "./../../../types/resources/ResourceTypes";

describe('ResourceStorageManager', () => {
  let storageManager: ResourceStorageManager;

  beforeEach(() => {
    vi.clearAllMocks();
    storageManager = new ResourceStorageManager();
  });

  afterEach(() => {
    // Clean up
    vi.restoreAllMocks();
  });

  it('should create a new instance', () => {
    expect(storageManager).toBeInstanceOf(ResourceStorageManager);
  });

  it('should register a storage container', () => {
    const config: StorageContainerConfig = {
      id: 'test-container',
      name: 'Test Container',
      type: 'container',
      capacity: 100,
      resourceTypes: [ResourceType.ENERGY as ResourceType, ResourceType.MINERALS as ResourceType],
      priority: 1,
    };

    const result = storageManager.registerContainer(config);
    expect(result).toBe(true);

    const container = storageManager.getContainer('test-container');
    expect(container).toBeDefined();
    expect(container?.config.id).toBe('test-container');
    expect(container?.resources.size).toBe(2);
  });

  it('should not register an invalid container', () => {
    const invalidConfig = {
      id: '',
      name: 'Invalid Container',
      type: 'container',
      capacity: 100,
      resourceTypes: [],
      priority: 1,
    } as StorageContainerConfig;

    const result = storageManager.registerContainer(invalidConfig);
    expect(result).toBe(false);

    const containers = storageManager.getAllContainers();
    expect(containers.length).toBe(0);
  });

  it('should unregister a container', () => {
    const config: StorageContainerConfig = {
      id: 'test-container',
      name: 'Test Container',
      type: 'container',
      capacity: 100,
      resourceTypes: [ResourceType.ENERGY as ResourceType],
      priority: 1,
    };

    storageManager.registerContainer(config);
    const result = storageManager.unregisterContainer('test-container');
    expect(result).toBe(true);

    const container = storageManager.getContainer('test-container');
    expect(container).toBeUndefined();
  });

  it('should store resources in a container', () => {
    const config: StorageContainerConfig = {
      id: 'test-container',
      name: 'Test Container',
      type: 'container',
      capacity: 100,
      resourceTypes: [ResourceType.ENERGY as ResourceType],
      priority: 1,
    };

    storageManager.registerContainer(config);

    const amountStored = storageManager.storeResource(
      'test-container',
      ResourceType.ENERGY as ResourceType,
      50
    );
    expect(amountStored).toBe(50);

    const container = storageManager.getContainer('test-container');
    expect(container?.resources.get(ResourceType.ENERGY)?.current).toBe(50);
    expect(container?.totalStored).toBe(50);
  });

  it('should handle storage capacity limits', () => {
    const config: StorageContainerConfig = {
      id: 'test-container',
      name: 'Test Container',
      type: 'container',
      capacity: 100,
      resourceTypes: [ResourceType.ENERGY as ResourceType],
      priority: 1,
    };

    storageManager.registerContainer(config);

    // Store up to capacity
    storageManager.storeResource('test-container', ResourceType.ENERGY as ResourceType, 80);

    // Try to store more than remaining capacity
    const amountStored = storageManager.storeResource(
      'test-container',
      ResourceType.ENERGY as ResourceType,
      30
    );
    expect(amountStored).toBe(20); // Only 20 more can be stored

    const container = storageManager.getContainer('test-container');
    expect(container?.resources.get(ResourceType.ENERGY)?.current).toBe(100); // Max capacity
  });

  it('should retrieve resources from a container', () => {
    const config: StorageContainerConfig = {
      id: 'test-container',
      name: 'Test Container',
      type: 'container',
      capacity: 100,
      resourceTypes: [ResourceType.ENERGY as ResourceType],
      priority: 1,
    };

    storageManager.registerContainer(config);
    storageManager.storeResource('test-container', ResourceType.ENERGY as ResourceType, 50);

    const amountRetrieved = storageManager.retrieveResource(
      'test-container',
      ResourceType.ENERGY as ResourceType,
      30
    );
    expect(amountRetrieved).toBe(30);

    const container = storageManager.getContainer('test-container');
    expect(container?.resources.get(ResourceType.ENERGY)?.current).toBe(20);
    expect(container?.totalStored).toBe(20);
  });

  it('should not retrieve more than available', () => {
    const config: StorageContainerConfig = {
      id: 'test-container',
      name: 'Test Container',
      type: 'container',
      capacity: 100,
      resourceTypes: [ResourceType.ENERGY as ResourceType],
      priority: 1,
    };

    storageManager.registerContainer(config);
    storageManager.storeResource('test-container', ResourceType.ENERGY as ResourceType, 50);

    const amountRetrieved = storageManager.retrieveResource(
      'test-container',
      ResourceType.ENERGY as ResourceType,
      70
    );
    expect(amountRetrieved).toBe(50); // Only 50 available

    const container = storageManager.getContainer('test-container');
    expect(container?.resources.get(ResourceType.ENERGY)?.current).toBe(0);
  });

  it('should get containers by resource type', () => {
    // Register multiple containers
    storageManager.registerContainer({
      id: 'energy-container',
      name: 'Energy Container',
      type: 'container',
      capacity: 100,
      resourceTypes: [ResourceType.ENERGY as ResourceType],
      priority: 1,
    });

    storageManager.registerContainer({
      id: 'mineral-container',
      name: 'Mineral Container',
      type: 'container',
      capacity: 100,
      resourceTypes: [ResourceType.MINERALS as ResourceType],
      priority: 1,
    });

    storageManager.registerContainer({
      id: 'mixed-container',
      name: 'Mixed Container',
      type: 'container',
      capacity: 100,
      resourceTypes: [ResourceType.ENERGY as ResourceType, ResourceType.MINERALS as ResourceType],
      priority: 1,
    });

    const energyContainers = storageManager.getContainersByResourceType(ResourceType.ENERGY as ResourceType);
    expect(energyContainers.length).toBe(2);
    expect(energyContainers[0].config.id).toBe('energy-container');
    expect(energyContainers[1].config.id).toBe('mixed-container');

    const mineralContainers = storageManager.getContainersByResourceType(
      ResourceType.MINERALS as ResourceType
    );
    expect(mineralContainers.length).toBe(2);
    expect(mineralContainers[0].config.id).toBe('mineral-container');
    expect(mineralContainers[1].config.id).toBe('mixed-container');
  });
});
