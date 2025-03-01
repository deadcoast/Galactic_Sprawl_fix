import { AlertTriangle, Shield, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CombatAutomationEffect } from '../../effects/component_effects/CombatAutomationEffect';
import { useFleetAI } from '../../hooks/factions/useFleetAI';
import { useGlobalEvents } from '../../hooks/game/useGlobalEvents';
import { useVPR } from '../../hooks/ui/useVPR';
import { ModuleEvent, moduleEventBus } from '../../lib/modules/ModuleEvents';
import { Position } from '../../types/core/GameTypes';
import { FactionId } from '../../types/ships/FactionTypes';

interface HazardVPR {
  type: Hazard['type'];
  severity: Hazard['severity'];
  effectType: Hazard['effect']['type'];
  visualTier: 1 | 2 | 3;
  animationSet: {
    idle: string;
    active: string;
    impact: string;
  };
  particleSystem: {
    density: number;
    color: string;
    pattern: 'circular' | 'radial' | 'directed';
  };
}

interface Hazard {
  id: string;
  type: 'asteroids' | 'debris' | 'radiation' | 'anomaly';
  position: { x: number; y: number };
  radius: number;
  severity: 'low' | 'medium' | 'high';
  effect: {
    type: 'damage' | 'slow' | 'shield' | 'weapon';
    value: number;
  };
  movement?: {
    speed: number;
    direction: number;
  };
  particles?: number;
  vpr?: HazardVPR;
}

interface TechBonuses {
  hazardResistance: number;
  detectionRange: number;
  effectPotency: number;
}

interface CombatUnit {
  id: string;
  type:
    | 'spitflare'
    | 'starSchooner'
    | 'orionFrigate'
    | 'harbringerGalleon'
    | 'midwayCarrier'
    | 'motherEarthRevenge';
  tier: 1 | 2 | 3;
  position: { x: number; y: number };
  status: 'idle' | 'patrolling' | 'engaging' | 'returning' | 'damaged';
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  weapons: WeaponSystem[];
}

interface WeaponSystem {
  id: string;
  type: 'machineGun' | 'gaussCannon' | 'railGun' | 'mgss' | 'rockets';
  damage: number;
  range: number;
  cooldown: number;
  status: 'ready' | 'charging' | 'cooling';
  upgrades?: {
    name: string;
    description: string;
    unlocked: boolean;
  }[];
}

interface BattleEnvironmentProps {
  hazards: Hazard[];
  units: CombatUnit[];
  fleetId: string;
  factionId: FactionId;
  onHazardEffect: (hazardId: string, shipId: string, effect: Hazard['effect']) => void;
  onWeaponFire: (weaponId: string, targetId: string) => void;
  onUnitMove: (unitId: string, position: { x: number; y: number }) => void;
  quality: 'low' | 'medium' | 'high';
  tier: 1 | 2 | 3;
  techBonuses?: TechBonuses;
  onThreatDetected?: (hazard: Hazard) => void;
}

interface FormationLines {
  points: Array<{ x: number; y: number }>;
  style: 'solid' | 'dashed';
  color: string;
  opacity: number;
}

interface RangeCircle {
  center: { x: number; y: number };
  radius: number;
  type: 'engagement' | 'support';
  opacity: number;
}

interface _FleetAIResult {
  formationPatterns: {
    defensive: {
      spacing: number;
      facing: number;
      pattern: 'defensive';
      adaptiveSpacing: boolean;
    };
    offensive: {
      spacing: number;
      facing: number;
      pattern: 'offensive';
      adaptiveSpacing: boolean;
    };
    balanced: {
      spacing: number;
      facing: number;
      pattern: 'balanced';
      adaptiveSpacing: boolean;
    };
  };
  adaptiveAI: {
    experienceLevel: number;
    performance: {
      damageEfficiency: number;
      survivalRate: number;
    };
  };
  factionBehavior: {
    aggressionLevel: number;
    territorialControl: {
      facing: number;
    };
  };
  visualFeedback?: {
    formationLines: FormationLines;
    rangeCircles: RangeCircle[];
  };
}

