import {
  Crosshair,
  Database,
  LucideIcon,
  Radar,
  Rocket,
  Shield,
  Ship,
  Sword,
  Zap,
} from 'lucide-react';
import * as React from "react";
import { useEffect, useRef, useState } from 'react';
import { TechNode } from '../../managers/game/techTreeManager';
import {
  ResearchProgressIndicator,
  TechConnectionLine,
  TechSynergyIndicator,
  TechVisualFeedback,
} from './tech/TechVisualFeedback';

// Category icons for the TechVisualFeedback component
export const categoryIcons = {
  infrastructure: <Database className="h-6 w-6" />,
  warFleet: <Sword className="h-6 w-6" />,
  reconFleet: <Radar className="h-6 w-6" />,
  miningFleet: <Ship className="h-6 w-6" />,
  weapons: <Crosshair className="h-6 w-6" />,
  defense: <Shield className="h-6 w-6" />,
  special: <Rocket className="h-6 w-6" />,
  synergy: <Zap className="h-6 w-6" />,
};

// Mock tech nodes data
const techNodes: TechNode[] = [
  // Infrastructure - Tier 1
  {
    id: 'basic-radar',
    name: 'Basic Radar',
    description: 'Enables local system scanning and basic mineral detection',
    tier: 1,
    requirements: [],
    unlocked: true,
    category: 'infrastructure',
    type: 'infrastructure',
  },
  {
    id: 'basic-ship-hangar',
    name: 'Basic Ship Hangar',
    description: 'Enables production of Spitflares and Rock Breaker mining ships',
    tier: 1,
    requirements: ['basic-radar'],
    unlocked: false,
    category: 'infrastructure',
    type: 'infrastructure',
  },
  {
    id: 'officer-academy',
    name: 'Entry Officer Academy',
    description: 'Standard officer recruitment and basic training facilities',
    tier: 1,
    requirements: ['basic-ship-hangar'],
    unlocked: false,
    category: 'infrastructure',
    type: 'infrastructure',
  },
  {
    id: 'basic-colony',
    name: 'Basic Colony Station',
    description: 'Initial trade and population management hub',
    tier: 1,
    requirements: ['basic-radar'],
    unlocked: false,
    category: 'infrastructure',
    type: 'infrastructure',
  },

  // Infrastructure - Tier 2
  {
    id: 'advanced-radar',
    name: 'Advanced Radar',
    description: 'Unlocks galaxy-wide monitoring, enemy detection, and enhanced mineral spotting',
    tier: 2,
    requirements: ['basic-radar'],
    unlocked: false,
    category: 'infrastructure',
    type: 'infrastructure',
  },
  {
    id: 'expanded-hangar',
    name: 'Expanded Ship Hangar',
    description: "Adds Star Schooner and Orion's Frigate production capabilities",
    tier: 2,
    requirements: ['basic-ship-hangar'],
    unlocked: false,
    category: 'infrastructure',
    type: 'infrastructure',
  },
  {
    id: 'refugee-market',
    name: 'Officer Academy - Refugee Market',
    description: 'Access new officer types from allied or neutral factions',
    tier: 2,
    requirements: ['officer-academy'],
    unlocked: false,
    category: 'infrastructure',
    type: 'infrastructure',
  },
  {
    id: 'colony-expansion',
    name: 'Colony Expansion',
    description:
      'Unlocks additional modules including trading post and improved population management',
    tier: 2,
    requirements: ['basic-colony'],
    unlocked: false,
    category: 'infrastructure',
    type: 'infrastructure',
  },
  {
    id: 'mineral-processing-2',
    name: 'Mineral Processing Centre Tier 2',
    description: 'Enhanced mining automation and faster resource refinement',
    tier: 2,
    requirements: ['basic-colony'],
    unlocked: false,
    category: 'infrastructure',
    type: 'infrastructure',
  },

  // Infrastructure - Tier 3
  {
    id: 'ultra-radar',
    name: 'Ultra-Advanced Radar',
    description: 'Full-spectrum scanning that detects anomalies, hidden tech, and habitable worlds',
    tier: 3,
    requirements: ['advanced-radar'],
    unlocked: false,
    category: 'infrastructure',
    type: 'infrastructure',
  },
  {
    id: 'mega-hangar',
    name: 'Mega Ship Hangar',
    description: 'Enables construction of capital ships like Harbringer Galleon and Midway Carrier',
    tier: 3,
    requirements: ['expanded-hangar'],
    unlocked: false,
    category: 'infrastructure',
    type: 'infrastructure',
  },
  {
    id: 'indoctrination',
    name: 'Officer Academy - Indoctrination',
    description: 'Convert enemy or captured officers for bonus synergy effects',
    tier: 3,
    requirements: ['refugee-market'],
    unlocked: false,
    category: 'infrastructure',
    type: 'infrastructure',
  },
  {
    id: 'automated-colony',
    name: 'Fully Automated Colony',
    description: 'Dynamic expansion integrating with Habitable Worlds and optimized trade routes',
    tier: 3,
    requirements: ['colony-expansion'],
    unlocked: false,
    category: 'infrastructure',
    type: 'infrastructure',
  },
  {
    id: 'dyson-automation',
    name: 'Dyson Sphere Integration',
    description: 'Advanced energy and resource bonuses through segmented automation',
    tier: 3,
    requirements: ['automated-colony'],
    unlocked: false,
    category: 'infrastructure',
    type: 'infrastructure',
  },

  // Additional Infrastructure Nodes
  {
    id: 'quantum-comms',
    name: 'Quantum Communications Hub',
    description: 'Improves inter-system data sharing and speeds up command decisions',
    tier: 2,
    requirements: ['advanced-radar'],
    unlocked: false,
    category: 'infrastructure',
    type: 'infrastructure',
  },
  {
    id: 'ai-logistics',
    name: 'AI Logistics Core',
    description: 'Automates trade routes, reduces resource latency, and improves mining efficiency',
    tier: 3,
    requirements: ['quantum-comms'],
    unlocked: false,
    category: 'infrastructure',
    type: 'infrastructure',
  },
  {
    id: 'modular-expansion',
    name: 'Modular Expansion Interface',
    description: 'Allows colonies to scale visually and functionally as population grows',
    tier: 3,
    requirements: ['automated-colony'],
    unlocked: false,
    category: 'infrastructure',
    type: 'infrastructure',
  },

  // War Fleet - Tier 1
  {
    id: 'basic-weapons',
    name: 'Basic Weapons',
    description: 'Unlocks Machine Gun, Rockets, and Gauss Cannon weapon systems',
    tier: 1,
    requirements: [],
    unlocked: true,
    category: 'warFleet',
    type: 'warFleet',
  },
  {
    id: 'light-armor',
    name: 'Light Hull & Shields',
    description: 'Basic protection systems for combat vessels',
    tier: 1,
    requirements: ['basic-weapons'],
    unlocked: false,
    category: 'warFleet',
    type: 'warFleet',
  },
  {
    id: 'fleet-coordination',
    name: 'Basic Fleet Coordination',
    description: 'Enables simple auto-deployment of combat ships',
    tier: 1,
    requirements: ['light-armor'],
    unlocked: false,
    category: 'warFleet',
    type: 'warFleet',
  },

  // War Fleet - Tier 2
  {
    id: 'enhanced-weapons',
    name: 'Enhanced Weapon Systems',
    description: 'Upgrade to Plasma Rounds, EMPR variants, and Gauss Planer',
    tier: 2,
    requirements: ['basic-weapons'],
    unlocked: false,
    category: 'warFleet',
    type: 'warFleet',
  },
  {
    id: 'medium-armor',
    name: 'Medium Hull & Shields',
    description: 'Improved protection with regenerative properties',
    tier: 2,
    requirements: ['light-armor'],
    unlocked: false,
    category: 'warFleet',
    type: 'warFleet',
  },
  {
    id: 'advanced-coordination',
    name: 'Advanced Fleet Coordination',
    description: 'Enhanced auto-deployment with tactical positioning',
    tier: 2,
    requirements: ['fleet-coordination'],
    unlocked: false,
    category: 'warFleet',
    type: 'warFleet',
  },
  {
    id: 'cutting-laser',
    name: 'Cutting Laser',
    description: 'Enables war ships to salvage resources from destroyed enemy ships',
    tier: 2,
    requirements: ['enhanced-weapons'],
    unlocked: false,
    category: 'warFleet',
    type: 'warFleet',
  },

  // War Fleet - Tier 3
  {
    id: 'advanced-weapons',
    name: 'Advanced Weapon Systems',
    description: 'Unlock Spark Rounds, Big Bang Rockets, and advanced Rail Gun variants',
    tier: 3,
    requirements: ['enhanced-weapons'],
    unlocked: false,
    category: 'warFleet',
    type: 'warFleet',
  },
  {
    id: 'heavy-armor',
    name: 'Heavy Hull & Shields',
    description: 'Reactive armor with smart countermeasures and kinetic absorption',
    tier: 3,
    requirements: ['medium-armor'],
    unlocked: false,
    category: 'warFleet',
    type: 'warFleet',
  },
  {
    id: 'fleet-command-ai',
    name: 'Fleet Command AI',
    description: 'Advanced AI system for enhanced reaction times and tactical coordination',
    tier: 3,
    requirements: ['advanced-coordination'],
    unlocked: false,
    category: 'warFleet',
    type: 'warFleet',
  },

  // Recon Fleet - Tier 1
  {
    id: 'basic-sensors',
    name: 'Basic Sensor Arrays',
    description: 'Standard sensor arrays for SC4 Comet reconnaissance ships',
    tier: 1,
    requirements: [],
    unlocked: true,
    category: 'reconFleet',
    type: 'reconFleet',
  },
  {
    id: 'basic-stealth',
    name: 'Basic Stealth Systems',
    description: 'Initial stealth capabilities for recon vessels',
    tier: 1,
    requirements: ['basic-sensors'],
    unlocked: false,
    category: 'reconFleet',
    type: 'reconFleet',
  },

  // Recon Fleet - Tier 2
  {
    id: 'enhanced-sensors',
    name: 'Enhanced Sensors',
    description: 'Enhanced sensor modules for improved mapping and stealth detection',
    tier: 2,
    requirements: ['basic-sensors'],
    unlocked: false,
    category: 'reconFleet',
    type: 'reconFleet',
  },
  {
    id: 'data-processing',
    name: 'Data Processing',
    description: 'Improved data processing for faster mapping cycles',
    tier: 2,
    requirements: ['enhanced-sensors'],
    unlocked: false,
    category: 'reconFleet',
    type: 'reconFleet',
  },

  // Recon Fleet - Tier 3
  {
    id: 'quantum-recon',
    name: 'Quantum Recon Systems',
    description: 'Quantum-enhanced systems for superior anomaly detection and mapping',
    tier: 3,
    requirements: ['enhanced-sensors'],
    unlocked: false,
    category: 'reconFleet',
    type: 'reconFleet',
  },
  {
    id: 'advanced-cloaking',
    name: 'Advanced Cloaking',
    description: 'Superior cloaking and mobility upgrades for hostile zone survival',
    tier: 3,
    requirements: ['data-processing'],
    unlocked: false,
    category: 'reconFleet',
    type: 'reconFleet',
  },

  // Mining Fleet - Tier 1
  {
    id: 'mining-lasers',
    name: 'Standard Mining Lasers',
    description: 'Standard mining lasers and onboard refinement for Rock Breaker',
    tier: 1,
    requirements: [],
    unlocked: true,
    category: 'miningFleet',
    type: 'miningFleet',
  },
  {
    id: 'basic-refinement',
    name: 'Basic Refinement',
    description: 'Initial onboard resource processing capabilities',
    tier: 1,
    requirements: ['mining-lasers'],
    unlocked: false,
    category: 'miningFleet',
    type: 'miningFleet',
  },

  // Mining Fleet - Tier 2
  {
    id: 'improved-extraction',
    name: 'Improved Extraction',
    description: 'Enhanced extraction rates and better resource yield probabilities',
    tier: 2,
    requirements: ['mining-lasers'],
    unlocked: false,
    category: 'miningFleet',
    type: 'miningFleet',
  },
  {
    id: 'processing-algorithms',
    name: 'Processing Algorithms',
    description: 'Enhanced algorithms for improved mineral processing efficiency',
    tier: 2,
    requirements: ['basic-refinement'],
    unlocked: false,
    category: 'miningFleet',
    type: 'miningFleet',
  },

  // Mining Fleet - Tier 3
  {
    id: 'exotic-mining',
    name: 'Exotic Mining',
    description: 'Advanced techniques for Dark Matter and Helium-3 extraction',
    tier: 3,
    requirements: ['improved-extraction'],
    unlocked: false,
    category: 'miningFleet',
    type: 'miningFleet',
  },
  {
    id: 'mining-drones',
    name: 'Automated Mining Drones',
    description: 'AI-assisted systems for dynamic resource extraction',
    tier: 3,
    requirements: ['processing-algorithms'],
    unlocked: false,
    category: 'miningFleet',
    type: 'miningFleet',
  },

  // Weapons - Tier 1
  {
    id: 'base-weapons',
    name: 'Base Weapon Models',
    description: 'Unlock Machine Gun, Rockets, Gauss Cannon, and Rail Gun',
    tier: 1,
    requirements: [],
    unlocked: true,
    category: 'weapons',
    type: 'weapons',
  },
  {
    id: 'weapon-targeting',
    name: 'Basic Targeting',
    description: 'Improved accuracy and target acquisition',
    tier: 1,
    requirements: ['base-weapons'],
    unlocked: false,
    category: 'weapons',
    type: 'weapons',
  },

  // Weapons - Tier 2
  {
    id: 'specialized-variants',
    name: 'Specialized Variants',
    description: 'Unlock Plasma Rounds, EMPR & Swarm Rockets, and Gauss Planer',
    tier: 2,
    requirements: ['base-weapons'],
    unlocked: false,
    category: 'weapons',
    type: 'weapons',
  },
  {
    id: 'advanced-targeting',
    name: 'Advanced Targeting',
    description: 'Enhanced accuracy with predictive tracking',
    tier: 2,
    requirements: ['weapon-targeting'],
    unlocked: false,
    category: 'weapons',
    type: 'weapons',
  },

  // Weapons - Tier 3
  {
    id: 'maximum-damage',
    name: 'Maximum Damage',
    description:
      'Unlock Spark Rounds, Big Bang Rockets, Recirculating Gauss, and Maurader Rail Gun',
    tier: 3,
    requirements: ['specialized-variants'],
    unlocked: false,
    category: 'weapons',
    type: 'weapons',
  },
  {
    id: 'laser-beam',
    name: 'Laser Beam Technology',
    description: 'Continuous-damage weapon effective against multiple targets',
    tier: 3,
    requirements: ['advanced-targeting'],
    unlocked: false,
    category: 'weapons',
    type: 'weapons',
  },
  {
    id: 'particle-accelerator',
    name: 'Particle Accelerator',
    description: 'High-damage, energy-draining weapons that penetrate advanced armor',
    tier: 3,
    requirements: ['maximum-damage'],
    unlocked: false,
    category: 'weapons',
    type: 'weapons',
  },

  // Defense - Tier 1
  {
    id: 'light-shields',
    name: 'Light Shields',
    description: 'Basic shield generators and minimal hull armor',
    tier: 1,
    requirements: [],
    unlocked: true,
    category: 'defense',
    type: 'defense',
  },
  {
    id: 'basic-armor',
    name: 'Basic Hull Armor',
    description: 'Standard hull plating and structural reinforcement',
    tier: 1,
    requirements: ['light-shields'],
    unlocked: false,
    category: 'defense',
    type: 'defense',
  },

  // Defense - Tier 2
  {
    id: 'medium-shields',
    name: 'Medium Shields',
    description: 'Improved shields with regenerative properties',
    tier: 2,
    requirements: ['light-shields'],
    unlocked: false,
    category: 'defense',
    type: 'defense',
  },
  {
    id: 'reactive-armor',
    name: 'Reactive Armor',
    description: 'Advanced armor that responds to incoming damage',
    tier: 2,
    requirements: ['basic-armor'],
    unlocked: false,
    category: 'defense',
    type: 'defense',
  },
  {
    id: 'repair-drones',
    name: 'Repair Drones',
    description: 'Automated drones for rapid in-combat hull repairs',
    tier: 2,
    requirements: ['reactive-armor'],
    unlocked: false,
    category: 'defense',
    type: 'defense',
  },

  // Defense - Tier 3
  {
    id: 'heavy-shields',
    name: 'Heavy Shields',
    description: 'Advanced shields with layered defense and smart countermeasures',
    tier: 3,
    requirements: ['medium-shields'],
    unlocked: false,
    category: 'defense',
    type: 'defense',
  },
  {
    id: 'point-defense',
    name: 'Point Defense System',
    description: 'Automated defense grid against incoming projectiles',
    tier: 3,
    requirements: ['heavy-shields'],
    unlocked: false,
    category: 'defense',
    type: 'defense',
  },
  {
    id: 'energy-dissipation',
    name: 'Energy Dissipation Field',
    description: 'Temporarily reduces incoming energy-based damage',
    tier: 3,
    requirements: ['heavy-shields', 'point-defense'],
    unlocked: false,
    category: 'defense',
    type: 'defense',
  },

  // Special Projects - Officer Academy
  {
    id: 'refugee-market',
    name: 'Refugee Market',
    description: 'Attract skilled officers from other factions',
    tier: 2,
    requirements: ['basic-hangar'],
    unlocked: false,
    category: 'special',
    type: 'special',
  },
  {
    id: 'indoctrination',
    name: 'Indoctrination Program',
    description: 'Convert enemy officers to enhance fleet performance',
    tier: 3,
    requirements: ['refugee-market'],
    unlocked: false,
    category: 'special',
    type: 'special',
  },
  {
    id: 'advanced-training',
    name: 'Advanced Training Simulations',
    description: 'Accelerate officer XP gain and tactical proficiency',
    tier: 3,
    requirements: ['refugee-market'],
    unlocked: false,
    category: 'special',
    type: 'special',
  },

  // Special Projects - Capital Ships
  {
    id: 'command-nexus',
    name: 'Command Nexus',
    description: 'Mobile command center improving fleet coordination',
    tier: 3,
    requirements: ['mega-hangar'],
    unlocked: false,
    category: 'special',
    type: 'special',
  },
  {
    id: 'orbital-docking',
    name: 'Orbital Docking Enhancements',
    description: 'Faster repair and resupply operations',
    tier: 2,
    requirements: ['expanded-hangar'],
    unlocked: false,
    category: 'special',
    type: 'special',
  },

  // Special Projects - Resources & Trade
  {
    id: 'trade-network',
    name: 'Interstellar Trade Network',
    description: 'Automated resource flow between systems',
    tier: 2,
    requirements: ['improved-extraction'],
    unlocked: false,
    category: 'special',
    type: 'special',
  },
  {
    id: 'dyson-automation',
    name: 'Dyson Sphere Automation',
    description: 'Enhanced energy production via automated management',
    tier: 3,
    requirements: ['trade-network'],
    unlocked: false,
    category: 'special',
    type: 'special',
  },

  // Cross-Domain Synergies
  {
    id: 'ai-automation',
    name: 'Integrated AI Core',
    description: 'Improves automation efficiency across all systems',
    tier: 3,
    requirements: ['quantum-comms'],
    unlocked: false,
    category: 'synergy',
    type: 'synergy',
  },
  {
    id: 'quantum-comms',
    name: 'Quantum Communications',
    description: 'Reduces system delays and improves decision-making',
    tier: 2,
    requirements: [],
    unlocked: true,
    category: 'synergy',
    type: 'synergy',
  },
  {
    id: 'tech-convergence',
    name: 'Modular Tech Convergence',
    description: 'Enables synergies between different modules',
    tier: 3,
    requirements: ['quantum-comms', 'ai-automation'],
    unlocked: false,
    category: 'synergy',
    type: 'synergy',
  },
];

