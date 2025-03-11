/**
 * Resource Network Generator
 *
 * This file provides utilities for generating randomized resource networks
 * for testing purposes, with configurable complexity and structure.
 */

import { v4 as uuidv4 } from 'uuid';
import { FlowNodeType } from '../../types/resources/FlowTypes';
import { ResourceType } from '../../types/resources/ResourceTypes';

// Type definitions for the ResourceNode and ResourceConnection
export interface ResourceNode {
  id: string;
  name: string;
  type: FlowNodeType;
  resourceType: ResourceType;
  capacity: number;
  efficiency: number;
  active: boolean;
  position?: { x: number; y: number };
  metadata?: Record<string, any>;
}

export interface ResourceConnection {
  id: string;
  sourceId: string;
  targetId: string;
  resourceType: ResourceType;
  maxFlow: number;
  priority: number;
  active: boolean;
}

// Configuration for network generation
export interface ResourceNetworkGeneratorConfig {
  /**
   * Number of nodes to generate
   */
  nodeCount: number;

  /**
   * Number of connections to generate
   */
  connectionCount: number;

  /**
   * Distribution of node types
   */
  typeDistribution?: Partial<Record<FlowNodeType, number>>;

  /**
   * Resource types to use
   */
  resourceTypes?: ResourceType[];

  /**
   * Seed for random generation (for reproducible results)
   */
  seed?: number;

  /**
   * Whether to create a connected network (all nodes reachable)
   */
  ensureConnected?: boolean;

  /**
   * Whether to add positional information for visualization
   */
  addPositions?: boolean;

  /**
   * Size of the position grid for visualization
   */
  gridSize?: { width: number; height: number };
}

/**
 * Generates a random resource network for testing
 *
 * @param config Configuration for the network generation
 * @returns Object containing the generated nodes and connections
 */