export function BattleEnvironment({
  hazards,
  units,
  fleetId,
  factionId,
  onHazardEffect,
  onWeaponFire,
  onUnitMove,
  quality,
  tier,
  techBonuses = { hazardResistance: 1, detectionRange: 1, effectPotency: 1 },
  onThreatDetected,
}: BattleEnvironmentProps) {
  // Use refs for mutable state that doesn't need re-renders
  const activeHazardsRef = useRef(hazards);
  const particlePositionsRef = useRef<Record<string, Array<{ x: number; y: number }>>>({});
  const weaponEffectsRef = useRef<Record<string, { active: boolean; type: string }>>({});

  // State that needs re-renders
  const [impactAnimations, setImpactAnimations] = useState<Record<string, boolean>>({});
  const [automationEffects, setAutomationEffects] = useState<
    Array<{
      id: string;
      type: 'formation' | 'engagement' | 'repair' | 'shield' | 'attack' | 'retreat';
      position: Position;
      timestamp: number;
    }>
  >([]);

  // Batch updates using requestAnimationFrame
  const requestUpdate = useCallback(() => {
    requestAnimationFrame(() => {
      setImpactAnimations(prev => ({ ...prev }));
    });
  }, []);

  // Memoize event handlers
  const { emitEvent } = useGlobalEvents();
  const { getVPRAnimationSet } = useVPR();
  const fleetAIResult = useFleetAI(fleetId, factionId);

  // Memoize fleet AI result
  const fleetAI = useMemo(
    () => ({
      formationPatterns: fleetAIResult.formationPatterns,
      adaptiveAI: fleetAIResult.adaptiveAI,
      factionBehavior: {
        aggressionLevel: fleetAIResult.factionBehavior.behaviorState.aggression,
        territorialControl: {
          facing: fleetAIResult.factionBehavior.territory.center.x || 0,
        },
      },
      visualFeedback: {
        formationLines: {
          points: [],
          style: 'solid',
          color: '#fff',
          opacity: 0.5,
        },
        rangeCircles: [],
      },
    }),
    [fleetAIResult]
  );

  // Memoize tech-enhanced values
  const enhancedValues = useMemo(
    () => ({
      detectionRadius: 1000 * techBonuses.detectionRange,
      hazardResistance: Math.min(0.9, techBonuses.hazardResistance),
      effectMultiplier: Math.max(0.1, techBonuses.effectPotency),
    }),
    [techBonuses]
  );

  // Optimize collision detection with spatial partitioning
  const spatialGrid = useMemo(() => {
    const grid: Record<string, Set<string>> = {};
    const cellSize = 100; // Adjust based on typical unit sizes

    units.forEach(unit => {
      const cellX = Math.floor(unit.position.x / cellSize);
      const cellY = Math.floor(unit.position.y / cellSize);
      const cellKey = `${cellX},${cellY}`;

      if (!grid[cellKey]) {
        grid[cellKey] = new Set();
      }
      grid[cellKey].add(unit.id);
    });

    return grid;
  }, [units]);

  // Optimize particle system
  const _updateParticles = useCallback(() => {
    if (quality === 'low') {
      return;
    }

    const newPositions: Record<string, Array<{ x: number; y: number }>> = {};
    activeHazardsRef.current.forEach(hazard => {
      const baseParticleCount = quality === 'high' ? 20 : 10;
      const tierMultiplier = 1 + (tier - 1) * 0.5;
      const particleCount = Math.floor(baseParticleCount * tierMultiplier);

      // Use object pooling for particles
      const particles = particlePositionsRef.current[hazard.id] || [];
      while (particles.length < particleCount) {
        particles.push({ x: 0, y: 0 });
      }

      // Update particle positions
      for (let i = 0; i < particleCount; i++) {
        particles[i].x = hazard.position.x + (Math.random() - 0.5) * hazard.radius;
        particles[i].y = hazard.position.y + (Math.random() - 0.5) * hazard.radius;
      }

      newPositions[hazard.id] = particles.slice(0, particleCount);
    });

    particlePositionsRef.current = newPositions;
    requestUpdate();
  }, [quality, tier, requestUpdate]);

  // Enhanced collision effect handling
  const _handleCollisionEffect = useCallback(
    (hazardId: string, shipId: string, effect: Hazard['effect']) => {
      // Apply tech bonuses to effect
      const modifiedEffect = {
        ...effect,
        value:
          effect.value * enhancedValues.effectMultiplier * (1 - enhancedValues.hazardResistance),
      };

      // Trigger impact animation
      setImpactAnimations(prev => ({ ...prev, [hazardId]: true }));
      setTimeout(() => {
        setImpactAnimations(prev => ({ ...prev, [hazardId]: false }));
      }, 1000);

      onHazardEffect(hazardId, shipId, modifiedEffect);
    },
    [enhancedValues, onHazardEffect]
  );

  // Handle weapon firing with visual effects
  const handleWeaponFire = useCallback(
    (weaponId: string, targetId: string, type: string) => {
      onWeaponFire(weaponId, targetId);
      weaponEffectsRef.current[weaponId] = { active: true, type };
      setTimeout(() => {
        weaponEffectsRef.current[weaponId] = { active: false, type };
      }, 1000);
    },
    [onWeaponFire]
  );

  // Optimize combat loop with worker
  useEffect(() => {
    const worker = new Worker(new URL('../../workers/combatWorker.ts', import.meta.url));

    worker.onmessage = e => {
      const { type, data } = e.data;
      switch (type) {
        case 'WEAPON_FIRE':
          handleWeaponFire(data.weaponId, data.targetId, data.weaponType);
          break;
        case 'UNIT_MOVE':
          onUnitMove(data.unitId, data.position);
          break;
      }
    };

    const interval = setInterval(() => {
      worker.postMessage({
        type: 'UPDATE',
        units: units,
        hazards: activeHazardsRef.current,
        spatialGrid,
      });
    }, 100);

    return () => {
      clearInterval(interval);
      worker.terminate();
    };
  }, [units, onUnitMove, handleWeaponFire, spatialGrid]);

  // Optimize render with virtualization
  const virtualizedUnits = useMemo(() => {
    return units.filter(unit => {
      return (
        unit.position.x >= 0 &&
        unit.position.x <= window.innerWidth &&
        unit.position.y >= 0 &&
        unit.position.y <= window.innerHeight
      );
    });
  }, [units]);

  // Handle hazard detection and threat response
  const _handleThreatDetection = useCallback(
    (hazard: Hazard) => {
      if (onThreatDetected) {
        onThreatDetected(hazard);
      }

      // Emit global event for fleet response
      emitEvent('THREAT_DETECTED', {
        hazardId: hazard.id,
        position: hazard.position,
        severity: hazard.severity,
        type: hazard.type,
      });
    },
    [onThreatDetected, emitEvent]
  );

  // Combat automation effect
  useEffect(() => {
    const subscription = moduleEventBus.subscribe('AUTOMATION_STARTED', (event: ModuleEvent) => {
      if (
        event.type === 'AUTOMATION_STARTED' &&
        event.moduleType === 'hangar' &&
        event.data?.type
      ) {
        setAutomationEffects(prev => [
          ...prev,
          {
            id: `${event.moduleId}-${Date.now()}`,
            type: event.data.type,
            position: event.data.position || { x: 50, y: 50 },
            timestamp: Date.now(),
          },
        ]);

        // Cleanup old effects
        setTimeout(() => {
          setAutomationEffects(prev => prev.filter(effect => Date.now() - effect.timestamp < 2000));
        }, 2000);
      }
    });

    return () => {
      subscription();
    };
  }, []);

  // Get enhanced hazard visuals based on tier and type
  const getHazardVisuals = useCallback(
    (hazard: Hazard) => {
      const baseColor = getHazardColor(hazard.type);
      const vprAnimations = getVPRAnimationSet(hazard.type, tier);

      return {
        color: baseColor,
        glowIntensity: tier * (hazard.severity === 'high' ? 1.5 : 1),
        animations: vprAnimations,
        particlePattern: hazard.vpr?.particleSystem.pattern || 'circular',
      };
    },
    [tier, getVPRAnimationSet]
  );

  const getHazardColor = (type: Hazard['type']) => {
    switch (type) {
      case 'asteroids':
        return 'amber';
      case 'debris':
        return 'gray';
      case 'radiation':
        return 'green';
      case 'anomaly':
        return 'purple';
      default:
        return 'blue';
    }
  };

  // Add unit movement handling
  useEffect(() => {
    const moveInterval = setInterval(() => {
      units.forEach(unit => {
        if (unit.status === 'engaging') {
          const nearestHazard = activeHazardsRef.current.reduce(
            (nearest, current) => {
              const currentDist = Math.sqrt(
                Math.pow(current.position.x - unit.position.x, 2) +
                  Math.pow(current.position.y - unit.position.y, 2)
              );
              const nearestDist = nearest
                ? Math.sqrt(
                    Math.pow(nearest.position.x - unit.position.x, 2) +
                      Math.pow(nearest.position.y - unit.position.y, 2)
                  )
                : Infinity;
              return currentDist < nearestDist ? current : nearest;
            },
            null as Hazard | null
          );

          if (nearestHazard) {
            const newPosition = {
              x: unit.position.x + (nearestHazard.position.x - unit.position.x) * 0.1,
              y: unit.position.y + (nearestHazard.position.y - unit.position.y) * 0.1,
            };
            onUnitMove(unit.id, newPosition);
          }
        }
      });
    }, 100);

    return () => clearInterval(moveInterval);
  }, [units, onUnitMove]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Combat HUD - Only render visible units */}
      <div className="absolute left-4 top-4 space-y-2">
        {virtualizedUnits.map(unit => (
          <div
            key={unit.id}
            className={`rounded-lg border bg-gray-900/80 px-3 py-2 backdrop-blur-sm ${
              unit.status === 'engaging'
                ? 'border-red-500'
                : unit.status === 'damaged'
                  ? 'border-yellow-500'
                  : 'border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">{unit.type}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  unit.status === 'engaging'
                    ? 'bg-red-900/50 text-red-400'
                    : unit.status === 'damaged'
                      ? 'bg-yellow-900/50 text-yellow-400'
                      : 'bg-gray-800 text-gray-400'
                }`}
              >
                {unit.status}
              </span>
            </div>
            {/* Health and Shield Bars */}
            <div className="mt-1 space-y-1">
              <div className="h-1 overflow-hidden rounded-full bg-gray-700">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${(unit.health / unit.maxHealth) * 100}%` }}
                />
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-gray-700">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${(unit.shield / unit.maxShield) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hazards */}
      {hazards.map(hazard => {
        const visuals = getHazardVisuals(hazard);

        return (
          <div
            key={hazard.id}
            className="absolute"
            style={{
              left: `${hazard.position.x}%`,
              top: `${hazard.position.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Enhanced Hazard Visualization */}
            <div
              className={`animate-pulse rounded-full bg-${visuals.color}-500/20 relative overflow-hidden ${impactAnimations[hazard.id] ? visuals.animations.impact : visuals.animations.idle} `}
              style={{
                width: `${hazard.radius * 2}px`,
                height: `${hazard.radius * 2}px`,
                boxShadow: `0 0 ${hazard.severity === 'high' ? '20px' : '10px'} ${visuals.color}-500/${30 * visuals.glowIntensity}`,
              }}
            >
              {/* Enhanced Particle Effects */}
              {quality !== 'low' &&
                particlePositionsRef.current[hazard.id]?.map((particle, index) => (
                  <div
                    key={index}
                    className={`absolute h-1 w-1 rounded-full bg-${visuals.color}-400/50 ${visuals.animations.active} `}
                    style={{
                      left: `${particle.x}%`,
                      top: `${particle.y}%`,
                      animation: `float ${1 + Math.random()}s infinite`,
                    }}
                  />
                ))}

              {/* Hazard Icon with Tier-based Effects */}
              <div
                className={`absolute inset-0 flex items-center justify-center ${visuals.animations.idle}`}
              >
                {hazard.type === 'asteroids' && (
                  <AlertTriangle className={`h-8 w-8 text-${visuals.color}-400`} />
                )}
                {hazard.type === 'radiation' && (
                  <Zap className={`h-8 w-8 text-${visuals.color}-400`} />
                )}
                {hazard.type === 'anomaly' && (
                  <Shield className={`h-8 w-8 text-${visuals.color}-400`} />
                )}
              </div>
            </div>

            {/* Enhanced Effect Indicator */}
            <div
              className={`absolute left-1/2 top-full mt-2 -translate-x-1/2 rounded-full px-2 py-1 bg-${visuals.color}-900/80 border border-${visuals.color}-500/50 text-${visuals.color}-200 whitespace-nowrap text-xs ${hazard.severity === 'high' ? 'animate-pulse' : ''} ${visuals.animations.active}`}
            >
              {hazard.effect.type.charAt(0).toUpperCase() + hazard.effect.type.slice(1)}:{' '}
              {Math.round(
                hazard.effect.value *
                  enhancedValues.effectMultiplier *
                  (1 - enhancedValues.hazardResistance)
              )}
              {hazard.severity === 'high' && ' ⚠️'}
              {tier > 1 && ` (Tier ${tier})`}
            </div>
          </div>
        );
      })}

      {/* Weapon Effects */}
      {Object.entries(weaponEffectsRef.current).map(([weaponId, effect]) => {
        if (!effect.active) return null;

        const weapon = units.flatMap(u => u.weapons).find(w => w.id === weaponId);
        if (!weapon) return null;

        return (
          <div
            key={weaponId}
            className={`absolute transition-opacity ${
              effect.type === 'machineGun'
                ? 'bg-yellow-500/50'
                : effect.type === 'gaussCannon'
                  ? 'bg-cyan-500/50'
                  : effect.type === 'railGun'
                    ? 'bg-violet-500/50'
                    : effect.type === 'mgss'
                      ? 'bg-red-500/50'
                      : 'bg-orange-500/50'
            }`}
            style={{
              width: '4px',
              height: weapon.range,
              transformOrigin: 'center',
              opacity: effect.active ? 1 : 0,
            }}
          />
        );
      })}

      {/* Formation Lines */}
      {fleetAI.visualFeedback && (
        <svg className="pointer-events-none absolute inset-0">
          <path
            d={`M ${fleetAI.visualFeedback.formationLines.points.map((p: { x: number; y: number }) => `${p.x},${p.y}`).join(' L ')}`}
            stroke={fleetAI.visualFeedback.formationLines.color}
            strokeWidth="2"
            fill="none"
            strokeDasharray={
              fleetAI.visualFeedback.formationLines.style === 'dashed' ? '4 4' : 'none'
            }
            opacity={fleetAI.visualFeedback.formationLines.opacity}
          />
        </svg>
      )}

      {/* Range Circles */}
      {fleetAI.visualFeedback?.rangeCircles.map((circle: RangeCircle, index: number) => (
        <div
          key={index}
          className="absolute rounded-full border-2 transition-all"
          style={{
            left: circle.center.x,
            top: circle.center.y,
            width: circle.radius * 2,
            height: circle.radius * 2,
            transform: 'translate(-50%, -50%)',
            borderColor:
              circle.type === 'engagement' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)',
            opacity: circle.opacity,
          }}
        />
      ))}

      {/* Combat Automation Effects */}
      {automationEffects.map(effect => (
        <CombatAutomationEffect
          key={effect.id}
          type={effect.type}
          position={effect.position}
          quality={quality}
          intensity={techBonuses.effectPotency}
        />
      ))}
    </div>
  );
}

// Enhanced animation keyframes with tier-based variations
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(3px, -3px); }
  }
  
  @keyframes impact {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.8; }
    100% { transform: scale(1); opacity: 1; }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
`;
document.head.appendChild(style);
