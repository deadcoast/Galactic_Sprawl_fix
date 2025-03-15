import * as React from "react";
import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit, Save, Zap } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { useFleetAI } from '../../../hooks/factions/useFleetAI';
import { FleetFormation } from '../../../types/combat/CombatTypes';
import { FactionId } from '../../../types/ships/FactionTypes';
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
  // Prefix unused variables with underscore to avoid linting warnings
  const [_activeSection, _setActiveSection] = useState<'presets' | 'editor' | 'bonuses'>('presets');
  const [activeTactic, setActiveTactic] = useState<'flank' | 'charge' | 'kite' | 'hold'>('hold');
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Initialize with default formation
  const defaultFormation: FleetFormation = {
    type: 'balanced',
    pattern: 'diamond',
    spacing: 100,
    facing: 0,
    adaptiveSpacing: true,
    transitionSpeed: 1,
  };

  // Map the fleetAI.formation to our FleetFormation type
  // The fleetAI.formation has type and pattern swapped compared to our FleetFormation type
  const initialFormation: FleetFormation = fleetAI.formation
    ? {
        // In fleetAI, 'pattern' is what we call 'type' in our component
        type: fleetAI.formation.pattern as 'offensive' | 'defensive' | 'balanced',
        // In fleetAI, 'type' is what we call 'pattern' in our component
        pattern: fleetAI.formation.type as
          | 'spearhead'
          | 'shield'
          | 'diamond'
          | 'arrow'
          | 'circle'
          | 'wedge'
          | 'line'
          | 'scattered',
        spacing: fleetAI.formation.spacing,
        facing: fleetAI.formation.facing,
        adaptiveSpacing: fleetAI.formation.adaptiveSpacing,
        transitionSpeed: fleetAI.formation.transitionSpeed || 1,
      }
    : defaultFormation;

  const [currentFormation, setCurrentFormation] = useState<FleetFormation>(initialFormation);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [currentBehavior, _setCurrentBehavior] = useState('focused_fire');

  // Calculate tactical bonuses based on formation and tactic combination
  const tacticalBonuses = calculateTacticalBonuses(currentFormation.pattern, activeTactic);

  // Handle formation change from presets or editor
  const handleFormationChange = (formation: FleetFormation) => {
    setCurrentFormation(formation);
    if (onFormationChange) {
      onFormationChange(fleetId, formation);
    }
  };

  // Handle tactical behavior change
  const handleTacticChange = (tactic: string) => {
    if (['flank', 'charge', 'kite', 'hold'].includes(tactic)) {
      setActiveTactic(tactic as 'flank' | 'charge' | 'kite' | 'hold');
    }
    if (onTacticChange) {
      onTacticChange(fleetId, tactic);
    }
  };

  // Calculate formation effectiveness rating (0-100)
  const calculateEffectivenessRating = () => {
    let rating = 70; // Base rating

    // Adjust based on formation type and pattern synergy
    if (
      (currentFormation.type === 'offensive' &&
        ['spearhead', 'arrow', 'line'].includes(currentFormation.pattern)) ||
      (currentFormation.type === 'defensive' &&
        ['shield', 'circle'].includes(currentFormation.pattern)) ||
      (currentFormation.type === 'balanced' &&
        ['diamond', 'wedge'].includes(currentFormation.pattern))
    ) {
      rating += 15; // Good synergy
    }

    // Adjust for spacing optimization
    if (currentFormation.spacing >= 80 && currentFormation.spacing <= 120) {
      rating += 10; // Optimal spacing range
    } else if (currentFormation.spacing < 50 || currentFormation.spacing > 150) {
      rating -= 10; // Poor spacing
    }

    // Adaptive spacing bonus
    if (currentFormation.adaptiveSpacing) {
      rating += 5;
    }

    // Cap rating between 0-100
    return Math.max(0, Math.min(100, rating));
  };

  // Calculate tactical stats
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

  return (
    <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 p-4">
        <h2 className="text-xl font-bold text-white">Fleet Formation Tactics</h2>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowAdvancedStats(!showAdvancedStats)}
            className="inline-flex h-8 items-center justify-center rounded-md border border-gray-600 bg-transparent px-3 text-sm text-xs hover:bg-gray-700 hover:text-white"
          >
            {showAdvancedStats ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span className="ml-1">Stats</span>
          </Button>
          <Button
            onClick={() => setIsCustomizing(!isCustomizing)}
            className="inline-flex h-8 items-center justify-center rounded-md border border-gray-600 bg-transparent px-3 text-sm text-xs hover:bg-gray-700 hover:text-white"
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
                    <span className="rounded-full bg-gray-800 px-3 py-1 text-sm capitalize text-white">
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
                  key={index}
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

      <div className="flex items-center justify-between border-t border-gray-700 bg-gray-800 p-4">
        <div className="text-sm text-gray-400">
          Fleet ID: <span className="text-gray-300">{fleetId}</span>
        </div>
        <Button className="inline-flex h-8 items-center justify-center rounded-md bg-blue-600 px-3 text-sm text-xs font-medium text-white shadow hover:bg-blue-700">
          <Zap size={16} className="mr-1" />
          Apply Tactics
        </Button>
      </div>
    </div>
  );
}

