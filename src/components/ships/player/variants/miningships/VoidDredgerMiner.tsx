import { AlertTriangle, Database, Truck, Zap } from 'lucide-react';

interface VoidDredgerProps {
  id: string;
  name: string;
  status: 'mining' | 'returning' | 'idle' | 'maintenance';
  targetNode?: {
    id: string;
    name: string;
    type: string;
    distance: number;
  };
  cargo: {
    current: number;
    capacity: number;
    resources: {
      type: string;
      amount: number;
    }[];
  };
  efficiency: number;
  extractionRate: number;
  alerts?: string[];
  onRecall: () => void;
  onSetTarget: (nodeId: string) => void;
}

export function VoidDredger({
  id,
  name,
  status,
  targetNode,
  cargo,
  efficiency,
  extractionRate,
  alerts,
  onRecall,
  onSetTarget,
}: VoidDredgerProps) {
  return (
    <div className="rounded-lg border border-amber-700/30 bg-amber-900/20 p-6" data-dredger-id={id}>
      {/* Ship Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">{name}</h3>
          <div className="text-sm text-gray-400">Mining Vessel</div>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-sm ${
            status === 'mining'
              ? 'bg-green-900/50 text-green-400'
              : status === 'returning'
                ? 'bg-blue-900/50 text-blue-400'
                : status === 'maintenance'
                  ? 'bg-yellow-900/50 text-yellow-400'
                  : 'bg-gray-700 text-gray-400'
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>

      {/* Mining Status */}
      {targetNode && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-400">Current Target</span>
            <span className="text-sm text-amber-400">{targetNode.name}</span>
          </div>
          <div className="rounded-lg bg-gray-800/50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm text-gray-300">{targetNode.type}</div>
              <div className="text-sm text-gray-400">{targetNode.distance}ly</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Extraction Rate</span>
              <span className="text-amber-400">{extractionRate}/s</span>
            </div>
          </div>
        </div>
      )}

      {/* Cargo Status */}
      <div className="mb-6">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-gray-400">Cargo Hold</span>
          <span className="text-gray-300">
            {cargo.current} / {cargo.capacity}
          </span>
        </div>
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-gray-700">
          <div
            className="h-full rounded-full bg-amber-500 transition-all"
            style={{ width: `${(cargo.current / cargo.capacity) * 100}%` }}
          />
        </div>
        <div className="space-y-2">
          {cargo.resources.map(resource => (
            <div
              key={resource.type}
              className="flex items-center justify-between rounded-lg bg-gray-800/50 p-2"
            >
              <span className="text-sm text-gray-300">{resource.type}</span>
              <span className="text-sm text-amber-400">{resource.amount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Efficiency Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-gray-800/50 p-3">
          <div className="mb-2 flex items-center space-x-2">
            <Database className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300">Efficiency</span>
          </div>
          <div className="text-lg font-medium text-amber-400">{Math.round(efficiency * 100)}%</div>
        </div>
        <div className="rounded-lg bg-gray-800/50 p-3">
          <div className="mb-2 flex items-center space-x-2">
            <Zap className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300">Rate</span>
          </div>
          <div className="text-lg font-medium text-amber-400">{extractionRate}/s</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onRecall()}
          disabled={status === 'maintenance'}
          className={`flex items-center justify-center space-x-2 rounded-lg px-4 py-2 text-sm ${
            status === 'maintenance'
              ? 'cursor-not-allowed bg-gray-700 text-gray-500'
              : 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30'
          }`}
        >
          <Truck className="h-4 w-4" />
          <span>Recall Ship</span>
        </button>
        <button
          onClick={() => onSetTarget(targetNode?.id || '')}
          disabled={status === 'maintenance'}
          className={`flex items-center justify-center space-x-2 rounded-lg bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600 ${
            status === 'maintenance' ? 'cursor-not-allowed opacity-50' : ''
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Set Target</span>
        </button>
      </div>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="mt-4 space-y-2">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className="flex items-start space-x-2 rounded-lg border border-yellow-700/30 bg-yellow-900/20 p-3"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
              <span className="text-sm text-yellow-200">{alert}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