// Categories for filtering
interface Category {
  id: TechNode['category'];
  name: string;
  icon: LucideIcon;
}

const categories: Category[] = [
  { id: 'infrastructure', name: 'Infrastructure', icon: Database },
  { id: 'warFleet', name: 'War Fleet', icon: Sword },
  { id: 'reconFleet', name: 'Recon Fleet', icon: Radar },
  { id: 'miningFleet', name: 'Mining Fleet', icon: Ship },
  { id: 'weapons', name: 'Weapons', icon: Crosshair },
  { id: 'defense', name: 'Defense', icon: Shield },
  { id: 'special', name: 'Special', icon: Rocket },
  { id: 'synergy', name: 'Synergy', icon: Zap },
];

// Connection type
interface Connection {
  from: string;
  to: string;
  status: 'locked' | 'available' | 'unlocked';
}

// Map the imported TechNode to our local TechNode
// This function is used when importing tech nodes from the manager
// Currently we're using mock data, but this will be used when we integrate with the real manager
const mapToLocalTechNode = (node: TechNode): TechNode => {
  // Actually use this function in the component
  return {
    ...node,
  };
};

// Define node icons with proper typing
const nodeIcons = {
  radar: Radar,
  rocket: Rocket,
  shield: Shield,
  database: Database,
  users: 'users',
  zap: Zap,
  crosshair: Crosshair,
  ship: Ship,
  sword: Sword,
};

