import { useEffect, useState } from 'react';
import { useCombatSystem } from '../../../hooks/combat/useCombatSystem';
import { errorLoggingService } from '../../../services/logging/ErrorLoggingService';
import { FleetFormation } from '../../../types/combat/CombatTypes';
import { FactionId } from '../../../types/ships/FactionShipTypes';
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
  const [activeFleetId, setActiveFleetId] = useState<string>(fleetIds[0] ?? '');
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
      errorLoggingService.logWarn(`Invalid tactic: ${tacticId}. Expected one of: flank, charge, kite, hold`, {
        component: 'FormationTacticsContainer',
        fleetId,
        tacticId,
        validTactics: ['flank', 'charge', 'kite', 'hold']
      });
    }
  };

  if (fleetIds.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--gs-border)] bg-[rgba(20,38,65,0.88)] p-6 text-center">
        <p className="text-[var(--gs-text-2)]">No fleets available for formation management</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Fleet Selector */}
      {fleetIds.length > 1 && (
        <div className="rounded-lg border border-[var(--gs-border)] bg-[rgba(20,38,65,0.88)] p-4">
          <h3 className="mb-2 text-sm font-medium text-[var(--gs-text-2)]">Select Fleet</h3>
          <div className="grid grid-cols-3 gap-2">
            {fleetIds.map(fleetId => (
              <button
                key={fleetId}
                onClick={() => setActiveFleetId(fleetId)}
                className={`rounded px-3 py-2 text-sm transition-colors ${
                  activeFleetId === fleetId
                    ? 'border border-blue-500/70 bg-blue-600 text-white'
                    : 'border border-[var(--gs-border)] bg-[rgba(27,45,73,0.9)] text-[var(--gs-text-2)] hover:border-[var(--gs-border-strong)]'
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