/**
 * Calculate tactical bonuses based on formation pattern and tactic
 */
function calculateTacticalBonuses(pattern: string, tactic: string): TacticalBonus[] {
  const bonuses: TacticalBonus[] = [];

  // Formation pattern bonuses
  switch (pattern) {
    case 'spearhead':
      bonuses.push({
        name: 'Concentrated Fire',
        description: 'Increases damage against a single target',
        value: 15,
        type: 'offensive',
      });
      break;
    case 'shield':
      bonuses.push({
        name: 'Defensive Screen',
        description: 'Reduces incoming damage from the front',
        value: 20,
        type: 'defensive',
      });
      break;
    case 'diamond':
      bonuses.push({
        name: 'Full Coverage',
        description: 'Provides balanced defense in all directions',
        value: 15,
        type: 'utility',
      });
      break;
    case 'circle':
      bonuses.push({
        name: 'Point Defense',
        description: 'Improves defense against projectiles',
        value: 25,
        type: 'defensive',
      });
      break;
    case 'line':
      bonuses.push({
        name: 'Broadside Power',
        description: 'Increases firepower on side angles',
        value: 20,
        type: 'offensive',
      });
      break;
    case 'arrow':
      bonuses.push({
        name: 'Speed Impact',
        description: 'Increases forward acceleration',
        value: 15,
        type: 'utility',
      });
      break;
    case 'wedge':
      bonuses.push({
        name: 'Flanking Advantage',
        description: 'Improves side assault capabilities',
        value: 20,
        type: 'offensive',
      });
      break;
    case 'scattered':
      bonuses.push({
        name: 'Evasion Boost',
        description: 'Makes ships harder to hit',
        value: 30,
        type: 'defensive',
      });
      break;
  }

  // Tactical behavior bonuses
  switch (tactic) {
    case 'flank':
      bonuses.push({
        name: 'Position Advantage',
        description: 'Attack from unexpected angles',
        value: 15,
        type: 'offensive',
      });
      break;
    case 'charge':
      bonuses.push({
        name: 'Forward Momentum',
        description: 'Increased forward momentum damage',
        value: 25,
        type: 'offensive',
      });
      break;
    case 'kite':
      bonuses.push({
        name: 'Evasion Tactics',
        description: 'Maintain distance while attacking',
        value: 20,
        type: 'utility',
      });
      break;
    case 'hold':
      bonuses.push({
        name: 'Defensive Position',
        description: 'Reduced incoming damage while stationary',
        value: 30,
        type: 'defensive',
      });
      break;
  }

  return bonuses;
}
