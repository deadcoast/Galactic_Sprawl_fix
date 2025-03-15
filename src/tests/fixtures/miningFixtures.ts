import { ModuleType } from '../../types/buildings/ModuleTypes';
import { Position } from '../../types/core/GameTypes';
import { ResourceType } from "./../../types/resources/ResourceTypes";

/**
 * Mining ship status
 */
export type MiningShipStatus = 'idle' | 'mining' | 'transferring' | 'returning' | 'repairing';

/**
 * Mining ship interface
 */
export interface MiningShip {
  id: string;
  name: string;
  status: MiningShipStatus;
  efficiency: number;
  capacity: number;
  currentLoad: number;
  resourceType?: ResourceType;
  position: Position;
  targetNodeId?: string;
  durability: number;
  maxDurability: number;
  miningRate: number;
  upgradeLevel: number;
}

/**
 * Mining node type
 */
export type MiningNodeType = 'asteroid' | 'planet' | 'gasGiant' | 'nebula' | 'spaceDebris';

/**
 * Mining node interface
 */
export interface MiningNode {
  id: string;
  name: string;
  type: MiningNodeType;
  resourceType: ResourceType;
  position: Position;
  richness: number; // 0-1 scale
  depletion: number; // 0-1 scale (0 = full, 1 = depleted)
  size: number; // Size factor affecting total resources
  difficulty: number; // 0-1 scale affecting mining efficiency
  hazardLevel: number; // 0-1 scale affecting ship durability
  assignedShipIds: string[];
}

/**
 * Mining hub interface
 */
export interface MiningHub {
  id: string;
  name: string;
  moduleType: ModuleType | 'miningHub';
  position: Position;
  capacity: number;
  currentStorage: Record<ResourceType, number>;
  processingRate: number;
  efficiency: number;
  range: number;
  assignedShipIds: string[];
  connectedNodeIds: string[];
  upgradeLevel: number;
}

/**
 * Sample mining ships for testing
 */
export const miningShips: MiningShip[] = [
  {
    id: 'miningShip1',
    name: 'Excavator I',
    status: 'idle',
    efficiency: 0.8,
    capacity: 500,
    currentLoad: 0,
    position: { x: 100, y: 100 },
    durability: 1000,
    maxDurability: 1000,
    miningRate: 10,
    upgradeLevel: 1,
  },
  {
    id: 'miningShip2',
    name: 'Harvester II',
    status: 'mining',
    efficiency: 0.9,
    capacity: 800,
    currentLoad: 350,
    resourceType: ResourceType.MINERALS,
    position: { x: 150, y: 150 },
    targetNodeId: 'miningNode1',
    durability: 900,
    maxDurability: 1200,
    miningRate: 15,
    upgradeLevel: 2,
  },
  {
    id: 'miningShip3',
    name: 'Collector III',
    status: 'transferring',
    efficiency: 0.75,
    capacity: 1200,
    currentLoad: 1000,
    resourceType: ResourceType.GAS,
    position: { x: 200, y: 200 },
    targetNodeId: 'miningHub1',
    durability: 800,
    maxDurability: 1500,
    miningRate: 12,
    upgradeLevel: 3,
  },
];

/**
 * Sample mining nodes for testing
 */
export const miningNodes: MiningNode[] = [
  {
    id: 'miningNode1',
    name: 'Alpha Asteroid',
    type: 'asteroid',
    resourceType: ResourceType.MINERALS,
    position: { x: 150, y: 150 },
    richness: 0.7,
    depletion: 0.2,
    size: 2.5,
    difficulty: 0.3,
    hazardLevel: 0.1,
    assignedShipIds: ['miningShip2'],
  },
  {
    id: 'miningNode2',
    name: 'Beta Gas Cloud',
    type: 'nebula',
    resourceType: ResourceType.GAS,
    position: { x: 250, y: 250 },
    richness: 0.9,
    depletion: 0.1,
    size: 4.0,
    difficulty: 0.5,
    hazardLevel: 0.4,
    assignedShipIds: [],
  },
  {
    id: 'miningNode3',
    name: 'Gamma Planet',
    type: 'planet',
    resourceType: ResourceType.ENERGY,
    position: { x: 350, y: 350 },
    richness: 0.5,
    depletion: 0.0,
    size: 10.0,
    difficulty: 0.7,
    hazardLevel: 0.2,
    assignedShipIds: [],
  },
];

/**
 * Sample mining hubs for testing
 */
export const miningHubs: MiningHub[] = [
  {
    id: 'miningHub1',
    name: 'Primary Mining Hub',
    moduleType: 'miningHub',
    position: { x: 200, y: 200 },
    capacity: 5000,
    currentStorage: {
      minerals: 1200,
      energy: 500,
      gas: 800,
      population: 0,
      research: 0,
      plasma: 0,
      exotic: 0,
    },
    processingRate: 20,
    efficiency: 0.85,
    range: 500,
    assignedShipIds: ['miningShip1', 'miningShip3'],
    connectedNodeIds: ['miningNode1', 'miningNode2'],
    upgradeLevel: 2,
  },
  {
    id: 'miningHub2',
    name: 'Secondary Mining Hub',
    moduleType: 'miningHub',
    position: { x: 400, y: 400 },
    capacity: 3000,
    currentStorage: {
      minerals: 500,
      energy: 1000,
      gas: 200,
      population: 0,
      research: 0,
      plasma: 0,
      exotic: 0,
    },
    processingRate: 15,
    efficiency: 0.8,
    range: 400,
    assignedShipIds: [],
    connectedNodeIds: ['miningNode3'],
    upgradeLevel: 1,
  },
];

/**
 * Mining operation interface
 */
export interface MiningOperation {
  id: string;
  shipId: string;
  nodeId: string;
  resourceType: ResourceType;
  startTime: number;
  endTime?: number;
  targetAmount: number;
  currentAmount: number;
  efficiency: number;
  status: 'in_progress' | 'completed' | 'failed' | 'interrupted';
}

/**
 * Sample mining operations for testing
 */
export const miningOperations: MiningOperation[] = [
  {
    id: 'operation1',
    shipId: 'miningShip2',
    nodeId: 'miningNode1',
    resourceType: ResourceType.MINERALS,
    startTime: Date.now() - 3600000, // Started 1 hour ago
    targetAmount: 500,
    currentAmount: 350,
    efficiency: 0.85,
    status: 'in_progress',
  },
  {
    id: 'operation2',
    shipId: 'miningShip3',
    nodeId: 'miningNode2',
    resourceType: ResourceType.GAS,
    startTime: Date.now() - 7200000, // Started 2 hours ago
    endTime: Date.now() - 1800000, // Ended 30 minutes ago
    targetAmount: 1000,
    currentAmount: 1000,
    efficiency: 0.75,
    status: 'completed',
  },
];
