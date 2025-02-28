import { Brain, Target } from 'lucide-react';

interface DebugState {
  aiState: {
    behaviorState: string;
    targetId?: string;
    fleetStrength: number;
    threatLevel: number;
  };
  formation?: {
    type: string;
    spacing: number;
    facing: number;
  };
  position: { x: number; y: number };
}

interface AIDebugOverlayProps {
  debugStates: Record<string, DebugState>;
  visible: boolean;
  onToggleVisibility: () => void;
}

export function AIDebugOverlay({ debugStates, visible, onToggleVisibility }: AIDebugOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 w-96 rounded-lg border border-gray-700 bg-gray-900/95 shadow-xl backdrop-blur-sm">
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-medium text-white">AI Debug</h3>
          </div>
          <button onClick={onToggleVisibility} className="text-gray-400 hover:text-white">
            <Target className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-96 space-y-4 overflow-y-auto">
          {Object.entries(debugStates).map(([id, state]) => (
            <div key={id} className="rounded-lg bg-gray-800/50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Unit {id}</span>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    state.aiState.behaviorState === 'engaging'
                      ? 'bg-red-900/50 text-red-400'
                      : state.aiState.behaviorState === 'retreating'
                        ? 'bg-yellow-900/50 text-yellow-400'
                        : 'bg-blue-900/50 text-blue-400'
                  }`}
                >
                  {state.aiState.behaviorState}
                </span>
              </div>

              {/* AI State */}
              <div className="mb-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Fleet Strength</span>
                  <span className="text-cyan-400">
                    {Math.round(state.aiState.fleetStrength * 100)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Threat Level</span>
                  <span className="text-red-400">
                    {Math.round(state.aiState.threatLevel * 100)}%
                  </span>
                </div>
                {state.aiState.targetId && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Target</span>
                    <span className="text-yellow-400">{state.aiState.targetId}</span>
                  </div>
                )}
              </div>

              {/* Formation Info */}
              {state.formation && (
                <div className="border-t border-gray-700 pt-2">
                  <div className="mb-2 text-xs text-gray-400">Formation</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-xs">
                      <span className="text-gray-500">Type: </span>
                      <span className="text-gray-300">{state.formation.type}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-500">Spacing: </span>
                      <span className="text-gray-300">{state.formation.spacing}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-500">Facing: </span>
                      <span className="text-gray-300">
                        {Math.round(state.formation.facing * (180 / Math.PI))}°
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Position */}
              <div className="mt-2 border-t border-gray-700 pt-2">
                <div className="mb-1 text-xs text-gray-400">Position</div>
                <div className="flex space-x-4">
                  <div className="text-xs">
                    <span className="text-gray-500">X: </span>
                    <span className="text-gray-300">{Math.round(state.position.x)}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-500">Y: </span>
                    <span className="text-gray-300">{Math.round(state.position.y)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