export function generateRandomResourceNetwork(config: ResourceNetworkGeneratorConfig): {
  nodes: ResourceNode[];
  connections: ResourceConnection[];
} {
  const {
    nodeCount,
    connectionCount,
    typeDistribution = {
      [FlowNodeType.PRODUCER]: 0.25,
      [FlowNodeType.CONSUMER]: 0.25,
      [FlowNodeType.STORAGE]: 0.25,
      [FlowNodeType.CONVERTER]: 0.25,
    },
    resourceTypes = Object.values(ResourceType),
    seed,
    ensureConnected = true,
    addPositions = true,
    gridSize = { width: 1000, height: 1000 },
  } = config;

  // Seed the random number generator if a seed is provided
  let randomState = seed || Date.now();
  const random = () => {
    randomState = (randomState * 9301 + 49297) % 233280;
    return randomState / 233280;
  };

  // Generate nodes
  const nodes: ResourceNode[] = [];

  // Calculate how many nodes of each type to create
  const nodeTypeCounts: Record<FlowNodeType, number> = {
    [FlowNodeType.PRODUCER]: 0,
    [FlowNodeType.CONSUMER]: 0,
    [FlowNodeType.STORAGE]: 0,
    [FlowNodeType.CONVERTER]: 0,
  };

  let remainingNodes = nodeCount;
  for (const [type, fraction] of Object.entries(typeDistribution)) {
    if (type === FlowNodeType.CONVERTER) continue; // Handle converters last

    const count = Math.round(nodeCount * (fraction as number));
    nodeTypeCounts[type as FlowNodeType] = count;
    remainingNodes -= count;
  }

  // Assign any remaining nodes to converters
  nodeTypeCounts[FlowNodeType.CONVERTER] = remainingNodes;

  // Create nodes for each type
  for (const [type, count] of Object.entries(nodeTypeCounts)) {
    for (let i = 0; i < count; i++) {
      const resourceType = resourceTypes[Math.floor(random() * resourceTypes.length)];

      const node: ResourceNode = {
        id: uuidv4(),
        name: `${type} ${i + 1}`,
        type: type as FlowNodeType,
        resourceType,
        capacity: Math.floor(random() * 900) + 100, // 100-1000
        efficiency: 0.5 + random() * 0.5, // 0.5-1.0
        active: true,
      };

      // Add position if requested
      if (addPositions) {
        node.position = {
          x: Math.floor(random() * gridSize.width),
          y: Math.floor(random() * gridSize.height),
        };
      }

      nodes.push(node);
    }
  }

  // Generate connections
  const connections: ResourceConnection[] = [];

  // Helper to find nodes of a specific type
  const getNodesOfType = (type: FlowNodeType) => nodes.filter(node => node.type === type);

  // Helper to find nodes that handle a specific resource type
  const getNodesForResourceType = (resType: ResourceType) =>
    nodes.filter(node => node.resourceType === resType);

  // Connect producers to storage or consumers
  const producers = getNodesOfType(FlowNodeType.PRODUCER);
  const storage = getNodesOfType(FlowNodeType.STORAGE);
  const consumers = getNodesOfType(FlowNodeType.CONSUMER);
  const converters = getNodesOfType(FlowNodeType.CONVERTER);

  // Function to create a connection between two nodes
  const createConnection = (sourceNode: ResourceNode, targetNode: ResourceNode) => {
    connections.push({
      id: uuidv4(),
      sourceId: sourceNode.id,
      targetId: targetNode.id,
      resourceType: sourceNode.resourceType,
      maxFlow: Math.floor(random() * 50) + 10, // 10-60
      priority: Math.floor(random() * 10) + 1, // 1-10
      active: true,
    });
  };

  // Ensure all nodes have at least one connection if ensureConnected is true
  if (ensureConnected) {
    // Connect each producer to at least one storage or consumer
    for (const producer of producers) {
      const potentialTargets = [
        ...storage.filter(s => s.resourceType === producer.resourceType),
        ...consumers.filter(c => c.resourceType === producer.resourceType),
      ];

      if (potentialTargets.length > 0) {
        const target = potentialTargets[Math.floor(random() * potentialTargets.length)];
        createConnection(producer, target);
      }
    }

    // Connect each storage to at least one consumer
    for (const store of storage) {
      const potentialTargets = consumers.filter(c => c.resourceType === store.resourceType);

      if (potentialTargets.length > 0) {
        const target = potentialTargets[Math.floor(random() * potentialTargets.length)];
        createConnection(store, target);
      }
    }

    // Connect converters to appropriate nodes
    for (const converter of converters) {
      // Connect inputs to converter (find appropriate producers or storage)
      const potentialSources = [...producers, ...storage].filter(
        n => n.resourceType !== converter.resourceType
      );

      if (potentialSources.length > 0) {
        const source = potentialSources[Math.floor(random() * potentialSources.length)];
        createConnection(source, converter);
      }

      // Connect converter to outputs (find appropriate storage or consumers)
      const potentialTargets = [...storage, ...consumers].filter(
        n => n.resourceType === converter.resourceType
      );

      if (potentialTargets.length > 0) {
        const target = potentialTargets[Math.floor(random() * potentialTargets.length)];
        createConnection(converter, target);
      }
    }
  }

  // Add remaining connections randomly until we reach the desired count
  while (connections.length < connectionCount) {
    // Pick a random source node that can be an output
    const sourcePool = [...producers, ...storage, ...converters];
    if (sourcePool.length === 0) break;

    const source = sourcePool[Math.floor(random() * sourcePool.length)];

    // Pick a random target node that can be an input
    const targetPool = [
      ...storage.filter(s => s.resourceType === source.resourceType),
      ...consumers.filter(c => c.resourceType === source.resourceType),
      ...converters.filter(c => c.resourceType !== source.resourceType),
    ];

    if (targetPool.length === 0) continue;
    const target = targetPool[Math.floor(random() * targetPool.length)];

    // Check if this connection already exists
    const connectionExists = connections.some(
      conn => conn.sourceId === source.id && conn.targetId === target.id
    );

    if (!connectionExists && source.id !== target.id) {
      createConnection(source, target);
    }
  }

  return { nodes, connections };
}

/**
 * Generates a star-shaped resource network
 *
 * In a star network, all nodes connect to a central node
 */
