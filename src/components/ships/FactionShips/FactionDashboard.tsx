import { AIDebugOverlay } from '../../../components/debug/AIDebugOverlay';
import { DiplomacyPanel } from '../../ui/DiplomacyPanel';
import { FactionAI } from '../../../components/factions/FactionAI';
import { factionConfigs, factionIds } from '../../../config/factions/factionConfig';
import { getShipStats } from '../../../config/ships/shipStats';
import { getFactionDefaultShipClass } from '../../../utils/ships/shipClassUtils';
import { useFactionBehavior } from '../../../hooks/factions/useFactionBehavior';
import { FactionShip } from '../../../types/ships/FactionShipTypes';
import { useDebugOverlay } from '../../../hooks/ui/useDebugOverlay';
import type { DebugState } from '../../../types/debug/DebugTypes';
import type { CommonShipAbility } from '../../../types/ships/CommonShipTypes';
import type { FactionState } from '../../../managers/factions/factionManager';
import { AlertTriangle, Crown, Shield } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface FactionDashboardProps {
  onFactionUpdate?: (factionId: string, state: FactionState) => void;
}

type FactionIdType = (typeof factionIds)[number];

export function FactionDashboard({ onFactionUpdate }: FactionDashboardProps) {
  const debugOverlay = useDebugOverlay();
  const [selectedFaction, setSelectedFaction] = useState<FactionIdType | null>(null);

  // Get behavior states for all factions
  const spaceRatsBehavior = useFactionBehavior('space-rats');
  const lostNovaBehavior = useFactionBehavior('lost-nova');
  const equatorHorizonBehavior = useFactionBehavior('equator-horizon');
  const factionBehaviors = React.useMemo(
    () => [spaceRatsBehavior, lostNovaBehavior, equatorHorizonBehavior],
    [spaceRatsBehavior, lostNovaBehavior, equatorHorizonBehavior]
  );

  // Update faction states
  useEffect(() => {
    factionBehaviors.forEach(behavior => {
      if (onFactionUpdate && behavior) {
        const state: FactionState = {
          activeShips: behavior.stats.totalShips,
          territory: behavior.territory,
          fleetStrength: behavior.fleets.reduce((total, fleet) => total + fleet.strength, 0),
          relationshipWithPlayer: behavior.relationships[behavior.id as FactionIdType],
          lastActivity: Date.now(),
          isActive: true,
        };
        onFactionUpdate(behavior.id as FactionIdType, state);
      }
    });
  }, [factionBehaviors, onFactionUpdate]);

  // Convert faction behaviors to debug states
  const debugStates = React.useMemo(() => {
    const states: Record<string, DebugState> = {};
    factionBehaviors.forEach(behavior => {
      if (!behavior) {
        return;
      }
      const factionId = behavior.id as FactionIdType;
      const shipStats = getShipStats(getFactionDefaultShipClass(factionId));
      states[factionId] = {
        aiState: {
          behaviorState: behavior.stateMachine.current,
          fleetStrength: behavior.fleets.reduce((total, fleet) => total + fleet.strength, 0),
          threatLevel: behavior.territory.threatLevel,
          cooldowns: behavior.fleets.reduce((cooldowns: Record<string, number>, fleet) => {
            fleet.ships.forEach((ship: FactionShip) => {
              if (shipStats.abilities?.length > 0) {
                shipStats.abilities.forEach((ability: CommonShipAbility) => {
                  cooldowns[`${ship.id}_${ability.name}`] = ability.cooldown;
                });
              }
            });
            return cooldowns;
          }, {}),
        },
        position: behavior.territory.center,
        performance: {
          fps: 60,
          updateTime: 0,
          renderTime: 0,
          activeEffects: 0,
        },
        combatStats: {
          damageDealt: 0,
          damageReceived: 0,
          accuracy: 0,
          evasion: 0,
          killCount: 0,
          assistCount: 0,
          weaponEffects: [],
          shieldStatus: {
            active: false,
            health: 0,
          },
          thrusterIntensity: 0,
        },
        systemState: {
          memory: 0,
          activeUnits: 0,
          activeProjectiles: 0,
          activeCombatZones: 0,
        },
        warnings: [],
      };
    });
    return states;
  }, [factionBehaviors]);

  return (
    <div className="space-y-4">
      {/* Faction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {factionBehaviors.map(behavior => {
          if (!behavior) {
            return null;
          }

          const config = factionConfigs[behavior.id as FactionIdType];
          if (!config) {
            return null;
          }

          const { totalShips } = behavior.stats;
          const maxShips = config.spawnConditions.maxShipsPerFleet * 3; // Assuming 3 fleets max
          const fleetStrength = behavior.fleets.reduce((total, fleet) => total + fleet.strength, 0);
          const isAggressive = behavior.behaviorState.aggression > 0.7;
          const isExpanding = behavior.behaviorState.expansion > 0.5;

          return (
            <div
              key={behavior.id}
              className={`p-6 rounded-lg border ${
                selectedFaction === behavior.id
                  ? 'bg-gray-800 border-blue-500'
                  : 'bg-gray-900 border-gray-700'
              }`}
              onClick={() => setSelectedFaction(behavior.id as FactionIdType)}
            >
              {/* Faction Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-white">{config.name}</h3>
                  <div className="text-sm text-gray-400">{behavior.stateMachine.current}</div>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: config.banner.primaryColor }}
                >
                  {config.banner.sigil === 'rat-skull' && <Crown className="w-6 h-6" />}
                  {config.banner.sigil === 'broken-star' && <AlertTriangle className="w-6 h-6" />}
                  {config.banner.sigil === 'ancient-wheel' && <Shield className="w-6 h-6" />}
                </div>
              </div>

              {/* Status Indicators */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Ships</div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-bold text-white">{totalShips}</span>
                    <span className="text-sm text-gray-400">/ {maxShips}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Fleet Power</div>
                  <div className="text-2xl font-bold text-white">
                    {Math.round(fleetStrength * 100)}%
                  </div>
                </div>
              </div>

              {/* Behavior Indicators */}
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Aggression</span>
                    <span className={isAggressive ? 'text-red-400' : 'text-green-400'}>
                      {Math.round(behavior.behaviorState.aggression * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        isAggressive ? 'bg-red-500' : 'bg-green-500'
                      } rounded-full`}
                      style={{ width: `${behavior.behaviorState.aggression * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Expansion</span>
                    <span className={isExpanding ? 'text-yellow-400' : 'text-blue-400'}>
                      {Math.round(behavior.behaviorState.expansion * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        isExpanding ? 'bg-yellow-500' : 'bg-blue-500'
                      } rounded-full`}
                      style={{ width: `${behavior.behaviorState.expansion * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Active Fleets */}
              <div className="mt-4">
                <div className="text-sm text-gray-400 mb-2">Active Fleets</div>
                <div className="space-y-2">
                  {behavior.fleets.map((fleet, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-800 rounded"
                    >
                      <span className="text-sm">
                        Fleet {index + 1} ({fleet.ships.length} ships)
                      </span>
                      <span
                        className={`text-sm ${
                          fleet.formation.type === 'offensive'
                            ? 'text-red-400'
                            : fleet.formation.type === 'defensive'
                              ? 'text-blue-400'
                              : 'text-purple-400'
                        }`}
                      >
                        {fleet.formation.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Faction Details */}
      {selectedFaction && (
        <div className="mt-6">
          <FactionAI
            faction={selectedFaction}
            behavior={{
              id: selectedFaction,
              type: 'aggressive',
              priority: 'attack',
              conditions: {
                healthThreshold: 75,
                shieldThreshold: 50,
                targetDistance: 1000,
                allySupport: true,
              },
            }}
            fleetStrength={
              factionBehaviors
                .find(b => b?.id === selectedFaction)
                ?.fleets.reduce((total, fleet) => total + fleet.strength, 0) || 0
            }
            threatLevel={0.5}
            onUpdateBehavior={() => {}}
          />
        </div>
      )}

      {/* Debug Overlay */}
      {debugOverlay.visible && (
        <AIDebugOverlay
          debugStates={debugStates}
          visible={debugOverlay.visible}
          onToggleVisibility={debugOverlay.toggleVisibility}
        />
      )}

      {/* Diplomacy Panel */}
      {selectedFaction && (
        <DiplomacyPanel
          faction={{
            id: selectedFaction,
            name: factionConfigs[selectedFaction]?.name || '',
            type: selectedFaction.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) as
              | 'spaceRats'
              | 'lostNova'
              | 'equatorHorizon',
            relationship:
              factionBehaviors.find(b => b?.id === selectedFaction)?.relationships[
                selectedFaction
              ] || 0,
            status: 'neutral',
            tradingEnabled: true,
            lastInteraction: Date.now(),
          }}
          availableActions={[
            {
              type: 'ceasefire',
              name: 'Negotiate Ceasefire',
              description: 'Attempt to establish temporary peace',
              requirements: [{ type: 'Credits', value: 5000 }],
              available: true,
            },
          ]}
          onAction={() => {}}
          onClose={() => setSelectedFaction(null)}
        />
      )}
    </div>
  );
}
