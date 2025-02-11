import { AlertTriangle, Zap, Shield } from 'lucide-react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useVPR } from '../../hooks/useVPR';
import { useGlobalEvents } from '../../hooks/useGlobalEvents';
import { useFleetAI } from '../../hooks/useFleetAI';

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
  type: 'spitflare' | 'starSchooner' | 'orionFrigate' | 'harbringerGalleon' | 'midwayCarrier' | 'motherEarthRevenge';
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
  factionId: string;
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

interface FleetAIResult {
  formationPatterns: {
    defensive: { spacing: number; facing: number; pattern: 'defensive'; adaptiveSpacing: boolean };
    offensive: { spacing: number; facing: number; pattern: 'offensive'; adaptiveSpacing: boolean };
    balanced: { spacing: number; facing: number; pattern: 'balanced'; adaptiveSpacing: boolean };
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
  onThreatDetected 
}: BattleEnvironmentProps) {
  const [activeHazards, setActiveHazards] = useState(hazards);
  const [particlePositions, setParticlePositions] = useState<Record<string, Array<{ x: number; y: number }>>>({});
  const [impactAnimations, setImpactAnimations] = useState<Record<string, boolean>>({});
  const [weaponEffects, setWeaponEffects] = useState<Record<string, { active: boolean; type: string }>>({});
  
  const { emitEvent } = useGlobalEvents();
  const { getVPRAnimationSet } = useVPR();
  const fleetAI = useFleetAI(fleetId, factionId) as FleetAIResult;

  // Memoize tech-enhanced values
  const enhancedValues = useMemo(() => ({
    detectionRadius: 1000 * techBonuses.detectionRange,
    hazardResistance: Math.min(0.9, techBonuses.hazardResistance),
    effectMultiplier: Math.max(0.1, techBonuses.effectPotency)
  }), [techBonuses]);

  // Handle hazard detection and threat response
  const handleThreatDetection = useCallback((hazard: Hazard) => {
    if (onThreatDetected) {
      onThreatDetected(hazard);
    }
    
    // Emit global event for fleet response
    emitEvent('THREAT_DETECTED', {
      hazardId: hazard.id,
      position: hazard.position,
      severity: hazard.severity,
      type: hazard.type
    });
  }, [onThreatDetected, emitEvent]);

  // Enhanced collision effect handling
  const handleCollisionEffect = useCallback((hazardId: string, shipId: string, effect: Hazard['effect']) => {
    // Apply tech bonuses to effect
    const modifiedEffect = {
      ...effect,
      value: effect.value * enhancedValues.effectMultiplier * (1 - enhancedValues.hazardResistance)
    };

    // Trigger impact animation
    setImpactAnimations(prev => ({ ...prev, [hazardId]: true }));
    setTimeout(() => {
      setImpactAnimations(prev => ({ ...prev, [hazardId]: false }));
    }, 1000);

    onHazardEffect(hazardId, shipId, modifiedEffect);
  }, [enhancedValues, onHazardEffect]);

  // Handle weapon firing with visual effects
  const handleWeaponFire = useCallback((weaponId: string, targetId: string, type: string) => {
    onWeaponFire(weaponId, targetId);
    setWeaponEffects(prev => ({
      ...prev,
      [weaponId]: { active: true, type }
    }));
    setTimeout(() => {
      setWeaponEffects(prev => ({
        ...prev,
        [weaponId]: { active: false, type }
      }));
    }, 1000);
  }, [onWeaponFire]);

  // Combat automation effect
  useEffect(() => {
    const combatLoop = setInterval(() => {
      units.forEach(unit => {
        if (unit.status === 'engaging') {
          // Find nearest target
          const nearestHazard = activeHazards.reduce((nearest, current) => {
            const currentDist = Math.sqrt(
              Math.pow(current.position.x - unit.position.x, 2) +
              Math.pow(current.position.y - unit.position.y, 2)
            );
            const nearestDist = nearest ? Math.sqrt(
              Math.pow(nearest.position.x - unit.position.x, 2) +
              Math.pow(nearest.position.y - unit.position.y, 2)
            ) : Infinity;
            return currentDist < nearestDist ? current : nearest;
          }, null as Hazard | null);

          if (nearestHazard) {
            // Find ready weapon in range
            const readyWeapon = unit.weapons.find(weapon => {
              const distance = Math.sqrt(
                Math.pow(nearestHazard.position.x - unit.position.x, 2) +
                Math.pow(nearestHazard.position.y - unit.position.y, 2)
              );
              return weapon.status === 'ready' && distance <= weapon.range;
            });

            if (readyWeapon) {
              handleWeaponFire(readyWeapon.id, nearestHazard.id, readyWeapon.type);
            }
          }
        }
      });
    }, 100);

    return () => clearInterval(combatLoop);
  }, [units, activeHazards, handleWeaponFire]);

  // Handle hazard movement and particle effects with tier-based enhancements
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHazards(prev => prev.map(hazard => {
        if (hazard.movement) {
          const newX = hazard.position.x + Math.cos(hazard.movement.direction) * hazard.movement.speed;
          const newY = hazard.position.y + Math.sin(hazard.movement.direction) * hazard.movement.speed;
          
          // Check if hazard moved into detection range
          const distanceFromCenter = Math.sqrt(newX * newX + newY * newY);
          if (distanceFromCenter <= enhancedValues.detectionRadius) {
            handleThreatDetection(hazard);
          }

          return {
            ...hazard,
            position: { x: newX, y: newY }
          };
        }
        return hazard;
      }));

      // Update particle positions with tier-based enhancements
      if (quality !== 'low') {
        setParticlePositions(() => {
          const newPositions: Record<string, Array<{ x: number; y: number }>> = {};
          activeHazards.forEach(hazard => {
            const baseParticleCount = quality === 'high' ? 20 : 10;
            const tierMultiplier = 1 + (tier - 1) * 0.5; // More particles for higher tiers
            const particleCount = Math.floor(baseParticleCount * tierMultiplier);
            
            newPositions[hazard.id] = Array.from({ length: particleCount }, () => ({
              x: hazard.position.x + (Math.random() - 0.5) * hazard.radius,
              y: hazard.position.y + (Math.random() - 0.5) * hazard.radius
            }));
          });
          return newPositions;
        });
      }
    }, 50);

    // Enhanced collision detection with tech bonuses
    const collisionCheck = setInterval(() => {
      const ships = document.querySelectorAll('[data-ship-id]');
      activeHazards.forEach(hazard => {
        ships.forEach(ship => {
          const shipId = ship.getAttribute('data-ship-id');
          if (shipId) {
            const shipRect = ship.getBoundingClientRect();
            const shipCenter = {
              x: shipRect.left + shipRect.width / 2,
              y: shipRect.top + shipRect.height / 2
            };
            
            const distance = Math.sqrt(
              Math.pow(shipCenter.x - hazard.position.x, 2) +
              Math.pow(shipCenter.y - hazard.position.y, 2)
            );
            
            // Apply tech bonus to detection range
            if (distance <= hazard.radius * techBonuses.detectionRange) {
              handleCollisionEffect(hazard.id, shipId, hazard.effect);
            }
          }
        });
      });
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(collisionCheck);
    };
  }, [quality, activeHazards, handleCollisionEffect, handleThreatDetection, enhancedValues, tier, techBonuses.detectionRange]);

  // Get enhanced hazard visuals based on tier and type
  const getHazardVisuals = useCallback((hazard: Hazard) => {
    const baseColor = getHazardColor(hazard.type);
    const vprAnimations = getVPRAnimationSet(hazard.type, tier);
    
    return {
      color: baseColor,
      glowIntensity: tier * (hazard.severity === 'high' ? 1.5 : 1),
      animations: vprAnimations,
      particlePattern: hazard.vpr?.particleSystem.pattern || 'circular'
    };
  }, [tier, getVPRAnimationSet]);

  const getHazardColor = (type: Hazard['type']) => {
    switch (type) {
      case 'asteroids': return 'amber';
      case 'debris': return 'gray';
      case 'radiation': return 'green';
      case 'anomaly': return 'purple';
      default: return 'blue';
    }
  };

  // Add unit movement handling
  useEffect(() => {
    const moveInterval = setInterval(() => {
      units.forEach(unit => {
        if (unit.status === 'engaging') {
          const nearestHazard = activeHazards.reduce((nearest, current) => {
            const currentDist = Math.sqrt(
              Math.pow(current.position.x - unit.position.x, 2) +
              Math.pow(current.position.y - unit.position.y, 2)
            );
            const nearestDist = nearest ? Math.sqrt(
              Math.pow(nearest.position.x - unit.position.x, 2) +
              Math.pow(nearest.position.y - unit.position.y, 2)
            ) : Infinity;
            return currentDist < nearestDist ? current : nearest;
          }, null as Hazard | null);

          if (nearestHazard) {
            const newPosition = {
              x: unit.position.x + (nearestHazard.position.x - unit.position.x) * 0.1,
              y: unit.position.y + (nearestHazard.position.y - unit.position.y) * 0.1
            };
            onUnitMove(unit.id, newPosition);
          }
        }
      });
    }, 100);

    return () => clearInterval(moveInterval);
  }, [units, activeHazards, onUnitMove]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Combat HUD */}
      <div className="absolute top-4 left-4 space-y-2">
        {units.map(unit => (
          <div 
            key={unit.id}
            className={`px-3 py-2 rounded-lg bg-gray-900/80 backdrop-blur-sm border ${
              unit.status === 'engaging' ? 'border-red-500' :
              unit.status === 'damaged' ? 'border-yellow-500' :
              'border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">{unit.type}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                unit.status === 'engaging' ? 'bg-red-900/50 text-red-400' :
                unit.status === 'damaged' ? 'bg-yellow-900/50 text-yellow-400' :
                'bg-gray-800 text-gray-400'
              }`}>
                {unit.status}
              </span>
            </div>
            {/* Health and Shield Bars */}
            <div className="space-y-1 mt-1">
              <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${(unit.health / unit.maxHealth) * 100}%` }}
                />
              </div>
              <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
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
      {activeHazards.map(hazard => {
        const visuals = getHazardVisuals(hazard);
        
        return (
          <div
            key={hazard.id}
            className="absolute"
            style={{
              left: `${hazard.position.x}%`,
              top: `${hazard.position.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* Enhanced Hazard Visualization */}
            <div
              className={`rounded-full animate-pulse bg-${visuals.color}-500/20 relative overflow-hidden
                ${impactAnimations[hazard.id] ? visuals.animations.impact : visuals.animations.idle}
              `}
              style={{
                width: `${hazard.radius * 2}px`,
                height: `${hazard.radius * 2}px`,
                boxShadow: `0 0 ${hazard.severity === 'high' ? '20px' : '10px'} ${visuals.color}-500/${30 * visuals.glowIntensity}`
              }}
            >
              {/* Enhanced Particle Effects */}
              {quality !== 'low' && particlePositions[hazard.id]?.map((particle, index) => (
                <div
                  key={index}
                  className={`absolute w-1 h-1 rounded-full bg-${visuals.color}-400/50
                    ${visuals.animations.active}
                  `}
                  style={{
                    left: `${particle.x}%`,
                    top: `${particle.y}%`,
                    animation: `float ${1 + Math.random()}s infinite`
                  }}
                />
              ))}

              {/* Hazard Icon with Tier-based Effects */}
              <div className={`absolute inset-0 flex items-center justify-center ${visuals.animations.idle}`}>
                {hazard.type === 'asteroids' && <AlertTriangle className={`w-8 h-8 text-${visuals.color}-400`} />}
                {hazard.type === 'radiation' && <Zap className={`w-8 h-8 text-${visuals.color}-400`} />}
                {hazard.type === 'anomaly' && <Shield className={`w-8 h-8 text-${visuals.color}-400`} />}
              </div>
            </div>

            {/* Enhanced Effect Indicator */}
            <div 
              className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded-full 
                bg-${visuals.color}-900/80 
                border border-${visuals.color}-500/50 
                text-${visuals.color}-200 
                text-xs whitespace-nowrap
                ${hazard.severity === 'high' ? 'animate-pulse' : ''}
                ${visuals.animations.active}`}
            >
              {hazard.effect.type.charAt(0).toUpperCase() + hazard.effect.type.slice(1)}: {
                Math.round(hazard.effect.value * enhancedValues.effectMultiplier * (1 - enhancedValues.hazardResistance))
              }
              {hazard.severity === 'high' && ' ⚠️'}
              {tier > 1 && ` (Tier ${tier})`}
            </div>
          </div>
        );
      })}

      {/* Weapon Effects */}
      {Object.entries(weaponEffects).map(([weaponId, effect]) => {
        if (!effect.active) return null;
        
        const weapon = units.flatMap(u => u.weapons).find(w => w.id === weaponId);
        if (!weapon) return null;

        return (
          <div
            key={weaponId}
            className={`absolute transition-opacity ${
              effect.type === 'machineGun' ? 'bg-yellow-500/50' :
              effect.type === 'gaussCannon' ? 'bg-cyan-500/50' :
              effect.type === 'railGun' ? 'bg-violet-500/50' :
              effect.type === 'mgss' ? 'bg-red-500/50' :
              'bg-orange-500/50'
            }`}
            style={{
              width: '4px',
              height: weapon.range,
              transformOrigin: 'center',
              opacity: effect.active ? 1 : 0
            }}
          />
        );
      })}

      {/* Formation Lines */}
      {fleetAI.visualFeedback && (
        <svg className="absolute inset-0 pointer-events-none">
          <path
            d={`M ${fleetAI.visualFeedback.formationLines.points.map((p: { x: number; y: number }) => `${p.x},${p.y}`).join(' L ')}`}
            stroke={fleetAI.visualFeedback.formationLines.color}
            strokeWidth="2"
            fill="none"
            strokeDasharray={fleetAI.visualFeedback.formationLines.style === 'dashed' ? '4 4' : 'none'}
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
            borderColor: circle.type === 'engagement' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)',
            opacity: circle.opacity
          }}
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