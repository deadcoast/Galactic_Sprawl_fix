import { AlertTriangle, Crown, Shield } from 'lucide-react';
import * as React from "react";
import { useEffect, useState } from 'react';
import { AIDebugOverlay } from '../../../components/debug/AIDebugOverlay';
import { FactionAI } from '../../../components/factions/FactionAI';
import { factionConfigs, factionIds } from '../../../config/factions/factionConfig';
import { getShipStats } from '../../../config/ships/shipStats';
import { useFactionBehavior } from '../../../hooks/factions/useFactionBehavior';
import { useDebugOverlay } from '../../../hooks/ui/useDebugOverlay';
import type { FactionState } from '../../../managers/factions/factionManager';
import type { DebugState } from '../../../types/debug/DebugTypes';
import type { CommonShipAbility } from '../../../types/ships/CommonShipTypes';
import { FactionShip } from '../../../types/ships/FactionShipTypes';
import { getFactionDefaultShipClass } from '../../../utils/ships/shipClassUtils';
import { DiplomacyPanel } from '../../ui/DiplomacyPanel';

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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              className={`rounded-lg border p-6 ${
                selectedFaction === behavior.id
                  ? 'border-blue-500 bg-gray-800'
                  : 'border-gray-700 bg-gray-900'
              }`}
              onClick={() => setSelectedFaction(behavior.id as FactionIdType)}
            >
              {/* Faction Header */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">{config.name}</h3>
                  <div className="text-sm text-gray-400">{behavior.stateMachine.current}</div>
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: config.banner.primaryColor }}
                >
                  {config.banner.sigil === 'rat-skull' && <Crown className="h-6 w-6" />}
                  {config.banner.sigil === 'broken-star' && <AlertTriangle className="h-6 w-6" />}
                  {config.banner.sigil === 'ancient-wheel' && <Shield className="h-6 w-6" />}
                </div>
              </div>

              {/* Status Indicators */}
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-1 text-sm text-gray-400">Ships</div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-bold text-white">{totalShips}</span>
                    <span className="text-sm text-gray-400">/ {maxShips}</span>
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-gray-400">Fleet Power</div>
                  <div className="text-2xl font-bold text-white">
                    {Math.round(fleetStrength * 100)}%
                  </div>
                </div>
              </div>

              {/* Behavior Indicators */}
              <div className="space-y-2">
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-400">Aggression</span>
                    <span className={isAggressive ? 'text-red-400' : 'text-green-400'}>
                      {Math.round(behavior.behaviorState.aggression * 100)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-700">
                    <div
                      className={`h-full ${
                        isAggressive ? 'bg-red-500' : 'bg-green-500'
                      } rounded-full`}
                      style={{ width: `${behavior.behaviorState.aggression * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-400">Expansion</span>
                    <span className={isExpanding ? 'text-yellow-400' : 'text-blue-400'}>
                      {Math.round(behavior.behaviorState.expansion * 100)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-700">
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
                <div className="mb-2 text-sm text-gray-400">Active Fleets</div>
                <div className="space-y-2">
                  {behavior.fleets.map((fleet, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded bg-gray-800 p-2"
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
                ?.fleets.reduce((total, fleet) => total + fleet.strength, 0) ?? 0
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
            name: factionConfigs[selectedFaction]?.name ?? '',
            type: selectedFaction.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) as
              | 'spaceRats'
              | 'lostNova'
              | 'equatorHorizon',
            relationship:
              factionBehaviors.find(b => b?.id === selectedFaction)?.relationships[
                selectedFaction
              ] ?? 0,
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
