import { ChevronDown, ChevronUp, Edit, Save, Settings, Shuffle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { useFleetAI } from '../../../hooks/factions/useFleetAI';
import { FleetFormation } from '../../../types/combat/CombatTypes';
import { FactionId } from '../../../types/ships/FactionShipTypes';
import { Button } from '../../../ui/components/Button/Button';
import { FormationEditor } from './FormationEditor';
import { FormationPresetList } from './FormationPresetList';
import { FormationVisualizer } from './FormationVisualizer';
import { TacticalBehaviorSelector } from './TacticalBehaviorSelector';
import { TacticalBonusCard } from './TacticalBonusCard';

interface FormationTacticsPanelProps {
  fleetId: string;
  factionId: FactionId;
  onFormationChange?: (fleetId: string, formation: FleetFormation) => void;
  onTacticChange?: (fleetId: string, tacticId: string) => void;
}

// Define the type for tactical bonuses
interface TacticalBonus {
  name: string;
  description: string;
  value: number;
  type: 'offensive' | 'defensive' | 'utility';
}

/**
 * FormationTacticsPanel - Main component for managing fleet formations and tactics
 *
 * This component provides a comprehensive UI for:
 * 1. Viewing current formation
 * 2. Selecting formation presets
 * 3. Customizing formations
 * 4. Setting tactical behaviors
 * 5. Viewing tactical bonuses from formation choices
 */
export function FormationTacticsPanel({
  fleetId,
  factionId,
  onFormationChange,
  onTacticChange,
}: FormationTacticsPanelProps) {
  const fleetAI = useFleetAI(fleetId, factionId);
  const [, setActiveTactic] = useState<'flank' | 'charge' | 'kite' | 'hold'>('hold');
  const [isCustomizing, setIsCustomizing] = useState(false);

  const defaultFormation: FleetFormation = {
    type: 'balanced',
    pattern: 'diamond',
    spacing: 100,
    facing: 0,
    adaptiveSpacing: true,
    transitionSpeed: 1,
  };

  const initialFormation: FleetFormation = fleetAI?.formation // Add optional chaining
    ? {
        type: fleetAI.formation.pattern,
        pattern: fleetAI.formation.type,
        spacing: fleetAI.formation.spacing,
        facing: fleetAI.formation.facing,
        adaptiveSpacing: fleetAI.formation.adaptiveSpacing,
        transitionSpeed: fleetAI.formation.transitionSpeed ?? 1, // Fix 1: Use ??
      }
    : defaultFormation;

  const [currentFormation, setCurrentFormation] = useState<FleetFormation>(initialFormation);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [currentBehavior] = useState('focused_fire');

  // Update local state if fleetAI data changes after initial load
  useEffect(() => {
    if (fleetAI?.formation) {
      const updatedFormation = {
        type: fleetAI.formation.pattern,
        pattern: fleetAI.formation.type,
        spacing: fleetAI.formation.spacing,
        facing: fleetAI.formation.facing,
        adaptiveSpacing: fleetAI.formation.adaptiveSpacing,
        transitionSpeed: fleetAI.formation.transitionSpeed ?? 1,
      };
      // Avoid unnecessary updates if the object content is the same
      if (JSON.stringify(updatedFormation) !== JSON.stringify(currentFormation)) {
        setCurrentFormation(updatedFormation);
      }
    }
  }, [fleetAI?.formation, currentFormation]); // Depend on fleetAI.formation

  // Remove calculateTacticalBonuses call as it depends on removed logic
  // const tacticalBonuses = calculateTacticalBonuses(currentFormation.pattern, activeTactic);
  // Placeholder for bonuses if needed later from a different source
  const tacticalBonuses: TacticalBonus[] = [];

  const handleFormationChange = (formation: FleetFormation) => {
    setCurrentFormation(formation);
    if (onFormationChange) {
      onFormationChange(fleetId, formation);
    }
  };

  const handleTacticChange = (tactic: string) => {
    if (['flank', 'charge', 'kite', 'hold'].includes(tactic)) {
      setActiveTactic(tactic as 'flank' | 'charge' | 'kite' | 'hold');
    }
    if (onTacticChange) {
      onTacticChange(fleetId, tactic);
    }
  };

  const calculateEffectivenessRating = () => {
    let rating = 70;
    if (
      (currentFormation.type === 'offensive' &&
        ['spearhead', 'arrow', 'line'].includes(currentFormation.pattern)) ||
      (currentFormation.type === 'defensive' &&
        ['shield', 'circle'].includes(currentFormation.pattern)) ||
      (currentFormation.type === 'balanced' &&
        ['diamond', 'wedge'].includes(currentFormation.pattern))
    ) {
      rating += 15;
    }
    if (currentFormation.spacing >= 80 && currentFormation.spacing <= 120) {
      rating += 10;
    } else if (currentFormation.spacing < 50 || currentFormation.spacing > 150) {
      rating -= 10;
    }
    if (currentFormation.adaptiveSpacing) {
      rating += 5;
    }
    return Math.max(0, Math.min(100, rating));
  };

  const calculateTacticalStats = () => {
    const effectiveness = calculateEffectivenessRating();
    return {
      effectiveness,
      offensiveRating:
        currentFormation.type === 'offensive'
          ? effectiveness + 15
          : currentFormation.type === 'defensive'
            ? effectiveness - 10
            : effectiveness,
      defensiveRating:
        currentFormation.type === 'defensive'
          ? effectiveness + 15
          : currentFormation.type === 'offensive'
            ? effectiveness - 10
            : effectiveness,
      mobilityRating:
        currentFormation.pattern === 'scattered' || currentFormation.pattern === 'wedge'
          ? effectiveness + 10
          : effectiveness - 5,
      coordinationRating:
        currentFormation.pattern === 'diamond' || currentFormation.pattern === 'circle'
          ? effectiveness + 10
          : currentFormation.pattern === 'scattered'
            ? effectiveness - 15
            : effectiveness,
    };
  };

  const tacticalStats = calculateTacticalStats();

  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  const toggleSettingsPanel = () => {
    setShowSettingsPanel(!showSettingsPanel);
  };

  const onRandomize = () => {
    // Randomize formation logic to be implemented
  };

  // Fix 2 & 3: Correct formationStats calculation based on available state
  const formationStats = useMemo(() => {
    // Derive name from currentFormation state, not fleetAI
    const name = currentFormation.pattern
      ? currentFormation.pattern.charAt(0).toUpperCase() + currentFormation.pattern.slice(1)
      : 'Default';

    // Return simplified stats as bonuses are not available from fleetAI
    return {
      pattern: currentFormation.pattern, // Use pattern from state
      totalValue: 0, // Placeholder, bonuses removed
      offensiveBonuses: [], // Placeholder
      defensiveBonuses: [], // Placeholder
      utilityBonuses: [], // Placeholder
      currentFormationName: `${name} Formation`, // Use derived name
    };
  }, [currentFormation]);

  return (
    <div className="relative overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 p-4">
        <h2 className="text-xl font-bold text-white">Fleet Formation Tactics</h2>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowAdvancedStats(!showAdvancedStats)}
            variant="secondary"
            size="sm"
            className="border-gray-600 bg-transparent text-xs hover:bg-gray-700"
          >
            {showAdvancedStats ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span className="ml-1">Stats</span>
          </Button>
          <Button
            onClick={() => setIsCustomizing(!isCustomizing)}
            variant="secondary"
            size="sm"
            className="border-gray-600 bg-transparent text-xs hover:bg-gray-700"
          >
            {isCustomizing ? <Save size={16} /> : <Edit size={16} />}
            <span className="ml-1">{isCustomizing ? 'Save' : 'Customize'}</span>
          </Button>
        </div>
      </div>

      {/* Stats Panel (Collapsible) */}
      {showAdvancedStats && (
        <div className="border-b border-gray-700 bg-gray-800/50 p-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold text-white">{tacticalStats.effectiveness}</div>
              <div className="mt-1 text-xs text-gray-400">EFFECTIVENESS</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold text-red-400">{tacticalStats.offensiveRating}</div>
              <div className="mt-1 text-xs text-gray-400">OFFENSE</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold text-blue-400">
                {tacticalStats.defensiveRating}
              </div>
              <div className="mt-1 text-xs text-gray-400">DEFENSE</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold text-green-400">
                {tacticalStats.mobilityRating}
              </div>
              <div className="mt-1 text-xs text-gray-400">MOBILITY</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold text-purple-400">
                {tacticalStats.coordinationRating}
              </div>
              <div className="mt-1 text-xs text-gray-400">COORDINATION</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-4">
        <Tabs defaultValue="formation" className="w-full">
          <TabsList className="mb-4 border-b border-gray-700 bg-gray-800">
            <TabsTrigger value="formation" className="py-2 text-base">
              Formation
            </TabsTrigger>
            <TabsTrigger value="behavior" className="py-2 text-base">
              Behavior
            </TabsTrigger>
            <TabsTrigger value="bonuses" className="py-2 text-base">
              Bonuses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="formation" className="space-y-4">
            {isCustomizing ? (
              <FormationEditor
                initialFormation={currentFormation}
                onSaveFormation={handleFormationChange}
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="flex flex-col items-center justify-center">
                  <FormationVisualizer
                    pattern={currentFormation.pattern}
                    type={currentFormation.type}
                    facing={currentFormation.facing}
                    spacing={currentFormation.spacing}
                    width={240}
                    height={240}
                  />
                  <div className="mt-3 flex justify-center space-x-2">
                    <span className="rounded-full bg-gray-800 px-3 py-1 text-sm text-white capitalize">
                      {currentFormation.pattern}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-sm capitalize ${
                        currentFormation.type === 'offensive'
                          ? 'bg-red-900/30 text-red-300'
                          : currentFormation.type === 'defensive'
                            ? 'bg-blue-900/30 text-blue-300'
                            : 'bg-purple-900/30 text-purple-300'
                      }`}
                    >
                      {currentFormation.type}
                    </span>
                  </div>
                </div>

                <div>
                  <FormationPresetList
                    currentType={currentFormation.type}
                    onSelectFormation={handleFormationChange}
                  />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="behavior">
            <TacticalBehaviorSelector
              currentBehaviorId={currentBehavior}
              onSelectBehavior={handleTacticChange}
              formationType={currentFormation.type}
            />
          </TabsContent>

          <TabsContent value="bonuses">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {tacticalBonuses.map((bonus, index) => (
                <TacticalBonusCard
                  key={`${bonus.name}-${bonus.type}-${index}`}
                  name={bonus.name}
                  description={bonus.description}
                  value={bonus.value}
                  type={bonus.type}
                />
              ))}

              {tacticalBonuses.length === 0 && (
                <div className="col-span-2 py-8 text-center text-gray-400">
                  No tactical bonuses available with current configuration
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-700 bg-gray-800 p-4">
        <div className="text-sm text-gray-400">
          Formation: <span className="text-gray-300">{formationStats?.currentFormationName}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="secondary" size="sm" onClick={toggleSettingsPanel}>
            <Settings className="mr-1 h-4 w-4" />
            Settings
          </Button>
          <Button variant="tertiary" size="sm" onClick={onRandomize} disabled={!fleetAI}>
            <Shuffle className="mr-1 h-4 w-4" /> Randomize
          </Button>
        </div>
      </div>

      {/* Settings Panel (Conditional & Absolute Positioned) */}
      {showSettingsPanel && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-xl">
            {/* Close Button for Settings Panel */}
            <div className="absolute top-2 right-2">
              <Button variant="ghost" size="xs" onClick={() => setShowSettingsPanel(false)}>
                Close
              </Button>
            </div>
            <h3 className="mb-4 text-lg font-medium text-white">Formation Settings</h3>
            {/* Placeholder for actual settings controls */}
            <div className="mb-4 h-32 text-center text-gray-500">Settings Controls Placeholder</div>
            {/* Apply Button for Settings Panel */}
            <div className="flex justify-end">
              <Button
                variant="primary" // Changed variant to primary for main action
                size="sm"
                onClick={() => {
                  // Implementation of apply changes logic
                  setShowSettingsPanel(false); // Close panel after applying
                }}
              >
                Apply Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


