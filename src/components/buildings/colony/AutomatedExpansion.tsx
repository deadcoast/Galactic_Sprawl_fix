import {
  AlertTriangle,
  ArrowRight,
  Database,
  Rocket,
  Settings,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { EventPayload } from '../../../hooks/game/useGlobalEvents';
import { useGlobalEvents } from '../../../hooks/game/useGlobalEvents';
import { useVPR } from '../../../hooks/ui/useVPR';

interface ExpansionData {
  id: string;
  targetSystem: string;
  status: 'preparing' | 'launching' | 'colonizing' | 'complete';
  progress: number;
  population: number;
  resources: { type: string; amount: number }[];
  estimatedTime: number;
  thresholds: {
    population: number;
    resources: { type: string; amount: number }[];
  };
  lastUpdate?: number;
  tier: 1 | 2 | 3;
  techBonuses?: {
    expansionSpeed: number;
    resourceEfficiency: number;
    populationGrowth: number;
  };
  vprData?: {
    visualTier: number;
    effectIntensity: number;
    particleSystem?: {
      enabled: boolean;
      density: number;
      color: string;
    };
  };
}

interface ExpansionEventPayload extends EventPayload {
  hazardId?: string;
  position?: { x: number; y: number };
  severity?: 'low' | 'medium' | 'high';
  type?: string;
  data?: Record<string, unknown>;
  expansionId: string;
  status: ExpansionData['status'];
  progress: number;
  targetSystem: string;
}

interface AutomatedExpansionProps {
  expansions: ExpansionData[];
  onCancelExpansion: (id: string) => void;
  onModifyThresholds: (thresholds: ExpansionData['thresholds']) => void;
  quality: 'low' | 'medium' | 'high';
  techLevel: number;
  onExpansionComplete?: (expansionId: string) => void;
}

export function AutomatedExpansion({
  expansions,
  onCancelExpansion,
  onModifyThresholds,
  quality,
  techLevel,
  onExpansionComplete,
}: AutomatedExpansionProps) {
  const [activeAnimations, setActiveAnimations] = useState<Record<string, boolean>>({});
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  const { getVPRAnimationSet } = useVPR();
  const { emitEvent } = useGlobalEvents();

  // Tech-based enhancements
  const techBonuses = useMemo(
    () => ({
      expansionSpeed: 1 + techLevel * 0.2,
      resourceEfficiency: 1 + techLevel * 0.15,
      populationGrowth: 1 + techLevel * 0.1,
    }),
    [techLevel]
  );

  // Effect for background progress simulation with tech integration
  useEffect(() => {
    const updateInterval = setInterval(() => {
      const now = Date.now();
      setLastUpdateTime(now);

      // Update animation states based on expansion status
      const newAnimations: Record<string, boolean> = {};
      expansions.forEach(expansion => {
        const isActive =
          expansion.status !== 'complete' &&
          (expansion.status === 'launching' || expansion.status === 'colonizing');

        newAnimations[expansion.id] = isActive;

        // Emit events for global state updates
        if (isActive) {
          emitEvent('EXPANSION_PROGRESS', {
            expansionId: expansion.id,
            status: expansion.status,
            progress: expansion.progress,
            targetSystem: expansion.targetSystem,
          } as ExpansionEventPayload);
        }

        // Check for completion
        if (expansion.status === 'colonizing' && expansion.progress >= 1) {
          onExpansionComplete?.(expansion.id);
        }
      });
      setActiveAnimations(newAnimations);
    }, 1000);

    return () => clearInterval(updateInterval);
  }, [expansions, lastUpdateTime, emitEvent, onExpansionComplete]);

  // Get VPR animations based on tech level
  const getExpansionAnimations = (expansion: ExpansionData) => {
    const baseSet = getVPRAnimationSet('expansion', expansion.tier ?? 1);

    return {
      ...baseSet,
      active: `${baseSet.active} scale-${100 + techLevel * 10}`,
      impact: `${baseSet.impact} duration-${500 - techLevel * 50}`,
    };
  };

  return (
    <div className="rounded-lg bg-gray-800 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`rounded-lg bg-indigo-500/20 p-2 ${
              Object.values(activeAnimations).some(v => v) ? 'animate-pulse' : ''
            }`}
          >
            <Rocket className="h-6 w-6 text-indigo-400" />
          </div>
          <h3 className="text-lg font-medium text-white">Automated Expansion</h3>
        </div>
        <button
          onClick={() =>
            onModifyThresholds({
              population: 90,
              resources: [
                { type: 'storage', amount: 85 },
                { type: 'production', amount: 150 },
              ],
            })
          }
          className="rounded-lg p-2 transition-colors hover:bg-gray-700"
        >
          <Settings className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Active Expansions with enhanced visuals */}
      <div className="space-y-4">
        {expansions.map(expansion => {
          const animations = getExpansionAnimations(expansion);
          const showParticles = quality !== 'low' && expansion.vprData?.particleSystem?.enabled;

          return (
            <div
              key={expansion.id}
              className={`rounded-lg bg-gray-700/50 p-4 transition-all duration-500 ${
                activeAnimations[expansion.id]
                  ? `shadow-lg shadow-indigo-500/10 ${animations.active}`
                  : ''
              }`}
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="mb-1 font-medium text-white">{expansion.targetSystem}</div>
                  <div className="flex items-center text-sm text-gray-400">
                    <Users className="mr-1 h-4 w-4" />
                    <span>{expansion.population.toLocaleString()} Colonists</span>
                  </div>
                </div>
                <div
                  className={`rounded-full px-3 py-1 text-sm ${
                    expansion.status === 'preparing'
                      ? 'bg-blue-900/50 text-blue-400'
                      : expansion.status === 'launching'
                        ? 'animate-pulse bg-yellow-900/50 text-yellow-400'
                        : expansion.status === 'colonizing'
                          ? 'animate-pulse bg-green-900/50 text-green-400'
                          : 'bg-gray-900/50 text-gray-400'
                  }`}
                >
                  {expansion.status.charAt(0).toUpperCase() + expansion.status.slice(1)}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-gray-300">{Math.round(expansion.progress * 100)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-600">
                  <div
                    className={`h-full rounded-full bg-indigo-500 transition-all ${
                      activeAnimations[expansion.id] ? 'animate-pulse' : ''
                    }`}
                    style={{ width: `${expansion.progress * 100}%` }}
                  />
                </div>
              </div>

              {/* Resource Requirements */}
              <div className="mb-4 space-y-2">
                <div className="text-sm text-gray-400">Required Resources</div>
                <div className="flex flex-wrap gap-2">
                  {expansion.resources.map(resource => (
                    <div
                      key={resource.type}
                      className="flex items-center space-x-2 rounded-lg bg-gray-800 px-2 py-1 text-sm"
                    >
                      <span className="text-gray-300">{resource.type}</span>
                      <ArrowRight className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-400">{resource.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Estimate with Real-time Update */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Estimated Time</span>
                <span className="text-gray-300">
                  {Math.max(
                    0,
                    Math.ceil(
                      (expansion.estimatedTime -
                        (Date.now() - (expansion.lastUpdate ?? Date.now()))) /
                        60000
                    )
                  )}
                  m
                </span>
              </div>

              {/* Cancel Button */}
              {expansion.status !== 'complete' && (
                <button
                  onClick={() => onCancelExpansion(expansion.id)}
                  className="mt-4 w-full rounded-lg border border-red-700/30 bg-red-900/20 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-900/30"
                >
                  Cancel Expansion
                </button>
              )}

              {/* Enhanced Visual Effects */}
              {showParticles && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
                  {Array.from({
                    length: expansion.vprData?.particleSystem?.density ?? 5,
                  }).map((_, i) => (
                    <div
                      key={i}
                      className={`absolute h-1 w-1 rounded-full ${animations.idle}`}
                      style={{
                        backgroundColor: expansion.vprData?.particleSystem?.color ?? '#6366f1',
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        opacity: 0.6,
                        transform: `scale(${1 + techLevel * 0.2})`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Tech Bonus Indicators */}
              {techLevel > 1 && (
                <div className="mt-4 flex items-center space-x-4 text-xs text-gray-400">
                  <div className="flex items-center">
                    <Zap className="mr-1 h-3 w-3 text-yellow-400" />
                    <span>+{Math.round((techBonuses.expansionSpeed - 1) * 100)}% Speed</span>
                  </div>
                  <div className="flex items-center">
                    <Database className="mr-1 h-3 w-3 text-blue-400" />
                    <span>
                      +{Math.round((techBonuses.resourceEfficiency - 1) * 100)}% Efficiency
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Users className="mr-1 h-3 w-3 text-green-400" />
                    <span>+{Math.round((techBonuses.populationGrowth - 1) * 100)}% Growth</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Threshold Settings with Tech Integration */}
      <div className="mt-6 rounded-lg bg-gray-700/30 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-300">Expansion Thresholds</div>
          <button
            onClick={() =>
              onModifyThresholds({
                population: 90,
                resources: [
                  { type: 'storage', amount: 85 },
                  { type: 'production', amount: 150 },
                ],
              })
            }
            className="text-sm text-indigo-400 transition-colors hover:text-indigo-300"
          >
            Modify
          </button>
        </div>

        {/* Population Threshold */}
        <div className="mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Population Trigger</span>
            <span className="text-gray-300">90%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-600">
            <div className="h-full rounded-full bg-indigo-500/50" style={{ width: '90%' }} />
          </div>
        </div>

        {/* Resource Thresholds */}
        <div className="mb-2 text-sm text-gray-400">Resource Triggers</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg bg-gray-800 px-3 py-2">
            <span className="text-gray-300">Storage Capacity</span>
            <span className="text-gray-400">{'>'} 85%</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-800 px-3 py-2">
            <span className="text-gray-300">Production Rate</span>
            <span className="text-gray-400">{'>'} 150/s</span>
          </div>
        </div>

        {/* Tech-Enhanced Features */}
        {techLevel >= 2 && (
          <div className="mt-4 rounded-lg border border-indigo-700/30 bg-indigo-900/20 p-3">
            <div className="mb-2 flex items-center space-x-2">
              <Star className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-medium text-indigo-300">Advanced Automation</span>
            </div>
            <p className="text-xs text-indigo-200">
              Enhanced expansion capabilities unlocked through technology advancement. Current tech
              level provides {Math.round((techBonuses.expansionSpeed - 1) * 100)}% faster expansion.
            </p>
          </div>
        )}
      </div>

      {/* warnings */}
      <div className="mt-4 flex items-start space-x-2 rounded-lg border border-yellow-700/30 bg-yellow-900/20 p-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-500" />
        <div className="text-sm text-yellow-200">
          Automated expansion requires stable resource production and population growth. Monitor
          your colony's status to ensure successful expansion.
        </div>
      </div>
    </div>
  );
}

// Enhanced animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(3px, -3px); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  
  @keyframes expand {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(style);
