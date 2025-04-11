import { useMemo } from 'react';
import { FleetFormation } from '../../../types/combat/CombatTypes';

interface FormationPresetListProps {
  currentType: string;
  onSelectFormation: (formation: FleetFormation) => void;
}

/**
 * FormationPresetList - Shows a list of predefined formation patterns for selection
 */
export function FormationPresetList({ currentType, onSelectFormation }: FormationPresetListProps) {
  // Get formations based on the current formation type
  const formations = useMemo(() => {
    const baseFormations: Record<string, FleetFormation[]> = {
      offensive: [
        {
          type: 'offensive',
          pattern: 'spearhead',
          spacing: 100,
          facing: 0,
          adaptiveSpacing: true,
          transitionSpeed: 2.0,
        },
        {
          type: 'offensive',
          pattern: 'arrow',
          spacing: 110,
          facing: 0,
          adaptiveSpacing: true,
          transitionSpeed: 1.8,
        },
        {
          type: 'offensive',
          pattern: 'wedge',
          spacing: 90,
          facing: 0,
          adaptiveSpacing: true,
          transitionSpeed: 1.9,
        },
      ],
      defensive: [
        {
          type: 'defensive',
          pattern: 'shield',
          spacing: 150,
          facing: Math.PI,
          adaptiveSpacing: true,
          transitionSpeed: 1.5,
        },
        {
          type: 'defensive',
          pattern: 'circle',
          spacing: 130,
          facing: 0,
          adaptiveSpacing: true,
          transitionSpeed: 1.6,
        },
        {
          type: 'defensive',
          pattern: 'diamond',
          spacing: 140,
          facing: 0,
          adaptiveSpacing: true,
          transitionSpeed: 1.4,
        },
      ],
      balanced: [
        {
          type: 'balanced',
          pattern: 'line',
          spacing: 120,
          facing: Math.PI / 2,
          adaptiveSpacing: true,
          transitionSpeed: 1.2,
        },
        {
          type: 'balanced',
          pattern: 'scattered',
          spacing: 130,
          facing: 0,
          adaptiveSpacing: true,
          transitionSpeed: 1.3,
        },
        {
          type: 'balanced',
          pattern: 'diamond',
          spacing: 120,
          facing: 0,
          adaptiveSpacing: true,
          transitionSpeed: 1.2,
        },
      ],
    };

    return baseFormations[currentType] || baseFormations.balanced;
  }, [currentType]);

  // Get formation description based on pattern
  const getFormationDescription = (pattern: string): string => {
    switch (pattern) {
      case 'spearhead':
        return 'Concentrated attack formation for precise strikes against a single target';
      case 'shield':
        return 'Defensive formation that provides maximum protection from frontal attacks';
      case 'diamond':
        return 'Balanced formation offering both offensive capabilities and defensive coverage';
      case 'arrow':
        return 'High-speed formation that excels at piercing through enemy lines';
      case 'circle':
        return 'Defensive formation providing protection from all directions';
      case 'wedge':
        return 'Aggressive formation designed to break through enemy defenses';
      case 'line':
        return 'Traditional formation with broad firing arcs and even spacing';
      case 'scattered':
        return 'Evasive formation that minimizes damage from area attacks';
      default:
        return 'Standard combat formation';
    }
  };

  // Render a formation pattern preview
  const FormationPreview = ({ pattern, type }: { pattern: string; type: string }) => {
    let clipPath = '';
    let color = '';

    // Get pattern shape
    switch (pattern) {
      case 'spearhead':
        clipPath = 'polygon(50% 0%, 100% 100%, 0% 100%)';
        break;
      case 'shield':
        clipPath = 'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)';
        break;
      case 'diamond':
        clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
        break;
      case 'arrow':
        clipPath = 'polygon(0% 0%, 100% 50%, 0% 100%, 25% 50%)';
        break;
      case 'circle':
        clipPath = 'circle(50% at 50% 50%)';
        break;
      case 'wedge':
        clipPath = 'polygon(0% 0%, 100% 50%, 0% 100%)';
        break;
      case 'line':
        clipPath = 'polygon(0% 40%, 100% 40%, 100% 60%, 0% 60%)';
        break;
      case 'scattered':
        clipPath = 'polygon(20% 20%, 80% 20%, 80% 80%, 20% 80%)';
        break;
    }

    // Get color based on type
    switch (type) {
      case 'offensive':
        color = 'rgba(239, 68, 68, 0.6)'; // red-500
        break;
      case 'defensive':
        color = 'rgba(59, 130, 246, 0.6)'; // blue-500
        break;
      case 'balanced':
        color = 'rgba(168, 85, 247, 0.6)'; // purple-500
        break;
    }

    return (
      <div
        className="mr-3 h-12 w-12 flex-shrink-0"
        style={{
          clipPath,
          backgroundColor: color,
          border: `1px solid ${color.replace('0.6', '1')}`,
        }}
      />
    );
  };

  return (
    <div className="space-y-3">
      {formations.map((formation, index) => (
        <div
          key={index}
          className="flex cursor-pointer items-center rounded-lg border border-gray-600 bg-gray-700/30 p-3 transition-colors hover:bg-gray-700/50"
          onClick={() => onSelectFormation(formation)}
        >
          <FormationPreview pattern={formation.pattern} type={formation.type} />
          <div className="flex-1">
            <h3 className="font-medium text-white capitalize">{formation.pattern}</h3>
            <p className="text-xs text-gray-400">{getFormationDescription(formation.pattern)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
