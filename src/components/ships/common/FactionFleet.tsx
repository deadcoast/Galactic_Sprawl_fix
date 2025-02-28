import { useAdaptiveAI } from '../../../hooks/factions/useAdaptiveAI';
import { useFleetAI } from '../../../hooks/factions/useFleetAI';
import { AlertTriangle, Rocket, Shield, Sword } from 'lucide-react';
import { FactionId } from '../../../types/ships/FactionTypes';
import { FormationTransitionEffect } from '../../../effects/component_effects/FormationTransitionEffect';
import { useEffect, useState } from 'react';
import { Position } from '../../../types/core/GameTypes';

interface FactionFleetProps {
  fleetId: string;
  factionId: FactionId;
  onFleetCommand?: (command: string, targetId?: string) => void;
}

function getFormationShape(type: string): string {
  switch (type) {
    case 'spearhead':
      return 'polygon(50% 0%, 100% 100%, 0% 100%)';
    case 'shield':
      return 'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)';
    case 'diamond':
      return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
    case 'arrow':
      return 'polygon(0% 0%, 100% 50%, 0% 100%, 25% 50%)';
    case 'circle':
      return 'circle(50% at 50% 50%)';
    case 'wedge':
      return 'polygon(0% 0%, 100% 50%, 0% 100%)';
    case 'line':
      return 'polygon(0% 40%, 100% 40%, 100% 60%, 0% 60%)';
    default:
      return 'none';
  }
}

function getFormationColor(pattern: string): string {
  switch (pattern) {
    case 'offensive':
      return 'rgb(239, 68, 68)'; // red-500
    case 'defensive':
      return 'rgb(59, 130, 246)'; // blue-500
    case 'balanced':
      return 'rgb(168, 85, 247)'; // purple-500
    default:
      return 'rgb(255, 255, 255)';
  }
}

export function FactionFleet({ fleetId, factionId, onFleetCommand }: FactionFleetProps) {
  const fleetAI = useFleetAI(fleetId, factionId);
  const adaptiveAI = useAdaptiveAI(fleetId, factionId);
  const [previousFormation, setPreviousFormation] = useState<{
    positions: Position[];
    type: string;
    pattern: 'offensive' | 'defensive' | 'balanced';
  } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Monitor formation changes
  useEffect(() => {
    if (!previousFormation) {
      setPreviousFormation({
        positions: fleetAI.currentPositions || [],
        type: fleetAI.formation.type,
        pattern: fleetAI.formation.pattern,
      });
      return;
    }

    if (
      fleetAI.formation.type !== previousFormation.type ||
      fleetAI.formation.pattern !== previousFormation.pattern
    ) {
      setIsTransitioning(true);
    }
  }, [fleetAI.formation, previousFormation]);

  const handleTransitionComplete = () => {
    setIsTransitioning(false);
    setPreviousFormation({
      positions: fleetAI.currentPositions || [],
      type: fleetAI.formation.type,
      pattern: fleetAI.formation.pattern,
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Fleet Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Rocket className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">Fleet Control</h3>
            <div className="text-sm text-gray-400">
              AI Adaptation Level: {Math.round(adaptiveAI.experienceLevel * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Formation Display */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">Current Formation</span>
          <span className="text-sm text-gray-400">{fleetAI.formation.type}</span>
        </div>
        <div className="p-4 bg-gray-700/50 rounded-lg">
          <div className="aspect-square relative">
            {/* Formation Shape */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-2/3 h-2/3 transition-all duration-500"
                style={{
                  clipPath: getFormationShape(fleetAI.formation.type),
                  transform: `rotate(${fleetAI.formation.facing}rad)`,
                  backgroundColor: `${getFormationColor(fleetAI.formation.pattern)}33`,
                  border: `2px solid ${getFormationColor(fleetAI.formation.pattern)}66`,
                }}
              />
            </div>

            {/* Formation Transition Effect */}
            {isTransitioning && previousFormation && fleetAI.currentPositions && (
              <FormationTransitionEffect
                sourcePositions={previousFormation.positions}
                targetPositions={fleetAI.currentPositions}
                duration={fleetAI.formation.transitionSpeed ? fleetAI.formation.transitionSpeed * 1000 : 2000}
                easingFunction={fleetAI.formation.adaptiveSpacing ? 'easeInOut' : 'linear'}
                quality={adaptiveAI.performance.survivalRate > 0.7 ? 'high' : adaptiveAI.performance.survivalRate > 0.4 ? 'medium' : 'low'}
                pattern={fleetAI.formation.pattern}
                onComplete={handleTransitionComplete}
              />
            )}

            {/* Unit Indicators */}
            <div className="absolute inset-0">
              {Array.from({ length: 5 }).map((_, i) => {
                const angle = (i / 5) * Math.PI * 2;
                const radius = fleetAI.formation.spacing / 2;
                const x = 50 + Math.cos(angle) * radius;
                const y = 50 + Math.sin(angle) * radius;
                return (
                  <div
                    key={i}
                    className="absolute w-3 h-3 bg-indigo-400 rounded-full transition-all duration-500"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* AI Adaptations */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Combat Style</span>
            <span
              className={
                adaptiveAI.adaptations.combatStyle === 'aggressive'
                  ? 'text-red-400'
                  : adaptiveAI.adaptations.combatStyle === 'defensive'
                    ? 'text-blue-400'
                    : 'text-green-400'
              }
            >
              {adaptiveAI.adaptations.combatStyle}
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                adaptiveAI.adaptations.combatStyle === 'aggressive'
                  ? 'bg-red-500'
                  : adaptiveAI.adaptations.combatStyle === 'defensive'
                    ? 'bg-blue-500'
                    : 'bg-green-500'
              }`}
              style={{
                width: `${adaptiveAI.performance.damageEfficiency * 100}%`,
              }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Engagement Range</span>
            <span className="text-cyan-400">{adaptiveAI.adaptations.preferredRange}</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-500"
              style={{
                width: `${
                  adaptiveAI.adaptations.preferredRange === 'long'
                    ? 100
                    : adaptiveAI.adaptations.preferredRange === 'medium'
                      ? 66
                      : 33
                }%`,
              }}
            />
          </div>
        </div>

        {/* Formation Transition Speed */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Formation Speed</span>
            <span className="text-amber-400">
              {fleetAI.formation.transitionSpeed?.toFixed(1)}x
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{
                width: `${((fleetAI.formation.transitionSpeed || 1) / 2) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-gray-700/50 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Win Rate</div>
          <div className="text-lg font-medium text-green-400">
            {Math.round(adaptiveAI.performance.winRate * 100)}%
          </div>
        </div>
        <div className="p-3 bg-gray-700/50 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Survival Rate</div>
          <div className="text-lg font-medium text-blue-400">
            {Math.round(adaptiveAI.performance.survivalRate * 100)}%
          </div>
        </div>
      </div>

      {/* Command Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onFleetCommand?.('engage')}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-sm text-red-200 flex items-center justify-center space-x-2"
        >
          <Sword className="w-4 h-4" />
          <span>Engage Target</span>
        </button>
        <button
          onClick={() => onFleetCommand?.('defend')}
          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-sm text-blue-200 flex items-center justify-center space-x-2"
        >
          <Shield className="w-4 h-4" />
          <span>Defensive Formation</span>
        </button>
      </div>

      {/* Warnings */}
      {adaptiveAI.performance.survivalRate < 0.4 && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-700/30 rounded-lg flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-200">
            Fleet survival rate critical. Consider adjusting combat parameters.
          </span>
        </div>
      )}
    </div>
  );
}
