import { useEffect, useState } from 'react';
import { useCombatSystem } from '../../../hooks/combat/useCombatSystem';
import { FleetFormation } from '../../../types/combat/CombatTypes';
import { FactionId } from '../../../types/ships/FactionTypes';
import { FormationTacticsPanel } from './FormationTacticsPanel';

interface FormationTacticsContainerProps {
  fleetIds: string[];
  factionId: FactionId;
}

/**
 * FormationTacticsContainer - Container component for managing fleet formations
 * across multiple fleets. Provides context and data for the tactics panel.
 */
export function FormationTacticsContainer({ fleetIds, factionId }: FormationTacticsContainerProps) {
  const [activeFleetId, setActiveFleetId] = useState<string>(fleetIds[0] || '');
  const combatSystem = useCombatSystem();

  // Update active fleet if fleetIds changes
  useEffect(() => {
    if (fleetIds.length > 0 && !fleetIds.includes(activeFleetId)) {
      setActiveFleetId(fleetIds[0]);
    }
  }, [fleetIds, activeFleetId]);

  // Handle formation change - updated to include fleetId parameter to match expected type
  const handleFormationChange = (fleetId: string, formation: FleetFormation) => {
    if (!fleetId) {
      return;
    }

    combatSystem.updateFleetFormation(fleetId, formation);
  };

  // Handle tactic change - updated to include fleetId parameter and cast tacticId to the expected type
  const handleTacticChange = (fleetId: string, tacticId: string) => {
    if (!fleetId) {
      return;
    }

    // Cast tacticId to the specific type expected by useCombatSystem
    if (
      tacticId === 'flank' ||
      tacticId === 'charge' ||
      tacticId === 'kite' ||
      tacticId === 'hold'
    ) {
      combatSystem.updateFleetTactic(fleetId, tacticId);
    } else {
      console.warn(`Invalid tactic: ${tacticId}. Expected one of: flank, charge, kite, hold`);
    }
  };

  if (fleetIds.length === 0) {
    return (
      <div className="rounded-lg bg-gray-800 p-6 text-center">
        <p className="text-gray-400">No fleets available for formation management</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Fleet Selector */}
      {fleetIds.length > 1 && (
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
          <h3 className="mb-2 text-sm font-medium text-gray-300">Select Fleet</h3>
          <div className="grid grid-cols-3 gap-2">
            {fleetIds.map(fleetId => (
              <button
                key={fleetId}
                onClick={() => setActiveFleetId(fleetId)}
                className={`rounded px-3 py-2 text-sm transition-colors ${
                  activeFleetId === fleetId
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Fleet {fleetId.replace('fleet-', '')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Formation Tactics Panel */}
      <FormationTacticsPanel
        fleetId={activeFleetId}
        factionId={factionId}
        onFormationChange={handleFormationChange}
        onTacticChange={handleTacticChange}
      />
    </div>
  );
}
