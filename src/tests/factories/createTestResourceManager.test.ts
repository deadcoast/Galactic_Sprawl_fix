import { beforeEach, describe, expect, it } from 'vitest';
import {
  ResourceConsumption,
  ResourceFlow,
  ResourceProduction,
} from '../../types/resources/ResourceTypes';
import { createTestResourceManager, TestResourceManager } from './createTestResourceManager';

describe('createTestResourceManager', () => {
  let resourceManager: TestResourceManager;

  beforeEach(() => {
    resourceManager = createTestResourceManager();
  });

  describe('basic resource operations', () => {
    it('should initialize resources with default values', () => {
      // Verify initial state
      expect(resourceManager.getResourceAmount('minerals')).toBe(0);
      expect(resourceManager.getResourceAmount('energy')).toBe(0);
      expect(resourceManager.getResourceAmount('population')).toBe(0);
      expect(resourceManager.getResourceAmount('research')).toBe(0);
    });

    it('should set resource amounts', () => {
      // Act
      resourceManager.setResourceAmount('minerals', 500);
      resourceManager.setResourceAmount('energy', 1000);

      // Assert
      expect(resourceManager.getResourceAmount('minerals')).toBe(500);
      expect(resourceManager.getResourceAmount('energy')).toBe(1000);
    });

    it('should add resources', () => {
      // Arrange
      resourceManager.setResourceAmount('minerals', 500);

      // Act
      resourceManager.addResource('minerals', 300);

      // Assert
      expect(resourceManager.getResourceAmount('minerals')).toBe(800);
    });

    it('should not exceed maximum resource limits', () => {
      // Arrange - set resource to max limit
      const state = resourceManager.getResourceState('minerals');
      expect(state).toBeDefined();
      resourceManager.setResourceAmount('minerals', state!.max);

      // Act - try to add more
      resourceManager.addResource('minerals', 1000);

      // Assert - should still be at max
      expect(resourceManager.getResourceAmount('minerals')).toBe(state!.max);
    });

    it('should remove resources', () => {
      // Arrange
      resourceManager.setResourceAmount('minerals', 500);

      // Act
      const result = resourceManager.removeResource('minerals', 200);

      // Assert
      expect(result).toBe(true);
      expect(resourceManager.getResourceAmount('minerals')).toBe(300);
    });

    it('should fail to remove more resources than available', () => {
      // Arrange
      resourceManager.setResourceAmount('minerals', 500);

      // Act
      const result = resourceManager.removeResource('minerals', 600);

      // Assert
      expect(result).toBe(false);
      expect(resourceManager.getResourceAmount('minerals')).toBe(500); // Unchanged
    });
  });

  describe('resource production and consumption', () => {
    it('should register and track production', () => {
      // Arrange
      const production: ResourceProduction = {
        type: 'minerals',
        amount: 50,
        interval: 1000,
      };

      // Act
      resourceManager.registerProduction('test-producer', production);

      // Assert
      const productions = resourceManager.getProductions();
      expect(productions.size).toBe(1);
      expect(productions.get('test-producer')).toEqual(production);
    });

    it('should register and track consumption', () => {
      // Arrange
      const consumption: ResourceConsumption = {
        type: 'energy',
        amount: 25,
        interval: 1000,
        required: true,
      };

      // Act
      resourceManager.registerConsumption('test-consumer', consumption);

      // Assert
      const consumptions = resourceManager.getConsumptions();
      expect(consumptions.size).toBe(1);
      expect(consumptions.get('test-consumer')).toEqual(consumption);
    });

    it('should simulate production cycles', () => {
      // Arrange
      resourceManager.registerProduction('test-producer', {
        type: 'minerals',
        amount: 50,
        interval: 1000,
      });

      // Act
      resourceManager.simulateProduction('test-producer');

      // Assert
      expect(resourceManager.getResourceAmount('minerals')).toBe(50);

      // Act again
      resourceManager.simulateProduction('test-producer');

      // Assert cumulative production
      expect(resourceManager.getResourceAmount('minerals')).toBe(100);
    });

    it('should simulate consumption cycles', () => {
      // Arrange
      resourceManager.setResourceAmount('energy', 100);
      resourceManager.registerConsumption('test-consumer', {
        type: 'energy',
        amount: 25,
        interval: 1000,
        required: true,
      });

      // Act
      resourceManager.simulateConsumption('test-consumer');

      // Assert
      expect(resourceManager.getResourceAmount('energy')).toBe(75);

      // Act again
      resourceManager.simulateConsumption('test-consumer');

      // Assert cumulative consumption
      expect(resourceManager.getResourceAmount('energy')).toBe(50);
    });
  });

  describe('resource transfers', () => {
    it('should track resource transfers', () => {
      // Act
      resourceManager.transferResources('minerals', 100, 'source-module', 'target-module');

      // Assert
      const transfers = resourceManager.getTransferHistory();
      expect(transfers.length).toBe(1);
      expect(transfers[0].type).toBe('minerals');
      expect(transfers[0].amount).toBe(100);
      expect(transfers[0].source).toBe('source-module');
      expect(transfers[0].target).toBe('target-module');
    });

    it('should filter transfers by module', () => {
      // Arrange
      resourceManager.transferResources('minerals', 100, 'module-1', 'module-3');
      resourceManager.transferResources('energy', 50, 'module-2', 'module-3');
      resourceManager.transferResources('research', 25, 'module-3', 'module-1');

      // Act
      const module1Transfers = resourceManager.getModuleTransferHistory('module-1');

      // Assert
      expect(module1Transfers.length).toBe(2);
      expect(module1Transfers.some(t => t.source === 'module-1')).toBe(true);
      expect(module1Transfers.some(t => t.target === 'module-1')).toBe(true);
    });

    it('should filter transfers by resource type', () => {
      // Arrange
      resourceManager.transferResources('minerals', 100, 'module-1', 'module-3');
      resourceManager.transferResources('energy', 50, 'module-2', 'module-3');
      resourceManager.transferResources('minerals', 25, 'module-3', 'module-1');

      // Act
      const mineralTransfers = resourceManager.getResourceTransferHistory('minerals');

      // Assert
      expect(mineralTransfers.length).toBe(2);
      expect(mineralTransfers.every(t => t.type === 'minerals')).toBe(true);
    });
  });

  describe('resource flows', () => {
    it('should register and track flows', () => {
      // Arrange
      const flow: ResourceFlow = {
        source: 'module-1',
        target: 'module-2',
        resources: [
          {
            type: 'minerals',
            amount: 50,
            interval: 1000,
          },
        ],
      };

      // Act
      resourceManager.registerFlow('test-flow', flow);

      // Assert
      const flows = resourceManager.getFlows();
      expect(flows.size).toBe(1);
      expect(flows.get('test-flow')).toEqual(flow);
    });
  });

  describe('error handling', () => {
    it('should throw errors on demand', () => {
      // Arrange
      resourceManager.throwErrorNextOperation('Test error');

      // Act & Assert
      expect(() => resourceManager.getResourceAmount('minerals')).toThrow('Test error');

      // Subsequent operations should work normally
      expect(() => resourceManager.getResourceAmount('minerals')).not.toThrow();
    });
  });

  describe('utility methods', () => {
    it('should reset to initial state', () => {
      // Arrange
      resourceManager.setResourceAmount('minerals', 500);
      resourceManager.registerProduction('test-producer', {
        type: 'minerals',
        amount: 50,
        interval: 1000,
      });
      resourceManager.transferResources('minerals', 100, 'module-1', 'module-2');

      // Act
      resourceManager.reset();

      // Assert
      expect(resourceManager.getResourceAmount('minerals')).toBe(0);
      expect(resourceManager.getProductions().size).toBe(0);
      expect(resourceManager.getTransferHistory().length).toBe(0);
    });

    it('should set initial resources for testing', () => {
      // Act
      resourceManager.setInitialResources({
        minerals: 500,
        energy: 1000,
        population: 100,
      });

      // Assert
      expect(resourceManager.getResourceAmount('minerals')).toBe(500);
      expect(resourceManager.getResourceAmount('energy')).toBe(1000);
      expect(resourceManager.getResourceAmount('population')).toBe(100);
      expect(resourceManager.getResourceAmount('research')).toBe(0); // Unchanged
    });

    it('should check if a resource amount is available', () => {
      // Arrange
      resourceManager.setResourceAmount('minerals', 500);

      // Act & Assert
      expect(resourceManager.hasResource('minerals', 300)).toBe(true);
      expect(resourceManager.hasResource('minerals', 600)).toBe(false);
      expect(resourceManager.hasResource('energy', 100)).toBe(false);
    });
  });

  describe('getAllResources and getAllResourceStates', () => {
    it('should return all resources as an object', () => {
      // Arrange
      resourceManager.setInitialResources({
        minerals: 500,
        energy: 1000,
        population: 100,
      });

      // Act
      const resources = resourceManager.getAllResources();

      // Assert
      expect(resources).toEqual(
        expect.objectContaining({
          minerals: 500,
          energy: 1000,
          population: 100,
        })
      );
    });

    it('should return all resource states', () => {
      // Arrange
      resourceManager.setInitialResources({
        minerals: 500,
        energy: 1000,
      });

      // Set production rates
      resourceManager.setResourceProduction('minerals', 50);
      resourceManager.setResourceConsumption('energy', 25);

      // Act
      const states = resourceManager.getAllResourceStates();

      // Assert
      expect(states.minerals).toEqual(
        expect.objectContaining({
          current: 500,
          production: 50,
        })
      );

      expect(states.energy).toEqual(
        expect.objectContaining({
          current: 1000,
          consumption: 25,
        })
      );
    });
  });
});