export function generateStarResourceNetwork(config: ResourceNetworkGeneratorConfig): {
  nodes: ResourceNode[];
  connections: ResourceConnection[];
} {
  const { nodes, connections } = generateRandomResourceNetwork({
    ...config,
    connectionCount: 0, // We'll create connections manually
  });

  // Find or create a central node (storage type)
  let centralNode: ResourceNode;
  const existingStorage = nodes.find(n => n.type === FlowNodeType.STORAGE);

  if (existingStorage) {
    centralNode = existingStorage;
  } else {
    // Create a new central storage node
    centralNode = {
      id: uuidv4(),
      name: 'Central Storage',
      type: FlowNodeType.STORAGE,
      resourceType: config.resourceTypes?.[0] || ResourceType.ENERGY,
      capacity: 10000,
      efficiency: 1.0,
      active: true,
      position: { x: 500, y: 500 },
    };
    nodes.push(centralNode);
  }

  // Connect all producers to the central node
  for (const node of nodes) {
    if (node.id === centralNode.id) continue;

    if (node.type === FlowNodeType.PRODUCER) {
      connections.push({
        id: uuidv4(),
        sourceId: node.id,
        targetId: centralNode.id,
        resourceType: node.resourceType,
        maxFlow: Math.floor(Math.random() * 50) + 10,
        priority: Math.floor(Math.random() * 10) + 1,
        active: true,
      });
    } else if (node.type === FlowNodeType.CONSUMER || node.type === FlowNodeType.CONVERTER) {
      connections.push({
        id: uuidv4(),
        sourceId: centralNode.id,
        targetId: node.id,
        resourceType: centralNode.resourceType,
        maxFlow: Math.floor(Math.random() * 50) + 10,
        priority: Math.floor(Math.random() * 10) + 1,
        active: true,
      });
    }
  }

  return { nodes, connections };
}

/**
 * Generates a mesh resource network where each node connects to multiple other nodes
 */
export function generateMeshResourceNetwork(
  config: ResourceNetworkGeneratorConfig & { connectivityFactor?: number }
): { nodes: ResourceNode[]; connections: ResourceConnection[] } {
  const { nodes } = generateRandomResourceNetwork({
    ...config,
    connectionCount: 0, // We'll create connections manually
  });

  const connections: ResourceConnection[] = [];
  const { connectivityFactor = 0.3 } = config; // 0.3 means ~30% of possible connections

  // Calculate maximum possible connections (excluding self-connections)
  const maxPossibleConnections = nodes.length * (nodes.length - 1);

  // Calculate target number of connections based on connectivity factor
  const targetConnections = Math.min(
    config.connectionCount,
    Math.floor(maxPossibleConnections * connectivityFactor)
  );

  // Create connections randomly until we reach the target
  while (connections.length < targetConnections) {
    // Pick two random nodes
    const sourceIndex = Math.floor(Math.random() * nodes.length);
    let targetIndex = Math.floor(Math.random() * nodes.length);

    // Ensure we don't connect a node to itself
    while (targetIndex === sourceIndex) {
      targetIndex = Math.floor(Math.random() * nodes.length);
    }

    const source = nodes[sourceIndex];
    const target = nodes[targetIndex];

    // Check valid connection types (producers can't receive, consumers can't provide)
    const isValidConnection =
      source.type !== FlowNodeType.CONSUMER && // Source cannot be a consumer
      target.type !== FlowNodeType.PRODUCER && // Target cannot be a producer
      (source.resourceType === target.resourceType || target.type === FlowNodeType.CONVERTER);

    if (!isValidConnection) continue;

    // Check if this connection already exists
    const connectionExists = connections.some(
      conn => conn.sourceId === source.id && conn.targetId === target.id
    );

    if (!connectionExists) {
      connections.push({
        id: uuidv4(),
        sourceId: source.id,
        targetId: target.id,
        resourceType: source.resourceType,
        maxFlow: Math.floor(Math.random() * 50) + 10,
        priority: Math.floor(Math.random() * 10) + 1,
        active: true,
      });
    }
  }

  return { nodes, connections };
}
