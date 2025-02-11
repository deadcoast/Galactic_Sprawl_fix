import { Database, Truck, AlertTriangle, Zap } from 'lucide-react';

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
  onSetTarget
}: VoidDredgerProps) {
  return (
    <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-6" data-dredger-id={id}>
      {/* Ship Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-white">{name}</h3>
          <div className="text-sm text-gray-400">Mining Vessel</div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm ${
          status === 'mining' ? 'bg-green-900/50 text-green-400' :
          status === 'returning' ? 'bg-blue-900/50 text-blue-400' :
          status === 'maintenance' ? 'bg-yellow-900/50 text-yellow-400' :
          'bg-gray-700 text-gray-400'
        }`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>

      {/* Mining Status */}
      {targetNode && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Current Target</span>
            <span className="text-sm text-amber-400">{targetNode.name}</span>
          </div>
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
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
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Cargo Hold</span>
          <span className="text-gray-300">
            {cargo.current} / {cargo.capacity}
          </span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-amber-500 rounded-full transition-all"
            style={{ width: `${(cargo.current / cargo.capacity) * 100}%` }}
          />
        </div>
        <div className="space-y-2">
          {cargo.resources.map(resource => (
            <div
              key={resource.type}
              className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg"
            >
              <span className="text-sm text-gray-300">{resource.type}</span>
              <span className="text-sm text-amber-400">{resource.amount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Efficiency Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Database className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Efficiency</span>
          </div>
          <div className="text-lg font-medium text-amber-400">
            {Math.round(efficiency * 100)}%
          </div>
        </div>
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Rate</span>
          </div>
          <div className="text-lg font-medium text-amber-400">
            {extractionRate}/s
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onRecall()}
          disabled={status === 'maintenance'}
          className={`px-4 py-2 rounded-lg text-sm flex items-center justify-center space-x-2 ${
            status === 'maintenance'
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Recall Ship</span>
        </button>
        <button
          onClick={() => onSetTarget(targetNode?.id || '')}
          disabled={status === 'maintenance'}
          className={`px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm flex items-center justify-center space-x-2 ${
            status === 'maintenance' ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Set Target</span>
        </button>
      </div>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="mt-4 space-y-2">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className="flex items-start space-x-2 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg"
            >
              <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-yellow-200">{alert}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}