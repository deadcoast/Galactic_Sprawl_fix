import { motion } from 'framer-motion';
import {
  Apple,
  ChevronDown,
  ChevronUp,
  Heart,
  Home,
  Info,
  Leaf,
  Minus,
  Plus,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { ResourceType } from './../../../types/resources/ResourceTypes';
interface GrowthModifier {
  id: string;
  name: string;
  description: string;
  effect: number; // Percentage modifier (e.g., 1.1 = +10%)
  type: ResourceType.FOOD | 'housing' | 'healthcare' | 'environment' | ResourceType.ENERGY;
  active: boolean;
}

interface GrowthRateModifiersProps {
  colonyId: string;
  baseGrowthRate: number; // Base growth rate per cycle (e.g., 0.05 = 5%)
  modifiers: GrowthModifier[];
  onModifierToggle?: (modifierId: string, active: boolean) => void;
  onModifierAdd?: (type: GrowthModifier['type']) => void;
  onModifierRemove?: (modifierId: string) => void;
}

/**
 * GrowthRateModifiers component
 *
 * Displays and manages growth rate modifiers for a colony.
 * Shows the effective growth rate based on active modifiers.
 * Allows toggling modifiers on/off and adding/removing modifiers.
 */
export function GrowthRateModifiers({
  baseGrowthRate,
  modifiers,
  onModifierToggle,
  onModifierAdd,
  onModifierRemove,
}: GrowthRateModifiersProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [hoveredModifier, setHoveredModifier] = useState<string | null>(null);

  // Calculate effective growth rate based on active modifiers
  const calculateEffectiveGrowthRate = () => {
    const activeModifiers = modifiers.filter(m => m.active);

    if (activeModifiers.length === 0) {
      return baseGrowthRate;
    }

    const totalEffect = activeModifiers.reduce((total, modifier) => {
      return total * modifier.effect;
    }, 1);

    return baseGrowthRate * totalEffect;
  };

  const effectiveGrowthRate = calculateEffectiveGrowthRate();

  // Format growth rate as percentage
  const formatGrowthRate = (rate: number) => {
    return `${(rate * 100).toFixed(2)}%`;
  };

  // Get growth rate change from base
  const getGrowthRateChange = () => {
    const change = effectiveGrowthRate - baseGrowthRate;
    const percentChange = (change / baseGrowthRate) * 100;

    if (Math.abs(percentChange) < 0.01) {
      return 'No change';
    }

    return `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(2)}%`;
  };

  // Get color based on growth rate change
  const getGrowthRateColor = () => {
    const change = effectiveGrowthRate - baseGrowthRate;

    if (change > 0) {
      return 'text-green-400';
    } else if (change < 0) {
      return 'text-red-400';
    }

    return 'text-gray-400';
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  // Get icon for modifier type
  const getModifierIcon = (type: GrowthModifier['type']) => {
    switch (type) {
      case ResourceType.FOOD:
        return <Apple className="h-4 w-4 text-amber-400" />;
      case 'housing':
        return <Home className="h-4 w-4 text-blue-400" />;
      case 'healthcare':
        return <Heart className="h-4 w-4 text-red-400" />;
      case 'environment':
        return <Leaf className="h-4 w-4 text-green-400" />;
      case ResourceType.ENERGY:
        return <Zap className="h-4 w-4 text-yellow-400" />;
      default:
        return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  // Get color for modifier type
  const getModifierTypeColor = (type: GrowthModifier['type']) => {
    switch (type) {
      case ResourceType.FOOD:
        return 'bg-amber-900/30 text-amber-400 border-amber-700';
      case 'housing':
        return 'bg-blue-900/30 text-blue-400 border-blue-700';
      case 'healthcare':
        return 'bg-red-900/30 text-red-400 border-red-700';
      case 'environment':
        return 'bg-green-900/30 text-green-400 border-green-700';
      case ResourceType.ENERGY:
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-700';
      default:
        return 'bg-gray-900/30 text-gray-400 border-gray-700';
    }
  };

  // Group modifiers by type
  const modifiersByType = modifiers.reduce(
    (groups, modifier) => {
      if (!groups[modifier.type]) {
        groups[modifier.type] = [];
      }

      groups[modifier.type].push(modifier);
      return groups;
    },
    {} as Record<GrowthModifier['type'], GrowthModifier[]>
  );

  // Get available modifier types for adding
  const availableModifierTypes: GrowthModifier['type'][] = [
    ResourceType.FOOD,
    'housing',
    'healthcare',
    'environment',
    ResourceType.ENERGY,
  ];

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-white">Growth Rate Modifiers</h3>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Base Rate:</span>
            <span className="text-sm font-medium text-white">
              {formatGrowthRate(baseGrowthRate)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Effective Rate:</span>
            <span className={`text-sm font-medium ${getGrowthRateColor()}`}>
              {formatGrowthRate(effectiveGrowthRate)}
            </span>
            <span className={`text-xs ${getGrowthRateColor()}`}>({getGrowthRateChange()})</span>
          </div>
        </div>
      </div>

      {/* Modifiers by Type */}
      <div className="space-y-3">
        {Object.entries(modifiersByType).map(([type, typeModifiers]) => (
          <div key={type} className="overflow-hidden rounded-md border border-gray-700 bg-gray-900">
            <div
              className="flex cursor-pointer items-center justify-between p-3"
              onClick={() => toggleSection(type)}
            >
              <div className="flex items-center space-x-2">
                {getModifierIcon(type as GrowthModifier['type'])}
                <span className="text-sm font-medium text-white capitalize">{type}</span>
                <span className="text-xs text-gray-400">
                  ({typeModifiers.filter(m => m.active).length}/{typeModifiers.length} active)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-xs ${typeModifiers.some(m => m.active) ? 'text-green-400' : 'text-gray-500'}`}
                >
                  {typeModifiers.some(m => m.active)
                    ? `+${((typeModifiers.filter(m => m.active).reduce((total, m) => total * m.effect, 1) - 1) * 100).toFixed(2)}%`
                    : 'No effect'}
                </span>
                {expandedSection === type ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>

            {expandedSection === type && (
              <div className="border-t border-gray-700 p-3">
                <div className="space-y-2">
                  {typeModifiers.map(modifier => (
                    <div
                      key={modifier.id}
                      className={`relative rounded-md border p-2 transition-all ${
                        modifier.active
                          ? getModifierTypeColor(modifier.type)
                          : 'border-gray-700 bg-gray-800/50 text-gray-400'
                      } ${hoveredModifier === modifier.id ? 'scale-[1.02]' : 'scale-100'}`}
                      onMouseEnter={() => setHoveredModifier(modifier.id)}
                      onMouseLeave={() => setHoveredModifier(null)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getModifierIcon(modifier.type)}
                          <span className="text-sm font-medium">{modifier.name}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span
                            className={`text-xs ${modifier.effect > 1 ? 'text-green-400' : modifier.effect < 1 ? 'text-red-400' : 'text-gray-400'}`}
                          >
                            {modifier.effect > 1 ? '+' : ''}
                            {((modifier.effect - 1) * 100).toFixed(2)}%
                          </span>
                          <button
                            className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                              modifier.active
                                ? 'bg-gray-700 hover:bg-gray-600'
                                : 'bg-gray-800 hover:bg-gray-700'
                            }`}
                            onClick={() => onModifierToggle?.(modifier.id, !modifier.active)}
                          >
                            {modifier.active ? (
                              <Minus className="h-3 w-3 text-gray-300" />
                            ) : (
                              <Plus className="h-3 w-3 text-gray-300" />
                            )}
                          </button>
                          {onModifierRemove && (
                            <button
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-red-900/30 text-red-400 hover:bg-red-800/50"
                              onClick={() => onModifierRemove(modifier.id)}
                            >
                              <svg
                                className="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {hoveredModifier === modifier.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-xs text-gray-400"
                        >
                          {modifier.description}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>

                {onModifierAdd && (
                  <div className="mt-3 flex justify-end">
                    <button
                      className="flex items-center space-x-1 rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-300 hover:bg-gray-700"
                      onClick={() => onModifierAdd(type as GrowthModifier['type'])}
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add {type} modifier</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Modifier Type */}
      {onModifierAdd && (
        <div className="mt-4 border-t border-gray-700 pt-4">
          <div className="flex flex-wrap gap-2">
            {availableModifierTypes
              .filter(type => !modifiersByType[type] || modifiersByType[type].length === 0)
              .map(type => (
                <button
                  key={type}
                  className={`flex items-center space-x-1 rounded-md border px-2 py-1 text-xs ${getModifierTypeColor(type)}`}
                  onClick={() => onModifierAdd(type)}
                >
                  {getModifierIcon(type)}
                  <span>Add {type}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Growth Rate Visualization */}
      <div className="mt-4 border-t border-gray-700 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">Growth Rate Impact</span>
          <span className="text-xs text-gray-400">
            Base: {formatGrowthRate(baseGrowthRate)} → Effective:{' '}
            {formatGrowthRate(effectiveGrowthRate)}
          </span>
        </div>

        <div className="h-8 w-full overflow-hidden rounded-md bg-gray-900">
          <div className="relative h-full w-full">
            {/* Base Growth Rate Marker */}
            <div
              className="absolute top-0 bottom-0 border-r border-dashed border-white/30"
              style={{ left: `${Math.min(100, baseGrowthRate * 1000)}%` }}
            >
              <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-white"></div>
            </div>

            {/* Effective Growth Rate Bar */}
            <motion.div
              className={`absolute bottom-0 h-full ${effectiveGrowthRate > baseGrowthRate ? 'bg-green-500/30' : 'bg-red-500/30'}`}
              style={{
                width: `${Math.min(100, effectiveGrowthRate * 1000)}%`,
                borderRight: '2px solid',
                borderColor:
                  effectiveGrowthRate > baseGrowthRate ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
              }}
              initial={{ width: `${Math.min(100, baseGrowthRate * 1000)}%` }}
              animate={{ width: `${Math.min(100, effectiveGrowthRate * 1000)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              <div
                className="absolute -top-1 -right-1 h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    effectiveGrowthRate > baseGrowthRate ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
                }}
              ></div>
            </motion.div>

            {/* Modifier Impact Indicators */}
            {modifiers
              .filter(m => m.active)
              .map((modifier, index) => {
                // Calculate position based on impact
                const position = Math.min(
                  100,
                  baseGrowthRate *
                    1000 *
                    modifiers
                      .filter(m => m.active)
                      .slice(0, index + 1)
                      .reduce((total, m) => total * m.effect, 1)
                );

                return (
                  <div
                    key={modifier.id}
                    className="absolute top-0 bottom-0 border-r border-dotted"
                    style={{
                      left: `${position}%`,
                      borderColor:
                        modifier.effect > 1 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
                    }}
                  >
                    <div
                      className="absolute -top-1 h-2 w-2 -translate-x-1/2 rounded-full"
                      style={{
                        backgroundColor:
                          modifier.effect > 1 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
                      }}
                    ></div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="mt-2 flex justify-between">
          <span className="text-xs text-gray-500">0%</span>
          <span className="text-xs text-gray-500">0.1%</span>
          <span className="text-xs text-gray-500">0.2%</span>
          <span className="text-xs text-gray-500">0.3%</span>
          <span className="text-xs text-gray-500">0.4%</span>
          <span className="text-xs text-gray-500">0.5%+</span>
        </div>
      </div>
    </div>
  );
}
