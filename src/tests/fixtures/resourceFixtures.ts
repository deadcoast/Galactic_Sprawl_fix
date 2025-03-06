// src/tests/fixtures/resourceFixtures.ts
import type {
  FlowConnection,
  FlowNode,
  FlowNodeType,
} from '../../managers/resource/ResourceFlowManager';
import {
  ResourceFlow,
  ResourcePriority,
  ResourceState,
  ResourceType,
} from '../../types/resources/ResourceTypes';

/**
 * Common resource types used in tests
 */
export const resourceTypes: ResourceType[] = [
  'minerals',
  'energy',
  'population',
  'research',
  'plasma',
  'gas',
  'exotic',
];

/**
 * Resource states for testing
 */
export const resourceStates: Record<string, Partial<ResourceState>> = {
  empty: {
    current: 0,
    max: 1000,
    min: 0,
    production: 0,
    consumption: 0,
  },
  standard: {
    current: 100,
    max: 1000,
    min: 0,
    production: 10,
    consumption: 5,
  },
  abundant: {
    current: 1000,
    max: 2000,
    min: 0,
    production: 50,
    consumption: 10,
  },
};

/**
 * Resource priorities for testing
 */
export const resourcePriorities: ResourcePriority[] = [
  { type: 'energy', priority: 1, consumers: ['powerPlant', 'researchLab'] },
  { type: 'minerals', priority: 2, consumers: ['factory', 'constructionYard'] },
  { type: 'population', priority: 3, consumers: ['habitat', 'lifeSupportSystem'] },
];

/**
 * Flow nodes for testing resource flows
 */
export const flowNodes: Record<string, Partial<FlowNode>> = {
  powerPlant: {
    id: 'powerPlant1',
    type: 'producer' as FlowNodeType,
    resources: ['energy'],
    priority: { type: 'energy', priority: 1, consumers: [] },
    active: true,
  },
  factory: {
    id: 'factory1',
    type: 'consumer' as FlowNodeType,
    resources: ['energy', 'minerals'],
    priority: { type: 'energy', priority: 2, consumers: [] },
    active: true,
  },
  storage: {
    id: 'storage1',
    type: 'storage' as FlowNodeType,
    resources: ['energy', 'minerals'],
    priority: { type: 'energy', priority: 1, consumers: [] },
    capacity: 5000,
    active: true,
  },
  converter: {
    id: 'converter1',
    type: 'converter' as FlowNodeType,
    resources: ['energy', 'minerals'],
    priority: { type: 'minerals', priority: 1, consumers: [] },
    efficiency: 0.9,
    active: true,
    converterConfig: {
      supportedRecipes: ['energyToMinerals'],
      maxConcurrentProcesses: 2,
      autoStart: true,
      queueBehavior: 'fifo',
    },
  },
};

/**
 * Flow connections for testing resource flows
 */
export const flowConnections: Partial<FlowConnection>[] = [
  {
    id: 'conn1',
    source: 'powerPlant1',
    target: 'storage1',
    resourceType: 'energy',
    maxRate: 10,
    currentRate: 10,
    priority: { type: 'energy', priority: 1, consumers: [] },
    active: true,
  },
  {
    id: 'conn2',
    source: 'storage1',
    target: 'factory1',
    resourceType: 'energy',
    maxRate: 5,
    currentRate: 5,
    priority: { type: 'energy', priority: 2, consumers: [] },
    active: true,
  },
  {
    id: 'conn3',
    source: 'storage1',
    target: 'converter1',
    resourceType: 'energy',
    maxRate: 2,
    currentRate: 2,
    priority: { type: 'energy', priority: 3, consumers: [] },
    active: true,
  },
];

/**
 * Complete resource flows for testing
 */
export const resourceFlows: ResourceFlow[] = [
  {
    source: 'powerPlant1',
    target: 'storage1',
    resources: [
      {
        type: 'energy',
        amount: 10,
        interval: 1000,
      },
    ],
  },
  {
    source: 'storage1',
    target: 'factory1',
    resources: [
      {
        type: 'energy',
        amount: 5,
        interval: 1000,
      },
    ],
  },
];
