import { AlertTriangle, Crown, Shield } from 'lucide-react';
import * as React from "react";
import { useEffect, useState } from 'react';
import { factionConfigs } from '../../config/factions/factions';
import { useFactionBehavior } from '../../hooks/factions/useFactionBehavior';
import { useDebugOverlay } from '../../hooks/ui/useDebugOverlay';
import { factionManager, type FactionState } from '../../managers/factions/factionManager';
import type { FactionId } from '../../types/ships/FactionTypes';
import { AIDebugOverlay } from '../debug/AIDebugOverlay';
import { DiplomacyPanel } from '../ui/DiplomacyPanel';
import { FactionAI } from './FactionAI';

interface FactionManagerProps {
  onFactionUpdate?: (factionId: string, state: FactionState) => void;
}

export function FactionManager({ onFactionUpdate }: FactionManagerProps) {
  const [activeFactions, setActiveFactions] = useState<FactionId[]>([]);
  const [selectedFaction, setSelectedFactor] = useState<FactionId | null>(null);
  const [showDiplomacy, setShowDiplomacy] = useState(false);

  const debugOverlay = useDebugOverlay();

  // Get behavior for each active faction
  const behaviors: ReturnType<typeof useFactionBehavior>[] = activeFactions.map(useFactionBehavior);
  const factionBehaviors: Partial<Record<FactionId, ReturnType<typeof useFactionBehavior>>> =
    React.useMemo(
      () => Object.fromEntries(activeFactions.map((id, index) => [id, behaviors[index]])),
      [activeFactions, behaviors]
    );

  useEffect(() => {
    // Initialize factions based on player state
    const updateFactions = () => {
      const newActive = Object.keys(factionConfigs).filter(id => {
        const config = factionConfigs[id];
        // Check spawn conditions
        return config.spawnConditions.minTier > 0; // Basic spawn check
      });
      setActiveFactions(newActive as FactionId[]);
      newActive.forEach(id => {
        const state = factionManager.getFactionState(id);
        if (state) {
          onFactionUpdate?.(id, state);
        }
      });
    };

    updateFactions();
    const interval = setInterval(updateFactions, 5000);
    return () => clearInterval(interval);
  }, [onFactionUpdate]);

  const handleFactionSelect = (factionId: string) => {
    setSelectedFactor(factionId as FactionId);
    setShowDiplomacy(true);
  };

  return (
    <div className="fixed inset-4 flex overflow-hidden rounded-lg border border-gray-700 bg-gray-900/95 shadow-2xl backdrop-blur-md">
      {/* Faction List */}
      <div className="w-1/3 border-r border-gray-700 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Active Factions</h2>
          <button
            onClick={debugOverlay.toggleVisibility}
            className="rounded-lg bg-gray-800 p-2 hover:bg-gray-700"
          >
            <Shield className="h-5 w-5 text-cyan-400" />
          </button>
        </div>

        <div className="space-y-4">
          {activeFactions.map(factionId => {
            const config = factionConfigs[factionId];
            const behavior = factionBehaviors[factionId];

            if (!config || !behavior) {
              return null;
            }

            return (
              <button
                key={factionId}
                onClick={() => handleFactionSelect(factionId)}
                className="w-full rounded-lg bg-gray-800/50 p-4 text-left transition-all hover:bg-gray-800"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 bg-${config.banner.primaryColor}/20 rounded-lg`}>
                      <config.banner.icon
                        className={`h-5 w-5 text-${config.banner.primaryColor}-400`}
                      />
                    </div>
                    <span className="font-medium text-white">{config.name}</span>
                  </div>
                  <div
                    className={`rounded-full px-2 py-1 text-xs ${
                      behavior.behaviorState.currentTactic === 'raid'
                        ? 'bg-red-900/50 text-red-400'
                        : behavior.behaviorState.currentTactic === 'defend'
                          ? 'bg-yellow-900/50 text-yellow-400'
                          : 'bg-blue-900/50 text-blue-400'
                    }`}
                  >
                    {behavior.behaviorState.currentTactic}
                  </div>
                </div>

                {/* Behavior Metrics */}
                <div className="mb-2 grid grid-cols-2 gap-2">
                  <div className="text-sm">
                    <span className="text-gray-400">Aggression: </span>
                    <span className="text-gray-200">
                      {Math.round(behavior.behaviorState.aggression * 100)}%
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">Expansion: </span>
                    <span className="text-gray-200">
                      {Math.round(behavior.behaviorState.expansion * 100)}%
                    </span>
                  </div>
                </div>

                {/* Fleet Status */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Active Fleets</span>
                  <span className="text-gray-200">
                    {behavior.stats.activeFleets}/{behavior.fleets.length}
                  </span>
                </div>

                {/* Special Rules Warning */}
                {behavior.specialRules.alwaysHostile && (
                  <div className="mt-2 flex items-center space-x-2 text-xs text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Always Hostile</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Faction Details */}
      <div className="flex-1 p-6">
        {selectedFaction ? (
          <FactionAI
            faction={selectedFaction as FactionId}
            behavior={{
              id: selectedFaction,
              type: 'aggressive',
              priority: 'attack',
              conditions: {
                healthThreshold: 30,
                shieldThreshold: 50,
                targetDistance: 1000,
                allySupport: true,
              },
            }}
            fleetStrength={Number(
              (factionBehaviors[selectedFaction]?.stats?.totalShips || 0) / 100
            )}
            threatLevel={0.5}
            onUpdateBehavior={() => {}}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <div className="text-center">
              <Crown className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Select a faction to view details and manage relations</p>
            </div>
          </div>
        )}
      </div>

      {/* Debug Overlay */}
      {debugOverlay.visible && (
        <AIDebugOverlay
          debugStates={debugOverlay.debugStates}
          visible={debugOverlay.visible}
          onToggleVisibility={debugOverlay.toggleVisibility}
        />
      )}

      {/* Diplomacy Panel */}
      {showDiplomacy && selectedFaction && (
        <DiplomacyPanel
          faction={{
            id: selectedFaction,
            name: factionConfigs[selectedFaction].name,
            type: selectedFaction.replace(/-/g, '') as 'spaceRats' | 'lostNova' | 'equatorHorizon',
            relationship: 0,
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
          onClose={() => setShowDiplomacy(false)}
        />
      )}
    </div>
  );
}
