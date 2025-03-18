import { ModuleType } from '../../buildings/ModuleTypes';
import { ResourceType } from '../../resources/ResourceTypes';
import { EventType } from '../EventTypes';
import {
  ModuleStatusEventData,
  PopulationEventData,
  ResourceEventData,
  StandardizedEvent,
  TradeRouteEventData,
  isValidModuleStatusEventData,
  isValidPopulationEventData,
  isValidResourceEventData,
  isValidStandardizedEvent,
  isValidTradeRouteEventData,
} from '../StandardizedEvents';

describe('Event Validation Functions', () => {
  describe('isValidStandardizedEvent', () => {
    it('should validate a correctly formatted event', () => {
      const validEvent: StandardizedEvent = {
        type: EventType.MODULE_STATUS_CHANGED,
        moduleId: 'test-module-1',
        moduleType: 'RESOURCE_COLLECTOR' as ModuleType,
        timestamp: Date.now(),
        data: {
          status: 'active',
          previousStatus: 'inactive',
        },
      };
      expect(isValidStandardizedEvent(validEvent)).toBe(true);
    });

    it('should reject an event with missing required fields', () => {
      const invalidEvent: Partial<StandardizedEvent> = {
        type: EventType.MODULE_STATUS_CHANGED,
        moduleId: 'test-module-1',
        // missing moduleType and timestamp
        data: {
          status: 'active',
        },
      };
      expect(isValidStandardizedEvent(invalidEvent)).toBe(false);
    });
  });

  describe('isValidResourceEventData', () => {
    it('should validate correct resource event data', () => {
      const validData: ResourceEventData = {
        resourceType: ResourceType.MINERALS,
        amount: 100,
        reason: 'production',
      };
      expect(isValidResourceEventData(validData)).toBe(true);
    });

    it('should reject invalid resource event data', () => {
      const invalidData: Partial<ResourceEventData> = {
        resourceType: 'INVALID_TYPE' as ResourceType,
        amount: 'not a number' as unknown as number,
      };
      expect(isValidResourceEventData(invalidData)).toBe(false);
    });
  });

  describe('isValidPopulationEventData', () => {
    it('should validate correct population event data', () => {
      const validData: PopulationEventData = {
        stats: {
          [ResourceType.POPULATION]: 100,
        },
        reason: 'growth',
      };
      expect(isValidPopulationEventData(validData)).toBe(true);
    });

    it('should reject invalid population event data', () => {
      const invalidData: Partial<PopulationEventData> = {
        stats: {
          [ResourceType.POPULATION]: 'not a number' as unknown as number,
        },
      };
      expect(isValidPopulationEventData(invalidData)).toBe(false);
    });
  });

  describe('isValidModuleStatusEventData', () => {
    it('should validate correct module status event data', () => {
      const validData: ModuleStatusEventData = {
        status: 'active',
        previousStatus: 'inactive',
        reason: 'user activated',
      };
      expect(isValidModuleStatusEventData(validData)).toBe(true);
    });

    it('should reject invalid module status event data', () => {
      const invalidData: Partial<ModuleStatusEventData> = {
        status: 'unknown' as 'active' | 'inactive' | 'error' | 'maintenance',
        previousStatus: 'invalid' as 'active' | 'inactive' | 'error' | 'maintenance',
        reason: {} as unknown as string,
      };
      expect(isValidModuleStatusEventData(invalidData)).toBe(false);
    });
  });

  describe('isValidTradeRouteEventData', () => {
    it('should validate correct trade route event data', () => {
      const validData: TradeRouteEventData = {
        partnerId: 'colony-1',
        tradeResources: [ResourceType.MINERALS, ResourceType.ENERGY],
        efficiency: 0.85,
      };
      expect(isValidTradeRouteEventData(validData)).toBe(true);
    });

    it('should reject invalid trade route event data', () => {
      const invalidData: Partial<TradeRouteEventData> = {
        partnerId: null as unknown as string,
        tradeResources: 'not an array' as unknown as Array<ResourceType>,
      };
      expect(isValidTradeRouteEventData(invalidData)).toBe(false);
    });
  });
});
