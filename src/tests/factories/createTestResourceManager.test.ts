import { ResourceType } from "./../../types/resources/ResourceTypes";
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
      expect(resourceManager.getResourceAmount(ResourceType.MINERALS)).toBe(0);
      expect(resourceManager.getResourceAmount(ResourceType.ENERGY)).toBe(0);
      expect(resourceManager.getResourceAmount(ResourceType.POPULATION)).toBe(0);
      expect(resourceManager.getResourceAmount(ResourceType.RESEARCH)).toBe(0);
    });

    it('should set resource amounts', () => {
      // Act
      resourceManager.setResourceAmount(ResourceType.MINERALS, 500);
      resourceManager.setResourceAmount(ResourceType.ENERGY, 1000);

      // Assert
      expect(resourceManager.getResourceAmount(ResourceType.MINERALS)).toBe(500);
      expect(resourceManager.getResourceAmount(ResourceType.ENERGY)).toBe(1000);
    });

    it('should add resources', () => {
      // Arrange
      resourceManager.setResourceAmount(ResourceType.MINERALS, 500);

      // Act
      resourceManager.addResource(ResourceType.MINERALS, 300);

      // Assert
      expect(resourceManager.getResourceAmount(ResourceType.MINERALS)).toBe(800);
    });

    it('should not exceed maximum resource limits', () => {
      // Arrange - set resource to max limit
      const state = resourceManager.getResourceState(ResourceType.MINERALS);
      expect(state).toBeDefined();
      resourceManager.setResourceAmount(ResourceType.MINERALS, state!.max);

      // Act - try to add more
      resourceManager.addResource(ResourceType.MINERALS, 1000);

      // Assert - should still be at max
      expect(resourceManager.getResourceAmount(ResourceType.MINERALS)).toBe(state!.max);
    });

    it('should remove resources', () => {
      // Arrange
      resourceManager.setResourceAmount(ResourceType.MINERALS, 500);

      // Act
      const result = resourceManager.removeResource(ResourceType.MINERALS, 200);

      // Assert
      expect(result).toBe(true);
      expect(resourceManager.getResourceAmount(ResourceType.MINERALS)).toBe(300);
    });

    it('should fail to remove more resources than available', () => {
      // Arrange
      resourceManager.setResourceAmount(ResourceType.MINERALS, 500);

      // Act
      const result = resourceManager.removeResource(ResourceType.MINERALS, 600);

      // Assert
      expect(result).toBe(false);
      expect(resourceManager.getResourceAmount(ResourceType.MINERALS)).toBe(500); // Unchanged
    });
  });

  describe('resource production and consumption', () => {
    it('should register and track production', () => {
      // Arrange
      const production: ResourceProduction = {
        type: ResourceType.MINERALS,
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
        type: ResourceType.ENERGY,
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
        type: ResourceType.MINERALS,
        amount: 50,
        interval: 1000,
      });

      // Act
      resourceManager.simulateProduction('test-producer');

      // Assert
      expect(resourceManager.getResourceAmount(ResourceType.MINERALS)).toBe(50);

      // Act again
      resourceManager.simulateProduction('test-producer');

      // Assert cumulative production
      expect(resourceManager.getResourceAmount(ResourceType.MINERALS)).toBe(100);
    });

    it('should simulate consumption cycles', () => {
      // Arrange
      resourceManager.setResourceAmount(ResourceType.ENERGY, 100);
      resourceManager.registerConsumption('test-consumer', {
        type: ResourceType.ENERGY,
        amount: 25,
        interval: 1000,
        required: true,
      });

      // Act
      resourceManager.simulateConsumption('test-consumer');

      // Assert
      expect(resourceManager.getResourceAmount(ResourceType.ENERGY)).toBe(75);

      // Act again
      resourceManager.simulateConsumption('test-consumer');

      // Assert cumulative consumption
      expect(resourceManager.getResourceAmount(ResourceType.ENERGY)).toBe(50);
    });
  });

  describe('resource transfers', () => {
    it('should track resource transfers', () => {
      // Act
      resourceManager.transferResources(ResourceType.MINERALS, 100, 'source-module', 'target-module');

      // Assert
      const transfers = resourceManager.getTransferHistory();
      expect(transfers.length).toBe(1);
      expect(transfers[0].type).toBe(ResourceType.MINERALS);
      expect(transfers[0].amount).toBe(100);
      expect(transfers[0].source).toBe('source-module');
      expect(transfers[0].target).toBe('target-module');
    });

    it('should filter transfers by module', () => {
      // Arrange
      resourceManager.transferResources(ResourceType.MINERALS, 100, 'module-1', 'module-3');
      resourceManager.transferResources(ResourceType.ENERGY, 50, 'module-2', 'module-3');
      resourceManager.transferResources(ResourceType.RESEARCH, 25, 'module-3', 'module-1');

      // Act
      const module1Transfers = resourceManager.getModuleTransferHistory('module-1');

      // Assert
      expect(module1Transfers.length).toBe(2);
      expect(module1Transfers.some(t => t.source === 'module-1')).toBe(true);
      expect(module1Transfers.some(t => t.target === 'module-1')).toBe(true);
    });

    it('should filter transfers by resource type', () => {
      // Arrange
      resourceManager.transferResources(ResourceType.MINERALS, 100, 'module-1', 'module-3');
      resourceManager.transferResources(ResourceType.ENERGY, 50, 'module-2', 'module-3');
      resourceManager.transferResources(ResourceType.MINERALS, 25, 'module-3', 'module-1');

      // Act
      const mineralTransfers = resourceManager.getResourceTransferHistory(ResourceType.MINERALS);

      // Assert
      expect(mineralTransfers.length).toBe(2);
      expect(mineralTransfers.every(t => t.type === ResourceType.MINERALS)).toBe(true);
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
            type: ResourceType.MINERALS,
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
      expect(() => resourceManager.getResourceAmount(ResourceType.MINERALS)).toThrow('Test error');

      // Subsequent operations should work normally
      expect(() => resourceManager.getResourceAmount(ResourceType.MINERALS)).not.toThrow();
    });
  });

  describe('utility methods', () => {
    it('should reset to initial state', () => {
      // Arrange
      resourceManager.setResourceAmount(ResourceType.MINERALS, 500);
      resourceManager.registerProduction('test-producer', {
        type: ResourceType.MINERALS,
        amount: 50,
        interval: 1000,
      });
      resourceManager.transferResources(ResourceType.MINERALS, 100, 'module-1', 'module-2');

      // Act
      resourceManager.reset();

      // Assert
      expect(resourceManager.getResourceAmount(ResourceType.MINERALS)).toBe(0);
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
      expect(resourceManager.getResourceAmount(ResourceType.MINERALS)).toBe(500);
      expect(resourceManager.getResourceAmount(ResourceType.ENERGY)).toBe(1000);
      expect(resourceManager.getResourceAmount(ResourceType.POPULATION)).toBe(100);
      expect(resourceManager.getResourceAmount(ResourceType.RESEARCH)).toBe(0); // Unchanged
    });

    it('should check if a resource amount is available', () => {
      // Arrange
      resourceManager.setResourceAmount(ResourceType.MINERALS, 500);

      // Act & Assert
      expect(resourceManager.hasResource(ResourceType.MINERALS, 300)).toBe(true);
      expect(resourceManager.hasResource(ResourceType.MINERALS, 600)).toBe(false);
      expect(resourceManager.hasResource(ResourceType.ENERGY, 100)).toBe(false);
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
      resourceManager.setResourceProduction(ResourceType.MINERALS, 50);
      resourceManager.setResourceConsumption(ResourceType.ENERGY, 25);

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
