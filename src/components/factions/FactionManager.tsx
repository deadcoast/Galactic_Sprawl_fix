import React, { useEffect, useState } from 'react';
import { Crown, AlertTriangle, Shield } from 'lucide-react';
import { FactionAI } from '../ships/FactionShips/FactionAI';
import { DiplomacyPanel } from '../DiplomacyPanel';
import { useFactionBehavior } from '../../hooks/factions/useFactionBehavior';
import { useDebugOverlay } from '../../hooks/ui/useDebugOverlay';
import { AIDebugOverlay } from '../debug/AIDebugOverlay';
import { factionConfigs } from '../../config/factions/factions';
import { factionManager, type FactionState } from '../../lib/factions/factionManager';
import type { FactionId } from '../../types/factions/FactionTypes';

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
  const factionBehaviors: Partial<Record<FactionId, ReturnType<typeof useFactionBehavior>>> = React.useMemo(() => 
    Object.fromEntries(
      activeFactions.map((id, index) => [id, behaviors[index]])
    ),
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
    <div className="fixed inset-4 bg-gray-900/95 backdrop-blur-md rounded-lg border border-gray-700 shadow-2xl flex overflow-hidden">
      {/* Faction List */}
      <div className="w-1/3 border-r border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Active Factions</h2>
          <button
            onClick={debugOverlay.toggleVisibility}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
          >
            <Shield className="w-5 h-5 text-cyan-400" />
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
                className="w-full p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-left transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 bg-${config.banner.primaryColor}/20 rounded-lg`}>
                      <config.banner.icon className={`w-5 h-5 text-${config.banner.primaryColor}-400`} />
                    </div>
                    <span className="text-white font-medium">{config.name}</span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs ${
                    behavior.behaviorState.currentTactic === 'raid' ? 'bg-red-900/50 text-red-400' :
                    behavior.behaviorState.currentTactic === 'defend' ? 'bg-yellow-900/50 text-yellow-400' :
                    'bg-blue-900/50 text-blue-400'
                  }`}>
                    {behavior.behaviorState.currentTactic}
                  </div>
                </div>

                {/* Behavior Metrics */}
                <div className="grid grid-cols-2 gap-2 mb-2">
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
                    <AlertTriangle className="w-4 h-4" />
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
                allySupport: true
              }
            }}
            fleetStrength={Number((factionBehaviors[selectedFaction]?.stats?.totalShips || 0) / 100)}
            threatLevel={0.5}
            onUpdateBehavior={() => {}}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Crown className="w-12 h-12 mx-auto mb-4 opacity-50" />
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
            lastInteraction: Date.now()
          }}
          availableActions={[
            {
              type: 'ceasefire',
              name: 'Negotiate Ceasefire',
              description: 'Attempt to establish temporary peace',
              requirements: [
                { type: 'Credits', value: 5000 }
              ],
              available: true
            }
          ]}
          onAction={() => {}}
          onClose={() => setShowDiplomacy(false)}
        />
      )}
    </div>
  );
}