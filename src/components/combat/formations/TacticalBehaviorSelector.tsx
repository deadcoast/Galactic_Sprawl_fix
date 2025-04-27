import {
  Clock,
  CornerUpRight,
  Crosshair,
  Move,
  ParkingCircle,
  Radar,
  Shield,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

export interface TacticalBehavior {
  id: string;
  name: string;
  description: string;
  category: 'attack' | 'defense' | 'movement' | 'special';
  bonuses: {
    name: string;
    value: string;
  }[];
}

interface TacticalBehaviorSelectorProps {
  currentBehaviorId?: string;
  onSelectBehavior: (behaviorId: string) => void;
  formationType?: 'offensive' | 'defensive' | 'balanced';
}

export function TacticalBehaviorSelector({
  currentBehaviorId,
  onSelectBehavior,
  formationType = 'balanced',
}: TacticalBehaviorSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    'attack' | 'defense' | 'movement' | 'special'
  >('attack');

  // Define tactical behaviors based on categories
  const tacticalBehaviors: TacticalBehavior[] = [
    // Attack behaviors
    {
      id: 'focused_fire',
      name: 'Focused Fire',
      description: 'All ships concentrate fire on a single target',
      category: 'attack',
      bonuses: [
        { name: 'Damage per volley', value: '+25%' },
        { name: 'Target acquisition', value: '-10%' },
      ],
    },
    {
      id: 'broadside_barrage',
      name: 'Broadside Barrage',
      description: 'Ships position to deliver maximum firepower across multiple targets',
      category: 'attack',
      bonuses: [
        { name: 'Area damage', value: '+15%' },
        { name: 'Coverage', value: '+30%' },
      ],
    },
    {
      id: 'opportunistic_strikes',
      name: 'Opportunistic Strikes',
      description: 'Target enemies with exposed vulnerabilities or damaged systems',
      category: 'attack',
      bonuses: [
        { name: 'Critical hit chance', value: '+20%' },
        { name: 'Critical damage', value: '+15%' },
      ],
    },

    // Defense behaviors
    {
      id: 'shield_wall',
      name: 'Shield Wall',
      description: 'Ships coordinate shield projections to form a protective barrier',
      category: 'defense',
      bonuses: [
        { name: 'Shield strength', value: '+30%' },
        { name: 'Shield recharge', value: '+10%' },
      ],
    },
    {
      id: 'point_defense_network',
      name: 'Point Defense Network',
      description: 'Coordinate point defense systems to intercept incoming projectiles',
      category: 'defense',
      bonuses: [
        { name: 'Missile interception', value: '+40%' },
        { name: 'Area protection', value: '+25%' },
      ],
    },
    {
      id: 'evasive_maneuvers',
      name: 'Evasive Maneuvers',
      description: 'Ships perform unpredictable movements to avoid enemy fire',
      category: 'defense',
      bonuses: [
        { name: 'Evasion', value: '+35%' },
        { name: 'Formation cohesion', value: '-15%' },
      ],
    },

    // Movement behaviors
    {
      id: 'flanking_maneuver',
      name: 'Flanking Maneuver',
      description: 'Strike from unexpected angles to bypass enemy defenses',
      category: 'movement',
      bonuses: [
        { name: 'Flank damage', value: '+35%' },
        { name: 'Positioning speed', value: '+20%' },
      ],
    },
    {
      id: 'coordinated_jumps',
      name: 'Coordinated Jumps',
      description: 'Time short-range jumps to confuse and surround the enemy',
      category: 'movement',
      bonuses: [
        { name: 'Jump accuracy', value: '+25%' },
        { name: 'Reposition time', value: '-30%' },
      ],
    },
    {
      id: 'defensive_retreat',
      name: 'Defensive Retreat',
      description: 'Maintain formation while falling back to a more advantageous position',
      category: 'movement',
      bonuses: [
        { name: 'Retreat speed', value: '+25%' },
        { name: 'Rear defense', value: '+40%' },
      ],
    },

    // Special behaviors
    {
      id: 'sensor_jamming',
      name: 'Sensor Jamming',
      description: 'Coordinate electronic combatfare to disrupt enemy targeting systems',
      category: 'special',
      bonuses: [
        { name: 'Enemy accuracy', value: '-25%' },
        { name: 'Sensor range', value: '-35%' },
      ],
    },
    {
      id: 'adaptive_tactics',
      name: 'Adaptive Tactics',
      description: 'Automatically adjust behavior based on battlefield conditions',
      category: 'special',
      bonuses: [
        { name: 'Tactical adaptation', value: '+30%' },
        { name: 'Response time', value: '-20%' },
      ],
    },
    {
      id: 'resource_efficiency',
      name: 'Resource Efficiency',
      description: 'Optimize weapon and system usage to conserve energy and ammunition',
      category: 'special',
      bonuses: [
        { name: 'Energy consumption', value: '-25%' },
        { name: 'Ammo efficiency', value: '+20%' },
      ],
    },
  ];

  // Filter behaviors by selected category
  const filteredBehaviors = tacticalBehaviors.filter(
    behavior => behavior.category === selectedCategory
  );

  // Determine currently selected behavior
  const selectedBehavior = tacticalBehaviors.find(behavior => behavior.id === currentBehaviorId);

  // Get icon for category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'attack':
        return <Crosshair className="h-5 w-5" />;
      case 'defense':
        return <Shield className="h-5 w-5" />;
      case 'movement':
        return <Move className="h-5 w-5" />;
      case 'special':
        return <Zap className="h-5 w-5" />;
      default:
        return <Crosshair className="h-5 w-5" />;
    }
  };

  // Get icon for specific behavior
  const getBehaviorIcon = (behaviorId: string) => {
    switch (behaviorId) {
      case 'focused_fire':
        return <Crosshair className="h-5 w-5" />;
      case 'broadside_barrage':
        return <CornerUpRight className="h-5 w-5" />;
      case 'shield_wall':
        return <Shield className="h-5 w-5" />;
      case 'point_defense_network':
        return <ParkingCircle className="h-5 w-5" />;
      case 'flanking_maneuver':
        return <Move className="h-5 w-5" />;
      case 'coordinated_jumps':
        return <Clock className="h-5 w-5" />;
      case 'sensor_jamming':
        return <Radar className="h-5 w-5" />;
      case 'adaptive_tactics':
        return <Zap className="h-5 w-5" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };

  // Get color for category
  const getCategoryColor = (category: string, isActive: boolean) => {
    if (!isActive) {
      return 'bg-gray-700 text-gray-300';
    }

    switch (category) {
      case 'attack':
        return 'bg-red-900/50 text-red-300 border-red-500';
      case 'defense':
        return 'bg-blue-900/50 text-blue-300 border-blue-500';
      case 'movement':
        return 'bg-green-900/50 text-green-300 border-green-500';
      case 'special':
        return 'bg-purple-900/50 text-purple-300 border-purple-500';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  // Get color for behavior based on formation type
  const getBehaviorTypeColor = (behaviorCategory: string) => {
    // Special consideration for formation type and behavior combinations
    if (formationType === 'offensive' && behaviorCategory === 'attack') {
      return 'border-red-600 bg-red-900/40';
    } else if (formationType === 'defensive' && behaviorCategory === 'defense') {
      return 'border-blue-600 bg-blue-900/40';
    } else if (formationType === 'balanced' && behaviorCategory === 'special') {
      return 'border-purple-600 bg-purple-900/40';
    }

    // Default colors by category
    switch (behaviorCategory) {
      case 'attack':
        return 'border-red-500/50 bg-red-900/20 hover:bg-red-900/30';
      case 'defense':
        return 'border-blue-500/50 bg-blue-900/20 hover:bg-blue-900/30';
      case 'movement':
        return 'border-green-500/50 bg-green-900/20 hover:bg-green-900/30';
      case 'special':
        return 'border-purple-500/50 bg-purple-900/20 hover:bg-purple-900/30';
      default:
        return 'border-gray-700 bg-gray-800/50 hover:bg-gray-700';
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
      <div className="border-b border-gray-700 p-4">
        <h3 className="text-lg font-medium text-white">Tactical Behavior</h3>
        <p className="text-sm text-gray-400">Configure how your fleet behaves in combat</p>
      </div>

      {/* Category selector */}
      <div className="grid grid-cols-4 gap-1 bg-gray-900 p-2">
        {(['attack', 'defense', 'movement', 'special'] as const).map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`flex flex-col items-center justify-center rounded-md border p-2 ${getCategoryColor(category, selectedCategory === category)}`}
          >
            {getCategoryIcon(category)}
            <span className="mt-1 text-xs capitalize">{category}</span>
          </button>
        ))}
      </div>

      {/* Behavior selector */}
      <div className="max-h-72 overflow-y-auto p-4">
        <div className="space-y-2">
          {filteredBehaviors.map(behavior => (
            <div
              key={behavior.id}
              onClick={() => onSelectBehavior(behavior.id)}
              className={`cursor-pointer rounded-md border p-3 transition-all ${
                behavior.id === currentBehaviorId
                  ? `border-2 ${getBehaviorTypeColor(behavior.category)} shadow-glow`
                  : `${getBehaviorTypeColor(behavior.category)}`
              }`}
            >
              <div className="mb-2 flex items-center">
                {getBehaviorIcon(behavior.id)}
                <span className="ml-2 font-medium text-white">{behavior.name}</span>
              </div>
              <p className="mb-2 text-sm text-gray-400">{behavior.description}</p>

              <div className="mt-2 grid grid-cols-2 gap-2">
                {behavior.bonuses.map((bonus, index) => (
                  <div key={index} className="flex justify-between rounded bg-black/20 p-1 text-xs">
                    <span className="text-gray-400">{bonus.name}</span>
                    <span
                      className={
                        bonus.value.startsWith('+')
                          ? 'text-green-400'
                          : bonus.value.startsWith('-')
                            ? 'text-red-400'
                            : 'text-blue-400'
                      }
                    >
                      {bonus.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected behavior summary */}
      {selectedBehavior && (
        <div className="border-t border-gray-700 bg-gray-900 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getBehaviorIcon(selectedBehavior.id)}
              <span className="ml-2 font-medium text-white">{selectedBehavior.name}</span>
            </div>
            <span
              className={`rounded px-2 py-1 text-xs capitalize ${
                selectedBehavior.category === 'attack'
                  ? 'bg-red-900/30 text-red-300'
                  : selectedBehavior.category === 'defense'
                    ? 'bg-blue-900/30 text-blue-300'
                    : selectedBehavior.category === 'movement'
                      ? 'bg-green-900/30 text-green-300'
                      : 'bg-purple-900/30 text-purple-300'
              }`}
            >
              {selectedBehavior.category}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
