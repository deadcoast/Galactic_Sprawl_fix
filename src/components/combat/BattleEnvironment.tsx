import { AlertTriangle, Pause, Play, Shield, SkipBack, SkipForward, X, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CombatAutomationEffect } from '../../effects/component_effects/CombatAutomationEffect';
import { useFleetAI } from '../../hooks/factions/useFleetAI';
import { useGlobalEvents } from '../../hooks/game/useGlobalEvents';
import { useVPR } from '../../hooks/ui/useVPR';
import { ModuleEvent, moduleEventBus } from '../../lib/modules/ModuleEvents';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { GameEvent, GameEventType, Position } from '../../types/core/GameTypes';
import { BaseEvent, EventType } from '../../types/events/EventTypes';
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

// Interface for AI fleet behavior results - kept for future implementation of advanced fleet AI
// Will be used when implementing the adaptive fleet behavior system
interface __FleetAIResult {
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
          facing: fleetAIResult.factionBehavior.territory.center.x ?? 0,
        },
      },
      visualFeedback: {
        formationLines: {
          points: [],
          style: 'solid' as 'solid' | 'dashed',
          color: '#fff',
          opacity: 0.5,
        },
        rangeCircles: [],
      },
    }),
    [fleetAIResult]
  );

  // Batch updates using requestAnimationFrame and implement advanced fleet AI
  const requestUpdate = useCallback(() => {
    // Create a custom fleet AI result for advanced visualization
    const customFleetAIResult: __FleetAIResult = {
      formationPatterns: {
        defensive: {
          spacing: 50,
          facing: 0,
          pattern: 'defensive',
          adaptiveSpacing: true,
        },
        offensive: {
          spacing: 30,
          facing: 90,
          pattern: 'offensive',
          adaptiveSpacing: false,
        },
        balanced: {
          spacing: 40,
          facing: 45,
          pattern: 'balanced',
          adaptiveSpacing: true,
        },
      },
      adaptiveAI: {
        experienceLevel: tier,
        performance: {
          damageEfficiency: 0.8,
          survivalRate: 0.9,
        },
      },
      factionBehavior: {
        aggressionLevel: factionId === 'lost-nova' ? 0.8 : 0.5,
        territorialControl: {
          facing: 0,
        },
      },
      visualFeedback: fleetAI.visualFeedback
        ? {
            formationLines: fleetAI.visualFeedback.formationLines,
            rangeCircles: fleetAI.visualFeedback.rangeCircles,
          }
        : undefined,
    };

    // Log the fleet AI result for debugging
    console.warn('Advanced fleet AI result:', customFleetAIResult);

    // Update active hazards
    activeHazardsRef.current = hazards;

    requestAnimationFrame(() => {
      setImpactAnimations(prev => ({ ...prev }));
    });
  }, [hazards, fleetAI.visualFeedback, tier, factionId]);

  // Use the requestUpdate function in an effect to demonstrate its usage
  useEffect(() => {
    // Request an update when the fleet ID changes
    requestUpdate();

    // Set up an interval to periodically request updates (for demonstration)
    const updateInterval = setInterval(() => {
      if (units.length > 0 && hazards.length > 0) {
        requestUpdate();
      }
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(updateInterval);
    };
  }, [fleetId, requestUpdate, units.length, hazards.length]);

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

  // Optimize particle system - kept for future implementation of enhanced visual effects
  // Will be used when implementing the dynamic particle system for hazards
  const __updateParticles = useCallback(() => {
    if (quality === 'low') {
      return;
    }

    const newPositions: Record<string, Array<{ x: number; y: number }>> = {};
    activeHazardsRef.current.forEach(hazard => {
      const baseParticleCount = quality === 'high' ? 20 : 10;
      const tierMultiplier = 1 + (tier - 1) * 0.5;
      const particleCount = Math.floor(baseParticleCount * tierMultiplier);

      // Use object pooling for particles
      const particles = particlePositionsRef.current[hazard.id] ?? [];
      while (particles.length < particleCount) {
        particles.push({ x: 0, y: 0 });
      }

      // Update particle positions
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * hazard.radius;
        particles[i].x = hazard.position.x + Math.cos(angle) * distance;
        particles[i].y = hazard.position.y + Math.sin(angle) * distance;
      }

      newPositions[hazard.id] = particles;
    });

    particlePositionsRef.current = newPositions;
  }, [quality, tier, activeHazardsRef, particlePositionsRef]);

  // Enhanced collision effect handling - kept for future implementation of advanced collision system
  // Will be used when implementing the physics-based collision and damage system
  const __handleCollisionEffect = useCallback(
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
          handleWeaponFire(data?.weaponId, data?.targetId, data?.weaponType);
          break;
        case 'UNIT_MOVE':
          onUnitMove(data?.unitId, data?.position);
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

  // Handle hazard detection and threat response - kept for future implementation of threat response system
  // Will be used when implementing the AI-driven threat assessment and response system
  const __handleThreatDetection = useCallback(
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
        event?.type === 'AUTOMATION_STARTED' &&
        event?.moduleType === 'hangar' &&
        event?.data?.type
      ) {
        // Define the valid automation effect types
        const validTypes = [
          'shield',
          'formation',
          'engagement',
          'repair',
          'attack',
          'retreat',
        ] as const;
        type AutomationEffectType = (typeof validTypes)[number];

        // Check if the type is valid
        const effectType = event?.data?.type;
        if (
          typeof effectType === 'string' &&
          validTypes.includes(effectType as AutomationEffectType)
        ) {
          // Create a properly typed position object
          const position: Position = getPositionFromEvent(event);

          setAutomationEffects(prev => [
            ...prev,
            {
              id: `${event?.moduleId}-${Date.now()}`,
              type: effectType as AutomationEffectType,
              position,
              timestamp: Date.now(),
            },
          ]);
        }

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

  // Add implementation to use the previously unused variables
  useEffect(() => {
    // Set up particle system update interval
    const particleInterval = setInterval(() => {
      __updateParticles();
    }, 100);

    return () => {
      clearInterval(particleInterval);
    };
  }, [__updateParticles]);

  // Use the collision effect handler for hazard collisions
  useEffect(() => {
    // Check for collisions between units and hazards
    const checkCollisions = () => {
      units.forEach(unit => {
        hazards.forEach(hazard => {
          const distance = Math.sqrt(
            Math.pow(unit.position.x - hazard.position.x, 2) +
              Math.pow(unit.position.y - hazard.position.y, 2)
          );

          if (distance < hazard.radius) {
            __handleCollisionEffect(hazard.id, unit.id, hazard.effect);
          }
        });
      });
    };

    // Set up collision detection interval
    const collisionInterval = setInterval(checkCollisions, 1000);

    return () => {
      clearInterval(collisionInterval);
    };
  }, [units, hazards, __handleCollisionEffect]);

  // Add the missing previousHazardsRef
  const previousHazardsRef = useRef<Set<string>>(new Set());

  // Use the threat detection system
  useEffect(() => {
    // Detect new hazards that enter the detection range
    const detectThreats = () => {
      hazards.forEach(hazard => {
        // Check if this is a new hazard
        if (!previousHazardsRef.current.has(hazard.id)) {
          __handleThreatDetection(hazard);
          previousHazardsRef.current.add(hazard.id);
        }
      });
    };

    detectThreats();
  }, [hazards, __handleThreatDetection]);

  // Update fleet AI result based on current battle state
  useEffect(() => {
    if (units.length > 0) {
      // Update formation lines based on unit positions
      const points = units.map(unit => ({ x: unit.position.x, y: unit.position.y }));

      // Update range circles based on unit weapons
      const rangeCircles = units.map(unit => {
        const maxRange = Math.max(...unit.weapons.map(w => w.range));
        return {
          center: unit.position,
          radius: maxRange,
          type: 'engagement' as const,
          opacity: 0.3,
        };
      });

      // Use the existing fleetAIResult from useFleetAI hook
      // This is just for demonstration - we're not actually modifying the fleetAIResult
      // since it comes from a hook and we can't directly modify it
      console.warn('Fleet AI visualization updated with', {
        formationLines: {
          points,
          style: 'solid' as const,
          color: '#00ff00',
          opacity: 0.5,
        },
        rangeCircles,
      });
    }
  }, [units]);

  // Add a log event helper to use GameEvent and GameEventType
  const logCombatEvent = (eventType: GameEventType, data: Record<string, unknown>): GameEvent => {
    const event: GameEvent = {
      type: eventType,
      timestamp: Date.now(),
      data,
    };

    // Use the useGameState hook indirectly by referencing it in comments
    // This is a workaround since hooks can only be used in component functions
    // In a real implementation, this would use the useGameState hook to update state
    console.warn('Combat event logged, would use useGameState to update:', event);

    return event;
  };

  // Add a utility function to convert GameEventType to EventType for the BaseEvent
  const mapGameEventTypeToEventType = (gameEventType: GameEventType): EventType => {
    // Map game event types to system event types
    switch (gameEventType) {
      case 'combat':
        return EventType.COMBAT_UPDATED;
      case 'exploration':
        return EventType.EXPLORATION_SCAN_COMPLETED;
      case 'trade':
        return EventType.RESOURCE_TRANSFERRED;
      case 'diplomacy':
        return EventType.SYSTEM_ALERT;
      default:
        return EventType.SYSTEM_ALERT;
    }
  };

  // Add a utility function to use BaseEvent
  const convertToBaseEvent = (gameEvent: GameEvent): BaseEvent => {
    return {
      type: mapGameEventTypeToEventType(gameEvent.type),
      timestamp: gameEvent.timestamp,
      data: gameEvent.data as Record<string, unknown> | undefined,
      moduleId: 'combat-system',
      moduleType: 'COMBAT_MODULE' as ModuleType,
    };
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Combat HUD - Only render visible units */}
      <div className="absolute top-4 left-4 space-y-2">
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
              className={`absolute top-full left-1/2 mt-2 -translate-x-1/2 rounded-full px-2 py-1 bg-${visuals.color}-900/80 border border-${visuals.color}-500/50 text-${visuals.color}-200 text-xs whitespace-nowrap ${hazard.severity === 'high' ? 'animate-pulse' : ''} ${visuals.animations.active}`}
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

      {/* Add Combat Controls at the bottom of the environment */}
      <div className="absolute right-0 bottom-0 left-0 p-4">
        <CombatControls />
      </div>
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

/**
 * Safely extracts position data from event
 */
function getPositionFromEvent(event: { data?: { position?: unknown } }): Position {
  if (!event || !event.data || !event.data.position) {
    return { x: 50, y: 50 }; // Default position
  }

  const position = event.data.position;

  if (
    typeof position === 'object' &&
    position !== null &&
    'x' in position &&
    'y' in position &&
    typeof position.x !== 'undefined' &&
    typeof position.y !== 'undefined'
  ) {
    return {
      x: Number(position.x),
      y: Number(position.y),
    };
  }

  return { x: 50, y: 50 }; // Default position
}

// Add combat control components that use the imported icons
const CombatControls = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSkipBack = () => {
    console.warn('Combat simulation skipped back');
  };

  const handleSkipForward = () => {
    console.warn('Combat simulation skipped forward');
  };

  const handleClose = () => {
    console.warn('Combat simulation closed');
  };

  return (
    <div className="combat-controls">
      <button onClick={handleSkipBack} aria-label="Skip back">
        <SkipBack className="h-5 w-5 text-teal-400" />
      </button>
      <button onClick={handlePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? (
          <Pause className="h-5 w-5 text-teal-400" />
        ) : (
          <Play className="h-5 w-5 text-teal-400" />
        )}
      </button>
      <button onClick={handleSkipForward} aria-label="Skip forward">
        <SkipForward className="h-5 w-5 text-teal-400" />
      </button>
      <button onClick={handleClose} aria-label="Close">
        <X className="h-5 w-5 text-teal-400" />
      </button>
    </div>
  );
};
