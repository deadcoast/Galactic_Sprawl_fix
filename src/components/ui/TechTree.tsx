import {
  Check,
  Crosshair,
  Database,
  Lock,
  Radar,
  Rocket,
  Shield,
  Ship,
  Sword,
  Users,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';

interface TechNode {
  id: string;
  name: string;
  description: string;
  tier: 1 | 2 | 3 | 4;
  icon: keyof typeof nodeIcons;
  requirements: string[];
  unlocked: boolean;
  category:
    | 'infrastructure'
    | 'warFleet'
    | 'reconFleet'
    | 'miningFleet'
    | 'weapons'
    | 'defense'
    | 'special'
    | 'synergy';
}

const nodeIcons = {
  radar: Radar,
  rocket: Rocket,
  shield: Shield,
  database: Database,
  users: Users,
  zap: Zap,
  crosshair: Crosshair,
  ship: Ship,
  sword: Sword,
};

const techNodes: TechNode[] = [
  // Infrastructure - Tier 1
  {
    id: 'basic-radar',
    name: 'Basic Radar',
    description: 'Enables local system scanning and basic mineral detection',
    tier: 1,
    icon: 'radar',
    requirements: [],
    unlocked: true,
    category: 'infrastructure',
  },
  {
    id: 'basic-ship-hangar',
    name: 'Basic Ship Hangar',
    description: 'Enables production of Spitflares and Rock Breaker mining ships',
    tier: 1,
    icon: 'rocket',
    requirements: ['basic-radar'],
    unlocked: false,
    category: 'infrastructure',
  },
  {
    id: 'officer-academy',
    name: 'Entry Officer Academy',
    description: 'Standard officer recruitment and basic training facilities',
    tier: 1,
    icon: 'users',
    requirements: ['basic-ship-hangar'],
    unlocked: false,
    category: 'infrastructure',
  },
  {
    id: 'basic-colony',
    name: 'Basic Colony Station',
    description: 'Initial trade and population management hub',
    tier: 1,
    icon: 'database',
    requirements: ['basic-radar'],
    unlocked: false,
    category: 'infrastructure',
  },

  // Infrastructure - Tier 2
  {
    id: 'advanced-radar',
    name: 'Advanced Radar',
    description: 'Unlocks galaxy-wide monitoring, enemy detection, and enhanced mineral spotting',
    tier: 2,
    icon: 'radar',
    requirements: ['basic-radar'],
    unlocked: false,
    category: 'infrastructure',
  },
  {
    id: 'expanded-hangar',
    name: 'Expanded Ship Hangar',
    description: "Adds Star Schooner and Orion's Frigate production capabilities",
    tier: 2,
    icon: 'rocket',
    requirements: ['basic-ship-hangar'],
    unlocked: false,
    category: 'infrastructure',
  },
  {
    id: 'refugee-market',
    name: 'Officer Academy - Refugee Market',
    description: 'Access new officer types from allied or neutral factions',
    tier: 2,
    icon: 'users',
    requirements: ['officer-academy'],
    unlocked: false,
    category: 'infrastructure',
  },
  {
    id: 'colony-expansion',
    name: 'Colony Expansion',
    description:
      'Unlocks additional modules including trading post and improved population management',
    tier: 2,
    icon: 'database',
    requirements: ['basic-colony'],
    unlocked: false,
    category: 'infrastructure',
  },
  {
    id: 'mineral-processing-2',
    name: 'Mineral Processing Centre Tier 2',
    description: 'Enhanced mining automation and faster resource refinement',
    tier: 2,
    icon: 'database',
    requirements: ['basic-colony'],
    unlocked: false,
    category: 'infrastructure',
  },

  // Infrastructure - Tier 3
  {
    id: 'ultra-radar',
    name: 'Ultra-Advanced Radar',
    description: 'Full-spectrum scanning that detects anomalies, hidden tech, and habitable worlds',
    tier: 3,
    icon: 'radar',
    requirements: ['advanced-radar'],
    unlocked: false,
    category: 'infrastructure',
  },
  {
    id: 'mega-hangar',
    name: 'Mega Ship Hangar',
    description: 'Enables construction of capital ships like Harbringer Galleon and Midway Carrier',
    tier: 3,
    icon: 'rocket',
    requirements: ['expanded-hangar'],
    unlocked: false,
    category: 'infrastructure',
  },
  {
    id: 'indoctrination',
    name: 'Officer Academy - Indoctrination',
    description: 'Convert enemy or captured officers for bonus synergy effects',
    tier: 3,
    icon: 'users',
    requirements: ['refugee-market'],
    unlocked: false,
    category: 'infrastructure',
  },
  {
    id: 'automated-colony',
    name: 'Fully Automated Colony',
    description: 'Dynamic expansion integrating with Habitable Worlds and optimized trade routes',
    tier: 3,
    icon: 'database',
    requirements: ['colony-expansion'],
    unlocked: false,
    category: 'infrastructure',
  },
  {
    id: 'dyson-automation',
    name: 'Dyson Sphere Integration',
    description: 'Advanced energy and resource bonuses through segmented automation',
    tier: 3,
    icon: 'zap',
    requirements: ['automated-colony'],
    unlocked: false,
    category: 'infrastructure',
  },

  // Additional Infrastructure Nodes
  {
    id: 'quantum-comms',
    name: 'Quantum Communications Hub',
    description: 'Improves inter-system data sharing and speeds up command decisions',
    tier: 2,
    icon: 'zap',
    requirements: ['advanced-radar'],
    unlocked: false,
    category: 'infrastructure',
  },
  {
    id: 'ai-logistics',
    name: 'AI Logistics Core',
    description: 'Automates trade routes, reduces resource latency, and improves mining efficiency',
    tier: 3,
    icon: 'database',
    requirements: ['quantum-comms'],
    unlocked: false,
    category: 'infrastructure',
  },
  {
    id: 'modular-expansion',
    name: 'Modular Expansion Interface',
    description: 'Allows colonies to scale visually and functionally as population grows',
    tier: 3,
    icon: 'database',
    requirements: ['automated-colony'],
    unlocked: false,
    category: 'infrastructure',
  },

  // War Fleet - Tier 1
  {
    id: 'basic-weapons',
    name: 'Basic Weapons',
    description: 'Unlocks Machine Gun, Rockets, and Gauss Cannon weapon systems',
    tier: 1,
    icon: 'crosshair',
    requirements: [],
    unlocked: true,
    category: 'warFleet',
  },
  {
    id: 'light-armor',
    name: 'Light Hull & Shields',
    description: 'Basic protection systems for combat vessels',
    tier: 1,
    icon: 'shield',
    requirements: ['basic-weapons'],
    unlocked: false,
    category: 'warFleet',
  },
  {
    id: 'fleet-coordination',
    name: 'Basic Fleet Coordination',
    description: 'Enables simple auto-deployment of combat ships',
    tier: 1,
    icon: 'ship',
    requirements: ['light-armor'],
    unlocked: false,
    category: 'warFleet',
  },

  // War Fleet - Tier 2
  {
    id: 'enhanced-weapons',
    name: 'Enhanced Weapon Systems',
    description: 'Upgrade to Plasma Rounds, EMPR variants, and Gauss Planer',
    tier: 2,
    icon: 'crosshair',
    requirements: ['basic-weapons'],
    unlocked: false,
    category: 'warFleet',
  },
  {
    id: 'medium-armor',
    name: 'Medium Hull & Shields',
    description: 'Improved protection with regenerative properties',
    tier: 2,
    icon: 'shield',
    requirements: ['light-armor'],
    unlocked: false,
    category: 'warFleet',
  },
  {
    id: 'advanced-coordination',
    name: 'Advanced Fleet Coordination',
    description: 'Enhanced auto-deployment with tactical positioning',
    tier: 2,
    icon: 'ship',
    requirements: ['fleet-coordination'],
    unlocked: false,
    category: 'warFleet',
  },
  {
    id: 'cutting-laser',
    name: 'Cutting Laser',
    description: 'Enables war ships to salvage resources from destroyed enemy ships',
    tier: 2,
    icon: 'crosshair',
    requirements: ['enhanced-weapons'],
    unlocked: false,
    category: 'warFleet',
  },

  // War Fleet - Tier 3
  {
    id: 'advanced-weapons',
    name: 'Advanced Weapon Systems',
    description: 'Unlock Spark Rounds, Big Bang Rockets, and advanced Rail Gun variants',
    tier: 3,
    icon: 'crosshair',
    requirements: ['enhanced-weapons'],
    unlocked: false,
    category: 'warFleet',
  },
  {
    id: 'heavy-armor',
    name: 'Heavy Hull & Shields',
    description: 'Reactive armor with smart countermeasures and kinetic absorption',
    tier: 3,
    icon: 'shield',
    requirements: ['medium-armor'],
    unlocked: false,
    category: 'warFleet',
  },
  {
    id: 'fleet-command-ai',
    name: 'Fleet Command AI',
    description: 'Advanced AI system for enhanced reaction times and tactical coordination',
    tier: 3,
    icon: 'ship',
    requirements: ['advanced-coordination'],
    unlocked: false,
    category: 'warFleet',
  },

  // Recon Fleet - Tier 1
  {
    id: 'basic-sensors',
    name: 'Basic Sensor Arrays',
    description: 'Standard sensor arrays for SC4 Comet reconnaissance ships',
    tier: 1,
    icon: 'radar',
    requirements: [],
    unlocked: true,
    category: 'reconFleet',
  },
  {
    id: 'basic-stealth',
    name: 'Basic Stealth Systems',
    description: 'Initial stealth capabilities for recon vessels',
    tier: 1,
    icon: 'shield',
    requirements: ['basic-sensors'],
    unlocked: false,
    category: 'reconFleet',
  },

  // Recon Fleet - Tier 2
  {
    id: 'enhanced-sensors',
    name: 'Enhanced Sensors',
    description: 'Enhanced sensor modules for improved mapping and stealth detection',
    tier: 2,
    icon: 'radar',
    requirements: ['basic-sensors'],
    unlocked: false,
    category: 'reconFleet',
  },
  {
    id: 'data-processing',
    name: 'Data Processing',
    description: 'Improved data processing for faster mapping cycles',
    tier: 2,
    icon: 'database',
    requirements: ['enhanced-sensors'],
    unlocked: false,
    category: 'reconFleet',
  },

  // Recon Fleet - Tier 3
  {
    id: 'quantum-recon',
    name: 'Quantum Recon Systems',
    description: 'Quantum-enhanced systems for superior anomaly detection and mapping',
    tier: 3,
    icon: 'radar',
    requirements: ['enhanced-sensors'],
    unlocked: false,
    category: 'reconFleet',
  },
  {
    id: 'advanced-cloaking',
    name: 'Advanced Cloaking',
    description: 'Superior cloaking and mobility upgrades for hostile zone survival',
    tier: 3,
    icon: 'shield',
    requirements: ['data-processing'],
    unlocked: false,
    category: 'reconFleet',
  },

  // Mining Fleet - Tier 1
  {
    id: 'mining-lasers',
    name: 'Standard Mining Lasers',
    description: 'Standard mining lasers and onboard refinement for Rock Breaker',
    tier: 1,
    icon: 'database',
    requirements: [],
    unlocked: true,
    category: 'miningFleet',
  },
  {
    id: 'basic-refinement',
    name: 'Basic Refinement',
    description: 'Initial onboard resource processing capabilities',
    tier: 1,
    icon: 'zap',
    requirements: ['mining-lasers'],
    unlocked: false,
    category: 'miningFleet',
  },

  // Mining Fleet - Tier 2
  {
    id: 'improved-extraction',
    name: 'Improved Extraction',
    description: 'Enhanced extraction rates and better resource yield probabilities',
    tier: 2,
    icon: 'database',
    requirements: ['mining-lasers'],
    unlocked: false,
    category: 'miningFleet',
  },
  {
    id: 'processing-algorithms',
    name: 'Processing Algorithms',
    description: 'Enhanced algorithms for improved mineral processing efficiency',
    tier: 2,
    icon: 'zap',
    requirements: ['basic-refinement'],
    unlocked: false,
    category: 'miningFleet',
  },

  // Mining Fleet - Tier 3
  {
    id: 'exotic-mining',
    name: 'Exotic Mining',
    description: 'Advanced techniques for Dark Matter and Helium-3 extraction',
    tier: 3,
    icon: 'database',
    requirements: ['improved-extraction'],
    unlocked: false,
    category: 'miningFleet',
  },
  {
    id: 'mining-drones',
    name: 'Automated Mining Drones',
    description: 'AI-assisted systems for dynamic resource extraction',
    tier: 3,
    icon: 'zap',
    requirements: ['processing-algorithms'],
    unlocked: false,
    category: 'miningFleet',
  },

  // Weapons - Tier 1
  {
    id: 'base-weapons',
    name: 'Base Weapon Models',
    description: 'Unlock Machine Gun, Rockets, Gauss Cannon, and Rail Gun',
    tier: 1,
    icon: 'crosshair',
    requirements: [],
    unlocked: true,
    category: 'weapons',
  },
  {
    id: 'weapon-targeting',
    name: 'Basic Targeting',
    description: 'Improved accuracy and target acquisition',
    tier: 1,
    icon: 'crosshair',
    requirements: ['base-weapons'],
    unlocked: false,
    category: 'weapons',
  },

  // Weapons - Tier 2
  {
    id: 'specialized-variants',
    name: 'Specialized Variants',
    description: 'Unlock Plasma Rounds, EMPR & Swarm Rockets, and Gauss Planer',
    tier: 2,
    icon: 'crosshair',
    requirements: ['base-weapons'],
    unlocked: false,
    category: 'weapons',
  },
  {
    id: 'advanced-targeting',
    name: 'Advanced Targeting',
    description: 'Enhanced accuracy with predictive tracking',
    tier: 2,
    icon: 'crosshair',
    requirements: ['weapon-targeting'],
    unlocked: false,
    category: 'weapons',
  },

  // Weapons - Tier 3
  {
    id: 'maximum-damage',
    name: 'Maximum Damage',
    description:
      'Unlock Spark Rounds, Big Bang Rockets, Recirculating Gauss, and Maurader Rail Gun',
    tier: 3,
    icon: 'crosshair',
    requirements: ['specialized-variants'],
    unlocked: false,
    category: 'weapons',
  },
  {
    id: 'laser-beam',
    name: 'Laser Beam Technology',
    description: 'Continuous-damage weapon effective against multiple targets',
    tier: 3,
    icon: 'zap',
    requirements: ['advanced-targeting'],
    unlocked: false,
    category: 'weapons',
  },
  {
    id: 'particle-accelerator',
    name: 'Particle Accelerator',
    description: 'High-damage, energy-draining weapons that penetrate advanced armor',
    tier: 3,
    icon: 'zap',
    requirements: ['maximum-damage'],
    unlocked: false,
    category: 'weapons',
  },

  // Defense - Tier 1
  {
    id: 'light-shields',
    name: 'Light Shields',
    description: 'Basic shield generators and minimal hull armor',
    tier: 1,
    icon: 'shield',
    requirements: [],
    unlocked: true,
    category: 'defense',
  },
  {
    id: 'basic-armor',
    name: 'Basic Hull Armor',
    description: 'Standard hull plating and structural reinforcement',
    tier: 1,
    icon: 'shield',
    requirements: ['light-shields'],
    unlocked: false,
    category: 'defense',
  },

  // Defense - Tier 2
  {
    id: 'medium-shields',
    name: 'Medium Shields',
    description: 'Improved shields with regenerative properties',
    tier: 2,
    icon: 'shield',
    requirements: ['light-shields'],
    unlocked: false,
    category: 'defense',
  },
  {
    id: 'reactive-armor',
    name: 'Reactive Armor',
    description: 'Advanced armor that responds to incoming damage',
    tier: 2,
    icon: 'shield',
    requirements: ['basic-armor'],
    unlocked: false,
    category: 'defense',
  },
  {
    id: 'repair-drones',
    name: 'Repair Drones',
    description: 'Automated drones for rapid in-combat hull repairs',
    tier: 2,
    icon: 'zap',
    requirements: ['reactive-armor'],
    unlocked: false,
    category: 'defense',
  },

  // Defense - Tier 3
  {
    id: 'heavy-shields',
    name: 'Heavy Shields',
    description: 'Advanced shields with layered defense and smart countermeasures',
    tier: 3,
    icon: 'shield',
    requirements: ['medium-shields'],
    unlocked: false,
    category: 'defense',
  },
  {
    id: 'point-defense',
    name: 'Point Defense System',
    description: 'Automated defense grid against incoming projectiles',
    tier: 3,
    icon: 'crosshair',
    requirements: ['heavy-shields'],
    unlocked: false,
    category: 'defense',
  },
  {
    id: 'energy-dissipation',
    name: 'Energy Dissipation Field',
    description: 'Temporarily reduces incoming energy-based damage',
    tier: 3,
    icon: 'zap',
    requirements: ['heavy-shields', 'point-defense'],
    unlocked: false,
    category: 'defense',
  },

  // Special Projects - Officer Academy
  {
    id: 'refugee-market',
    name: 'Refugee Market',
    description: 'Attract skilled officers from other factions',
    tier: 2,
    icon: 'database',
    requirements: ['basic-hangar'],
    unlocked: false,
    category: 'special',
  },
  {
    id: 'indoctrination',
    name: 'Indoctrination Program',
    description: 'Convert enemy officers to enhance fleet performance',
    tier: 3,
    icon: 'zap',
    requirements: ['refugee-market'],
    unlocked: false,
    category: 'special',
  },
  {
    id: 'advanced-training',
    name: 'Advanced Training Simulations',
    description: 'Accelerate officer XP gain and tactical proficiency',
    tier: 3,
    icon: 'sword',
    requirements: ['refugee-market'],
    unlocked: false,
    category: 'special',
  },

  // Special Projects - Capital Ships
  {
    id: 'command-nexus',
    name: 'Command Nexus',
    description: 'Mobile command center improving fleet coordination',
    tier: 3,
    icon: 'ship',
    requirements: ['mega-hangar'],
    unlocked: false,
    category: 'special',
  },
  {
    id: 'orbital-docking',
    name: 'Orbital Docking Enhancements',
    description: 'Faster repair and resupply operations',
    tier: 2,
    icon: 'rocket',
    requirements: ['expanded-hangar'],
    unlocked: false,
    category: 'special',
  },

  // Special Projects - Resources & Trade
  {
    id: 'trade-network',
    name: 'Interstellar Trade Network',
    description: 'Automated resource flow between systems',
    tier: 2,
    icon: 'database',
    requirements: ['improved-extraction'],
    unlocked: false,
    category: 'special',
  },
  {
    id: 'dyson-automation',
    name: 'Dyson Sphere Automation',
    description: 'Enhanced energy production via automated management',
    tier: 3,
    icon: 'zap',
    requirements: ['trade-network'],
    unlocked: false,
    category: 'special',
  },

  // Cross-Domain Synergies
  {
    id: 'ai-automation',
    name: 'Integrated AI Core',
    description: 'Improves automation efficiency across all systems',
    tier: 3,
    icon: 'zap',
    requirements: ['quantum-comms'],
    unlocked: false,
    category: 'synergy',
  },
  {
    id: 'quantum-comms',
    name: 'Quantum Communications',
    description: 'Reduces system delays and improves decision-making',
    tier: 2,
    icon: 'radar',
    requirements: [],
    unlocked: true,
    category: 'synergy',
  },
  {
    id: 'tech-convergence',
    name: 'Modular Tech Convergence',
    description: 'Enables synergies between different modules',
    tier: 3,
    icon: 'database',
    requirements: ['quantum-comms', 'ai-automation'],
    unlocked: false,
    category: 'synergy',
  },
];

const categories = [
  { id: 'infrastructure', name: 'Infrastructure', icon: Rocket },
  { id: 'warFleet', name: 'War Fleet', icon: Sword },
  { id: 'reconFleet', name: 'Recon Fleet', icon: Radar },
  { id: 'miningFleet', name: 'Mining Fleet', icon: Database },
  { id: 'special', name: 'Special Projects', icon: Zap },
  { id: 'synergy', name: 'Cross-Domain', icon: Shield },
  { id: 'weapons', name: 'Weapons', icon: Crosshair },
  { id: 'defense', name: 'Defense', icon: Shield },
];

export function TechTree() {
  const [selectedNode, setSelectedNode] = useState<TechNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<TechNode['category']>('infrastructure');

  const handleNodeClick = (node: TechNode) => {
    setSelectedNode(node);
  };

  const getTierNodes = (tier: number) => {
    return techNodes.filter(node => node.tier === tier && node.category === activeCategory);
  };

  const getNodeColor = (node: TechNode) => {
    if (node.unlocked) {
      return 'bg-cyan-500 border-cyan-400';
    }
    if (node.requirements.every(req => techNodes.find(n => n.id === req)?.unlocked)) {
      return 'bg-indigo-500 border-indigo-400';
    }
    return 'bg-gray-700 border-gray-600';
  };

  const renderTier = (tier: number) => {
    const nodes = getTierNodes(tier);
    return (
      <div className="flex justify-center space-x-8">
        {nodes.map(node => {
          const Icon = nodeIcons[node.icon];
          const colorClasses = getNodeColor(node);
          const isHovered = hoveredNode === node.id;

          return (
            <div
              key={node.id}
              className="relative"
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <button
                onClick={() => handleNodeClick(node)}
                className={`w-16 h-16 ${colorClasses} rounded-lg border-2 flex items-center justify-center transition-all duration-300 hover:scale-110`}
              >
                <Icon className="w-8 h-8 text-white" />
                {!node.unlocked && (
                  <Lock className="w-4 h-4 absolute top-1 right-1 text-gray-300/70" />
                )}
                {node.unlocked && (
                  <Check className="w-4 h-4 absolute top-1 right-1 text-green-300" />
                )}
              </button>

              {/* Hover Tooltip */}
              {isHovered && (
                <div className="absolute z-10 w-64 p-4 bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 -translate-x-1/2 left-1/2 mt-2">
                  <h3 className="text-lg font-bold text-white mb-1">{node.name}</h3>
                  <p className="text-sm text-gray-300 mb-2">{node.description}</p>
                  {node.requirements.length > 0 && (
                    <div className="text-xs text-gray-400">
                      Requires: {node.requirements.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-8 bg-gray-900/95 backdrop-blur-md rounded-lg border border-gray-800">
      <h2 className="text-2xl font-bold text-white mb-8 text-center">Technology Tree</h2>

      {/* Category Tabs */}
      <div className="flex justify-center space-x-4 mb-8">
        {categories.map(category => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id as TechNode['category'])}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
              }`}
            >
              <category.icon className="w-4 h-4" />
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-12">
        {[1, 2, 3].map(tier => (
          <div key={tier} className="relative">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-700" />
            <div className="relative">
              <div className="text-sm font-medium text-gray-400 mb-4 text-center">Tier {tier}</div>
              {renderTier(tier)}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="mt-8 p-6 bg-gray-800/80 rounded-lg border border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">{selectedNode.name}</h3>
              <p className="text-gray-300">{selectedNode.description}</p>
            </div>
            {nodeIcons[selectedNode.icon] && (
              <div className={`p-3 ${getNodeColor(selectedNode)} rounded-lg`}>
                {React.createElement(nodeIcons[selectedNode.icon], {
                  className: 'w-6 h-6 text-white',
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
