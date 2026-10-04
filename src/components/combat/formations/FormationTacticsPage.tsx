import { ChevronDown, ChevronUp, Shield, Ship, Star, Swords } from 'lucide-react';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { FactionId } from '../../../types/ships/FactionShipTypes';
import { Card } from '../../../ui/components/Card/Card';
import { FormationTacticsContainer } from './FormationTacticsContainer';

/**
 * FormationTacticsPage - Main page component for the formation tactics system
 */
export function FormationTacticsPage() {
  const [activeFaction, setActiveFaction] = useState<FactionId>('player');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Map to display friendly names for factions
  const factionDisplayNames: Record<FactionId, string> = {
    player: 'Federation',
    enemy: 'Imperium',
    neutral: 'Collective',
    ally: 'Nomads',
    'space-rats': 'Space Rats',
    'lost-nova': 'Lost Nova',
    'equator-horizon': 'Equator Horizon',
  };

  // Mock fleet data - in a real implementation, this would come from the fleet manager
  const fleetsByFaction: Record<FactionId, string[]> = {
    player: ['fleet-alpha', 'fleet-bravo'],
    enemy: ['fleet-delta'],
    neutral: ['fleet-gamma', 'fleet-epsilon', 'fleet-zeta'],
    ally: ['fleet-theta'],
    'space-rats': [],
    'lost-nova': [],
    'equator-horizon': [],
  };

  // Get fleets for the active faction
  const fleets = fleetsByFaction[activeFaction] ?? [];

  return (
    <div className="gs-route-container px-4 py-4 sm:py-6 lg:py-8">
      <div className="mb-8 rounded-xl border border-[var(--gs-border)] bg-[rgba(20,38,65,0.88)] px-5 py-5">
        <h1 className="gs-page-title flex items-center">
          <Swords className="mr-3 h-8 w-8 text-blue-400" />
          Combat Formation Tactics
        </h1>
        <p className="gs-page-subtitle">
          Configure and optimize your fleet formations and combat tactics for maximum effectiveness
        </p>
      </div>

      {/* Faction Selector */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card
          className={`cursor-pointer transition-all [&>div:first-child]:border-[var(--gs-border)] ${
            activeFaction === 'player'
              ? 'border-blue-500/80 bg-blue-900/25'
              : 'border-[var(--gs-border)] bg-[rgba(20,38,65,0.88)] hover:border-[var(--gs-border-strong)] hover:bg-[rgba(27,45,73,0.92)]'
          }`}
          onClick={() => setActiveFaction('player')}
          title={
            <div className="flex items-center text-lg text-[var(--gs-text-1)]">
              <Shield className="mr-2 h-5 w-5 text-blue-400" />
              Federation
            </div>
          }
          compact
        />

        <Card
          className={`cursor-pointer transition-all [&>div:first-child]:border-[var(--gs-border)] ${
            activeFaction === 'enemy'
              ? 'border-red-500/80 bg-red-900/25'
              : 'border-[var(--gs-border)] bg-[rgba(20,38,65,0.88)] hover:border-[var(--gs-border-strong)] hover:bg-[rgba(27,45,73,0.92)]'
          }`}
          onClick={() => setActiveFaction('enemy')}
          title={
            <div className="flex items-center text-lg text-[var(--gs-text-1)]">
              <Star className="mr-2 h-5 w-5 text-red-400" />
              Imperium
            </div>
          }
          compact
        />

        <Card
          className={`cursor-pointer transition-all [&>div:first-child]:border-[var(--gs-border)] ${
            activeFaction === 'neutral'
              ? 'border-green-500/80 bg-green-900/25'
              : 'border-[var(--gs-border)] bg-[rgba(20,38,65,0.88)] hover:border-[var(--gs-border-strong)] hover:bg-[rgba(27,45,73,0.92)]'
          }`}
          onClick={() => setActiveFaction('neutral')}
          title={
            <div className="flex items-center text-lg text-[var(--gs-text-1)]">
              <Ship className="mr-2 h-5 w-5 text-green-400" />
              Collective
            </div>
          }
          compact
        />

        <Card
          className={`cursor-pointer transition-all [&>div:first-child]:border-[var(--gs-border)] ${
            activeFaction === 'ally'
              ? 'border-violet-500/80 bg-violet-900/25'
              : 'border-[var(--gs-border)] bg-[rgba(20,38,65,0.88)] hover:border-[var(--gs-border-strong)] hover:bg-[rgba(27,45,73,0.92)]'
          }`}
          onClick={() => setActiveFaction('ally')}
          title={
            <div className="flex items-center text-lg text-[var(--gs-text-1)]">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="mr-2 text-purple-400"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              Nomads
            </div>
          }
          compact
        />
      </div>

      <Tabs defaultValue="formations" className="w-full">
        <TabsList className="mb-6 border border-[var(--gs-border)] bg-[rgba(20,38,65,0.88)] p-1">
          <TabsTrigger
            value="formations"
            className="py-3 text-base text-[var(--gs-text-2)] data-[state=active]:bg-[rgba(59,130,246,0.22)] data-[state=active]:text-sky-300"
          >
            Formations
          </TabsTrigger>
          <TabsTrigger
            value="performance"
            className="py-3 text-base text-[var(--gs-text-2)] data-[state=active]:bg-[rgba(59,130,246,0.22)] data-[state=active]:text-sky-300"
          >
            Performance Analytics
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="py-3 text-base text-[var(--gs-text-2)] data-[state=active]:bg-[rgba(59,130,246,0.22)] data-[state=active]:text-sky-300"
          >
            Battle History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="formations" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Main Tactics Panel */}
            <div className="lg:col-span-8">
              <FormationTacticsContainer fleetIds={fleets} factionId={activeFaction} />
            </div>

            {/* Sidebar - Stat Bonuses & More Info */}
            <div className="space-y-4 lg:col-span-4">
              <Card
                className="border-[var(--gs-border)] bg-[rgba(20,38,65,0.88)] [&>div:first-child]:border-[var(--gs-border)] [&>div:first-child>h3]:text-[var(--gs-text-1)] [&>div:first-child>p]:text-[var(--gs-text-2)]"
                title="Faction Bonuses"
                subtitle={`Special formation bonuses for ${factionDisplayNames[activeFaction]}`}
              >
                <div className="space-y-3">
                  {activeFaction === 'player' && (
                    <>
                      <div className="flex items-center justify-between rounded-md bg-blue-900/20 p-2">
                        <span className="text-blue-300">Shield Formation Bonus</span>
                        <span className="text-white">+15%</span>
                      </div>
                      <div className="flex items-center justify-between rounded-md bg-blue-900/20 p-2">
                        <span className="text-blue-300">Defensive Coordination</span>
                        <span className="text-white">+10%</span>
                      </div>
                    </>
                  )}

                  {activeFaction === 'enemy' && (
                    <>
                      <div className="flex items-center justify-between rounded-md bg-red-900/20 p-2">
                        <span className="text-red-300">Spearhead Damage</span>
                        <span className="text-white">+20%</span>
                      </div>
                      <div className="flex items-center justify-between rounded-md bg-red-900/20 p-2">
                        <span className="text-red-300">Charge Speed</span>
                        <span className="text-white">+15%</span>
                      </div>
                    </>
                  )}

                  {activeFaction === 'neutral' && (
                    <>
                      <div className="flex items-center justify-between rounded-md bg-green-900/20 p-2">
                        <span className="text-green-300">Scattered Formation Efficiency</span>
                        <span className="text-white">+25%</span>
                      </div>
                      <div className="flex items-center justify-between rounded-md bg-green-900/20 p-2">
                        <span className="text-green-300">Adaptive Spacing</span>
                        <span className="text-white">+20%</span>
                      </div>
                    </>
                  )}

                  {activeFaction === 'ally' && (
                    <>
                      <div className="flex items-center justify-between rounded-md bg-purple-900/20 p-2">
                        <span className="text-purple-300">Formation Transition Speed</span>
                        <span className="text-white">+30%</span>
                      </div>
                      <div className="flex items-center justify-between rounded-md bg-purple-900/20 p-2">
                        <span className="text-purple-300">Kiting Effectiveness</span>
                        <span className="text-white">+25%</span>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              <Card
                className="border-[var(--gs-border)] bg-[rgba(20,38,65,0.88)] [&>div:first-child]:border-[var(--gs-border)] [&>div:first-child]:bg-[rgba(18,35,63,0.95)]"
                header={
                  <div
                    className="flex cursor-pointer items-center justify-between"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  >
                    <h3 className="text-lg font-medium text-[var(--gs-text-1)]">Advanced Options</h3>
                    {showAdvancedOptions ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                }
              >
                {showAdvancedOptions && (
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="auto-adapt"
                        className="mr-2 h-4 w-4 rounded border-[var(--gs-border)] bg-[rgba(18,35,63,0.9)] accent-blue-500"
                      />
                      <label htmlFor="auto-adapt" className="text-sm text-[var(--gs-text-2)]">
                        Auto-adapt to enemy formations
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="predictive"
                        className="mr-2 h-4 w-4 rounded border-[var(--gs-border)] bg-[rgba(18,35,63,0.9)] accent-blue-500"
                      />
                      <label htmlFor="predictive" className="text-sm text-[var(--gs-text-2)]">
                        Predictive maneuvering
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="complex-patterns"
                        className="mr-2 h-4 w-4 rounded border-[var(--gs-border)] bg-[rgba(18,35,63,0.9)] accent-blue-500"
                      />
                      <label htmlFor="complex-patterns" className="text-sm text-[var(--gs-text-2)]">
                        Enable complex formation patterns
                      </label>
                    </div>

                    <div className="mt-4">
                      <label className="mb-1 block text-sm text-[var(--gs-text-3)]">
                        AI Aggressiveness
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[rgba(32,53,86,0.9)] accent-blue-500"
                      />
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="p-8 text-center text-[var(--gs-text-2)]">
          <p>Performance analytics coming soon</p>
        </TabsContent>

        <TabsContent value="history" className="p-8 text-center text-[var(--gs-text-2)]">
          <p>Battle history coming soon</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