// Use nodeIcons in the component
const getIconComponent = (category: TechNode['category']) => {
  switch (category) {
    case 'infrastructure':
      return nodeIcons.database;
    case 'warFleet':
      return nodeIcons.sword;
    case 'reconFleet':
      return nodeIcons.radar;
    case 'miningFleet':
      return nodeIcons.ship;
    case 'weapons':
      return nodeIcons.crosshair;
    case 'defense':
      return nodeIcons.shield;
    case 'special':
      return nodeIcons.rocket;
    case 'synergy':
      return nodeIcons.zap;
    default:
      return nodeIcons.database;
  }
};

export default function TechTree() {
  const [selectedNode, setSelectedNode] = useState<TechNode | null>(null);
  const [researchProgress, setResearchProgress] = useState<Record<string, number>>({});
  const [activeResearch, setActiveResearch] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const nodeRefs = useRef<Record<string, { x: number; y: number }>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Initialize tech nodes from mock data
  const [managedTechNodes, setManagedTechNodes] = useState<TechNode[]>(() => {
    // Use mapToLocalTechNode to convert imported nodes to local format
    return techNodes.map(mapToLocalTechNode);
  });

  useEffect(() => {
    // Calculate connections between nodes
    const newConnections: Connection[] = [];

    managedTechNodes.forEach(node => {
      node.requirements.forEach(reqId => {
        const reqNode = managedTechNodes.find(n => n.id === reqId);
        if (reqNode) {
          let status: Connection['status'] = 'locked';

          if (node.unlocked) {
            status = 'unlocked';
          } else if (reqNode.unlocked) {
            status = 'available';
          }

          newConnections.push({
            from: reqId,
            to: node.id,
            status,
          });
        }
      });
    });

    setConnections(newConnections);
  }, [managedTechNodes]);

  // Check if a node can be unlocked
  const canUnlockNode = (nodeId: string): boolean => {
    const node = managedTechNodes.find(n => n.id === nodeId);
    if (!node || node.unlocked) return false;

    // Check if all requirements are unlocked
    return node.requirements.every(reqId => {
      const reqNode = managedTechNodes.find(n => n.id === reqId);
      return reqNode?.unlocked;
    });
  };

  // Handle node click
  const handleNodeClick = (node: TechNode) => {
    setSelectedNode(node);
  };

  // Start research on a node
  const startResearch = (nodeId: string) => {
    if (activeResearch) return;

    setActiveResearch(nodeId);
    setResearchProgress(prev => ({
      ...prev,
      [nodeId]: 0,
    }));

    // Simulate research progress
    const interval = setInterval(() => {
      setResearchProgress(prev => {
        const currentProgress = prev[nodeId] ?? 0;
        const newProgress = currentProgress + 0.1; // 10% increment

        if (newProgress >= 1) {
          clearInterval(interval);
          setActiveResearch(null);
          unlockNode(nodeId);
          return {
            ...prev,
            [nodeId]: 1,
          };
        }

        return {
          ...prev,
          [nodeId]: newProgress,
        };
      });
    }, 100);

    // Clean up interval on component unmount
    return () => clearInterval(interval);
  };

  // Unlock a node
  const unlockNode = (nodeId: string) => {
    // Update the nodes
    setManagedTechNodes(prev =>
      prev.map(node => {
        if (node.id === nodeId) {
          return { ...node, unlocked: true };
        }
        return node;
      })
    );

    // Reset progress
    setResearchProgress(prev => ({
      ...prev,
      [nodeId]: 0,
    }));

    // Update connections
    setConnections(prev =>
      prev.map(conn => {
        if (conn.to === nodeId || conn.from === nodeId) {
          return { ...conn, status: 'unlocked' };
        }
        return conn;
      })
    );
  };

  // Get nodes for a specific tier
  const getTierNodes = (tier: number) => {
    return managedTechNodes.filter(node => node.tier === tier);
  };

  // Filter nodes by category if a category is selected
  const filteredNodes = selectedCategory
    ? managedTechNodes.filter(node => node.category === selectedCategory)
    : managedTechNodes;

  // Render a tier of nodes
  const renderTier = (tier: number) => {
    // Get nodes for this tier and filter by category if needed
    const tierNodes = getTierNodes(tier);
    const nodes = selectedCategory
      ? tierNodes.filter(node => node.category === selectedCategory)
      : tierNodes;

    return (
      <div className="mb-16 flex justify-center space-x-16">
        {nodes.map(node => (
          <div
            key={node.id}
            ref={el => {
              if (el) {
                const rect = el.getBoundingClientRect();
                nodeRefs.current[node.id] = {
                  x: rect.left + rect.width / 2,
                  y: rect.top + rect.height / 2,
                };
              }
            }}
          >
            <TechVisualFeedback
              node={node}
              isSelected={selectedNode?.id === node.id}
              isAvailable={canUnlockNode(node.id)}
              onNodeClick={handleNodeClick}
              connections={connections.filter(conn => conn.from === node.id || conn.to === node.id)}
              showDetails={selectedNode?.id === node.id}
            />
          </div>
        ))}
      </div>
    );
  };

  // Render connection lines between nodes
  const renderConnections = () => {
    return connections.map((connection, index) => {
      const fromPos = nodeRefs.current[connection.from];
      const toPos = nodeRefs.current[connection.to];

      if (!fromPos || !toPos) return null;

      const progress =
        connection.status === 'unlocked' ? 1 : connection.status === 'available' ? 0.5 : 0.2;

      return (
        <TechConnectionLine
          key={`${connection.from}-${connection.to}-${index}`}
          from={fromPos}
          to={toPos}
          status={connection.status}
          progress={progress}
        />
      );
    });
  };

  return (
    <div className="relative min-h-screen bg-gray-900 p-8 text-white">
      <h2 className="mb-8 text-center text-2xl font-bold text-white">Technology Tree</h2>

      {/* Category filters */}
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        <button
          className={`rounded px-3 py-1 text-sm ${
            selectedCategory === null ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          onClick={() => setSelectedCategory(null)}
        >
          All
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            className={`flex items-center rounded px-3 py-1 text-sm ${
              selectedCategory === category.id ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <category.icon className="mr-1" size={14} />
            {category.name}
          </button>
        ))}
      </div>

      {/* Display total nodes count */}
      <div className="mb-4 text-center text-sm text-gray-400">
        Total nodes: {filteredNodes.length}{' '}
        {selectedCategory ? `in ${selectedCategory} category` : 'across all categories'}
      </div>

      {/* Research progress indicator */}
      {activeResearch && (
        <div className="mx-auto mb-6 max-w-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">
              Researching: {managedTechNodes.find(n => n.id === activeResearch)?.name}
            </span>
            <span className="text-sm text-gray-400">
              {Math.round(researchProgress[activeResearch] * 100)}%
            </span>
          </div>
          <ResearchProgressIndicator
            progress={researchProgress[activeResearch] ?? 0}
            totalTime={10} // 10 seconds for research
            isActive={true}
          />
        </div>
      )}

      {/* Tech tree visualization */}
      <div className="relative">
        {renderConnections()}

        {/* Use renderTier function to render each tier */}
        <div className="mb-12">
          {[1, 2, 3, 4].map(tier => (
            <div key={tier}>
              <h3 className="mb-4 text-sm font-medium text-gray-400">Tier {tier}</h3>
              {renderTier(tier)}
            </div>
          ))}
        </div>
      </div>

      {/* Selected node details */}
      {selectedNode && (
        <div className="mx-auto mt-8 max-w-2xl rounded-lg bg-gray-800 p-6">
          <div className="flex items-start">
            <div className="mr-4 h-16 w-16 flex-shrink-0 rounded-full bg-gray-700 p-4">
              <div className="flex h-full w-full items-center justify-center text-gray-300">
                {/* Use getIconComponent to get the icon based on category */}
                {React.createElement(getIconComponent(selectedNode.category), { size: 24 })}
              </div>
            </div>
            <div className="flex-grow">
              <h3 className="text-xl font-bold text-white">{selectedNode.name}</h3>
              <div className="mb-2 flex items-center">
                <span className="mr-2 text-sm text-gray-400">Tier {selectedNode.tier}</span>
                <span className="mr-2 text-sm text-gray-400">•</span>
                <span className="text-sm text-gray-400">{selectedNode.category}</span>
              </div>
              <p className="text-gray-300">{selectedNode.description}</p>

              {/* Research button for available nodes */}
              {canUnlockNode(selectedNode.id) && !selectedNode.unlocked && (
                <div className="mt-4">
                  <button
                    className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500"
                    onClick={() => startResearch(selectedNode.id)}
                    disabled={activeResearch === selectedNode.id}
                  >
                    {activeResearch === selectedNode.id ? 'Researching...' : 'Start Research'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Show synergies for unlocked nodes */}
          {selectedNode.unlocked && (
            <TechSynergyIndicator nodes={managedTechNodes} activeNodeId={selectedNode.id} />
          )}
        </div>
      )}
    </div>
  );
}
