import { ChevronDown, ChevronUp, Shield, Ship, Star, Swords } from 'lucide-react';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { FactionId } from '../../../types/ships/FactionTypes';
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="flex items-center text-3xl font-bold text-white">
          <Swords className="mr-3 h-8 w-8 text-blue-400" />
          Combat Formation Tactics
        </h1>
        <p className="mt-2 text-gray-400">
          Configure and optimize your fleet formations and combat tactics for maximum effectiveness
        </p>
      </div>

      {/* Faction Selector */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card
          className={`cursor-pointer transition-all ${activeFaction === 'player' ? 'border-blue-500 bg-blue-900/30' : 'border-gray-700 bg-gray-800 hover:bg-gray-700'}`}
          onClick={() => setActiveFaction('player')}
        >
          <CardHeader className="p-4">
            <CardTitle className="flex items-center text-lg">
              <Shield className="mr-2 h-5 w-5 text-blue-400" />
              Federation
            </CardTitle>
          </CardHeader>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${activeFaction === 'enemy' ? 'border-red-500 bg-red-900/30' : 'border-gray-700 bg-gray-800 hover:bg-gray-700'}`}
          onClick={() => setActiveFaction('enemy')}
        >
          <CardHeader className="p-4">
            <CardTitle className="flex items-center text-lg">
              <Star className="mr-2 h-5 w-5 text-red-400" />
              Imperium
            </CardTitle>
          </CardHeader>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${activeFaction === 'neutral' ? 'border-green-500 bg-green-900/30' : 'border-gray-700 bg-gray-800 hover:bg-gray-700'}`}
          onClick={() => setActiveFaction('neutral')}
        >
          <CardHeader className="p-4">
            <CardTitle className="flex items-center text-lg">
              <Ship className="mr-2 h-5 w-5 text-green-400" />
              Collective
            </CardTitle>
          </CardHeader>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${activeFaction === 'ally' ? 'border-purple-500 bg-purple-900/30' : 'border-gray-700 bg-gray-800 hover:bg-gray-700'}`}
          onClick={() => setActiveFaction('ally')}
        >
          <CardHeader className="p-4">
            <CardTitle className="flex items-center text-lg">
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
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="formations" className="w-full">
        <TabsList className="mb-6 border-b border-gray-700 bg-gray-800">
          <TabsTrigger value="formations" className="py-3 text-base">
            Formations
          </TabsTrigger>
          <TabsTrigger value="performance" className="py-3 text-base">
            Performance Analytics
          </TabsTrigger>
          <TabsTrigger value="history" className="py-3 text-base">
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
              <Card className="border-gray-700 bg-gray-800">
                <CardHeader>
                  <CardTitle>Faction Bonuses</CardTitle>
                  <CardDescription>
                    Special formation bonuses for {factionDisplayNames[activeFaction]}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
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
                </CardContent>
              </Card>

              <Card className="border-gray-700 bg-gray-800">
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle>Advanced Options</CardTitle>
                    {showAdvancedOptions ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </CardHeader>

                {showAdvancedOptions && (
                  <CardContent className="space-y-3">
                    <div className="flex items-center">
                      <input type="checkbox" id="auto-adapt" className="mr-2" />
                      <label htmlFor="auto-adapt" className="text-sm text-gray-300">
                        Auto-adapt to enemy formations
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input type="checkbox" id="predictive" className="mr-2" />
                      <label htmlFor="predictive" className="text-sm text-gray-300">
                        Predictive maneuvering
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input type="checkbox" id="complex-patterns" className="mr-2" />
                      <label htmlFor="complex-patterns" className="text-sm text-gray-300">
                        Enable complex formation patterns
                      </label>
                    </div>

                    <div className="mt-4">
                      <label className="mb-1 block text-sm text-gray-400">AI Aggressiveness</label>
                      <input type="range" min="0" max="100" className="w-full" />
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="p-8 text-center text-gray-400">
          <p>Performance analytics coming soon</p>
        </TabsContent>

        <TabsContent value="history" className="p-8 text-center text-gray-400">
          <p>Battle history coming soon</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
